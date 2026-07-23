# Deployment Guide — OrderWorder

A multi-tenant restaurant SaaS platform for contactless dining powered by AI. Customers scan QR codes, browse menus, chat with the AI assistant "Jarvis", order by tap or voice, and pay directly from their phone. Owners get a real-time dashboard with rich analytics, a Kitchen Display System, and per-table QR code generation.

---

## What's New (latest)

- **Enhanced Analytics Dashboard** — 8 chart types powered by Recharts: revenue trend (area), peak hours (bar), payment-method breakdown (donut), order-status breakdown (donut), revenue by category (horizontal bar), orders by weekday (bar), top dishes (progress bars), top customers (ranked list), plus churned-customer grid and AI-generated insights. Filterable by 7d / 30d / 90d.
- **Demo data seed script** — `node scripts/seed-analytics.mjs` seeds 150 realistic orders across 90 days for the `demo` restaurant so every analytics chart renders with real data on first boot.
- **NextAuth login fix** — Resolved the HTTP 400 "This action with HTTP POST is not supported" error under Next.js 16. Login now works end-to-end for admin, kitchen, and customer flows.
- **TypeScript CI green** — All Recharts `Tooltip` formatter types fixed; `pnpm typecheck` and `pnpm lint` pass clean.
- **11 screenshots** — Landing, signup wizard, dashboard overview, analytics, settings/QR, kitchen display, 4 restaurant menus, and customer ordering pages. See `public/screenshots/` and the README.

---

## Prerequisites

| Tool     | Version | Why                             |
|----------|---------|---------------------------------|
| Node.js  | ^22.11  | Runtime                         |
| pnpm     | 11 (or `bun` 1.3+) | Package manager      |
| Git      | any     | Source control                  |
| MongoDB  | 7+      | Primary database (Atlas or self-hosted) |

> **Package manager note:** The repo ships with both `bun.lock` and `pnpm-lock.yaml`. Either works — pick one and stick with it. Examples below use `pnpm`; substitute `bun` (e.g. `bun install`, `bun run dev`) if you prefer.

---

## 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/Resturant.git
cd Resturant
pnpm install        # or: bun install
```

---

## 2. Quick Start with Demo Data (5 minutes)

The fastest path to a working app with rich data:

```bash
# 1. Install deps
pnpm install

# 2. Create .env.local with the 4 required vars (see section 3A below)
cp .env.example .env.local
# edit .env.local — set MONGODB_URI, NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_URL

# 3. Start the dev server (port 3050)
pnpm dev

# 4. In a separate terminal, seed the demo restaurant + menu + tables
pnpm seed                    # runs scripts/seed-demo.ts via tsx

# 5. Seed 150 demo orders across 90 days (so analytics charts have real data)
node scripts/seed-analytics.mjs

# 6. Open http://localhost:3050 and log in:
#    Email:    demo@orderworder.com
#    Password: Demo@12345
```

After login, go to **Dashboard → Analytics** to see all 8 chart types populated with 90 days of real order data. Go to **Dashboard → Settings → Tables** to download per-table QR codes.

### What the seed scripts create

| Script | What it does | Idempotent? |
|---|---|---|
| `pnpm seed` (`scripts/seed-demo.ts`) | Creates the `demo` restaurant profile, admin account, 23 menu items across 5 categories, 10 tables with QR codes | Yes — upserts by `restaurantID` |
| `node scripts/seed-analytics.mjs` | Wipes & re-creates 20 demo customers + 150 orders (80% complete, 10% active, 5% cancel, 5% reject) spread across 90 days with realistic peak-hour distribution | Yes — wipes & rebuilds `demo` orders + seed customers only; other restaurants untouched |

---

## 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

### A. Core (required — app won't start without these)

| Variable           | Where to get it                                                                  | Where it's used                          |
|--------------------|----------------------------------------------------------------------------------|------------------------------------------|
| `MONGODB_URI`      | [MongoDB Atlas](https://cloud.mongodb.com) → Database → Connect → Drivers         | `src/utils/database/connect.ts`          |
| `NEXTAUTH_URL`     | Your production URL e.g. `https://orderworder.vercel.app`                         | `src/app/api/auth/[...nextauth]/route.ts` |
| `NEXTAUTH_SECRET`  | Generate: `openssl rand -base64 32`                                              | NextAuth JWT encryption                  |
| `NEXT_PUBLIC_URL`  | Same as NEXTAUTH_URL (public-facing domain)                                       | QR code generation, redirects            |

