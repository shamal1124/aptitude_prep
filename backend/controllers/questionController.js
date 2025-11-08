const Question = require('../models/Question');

// GET /api/questions
exports.getQuestions = async (req, res) => {
	try {
		const questions = await Question.find().limit(100);
		res.json(questions);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

// DELETE /api/questions/:id (Admin only)
exports.deleteQuestion = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can delete questions' });
        }

        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        await Question.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question deleted successfully' });
    } catch (err) {
        console.error('deleteQuestion error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/questions/:id (Admin only)
exports.updateQuestion = async (req, res) => {
    try {
        console.log('Update request received:', {
            userId: req.user?._id,
            userRole: req.user?.role,
            questionId: req.params.id,
            body: req.body
        });

        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can update questions' });
        }

        const { text, options, correctAnswer, category, explanation } = req.body;
        console.log('Processing update with explanation:', explanation); // Debug log
        
        // Validate required fields
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Question text is required' });
        }
        if (!Array.isArray(options) || options.length !== 4) {
            return res.status(400).json({ message: 'Four options are required' });
        }
        if (!correctAnswer) {
            return res.status(400).json({ message: 'Correct answer is required' });
        }
        if (!options.includes(correctAnswer)) {
            return res.status(400).json({ message: 'Correct answer must be one of the options' });
        }

        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

		const updated = await Question.findByIdAndUpdate(
			req.params.id,
			{
				text: text.trim(),
				options,
				correctAnswer,
				category: category || 'General',
				explanation: typeof explanation !== 'undefined' ? explanation : question.explanation
			},
			{ new: true }
		);

        console.log('Question updated successfully:', updated);
        res.json(updated);
    } catch (err) {
        console.error('updateQuestion error:', err);
        res.status(500).json({ message: err.message || 'Server error updating question' });
    }
};

// POST /api/questions  (Admin only)
exports.createQuestion = async (req, res) => {
	try {
		console.log('createQuestion called, auth header=', req.headers.authorization);
		console.log('createQuestion body=', req.body);
		// require admin
		if (!req.user || req.user.role !== 'Admin') {
			return res.status(403).json({ message: 'Only admins can add questions' });
		}

		const { question, options, correct, category, difficulty, explanation } = req.body;

		if (!question || !options || !correct) {
			return res.status(400).json({ message: 'question, options and correct answer are required' });
		}

		const q = new Question({
			text: question,
			options: Array.isArray(options) ? options : [],
			correctAnswer: correct,
			category: category || 'General',
			difficulty: difficulty || 'Medium',
			explanation: explanation || '',
			createdBy: req.user._id,
		});

		const saved = await q.save();
		res.status(201).json(saved);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

// POST /api/questions/bulk  (Admin only). Accepts array of questions in body.questions
exports.createBulkQuestions = async (req, res) => {
	try {
		console.log('createBulkQuestions called, auth header=', req.headers.authorization);
		console.log('createBulkQuestions body length=', Array.isArray(req.body.questions)? req.body.questions.length : 0);
		if (!req.user || req.user.role !== 'Admin') {
			return res.status(403).json({ message: 'Only admins can add questions' });
		}

		const { questions } = req.body; // expect array of { question, options, correct, category, difficulty, explanation }
		if (!Array.isArray(questions) || questions.length === 0) {
			return res.status(400).json({ message: 'questions array required' });
		}

		const docs = questions.map((it) => ({
			text: it.question,
			options: Array.isArray(it.options) ? it.options : [],
			correctAnswer: it.correct,
			category: it.category || 'General',
			difficulty: it.difficulty || 'Medium',
			explanation: it.explanation || '',
			createdBy: req.user._id,
		}));

		const inserted = await Question.insertMany(docs);
		res.status(201).json({ insertedCount: inserted.length, inserted });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};
// exports are defined using `exports.*` above so no extra module.exports override is needed
// GET /api/questions/count - Returns total number of questions
exports.getQuestionsCount = async (req, res) => {
	try {
		const count = await Question.countDocuments();
		res.json({ count });
	} catch (err) {
		console.error('getQuestionsCount error:', err);
		res.status(500).json({ message: 'Server error' });
	}
};
