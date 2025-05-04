const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Mood, Task, Quote, Avatar } = require('../models');
require('dotenv').config();

// ======================
// Mood Controllers
// ======================
exports.createMood = async (req, res) => {
  try {
    const moodData = {
      ...req.body,
      user_id: req.user._id // Attach authenticated user
    };
    const mood = new Mood(moodData);
    await mood.save();
    res.status(201).json(mood);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMoods = async (req, res) => {
  try {
    const { mood_type, start_date, end_date } = req.query;
    const filter = { user_id: req.user._id };
    
    if (mood_type) filter.mood_type = mood_type;
    if (start_date && end_date) {
      filter.created_at = { 
        $gte: new Date(start_date), 
        $lte: new Date(end_date) 
      };
    }

    const moods = await Mood.find(filter).sort({ created_at: -1 });
    res.json(moods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMoodById = async (req, res) => {
  try {
    const mood = await Mood.findOne({ 
      _id: req.params.id, 
      user_id: req.user._id 
    });
    if (!mood) return res.status(404).json({ error: 'Mood not found' });
    res.json(mood);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMood = async (req, res) => {
  try {
    const mood = await Mood.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      req.body,
      { new: true }
    );
    if (!mood) return res.status(404).json({ error: 'Mood not found' });
    res.json(mood);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteMood = async (req, res) => {
  try {
    const mood = await Mood.findOneAndDelete({ 
      _id: req.params.id, 
      user_id: req.user._id 
    });
    if (!mood) return res.status(404).json({ error: 'Mood not found' });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ======================
// Task Controllers
// ======================
exports.getTasks = async (req, res) => {
  try {
    const { mood_type } = req.query;
    const filter = mood_type ? { mood_type } : {};
    const tasks = await Task.find(filter);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ======================
// Quote Controllers
// ======================
exports.getQuotes = async (req, res) => {
  try {
    const { mood_type, random } = req.query;
    const filter = mood_type ? { mood_type } : {};
    
    let query = Quote.find(filter);
    if (random === 'true') {
      const count = await Quote.countDocuments(filter);
      const randomIndex = Math.floor(Math.random() * count);
      query = Quote.findOne(filter).skip(randomIndex);
    }

    const quotes = await query.exec();
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================
// Avatar Controllers
// ======================
exports.getAvatars = async (req, res) => {
  try {
    const { mood_type } = req.query;
    const filter = mood_type ? { mood_type } : {};
    const avatars = await Avatar.find(filter);
    res.json(avatars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================
// User Controllers
// ======================
exports.registerUser = async (req, res) => {
  try {
    const { email, password, avatar_id } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({ 
      email, 
      password_hash: hashedPassword, 
      avatar_id 
    });
    await user.save();
    
    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });
    
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });
    
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password_hash')
      .populate('avatar_id');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar_id: req.body.avatar_id },
      { new: true }
    ).select('-password_hash');
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};