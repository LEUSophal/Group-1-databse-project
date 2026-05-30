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