**How to get a MongoDB Atlas cluster:**

1. Go to https://cloud.mongodb.com → Create a free M0 cluster
2. Under Security → Database Access → Add a database user (username + password)
3. Under Security → Network Access → Add `0.0.0.0/0` (allow all — Vercel IPs vary)
4. Click "Connect" → "Drivers" → copy the connection string
5. Replace `<password>` with your user's password, `<dbname>` with `orderworder`

> **Minimum viable deploy:** If you only set the 4 core vars above plus `AI_GROQ_KEY`, the app will boot, login will work, and analytics will render. Every other integration (payments, Redis, Sentry, WhatsApp, R2, n8n) has a graceful in-memory or no-op fallback.

### B. Authentication (required)

| Variable          | Where to get it                                                            | Where it's used                     |
|-------------------|----------------------------------------------------------------------------|-------------------------------------|
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` on your terminal                             | `src/app/api/auth/[...nextauth]/`   |
| `OTP_SECRET`      | Run `openssl rand -hex 32` on your terminal (optional, falls back to `NEXTAUTH_SECRET`) | HMAC-signed OTP verification tokens |
| `ENCRYPTION_SECRET` | Same as `NEXTAUTH_SECRET` (optional, falls back) | Encrypts sensitive fields at rest |
| `CRON_SECRET` | Run `openssl rand -hex 32` | Authenticates Vercel Cron calls |

**Three auth flows** (all via NextAuth credentials provider):
1. **Restaurant admin** — email/username + password (bcrypt-hashed)
2. **Kitchen staff** — restaurant username + kitchen username + kitchen password (chefs can't access billing/settings)
3. **Customer** — restaurant username + table ID + phone + OTP + table PIN

### C. Payments (pick at least one; cash is always available)

#### Razorpay (India — INR)

| Variable                  | Where to get it                                                           | Where it's used                        |
|---------------------------|---------------------------------------------------------------------------|----------------------------------------|
| `RAZORPAY_KEY_ID`         | https://dashboard.razorpay.com → Settings → API Keys                      | `src/lib/razorpay/`                    |
| `RAZORPAY_KEY_SECRET`     | Same page (show/hide toggle)                                              | Server-side payment verification       |
| `RAZORPAY_ACCOUNT_NUMBER` | https://dashboard.razorpay.com → Settings → Accounts → Route              | Settlement/payout API (`cron/settle`)  |

**Steps:**
- Create a Razorpay merchant account (if you don't have one)
- Go to Settings → API Keys → Generate Key
- Enable "Route" from Settings → Accounts → Route (for settlements)
- Note: Razorpay test keys start with `rzp_test_`; live keys with `rzp_live_`

#### Stripe (International — USD)

| Variable                           | Where to get it                                                            | Where it's used                         |
|------------------------------------|----------------------------------------------------------------------------|-----------------------------------------|
| `STRIPE_SECRET_KEY`                | https://dashboard.stripe.com → Developers → API Keys                       | `src/utils/payment/stripe.ts`           |
| `STRIPE_WEBHOOK_SECRET`            | https://dashboard.stripe.com → Developers → Webhooks → Add endpoint        | `src/app/api/payment/stripe/webhook/`   |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same API keys page (publishable key)                                     | `src/components/checkout/` (client-side) |

**Steps:**
- Create a Stripe account
- Go to Developers → API Keys → copy `sk_test_...` (secret) and `pk_test_...` (publishable)
- For webhook secret: add an endpoint pointing to `https://yourdomain.com/api/payment/stripe/webhook`
  - Listen for events: `checkout.session.completed`, `payment_intent.succeeded`
  - Copy the `whsec_...` signing secret

### D. AI Chat / Voice (at least one required for Jarvis AI)

