// ── PAGE NAV ──
const pageTitles={dashboard:'Dashboard',users:'User Management',properties:'Property Management',rooms:'Room Management',bookings:'Booking Management',reviews:'Review Moderation',adminlog:'Admin Action Log',system:'System Health'};
function showPage(id,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg=document.getElementById('page-'+id);
  if(pg) pg.classList.add('active');
  document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));
  if(el) el.classList.add('active');
  document.getElementById('pageTitle').textContent=pageTitles[id]||id;
}

// ── MODALS ──
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

// ── USER ACTIONS ──
function openViewUser(name,role,email,status){
  document.getElementById('vu-name').textContent=name;
  document.getElementById('vu-email').textContent=email;
  document.getElementById('vu-role').textContent=role;
  document.getElementById('vu-role').className='badge '+(role==='Landlord'?'badge-green':role==='Admin'?'badge-red':'badge-blue');
  document.getElementById('vu-status').textContent=status;
  document.getElementById('vu-status').className='badge '+(status==='Active'?'badge-green':'badge-red');
  openModal('viewUserModal');
}
function openEditUser(name,role,status){
  document.getElementById('eu-sub').textContent='Editing: '+name;
  document.getElementById('eu-name').value=name;
  document.getElementById('eu-role').value=role;
  document.getElementById('eu-status').value=status;
  openModal('editUserModal');
}
function saveEditUser(){
  const reason=document.getElementById('eu-reason').value.trim();
  if(!reason){showToast('⚠️ Please provide a reason (required for admin log)');return;}
  closeModal('editUserModal');
  logAction('UPDATE','User',reason);
  showToast('✅ User updated & action logged!');
}
function saveUserChanges(){
  closeModal('viewUserModal');
  logAction('UPDATE','User','Role/status change from user profile');
  showToast('✅ User updated & action logged!');
}
function blockUserFromModal(){
  closeModal('viewUserModal');
  logAction('BLOCK','User','Blocked via admin panel');
  showToast('🚫 User blocked & action logged!');
}
function unblockUser(btn,name){
  btn.closest('tr').querySelector('.badge-red').className='badge badge-green';
  btn.closest('tr').querySelector('.badge-red, .badge-green').textContent='Active';
  btn.replaceWith(Object.assign(document.createElement('button'),{className:'btn btn-ghost btn-sm',textContent:'Edit',onclick:()=>openEditUser(name,'Tenant','Active')}));
  logAction('UPDATE','User','User unblocked');
  showToast('✅ User '+name+' unblocked!');
}
function addUser(){
  const n=document.getElementById('nu-name').value.trim();
  if(!n){showToast('⚠️ Name is required');return;}
  closeModal('addUserModal');
  logAction('CREATE','User','New user account created by admin');
  showToast('✅ User "'+n+'" created & logged!');
}

// ── PROPERTY ACTIONS ──
function approveProperty(btn,name){
  const td=btn.closest('td');
  const statusTd=btn.closest('tr').querySelector('td:nth-child(7)');
  if(statusTd) statusTd.innerHTML='<span class="badge badge-green">Active</span>';
  td.innerHTML='<button class="btn btn-danger btn-sm" onclick="confirmDelete(\'property\',\''+name+'\')">🗑 Delete</button>';
  logAction('APPROVE','Property','Property "'+name+'" approved after review');
  showToast('✅ "'+name+'" approved & logged!');
}
function rejectProperty(btn,name){
  const td=btn.closest('td');
  const statusTd=btn.closest('tr').querySelector('td:nth-child(7)');
  if(statusTd) statusTd.innerHTML='<span class="badge badge-red">Rejected</span>';
  td.innerHTML='<span class="td-muted">—</span>';
  logAction('UPDATE','Property','Property "'+name+'" rejected — non-compliance');
  showToast('❌ "'+name+'" rejected & logged.');
}

