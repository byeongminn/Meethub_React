const mongoose = require("mongoose");
const Schema = mongoose;

const voteSchema = mongoose.Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    content: {
        type: String
    },
    options: {
        type: Array
    },
    available: {
        type: Boolean,
        default: true
    },
    voted: {
        type: Array
    }
}, { timestamps: true })

const Vote = mongoose.model("Vote", voteSchema);

module.exports = { Vote };