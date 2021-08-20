const mongoose = require("mongoose");

const chatSchema = mongoose.Schema({
    roomName: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
    },
    content: {
        type: String,
        maxlength: 100
    }
})

const Chat = mongoose.model("Chat", chatSchema);

module.exports = { Chat };