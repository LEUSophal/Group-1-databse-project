// main-functions.js

// DATA HELPERS (already in app-data.js, but duplicated here for safety or clarity if needed)
// function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
// function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// AUTHENTICATION
async function loginUser() {
  const emailInput = document.getElementById("loginEmail");
  const passInput = document.getElementById("loginPassword");
  const roleInput = document.getElementById("loginRole");

  const email = emailInput.value.trim();
  const password = passInput.value;
  const role = roleInput.value;

  if (!email || !password) {
    if (typeof showToast === "function") showToast("Email and password are required.");
    return;
  }

  try {
    const res = await apiLogin(email, password, role);
    if (res.success) {
      const userObj = {
        user_id: role === "landlord" ? (res.user.idLandlord || res.user.id) : (res.user.idTenant || res.user.id),
        full_name: res.user.full_name || res.user.name || "User",
        email: res.user.email,
        role,
        phone: res.user.phone || ""
      };
      localStorage.setItem("loggedInUser", JSON.stringify(userObj));

      if (typeof showSuccess === "function") {
        showSuccess(role, false);
      } else {
        if (typeof showToast === "function") showToast("Welcome back!");
        setTimeout(() => {
          if (role === "tenant") window.location.href = "tenant_dashboard.html";
          else if (role === "landlord") window.location.href = "landlord-dashboard.html";
          else if (role === "admin") window.location.href = "admin-panel.html";
        }, 1000);
      }
    } else if (typeof showToast === "function") {
      showToast(res.error || res.message || "Login failed");
    }
  } catch (err) {
    if (typeof showToast === "function") showToast("Login failed. Server error.");
  }
}

async function registerUser() {
  const nameInput = document.getElementById("regName");
  const emailInput = document.getElementById("regEmail");
  const passInput = document.getElementById("regPassword");
  const confirmInput = document.getElementById("regConfirm");
  const phoneInput = document.getElementById("regPhone");
  const roleInput = document.getElementById("regRole");

  const fullName = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passInput.value;
  const confirm = confirmInput ? confirmInput.value : password;
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const genderInput = document.getElementById("regGender");
  const gender = genderInput ? genderInput.value : null;

  let role = "tenant";
  if (roleInput) {
    role = roleInput.value;
  } else if (typeof selectedRole !== "undefined" && selectedRole) {
    role = selectedRole;
  }

  if (!fullName || !email || !password) {
    if (typeof showToast === "function") showToast("Please fill all required fields.");
    return;
  }

  if (password !== confirm) {
    if (typeof showToast === "function") showToast("Passwords do not match.");
    return;
  }

  try {
    const res = await apiRegister(fullName, email, phone, password, role, gender);
    if (res.success) {
      if (typeof showSuccess === "function") {
        showSuccess(role, true);
      } else {
        if (typeof showToast === "function") showToast("Registration successful!");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      }
    } else if (typeof showToast === "function") {
      showToast(res.error || res.message || "Registration failed");
    }
  } catch (err) {
    if (typeof showToast === "function") showToast("Registration failed. Server error.");
  }
}

function logoutUser() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

function getLoggedInUser() {
  return JSON.parse(localStorage.getItem("loggedInUser"));
}

function normalizeRoomType(value) {
  const cleaned = String(value || "").trim().toLowerCase();
  if (cleaned === "single" || cleaned === "single room") return "Single Room";
  if (cleaned === "double" || cleaned === "double room") return "Double Room";
  if (cleaned === "studio") return "Studio";
  if (cleaned === "apartment") return "Apartment";
  return value || "Room";
}

function getFacilityIcon(label) {
  const cleaned = String(label || "").trim().toLowerCase();
  const map = {
    wifi: "📶",
    "air conditioning": "❄️",
    ac: "❄️",
    kitchen: "🍳",
    "private bathroom": "🚿",
    bathroom: "🚿",
    parking: "🅿️",
    security: "🔒",
    balcony: "🌿",
    furnished: "🛋️",
    laundry: "🧺",
    tv: "📺"
  };
  return map[cleaned] || "✨";
}

function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `http://localhost:3000${path.startsWith('/') ? '' : '/'}${path}`;
}

