# OrderWorder

A multi-tenant restaurant SaaS platform with AI-powered ordering, voice ordering, real-time kitchen display, and owner analytics. Customers scan QR codes, browse menus, chat with the AI assistant "Jarvis", order by tap or voice, and pay directly — all from their phone, no app install required.

## Features

- **QR Code Ordering** — Gate + per-table QR codes with deep-linking. Sub-2s load on 2G.
- **AI Assistant "Jarvis"** — Multi-provider AI (Groq → Cerebras → Gemini → SiliconFlow) with automatic failover and per-tenant quota. Recommends dishes, answers questions, takes orders.
- **Voice Ordering** — Mic button → Groq Whisper STT with Hindi/Hinglish support → Llama 4 → structured cart → ElevenLabs TTS confirmation.
- **Real-time Order Management** — Dashboard with SSE push (not polling) for live order updates.
- **Kitchen Display System** — Real-time KDS with station routing, countdown timers, Start/Ready/Served actions.
- **Payments** — Razorpay Route integration. Customer pays → settles directly to owner's bank account. OrderWorder never holds funds.
- **Split Payments** — "Split with friends" generates per-person payment links.
- **Loyalty & Rewards** — Points engine (1 point per ₹10), tiers (Silver/Gold/Platinum with 1×/1.25×/1.5× multipliers), auto-awarded on order.
- **Customer AI Memory** — Unified profile across channels: preferred language, spice tolerance, favorite dishes, allergens, birthdays, last visit.
- **WhatsApp Marketing** — Cloud API: order receipts, ready notifications, feedback, abandoned-cart, birthday offers, broadcast campaigns.
- **Owner Analytics** — Live dashboard: revenue (today/week/month), top dishes, peak hours, repeat rate, avg ticket, GST, top 20 customers by LTV, AI commentary cards.
- **Multi-Outlet + RBAC** — Owner, manager, captain, waiter, chef roles per outlet.
- **Inventory & Recipe Costing** — Ingredient tracking, dish-level profitability, low-stock alerts.
- **Offline-First PWA** — Service worker caches static assets, falls back to cached pages when offline.
- **Unified Order Aggregator** — Zomato/Swiggy/manual orders pulled into same KDS with status workflow (accept → prepare → ready → deliver).
- **GST/Tally Export** — One-click GSTR-1 export and Tally XML sync.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Turbopack), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, XtremeUI, Motion |
| Database | MongoDB Atlas with Mongoose 9 |
| Cache/Queue | Upstash Redis (TTL-based) |
| Real-time | Server-Sent Events (SSE) |
| Auth | NextAuth.js (credentials) |
| Payments | Razorpay Route + UPI Autodebit |
| AI (text) | Groq + Cerebras + Gemini + SiliconFlow (per-tenant quota) |
| AI (voice STT) | Groq Whisper Large v3 |
| AI (voice TTS) | ElevenLabs Multilingual v2 |
| WhatsApp | WhatsApp Cloud API |
| Phone IVR | Twilio + Bolo.ai (Hindi) |
| Object Storage | Cloudflare R2 |
| Error Monitoring | Sentry |
| CI/CD | GitHub Actions + Vercel |
| Tests | Jest (unit) + Playwright (e2e) |
| Linting | Biome |
| Secrets | Doppler / .env |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- MongoDB Atlas URI
- (Optional) Upstash Redis URL

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and other config

# Start development server
pnpm dev
```

Open http://localhost:3050.

### Demo Data

```bash
# Seed demo restaurants
curl http://localhost:3050/api/refreshDemoData
```

Demo logins:
- Admin (The Spice Kitchen): `demo@orderworder.com` / `Demo@12345`
- Admin (Empire): `admin@empire.com` / `empire@123`
- Admin (BrewPoint): `admin@brewpoint.com` / `brewpoint@123`
- Customer: `/demo?table=T1` (phone: `9999999999`, OTP will be displayed in console in dev mode)

### Docker

```bash
docker compose up
```

This starts the app at http://localhost:3050 along with MongoDB, Redis (optional), and n8n (optional).

### Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel, Docker, and Render deployment guides.

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── [restaurant]/           # Dynamic restaurant pages
│   ├── api/                    # API routes
│   │   ├── auth/               # Auth & setup
│   │   ├── admin/              # Admin analytics API
│   │   ├── order/              # Order management + SSE stream
│   │   ├── menu/               # Menu management
│   │   ├── chat/               # AI chat API
│   │   ├── voice/              # STT + TTS endpoints
│   │   ├── payment/            # Razorpay create/verify/webhook/refund/split
│   │   ├── whatsapp/           # Send messages + campaign broadcast
│   │   ├── loyalty/            # Points award/redeem
│   │   ├── customer/           # AI memory preferences
│   │   ├── kitchen/            # KDS actions + SSE stream
│   │   ├── aggregator/         # Zomato/Swiggy import + status
│   │   └── refreshDemoData/    # Demo data seeder
│   ├── dashboard/              # Owner dashboard
│   ├── kitchen/                # Kitchen Display System
│   └── ...                     # Setup, signup, scan, etc.
├── components/                 # Shared components
│   ├── ui/                     # UI primitives
│   ├── layout/                 # Layout components
│   ├── sections/               # Marketing sections
│   └── context/                # React context providers
└── utils/
    ├── database/               # Models, connection, helpers
    ├── ai/                     # AI provider switcher & prompts
    ├── helper/                 # Auth, validation, rate limiting
    ├── hooks/                  # Custom React hooks
    └── constants/              # App constants
```

## Deployment

- Production domain with Cloudflare DNS
- Environment variables separated for dev/staging/prod (`.env.example` documented)
- Automated deploy on merge to `main` via GitHub Actions + Vercel
- Health-check endpoint + uptime monitoring
- MongoDB daily automated snapshots
- Written rollback procedure (previous Vercel deploy + Mongo snapshot)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
