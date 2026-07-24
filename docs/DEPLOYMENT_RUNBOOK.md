# OrderWorder — Deployment Runbook (Section 8.5)

> **Canonical source of truth for env vars:** `.env.example` (repo root).
> **Canonical source of truth for security:** `docs/SECURITY_CHECKLIST.md`.
> Goal: clone → live in **< 30 minutes**.

This runbook walks a new operator from a fresh clone to a production deployment on Vercel with MongoDB Atlas, Upstash Redis, n8n, WhatsApp Cloud API, and Sentry. Optional integrations (Cloudflare R2, Stripe, Twilio) are flagged inline.

---

## Prerequisites

| Need | Why | Free-tier sufficient? |
|---|---|---|
| **Node.js 22.11+** + **bun 1.3+** (or **pnpm 11+**) | Runtime + package manager. `bun` is recommended — faster installs, used in the master prompt's verification commands. | Yes |
| **MongoDB Atlas** account + M0 cluster | Primary database (20 collections, hot-reload-safe models). | Yes (M0, 512 MB) |
| **Upstash Redis** database | Rate limiting, OTP cache, subdomain tenancy cache, idempotency keys. The code reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (NOT `REDIS_URL`). | Yes (10K cmds/day) |
| **Vercel** account | Hosting (Hobby tier is enough for a single restaurant). | Yes (Hobby) |
| **n8n Cloud or self-hosted n8n** | Phase 3 killer-feature workflow engine (commission saver, daily owner report, shift-short alert, feedback automation, weekly tip report). | Self-host = free; n8n Cloud = paid |
| **Meta WhatsApp Business Platform** | WhatsApp Cloud API for owner reports + customer notifications. | Yes (1K convos/mo free) |
| **Razorpay** account (India) | INR online payments. | Yes |
| **Stripe** account (optional) | USD payments + SaaS subscription billing (Pro/Enterprise plans). | Yes (test mode) |
| **Sentry** (or self-hosted GlitchTip) | Error monitoring. | Yes (5K events/mo) |
| **Cloudflare R2** (optional) | Menu images, logos, 3D models. Falls back to base64 in MongoDB if unset. | Yes (10 GB) |
| **GitHub** fork of the repo | Source control for Vercel auto-deploy. | Yes |

> **Local dev note:** you can boot the app with ONLY `MONGODB_URI`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and `NEXT_PUBLIC_URL` (and one AI key for Jarvis). Every other integration has a graceful in-memory or no-op fallback.

---

## Step 1 — Clone & install (~3 min)

```bash
git clone https://github.com/<your-fork>/Resturant.git
cd Resturant
bun install         # or: pnpm install
```

If `bun` is not installed: `curl -fsSL https://bun.sh/install | bash` (or use `pnpm install` — both `bun.lock` and `pnpm-lock.yaml` ship in the repo).

Verify the install is healthy:

```bash
bun run typecheck   # tsc --noEmit — zero errors
bun run lint        # biome check — zero warnings
```

---

## Step 2 — Copy `.env.example` → `.env.local` and fill in values (~5 min)

```bash
cp .env.example .env.local
$EDITOR .env.local
```

Fill in every value. Each entry in `.env.example` is annotated with `# Required: yes/no | Used by: <file> | Description`. The **minimum-viable** set is:

