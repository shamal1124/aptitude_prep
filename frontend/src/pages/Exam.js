import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/exam.css";

const BACKEND = "http://localhost:5000";

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const Exam = () => {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(true);
  const [questions, setQuestions] = useState([]); // 30 questions for this exam
  const [selected, setSelected] = useState([]); // user's selected answers (strings)
  const [showQuestions, setShowQuestions] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // default 30 minutes
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch questions from backend on mount
  useEffect(() => {
    let mounted = true;
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/questions`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();

        if (!mounted) return;

        // Group by category
        const byCategory = { Reasoning: [], Quantitative: [], Verbal: [] };
        data.forEach((q) => {
          const cat = q.category || 'General';
          if (/reason/i.test(cat)) byCategory.Reasoning.push(q);
          else if (/quant/i.test(cat)) byCategory.Quantitative.push(q);
          else if (/verb/i.test(cat)) byCategory.Verbal.push(q);
        });

        // pick exactly n items from arr; if arr has fewer than n, fill remaining from `all` pool
        const pickN = (arr, all, n) => {
          const res = [];
          const src = Array.isArray(arr) ? shuffleArray(arr) : [];
          // take unique from category first
          for (let i = 0; i < Math.min(n, src.length); i++) res.push(src[i]);
          if (res.length === n) return res;
          // need more: pick from `all` pool excluding already picked ids
          const allShuffled = shuffleArray(all || []);
          const pickedIds = new Set(res.map((it) => it._id || it.id));
          for (let i = 0; i < allShuffled.length && res.length < n; i++) {
            const cand = allShuffled[i];
            const cid = cand._id || cand.id;
            if (!pickedIds.has(cid)) {
              res.push(cand);
              pickedIds.add(cid);
            }
          }
          // If still short (very small DB), allow sampling with replacement from all
          while (res.length < n) {
            const idx = Math.floor(Math.random() * (all.length || 1));
            res.push(all[idx]);
          }
          return res;
        };

        const allQuestions = data;
        const r = pickN(byCategory.Reasoning, allQuestions, 10);
        const q = pickN(byCategory.Quantitative, allQuestions, 10);
        const v = pickN(byCategory.Verbal, allQuestions, 10);

        console.log('[Exam] counts:', {
          totalReturned: data.length,
          reasoning: byCategory.Reasoning.length,
          quantitative: byCategory.Quantitative.length,
          verbal: byCategory.Verbal.length,
          picked: { r: r.length, q: q.length, v: v.length }
        });

        const combined = shuffleArray([...r, ...q, ...v]).map((it) => ({
          id: it._id || Math.random().toString(36).slice(2, 9),
          text: it.text || it.question || '',
          options: it.options || [],
          correctAnswer: it.correctAnswer || it.correct || null,
          explanation: it.explanation || '',
          category: it.category || '',
        }));

        setQuestions(combined);
        setSelected(new Array(combined.length).fill(null));
        setLoading(false);
      } catch (err) {
        console.error('Failed to load questions', err);
        setError(err.message || 'Failed to load questions');
        setLoading(false);
      }
    };
    fetchQuestions();
    return () => (mounted = false);
  }, []);

  // Timer countdown
  useEffect(() => {
    let timer;
    if (showQuestions && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (showQuestions && timeLeft === 0) {
      // auto submit when time up
      handleSubmit();
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuestions, timeLeft]);

  const startExam = () => {
    setShowInstructions(false);
    setShowQuestions(true);
    // reset timer to default 30 min
    setTimeLeft(1800);
  };

  const handleSelect = (qIndex, option) => {
    setSelected((prev) => {
      const copy = prev.slice();
      copy[qIndex] = option;
      return copy;
    });
  };

  const handleSubmit = () => {
    // compute results and attempt to save to backend
    const { score, details } = computeResults();

    // Prepare answers payload
    const answersPayload = details.map((d, idx) => ({ questionId: questions[idx].id || '', answer: d.selected || '' }));

    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found - result will not be saved');
        } else {
          const res = await fetch(`${BACKEND}/api/results`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ score, answers: answersPayload }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            console.warn('Saving result failed:', data);
          } else {
            console.log('Result saved successfully');
          }
        }
      } catch (err) {
        console.error('Error saving result:', err);
      } finally {
        setShowQuestions(false);
        setShowResult(true);
      }
    })();
  };

  const handleRestart = () => {
    // regenerate a new exam from already-fetched pool by re-running fetch
    setLoading(true);
    setShowResult(false);
    setShowInstructions(true);
    // refetch by forcing effect: simple approach - reload page or re-run fetch by re-mount; we'll re-run fetch by calling fetchQuestions inline
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/api/questions`);
        if (!res.ok) throw new Error(`Server ${res.status}`);
        const data = await res.json();
        const byCategory = { Reasoning: [], Quantitative: [], Verbal: [] };
        data.forEach((q) => {
          const cat = q.category || 'General';
          if (/reason/i.test(cat)) byCategory.Reasoning.push(q);
          else if (/quant/i.test(cat)) byCategory.Quantitative.push(q);
          else if (/verb/i.test(cat)) byCategory.Verbal.push(q);
        });
        // pick exactly n items from arr; if arr has fewer than n, fill remaining from `all` pool
        const pickN = (arr, all, n) => {
          const res = [];
          const src = Array.isArray(arr) ? shuffleArray(arr) : [];
          for (let i = 0; i < Math.min(n, src.length); i++) res.push(src[i]);
          if (res.length === n) return res;
          const allShuffled = shuffleArray(all || []);
          const pickedIds = new Set(res.map((it) => it._id || it.id));
          for (let i = 0; i < allShuffled.length && res.length < n; i++) {
            const cand = allShuffled[i];
            const cid = cand._id || cand.id;
            if (!pickedIds.has(cid)) {
              res.push(cand);
              pickedIds.add(cid);
            }
          }
          while (res.length < n) {
            const idx = Math.floor(Math.random() * (all.length || 1));
            res.push(all[idx]);
          }
          return res;
        };
        const allQuestions = data;
        const r = pickN(byCategory.Reasoning, allQuestions, 10);
        const q = pickN(byCategory.Quantitative, allQuestions, 10);
        const v = pickN(byCategory.Verbal, allQuestions, 10);
        console.log('[Exam restart] counts:', { totalReturned: data.length, reasoning: byCategory.Reasoning.length, quantitative: byCategory.Quantitative.length, verbal: byCategory.Verbal.length, picked: { r: r.length, q: q.length, v: v.length } });
        const combined = shuffleArray([...r, ...q, ...v]).map((it) => ({
          id: it._id || Math.random().toString(36).slice(2, 9),
          text: it.text || it.question || '',
          options: it.options || [],
          correctAnswer: it.correctAnswer || it.correct || null,
          explanation: it.explanation || '',
          category: it.category || '',
        }));
        setQuestions(combined);
        setSelected(new Array(combined.length).fill(null));
        setLoading(false);
      } catch (err) {
        console.error('Restart fetch failed', err);
        setError(err.message || 'Could not restart exam');
        setLoading(false);
      }
    })();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const computeResults = () => {
    let score = 0;
    const details = questions.map((q, idx) => {
      const userAns = selected[idx];
      const rawCorrect = q.correctAnswer;

      // Normalize correct answer: if stored as 'A'/'B'/'C'/'D' or index, map to actual option text
      let correct = rawCorrect;
      if (typeof rawCorrect === 'string') {
        const r = rawCorrect.trim();
        if (/^[ABCD]$/i.test(r) && Array.isArray(q.options) && q.options.length >= 1) {
          const idxChar = r.toUpperCase().charCodeAt(0) - 65; // A->0
          if (idxChar >= 0 && idxChar < q.options.length) correct = q.options[idxChar];
        } else if (/^\d+$/.test(r) && Array.isArray(q.options) && q.options.length > parseInt(r, 10)) {
          // numeric index stored as string
          correct = q.options[parseInt(r, 10)];
        }
      }

      const isCorrect = userAns != null && String(userAns).trim() === String(correct).trim();
      if (isCorrect) score += 1;
      return {
        question: q.text,
        options: q.options,
        selected: userAns,
        correctAnswer: correct,
        explanation: q.explanation,
        isCorrect,
        category: q.category,
      };
    });
    return { score, details };
  };

  // Render
  if (loading) {
    return <div className="exam-container"><p>Loading questions...</p></div>;
  }

  if (error) {
    return <div className="exam-container"><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  return (
    <div className="exam-container">
      {/* Instructions modal */}
      {showInstructions && (
        <div className="popup instructions-popup">
          <h2>Instructions</h2>
          <ul style={{ textAlign: 'left' }}>
            <li>Total Questions: 30 (10 Reasoning, 10 Quantitative, 10 Verbal)</li>
            <li>Each question is multiple-choice (MCQ)</li>
            <li>There is a timer: {formatTime(timeLeft)} (defaults to 30:00)</li>
            <li>Click Submit to finish the exam early</li>
          </ul>
          <button className="ok-btn" onClick={startExam}>OK</button>
        </div>
      )}

      {/* Questions list */}
      {showQuestions && (
        <div className="questions-section">
          <div className="timer">Time Remaining: {formatTime(timeLeft)}</div>
          {questions.map((q, idx) => (
            <div key={q.id} className="question-card">
              <h4>{idx + 1}. {q.text}</h4>
              <div className="options">
                {q.options.map((opt, i) => {
                  const chosen = selected[idx] === opt;
                  return (
                    <button
                      key={i}
                      className="option-btn"
                      onClick={() => handleSelect(idx, opt)}
                      style={{ backgroundColor: chosen ? '#c6f6d5' : undefined }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button className="submit-btn" onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      )}

      {/* Result view */}
      {showResult && (
        <div className="popup result-popup" style={{ maxHeight: '85vh', overflowY: 'auto', width: '90%', maxWidth: 900 }}>
          <h2>Exam Result</h2>
          {(() => {
            const { score, details } = computeResults();
            return (
              <div>
                <p style={{ fontWeight: 'bold' }}>Score: {score} / {questions.length}</p>

                <div style={{ marginTop: 12 }}>
                  {details.map((d, idx) => (
                    <div key={idx} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                      <div style={{ fontWeight: '600' }}>{idx + 1}. {d.question}</div>
                      <div style={{ marginTop: 6 }}>
                        {d.options.map((opt, i) => {
                          const isUser = d.selected === opt;
                          const isCorrect = String(opt).trim() === String(d.correctAnswer).trim();
                          const bg = isCorrect ? '#d4ffd4' : isUser ? '#ffd4d4' : 'transparent';
                          return (
                            <div key={i} style={{ padding: '6px', background: bg, borderRadius: 6, marginBottom: 6 }}>
                              <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
                              {isCorrect && <span style={{ marginLeft: 8, color: '#0b6e0b', fontWeight: 600 }}>[Correct]</span>}
                              {isUser && !isCorrect && <span style={{ marginLeft: 8, color: '#b00020', fontWeight: 600 }}>[Your answer]</span>}
                            </div>
                          );
                        })}
                      </div>
                      {d.explanation && (
                        <div style={{ marginTop: 6, fontStyle: 'italic' }}>Explanation: {d.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="result-buttons" style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <button className="restart-btn" onClick={handleRestart}>Restart</button>
                  <button className="home-btn" onClick={() => navigate('/dashboard')}>Home</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Exam;
