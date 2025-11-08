import React, { useState, useEffect } from "react";
import { Navbar, Footer } from "./CommonUI";
import "../css/admindashboard.css";
import AdminManage from "./AdminManage";
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ for user search

  // load authenticated user from /api/auth/me if token present
  const [authUser, setAuthUser] = React.useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isLoggedIn = !!token;

  // fallback: read user object from localStorage (saved at login)
  const storedLocalUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedLocalUser = storedLocalUser ? JSON.parse(storedLocalUser) : null;

  React.useEffect(() => {
    let mounted = true;
    const fetchMe = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.warn('Could not fetch /me', res.status);
          return;
        }
        const data = await res.json();
        if (mounted && data && data.user) setAuthUser(data.user);
      } catch (e) {
        console.error('fetchMe error', e);
      }
    };
    fetchMe();
    return () => (mounted = false);
  }, [token]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const navigate = useNavigate();

  // State for real data
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  React.useEffect(() => {
    // Fetch total students
    fetch('http://localhost:5000/api/users/count/students')
      .then(res => res.json())
      .then(data => setTotalUsers(data.count || 0))
      .catch(() => setTotalUsers(0));
    // Fetch total questions
    fetch('http://localhost:5000/api/questions/count')
      .then(res => res.json())
      .then(data => setTotalQuestions(data.count || 0))
      .catch(() => setTotalQuestions(0));
  }, []);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  // Fetch questions from backend
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/questions');
      if (!res.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await res.json();
      
      // Debug log
      console.log('Fetched questions:', data);
      
      // Validate that we're getting questions with _id
      if (data && data.length > 0 && !data[0]._id) {
        console.error('Questions are missing _id property:', data);
      }
      
      setQuestions(data);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Handle delete question
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/questions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete question');
      }

      // Refresh questions list
      fetchQuestions();
      alert('Question deleted successfully');
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question. Please try again.');
    }
  };

  // Handle edit question
  const handleEdit = (question) => {
    console.log('Editing question:', question);
    if (!question._id) {
      console.error('Question is missing _id:', question);
      alert('Cannot edit this question - missing ID');
      return;
    }
    setEditingQuestion(question);
  };

  // Handle update question
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to update questions');
        return;
      }

      // Debug logs
      console.log('Question being edited:', editingQuestion);
      console.log('Update URL:', `http://localhost:5000/api/questions/${editingQuestion._id}`);
      console.log('Updating question with data:', {
        id: editingQuestion._id,
        text: editingQuestion.text,
        options: editingQuestion.options,
        correctAnswer: editingQuestion.correctAnswer,
        category: editingQuestion.category,
        explanation: editingQuestion.explanation
      });

      // Make sure we have an _id
      if (!editingQuestion._id) {
        throw new Error('Question ID is missing');
      }

      // Make API request with debugged request data
      const requestBody = {
        text: editingQuestion.text?.trim(),
        options: editingQuestion.options,
        correctAnswer: editingQuestion.correctAnswer,
        category: editingQuestion.category
      };
      console.log('Making update request with data:', requestBody);

      // Use either _id (from Mongo) or id (if transformed somewhere) as a fallback
      const questionId = editingQuestion._id || editingQuestion.id || null;
      console.log('Using question id for update:', questionId);
      if (!questionId) {
        throw new Error('Question ID is missing; cannot update');
      }

      const url = `http://localhost:5000/api/questions/${questionId}`;
      console.log('Update URL:', url);

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        // include id again in the body as a safeguard for debugging
        body: JSON.stringify({
          id: questionId,
          ...requestBody
        })
      });

      // If request fails, attempt to read and log the response body for diagnosis
      if (!res.ok) {
        const respText = await res.text().catch(() => null);
        console.error('Update request failed. Status:', res.status, 'Response body:', respText);
        // try to parse JSON if possible to extract message
        let parsed = null;
        try { parsed = JSON.parse(respText); } catch (e) { /* not JSON */ }
        throw new Error(parsed?.message || `Failed to update question. Status: ${res.status}`);
      }

      if (!res.ok) {
        // Try to get detailed error message from response
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to update question. Status: ${res.status}`);
      }

      // Refresh questions list and close edit modal
      setEditingQuestion(null);
      fetchQuestions();
      alert('Question updated successfully');
    } catch (err) {
      console.error('Error updating question:', err);
      alert(err.message || 'Failed to update question. Please try again.');
    }
  };

  // State for user management
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState(null);

  // Fetch all users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setUserError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Debug info
        const apiUrl = 'http://localhost:5000/api/users';
        console.log('Fetching users from:', apiUrl);
        
        // Test server connectivity first
        try {
          const testRes = await fetch('http://localhost:5000/api/test');
          if (!testRes.ok) {
            throw new Error('Cannot connect to server');
          }
        } catch (e) {
          console.error('Server connectivity test failed:', e);
          throw new Error('Cannot connect to server. Please check if the backend server is running.');
        }
        
        // Make request with full debugging
        const requestOptions = {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        console.log('Making request with options:', {
          url: apiUrl,
          method: requestOptions.method,
          headers: Object.keys(requestOptions.headers)
        });
        
        const res = await fetch(apiUrl, requestOptions);
        
        // Detailed error handling
        if (!res.ok) {
          let errorMessage = `Server error: ${res.status}`;
          try {
            const errorText = await res.text();
            console.error('Error response:', errorText);
            
            // Try to parse as JSON
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch (e) {
            console.error('Could not parse error response');
          }
          throw new Error(errorMessage);
        }
        
        const data = await res.json();
        console.log('Successfully fetched users:', {
          count: data?.length || 0,
          sample: data?.[0] ? { 
            id: data[0]._id,
            role: data[0].role 
          } : null
        });
        
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error in fetchUsers:', err);
        setUserError(err.message || 'Failed to load users. Please try again later.');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const [questionSearchTerm, setQuestionSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Filter questions based on search and category
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = questionSearchTerm.trim() === "" || 
      q.text.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
      q.options.some(opt => opt.toLowerCase().includes(questionSearchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || q.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get current page of questions
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [questionSearchTerm, selectedCategory]);

  // Handle page changes
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      {/* Navbar */}
      <Navbar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isLoggedIn={isLoggedIn}
      />

      <div className="main-section">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? "Close" : "≡"}
          </button>

          {sidebarOpen && (
            <div className="sidebar-content">
              <h4>Profile</h4>
              <p><strong>Name:</strong> {authUser ? authUser.name : (parsedLocalUser ? parsedLocalUser.name : 'Admin Name')}</p>
              <p><strong>Email:</strong> {authUser ? authUser.email : (parsedLocalUser ? parsedLocalUser.email : 'admin@example.com')}</p>
              <p><strong>Role:</strong> {authUser ? authUser.role : (parsedLocalUser ? parsedLocalUser.role : 'Admin')}</p>
              <button
                className="manage-admin-btn"
                onClick={() => navigate('/AdminManage')}
              >
                MANAGE ADMIN
              </button>
              <button
                className="add-question-btn"
                style={{ marginTop: '10px', backgroundColor: '#145A32', color: 'white', padding: '8px 12px', borderRadius: 6, border: 'none' }}
                onClick={() => navigate('/add-question')}
              >
                ADD QUESTION
              </button>
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          <h1>Admin Dashboard</h1>
          <p>Welcome, Admin! Here you can manage users, view reports, and handle system settings.</p>

          {/* Overview */}
          <section className="overview-section">
            <h2>Overview Dashboard</h2>
            <div className="overview-cards">
              <div className="card">
                <h3>Total Users Registered</h3>
                <p>{totalUsers}</p>
              </div>
              <div className="card">
                <h3>Total Questions</h3>
                <p>{totalQuestions}</p>
              </div>
            </div>
          </section>

          {/* Question Management */}
          <section className="management-section">
            <h2>Question Management</h2>

            {/* Search and Filter Controls */}
            <div style={{ 
              marginBottom: '20px', 
              display: 'flex', 
              gap: '20px', 
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Search Box */}
              <div style={{ flex: '1', minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search questions by text or options..."
                  value={questionSearchTerm}
                  onChange={(e) => setQuestionSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    minWidth: '150px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="All">All Categories</option>
                  <option value="Quantitative">Quantitative</option>
                  <option value="Reasoning">Reasoning</option>
                  <option value="Verbal">Verbal</option>
                </select>
              </div>

              {/* Results Count */}
              <div style={{ 
                marginLeft: 'auto', 
                color: '#666',
                fontSize: '14px'
              }}>
                Showing {currentQuestions.length} of {filteredQuestions.length} questions
                {filteredQuestions.length !== questions.length && ` (filtered from ${questions.length} total)`}
              </div>
            </div>

            <div className="table-wrapper">
              <table className="question-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Option A</th>
                    <th>Option B</th>
                    <th>Option C</th>
                    <th>Option D</th>
                    <th>Correct</th>
                    <th>Category</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                        Loading questions...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: "center", padding: "20px", color: "red" }}>
                        {error}
                      </td>
                    </tr>
                  ) : questions.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                        No questions available. Add some questions using the Add Question section.
                      </td>
                    </tr>
                  ) : (
                    currentQuestions.map((q, index) => (
                      <tr key={q._id}>
                        <td>{(currentPage - 1) * questionsPerPage + index + 1}</td>
                        <td>{q.text}</td>
                        <td>{q.options[0]}</td>
                        <td>{q.options[1]}</td>
                        <td>{q.options[2]}</td>
                        <td>{q.options[3]}</td>
                          <td>
                            {(() => {
                              const letters = ['A', 'B', 'C', 'D'];
                              const idx = Array.isArray(q.options) ? q.options.indexOf(q.correctAnswer) : -1;
                              return idx >= 0 ? letters[idx] : q.correctAnswer;
                            })()}
                          </td>
                        <td>{q.category}</td>
                        <td><button className="edit-btn" onClick={() => handleEdit(q)}>Edit</button></td>
                        <td><button className="delete-btn" onClick={() => handleDelete(q._id)}>Delete</button></td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>

            {/* Pagination */}
            {questions.length > questionsPerPage && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '15px', 
                marginTop: '20px',
                marginBottom: '20px' 
              }}>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="edit-btn"
                  style={{
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>

                <span style={{ fontSize: '16px' }}>
                  Page {currentPage} of {Math.ceil(questions.length / questionsPerPage)}
                </span>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(questions.length / questionsPerPage)}
                  className="edit-btn"
                  style={{
                    opacity: currentPage >= Math.ceil(questions.length / questionsPerPage) ? 0.5 : 1,
                    cursor: currentPage >= Math.ceil(questions.length / questionsPerPage) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>          {/* Edit Question Modal */}
          {editingQuestion && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                <h2>Edit Question</h2>
                <form onSubmit={handleUpdate}>
                  <div style={{ marginBottom: '15px' }}>
                    <label>Question Text:</label>
                    <textarea
                      value={editingQuestion.text}
                      onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                      required
                      rows="3"
                      style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label>Options:</label>
                    {editingQuestion.options.map((option, index) => (
                      <input
                        key={index}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...editingQuestion.options];
                          newOptions[index] = e.target.value;
                          // If current correctAnswer is no longer present in the options, reset it to first option
                          let newCorrect = editingQuestion.correctAnswer;
                          if (!newOptions.includes(newCorrect)) {
                            newCorrect = newOptions[0] || '';
                          }
                          setEditingQuestion({...editingQuestion, options: newOptions, correctAnswer: newCorrect});
                        }}
                        placeholder={`Option ${index + 1}`}
                        required
                        style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                      />
                    ))}
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>Correct Answer:</label>
                    <select
                      value={editingQuestion.correctAnswer}
                      onChange={(e) => setEditingQuestion({...editingQuestion, correctAnswer: e.target.value})}
                      style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                    >
                      {editingQuestion.options.map((option, index) => (
                        <option key={index} value={option}>{`${['A','B','C','D'][index] || ''}) ${option}`}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>Category:</label>
                    <select
                      value={editingQuestion.category}
                      onChange={(e) => setEditingQuestion({...editingQuestion, category: e.target.value})}
                      style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                    >
                      <option value="Quantitative">Quantitative</option>
                      <option value="Reasoning">Reasoning</option>
                      <option value="Verbal">Verbal</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="delete-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="edit-btn"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 👥 User Management */}
          <section className="management-section" style={{ marginTop: "40px" }}>
            <h2>User Management</h2>

            {/* ✅ Search Box */}
            <div style={{ marginBottom: "15px" }}>
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px",
                  width: "300px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div className="table-wrapper">
              <table className="question-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                        Loading students...
                      </td>
                    </tr>
                  ) : userError ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "red" }}>
                        {userError}
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user._id}>
                        <td>{index + 1}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: user.role === 'Admin' ? '#e3fcef' : '#ffe9e9',
                            color: user.role === 'Admin' ? '#0d9f4f' : '#ff4d4d'
                          }}>
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminDashboard;
