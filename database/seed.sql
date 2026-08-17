-- ============================================================
-- Society Management System - Sample Seed Data
-- Run AFTER schema.sql (or after the backend has run Flyway migrations once).
-- Usage:
--   mysql -u root -p society_management < database/seed.sql
--
-- All seeded passwords below are BCrypt-hashed. Plaintext logins for testing:
--   Super Admin      superadmin@society.app   / Admin@123
--   Society Admin    admin@greenvalley.com    / Admin@123
--   Guard            guard@greenvalley.com    / Guard@123
--   Resident         resident@greenvalley.com / Resident@123
-- Change every one of these immediately in a real deployment.
-- ============================================================

USE society_management;

-- Platform super admin (not tied to any society)
INSERT INTO users (society_id, name, email, password, phone, role, active, created_at)
VALUES (NULL, 'Platform Super Admin', 'superadmin@society.app',
        '$2b$10$BfhMu5hfvGUGjcWfd90Qx.ntqMGF.0GPR8XuaZj9EEQQF6Bsmy2Tu', '9999999999',
        'SUPER_ADMIN', TRUE, NOW())
ON DUPLICATE KEY UPDATE email = email;

-- Sample society
INSERT INTO societies (name, registration_number, address, city, state, pincode,
                        contact_email, contact_phone, active, created_at, updated_at)
VALUES ('Green Valley Apartments', 'REG-GV-2026-001', '123 MG Road', 'Bengaluru', 'Karnataka', '560001',
        'admin@greenvalley.com', '9876543210', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;

SET @society_id = (SELECT id FROM societies WHERE contact_email = 'admin@greenvalley.com');

-- Society admin
INSERT INTO users (society_id, name, email, password, phone, role, active, created_at)
VALUES (@society_id, 'Society Admin', 'admin@greenvalley.com',
        '$2b$10$BfhMu5hfvGUGjcWfd90Qx.ntqMGF.0GPR8XuaZj9EEQQF6Bsmy2Tu', '9876543210',
        'SOCIETY_ADMIN', TRUE, NOW())
ON DUPLICATE KEY UPDATE email = email;

-- Gate guard
INSERT INTO users (society_id, name, email, password, phone, role, active, created_at)
VALUES (@society_id, 'Ramesh Kumar', 'guard@greenvalley.com',
        '$2b$10$F7TUIGBu6zRLxPY6v/T4quwlikNmKUllwewZnEKe73zFoZv/.V9Oe', '9876500001',
        'GUARD', TRUE, NOW())
ON DUPLICATE KEY UPDATE email = email;

-- Resident
INSERT INTO users (society_id, name, email, password, phone, role, flat_number, block_name, active, created_at)
VALUES (@society_id, 'Priya Sharma', 'resident@greenvalley.com',
        '$2b$10$Z8PIqLG4Pit7eVz.5jOcG.NszhquzDQdbjG3fZantiNn8OaqetDs6', '9876500002',
        'RESIDENT', '204', 'A', TRUE, NOW())
ON DUPLICATE KEY UPDATE email = email;

SET @resident_id = (SELECT id FROM users WHERE email = 'resident@greenvalley.com');

-- Sample flats
INSERT INTO flats (society_id, block_name, flat_number, owner_name, owner_phone, resident_user_id, occupied)
VALUES
    (@society_id, 'A', '204', 'Priya Sharma', '9876500002', @resident_id, TRUE),
    (@society_id, 'A', '101', 'Vikram Singh', '9876500003', NULL, FALSE),
    (@society_id, 'B', '302', 'Anita Desai', '9876500004', NULL, TRUE)
ON DUPLICATE KEY UPDATE owner_name = VALUES(owner_name);
