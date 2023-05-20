const mongoose = require('mongoose');
const bcrypt = require('mongoose-bcrypt');
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
    },
    email: {
        type: String,
        required: [true, 'Email not provided'],
        index: true,
        unique: true,
        validate: {
            validator: (v) => /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/.test(v),
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    veifiedEmail: {
        type: Boolean,
        require: true,
    },
    password: {
        type: String,
        bcrypt: true,
        //da aggiungere limitazioni della password
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
