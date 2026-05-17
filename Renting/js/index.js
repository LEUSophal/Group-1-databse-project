function openModal(tab){
  document.getElementById('authModal').classList.add('open');
  switchTab(tab);
}
function closeModal(){
  document.getElementById('authModal').classList.remove('open');
}
function switchTab(t){
  document.getElementById('tabLogin').classList.toggle('active', t==='login');
  document.getElementById('tabRegister').classList.toggle('active', t==='register');
  document.getElementById('panelLogin').style.display = t==='login'?'block':'none';
  document.getElementById('panelRegister').style.display = t==='register'?'block':'none';
}
function doLogin(){
  loginUser();
}
function doRegister(){
  registerUser();
}
function openRoomDetail(){
  document.getElementById('roomDetail').classList.add('open');
  document.getElementById('roomDetail').scrollTop=0;
}
function closeRoomDetail(){
  document.getElementById('roomDetail').classList.remove('open');
}
function calcTotal(){
  const i=document.getElementById('moveIn').value;
  const o=document.getElementById('moveOut').value;
  if(i&&o){
    const days=(new Date(o)-new Date(i))/(1000*60*60*24);
    if(days>0){
      const months=Math.ceil(days/30);
      const modal = document.getElementById('roomDetail');
      const price = parseFloat(modal.dataset.currentRoomPrice) || 280;
      const total=months*price;
      document.getElementById('durText').textContent=months+' month'+(months>1?'s':'');
      document.getElementById('totalLine').style.display='flex';
      document.getElementById('totalAmt').textContent='$'+total.toLocaleString();
    }
  }
}
function doBooking(){
  bookRoom();
}
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3200);
}

// ──────────── PROPERTY BROWSING ────────────

const propGradients = [
  'linear-gradient(135deg,#1E40AF,#3B82F6)',
  'linear-gradient(135deg,#064E3B,#059669)',
  'linear-gradient(135deg,#3B0764,#7C3AED)',
  'linear-gradient(135deg,#92400E,#F59E0B)',
  'linear-gradient(135deg,#991B1B,#EF4444)',
  'linear-gradient(135deg,#155E75,#06B6D4)'
];

const propIcons = {
  'apartment': '🏢', 'guesthouse': '🌿', 'condo': '🌆',
  'house': '🏠', 'villa': '🏡', 'studio': '🎨'
};

function getPropIcon(type) {
  return propIcons[(type || '').toLowerCase()] || '🏢';
}

