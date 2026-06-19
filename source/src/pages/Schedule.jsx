import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/schedule.css";
import logoImg from "../assets/logo.png";

// ── Flight data generation ──────────────────────────────────────────────────
const airlines = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'Akasa Air', 'GoFirst'];
const codes = ['6E', 'AI', 'SG', 'UK', 'QP', 'G8'];
const dests = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Goa', 'Jaipur', 'Ahmedabad', 'Srinagar', 'Kochi', 'Amritsar', 'Nagpur', 'Varanasi'];
const statuses = ['on-time', 'on-time', 'on-time', 'delayed', 'boarding', 'landed', 'cancelled'];
const gates = ['A2', 'A5', 'A9', 'A11', 'B4', 'B8', 'B12', 'C2', 'C7', 'C9', 'D1', 'D6', 'D17', 'D21', 'D22'];
const aircrafts = ['Airbus A320', 'Boeing 737', 'Airbus A321', 'Boeing 787'];

function seededRand(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getStatusLabel(s) {
  return { 'on-time': 'On Time', 'delayed': 'Delayed', 'boarding': 'Boarding', 'cancelled': 'Cancelled', 'landed': 'Landed' }[s] || s;
}

export default function Schedule() {
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    if (!localStorage.getItem("fd_isLoggedIn")) navigate("/");
  }, []);

  const fullname = localStorage.getItem("fd_fullname") || "User";
  const initials = fullname.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem("fd_isLoggedIn");
    navigate("/");
  }

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const flightsByDate = useMemo(() => {
    const map = {};
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      const rand = seededRand(Math.floor(d.getTime() / 86400000));
      const count = Math.floor(rand() * 18) + 2;
      const flights = [];
      for (let i = 0; i < count; i++) {
        const r = seededRand(Math.floor(d.getTime() / 86400000) * 100 + i);
        const aIdx = Math.floor(r() * airlines.length);
        const hour = Math.floor(r() * 18) + 5;
        const minute = Math.floor(r() * 4) * 15;
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const status = statuses[Math.floor(r() * statuses.length)];
        const delayMin = status === 'delayed' ? (Math.floor(r() * 8) + 1) * 5 : 0;
        let estH = hour, estM = minute + delayMin;
        if (estM >= 60) { estH++; estM -= 60; }
        const est = `${String(estH).padStart(2, '0')}:${String(estM).padStart(2, '0')}`;
        flights.push({
          id: `${key}-${i}`,
          no: `${codes[aIdx]}${Math.floor(r() * 9000) + 1000}`,
          airline: airlines[aIdx],
          dest: dests[Math.floor(r() * dests.length)],
          gate: gates[Math.floor(r() * gates.length)],
          sched: time,
          est,
          status,
          aircraft: aircrafts[Math.floor(r() * aircrafts.length)],
        });
      }
      flights.sort((a, b) => a.sched.localeCompare(b.sched));
      map[key] = flights;
    }
    return map;
  }, [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState(today.toISOString().split('T')[0]);

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, date: '', count: '' });

  function getHeatLevel(count) {
    if (!count || count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 6) return 2;
    if (count <= 10) return 3;
    if (count <= 15) return 4;
    return 5;
  }

  const prevMonth = () => {
    let m = viewMonth - 1;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
  };

  const nextMonth = () => {
    let m = viewMonth + 1;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const renderCalendar = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayKey = today.toISOString().split('T')[0];

    let cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<td key={`empty-${i}`} className="empty-cell heat-0"></td>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      // Format correctly for local time
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${dd}`;
      const count = (flightsByDate[key] || []).length;
      const level = getHeatLevel(count);
      const isToday = key === todayKey;
      const isSelected = key === selectedKey;

      let cls = `heat-${level}`;
      if (isToday) cls += ' today-cell';
      if (isSelected) cls += ' selected-cell';

      cells.push(
        <td
          key={key}
          className={cls}
          onClick={() => {
            setSelectedKey(key);
            setTooltip({ ...tooltip, visible: false });
          }}
          onMouseEnter={() => {
            setTooltip({
              ...tooltip,
              visible: true,
              date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
              count: `${count} flight${count !== 1 ? 's' : ''}`
            });
          }}
          onMouseMove={(e) => {
            setTooltip((prev) => ({ ...prev, x: e.clientX + 14, y: e.clientY - 50 }));
          }}
          onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
        >
          <span className="cell-day-num">{day}</span>
          {count > 0 && <span className="cell-flight-count">{count} flights</span>}
        </td>
      );
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      cells.push(<td key={`empty-end-${i}`} className="empty-cell heat-0"></td>);
    }

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(<tr key={`row-${i}`}>{cells.slice(i, i + 7)}</tr>);
    }

    return (
      <table className="heatmap-calendar">
        <thead>
          <tr>
            <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  };

  const flights = flightsByDate[selectedKey] || [];
  const selectedDateObj = new Date(selectedKey + 'T00:00:00');
  const isTodayKey = selectedKey === today.toISOString().split('T')[0];
  const dateStr = isTodayKey ? 'Today' : selectedDateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const onTime = flights.filter(f => f.status === 'on-time').length;
  const delayed = flights.filter(f => f.status === 'delayed').length;
  const cancelled = flights.filter(f => f.status === 'cancelled').length;

  const byHour = {};
  flights.forEach(f => {
    const h = f.sched.split(':')[0];
    if (!byHour[h]) byHour[h] = [];
    byHour[h].push(f);
  });

  return (
    <>
      <nav className={`topnav${scrolled ? " scrolled" : ""}`}>
        <div className="topnav-inner">
          <Link to="/dashboard" className="topnav-logo">
            <div className="logo-mark">
              <img src={logoImg} alt="FlightDesk" width="34" height="34" />
            </div>
            <span className="logo-text">
              Flight<span className="logo-accent">Desk</span>
            </span>
          </Link>
          <div className="topnav-links">
            <Link to="/dashboard" className="topnav-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
              </svg>
              Dashboard
            </Link>
            <Link to="/flights" className="topnav-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Flights
            </Link>
            <Link to="/map" className="topnav-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
              Route Map
            </Link>
            <Link to="/schedule" className="topnav-link active">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Schedule
            </Link>
          </div>

          <div className="topnav-right">
            <div className="live-indicator">
              <span className="live-dot"></span>Live
            </div>
            <div className="header-clock">{clock}</div>
            <button
              className="topnav-icon-btn"
              onClick={() => navigate("/notifications")}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="icon-badge">2</span>
            </button>
            <button
              className="user-avatar-btn"
              onClick={() => navigate("/profile")}
              title="Profile"
            >
              <span className="user-avatar">{initials}</span>
            </button>
            <button className="topnav-icon-btn" onClick={handleLogout} title="Logout">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className={`mobile-nav${mobileOpen ? " open" : ""}`}>
          <a href="/dashboard" className="mobile-nav-link">Dashboard</a>
          <a href="/flights" className="mobile-nav-link">Flights</a>
          <a href="/map" className="mobile-nav-link">Route Map</a>
          <a href="/schedule" className="mobile-nav-link active">Schedule</a>
          <a href="/profile" className="mobile-nav-link">Profile</a>
          <a href="#" className="mobile-nav-link mobile-logout" onClick={handleLogout}>Logout</a>
        </div>
      </nav>

      <main className="main-content">
        <header className="dash-header">
          <div className="header-left">
            <div>
              <h1>Flight Schedules</h1>
              <p className="header-sub">Browse flight activity by date. Click any day to view its timeline.</p>
            </div>
          </div>
        </header>

      <div className="schedule-layout">
        {/* Heatmap Card */}
        <div className="heatmap-card">
          <div className="heatmap-header">
            <h2>Monthly Flight Activity</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              <div className="heatmap-legend">
                <span>Less</span>
                <div className="legend-cells">
                  <div className="legend-cell heat-0"></div>
                  <div className="legend-cell heat-1"></div>
                  <div className="legend-cell heat-2"></div>
                  <div className="legend-cell heat-3"></div>
                  <div className="legend-cell heat-4"></div>
                  <div className="legend-cell heat-5"></div>
                </div>
                <span>More</span>
              </div>
              <div className="heatmap-nav">
                <button className="heatmap-nav-btn" onClick={prevMonth}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
                <span className="heatmap-month">{MONTHS[viewMonth]} {viewYear}</span>
                <button className="heatmap-nav-btn" onClick={nextMonth}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div id="heatmapGrid">{renderCalendar()}</div>
        </div>

        {/* Timeline Card */}
        <div className="timeline-card">
          <div className="timeline-header">
            <div className="timeline-header-left">
              <h2>Departures</h2>
              <span className="selected-date-badge">{dateStr}</span>
            </div>
            <div className="timeline-summary">
              <div className="tl-stat"><strong>{flights.length}</strong> flights</div>
              <div className="tl-stat" style={{ color: "#00d264" }}><strong>{onTime}</strong> on time</div>
              <div className="tl-stat" style={{ color: "#ffaa00" }}><strong>{delayed}</strong> delayed</div>
              <div className="tl-stat" style={{ color: "#ff4444" }}><strong>{cancelled}</strong> cancelled</div>
            </div>
          </div>
          <div className="timeline-body">
            {flights.length === 0 ? (
              <div className="timeline-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <p>No flights scheduled</p>
                <span>Try selecting a different date on the heatmap</span>
              </div>
            ) : (
              Object.keys(byHour).sort().map((h, i) => (
                <div className="hour-block" style={{ animationDelay: `${i * 0.05}s` }} key={h}>
                  <div className="hour-label">
                    <span>{h}:00 – {String(parseInt(h) + 1).padStart(2, '0')}:00</span>
                  </div>
                  {byHour[h].map((f, j) => (
                    <div className="tl-flight-card" style={{ animationDelay: `${(i * 0.05 + j * 0.03)}s` }} key={f.id}>
                      <div className="tl-flight-no">{f.no}</div>
                      <div className="tl-route">
                        <div className="tl-dest">{f.dest}</div>
                        <div className="tl-airline">{f.airline}</div>
                      </div>
                      <div className="tl-time">{f.sched}</div>
                      <div className="tl-gate">{f.gate}</div>
                      <span className={`status-badge ${f.status}`}>{getStatusLabel(f.status)}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {tooltip.visible && (
        <div className="cell-tooltip" style={{ display: 'block', left: tooltip.x, top: tooltip.y }}>
          <div className="tt-date">{tooltip.date}</div>
          <div className="tt-count">{tooltip.count}</div>
        </div>
      )}
      </main>
    </>
  );
}
