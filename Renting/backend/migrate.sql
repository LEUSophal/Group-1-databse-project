-- ============================================================
-- RentEase Migration Script (MySQL 5.7 Compatible)
-- Uses stored procedures to safely add columns only if missing.
-- ============================================================

USE renting_db;

-- ========================
-- Helper: safe_add_column procedure
-- ========================
DROP PROCEDURE IF EXISTS safe_add_column;

DELIMITER $$
CREATE PROCEDURE safe_add_column(
  IN tbl  VARCHAR(64),
  IN col  VARCHAR(64),
  IN def  TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = tbl
      AND COLUMN_NAME  = col
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SELECT CONCAT('Added column: ', tbl, '.', col) AS result;
  ELSE
    SELECT CONCAT('Already exists, skipped: ', tbl, '.', col) AS result;
  END IF;
END$$
DELIMITER ;

-- ========================
-- 1. TENANT
-- ========================
CALL safe_add_column('Tenant',   'gender',        'VARCHAR(20)  DEFAULT NULL AFTER `password`');
CALL safe_add_column('Tenant',   'profile_image', 'VARCHAR(255) DEFAULT NULL AFTER `gender`');

-- ========================
-- 2. LANDLORD
-- ========================
CALL safe_add_column('Landlord', 'gender',        'VARCHAR(20)  DEFAULT NULL AFTER `password`');
CALL safe_add_column('Landlord', 'profile_image', 'VARCHAR(255) DEFAULT NULL AFTER `gender`');

-- ========================
-- 3. PROPERTY
-- ========================
CALL safe_add_column('Property', 'image2',        'VARCHAR(255) DEFAULT NULL AFTER `image`');

-- ========================
-- 4. ROOM
-- ========================
CALL safe_add_column('Room',     'images',        'TEXT         DEFAULT NULL AFTER `facilities`');

-- ========================
-- Cleanup
-- ========================
DROP PROCEDURE IF EXISTS safe_add_column;

-- ========================
-- Verify final structure
-- ========================
SELECT 'Tenant columns:' AS info;
SHOW COLUMNS FROM Tenant;

SELECT 'Landlord columns:' AS info;
SHOW COLUMNS FROM Landlord;

SELECT 'Property columns:' AS info;
SHOW COLUMNS FROM Property;

SELECT 'Room columns:' AS info;
SHOW COLUMNS FROM Room;
