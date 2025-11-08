const Result = require('../models/Result');

// POST /api/results - save exam result for authenticated user
exports.saveResult = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    const { score, answers } = req.body;

    if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers array required' });

    const doc = new Result({
      userId: userId || null,
      score: typeof score === 'number' ? score : 0,
      answers: answers.map((a) => ({ questionId: a.questionId || a.id || '', answer: a.answer || '' })),
      date: new Date()
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('saveResult error:', err);
    res.status(500).json({ message: 'Server error saving result' });
  }
};

// GET /api/results/me/stats - returns attempts count, days active count, and ranking position
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    // Total attempts = number of results for this user
    const attempts = await Result.countDocuments({ userId });

    // Days active = count of distinct dates (by day) where user has results
    const daysAgg = await Result.aggregate([
      { $match: { userId } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
      { $count: "daysActive" }
    ]);
    const daysActive = (daysAgg && daysAgg[0] && daysAgg[0].daysActive) || 0;

    // Calculate total sum of scores and count for percentage calculation
    const scoreAgg = await Result.aggregate([
      { $match: { userId } },
      { $group: { 
          _id: null, 
          totalScore: { $sum: "$score" },
          examCount: { $sum: 1 }
        } 
      }
    ]);

    // Calculate percentage: (100 * sum of all marks) / (30 * number of attempts)
    const averageScore = scoreAgg.length > 0 
      ? Math.round((100 * scoreAgg[0].totalScore) / (30 * scoreAgg[0].examCount)) 
      : 0;

    // Compute ranking position: rank users by max score descending, user with higher max gets better rank
    const rankingAgg = await Result.aggregate([
      { $group: { _id: "$userId", maxScore: { $max: "$score" } } },
      { $sort: { maxScore: -1 } }
    ]);

    let position = null;
    for (let i = 0; i < rankingAgg.length; i++) {
      if (String(rankingAgg[i]._id) === String(userId)) {
        position = i + 1;
        break;
      }
    }
    const totalUsers = rankingAgg.length;

    res.json({ attempts, daysActive, position, totalUsers, averageScore });
  } catch (err) {
    console.error('getMyStats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/leaderboard - returns top 5 performers
exports.getLeaderboard = async (req, res) => {
  try {
    // Aggregate to get max score for each user and join with user details
    const leaderboard = await Result.aggregate([
      // Group by userId to get max score for each user
      { 
        $group: {
          _id: "$userId",
          maxScore: { $max: "$score" },
          totalScore: { $sum: "$score" },
          attempts: { $sum: 1 }
        }
      },
      // Calculate average score percentage
      {
        $addFields: {
          averagePercentage: {
            $multiply: [
              { $divide: ["$totalScore", { $multiply: ["$attempts", 30] }] },
              100
            ]
          }
        }
      },
      // Sort by average percentage descending
      { $sort: { averagePercentage: -1 } },
      // Limit to top 5
      { $limit: 5 },
      // Join with users collection to get names
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      // Reshape the output
      {
        $project: {
          name: { $arrayElemAt: ["$userDetails.name", 0] },
          score: { $round: ["$averagePercentage", 1] }
        }
      }
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/me/history - returns paginated exam history for current user
exports.getMyExamHistory = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    // Get page and limit from query params
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 5;

    console.log('Fetching results for userId:', userId);
    
    const results = await Result.find({ userId })
      .sort({ date: -1 })  // newest first
      .skip(page * limit)
      .limit(limit);

    console.log('Raw results:', results);

    // Get total count for pagination
    const total = await Result.countDocuments({ userId });
    console.log('Total records:', total);

    // Format the results for the frontend
    const formattedResults = results.map(r => {
      const dateStr = new Date(r.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      return {
        date: dateStr,
        score: Math.round(r.score || 0)
      };
    });

    console.log('Formatted results:', formattedResults);

    res.json({
      results: formattedResults,
      total
    });

  } catch (err) {
    console.error('getMyExamHistory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
