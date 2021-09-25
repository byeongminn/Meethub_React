const mongoose = require("mongoose");
const Schema = mongoose;

const roomSchema = mongoose.Schema({
    roomName: {
        type: String,
        unique: 1,
        maxlength: 50
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
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