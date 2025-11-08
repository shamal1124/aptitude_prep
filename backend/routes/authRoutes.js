const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/signup', registerUser);
router.post('/login', loginUser);

// Protected route to get current user
router.get('/me', authMiddleware, getMe);

module.exports = router;
