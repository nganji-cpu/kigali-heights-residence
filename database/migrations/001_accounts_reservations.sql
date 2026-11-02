-- ===========================================================================
-- Migration 001 — customer accounts, roles, sessions, drafts and payments
--
-- Apply this ONCE to an existing installation. It is an incremental migration:
-- no table is dropped and no existing row is deleted.
--
-- BEFORE RUNNING: take a backup of the database, for example:
--   mysqldump -u root -p kigali_heights_residence > backup_before_001.sql
--
-- The recommended way to apply it is the idempotent runner, which checks the
-- current schema before each change:
--   npm run db:migrate
--
-- This raw SQL file is provided for reference / manual application. If it is
-- run a second time, the ALTER statements will report duplicate columns or
-- keys; the npm runner is safe to re-run.
--
-- Fresh installations do not need this file: database/schema.sql already
-- contains the extended structure.
-- ===========================================================================

USE kigali_heights_residence;

-- ---------------------------------------------------------------------------
-- Users, sessions and login rate limiting
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin', 'staff') NOT NULL DEFAULT 'customer',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status),
  KEY idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token_hash),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expiry (expires_at),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  success TINYINT(1) NOT NULL DEFAULT 0,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_login_attempts_email (email, attempted_at),
  KEY idx_login_attempts_ip (ip_hash, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Room operational status
-- ---------------------------------------------------------------------------
ALTER TABLE rooms
  ADD COLUMN status ENUM('available', 'occupied', 'maintenance', 'inactive')
    NOT NULL DEFAULT 'available' AFTER featured,
  ADD KEY idx_rooms_status (status);

-- ---------------------------------------------------------------------------
-- Extend bookings with an owner and the new lifecycle states
-- ---------------------------------------------------------------------------
ALTER TABLE bookings
  ADD COLUMN user_id INT UNSIGNED NULL AFTER reference,
  ADD COLUMN confirmed_at DATETIME NULL AFTER status,
  ADD COLUMN cancelled_at DATETIME NULL AFTER confirmed_at,
  ADD KEY idx_bookings_user (user_id, created_at),
  ADD CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  MODIFY COLUMN status ENUM('draft', 'pending', 'confirmed', 'cancelled')
    NOT NULL DEFAULT 'pending';

-- ---------------------------------------------------------------------------
-- Unfinished reservation drafts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservation_drafts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  room_id INT UNSIGNED NULL,
  check_in DATE NULL,
  check_out DATE NULL,
  guests TINYINT UNSIGNED NOT NULL DEFAULT 2,
  guest_name VARCHAR(120) NULL,
  guest_email VARCHAR(190) NULL,
  guest_phone VARCHAR(40) NULL,
  requests TEXT NULL,
  current_step TINYINT UNSIGNED NOT NULL DEFAULT 0,
  room_price_snapshot DECIMAL(10, 2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reservation_drafts_user (user_id, updated_at),
  KEY idx_reservation_drafts_room (room_id),
  CONSTRAINT fk_reservation_drafts_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reservation_drafts_room
    FOREIGN KEY (room_id) REFERENCES rooms (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_reservation_drafts_step CHECK (current_step BETWEEN 0 AND 3),
  CONSTRAINT chk_reservation_drafts_guests CHECK (guests BETWEEN 1 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservation_draft_services (
  draft_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  price_snapshot DECIMAL(10, 2) NULL,
  PRIMARY KEY (draft_id, service_id),
  KEY idx_reservation_draft_services_service (service_id),
  CONSTRAINT fk_reservation_draft_services_draft
    FOREIGN KEY (draft_id) REFERENCES reservation_drafts (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reservation_draft_services_service
    FOREIGN KEY (service_id) REFERENCES services (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Payments recorded against reservations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method ENUM('cash', 'bank_transfer', 'card', 'mobile_money', 'other')
    NOT NULL DEFAULT 'bank_transfer',
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  transaction_reference VARCHAR(120) NULL,
  paid_at DATETIME NULL,
  recorded_by_user_id INT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_booking (booking_id, status),
  KEY idx_payments_paid_at (paid_at),
  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_payments_recorded_by
    FOREIGN KEY (recorded_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
