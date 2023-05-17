const mongoose = require('mongoose');
const bcrypt = require('mongoose-bcrypt');
const { Schema } = mongoose;

// decidere se separare le foto
const create_eventSchema = new Schema({
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
});

create_eventSchema.plugin(bcrypt);

module.exports = mongoose.model('Manager', create_eventSchema);