// SEARCH ROOMS
function searchRooms() {
  const rooms = getData("rooms");

  const locationInput = document.getElementById("searchLocation");
  const typeInput = document.getElementById("searchType");
  const priceInput = document.getElementById("searchPrice");
  const capInput = document.getElementById("searchCapacity");

  const location = locationInput ? locationInput.value.toLowerCase() : "";
  const type = typeInput ? typeInput.value : "";
  const maxPrice = priceInput ? priceInput.value : "";
  const capacity = capInput ? capInput.value : "";

  const results = rooms.filter((room) => {
    const roomType = normalizeRoomType(room.room_type || room.type);
    return (
      room.availability_status === "Available" &&
      (!location || room.location.toLowerCase().includes(location)) &&
      (!type || roomType === normalizeRoomType(type)) &&
      (!maxPrice || Number(room.price_per_month) <= Number(maxPrice)) &&
      (!capacity || Number(room.capacity) >= Number(capacity))
    );
  });

  const container = document.getElementById("roomResults");
  if (container) {
    renderRooms(results);
  } else {
    console.log("Results:", results);
  }
}

function renderRooms(rooms) {
  const container = document.getElementById("roomResults");
  if (!container) return;

  if (rooms.length === 0) {
    container.innerHTML = '<div class="no-results">No rooms found matching your criteria.</div>';
    return;
  }

  container.innerHTML = rooms.map((room) => {
    let bgUrl = '';
    if (room.images) {
      try {
        const parsed = JSON.parse(room.images);
        if (parsed && parsed.length > 0) bgUrl = getImageUrl(parsed[0]);
      } catch(e) {}
    }
    if (!bgUrl && room.property_image) {
      bgUrl = getImageUrl(room.property_image);
    }
    
    return `
    <div class="room-card">
      <div class="rc-img" style="position:relative; background:linear-gradient(135deg,#3B82F6,#60A5FA); overflow:hidden;">
        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:40px; opacity:${bgUrl ? '0' : '1'}; transition:opacity 0.2s;">🛏</div>
        ${bgUrl ? `<img src="${bgUrl}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'; this.previousElementSibling.style.opacity='1';">` : ''}
      </div>
      <div class="rc-body">
        <div class="rc-tag">${room.availability_status === "Available" ? "✓ Available" : "Booked"}</div>
        <div class="rc-title">${room.room_title}</div>
        <div class="rc-addr">📍 ${room.location}</div>
        <div class="rc-meta">
          <span>🛏 ${normalizeRoomType(room.room_type)}</span>
          <span>👥 ${room.capacity} pers.</span>
          <span>📐 ${room.size || 0} m²</span>
        </div>
        <div class="rc-foot">
          <div class="rc-price">$${room.price_per_month} <small>/ month</small></div>
          <button class="rc-book" onclick="openRoomDetails('${room.room_id}')">View Details</button>
        </div>
      </div>
    </div>
  `}).join("");
}

