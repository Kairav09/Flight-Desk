import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/dashboard.css";
import logoImg from "../assets/logo.png";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ── Constants ──────────────────────────────────────────────────────────────
const API_KEY = "6ac32b909ac8954bf37d71fadc5e4520";
const PER_PAGE = 10;

const airportCoords = {
  Delhi: { lat: 28.5562, lng: 77.1, code: "DEL" },
  Mumbai: { lat: 19.0896, lng: 72.8656, code: "BOM" },
  Bangalore: { lat: 13.1986, lng: 77.7066, code: "BLR" },
  Hyderabad: { lat: 17.2403, lng: 78.4294, code: "HYD" },
  Chennai: { lat: 12.9941, lng: 80.1709, code: "MAA" },
  Kolkata: { lat: 22.652, lng: 88.4463, code: "CCU" },
  Pune: { lat: 18.5822, lng: 73.9197, code: "PNQ" },
  Goa: { lat: 15.3809, lng: 73.8314, code: "GOI" },
  Jaipur: { lat: 26.8242, lng: 75.8122, code: "JAI" },
  Amritsar: { lat: 31.7096, lng: 74.7973, code: "ATQ" },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function escapeHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
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

export default function Dashboard() {
  const navigate = useNavigate();

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("fd_isLoggedIn")) navigate("/");
  }, []);

  // ── User info ───────────────────────────────────────────────────────────
  const fullname = localStorage.getItem("fd_fullname") || "User";
  const initials = fullname
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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

  // ── Navbar ──────────────────────────────────────────────────────────────
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

  // ── Flight data ─────────────────────────────────────────────────────────
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFiltered] = useState([]);
  const [currentPage, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState("Loading…");
  const [searchVal, setSearchVal] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [airlines, setAirlines] = useState([]);

  useEffect(() => {
    loadFlights();
    const id = setInterval(() => setLastUpdated("Updated just now"), 30000);
    return () => clearInterval(id);
  }, []);

  async function loadFlights() {
    setLastUpdated("Fetching live flights...");
    try {
      const res = await fetch(
        `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&dep_iata=DEL`,
      );
      const data = await res.json();
      if (!data.data) throw new Error("No data");
      const mapped = data.data.slice(0, 50).map((f, i) => ({
        id: i + 1,
        no: f.flight?.iata || f.flight?.icao || "N/A",
        airline: f.airline?.name || "Unknown Airline",
        origin: f.departure?.airport || f.departure?.iata || "Unknown",
        originCode: f.departure?.iata || "",
        dest: f.arrival?.airport || f.arrival?.iata || "Unknown",
        destCode: f.arrival?.iata || "",
        date: formatDate(f.departure?.scheduled),
        gate: f.departure?.gate || "--",
        sched: formatTime(f.departure?.scheduled),
        est: formatTime(f.departure?.estimated),
        status: normalizeStatus(f.flight_status),
        terminal: f.departure?.terminal || "--",
        aircraft: f.aircraft?.registration || f.aircraft?.icao24 || "Unknown",
        duration: "--",
      }));
      setFlights(mapped);
      setFiltered(mapped);
      setAirlines(
        [
          ...new Set(
            mapped.map((f) => f.airline).filter((a) => a !== "Unknown Airline"),
          ),
        ].sort(),
      );
      setLastUpdated(`Updated ${new Date().toLocaleTimeString()}`);
    } catch {
      setLastUpdated("Failed to load live data");
    }
  }

  // ── Filters ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = searchVal.toLowerCase().trim();
    const result = flights.filter((f) => {
      const matchSearch =
        !s ||
        f.no.toLowerCase().includes(s) ||
        f.origin.toLowerCase().includes(s) ||
        f.originCode.toLowerCase().includes(s) ||
        f.dest.toLowerCase().includes(s) ||
        f.destCode.toLowerCase().includes(s) ||
        f.date.toLowerCase().includes(s) ||
        f.airline.toLowerCase().includes(s);
      const matchStatus = statusFilter === "all" || f.status === statusFilter;
      const matchAirline =
        airlineFilter === "all" || f.airline === airlineFilter;
      return matchSearch && matchStatus && matchAirline;
    });
    setFiltered(result);
    setPage(1);
  }, [searchVal, statusFilter, airlineFilter, flights]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredFlights.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageSlice = filteredFlights.slice(start, start + PER_PAGE);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: filteredFlights.length,
    onTime: filteredFlights.filter((f) => f.status === "on-time").length,
    delayed: filteredFlights.filter((f) => f.status === "delayed").length,
    cancelled: filteredFlights.filter((f) => f.status === "cancelled").length,
  };

  // ── Quick panel ──────────────────────────────────────────────────────────
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

  // ── Toast ────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  function showToast(sub) {
    setToast(sub);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  // ── Map filter ───────────────────────────────────────────────────────────
  const [activeCity, setActiveCity] = useState(null);

  function filterByCity(city) {
    if (activeCity === city) {
      clearMapFilter();
      return;
    }
    setActiveCity(city);
    setSearchVal(airportCoords[city].code);
  }
  function clearMapFilter() {
    setActiveCity(null);
    setSearchVal("");
  }

  // ── Leaflet map ──────────────────────────────────────────────────────────
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerMap = useRef({});

  useEffect(() => {
    if (leafletMap.current || !mapRef.current) return;
    const map = L.map(mapRef.current, {
      center: [22.5, 78.5],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 10, minZoom: 4 },
    ).addTo(map);
    leafletMap.current = map;

    Object.entries(airportCoords).forEach(([city, info]) => {
      const marker = L.circleMarker([info.lat, info.lng], {
        radius: 6,
        fillColor: "#f59e0b",
        fillOpacity: 0.85,
        color: "#fbbf24",
        weight: 2,
      }).addTo(map);
      marker.bindTooltip(`<strong>${info.code}</strong><br>${city}`, {
        direction: "top",
        className: "airport-tooltip",
        offset: [0, -8],
      });
      marker.on("click", () => filterByCity(city));
      markerMap.current[city] = marker;
    });
  }, []);

  // Update markers when activeCity or flights change
  useEffect(() => {
    if (!leafletMap.current) return;
    const cityCount = {};
    flights.forEach((f) => {
      Object.entries(airportCoords).forEach(([city, info]) => {
        if (
          (f.destCode && f.destCode.toUpperCase() === info.code) ||
          (f.dest && f.dest.toLowerCase().includes(city.toLowerCase()))
        ) {
          cityCount[city] = (cityCount[city] || 0) + 1;
        }
      });
    });
    Object.entries(markerMap.current).forEach(([city, marker]) => {
      const count = cityCount[city] || 0;
      const isActive = activeCity === city;
      marker.setStyle({
        fillColor: isActive ? "#ffffff" : "#f59e0b",
        color: isActive ? "#f59e0b" : "#fbbf24",
        weight: isActive ? 3 : 2,
      });
      marker.setRadius(isActive ? 10 : count > 2 ? 8 : 6);
    });
  }, [flights, activeCity]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
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
            <Link to="/dashboard" className="topnav-link active">
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
            <button
              className="topnav-icon-btn"
              onClick={() => navigate("/notifications")}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="icon-badge">3</span>
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
                <path
                  d="M3 12h18M3 6h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className={`mobile-nav${mobileOpen ? " open" : ""}`}>
          <a href="/dashboard" className="mobile-nav-link active">
            Dashboard
          </a>
          <a href="/flights" className="mobile-nav-link">
            Flights
          </a>
          <a href="/map" className="mobile-nav-link">
            Route Map
          </a>
          <a href="/schedule" className="mobile-nav-link">
            Schedule
          </a>
          <a href="/profile" className="mobile-nav-link">
            Profile
          </a>
          <a
            href="#"
            className="mobile-nav-link mobile-logout"
            onClick={handleLogout}
          >
            Logout
          </a>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="main-content">
        <header className="dash-header">
          <div className="header-left">
            <div>
              <h1>
                {greeting}, {fullname.split(" ")[0]}{" "}
                <span
                  role="img"
                  aria-label="wave"
                  style={{
                    fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
                    fontWeight: "normal",
                    fontStyle: "normal",
                    color: "transparent",
                    textShadow: "0 0 0 #ffcc4d"
                  }}
                >
                  👋
                </span>
              </h1>
              <p className="header-sub">
                Here's what's happening at the airport right now.
              </p>
            </div>
          </div>
        </header>

        {/* ── Map Hero ── */}
        <div className="map-hero">
          {activeCity && (
            <div className="map-filter-label" style={{ display: "flex" }}>
              <span>{activeCity}</span>
              <button onClick={clearMapFilter}>✕ Clear</button>
            </div>
          )}
          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "var(--radius)",
            }}
          ></div>
          <div className="map-stats">
            {[
              {
                id: "total",
                val: stats.total,
                label: "Total Flights",
                color: "var(--cyan)",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                      fill="currentColor"
                    />
                  </svg>
                ),
              },
              {
                id: "ontime",
                val: stats.onTime,
                label: "On Time",
                color: "#00d264",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l5 5L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
              {
                id: "delayed",
                val: stats.delayed,
                label: "Delayed",
                color: "#ffaa00",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 7v5l3 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                id: "cancelled",
                val: stats.cancelled,
                label: "Cancelled",
                color: "#ff4444",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M15 9l-6 6M9 9l6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
            ].map((s) => (
              <div className="map-stat-card" key={s.id}>
                <div className="map-stat-icon" style={{ color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <div
                    className="map-stat-value"
                    style={{ color: s.id !== "total" ? s.color : undefined }}
                  >
                    {s.val}
                  </div>
                  <div className="map-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Flight Board ── */}
        <div className="board-card">
          <div className="board-toolbar">
            <div className="board-title-row">
              <h2>Live Departures</h2>
              <span className="board-updated">{lastUpdated}</span>
            </div>
            <div className="board-controls">
              <div className="search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
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
                <input
                  type="text"
                  placeholder="Search flight, destination…"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                />
              </div>
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
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flight-table-wrap">
            <table className="flight-table">
              <colgroup>
                <col className="col-flight" />
                <col className="col-airline" />
                <col className="col-origin" />
                <col className="col-dest" />
                <col className="col-date" />
                <col className="col-gate" />
                <col className="col-time" />
                <col className="col-time" />
                <col className="col-status" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>Flight</th>
                  <th>Airline</th>
                  <th>From</th>
                  <th>Destination</th>
                  <th>Date</th>
                  <th>Gate</th>
                  <th>Scheduled</th>
                  <th>Estimated</th>
                  <th>Status</th>
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
                        style={{
                          animationDelay: `${i * 0.045}s`,
                          cursor: "pointer",
                        }}
                      >
                        <td className="td-flight">{f.no}</td>
                        <td className="td-airline">{f.airline}</td>
                        <td className="td-origin">{f.origin}</td>
                        <td className="td-dest">{f.dest}</td>
                        <td className="td-date">{f.date}</td>
                        <td className="td-gate">
                          <span className="gate-pill">{f.gate}</span>
                        </td>
                        <td className="td-time">{f.sched}</td>
                        <td
                          className={`td-time${f.status === "delayed" ? " td-est-delayed" : ""}`}
                        >
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
            {pageSlice.length === 0 && (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="m21 21-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <p>No flights match your search.</p>
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
      </main>

      {/* ── Quick Panel ── */}
      {panel && (
        <>
          <div className="quick-panel open">
            <div className="qp-header">
              <div>
                <h3>{panel.no}</h3>
                <span>
                  {panel.airline} · {panel.origin} to {panel.dest}
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
                  ["From", panel.origin],
                  ["Destination", panel.dest],
                  ["Date", panel.date],
                  ["Scheduled", panel.sched],
                  ["Estimated", panel.est],
                  ["Airline", panel.airline],
                  ["Aircraft", panel.aircraft],
                  ["Terminal", panel.terminal],
                  ["Duration", panel.duration],
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
                <button
                  className="qp-btn-secondary"
                  onClick={() => navigate("/flights")}
                >
                  View full details →
                </button>
              </div>
            </div>
          </div>
          <div className="panel-overlay open" onClick={closeQuickPanel}></div>
        </>
      )}

      {/* ── Toast ── */}
      {toast !== null && (
        <div
          className={`subscribe-toast show${toast === false ? " unsubscribed" : ""}`}
        >
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
              {toast ? "🔔 Subscribed!" : "Unsubscribed"}
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
