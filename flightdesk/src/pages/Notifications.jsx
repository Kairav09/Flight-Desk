import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/notifications.css";
import logoImg from "../assets/logo.png";

// Mock notifications
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: "alert",
    title: "Gate Changed",
    desc: "Flight 6E 2021 to Mumbai (BOM) will now depart from Gate 14.",
    time: "2 mins ago",
    unread: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  {
    id: 2,
    type: "info",
    title: "Now Boarding",
    desc: "Flight VTI 442 to Bangalore (BLR) is now boarding at Gate 8. Please proceed to the gate.",
    time: "15 mins ago",
    unread: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  {
    id: 3,
    type: "success",
    title: "Flight Landed",
    desc: "Your tracked flight AI 302 has landed safely in Delhi (DEL).",
    time: "2 hours ago",
    unread: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  {
    id: 4,
    type: "warning",
    title: "Flight Delayed",
    desc: "Flight SG 801 to Chennai (MAA) has been delayed by 45 minutes due to bad weather.",
    time: "1 day ago",
    unread: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    ),
  },
];

export default function Notifications() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("fd_isLoggedIn")) navigate("/");
  }, []);

  const fullname = localStorage.getItem("fd_fullname") || "User";
  const initials = fullname.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const clearNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

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
            <button className="topnav-icon-btn active" onClick={() => navigate("/notifications")}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              {notifications.some(n => n.unread) && <span className="icon-badge">{notifications.filter(n => n.unread).length}</span>}
            </button>
            <div className="user-menu" onClick={(e) => e.stopPropagation()}>
              <button className="user-avatar-btn" onClick={() => setDropdownOpen((o) => !o)}>
                <span className="user-avatar">{initials}</span>
              </button>
              {dropdownOpen && (
                <div className="user-dropdown open">
                  <div className="user-dropdown-info">
                    <div className="udd-name">{fullname}</div>
                    <div className="udd-role">Passenger</div>
                  </div>
                  <div className="user-dropdown-sep"></div>
                  <Link to="/profile" className="user-dropdown-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    Profile
                  </Link>
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

      <main className="main-content notifications-page">
        <div className="notif-header">
          <div>
            <h1>Notifications</h1>
            <p className="notif-subtitle">Stay updated on your tracked flights and account alerts.</p>
          </div>
          {notifications.length > 0 && notifications.some(n => n.unread) && (
            <button className="btn-mark-read" onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <p>You have no new notifications.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`notif-card ${n.unread ? "unread" : ""}`}>
                <div className={`notif-icon ${n.type}`}>{n.icon}</div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-desc">{n.desc}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
                <button
                  className="rm-detail-close"
                  style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none" }}
                  onClick={() => clearNotification(n.id)}
                  title="Remove notification"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
