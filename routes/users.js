const passport = require('passport');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// provjera da li je korisnik vlasnik
function isOwner(req, res, next) {
    if (req.user.role === 'owner') {
        return next();
    }
    res.status(403).json({ message: 'Permission denied' });
}

// dohvati sve korisnike
router.get('/', passport.authenticate('jwt', { session: false }), isOwner, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// dodaj novog korisnika
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
        res.status(400).json({ message: err.message });
    }
});

// login
router.post('/login', async (req, res) => {
    console.log(`Attempting to log in with username: ${req.body.username}`);
    const user = await User.findOne({ username: req.body.username });
    if (user == null) {
        console.log(`No user found with username: ${req.body.username}`);
        return res.status(400).send('Cannot find user');
    }
    console.log(`Found user with username: ${req.body.username}`);

    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            console.log('Password is correct, logging in...');
            req.login(user, { session: false }, (err) => {
                if (err) {
                    console.log('Error logging in:', err);
                    res.send(err);
                }
                const token = user.generateJwt();
                return res.json({ user, token });
            });
        } else {
            console.log('Incorrect password');
            res.send('Not Allowed');
        }
    } catch (error) {
        console.log('Error comparing password:', error);
        res.status(500).send();
    }
});

// logout
router.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logged out' });
});

module.exports = router;