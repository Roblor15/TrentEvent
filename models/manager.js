const mongoose = require('mongoose');
const bcrypt = require('mongoose-bcrypt');
const { isEmail } = require('../lib/general');

const { Schema } = mongoose;

// decidere se separare le foto
const managerSchema = new Schema({
    localName: {
        type: String,
        required: [true, "Local's name not provided"],
    },
    email: {
        type: String,
        required: [true, 'Email not provided'],
        index: true,
        unique: true,
        validate: {
            validator: isEmail,
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    verifiedEmail: {
        type: Boolean,
        require: true,
    },
    password: {
        type: String,
        bcrypt: true,
        minLength: 5,
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
    localType: { type: String, enum: ['Bar', 'Discoteca'], required: [true] },
    photos: [
        {
            data: Buffer,
            contentType: String,
        },
    ],
    approvation: {
        type: {
            approved: { type: Boolean, default: false },
            when: Date,
            // TODO: from: { type: Schema.Types.ObjectId, ref: 'Supervisor' },
            from: { type: Schema.Types.ObjectId },
            _id: false,
        },
    },
});

managerSchema.plugin(bcrypt);

module.exports = mongoose.model('Manager', managerSchema);