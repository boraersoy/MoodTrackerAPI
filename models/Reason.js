const mongoose = require('mongoose');

const reasonSchema = new mongoose.Schema({
  name: { 
    type: String ,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('Reason', reasonSchema);