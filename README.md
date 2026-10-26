# Kigali Heights Residence

An editorial hospitality concept for six apartments in Kigali, Rwanda, built with Next.js and a local MySQL database.

> **This is a design concept, not an operating property.** The building, apartments, rates, services and availability are illustrative. Reservations are saved so the booking flow can be tested, but they do not hold a real apartment. No payment is requested or taken.

The site is a private project, not a live hotel. It is marked `noindex` and `robots.ts` disallows crawling.

---

## 1. What is real

- A MySQL / MariaDB schema with relational constraints, seed data and idempotent initialisation.
- Database-backed apartment listings, room details, amenities, services and homepage features.
- A four-step booking flow that validates on the server and persists reservations.
- Server-calculated totals from database prices. The browser cannot submit a total.
- Transactional overlap protection with `SELECT ... FOR UPDATE` and a `409 ROOM_UNAVAILABLE` response.
- Persisted contact messages through `POST /api/contact`.
- Persisted service requests attached to existing bookings.
- Real loading, empty, validation and server-error states.
- An optional Spline slot and an external ALU Kigali360 campus tour on `/explore`.

## 2. What is illustrative

- The property, its location within Kigali, rooms, dimensions, amenities, services and rates.
- Availability is based only on confirmed bookings in this database. There is no channel manager, housekeeping inventory or real calendar.
- Photography is licensed stock imagery from Wikimedia Commons. It does not depict this residence.
- No payment provider, user accounts, outbound email or live support inbox is connected.
- The contact form saves a message. It does not send email or create a booking.
- The ALU tour is an external campus walkthrough. It is not Kigali Heights Residence.

---

## 3. Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js `16.4.3` (App Router, Turbopack, cache components) |
| Language | TypeScript `^5` |
| UI | React `19.3.0` |
| Styling | Tailwind CSS `v4` |
| Icons | `lucide-react` |
| Database | MySQL 8 / MariaDB 10.4 (XAMPP build tested) |
| Driver | `mysql2` promise API with a connection pool |
| Fonts | Newsreader and Inter via `next/font/google` |
| 3D | `@splinetool/react-spline`, optional and environment-driven |

The Next.js security upgrade is applied: `next` and `eslint-config-next` are pinned to `16.4.3`, and `experimental.agentUpgrade` is set to `security` in `next.config.ts`.

---

## 4. Quick start

### Prerequisites

- Node.js 22 or newer.
- XAMPP (or another local MySQL/MariaDB installation) with the MySQL component running.
- A database user that can create the `kigali_heights_residence` database.

### Install and configure

```powershell
npm install
Copy-Item .env.example .env.local
```

The defaults match a standard XAMPP installation:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kigali_heights_residence
```

`.env.local` is git-ignored. Never expose these values with a `NEXT_PUBLIC_` prefix.

### Create the database

Start MySQL, then run:

```powershell
npm run db:init
```

The script applies `database/schema.sql`, which is safe to rerun. It uses `CREATE TABLE IF NOT EXISTS` and upserts seed rows by unique key.

Expected seed counts:

```text
Apartments: 4
Rooms: 6
Amenities: 30
Room images: 25
Services: 8
Existing bookings: 0
Contact messages: 0
```

Existing bookings and contact messages are preserved when the seed is rerun.

### Run the app

```powershell
npm run dev
```

Open <http://localhost:3000>.

For a production check:

```powershell
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

---

## 5. Database

### Schema

Database: `kigali_heights_residence`, InnoDB, `utf8mb4` / `utf8mb4_unicode_ci`.

| Table | Purpose |
| --- | --- |
| `apartments` | Four categories: Standard, Deluxe, Executive, Penthouse. |
| `rooms` | Six bookable apartments with price, capacity, floor, size, bedding and view. |
| `amenities` | Shared amenity list. |
| `room_amenities` | Many-to-many link between rooms and amenities. |
| `room_images` | Ordered gallery images for each room. |
| `services` | Eight optional guest services with pricing rules. |
| `bookings` | Persisted reservations with server-calculated totals. |
| `booking_services` | Services attached to a booking, with stored line amounts. |
| `contact_messages` | Persisted contact form submissions. |

`bookings.reference` is the customer-facing reference, for example `KHR-3D86E162`. Booking totals and service line amounts are written by the server, never by the browser.