| Var | Value |
|---|---|
| `MONGODB_URI` | Atlas connection string (Step 6) |
| `NEXTAUTH_URL` | `http://localhost:3050` for dev; your Vercel domain for prod |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_URL` | same as `NEXTAUTH_URL` |
| `AI_GROQ_KEY` | from https://console.groq.com/keys |

Add the rest as you wire up integrations (Razorpay, Stripe, WhatsApp, n8n, Sentry, R2, etc.). See `.env.example` for the full canonical list with descriptions.

> **Critical:** The code reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — NOT `REDIS_URL`. If you set the wrong name, the app silently falls back to an in-memory cache (works on a single instance, breaks across Vercel serverless instances). The same applies to WhatsApp: use `OPENWA_API_URL` for self-hosted OpenWA, or `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` for Meta Cloud API — there is no `WHATSAPP_BASE_URL` or `WHATSAPP_API_KEY`.

---

## Step 3 — Seed demo data (~1 min)

```bash
bun run seed       # runs scripts/seed-demo.ts via tsx (idempotent upsert)
```

This creates the demo restaurant + menu + tables. To seed analytics demo data:

```bash
node scripts/seed-analytics.mjs   # 150 orders across 90 days for the demo restaurant
```

Demo credentials are seeded at first run and shown on the landing/login screen. **Rotate them immediately** before exposing the deployment publicly. Do NOT hardcode demo passwords in your docs or tickets — see `docs/DEPLOYMENT.md` "Appendix: Demo Credentials" (updated by Task 1-F to remove hardcoded passwords).

For multi-restaurant demos (Empire, BrewPoint, Spice Route, Spice Kitchen) use:

```bash
curl -X POST http://localhost:3050/api/refreshDemoData
```

> **Production safety:** `/api/refreshDemoData` returns 404 when `NODE_ENV === "production"`. `DEMO_MODE=true` enables the demo auth bypass in **non-production only** — it is hard-disabled in prod regardless of the env var.

---

## Step 4 — Run dev server (~30 s)

```bash
bun run dev        # → http://localhost:3050  (next dev -p 3050 per package.json scripts.dev)
```

Health check:

```bash
curl http://localhost:3050/api/health
# expect: {"status":"ok","checks":{"stripe":"ok"|"skip","razorpay":"ok"|"skip",...}}
```

> The dev port is **3050** (see `package.json` `scripts.dev`). The old `docs/DEPLOYMENT.md` claimed port 3000 — that was a documentation bug (audit finding G-02), now fixed. In production, Vercel manages the port; you do not set it.

Smoke tests:

- [ ] `http://localhost:3050/` — landing page
- [ ] `http://localhost:3050/signup` — 9-step wizard
- [ ] `http://localhost:3050/dashboard` — redirects to `/` (no session)
- [ ] `http://localhost:3050/demo?table=T1` — customer menu (requires demo data)

---

## Step 5 — Vercel deploy (~5 min)

### Push to GitHub

```bash
git add -A && git commit -m "Ready for production"
git push origin main
```

### Import on Vercel

1. https://vercel.com/new → import your GitHub fork.
2. **Framework Preset:** Next.js (auto-detected).
3. **Root Directory:** `./` (default).
4. **Build & Output Settings:**
   - Build command: `next build` (auto-detected — `package.json` `scripts.build`).
   - Output directory: `.next` (auto-detected).
   - Install command: `bun install` (or `pnpm install`).
5. **Environment Variables:** copy every value from your `.env.local` into Vercel → Project → Settings → Environment Variables. Mark `NEXTAUTH_SECRET`, `MONGODB_URI`, `CRON_SECRET`, `N8N_WEBHOOK_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET` as **Production only** (not Preview/Development). `NEXT_PUBLIC_URL` and `NEXTAUTH_URL` get the production domain (e.g. `https://your-app.vercel.app`).
6. **Deploy.** First build ≈ 3 min.

### `vercel.json` (already in repo)

The repo ships with a minimal `vercel.json` registering two cron jobs:

```json
{
  "crons": [
    { "path": "/api/cron/settle",   "schedule": "30 18 * * *" },
    { "path": "/api/cron/birthday",  "schedule": "30 3 * * *"  }
  ]
}
```

Vercel reads these automatically on deploy. Both endpoints require `Authorization: Bearer <CRON_SECRET>`. The cron **build/output/env-allow-list** is managed in Vercel's dashboard — there is no separate `vercel.json` env-allow-list (Vercel's model is "every env var you add is available to the build + runtime").

> **Build memory:** the Next.js build is memory-intensive (Turbopack + 20 Mongoose models). If Vercel Hobby OOMs, upgrade to Vercel Pro ($20/mo, 8 GB build memory) or build locally with `vercel build && vercel deploy --prebuilt`. The repo intentionally leaves `typescript.ignoreBuildErrors = true` in `next.config.ts` to avoid OOMs on low-memory builders; type errors are caught separately by `tsc --noEmit` in CI.

---

## Step 6 — MongoDB Atlas connect (~3 min)

