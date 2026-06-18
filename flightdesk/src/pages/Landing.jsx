import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/styles.css";
import logoImg from "../assets/logo.png";

// ── Auth helpers ───────────────────────────────────────────────────────────
function getUsers() {
  return JSON.parse(localStorage.getItem("fd_users") || "[]");
}
function saveUsers(u) {
  localStorage.setItem("fd_users", JSON.stringify(u));
}

export default function Landing() {
  const navigate = useNavigate();

  // ── Navbar ──────────────────────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Clock ───────────────────────────────────────────────────────────────
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Scroll reveal ────────────────────────────────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            const delay = parseFloat(e.target.dataset.delay || 0) * 120;
            setTimeout(() => e.target.classList.add("visible"), delay);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".reveal, .feature-card, .step")
      .forEach((el, i) => {
        el.dataset.delay = i % 3;
        obs.observe(el);
      });
    return () => obs.disconnect();
  }, []);

  // ── Stat counter ─────────────────────────────────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const h3 = entry.target.querySelector("h3");
          if (!h3 || h3.dataset.counted) return;
          h3.dataset.counted = "1";
          const raw = h3.textContent.trim();
          const match = raw.match(/^([<]?)([0-9,]+)(.*)/);
          if (!match) return;
          const prefix = match[1],
            target = parseInt(match[2].replace(/,/g, "")),
            suffix = match[3];
          const duration = 1800,
            start = performance.now();
          function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            h3.textContent =
              prefix + Math.round(ease * target).toLocaleString() + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.3 },
    );
    document.querySelectorAll(".stat-item").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ── Modals ───────────────────────────────────────────────────────────────
  const [modal, setModal] = useState(null); // 'login' | 'signup' | null
  const openModal = (type) => {
    setModal(type);
    document.body.style.overflow = "hidden";
  };
  const closeModal = () => {
    setModal(null);
    document.body.style.overflow = "";
  };
  const switchModal = (to) => {
    closeModal();
    setTimeout(() => openModal(to), 220);
  };

  // close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Login state ──────────────────────────────────────────────────────────
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  function handleLogin(e) {
    e.preventDefault();
    const user = getUsers().find(
      (u) =>
        (u.username.toLowerCase() === loginId.toLowerCase() ||
          u.email.toLowerCase() === loginId.toLowerCase()) &&
        u.password === loginPw,
    );
    if (user) {
      ["username", "email", "fullname", "password"].forEach((k) =>
        localStorage.setItem("fd_" + k, user[k]),
      );
      localStorage.setItem("fd_isLoggedIn", "true");
      navigate("/dashboard");
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  }

  // ── Signup state ─────────────────────────────────────────────────────────
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");
  const [signupError, setSignupError] = useState("");

  function handleSignup(e) {
    e.preventDefault();
    const users = getUsers();
    if (signupPw.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    if (
      users.find((u) => u.email.toLowerCase() === signupEmail.toLowerCase())
    ) {
      setSignupError("Email already registered.");
      return;
    }
    if (
      users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    ) {
      setSignupError("Username already taken.");
      return;
    }
    users.push({ fullname, username, email: signupEmail, password: signupPw });
    saveUsers(users);
    setFullname("");
    setUsername("");
    setSignupEmail("");
    setSignupPw("");
    setSignupError("");
    switchModal("login");
    setTimeout(() => {
      setLoginSuccess(true);
      setTimeout(() => setLoginSuccess(false), 5000);
    }, 300);
  }

  // ── Hero search ──────────────────────────────────────────────────────────
  const [searchVal, setSearchVal] = useState("");
  function handleSearch(e) {
    e.preventDefault();
    if (searchVal.trim()) navigate("/dashboard");
  }

  return (
    <>
      {/* ── Animated flight paths background ── */}
      <svg
        className="flight-paths"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          className="fp fp-1"
          d="M-100 400 Q360 100 720 300 Q1080 500 1540 200"
          fill="none"
        />
        <path
          className="fp fp-2"
          d="M-100 600 Q400 300 800 500 Q1100 650 1540 400"
          fill="none"
        />
        <path
          className="fp fp-3"
          d="M200 -50 Q500 300 600 500 Q700 700 900 950"
          fill="none"
        />
        <path
          className="fp fp-4"
          d="M1540 300 Q1100 200 720 400 Q340 600 -100 500"
          fill="none"
        />
        <path
          className="fp fp-5"
          d="M1300 -50 Q1000 250 800 450 Q600 650 400 950"
          fill="none"
        />
        <path
          className="fp fp-6"
          d="M-100 200 Q300 400 720 250 Q1140 100 1540 600"
          fill="none"
        />
        <circle className="fp-dot fp-dot-1" r="4">
          <animateMotion
            dur="18s"
            repeatCount="indefinite"
            path="M-100 400 Q360 100 720 300 Q1080 500 1540 200"
          />
        </circle>
        <circle className="fp-dot fp-dot-2" r="3.5">
          <animateMotion
            dur="22s"
            repeatCount="indefinite"
            path="M-100 600 Q400 300 800 500 Q1100 650 1540 400"
          />
        </circle>
        <circle className="fp-dot fp-dot-3" r="3">
          <animateMotion
            dur="25s"
            repeatCount="indefinite"
            path="M200 -50 Q500 300 600 500 Q700 700 900 950"
          />
        </circle>
        <circle className="fp-dot fp-dot-4" r="3">
          <animateMotion
            dur="20s"
            repeatCount="indefinite"
            path="M1540 300 Q1100 200 720 400 Q340 600 -100 500"
          />
        </circle>
        <circle className="fp-dot fp-dot-5" r="3">
          <animateMotion
            dur="24s"
            repeatCount="indefinite"
            path="M1300 -50 Q1000 250 800 450 Q600 650 400 950"
          />
        </circle>
        <circle className="fp-dot fp-dot-6" r="4">
          <animateMotion
            dur="28s"
            repeatCount="indefinite"
            path="M-100 200 Q300 400 720 250 Q1140 100 1540 600"
          />
        </circle>
      </svg>

      {/* ── Navbar ── */}
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <img
              src={logoImg}
              alt="FlightDesk"
              width="36"
              height="36"
              style={{ objectFit: "contain", borderRadius: "8px" }}
            />
            FlightDesk
          </a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => openModal("login")}>
              Log in
            </button>
            <button className="btn-primary" onClick={() => openModal("signup")}>
              Get started
            </button>
          </div>
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>
          <a href="#features" onClick={() => setMobileOpen(false)}>
            Features
          </a>
          <a href="#how" onClick={() => setMobileOpen(false)}>
            How it works
          </a>
          <div className="mobile-auth">
            <button
              className="btn-ghost"
              onClick={() => {
                openModal("login");
                setMobileOpen(false);
              }}
            >
              Log in
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                openModal("signup");
                setMobileOpen(false);
              }}
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="grid-overlay"></div>
          <div className="glow glow-1"></div>
          <div className="glow glow-2"></div>
        </div>
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Live tracking · 500+ airlines · 1,200+ airports
          </div>
          <h1 className="hero-title">
            <span className="hero-line">Every flight.</span>
            <span className="hero-line">Every status.</span>
            <span className="hero-line">
              <span className="title-accent">Right now.</span>
            </span>
          </h1>
          <p className="hero-sub">
            FlightDesk gives you real-time departure boards, gate updates, delay
            alerts, and route maps — all in one control tower.
          </p>

          <div className="hero-actions">
            <button
              className="btn-primary btn-lg"
              onClick={() => openModal("signup")}
            >
              Track your flight
            </button>
            <button
              className="btn-outline btn-lg"
              onClick={() => navigate("/dashboard")}
            >
              View live board
            </button>
          </div>

          {/* Mini flight board */}
          <div className="hero-board">
            <div className="board-header">
              <span className="board-label">DEPARTURES</span>
              <span className="board-time">{clock}</span>
            </div>
            <div className="board-cols">
              <span>Flight</span>
              <span>Destination</span>
              <span>Gate</span>
              <span>Departs</span>
              <span>Status</span>
            </div>
            <div className="board-rows">
              {[
                {
                  no: "AI 202",
                  dest: "Mumbai",
                  gate: "B4",
                  time: "06:15",
                  status: "on-time",
                  label: "On Time",
                },
                {
                  no: "6E 441",
                  dest: "Delhi",
                  gate: "A12",
                  time: "06:45",
                  status: "delayed",
                  label: "Delayed",
                },
                {
                  no: "SG 118",
                  dest: "Bangalore",
                  gate: "C7",
                  time: "07:00",
                  status: "on-time",
                  label: "On Time",
                },
                {
                  no: "UK 995",
                  dest: "Chennai",
                  gate: "D2",
                  time: "07:30",
                  status: "boarding",
                  label: "Boarding",
                },
                {
                  no: "QP 301",
                  dest: "Hyderabad",
                  gate: "A9",
                  time: "07:55",
                  status: "cancelled",
                  label: "Cancelled",
                },
              ].map((f, i) => (
                <div
                  className="board-row"
                  key={f.no}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="flight-no">{f.no}</span>
                  <span>{f.dest}</span>
                  <span>{f.gate}</span>
                  <span>{f.time}</span>
                  <span className={`status-badge ${f.status}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="stats-strip">
        <div className="stats-inner">
          {[
            { val: "1,200+", label: "Airports tracked" },
            { val: "500+", label: "Airlines covered" },
            { val: "<30s", label: "Update interval" },
            { val: "99.9%", label: "Uptime" },
          ].map((s, i) => (
            <>
              {i > 0 && <div className="stat-divider" key={`d${i}`} />}
              <div className="stat-item" key={s.label}>
                <h3>{s.val}</h3>
                <p>{s.label}</p>
              </div>
            </>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features" id="features">
        <div className="section-inner">
          <div className="section-label">Features</div>
          <h2 className="section-title">Everything a traveller needs</h2>
          <p className="section-sub">
            From gate changes to route maps, FlightDesk keeps you ahead of every
            update.
          </p>
          <div className="features-grid">
            {[
              {
                wide: true,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="16"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
                    <circle cx="8" cy="14" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="14" r="1.5" fill="currentColor" />
                  </svg>
                ),
                title: "Live Departure Board",
                desc: "A real-time flight board just like the airport. Filter by airline, route, or status. Updates every 30 seconds.",
                chip: "Real-time polling",
              },
              {
                wide: false,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                ),
                title: "Route Map View",
                desc: "Interactive map showing origin, destination, and live flight path for any tracked flight.",
                chip: "Interactive",
              },
              {
                wide: false,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
                title: "Push Notifications",
                desc: "Subscribe to any flight and get instant alerts for gate changes, delays, boarding calls, and cancellations.",
                chip: "Instant alerts",
              },
              {
                wide: false,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="11"
                      cy="11"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="m21 21-4.35-4.35"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
                title: "Flight Search",
                desc: "Search any flight by number or airline. Get full status, gate info, delay reason, and history in one view.",
                chip: "Instant results",
              },
              {
                wide: false,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
                title: "Flight History Log",
                desc: "Access a complete log of past flight statuses, delays, and patterns for any airline or route.",
                chip: "Full history",
              },
              {
                wide: true,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M16 2v4M8 2v4M3 10h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
                title: "Flight Schedule",
                desc: "A full calendar heatmap showing flight density across the month. Click any day to see the complete timeline of departures for that date.",
                chip: "Heatmap + Timeline",
              },
            ].map((f, i) => (
              <div
                className={`feature-card${f.wide ? " fc-wide" : ""}`}
                key={f.title}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="fc-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="fc-chip">{f.chip}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how" id="how">
        <div className="section-inner">
          <div className="section-label">How it works</div>
          <h2 className="section-title">Up in the air in minutes</h2>
          <div className="steps">
            {[
              {
                num: "01",
                title: "Create an account",
                desc: "Sign up in seconds. No personal travel info required — just an email and password.",
              },
              {
                num: "02",
                title: "Search your flight",
                desc: "Enter a flight number or browse the live departure board by airline or destination.",
              },
              {
                num: "03",
                title: "Subscribe & track",
                desc: "Subscribe to real-time alerts. We'll notify you the moment anything changes.",
              },
            ].map((s, i) => (
              <>
                {i > 0 && (
                  <div className="step-arrow" key={`a${i}`}>
                    →
                  </div>
                )}
                <div
                  className="step"
                  key={s.num}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="step-num">{s.num}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-glow"></div>
        <div className="section-inner cta-inner reveal">
          <h2>Never miss a gate change again.</h2>
          <p>Join thousands of travellers who stay ahead with FlightDesk.</p>
          <button
            className="btn-primary btn-lg"
            onClick={() => openModal("signup")}
          >
            Start tracking for free
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <a href="/" className="nav-logo">
            <img
              src={logoImg}
              alt=""
              width="28"
              height="28"
              style={{ objectFit: "contain", borderRadius: "6px" }}
            />
            FlightDesk
          </a>
          <p className="footer-copy">
            © 2026 FlightDesk. Built for travellers.
          </p>
          <a href="/forgot-password" className="footer-link">
            Forgot password?
          </a>
        </div>
      </footer>

      {/* ── Login Modal ── */}
      <div
        className={`modal-overlay${modal === "login" ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="modal">
          <button className="modal-close" onClick={closeModal}>
            ×
          </button>
          <div className="modal-logo">
            <img
              src={logoImg}
              alt=""
              width="26"
              height="26"
              style={{ objectFit: "contain", borderRadius: "6px" }}
            />
            FlightDesk
          </div>
          <h2>Welcome back</h2>
          <p className="modal-sub">Enter your credentials.</p>
          {loginSuccess && (
            <div className="success-msg show">
              Account created! Please sign in.
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username or Email</label>
              <input
                type="text"
                placeholder="your@email.com"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>
                Password{" "}
                <a href="/forgot-password" className="label-link">
                  Forgot password?
                </a>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {loginError && (
              <div className="error-msg show">
                Invalid credentials. Please try again.
              </div>
            )}
            <button type="submit" className="btn-submit">
              Sign in
            </button>
          </form>
          <p className="modal-footer-text">
            Don't have an account?{" "}
            <a onClick={() => switchModal("signup")}>Sign up free</a>
          </p>
        </div>
      </div>

      {/* ── Signup Modal ── */}
      <div
        className={`modal-overlay${modal === "signup" ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="modal">
          <button className="modal-close" onClick={closeModal}>
            ×
          </button>
          <div className="modal-logo">
            <img
              src={logoImg}
              alt=""
              width="26"
              height="26"
              style={{ objectFit: "contain", borderRadius: "6px" }}
            />
            FlightDesk
          </div>
          <h2>Create account</h2>
          <p className="modal-sub">
            Free forever. Start tracking flights instantly.
          </p>
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={signupPw}
                onChange={(e) => setSignupPw(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {signupError && <div className="error-msg show">{signupError}</div>}
            <button type="submit" className="btn-submit">
              Create account
            </button>
          </form>
          <p className="modal-footer-text">
            Already have an account?{" "}
            <a onClick={() => switchModal("login")}>Sign in</a>
          </p>
        </div>
      </div>
    </>
  );
}
