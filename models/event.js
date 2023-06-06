const mongoose = require('mongoose');

const { Schema } = mongoose;

// TODO: decidere se separare le foto
const eventSchema = new Schema({
    initDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    name: String,
    ageLimit: {
        type: Number,
        default: 0,
        min: 0,
    },
    price: {
        type: Number,
        default: 0,
        min: 0,
    },
    limitPeople: {
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
        maxLength: 300,
    },
    categories: {
        type: [String],
        enum: ['musica', 'discoteca', `all'aperto`, 'al chiuso', 'concerto'],
        required: true,
    },
    manager: {
        type: Schema.Types.ObjectId,
        require: true,
        ref: 'Manager',
    },
    participantsList: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Participant',
        },
    ],
});

eventSchema.pre('validate', function (next) {
    if (this.initDate > new Date()) {
        next();
    }
    next(new Error('The date is old'));
});

eventSchema.pre('validate', function (next) {
    if (this.endDate > this.initDate) {
        next();
    }
    next(new Error("You can't end an event before it started"));
});

module.exports = mongoose.model('Event', eventSchema);
