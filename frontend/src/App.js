import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Exam from './pages/Exam';
import Result from './pages/Result';
import FreeTest from "./pages/FreeTest";
import AdminManage from './pages/AdminManage';
import AddQuestion from './pages/AddQuestion';

function App() {
  // Global dark mode state (persistent)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Get saved theme from localStorage (if any)
    const savedTheme = localStorage.getItem('isDarkMode');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  // Toggle dark mode and store it in localStorage
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => {
      localStorage.setItem('isDarkMode', JSON.stringify(!prevMode));
      return !prevMode;
    });
  };

  // Apply dark mode class to body for global effect
  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? '#121212' : '#f4f4f4';
    document.body.style.color = isDarkMode ? '#ffffff' : '#000000';
  }, [isDarkMode]);

  return (
    <Router>
      <Routes>
        {/* Home Page */}
        <Route
          path="/"
          element={<Home isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />

        {/* Auth Pages */}
        <Route
          path="/login"
          element={<Login isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/signup"
          element={<Signup isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />

        {/* User Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />

        <Route
          path="/add-question"
          element={<AddQuestion isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />

        {/* Exam Page */}
        <Route
          path="/exam"
          element={<Exam isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />

        {/* Result Page */}
        <Route
          path="/result"
          element={<Result isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route path="/exam" element={<Exam />} />
        <Route path="/freetest" element={<FreeTest />} />
        <Route path="/AdminManage" element={<AdminManage />} />
        {/* <-- add this */}
        {/* Redirect unknown routes to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
