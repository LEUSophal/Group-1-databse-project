// ========== AUTH.JS ==========

function getCurrentUser() {
  const data = sessionStorage.getItem('rentease_user');
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user) {
  sessionStorage.setItem('rentease_user', JSON.stringify(user));
}

function logout() {
  sessionStorage.removeItem('rentease_user');
  window.location.href = 'index.html';
}

function requireAuth(allowedRole) {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  if (allowedRole && user.role !== allowedRole) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

// --- Login ---
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const role = document.querySelector('.role-tab.active')?.dataset.role || 'tenant';

  try {
    const data = await apiLogin(email, password, role);
    if (data.success) {
      setCurrentUser({
        id: role === 'tenant' ? data.user.idTenant : data.user.idLandlord,
        name: data.user.full_name || data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: role
      });

      showToast(`Welcome back, ${data.user.full_name || data.user.name}!`, 'success');
      setTimeout(() => {
        window.location.href = role === 'tenant' ? 'tenant-dashboard.html' : 'landlord-dashboard.html';
      }, 800);
    } else {
      showToast('Invalid email or password. Try: dara@mail.com / tenant123', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to server', 'error');
  }
}

// --- Register ---
async function handleRegister(e) {
  e.preventDefault();
  const role = document.querySelector('.role-tab.active')?.dataset.role || 'tenant';
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  if (password !== confirm) {
    showToast('Passwords do not match!', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }

  try {
    const data = await apiRegister(name, email, phone, password, role);
    if (data.success) {
      setCurrentUser(data.user);
      showToast('Account created successfully!', 'success');
      setTimeout(() => {
        window.location.href = role === 'tenant' ? 'tenant-dashboard.html' : 'landlord-dashboard.html';
      }, 800);
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to server', 'error');
  }
}

// --- Role Tab Switching ---
function initRoleTabs() {
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}
