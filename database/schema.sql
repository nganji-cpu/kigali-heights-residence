-- ===========================================================================
-- Kigali Heights Residence — MySQL / MariaDB schema + reference data
--
-- This file is safe to run more than once. Tables use IF NOT EXISTS and every
-- seed row is upserted by a unique key, so re-running does not duplicate data.
--
-- Usage (from the project root):
--   npm run db:init
-- or with a MySQL client:
--   mysql -u root -p < database/schema.sql
--
-- The property and its prices are illustrative parts of a design concept.
-- ===========================================================================

CREATE DATABASE IF NOT EXISTS kigali_heights_residence
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kigali_heights_residence;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Apartment categories (Standard, Deluxe, Executive, Penthouse)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS apartments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(60) NOT NULL,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_apartments_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Bookable apartment units ("rooms" in the frontend)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  apartment_id INT UNSIGNED NOT NULL,
  slug VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  category ENUM('standard', 'deluxe', 'executive', 'penthouse') NOT NULL,
  floor TINYINT UNSIGNED NOT NULL,
  summary VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL,
  capacity TINYINT UNSIGNED NOT NULL,
  size_sqm SMALLINT UNSIGNED NOT NULL,
  bed_type VARCHAR(120) NOT NULL,
  view_name VARCHAR(120) NOT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rooms_slug (slug),
  KEY idx_rooms_category (category),
  KEY idx_rooms_floor (floor),
  CONSTRAINT fk_rooms_apartment
    FOREIGN KEY (apartment_id) REFERENCES apartments (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_rooms_floor CHECK (floor BETWEEN 2 AND 5),
  CONSTRAINT chk_rooms_capacity CHECK (capacity BETWEEN 1 AND 6),
  CONSTRAINT chk_rooms_price CHECK (price_per_night >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Amenities + room associations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_amenities_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_amenities (
  room_id INT UNSIGNED NOT NULL,
  amenity_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (room_id, amenity_id),
  KEY idx_room_amenities_amenity (amenity_id),
  CONSTRAINT fk_room_amenities_room
    FOREIGN KEY (room_id) REFERENCES rooms (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_room_amenities_amenity
    FOREIGN KEY (amenity_id) REFERENCES amenities (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Gallery images for each room
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id INT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(255) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_room_images_order (room_id, sort_order),
  CONSTRAINT fk_room_images_room
    FOREIGN KEY (room_id) REFERENCES rooms (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Guest services
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  category ENUM('transport', 'dining', 'lifestyle', 'business') NOT NULL,
  summary VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sample_price DECIMAL(10, 2) NOT NULL,
  pricing_type ENUM(
    'per-trip', 'per-day', 'per-person', 'per-person-day', 'per-booking'
  ) NOT NULL,
  price_note VARCHAR(120) NOT NULL,
  icon VARCHAR(60) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_services_slug (slug),
  KEY idx_services_category (category),
  CONSTRAINT chk_services_price CHECK (sample_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Bookings — totals are always calculated by the server.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference VARCHAR(32) NOT NULL,
  room_id INT UNSIGNED NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests TINYINT UNSIGNED NOT NULL,
  guest_name VARCHAR(120) NOT NULL,
  guest_email VARCHAR(190) NOT NULL,
  guest_phone VARCHAR(40) NOT NULL,
  requests TEXT NULL,
  nights SMALLINT UNSIGNED NOT NULL,
  room_total DECIMAL(10, 2) NOT NULL,
  services_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_reference (reference),
  KEY idx_bookings_room_dates (room_id, check_in, check_out, status),
  KEY idx_bookings_created (created_at),
  CONSTRAINT fk_bookings_room
    FOREIGN KEY (room_id) REFERENCES rooms (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_bookings_dates CHECK (check_out > check_in),
  CONSTRAINT chk_bookings_guests CHECK (guests BETWEEN 1 AND 6),
  CONSTRAINT chk_bookings_nights CHECK (nights >= 1),
  CONSTRAINT chk_bookings_total CHECK (total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Services attached to a booking (also used for post-booking requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('confirmed', 'requested', 'cancelled') NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_booking_services (booking_id, service_id),
  KEY idx_booking_services_service (service_id),
  CONSTRAINT fk_booking_services_booking
    FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_booking_services_service
    FOREIGN KEY (service_id) REFERENCES services (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_booking_services_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Contact messages — persisted enquiries from the contact page
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  subject VARCHAR(60) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_messages_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- Reference data for the concept
-- ===========================================================================

INSERT INTO apartments (id, slug, name, description) VALUES
  (1, 'standard',  'Standard',  'Level 2 · efficient apartments for short stays.'),
  (2, 'deluxe',    'Deluxe',    'Level 3 · more living space and warmer finishes.'),
  (3, 'executive', 'Executive', 'Level 4 · quiet, work-ready suites for longer visits.'),
  (4, 'penthouse', 'Penthouse', 'Level 5 · rooftop living with panoramic views.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO rooms (
  id, apartment_id, slug, name, category, floor, summary, description,
  price_per_night, capacity, size_sqm, bed_type, view_name, featured
) VALUES
  (
    1, 1, 'standard-city-apartment', 'Standard City Apartment', 'standard', 2,
    'A calm, light-filled one-bedroom apartment for short business trips and city weekends.',
    'Our most understated apartment, arranged around a quiet sleeping area and a compact living space with a work-ready desk. Large windows face the Kigali skyline, and the kitchenette makes it easy to settle in for a few days without eating out twice a day.',
    120.00, 2, 42, '1 queen bed', 'City outlook', 0
  ),
  (
    2, 1, 'garden-standard-apartment', 'Garden Standard Apartment', 'standard', 2,
    'A twin-ready apartment on the quieter side of level two, with softer natural light.',
    'Designed for colleagues travelling together or friends sharing a stay, this apartment can be arranged with twin beds. The shaded side of the building keeps afternoons cooler, and the compact lounge doubles as a comfortable place to work or read.',
    135.00, 2, 45, '1 queen bed or twin beds', 'Internal courtyard', 0
  ),
  (
    3, 2, 'deluxe-apartment', 'Deluxe Apartment', 'deluxe', 3,
    'More living space, warmer finishes and a proper dining corner for longer stays.',
    'The Deluxe Apartment opens into a generous living and dining area separated from the bedroom, which makes it well suited to stays of a week or more. Textured stone, warm timber and layered lighting give the apartment a settled, residential feel rather than a hotel-room one.',
    185.00, 3, 58, '1 king bed + sofa bed', 'City and hills', 1
  ),
  (
    4, 2, 'deluxe-corner-apartment', 'Deluxe Corner Apartment', 'deluxe', 3,
    'A corner apartment with windows on two sides and a deep, shaded balcony.',
    'Corner positioning gives this Deluxe apartment twice the daylight and a long balcony that catches the late afternoon. Inside, a deep sofa, a separate dining table and a generous bathroom with a freestanding tub make it a comfortable base for couples or small families.',
    210.00, 4, 64, '1 king bed + 2 singles', 'Panoramic corner balcony', 0
  ),
  (
    5, 3, 'executive-suite', 'Executive Suite', 'executive', 4,
    'Built for business travel: a quiet study, fast connectivity and a separated lounge.',
    'The Executive Suite is arranged so that work and rest stay apart — a dedicated study with a full-width desk, a separate lounge for informal meetings, and blackout-lined sleeping quarters. Concierge support for printing, transfers and conference logistics is available on request.',
    260.00, 2, 72, '1 king bed', 'Kigali skyline', 1
  ),
  (
    6, 4, 'penthouse-residence', 'Penthouse Residence', 'penthouse', 5,
    'The top floor, opening onto the rooftop lounge with long views across the city.',
    'The Penthouse occupies the quietest corner of level five and connects directly to the rooftop lounge. Two bedrooms, a full entertaining kitchen, a library corner and a private terrace make it the natural choice for family stays, small celebrations, or long executive visits where guests want room to host.',
    480.00, 4, 145, '2 king beds + 2 sofa beds', 'Rooftop, city and hills', 1
  )
ON DUPLICATE KEY UPDATE
  apartment_id = VALUES(apartment_id),
  name = VALUES(name),
  category = VALUES(category),
  floor = VALUES(floor),
  summary = VALUES(summary),
  description = VALUES(description),
  price_per_night = VALUES(price_per_night),
  capacity = VALUES(capacity),
  size_sqm = VALUES(size_sqm),
  bed_type = VALUES(bed_type),
  view_name = VALUES(view_name),
  featured = VALUES(featured);

INSERT INTO amenities (id, slug, name) VALUES
  (1,  'high-speed-wifi',            'High-speed Wi-Fi'),
  (2,  'air-conditioning',           'Air conditioning'),
  (3,  'kitchenette',                'Kitchenette'),
  (4,  'work-desk',                  'Work desk'),
  (5,  'smart-tv',                   'Smart TV'),
  (6,  'in-room-safe',               'In-room safe'),
  (7,  'rain-shower',                'Rain shower'),
  (8,  'daily-housekeeping',         'Daily housekeeping'),
  (9,  'twin-bed-option',            'Twin-bed option'),
  (10, 'blackout-curtains',          'Blackout curtains'),
  (11, 'full-kitchen',               'Full kitchen'),
  (12, 'dining-for-four',            'Dining for four'),
  (13, 'washer-dryer',               'Washer & dryer'),
  (14, 'espresso-machine',           'Espresso machine'),
  (15, 'private-balcony',            'Private balcony'),
  (16, 'freestanding-bath',          'Freestanding bath'),
  (17, 'corner-balcony',             'Corner balcony'),
  (18, 'workspace',                  'Workspace'),
  (19, 'dedicated-study',            'Dedicated study'),
  (20, 'wired-wireless-internet',    'Wired & wireless internet'),
  (21, 'meeting-ready-lounge',       'Meeting-ready lounge'),
  (22, 'nespresso-machine',          'Nespresso machine'),
  (23, 'pressing-service',           'Pressing service'),
  (24, 'blackout-bedroom',           'Blackout bedroom'),
  (25, 'direct-rooftop-access',      'Direct rooftop access'),
  (26, 'private-terrace',            'Private terrace'),
  (27, 'full-entertaining-kitchen',  'Full entertaining kitchen'),
  (28, 'library-corner',             'Library corner'),
  (29, 'two-bathrooms',              'Two bathrooms'),
  (30, 'dedicated-concierge',        'Dedicated concierge')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO room_amenities (room_id, amenity_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
  (2, 1), (2, 2), (2, 3), (2, 9), (2, 5), (2, 10), (2, 7), (2, 8),
  (3, 1), (3, 2), (3, 11), (3, 12), (3, 13), (3, 14), (3, 15), (3, 8),
  (4, 1), (4, 2), (4, 11), (4, 16), (4, 13), (4, 17), (4, 18), (4, 8),
  (5, 19), (5, 20), (5, 2), (5, 21), (5, 22), (5, 23), (5, 24), (5, 8),
  (6, 25), (6, 26), (6, 27), (6, 28), (6, 29), (6, 30), (6, 22), (6, 8);

INSERT INTO room_images (room_id, image_path, alt_text, sort_order) VALUES
  (1, '/images/room-standard.jpg',      'Sunlit standard apartment bedroom', 1),
  (1, '/images/kitchen-apartment.jpg',  'Compact apartment kitchenette', 2),
  (1, '/images/corridor-hotel.jpg',     'Quiet residential corridor', 3),
  (1, '/images/living-sea-ranch.jpg',   'Living area with a work desk', 4),
  (2, '/images/room-standard-2.jpg',    'Garden-facing standard apartment', 1),
  (2, '/images/living-sea-ranch.jpg',   'Compact lounge with natural light', 2),
  (2, '/images/kitchen-apartment.jpg',  'Kitchenette and dining corner', 3),
  (2, '/images/corridor-hotel.jpg',     'Residential corridor on level two', 4),
  (3, '/images/room-deluxe.jpg',        'Deluxe apartment living and dining area', 1),
  (3, '/images/lounge-modern.jpg',      'Layered lighting in the deluxe lounge', 2),
  (3, '/images/kitchen-apartment.jpg',  'Full kitchen in the deluxe apartment', 3),
  (3, '/images/bathroom-suite.jpg',     'Bathroom with a walk-in shower', 4),
  (4, '/images/room-deluxe-corner.jpg', 'Corner apartment with windows on two sides', 1),
  (4, '/images/dining-table.jpg',       'Dining table beside the corner balcony', 2),
  (4, '/images/bathroom-suite.jpg',     'Bathroom with a freestanding tub', 3),
  (4, '/images/lounge-modern.jpg',      'Corner lounge with afternoon light', 4),
  (5, '/images/room-executive.jpg',     'Executive suite study and lounge', 1),
  (5, '/images/living-sea-ranch.jpg',   'Separate lounge for informal meetings', 2),
  (5, '/images/dining-table.jpg',       'Meeting-ready dining table', 3),
  (5, '/images/bathroom-suite.jpg',     'Executive suite bathroom', 4),
  (6, '/images/room-penthouse.jpg',     'Penthouse living room opening to the terrace', 1),
  (6, '/images/penthouse-pool.jpg',     'Rooftop plunge pool', 2),
  (6, '/images/rooftop-bar-night.jpg',  'Rooftop lounge at night', 3),
  (6, '/images/library-amantaka.jpg',   'Library corner in the penthouse', 4),
  (6, '/images/bathroom-suite.jpg',     'Penthouse bathroom', 5)
ON DUPLICATE KEY UPDATE
  image_path = VALUES(image_path),
  alt_text = VALUES(alt_text);

INSERT INTO services (
  id, slug, name, category, summary, description, sample_price,
  pricing_type, price_note, icon, image_path
) VALUES
  (
    1, 'airport-pickup', 'Airport Pickup', 'transport',
    'A driver waiting in arrivals at Kigali International Airport.',
    'Share your flight details and a driver meets you in the arrivals hall with a name board, then brings you directly to the residence. Flight tracking is assumed so late arrivals are covered.',
    35.00, 'per-trip', 'Illustrative estimate, one way', 'Plane',
    '/images/service-airport.jpg'
  ),
  (
    2, 'private-driver', 'Private Driver', 'transport',
    'A car and driver on standby for the length of your stay.',
    'For guests with back-to-back meetings, a driver can be assigned for the day or the full stay, with a comfortable sedan and a schedule agreed the evening before.',
    120.00, 'per-day', 'Illustrative estimate, per day', 'CarFront',
    '/images/service-driver.jpg'
  ),
  (
    3, 'car-rental', 'Car Rental', 'transport',
    'A self-drive SUV for weekend trips beyond the city.',
    'Ideal for guests planning a weekend towards Musanze or Lake Kivu. Vehicles are arranged with a local rental partner, with insurance and roadside support discussed at handover.',
    75.00, 'per-day', 'Illustrative estimate, per day', 'Car',
    '/images/service-car-rental.jpg'
  ),
  (
    4, 'kigali-city-tours', 'Kigali City Tours', 'lifestyle',
    'Half-day introductions to Kigali''s art, markets and history.',
    'A guided half day covering the city''s creative studios, a market walk and one of the memorial sites, paced so it works as a first or second day in Rwanda.',
    60.00, 'per-person', 'Illustrative estimate, per person', 'Map',
    '/images/service-tour.jpg'
  ),
  (
    5, 'laundry-service', 'Laundry & Pressing', 'lifestyle',
    'Same-day laundry, pressing and garment care.',
    'Bags collected in the morning are returned folded or on hangers the same evening. Useful for guests arriving from a long trip or heading straight into meetings.',
    20.00, 'per-booking', 'Illustrative estimate, per collection', 'Shirt',
    '/images/service-laundry.jpg'
  ),
  (
    6, 'in-residence-dining', 'In-Residence Dining', 'dining',
    'A private chef or a delivered menu, served in your apartment.',
    'Choose a set menu cooked in your kitchen by a visiting chef, or a prepared meal delivered and plated for a quiet evening in. Dietary requirements are agreed in advance.',
    45.00, 'per-person', 'Illustrative estimate, per person', 'UtensilsCrossed',
    '/images/dining-table.jpg'
  ),
  (
    7, 'conference-support', 'Conference & Event Support', 'business',
    'Room set-up, printing and coordination for delegations.',
    'For guests in Kigali for a summit or delegation, we can prepare a meeting lounge, arrange printing and couriers, and coordinate group transfers on a shared schedule.',
    150.00, 'per-day', 'Illustrative estimate, per day', 'Presentation',
    '/images/service-conference.jpg'
  ),
  (
    8, 'extended-stay', 'Extended-Stay Support', 'business',
    'A monthly rhythm of housekeeping, restocking and errands.',
    'Designed for relocating professionals and long assignments: a scheduled housekeeping rhythm, grocery restocking, and a single point of contact for the small logistics of living in Kigali.',
    90.00, 'per-booking', 'Illustrative estimate, per week', 'CalendarClock',
    '/images/service-extended-stay.jpg'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  summary = VALUES(summary),
  description = VALUES(description),
  sample_price = VALUES(sample_price),
  pricing_type = VALUES(pricing_type),
  price_note = VALUES(price_note),
  icon = VALUES(icon),
  image_path = VALUES(image_path);
