// ========== API DATA LAYER ==========
const API_URL = `http://${window.location.hostname}:3000/api`;

let MOCK_DATA = {
  admins: [], tenants: [], landlords: [],
  properties: [], rooms: [], bookings: [],
  reviews: [], room_images: [], facilities: [], room_facilities: []
};

// Initialization - Load all data from API
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

async function initData() {
  try {
    console.log("Fetching data from:", API_URL);
    const fetchJson = (url) => fetch(url, { headers: getAuthHeaders() }).then(r => {
      if (!r.ok) throw new Error(`HTTP error! status: ${r.status} for ${url}`);
      return r.json();
    }).catch(err => {
      console.error(`Fetch failed for ${url}:`, err);
      return [];
    });

    const [pRes, rRes, bRes, vRes, tRes, lRes, fRes] = await Promise.all([
      fetchJson(`${API_URL}/properties`),
      fetchJson(`${API_URL}/rooms`),
      fetchJson(`${API_URL}/bookings`),
      fetchJson(`${API_URL}/reviews`),
      fetchJson(`${API_URL}/auth/tenants`),
      fetchJson(`${API_URL}/auth/landlords`),
      fetchJson(`${API_URL}/facilities`)
    ]);

    MOCK_DATA.properties = pRes;
    MOCK_DATA.rooms = rRes;
    MOCK_DATA.bookings = bRes;
    MOCK_DATA.reviews = vRes;
    MOCK_DATA.tenants = tRes;
    MOCK_DATA.landlords = lRes;
    MOCK_DATA.facilities = fRes;

    console.log("Data loaded successfully:", MOCK_DATA);
  } catch (err) {
    console.error("Critical error in initData:", err);
    const isDashboard = window.location.pathname.includes('dashboard') || 
                        window.location.pathname.includes('admin');
    if (isDashboard) {
      const existing = document.getElementById('server-error-banner');
      if (!existing) {
        const banner = document.createElement('div');
        banner.id = 'server-error-banner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#DC2626;color:#fff;text-align:center;padding:12px;font-size:14px;font-weight:600;z-index:9999;';
        banner.textContent = '⚠️ Cannot reach server. Please start the backend and refresh.';
        document.body.prepend(banner);
      }
    }
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
function getRoomFacilities(roomId) { return MOCK_DATA.facilities ? MOCK_DATA.facilities.filter(f => f.room_id === roomId) : []; }
function getRoomImages(roomId) { return MOCK_DATA.room_images ? MOCK_DATA.room_images.filter(i => i.room_id === roomId) : []; }

function getRoom(roomId) { 
  return MOCK_DATA.rooms.find(r => String(r.idRoom) === String(roomId) || String(r.room_id) === String(roomId)); 
}
function getProperty(propertyId) { 
  return MOCK_DATA.properties.find(p => String(p.idProperty) === String(propertyId) || String(p.property_id) === String(propertyId)); 
}
function getLandlord(landlordId) { 
  if (!landlordId) return {name: 'Landlord', phone: 'N/A'};
  const match = MOCK_DATA.landlords.find(l => 
    String(l.idLandlord) === String(landlordId) || 
    String(l.user_id) === String(landlordId) ||
    String(l.id) === String(landlordId)
  );
  if (match) return match;
  
  // Fallback: search in the bridged landlords if they exist
  if (typeof getData === 'function') {
    const bridged = getData('landlords');
    const bMatch = bridged.find(l => String(l.idLandlord) === String(landlordId) || String(l.user_id) === String(landlordId));
    if (bMatch) return bMatch;
  }
  
  return {name: 'Landlord', phone: 'N/A'}; 
}
function getTenant(tenantId) { 
  if (!tenantId) return {full_name: 'Tenant', phone: 'N/A'};
  const match = MOCK_DATA.tenants.find(t => 
    String(t.idTenant) === String(tenantId) || 
    String(t.user_id) === String(tenantId) ||
    String(t.id) === String(tenantId)
  );
  if (match) return match;
  return {full_name: 'Tenant', phone: 'N/A'}; 
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
    headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify(property)
  });
  return res.json();
}

