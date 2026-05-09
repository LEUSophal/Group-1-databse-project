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
  comment             VARCHAR(255),
  Tenant_idTenant     INT,
  Property_idProperty INT,
  Admin_idAdmin       INT,
  FOREIGN KEY (Tenant_idTenant)     REFERENCES Tenant(idTenant),
  FOREIGN KEY (Property_idProperty) REFERENCES Property(idProperty),
  FOREIGN KEY (Admin_idAdmin)       REFERENCES Admin(idAdmin)
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

INSERT IGNORE INTO Property (title, location, description, image, Landlord_idLandlord, Admin_idAdmin) VALUES
  ('Modern Studio in BKK1',   'BKK1, Phnom Penh',    'Cozy studio near embassies.',       'assets/images/property-1.png', 1, 1),
  ('Family House in Toul Kork','Toul Kork, Phnom Penh','Spacious 3-bed house with garden.', 'assets/images/property-2.png', 1, 1),
  ('Sen Sok Apartment',       'Sen Sok, Phnom Penh', 'Modern 2-bed with pool access.',    'assets/images/property-3.png', 2, 1);

INSERT IGNORE INTO Room (type, price, status, Property_idProperty, Admin_idAdmin) VALUES
  ('Studio',          350.00, 'available', 1, 1),
  ('1-Bedroom',       450.00, 'available', 1, 1),
  ('3-Bedroom House', 800.00, 'available', 2, 1),
  ('2-Bedroom',       600.00, 'rented',    3, 1);

INSERT IGNORE INTO Booking (check_in, check_out, status, Tenant_idTenant, Room_idRoom, Admin_idAdmin) VALUES
  ('2026-05-01', '2026-06-01', 'confirmed', 1, 1, 1),
  ('2026-05-15', '2026-07-15', 'pending',   2, 2, 1);

INSERT IGNORE INTO Review (rating, comment, Tenant_idTenant, Property_idProperty, Admin_idAdmin) VALUES
  (5, 'Great place, very clean!',      1, 1, 1),
  (4, 'Nice area, good landlord.',     2, 2, 1);
