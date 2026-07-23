# OrderWorder

A multi-tenant restaurant SaaS platform for contactless dining powered by AI. Customers scan QR codes, browse menus, chat with the AI assistant "Jarvis", order by tap or voice, and pay directly — all from their phone, no app install required.

## Screenshots

### Marketing & Onboarding

| Landing Page | Restaurant Signup Wizard (9 steps) |
|---|---|
| ![Landing Page](public/screenshots/01-home-landing.png) | ![Signup Wizard](public/screenshots/02-restaurant-signup-wizard.png) |

### Owner Dashboard (admin login required)

| Dashboard Overview | Menu Management | Settings → Tables → QR Codes |
|---|---|---|
| ![Dashboard Overview](public/screenshots/03-dashboard-overview.png) | ![Dashboard Menu](public/screenshots/03d-dashboard-menu.png) | ![Settings Tables QR](public/screenshots/04-settings-tables-qr.png) |

The **Settings → Tables** page generates a downloadable QR code (PNG) for every table, plus a one-click **Print all** button so you can print every table's QR in one go. Each card shows the table number, active status, the full scan URL, a **Download PNG** button, and a delete button.

### Kitchen Display System (kitchen login)

| Kitchen Display (KDS) |
|---|
| ![Kitchen Display](public/screenshots/05-kitchen-display.png) |

The KDS shows live order tickets grouped by station (Main Kitchen / Grill / Tandoor / Bar / Pastry) with color-coded countdown timers, status filters (New / In Progress / Ready), and a Fullscreen mode for wall-mounted tablets.

### Customer-Facing Pages (no login — scanned from phone)

| Empire Restaurant Menu (102 items) | Customer Table Ordering | Reviews |
|---|---|---|
| ![Empire Menu](public/screenshots/06-customer-restaurant-menu.png) | ![Customer Ordering](public/screenshots/07-customer-table-ordering.png) | ![Reviews](public/screenshots/08-customer-reviews.png) |

| Spice Route Menu | Brewpoint Menu | Demo Restaurant Menu |
|---|---|---|
| ![Spice Route](public/screenshots/09-spiceroute-menu.png) | ![Brewpoint](public/screenshots/10-brewpoint-menu.png) | ![Demo](public/screenshots/11-demo-restaurant-menu.png) |

---

## Features

