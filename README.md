# Kigali Heights Residence — concept prototype

A presentation-ready front-end prototype for **Kigali Heights Residence**, a fictional
five-level apartment residence in Kigali, Rwanda. It is a design study of apartment
hospitality for business travellers and longer stays.

> **This is not a real property.** Every room, rate, service, level and piece of copy is
> invented sample content. Prices are labelled as illustrative estimates, availability is
> not tracked, nothing is charged, and no reservation is ever created. The site is marked
> `noindex` and `robots.ts` disallows crawling so the fictional content stays out of search
> results.

---

## 1. Summary

- **What it is:** a working Next.js App Router prototype — real routing, real filtering,
  working reservation flow with validation and a live price summary, an interactive
  five-level building explorer, and a services planner.
- **Design direction:** editorial serif headlines (Cormorant Garamond) over a clean sans
  body (Inter), on an ivory / white / charcoal / bronze / stone / sage palette. No neon, no
  glassmorphism, no heavy rounded card stacks.
- **State of the build:** `npm run lint` → 0 problems, `npx tsc --noEmit` → clean,
  `npm run build` → 21 pages generated (static + Partial Prerender).
- **Back end:** none. All content is local TypeScript data; all "saving" is browser
  `localStorage`. No Supabase, no Redux, no database, no payment provider, no network calls.

### Tech stack

| Piece            | Choice                                                  |
| ---------------- | ------------------------------------------------------- |
| Framework        | Next.js `16.4.0` (App Router, Turbopack)                |
| Language         | TypeScript `^5`                                         |
| UI runtime       | React `19.3.0`                                          |
| Styling          | Tailwind CSS `v4` via `@tailwindcss/turbopack`          |
| Icons            | `lucide-react`                                          |
| 3D (optional)    | `@splinetool/react-spline` (loaded only when configured)|
| Fonts            | `next/font/google` — Cormorant Garamond + Inter         |
| Linting          | ESLint `9` + `eslint-config-next` (flat config)         |

> **Note on this Next.js version:** cache components and partial prefetching are enabled in
> `next.config.ts`, so `params`/`searchParams` are Promises, dynamic APIs must sit inside
> `<Suspense>`, and clock/storage reads happen through `useSyncExternalStore` rather than
> during render. See `lib/client-store.ts`.

---

## 2. Local URL and exact commands

Install dependencies once, then run any of the following from the project root
(`C:\Users\DWAG\Desktop\kigali_heights_residence`):

```bash
npm install          # install dependencies
npm run dev          # start dev server  -> http://localhost:3000
```

```bash
npm run lint         # ESLint (expects: no output / 0 problems)
npx tsc --noEmit     # TypeScript type check (expects: no output)
npm run build        # production build (expects: 21 pages, compiled successfully)
npm run start        # serve the production build -> http://localhost:3000
npm run start -- -p 3100   # serve on an alternate port
```

**Local URL:** <http://localhost:3000>

---

## 3. Folder structure

```
kigali_heights_residence/
├─ app/                         # App Router routes
│  ├─ layout.tsx                # <html>, fonts, metadata, header/footer shell
│  ├─ page.tsx                  # Home
│  ├─ globals.css               # Tailwind theme tokens (the palette) + base styles
│  ├─ icon.svg                  # Favicon
│  ├─ robots.ts                 # Disallows all crawlers (concept content)
│  ├─ loading.tsx               # Route-level loading UI
│  ├─ error.tsx                 # Route error boundary (client)
│  ├─ not-found.tsx             # 404
│  ├─ rooms/
│  │  ├─ page.tsx               # Accommodation index + filtering
│  │  └─ [slug]/page.tsx        # Room detail + reserve card
│  ├─ explore/page.tsx          # Interactive five-level explorer + Spline slot
│  ├─ services/page.tsx         # Guest services + planner
│  ├─ book/page.tsx             # Multi-step reservation wizard
│  ├─ discover/page.tsx         # Kigali / culture / dining editorial
│  ├─ about/page.tsx            # Concept, philosophy, architecture
│  ├─ contact/page.tsx          # Contact form (demo)
│  └─ credits/page.tsx          # Image licensing / attributions
├─ components/
│  ├─ layout/                   # site-header, site-footer, announcement-bar,
│  │                            # page-header, wordmark, concept-notice
│  ├─ home/                     # hero, intro, featured-rooms, architecture-showcase,
│  │                            # rooftop-feature, services-preview, explore-preview,
│  │                            # destination-feature, reservation-cta
│  ├─ rooms/                    # rooms-browser, room-card, room-gallery,
│  │                            # room-reserve-card
│  ├─ explore/                  # residence-explorer, building-diagram, spline-scene
│  ├─ services/                 # service-card, service-icon, service-planner
│  ├─ booking/                  # booking-form (4-step wizard), booking-search-panel
│  ├─ contact/                  # contact-form
│  └─ ui/                       # button, field, price-summary, section-heading,
│                               # status-message, reveal, not-found-state
├─ data/                        # Local TypeScript content (single source of truth)
│  ├─ site.ts                   # Brand, nav, contact, disclaimer copy
│  ├─ rooms.ts                  # 6 apartments/suites + query helpers
│  ├─ levels.ts                 # 5 building levels + narrative
│  ├─ services.ts               # 8 guest services + pricing types
│  ├─ experiences.ts            # Discover-page editorial sections
│  └─ credits.ts                # 53 image attributions for /credits
├─ lib/
│  ├─ utils.ts                  # cn(), formatUSD(), date helpers, nights
│  ├─ booking.ts                # validation, price breakdown, storage stores
│  └─ client-store.ts           # useSyncExternalStore hooks (today, services, draft)
├─ types/index.ts               # Shared domain types
├─ public/
│  ├─ images/                   # 53 licensed JPEGs + ATTRIBUTIONS.md
│  └─ ...
├─ next.config.ts               # cacheComponents, partialPrefetching, Tailwind loader
├─ eslint.config.mjs
├─ tsconfig.json
└─ package.json
```

