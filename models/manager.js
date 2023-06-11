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
    localType: {
        type: String,
        enum: ['bar', 'discoteca', 'pub'],
        required: [true],
    },
    photos: {
        type: [Schema.Types.ObjectId],
        ref: 'Manager.photos',
    },
    approvation: {
        type: {
            approved: { type: Boolean, default: false },
            when: Date,
            type: Schema.Types.ObjectId,
            ref: 'Supervisor' ,
            _id: false,
        },
    },
});

managerSchema.plugin(bcrypt);

module.exports = mongoose.model('Manager', managerSchema);