- **QR Code Ordering** — Per-table QR codes with deep-linking. Sub-2s load on 2G, offline-first PWA. Each table gets its own downloadable PNG QR from the dashboard.
- **AI Assistant "Jarvis"** — Multi-provider AI (Groq → Cerebras → Gemini → SiliconFlow) with auto-failover and per-tenant keys. Recommends dishes, answers questions, takes orders.
- **Voice Ordering** — Groq Whisper STT (Hindi/Hinglish) → structured cart → ElevenLabs TTS confirmation, with browser SpeechSynthesis fallback.
- **Real-time Order Management** — Dashboard via Server-Sent Events + MongoDB Change Streams (SWR fallback), three state buckets (pending approval / active / history).
- **Kitchen Display System** — Station routing (tandoor / south-indian / main / dessert / beverage), live countdown timers, Start/Ready/Served actions. Separate kitchen-staff login (kitchen username + kitchen password) so chefs can't access billing/settings.
- **Payments** — Razorpay Route (direct-to-owner settlement), Stripe (international), UPI Autodebit, cash/pay-at-table. 0.5% platform fee. Split payments + refunds supported.
- **Loyalty & Rewards** — Points engine (1 pt / ₹10), Silver/Gold/Platinum tiers with multipliers, atomic per-order awarding.
- **Customer AI Memory** — Unified profile: language, spice tolerance, favorites, allergens, birthdays.
- **WhatsApp Marketing** — Cloud API v22.0 with OpenWA + no-op fallbacks: receipts, ready notifications, campaigns, abandoned-cart recovery.
- **Owner Analytics** — Live dashboard (Recharts): revenue, top dishes, peak hours, repeat rate, GST collected, AI-generated insights. Range filters: today / 7d / 30d / 90d.
- **Multi-tenant + Roles** — Per-restaurant subdomain & HSL theming; roles: admin, kitchen, customer (full RBAC across outlets is on the roadmap).
- **Offline-First PWA** — Service worker caches static assets, falls back offline.
- **Unified Order Aggregator** — Zomato / Swiggy / manual orders in the same KDS.
- **GST / Tax Management** — Per-item tax, tax-inclusive pricing, tax summary in cart.
- **Coupons & Invoices** — Coupon validate/redeem; PDF invoices via `@react-pdf/renderer` with sequential numbering.
- **Multi-currency** — `formatCurrency` utility (INR / USD / EUR / GBP / AED); profile-driven currency wired through the customer menu/cart/track pages, the KDS price column, dashboard chart axis formatters, and WhatsApp message templates.
- **Security** — Zod validation, bcrypt, OTP/table-PIN auth, CSRF provider, Sentry `captureError` wired, Upstash rate limit with in-memory fallback.
- **3D Food Viewer** — React Three Fiber + Drei + Google `<model-viewer>`, dynamic-imported with a WebGL capability fallback.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Turbopack), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Motion |
| Database | MongoDB Atlas + Mongoose 9 |
| Real-time | Server-Sent Events + MongoDB Change Streams |
| Cache / Queue | Upstash Redis (with in-memory fallback) |
| Charts | Recharts |
| Auth | NextAuth.js v4 (credentials — 3 flows: restaurant admin, kitchen staff, customer) |
| Payments | Razorpay Route + Stripe + UPI Autodebit |
| AI (text) | Groq / Cerebras / Gemini / SiliconFlow (auto-failover, per-tenant keys) |
| AI (voice STT) | Groq Whisper Large v3 (Hindi/Hinglish) |
| AI (voice TTS) | ElevenLabs Multilingual v2 (+ browser SpeechSynthesis) |
| 3D / rich media | Three.js, React Three Fiber, Drei, Google `<model-viewer>` |
| WhatsApp | WhatsApp Cloud API v22.0 + OpenWA + no-op |
| Phone IVR | Twilio + Bolo.ai (Hindi) |
| Object Storage | Cloudflare R2 |
| Error Monitoring | Sentry (client, server, edge); GlitchTip optional |
| CI/CD | GitHub Actions + Vercel |
| Tests | Jest (unit) |
| Linting | Biome |
| Secrets | Doppler (optional) / `.env` |

## Quick Start

```bash
pnpm install
cp .env.example .env.local   # Configure MongoDB URI & other keys
pnpm dev                     # → http://localhost:3050
```

### Environment Variables (minimum required to boot)

Only `MONGODB_URI`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` are strictly required. Every other service (Redis, Stripe, Twilio, R2, Sentry, AI keys, etc.) has a graceful in-memory/no-op fallback so the app runs without them. See `.env.example` for the full list.

```env
MONGODB_URI=mongodb+srv://...                    # REQUIRED
NEXTAUTH_URL=http://localhost:3050               # REQUIRED
NEXTAUTH_SECRET=<openssl rand -hex 32>           # REQUIRED
DEMO_MODE=true                                   # enables demo customer login
NEXT_PUBLIC_URL=http://localhost:3050            # for QR code generation
```

### Seed Demo Data

```bash
curl -X POST http://localhost:3050/api/refreshDemoData
# or
pnpm seed
```

### Demo Logins

| Restaurant | Slug | Admin email | Password |
|---|---|---|---|
| The Spice Route | `spiceroute` | `admin@spiceroute.com` | `spiceroute@demo123` |
| Empire Restaurant | `empire` | `admin@empire.com` | `empire@123` |
| Brewpoint | `brewpoint` | `admin@brewpoint.com` | `brewpoint@123` |
| Demo (The Spice Kitchen) | `demo` | `demo@orderworder.com` | `Demo@12345` |

**Owner login**: click "Sign In" on the landing page → enter admin email → enter password → you land in the dashboard.

**Kitchen login**: same Sign In form → toggle "Kitchen staff" → enter restaurant username + kitchen username + kitchen password → you land in the KDS. (For the `empire` demo restaurant, the kitchen username is `empireKitchen1` and the kitchen password is `empire@123`.)

**Customer access**: open `http://localhost:3050/<slug>?table=T1` on a phone (phone-number + OTP login; the `demo` slug bypasses OTP in dev mode when `DEMO_MODE=true`).

