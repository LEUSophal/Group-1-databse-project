// ========== APP.JS - Shared Utilities ==========

// --- Navbar ---
function renderNavbar(activePage) {
  const user = getCurrentUser();
  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <div class="container">
      <a href="index.html" class="nav-logo">
        <div style="width:12px;height:12px;border-radius:50%;background:var(--blue);"></div>
        RentEase
      </a>
      <nav class="nav-links" id="navLinks">
        <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="properties.html" class="${activePage === 'properties' ? 'active' : ''}">Properties</a>
        ${user && user.role === 'tenant' ? `<a href="tenant-dashboard.html" class="${activePage === 'tenant' ? 'active' : ''}">My Dashboard</a>` : ''}
        ${user && user.role === 'landlord' ? `<a href="landlord-dashboard.html" class="${activePage === 'landlord' ? 'active' : ''}">My Dashboard</a>` : ''}
      </nav>
      <div class="nav-actions">
        ${user ? `
          <div class="nav-user" id="navUser" onclick="toggleUserMenu()">
            <div class="nav-avatar">${user.name.charAt(0)}</div>
            <span style="font-size:var(--text-sm);font-weight:600;color:var(--navy)">${user.name}</span>
          </div>
          <div id="userDropdown" class="user-dropdown hidden">
            <a href="${user.role === 'tenant' ? 'tenant-dashboard.html' : 'landlord-dashboard.html'}" class="sidebar-link" style="text-decoration:none;padding:8px;color:var(--slate)">
              Dashboard
            </a>
            <button onclick="logout()" class="sidebar-link" style="width:100%;color:var(--danger);padding:8px">
              Logout
            </button>
          </div>
        ` : `
          <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
          <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
        `}
        <div class="hamburger" id="hamburger" onclick="toggleMobileMenu()">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
}

function toggleMobileMenu() {
  document.getElementById('navLinks')?.classList.toggle('open');
  document.getElementById('hamburger')?.classList.toggle('active');
}

function toggleUserMenu() {
  document.getElementById('userDropdown')?.classList.toggle('hidden');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('userDropdown');
  const nu = document.getElementById('navUser');
  if (dd && nu && !nu.contains(e.target) && !dd.contains(e.target)) {
    dd.classList.add('hidden');
  }
});

// --- Footer ---
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="nav-logo" style="color:#fff;font-size:24px;">
            <div style="width:12px;height:12px;border-radius:50%;background:#60A5FA;"></div>
            RentEase
          </a>
          <p>Find your perfect rental home in Phnom Penh. We connect tenants with quality landlords for a seamless renting experience.</p>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <a href="properties.html">Browse Properties</a>
          <a href="login.html">Tenant Login</a>
          <a href="register.html">List Your Property</a>
        </div>
        <div class="footer-col">
          <h4>Locations</h4>
          <a href="#">Toul Kork</a>
          <a href="#">BKK1</a>
          <a href="#">Sen Sok</a>
          <a href="#">Chamkar Mon</a>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <a href="#">support@rentease.kh</a>
          <a href="#">+855 12 345 678</a>
          <a href="#">Phnom Penh, Cambodia</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 RentEase. All rights reserved.</p>
        <div class="footer-social">
          <a href="#" aria-label="Facebook">📘</a>
          <a href="#" aria-label="Instagram">📷</a>
          <a href="#" aria-label="Telegram">✈️</a>
        </div>
      </div>
    </div>
  `;
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Scroll Reveal ---
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach(el => observer.observe(el));
}

// --- Count Up Animation ---
function animateCountUp(el) {
  const target = parseInt(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  let current = 0;
  const step = Math.max(1, Math.floor(target / 60));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current.toLocaleString() + suffix;
  }, 20);
}

function initCountUp() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCountUp(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));
}

// --- Property Card Renderer ---
function renderPropertyCard(property) {
  const rooms = getPropertyRooms(property.idProperty);
  const avgRating = getPropertyAvgRating(property.idProperty);
  const minPrice = getPropertyMinPrice(property.idProperty);
  const reviewCount = getPropertyReviews(property.idProperty).length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;

  return `
    <div class="card" onclick="location.href='property-detail.html?id=${property.idProperty}'">
      <div class="card-img-wrapper">
        <img src="${property.image}" alt="${property.title}" class="card-img" onerror="this.src='https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop'">
        <span class="card-badge badge-success">${availableRooms} room${availableRooms !== 1 ? 's' : ''} available</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${property.title}</h3>
        <div class="card-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${property.location}
        </div>
        <div class="card-meta" style="margin-top:var(--space-4)">
          <div class="card-price">$${minPrice}<span>/mo</span></div>
          <div class="card-rating">
            ${generateStars(Math.round(avgRating), 14)}
            <span style="font-size:var(--text-xs);color:var(--text-tertiary);margin-left:4px">${avgRating} (${reviewCount})</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCountUp();
});
