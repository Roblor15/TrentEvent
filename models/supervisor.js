const mongoose = require('mongoose');
const bcrypt = require('mongoose-bcrypt');
const { isEmail } = require('../lib/general');

const { Schema } = mongoose;

const supervisorSchema = new Schema({
   
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
    password: {
        type: String,
        bcrypt: true,
        minLength: 5,
    },
});

supervisorSchema.plugin(bcrypt);

module.exports = mongoose.model('Supervisor', supervisorSchema);
