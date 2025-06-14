const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true 
  },
  password_hash: { 
    type: String, 
    required: true 
  },
avatar_gender: {
  type: String,
  enum: ['male', 'female'], 
  required: true
},

avatar_age: {
  type: String,
  enum: ['young', 'old'], 
  required: true
},
  created_at: { 
    type: Date, 
    default: Date.now
  },
  // ADDED FIELDS
  reminder: {
    time: { 
      type: String, 
      default: '21:00' // Default reminder time
    },
    enabled: { 
      type: Boolean, 
      default: false // Reminder disabled by default
    }
  },
  streak: {
    current: { 
      type: Number, 
      default: 0 // Current streak count
    },
    longest: { 
      type: Number, 
      default: 0 // Longest streak count
    }
  },
  last_mood_date: { 
    type: Date // Date of the last mood entry
  }
});

module.exports = mongoose.model('User', userSchema);