| Variable              | Where to get it                                                      | Usage                      |
|-----------------------|----------------------------------------------------------------------|----------------------------|
| `AI_GROQ_KEY`         | https://console.groq.com/keys → Create API Key                       | AI chat (fast inference)   |
| `AI_CEREBRAS_KEY`     | https://cloud.cerebras.ai/ → API Keys                                | AI chat (alternative)      |
| `AI_GOOGLE_KEY`       | https://aistudio.google.com/apikey → Create API Key                  | AI chat (Gemini model)     |
| `AI_SILICONFLOW_KEY`  | https://cloud.siliconflow.com/ → API Keys                            | AI chat (alternative)      |
| `AI_HUGGINGFACE_KEY`  | https://huggingface.co/settings/tokens → Create token                | AI chat (HuggingFace)      |

**Recommendation:** Start with Groq (fastest, generous free tier). The analytics AI Insights also use this key to generate business commentary.

**Auto-failover chain:** Groq → Cerebras → Gemini → SiliconFlow. If a provider errors, the next one is tried automatically.

#### Voice TTS

| Variable            | Where to get it                                                      | Usage                                |
|---------------------|----------------------------------------------------------------------|--------------------------------------|
| `ELEVENLABS_API_KEY`| https://elevenlabs.io → Profile → API Keys                           | `src/app/api/voice/tts/route.ts`     |

- Free tier: 10,000 characters/month
- If empty, the client falls back to browser `speechSynthesis` (no setup needed)

### E. Cache & Rate Limiting (recommended, has in-memory fallback)

| Variable                     | Where to get it                                                       | Usage                                |
|------------------------------|-----------------------------------------------------------------------|--------------------------------------|
| `UPSTASH_REDIS_REST_URL`     | https://console.upstash.com → Create Redis database                   | Rate limiting, session cache         |
| `UPSTASH_REDIS_REST_TOKEN`   | Same page (auto-generated)                                            | Authentication for Redis REST API    |

**Steps:**
1. Create a free Upstash account
2. Create a Redis database (choose any region close to your users)
3. Copy REST URL and REST Token from the console

> **Fallback:** If these are not set, the app uses an in-memory LRU cache and per-process rate limiter. Works fine for single-instance deploys; use Upstash for multi-instance (Vercel) so rate limits are shared.

### F. Error Monitoring (recommended)

| Variable            | Where to get it                                                      | Usage                                |
|---------------------|----------------------------------------------------------------------|--------------------------------------|
| `SENTRY_DSN`        | https://sentry.io → Create Project → Next.js                         | `sentry.client.config.ts` etc.       |

- Create a Sentry account → Projects → Create Project → Select Next.js
- Copy the DSN (looks like `https://xxx@xxx.ingest.sentry.io/project-id`)
- If empty, errors are logged to console only

### G. Webhook / Cron Security

| Variable       | Where to get it                                        | Usage                                   |
|----------------|--------------------------------------------------------|-----------------------------------------|
| `CRON_SECRET`  | Run `openssl rand -hex 32` on your terminal            | `src/app/api/cron/settle/route.ts`      |

- Used to authenticate cron job calls (e.g., from Vercel Cron Jobs or GitHub Actions)
- Pass as `Authorization: Bearer <CRON_SECRET>` header

### H. Optional — n8n Workflow Automation

| Variable                    | Where to get it                                      | Usage                              |
|-----------------------------|------------------------------------------------------|------------------------------------|
| `N8N_WEBHOOK_URL`           | Your n8n instance URL + webhook ID                   | `src/lib/n8n/client.ts`            |
| `N8N_WEBHOOK_SECRET`        | Random string (generate with `openssl rand -hex 32`) | HMAC signing of webhook payloads   |
| `N8N_WEBHOOK_TOKEN`         | n8n webhook settings → Header auth token             | Bearer token auth (optional)       |
| `N8N_API_KEY`               | n8n settings → API → Generate key                    | Workflow management (optional)     |
| `N8N_INBOUND_ALLOWED_IPS`   | Your n8n server IP(s)                                | IP allowlist for inbound webhooks  |

### I. Optional — WhatsApp Cloud API

