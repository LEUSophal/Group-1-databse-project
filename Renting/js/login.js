// ── TAB SWITCHING ──
function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('panelLogin').style.display = isLogin ? 'block' : 'none';
  document.getElementById('panelRegister').style.display = isLogin ? 'none' : 'block';
  document.getElementById('formTitle').textContent = isLogin ? 'Welcome Back' : 'Create Account';
  document.getElementById('formSubtitle').textContent = isLogin
    ? 'Sign in to your account'
    : 'Join tenants & landlords in Cambodia';
  // Clear all errors when switching tabs
  if (typeof clearLoginErrors === 'function') clearLoginErrors();
  if (typeof clearRegErrors   === 'function') clearRegErrors();
}

// ── ROLE SELECTION ──
let selectedRole = 'tenant';
function selectRole(role) {
  selectedRole = role;
  ['tenant','landlord','admin'].forEach(r => {
    document.getElementById('role-'+r).classList.toggle('selected', r === role);
  });
}

// ── PASSWORD TOGGLE ──
function togglePw(id, btn) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

// ── VALIDATION HELPERS ──
function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = 'block';
}
function hideErr(id) {
  document.getElementById(id).style.display = 'none';
}
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ── LOGIN ──
function doLogin() {
  loginUser();
}

// ── REGISTER ──
function doRegister() {
  registerUser();
}

// ── SUCCESS REDIRECT ──
function showSuccess(role, isNew) {
  const formPanel = document.querySelector('.form-container');
  const successPanel = document.getElementById('successPanel');
  
  if (formPanel) formPanel.style.display = 'none';
  
  // If we don't have a success panel, just show a toast and redirect immediately
  if (!successPanel) {
    showToast("✅ Login successful! Redirecting...");
    const urls = { tenant: 'tenant_dashboard.html', landlord: 'landlord-dashboard.html', admin: 'admin-panel.html' };
    setTimeout(() => { window.location.href = urls[role] || 'index.html'; }, 1000);
    return;
  }

  successPanel.style.display = 'block';

  const icons  = { tenant: '🎉', landlord: '🏠', admin: '🛡️' };
  const titles = { tenant: 'Welcome to RoomNest!', landlord: 'Landlord Portal Ready!', admin: 'Admin Access Granted!' };
  const msgs   = {
    tenant:   isNew ? 'Your tenant account is created. Start browsing rooms!' : 'Welcome back! Taking you to your dashboard.',
    landlord: isNew ? 'Your landlord account is set up. Start listing your properties!' : 'Welcome back! Taking you to your dashboard.',
    admin:    isNew ? 'Admin account created. You now have full platform access.' : 'Welcome back, Admin!'
  };
  const urls   = { tenant: 'tenant_dashboard.html', landlord: 'landlord-dashboard.html', admin: 'admin-panel.html' };

  const iconEl = document.getElementById('successIcon');
  const titleEl = document.getElementById('successTitle');
  const msgEl = document.getElementById('successMsg');
  const btnEl = document.getElementById('successBtn');

  if (iconEl) iconEl.textContent = icons[role] || '🎉';
  if (titleEl) titleEl.textContent = titles[role] || 'Welcome!';
  if (msgEl) msgEl.textContent = msgs[role] || '';
  if (btnEl) {
    btnEl.href = urls[role] || 'index.html';
    btnEl.textContent = role === 'landlord' ? 'Go to Dashboard →' : role === 'admin' ? 'Go to Admin Panel →' : 'Browse Rooms →';
  }

  // Auto redirect after 2s
  setTimeout(() => { window.location.href = urls[role] || 'index.html'; }, 2000);
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── CHECK URL PARAM ──
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'register') switchTab('register');
  if (params.get('role')) {
    switchTab('register');
    selectRole(params.get('role'));
  }
});
