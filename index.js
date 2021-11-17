const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const config = require("./server/config/key");
const SocketIO = require("socket.io");
const http = require("http");
const cors = require("cors");

const { User } = require("./server/models/User");
const { auth } = require('./server/middleware/auth');
const { Room } = require("./server/models/Room");
const { Vote } = require("./server/models/Vote");
const { Question } = require("./server/models/Question");
const { Answer } = require("./server/models/Answer");
const { measureMemory } = require('vm');

app.use(express.json());
app.use(cookieParser());

mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}).then(() => console.log("MongoDB Connected..."))
  .catch(err => console.log(err));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post("/api/users/register", (req, res) => {
  const user = new User(req.body);

  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true
    })
  })
})

app.post("/api/users/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "등록되지 않은 이메일입니다."
      })
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다." });
      }

      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        res.cookie("x_auth", user.token)
          .status(200)
          .json({ loginSuccess: true, userId: user._id });
      })
    })
  })
})

app.get("/api/users/auth", auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    image: req.user.image
  })
})

app.get("/api/users/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({ success: true });
  })
})

app.post('/api/users/getUserFromEmail', (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({ success: true, user });
  })
})

// ===================================================
//                      WebRTC
// ===================================================

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer, {
  cors: {
    origin: "*",
  }
});

const maximum = 6;
let users = {};
let socketToRoom = {};

wsServer.on("connection", (socket) => {
  socket.on("join_room", (data) => {
    if (users[data.roomName]) {
      const length = users[data.roomName].length;
      if (length === maximum) {
        socket.to(socket.id).emit('room_full');
        return;
      }
      users[data.roomName].push({ user: data.user, socketId: socket.id });
    } else {
      users[data.roomName] = [{ user: data.user, socketId: socket.id }];
    }
    socketToRoom[socket.id] = data.roomName;
/*     console.log(users[data.roomName]);
    console.log(socketToRoom); */
    socket.join(data.roomName);
    wsServer.to(data.roomName).emit("welcome", data.user.name);
    const usersInThisRoom = users[data.roomName].filter(
      (user) => user.socketId !== socket.id
    ); //자신을 제외한 유저의 목록.

    wsServer.sockets.to(socket.id).emit("all_users", usersInThisRoom);
  });
  socket.on("offer", (data) => {
    //console.log(data.sdp);
    socket.to(data.offerReceiveID).emit("getOffer", {
      sdp: data.sdp,
      offerSendID: data.offerSendID,
      offerSendEmail: data.offerSendEmail,
    });
  });

  socket.on("answer", (data) => {
    //console.log(data.sdp);
    socket
      .to(data.answerReceiveID)
      .emit("getAnswer", { sdp: data.sdp, answerSendID: data.answerSendID });
  });

  socket.on("candidate", (data) => {
    //console.log(data.candidate);
    socket.to(data.candidateReceiveID).emit("getCandidate", {
      candidate: data.candidate,
      candidateSendID: data.candidateSendID,
    });
  });
  socket.on('participants', (roomName) => {
    wsServer.to(roomName).emit('participants', users[roomName]);
  })
  socket.on("send_message", (roomName, chat) => {
    wsServer.to(roomName).emit("receive_message", chat);
  })
  socket.on("warning", (roomName) => {
    socket.broadcast.emit("warning_message",users[roomName]);
  })
  socket.on('disconnect', () => {
    const roomName = socketToRoom[socket.id];
    let room = users[roomName];
    if (room) {
      room = room.filter(user => user.socketId !== socket.id);
      users[roomName] = room;
      if (room.length === 0) {
        delete users[roomName];
        return;
      }
    }
    socket.to(roomName).emit("user_exit", { id: socket.id });
    socket.to(roomName).emit('participants', users[roomName]);
  })
})

// ===================================================
//                      ROOM
// ===================================================

app.post("/api/rooms/make", (req, res) => {
  Room.findOne({ roomName: req.body.roomName })
    .exec((err, roomInfo) => {
      if (roomInfo) return res.json({ success: false, exist: true, message: '이미 존재하는 방입니다.' });
      else {
        const room = new Room(req.body);
      
        room.save((err, room) => {
          if (err) return res.json({ success: false, exist: false, err });
          return res.status(200).json({
            success: true, exist: false, room, roomId: room._id
          })
        })
      }
    })
})

