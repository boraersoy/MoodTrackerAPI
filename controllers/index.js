const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Mood, Mood_Type ,Reason, Task, Quote, Avatar } = require('../models');
require('dotenv').config();

// ======================
// Mood Controllers
// ======================

async function createdMood(userId)
{
  // This function is used to check if a mood has been created today
  const today = new Date(); // get today's date
  today.setUTCHours(0, 0, 0, 0); // Set time to start of the day
  const mood = await Mood.findOne({
    user_id: userId,
    created_at: today
  });
  if (mood) {
    console.log('Mood already created for today:', mood);
    return true; // Mood already exists for today
  }
  console.log('No mood found for today');
  return false; // No mood found for today
}

exports.createMood = async (req, res) => {
  // METHOD: POST
  // URL: /moods
  // DESCRIPTION: Create a new mood for the authenticated user
  // BODY: { mood_type: String, OPTIONAL reason: String, OPTIONAL note: String }
  // AUTH: Required
  try {
    // get user id from authenticated user
    const user = await User.findById(req.user._id);
    // check if user exists
    if (!user) return res.status(404).json({ error: 'User not found' });
    // check if mood has been recorded today
    const existingMood = await createdMood(user._id);
    // If mood already exists for today, return error
    if (existingMood==true) {
      return res.status(400).json({ error: 'Mood already recorded for today' });
    }
    const today = new Date(); // get today's date
    today.setUTCHours(0, 0, 0, 0); // Set time to start of the day
    // Create new mood
    console.log('Creating mood for user:', user.email);
    const moodData = {
      // Attach authenticated user
      user_id: user._id,
      // Set created_at to today
      created_at: today,
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
    // if mood_type is not provided, return error
    if (!moodData.mood_type) {
      return res.status(400).json({ error: 'Mood type is required' });
    }
    // Create mood instance and save it
    const mood = new Mood(moodData);
    await mood.save();
    // Update user's last mood date and streak
    user.last_mood_date = mood.created_at; // Set last mood date to today
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

exports.getMood = async (req, res) => {
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
    const mood = await getTodaysMood(req.user._id);
    // If mood is not found, return 404
    if (!mood) {
      return res.status(404).json({ error: 'No mood found for today' });
    }
    console.log('Today\'s Mood:', mood);
    res.status(200).json(mood);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTodaysMood(userId) {
  // This function is used to get today's mood for a user
  const today = new Date(); // get today's date
  today.setUTCHours(0, 0, 0, 0); // Set time to start of the day
  const mood = await Mood.findOne({
    user_id: userId,
    created_at: today
    }).populate('mood_type reason');
  return mood;
} // Return the mood object

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
    const today = new Date(); // Set time to start of the day
    today.setUTCHours(0, 0, 0, 0); // Set time to start of the day // Set time to start of the day
    existingMood = await createdMood(req.user._id);
    if (existingMood==false) {
      return res.status(404).json({ error: 'No mood found for today' });
    }
    const mood = await Mood.findOneAndUpdate({
      user_id: req.user._id,
      created_at: today
    }, {
      mood_type: await Mood_Type.findOne({ 
        name: req.body.mood_type, 
      }),
      // Optional reason for the mood - only update if provided
      ...(req.body.reason !== undefined && { 
        reason: await Reason.findOne({ name: req.body.reason }) 
      }),
      // Optional note for the mood - only update if provided
      ...(req.body.note !== undefined && { note: req.body.note }),
    }, { new: true });
    await mood.populate('mood_type reason');
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
    const date = new Date(req.params.date); // Month is 0-indexed in JavaScript
    const mood = await Mood.findOne({
      // Ensure the mood belongs to the authenticated user
      user_id: req.user._id,
      // Find mood by date
      created_at: date
    });
    // If mood is not found, return 404
    if (!mood) return res.status(404).json({ error: 'Mood not found' });
    // Log the mood
    console.log('Mood found:', mood);
    // Return the mood
    res.status(200).json(mood);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function getMoodsHelper(userId, mood_type, start_date, end_date) {
  // This function is used to get all moods for a user in a date range and with a possible mood type
  filter = { user_id: userId };
  // If mood_type is provided, add it to the filter
  if (mood_type) {
    const moodTypeObj = await Mood_Type.findOne({ name: mood_type });
    filter.mood_type = moodTypeObj;
  }
  // if no start_date and end_date are provided, return all moods for the user
  if (start_date) {
    start_date = new Date(start_date);
    // Set time to start of the day for start_date
    start_date.setUTCHours(0, 0, 0, 0);
    filter.created_at = {
      $gte: start_date // Set start date
    };
  }
  // If end_date is provided, set it
  if (end_date) {  
    end_date = new Date(end_date);
    filter.created_at = {
      ...filter.created_at, // Keep existing filter
      $lte: end_date // Set end date
    };
  }
  // Ensure start_date is before end_date
  if (start_date > end_date) {
    throw new Error('Start date must be before end date');
  }
  console.log('Fetching moods for user:', userId, 'from', start_date, 'to', end_date);
  // Find all moods for the user in the date range and populate mood_type and reason
  const moods = await Mood.find(filter)
    .populate('mood_type reason')
    .sort({ created_at: -1 }); // Sort by created_at in descending order
  console.log('Fetched moods:', moods);
  // Return the moods
  return moods;
}

exports.getMoodSummaryByDateRange = async (req, res) => {
  // METHOD: GET
  // URL: /stats/moods
  // DESCRIPTION: Get mood summary for the authenticated user in a date range
  // QUERY: start (optional), end (optional)
  // RESPONSE: Object with days and counts
  // Example: GET /stats/moods?start_date=2023-01-01&end_date=2023-01-31
  // AUTH: Required
  try {
    const { start_date, end_date } = req.query;
    console.log('Fetching mood summary for user:', req.user._id, 'from', start_date, 'to', end_date);
    let moods = [];
    // Get all moods for the user in the date range, and populate mood_type
    moods = await getMoodsHelper(req.user._id, undefined, start_date, end_date);
    console.log('Fetched moods:', moods);

    const dayToMood = {};
    const moodTypeCounts = {};

    moods.forEach(mood => {
      console.log('Mood:', mood);
      const day = mood.created_at;
      const moodTypeName = mood.mood_type && mood.mood_type.name ? mood.mood_type.name : 'Unknown';
      dayToMood[day] = moodTypeName;
      moodTypeCounts[moodTypeName] = (moodTypeCounts[moodTypeName] || 0) + 1;
    });

    res.json({
      days: dayToMood,
      counts: moodTypeCounts
    });
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
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const moods = await getMoodsHelper(req.user._id, mood_type, start_date, end_date);
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
    // get today's mood for the authenticated user
    const todays_mood = await getTodaysMood(req.user._id);
    console.log('Todays Mood:', todays_mood);
    // If no mood found for today, return 404
    if (!todays_mood) {
      return res.status(403).json({ error: 'No mood found for today' });
    }
    mood_type_name = todays_mood.mood_type.name;
    // find tasks by mood type name
    const tasks = await Task.find({ mood_name: mood_type_name });
    console.log('Tasks found:', tasks);
    // If no tasks found for the mood type, return 404
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'No tasks found for the mood type' });
    }
    // Select a random task from the tasks array
    const randomIndex = Math.floor(Math.random() * tasks.length);
    const task = tasks[randomIndex];
    console.log('Task:', task);
    // Return the random task
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// NOT USED
exports.createTask = async (req, res) => {
  try {
    // METHOD: POST
    // URL: /tasks
    // DESCRIPTION: Create a new task for the authenticated user
    // BODY: { mood_type: String, task: String }
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
  // METHOD: GET
  // URL: /quotes
  // DESCRIPTION: Get a random quote based on today's mood for the authenticated user
  // RESPONSE: Quote object
  // Example: GET /quotes
  // AUTH: Required
  try {
    console.log('Fetching quotes for user:', req.user._id);
    // get today's mood for the authenticated user
    const todays_mood = await getTodaysMood(req.user._id);
    console.log('Todays Mood:', todays_mood);
    // If no mood found for today, return 404
    if (!todays_mood) {
      return res.status(401).json({ error: 'No mood found for today' });
    }
    // Find mood type name
    const mood_type_name = todays_mood.mood_type.name;
    // find quotes by mood type name
    const quotes = await Quote.find({ mood_name: mood_type_name });
    // If no quotes found for the mood type, return 404
    if (quotes.length === 0) {
      return res.status(404).json({ error: 'No quotes found for the mood type' });
    }
    // Select a random quote from the quotes array
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    console.log('Quote:', quote);
    // Return the random quote
    res.status(200).json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================
// Avatar Controllers
// ======================
exports.getAvatars = async (req, res) => {
  // METHOD: GET
  // URL: /api/avatars?mood_type=
  // DESCRIPTION: Get the random avatar for related mood type for users choice of avatar
  // RESPONSE: avatar image url
  // Example: GET /avatars?mood_type=happy
  // AUTH: Required

  // ** for overwhelmed/tired : tired
  // ** for surprised/scared : scared
  // ** You can use it for first avatar who asks the mood by mood_type=default (default)
  try {
    const { mood_type } = req.query;
    // Ensure the user is authenticated
    if (!mood_type) {
      return res.status(400).json({ error: 'mood_type query param is required' });
    }
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Find user by ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // find avatar based on filter
    let filter = {
      gender: user.avatar_gender,
      age:user.avatar_age,
      mood_type: mood_type  
    };
    const avatars = await Avatar.find(filter);

    // If no avatars found for the mood type, return 404
    if (avatars.length === 0) {
      return res.status(404).json({ error: 'No avatars found for the given mood_type' });
    }
    
    // Select a random avatar from the avatars array
    const randomIndex = Math.floor(Math.random() * avatars.length);
    const avatar = avatars[randomIndex];
    // return the avatar
    res.status(200).json(avatar);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// COULD NOT TRY AS THERE IS NO AVATAR DATA YET
exports.updateAvatar = async (req, res) => {
  try {
    // METHOD: PATCH
    // URL: /users/avatar
    // DESCRIPTION: Update the avatar for the authenticated user
    // BODY: { avatar_id: String }
    // RESPONSE: Updated user object excluding the `password_hash` field
    // NOTE: The `password_hash` field is explicitly excluded for security reasons
    // Example: PATCH /users/avatar
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    avatar_age = req.body.avatar_age || req.user.avatar_age; // Use existing age if not provided
    avatar_gender = req.body.avatar_gender || req.user.avatar_gender; // Use existing gender if not provided
    console.log('Updating avatar for user:', req.user._id, 'to age:', avatar_age, 'gender:', avatar_gender);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar_age : avatar_age,
      avatar_gender : avatar_gender},
      { new: true }
    ).select('-password_hash');
    console.log('Updated User:', user);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// ======================
// User Controllers
// ======================
exports.registerUser = async (req, res) => {
  // METHOD: POST
  // URL: /users/register
  // DESCRIPTION: Register a new user
  // BODY: { email: String, password: String, avatar_id: String }
  // RESPONSE: User object with JWT token
  // Example: POST /users/register
  try {
    const { email, password, avatar_gender, avatar_age } = req.body;
    
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
      avatar_gender,
      avatar_age,
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
  // METHOD: POST
  // URL: /users/login
  // DESCRIPTION: Login an existing user
  // BODY: { email: String, password: String }
  // RESPONSE: User object with JWT token
  // Example: POST /users/login
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
  // METHOD: GET
  // URL: /users/streak
  // DESCRIPTION: Get the current streak for the authenticated user
  // RESPONSE: Streak object
  // Example: GET /users/streak
  // AUTH: Required
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Fetch user and calculate streak
  try {
    const user = await User.findById(req.user._id).select('streak last_mood_date');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate current streak
    const lastMoodDate = user.last_mood_date ? new Date(user.last_mood_date) : null;
    if (!lastMoodDate) {
      // If no last mood date, set streak to 0
      user.streak.current = 0;
      await user.save();
      return res.json(user.streak);
    }
    // Check if last mood was before yesterday
    lastMoodDate.setUTCHours(0, 0, 0, 0); // Set time to start of the day
    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0); // Set time to start of the day
    console.log('Yesterday:', yesterday);
    console.log('Last Mood Date:', lastMoodDate);
    if (lastMoodDate < yesterday) {
      // If last mood was before yesterday, reset streak
      user.streak.current = 0; // Reset streak if last mood was before yesterday
      await user.save();
    }
    // return current streak
    res.status(200).json(user.streak);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setReminder = async (req, res) => {
  // METHOD: POST
  // URL: /users/reminder
  // DESCRIPTION: Set or update the reminder time for the authenticated user
  // BODY: { time: String in the format HH:MM, enabled: Boolean }
  // RESPONSE: Reminder object
  // Example: POST /users/reminder
  // AUTH: Required
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    console.log('Setting reminder for user:', req.user._id);
    // Ensure user exists
    const { time, enabled } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        reminder: {
          time: time || user.reminder.time, // If time is not provided, keep the existing time
          enabled: enabled || user.reminder.enabled // If enabled is not provided, keep the existing enabled status
        }
      },
      { new: true }
    ).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Log the updated reminder
    console.log('Updated Reminder for user:', user._id, 'Reminder:', user.reminder);
    res.json(user.reminder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  // METHOD: GET
  // URL: /users/me
  // DESCRIPTION: Get the authenticated user's profile
  // RESPONSE: User object without password
  // Example: GET /users/me
  // AUTH: Required
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(req.user._id)
      .select('-password_hash');
    console.log('Fetching user profile for user:', req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' }); 
    // Return user profile without password
    console.log('User Profile:', user);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// ======================
// Mood Type Controllers
// ======================
exports.getMoodTypes = async (req, res) => {
  // METHOD: GET
  // URL: /mood-types
  // DESCRIPTION: Get all mood types
  // RESPONSE: Array of mood types
  // Example: GET /mood-types
  // AUTH: Required
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    console.log('Fetching mood types');
    const moodTypes = await Mood_Type.find();
    res.json(moodTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMoodType = async (req, res) => {
  // METHOD: POST
  // URL: /mood-types
  // DESCRIPTION: Create a new mood type
  // BODY: { name: String }
  // RESPONSE: Created mood type object
  // Example: POST /mood-types
  // AUTH: Required
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Ensure mood type name is provided
    if (!req.body.name) {
      return res.status(400).json({ error: 'Mood type name is required' });
    }
    // Check if mood type already exists
    const existingMoodType = await Mood_Type.findOne({ name: req.body.name });
    if (existingMoodType) {
      return res.status(400).json({ error: 'Mood type already exists' });
    }
    // Create new mood type
    console.log('Creating new mood type:', req.body.name);
    // Create mood type instance and save it
    const moodType = new Mood_Type(req.body);
    await moodType.save();
    res.status(201).json(moodType);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteMoodType = async (req, res) => {
  try {
    // METHOD: DELETE
    // URL: /mood-types/:name
    // DESCRIPTION: Delete a mood type by name
    // PARAMS: name (required)
    // RESPONSE: Success message  
    // Example: DELETE /mood-types/Happy
    // AUTH: Required
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Ensure mood type name is provided
    if (!req.params.name) {
      return res.status(400).json({ error: 'Mood type name is required' });
    }
    // find mood type by name
    const moodType = await Mood_Type.findOne({ name: req.params.name });
    if (!moodType) {
      return res.status(404).json({ error: 'Mood type not found' });
    }
    // check if moods have been created with this mood type
    const moodsWithType = await Mood.findOne({ mood_type: moodType._id });
    if (moodsWithType) {
      return res.status(400).json({ error: 'Cannot delete mood type with existing moods' });
    }
    // Find and delete the mood type
    console.log('Deleting mood type:', req.params.name);
    await Mood_Type.deleteOne({ name: req.params.name });
    // Return success message
    res.status(200).json({ message: `Mood type ${req.params.name} deleted successfully` });
  }
  catch (err) {
    res.status(400).json({ error: err.message });
  }
};