const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /api/users/students - Returns list of all students
// GET /api/users - Returns list of all users
const getUsers = async (req, res) => {
  try {
    console.log('getUsers called, auth user:', req.user?._id);
    
    // Verify admin access
    if (!req.user || req.user.role !== 'Admin') {
      console.log('Access denied - user is not admin:', req.user?.role);
      return res.status(403).json({ message: 'Only admins can view user list' });
    }

    // Find all users
    const users = await User.find()
      .select('-password')  // Exclude password
      .sort({ createdAt: -1 });  // Newest first
    
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// GET /api/users/students - Returns list of all students (deprecated)
const getStudents = async (req, res) => {
  try {
    console.log('getStudents called, auth user:', req.user?._id);
    
    // Verify admin access
    if (!req.user || req.user.role !== 'Admin') {
      console.log('Access denied - user is not admin:', req.user?.role);
      return res.status(403).json({ message: 'Only admins can view student list' });
    }

    // Find all users with role 'Student'
    const students = await User.find({ role: 'Student' })
      .select('-password')  // Exclude password
      .sort({ createdAt: -1 });  // Newest first
    
    console.log(`Found ${students.length} students`);
    res.json(students);
  } catch (err) {
    console.error('getStudents error:', err);
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

// GET /api/users/count/students - Returns total number of users with role 'Student'
const getStudentCount = async (req, res) => {
  try {
    // Find all users with role 'Student' and count them
    const count = await User.countDocuments({ role: 'Student' });
    console.log('[getStudentCount] Found students:', count);

    // Log a few students for verification
    const students = await User.find({ role: 'Student' }).select('email role').limit(3);
    console.log('[getStudentCount] Sample students:', students);
    
    res.json({ count });
  } catch (err) {
    console.error('getStudentCount error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/users/me - update current authenticated user's info
const updateMe = async (req, res) => {
  try {
    console.log('[updateMe] called for user:', req.user && req.user._id, 'body:', req.body);
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const { name, email, password } = req.body;

    const update = {};
    if (name && name.trim()) update.name = name.trim();
    if (email && email.trim()) {
      const normalized = email.toLowerCase().trim();
      // if email changed, ensure uniqueness
      if (normalized !== req.user.email) {
        const exists = await User.findOne({ email: normalized });
        if (exists) return res.status(409).json({ message: 'Email already in use' });
      }
      update.email = normalized;
    }
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
      const hashed = await bcrypt.hash(password, 10);
      update.password = hashed;
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUsers, getStudents, getStudentCount, updateMe };