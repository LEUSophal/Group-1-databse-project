// app-data.js - Bridged to Node.js backend

// Since newfrontendStyle uses synchronous getData calls, we map them to MOCK_DATA.
// Ensure initData() from data.js is called when the app loads.

function getData(key) {
  if (typeof MOCK_DATA === "undefined") return [];

  if (key === "rooms") {
    return MOCK_DATA.rooms.map((r) => {
      const prop = getProperty(r.Property_idProperty) || {};
      const roomType = r.type || r.room_type || "Room";
      const normalizedStatus = String(r.status || "available").toLowerCase();

      return {
        room_id: String(r.idRoom),
        property_id: String(r.Property_idProperty),
        room_title: prop.title ? `${prop.title} - ${roomType}` : `${roomType} Room`,
        location: prop.location || "Unknown",
        room_type: roomType,
        price_per_month: Number(r.price) || 0,
        capacity: Number(r.capacity) || 1,
        size: Number(r.size) || 0,
        facilities: r.facilities || "",
        availability_status: normalizedStatus === "available" ? "Available" : (normalizedStatus === "maintenance" ? "Maintenance" : "Booked"),
        description: prop.description || "",
        property_type: prop.property_type || "",
        rating: Number(getPropertyAvgRating(r.Property_idProperty) || 0),
        images: r.images || null,
        property_image: prop.image || null
      };
    });
  }

  if (key === "properties") {
    return MOCK_DATA.properties.map((p) => ({
      property_id: String(p.idProperty),
      user_id: String(p.Landlord_idLandlord),
      property_name: p.title,
      description: p.description,
      address: p.location,
      property_type: p.property_type || "Apartment",
      total_rooms: getPropertyRooms(p.idProperty).length,
      created_at: new Date().toISOString(),
      image: p.image || null,
      image2: p.image2 || null
    }));
  }

  if (key === "bookings") {
    return MOCK_DATA.bookings.map((b) => {
      const bid = b.idBooking || b.id_booking || b.id;
      const tid = b.Tenant_idTenant || b.tenant_id || b.idTenant;
      const rid = b.Room_idRoom || b.room_id || b.idRoom;

      return {
        booking_id: String(bid),
        user_id: String(tid),
        Tenant_idTenant: String(tid),
        room_id: String(rid),
        check_in: b.check_in,
        check_out: b.check_out,
        booking_status: (b.status || 'pending').charAt(0).toUpperCase() + (b.status || 'pending').slice(1)
      };
    });
  }

  if (key === "tenants") {
    return MOCK_DATA.tenants.map((t) => ({
      idTenant: String(t.idTenant),
      full_name: t.full_name,
      email: t.email,
      phone: t.phone,
      user_id: String(t.idTenant)
    }));
  }

  if (key === "landlords") {
    return MOCK_DATA.landlords.map((l) => ({
      idLandlord: String(l.idLandlord),
      name: l.name,
      email: l.email,
      phone: l.phone,
      user_id: String(l.idLandlord)
    }));
  }

  if (key === "users") {
    const allUsers = [];
    MOCK_DATA.tenants.forEach((t) => allUsers.push({
      user_id: String(t.idTenant),
      full_name: t.full_name,
      email: t.email,
      password: t.password,
      role: "tenant",
      is_active: true,
      phone: t.phone
    }));
    MOCK_DATA.landlords.forEach((l) => allUsers.push({
      user_id: String(l.idLandlord),
      full_name: l.name,
      email: l.email,
      password: l.password,
      role: "landlord",
      is_active: true,
      phone: l.phone
    }));
    return allUsers;
  }

  if (key === "reviews") {
    return MOCK_DATA.reviews.map((r) => ({
      review_id: String(r.idReview),
      rating: r.rating,
      comment: r.comment,
      user_id: String(r.Tenant_idTenant),
      property_id: String(r.Property_idProperty)
    }));
  }

  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
  if (key === "admin_logs") {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

function generateId(prefix) {
  return prefix + "-" + Date.now();
}

async function apiUpdateProfile(role, userId, data) {
  const endpoint = role === "landlord" ? "landlords" : "tenants";
  const response = await fetch(`${API_URL}/auth/${endpoint}/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response.json();
}
