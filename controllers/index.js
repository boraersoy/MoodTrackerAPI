const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Mood, Mood_Type ,Reason, Task, Quote, Avatar } = require('../models');
const { getTodaysMood } = require('./index'); // Import the function
const { get } = require('../routes');
require('dotenv').config();

// ======================
// Mood Controllers
// ======================
exports.createMood = async (req, res) => {
  // METHOD: POST
  // URL: /moods
  // DESCRIPTION: Create a new mood for the authenticated user
  // BODY: { mood_type: String, OPTIONAL reason: String, OPTIONAL note: String }
  // AUTH: Required
  try {
    // get user id from authenticated user
    const user = await User.findById(req.user._id);
    console.log(user);
    // check if user exists
    if (!user) return res.status(404).json({ error: 'User not found' });
    // check if mood has been recorded today
    const today = new Date();
    const existingMood = await Mood.findOne({
      user_id: user._id,
      created_at: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    });
    // If mood already exists for today, return error
    if (existingMood) {
      return res.status(400).json({ error: 'Mood already recorded for today' });
    }
    // Create new mood
    console.log('Creating mood for user:', user._id);
    const moodData = {
      // Attach authenticated user
      user_id: user._id,
      // Ensure mood_type is included
      mood_type: await Mood_Type.findOne({ 
        name: req.body.mood_type, 
      }),
      // Optional reason for the mood
      reason: await Reason.findOne({ 
        name: req.body.reason, 
      }) || null, // If reason is not provided, set to null
      // Optional note for the mood
      note: req.body.note || '',
    };
    // save mood to database
    console.log('Mood data:', moodData);
    // if mood_type is not provided, return error
    if (!moodData.mood_type) {
      return res.status(400).json({ error: 'Mood type is required' });
    }
    // Create mood instance and save it
    const mood = new Mood(moodData);
    await mood.save();
    // Update user's last mood date and streak
    user.last_mood_date = today; // Set last mood date to today
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

exports.getTodaysMood = async (req, res) => {
  // METHOD: GET
  // URL: /mood/
  // DESCRIPTION: Get today's mood for the authenticated user
  // RESPONSE: Mood object
  // Example: GET /mood
  // AUTH: Required
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Fetch today's mood for the authenticated user
    console.log('Fetching today\'s mood for user:', req.user._id);
    const today = new Date();
    const mood = await Mood.findOne({
      user_id: req.user._id,
      created_at: { $gte: today.setHours(0, 0, 0, 0), $lt: today.setHours(23, 59, 59, 999) }
    });
    if (!mood) {
      return res.status(404).json({ error: 'No mood found for today' });
    }
    console.log('Today\'s Mood:', mood);
    res.status(200).json(mood);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.updateMood = async (req, res) => {
  // METHOD: PATCH
  // URL: /mood/
  // DESCRIPTION: Update today's mood for the authenticated user
  // BODY: { mood_type: String, OPTIONAL reason: String, OPTIONAL note: String }
  // RESPONSE: Updated mood object
  // Example: PATCH /mood/
  // AUTH: Required
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Fetch today's mood for the authenticated user
    console.log('Fetching today\'s mood for user:', req.user._id);
    const today = new Date();
    const mood = await Mood.findOneAndUpdate({
      user_id: req.user._id,
      created_at: { $gte: today.setHours(0, 0, 0, 0), $lt: today.setHours(23, 59, 59, 999) }
    }, {
      mood_type: await Mood_Type.findOne({ 
        name: req.body.mood_type, 
      }),
      // Optional reason for the mood
      reason: await Reason.findOne({ 
        name: req.body.reason, 
      }) || null, // If reason is not provided, set to null
      // Optional note for the mood
      note: req.body.note || '',
    }, { new: true });
    if (!mood) {
      return res.status(404).json({ error: 'No mood found for today' });
    }
    console.log('Today\'s New Mood:', mood);
    res.status(200).json(mood);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DEPRECATED
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

exports.getMoodByDate = async (req, res) => {
  // METHOD: GET
  // URL: /moods/:date
  // DESCRIPTION: Get a specific mood by Date for the authenticated user
  // PARAMS: date (required)
  // RESPONSE: Mood object
  // Example: GET /moods/:date?2025-01-01
  // AUTH: Required
  try {
    console.log('Fetching mood for user:', req.user._id, 'on date:', req.params.date);
    // Ensure the date is in the correct format
    const date = new Date(req.params.date);
    const mood = await Mood.findOne({
      // Find mood by date
      // Ensure the date is set to the start and end of the day 
      created_at: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }, 
      // Ensure the mood belongs to the authenticated user
      user_id: req.user._id 
    });
    // If mood is not found, return 404
    if (!mood) return res.status(404).json({ error: 'Mood not found' });
    // Return the mood
    console.log('Mood found:', mood);
    // Return the mood object
    res.status(200).json(mood);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMoods = async (req, res) => {
  // METHOD: GET
  // URL: /moods
  // DESCRIPTION: Get all moods for the authenticated user
  // QUERY: mood_type (optional), start_date (optional), end_date (optional)
  // RESPONSE: Array of moods
  // Example: GET /moods
  // Example: GET /moods?mood_type=happy&start_date=2023-01-01&end_date=2023-01-31
  // AUTH: Required
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

// ======================
// Task Controllers
// ======================
exports.getTasks = async (req, res) => {
  // METHOD: GET
  // URL: /tasks
  // DESCRIPTION: Get a random task based on today's mood for the authenticated user
  // RESPONSE: Task object
  // Example: GET /tasks
  // AUTH: Required
  try {
    console.log('Fetching tasks for user:', req.user._id);
    const today = new Date();
    // get today's mood for the authenticated user
    const todays_mood = await Mood.findOne({
      user_id: req.user._id,
      created_at: { $gte: today.setHours(0, 0, 0, 0), $lt: today.setHours(23, 59, 59, 999) }
    });
    console.log('Todays Mood:', todays_mood);
    // If no mood found for today, return 404
    if (!todays_mood) {
      return res.status(404).json({ error: 'No mood found for today' });
    }
    const filter = { mood_type: todays_mood.mood_type };
    console.log('Filter:', filter);
    // Find mood type name
    // find mood type by id
    const moodType = await Mood_Type.findById(todays_mood.mood_type);
    if (!moodType) {
      return res.status(404).json({ error: 'Mood type not found' });
    }
    // find mood type name
    mood_type_name = moodType.name;
    // find tasks by mood type name
    const tasks = await Task.find({ mood: mood_type_name });
    // If no tasks found for the mood type, return 404
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'No tasks found for the mood type' });
    }
    // Select a random task from the tasks array
    const randomIndex = Math.floor(Math.random() * tasks.length);
    const task = tasks[randomIndex];
    // Return the random task
    res.status(200).json(task);
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
      avatar_id,
      streak: { current: 0, longest: 0 }, // Initialize streak
      last_mood_date: null, // Initialize last mood date
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