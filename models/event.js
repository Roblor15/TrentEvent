const mongoose = require('mongoose');
const bcrypt = require('mongoose-bcrypt');
const { Schema } = mongoose;

// decidere se separare le foto
const eventSchema = new Schema({
    eventid: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        min: Date(),
    },
    age_limit: {
        type: Number,
        min: 0,
    },
    event_cost: {
        type: Number,
        required: true,
        min: 0,
    },
    person_limit: {
        type: Number,
        required: true,
        min: 0,
    },
    photos: [
        {
            data: Buffer,
            contentType: String,
        },
    ],
    event_description: {
        type: String,
        maxLength: 100,
    },
    categories: {
        type: String,
        enum: ['musica', 'discoteca', `all'aperto`, 'al chiuso'],
        required: true,
    },
    event_manager: {
        type: Schema.Types.ObjectId,
        ref: 'Manager',
    },
    participants_list: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Participant',
        },
    ],
});

module.exports = mongoose.model('Manager', eventSchema);
