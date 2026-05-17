// ── PAGE NAVIGATION ──
const pageTitles={dashboard:'Dashboard',properties:'My Properties',rooms:'My Rooms',bookings:'Booking Management',images:'Room Images',earnings:'Earnings & Payouts',reviews:'Reviews',settings:'Account Settings'};
function showPage(id,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg=document.getElementById('page-'+id);
  if(pg) pg.classList.add('active');
  document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));
  if(el) el.classList.add('active');
  else{
    document.querySelectorAll('.sb-item').forEach(i=>{
      if(i.getAttribute('onclick')&&i.getAttribute('onclick').includes("'"+id+"'")) i.classList.add('active');
    });
  }
  document.getElementById('pageTitle').textContent=pageTitles[id]||id;
  document.getElementById('sidebar').classList.remove('open');
  if(id==='earnings') buildEarningsChart();
}

// ── MODALS ──
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function openAddProperty(){openModal('addPropertyModal');}
function openAddRoom(){openModal('addRoomModal');}
function openNotifPanel(){
  openModal('notifModal');
  document.getElementById('notifDot').style.display='none';
}

// Edit room
const roomData={
  'Riverside Studio Apartment':{type:'Studio',price:280,size:32,cap:2,status:'Available',desc:'A cozy studio apartment with a stunning river view. Fully furnished with AC, WiFi, and modern amenities.'},
  'Garden View Single Room':{type:'Single',price:150,size:20,cap:1,status:'Available',desc:'Peaceful single room overlooking our lush garden. Ideal for solo students or professionals.'},
  'Sunset Double Room':{type:'Double',price:210,size:28,cap:2,status:'Booked',desc:'Bright double room with large windows facing the afternoon sun. Comes with double bed and wardrobe.'},
  'Urban Loft Apartment':{type:'Apartment',price:450,size:48,cap:3,status:'Available',desc:'Modern loft-style apartment on the 5th floor. Open plan kitchen and living area, city views.'},
  'Lakeside Shared Room':{type:'Shared',price:80,size:18,cap:4,status:'Available',desc:'Budget-friendly shared room for students. 4 beds, communal kitchen and bathrooms.'},
  'Blossom Garden Studio':{type:'Studio',price:190,size:25,cap:2,status:'Maintenance',desc:'Charming studio surrounded by a blossoming garden. Currently undergoing minor repairs.'}
};
function openEditRoom(name){
  const d=roomData[name]||{};
  document.getElementById('editRoomSub').textContent='Editing: '+name;
  document.getElementById('editRoomTitle').value=name;
  document.getElementById('editRoomPrice').value=d.price||'';
  document.getElementById('editRoomSize').value=d.size||'';
  document.getElementById('editRoomCap').value=d.cap||'';
  document.getElementById('editRoomDesc').value=d.desc||'';
  document.getElementById('editRoomStatus').value=d.status||'Available';
  openModal('editRoomModal');
}
function saveEditRoom(){
  closeModal('editRoomModal');
  showToast('✅ Room updated successfully!');
}

// Edit property
const propData={
  'Riverside Heights':{rooms:3,addr:'123 River Rd, Siem Reap',desc:'Riverside property with 3 comfortable rooms and a shared garden.'},
  'The Green Quarter':{rooms:2,addr:'56 Garden St, Phnom Penh',desc:'Eco-friendly guesthouse with lush garden surroundings.'},
  'Urban Loft Complex':{rooms:1,addr:'789 City Blvd, Phnom Penh',desc:'Modern condo-style complex in the city center.'}
};
function openEditProperty(name){
  const d=propData[name]||{};
  document.getElementById('editPropSub').textContent='Editing: '+name;
  document.getElementById('editPropName').value=name;
  document.getElementById('editPropRooms').value=d.rooms||'';
  document.getElementById('editPropAddr').value=d.addr||'';
  document.getElementById('editPropDesc').value=d.desc||'';
  openModal('editPropertyModal');
}
function saveEditProperty(){
  closeModal('editPropertyModal');
  showToast('✅ Property updated!');
}