### Seed data

The schema seeds 4 apartment categories, 6 rooms, 30 amenities, 25 room images and 8 services. It does not seed bookings or contact messages.

### Useful commands

```powershell
# Open a MySQL shell
& "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 kigali_heights_residence

# Inspect rooms
& "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 kigali_heights_residence -e "SELECT id, slug, name, price_per_night, capacity FROM rooms ORDER BY id;"

# Inspect bookings
& "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 kigali_heights_residence -e "SELECT reference, check_in, check_out, guests, total, status FROM bookings ORDER BY id DESC;"

# Inspect contact messages
& "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 kigali_heights_residence -e "SELECT id, name, email, subject, created_at FROM contact_messages ORDER BY id DESC;"
```

Deleting a booking cascades its `booking_services` rows:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 kigali_heights_residence -e "DELETE FROM bookings WHERE reference = 'KHR-XXXXXXXX';"
```

To rebuild from scratch:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -e "DROP DATABASE IF EXISTS kigali_heights_residence;"
npm run db:init
```

---

## 6. API

All endpoints are same-origin Next.js route handlers and return JSON. Validation and pricing happen on the server.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/rooms` | List rooms. Optional `category`, `level`, `guests`, `featured=true`, `limit`. |
| `GET` | `/api/rooms/meta` | Categories, amenities and per-level counts. |
| `GET` | `/api/rooms/[slug]` | One room with amenities, images and related rooms. |
| `GET` | `/api/services` | Guest services and category counts. |
| `GET` | `/api/availability` | Check availability for a room and date range. |
| `POST` | `/api/bookings` | Validate, price and persist a booking. |
| `GET` | `/api/bookings` | Recent summaries without contact details. Optional `limit` (1–100). |
| `GET` | `/api/bookings?reference=KHR-...` | One full booking by reference. |
| `GET` | `/api/bookings/[reference]` | Same lookup via the path. |
| `POST` | `/api/service-requests` | Add a service to an existing booking and recalculate totals. |
| `POST` | `/api/contact` | Persist a contact message. |

### Error shape

```json
{
  "error": {
    "message": "Please check the highlighted fields and try again.",
    "code": "VALIDATION_ERROR",
    "fields": {
      "checkOut": "Departure must be at least one night after arrival."
    }
  }
}
```

| Status | Meaning |
| --- | --- |
| `200` | OK. |
| `201` | Booking, service request or contact message created. |
| `400` | Malformed JSON, query parameter or reference format. |
| `404` | Unknown room or booking reference. |
| `409` | Overlap (`ROOM_UNAVAILABLE`) or duplicate service (`SERVICE_ALREADY_ADDED`). |
| `422` | Field validation failed. |
| `500` | Unexpected server error. SQL text and credentials are never returned. |

### Contact message

```powershell
$body = @{
  name    = "Amina Uwase"
  email   = "amina@example.com"
  subject = "general"
  message = "I would like to know more about the longer-stay apartments."
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/contact" `
  -ContentType "application/json" `
  -Body $body
```

Allowed subjects: `general`, `reservation`, `long-stay`, `services`, `concept`. A successful response is `201` with the saved message id and timestamp. The message is stored; no email is sent and no live inbox is monitored.

### Create a booking

Required fields: `roomSlug`, `checkIn`, `checkOut`, `guests`, `fullName`, `email`, `phone`. Optional: `requests`, `serviceSlugs` (array). Do not send prices.

```powershell
$body = @{
  roomSlug     = "standard-city-apartment"
  checkIn      = "2027-01-10"
  checkOut     = "2027-01-13"
  guests       = 2
  fullName     = "Amina Uwase"
  email        = "amina@example.com"
  phone        = "+250 788 123 456"
  requests     = "Quiet room away from the lift, please."
  serviceSlugs = @("airport-pickup")
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/bookings" `
  -ContentType "application/json" `
  -Body $body

$response.booking.reference
$response.booking.price
```

A successful response is `201` with a generated reference, the room, the services and a server-calculated price breakdown.

### Add a service

```powershell
$request = @{
  reference   = "KHR-XXXXXXXX"
  serviceSlug = "laundry-service"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/service-requests" `
  -ContentType "application/json" `
  -Body $request
```

The new `booking_services` row starts as `requested`. Totals are recalculated from the database room price and the service pricing rule (`per-trip`, `per-day`, `per-person`, `per-person-day` or `per-booking`).

### Parameterised SQL

All database access goes through `lib/server/repository.ts` and `mysql2` placeholders. User input is never concatenated into SQL. Filters are assembled from static fragments with `?` values, and `LIMIT ?` is bounded. Server errors are logged but replaced with a generic message before reaching the browser.

---

## 7. Booking rules

1. Check-in cannot be earlier than the server's local date.
2. Checkout must be after check-in.
3. Guests must be between 1 and 6 overall and within the selected apartment's capacity.
4. Name, a valid email and a phone number are required.
5. Optional service slugs are deduplicated, limited to 20 and must exist.
6. Availability is checked inside a transaction: the room row is locked `FOR UPDATE`, then the server looks for a confirmed booking where `check_in < requested_check_out AND check_out > requested_check_in`.
7. If an overlap exists, the transaction rolls back and returns `409 ROOM_UNAVAILABLE`.
8. Totals are `nights × rooms.price_per_night` plus each service's server-side amount. The browser estimate is never trusted.
9. References are generated as `KHR-` plus 8 uppercase hexadecimal characters with a unique constraint.
10. Service requests are attached in the same transaction as the total recalculation.

---

## 8. Frontend

| Route | Purpose |
| --- | --- |
| `/` | Hero, short introduction, featured apartments, amenities backed by room data, and a discreet booking CTA. |
| `/rooms` | Filterable apartment index, backed by the database. |
| `/rooms/[slug]` | Apartment detail with gallery, specs, amenities, building context and a booking card. |
| `/book` | Four-step booking flow: stay, services, details, review. |
| `/services` | Service planner and the form for adding a service to an existing booking. |
| `/explore` | Interactive five-level residence explorer, the external ALU tour and the level summary. |
| `/about` | Concept, principles, architecture and an explicit “What is real, and what is not” section. |
| `/discover` | Editorial impressions of Kigali and Rwanda. |
| `/contact` | Persisted contact form, verified details only, and common questions. |
| `/credits` | Wikimedia Commons licence attributions. |

Primary navigation is limited to Apartments, Residence, Explore, Services and Contact, plus a Reserve action. The footer also links to the image credits and the concept disclosure.

The visual direction is editorial: Newsreader display type, Inter body copy, an ivory/charcoal palette with clay accents, hairlines instead of card shadows, asymmetrical image grids and restrained motion.

### Loading and error behaviour

- Database-backed sections stream inside `<Suspense>`.
- `/rooms`, `/book` and `/services` show clear, non-technical retry states if the database is unavailable.
- The global error boundary catches unexpected render errors.
- `lib/api-client.ts` normalises network and API errors for the client forms.
- Booking field errors from the server are mapped back to the relevant inputs.
- Contact messages are only reported as saved after the API returns `201`.

---

## 9. ALU tour and Spline

The ALU tour on `/explore` is the public [ALU Kigali360](https://alu.kigali360.net/) campus tour. It is clearly labelled as an external reference, not Kigali Heights Residence. The iframe is lazy-loaded and includes a reload control, a new-tab link and a fallback for blocked or slow frames.

The tour URL is a single constant in `components/explore/alu-tour.tsx`.

The optional Spline scene is configured with:

```dotenv
NEXT_PUBLIC_SPLINE_SCENE_URL=https://prod.spline.design/XXXXXXXXXXXX/scene.splinecode
```

If the variable is unset or the scene fails, the designed architectural fallback is used. The Spline slot is independent of the ALU iframe and the database.

---

## 10. Verification

Checked against the local MySQL instance and the Next.js development server on `http://localhost:3000`.

### Static checks

```text
npm run lint        no lint errors
npx tsc --noEmit    no type errors
npm run build       compiled, type-checked and generated all routes
npm audit           0 vulnerabilities
```

### API

| Check | Result |
| --- | --- |
| `GET /api/rooms` | `200`, 6 rooms |
| `GET /api/services` | `200`, 8 services |
| `POST /api/contact` (valid) | `201`, row persisted in `contact_messages` |
| `POST /api/contact` (invalid fields) | `422` with field errors |
| `POST /api/contact` (malformed JSON) | `400` |
| `POST /api/bookings` (valid) | `201`, server total and reference |
| `POST /api/bookings` (overlap) | `409 ROOM_UNAVAILABLE` |
| `POST /api/bookings` (adjacent dates) | `201` |
| `POST /api/bookings` (invalid dates/capacity) | `422` |
| `POST /api/service-requests` | `201`, total recalculated |

### Browser

- Four-step booking completed through the UI, including two services and a server-calculated total.
- Contact form submitted and the row verified in MySQL.
- Responsive layout checked at 390 px, 768 px and 1440 px with no horizontal overflow.
- Mobile menu opened, locked background scrolling, exposed 97 px-tall link rows and closed cleanly.
- Hero and page-header heights checked at each width.
- All route images loaded; no broken images.
- Browser console reported no errors on `/`, `/rooms`, `/rooms/[slug]`, `/book`, `/contact`, `/services`, `/explore`, `/about`, `/discover` and `/credits`.
- Lighthouse accessibility scored 100 on every page tested: `/`, `/rooms`, `/rooms/deluxe-apartment`, `/book`, `/contact`, `/services`, `/explore`, `/about`, `/discover` and `/credits`.
- Test bookings and contact messages created during verification were removed afterwards. Existing bookings were preserved.

---

## 11. Troubleshooting

### MySQL does not start normally

On the machine used for verification, the XAMPP MariaDB installation currently fails on a normal start with an InnoDB log sequence error during ACL initialisation. The app and schema were verified with a local, single-user workaround:

```powershell
& "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone --skip-grant-tables
```

`--skip-grant-tables` disables authentication and is **not** suitable for a shared, networked or production machine. The clean fix is to repair the local MariaDB data directory or reinstall/upgrade MariaDB, then start it normally. The application code does not depend on the workaround.

### `ECONNREFUSED 127.0.0.1:3306`

MySQL is not running. Start it in XAMPP or with the normal `mysqld` command, then retry.

### `ER_ACCESS_DENIED_ERROR`

Check `DB_USER` and `DB_PASSWORD` in `.env.local`. XAMPP's default is `root` with an empty password.

### `ER_BAD_DB_ERROR` or `ER_NO_SUCH_TABLE`

Run `npm run db:init`. If the `contact_messages` table is missing, this also creates it.

### Port already in use

```powershell
npm run dev -- -p 3001
# or
npm run start -- -p 3100
```

### The ALU frame is blank

Some browsers, extensions, corporate networks or third-party cookie settings block cross-origin iframes. Use **Open tour in a new tab**. The app intentionally does not proxy or scrape the tour.

### A booking shows as unavailable

Those dates overlap an existing confirmed booking for that apartment. Choose different dates or another apartment. Inspect existing stays:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 kigali_heights_residence -e "SELECT reference, room_id, check_in, check_out, status FROM bookings ORDER BY id;"
```

---

## 12. Project structure

```text
app/
├─ api/
│  ├─ availability/route.ts
│  ├─ bookings/route.ts
│  ├─ bookings/[reference]/route.ts
│  ├─ contact/route.ts
│  ├─ rooms/route.ts
│  ├─ rooms/meta/route.ts
│  ├─ rooms/[slug]/route.ts
│  ├─ service-requests/route.ts
│  └─ services/route.ts
├─ about/, book/, contact/, credits/, discover/, explore/, rooms/, services/
├─ layout.tsx, globals.css, error.tsx, not-found.tsx, loading.tsx, robots.ts
components/
├─ booking/booking-form.tsx
├─ contact/contact-form.tsx
├─ explore/alu-tour.tsx
├─ home/
├─ layout/
├─ rooms/
├─ services/
└─ ui/
database/schema.sql
lib/
├─ api-client.ts
├─ db.ts
├─ booking.ts
├─ client-store.ts
├─ utils.ts
└─ server/
   ├─ repository.ts
   ├─ validation.ts
   ├─ errors.ts
   └─ http.ts
scripts/init-db.mjs
data/
types/index.ts
public/images/
```

---

## 13. Deployment note

This project is a design concept and a local full-stack study. Do not deploy it as a live hotel booking system without adding authentication, rate limiting, access controls, a real availability source, email delivery and a payment provider. The site currently sets `noindex` and disallows crawling.
