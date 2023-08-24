const passport = require('passport');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

function isOwner(req, res, next) {
    if (req.user.role === 'owner') {
        return next();
    }
    res.status(403).json({ message: 'Permission denied' });
}

router.get('/', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    try {
        const users = await User.find()
            .populate('selectedGym', 'name')
            .populate('selectedTrainer', 'name')
            .populate('selectedAppointment', 'time');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
        username: req.body.username,
        password: hashedPassword,
        role: req.body.role
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(400).json({ message: err.message });
    }
});

router.post('/:id/selected', async (req, res) => {
    try {
        const userId = req.params.id;
        const { selectedGym, selectedTrainer, selectedAppointment } = req.body;

        await User.findByIdAndUpdate(userId, {
            selectedGym: selectedGym,
            selectedTrainer: selectedTrainer,
            selectedAppointment: selectedAppointment
        });

        res.status(200).json({ message: 'Selections saved successfully' });
    } catch (error) {
        console.error('Error saving selections:', error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

router.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user == null) {
        return res.status(400).send('Cannot find user');
    }

    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            req.login(user, { session: false }, (err) => {
                if (err) {
                    res.send(err);
                }
                const token = user.generateJwt();
                return res.json({ user, token });
            });
        } else {
            res.send('Not Allowed');
        }
    } catch (error) {
        res.status(500).send();
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logged out' });
});

module.exports = router;
