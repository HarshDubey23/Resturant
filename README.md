# OrderWorder

A multi-tenant restaurant SaaS platform for contactless dining powered by AI. Customers scan QR codes, browse menus, chat with the AI assistant "Jarvis", order by tap or voice, and pay directly — all from their phone, no app install required.

## Screenshots

| Menu & Cart | Dashboard | QR Code |
|---|---|---|
| ![Menu](public/screenshots/restaurant_menu.png) | ![Dashboard](public/screenshots/dashboard_active.png) | ![QR](public/screenshots/restaurant_qrcode_light.png) |

## Features

- **QR Code Ordering** — Per-table QR codes with deep-linking. Sub-2s load on 2G.
- **AI Assistant "Jarvis"** — Multi-provider AI (Groq → Cerebras → Gemini → SiliconFlow) with auto-failover. Recommends dishes, answers questions, takes orders.
- **Voice Ordering** — Groq Whisper STT with Hindi/Hinglish support → structured cart → ElevenLabs TTS confirmation.
- **Real-time Order Management** — Dashboard with SSE push for live order updates.
- **Kitchen Display System** — Station routing, countdown timers, Start/Ready/Served actions.
- **Payments** — Razorpay Route + Stripe. Settles directly to owner's bank. 0.5% platform fee.
- **Split Payments** — Per-person payment links.
- **Loyalty & Rewards** — Points engine (1pt/₹10), Silver/Gold/Platinum tiers with multipliers.
- **Customer AI Memory** — Unified profile: language, spice tolerance, favorites, allergens, birthdays.
- **WhatsApp Marketing** — Order receipts, ready notifications, campaigns, abandoned cart recovery.
- **Owner Analytics** — Live dashboard: revenue, top dishes, peak hours, repeat rate, AI commentary.
- **Multi-Outlet + RBAC** — Owner, manager, captain, waiter, chef roles.
- **Offline-First PWA** — Service worker caches static assets, falls back offline.
- **Unified Order Aggregator** — Zomato/Swiggy/manual orders in same KDS.
- **GST/Tax Management** — Per-item tax, tax-inclusive pricing, tax summary in cart.
- **PDF Invoices** — Download/print via `@react-pdf/renderer`.
- **Multi-language** — Hindi voice STT, Bolo.ai Hindi IVR.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Turbopack), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Motion |
| Database | MongoDB Atlas + Mongoose 9 |
| Cache / Queue | Upstash Redis (TTL-based) |
| Real-time | Server-Sent Events (SSE) |
| Auth | NextAuth.js (credentials, 3 flows) |
| Payments | Razorpay Route + Stripe + UPI Autodebit |
| AI (text) | Groq / Cerebras / Gemini / SiliconFlow (auto-failover) |
| AI (voice STT) | Groq Whisper Large v3 (Hindi/Hinglish) |
| AI (voice TTS) | ElevenLabs Multilingual v2 |
| WhatsApp | WhatsApp Cloud API v22.0 |
| Phone IVR | Twilio + Bolo.ai (Hindi) |
| Object Storage | Cloudflare R2 |
| Error Monitoring | Sentry (client, server, edge) |
| CI/CD | GitHub Actions + Vercel |
| Tests | Jest (unit) |
| Linting | Biome |
| Secrets | Doppler / `.env` |

## Quick Start

```bash
pnpm install
cp .env.example .env.local   # Configure MongoDB URI & other keys
pnpm dev                     # → http://localhost:3050
```

### Seed Demo Data

```bash
curl http://localhost:3050/api/refreshDemoData
```

Demo logins:
- Admin (Empire): `admin@empire.com` / `empire@123`
- Admin (BrewPoint): `admin@brewpoint.com` / `brewpoint@123`
- Customer: `/{restaurant}?table=T1`

### Docker

```bash
docker compose up
```

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── [restaurant]/             # Dynamic restaurant pages
│   ├── api/                      # 18 API endpoint groups
│   ├── dashboard/                # Owner dashboard
│   ├── kitchen/                  # Kitchen Display System
│   └── ...                       # scan, setup, signup, etc.
├── components/                   # Shared components
│   ├── ui/                       # 23 shadcn/ui primitives
│   ├── chatbot/                  # AI chat interface
│   ├── features/                 # Feature components
│   ├── context/                  # React context providers
│   └── sections/                 # Landing page sections
├── utils/
│   ├── ai/                       # Provider switcher & prompts
│   ├── database/                 # Mongoose models & helpers
│   ├── payment/                  # Razorpay/Stripe logic
│   ├── voice/                    # STT/TTS utilities
│   └── whatsapp/                 # WhatsApp Cloud API
├── lib/                          # Third-party integrations
└── types/                        # TypeScript definitions
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel, Docker, and Render guides.

## License

MIT — see [LICENSE](./LICENSE).
