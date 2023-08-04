const passport = require('passport');
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Trainer = require('../models/Trainer');

// provjera je li korisnik vlasnik
function isOwner(req, res, next) {
    if (req.user.role === 'owner') {
        return next();
    }
    res.status(403).json({ message: 'Permission denied' });
}

// dohvati sve treninge
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const appointments = await Appointment.find();
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//dohvati sve treninge
router.get('/trainers/appointments', async (req, res) => {
    try {
        const trainer = await Trainer.findById(req.params.id).populate('appointments');
        res.json(trainer.appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// dodaj novi trening
router.post('/', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    try {
        console.log(req.body); 

        // trener po idu
        const trainer = await Trainer.findById(req.body.trainer);
        console.log(trainer); 

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

        console.log(appointment, "created successfully");

        const newAppointment = await appointment.save();
        console.log(newAppointment); 

        res.status(201).json(newAppointment);
    } catch (err) {
        console.error(err); 
        res.status(400).json({ message: err.message });
    }
});

// obriši trening
router.delete('/:id', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    try {
        await Appointment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted Appointment' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;