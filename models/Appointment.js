const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },

    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Trainer'
    }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);