function submitProperty(){
  addProperty();
}
function submitRoom(){
  addRoom();
}
function deleteProperty(btn,name){
  if(confirm('Delete "'+name+'"? All associated rooms will be hidden.')){
    btn.closest('tr').style.opacity='.4';
    showToast('🗑 Property "'+name+'" deleted.');
  }
}
function deleteRoom(btn){
  if(confirm('Remove this room from your listings?')){
    btn.closest('.room-tile').style.opacity='.3';
    showToast('🗑 Room removed.');
  }
}

// ── BOOKING ACTIONS ──
function confirmBookingRow(btn){
  const td=btn.closest('td');
  const statusTd=btn.closest('tr').querySelector('td:nth-child(5)');
  if(statusTd) statusTd.innerHTML='<span class="badge badge-green">✓ Confirmed</span>';
  td.innerHTML='<span class="td-muted">—</span>';
  updatePendingCount(-1);
  showToast('✅ Booking confirmed!');
}
function cancelBookingRow(btn){
  const tr=btn.closest('tr');
  const statusTd=tr.querySelector('td:nth-child(5)');
  if(statusTd) statusTd.innerHTML='<span class="badge badge-red">✕ Cancelled</span>';
  btn.closest('td').innerHTML='<span class="td-muted">—</span>';
  updatePendingCount(-1);
  showToast('❌ Booking cancelled.');
}
function confirmBookingCard(cardId,actId,initials){
  document.getElementById(actId).innerHTML='<span class="badge badge-green">✓ Confirmed</span> <button class="btn btn-ghost btn-sm" onclick="showToast(\'📨 Message sent\')">💬 Message</button>';
  updatePendingCount(-1);
  showToast('✅ Booking confirmed!');
}
function cancelBookingCard(cardId,actId){
  document.getElementById(actId).innerHTML='<span class="badge badge-red">✕ Cancelled</span>';
  updatePendingCount(-1);
  showToast('❌ Booking cancelled.');
}
let pendingCount=2;
function updatePendingCount(delta){
  pendingCount=Math.max(0,pendingCount+delta);
  const el=document.getElementById('pendingCount');
  if(el) el.textContent=pendingCount;
  const badge=document.querySelector('.sb-badge.amber');
  if(badge) badge.textContent=pendingCount;
}

// ── BOOKING VIEW TOGGLE ──
function setBookingView(view,el){
  document.querySelectorAll('#bookingViewTabs .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('bookingKanban').style.display=view==='kanban'?'grid':'none';
  document.getElementById('bookingTable').style.display=view==='table'?'block':'none';
}

// ── IMAGES ──
function setCover(btn){
  document.querySelectorAll('.img-cover-badge').forEach(b=>b.remove());
  const tile=btn.closest('.img-tile-inner');
  const badge=document.createElement('span');
  badge.className='img-cover-badge';badge.textContent='COVER';
  tile.prepend(badge);
  showToast('⭐ Cover photo updated!');
}
function deleteImg(btn){
  if(confirm('Remove this image?')){
    btn.closest('.img-tile').remove();
    showToast('🗑 Image removed.');
  }
}
function switchImageRoom(val){showToast('🖼 Showing images for selected room');}

// ── REVIEWS ──
function toggleReply(formId,btnId){
  const form=document.getElementById(formId);
  const btn=document.getElementById(btnId);
  const visible=form.style.display==='flex'||form.style.display==='block';
  form.style.display=visible?'none':'block';
  btn.textContent=visible?'💬 Reply':'Cancel';
}
function submitReply(formId,btnId){
  const form=document.getElementById(formId);
  const txt=form.querySelector('textarea').value.trim();
  if(!txt){showToast('⚠️ Please write a reply first');return;}
  form.style.display='none';
  document.getElementById(btnId).textContent='💬 Reply';
  const replyDiv=document.createElement('div');
  replyDiv.className='ri-reply';
  replyDiv.innerHTML='<span class="ri-reply-label">Your reply:</span>'+txt;
  form.parentElement.insertBefore(replyDiv,form);
  showToast('✅ Reply posted!');
}

// ── ROOM FILTER ──
function filterRooms(val){showToast(val?'Showing: '+val:'Showing all rooms');}

// ── CHARTS ──
const monthlyData=[{m:'Dec',v:780},{m:'Jan',v:920},{m:'Feb',v:850},{m:'Mar',v:1050},{m:'Apr',v:1100},{m:'May',v:1240}];
function buildChart(containerId,data,color){
  const wrap=document.getElementById(containerId);
  if(!wrap||wrap.children.length>0) return;
  const max=Math.max(...data.map(d=>d.v));
  data.forEach(d=>{
    const h=Math.round((d.v/max)*130)+10;
    const g=document.createElement('div');
    g.className='chart-bar-group';
    g.innerHTML=`<div class="chart-val">$${(d.v/1000).toFixed(1)}k</div>
      <div class="chart-bar" title="${d.m}: $${d.v}" style="height:${h}px;background:${color};"></div>
      <div class="chart-label">${d.m}</div>`;
    wrap.appendChild(g);
  });
}
function buildEarningsChart(){buildChart('earningsChart',monthlyData,'var(--blue)');}

// ── TOAST ──
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),3000);
}