function renderProperties() {
  const grid = document.getElementById('propertiesGrid');
  if (!grid) return;

  const properties = MOCK_DATA.properties || [];

  if (properties.length === 0) {
    grid.innerHTML = '<div class="pdp-no-rooms">No properties available yet.</div>';
    return;
  }

  grid.innerHTML = properties.map((p, i) => {
    const propId = p.idProperty || p.property_id;
    const rooms = getPropertyRooms(propId);
    const available = rooms.filter(r => (r.status || '').toLowerCase() === 'available').length;
    const rating = getPropertyAvgRating(propId);
    const icon = getPropIcon(p.property_type);
    const grad = propGradients[i % propGradients.length];

    return `
      <div class="prop-card" onclick="openPropDetail('${propId}')">
        <div class="prop-img" style="background:${grad}">${icon}</div>
        <div class="prop-body">
          <div class="prop-type">${p.property_type || 'Property'}</div>
          <div class="prop-name">${p.title || 'Unnamed Property'}</div>
          <div class="prop-addr">📍 ${p.location || 'Unknown'}</div>
          <div class="prop-meta">
            <span>🚪 ${rooms.length} room${rooms.length !== 1 ? 's' : ''}</span>
            <span>⭐ ${rating > 0 ? rating : '—'}</span>
            <span>${available > 0 ? '🟢' : '🔴'} ${available} available</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ──────────── PROPERTY DETAIL ────────────

function openPropDetail(propId) {
  const p = getProperty(propId);
  if (!p) return;

  const rooms = getPropertyRooms(propId);
  const available = rooms.filter(r => (r.status || '').toLowerCase() === 'available').length;
  const rating = getPropertyAvgRating(propId);
  const landlord = getLandlord(p.Landlord_idLandlord);
  const minPrice = getPropertyMinPrice(propId);
  const propIdx = (MOCK_DATA.properties || []).findIndex(x => String(x.idProperty) === String(propId));
  const grad = propGradients[(propIdx >= 0 ? propIdx : 0) % propGradients.length];
  const icon = getPropIcon(p.property_type);

  // Fill header
  document.getElementById('pdpIcon').textContent = icon;
  document.getElementById('pdpIcon').style.background = grad;
  document.getElementById('pdpType').textContent = p.property_type || 'Property';
  document.getElementById('pdpName').textContent = p.title || 'Unnamed';
  document.getElementById('pdpAddr').textContent = '📍 ' + (p.location || 'Unknown');
  document.getElementById('pdpRoomCount').textContent = rooms.length;
  document.getElementById('pdpAvailable').textContent = available;
  document.getElementById('pdpRating').textContent = rating > 0 ? '⭐ ' + rating : '—';
  document.getElementById('pdpMinPrice').textContent = minPrice > 0 ? '$' + minPrice : '—';

  // Landlord
  document.getElementById('pdpLandlordName').textContent = landlord.name || 'Unknown Landlord';
  document.getElementById('pdpLandlordPhone').textContent = landlord.phone || 'N/A';

  // Description
  document.getElementById('pdpDesc').textContent = p.description || 'No description available for this property.';

  // Render rooms
  const roomGrid = document.getElementById('pdpRoomsList');

  if (rooms.length === 0) {
    roomGrid.innerHTML = '<div class="pdp-no-rooms">🚪 No rooms have been added to this property yet.</div>';
  } else {
    const roomGrads = [
      'linear-gradient(135deg,#1E40AF,#3B82F6,#60A5FA)',
      'linear-gradient(135deg,#064E3B,#059669,#34D399)',
      'linear-gradient(135deg,#92400E,#D97706,#FCD34D)',
      'linear-gradient(135deg,#3B0764,#7C3AED,#A78BFA)',
      'linear-gradient(135deg,#991B1B,#DC2626,#FCA5A5)',
      'linear-gradient(135deg,#155E75,#0891B2,#67E8F9)'
    ];

    const roomIcons = {
      'studio': '🎨', 'single': '🛏️', 'double': '🛏️🛏️',
      'shared': '👥', 'apartment': '🏠', 'suite': '✨'
    };

    roomGrid.innerHTML = rooms.map((r, i) => {
      const status = (r.status || 'available').toLowerCase();
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      const roomType = r.type || r.room_type || 'Room';
      const roomIcon = roomIcons[roomType.toLowerCase()] || '🏠';
      const rGrad = roomGrads[i % roomGrads.length];
      const roomId = r.idRoom || r.room_id;
      const isAvailable = status === 'available';

      return `
        <div class="pdp-room-card" onclick="openRoomFromProp('${roomId}')">
          <div class="pdp-room-img" style="background:${rGrad}">
            <span style="font-size:40px;filter:drop-shadow(0 2px 8px rgba(0,0,0,.2))">${roomIcon}</span>
            <span class="pdp-room-status ${status}">${statusLabel === 'Available' ? '✓ Available' : statusLabel === 'Booked' ? '✕ Booked' : '⚠ ' + statusLabel}</span>
          </div>
          <div class="pdp-room-body">
            <div class="pdp-room-type">${roomType}</div>
            <div class="pdp-room-name">${p.title} — ${roomType}</div>
            <div class="pdp-room-details">
              <span class="pdp-room-detail">📐 ${r.size || '—'} m²</span>
              <span class="pdp-room-detail">👤 ${r.capacity || 1} person${(r.capacity || 1) > 1 ? 's' : ''}</span>
              ${r.facilities ? `<span class="pdp-room-detail">🔧 ${r.facilities.split(',').length} facilities</span>` : ''}
            </div>
            <div class="pdp-room-footer">
              <div class="pdp-room-price">$${r.price || 0} <small>/ mo</small></div>
              ${isAvailable 
                ? '<button class="pdp-room-book" onclick="event.stopPropagation();">View & Book</button>' 
                : '<button class="pdp-room-book" disabled>Not Available</button>'}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Show the overlay
  document.getElementById('propDetail').classList.add('open');
  document.getElementById('propDetail').scrollTop = 0;
}

function closePropDetail() {
  document.getElementById('propDetail').classList.remove('open');
}

function openRoomFromProp(roomId) {
  // Close property detail, then open room detail
  closePropDetail();

  // Find the room data and open the room detail page
  const room = getRoom(roomId);
  if (!room) return;

  const propId = room.Property_idProperty;
  const prop = getProperty(propId) || {};
  const landlord = getLandlord(prop.Landlord_idLandlord) || {};
  const rating = getPropertyAvgRating(propId);
  const roomType = room.type || room.room_type || 'Room';

  // Use the existing openRoomDetailDynamic if it exists, otherwise populate manually
  if (typeof openRoomDetailDynamic === 'function') {
    openRoomDetailDynamic({
      room_id: String(roomId),
      property_id: String(propId),
      room_title: prop.title ? `${prop.title} - ${roomType}` : `${roomType} Room`,
      location: prop.location || 'Unknown',
      room_type: roomType,
      price_per_month: Number(room.price) || 0,
      capacity: Number(room.capacity) || 1,
      size: Number(room.size) || 0,
      facilities: room.facilities || '',
      availability_status: (room.status || '').toLowerCase() === 'available' ? 'Available' : 'Booked',
      description: prop.description || '',
      property_type: prop.property_type || '',
      rating: Number(rating || 0)
    });
  } else {
    // Fallback: populate existing room detail fields
    const detail = document.getElementById('roomDetail');
    if (!detail) return;

    const titleEl = detail.querySelector('.rdp-title');
    const propEl = detail.querySelector('.rdp-prop');
    const priceEl = detail.querySelector('.book-price');
    
    if (titleEl) titleEl.textContent = prop.title ? `${prop.title} — ${roomType}` : roomType;
    if (propEl) propEl.innerHTML = `🏢 ${prop.title || 'Property'} &nbsp;·&nbsp; 📍 ${prop.location || 'Unknown'}`;
    if (priceEl) priceEl.innerHTML = `$${room.price || 0} <small>/ month</small>`;

    detail.dataset.currentRoomPrice = room.price || 0;
    detail.dataset.currentRoomId = roomId;
    
    openRoomDetail();
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeRoomDetail();
    closePropDetail();
  }
});

