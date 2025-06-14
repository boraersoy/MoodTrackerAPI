
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  // Mood Controllers
  createMood,
  getMoods,
  getMoodByDate,
  updateMood,
  deleteMood,
  getMood,
  // Mood Type Controllers
  getMoodTypes,
  getMoodSummaryByDateRange,
  createMoodType,
  deleteMoodType,
  // Task Controllers
  getTasks,
  createTask,
  
  // Quote Controllers
  getQuotes,
  
  // Avatar Controllers
  getAvatars,
  
  // User Controllers
  registerUser,
  loginUser,
  getUserProfile,
  updateAvatar,
  setReminder,
  getStreak,
} = require('../controllers');

// Mood Routes
router.route('/mood')
  .post(auth, createMood)
  .get(auth, getMood)
  .patch(auth, updateMood);
  
router.route('/moods')
  .get(auth, getMoods);

router.route('/moods/:date')
  .get(auth, getMoodByDate);
  
router.route('/stats/moods')
  .get(auth, getMoodSummaryByDateRange);
  
  // Mood Type Routes
router.route('/mood-types')
  .get(auth, getMoodTypes)
  .post(auth, createMoodType); // Create a new mood type
  
router.route('/mood-types/:name')
  .delete(auth, deleteMoodType); // Delete a mood type by name

// Task Routes
router.route('/tasks')
  .get(auth, getTasks)
  .post(auth, createTask);

// Quote Routes
router.route('/quotes')
  .get(auth, getQuotes);
    
// Avatar Routes
router.route('/avatars')
  .get(auth,getAvatars);

// User Routes
router.route('/users/register')
  .post(registerUser);

router.route('/users/login')
  .post(loginUser);

router.route('/users/me')
  .get(auth, getUserProfile);

router.route('/users/avatar')
  .patch(auth, updateAvatar);

router.route('/users/:id/avatar')
  .patch(auth, updateAvatar); // Update avatar for a specific user

router.route('/users/reminder')
  .post(auth, setReminder); // Set reminder for the user

router.route('/users/streak')
  .get(auth, getStreak); // Get user's streak



module.exports = router;