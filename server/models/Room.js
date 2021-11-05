const mongoose = require("mongoose");
const Schema = mongoose;

const roomSchema = mongoose.Schema({
    roomName: {
        type: String,
        unique: 1,
        maxlength: 20,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    roomPassword: {
        type: String,
    },
    roomDescription: {
        type: String,
        maxlength: 50,
    },
    attendanceBook: {
        type: Array
    }
})

const Room = mongoose.model("Room", roomSchema);

module.exports = { Room };