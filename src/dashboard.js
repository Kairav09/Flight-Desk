// ── Auth Guard ────────────────────────────────────────────────────────────
if (!localStorage.getItem("fd_isLoggedIn")) {
  window.location.href = "index.html?login=1";
}

// ── User Info ─────────────────────────────────────────────────────────────
const fullname = localStorage.getItem("fd_fullname") || "User";
const initials = fullname
  .split(" ")
  .map((w) => w[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);
document.getElementById("userAvatar").textContent = initials;
document.getElementById("userName").textContent = fullname;

// ── Topnav scroll shadow ───────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('topnav').classList.toggle('scrolled', window.scrollY > 10);
});

// ── User dropdown ──────────────────────────────────────────────────────────
const userMenu = document.getElementById('userMenu');
document.getElementById('userAvatarBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  userMenu.classList.toggle('open');
});
document.addEventListener('click', () => userMenu.classList.remove('open'));

// ── Mobile nav ─────────────────────────────────────────────────────────────
const mobileNav = document.getElementById('mobileNav');
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  mobileNav.classList.toggle('open');
});

// ── Stat counter animation ─────────────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 900;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-target]').forEach(animateCounter);
});
if (document.readyState !== 'loading') {
  document.querySelectorAll('[data-target]').forEach(animateCounter);
}

// ── Greeting ──────────────────────────────────────────────────────────────
const hour = new Date().getHours();
const greeting =
  hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
document.getElementById("welcomeMsg").innerHTML =
  `${greeting}, ${fullname.split(" ")[0]} <span style="-webkit-text-fill-color:initial;font-style:normal">👋</span>`;

// ── Clock ─────────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById("headerClock").textContent = now.toLocaleTimeString(
    "en-IN",
    { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false },
  );
}
updateClock();
setInterval(updateClock, 1000);

// ── Logout ────────────────────────────────────────────────────────────────
function handleLogout(e) {
  e.preventDefault();
  localStorage.removeItem('fd_isLoggedIn');
  window.location.href = 'index.html';
}
document.getElementById('logoutBtn').addEventListener('click', handleLogout);
const mobileLogout = document.getElementById('mobileLogout');
if (mobileLogout) mobileLogout.addEventListener('click', handleLogout);

// ── Flight Data ───────────────────────────────────────────────────────────
const API_KEY = "6ac32b909ac8954bf37d71fadc5e4520";

let flights = [];
let filteredFlights = [];

async function loadFlights() {
  try {
    document.getElementById("lastUpdated").textContent =
      "Fetching live flights...";

    const response = await fetch(
      `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&dep_iata=DEL`
    );

    const result = await response.json();

    if (!result.data) {
      throw new Error("No flight data returned");
    }

    flights = result.data.slice(0, 50).map((flight, index) => ({
      id: index + 1,

      no:
        flight.flight?.iata ||
        flight.flight?.icao ||
        "N/A",

      airline:
        flight.airline?.name ||
        "Unknown Airline",

      origin:
        flight.departure?.airport ||
        flight.departure?.iata ||
        "Unknown",

      originCode:
        flight.departure?.iata ||
        "",

      dest:
        flight.arrival?.airport ||
        flight.arrival?.iata ||
        "Unknown",

      destCode:
        flight.arrival?.iata ||
        "",

      date:
        formatDate(
          flight.departure?.scheduled
        ),

      gate:
        flight.departure?.gate ||
        "--",

      sched:
        formatTime(
          flight.departure?.scheduled
        ),

      est:
        formatTime(
          flight.departure?.estimated
        ),

      status:
        normalizeStatus(
          flight.flight_status
        ),

      terminal:
        flight.departure?.terminal ||
        "--",

      aircraft:
        flight.aircraft?.registration ||
        flight.aircraft?.icao24 ||
        "Unknown",

      duration: "--"
    }));

    filteredFlights = [...flights];

    updateAirlineFilter();
    renderTable();
    updateMapStats();
    initMap();

    document.getElementById(
      "lastUpdated"
    ).textContent =
      `Updated ${new Date().toLocaleTimeString()}`;

  } catch (error) {
    console.error(error);

    document.getElementById(
      "lastUpdated"
    ).textContent =
      "Failed to load live data";

    initMap();
  }
}

