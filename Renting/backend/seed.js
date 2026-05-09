const mysql = require('mysql2/promise');

async function seedDatabase() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'phal2005',
    database: 'renting_db'
  });

  // Check if already seeded
  const [admins] = await conn.execute('SELECT COUNT(*) as cnt FROM Admin');
  if (admins[0].cnt > 0) {
    console.log('Database already seeded. Skipping...');
    await conn.end();
    return;
  }

  console.log('Seeding database...');

  // Admin
  await conn.execute(
    "INSERT INTO Admin (name, email, password, role) VALUES ('Admin Sokha', 'admin@rentease.kh', 'admin123', 'superadmin')"
  );

  // Tenants
  await conn.execute(
    "INSERT INTO Tenant (full_name, email, phone, password, Admin_idAdmin) VALUES ('Dara Vong', 'dara@mail.com', '012345678', 'tenant123', 1)"
  );
  await conn.execute(
    "INSERT INTO Tenant (full_name, email, phone, password, Admin_idAdmin) VALUES ('Srey Leak', 'sreyleak@mail.com', '098765432', 'tenant123', 1)"
  );

  // Landlords
  await conn.execute(
    "INSERT INTO Landlord (name, email, phone, password, Admin_idAdmin) VALUES ('Chea Bora', 'bora@landlord.com', '012999888', 'landlord123', 1)"
  );
  await conn.execute(
    "INSERT INTO Landlord (name, email, phone, password, Admin_idAdmin) VALUES ('Sok San', 'soksan@landlord.com', '012111222', 'landlord123', 1)"
  );

  // Properties
  const properties = [
    ['Sunrise Garden Residence', 'Toul Kork, Phnom Penh', 'Modern living in the heart of Toul Kork with rooftop garden and 24/7 security.', 'assets/images/property-1.png', 1],
    ['Riverside View Apartment', 'Daun Penh, Phnom Penh', 'Beautiful apartment overlooking the Mekong river, perfect for expats.', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop', 1],
    ['BKK1 Luxury Villa', 'BKK1, Phnom Penh', 'High-end villa located in the heart of BKK1 with a private pool.', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop', 1],
    ['Toul Kork Modern Condo', 'Toul Kork, Phnom Penh', 'Brand new condo building with gym and rooftop access.', 'https://images.unsplash.com/photo-1502672260266-1c1e5240980c?w=600&h=400&fit=crop', 2],
    ['Chamkar Mon Family House', 'Chamkar Mon, Phnom Penh', 'Spacious house suitable for a large family, pet friendly.', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', 2],
    ['Sen Sok Cozy Studio', 'Sen Sok, Phnom Penh', 'Affordable and cozy studio near the new mall.', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop', 1]
  ];

  for (const p of properties) {
    await conn.execute(
      'INSERT INTO Property (title, location, description, image, Landlord_idLandlord, Admin_idAdmin) VALUES (?, ?, ?, ?, ?, 1)',
      p
    );
  }

  // Rooms
  const rooms = [
    ['Studio', 250, 'available', 1], ['Single', 180, 'available', 1],
    ['Studio', 300, 'available', 2], ['Single', 450, 'booked', 2],
    ['Suite', 800, 'available', 3], ['Double', 500, 'available', 3],
    ['Single', 250, 'available', 4], ['Double', 350, 'available', 4],
    ['Suite', 1200, 'available', 5],
    ['Studio', 180, 'available', 6]
  ];

  for (const r of rooms) {
    await conn.execute(
      'INSERT INTO Room (type, price, status, Property_idProperty, Admin_idAdmin) VALUES (?, ?, ?, ?, 1)',
      r
    );
  }

  // Bookings
  await conn.execute(
    "INSERT INTO Booking (check_in, check_out, status, Tenant_idTenant, Room_idRoom, Admin_idAdmin) VALUES ('2026-04-01', '2026-07-01', 'confirmed', 1, 1, 1)"
  );
  await conn.execute(
    "INSERT INTO Booking (check_in, check_out, status, Tenant_idTenant, Room_idRoom, Admin_idAdmin) VALUES ('2026-05-01', '2026-08-01', 'pending', 2, 4, 1)"
  );
  await conn.execute(
    "INSERT INTO Booking (check_in, check_out, status, Tenant_idTenant, Room_idRoom, Admin_idAdmin) VALUES ('2026-03-15', '2026-06-15', 'confirmed', 1, 5, 1)"
  );

  // Reviews
  await conn.execute(
    "INSERT INTO Review (rating, comment, Tenant_idTenant, Property_idProperty, Admin_idAdmin) VALUES (5, 'Amazing place! Very clean and great location. The landlord is very responsive.', 1, 1, 1)"
  );
  await conn.execute(
    "INSERT INTO Review (rating, comment, Tenant_idTenant, Property_idProperty, Admin_idAdmin) VALUES (4, 'Great riverside views and quiet neighborhood. Highly recommended!', 2, 2, 1)"
  );
  await conn.execute(
    "INSERT INTO Review (rating, comment, Tenant_idTenant, Property_idProperty, Admin_idAdmin) VALUES (5, 'Luxury living at its finest. The pool area is beautiful.', 1, 3, 1)"
  );

  console.log('Seed data inserted successfully!');
  console.log('  - 1 Admin');
  console.log('  - 2 Tenants (dara@mail.com / tenant123, sreyleak@mail.com / tenant123)');
  console.log('  - 2 Landlords (bora@landlord.com / landlord123, soksan@landlord.com / landlord123)');
  console.log('  - 6 Properties with 10 Rooms');
  console.log('  - 3 Bookings, 3 Reviews');

  await conn.end();
}

seedDatabase().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