| Variable                     | Where to get it                                                         | Usage                             |
|------------------------------|-------------------------------------------------------------------------|-----------------------------------|
| `WHATSAPP_PHONE_NUMBER_ID`   | Meta Business Suite → WhatsApp → API Setup                              | `src/app/api/whatsapp/send/`      |
| `WHATSAPP_ACCESS_TOKEN`      | Same page (generate permanent token)                                    | Authentication for Meta API       |
| `OPENWA_API_URL`             | Your self-hosted OpenWA instance URL (e.g. `http://localhost:8080`)    | Free WhatsApp alternative         |

> **Fallback:** If both are empty, WhatsApp messages are silently no-op'd (logged but not sent). Order flow continues normally.

### J. Optional — Cloudflare R2 (Images & 3D Models)

| Variable                     | Where to get it                                                    | Usage                             |
|------------------------------|--------------------------------------------------------------------|-----------------------------------|
| `R2_ACCESS_KEY_ID`           | Cloudflare Dashboard → R2 → Manage API Tokens                     | Server-side file upload           |
| `R2_SECRET_ACCESS_KEY`       | Same page (shown once on creation)                                 | Server-side file upload           |
| `R2_BUCKET_NAME`             | R2 → Create Bucket (e.g. `orderworder`)                            | Storage bucket name               |
| `R2_ENDPOINT`                | R2 → Bucket → Properties (e.g. `https://xxx.r2.cloudflarestorage.com`) | S3-compatible endpoint         |
| `R2_PUBLIC_URL`              | R2 → Bucket → Public URL (e.g. `https://pub-xxxx.r2.dev`)          | Public CDN base URL               |
| `NEXT_PUBLIC_R2_MODELS_URL`  | `https://pub-xxxx.r2.dev/models/food`                              | Client-side 3D model loading      |

> **Fallback:** If R2 is not configured, images are stored as base64 in MongoDB (works for demo, not recommended for production scale).

---

## 4. Free / Local Alternatives

You can run most integrations for free or self-hosted:

| Integration | Free/local option | How to configure |
|-------------|-------------------|------------------|
| Redis | Self-hosted Docker: `docker run -p 6379:6379 redis:alpine` or Upstash free tier | Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| Error monitoring | GlitchTip self-hosted | Set `SENTRY_DSN` to your GlitchTip project DSN |
| TTS | Browser `speechSynthesis` | Leave `ELEVENLABS_API_KEY` empty; client falls back automatically |
| AI | Ollama local (`http://localhost:11434`) | Add an OpenAI-compatible provider entry in `src/utils/ai/config.ts` |
| WhatsApp | OpenWA self-hosted | Set `OPENWA_API_URL` to your OpenWA instance |
| Payments | Cash / UPI QR | Cash is enabled by default; set `upiId` in restaurant profile for UPI QR |
| Object storage | Base64 in MongoDB | Leave R2 vars empty; works for small-scale deploys |

---

## 5. Vercel Deployment (recommended)

### Step 1: Push to GitHub

```bash
git add -A
git commit -m "Ready for production"
git push origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com → Add New → Project
2. Import your GitHub repo
3. Under **Framework Preset** — leave as Next.js (auto-detected)
4. Under **Root Directory** — leave as `./`
5. Under **Build & Output Settings**:
   - Build command: `pnpm build` (auto-detected)
   - Output directory: `.next` (auto-detected)
   - Install command: `pnpm install` (auto-detected)

### Step 3: Set Environment Variables in Vercel

In the Vercel project dashboard → Settings → Environment Variables, add:

| Variable | Scope | Notes |
|----------|-------|-------|
| `MONGODB_URI` | Production, Preview, Development | Your MongoDB Atlas connection string |
| `NEXTAUTH_URL` | Production | `https://your-project.vercel.app` |
| `NEXTAUTH_SECRET` | Production, Preview, Development | Random 32+ char string |
| `NEXT_PUBLIC_URL` | Production | `https://your-project.vercel.app` |
| `AI_GROQ_KEY` | Production | At least one AI key required |
| `RAZORPAY_KEY_ID` | Production | Your Razorpay live key |
| `RAZORPAY_KEY_SECRET` | Production | Your Razorpay live secret |
| `RAZORPAY_ACCOUNT_NUMBER` | Production | For settlements |
| `STRIPE_SECRET_KEY` | Production | If using Stripe |
| `STRIPE_WEBHOOK_SECRET` | Production | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production | Stripe publishable key |
| `UPSTASH_REDIS_REST_URL` | Production | Rate limiting (recommended for multi-instance) |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Redis auth |
| `SENTRY_DSN` | Production | Error tracking |
| `CRON_SECRET` | Production | Cron auth |
| `OTP_SECRET` | Production | HMAC OTP tokens |
| `ELEVENLABS_API_KEY` | Production | For voice features (optional) |
| `NEXT_PUBLIC_R2_MODELS_URL` | Production | If using 3D food viewer |

