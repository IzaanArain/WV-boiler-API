const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        require: true
    },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        require: true
    },
    group_id: {
        type: String,
        require: false
    }, 
    message: {
        type: String,
        require: false,
        default:null
    },
    file: {
        type: Array, 
        require: false,
        default:[]
    },
    is_read: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
    is_blocked: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
}, { timestamps: true });

mongoose.model('Chat',chatSchema);