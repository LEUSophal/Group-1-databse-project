const mysql = require('mysql2/promise');

async function initDatabase() {
  // First connect without database to create it
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'phal2005'
  });

  console.log('Connected to MySQL server.');

  // Create database
  await conn.query('CREATE DATABASE IF NOT EXISTS renting_db');
  await conn.query('USE renting_db');
  console.log('Database "renting_db" created/selected.');

  // Create tables
  await conn.query(`
    CREATE TABLE IF NOT EXISTS Admin (
      idAdmin INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100),
      password VARCHAR(255),
      role VARCHAR(50)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Tenant (
      idTenant INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(20),
      password VARCHAR(255),
      Admin_idAdmin INT,
      FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Landlord (
      idLandlord INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(20),
      password VARCHAR(255),
      Admin_idAdmin INT,
      FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Property (
      idProperty INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150),
      location VARCHAR(255),
      description TEXT,
      image VARCHAR(255),
      property_type VARCHAR(100),
      Landlord_idLandlord INT,
      Admin_idAdmin INT,
      FOREIGN KEY (Landlord_idLandlord) REFERENCES Landlord(idLandlord),
      FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Room (
      idRoom INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(45),
      price DECIMAL(10,2),
      status VARCHAR(50),
      size INT,
      capacity INT,
      facilities TEXT,
      Property_idProperty INT,
      Admin_idAdmin INT,
      FOREIGN KEY (Property_idProperty) REFERENCES Property(idProperty),
      FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Booking (
      idBooking INT AUTO_INCREMENT PRIMARY KEY,
      check_in DATE,
      check_out DATE,
      status VARCHAR(50),
      Tenant_idTenant INT,
      Room_idRoom INT,
      Admin_idAdmin INT,
      FOREIGN KEY (Tenant_idTenant) REFERENCES Tenant(idTenant),
      FOREIGN KEY (Room_idRoom) REFERENCES Room(idRoom),
      FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Review (
      idReview INT AUTO_INCREMENT PRIMARY KEY,
      rating TINYINT,
      comment VARCHAR(255),
      Tenant_idTenant INT,
      Property_idProperty INT,
      Admin_idAdmin INT,
      FOREIGN KEY (Tenant_idTenant) REFERENCES Tenant(idTenant),
      FOREIGN KEY (Property_idProperty) REFERENCES Property(idProperty),
      FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Room_Image (
      image_id   INT AUTO_INCREMENT PRIMARY KEY,
      room_id    INT NOT NULL,
      image_url  VARCHAR(255) NOT NULL,
      is_cover   TINYINT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES Room(idRoom) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Facility (
      facility_id   INT AUTO_INCREMENT PRIMARY KEY,
      facility_name VARCHAR(100) NOT NULL,
      description   TEXT
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Room_Facility (
      room_id     INT NOT NULL,
      facility_id INT NOT NULL,
      PRIMARY KEY (room_id, facility_id),
      FOREIGN KEY (room_id)     REFERENCES Room(idRoom)          ON DELETE CASCADE,
      FOREIGN KEY (facility_id) REFERENCES Facility(facility_id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS Admin_Log (
      log_id        INT AUTO_INCREMENT PRIMARY KEY,
      Admin_idAdmin INT,
      action_type   VARCHAR(50),
      target_table  VARCHAR(50),
      target_id     INT,
      description   TEXT,
      action_date   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
    )
  `);

  console.log('All tables created successfully!');
  console.log('Tables: Admin, Tenant, Landlord, Property, Room, Booking, Review, Room_Image, Facility, Room_Facility, Admin_Log');

  console.log('You can now open MySQL Workbench and see the "renting_db" database.');

  await conn.end();
}

initDatabase().catch(err => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});