1. https://cloud.mongodb.com → Create free **M0** cluster (any region close to your users + Vercel region).
2. **Security → Database Access:** add a database user (username + strong password). Save the password — you'll need it for the connection string.
3. **Security → Network Access:** add `0.0.0.0/0` (allow all — Vercel's egress IPs vary per request). For higher security on Vercel Pro+, use Vercel's static IPs (Pro feature) and restrict Atlas to those.
4. **Database → Connect → Drivers:** copy the connection string. Replace `<password>` with your user's password and `<dbname>` with `orderworder`.
5. Paste into `.env.local` / Vercel env vars as `MONGODB_URI`.

Verify:

```bash
bun run seed    # if this connects and seeds, MONGODB_URI is correct
```

---

## Step 7 — Upstash Redis (~2 min)

1. https://console.upstash.com → Create Redis database (any region close to your app).
2. Copy the **REST URL** (looks like `https://xxx-xxx.upstash.io`) → set as `UPSTASH_REDIS_REST_URL`.
3. Copy the **REST Token** → set as `UPSTASH_REDIS_REST_TOKEN`.
4. In Upstash's "Allowed IP" setting, add `0.0.0.0/0` for Vercel (or restrict to Vercel's static IPs on Pro+).

Verify:

```bash
curl http://localhost:3050/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"restaurant":"demo","phone":"+919876543210"}'
# expect a 200 response; in dev mode the response body includes "debugOtp"
```

