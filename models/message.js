const mongoose = require('mongoose');

const messageSchema =  mongoose.Schema({
    originalContent: String,
    currentContent: String,
    messageID: String,
    guildID: String,
    guildName: String,
    authorID: String,
    authorUsername: String,
    channelID: String,
    channelName: String,
    creationDate: String,
    modifications: {
        creation: {
            date: String
        }
    }
    
}, {
  strict: false
});

module.exports = mongoose.model('Message', messageSchema);