---

## 4. Routes

| Route             | Purpose                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `/`               | Home: hero, concept intro, featured stays, architecture, rooftop, services and city previews, reservation CTA. |
| `/rooms`          | Accommodation index with category + level filters and live result count. |
| `/rooms/[slug]`   | Room detail: gallery, amenities, facts, related rooms, reserve card with live estimate. Six real routes. |
| `/explore`        | Interactive five-level residence explorer (floor selection) with the optional Spline 3D slot. |
| `/services`       | Guest services grid + planner; categories are transport, dining, lifestyle and business. |
| `/book`           | 4-step reservation wizard: stay → services → details → review, then a demo confirmation. |
| `/discover`       | Kigali city, culture, dining and business-travel editorial. |
| `/about`          | Concept, philosophy and architecture narrative. |
| `/contact`        | Contact form with validation and a demo submission state. |
| `/credits`        | Image credits and licence attributions. |
| `not-found`       | Designed 404. |
| `error`           | Designed client error boundary. |
| `loading`         | Route loading fallback. |

---

## 5. What actually works (interactive)

These are real, functioning client-side behaviours you can exercise in the browser:

- **Mobile navigation** — the header menu toggles open/closed with correct `aria-expanded`
  and `hidden` state.
- **Room filtering** (`/rooms`) — filter by category (Standard / Deluxe / Executive /
  Penthouse) and by level (2–5). The result count and heading update live, and the active
  filter is mirrored into the URL (`/rooms?level=5`, `/rooms?category=penthouse`) via
  `history.replaceState`, so links are shareable.
- **Room detail routing** — each of the six rooms has its own working `/rooms/[slug]` page
  with gallery, amenity list, facts and "related stays" suggestions.
- **Reserve card estimate** (`/rooms/[slug]`) — pick arrival/departure and guest count; the
  card computes nights and an illustrative subtotal immediately and validates the stay.
- **Services planner** (`/services`) — select one or more services; the selection counter
  updates, the choice is saved to `localStorage`, and a "saved" confirmation appears.
- **Booking wizard** (`/book`) — four steps with a progress rail:
  1. **Stay** — dates and guests; cannot be before today, departure must be after arrival,
     guest count is checked against the chosen apartment's capacity.
  2. **Services** — optional guest services, with services saved from `/services` carried in
     automatically.
  3. **Details** — lead guest name, email and phone, validated (invalid emails are blocked).
  4. **Review** — full summary with an itemised price breakdown: rooms subtotal, services
     subtotal and grand total.
  Submitting shows a **demo confirmation** with a clearly-labelled reference such as
  `KHR-DEMO-WB79` and an explicit "no booking was created" disclaimer.
- **URL prefill** — `/book` accepts stay parameters (room, dates, guests) so the wizard can
  be opened pre-filled from elsewhere on the site.
- **Live price summary** — nights, per-night rate, services and total update as you edit,
  shared between the reserve card and the booking wizard.
- **Contact form** (`/contact`) — required-field and email validation with inline errors and
  a demo success message. Nothing is transmitted.
