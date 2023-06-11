const mongoose = require('mongoose');

const { Schema } = mongoose;

const photoSchema = new Schema({
    data: Buffer,
    contentType: String,
});

module.exports = mongoose.model('Photo', photoSchema);
