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

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer, {
  cors: {
    origin: "*",
  }
});

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName, userName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome", userName);
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  })
socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  })
socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  })
})

app.post("/api/rooms/make", (req, res) => {
  const room = new Room(req.body);

  room.save((err, room) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    })
  })
})

httpServer.listen(5000, function () {
  console.log('http://localhost:5000');
});