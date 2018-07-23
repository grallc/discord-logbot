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

	// DEPRECATED
    // informations: {
    //     status: {type: String, default: 'OK'},
    //     currentContent: String,
    //     lastEventDate: String
    // }
}, {
  strict: false
});

module.exports = mongoose.model('Message', messageSchema);
