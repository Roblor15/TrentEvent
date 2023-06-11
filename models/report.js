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
        required: true,
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Participant',
        required: true,
    }
});
module.exports = mongoose.model('Report', reportSchema);
