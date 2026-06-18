import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/profile.css";
import logoImg from "../assets/logo.png";

export default function Profile() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("fd_isLoggedIn")) navigate("/");
  }, []);

  const [fullname, setFullname] = useState(localStorage.getItem("fd_fullname") || "User");
  const [email, setEmail] = useState(localStorage.getItem("fd_email") || "user@example.com");
  const [phone, setPhone] = useState("+91 9876543210");
  const [isSaved, setIsSaved] = useState(false);

  const initials = fullname.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // Clock
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Navbar state
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    const onClick = () => setDropdownOpen(false);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem("fd_isLoggedIn");
    navigate("/");
  }

  function handleSave() {
    localStorage.setItem("fd_fullname", fullname);
    localStorage.setItem("fd_email", email);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }

  return (
    <>
      <nav className={`topnav${scrolled ? " scrolled" : ""}`}>
        <div className="topnav-inner">
          <Link to="/dashboard" className="topnav-logo">
            <div className="logo-mark">
              <img src={logoImg} alt="FlightDesk" width="34" height="34" />
            </div>
            <span className="logo-text">Flight<strong>Desk</strong></span>
          </Link>
          <div className="topnav-links">
            <Link to="/dashboard" className="topnav-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /></svg>
              Dashboard
            </Link>
            <Link to="/flights" className="topnav-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" stroke="currentColor" strokeWidth="1.5" /></svg>
              Flights
            </Link>
            <Link to="/map" className="topnav-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" /></svg>
              Route Map
            </Link>
            <Link to="/schedule" className="topnav-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              Schedule
            </Link>
          </div>
          <div className="topnav-right">
            <div className="header-clock">{clock}</div>
            <button className="topnav-icon-btn" onClick={() => navigate("/notifications")}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <div className="user-menu" onClick={(e) => e.stopPropagation()}>
              <button className="user-avatar-btn active" onClick={() => setDropdownOpen((o) => !o)}>
                <span className="user-avatar">{initials}</span>
              </button>
              {dropdownOpen && (
                <div className="user-dropdown open">
                  <div className="user-dropdown-info">
                    <div className="udd-name">{fullname}</div>
                    <div className="udd-role">Passenger</div>
                  </div>
                  <div className="user-dropdown-sep"></div>
                  <a href="#" className="user-dropdown-item logout-item" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content profile-page">
        <div className="profile-header">
          <h1>Account Profile</h1>
          <p className="profile-subtitle">Manage your personal information and preferences.</p>
        </div>

        <div className="profile-card">
          <div className="profile-user-info">
            <div className="profile-avatar-large">{initials}</div>
            <div className="profile-details">
              <h2>{fullname}</h2>
              <p>{email}</p>
              <span className="profile-role-badge">Verified Passenger</span>
            </div>
          </div>

          <h3 className="profile-section-title">Personal Information</h3>
          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label>Full Name</label>
              <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} />
            </div>
            <div className="profile-form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="profile-form-group">
              <label>Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="profile-form-group">
              <label>Account Type</label>
              <input type="text" value="Standard Passenger" disabled />
            </div>
          </div>

          <div className="profile-actions">
            {isSaved && <span style={{ color: "#00d264", alignSelf: "center", fontSize: "0.9rem" }}>✓ Saved successfully</span>}
            <button className="btn-save" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      </main>
    </>
  );
}
