import React from "react";
import { Link, useNavigate } from "react-router-dom";


// Navbar Component
export const Navbar = ({ isDarkMode, toggleDarkMode, isLoggedIn }) => {
  const navigate = useNavigate();

  const handleAuthButton = () => {
    if (isLoggedIn) {
      // perform logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
      window.location.reload();
    } else {
      navigate('/login');
    }
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: isDarkMode ? "#09400B" : "#0B3D02",
        padding: "15px 50px",
        color: "white",
        boxShadow: isDarkMode
          ? "0 4px 8px rgba(0,0,0,0.4)"
          : "0 2px 5px rgba(0,0,0,0.3)",
        transition: "all 0.3s",
      }}
    >
      <h2 style={{ margin: 0 }}>Aptitude Preparation</h2>
      <div style={{ display: "flex", gap: "10px" }}>
<button
  type="button" // <-- important
  onClick={() => navigate("/freetest")}
  style={{
    backgroundColor: "#FFD700",
    color: "#0B3D02",
    border: "none",
    padding: "8px 18px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Free Trial
</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleAuthButton}
          style={{
            backgroundColor: "white",
            color: "#0B3D02",
            border: "none",
            padding: "8px 18px",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isLoggedIn ? "Logout" : "Login"}
        </button>
        </div>
        <button
          onClick={toggleDarkMode}
          style={{
            marginLeft: "10px",
            border: "none",
            padding: "8px 15px",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            backgroundColor: isDarkMode ? "#FFA500" : "#222",
            color: isDarkMode ? "#222" : "#fff",
          }}
        >
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </nav>
  );
};

// Footer Component
export const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "#0B3D02",
        color: "white",
        textAlign: "center",
        padding: "20px 10px",
        fontSize: "16px",
        boxShadow: "0 -2px 5px rgba(0,0,0,0.3)",
      }}
    >
      © {new Date().getFullYear()} Aptitude Preparation | Designed with ❤️ by
      Shamal
    </footer>
  );
};
