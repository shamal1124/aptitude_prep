import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Footer } from './CommonUI';
import '../css/adminmanage.css';

const BACKEND = 'http://localhost:5000';

const AddQuestion = ({ isDarkMode, toggleDarkMode }) => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('single'); // 'single' or 'bulk'

  // single question state
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correct, setCorrect] = useState('A');
  const [category, setCategory] = useState('Quantitative');
  const [explanation, setExplanation] = useState('');

  // bulk & file state
  const [bulkText, setBulkText] = useState('');
  const [fileRows, setFileRows] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [parsingError, setParsingError] = useState('');
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);

  // Single submit
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        question,
        options: [optionA, optionB, optionC, optionD],
        correct,
        category,
        explanation,
      };
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BACKEND}/api/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create question');
      }
      await res.json();
      alert('Question saved to database');
      // clear
      setQuestion('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrect('A');
      setCategory('Quantitative');
      setExplanation('');
    } catch (err) {
      console.error('single submit error', err);
      alert('Error: ' + (err.message || 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  // Bulk textarea submission (JSON array or pipe-separated lines)
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let arr = [];
      const trimmed = bulkText.trim();
      if (!trimmed) {
        alert('Please paste some bulk data or use file upload');
        setLoading(false);
        return;
      }
      if (trimmed.startsWith('[')) {
        arr = JSON.parse(trimmed);
      } else {
        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
        arr = lines.map((ln) => {
          const parts = ln.split('|');
          return {
            question: parts[0] || '',
            options: [parts[1] || '', parts[2] || '', parts[3] || '', parts[4] || ''],
            correct: parts[5] || 'A',
            category: parts[6] || 'General',
            explanation: parts[7] || '',
          };
        });
      }

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BACKEND}/api/questions/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questions: arr }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Bulk upload failed');
      }
      const data = await res.json();
      alert(`Bulk upload complete. Inserted: ${data.insertedCount || 0}`);
      setBulkText('');
      setFileRows([]);
      setFileHeaders([]);
      setMapping({});
    } catch (err) {
      console.error('bulk submit error', err);
      alert('Error: ' + (err.message || 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  // File input parsing using xlsx dynamic import
  const handleFileInput = async (e) => {
    setParsingError('');
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    try {
      const buf = await f.arrayBuffer();
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buf, { type: 'array' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!data || data.length === 0) {
        setParsingError('No rows found in the selected sheet');
        return;
      }
      setFileRows(data);
      setFileHeaders(Object.keys(data[0]));

      // auto-map headers
      const lower = (s) => (s || '').toString().toLowerCase();
      const auto = {};
      for (const h of Object.keys(data[0])) {
        const lh = lower(h);
        if (!auto.question && (lh.includes('question') || lh.includes('q') || lh.includes('text'))) { auto.question = h; continue; }
        if (!auto.optionA && (lh.includes('optiona') || lh.includes('option a') || lh === 'a')) { auto.optionA = h; continue; }
        if (!auto.optionB && (lh.includes('optionb') || lh.includes('option b') || lh === 'b')) { auto.optionB = h; continue; }
        if (!auto.optionC && (lh.includes('optionc') || lh.includes('option c') || lh === 'c')) { auto.optionC = h; continue; }
        if (!auto.optionD && (lh.includes('optiond') || lh.includes('option d') || lh === 'd')) { auto.optionD = h; continue; }
        if (!auto.options && (lh.includes('options') && !lh.includes('optiona'))) { auto.options = h; continue; }
        if (!auto.correct && (lh.includes('correct') || lh.includes('answer') || lh.includes('ans'))) { auto.correct = h; continue; }
        if (!auto.category && lh.includes('category')) { auto.category = h; continue; }
        if (!auto.difficulty && lh.includes('difficulty')) { auto.difficulty = h; continue; }
        if (!auto.explanation && lh.includes('explanation')) { auto.explanation = h; continue; }
      }
      setMapping(auto);
    } catch (err) {
      console.error('parse file error', err);
      setParsingError('Failed to parse file. Install `xlsx` in frontend: npm i xlsx');
    }
  };

  // Create a small preview of mapped rows (first 20)
  const mappedPreview = useMemo(() => {
    if (!fileRows || fileRows.length === 0) return [];
    if (!mapping || !mapping.question) return [];
    return fileRows.slice(0, 20).map((r) => {
      const get = (k) => (mapping[k] ? r[mapping[k]] : '');
      const opts = mapping.options
        ? ('' + (r[mapping.options] || '')).toString().split(/\|\||\|/).map((s) => s.trim()).filter(Boolean)
        : [get('optionA'), get('optionB'), get('optionC'), get('optionD')];
      return {
        question: get('question'),
        options: opts,
        correct: get('correct'),
        category: get('category'),
        difficulty: get('difficulty'),
        explanation: get('explanation'),
      };
    });
  }, [fileRows, mapping]);

  // Upload mapped rows (bulk file -> array)
  const uploadMapped = async () => {
    if (!fileRows || fileRows.length === 0) {
      alert('No parsed rows to upload');
      return;
    }
    if (!mapping || !mapping.question) {
      alert('Please map at least the Question column');
      return;
    }

    const arr = fileRows.map((r) => {
      const get = (k) => (mapping[k] ? r[mapping[k]] : '');
      const options = mapping.options
        ? ('' + (r[mapping.options] || '')).toString().split(/\|\||\|/).map((s) => s.trim()).slice(0, 4)
        : [get('optionA'), get('optionB'), get('optionC'), get('optionD')];
      return {
        question: get('question') || '',
        options,
        correct: get('correct') || '',
        category: get('category') || 'General',
        difficulty: get('difficulty') || 'Medium',
        explanation: get('explanation') || '',
      };
    });

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BACKEND}/api/questions/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questions: arr }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Bulk upload failed');
      }
      const data = await res.json();
      alert(`Bulk upload complete. Inserted: ${data.insertedCount || 0}`);
      setFileRows([]);
      setFileHeaders([]);
      setMapping({});
    } catch (err) {
      console.error('bulk upload error', err);
      alert('Bulk upload error: ' + (err.message || 'Unknown'));
    }
  };

  return (
    <div>
      <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} isLoggedIn={true} />
      <div className="admin-manage-container" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => navigate('/admin-dashboard')} style={{ marginRight: 12 }}>← Back</button>
          <h2 style={{ margin: 0 }}>Add Questions</h2>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setMode('single')} style={{ marginRight: 8 }} className={mode === 'single' ? 'active' : ''}>Add Single Question</button>
          <button onClick={() => setMode('bulk')} className={mode === 'bulk' ? 'active' : ''}>Add In Bulk</button>
        </div>

        {mode === 'single' && (
          <form onSubmit={handleSingleSubmit} className="question-form">
            <div>
              <label>Question</label>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} required rows={4} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <input value={optionA} onChange={e => setOptionA(e.target.value)} placeholder="Option A" required />
              <input value={optionB} onChange={e => setOptionB(e.target.value)} placeholder="Option B" required />
              <input value={optionC} onChange={e => setOptionC(e.target.value)} placeholder="Option C" required />
              <input value={optionD} onChange={e => setOptionD(e.target.value)} placeholder="Option D" required />
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Correct Option</label>
              <select value={correct} onChange={e => setCorrect(e.target.value)}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
              <label style={{ marginLeft: 16 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option>Quantitative</option>
                <option>Reasoning</option>
                <option>Verbal</option>
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Explanation (optional)</label>
              <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={3} style={{ width: '100%' }} placeholder="Explain the solution or reasoning" />
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Submit Question'}</button>
            </div>
          </form>
        )}

        {mode === 'bulk' && (
          <div>
            <div>
              <label>Upload an Excel / CSV file</label>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} />
              {parsingError && <div style={{ color: 'red' }}>{parsingError}</div>}

              {fileHeaders && fileHeaders.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginTop: 12 }}>
                    <button onClick={uploadMapped} disabled={loading}>{loading ? 'Uploading...' : 'Upload mapped questions'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AddQuestion;
