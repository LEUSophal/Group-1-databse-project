-- ============================================================
-- RentEase Database Schema
-- Matches the Node.js backend (init-db.js)
-- Import this file into MySQL Workbench to recreate the DB.
-- ============================================================
CREATE DATABASE IF NOT EXISTS renting_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE renting_db;

-- ========================
-- 1. ADMIN
-- ========================
CREATE TABLE IF NOT EXISTS Admin (
  idAdmin   INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100),
  email     VARCHAR(100),
  password  VARCHAR(255),
  role      VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 2. TENANT
-- ========================
CREATE TABLE IF NOT EXISTS Tenant (
  idTenant      INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100),
  email         VARCHAR(100) UNIQUE,
  phone         VARCHAR(20),
  password      VARCHAR(255),
  gender        VARCHAR(20),
  profile_image VARCHAR(255),
  is_active     TINYINT DEFAULT 1,
  Admin_idAdmin INT,
  FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 3. LANDLORD
-- ========================
CREATE TABLE IF NOT EXISTS Landlord (
  idLandlord    INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100),
  email         VARCHAR(100) UNIQUE,
  phone         VARCHAR(20),
  password      VARCHAR(255),
  gender        VARCHAR(20),
  profile_image VARCHAR(255),
  is_active     TINYINT DEFAULT 1,
  Admin_idAdmin INT,
  FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 4. PROPERTY
