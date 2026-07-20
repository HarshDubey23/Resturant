# Deployment Guide — OrderWorder

## Prerequisites

| Tool     | Version | Why                             |
|----------|---------|---------------------------------|
| Node.js  | ^22.11  | Runtime                         |
| pnpm     | 11      | Package manager                 |
| Git      | any     | Source control                  |
| MongoDB  | 7+      | Primary database (Atlas or self-hosted) |

---

## 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/Resturant.git
cd Resturant
pnpm install
```

---

## 2. Environment Variables

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

### B. Authentication (required)

| Variable          | Where to get it                                                            | Where it's used                     |
|-------------------|----------------------------------------------------------------------------|-------------------------------------|
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` on your terminal                             | `src/app/api/auth/[...nextauth]/`   |

No external provider config needed — the app uses email/password via MongoDB adapter.

### C. Payments (pick at least one)

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

**Recommendation:** Start with Groq (fastest, generous free tier).

#### Voice TTS

| Variable            | Where to get it                                                      | Usage                                |
|---------------------|----------------------------------------------------------------------|--------------------------------------|
| `ELEVENLABS_API_KEY`| https://elevenlabs.io → Profile → API Keys                           | `src/app/api/voice/tts/route.ts`     |

- Free tier: 10,000 characters/month

### E. Cache & Rate Limiting (recommended)

| Variable                     | Where to get it                                                       | Usage                                |
|------------------------------|-----------------------------------------------------------------------|--------------------------------------|
| `UPSTASH_REDIS_REST_URL`     | https://console.upstash.com → Create Redis database                   | Rate limiting, session cache         |
| `UPSTASH_REDIS_REST_TOKEN`   | Same page (auto-generated)                                            | Authentication for Redis REST API    |

**Steps:**
1. Create a free Upstash account
2. Create a Redis database (choose any region close to your users)
3. Copy REST URL and REST Token from the console

### F. Error Monitoring (recommended)

| Variable            | Where to get it                                                      | Usage                                |
|---------------------|----------------------------------------------------------------------|--------------------------------------|
| `SENTRY_DSN`        | https://sentry.io → Create Project → Next.js                         | `sentry.client.config.ts` etc.       |

- Create a Sentry account → Projects → Create Project → Select Next.js
- Copy the DSN (looks like `https://xxx@xxx.ingest.sentry.io/project-id`)

### G. Webhook / Cron Security

| Variable       | Where to get it                                        | Usage                                   |
|----------------|--------------------------------------------------------|-----------------------------------------|
| `CRON_SECRET`  | Run `openssl rand -hex 32` on your terminal            | `src/app/api/cron/settle/route.ts`      |

- Used to authenticate cron job calls (e.g., from Vercel Cron Jobs or GitHub Actions)

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

### J. Optional — Cloudflare R2 (Images & 3D Models)

| Variable                     | Where to get it                                                    | Usage                             |
|------------------------------|--------------------------------------------------------------------|-----------------------------------|
| `R2_ACCESS_KEY_ID`           | Cloudflare Dashboard → R2 → Manage API Tokens                     | Server-side file upload           |
| `R2_SECRET_ACCESS_KEY`       | Same page (shown once on creation)                                 | Server-side file upload           |
| `R2_BUCKET_NAME`             | R2 → Create Bucket (e.g. `orderworder`)                            | Storage bucket name               |
| `R2_ENDPOINT`                | R2 → Bucket → Properties (e.g. `https://xxx.r2.cloudflarestorage.com`) | S3-compatible endpoint         |
| `R2_PUBLIC_URL`              | R2 → Bucket → Public URL (e.g. `https://pub-xxxx.r2.dev`)          | Public CDN base URL               |
| `NEXT_PUBLIC_R2_MODELS_URL`  | `https://pub-xxxx.r2.dev/models/food`                              | Client-side 3D model loading      |

---

## 3. Vercel Deployment (recommended)

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
| `RAZORPAY_KEY_ID` | Production | Your Razorpay live key |
| `RAZORPAY_KEY_SECRET` | Production | Your Razorpay live secret |
| `RAZORPAY_ACCOUNT_NUMBER` | Production | For settlements |
| `STRIPE_SECRET_KEY` | Production | If using Stripe |
| `STRIPE_WEBHOOK_SECRET` | Production | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production | Stripe publishable key |
| `AI_GROQ_KEY` | Production | At least one AI key required |
| `ELEVENLABS_API_KEY` | Production | For voice features |
| `UPSTASH_REDIS_REST_URL` | Production | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Redis auth |
| `SENTRY_DSN` | Production | Error tracking |
| `CRON_SECRET` | Production | Cron auth |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://your-project.vercel.app` |
| `NEXT_PUBLIC_R2_MODELS_URL` | Production | If using 3D food viewer |