- **Floor selection** (`/explore`) — select any of the five levels to read that level's
  narrative, facilities and representative image.
- **Reveal animations** — sections fade/rise into view via `IntersectionObserver`, applied
  by writing a `data-visible` attribute to the DOM (no per-element React state).
- **Graceful 3D fallback** — see §7.

---

## 6. What is simulated (demo-only)

Clear and honest about the boundary between prototype and production:

- **All content is fictional.** Room names, rates, sizes, amenities, service prices, the
  address and the contact details are invented. There is no real availability calendar.
- **Prices are illustrative estimates**, labelled as such throughout; they are not tariffs.
- **Reservation submission does not create a booking.** It generates a local demo
  reference and shows a confirmation screen only. No data leaves the browser and no server
  is contacted.
- **Services selection "save"** writes to `localStorage`; it is a browser-local demo, not an
  account or server record.
- **Contact form** validates and shows a success state; it does not send email.
- **Images** are licensed Wikimedia Commons photographs used as *representative* imagery
  for a concept — they are not photographs of a real Kigali Heights Residence. Licences are
  recorded on `/credits` and in `public/images/ATTRIBUTIONS.md`.
- **No payments** of any kind are integrated.
- **No analytics, no tracking, no authentication.**

---

## 7. How to add the Spline 3D scene later

The Explore page already has a reusable wrapper (`components/explore/spline-scene.tsx`).
Until a scene is connected it renders a **designed architectural fallback** — never an empty
black box, never a console error.

1. Build/publish a scene at <https://spline.design> and copy the `.splinecode` export URL
   (it looks like `https://prod.spline.design/XXXXXXXXXXXX/scene.splinecode`).
2. Create `.env.local` in the project root and add:

   ```bash
   NEXT_PUBLIC_SPLINE_SCENE_URL=https://prod.spline.design/XXXXXXXXXXXX/scene.splinecode
   ```

3. Restart the dev server (`npm run dev`).

That's it. When the variable is present the wrapper dynamically imports
`@splinetool/react-spline` (client-only, with a loading state), shows an "Interactive Spline
scene connected" status chip, and falls back to the designed illustration if the scene fails
to load at runtime. `SplineScene` also accepts a `sceneUrl` prop to override the env value
per instance.

---

## 8. Content model

All copy lives in `data/` and is typed by `types/index.ts`:

- **`data/rooms.ts`** — 6 apartments/suites across levels 2–5, each with slug, category,
  capacity, size, amenities and image set. Helper selectors (`getRoomBySlug`,
  `getRoomsByCategory`, `getRoomsOnLevel`, `getRelatedRooms`, `getFeaturedRooms`) feed the
  pages, so **adding a room is a single-object edit here**.
- **`data/services.ts`** — 8 services with a `pricingType`
  (`per-trip` / `per-day` / `per-person` / `per-person-day` / `per-booking`) that drives the
  price maths.
- **`data/levels.ts`** — the five building levels and their narrative.
- **`data/experiences.ts`** — editorial sections for `/discover`.
- **`data/site.ts`** — brand, navigation, contact and the concept disclaimer. The brand name
  is provisional and propagates from this one file.
- **`data/credits.ts`** — 53 image attributions surfaced on `/credits`.

---

## 9. Verification

Run just before hand-off:

- `npm run lint` → **0 problems**
- `npx tsc --noEmit` → **clean**
- `npm run build` → **compiled successfully; 21 pages** (static + Partial Prerender for
  `/book`, `/rooms` and dynamic room slugs)

Routes were exercised against a production server: all published routes return HTTP 200,
an unknown path returns 404, and each page renders the expected `<title>` and `<h1>` with no
server-rendering errors. Client interactions (filters, wizard steps, validation, storage,
mobile nav, floor selection) were driven through the DOM and verified.

---

## 10. Known limitations / remaining issues

- **3D is not connected** — by design; the Spline slot shows a designed fallback until
  `NEXT_PUBLIC_SPLINE_SCENE_URL` is set (§7).
- **No persistence beyond the browser** — `localStorage` is per-device and can be
  unavailable in private mode; the UI degrades gracefully when it is.
- **No real availability or booking** — intentionally out of scope for a front-end concept.
- **Representative imagery** — photos are licensed stand-ins, not the (fictional) property.
- **No automated test suite** — verification was manual plus type/lint/build checks; there
  are no unit or end-to-end tests in this prototype.
- **Partial Prerender caveat** — with cache components enabled, dynamic reads are streamed
  into the shell; on very slow connections the route `loading.tsx` fallback is briefly
  visible before content swaps in.
