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
  note: { 
    type: String 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  // ADDED FIELDS
  mood_type: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Mood_Type', 
    required: true 
  },
  reason: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Reason' 
  }
});

module.exports = mongoose.model('Mood', moodSchema);