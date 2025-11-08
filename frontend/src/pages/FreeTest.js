import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/freetest.css";

const FreeTest = () => {
  const [showTest, setShowTest] = useState(false); // controls test display
  const [showResult, setShowResult] = useState(false);
  const navigate = useNavigate();

  const dummyQuestions = [
    { question: "What is 2 + 2?", options: ["1", "2", "3", "4"] },
    { question: "Which is a programming language?", options: ["HTML", "CSS", "Python", "Photoshop"] },
    { question: "What color is the sky?", options: ["Blue", "Green", "Red", "Yellow"] },
    { question: "Select the correct spelling:", options: ["Recieve", "Receive", "Recive", "Receve"] },
    { question: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Venus"] },
    { question: "What is 5 * 5?", options: ["10", "15", "25", "30"] },
    { question: "Which animal is known as the King of Jungle?", options: ["Lion", "Tiger", "Elephant", "Leopard"] },
    { question: "Which is used to style web pages?", options: ["HTML", "CSS", "JavaScript", "Python"] },
    { question: "What is the capital of India?", options: ["Delhi", "Mumbai", "Kolkata", "Chennai"] },
    { question: "Which gas do plants release?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"] },
  ];

  const handleRestart = () => {
    setShowResult(false);
    const inputs = document.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => (input.checked = false));
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <div className="freetest-container">
      <h1>Free Test Module</h1>

      {/* Instructions Modal */}
      {!showTest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Instructions</h2>
            <ul style={{ textAlign: "left", marginTop: "15px" }}>
              <li>There are 10 questions in this test.</li>
              <li>Each question has multiple choice answers.</li>
              <li>Select the correct answer for each question.</li>
              <li>Marks are displayed after submitting the test.</li>
              <li>You can restart the test or go back home after submission.</li>
            </ul>
            <button
              className="restart-btn"
              style={{ marginTop: "20px" }}
              onClick={() => setShowTest(true)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Test Questions */}
      {showTest && (
        <>
          {dummyQuestions.map((q, idx) => (
            <div className="question-card" key={idx}>
              <p className="question">{idx + 1}. {q.question}</p>
              <div className="options">
                {q.options.map((opt, i) => (
                  <label key={i}>
                    <input type="radio" name={`q${idx}`} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {!showResult && (
            <button className="submit-btn" onClick={() => setShowResult(true)}>
              Submit
            </button>
          )}

          {/* Result Modal */}
          {showResult && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Your Marks: 7 / 10</h2> {/* Dummy mark */}
                <div className="modal-buttons">
                  <button className="restart-btn" onClick={handleRestart}>
                    Restart
                  </button>
                  <button className="home-btn" onClick={handleHome}>
                    Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FreeTest;
