# OrderWorder

A multi-tenant restaurant SaaS platform with AI-powered dining assistance, voice ordering, AR menu, and real-time kitchen display. Customers scan QR codes, browse menus, chat with the AI assistant "Jarvis", order by tap or voice, and pay directly — all from their phone, no app install required.

## Features

- **QR Code Ordering** — Gate + per-table QR codes with deep-linking. Sub-2s load on 2G.
- **AI Assistant "Jarvis"** — Multi-provider AI (Groq → Cerebras → Gemini → SiliconFlow) with automatic failover. Recommends dishes, answers questions, takes orders.
- **Voice Ordering** — Mic button on menu page → Groq Whisper STT → Llama 4 → structured cart → ElevenLabs TTS confirmation.
- **3D/AR Menu** — View dishes in 3D/AR via WebXR/`<model-viewer>`. AI-assisted 3D model generation from photos.
- **Real-time Order Management** — Dashboard with SSE push (not polling) for live order updates.
- **Kitchen Display System** — Real-time KDS with station routing, timers, Start/Ready/Cancel.
- **Payments** — Razorpay Route integration. Customer pays → settles directly to owner's bank account. OrderWorder takes 0.5% platform margin.
- **Split Payments** — "Split with friends" generates per-person UPI deep-links.
- **Loyalty & Rewards** — Points engine, tiers (Silver/Gold/Platinum), AI-personalized offers, birthday automation.
- **Customer AI Memory** — Unified profile across channels: preferred language, spice tolerance, favorite dishes, allergens, last visit.
- **WhatsApp Marketing** — Cloud API: receipts, feedback, abandoned-cart, weekly offers, birthday greetings, festival campaigns.
- **Owner Analytics** — Live dashboard: revenue, orders, repeat rate, table turnover, top dishes, peak hours, AI commentary cards.
- **Multi-Outlet + RBAC** — Owner, manager, captain, waiter, chef roles per outlet.
- **Inventory & Recipe Costing** — Ingredient tracking, dish-level profitability, low-stock alerts.
- **Offline-First PWA** — Service worker queues orders locally, syncs on reconnect.
- **Unified Order Aggregator** — Zomato/Swiggy orders pulled into same KDS and dashboard.
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
| AI (3D/AR) | Image-to-3D API + `<model-viewer>` (WebXR) |
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
pnpm play
```

Open http://localhost:3000.

### Demo Data

```bash
# Seed two demo restaurants (Empire & Starbucks / Brewpoint)
curl http://localhost:3000/api/refreshDemoData
```

Demo logins:
- Admin: `admin@empire.com` / `empire@123`
- Admin: `admin@starbucks.com` / `starbucks@123`
- Customer: `/{restaurant}?table={id}` (e.g. `/empire?table=0`)

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── [restaurant]/           # Dynamic restaurant pages
│   ├── api/                    # API routes
│   │   ├── auth/               # Auth & setup
│   │   ├── admin/              # Admin dashboard API
│   │   ├── order/              # Order management
│   │   ├── menu/               # Menu management
│   │   ├── chat/               # AI chat API
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
