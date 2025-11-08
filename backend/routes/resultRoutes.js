const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const auth = require('../middleware/auth');

// Save result (authenticated)
router.post('/', auth, resultController.saveResult);

// Get stats for current authenticated user
router.get('/me/stats', auth, resultController.getMyStats);

// Get paginated exam history
router.get('/me/history', auth, resultController.getMyExamHistory);

// Get leaderboard
router.get('/leaderboard', auth, resultController.getLeaderboard);

module.exports = router;
