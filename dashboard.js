// ── Auth Guard ────────────────────────────────────────────────────────────
if (!localStorage.getItem('fd_isLoggedIn')) {
  window.location.href = 'index.html?login=1';
}

// ── User Info ─────────────────────────────────────────────────────────────
const fullname = localStorage.getItem('fd_fullname') || 'User';
const initials = fullname.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
document.getElementById('userAvatar').textContent = initials;
document.getElementById('userName').textContent = fullname;

// ── Greeting ──────────────────────────────────────────────────────────────
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
document.getElementById('welcomeMsg').textContent = `${greeting}, ${fullname.split(' ')[0]} 👋`;

// ── Clock ─────────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('headerClock').textContent =
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
updateClock(); setInterval(updateClock, 1000);

// ── Sidebar collapse ──────────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');
document.getElementById('sidebarCollapse').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');
});

// ── Mobile sidebar ────────────────────────────────────────────────────────
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  sidebar.classList.toggle('mobile-open');
});

// ── Logout ────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('fd_isLoggedIn');
  window.location.href = 'index.html';
});

// ── Flight Data ───────────────────────────────────────────────────────────
const flights = [
  { id:1,  no:'AI 202',  airline:'Air India',  dest:'Mumbai',    gate:'B4',  sched:'06:15', est:'06:15', status:'on-time',  terminal:'T2', aircraft:'Boeing 737',  duration:'2h 10m' },
  { id:2,  no:'6E 441',  airline:'IndiGo',     dest:'Delhi',     gate:'A12', sched:'06:45', est:'07:20', status:'delayed',  terminal:'T1', aircraft:'Airbus A320', duration:'2h 30m' },
  { id:3,  no:'SG 118',  airline:'SpiceJet',   dest:'Bangalore', gate:'C7',  sched:'07:00', est:'07:00', status:'on-time',  terminal:'T1', aircraft:'Boeing 737',  duration:'1h 45m' },
  { id:4,  no:'UK 995',  airline:'Vistara',    dest:'Chennai',   gate:'D2',  sched:'07:30', est:'07:30', status:'boarding', terminal:'T2', aircraft:'Airbus A320', duration:'1h 50m' },
  { id:5,  no:'QP 301',  airline:'Akasa Air',  dest:'Hyderabad', gate:'A9',  sched:'07:55', est:'07:55', status:'cancelled',terminal:'T1', aircraft:'Boeing 737',  duration:'1h 20m' },
  { id:6,  no:'AI 405',  airline:'Air India',  dest:'Kolkata',   gate:'B8',  sched:'08:10', est:'08:10', status:'on-time',  terminal:'T2', aircraft:'Airbus A321', duration:'2h 50m' },
  { id:7,  no:'6E 552',  airline:'IndiGo',     dest:'Pune',      gate:'A3',  sched:'08:30', est:'09:00', status:'delayed',  terminal:'T1', aircraft:'Airbus A320', duration:'1h 10m' },
  { id:8,  no:'SG 220',  airline:'SpiceJet',   dest:'Goa',       gate:'C2',  sched:'08:45', est:'08:45', status:'on-time',  terminal:'T1', aircraft:'Boeing 737',  duration:'1h 30m' },
  { id:9,  no:'UK 102',  airline:'Vistara',    dest:'Mumbai',    gate:'D6',  sched:'09:00', est:'09:00', status:'boarding', terminal:'T2', aircraft:'Airbus A320', duration:'2h 10m' },
  { id:10, no:'QP 215',  airline:'Akasa Air',  dest:'Jaipur',    gate:'A5',  sched:'09:15', est:'09:15', status:'on-time',  terminal:'T1', aircraft:'Boeing 737',  duration:'1h 40m' },
  { id:11, no:'AI 611',  airline:'Air India',  dest:'Ahmedabad', gate:'B2',  sched:'09:30', est:'10:05', status:'delayed',  terminal:'T2', aircraft:'Airbus A319', duration:'1h 25m' },
  { id:12, no:'6E 773',  airline:'IndiGo',     dest:'Srinagar',  gate:'A7',  sched:'09:45', est:'09:45', status:'on-time',  terminal:'T1', aircraft:'Airbus A320', duration:'3h 00m' },
  { id:13, no:'SG 334',  airline:'SpiceJet',   dest:'Kochi',     gate:'C9',  sched:'10:00', est:'10:00', status:'on-time',  terminal:'T1', aircraft:'Boeing 737',  duration:'2h 30m' },
  { id:14, no:'UK 781',  airline:'Vistara',    dest:'Delhi',     gate:'D1',  sched:'10:20', est:'10:20', status:'on-time',  terminal:'T2', aircraft:'Airbus A321', duration:'2h 30m' },
  { id:15, no:'AI 822',  airline:'Air India',  dest:'Varanasi',  gate:'B6',  sched:'10:40', est:'10:40', status:'on-time',  terminal:'T2', aircraft:'Airbus A319', duration:'2h 00m' },
  { id:16, no:'6E 901',  airline:'IndiGo',     dest:'Chandigarh',gate:'A11', sched:'11:00', est:'11:45', status:'delayed',  terminal:'T1', aircraft:'Airbus A320', duration:'2h 20m' },
  { id:17, no:'QP 440',  airline:'Akasa Air',  dest:'Bhopal',    gate:'A4',  sched:'11:15', est:'11:15', status:'on-time',  terminal:'T1', aircraft:'Boeing 737',  duration:'1h 35m' },
  { id:18, no:'SG 512',  airline:'SpiceJet',   dest:'Nagpur',    gate:'C4',  sched:'11:30', est:'11:30', status:'landed',   terminal:'T1', aircraft:'Boeing 737',  duration:'1h 15m' },
  { id:19, no:'UK 334',  airline:'Vistara',    dest:'Bangalore', gate:'D9',  sched:'11:50', est:'11:50', status:'on-time',  terminal:'T2', aircraft:'Airbus A320', duration:'1h 45m' },
  { id:20, no:'AI 199',  airline:'Air India',  dest:'Amritsar',  gate:'B10', sched:'12:10', est:'12:10', status:'cancelled',terminal:'T2', aircraft:'Airbus A319', duration:'2h 40m' },
];

