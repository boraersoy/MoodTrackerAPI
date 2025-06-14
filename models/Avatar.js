const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({

  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },

    age: {
    type: String,
    enum: ['young', 'old'],
    required: true
  },

  image_url: {
    type: String,
    required: true
  },
  mood_type: { 
    type: String,
    required: false 
  }
});

module.exports = mongoose.model('Avatar', avatarSchema);
