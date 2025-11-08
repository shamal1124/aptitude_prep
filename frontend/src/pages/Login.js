import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/login.css"; // Import the external CSS file

const Login = ({ isDarkMode, toggleDarkMode }) => {
  const [userType, setUserType] = useState("student");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      alert('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: userType === 'admin' ? 'Admin' : 'Student' })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Login failed' }));
        alert(err.message || 'Login failed');
        setLoading(false);
        return;
      }

      const data = await res.json();
      // store token and user
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      // redirect based on returned role (prefer server role)
      const role = data.user && data.user.role ? data.user.role.toLowerCase() : userType;
      if (role === 'admin') navigate('/admin-dashboard');
      else navigate('/dashboard');
    } catch (e) {
      console.error('Login error', e);
      alert('Network or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`login-page ${isDarkMode ? "dark-mode" : ""}`}
    >
      <div className="login-container">
        <h2>Login</h2>
  <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" />
  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" />

        {/* User Type Dropdown */}
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

  <button onClick={handleLogin} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>

        <div className="login-footer">
          Don’t have an account? <Link to="/signup">Sign Up</Link>
        </div>

        {/* Dark Mode Toggle */}
        <div className="toggle-mode" onClick={toggleDarkMode}>
          {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </div>
      </div>
    </div>
  );
};

export default Login;
