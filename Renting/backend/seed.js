const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

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
  const hashedAdmin    = await bcrypt.hash('admin123',    10);
  const hashedTenant   = await bcrypt.hash('tenant123',   10);
  const hashedLandlord = await bcrypt.hash('landlord123', 10);
  const hashedRith     = await bcrypt.hash('rith2024',    10);

  // Admin
  await conn.execute(
    `INSERT INTO Admin (name, email, password, role) VALUES ('Admin Sokha', 'admin@rentease.kh', '${hashedAdmin}', 'superadmin')`
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
    `INSERT INTO Landlord (name, email, phone, password, Admin_idAdmin) VALUES ('Sok San', 'soksan@landlord.com', '012111222', '${hashedLandlord}', 1)`

  );

  // Properties
  const properties = [
    ['Sunrise Garden Residence', 'Toul Kork, Phnom Penh', 'Modern living in the heart of Toul Kork with rooftop garden and 24/7 security.', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600', 'Condo', 1],
    ['Riverside Heights', '123 River Rd, Siem Reap', 'Modern living near the river with all amenities.', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600', 'Apartment Building', 1],
    ['The Green Quarter', '56 Garden St, Phnom Penh', 'Eco-friendly guesthouse with lush garden surroundings.', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600', 'Guesthouse', 1]
  ];

  for (const p of properties) {
    await conn.execute(
      'INSERT INTO Property (title, location, description, image, property_type, Landlord_idLandlord, Admin_idAdmin) VALUES (?, ?, ?, ?, ?, ?, 1)',
      p
    );
  }

  // Rooms
  const rooms = [
    ['Studio', 280, 'available', 32, 2, 'WiFi, Air Conditioning, Kitchen, Private Bathroom, Parking, Security', 1],
    ['Single Room', 150, 'available', 20, 1, 'WiFi, Air Conditioning, Private Bathroom', 2],
    ['Double Room', 210, 'available', 28, 2, 'WiFi, Air Conditioning, Kitchen, Security', 3]
  ];

  for (const r of rooms) {
    await conn.execute(
      'INSERT INTO Room (type, price, status, size, capacity, facilities, Property_idProperty, Admin_idAdmin) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
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
