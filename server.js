require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('./models/User'); 
const cors = require('cors');
const bcrypt = require('bcryptjs');
const history = require('connect-history-api-fallback');

const usersRouter = require('./routes/users'); 
const gymsRouter = require('./routes/gyms');
const trainersRouter = require('./routes/trainers');

const app = express();

mongoose.connect('mongodb+srv://mm:gym@mmgym.ge4qjrx.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
    console.log('Successfully connected to database');
});

mongoose.connection.on('error', (err) => {
    console.log('Error connecting to database:', err);
});

const corsOptions = {
    origin: 'http://localhost:8080',
    credentials: true,
    optionSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.static('public'));

app.use(history());

app.use(passport.initialize());

passport.use(new LocalStrategy(function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }

        bcrypt.compare(password, user.password, function (err, result) {
            if (err) { return done(err); }
            if (result) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        });
    });
}));

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(opts, async function (jwt_payload, done) {
    console.log('JWT strategy is being called');
    console.log('JWT payload:', jwt_payload);

    try {
        const user = await User.findById(jwt_payload._id);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (err) {
        return done(err, false);
    }
}));

app.use('/users', usersRouter); 
app.use('/gyms', gymsRouter);
app.use('/trainers', trainersRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});