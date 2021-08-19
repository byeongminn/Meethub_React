const mongoose = require("mongoose");

const roomSchema = mongoose.Schema({
    roomName: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
    },
    role: {
        type: Number,
        default: 0
    },
})

roomSchema.pre("save", function (next) {
    let room = this;
    Room.findOne({ roomName: room.roomName }, (err, roomInfo) => {
        if (err) return next(err);
        if (!roomInfo) {
            room.role = 1;
            next();
        } else {
            return;
        }
    })
})

const Room = mongoose.model("Room", roomSchema);

module.exports = { Room };