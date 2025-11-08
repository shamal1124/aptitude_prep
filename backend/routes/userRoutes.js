const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { getUsers, getStudents, getStudentCount, updateMe } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.post('/signup', registerUser);
router.post('/login', loginUser);

// User endpoints
router.get('/', authMiddleware, getUsers);  // Get all users (protected, admin only)
router.get('/count/students', getStudentCount);

// Update the current authenticated user
router.put('/me', authMiddleware, updateMe);

module.exports = router;
