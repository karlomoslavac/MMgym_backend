const passport = require('passport');
const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const Gym = require('../models/Gym');

function isOwner(req, res, next) {
    if (req.user.role === 'owner') {
        return next();
    }
    res.status(403).json({ message: 'Permission denied' });
}

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

router.post('/', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    try {
        const { name, gym } = req.body;

        const gymData = await Gym.findById(gym);
        if (!gymData) {
            return res.status(404).send({ message: 'Gym not found' });
        }

        if (!req.user || req.user.role !== 'owner' || !gymData.owner || req.user._id.toString() !== gymData.owner.toString()) {
            return res.status(403).send({ message: 'You are not authorized to add trainers to this gym' });
        }

        const trainer = new Trainer({ name, gym: gymData._id });

        await trainer.save();

        if (!gymData.trainers) {
            gymData.trainers = [];
        }
        gymData.trainers.push(trainer._id);
        await gymData.save();

        res.status(201).send(trainer);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send({ message: 'An error occurred. Please try again.' });
    }
});

router.put('/:id', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    let trainer;
    try {
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

router.delete('/:id', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    try {
        const trainer = await Trainer.findById(req.params.id);
        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        const gym = await Gym.findById(trainer.gym);

        if (req.user.role !== 'owner' || req.user._id.toString() !== gym.owner.toString()) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        await Trainer.findByIdAndDelete(req.params.id);
        gym.trainers.pull(req.params.id);
        await gym.save();

        res.status(200).json({ message: 'Trainer successfully deleted' });
    } catch (error) {
        console.error('An error occurred while deleting the trainer:', error);
        res.status(500).json({ message: 'An error occurred while deleting the trainer' });
    }
});

module.exports = router;
