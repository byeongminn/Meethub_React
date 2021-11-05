const mongoose = require("mongoose");
const Schema = mongoose;

const answerSchema = mongoose.Schema({
    question: {
        type: Schema.Types.ObjectId,
        ref: 'Question'
    },
    answerer: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String
    },
    content: {
        type: String
    }
}, { timestamps: true })

const Answer = mongoose.model("Answer", answerSchema);

module.exports = { Answer };