const mongoose = require('mongoose');

const moodTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    /* emoji: { 
        type: String, 
        required: true 
    }, */ // WE HAVE TO ADD THIS LATER SOMEHOW
});

module.exports = mongoose.model('Mood_Type', moodTypeSchema);