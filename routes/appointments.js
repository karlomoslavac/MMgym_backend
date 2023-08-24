const passport = require('passport');
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Trainer = require('../models/Trainer');
const User = require('../models/User');

function isOwner(req, res, next) {
    if (req.user.role === 'owner') {
        return next();
    }
    res.status(403).json({ message: 'Permission denied' });
}

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const appointments = await Appointment.find();
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/trainers/:id/appointments', async (req, res) => {
    try {
        const trainerId = req.params.id;
        const appointments = await Appointment.find({ trainer: trainerId });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    try {
        const trainer = await Trainer.findById(req.body.trainer);

        if (!trainer) {
            return res.status(400).json({ message: 'Trainer not found' });
        }

        const date = new Date(req.body.date);
        if (isNaN(date.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        const appointment = new Appointment({
            date: date,
            trainer: trainer._id
        });

        const newAppointment = await appointment.save();
        res.status(201).json(newAppointment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/user-appointments', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { userId, trainerId, gymId, appointmentId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.appointments.push({
            trainer: trainerId,
            gym: gymId,
            appointment: appointmentId
        });

        await user.save();

        res.status(201).json({ message: 'Appointment saved successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    try {
        await Appointment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted Appointment' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
