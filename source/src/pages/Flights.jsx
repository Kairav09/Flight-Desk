import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/flights.css";
import logoImg from "../assets/logo.png";

// ── Constants ──────────────────────────────────────────────────────────────
const API_KEY = "6ac32b909ac8954bf37d71fadc5e4520";
const PER_PAGE = 15;
const CACHE_KEY = "fd_flights_cache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const AIRPORTS = [
  { code: "DEL", name: "Delhi" },
  { code: "BOM", name: "Mumbai" },
  { code: "BLR", name: "Bangalore" },
  { code: "HYD", name: "Hyderabad" },
  { code: "MAA", name: "Chennai" },
  { code: "CCU", name: "Kolkata" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(t) {
  if (!t) return "--";
  return new Date(t).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDate(t) {
  if (!t) return "--";
  return new Date(t).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function normalizeStatus(s) {
  if (!s) return "on-time";
  const l = s.toLowerCase();
  if (l.includes("delay")) return "delayed";
  if (l.includes("cancel")) return "cancelled";
  if (l.includes("land")) return "landed";
  if (l.includes("active") || l.includes("board")) return "boarding";
  if (l.includes("schedul")) return "on-time";
  return "on-time";
}
function getStatusLabel(s) {
  return (
    {
      "on-time": "On Time",
      delayed: "Delayed",
      boarding: "Boarding",
      cancelled: "Cancelled",
      landed: "Landed",
    }[s] || s
  );
}

export default function Flights() {
  const navigate = useNavigate();

  // ── Auth guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("fd_isLoggedIn")) navigate("/");
  }, []);

  // ── User info ─────────────────────────────────────────────────────────
  const fullname = localStorage.getItem("fd_fullname") || "User";
  const initials = fullname
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── Clock ─────────────────────────────────────────────────────────────
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

  // ── Navbar state ──────────────────────────────────────────────────────
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

  // ── Flight data state ─────────────────────────────────────────────────
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFiltered] = useState([]);
  const [currentPage, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState("Loading…");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchVal, setSearchVal] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [airportFilter, setAirportFilter] = useState("DEL");
  const [directionFilter, setDirectionFilter] = useState("dep");
  const [airlines, setAirlines] = useState([]);

  // Sort
  const [sortField, setSortField] = useState("sched");
  const [sortDir, setSortDir] = useState("asc");

  // ── Fetch flights ─────────────────────────────────────────────────────
  useEffect(() => {
    loadFlights();
  }, [airportFilter, directionFilter]);

  async function loadFlights() {
    setLoading(true);
    setError(null);
    setLastUpdated("Fetching live flights…");

    // Check cache first
    const cacheKey = `${CACHE_KEY}_${airportFilter}_${directionFilter}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          applyData(data);
          setLastUpdated(`Cached · ${new Date(timestamp).toLocaleTimeString()}`);
          setLoading(false);
          return;
        }
      } catch { /* cache corrupted, fetch fresh */ }
    }

    try {
      const param = directionFilter === "dep" ? "dep_iata" : "arr_iata";
      const res = await fetch(
        `http://api.aviationstack.com/v1/flights?access_key=${API_KEY}&${param}=${airportFilter}&limit=100`,
      );
      const json = await res.json();
      if (!json.data || json.data.length === 0) throw new Error("No data received");

      const mapped = json.data.map((f, i) => ({
        id: i + 1,
        no: f.flight?.iata || f.flight?.icao || "N/A",
        airline: f.airline?.name || "Unknown Airline",
        airlineCode: f.airline?.iata || "",
        origin: f.departure?.airport || "Unknown",
        originCode: f.departure?.iata || "",
        dest: f.arrival?.airport || "Unknown",
        destCode: f.arrival?.iata || "",
        date: formatDate(f.departure?.scheduled),
        rawDate: f.departure?.scheduled || "",
        gate: f.departure?.gate || "--",
        sched: formatTime(f.departure?.scheduled),
        rawSched: f.departure?.scheduled || "",
        est: formatTime(f.departure?.estimated || f.departure?.actual),
        arrSched: formatTime(f.arrival?.scheduled),
        arrEst: formatTime(f.arrival?.estimated || f.arrival?.actual),
        status: normalizeStatus(f.flight_status),
        terminal: f.departure?.terminal || "--",
        aircraft: f.aircraft?.registration || f.aircraft?.iata || "--",
        aircraftType: f.aircraft?.iata || "--",
      }));

      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({ data: mapped, timestamp: Date.now() }));
      applyData(mapped);
      setLastUpdated(`Updated ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setError("Failed to load live data. Check your API key or try again later.");
      setLastUpdated("Failed to load");
    }
    setLoading(false);
  }

  function applyData(mapped) {
    setFlights(mapped);
    setFiltered(mapped);
    setAirlines(
      [...new Set(mapped.map((f) => f.airline).filter((a) => a !== "Unknown Airline"))].sort(),
    );
  }

  // ── Filters ───────────────────────────────────────────────────────────
  useEffect(() => {
    const s = searchVal.toLowerCase().trim();
    let result = flights.filter((f) => {
      const matchSearch =
        !s ||
        f.no.toLowerCase().includes(s) ||
        f.origin.toLowerCase().includes(s) ||
        f.originCode.toLowerCase().includes(s) ||
        f.dest.toLowerCase().includes(s) ||
        f.destCode.toLowerCase().includes(s) ||
        f.airline.toLowerCase().includes(s) ||
        f.date.toLowerCase().includes(s);
      const matchStatus = statusFilter === "all" || f.status === statusFilter;
      const matchAirline = airlineFilter === "all" || f.airline === airlineFilter;
      return matchSearch && matchStatus && matchAirline;
    });

    // Sort
    result = [...result].sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      if (sortField === "sched" || sortField === "est") {
        aVal = a.rawSched || "";
        bVal = b.rawSched || "";
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    setFiltered(result);
    setPage(1);
  }, [searchVal, statusFilter, airlineFilter, flights, sortField, sortDir]);

  // ── Sort handler ──────────────────────────────────────────────────────
  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function sortIcon(field) {
    if (sortField !== field) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  // ── Pagination ────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredFlights.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageSlice = filteredFlights.slice(start, start + PER_PAGE);

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = {
    total: flights.length,
    onTime: flights.filter((f) => f.status === "on-time").length,
    delayed: flights.filter((f) => f.status === "delayed").length,
    cancelled: flights.filter((f) => f.status === "cancelled").length,
    landed: flights.filter((f) => f.status === "landed").length,
  };

  // ── Quick panel ───────────────────────────────────────────────────────
  const [panel, setPanel] = useState(null);
  const [subscribed, setSubscribed] = useState(() =>
    JSON.parse(localStorage.getItem("fd_subscribed") || "[]"),
  );

  function openQuickPanel(id) {
    const f = flights.find((x) => x.id === id);
    if (f) {
      setPanel(f);
      document.body.style.overflow = "hidden";
    }
  }
  function closeQuickPanel() {
    setPanel(null);
    document.body.style.overflow = "";
  }

  function toggleSubscription(id) {
    let s = JSON.parse(localStorage.getItem("fd_subscribed") || "[]");
    if (s.includes(id)) {
      s = s.filter((x) => x !== id);
      showToast(false);
    } else {
      s.push(id);
      showToast(true);
    }
    localStorage.setItem("fd_subscribed", JSON.stringify(s));
    setSubscribed(s);
  }

  // ── Toast ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  function showToast(sub) {
    setToast(sub);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Navbar ── */}
      <nav className={`topnav${scrolled ? " scrolled" : ""}`}>
        <div className="topnav-inner">
          <Link to="/dashboard" className="topnav-logo">
            <div className="logo-mark">
              <img src={logoImg} alt="FlightDesk" width="34" height="34" />
            </div>
            <span className="logo-text">
              Flight<strong>Desk</strong>
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
            <Link to="/flights" className="topnav-link active">
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
            <Link to="/schedule" className="topnav-link">
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
            <div className="user-menu" onClick={(e) => e.stopPropagation()}>
              <button
                className="user-avatar-btn"
                onClick={() => setDropdownOpen((o) => !o)}
              >
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Logout
                  </a>
                </div>
              )}
            </div>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-nav open">
          <Link to="/dashboard" className="mobile-nav-link">Dashboard</Link>
          <Link to="/flights" className="mobile-nav-link active">Flights</Link>
          <Link to="/map" className="mobile-nav-link">Route Map</Link>
          <Link to="/schedule" className="mobile-nav-link">Schedule</Link>
          <a href="#" className="mobile-nav-link" onClick={handleLogout}>Logout</a>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="main-content flights-page">
        {/* Page header */}
        <div className="flights-header">
          <div className="flights-header-left">
            <h1>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor" />
              </svg>
              Live Flights
            </h1>
            <p className="flights-subtitle">
              Real-time flight information powered by AviationStack
            </p>
          </div>
          <div className="flights-header-right">
            <button
              className="refresh-btn"
              onClick={() => {
                const cacheKey = `${CACHE_KEY}_${airportFilter}_${directionFilter}`;
                localStorage.removeItem(cacheKey);
                loadFlights();
              }}
              disabled={loading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={loading ? "spin" : ""}>
                <path d="M21 12a9 9 0 1 1-2.636-6.364" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <span className="flights-updated">{lastUpdated}</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flights-stats-strip">
          {[
            { label: "Total", val: stats.total, color: "var(--cyan)" },
            { label: "On Time", val: stats.onTime, color: "#00d264" },
            { label: "Delayed", val: stats.delayed, color: "#ffaa00" },
            { label: "Cancelled", val: stats.cancelled, color: "#ff4444" },
            { label: "Landed", val: stats.landed, color: "#64748b" },
          ].map((s) => (
            <div className="stat-chip" key={s.label}>
              <span className="stat-dot" style={{ background: s.color }}></span>
              <span className="stat-chip-val" style={{ color: s.color }}>{s.val}</span>
              <span className="stat-chip-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flights-controls">
          <div className="flights-controls-left">
            <div className="search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search flight, airline, airport…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={airportFilter}
              onChange={(e) => setAirportFilter(e.target.value)}
            >
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
            <div className="direction-toggle">
              <button
                className={`dir-btn ${directionFilter === "dep" ? "active" : ""}`}
                onClick={() => setDirectionFilter("dep")}
              >
                Departures
              </button>
              <button
                className={`dir-btn ${directionFilter === "arr" ? "active" : ""}`}
                onClick={() => setDirectionFilter("arr")}
              >
                Arrivals
              </button>
            </div>
          </div>
          <div className="flights-controls-right">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="on-time">On Time</option>
              <option value="delayed">Delayed</option>
              <option value="boarding">Boarding</option>
              <option value="cancelled">Cancelled</option>
              <option value="landed">Landed</option>
            </select>
            <select
              className="filter-select"
              value={airlineFilter}
              onChange={(e) => setAirlineFilter(e.target.value)}
            >
              <option value="all">All Airlines</option>
              {airlines.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flights-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
            <button onClick={loadFlights}>Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && flights.length === 0 && (
          <div className="flights-skeleton">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="skeleton-row" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="skeleton-cell w80"></div>
                <div className="skeleton-cell w120"></div>
                <div className="skeleton-cell w100"></div>
                <div className="skeleton-cell w100"></div>
                <div className="skeleton-cell w70"></div>
                <div className="skeleton-cell w50"></div>
                <div className="skeleton-cell w60"></div>
              </div>
            ))}
          </div>
        )}

        {/* Flight table */}
        {!loading || flights.length > 0 ? (
          <div className="board-card flights-board">
            <div className="flight-table-wrap">
              <table className="flight-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("no")} className="sortable">
                      Flight {sortIcon("no")}
                    </th>
                    <th onClick={() => handleSort("airline")} className="sortable">
                      Airline {sortIcon("airline")}
                    </th>
                    <th>From</th>
                    <th>To</th>
                    <th onClick={() => handleSort("date")} className="sortable">
                      Date {sortIcon("date")}
                    </th>
                    <th>Gate</th>
                    <th onClick={() => handleSort("sched")} className="sortable">
                      Scheduled {sortIcon("sched")}
                    </th>
                    <th>Estimated</th>
                    <th onClick={() => handleSort("status")} className="sortable">
                      Status {sortIcon("status")}
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.length === 0
                    ? null
                    : pageSlice.map((f, i) => (
                        <tr
                          key={f.id}
                          onClick={() => openQuickPanel(f.id)}
                          style={{ animationDelay: `${i * 0.04}s`, cursor: "pointer" }}
                        >
                          <td className="td-flight">{f.no}</td>
                          <td className="td-airline">{f.airline}</td>
                          <td className="td-origin">
                            <span className="airport-code">{f.originCode}</span>
                          </td>
                          <td className="td-dest">
                            <span className="airport-code">{f.destCode}</span>
                          </td>
                          <td className="td-date">{f.date}</td>
                          <td className="td-gate">
                            <span className="gate-pill">{f.gate}</span>
                          </td>
                          <td className="td-time">{f.sched}</td>
                          <td className={`td-time${f.status === "delayed" ? " td-est-delayed" : ""}`}>
                            {f.est}
                          </td>
                          <td>
                            <span className={`status-badge ${f.status}`}>
                              {getStatusLabel(f.status)}
                            </span>
                          </td>
                          <td className="td-actions">
                            <button
                              className="view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openQuickPanel(f.id);
                              }}
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {pageSlice.length === 0 && !loading && (
                <div className="empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p>No flights match your filters.</p>
                </div>
              )}
            </div>

            <div className="board-footer">
              <span className="showing-count">
                {filteredFlights.length === 0
                  ? "No flights found"
                  : `Showing ${start + 1}–${Math.min(start + PER_PAGE, filteredFlights.length)} of ${filteredFlights.length} flights`}
              </span>
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span className="page-info">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  className="page-btn"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* ── Quick Panel Modal ── */}
      {panel && (
        <>
          <div className="quick-panel open">
            <div className="qp-header">
              <div>
                <h3>{panel.no}</h3>
                <span>
                  {panel.airline} · {panel.originCode} → {panel.destCode}
                </span>
              </div>
              <button className="qp-close" onClick={closeQuickPanel}>
                ×
              </button>
            </div>
            <div className="qp-body">
              <div className="qp-status-row">
                <span className={`status-badge ${panel.status}`}>
                  {getStatusLabel(panel.status)}
                </span>
                <span className="qp-gate">Gate {panel.gate}</span>
              </div>
              <div className="qp-grid">
                {[
                  ["From", `${panel.origin} (${panel.originCode})`],
                  ["To", `${panel.dest} (${panel.destCode})`],
                  ["Date", panel.date],
                  ["Dep. Scheduled", panel.sched],
                  ["Dep. Estimated", panel.est],
                  ["Arr. Scheduled", panel.arrSched],
                  ["Arr. Estimated", panel.arrEst],
                  ["Airline", panel.airline],
                  ["Aircraft", panel.aircraft],
                  ["Terminal", panel.terminal],
                ].map(([label, val]) => (
                  <div className="qp-item" key={label}>
                    <span className="qp-label">{label}</span>
                    <span className="qp-val">{val}</span>
                  </div>
                ))}
              </div>
              <div className="qp-actions">
                <button
                  className="qp-btn-primary"
                  style={{ opacity: subscribed.includes(panel.id) ? 0.7 : 1 }}
                  onClick={() => toggleSubscription(panel.id)}
                >
                  {subscribed.includes(panel.id)
                    ? "Unsubscribe"
                    : "Subscribe to alerts"}
                </button>
              </div>
            </div>
          </div>
          <div className="panel-overlay open" onClick={closeQuickPanel}></div>
        </>
      )}

      {/* ── Toast ── */}
      {toast !== null && (
        <div className={`subscribe-toast show${toast === false ? " unsubscribed" : ""}`}>
          <div className="toast-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="toast-content">
            <span className="toast-title">
              {toast ? "Subscribed!" : "Unsubscribed"}
            </span>
            <span className="toast-msg">
              {toast
                ? "You'll receive alerts for gate changes, delays, and boarding calls."
                : "You won't receive any more alerts for this flight."}
            </span>
          </div>
          <button className="toast-close" onClick={() => setToast(null)}>
            ✕
          </button>
        </div>
      )}
    </>
  );
}
