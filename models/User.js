const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['user', 'owner']
    }
});

UserSchema.methods.generateJwt = function () {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign({
        _id: this._id,
        username: this.username,
        role: this.role,
        exp: parseInt(expiry.getTime() / 1000),
    }, process.env.JWT_SECRET);
};

module.exports = mongoose.model('User', UserSchema);