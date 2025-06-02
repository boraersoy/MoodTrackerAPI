const mongoose = require('mongoose');

const reasonSchema = new mongoose.Schema({
  reason: { 
    type: String 
  }
});

module.exports = mongoose.model('Reason', moodSchema);