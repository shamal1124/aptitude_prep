const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');

// Public: list questions
router.get('/', questionController.getQuestions);
// Public: get total questions count
router.get('/count', questionController.getQuestionsCount);

// Protected: create single question (admin only)
router.post('/', auth, questionController.createQuestion);

// Protected: bulk create
router.post('/bulk', auth, questionController.createBulkQuestions);

// Protected: delete question (admin only)
router.delete('/:id', auth, questionController.deleteQuestion);

// Protected: update question (admin only)
router.put('/:id', auth, questionController.updateQuestion);

module.exports = router;
 