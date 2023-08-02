const mongoose = require('mongoose');

const TrainerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    }
});

module.exports = mongoose.model('Trainer', TrainerSchema);