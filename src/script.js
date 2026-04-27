// ── Navbar scroll ─────────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 40));

// ── Mobile menu toggle ────────────────────────────────────────────────────
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}


// ── Live clock on hero board ───────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('heroTime');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
updateClock();
setInterval(updateClock, 1000);

// ── Scroll reveal ──────────────────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = parseFloat(entry.target.style.animationDelay || '0') * 1000;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .feature-card, .step').forEach(el => observer.observe(el));

// ── Modal controls ─────────────────────────────────────────────────────────
function openModal(type) {
  document.getElementById(type + 'Modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(type) {
  document.getElementById(type + 'Modal').classList.remove('open');
  document.body.style.overflow = '';
}
function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 220);
}
function handleOverlayClick(e, type) {
  if (e.target === e.currentTarget) closeModal(type);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['login', 'signup'].forEach(t => {
      const m = document.getElementById(t + 'Modal');
      if (m && m.classList.contains('open')) closeModal(t);
    });
  }
});

// ── Auth helpers ───────────────────────────────────────────────────────────
function getUsers() { return JSON.parse(localStorage.getItem('fd_users') || '[]'); }
function saveUsers(users) { localStorage.setItem('fd_users', JSON.stringify(users)); }

// ── Login ──────────────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');
  const user = getUsers().find(u =>
    (u.username.toLowerCase() === id.toLowerCase() || u.email.toLowerCase() === id.toLowerCase()) && u.password === pw
  );
  if (user) {
    ['username', 'email', 'fullname', 'password'].forEach(k => localStorage.setItem('fd_' + k, user[k]));
    localStorage.setItem('fd_isLoggedIn', 'true');
    window.location.href = 'dashboard.html';
  } else {
    err.classList.add('show');
    setTimeout(() => err.classList.remove('show'), 3000);
  }
});

// ── Signup ─────────────────────────────────────────────────────────────────
document.getElementById('signupForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const fullname = document.getElementById('fullname').value.trim();
  const username = document.getElementById('username').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const err = document.getElementById('signupError');

  if (password.length < 6) {
    err.textContent = 'Password must be at least 6 characters.';
    err.classList.add('show'); return;
  }
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    err.textContent = 'Email already registered.';
    err.classList.add('show'); return;
  }
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    err.textContent = 'Username already taken.';
    err.classList.add('show'); return;
  }

  users.push({ fullname, username, email, password });
  saveUsers(users);
  document.getElementById('signupForm').reset();
  switchModal('signup', 'login');
  setTimeout(() => {
    const msg = document.getElementById('loginSuccess');
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 5000);
  }, 300);
});

// ── Input lift effect (ported from FinTrack) ───────────────────────────────
document.querySelectorAll('.form-group input').forEach(input => {
  input.addEventListener('focus', function () { this.parentElement.style.cssText = 'transform:translateY(-1px);transition:transform .2s'; });
  input.addEventListener('blur',  function () { this.parentElement.style.transform = ''; });
});

// ── Auto-open modal from redirect ──────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
if (params.get('signup') === '1') openModal('signup');
if (params.get('login')  === '1') {
  openModal('login');
  const msg = document.getElementById('loginSuccess');
  if (msg) { msg.classList.add('show'); setTimeout(() => msg.classList.remove('show'), 5000); }
}

// ── Stat counter animation ─────────────────────────────────────────────────
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const h3 = entry.target.querySelector('h3');
    if (!h3 || h3.dataset.counted) return;
    h3.dataset.counted = '1';
    const raw = h3.textContent.trim();
    const match = raw.match(/^([<]?)([0-9,]+)(.*)/);
    if (!match) return;
    const prefix = match[1], target = parseInt(match[2].replace(/,/g, '')), suffix = match[3];
    const duration = 1800, start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const val = Math.round(ease * target);
      h3.textContent = prefix + val.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    statObserver.unobserve(entry.target);
  });
}, { threshold: 0.3 });
document.querySelectorAll('.stat-item').forEach(el => statObserver.observe(el));

