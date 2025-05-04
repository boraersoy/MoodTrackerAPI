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
  avatar_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Avatar' 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);