function openRoomDetails(roomId) {
  const rooms = getData("rooms");
  const room = rooms.find((r) => String(r.room_id) === String(roomId) || String(r.idRoom) === String(roomId));
  if (!room) return;

  const roomType = normalizeRoomType(room.type || room.room_type);
  const modal = document.getElementById("roomDetail");
  if (!modal) return;
  const backButton = modal.querySelector(".rdp-back");
  if (backButton) backButton.textContent = "← Back to Rooms";
  const landlordIcons = modal.querySelectorAll(".landlord-icon");
  if (landlordIcons[0]) landlordIcons[0].textContent = "👤";
  if (landlordIcons[1]) landlordIcons[1].textContent = "📞";

  modal.querySelector(".rdp-title").textContent = room.room_title || room.title || `${roomType} Room`;
  modal.querySelector(".rdp-prop").textContent = `📍 ${room.location || "Phnom Penh"}`;
  modal.querySelector(".rdp-desc").textContent = room.description || "Modern living in the heart of the city with all essential amenities and 24/7 security.";
  modal.querySelector(".book-price").innerHTML = `$${room.price || room.price_per_month} <small>/ month</small>`;

  const monthlyRentEl = modal.querySelector(".book-total span:last-child");
  if (monthlyRentEl) monthlyRentEl.textContent = `$${room.price || room.price_per_month}`;
  document.getElementById("totalAmt").textContent = `$${room.price || room.price_per_month}`;

  const availabilityBadge = modal.querySelector(".rdp-tag");
  const bookBtn = modal.querySelector(".book-now-btn");
  let isAvailable = true;
  if (availabilityBadge) {
    isAvailable = String(room.status || room.availability_status || "available").toLowerCase().includes("available");
    availabilityBadge.textContent = isAvailable ? "✓ Available" : "✕ Booked";
    availabilityBadge.classList.toggle("status-available", isAvailable);
    availabilityBadge.classList.toggle("status-booked", !isAvailable);
  }

  // Update Book button based on availability
  if (bookBtn) {
    if (isAvailable) {
      bookBtn.disabled = false;
      bookBtn.textContent = "Book This Room";
      bookBtn.style.background = "";
      bookBtn.style.cursor = "";
      bookBtn.style.opacity = "";
      bookBtn.onclick = function() { doBooking(); };
    } else {
      bookBtn.disabled = true;
      bookBtn.textContent = "Room Not Available";
      bookBtn.style.background = "linear-gradient(135deg, #dc2626, #b91c1c)";
      bookBtn.style.cursor = "not-allowed";
      bookBtn.style.opacity = "0.85";
      bookBtn.onclick = null;
    }
  }

  const stats = modal.querySelectorAll(".rdp-meta-box .v");
  if (stats.length >= 4) {
    stats[0].textContent = roomType;
    stats[1].textContent = `${room.size || 32} m²`;
    stats[2].textContent = room.capacity || 2;
  }

  const propertyId = room.Property_idProperty || room.property_id;
  const prop = getProperty(propertyId);
  if (prop) {
    modal.querySelector(".rdp-title").textContent = `${prop.title} - ${roomType}`;
    modal.querySelector(".rdp-prop").textContent = `📍 ${prop.location}`;

    const lId = prop.Landlord_idLandlord || prop.user_id || prop.landlord_id || prop.idLandlord;
    const landlord = getLandlord(lId);

    const ln = document.getElementById("rdpLandlordName");
    const lp = document.getElementById("rdpLandlordPhone");

    if (ln) ln.textContent = landlord.name || landlord.full_name || "Chea Bora";
    if (lp) lp.textContent = landlord.phone && landlord.phone !== "N/A" ? landlord.phone : "012999888";
  }

  const facilitiesContainer = modal.querySelector(".rdp-facilities");
  if (facilitiesContainer) {
    const facList = String(room.facilities || "WiFi, Air Conditioning, Kitchen, Private Bathroom, Parking, Security")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    facilitiesContainer.innerHTML = facList.map((item) => `<span class="rdp-fac">${getFacilityIcon(item)} ${item}</span>`).join("");
  }

  modal.dataset.currentRoomId = roomId;
  modal.dataset.currentRoomPrice = room.price || room.price_per_month;

  const reviews = getPropertyReviews(propertyId);
  const reviewsContainer = document.getElementById("propertyReviewsContainer");

  if (reviewsContainer) {
    if (reviews.length === 0) {
      reviewsContainer.innerHTML = '<p style="color:var(--slate); font-size:14px;">No reviews yet for this property.</p>';
    } else {
      reviewsContainer.innerHTML = reviews.map((rev) => {
        const tenant = getTenant(rev.Tenant_idTenant || rev.tenant_id);
        return `
          <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
              <span style="font-weight:600; font-size:14px;">${tenant.full_name}</span>
              <span style="color:#fbbf24;">${"★".repeat(rev.rating)}${"☆".repeat(5 - rev.rating)}</span>
            </div>
            <p style="font-size:13px; color:var(--slate); line-height:1.4;">${rev.comment || "No comment."}</p>
          </div>
        `;
      }).join("");
    }
  }

  const avgRating = getPropertyAvgRating(propertyId) || 5.0;
  if (stats.length >= 4) stats[3].textContent = `${avgRating} ⭐`;

  const reviewsCountEl = modal.querySelector(".book-rating");
  if (reviewsCountEl) reviewsCountEl.innerHTML = `<span>${"★".repeat(Math.max(1, Math.round(avgRating)))}</span> ${avgRating} · ${reviews.length} reviews`;

  openRoomDetail();
}

async function bookRoom() {
  const user = getLoggedInUser();

  if (!user || user.role !== "tenant") {
    if (typeof showToast === "function") showToast("Please login as tenant first.");
    return;
  }

  const modal = document.getElementById("roomDetail");
  const roomId = modal ? modal.dataset.currentRoomId : null;

  const moveIn = document.getElementById("moveIn").value;
  const moveOut = document.getElementById("moveOut").value;

  if (!roomId) {
    showToast("Error: Room not found.");
    return;
  }

  if (!moveIn || !moveOut) {
    if (typeof showToast === "function") showToast("Please select move-in and move-out dates.");
    return;
  }

  try {
    const res = await apiAddBooking({
      check_in: moveIn,
      check_out: moveOut,
      Tenant_idTenant: user.user_id,
      Room_idRoom: roomId,
      status: "pending"
    });

    if (res.success) {
      if (typeof showToast === "function") showToast("Booking submitted! Waiting for landlord confirmation.");
      if (typeof closeRoomDetail === "function") closeRoomDetail();
      await initData();
    } else if (typeof showToast === "function") {
      showToast(res.message);
    }
  } catch (err) {
    if (typeof showToast === "function") showToast("Booking failed.");
  }
}

