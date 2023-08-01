const passport = require('passport');
const express = require('express');
const router = express.Router();
const Gym = require('../models/Gym');

// provjera je li vlasnik korisnik
function isOwner(req, res, next) {
    if (req.user.role === 'owner') {
        return next();
    }
    res.status(403).json({ message: 'Permission denied' });
}

// dohvaæanje svih teretana
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const gyms = await Gym.find();
        res.json(gyms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// dodavanje nove teretane
router.post('/', (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: 'Please log in first' });
        }
        if (user.role !== 'owner') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        req.logIn(user, { session: false }, async (err) => {
            if (err) {
                return next(err);
            }
            console.log('User ID:', user._id);

            const gym = new Gym({
                name: req.body.name,
                location: req.body.location,
                owner: user._id
            });

            try {
                const newGym = await gym.save();
                res.status(201).json(newGym);
            } catch (err) {
                res.status(400).json({ message: err.message });
            }
        });
    })(req, res, next);
});

// ažuriranje teretane
router.put('/:id', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    let gym;
    try {
        gym = await Gym.findById(req.params.id);
        if (!gym) {
            return res.status(404).json({ message: 'Cannot find gym' });
        }
        if (gym.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to update this gym' });
        }
        if (req.body.name != null) {
            gym.name = req.body.name;
        }
        if (req.body.location != null) {
            gym.location = req.body.location;
        }
        await gym.save();
        res.json(gym);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// brisanje teretane
router.delete('/:id', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    try {
        const gym = await Gym.findById(req.params.id);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        if (!req.user || !req.user._id) {
            return res.status(403).json({ message: 'Invalid user' });
        }

        if (gym.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to delete this gym' });
        }

        await gym.deleteOne();
        res.json({ message: 'Gym deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

module.exports = router;