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
function openViewUser(name,role,email,status,userId,userRole){
  document.getElementById('vu-name').textContent=name;
  document.getElementById('vu-email').textContent=email;
  document.getElementById('vu-role').textContent=role;
  document.getElementById('vu-role').className='badge '+(role==='Landlord'?'badge-green':role==='Admin'?'badge-red':'badge-blue');
  document.getElementById('vu-status').textContent=status;
  document.getElementById('vu-status').className='badge '+(status==='Active'?'badge-green':'badge-red');
  // Store for block action
  document.getElementById('viewUserModal').dataset.userId = userId || '';
  document.getElementById('viewUserModal').dataset.userRole = userRole || 'tenant';
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
  logAction('UPDATE','User',null,reason);
  showToast('✅ User updated & action logged!');
}
function saveUserChanges(){
  closeModal('viewUserModal');
  logAction('UPDATE','User',null,'Role/status change from user profile');
  showToast('✅ User updated & action logged!');
}
async function blockUserFromModal(){
  const modal = document.getElementById('viewUserModal');
  const userId = modal.dataset.userId;
  const userRole = modal.dataset.userRole || 'tenant';
  closeModal('viewUserModal');
  if (userId && typeof apiBlockUser === 'function') {
    try {
      const res = await apiBlockUser(userRole, userId);
      if (res.success) {
        const action = res.is_active ? 'UNBLOCK' : 'BLOCK';
        await logAction(action, 'User', userId, `${action} via admin panel`);
        showToast(res.is_active ? '✅ User unblocked & logged!' : '🚫 User blocked & logged!');
        // Reload users list
        if (typeof loadAdminUsers === 'function') loadAdminUsers();
      } else {
        showToast('❌ Failed to update user status');
      }
    } catch(e) {
      showToast('❌ Server error');
    }
  } else {
    logAction('BLOCK','User',null,'Blocked via admin panel');
    showToast('🚫 User blocked & action logged!');
  }
}
function unblockUser(btn,name){
  const row = btn.closest('tr');
  if(!row) return;
  const badge = row.querySelector('.badge-red, .badge-green, .badge');
  if(badge){
    badge.className = 'badge badge-green';
    badge.textContent = 'Active';
  }
  const editBtn = Object.assign(document.createElement('button'),{className:'btn btn-ghost btn-sm',textContent:'Edit'});
  editBtn.onclick = ()=>openEditUser(name,'Tenant','Active');
  try{ btn.replaceWith(editBtn); }catch(e){}
  logAction('UPDATE','User',null,'User unblocked');
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
function dismissFlag(elem){
  // Supports both dismissFlag() and dismissFlag(this)
  let card = null; let badge = null;
  if(elem){
    card = elem.closest('.review-card');
    if(!card){ showToast('⚠️ No flagged review found'); return; }
    badge = card.querySelector('.badge-red');
  } else {
    badge = document.querySelector('.review-card .badge-red');
    if(!badge){ showToast('⚠️ No flagged review found'); return; }
    card = badge.closest('.review-card');
  }
  if(card){
    card.classList.remove('flagged');
    const bd = card.querySelector('.badge-red'); if(bd) bd.remove();
    card.style.borderColor=''; card.style.background='';
  }
  showToast('✅ Flag dismissed.');
  logAction('UPDATE','Review',null,'Flag dismissed via admin panel');
  updateReviewCounts();
}

function updateReviewCounts(){
  const page = document.getElementById('page-reviews');
  if(!page) return;
  const total = page.querySelectorAll('.review-card').length;
  const flagged = page.querySelectorAll('.review-card.flagged').length;
  // update section header reviews text (preserve avg if present)
  const hdrSpan = page.querySelector('.sec-hdr span');
  if(hdrSpan){
    let txt = hdrSpan.textContent || '';
    if(txt.includes('·')) txt = txt.split('·')[0].trim();
    hdrSpan.textContent = txt + ' · ' + total + ' reviews';
  }
  // update sidebar review flagged badge
  const sbBadge = document.querySelector('.sb-item[onclick*="reviews"] .sb-badge');
  if(sbBadge) sbBadge.textContent = String(flagged);
}

function deleteReview(btn){
  const card = btn.closest('.review-card'); if(!card) return;
  const nameEl = card.querySelector('.rc-name'); const name = nameEl? nameEl.textContent : 'Review';
  if(!confirm('Are you sure you want to permanently delete this review? This action is irreversible.')) return;
  card.remove();
  logAction('DELETE','Review',null,'Deleted review: '+name);
  showToast('🗑 Review deleted & action logged.');
  updateReviewCounts();
}

function flagReview(btn){
  const card = btn.closest('.review-card'); if(!card) return;
  if(card.classList.contains('flagged')){ showToast('⚠️ Review already flagged'); return; }
  card.classList.add('flagged');
  if(!card.querySelector('.badge-red')){
    const b = document.createElement('span'); b.className='badge badge-red'; b.textContent='⚠ FLAGGED';
    // insert at the top of the card (before header)
    const first = card.firstElementChild; if(first) first.insertAdjacentElement('afterbegin', b); else card.prepend(b);
  }
  card.style.borderColor='var(--red-dim)'; card.style.background='rgba(248,81,73,.04)';
  logAction('UPDATE','Review',null,'Flagged review via admin panel');
  showToast('🚩 Review flagged for moderation');
  updateReviewCounts();
}

function warnUser(btn){
  const card = btn.closest('.review-card');
  const nameEl = card? card.querySelector('.rc-name') : null;
  const name = nameEl? nameEl.textContent : '';
  showToast('📨 Warning sent to user '+(name||''));
  logAction('UPDATE','Review',null,'Warning sent to user: '+(name||''));
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
  document.getElementById('confirmMsg').textContent='This will permanently delete admin log entries older than 30 days. This action cannot be undone.';
  document.getElementById('confirmBtn').textContent='Clear Logs';
  _confirmAction=()=>{ clearOldLogs30(); };
  document.getElementById('confirmOverlay').classList.add('open');
}
function closeConfirm(){document.getElementById('confirmOverlay').classList.remove('open');_confirmAction=null;}
function executeConfirm(){if(_confirmAction) _confirmAction();closeConfirm();}

// ── ADMIN LOG WRITER (saves to DB + updates DOM) ──
let logCounter = 12;
async function logAction(action, table, targetId, reason) {
  logCounter++;
  // 1. Save to database via API
  if (typeof apiPostAdminLog === 'function') {
    try { await apiPostAdminLog(action, table, targetId || null, reason || null); } catch(e) {}
  }
  // 2. Also update the DOM log table immediately
  const tbody = document.getElementById('logTableBody');
  if (!tbody) return;
  const actionColors = {DELETE:'delete',UPDATE:'update',BLOCK:'block',CREATE:'create',APPROVE:'approve',REJECT:'delete',UNBLOCK:'create'};
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' · '+now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><span class="td-muted">#L-0${logCounter}</span></td>
    <td><span class="log-tag ${actionColors[action]||'update'}">${action}</span></td>
    <td>${table}</td>
    <td>${targetId || '—'}</td>
    <td>${reason || '—'}</td>
    <td>Admin</td>
    <td><span class="td-muted">${dateStr}</span></td>`;
  tbody.insertBefore(tr, tbody.firstChild);
  const badge = document.querySelector('.sb-item[onclick*="adminlog"] .sb-badge');
  if (badge) badge.textContent = logCounter;
}

// ── LOAD ADMIN LOG FROM DB ──
async function loadAdminLog() {
  if (typeof apiFetchAdminLog !== 'function') return;
  try {
    const logs = await apiFetchAdminLog();
    const tbody = document.getElementById('logTableBody');
    if (!tbody || !logs.length) return;
    const actionColors = {DELETE:'delete',UPDATE:'update',BLOCK:'block',CREATE:'create',APPROVE:'approve',REJECT:'delete',UNBLOCK:'create'};
    tbody.innerHTML = logs.map((log, i) => {
      const dateStr = log.action_date
        ? new Date(log.action_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' · '+new Date(log.action_date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
        : '—';
      return `<tr>
        <td><span class="td-muted">#L-${String(log.log_id).padStart(3,'0')}</span></td>
        <td><span class="log-tag ${actionColors[log.action_type]||'update'}">${log.action_type||'—'}</span></td>
        <td>${log.target_table||'—'}</td>
        <td>${log.target_id||'—'}</td>
        <td>${log.description||'—'}</td>
        <td>${log.admin_name||'Admin'}</td>
        <td><span class="td-muted">${dateStr}</span></td>
      </tr>`;
    }).join('');
    logCounter = logs.length + 12;
    const badge = document.querySelector('.sb-item[onclick*="adminlog"] .sb-badge');
    if (badge) badge.textContent = logs.length;
  } catch(e) {
    console.error('Failed to load admin log:', e);
  }
}

// Auto-load log when the adminlog page is shown
const _origShowPage = typeof showPage === 'function' ? showPage : null;

// ── TABLE FILTER ──
function filterTable(tableId,query){
  const q=query.toLowerCase();
  const rows=document.querySelectorAll('#'+tableId+' tbody tr');
  rows.forEach(row=>{row.style.display=row.textContent.toLowerCase().includes(q)?'':'none';});
}

// ── GLOBAL SEARCH ──
function globalSearch(q){if(q.length>2) showToast('🔍 Searching for "'+q+'"…');}

// ── EXPORT ──
function exportData(type){
  if(type==='admin log'){
    const table = document.getElementById('logTable');
    if(!table) return showToast('❌ No log table found');
    const headers = Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent.trim());
    const rows = Array.from(table.querySelectorAll('tbody tr')).filter(r=> r.style.display !== 'none');
    const csvRows = [headers.join(',')];
    rows.forEach(r=>{
      const cols = Array.from(r.querySelectorAll('td')).map(td=> '"'+td.textContent.replace(/"/g,'""').trim()+'"');
      csvRows.push(cols.join(','));
    });
    const csv = csvRows.join('\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'admin-log.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast('⬇ Exported visible logs as CSV');
    return;
  }
  showToast('📥 Exporting '+type+' data as CSV…');
}

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

// ── INIT: load real log from DB on page load ──
document.addEventListener('DOMContentLoaded', () => {
  loadAdminLog();
  initUsersPagination();
  initAdminLogPagination();
  updateReviewCounts();
});

/* ---------- TABLE PAGINATION FOR USERS ---------- */
function initUsersPagination(){
  const table = document.getElementById('usersTable');
  if(!table) return;
  const wrapper = table.closest('.table-wrap');
  if(!wrapper) return;
  // find the pagination row (the next sibling div after the table wrapper)
  let paginationRow = wrapper.nextElementSibling;
  if(!paginationRow) return;
  const infoSpan = paginationRow.querySelector('span');
  const controlsDiv = paginationRow.querySelector('div');
  if(!infoSpan||!controlsDiv) return;

  // Clear existing control buttons and rebuild consistent pagination controls
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const total = rows.length;
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Build controls: Prev, 1..N, Next
  controlsDiv.innerHTML = '';
  const createBtn = (text, cls) => { const b=document.createElement('button'); b.className='btn '+(cls||'btn-ghost')+' btn-sm'; b.textContent=text; return b; };
  const prevBtn = createBtn('← Prev','btn-ghost');
  controlsDiv.appendChild(prevBtn);
  const pageBtns = [];
  for(let p=1;p<=totalPages;p++){
    const b = createBtn(String(p), p===1? 'btn-primary':'btn-ghost');
    b.dataset.page = String(p);
    controlsDiv.appendChild(b);
    pageBtns.push(b);
  }
  const nextBtn = createBtn('Next →','btn-ghost');
  controlsDiv.appendChild(nextBtn);

  let currentPage = 1;
  function render(page){
    if(page<1) page=1; if(page>totalPages) page=totalPages;
    currentPage=page;
    // hide/show rows
    rows.forEach((r,idx)=>{ const should = idx>= (page-1)*pageSize && idx < page*pageSize; r.style.display = should? '': 'none'; });
    // update info text
    const showing = Math.min(pageSize, Math.max(0, total - (page-1)*pageSize));
    infoSpan.textContent = 'Showing '+showing+' of '+total+' users';
    // update buttons styles
    pageBtns.forEach(b=>{ b.className = (Number(b.dataset.page)===page) ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'; });
    prevBtn.disabled = page===1; nextBtn.disabled = page===totalPages;
    if(prevBtn.disabled) prevBtn.classList.add('disabled'); else prevBtn.classList.remove('disabled');
    if(nextBtn.disabled) nextBtn.classList.add('disabled'); else nextBtn.classList.remove('disabled');
  }

  // wire events
  prevBtn.addEventListener('click', ()=>{ if(currentPage>1) render(currentPage-1); });
  nextBtn.addEventListener('click', ()=>{ if(currentPage<totalPages) render(currentPage+1); });
  pageBtns.forEach(b=> b.addEventListener('click', ()=> render(Number(b.dataset.page))));

  // initial render
  render(1);
}

/* ---------- ADMIN LOG PAGINATION & EXPORT ---------- */
function parseRowDate(row){
  if(!row) return null;
  const td = row.querySelector('td:last-child'); if(!td) return null;
  let txt = td.textContent.replace('\u00B7',' ').replace('·',' ').trim();
  // Ensure there's a time portion
  if(!/\d{1,2}:\d{2}/.test(txt)) txt = txt + ' 00:00';
  const d = new Date(txt);
  return isNaN(d.getTime())? null : d;
}

function clearOldLogs30(){
  const table = document.getElementById('logTable'); if(!table) return showToast('❌ No log table');
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const now = new Date(); const cutoff = new Date(now.getTime() - 30*24*60*60*1000);
  let removed = 0;
  rows.forEach(r=>{
    const d = parseRowDate(r);
    if(d && d < cutoff){ r.remove(); removed++; }
  });
  if(removed>0){
    showToast('🗑 '+removed+' old log(s) removed');
    logAction('DELETE','Admin_Log',null,'Cleared '+removed+' logs older than 30 days');
    // update info text
    const page = document.getElementById('page-adminlog');
    if(page){
      const total = table.querySelectorAll('tbody tr').length;
      const infoSpan = page.querySelector('div[style*="justify-content:space-between"] > span');
      if(infoSpan) infoSpan.textContent = total+' records total — all actions stored in Admin_Log table';
    }
  } else {
    showToast('ℹ️ No logs older than 30 days');
  }
  if(typeof initAdminLogPagination === 'function') initAdminLogPagination();
}

function initAdminLogPagination(){
  const page = document.getElementById('page-adminlog'); if(!page) return;
  const table = document.getElementById('logTable'); if(!table) return;
  const bottom = page.querySelector('div[style*="justify-content:space-between"]'); if(!bottom) return;
  const infoSpan = bottom.querySelector('span');
  const controlsDiv = bottom.querySelector('div');
  if(!infoSpan || !controlsDiv) return;
  const allRows = Array.from(table.querySelectorAll('tbody tr'));
  const pageSize = 6; let currentPage = 1;
  function refresh(){
    const dateInput = document.getElementById('logDateFilter');
    let dateVal = dateInput && dateInput.value ? new Date(dateInput.value) : null;
    const visibleRows = allRows.filter(r=> r.style.display !== 'none').filter(r=>{
      if(!dateVal) return true;
      const d = parseRowDate(r); if(!d) return true;
      const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const sel = new Date(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate());
      return dOnly >= sel;
    });
    const total = visibleRows.length; const totalPages = Math.max(1, Math.ceil(total/pageSize));
    if(currentPage>totalPages) currentPage = totalPages;
    controlsDiv.innerHTML = '';
    const createBtn = (txt,cls)=>{const b=document.createElement('button');b.className='btn '+(cls||'btn-ghost')+' btn-sm';b.textContent=txt;return b};
    const prev = createBtn('← Prev','btn-ghost'); controlsDiv.appendChild(prev);
    const pageBtns = [];
    for(let p=1;p<=totalPages;p++){ const b=createBtn(String(p), p===currentPage? 'btn-primary':'btn-ghost'); b.dataset.page = p; controlsDiv.appendChild(b); pageBtns.push(b); }
    const next = createBtn('Next →','btn-ghost'); controlsDiv.appendChild(next);
    // render
    const start = (currentPage-1)*pageSize; const end = start+pageSize;
    allRows.forEach(r=> r.style.display = 'none');
    visibleRows.slice(start,end).forEach(r=> r.style.display = '');
    infoSpan.textContent = 'Showing '+ Math.min(pageSize, Math.max(0, total - (currentPage-1)*pageSize)) +' of '+ total +' logs';
    prev.disabled = currentPage===1; next.disabled = currentPage===totalPages;
    prev.addEventListener('click', ()=>{ if(currentPage>1){ currentPage--; refresh(); }});
    next.addEventListener('click', ()=>{ if(currentPage<totalPages){ currentPage++; refresh(); }});
    pageBtns.forEach(b=> b.addEventListener('click', ()=>{ currentPage = Number(b.dataset.page); refresh(); }));
  }
  const search = document.getElementById('logSearch'); if(search) search.addEventListener('input', ()=> setTimeout(refresh,40));
  const actionFilter = document.getElementById('logActionFilter'); if(actionFilter) actionFilter.addEventListener('change', ()=> setTimeout(refresh,40));
  const tableFilter = document.getElementById('logTableFilter'); if(tableFilter) tableFilter.addEventListener('change', ()=> setTimeout(refresh,40));
  const dateFilter = document.getElementById('logDateFilter'); if(dateFilter) dateFilter.addEventListener('change', ()=> setTimeout(refresh,40));
  refresh();
}



