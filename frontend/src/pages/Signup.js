import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Signup = ({ isDarkMode }) => {
  const [userType, setUserType] = useState("student"); // default selected
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      alert('Please fill name, email and password');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password, role: userType === 'admin' ? 'Admin' : 'Student' })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Signup failed' }));
        alert(err.message || 'Signup failed');
        setLoading(false);
        return;
      }

      const data = await res.json();
      // Save token and user to localStorage
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (e) {
      console.error('Signup error', e);
      alert('Network or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Poppins', sans-serif",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: isDarkMode ? "#121212" : "#F4F7F4",
        transition: "all 0.3s",
      }}
    >
      <style>
        {`
          .signup-container {
            background-color: ${isDarkMode ? "#1E1E1E" : "#fff"};
            padding: 50px;
            border-radius: 15px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
            transition: all 0.3s;
          }

          .signup-container h2 {
            text-align: center;
            margin-bottom: 30px;
            color: ${isDarkMode ? "#f1f1f1" : "#0B3D02"};
          }

          .signup-container input,
          .signup-container select {
            width: 100%;
            padding: 12px 15px;
            margin: 10px 0;
            border: 1px solid #0B3D02;
            border-radius: 8px;
            font-size: 16px;
            outline: none;
            transition: all 0.3s;
            background-color: ${isDarkMode ? "#222" : "#fff"};
            color: ${isDarkMode ? "#f1f1f1" : "#222"};
          }

          .signup-container input:focus,
          .signup-container select:focus {
            border-color: #1E8449;
            box-shadow: 0 0 5px #1E8449;
          }

          .signup-container button {
            width: 100%;
            padding: 12px;
            margin-top: 20px;
            background-color: #145A32;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
          }

          .signup-container button:hover {
            background-color: #1E8449;
          }

          .signup-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
            color: ${isDarkMode ? "#f1f1f1" : "#222"};
          }

          .signup-footer a {
            color: #1E8449;
            text-decoration: none;
            font-weight: bold;
          }

          .signup-footer a:hover {
            text-decoration: underline;
          }
        `}
      </style>

      <div className="signup-container">
  <h2>Sign Up</h2>
  <input value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="Full Name" />
  <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" />
  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" />
  <input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password" placeholder="Confirm Password" />

        {/* User Type Dropdown */}
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

  <button onClick={handleSignup} disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>

        <div className="signup-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