> **DO NOT** use `REDIS_URL`. The code reads `UPSTASH_REDIS_REST_URL` only (see `src/utils/database/redis.ts`). Without Upstash configured, the app falls back to an in-memory LRU cache — fine for single-instance dev, broken for multi-instance prod (rate limits and OTP cache won't be shared across Vercel serverless instances).

---

## Step 8 — n8n workflows import (~5 min)

The 5 Phase-3 n8n workflow JSONs live in `docs/n8n/`:

| File | Purpose |
|---|---|
| `commission_saver.json` | D+3 WhatsApp offer to QR-acquired customers |
| `owner_daily_report.json` | 11 PM IST owner WhatsApp daily summary |
| `shift_short_alert.json` | Cashier shift-shortfall instant owner alert |
| `feedback_automation.json` | Post-pay rating link + negative-feedback owner alert + refund-code delivery |
| `tip_weekly_report.json` | Weekly per-waiter tip total via WhatsApp |

### Import steps (n8n Cloud)

1. Open your n8n Cloud instance → **Workflows** → **Import from File**.
2. Import each of the 5 JSON files.
3. In each workflow, open the **HTTP Request** nodes that point to `={{ $env.ORDERWORDER_API }}/...` and ensure the **Generic Credential Type** for WhatsApp Cloud API is bound (see `docs/n8n/README.md`).
4. Activate each workflow.

### Required n8n env vars (set in n8n Cloud → Settings → Variables)

| Var | Value |
|---|---|
| `ORDERWORDER_API` | Your deployment origin, e.g. `https://your-app.vercel.app` |
| `N8N_WEBHOOK_SECRET` | Same value as `N8N_WEBHOOK_SECRET` in the app's `.env` (HMAC shared secret) |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Cloud API Phone Number ID |
| `PUBLIC_URL` | Same as `ORDERWORDER_API` (used in feedback link templates) |

See `docs/n8n/README.md` for full setup, test-fire steps, and the webhook-secret rotation procedure.

---

## Step 9 — WhatsApp templates submission (~5 min to submit; 1–48 h to approve)

Submit the 6 templates in Meta WhatsApp Manager for approval. Until approved, the n8n workflows that send template messages will fail at the Meta API call.

The 6 templates (full body text, parameter order, category, and submission steps are in `docs/WHATSAPP_TEMPLATES.md`):

| Template | Category | Language |
|---|---|---|
| `direct_order_offer` | UTILITY | en |
| `daily_owner_report` | UTILITY | en |
| `shift_short_alert` | UTILITY | en |
| `rate_your_visit` | UTILITY | en |
| `negative_feedback_alert` | UTILITY | en |
| `refund_code` | UTILITY | en |

> All 6 are marked **"To be submitted"** in `docs/WHATSAPP_TEMPLATES.md` until you submit them. Submission status is tracked there.

---

## Step 10 — Sentry DSN config + test error capture (~2 min)

1. https://sentry.io → Create Project → Next.js. Copy the DSN.
2. Set `SENTRY_DSN` in `.env.local` and Vercel env vars (Production).
3. Sentry initializes only when `NODE_ENV === "production"` (see `sentry.{client,edge,server}.config.ts`).
4. **Test capture** — add a temporary route or trigger an error:

   ```bash
   # In prod, visit a URL that throws (e.g., /api/health?fail=1 if such a debug path exists)
   # Or use Sentry's built-in test:
   curl https://your-domain.vercel.app/api/health
   ```

   If you don't yet have a forced-error endpoint, add a one-line throw in a sandbox route, deploy, hit it, confirm the event lands in Sentry, then revert. Or use `Sentry.captureException(new Error("test"))` in a route you already trust.

5. Verify the event appears in Sentry's Issues view.

> **Self-hosted alternative:** GlitchTip is Sentry-protocol-compatible. Set `SENTRY_DSN` to your GlitchTip project DSN — no code changes needed.

---

## Step 11 — Webhook URLs (~3 min per provider)

Register these webhook URLs in each provider's dashboard:

| Provider | URL | Event(s) | Shared secret |
|---|---|---|---|
| **Razorpay** | `https://<your-domain>/api/payment/webhook` | `payment.captured`, `payment.failed` | `RAZORPAY_WEBHOOK_SECRET` |
| **Stripe** (payments) | `https://<your-domain>/api/payment/stripe/webhook` | `checkout.session.completed`, `payment_intent.succeeded` | `STRIPE_WEBHOOK_SECRET` |
| **Stripe** (SaaS billing) | `https://<your-domain>/api/billing/webhook` | `customer.subscription.*`, `invoice.*` | `STRIPE_WEBHOOK_SECRET` (separate endpoint) |
| **n8n inbound** | `https://<your-domain>/api/webhooks/n8n` | All n8n → app callbacks | `N8N_WEBHOOK_SECRET` (HMAC `X-N8N-Signature` header) |

All webhook routes are CSRF-exempt (see `middleware.ts` `CSRF_EXEMPT_PATHS`) and verify HMAC signatures via **constant-time** `timingSafeEqual` (no string equality).

---

## Step 12 — Verify the hash-chain audit log (~30 s)

The hash-chain audit log (Phase 2, Task 2-C) is the product's tamper-proof guarantee. Verify it after first deploy:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://<your-domain>/api/audit-chain/verify
# expect: {"ok":true,"chainLength":<N>,"lastSequenceNo":<N>,"verifiedAt":"<ISO>"}
```

If `ok: false`, the response includes `brokenAtSequenceNo` — investigate immediately. The nightly verification cron also runs this check and fires a `compliance.chain_broken` n8n alert to the owner + CA. See `docs/SECURITY_CHECKLIST.md` for the full chain architecture.

---

## Troubleshooting

### "MongoDB connection timeout"
**Cause:** Atlas IP allowlist excludes your hosting provider's egress IP.
**Fix:** Atlas → Network Access → add `0.0.0.0/0` for Vercel (egress IPs vary per request). For tighter security on Vercel Pro+, use Vercel's static IPs.

### "Redis URL typo — rate limits not shared"
**Cause:** You set `REDIS_URL` instead of `UPSTASH_REDIS_REST_URL` (or vice-versa). The code only reads the latter.
**Fix:** Verify the env var name is **exactly** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (see `src/utils/database/redis.ts:11-12`). The `@upstash/redis` client speaks REST, so the URL is `https://...` — NOT `rediss://...`.

### "CSP violations in browser console"
**Cause:** A third-party script is trying to load outside the CSP allow-list (e.g., a new payment SDK).
**Fix:** CSP is set per-request in `middleware.ts` `buildCsp()` (NOT in `next.config.ts`). For dev, the policy is permissive (`unsafe-eval`, `unsafe-inline`, all HTTPS). For prod, it's strict nonce-based with `strict-dynamic`. If you need to add a host (e.g., a new payment provider's frame), add it to the `frame-src` array in `buildCsp()` and redeploy. Do NOT add `'unsafe-inline'` to `script-src` in prod — use nonces.

### "Demo login works in production"
**Cause:** You set `DEMO_MODE=true` in production.
**Fix:** This is a hard-disabled path — see `src/utils/helper/authHelper.ts:81`: `isDemo = cred?.restaurant === "demo" && process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true"`. The `NODE_ENV !== "production"` check means demo auth can NEVER work in prod, regardless of `DEMO_MODE`. Set `DEMO_MODE=false` (or unset) in production anyway to disable `/api/refreshDemoData`.

### "WhatsApp messages silently no-op"
**Cause:** `WHATSAPP_ACCESS_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` is unset; or you set the legacy `WHATSAPP_BASE_URL` / `WHATSAPP_API_KEY` vars (which the code does NOT read).
**Fix:** Use `OPENWA_API_URL` for self-hosted OpenWA, OR `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` for Meta Cloud API (see `src/utils/whatsapp/meta.ts:8-9`). Verify with `curl http://localhost:3050/api/whatsapp/send -X POST ...`.

