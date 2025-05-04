
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  // Mood Controllers
  createMood,
  getMoods,
  getMoodById,
  updateMood,
  deleteMood,
  
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
  updateAvatar
} = require('../controllers');

// Mood Routes
router.route('/moods')
  .post(auth, createMood)
  .get(auth, getMoods);

router.route('/moods/:id')
  .get(auth, getMoodById)
  .patch(auth, updateMood)
  .delete(auth, deleteMood);

// Task Routes
router.route('/tasks')
  .get(getTasks)
  .post(auth, createTask);

// Quote Routes
router.route('/quotes')
  .get(getQuotes);

// Avatar Routes
router.route('/avatars')
  .get(getAvatars);

// User Routes
router.route('/users/register')
  .post(registerUser);

router.route('/users/login')
  .post(loginUser);

router.route('/users/me')
  .get(auth, getUserProfile);

router.route('/users/avatar')
  .patch(auth, updateAvatar);

module.exports = router;