// ── BOOKING ACTIONS ──
function adminConfirmBooking(statusId){
  document.getElementById(statusId).outerHTML='<span class="badge badge-green" id="'+statusId+'">Confirmed</span>';
  logAction('UPDATE','Booking','Admin confirmed pending booking');
  showToast('✅ Booking confirmed & logged!');
}
function adminCancelBooking(statusId){
  document.getElementById(statusId).outerHTML='<span class="badge badge-red" id="'+statusId+'">Cancelled</span>';
  logAction('UPDATE','Booking','Admin cancelled booking');
  showToast('❌ Booking cancelled & logged.');
}

// ── REVIEW ACTIONS ──
function dismissFlag(){
  document.querySelector('.badge-red:first-child').closest('.review-card').style.borderColor='var(--border)';
  document.querySelector('.review-card').style.background='';
  showToast('✅ Flag dismissed.');
  logAction('UPDATE','Review','Flagged review dismissed after inspection');
}

// ── CONFIRM DELETE DIALOG ──
let _confirmAction=null;
function confirmDelete(type,name){
  document.getElementById('confirmIcon').textContent='🗑';
  document.getElementById('confirmTitle').textContent='Delete '+type.charAt(0).toUpperCase()+type.slice(1);
  document.getElementById('confirmMsg').textContent='Are you sure you want to permanently delete "'+name+'"? This action is irreversible and will be logged.';
  document.getElementById('confirmBtn').textContent='Delete';
  _confirmAction=()=>{
    logAction('DELETE',type.charAt(0).toUpperCase()+type.slice(1),'Deleted: '+name);
    showToast('🗑 "'+name+'" deleted & action logged.');
  };
  document.getElementById('confirmOverlay').classList.add('open');
}
function confirmClearLog(){
  document.getElementById('confirmIcon').textContent='⚠️';
  document.getElementById('confirmTitle').textContent='Clear Old Logs';
  document.getElementById('confirmMsg').textContent='This will permanently delete admin log entries older than 90 days. Recent logs will be preserved.';
  document.getElementById('confirmBtn').textContent='Clear Logs';
  _confirmAction=()=>showToast('🗑 Old logs cleared (90+ days).');
  document.getElementById('confirmOverlay').classList.add('open');
}
function closeConfirm(){document.getElementById('confirmOverlay').classList.remove('open');_confirmAction=null;}
function executeConfirm(){if(_confirmAction) _confirmAction();closeConfirm();}

// ── ADMIN LOG WRITER ──
let logCounter=12;
function logAction(action,table,reason){
  logCounter++;
  const tbody=document.getElementById('logTableBody');
  const actionColors={DELETE:'delete',UPDATE:'update',BLOCK:'block',CREATE:'create',APPROVE:'approve',REJECT:'delete'};
  const now=new Date();
  const dateStr=now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' · '+now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><span class="td-muted">#L-0${logCounter}</span></td>
    <td><span class="log-tag ${actionColors[action]||'update'}">${action}</span></td>
    <td>${table}</td>
    <td>—</td>
    <td>${reason}</td>
    <td>Sokha Admin</td>
    <td><span class="td-muted">${dateStr}</span></td>`;
  tbody.insertBefore(tr,tbody.firstChild);
  // Update sidebar badge
  const badge=document.querySelector('.sb-item[onclick*="adminlog"] .sb-badge');
  if(badge) badge.textContent=logCounter;
}

// ── TABLE FILTER ──
function filterTable(tableId,query){
  const q=query.toLowerCase();
  const rows=document.querySelectorAll('#'+tableId+' tbody tr');
  rows.forEach(row=>{row.style.display=row.textContent.toLowerCase().includes(q)?'':'none';});
}

// ── GLOBAL SEARCH ──
function globalSearch(q){if(q.length>2) showToast('🔍 Searching for "'+q+'"…');}

// ── EXPORT ──
function exportData(type){showToast('📥 Exporting '+type+' data as CSV…');}

// ── TOAST ──
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3200);
}

// ── KEY EVENTS ──
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
    document.getElementById('confirmOverlay').classList.remove('open');
  }
});
