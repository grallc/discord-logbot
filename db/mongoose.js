const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_ADDON_URI || 'mongodb://localhost:27017/LogBot', {useNewUrlParser: true});

module.exports = {mongoose};