### "Build fails on Vercel with 'memory exceeded'"
**Cause:** Next.js build is memory-intensive (Turbopack + 20 Mongoose models).
**Fix:** Upgrade to Vercel Pro ($20/mo, 8 GB build memory) OR build locally and deploy with `vercel deploy --prebuilt`. The repo intentionally sets `typescript.ignoreBuildErrors = true` in `next.config.ts` to avoid OOMs; type errors are caught by `tsc --noEmit` in CI.

### "SSE connection drops every 30 seconds"
**Cause:** Vercel Hobby caps function runtime at 10s; SSE needs long-lived connections.
**Fix:** Upgrade to Vercel Pro (300s timeout) OR rely on the client's exponential backoff (1s → 2s → 4s → … → 30s cap). The SSE route (`src/app/api/order/stream/route.ts`) uses change-stream + 15s heartbeat (no polling interval — that was audit finding D-01, fixed by Task 1-B).

### "n8n inbound webhook returns 401 invalid_signature"
**Cause:** `N8N_WEBHOOK_SECRET` in n8n differs from the app, OR n8n is sending the signature in the wrong header.
**Fix:** Both sides must use **the exact same** `N8N_WEBHOOK_SECRET`. The app's `/api/webhooks/n8n/route.ts` reads the signature from the `x-n8n-signature` header (lowercase). Verify with `curl`:

```bash
SECRET="your-shared-secret"
BODY='{"eventType":"test","eventId":"test-1","data":{}}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')
curl -X POST https://<your-domain>/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-n8n-signature: $SIG" \
  -H "x-request-id: test-1" \
  -d "$BODY"
# expect: {"ok":true}
```

### "Hash-chain audit log shows CHAIN BROKEN AT #N"
**Cause:** A direct DB write bypassed the chain (e.g., a manual `db.collection.updateOne` on `billAuditChain`), OR the append-only pre-delete hook was disabled.
**Fix:** Do NOT attempt to "fix" the chain in place. Investigate via `db.billAuditChain.find({ sequenceNo: { $gte: N-1, $lte: N+1 } })`, identify the tampering actor (chain entries record `actorId` + `actorRole`), and escalate to the owner + CA. The chain is append-only by design — even a DB admin cannot silently mutate it (the pre-delete hook throws).

---

## Post-deploy verification checklist

- [ ] `https://<your-domain>/api/health` → `{"status":"ok"}`
- [ ] `https://<your-domain>/api/audit-chain/verify` → `{"ok":true}` (with `Authorization: Bearer $CRON_SECRET`)
- [ ] Landing page (`/`) loads
- [ ] Signup wizard (`/signup`) completes end-to-end
- [ ] Demo restaurant (`/demo?table=T1`) — customer menu renders, cart works, order places
- [ ] Dashboard (`/dashboard`) — all 7 tabs render (Overview, Orders, Analytics, Invoices, Loyalty, Campaigns, Settings)
- [ ] KDS (`/kitchen`) — real-time order updates via SSE
- [ ] Razorpay webhook delivered + verified (test mode)
- [ ] Stripe webhook delivered + verified (test mode)
- [ ] n8n inbound webhook receives 200 `{"ok":true}` from `/api/webhooks/n8n`
- [ ] Sentry test error captured
- [ ] `DEMO_MODE=false` in production env vars
- [ ] `NEXT_PUBLIC_URL` and `NEXTAUTH_URL` match your real domain (no `localhost`)
- [ ] MongoDB Atlas IP allowlist includes your hosting provider IPs (or `0.0.0.0/0` for Vercel)
- [ ] Upstash Redis allows your hosting provider IPs
- [ ] All webhook secrets rotated from their initial values
- [ ] **GitHub PAT used to push the code REVOKED** (see `docs/SECURITY_CHECKLIST.md` "Post-launch token rotation")

---

## Next steps

- `docs/SECURITY_CHECKLIST.md` — the full security posture (hash chain, OWASP Top 10, secrets policy).
- `docs/WHATSAPP_TEMPLATES.md` — exact WhatsApp template bodies for Meta submission.
- `docs/EINVOICE_GO_LIVE.md` — NIC e-invoice sandbox → prod go-live.
- `docs/n8n/README.md` — n8n workflow import + test-fire steps.
- `docs/AUDIT_REMEDIATION_TRACKER.md` — full audit-remediation status.
