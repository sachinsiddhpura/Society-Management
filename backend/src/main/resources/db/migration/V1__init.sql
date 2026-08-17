-- ============================================================
-- Society Management System - Initial Schema
-- ============================================================

CREATE TABLE societies (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                 VARCHAR(150)  NOT NULL,
    registration_number  VARCHAR(100)  UNIQUE,
    address              VARCHAR(255),
    city                 VARCHAR(100),
    state                VARCHAR(100),
    pincode              VARCHAR(20),
    contact_email        VARCHAR(150)  NOT NULL UNIQUE,
    contact_phone        VARCHAR(20),
    active               BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at           DATETIME      NOT NULL,
    updated_at           DATETIME      NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    society_id    BIGINT,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    role          VARCHAR(30)  NOT NULL,
    flat_number   VARCHAR(30),
    block_name    VARCHAR(30),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL,
    CONSTRAINT fk_users_society FOREIGN KEY (society_id) REFERENCES societies (id) ON DELETE CASCADE,
    CONSTRAINT chk_users_role CHECK (role IN ('SUPER_ADMIN', 'SOCIETY_ADMIN', 'GUARD', 'RESIDENT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_users_society_id ON users (society_id);

CREATE TABLE flats (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    society_id        BIGINT       NOT NULL,
    block_name        VARCHAR(30)  NOT NULL,
    flat_number       VARCHAR(30)  NOT NULL,
    owner_name        VARCHAR(150),
    owner_phone       VARCHAR(20),
    resident_user_id  BIGINT,
    occupied          BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_flats_society FOREIGN KEY (society_id) REFERENCES societies (id) ON DELETE CASCADE,
    CONSTRAINT fk_flats_resident FOREIGN KEY (resident_user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT uq_flats_society_block_flat UNIQUE (society_id, block_name, flat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE visitor_entries (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    society_id            BIGINT       NOT NULL,
    visitor_name          VARCHAR(150) NOT NULL,
    visitor_phone         VARCHAR(20),
    purpose               VARCHAR(255),
    vehicle_number        VARCHAR(30),
    flat_to_visit         VARCHAR(30),
    block_to_visit        VARCHAR(30),
    host_name             VARCHAR(150),
    photo_url             VARCHAR(500),
    gate_number           VARCHAR(20),
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_by_guard_id   BIGINT,
    approved_by_user_id   BIGINT,
    entry_time            DATETIME     NOT NULL,
    exit_time             DATETIME,
    CONSTRAINT fk_visitor_society FOREIGN KEY (society_id) REFERENCES societies (id) ON DELETE CASCADE,
    CONSTRAINT fk_visitor_guard FOREIGN KEY (created_by_guard_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_visitor_approver FOREIGN KEY (approved_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_visitor_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CHECKED_OUT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_visitor_society_id ON visitor_entries (society_id);
CREATE INDEX idx_visitor_status ON visitor_entries (status);

CREATE TABLE delivery_entries (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    society_id           BIGINT       NOT NULL,
    delivery_partner     VARCHAR(30)  NOT NULL,
    other_partner_name   VARCHAR(100),
    agent_name           VARCHAR(150),
    agent_phone          VARCHAR(20),
    order_id             VARCHAR(100),
    flat_number          VARCHAR(30),
    block_name           VARCHAR(30),
    photo_url            VARCHAR(500),
    gate_number          VARCHAR(20),
    status               VARCHAR(10)  NOT NULL DEFAULT 'IN',
    created_by_guard_id  BIGINT,
    entry_time           DATETIME     NOT NULL,
    exit_time            DATETIME,
    CONSTRAINT fk_delivery_society FOREIGN KEY (society_id) REFERENCES societies (id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_guard FOREIGN KEY (created_by_guard_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_delivery_partner CHECK (delivery_partner IN
        ('ZOMATO', 'SWIGGY', 'AMAZON', 'FLIPKART', 'BIGBASKET', 'BLINKIT', 'POSTAL', 'COURIER', 'OTHER')),
    CONSTRAINT chk_delivery_status CHECK (status IN ('IN', 'OUT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_delivery_society_id ON delivery_entries (society_id);
CREATE INDEX idx_delivery_status ON delivery_entries (status);

-- ============================================================
-- Seed: platform super admin (email: superadmin@society.app / password: Admin@123)
-- Change this password immediately after first login in any real deployment.
-- ============================================================
INSERT INTO users (society_id, name, email, password, phone, role, active, created_at)
VALUES (NULL, 'Platform Super Admin', 'superadmin@society.app',
        '$2b$10$BfhMu5hfvGUGjcWfd90Qx.ntqMGF.0GPR8XuaZj9EEQQF6Bsmy2Tu', '9999999999',
        'SUPER_ADMIN', TRUE, NOW());
