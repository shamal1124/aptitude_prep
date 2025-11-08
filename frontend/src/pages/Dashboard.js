import React, { useState, useEffect } from "react";
import { Navbar, Footer } from "./CommonUI";
import "../css/dashboard.css";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ isDarkMode, toggleDarkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recordPage, setRecordPage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate(); // Initialize navigate

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token - skip fetching leaderboard');
          return;
        }

        const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/results/leaderboard`;
        const res = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          console.warn('Could not fetch leaderboard:', res.status);
          return;
        }

        const data = await res.json();
        // Add rank to each entry
        const rankedData = data.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          score: `${entry.score}%`
        }));
        setLeaderboard(rankedData);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    fetchLeaderboard();
  }, []);  // Only fetch once on component mount

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setEditForm({
        name: userData.name || '',
        email: userData.email || '',
        password: ''
      });
    }
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    // Reset form to current user data
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        password: ''
      });
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Only include fields that have been changed
      const updates = {};
      if (editForm.name !== user.name) updates.name = editForm.name;
      if (editForm.email !== user.email) updates.email = editForm.email;
      if (editForm.password) updates.password = editForm.password;

      const res = await fetch('http://localhost:5000/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Update failed');
      }

      const data = await res.json();
      
      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const [pastRecords, setPastRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fetchingRecords, setFetchingRecords] = useState(false);

  // Fetch exam history
  useEffect(() => {
    const fetchExamHistory = async () => {
      setFetchingRecords(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token - skip fetching exam history');
          return;
        }

        console.log('Fetching exam history for page:', recordPage);
        const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/results/me/history?page=${recordPage}&limit=5`;
        console.log('API URL:', apiUrl);

        const res = await fetch(apiUrl, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          console.warn('Could not fetch exam history:', res.status);
          const errorText = await res.text();
          console.warn('Error response:', errorText);
          return;
        }

        const data = await res.json();
        console.log('Received data:', data);

        if (data && Array.isArray(data.results)) {
          const formattedRecords = data.results.map(r => ({
            date: r.date,
            score: typeof r.score === 'number' ? r.score.toString() : '0'  // Remove % and show raw score
          }));
          console.log('Formatted records:', formattedRecords);
          setPastRecords(formattedRecords);
          setTotalRecords(data.total || 0);

          // If we're on the first page, update last 5 exams data
          if (recordPage === 0) {
            const last5 = data.results.slice(0, 5).map(r => ({
              day: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              percentage: Math.round((r.score / 30) * 100) // Convert score to percentage
            }));
            setLast5Exams(last5);
          }
        } else {
          console.warn('Unexpected data format:', data);
          setPastRecords([]);
          setTotalRecords(0);
        }
      } catch (err) {
        console.error('Error fetching exam history:', err);
        setPastRecords([]);
        setTotalRecords(0);
      } finally {
        setFetchingRecords(false);
      }
    };

    fetchExamHistory();
  }, [recordPage]);

  const [last5Exams, setLast5Exams] = useState([]);

  const [averageMarksState, setAverageMarksState] = useState(0);
  const [totalDaysActiveState, setTotalDaysActiveState] = useState(null);
  const [totalAttemptsState, setTotalAttemptsState] = useState(null);
  const [positionState, setPositionState] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch user stats (attempts, daysActive, position)
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token - skip fetching stats');
          return;
        }

        const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/results/me/stats`;
        console.log('Fetching stats from:', apiUrl);

        const res = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Stats fetch failed:', res.status, errorText);
          return;
        }

        const data = await res.json();
        console.log('Fetched stats:', data);

        // Check if we have valid data and update state accordingly
        if (data) {
          const attempts = typeof data.attempts === 'number' ? data.attempts : 0;
          const daysActive = typeof data.daysActive === 'number' ? data.daysActive : 0;
          const avgScore = typeof data.averageScore === 'number' ? data.averageScore : 0;
          const position = data.position ? (data.totalUsers ? `${data.position} / ${data.totalUsers}` : `${data.position}`) : '—';

          console.log('Processed stats:', { attempts, daysActive, avgScore, position });

          setTotalAttemptsState(attempts);
          setTotalDaysActiveState(daysActive);
          setPositionState(position);
          setAverageMarksState(avgScore);
        }
      } catch (e) {
        console.error('fetchStats error', e);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className={`dashboard-page ${isDarkMode ? "dark-mode" : ""}`}>
      <Navbar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isLoggedIn={true}
      />

      <div className="dashboard-container">
        {/* SIDEBAR */}
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? "Close" : "≡"}
          </button>

          {sidebarOpen && (
            <div className="sidebar-content">
              <h4>Profile</h4>
              {!isEditing ? (
                <>
                  <p><strong>Name:</strong> {user?.name || 'Loading...'}</p>
                  <p><strong>Email:</strong> {user?.email || 'Loading...'}</p>
                  <p><strong>Role:</strong> {user?.role || 'Student'}</p>
                  <button
                    onClick={handleEdit}
                    style={{
                      backgroundColor: '#1E8449',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '10px',
                      width: '100%'
                    }}
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <div className="edit-profile-form">
                  <input
                    type="text"
                    placeholder="Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                  />
                  <input
                    type="password"
                    placeholder="New Password (optional)"
                    value={editForm.password}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                  />
                  {error && (
                    <div style={{ color: 'red', marginBottom: '8px', fontSize: '14px' }}>
                      {error}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleUpdate}
                      disabled={loading}
                      style={{
                        backgroundColor: '#1E8449',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      {loading ? 'Updating...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
          <div className="dashboard-header">
            <h2>Dashboard</h2>
            <button 
              className="start-exam-btn"
              onClick={() => navigate("/exam")} // Start Exam button
            >
              Start Exam
            </button>
          </div>

          {/* SUMMARY CARDS */}
          <div className="summary-cards">
            {[
              { title: "Total Attempts", value: isLoadingStats ? 'Loading...' : (totalAttemptsState ?? 0) },
              { title: "Total Days Active", value: isLoadingStats ? 'Loading...' : (totalDaysActiveState ?? 0) },
              { title: "Position", value: isLoadingStats ? 'Loading...' : (positionState || '—') },
            ].map((card, idx) => (
              <div key={idx} className="summary-card">
                <div className="card-title">{card.title}</div>
                <div className="card-value">{card.value}</div>
              </div>
            ))}
          </div>

          {/* PAST EXAM RECORDS */}
          <div className="past-records">
            <h3>Past Exam Records</h3>
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {fetchingRecords ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center' }}>Loading...</td>
                  </tr>
                ) : pastRecords.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center' }}>No exam records found</td>
                  </tr>
                ) : pastRecords.map((record, idx) => (
                  <tr key={idx}>
                    <td>{recordPage * 5 + idx + 1}</td>
                    <td>{record.date}</td>
                    <td>{record.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="record-buttons">
              <button
                onClick={() => setRecordPage((prev) => Math.max(prev - 1, 0))}
                disabled={recordPage === 0 || fetchingRecords}
                style={{
                  padding: '8px 16px',
                  margin: '0 8px',
                  cursor: recordPage === 0 || fetchingRecords ? 'not-allowed' : 'pointer',
                  opacity: recordPage === 0 || fetchingRecords ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <span style={{ margin: '0 16px' }}>
                Page {recordPage + 1} / {Math.max(1, Math.ceil(totalRecords / 5))}
              </span>
              <button
                onClick={() => setRecordPage((prev) => prev + 1)}
                disabled={(recordPage + 1) * 5 >= totalRecords || fetchingRecords}
                style={{
                  padding: '8px 16px',
                  margin: '0 8px',
                  cursor: (recordPage + 1) * 5 >= totalRecords || fetchingRecords ? 'not-allowed' : 'pointer',
                  opacity: (recordPage + 1) * 5 >= totalRecords || fetchingRecords ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>

          {/* PIE CHART */}
          <div className="average-pie-chart">
            <div
              className="pie-circle"
              style={{
                background: totalAttemptsState > 0 
                  ? `conic-gradient(#800080 0% ${averageMarksState}%, #000000ff ${averageMarksState}% 100%)`
                  : '#000000ff',
                color: "#efd6ffff", // Light purple for text inside pie
              }}
            >
              {totalAttemptsState > 0 ? `${averageMarksState}%` : 'No Data'}
            </div>
            <div className="pie-description">
              {totalAttemptsState > 0 ? (
                <>This pie chart represents your <strong>average percentage</strong> across {totalAttemptsState} attempted exam{totalAttemptsState !== 1 ? 's' : ''} (based on correct answers out of 30 questions).</>
              ) : (
                <>Complete your first exam to see your average performance here.</>
              )}
            </div>
          </div>

          {/* LAST 5 EXAMS PERFORMANCE */}
          <div className="last-5-exams">
            <h3>Last 5 Exams Performance</h3>
            <div className="bar-chart">
              <div className="y-axis">
                {[100, 75, 50, 25, 0].map((val, idx) => (
                  <span key={idx}>{val}%</span>
                ))}
              </div>
              <div className="bars" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', // Changed to space-between for maximum spacing
                alignItems: 'flex-end', 
                height: '150px',
                padding: '0 80px', // Increased padding for more space on sides
                width: '100%' // Ensure full width
              }}>
                {fetchingRecords ? (
                  <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
                    Loading...
                  </div>
                ) : last5Exams.length === 0 ? (
                  <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
                    No exam records available
                  </div>
                ) : (
                  last5Exams.map((exam, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      width: '20px' // Thinner bars for better proportion with maximum spacing
                    }}>
                      <div
                        style={{ 
                          height: `${exam.percentage * 1.5}px`,
                          backgroundColor: '#800080',
                          width: '100%',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                          transition: 'height 0.3s ease'
                        }}
                      >
                        <span style={{ 
                          position: 'absolute',
                          top: '-25px',
                          width: '100%',
                          textAlign: 'center',
                          color: '#000'
                        }}>{exam.percentage}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* LEADERBOARD */}
          <div className="leaderboard">
            <h3>Leaderboard (Top 5)</h3>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeaderboard ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                      Loading leaderboard...
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item) => (
                    <tr key={item.rank} style={user && item.name === user.name ? { backgroundColor: 'rgba(128, 0, 128, 0.1)' } : {}}>
                      <td>{item.rank}</td>
                      <td>{item.name}</td>
                      <td>{item.score}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
