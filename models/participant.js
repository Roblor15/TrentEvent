const mongoose = require('mongoose');
const bcrypt = require('mongoose-bcrypt');
const { Schema } = mongoose;

const partecipantSchema = new Schema({
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

    password: {
        type: String,
        required: [true, 'Password not provided'],
        bcrypt: true,
    },
});

managerSchema.plugin(bcrypt);

module.exports = mongoose.model('Partecipant', partecipantSchema);
