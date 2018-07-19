const mongoose = require('mongoose');

const messageSchema =  mongoose.Schema({
    _id: String,
    originalContent: String,
    authorID: String,
    authorUsername: String,
    creationDate: Date,
    informations: {
        status: String,
        currentContent: String,
        lastEventDate: String
    }
});

module.exports = mongoose.model('Message', messageSchema);