// LANDLORD ADD PROPERTY
async function addProperty() {
  const user = getLoggedInUser();

  if (!user || user.role !== "landlord") {
    alert("Please login as landlord first.");
    return;
  }

  const name = document.getElementById("pName").value.trim();
  const addr = document.getElementById("pAddr").value.trim();
  const type = document.getElementById("pType") ? document.getElementById("pType").value : "Apartment";
  const desc = document.getElementById("pDesc") ? document.getElementById("pDesc").value : "";

  if (!name || !addr) {
    showToast("Property name and address are required.");
    return;
  }

  try {
    const imgInput = document.getElementById("addPropImages");
    let image = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop";
    let image2 = null;

    if (imgInput && imgInput.files.length > 0) {
      const uploadRes = await apiUploadImages(imgInput.files);
      if (uploadRes.success && uploadRes.urls.length > 0) {
        image = uploadRes.urls[0];
        if (uploadRes.urls.length > 1) image2 = uploadRes.urls[1];
      }
    }

    const propRes = await apiAddProperty({
      title: name,
      location: addr,
      description: desc,
      property_type: type,
      Landlord_idLandlord: user.user_id,
      Admin_idAdmin: 1,
      image: image,
      image2: image2
    });

    if (propRes.success) {
      await initData();
      showToast("Property added successfully!");
      document.getElementById("pName").value = "";
      document.getElementById("pAddr").value = "";
      if (document.getElementById("pDesc")) document.getElementById("pDesc").value = "";
      if (typeof closeModal === "function") closeModal("addPropertyModal");
      if (typeof initLandlordDashboard === "function") initLandlordDashboard();
    } else {
      showToast("Failed to add property.");
    }
  } catch (err) {
    showToast("Server error.");
  }
}

// LANDLORD ADD ROOM
async function addRoom() {
  const user = getLoggedInUser();
  if (!user) return;

  const propId = document.getElementById("pSelect").value;
  const type = normalizeRoomType(document.getElementById("rType").value);
  const price = document.getElementById("rPrice").value;
  const size = document.getElementById("rSize").value;
  const cap = document.getElementById("rCap").value;
  const facilities = document.getElementById("rFac") ? document.getElementById("rFac").value.trim() : "";

  if (!propId) {
    showToast("Please select a property.");
    return;
  }

  if (!price || Number(price) <= 0) {
    showToast("Please enter a valid monthly price.");
    return;
  }

  if (!size || Number(size) <= 0 || !cap || Number(cap) <= 0) {
    showToast("Room size and capacity are required.");
    return;
  }

  try {
    const imgInput = document.getElementById("addRoomImages");
    let images = null;
    let uploadedUrls = [];

    if (imgInput && imgInput.files.length > 0) {
      const uploadRes = await apiUploadImages(imgInput.files);
      if (uploadRes.success && uploadRes.urls.length > 0) {
        uploadedUrls = uploadRes.urls;
        images = JSON.stringify(uploadRes.urls); // keep TEXT field for backward compat
      }
    }

    const res = await apiAddRoom({
      type,
      price: Number(price),
      status: "available",
      size: Number(size),
      capacity: Number(cap),
      facilities,
      images,
      Property_idProperty: propId,
      Admin_idAdmin: 1
    });

    if (res.success) {
      const newRoomId = res.idRoom;

      // ── Save images to Room_Image table ──────────────────────────────
      if (uploadedUrls.length > 0 && newRoomId) {
        await apiSaveRoomImages(newRoomId, uploadedUrls);
      }

      // ── Save facilities to Room_Facility table ────────────────────────
      // Check for checkbox-based facility selection first
      const checkedFacilities = document.querySelectorAll('input[name="roomFacility"]:checked');
      if (checkedFacilities.length > 0 && newRoomId) {
        const facilityIds = Array.from(checkedFacilities).map(cb => Number(cb.value));
        await apiSaveRoomFacilities(newRoomId, facilityIds);
      } else if (facilities && newRoomId) {
        // Fallback: map text facilities to IDs from MOCK_DATA.facilities
        const allFacilities = MOCK_DATA.facilities || [];
        const facNames = facilities.split(',').map(f => f.trim().toLowerCase());
        const matchedIds = allFacilities
          .filter(f => facNames.some(n => f.facility_name.toLowerCase().includes(n) || n.includes(f.facility_name.toLowerCase())))
          .map(f => f.facility_id);
        if (matchedIds.length > 0) {
          await apiSaveRoomFacilities(newRoomId, matchedIds);
        }
      }

      await initData();
      showToast("Room added successfully!");
      document.getElementById("rPrice").value = "";
      document.getElementById("rSize").value = "";
      document.getElementById("rCap").value = "";
      if (document.getElementById("rFac")) document.getElementById("rFac").value = "";
      if (typeof closeModal === "function") closeModal("addRoomModal");
      if (typeof initLandlordDashboard === "function") initLandlordDashboard();
    } else {
      showToast("Failed to add room.");
    }
  } catch (err) {
    showToast("Server error.");
  }
}


