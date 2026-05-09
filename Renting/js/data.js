// ========== API DATA LAYER ==========
const API_URL = 'http://localhost:3000/api';

let MOCK_DATA = {
  admins: [], tenants: [], landlords: [],
  properties: [], rooms: [], bookings: [],
  reviews: [], room_images: [], facilities: [], room_facilities: []
};

// Initialization - Load all data from API
async function initData() {
  try {
    const propsRes = await fetch(`${API_URL}/properties`);
    const propsJson = await propsRes.json();
    MOCK_DATA.properties = Array.isArray(propsJson) ? propsJson : [];

    const roomsRes = await fetch(`${API_URL}/rooms`);
    const roomsJson = await roomsRes.json();
    MOCK_DATA.rooms = Array.isArray(roomsJson) ? roomsJson : [];

    const bookingsRes = await fetch(`${API_URL}/bookings`);
    const bookingsJson = await bookingsRes.json();
    MOCK_DATA.bookings = Array.isArray(bookingsJson) ? bookingsJson : [];

    const reviewsRes = await fetch(`${API_URL}/reviews`);
    const reviewsJson = await reviewsRes.json();
    MOCK_DATA.reviews = Array.isArray(reviewsJson) ? reviewsJson : [];
  } catch (err) {
    console.error("Failed to load data from API:", err);
  }
}

// ========== HELPER FUNCTIONS (Sync - reads from local cache) ==========
function getPropertyRooms(propertyId) { return MOCK_DATA.rooms.filter(r => String(r.Property_idProperty) === String(propertyId)); }
function getPropertyReviews(propertyId) { return MOCK_DATA.reviews.filter(r => String(r.Property_idProperty) === String(propertyId)); }
function getPropertyAvgRating(propertyId) {
  const reviews = getPropertyReviews(propertyId);
  if (reviews.length === 0) return 0;
  return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
}
function getPropertyMinPrice(propertyId) {
  const rooms = getPropertyRooms(propertyId);
  if (rooms.length === 0) return 0;
  return Math.min(...rooms.map(r => r.price));
}
function getLandlord(landlordId) { return MOCK_DATA.landlords.find(l => String(l.idLandlord) === String(landlordId)) || {name: 'Landlord'}; }
function getTenant(tenantId) { return MOCK_DATA.tenants.find(t => String(t.idTenant) === String(tenantId)) || {full_name: 'Tenant'}; }
function getRoomFacilities(roomId) { return []; }
function getRoomImages(roomId) { return []; }
function getRoom(roomId) { return MOCK_DATA.rooms.find(r => String(r.idRoom) === String(roomId)); }
function getProperty(propertyId) { return MOCK_DATA.properties.find(p => String(p.idProperty) === String(propertyId)); }
function getTenantBookings(tenantId) { return MOCK_DATA.bookings.filter(b => String(b.Tenant_idTenant) === String(tenantId)); }
function getTenantReviews(tenantId) { return MOCK_DATA.reviews.filter(r => String(r.Tenant_idTenant) === String(tenantId)); }
function getLandlordProperties(landlordId) { return MOCK_DATA.properties.filter(p => String(p.Landlord_idLandlord) === String(landlordId)); }
function getPropertyBookings(propertyId) {
  const roomIds = getPropertyRooms(propertyId).map(r => String(r.idRoom));
  return MOCK_DATA.bookings.filter(b => roomIds.includes(String(b.Room_idRoom)));
}
function getLandlordBookings(landlordId) {
  const props = getLandlordProperties(landlordId);
  let bookings = [];
  props.forEach(p => { bookings = bookings.concat(getPropertyBookings(p.idProperty)); });
  return bookings;
}

function generateStars(rating, size = 16) {
  let html = '<div class="stars">';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      html += `<svg class="filled" width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    } else {
      html += `<svg class="empty" width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    }
  }
  html += '</div>';
  return html;
}

function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
function getStatusBadge(status) {
  const map = { confirmed: 'success', pending: 'warning', cancelled: 'danger', available: 'success', booked: 'info', maintenance: 'warning' };
  return `<span class="badge badge-${map[status] || 'info'}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

// ========== API WRITE FUNCTIONS ==========
async function apiAddProperty(property) {
  const res = await fetch(`${API_URL}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(property)
  });
  return res.json();
}

async function apiDeleteProperty(id) {
  const res = await fetch(`${API_URL}/properties/${id}`, { method: 'DELETE' });
  return res.json();
}

async function apiAddBooking(booking) {
  const res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });
  return res.json();
}

async function apiUpdateBooking(id, status) {
  const res = await fetch(`${API_URL}/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.json();
}

async function apiDeleteBooking(id) {
  const res = await fetch(`${API_URL}/bookings/${id}`, { method: 'DELETE' });
  return res.json();
}

async function apiLogin(email, password, role) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });
  return res.json();
}

async function apiRegister(name, email, phone, password, role) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, password, role })
  });
  return res.json();
}

// ========== ROOMS API ==========
async function apiAddRoom(room) {
  const res = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room)
  });
  return res.json();
}

async function apiUpdateRoom(id, data) {
  const res = await fetch(`${API_URL}/rooms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function apiDeleteRoom(id) {
  const res = await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' });
  return res.json();
}

// ========== REVIEWS API ==========
async function apiAddReview(review) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review)
  });
  return res.json();
}

async function apiDeleteReview(id) {
  const res = await fetch(`${API_URL}/reviews/${id}`, { method: 'DELETE' });
  return res.json();
}
