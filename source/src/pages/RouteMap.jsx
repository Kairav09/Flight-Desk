import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/routemap.css";
import logoImg from "../assets/logo.png";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ALL_AIRPORTS from "../utils/iata.json";

// ── Constants ──────────────────────────────────────────────────────────────
const API_KEY = "6ac32b909ac8954bf37d71fadc5e4520";
const CACHE_KEY = "fd_routemap_cache";
const CACHE_TTL = 10 * 60 * 1000;

const HUB_OPTIONS = ["DEL", "BOM", "BLR", "HYD", "MAA", "CCU"];

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(t) {
  if (!t) return "--";
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  return { "on-time": "On Time", delayed: "Delayed", boarding: "Boarding", cancelled: "Cancelled", landed: "Landed" }[s] || s;
}

// Curved line between two points
function getCurvedPoints(from, to, numPoints = 40) {
  const points = [];
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dx = to[1] - from[1];
  const dy = to[0] - from[0];
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = dist * 0.15;
  const ctrlLat = midLat + (dx / dist) * offset;
  const ctrlLng = midLng - (dy / dist) * offset;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * ctrlLat + t * t * to[0];
    const lng = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * ctrlLng + t * t * to[1];
    points.push([lat, lng]);
  }
  return points;
}

export default function RouteMap() {
  const navigate = useNavigate();

  // ── Auth guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("fd_isLoggedIn")) navigate("/");
  }, []);

  // ── User info ─────────────────────────────────────────────────────────
  const fullname = localStorage.getItem("fd_fullname") || "User";
  const initials = fullname.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // ── Clock ─────────────────────────────────────────────────────────────
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
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

  // ── Flight data ───────────────────────────────────────────────────────
  const [routes, setRoutes] = useState([]);
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [hubAirport, setHubAirport] = useState("DEL");

  useEffect(() => {
    loadRouteData();
  }, [hubAirport]);

  async function loadRouteData() {
    setLoading(true);
    setSelectedAirport(null);
    setSelectedRoute(null);

    const cacheKey = `${CACHE_KEY}_${hubAirport}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          processFlights(data);
          setLoading(false);
          return;
        }
      } catch { /* fetch fresh */ }
    }

    try {
      const now = new Date();
      const later = new Date(now.getTime() + 11 * 60 * 60 * 1000);
      const start = now.toISOString().slice(0, 16);
      const end = later.toISOString().slice(0, 16);
      const res = await fetch(
        `https://aerodatabox.p.rapidapi.com/flights/airports/iata/${hubAirport}/${start}/${end}?withLeg=true&direction=Departure&withCancelled=true&withCodeshared=true&withCargo=false&withPrivate=false`,
        {
          headers: {
            "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
            "x-rapidapi-key": "9cccc20ab8mshf575553f2cc35e2p1ef844jsnf578fe4eba25"
          }
        }
      );
      const json = await res.json();
      if (!json.departures) throw new Error("No data");

      const flights = json.departures.map((f, i) => ({
        id: i + 1,
        no: f.number || "N/A",
        airline: f.airline?.name || "Unknown",
        originCode: hubAirport,
        destCode: f.arrival?.airport?.iata || "",
        origin: hubAirport,
        dest: f.arrival?.airport?.name || "Unknown",
        depTime: formatTime(f.departure?.scheduledTime?.local || f.departure?.scheduledTime?.utc),
        arrTime: formatTime(f.arrival?.scheduledTime?.local || f.arrival?.scheduledTime?.utc),
        status: normalizeStatus(f.status),
        gate: f.departure?.gate || "--",
        terminal: f.departure?.terminal || "--",
      }));

      localStorage.setItem(cacheKey, JSON.stringify({ data: flights, timestamp: Date.now() }));
      processFlights(flights);
    } catch {
      console.warn("API failed, using fallback data.");
      const airlinesList = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'Akasa Air'];
      const dests = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];
      const destCodes = ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU', 'PNQ'];
      const statusesList = ['on-time', 'on-time', 'on-time', 'delayed', 'boarding', 'landed', 'cancelled'];
      
      const mockData = Array.from({length: 25}).map((_, i) => {
        const dIdx = Math.floor(Math.random() * dests.length);
        const aIdx = Math.floor(Math.random() * airlinesList.length);
        return {
          id: i + 1,
          no: `MOCK${i}`,
          airline: airlinesList[aIdx],
          originCode: hubAirport,
          destCode: destCodes[dIdx],
          origin: hubAirport === 'DEL' ? 'Delhi' : 'Unknown',
          dest: dests[dIdx],
          depTime: "12:00",
          arrTime: "14:00",
          status: statusesList[Math.floor(Math.random() * statusesList.length)],
          gate: "A1",
          terminal: "1",
        };
      });
      processFlights(mockData);
    }
    setLoading(false);
  }

  function processFlights(flights) {
    setAllFlights(flights);
    // Build route summaries
    const routeMap = {};
    flights.forEach((f) => {
      const key = `${f.originCode}-${f.destCode}`;
      if (!routeMap[key]) {
        routeMap[key] = {
          from: f.originCode,
          to: f.destCode,
          fromName: f.origin,
          toName: f.dest,
          flights: [],
          statuses: {},
        };
      }
      routeMap[key].flights.push(f);
      const st = f.status;
      routeMap[key].statuses[st] = (routeMap[key].statuses[st] || 0) + 1;
    });
    setRoutes(Object.values(routeMap));
  }

  // ── Map ────────────────────────────────────────────────────────────────
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const routeLinesRef = useRef([]);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current || !mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [22.5, 79],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 12,
      minZoom: 4,
    }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers and draw routes when data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old layers
    routeLinesRef.current.forEach((l) => map.removeLayer(l));
    routeLinesRef.current = [];
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    // Count flights per destination
    const destCounts = {};
    allFlights.forEach((f) => {
      if (f.destCode) destCounts[f.destCode] = (destCounts[f.destCode] || 0) + 1;
    });

    // Helper to create or get a marker
    const getOrCreateMarker = (code) => {
      if (markersRef.current[code]) return markersRef.current[code];
      const info = ALL_AIRPORTS[code];
      if (!info) return null;

      const marker = L.circleMarker([info.lat, info.lng]).addTo(map);
      marker.on("click", () => handleAirportClick(code));
      markersRef.current[code] = marker;
      return marker;
    };

    // Draw Hub
    const hubInfo = ALL_AIRPORTS[hubAirport];
    if (hubInfo) {
      const hubMarker = getOrCreateMarker(hubAirport);
      if (hubMarker) {
        hubMarker.setStyle({ fillColor: "#f59e0b", color: "#fbbf24", fillOpacity: 1, weight: 3 });
        hubMarker.setRadius(12);
        hubMarker.bindTooltip(
          `<strong>${hubAirport}</strong><br>${hubInfo.city}<br><span style="color:#fbbf24">Hub</span>`,
          { direction: "top", className: "airport-tooltip", offset: [0, -8] },
        );
      }
    }

    // Draw Routes & Destinations
    routes.forEach((route) => {
      const destInfo = ALL_AIRPORTS[route.to];
      if (!destInfo || !hubInfo) return;

      const isSelected = selectedRoute && selectedRoute.to === route.to;
      const isActiveDest = selectedAirport === route.to;
      const count = destCounts[route.to] || 0;
      const hasDelay = route.statuses["delayed"] > 0;
      const hasCancelled = route.statuses["cancelled"] > 0;

      // Draw Destination Marker
      const destMarker = getOrCreateMarker(route.to);
      if (destMarker) {
        if (isActiveDest) {
          destMarker.setStyle({ fillColor: "#ffffff", color: "#f59e0b", fillOpacity: 1, weight: 3 });
          destMarker.setRadius(10);
        } else {
          destMarker.setStyle({ fillColor: "#f59e0b", color: "#fbbf24", fillOpacity: 0.8, weight: 2 });
          destMarker.setRadius(count > 3 ? 8 : 6);
        }
        destMarker.unbindTooltip();
        destMarker.bindTooltip(
          `<strong>${route.to}</strong><br>${destInfo.city}<br><span style="color:#f59e0b">${count} flight${count !== 1 ? "s" : ""}</span>`,
          { direction: "top", className: "airport-tooltip", offset: [0, -8] },
        );
      }

      let color = "rgba(245, 158, 11, 0.35)";
      let weight = 1.5;
      if (hasCancelled) { color = "rgba(255, 68, 68, 0.4)"; }
      else if (hasDelay) { color = "rgba(255, 170, 0, 0.4)"; }
      if (isSelected) { color = "#f59e0b"; weight = 3; }

      const curvedPoints = getCurvedPoints(
        [hubInfo.lat, hubInfo.lng],
        [destInfo.lat, destInfo.lng],
      );
      const polyline = L.polyline(curvedPoints, {
        color,
        weight,
        opacity: isSelected ? 1 : 0.7,
        dashArray: isSelected ? null : "6 4",
        className: "route-line",
      }).addTo(map);

      polyline.on("click", () => {
        setSelectedRoute(route);
        setSelectedAirport(route.to);
      });

      routeLinesRef.current.push(polyline);
    });
  }, [routes, hubAirport, selectedAirport, selectedRoute, allFlights]);

  function handleAirportClick(code) {
    if (code === hubAirport) {
      setSelectedAirport(null);
      setSelectedRoute(null);
      return;
    }
    setSelectedAirport(code);
    const route = routes.find((r) => r.to === code);
    setSelectedRoute(route || null);

    // Pan to show both hub and destination
    const destInfo = ALL_AIRPORTS[code];
    const hubInfo = ALL_AIRPORTS[hubAirport];
    if (destInfo && hubInfo && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(
        [[hubInfo.lat, hubInfo.lng], [destInfo.lat, destInfo.lng]],
        { padding: [60, 60], maxZoom: 7 },
      );
    }
  }

  // ── Sidebar route list ────────────────────────────────────────────────
  const routesSorted = [...routes].sort((a, b) => b.flights.length - a.flights.length);

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
            <Link to="/map" className="topnav-link active">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" /></svg>
              Route Map
            </Link>
            <Link to="/schedule" className="topnav-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              Schedule
            </Link>
          </div>
          <div className="topnav-right">
            <div className="live-indicator"><span className="live-dot"></span>Live</div>
            <div className="header-clock">{clock}</div>
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
          <button className="mobile-menu-btn" onClick={() => setMobileOpen((o) => !o)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-nav open">
          <Link to="/dashboard" className="mobile-nav-link">Dashboard</Link>
          <Link to="/flights" className="mobile-nav-link">Flights</Link>
          <Link to="/map" className="mobile-nav-link active">Route Map</Link>
          <Link to="/schedule" className="mobile-nav-link">Schedule</Link>
          <a href="#" className="mobile-nav-link" onClick={handleLogout}>Logout</a>
        </div>
      )}

      {/* ── Map Layout ── */}
      <div className="routemap-layout">
        {/* Sidebar */}
        <aside className="routemap-sidebar">
          <div className="rm-sidebar-header">
            <h2>Routes</h2>
            <select
              className="rm-hub-select"
              value={hubAirport}
              onChange={(e) => setHubAirport(e.target.value)}
            >
              {HUB_OPTIONS.map((code) => (
                <option key={code} value={code}>{code} — {ALL_AIRPORTS[code]?.city}</option>
              ))}
            </select>
            <p className="rm-hub-label">
              Hub: <strong>{ALL_AIRPORTS[hubAirport]?.city}</strong> · {routes.length} routes · {allFlights.length} flights
            </p>
          </div>

          {loading && (
            <div className="rm-loading">
              <div className="rm-spinner"></div>
              <span>Loading routes…</span>
            </div>
          )}

          {!loading && routes.length === 0 && (
            <div className="rm-empty">
              <p>No routes found from {hubAirport}</p>
            </div>
          )}

          <div className="rm-route-list">
            {routesSorted.map((r) => {
              const isActive = selectedRoute && selectedRoute.to === r.to;
              const hasDelay = r.statuses["delayed"] > 0;
              const hasCancelled = r.statuses["cancelled"] > 0;
              return (
                <button
                  key={r.to}
                  className={`rm-route-card${isActive ? " active" : ""}`}
                  onClick={() => handleAirportClick(r.to)}
                >
                  <div className="rm-route-pair">
                    <span className="rm-code">{r.from}</span>
                    <span className="rm-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="rm-code">{r.to}</span>
                  </div>
                  <div className="rm-route-meta">
                    <span className="rm-dest-name">{ALL_AIRPORTS[r.to]?.city || r.toName}</span>
                    <span className="rm-flight-count">
                      {r.flights.length} flight{r.flights.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="rm-route-badges">
                    {hasDelay && <span className="rm-badge delayed">{r.statuses["delayed"]} delayed</span>}
                    {hasCancelled && <span className="rm-badge cancelled">{r.statuses["cancelled"]} cancelled</span>}
                    {!hasDelay && !hasCancelled && <span className="rm-badge on-time">All on time</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Map area */}
        <div className="routemap-main">
          <div ref={mapContainerRef} className="routemap-canvas"></div>

          {/* Selected route detail overlay */}
          {selectedRoute && (
            <div className="rm-detail-panel">
              <div className="rm-detail-header">
                <div className="rm-detail-route">
                  <span className="rm-detail-code">{selectedRoute.from}</span>
                  <span className="rm-detail-arrow">→</span>
                  <span className="rm-detail-code">{selectedRoute.to}</span>
                </div>
                <button className="rm-detail-close" onClick={() => { setSelectedRoute(null); setSelectedAirport(null); }}>✕</button>
              </div>
              <div className="rm-detail-cities">
                {ALL_AIRPORTS[selectedRoute.from]?.city} to {ALL_AIRPORTS[selectedRoute.to]?.city}
              </div>
              <div className="rm-detail-flights">
                {selectedRoute.flights.map((f) => (
                  <div className="rm-flight-row" key={f.id}>
                    <span className="rm-flight-no">{f.no}</span>
                    <span className="rm-flight-airline">{f.airline}</span>
                    <span className="rm-flight-time">{f.depTime}</span>
                    <span className={`status-badge ${f.status}`}>{getStatusLabel(f.status)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map legend */}
          <div className="rm-legend">
            <div className="rm-legend-item">
              <span className="rm-legend-dot" style={{ background: "#f59e0b" }}></span> Hub
            </div>
            <div className="rm-legend-item">
              <span className="rm-legend-line" style={{ background: "rgba(245,158,11,0.5)" }}></span> Route
            </div>
            <div className="rm-legend-item">
              <span className="rm-legend-line" style={{ background: "rgba(255,170,0,0.6)" }}></span> Delayed
            </div>
            <div className="rm-legend-item">
              <span className="rm-legend-line" style={{ background: "rgba(255,68,68,0.6)" }}></span> Cancelled
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