function formatTime(time) {
  if (!time) return "--";

  return new Date(time).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

function formatDate(time) {
  if (!time) return "--";

  return new Date(time).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

function updateMapStats(source = filteredFlights) {
  const total = source.length;
  const onTime = source.filter((f) => f.status === "on-time").length;
  const delayed = source.filter((f) => f.status === "delayed").length;
  const cancelled = source.filter((f) => f.status === "cancelled").length;

  document.getElementById("statTotalFlights").textContent = total;
  document.getElementById("statOnTimeFlights").textContent = onTime;
  document.getElementById("statDelayedFlights").textContent = delayed;
  document.getElementById("statCancelledFlights").textContent = cancelled;
}

function updateAirlineFilter() {
  const airlineFilter = document.getElementById("airlineFilter");
  const currentValue = airlineFilter.value;
  const airlines = [...new Set(
    flights
      .map((f) => f.airline)
      .filter((airline) => airline && airline !== "Unknown Airline")
  )].sort();

  airlineFilter.innerHTML = "";
  const allOption = new Option("All Airlines", "all");
  airlineFilter.add(allOption);
  airlines.forEach((airline) => {
    airlineFilter.add(new Option(airline, airline));
  });

  if ([...airlineFilter.options].some((option) => option.value === currentValue)) {
    airlineFilter.value = currentValue;
  }
}

function normalizeStatus(status) {
  if (!status) return "on-time";

  const s = status.toLowerCase();

  if (s.includes("delay"))
    return "delayed";

  if (s.includes("cancel"))
    return "cancelled";

  if (s.includes("land"))
    return "landed";

  if (
    s.includes("active") ||
    s.includes("boarding")
  )
    return "boarding";

  return "on-time";
}

// ── Pagination ────────────────────────────────────────────────────────────
const PER_PAGE = 10;
let currentPage = 1;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

const FLIGHT_COLUMNS = [
  { label: "Flight", className: "td-flight", render: (f) => escapeHtml(f.no) },
  { label: "Airline", className: "td-airline", render: (f) => escapeHtml(f.airline) },
  { label: "From", className: "td-origin", render: (f) => escapeHtml(f.origin) },
  { label: "Destination", className: "td-dest", render: (f) => escapeHtml(f.dest) },
  { label: "Date", className: "td-date", render: (f) => escapeHtml(f.date) },
  { label: "Gate", className: "td-gate", render: (f) => `<span class="gate-pill">${escapeHtml(f.gate)}</span>` },
  { label: "Scheduled", className: "td-time", render: (f) => escapeHtml(f.sched) },
  {
    label: "Estimated",
    className: (f) => `td-time ${f.status === "delayed" ? "td-est-delayed" : ""}`,
    render: (f) => escapeHtml(f.est),
  },
  {
    label: "Status",
    render: (f) => `<span class="status-badge ${escapeHtml(f.status)}">${escapeHtml(getStatusLabel(f.status))}</span>`,
  },
];

function renderTableHeader() {
  const header = document.getElementById("flightTableHeader");
  if (!header) return;

  header.innerHTML = FLIGHT_COLUMNS
    .map((column) => `<th>${escapeHtml(column.label)}</th>`)
    .join("") + "<th></th>";
}

function renderTable() {
  renderTableHeader();
  const tbody = document.getElementById("flightTableBody");
  const empty = document.getElementById("emptyState");
  const total = filteredFlights.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * PER_PAGE;
  const slice = filteredFlights.slice(start, start + PER_PAGE);

  if (slice.length === 0) {
    tbody.innerHTML = "";
    empty.style.display = "flex";
  } else {
    empty.style.display = "none";
    tbody.innerHTML = slice
      .map(
        (f, i) => `
      <tr onclick="openQuickPanel(${f.id})" style="animation-delay:${i * 0.045}s">
        ${FLIGHT_COLUMNS
          .map((column) => {
            const className = typeof column.className === "function"
              ? column.className(f)
              : column.className || "";
            return `<td class="${className}">${column.render(f)}</td>`;
          })
          .join("")}
        <td class="td-actions"><button class="view-btn" onclick="event.stopPropagation();openQuickPanel(${f.id})">View →</button></td>
      </tr>
    `,
      )
      .join("");
  }

  document.getElementById("showingCount").textContent =
    total === 0
      ? "No flights found"
      : `Showing ${start + 1}–${Math.min(start + PER_PAGE, total)} of ${total} flights`;
  document.getElementById("pageInfo").textContent =
    `Page ${currentPage} of ${totalPages}`;
  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage === totalPages;
  updateMapStats();

  // Update last updated
  document.getElementById("lastUpdated").textContent = "Updated just now";
}

// ── Filters ───────────────────────────────────────────────────────────────
function applyFilters() {
  const search = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  const status = document.getElementById("statusFilter").value;
  const airline = document.getElementById("airlineFilter").value;

  filteredFlights = flights.filter((f) => {
    const matchSearch =
      !search ||
      f.no.toLowerCase().includes(search) ||
      f.origin.toLowerCase().includes(search) ||
      f.originCode.toLowerCase().includes(search) ||
      f.dest.toLowerCase().includes(search) ||
      f.destCode.toLowerCase().includes(search) ||
      f.date.toLowerCase().includes(search) ||
      f.airline.toLowerCase().includes(search);
    const matchStatus = status === "all" || f.status === status;
    const matchAirline = airline === "all" || f.airline === airline;
    return matchSearch && matchStatus && matchAirline;
  });

  currentPage = 1;
  renderTable();
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document
  .getElementById("statusFilter")
  .addEventListener("change", applyFilters);
document
  .getElementById("airlineFilter")
  .addEventListener("change", applyFilters);

document.getElementById("prevBtn").addEventListener("click", () => {
  currentPage--;
  renderTable();
});
document.getElementById("nextBtn").addEventListener("click", () => {
  currentPage++;
  renderTable();
});

// ── Quick Panel ───────────────────────────────────────────────────────────
function openQuickPanel(id) {
  const f = flights.find((x) => x.id === id);
  if (!f) return;

  document.getElementById("qpFlightNo").textContent = f.no;
  document.getElementById("qpRoute").textContent = `${f.airline} · ${f.origin} to ${f.dest}`;
  document.getElementById("qpOrigin").textContent = f.origin;
  document.getElementById("qpDestination").textContent = f.dest;
  document.getElementById("qpDate").textContent = f.date;
  document.getElementById("qpGate").textContent = `Gate ${f.gate}`;
  document.getElementById("qpSched").textContent = f.sched;
  document.getElementById("qpEst").textContent = f.est;
  document.getElementById("qpAirline").textContent = f.airline;
  document.getElementById("qpAircraft").textContent = f.aircraft;
  document.getElementById("qpTerminal").textContent = f.terminal;
  document.getElementById("qpDuration").textContent = f.duration;

  const badge = document.getElementById("qpStatus");
  badge.className = `status-badge ${f.status}`;
  badge.textContent = getStatusLabel(f.status);

  // Track button
  const trackBtn = document.getElementById("qpTrackBtn");
  const subscribed = JSON.parse(localStorage.getItem("fd_subscribed") || "[]");
  const isSubscribed = subscribed.includes(f.id);
  trackBtn.textContent = isSubscribed
    ? "Unsubscribe"
    : "Subscribe to alerts";
  trackBtn.style.opacity = isSubscribed ? "0.7" : "1";
  trackBtn.onclick = () => toggleSubscription(f.id, trackBtn);

  document.getElementById("quickPanel").classList.add("open");
  document.getElementById("panelOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeQuickPanel() {
  document.getElementById("quickPanel").classList.remove("open");
  document.getElementById("panelOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function toggleSubscription(id, btn) {
  let subscribed = JSON.parse(localStorage.getItem("fd_subscribed") || "[]");
  if (subscribed.includes(id)) {
    subscribed = subscribed.filter((x) => x !== id);
    btn.textContent = "Subscribe to alerts";
    btn.style.opacity = "1";
  } else {
    subscribed.push(id);
    btn.textContent = "Unsubscribe";
    btn.style.opacity = "0.7";
  }
  localStorage.setItem("fd_subscribed", JSON.stringify(subscribed));
}

// ── Auto-refresh simulation (every 30s updates "last updated") ────────────
setInterval(() => {
  document.getElementById("lastUpdated").textContent = "Updated just now";
}, 30000);

// ── Init ──────────────────────────────────────────────────────────────────
loadFlights();

// Map restored for Aviationstack data.


// ── Leaflet India Map ─────────────────────────────────────────────────────
let activeCity = null;
const cityFlightCount = {};
flights.forEach((f) => {
  cityFlightCount[f.dest] = (cityFlightCount[f.dest] || 0) + 1;
});

const airportCoords = {
  Delhi: { lat: 28.5562, lng: 77.1000, code: 'DEL' },
  Mumbai: { lat: 19.0896, lng: 72.8656, code: 'BOM' },
  Bangalore: { lat: 13.1986, lng: 77.7066, code: 'BLR' },
  Hyderabad: { lat: 17.2403, lng: 78.4294, code: 'HYD' },
  Chennai: { lat: 12.9941, lng: 80.1709, code: 'MAA' },
  Kolkata: { lat: 22.6520, lng: 88.4463, code: 'CCU' },
  Pune: { lat: 18.5822, lng: 73.9197, code: 'PNQ' },
  Goa: { lat: 15.3809, lng: 73.8314, code: 'GOI' },
  Jaipur: { lat: 26.8242, lng: 75.8122, code: 'JAI' },
  Amritsar: { lat: 31.7096, lng: 74.7973, code: 'ATQ' },
};

const map = L.map('leafletMap', {
  center: [22.5, 78.5],
  zoom: 5,
  zoomControl: false,
  attributionControl: false,
  dragging: true,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  touchZoom: false,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 10,
  minZoom: 4,
}).addTo(map);

// Custom marker style
const markerMap = {};
Object.entries(airportCoords).forEach(([city, info]) => {
  const count = cityFlightCount[city] || 0;
  const marker = L.circleMarker([info.lat, info.lng], {
    radius: count > 2 ? 8 : 6,
    fillColor: '#f59e0b',
    fillOpacity: 0.85,
    color: '#fbbf24',
    weight: 2,
    className: 'leaflet-airport-marker',
  }).addTo(map);

  marker.bindTooltip(
    `<strong>${info.code}</strong><br>${city}<br><span style="color:#f59e0b">${count} flight${count !== 1 ? 's' : ''}</span>`,
    {
      direction: 'top',
      className: 'airport-tooltip',
      offset: [0, -8],
    }
  );

  marker.on('click', () => filterByCity(city));
  markerMap[city] = marker;
});

function initMap() {
  if (typeof L === 'undefined' || !Object.keys(markerMap).length) return;

  Object.keys(cityFlightCount).forEach((city) => {
    delete cityFlightCount[city];
  });

  flights.forEach((f) => {
    Object.entries(airportCoords).forEach(([city, info]) => {
      const matchesCode = f.destCode && f.destCode.toUpperCase() === info.code;
      const matchesCity = f.dest && f.dest.toLowerCase().includes(city.toLowerCase());

      if (matchesCode || matchesCity) {
        cityFlightCount[city] = (cityFlightCount[city] || 0) + 1;
      }
    });
  });

  Object.entries(markerMap).forEach(([city, marker]) => {
    const count = cityFlightCount[city] || 0;
    const info = airportCoords[city];
    const isActive = activeCity === city;

    marker.setStyle({
      fillColor: isActive ? '#ffffff' : '#f59e0b',
      color: isActive ? '#f59e0b' : '#fbbf24',
      weight: isActive ? 3 : 2,
    });
    marker.setRadius(isActive ? 10 : count > 2 ? 8 : 6);
    marker.setTooltipContent(
      `<strong>${info.code}</strong><br>${city}<br><span style="color:#f59e0b">${count} flight${count !== 1 ? 's' : ''}</span>`
    );
  });
}

function filterByCity(city) {
  if (activeCity === city) {
    clearMapFilter();
    return;
  }
  activeCity = city;

  // Highlight active marker
  Object.entries(markerMap).forEach(([c, m]) => {
    if (c === city) {
      m.setStyle({ fillColor: '#ffffff', color: '#f59e0b', weight: 3, radius: 10 });
    } else {
      m.setStyle({ fillColor: '#f59e0b', color: '#fbbf24', weight: 2, radius: cityFlightCount[c] > 2 ? 8 : 6 });
    }
  });

  // Show filter label
  document.getElementById('mapFilterText').textContent = city;
  document.getElementById('mapFilterLabel').style.display = 'flex';

  // Filter flight table
  document.getElementById('searchInput').value = airportCoords[city].code;
  applyFilters();
}

function clearMapFilter() {
  activeCity = null;
  Object.entries(markerMap).forEach(([c, m]) => {
    m.setStyle({ fillColor: '#f59e0b', color: '#fbbf24', weight: 2, radius: cityFlightCount[c] > 2 ? 8 : 6 });
  });
  document.getElementById('mapFilterLabel').style.display = 'none';
  document.getElementById('searchInput').value = '';
  applyFilters();
}
