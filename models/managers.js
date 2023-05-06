const mongoose = require('mongoose');
const bcrypt = require('mongoose-bcrypt');
const { Schema } = mongoose;

const managerSchema = new Schema({
    localName: {
        type: String,
        required: [true, "No local's name found"],
    },
    email: {
        type: String,
        required: [true],
        validate: {
            validator: (v) => /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/.test(v),
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    address: {
        country: { type: String, required: [true] },
        city: { type: String, required: [true] },
        street: { type: String, required: [true] },
        number: { type: Number, required: [true] },
        cap: { type: String, required: [true] },
    },
    localType: { type: String, enum: ['Bar', 'Discoteca'], required: [true] },
    photos: [
        {
            data: Buffer,
            contentType: String,
        },
    ],
    active: { type: Boolean, default: false },
    approvation: {
        type: {
            approved: Boolean,
            when: Date,
            // in futuro
            // from: { type: Schema.Types.ObjectId, ref: 'Supervisor' },
            from: { type: Schema.Types.ObjectId },
        },
    },
});

managerSchema.plugin(bcrypt);

module.exports = mongoose.model('Manager', managerSchema);