**Vercel automatically sets:**
- `NODE_ENV=production`
- `NEXT_PUBLIC_VERCEL_URL`

### Step 4: Deploy

Click **Deploy**. Vercel will build and deploy automatically. The first build takes ~3 minutes.

### Step 5: Seed demo data (optional but recommended)

After the first successful deploy, seed the demo restaurant so you can immediately explore the dashboard:

```bash
# From your local machine, pointing at the production DB:
MONGODB_URI="your_production_mongodb_uri" pnpm seed
MONGODB_URI="your_production_mongodb_uri" node scripts/seed-analytics.mjs
```

Or hit the refresh endpoint (uses the connected DB):
```bash
curl -X POST https://your-project.vercel.app/api/refreshDemoData
```

### Step 6: Set up Stripe Webhook (if using Stripe)

After deployment:
1. Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-project.vercel.app/api/payment/stripe/webhook`
3. Events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy the signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel env vars
5. Redeploy

### Step 7: Cron Jobs

The project includes `vercel.json` with two cron jobs:

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/settle` | `30 18 * * *` (18:30 UTC daily) | Daily payout settlements |
| `/api/cron/birthday` | `30 3 * * *` (03:30 UTC daily) | Birthday / anniversary WhatsApp greetings |

Vercel reads these automatically on deploy. Each cron endpoint requires:
```
Authorization: Bearer YOUR_CRON_SECRET
```

