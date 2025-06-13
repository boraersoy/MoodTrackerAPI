const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Mood, Mood_Type ,Reason, Task, Quote, Avatar } = require('../models');
const { get } = require('../routes');
require('dotenv').config();

// ======================
// Mood Controllers
// ======================
exports.createMood = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    console.log(user);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const moodData = {
      user_id: user._id, // Attach authenticated user
      mood_type: req.body.mood_type, // Ensure mood_type is included
      reason: req.body.reason || null, // Optional reason for the mood
      note: req.body.note || '', // Optional note for the mood
    };
    const mood = new Mood(moodData);
    await mood.save();
    // Update user's last mood date and streak
    user.last_mood_date = new Date();
    user.streak.current += 1; // Increment current streak
    if (user.streak.current > user.streak.longest) {
      user.streak.longest = user.streak.current; // Update longest streak if current is greater
    }
    await user.save();
    // Return the created mood
    res.status(201).json(mood);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMoods = async (req, res) => {
  try {
    console.log('Fetching moods for user:', req.user._id);
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


exports.getStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('streak last_mood_date');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate current streak
    const today = new Date();
    const lastMoodDate = user.last_mood_date ? new Date(user.last_mood_date) : null;
    if (!lastMoodDate) {
      // If no last mood date, set streak to 0
      user.streak.current = 0;
      await user.save();
      return res.json(user.streak);
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (lastMoodDate != yesterday && lastMoodDate != today) {
      // If last mood was not yesterday or today, reset streak
      user.streak.current = 0; // Reset streak if last mood was not yesterday
      await user.save();
    }
    // return current streak
    res.json(user.streak);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setReminder = async (req, res) => {
  try {
    const { time, enabled } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        reminder: {
          time: time || '21:00', // Default reminder time
          enabled: enabled !== undefined ? enabled : false // Default to disabled
        }
      },
      { new: true }
    ).select('-password_hash');
    res.json(user.reminder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password_hash')
      .populate('avatar_id');
    this.getStreak(req, res); // Call getStreak to ensure streak is calculated
    streak = user.streak || { current: 0, longest: 0 };
    user.reminder = {
      time: user.reminder.time || '21:00', // Default reminder time
      enabled: user.reminder.enabled || false // Reminder disabled by default
    };
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

// ======================
// Mood Type Controllers
// ======================
exports.getMoodTypes = async (req, res) => {
  try {
    console.log('Fetching mood types');
    console.log(req);
    const moodTypes = await Mood_Type.find();
    res.json(moodTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.createMoodType = async (req, res) => {
  try {
    const moodType = new Mood_Type(req.body);
    await moodType.save();
    res.status(201).json(moodType);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
exports.updateMoodType = async (req, res) => {
  try {
    const moodType = await Mood_Type.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!moodType) return res.status(404).json({ error: 'Mood Type not found' });
    res.json(moodType);
  }
  catch (err) {
    res.status(400).json({ error: err.message });
  }
};