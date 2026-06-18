import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/auth.css";
import logoImg from "../assets/logo.png";
import loginBg from "../assets/login-bg.png";

function getUsers() {
  return JSON.parse(localStorage.getItem("fd_users") || "[]");
}
function saveUsers(u) {
  localStorage.setItem("fd_users", JSON.stringify(u));
}

export default function Auth() {
  const [tab, setTab] = useState("login");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");
  const [signupError, setSignupError] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signup") === "1") setTab("signup");
    if (searchParams.get("success") === "1") {
      setTab("login");
      showSuccess();
    }
  }, []);

  function showSuccess() {
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 5000);
  }

  function switchTab(t) {
    setTab(t);
    setLoginError(false);
    setSignupError("");
    setSuccessMsg(false);
  }

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

  function handleSignup(e) {
    e.preventDefault();
    const fullname = `${firstName} ${lastName}`;
    const users = getUsers();
    if (signupPw.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setSignupError("Email already registered.");
      return;
    }
    if (
      users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    ) {
      setSignupError("Username already taken.");
      return;
    }
    users.push({ fullname, username, email, password: signupPw });
    saveUsers(users);
    setFirstName("");
    setLastName("");
    setUsername("");
    setEmail("");
    setSignupPw("");
    switchTab("login");
    setTimeout(() => showSuccess(), 150);
  }

  return (
    <div className="auth-page">
      {/* ── Left Panel ── */}
      <div className="auth-left" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="auth-left-overlay"></div>
        <div className="auth-left-branding">
          <a href="/" className="auth-left-logo">
            <div className="auth-logo-icon">
              <img src={logoImg} alt="FlightDesk" width="40" height="40" />
            </div>
            FlightDesk
          </a>
          <p className="auth-left-tagline">
            Every gate. Every delay. Every update —<br />
            <span>before the airport tells you.</span>
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>{tab === "login" ? "Welcome back." : "Create account."}</h1>
            <p>
              {tab === "login" ? (
                <>
                  {`Don't have an account? `}
                  <a onClick={() => switchTab("signup")}>Sign up free →</a>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <a onClick={() => switchTab("login")}>Sign in →</a>
                </>
              )}
            </p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === "login" ? " active" : ""}`}
              onClick={() => switchTab("login")}
            >
              Sign in
            </button>
            <button
              className={`auth-tab${tab === "signup" ? " active" : ""}`}
              onClick={() => switchTab("signup")}
            >
              Create account
            </button>
          </div>

          {successMsg && (
            <div className="auth-success-msg">
              Account created! Sign in to continue.
            </div>
          )}

          {/* ── Login ── */}
          {tab === "login" && (
            <div className="auth-panel">
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Username or Email</label>
                  <div className="input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="your@email.com"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    Password{" "}
                    <a href="/forgot-password" className="label-link">
                      Forgot?
                    </a>
                  </label>
                  <div className="input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M7 11V7a5 5 0 0 1 10 0v4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="password"
                      value={loginPw}
                      onChange={(e) => setLoginPw(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                {loginError && (
                  <div className="error-msg show">
                    Invalid credentials. Please try again.
                  </div>
                )}
                <button type="submit" className="btn-submit">
                  Sign in →
                </button>
              </form>
              <p className="terms">
                By signing in you agree to our <a href="#">Terms</a> and{" "}
                <a href="#">Privacy Policy</a>.
              </p>
            </div>
          )}

          {/* ── Signup ── */}
          {tab === "signup" && (
            <div className="auth-panel">
              <form onSubmit={handleSignup}>
                <div className="name-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <div className="input-wrap">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="8"
                          r="4"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <div className="input-wrap">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="8"
                          r="4"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <div className="input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="12"
                        cy="7"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M22 6l-10 7L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M7 11V7a5 5 0 0 1 10 0v4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={signupPw}
                      onChange={(e) => setSignupPw(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {signupError && (
                  <div className="error-msg show">{signupError}</div>
                )}
                <button type="submit" className="btn-submit">
                  Create account →
                </button>
              </form>
              <p className="terms">
                By signing up you agree to our <a href="#">Terms</a> and{" "}
                <a href="#">Privacy Policy</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