**Vercel automatically sets:**
- `NODE_ENV=production`
- `NEXT_PUBLIC_VERCEL_URL`

### Step 4: Deploy

Click **Deploy**. Vercel will build and deploy automatically.

### Step 5: Set up Stripe Webhook (if using Stripe)

After deployment:
1. Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-project.vercel.app/api/payment/stripe/webhook`
3. Events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy the signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel env vars
5. Redeploy

### Step 6: Set up Cron Jobs (for daily settlements)

In Vercel → Settings → Cron Jobs:
- **Path**: `/api/cron/settle`
- **Schedule**: Custom → `0 0 * * *` (daily midnight)
- **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`

OR use an external cron service (https://cron-job.org, https://healthchecks.io) to call:
```
https://your-project.vercel.app/api/cron/settle
Header: Authorization: Bearer YOUR_CRON_SECRET
```

---

## 4. Docker Deployment (Recommended for Self-Hosting)

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

### Demo Restaurant

After startup, seed the demo data:
```bash
curl http://localhost:3050/api/refreshDemoData
```

Demo credentials:
- Admin: `demo@orderworder.com` / `Demo@12345`
- Customer: Visit `http://localhost:3050/demo?table=T1`

## 5. Render Deployment (One-Click)

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

## 6. Self-hosted GlitchTip (Error Monitoring)

For zero-cost self-hosted error monitoring:
1. Deploy GlitchTip using their Docker Compose: https://glitchtip.com
2. Set `SENTRY_DSN` to your GlitchTip project DSN
3. The Sentry SDK speaks the same protocol — no code changes needed

## 7. OpenWA (Self-hosted WhatsApp)

For free self-hosted WhatsApp messaging:
1. Deploy OpenWA: https://github.com/open-wa/wa-automate
2. Set `OPENWA_API_URL` to your OpenWA instance URL
3. Optionally set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` for Meta Cloud API instead

## 8. BYOK (Bring Your Own AI Keys)

Each restaurant can override the global AI provider keys from the dashboard:
1. Go to Settings → AI Keys
2. Paste provider-specific API keys
3. Keys are stored per-tenant and are write-only (never returned in GET responses)

## 9. MongoDB Change Streams

For production, run MongoDB as a replica set:
- Atlas free tier is already a replica set — Change Streams work out of the box
- For self-hosted, configure a single-node replica set
- If Change Streams are unavailable, the app falls back to polling at 10s intervals

---

## 5. Post-Deployment Checklist

- [ ] Visit `https://your-domain/setup` — create the first restaurant profile
- [ ] Visit `https://your-domain/signup` — create your admin account
- [ ] Configure menu items at `https://your-domain/dashboard`
- [ ] Set up Razorpay/Stripe test keys → run a test payment
- [ ] Configure Stripe webhook in Stripe Dashboard
- [ ] Set up Vercel Cron Jobs for daily payout settlement
- [ ] (Optional) Configure n8n webhook URL for workflow automation
- [ ] (Optional) Set up WhatsApp Cloud API for order notifications
- [ ] Point your custom domain in Vercel → Domains
- [ ] Switch Razorpay/Stripe keys from test to live when ready
- [ ] Enable MongoDB Atlas IP whitelist (restrict to Vercel IPs) for production

---

## 6. CI/CD (GitHub Actions)

The repository includes `.github/workflows/ci.yml` that runs:

1. `pnpm install`
2. `pnpm lint` (Biome)
3. `pnpm typecheck` (TypeScript)
4. `pnpm test` (Jest)
5. `pnpm build`

To enable deployments on push, uncomment the `deploy` job in `.github/workflows/ci.yml` and add these repo secrets:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel → Team → Settings → ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → Project ID |

---

## Appendix: Quick Reference — All Environment Variables

```bash
# ─── Core (required) ───────────────────────────────
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/orderworder
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_URL=https://yourdomain.com

# ─── Payments (pick one or both) ─────────────────────
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

# ─── Voice ─────────────────────────────────────────
ELEVENLABS_API_KEY=xxx

# ─── Cache ─────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# ─── Error Monitoring ──────────────────────────────
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# ─── Optional integrations ──────────────────────────
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/xxx
N8N_WEBHOOK_SECRET=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx
CRON_SECRET=xxx
NEXT_PUBLIC_R2_MODELS_URL=https://pub-xxx.r2.dev/models/food
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```
