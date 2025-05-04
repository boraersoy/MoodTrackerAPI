const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  image_url: { 
    type: String, 
    required: true 
  },
  mood_type: { 
    type: String, 
    required: true 
  }
});

module.exports = mongoose.model('Avatar', avatarSchema);