// ADMIN ACTIONS (Keep as is or improve later)
function blockUser(userId) {
  const users = getData("users");
  const user = users.find((u) => u.user_id === userId);
  if (user) {
    user.is_active = false;
    saveData("users", users);
    addAdminLog("BLOCK", "User", userId);
    if (typeof showToast === "function") showToast("User blocked.");
  }
}

function renderRecentReviews() {
  const container = document.getElementById("recentReviewsContainer");
  if (!container) return;

  const reviews = MOCK_DATA.reviews || [];
  if (reviews.length === 0) return;

  const recent = reviews.slice(-3).reverse();

  container.innerHTML = recent.map((rev) => {
    const tenant = getTenant(rev.Tenant_idTenant || rev.tenant_id);
    const prop = getProperty(rev.Property_idProperty || rev.property_id);
    return `
      <div class="rev-card">
        <div class="rev-stars">${"★".repeat(rev.rating)}${"☆".repeat(5 - rev.rating)}</div>
        <p class="rev-text">"${rev.comment || "Great experience!"}"</p>
        <div class="rev-auth">
          <div class="rev-av av-b">${tenant.full_name ? tenant.full_name[0] : "U"}</div>
          <div>
            <div class="rev-name">${tenant.full_name}</div>
            <div class="rev-sub">Tenant · ${prop ? prop.title || prop.property_name : "Verified Property"}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function addAdminLog(actionType, targetTable, targetId) {
  const user = getLoggedInUser();
  const logs = getData("admin_logs");

  logs.push({
    log_id: generateId("L"),
    user_id: user ? user.user_id : "System",
    action_type: actionType,
    target_table: targetTable,
    target_id: targetId,
    action_date: new Date().toISOString()
  });

  saveData("admin_logs", logs);
}

// THEME MANAGEMENT — Unified across ALL pages
// Dashboard pages (landlord/tenant) use class 'light-mode' (dark by default)
// Public pages (index, login) use class 'dark-mode' (light by default)
// A single localStorage key 'siteTheme' stores either 'dark' or 'light'

function isDashboardPage() {
  const path = window.location.pathname.toLowerCase();
  return path.includes('dashboard') || path.includes('landlord') || path.includes('admin');
}

function getTheme() {
  return localStorage.getItem("siteTheme") || (isDashboardPage() ? "dark" : "light");
}

function applyTheme(theme) {
  if (isDashboardPage()) {
    // Dashboard pages: default is dark, light-mode class = light
    if (theme === "light") {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    } else {
      document.body.classList.remove("light-mode");
      document.body.classList.remove("dark-mode");
    }
  } else {
    // Public pages: default is light, dark-mode class = dark
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.remove("dark-mode");
      document.body.classList.remove("light-mode");
    }
  }

  // Update all theme toggle buttons on the page
  const icon = theme === "light" ? "☀️" : "🌙";
  const dashBtn = document.getElementById("themeToggle");
  const siteBtn = document.getElementById("siteThemeToggle");
  if (dashBtn) dashBtn.textContent = icon;
  if (siteBtn) siteBtn.textContent = icon;
}

// For dashboard pages (landlord/tenant)
function toggleTheme() {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("siteTheme", next);
  applyTheme(next);
}

// For public pages (index, login)
function toggleSiteTheme() {
  const current = getTheme();
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem("siteTheme", next);
  applyTheme(next);
}

function applySavedTheme() {
  applyTheme(getTheme());
}

// Alias for public pages
function applySiteTheme() {
  applyTheme(getTheme());
}

document.addEventListener("DOMContentLoaded", applySavedTheme);
