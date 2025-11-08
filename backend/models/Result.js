const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: { type: Number, required: true },
  answers: [{ questionId: String, answer: String }],
  date: { type: Date, default: Date.now, required: true },
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Result', resultSchema);
