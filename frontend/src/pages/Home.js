import React, { useState, useEffect } from "react";
import { Navbar, Footer } from "./CommonUI";
import "../css/home.css";

const Home = ({ isDarkMode, toggleDarkMode }) => {
  const [counters, setCounters] = useState([]);
  const [studentCount, setStudentCount] = useState(0);

  const syllabus = [
    {
      title: "Reasoning",
      topics: [
        "Blood Relation",
        "Coding-Decoding",
        "Number Series",
        "Alphabet Series",
        "Syllogism",
        "Seating Arrangement",
        "Direction Sense",
        "Puzzles (Linear & Matrix)",
        "Logical Venn Diagrams",
        "Data Sufficiency",
      ],
    },
    {
      title: "Quantitative",
      topics: [
        "Number System",
        "Percentages",
        "Profit & Loss",
        "Ratio & Proportion",
        "Time, Speed & Distance",
        "Time & Work",
        "Pipes & Cisterns",
        "Mensuration",
        "Averages",
        "Mixtures & Alligations",
        "Simple & Compound Interest",
        "Permutations & Combinations",
        "Probability",
        "Algebra (Equations, Inequalities)",
      ],
    },
    {
      title: "Verbal",
      topics: [
        "Synonyms & Antonyms",
        "One-word Substitution",
        "Reading Comprehension",
        "Para Jumbles",
        "Sentence Correction (Grammar)",
        "Fill in the Blanks",
        "Cloze Test",
        "Error Spotting",
        "Vocabulary Building",
        "Idioms & Phrases",
      ],
    },
  ];

  const stats = [
    { label: "Questions", value: 500 },
    { label: "Students Benefited", value: studentCount },
  ];

  // Scroll animation
  useEffect(() => {
    const handleScroll = () => {
      document.querySelectorAll(".fade-up").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          el.classList.add("visible");
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch student count and animate counters
  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      try {
        console.log('Fetching student count...');
        const res = await fetch('http://localhost:5000/api/users/count/students');
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        const data = await res.json();
        console.log('Received student count:', data);
        if (mounted) {
          setStudentCount(data.count || 0);
          console.log('Updated student count state:', data.count);
        }
      } catch (e) {
        console.error('Could not fetch student count:', e);
      }
    };
    fetchCounts();

    return () => (mounted = false);
  }, []);

  // Animated counters (re-run when stats change)
  useEffect(() => {
    const end = stats.map((s) => s.value);
    let start = end.map(() => 0);
    const duration = 2000;
    const stepTime = 30;
    let interval = setInterval(() => {
      let done = true;
      start = start.map((val, i) => {
        if (val < end[i]) {
          done = false;
          return Math.min(val + Math.ceil(end[i] / (duration / stepTime)), end[i]);
        }
        return val;
      });
      setCounters([...start]);
      if (done) clearInterval(interval);
    }, stepTime);
    return () => clearInterval(interval);
  }, [studentCount]);

  return (
    <div className={`home-container ${isDarkMode ? "dark" : "light"}`}>
      <Navbar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isLoggedIn={false}
      />

      {/* INTRO SECTION */}
      <section className="intro-section fade-up">
        <img src="/home.jpg" alt="Aptitude Preparation" className="hero-img" />
        <p className="intro-text">
          Welcome to the <b>Aptitude Preparation</b> platform! Here, you can sharpen
          your reasoning, quantitative, and verbal skills through well-structured
          practice sets. Prepare confidently for your placement exams and boost your
          problem-solving potential with focused learning.
        </p>
      </section>

      {/* SYLLABUS SECTION */}
      <section className="syllabus-section fade-up">
        <h2>Syllabus</h2>
        <div className="syllabus-cards">
          {syllabus.map((item, index) => (
            <div key={index} className="syllabus-card">
              {item.title}
              <div className="topics">
                {item.topics.map((topic, i) => (
                  <div key={i} className="topic-item">
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className={`stats-section fade-up ${isDarkMode ? "dark" : "light"}`}>
        {stats.map((s, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value">{(counters[index] || 0)}+</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
      </section>

      {/* SOCIAL MEDIA SECTION */}
      <section className={`social-section fade-up ${isDarkMode ? "dark" : "light"}`}>
        <div className="social-icons">
          <div className="social-link">
            <span>Instagram</span>
            <img src="/instagram.jpg" alt="Instagram" />
          </div>
          <div className="social-link">
            <span>YouTube</span>
            <img src="/youtube.jpg" alt="YouTube" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