// ── Pagination ────────────────────────────────────────────────────────────
const PER_PAGE = 10;
let currentPage = 1;
let filteredFlights = [...flights];

function getStatusLabel(s) {
  return { 'on-time':'On Time', 'delayed':'Delayed', 'boarding':'Boarding', 'cancelled':'Cancelled', 'landed':'Landed' }[s] || s;
}

function renderTable() {
  const tbody = document.getElementById('flightTableBody');
  const empty = document.getElementById('emptyState');
  const total = filteredFlights.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * PER_PAGE;
  const slice = filteredFlights.slice(start, start + PER_PAGE);

  if (slice.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = slice.map((f, i) => `
      <tr onclick="openQuickPanel(${f.id})" style="animation-delay:${i * 0.04}s">
        <td class="td-flight">${f.no}</td>
        <td class="td-airline">${f.airline}</td>
        <td class="td-dest">${f.dest}</td>
        <td class="td-gate">${f.gate}</td>
        <td class="td-time">${f.sched}</td>
        <td class="td-time ${f.status === 'delayed' ? 'td-est-delayed' : ''}">${f.est}</td>
        <td><span class="status-badge ${f.status}">${getStatusLabel(f.status)}</span></td>
        <td class="td-actions"><button class="view-btn" onclick="event.stopPropagation();openQuickPanel(${f.id})">View →</button></td>
      </tr>
    `).join('');
  }

  document.getElementById('showingCount').textContent =
    total === 0 ? 'No flights found' : `Showing ${start + 1}–${Math.min(start + PER_PAGE, total)} of ${total} flights`;
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = currentPage === totalPages;

  // Update last updated
  document.getElementById('lastUpdated').textContent = 'Updated just now';
}

// ── Filters ───────────────────────────────────────────────────────────────
function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const status = document.getElementById('statusFilter').value;
  const airline = document.getElementById('airlineFilter').value;

  filteredFlights = flights.filter(f => {
    const matchSearch = !search ||
      f.no.toLowerCase().includes(search) ||
      f.dest.toLowerCase().includes(search) ||
      f.airline.toLowerCase().includes(search);
    const matchStatus  = status  === 'all' || f.status  === status;
    const matchAirline = airline === 'all' || f.no.startsWith(airline);
    return matchSearch && matchStatus && matchAirline;
  });

  currentPage = 1;
  renderTable();
}

document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('airlineFilter').addEventListener('change', applyFilters);

document.getElementById('prevBtn').addEventListener('click', () => { currentPage--; renderTable(); });
document.getElementById('nextBtn').addEventListener('click', () => { currentPage++; renderTable(); });

// ── Quick Panel ───────────────────────────────────────────────────────────
function openQuickPanel(id) {
  const f = flights.find(x => x.id === id);
  if (!f) return;

  document.getElementById('qpFlightNo').textContent = f.no;
  document.getElementById('qpRoute').textContent = `${f.airline} · ${f.dest}`;
  document.getElementById('qpGate').textContent = `Gate ${f.gate}`;
  document.getElementById('qpSched').textContent = f.sched;
  document.getElementById('qpEst').textContent = f.est;
  document.getElementById('qpAirline').textContent = f.airline;
  document.getElementById('qpAircraft').textContent = f.aircraft;
  document.getElementById('qpTerminal').textContent = f.terminal;
  document.getElementById('qpDuration').textContent = f.duration;

  const badge = document.getElementById('qpStatus');
  badge.className = `status-badge ${f.status}`;
  badge.textContent = getStatusLabel(f.status);

  // Track button
  const trackBtn = document.getElementById('qpTrackBtn');
  const subscribed = JSON.parse(localStorage.getItem('fd_subscribed') || '[]');
  const isSubscribed = subscribed.includes(f.id);
  trackBtn.textContent = isSubscribed ? '✓ Subscribed' : '🔔 Subscribe to alerts';
  trackBtn.style.opacity = isSubscribed ? '0.7' : '1';
  trackBtn.onclick = () => toggleSubscription(f.id, trackBtn);

  document.getElementById('quickPanel').classList.add('open');
  document.getElementById('panelOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeQuickPanel() {
  document.getElementById('quickPanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function toggleSubscription(id, btn) {
  let subscribed = JSON.parse(localStorage.getItem('fd_subscribed') || '[]');
  if (subscribed.includes(id)) {
    subscribed = subscribed.filter(x => x !== id);
    btn.textContent = '🔔 Subscribe to alerts';
    btn.style.opacity = '1';
  } else {
    subscribed.push(id);
    btn.textContent = '✓ Subscribed';
    btn.style.opacity = '0.7';
  }
  localStorage.setItem('fd_subscribed', JSON.stringify(subscribed));
}

// ── Auto-refresh simulation (every 30s updates "last updated") ────────────
setInterval(() => {
  document.getElementById('lastUpdated').textContent = 'Updated just now';
}, 30000);

// ── Init ──────────────────────────────────────────────────────────────────
renderTable();
