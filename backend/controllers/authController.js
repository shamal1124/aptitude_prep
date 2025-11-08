const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Create a signed JWT for a user
function createToken(user) {
	const payload = { userId: user._id, role: user.role };
	const secret = process.env.JWT_SECRET;
	const opts = { expiresIn: '7d' };
	return jwt.sign(payload, secret, opts);
}

// POST /api/auth/signup
const registerUser = async (req, res) => {
	try {
		const { name, email, password, role } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Name, email and password are required' });
		}

		if (password.length < 6) {
			return res.status(400).json({ message: 'Password must be at least 6 characters' });
		}

		const existing = await User.findOne({ email: email.toLowerCase().trim() });
		if (existing) {
			return res.status(409).json({ message: 'User with that email already exists' });
		}

		const hashed = await bcrypt.hash(password, 10);

			// Map incoming role to stored values. Default to 'Student' for non-admin signups.
			const userRole = role && typeof role === 'string' && role.toLowerCase() === 'admin' ? 'Admin' : 'Student';

			const user = new User({
				name: name.trim(),
				email: email.toLowerCase().trim(),
				password: hashed,
				role: userRole,
			});

		await user.save();

		// don't send password back
		const token = createToken(user);

		res.status(201).json({
			token,
			user: { id: user._id, name: user.name, email: user.email, role: user.role },
		});
	} catch (err) {
		console.error('registerUser error:', err);
		res.status(500).json({ message: 'Server error' });
	}
};

// POST /api/auth/login
const loginUser = async (req, res) => {
	try {
		const { email, password, role } = req.body;

		// Require role to be explicitly provided for login so we can validate it
		if (!email || !password || !role) {
			return res.status(400).json({ message: 'Email, password and role are required' });
		}

		const user = await User.findOne({ email: email.toLowerCase().trim() });
		if (!user) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		// Map requested role and ensure it matches the stored role.
		const requested = role.toLowerCase() === 'admin' ? 'Admin' : 'Student';
		if (user.role !== requested) {
			return res.status(403).json({ message: `Role mismatch: user is '${user.role}', requested '${requested}'` });
		}

		const token = createToken(user);

		res.json({
			token,
			user: { id: user._id, name: user.name, email: user.email, role: user.role },
		});
	} catch (err) {
		console.error('loginUser error:', err);
		res.status(500).json({ message: 'Server error' });
	}
};

module.exports = { registerUser, loginUser };

// GET /api/auth/me - return current authenticated user (requires auth middleware)
const getMe = async (req, res) => {
	try {
		if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
		const user = req.user;
		res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
	} catch (err) {
		console.error('getMe error', err);
		res.status(500).json({ message: 'Server error' });
	}
};

module.exports = { registerUser, loginUser, getMe };