async function apiDeleteProperty(id) {
  const res = await fetch(`${API_URL}/properties/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return res.json();
}

async function apiUpdateProperty(id, data) {
  const res = await fetch(`${API_URL}/properties/${id}`, {
    method: 'PUT',
    headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  return res.json();
}

async function apiAddBooking(booking) {
  const res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify(booking)
  });
  return res.json();
}

async function apiUpdateBooking(id, status) {
  const res = await fetch(`${API_URL}/bookings/${id}`, {
    method: 'PUT',
    headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status })
  });
  return res.json();
}

async function apiDeleteBooking(id) {
  const res = await fetch(`${API_URL}/bookings/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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

async function apiRegister(name, email, phone, password, role, gender) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, password, role, gender })
  });
  return res.json();
}

// ========== ROOMS API ==========
async function apiAddRoom(room) {
  const res = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify(room)
  });
  return res.json();
}

async function apiUpdateRoom(id, data) {
  const res = await fetch(`${API_URL}/rooms/${id}`, {
    method: 'PUT',
    headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  return res.json();
}

async function apiDeleteRoom(id) {
  const res = await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return res.json();
}

// ========== REVIEWS API ==========
async function apiAddReview(review) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify(review)
  });
  return res.json();
}

async function apiDeleteReview(id) {
  const res = await fetch(`${API_URL}/reviews/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return res.json();
}

async function apiUploadImages(files) {
  if (!files || files.length === 0) return { success: true, urls: [] };
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });
  return res.json();
}

// ========== ADMIN LOG API ==========
async function apiFetchAdminLog() {
  const res = await fetch(`${API_URL}/admin-log`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  return res.json();
}

async function apiPostAdminLog(action_type, target_table, target_id, description) {
  const user = typeof getLoggedInUser === 'function' ? getLoggedInUser() : null;
  const headers = Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' });
  const res = await fetch(`${API_URL}/admin-log`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      Admin_idAdmin: user ? user.user_id : 1,
      action_type,
      target_table,
      target_id: target_id || null,
      description: description || null
    })
  });
  return res.json();
}

// ========== BLOCK / UNBLOCK USER API ==========
async function apiBlockUser(role, userId) {
  const endpoint = role === 'landlord' ? 'landlords' : 'tenants';
  const res = await fetch(`${API_URL}/auth/${endpoint}/${userId}/block`, { method: 'PUT', headers: getAuthHeaders() });
  return res.json();
}

async function apiDeleteUser(role, userId) {
  const endpoint = role === 'landlord' ? 'landlords' : 'tenants';
  const res = await fetch(`${API_URL}/auth/${endpoint}/${userId}`, { method: 'DELETE', headers: getAuthHeaders() });
  return res.json();
}

// ========== FACILITIES API ==========
async function apiFetchFacilities() {
  const res = await fetch(`${API_URL}/facilities`);
  return res.json();
}

// ========== ROOM IMAGES API ==========
async function apiSaveRoomImages(roomId, urls) {
  // Save uploaded image URLs into the Room_Image table
  const res = await fetch(`${API_URL}/rooms/${roomId}/images`, {
    method: 'POST',
    headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ urls })
  });
  return res.json();
}

async function apiDeleteRoomImage(roomId, imageId) {
  const res = await fetch(`${API_URL}/rooms/${roomId}/images/${imageId}`, { method: 'DELETE', headers: getAuthHeaders() });
  return res.json();
}

async function apiSetCoverImage(roomId, imageId) {
  const res = await fetch(`${API_URL}/rooms/${roomId}/images/${imageId}/set-cover`, { method: 'PUT', headers: getAuthHeaders() });
  return res.json();
}

// ========== ROOM FACILITIES API ==========
async function apiSaveRoomFacilities(roomId, facility_ids) {
  const res = await fetch(`${API_URL}/rooms/${roomId}/facilities`, {
    method: 'POST',
    headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ facility_ids })
  });
  return res.json();
}

