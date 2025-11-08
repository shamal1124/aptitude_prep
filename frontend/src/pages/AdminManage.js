import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Navbar, Footer } from "./CommonUI";
import "../css/adminmanage.css"; // external css

const AdminManage = () => {
  const navigate = useNavigate();
  const [taskMessage, setTaskMessage] = useState("No actions performed yet.");
  const [showAddForm, setShowAddForm] = useState(false);

  const [showUpdateForm, setShowUpdateForm] = useState(false);

  // form fields (reuse same fields as Signup)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // fields for update form (separate from add-admin fields)
  const [updateName, setUpdateName] = useState("");
  const [updateEmail, setUpdateEmail] = useState("");
  const [updatePassword, setUpdatePassword] = useState("");
  const [updateConfirmPassword, setUpdateConfirmPassword] = useState("");

  const handleAddAdminClick = () => {
    // toggle the inline add-admin form
    setShowAddForm((s) => !s);
    setTaskMessage("Preparing to add an admin...");
  };

  const handleUpdateInfo = async () => {
    // toggle update form and prefill current user data if token present
    setShowUpdateForm((s) => !s);
    setTaskMessage("Preparing to update admin information...");

    // If showing, try to fetch current user
    if (!showUpdateForm) {
      const token = localStorage.getItem("token");
      if (!token) return; // nothing to prefill without token
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.user) {
          setUpdateName(data.user.name || "");
          setUpdateEmail(data.user.email || "");
        }
      } catch (e) {
        console.error("Failed to fetch current user", e);
      }
    }
  };

  const handleSubmitUpdate = async () => {
    if (!updateName.trim() || !updateEmail.trim()) {
      alert("Please fill name and email");
      return;
    }
    if (updatePassword) {
      if (updatePassword.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }
      if (updatePassword !== updateConfirmPassword) {
        alert("Passwords do not match");
        return;
      }
    }

    setUpdateLoading(true);
    try {
      const token = localStorage.getItem("token");
      const body = { name: updateName, email: updateEmail };
      if (updatePassword) body.password = updatePassword;

      const res = await fetch("http://localhost:5000/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let body;
        try {
          body = await res.json();
        } catch (e) {
          body = await res.text().catch(() => null);
        }
        console.error('Update failed', res.status, body);
        const msg = (body && (body.message || body.error)) || `Update failed (${res.status})`;
        alert(msg);
        setUpdateLoading(false);
        return;
      }

      const data = await res.json();
      setTaskMessage('✅ Information updated successfully!');
      setShowUpdateForm(false);

      // Update localStorage user if present
      if (data && data.user) localStorage.setItem('user', JSON.stringify(data.user));
    } catch (e) {
      console.error('Update error', e);
      alert('Network or server error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSubmitAddAdmin = async () => {
    if (!name.trim() || !email.trim() || !password) {
      alert("Please fill name, email and password");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, email, password, role: "Admin" }),
      });

      if (!res.ok) {
        let body;
        try {
          body = await res.json();
        } catch (e) {
          body = await res.text().catch(() => null);
        }
        console.error('Add admin failed', res.status, body);
        const msg = (body && (body.message || body.error)) || `Signup failed (${res.status})`;
        alert(msg);
        setLoading(false);
        return;
      }

      const data = await res.json();

      setTaskMessage("✅ Admin added successfully!");
      // clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowAddForm(false);

      // Optionally store or update UI - backend should now have the new user
      console.log("Add admin response:", data);
    } catch (e) {
      console.error("Add admin error", e);
      alert("Network or server error: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-manage-page">
      <Navbar />
      <div className="content">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => navigate('/admin-dashboard')} style={{ marginRight: 12 }}>← Back</button>
          <h1 style={{ margin: 0 }}>Admin Management</h1>
        </div>

        {/* Cards Section */}
        <div className="admin-cards-container">
          <div className="admin-card" onClick={handleAddAdminClick}>
            <h2>➕ Add Admin</h2>
            <p>Register a new admin user.</p>
          </div>

          <div className="admin-card" onClick={handleUpdateInfo}>
            <h2>🛠️ Update Information</h2>
            <p>Modify admin details or privileges.</p>
          </div>
        </div>

        {/* Inline Add Admin Form (shows when Add Admin clicked) */}
        {showAddForm && (
          <div className="add-admin-form" style={{ marginTop: 20 }}>
            <h3>Add Admin</h3>
            <div style={{ maxWidth: 420 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Full Name"
                style={{ width: "100%", padding: 10, marginBottom: 8 }}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                style={{ width: "100%", padding: 10, marginBottom: 8 }}
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                style={{ width: "100%", padding: 10, marginBottom: 8 }}
              />
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="Confirm Password"
                style={{ width: "100%", padding: 10, marginBottom: 12 }}
              />

              <button
                onClick={handleSubmitAddAdmin}
                disabled={loading}
                style={{ padding: 10, background: "#145A32", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                {loading ? "Adding..." : "Add Admin"}
              </button>
            </div>
          </div>
        )}

        {/* Inline Update Form (shows when Update Information clicked) */}
        {showUpdateForm && (
          <div className="update-admin-form" style={{ marginTop: 20 }}>
            <h3>Update Information</h3>
            <div style={{ maxWidth: 420 }}>
              <input
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                type="text"
                placeholder="Full Name"
                style={{ width: "100%", padding: 10, marginBottom: 8 }}
              />
              <input
                value={updateEmail}
                onChange={(e) => setUpdateEmail(e.target.value)}
                type="email"
                placeholder="Email"
                style={{ width: "100%", padding: 10, marginBottom: 8 }}
              />
              <input
                value={updatePassword}
                onChange={(e) => setUpdatePassword(e.target.value)}
                type="password"
                placeholder="New Password (leave blank to keep current)"
                style={{ width: "100%", padding: 10, marginBottom: 8 }}
              />
              <input
                value={updateConfirmPassword}
                onChange={(e) => setUpdateConfirmPassword(e.target.value)}
                type="password"
                placeholder="Confirm New Password"
                style={{ width: "100%", padding: 10, marginBottom: 12 }}
              />

              <button
                onClick={handleSubmitUpdate}
                disabled={updateLoading}
                style={{ padding: 10, background: "#145A32", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                {updateLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        )}

        {/* Task Display Section */}
        <div className="task-section">
          <h3>📝 Task Performed</h3>
          <p className="task-message">{taskMessage}</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminManage;