You can also use an external cron service (https://cron-job.org, https://healthchecks.io) to call the same endpoints with the same header.

### Step 8: Security Headers

`Content-Security-Policy` and `Permissions-Policy` are set per-request by `proxy.ts` (the Next.js 16 proxy convention):
- A unique CSP nonce is generated for every request.
- `Permissions-Policy` allows microphone, geolocation, and payment APIs for voice ordering and payments.
- CORS headers, CSRF tokens, and rate limiting are also handled by the proxy.

Do not add CSP/Permissions-Policy in `next.config.ts` headers — the proxy owns them.

---

## 6. Docker Deployment (Recommended for Self-Hosting)

The repo includes a `Dockerfile` and `docker-compose.yml`:

```bash
# Start everything (app + MongoDB)
docker compose up

# With Redis and n8n
docker compose --profile with-redis --profile with-n8n up
```

The app is available at http://localhost:3050.

### Production Build

```bash
docker compose up --build
```

### Seed Demo Data

After startup, seed the demo restaurant:
```bash
# From inside the container or your host (with MONGODB_URI set):
pnpm seed
node scripts/seed-analytics.mjs
```

Or via the refresh endpoint:
```bash
curl http://localhost:3050/api/refreshDemoData
```

Demo credentials:
- Admin: `demo@orderworder.com` / `Demo@12345`
- Customer: Visit `http://localhost:3050/demo?table=T1`

---

## 7. Render Deployment (One-Click)

The repo includes a `render.yaml` Blueprint for one-click deployment on Render:

1. Fork the repo on GitHub
2. Go to https://dashboard.render.com/select-repo?type=blueprint
3. Select your fork
4. Fill in the environment variables marked as `sync: false`
5. Click "Apply"

Render will:
- Build the Docker image
- Deploy with health checks at `/api/health`
- Auto-deploy on push

---

## 8. Self-hosted GlitchTip (Error Monitoring)

For zero-cost self-hosted error monitoring:
1. Deploy GlitchTip using their Docker Compose: https://glitchtip.com
2. Set `SENTRY_DSN` to your GlitchTip project DSN
3. The Sentry SDK speaks the same protocol — no code changes needed

---

## 9. OpenWA (Self-hosted WhatsApp)

For free self-hosted WhatsApp messaging:
1. Deploy OpenWA: https://github.com/open-wa/wa-automate
2. Set `OPENWA_API_URL` to your OpenWA instance URL
3. Optionally set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` for Meta Cloud API instead

---

## 10. BYOK (Bring Your Own AI Keys)

Each restaurant can override the global AI provider keys from the dashboard:
1. Go to Settings → AI Keys
2. Paste provider-specific API keys
3. Keys are stored per-tenant and are write-only (never returned in GET responses)

This lets each restaurant use their own Groq/Cerebras/Gemini quota.

---

## 11. MongoDB Change Streams

For production, run MongoDB as a replica set:
- Atlas free tier is already a replica set — Change Streams work out of the box
- For self-hosted, configure a single-node replica set
- If Change Streams are unavailable, the app falls back to polling at 10s intervals

Change Streams power the real-time order updates on the dashboard (Server-Sent Events) and the Kitchen Display System.

---

## 12. Analytics Dashboard (in detail)

The Dashboard → Analytics tab ships with **8 chart types** powered by Recharts 3.9, all populated from the `orders` collection via MongoDB aggregations:

| Chart | Type | Data Source | Description |
|---|---|---|---|
| Revenue Trend | Area chart with gradient fill | `dailyRevenue` agg | Daily revenue over the selected range |
| Peak Hours | Bar chart (color-coded) | `peakHours` agg | Orders grouped by hour-of-day (0–23) |
| Payment Methods | Donut chart + legend | `paymentMethods` agg | Revenue split by Razorpay / Stripe / Cash |
| Order Status | Donut chart + legend | `orderStatus` agg | Completed / Active / Cancelled / Rejected |
| Revenue by Category | Horizontal bar chart | `categories` agg (joins `menus`) | Revenue + units sold per menu category |
| Orders by Weekday | Bar chart | `weekdays` agg | Busiest days of the week |
| Top Dishes | Progress-bar ranked list | `topDishes` agg | Top 7 dishes by quantity sold |
| Top Customers | Ranked table | `topCustomers` agg (joins `customers`) | Top 10 by total spend |

Plus:
- **4 KPI stat cards** — Today Revenue, Month Revenue (with trend %), Repeat Rate, Avg Ticket
- **Churned Customers grid** — Customers with no orders in 30 days (at-risk)
- **AI Insights** — Auto-generated business commentary from the Groq LLM (with rule-based fallback)
- **Range filter** — 7d / 30d / 90d
- **Auto-refresh** — Polls the API every 60s
- **Caching** — Results cached 15 min in Upstash Redis (or in-memory fallback)

The analytics API is at `GET /api/admin/analytics?range=7d|30d|90d` and requires the `analytics.view` permission (admin role).

### Seeding demo data for analytics

Without real orders, the charts render empty. The seed script creates 150 orders across 90 days:

```bash
node scripts/seed-analytics.mjs
```

This generates:
- 20 demo customers (Indian names + unique emails + phones)
- 150 orders (80% complete, 10% active, 5% cancel, 5% reject)
- Realistic peak-hour distribution (lunch 12–14h + dinner 19–22h weighted higher)
- Mixed payment methods (45% Razorpay, 40% cash, 15% Stripe)
- 1–4 menu items per order, quantities 1–3
- Date range: last 90 days, weighted toward recent days

Re-run anytime to refresh — it wipes only `demo` restaurant's orders + seed customers (other restaurants are untouched).

---

## 13. Post-Deployment Checklist

- [ ] Visit `https://your-domain/setup` — create the first restaurant profile
- [ ] Visit `https://your-domain/signup` — create your admin account
- [ ] Seed demo data: `pnpm seed` then `node scripts/seed-analytics.mjs`
- [ ] Log in as admin → confirm Dashboard → Analytics shows populated charts
- [ ] Configure menu items at `https://your-domain/dashboard?tab=settings`
- [ ] Download table QR codes from Settings → Tables → Download PNG (one per table)
- [ ] Set up Razorpay/Stripe test keys → run a test payment
- [ ] Configure Stripe webhook in Stripe Dashboard (if using Stripe)
- [ ] Confirm Vercel Cron Jobs are registered (`/api/cron/settle`, `/api/cron/birthday`)
- [ ] Generate and set `OTP_SECRET` for HMAC-signed OTP tokens
- [ ] (Optional) Configure n8n webhook URL for workflow automation
- [ ] (Optional) Set up WhatsApp Cloud API for order notifications
- [ ] (Optional) Configure Upstash Redis for shared rate limiting across instances
- [ ] (Optional) Set Sentry DSN for error tracking
- [ ] Point your custom domain in Vercel → Domains
- [ ] Update `NEXTAUTH_URL` and `NEXT_PUBLIC_URL` to the custom domain
- [ ] Switch Razorpay/Stripe keys from test to live when ready
- [ ] Restrict MongoDB Atlas IP whitelist to Vercel IPs for production

---

## 14. CI/CD (GitHub Actions)

The repository includes `.github/workflows/ci.yml` that runs on every push and PR to `main`:

1. `pnpm install` — install deps
2. `pnpm lint` — Biome lint + auto-fix
3. `pnpm typecheck` — `tsc --noEmit` (TypeScript strict)
4. `pnpm test` — Jest unit tests
5. `pnpm build` — Next.js production build

**Current status:** ✅ All checks pass on `main`. The Recharts `Tooltip` formatter types were the last blocker — fixed by importing `TooltipValueType` from recharts and typing the `value` param as `TooltipValueType | undefined`.

To enable auto-deploy to Vercel on push, uncomment the `deploy` job in `.github/workflows/ci.yml` and add these repo secrets:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel → Team → Settings → ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → Project ID |

---

## 15. Local Development

```bash
pnpm install
pnpm dev          # → http://localhost:3050 (Turbopack)
```

Useful scripts:

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server on port 3050 |
| `pnpm build` | Production build |
| `pnpm start` | Start production server (after build) |
| `pnpm lint` | Biome lint + auto-fix |
| `pnpm typecheck` | TypeScript strict check (`tsc --noEmit`) |
| `pnpm test` | Jest unit tests |
| `pnpm seed` | Seed demo restaurant (tsx scripts/seed-demo.ts) |
| `node scripts/seed-analytics.mjs` | Seed 150 demo orders for analytics |
| `pnpm clean` | Wipe `node_modules`, lockfile, `.next`, reinstall |

---

## 16. Troubleshooting

### Login fails with HTTP 400 on `/api/auth/callback/credentials`

This was a NextAuth v4 + Next.js 16 incompatibility (the incoming `req` was a plain `Request` instead of `NextRequest`, so `req.nextUrl.searchParams` was undefined). **Fixed in commit `78353d6`** — the auth route now reconstructs a `NextRequest` before passing to NextAuth. If you see this error, make sure you're on `main` with the fix applied.

### Analytics page shows "Loading analytics..." forever

This means the `/api/admin/analytics` endpoint is returning 401 (not authenticated) or 500. Check:
1. You're logged in as an admin (not a kitchen-staff or customer account)
2. Your session hasn't expired — try logging out and back in
3. The MongoDB connection works — check server logs for connection errors
4. Run `node scripts/seed-analytics.mjs` to ensure there's order data to aggregate

### Charts render but show "No data"

The `orders` collection is empty for your restaurant. Run the seed script:
```bash
node scripts/seed-analytics.mjs
```
(Replace `RESTAURANT_ID = "demo"` in the script with your restaurant's slug if seeding for a different restaurant.)

### `tsc --noEmit` fails on Recharts Tooltip formatters

The `formatter` callback's `value` param must be typed as `TooltipValueType | undefined` (imported from `recharts`), not `number`. Inside the callback, coerce with `Number(value)`. See `src/app/dashboard/_components/Analytics/Analytics.tsx` for the working pattern.

### Dev server dies when terminal closes (sandbox environments)

If running in a sandbox/reaper environment, start the server with `setsid` to detach it from the controlling terminal:
```bash
setsid nohup pnpm dev > /tmp/devserver.log 2>&1 < /dev/null &
```

### MongoDB duplicate key on `email_1_restaurantID_1` when seeding

The `customers` collection has a unique compound index on `(email, restaurantID)`. The seed script generates unique emails like `firstname.lastname@index@example.com` to avoid this. If you hit it with custom data, ensure every customer has a unique email per restaurant.

---

## Appendix: Quick Reference — All Environment Variables

```bash
# ─── Core (required) ───────────────────────────────
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/orderworder
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
OTP_SECRET=<openssl rand -hex 32>
ENCRYPTION_SECRET=<same as NEXTAUTH_SECRET>
NEXT_PUBLIC_URL=https://yourdomain.com

# ─── Payments (pick one or both; cash always works) ──
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_ACCOUNT_NUMBER=xxx  # for settlements
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# ─── AI (at least one required) ──────────────────────
AI_GROQ_KEY=gsk_xxx
# AI_CEREBRAS_KEY=xxx
# AI_GOOGLE_KEY=xxx
# AI_SILICONFLOW_KEY=xxx
# AI_HUGGINGFACE_KEY=hf_xxx

# ─── Voice ─────────────────────────────────────────
ELEVENLABS_API_KEY=xxx  # optional, falls back to browser speechSynthesis

# ─── Cache (recommended, has in-memory fallback) ────
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# ─── Error Monitoring (recommended) ─────────────────
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# ─── Cron / Webhook security ───────────────────────
CRON_SECRET=xxx

# ─── Optional integrations ──────────────────────────
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/xxx
N8N_WEBHOOK_SECRET=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx
OPENWA_API_URL=http://localhost:8080

# ─── Optional object storage (R2) ───────────────────
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=orderworder
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-xxx.r2.dev
NEXT_PUBLIC_R2_MODELS_URL=https://pub-xxx.r2.dev/models/food

# ─── Misc ──────────────────────────────────────────
DEMO_MODE=true  # enables demo banners / skips some production checks
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ROOT_DOMAIN=yourdomain.com
```

---

## Appendix: Demo Credentials

| Restaurant | Slug | Admin Email | Password |
|---|---|---|---|
| The Spice Kitchen (demo) | `demo` | `demo@orderworder.com` | `Demo@12345` |
| Spice Route | `spiceroute` | `admin@spiceroute.com` | `spiceroute@demo123` |
| Empire Restaurant | `empire` | `admin@empire.com` | `empire@123` |
| BrewPoint Coffee | `brewpoint` | `admin@brewpoint.com` | `brewpoint@123` |

Customer access: `https://your-domain/<slug>?table=T1` (phone + OTP login, no password).

---

## Appendix: Useful Routes

| Route | Auth | Purpose |
|---|---|---|
| `/` | public | Landing page |
| `/signup` | public | 9-step restaurant onboarding wizard |
| `/#login` | public | Owner/kitchen login form |
| `/[restaurant]` | public | Customer-facing menu (e.g. `/demo`) |
| `/[restaurant]/table/[tableId]` | customer | Table ordering page (scan from QR) |
| `/[restaurant]/table/[tableId]/track` | customer | Order tracking |
| `/dashboard` | admin | Owner dashboard (overview, orders, analytics, settings, etc.) |
| `/dashboard?tab=analytics` | admin | Enhanced analytics with 8 chart types |
| `/dashboard?tab=settings` | admin | Menu editor, tables + QR, billing, AI keys, campaigns |
| `/kitchen` | kitchen staff | Kitchen Display System (KDS) |
| `/platform` | platform admin | Multi-tenant platform dashboard |
| `/api/health` | public | Health check endpoint |
| `/api/admin/analytics?range=30d` | admin | Analytics JSON API |
| `/api/refreshDemoData` | public | Re-seed demo data (use in dev only) |
