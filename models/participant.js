const mongoose = require('mongoose');
const bcrypt = require('mongoose-bcrypt');
const { isEmail } = require('../lib/general');
const { Schema } = mongoose;

const participantSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name not provided'],
    },
    surname: {
        type: String,
        required: [true, 'Surname not provided'],
    },
    username: {
        type: String,
        required: [true, 'Username not provided'],
        validate: {
            validator: (v) => !isEmail(v),
            message: (props) => `${props.value} is not a valid username`,
        },
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
    idExteralApi: {
        type: String,
    },
    birthDate: {
        type: Date,
        required: [true, 'Date of birth not provided'],
    },
});

participantSchema.pre('validate', function (next) {
    if (!(this.password || this.idExteralApi)) {
        next(new Error('Password not provided'));
    } else {
        next();
    }
});

participantSchema.plugin(bcrypt);

module.exports = mongoose.model('Participant', participantSchema);
