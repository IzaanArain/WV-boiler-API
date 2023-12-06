const mongoose = require('mongoose')
const Chat = mongoose.model('Chat');
const { v4: uuidv4 } = require('uuid');

const get_messages = async (object, callback) => {
    try {
        const message = await Chat.find({
            $or: [
                { $and: [{ sender_id: object.sender_id }, { receiver_id: object.receiver_id }] },
                { $and: [{ sender_id: object.receiver_id }, { receiver_id: object.sender_id }] },
            ]
        }).populate("sender_id", "basics.name imageName").populate("receiver_id", "basics.name imageName").sort({ createdAt: -1 })
        callback(message)
    } catch (error) {
        callback(error)
    }
}

const send_message = async (object, callback) => {
    try {
        const findchat = await Chat.findOne({ $or: [{ $and: [{ sender_id: object.sender_id }, { receiver_id: object.receiver_id }] }, { $and: [{ sender_id: object.receiver_id }, { receiver_id: object.sender_id }] }] })
        if (findchat) {
            var documents_chat = new Chat({ sender_id: object.sender_id, file: object?.file, receiver_id: object.receiver_id, group_id: findchat.group_id, message: object.message });
        } else {
            var documents_chat = new Chat({ sender_id: object.sender_id, file: object?.file, receiver_id: object.receiver_id, group_id: uuidv4(), message: object.message });
        }
        await documents_chat.save();
        await documents_chat.populate("sender_id", "basics.name imageName");
        await documents_chat.populate("receiver_id", "basics.name imageName");
        callback(documents_chat);
    } catch (error) {
        callback(err);
    }
}


module.exports = {
    get_messages,
    send_message,
}