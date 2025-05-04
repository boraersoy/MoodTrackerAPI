const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Import the User model

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    console.log(token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Please authenticate' });
  }
};