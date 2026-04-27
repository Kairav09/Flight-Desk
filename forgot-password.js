let generatedOtp = "";

// ── Step dots ────────────────────────────────────────────────────────────
function setStep(n) {
  [1,2,3,4].forEach(i => {
    const d = document.getElementById('dot' + i);
    d.className = 'step-dot' + (i < n ? ' done' : i === n ? ' active' : '');
  });
}

// ── Step 1: Send OTP ─────────────────────────────────────────────────────
document.getElementById('forgotForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const users = JSON.parse(localStorage.getItem('fd_users') || '[]');
  if (!users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    alert('No account found with that email. Please check and try again.'); return;
  }
  generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  alert(`Your OTP is: ${generatedOtp}\n\n(In a real app, this would be sent to your email)`);
  document.getElementById('step1').style.display = 'none';
  document.getElementById('step2').style.display = 'block';
  setTimeout(() => setStep(2), 10);
});

// ── Step 2: Verify OTP ───────────────────────────────────────────────────
document.getElementById('otpForm').addEventListener('submit', function(e) {
  e.preventDefault();
  if (document.getElementById('otp').value !== generatedOtp) {
    alert('Invalid OTP. Please try again.'); return;
  }
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3').style.display = 'block';
  setTimeout(() => setStep(3), 10);
});

// ── Resend OTP ───────────────────────────────────────────────────────────
document.getElementById('resendOtp').addEventListener('click', function(e) {
  e.preventDefault();
  generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  alert(`New OTP is: ${generatedOtp}\n\n(In a real app, this would be sent to your email)`);
});

// ── Step 3: Reset password ───────────────────────────────────────────────
document.getElementById('resetForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (newPassword.length < 6) { alert('Password must be at least 6 characters.'); return; }
  if (newPassword !== confirmPassword) { alert('Passwords do not match.'); return; }

  const email = document.getElementById('email').value;
  const users = JSON.parse(localStorage.getItem('fd_users') || '[]');
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx !== -1) users[idx].password = newPassword;
  localStorage.setItem('fd_users', JSON.stringify(users));

  document.getElementById('step3').style.display = 'none';
  document.getElementById('step4').style.display = 'block';
  setTimeout(() => setStep(4), 10);
});

// ── Input lift effect ────────────────────────────────────────────────────
document.querySelectorAll('.form-group input').forEach(input => {
  input.addEventListener('focus', function() { this.parentElement.style.cssText = 'transform:translateY(-1px);transition:transform .2s'; });
  input.addEventListener('blur',  function() { this.parentElement.style.transform = ''; });
});