app.get('/api/rooms/getRooms', (req, res) => {
  Room.find()
    .populate('creator')
    .exec((err, rooms) => {
      if (err) return res.json({ success: false, err });
      res.json({ success: true, rooms });
    })
})

app.post('/api/rooms/getRoom', (req, res) => {
  Room.findOne({ _id: req.body.roomId })
    .populate('creator')
    .exec((err, room) => {
      if (err) return res.json({ success: false, err });
      res.json({ success: true, room });
    })
})

app.post('/api/rooms/attBookUpdate', (req, res) => {
  Room.findOneAndUpdate({ _id: req.body.roomId }, { attendanceBook: req.body.attendanceBook }, (err, room) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({ success: true, room });
  })
})

// ===================================================
//                      VOTE
// ===================================================

app.post('/api/votes/register', (req, res) => {
  const vote = new Vote(req.body);

  vote.save((err, voteInfo) => {
    if (err) return res.json({ success: false, err });
    return res.json({ success: true })
  })
})

app.post('/api/votes/getVotes', (req, res) => {
  Vote.find({ room: req.body.roomId })
    .populate('room')
    .populate('creator')
    .exec((err, votes) => {
      if (err) return res.json({ success: false, err });
      res.json({ success: true, votes });
    })
})

app.post('/api/votes/voteClosing', (req, res) => {
  Vote.findOneAndUpdate({ _id: req.body.voteId }, { available: false }, (err, vote) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({ success: true, vote });
  })
})

app.post('/api/votes/voteDelete', (req, res) => {
  Vote.findOneAndDelete({ _id: req.body.voteId })
    .exec((err, vote) => {
      if (err) return res.json({ success: false, err });
      return res.json({ success: true });
    })
})

app.post('/api/votes/voteUpdate', (req, res) => {
  Vote.findOneAndUpdate({ _id: req.body.voteId }, { options: req.body.options, voted: req.body.voted }, (err, vote) => {
    if (err) return res.json({ success: false, err });
    return res.json({ success: true });
  })
})

// ===================================================
//                      QUESTION
// ===================================================

app.post('/api/questions/register', (req, res) => {
  const question = new Question(req.body);

  question.save((err, questionInfo) => {
    if (err) return res.json({ success: false, err });
    return res.json({ success: true })
  })
})

app.post('/api/questions/getQuestions', (req, res) => {
  Question.find({ room: req.body.roomId })
    .populate('room')
    .populate('questioner')
    .exec((err, questions) => {
      if (err) return res.json({ success: false, err });
      res.json({ success: true, questions });
    })
})

app.post('/api/questions/questionDelete', (req, res) => {
  Question.findOneAndDelete({ _id: req.body.questionId })
    .exec((err, question) => {
      if (err) return res.json({ success: false, err });
      return res.json({ success: true });
    })
})

app.post('/api/questions/answered', (req, res) => {
  Question.findOneAndUpdate({ _id: req.body.question }, { answered: true }, (err, question) => {
    if (err) return res.json({ success: false, err });
    return res.json({ success: true });
  })
})

// ===================================================
//                      ANSWER
// ===================================================

app.post('/api/answers/register', (req, res) => {
  const answer = new Answer(req.body);

  answer.save((err, answerInfo) => {
    if (err) return res.json({ success: false, err });
    return res.json({ success: true })
  })
})

app.post('/api/answers/getAnswers', (req, res) => {
  Answer.find({ question: req.body.questionId })
    .populate('question')
    .populate('answerer')
    .exec((err, answers) => {
      if (err) return res.json({ success: false, err });
      res.json({ success: true, answers });
    })
})

app.post('/api/answers/answerDelete', (req, res) => {
  Answer.findOneAndDelete({ _id: req.body.answerId })
    .exec((err, answer) => {
      if (err) return res.json({ success: false, err });
      return res.json({ success: true });
    })
})

app.post('/api/answers/answersDelete', (req, res) => {
  Answer.deleteMany({ question: req.body.questionId })
    .exec((err, answers) => {
      if (err) return res.json({ success: false, err });
      return res.json({ success: true });
    })
})

httpServer.listen(5000, function () {
  console.log('http://localhost:5000');
});