-- ========================
CREATE TABLE IF NOT EXISTS Property (
  idProperty          INT AUTO_INCREMENT PRIMARY KEY,
  title               VARCHAR(150),
  location            VARCHAR(255),
  description         TEXT,
  image               VARCHAR(255),
  image2              VARCHAR(255),
  property_type       VARCHAR(100),
  status              VARCHAR(50) DEFAULT 'active',
  Landlord_idLandlord INT,
  Admin_idAdmin       INT,
  FOREIGN KEY (Landlord_idLandlord) REFERENCES Landlord(idLandlord),
  FOREIGN KEY (Admin_idAdmin)       REFERENCES Admin(idAdmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 5. ROOM
-- ========================
CREATE TABLE IF NOT EXISTS Room (
  idRoom              INT AUTO_INCREMENT PRIMARY KEY,
  type                VARCHAR(45),
  price               DECIMAL(10,2),
  status              VARCHAR(50) DEFAULT 'available',
  size                INT,
  capacity            INT,
  facilities          TEXT,
  images              TEXT,
  Property_idProperty INT,
  Admin_idAdmin       INT,
  FOREIGN KEY (Property_idProperty) REFERENCES Property(idProperty),
  FOREIGN KEY (Admin_idAdmin)       REFERENCES Admin(idAdmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 6. BOOKING
-- ========================
CREATE TABLE IF NOT EXISTS Booking (
  idBooking       INT AUTO_INCREMENT PRIMARY KEY,
  check_in        DATE,
  check_out       DATE,
  status          VARCHAR(50) DEFAULT 'pending',
  Tenant_idTenant INT,
  Room_idRoom     INT,
  Admin_idAdmin   INT,
  FOREIGN KEY (Tenant_idTenant) REFERENCES Tenant(idTenant),
  FOREIGN KEY (Room_idRoom)     REFERENCES Room(idRoom),
  FOREIGN KEY (Admin_idAdmin)   REFERENCES Admin(idAdmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 7. REVIEW
-- ========================
CREATE TABLE IF NOT EXISTS Review (
  idReview            INT AUTO_INCREMENT PRIMARY KEY,
  rating              TINYINT CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT,
  Tenant_idTenant     INT,
  Property_idProperty INT,
  Admin_idAdmin       INT,
  FOREIGN KEY (Tenant_idTenant)     REFERENCES Tenant(idTenant),
  FOREIGN KEY (Property_idProperty) REFERENCES Property(idProperty),
  FOREIGN KEY (Admin_idAdmin)       REFERENCES Admin(idAdmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 8. ROOM_IMAGE
-- ========================
CREATE TABLE IF NOT EXISTS Room_Image (
  image_id   INT AUTO_INCREMENT PRIMARY KEY,
  room_id    INT NOT NULL,
  image_url  VARCHAR(255) NOT NULL,
  is_cover   TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES Room(idRoom) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 9. FACILITY
-- ========================
CREATE TABLE IF NOT EXISTS Facility (
  facility_id   INT AUTO_INCREMENT PRIMARY KEY,
  facility_name VARCHAR(100) NOT NULL,
  description   TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 10. ROOM_FACILITY (Bridge)
-- ========================
CREATE TABLE IF NOT EXISTS Room_Facility (
  room_id     INT NOT NULL,
  facility_id INT NOT NULL,
  PRIMARY KEY (room_id, facility_id),
  FOREIGN KEY (room_id)     REFERENCES Room(idRoom)         ON DELETE CASCADE,
  FOREIGN KEY (facility_id) REFERENCES Facility(facility_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- 11. ADMIN_LOG
-- ========================
CREATE TABLE IF NOT EXISTS Admin_Log (
  log_id       INT AUTO_INCREMENT PRIMARY KEY,
  Admin_idAdmin INT,
  action_type  VARCHAR(50),
  target_table VARCHAR(50),
  target_id    INT,
  description  TEXT,
  action_date  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Admin_idAdmin) REFERENCES Admin(idAdmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SAMPLE DATA  (password stored as plain text for dev only)
-- ============================================================
INSERT IGNORE INTO Admin (name, email, password, role)
  VALUES ('Admin', 'admin@rentease.kh', 'admin123', 'admin');

INSERT IGNORE INTO Landlord (name, email, phone, password, Admin_idAdmin) VALUES
  ('Dara Sok',  'dara@mail.com',  '012345678', 'landlord123', 1),
  ('Maly Chan', 'maly@mail.com',  '098765432', 'maly2024',    1);

INSERT IGNORE INTO Tenant (full_name, email, phone, password, Admin_idAdmin) VALUES
  ('Bopha Keo', 'bopha@mail.com', '011223344', 'tenant123', 1),
  ('Rith Phal', 'rith@mail.com',  '015667788', 'rith2024',  1);

INSERT IGNORE INTO Property (title, location, description, image, property_type, Landlord_idLandlord, Admin_idAdmin) VALUES
  ('Riverside Heights',       '123 River Rd, Siem Reap',    'Modern living near the river.',     'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600', 'Apartment Building', 1, 1),
  ('The Green Quarter',       '56 Garden St, Phnom Penh',   'Eco-friendly guesthouse.',          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600', 'Guesthouse', 1, 1),
  ('Sunrise Garden Residence','Toul Kork, Phnom Penh',      'Luxury residence in Toul Kork.',    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600', 'Condo', 2, 1);

INSERT IGNORE INTO Room (type, price, status, size, capacity, facilities, Property_idProperty, Admin_idAdmin) VALUES
  ('Studio', 280.00, 'available', 32, 2, 'WiFi, Air Conditioning, Kitchen, Private Bathroom, Parking, Security', 3, 1),
  ('Single Room', 150.00, 'available', 20, 1, 'WiFi, Air Conditioning, Private Bathroom', 1, 1),
  ('Double Room', 210.00, 'available', 28, 2, 'WiFi, Air Conditioning, Kitchen, Security', 2, 1);

INSERT IGNORE INTO Booking (check_in, check_out, status, Tenant_idTenant, Room_idRoom, Admin_idAdmin) VALUES
  ('2026-05-01', '2026-06-01', 'confirmed', 1, 1, 1),
  ('2026-05-15', '2026-07-15', 'pending',   2, 2, 1);

INSERT IGNORE INTO Review (rating, comment, Tenant_idTenant, Property_idProperty, Admin_idAdmin) VALUES
  (5, 'Great place, very clean!',      1, 1, 1),
  (4, 'Nice area, good landlord.',     2, 2, 1);

-- Seed Facilities
INSERT IGNORE INTO Facility (facility_id, facility_name, description) VALUES
  (1, 'WiFi',             'High-speed wireless internet'),
  (2, 'Air Conditioning', 'Split-type air conditioner'),
  (3, 'Kitchen',          'Shared or private kitchen'),
  (4, 'Private Bathroom', 'En-suite bathroom'),
  (5, 'Parking',          'Motorbike or car parking'),
  (6, 'Security',         '24/7 security guard or CCTV'),
  (7, 'Balcony',          'Private outdoor balcony'),
  (8, 'Furnished',        'Fully furnished room'),
  (9, 'Laundry',          'Washing machine access'),
  (10,'TV',               'Cable or smart TV');

-- Seed Room_Images from existing room data
INSERT IGNORE INTO Room_Image (image_id, room_id, image_url, is_cover) VALUES
  (1, 1, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600', 1),
  (2, 2, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600', 1),
  (3, 3, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',   1);

-- Seed Room_Facility links
INSERT IGNORE INTO Room_Facility (room_id, facility_id) VALUES
  (1,1),(1,2),(1,5),(1,6),
  (2,1),(2,2),(2,4),
  (3,1),(3,2),(3,3),(3,6);
