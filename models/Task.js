const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  mood_type: { 
    type: String, 
    required: true 
  }
});

module.exports = mongoose.model('Task', taskSchema);