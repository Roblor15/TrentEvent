const mongoose = require('mongoose');

const { Schema } = mongoose;

const reportSchema = new Schema({
    report: {
        type: String,
        maxLength: 300,
        required: true,
    },
    participant: {
        type: Schema.Types.ObjectId,
        ref: 'Participant',
    },
});
module.exports = mongoose.model('Report', reportSchema);
