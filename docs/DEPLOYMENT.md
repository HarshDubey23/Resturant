# OrderWorder — Deployment Guide

This guide walks you through deploying OrderWorder to production in under 30 minutes. The app is a Next.js 16 app with MongoDB, Redis, and optional Cloudflare R2 for image storage.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Customer (phone browser)                                    │
│   └─ scans QR → /{restaurant}?table={id}                     │
│       └─ OTP login → browse menu → place order → track       │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  Next.js 16 app (Vercel / Render / Docker)                   │
│   ├─ /signup       — 9-step restaurant onboarding wizard     │
│   ├─ /dashboard    — owner admin (7 tabs)                    │
│   ├─ /kitchen      — kitchen display system (KDS)            │
│   ├─ /{restaurant} — customer menu + cart + chat             │
│   ├─ /order/success — post-order success + invoice download  │
│   └─ /api/*        — 40+ REST endpoints                      │
└──────────────────────────────────────────────────────────────┘
         ↓              ↓                ↓              ↓
   ┌─────────┐   ┌──────────┐    ┌────────────┐   ┌──────────┐
   │ MongoDB │   │  Redis   │    │ Cloudflare │   │  WhatsApp│
   │  Atlas  │   │ (Upstash)│    │     R2     │   │  (OpenWA)│
   │         │   │          │    │            │   │          │
   │ 19 cols │   │ OTP +    │    │ Menu +     │   │ Order    │
   │          │   │ rate lim │    │ logo imgs  │   │ alerts   │
   └─────────┘   └──────────┘    └────────────┘   └──────────┘
```

### Required services
| Service | Purpose | Free tier? | Required? |
|---|---|---|---|
| **MongoDB Atlas** | Primary database (19 collections) | Yes (512 MB) | ✅ Yes |
| **Upstash Redis** | OTP storage, rate limiting, session cache | Yes (10K cmds/day) | ✅ Yes (for OTP) |
| **Cloudflare R2** | Image storage (menu items, logos, covers) | Yes (10 GB) | ⚠️ Optional (falls back to data URLs) |
| **WhatsApp OpenWA** | Send OTP + order alerts via WhatsApp | Self-hosted | ⚠️ Optional (OTP falls back to in-app display in dev) |
| **Razorpay / Stripe** | Online payments | Yes | ⚠️ Optional (cash payments work without it) |
| **Groq / Gemini** | AI chat recommendations | Yes (Groq: free tier) | ⚠️ Optional (rule-based fallback) |

---

## Option A — Deploy to Vercel (recommended, 10 minutes)

### Prerequisites
- A [Vercel account](https://vercel.com/signup) (free).
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (M0 free tier is fine for demo).
- An [Upstash Redis](https://upstash.com/) database (free tier).
- The GitHub repo forked to your account.

### Steps

1. **Fork the repo** on GitHub (top-right "Fork" button).

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your forked repo.
   - Framework preset: **Next.js** (auto-detected).
   - Root directory: `./` (default).
   - Build command: `next build` (auto-detected).
   - Output: leave blank (Vercel handles it).

3. **Set environment variables** (see `.env.example` below for the full list):
   - In the Vercel project settings → Environment Variables.
   - Add each variable. Mark `NEXTAUTH_SECRET`, `MONGODB_URI`, `REDIS_URL` as "Production" only.

4. **Deploy.** First build takes ~3 minutes.

5. **Set `NEXT_PUBLIC_URL`** to your Vercel domain (e.g. `https://your-app.vercel.app`) — this is critical for QR code generation.

6. **Seed demo data** (optional):
   - Run locally: `MONGODB_URI=<your-atlas-uri> pnpm seed`
   - This creates 4 demo restaurants (Spice Route, Empire, BrewPoint, The Spice Kitchen) with menus, tables, and sample orders.

7. **Test the deployment:**
   - Visit `https://your-app.vercel.app/` — the marketing landing should load.
   - Visit `https://your-app.vercel.app/signup` — the wizard should work end-to-end.
   - Visit `https://your-app.vercel.app/demo` — the demo restaurant's customer menu.

---

## Option B — Deploy to Render (with Docker, 20 minutes)

Use this if you want a single-container deployment or need a non-Vercel host.

### Prerequisites
- A [Render account](https://render.com/).
- Same MongoDB + Redis as Option A.

### Steps

1. **Fork the repo** on GitHub.

2. **Create a new Web Service on Render:**
   - Connect your GitHub account and select the forked repo.
   - Environment: **Docker** (the repo ships a `Dockerfile`).
   - Region: closest to your customers.
   - Instance type: **Free** for demo, **Starter ($7/mo)** for production.
   - Health check path: `/api/health`.

3. **Set environment variables** in Render's dashboard (same list as Vercel).

4. **Deploy.** First build takes ~5 minutes (Docker image build).

5. **Configure custom domain** (optional): Settings → Custom Domain → add your domain + DNS records.

6. **Set `NEXT_PUBLIC_URL`** to your Render URL (e.g. `https://your-app.onrender.com`).

The included `render.yaml` file lets you deploy with one click via [Render Blueprint](https://render.com/docs/blueprints).

---

## Option C — Self-host with Docker Compose (15 minutes)

For owners who want everything on their own VM (e.g. DigitalOcean droplet, AWS EC2).

### Prerequisites
- A Linux VM with Docker + Docker Compose installed.
- A domain name pointing to the VM's IP.
- SSL certificate (use [Caddy](https://caddyserver.com/) or nginx + Let's Encrypt).

### Steps

1. **Clone the repo** to the VM:
   ```bash
   git clone https://github.com/your-username/Resturant.git
   cd Resturant
   ```

2. **Uncomment `output: "standalone"` in `next.config.ts`:**
   ```ts
   const nextConfig = {
     output: "standalone",  // ← required for Docker
     // ... rest
   };
   ```

3. **Create `.env.local`** (see full list below).

4. **Build and start:**
   ```bash
   docker compose up -d --build
   ```

5. **Verify:** Visit `http://your-vm-ip:3000/api/health` — should return `{"status":"ok"}`.

6. **Set up a reverse proxy** (Caddy example):
   ```
   yourdomain.com {
     reverse_proxy localhost:3000
   }
   ```

---

## Environment Variables

Create a `.env.local` file (or set these in your hosting platform's dashboard):

```bash
# ─── Core ─────────────────────────────────────────────────────────
NEXT_PUBLIC_URL=https://yourdomain.com          # CRITICAL: QR codes encode this URL
NEXTAUTH_SECRET=your-random-32-char-secret       # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://yourdomain.com              # Same as NEXT_PUBLIC_URL

# ─── Database ─────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/orderworder

# ─── Redis (OTP + rate limiting) ──────────────────────────────────
REDIS_URL=rediss://default:password@cluster.upstash.io:6379

# ─── Demo mode ────────────────────────────────────────────────────
DEMO_MODE=true    # Skips OTP for the "demo" restaurant in non-prod. Set to false in prod.

# ─── Optional: Image storage ──────────────────────────────────────
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret
R2_BUCKET=orderworder

# ─── Optional: WhatsApp (OpenWA) ──────────────────────────────────
WHATSAPP_BASE_URL=http://your-openwa-instance:3000
WHATSAPP_API_KEY=your-openwa-api-key

# ─── Optional: Payments ───────────────────────────────────────────
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# ─── Optional: AI providers (owner sets per-tenant in dashboard) ──
# These are NOT env vars — owners paste keys in Settings → AI Keys per restaurant.

# ─── Optional: Error tracking ─────────────────────────────────────
SENTRY_DSN=https://...@sentry.io/...
```

### Critical variables (must set before first deploy)
- `NEXT_PUBLIC_URL` — without this, QR codes point to `localhost`.
- `NEXTAUTH_SECRET` — without this, sessions don't work.
- `MONGODB_URI` — without this, nothing works.
- `REDIS_URL` — without this, customer OTP login fails (but demo mode still works).

---

## Post-Deploy Verification

Run through this checklist after your first deploy:

### Smoke tests
- [ ] `https://yourdomain.com/` loads the marketing landing page.
- [ ] `https://yourdomain.com/signup` loads the 9-step wizard.
- [ ] `https://yourdomain.com/dashboard` redirects to `/` (no session).
- [ ] `https://yourdomain.com/kitchen` redirects to `/` (no session).
- [ ] `https://yourdomain.com/api/health` returns `{"status":"ok"}`.

### End-to-end test
- [ ] Sign up a test restaurant via `/signup` (use a fake name like "Test Bistro").
- [ ] After signup, the success screen shows QR codes.
- [ ] Click "Enter dashboard" → all 7 tabs render without errors.
- [ ] Settings → Tables → "Add Table" works → QR code appears.
- [ ] Settings → Menu → "Add Item" works → item appears in list.
- [ ] Visit `https://yourdomain.com/test-bistro?table=T1` → customer menu loads.
- [ ] Add items to cart → click "Place Order" → login modal opens.
- [ ] (Demo mode) Login completes instantly → place order → success screen shows.
- [ ] Back on dashboard → Orders → Requests → the order appears.
- [ ] Accept the order → moves to Active.
- [ ] Complete the order → moves to History.
- [ ] Invoices tab → invoice appears → PDF downloads.

### Production-only checks
- [ ] `DEMO_MODE=false` in env vars.
- [ ] `NEXT_PUBLIC_URL` matches your real domain (no `localhost`).
- [ ] MongoDB Atlas IP allowlist includes your hosting provider's IPs (or `0.0.0.0/0` for Vercel).
- [ ] Upstash Redis allows your hosting provider's IPs.
- [ ] Stripe/Razorpay webhooks point to `https://yourdomain.com/api/payment/webhook` (or stripe/webhook).
- [ ] Sentry is receiving events (trigger a test error).

---

## Scaling Notes

### When you outgrow the free tier
| Threshold | Action |
|---|---|
| 500+ orders/day | Upgrade MongoDB Atlas to M10 ($60/mo) for dedicated RAM. |
| 5+ restaurants | Upgrade Upstash Redis to Pay-As-You-Go ($1/mo base). |
| 50+ concurrent KDS viewers | Move to a dedicated Vercel Pro plan or self-host with Docker. |
| 10K+ images | Upgrade Cloudflare R2 or move to S3 + CloudFront. |

### Performance characteristics
- **Customer menu load:** < 2s on 2G ( Next.js Image Optimization + ISR).
- **Dashboard initial load:** ~3s (SWR-cached profile + menus + tables).
- **Order placement → kitchen alert:** < 1s (SSE push, falls back to 10s polling).
- **QR code generation:** ~50ms per table (client-side via `qrcode` library).

---

## Backup & Recovery

### MongoDB Atlas
- Enable **daily snapshots** in Atlas → Cluster → Backup.
- Set a 7-day retention window (free for M0+, $2.50/mo for M10+).
- Test a restore quarterly into a staging cluster.

### Manual exports
- Menu + orders CSV export from the dashboard (Settings → Account → "Export data").
- Image backup: sync R2 bucket to S3 monthly with `aws s3 sync`.

### Disaster recovery
- RPO: 24 hours (daily Atlas snapshots).
- RTO: 2 hours (provision new cluster, restore snapshot, redeploy app).

---

## Troubleshooting

### "QR codes point to localhost"
**Cause:** `NEXT_PUBLIC_URL` not set or set to `localhost`.
**Fix:** Set `NEXT_PUBLIC_URL=https://yourdomain.com` in env vars and redeploy. Existing QR codes are regenerated automatically on the next dashboard load.

### "Customer login fails with 'OTP verification is required'"
**Cause:** Either `DEMO_MODE=false` and Redis isn't configured, OR the customer is trying to log in to a non-demo restaurant without going through OTP.
**Fix:**
1. Verify `REDIS_URL` is set and reachable.
2. Test with: `redis-cli -u $REDIS_URL ping` → should return `PONG`.
3. Check the `/api/auth/send-otp` endpoint directly with curl:
   ```bash
   curl -X POST https://yourdomain.com/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"restaurant":"demo","phone":"+919876543210"}'
   ```
   Should return `{"delivered": false, "debugOtp": "123456"}` in dev mode.

### "Build fails on Vercel with 'memory exceeded'"
**Cause:** The Next.js build is memory-intensive (19 collections × Mongoose models × Turbopack).
**Fix:**
1. Upgrade to Vercel Pro ($20/mo) for 8 GB build memory, OR
2. Set `NEXT_BUILD_MEMORY_LIMIT=4096` in env vars, OR
3. Build locally and deploy with `vercel deploy --prebuilt`.

### "SSE connection drops every 30 seconds"
**Cause:** Vercel's default function timeout is 10s (Hobby) / 60s (Pro). SSE needs long-lived connections.
**Fix:**
1. Upgrade to Vercel Pro.
2. Set `maxDuration: 300` in the SSE route file:
   ```ts
   export const maxDuration = 300;  // 5 minutes
   ```
3. The client already has exponential backoff (1s → 2s → 4s → ... → 30s cap), so brief drops are self-healing.

### "Kitchen display shows stale orders"
**Cause:** SSE not reconnecting after a network blip.
**Fix:**
1. Refresh the KDS page.
2. Check browser console for `EventSource` errors.
3. If using an ad blocker, whitelist your domain (uBlock Origin blocks EventSource by default).

---

## Security Checklist

Before going live with real customer data:

- [ ] `NEXTAUTH_SECRET` is a unique 32+ char random string (not the default).
- [ ] `DEMO_MODE=false` in production.
- [ ] MongoDB Atlas has auth enabled and IP allowlist (not `0.0.0.0/0` unless on Vercel).
- [ ] Redis requires a password.
- [ ] Stripe/Razorpay webhooks verify signatures (the included routes do this).
- [ ] HTTPS is enforced (Vercel/Render do this automatically; for self-hosted, use Caddy).
- [ ] Rate limiting is active (the `/api/auth/send-otp` route enforces 5/hour/phone + 10/hour/IP).
- [ ] CSP headers are set (see `next.config.ts` for the included policy).
- [ ] Sentry is capturing errors (set `SENTRY_DSN`).
- [ ] Customer phone numbers are verified via OTP before any order is placed.

---

## Updating the Deployment

### To pull the latest changes
1. `git pull origin main` locally.
2. Push to your fork: `git push origin main`.
3. Vercel/Render auto-deploys on push.

### To run database migrations
The app uses Mongoose's auto-sync (no manual migrations needed for schema changes). For data migrations:
1. Write a one-off script in `scripts/`.
2. Run locally with `npx tsx scripts/your-migration.ts`.

### To roll back a deploy
- **Vercel:** Project → Deployments → click "Instant Rollback" on the previous deploy.
- **Render:** Manual — re-deploy the previous commit SHA.
- **Docker:** `docker compose down && docker compose up -d --build <previous-tag>`.

---

## Getting Help

- **Bugs:** Open an issue on GitHub.
- **Feature requests:** Open a discussion on GitHub.
- **Security issues:** Email security@yourdomain.com (do not open a public issue).
- **Onboarding help:** See `docs/DEMO.md` for the live demo playbook.