### Docker

```bash
docker compose up
# → http://localhost:3050
```

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── [restaurant]/             # Dynamic restaurant pages (menu, cart, track)
│   ├── api/                      # 20 API endpoint groups
│   │   ├── admin/  auth/  chat/  coupon/  customer/  cron/
│   │   ├── feedback/  invoice/  kitchen/  loyalty/  menu/
│   │   ├── order/  payment/  refreshDemoData/  voice/
│   │   ├── webhooks/  whatsapp/  aggregator/  baseProfile/  health/
│   ├── dashboard/                # Owner dashboard (Overview, Analytics, ...)
│   ├── kitchen/                  # Kitchen Display System
│   └── scan/  setup/  signup/  logout/
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── chatbot/                  # AI chat interface
│   ├── features/                 # FoodViewer3D, MenuCard, ...
│   ├── layout/  base/  context/  sections/  seo/
├── hooks/  lib/  types/
└── utils/
    ├── ai/                       # Provider switcher, per-tenant config, prompts
    ├── database/                 # Mongoose models (16) & helpers
    ├── payment/                  # Razorpay / Stripe
    ├── voice/                    # STT / TTS
    ├── whatsapp/                # Cloud API + OpenWA + no-op
    └── helper/                   # currency, otp, rbac, sentryWrapper, ...
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel, Docker, and Render guides. See [DEPLOYMENT_ANALYSIS.md](./DEPLOYMENT_ANALYSIS.md) for the zero-cost free-tier path. See [AUDIT_REPORT.md](./AUDIT_REPORT.md) and [docs/FIX-LOG.md](./docs/FIX-LOG.md) for the feature audit and outstanding items.

### Quick Vercel deploy

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add env vars: `MONGODB_URI`, `NEXTAUTH_SECRET` (`openssl rand -hex 32`), `NEXTAUTH_URL` (your Vercel URL), `NEXT_PUBLIC_URL` (same), `DEMO_MODE=true`.
4. Deploy. Vercel auto-detects Next.js 16.
5. After first deploy, run `curl -X POST https://YOUR_DOMAIN/api/refreshDemoData` once to seed the demo restaurants.

## Recent Fixes

### NextAuth login bug under Next.js 16 (fixed)

NextAuth v4.24 was built for Next.js 13/14 App Router. Under Next.js 16 the `Request` object passed to the route handler is a plain `Request`, but NextAuth's `NextAuthRouteHandler` reads `req.nextUrl.searchParams` which only exists on `NextRequest`. The fix in `src/app/api/auth/[...nextauth]/route.ts` reconstructs a `NextRequest` (with the body re-streamed) before handing off to NextAuth, so the credentials provider now works correctly.

Note: the credentials providers use **custom IDs** (`restaurant` for owners/kitchen staff, `customer` for diners), not the default `credentials` id. The built-in NextAuth signin page at `/api/auth/signin` posts to `/api/auth/callback/credentials` which will return 400 — always use the custom Sign In form on the landing page (which posts to `/api/auth/callback/restaurant`) or call `signIn("restaurant", ...)` from `next-auth/react`.

## Status & honest review

See [`../about.md`](../about.md) for the business About and a critic review of what is production-ready, what is partial, and what is not yet built.

## License

MIT — see [LICENSE](./LICENSE).
