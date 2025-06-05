const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { User, Mood, Task, Quote, Avatar, Mood_Type, Reason } = require('./models');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes will be added here
const routes = require('./routes');
app.use('/api', routes);

// Start server
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Welcome to My Day');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});