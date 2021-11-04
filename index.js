const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const config = require("./server/config/key");
const SocketIO = require("socket.io");
const http = require("http");
const cors = require("cors");

const { User } = require("./server/models/User");
const { auth } = require("./server/middleware/auth");
const { Room } = require("./server/models/Room");
const { Vote } = require("./server/models/Vote");

app.use(express.json());
app.use(cookieParser());

mongoose
  .connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

app.get("/", function (req, res) {
  res.send("Hello World!");
});

app.post("/api/users/register", (req, res) => {
  const user = new User(req.body);

  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});

app.post("/api/users/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "등록되지 않은 이메일입니다.",
      });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀렸습니다.",
        });
      }

      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        res
          .cookie("x_auth", user.token)
          .status(200)
          .json({ loginSuccess: true, userId: user._id });
      });
    });
  });
});

app.get("/api/users/auth", auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    image: req.user.image,
  });
});

app.get("/api/users/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({ success: true });
  });
});

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
  },
});

let users = {};
let socketToRoom = {};
const maximum = process.env.MAXIMUM || 4;

wsServer.on("connection", (socket) => {
  socket.on("join_room", (data) => {
    if (users[data.room]) {
      const length = users[data.room].length;
      if (length === maximum) {
        socket.to(socket.id).emit("room_full");
        return;
      }
      users[data.room].push({ id: socket.id, user: data.user });
    } else {
      users[data.room] = [{ id: socket.id, user: data.user }];
    }
    socketToRoom[socket.id] = data.room;

    socket.join(data.room);
    // console.log(`[${socketToRoom[socket.id]}]: ${socket.id} enter`);
    // console.log(`${data.email}`);

    wsServer.to(data.roomName).emit("welcome", data.user.name);

    const usersInThisRoom = users[data.room].filter(
      (user) => user.id !== socket.id
    ); //자신을 제외한 유저의 목록.

    console.log(usersInThisRoom);

    wsServer.sockets.to(socket.id).emit("all_users", usersInThisRoom);
  });

  socket.on('participants', (roomName) => {
    wsServer.to(roomName).emit('participants', users[roomName]);
  })

  socket.on("send_message", (roomName, chat) => {
    wsServer.to(roomName).emit("receive_message", chat);
  })

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

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((user) => user.id !== socket.id);
      users[roomID] = room;
      if (room.length === 0) {
        delete users[roomID];
        return;
      }
    }
    socket.to(roomID).emit("user_exit", { id: socket.id });
    socket.to(roomID).emit('participants', users[roomID]);
  });
});

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
            success: true, exist: false, roomId: room._id
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

httpServer.listen(5000, function () {
  console.log("http://localhost:5000");
});
