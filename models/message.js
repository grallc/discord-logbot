const mongoose = require('mongoose');

const messageSchema =  mongoose.Schema({
    originalContent: String,
    messageID: String,
    guildID: String,
    authorID: String,
    authorUsername: String,
    creationDate: {
      type: String,
      default: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    },
    informations: {
        status: {type: String, default: 'OK'},
        currentContent: String,
        lastEventDate: {
          type: String,
          default: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        },
    }
});

module.exports = mongoose.model('Message', messageSchema);
