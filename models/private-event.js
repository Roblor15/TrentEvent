const mongoose = require('mongoose');
const bcrypt = require('mongoose-bcrypt');
const { Schema } = mongoose;

const privateeventSchema = new Schema({
    date: {
        type: Date,
        required: true,
        min: Date(),
    },
    address: {
        type: {
            country: { type: String, required: [true] },
            city: { type: String, required: [true] },
            street: { type: String, required: [true] },
            number: { type: Number, required: [true] },
            cap: { type: String, required: [true] },
        },
        required: true,
        _id: false,
    },
    event_cost: {
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
    event_creator: {
        type: Schema.Types.ObjectId,
        //ref: 'Participant'
    },
    participants_list: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Participant',
        },
    ],
});

privateeventSchema.plugin(bcrypt);

module.exports = mongoose.model('Participant', privateeventSchema);
