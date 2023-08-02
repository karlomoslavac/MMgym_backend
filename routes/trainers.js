const passport = require('passport');
const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const Gym = require('../models/Gym');

// provjera da li je korisnik vlasnik
function isOwner(req, res, next) {
    console.log('Checking if user is an owner...');
    console.log('User:', req.user);
    if (req.user.role === 'owner') {
        return next();
    }
    console.log('User is not an owner');
    res.status(403).json({ message: 'Permission denied' });
}

// dohvacanje svih trenera
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const trainers = await Trainer.find();
        res.json(trainers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id/trainers', async (req, res) => {
    try {
        const gym = await Gym.findById(req.params.id).populate('trainers');
        res.json(gym.trainers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// dodavanje novog trenera
router.post('/', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    console.log(req.body);
    console.log('Received a POST request to /trainers');
    console.log('Request body:', req.body);
    try {
        const { name, gym } = req.body;
        console.log(`Attempting to add a new trainer with name ${name} to gym with ID ${gym}`);
        const gymData = await Gym.findById(gym);
        if (!gymData) {
            console.log('Gym not found');
            return res.status(404).send({ message: 'Gym not found' });
        }
        console.log('User ID:', req.user._id);
        console.log('Gym owner ID:', gymData.owner);
        if (!req.user || req.user.role !== 'owner' || !gymData.owner || req.user._id.toString() !== gymData.owner.toString()) {
            console.log('User is not authorized to add trainers to this gym');
            return res.status(403).send({ message: 'You are not authorized to add trainers to this gym' });
        }
        const trainer = new Trainer({ name, gym: gymData._id });
        console.log('Saving new trainer...');
        await trainer.save();
        console.log('Adding trainer to gym...');
        if (!gymData.trainers) {
            gymData.trainers = []; // Initialize trainers as an empty array
        }
        gymData.trainers.push(trainer._id);
        await gymData.save();
        console.log('Trainer added successfully');
        res.status(201).send(trainer);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send({ message: 'An error occurred. Please try again.' });
    }
});

// azuriranje trenera
router.put('/:id', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    let trainer;
    try {
        trainer = await Trainer.findById(req.params.id).populate('gym');
        trainer = await Trainer.findById(req.params.id).populate('gym');
        if (!trainer) {
            return res.status(404).json({ message: 'Cannot find trainer' });
        }
        if (trainer.gym.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to update this trainer' });
        }
        if (req.body.name != null) {
            trainer.name = req.body.name;
        }
        await trainer.save();
        res.json(trainer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// brisanje trenera
router.delete('/:id', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    console.log('Received a DELETE request for trainer with ID:', req.params.id);
    console.log('User:', req.user);
    try {
        const trainer = await Trainer.findById(req.params.id);
        console.log('Found trainer:', trainer);
        if (!trainer) {
            console.log('Trainer not found');
            return res.status(404).json({ message: 'Trainer not found' });
        }
        console.log('Checking if user is owner of the gym...');
        console.log('Trainer gym:', trainer.gym);
        const gym = await Gym.findById(trainer.gym);
        console.log('Gym:', gym);
        console.log('Gym owner:', gym.owner);
        if (req.user.role !== 'owner' || req.user._id.toString() !== gym.owner.toString()) {
            console.log('User is not owner of the gym');
            return res.status(403).json({ message: 'Permission denied' });
        }
        console.log('Deleting trainer...');
        await Trainer.findByIdAndDelete(req.params.id);
        console.log('Trainer deleted');

        console.log('Updating gym...');
        gym.trainers.pull(req.params.id);
        await gym.save();
        console.log('Gym updated');

        res.status(200).json({ message: 'Trainer successfully deleted' });
    } catch (error) {
        console.error('An error occurred while deleting the trainer:', error);
        res.status(500).json({ message: 'An error occurred while deleting the trainer' });
    }
});

module.exports = router;