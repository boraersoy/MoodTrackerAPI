const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  note: { 
    type: String 
  },
  created_at: { 
    type: Date, 
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

/* TO STRING METHOD
moodSchema.methods.toString = function() {
  return `Mood: ${this.mood_type.name} on (${tformatDateOnly(this.created_at)}) because of ${this.reason.name}- ${this.note || ''} `;
};
*/

module.exports = mongoose.model('Mood', moodSchema);