const mongoose = require("mongoose");
const Schema = mongoose;

const questionSchema = mongoose.Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    questioner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String
    },
    content: {
        type: String
    },
    answered: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Question = mongoose.model("Question", questionSchema);

module.exports = { Question };