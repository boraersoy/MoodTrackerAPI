const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  data: { 
    type: Object 
  },
  mood_type: { 
    type: String, 
    required: true 
  },
  note: { 
    type: String 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Mood', moodSchema);