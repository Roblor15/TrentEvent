const mongoose = require('mongoose');

const { Schema } = mongoose;

const privateeventSchema = new Schema({
    initDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
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
    price: {
        type: Number,
        default: 0,
        min: 0,
    },
    photos: [
        {
            data: Buffer,
            contentType: String,
        },
    ],
    description: {
        type: String,
        maxLength: 100,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'Participant',
    },
    participantsList: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'Participant',
            },
            state: {
                type: String,
                required: true,
                enum: ['Pending', 'Accepted', 'Denied'],
            },
            _id: false,
        },
    ],
});

privateeventSchema.pre('validate', function (next) {
    if (this.date > new Date()) {
        next();
    }
    next(new Error('The date is old'));
});

module.exports = mongoose.model('PrivateEvent', privateeventSchema);
