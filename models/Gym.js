const mongoose = require('mongoose');

const GymSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    trainers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Trainer'
    }]
});

module.exports = mongoose.model('Gym', GymSchema);