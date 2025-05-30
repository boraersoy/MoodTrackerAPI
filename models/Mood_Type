const mongoose = require('mongoose');

const moodTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
});

module.exports = mongoose.model('Mood_Type', moodTypeSchema);