// ── DYNAMIC RENDERING ──
async function initDashboard() {
  await initData(); // from data.js
  const user = getLoggedInUser();
  if (!user || user.role !== 'landlord') {
    window.location.href = 'login.html';
    return;
  }
  
  const properties = getData('properties').filter(p => String(p.user_id) === String(user.user_id));
  const rooms = getData('rooms').filter(r => properties.some(p => String(p.property_id) === String(r.property_id)));
  
  // Render Properties
  const propTbody = document.querySelector('#page-properties tbody');
  if (propTbody) {
    propTbody.innerHTML = properties.map(p => `
      <tr>
        <td><div class="td-bold">${p.property_name}</div><div class="td-muted">${p.address}</div></td>
        <td>${p.property_type || 'Property'}</td>
        <td>${p.address}</td>
        <td>${p.total_rooms} rooms</td>
        <td>⭐ 5.0</td>
        <td><span class="badge badge-green">Active</span></td>
        <td><div style="display:flex;gap:5px;">
          <button class="btn btn-ghost btn-sm" onclick="openEditProperty('${p.property_name}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProperty(this,'${p.property_name}')">🗑</button>
        </div></td>
      </tr>
    `).join('');
  }

  // Render Rooms
  const roomsGrid = document.getElementById('roomsGrid');
  if (roomsGrid) {
    roomsGrid.innerHTML = rooms.map((r, i) => `
      <div class="room-tile"><div class="rt-img rt-g${(i%6)+1}">🛏</div><div class="rt-body">
        <div class="rt-type">${r.room_type}</div>
        <div class="rt-name">${r.room_title}</div>
        <div class="rt-meta"><div class="rt-price">$${r.price_per_month}<small style="font-family:Inter;font-size:10px;font-weight:400;color:var(--slate)">/mo</small></div><span class="rt-size">2 pax</span></div>
        <div style="margin-bottom:8px;"><span class="badge badge-${r.availability_status==='Available'?'green':'red'}">${r.availability_status}</span></div>
        <div class="rt-actions">
          <button class="btn btn-ghost btn-sm" onclick="openEditRoom('${r.room_title}')">✏️ Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="showPage('images',null)">🖼 Images</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteRoom(this)">🗑</button>
        </div>
      </div></div>
    `).join('');
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  await initDashboard();
  buildChart('miniChart',monthlyData,'var(--blue)');
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
  }
});
// Close sidebar on outside click (mobile)
document.addEventListener('click',e=>{
  const sb=document.getElementById('sidebar');
  if(sb.classList.contains('open')&&!sb.contains(e.target)&&!e.target.classList.contains('hamburger')){
    sb.classList.remove('open');
  }
});
