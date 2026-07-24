# OrderWorder — Security Checklist (Sections 1.3 + 9)

> **Canonical source of truth for env vars:** `.env.example`.
> **Canonical source of truth for deployment:** `docs/DEPLOYMENT_RUNBOOK.md`.
> **Audit remediation tracker:** `docs/AUDIT_REMEDIATION_TRACKER.md`.

This document is the security posture of OrderWorder under "Operation Tamper-Proof." It is the operator-facing companion to the master prompt's Section 9 mandates.

---

## 1. The Hash-Chain Audit Log (the product's identity)

> Every revenue-affecting action — bill create, edit, void, refund, shift close, stock adjustment, wastage — appends to the chain. The chain is append-only, nightly-verified, and its "verified ✓" status is visible to the owner and the CA. **This is not a feature; it is the product's identity.** Market it as *"the POS that cannot lie."*

### 1.1 Architecture

| Component | File | Purpose |
|---|---|---|
| Chain collection | `src/utils/database/models/billAuditChain.ts` (Phase 2, Task 2-C) | Each entry: `{ _id, billId, restaurantID, sequenceNo, prevHash, payloadHash, hash, actorRole, actorId, action, timestamp }` |
| Append helper | `src/utils/helper/auditChain.ts` (Phase 2, Task 2-C) `appendAuditChain({ billId, restaurantID, actorRole, actorId, action, payload })` | Computes `payloadHash = sha256(canonicalBillSnapshot)`, then `hash = sha256(prevHash + payloadHash + sequenceNo + restaurantID + timestamp)`, then inserts. Uses the previous entry's `hash` as `prevHash` (linked list). |
| Verify helper | `src/utils/helper/auditChain.ts` `verifyAuditChain(restaurantID, fromSeq?)` | Re-walks the chain from genesis (or `fromSeq`), recomputes each `hash`, returns `{ ok: boolean, brokenAt?: number, length: number }`. |
| Verify endpoint | `src/app/api/audit-chain/verify/route.ts` (Phase 2, Task 2-C) | `GET /api/audit-chain/verify` (admin-only or `Bearer $CRON_SECRET`) → `{"ok":true,"chainLength":N,"lastSequenceNo":N,"verifiedAt":"<ISO>"}` |
| Append-only enforcement | Pre-delete hook on `billAuditChain` schema | `schema.pre("deleteOne", …)`, `schema.pre("deleteMany", …)`, `schema.pre("findOneAndDelete", …)`, `schema.pre("updateOne", …)` all throw `new Error("billAuditChain is append-only")`. No updates, no deletes — ever. |
| Nightly verification | Inngest job OR n8n cron (Phase 2, Task 2-C) | Calls `verifyAuditChain()` for every active restaurant; on `ok:false` fires `compliance.chain_broken` n8n alert → owner WhatsApp + CA email. |
| UI surface | `src/app/dashboard/_components/Settings/SettingsAuditChain.tsx` (Phase 2, Task 2-C) | Settings → Audit Chain: paginated chain view (filterable by bill), green "Chain verified ✓" badge or red "CHAIN BROKEN AT #N" banner, manual "Re-verify" button. |

### 1.2 What appends to the chain

Every state transition on a bill:

| Action | Trigger | Chain entry `action` |
|---|---|---|
| Bill created | `/api/invoice/generate` finalize | `bill.create` |
| Bill edited (with reason) | `/api/invoice/[id]` PATCH | `bill.edit` |
| Bill voided (with reason + 2nd authorizer) | `/api/invoice/[id]/void` POST | `bill.void` |
| Bill refund issued | `/api/payment/refund` POST | `bill.refund` |
| Shift closed (Z report) | `/api/cashier/shift/close` POST | `shift.close` |
| Stock adjustment (stock-in, wastage, physical count) | Settings → Inventory | `stock.adjust` |
| Refund code generated (Phase 3) | `/api/refund/generate-code` POST | `refund.code_issued` |

### 1.3 Tamper detection

If any entry is mutated or deleted in MongoDB directly (bypassing the app), the nightly `verifyAuditChain()` will detect that `recomputedHash !== stored.hash` for that entry and every subsequent entry, fire `compliance.chain_broken`, and the Settings → Audit Chain UI shows a red banner. The pre-delete hooks prevent legitimate app code from deleting entries — even a DB admin with `db.collection.deleteOne` access would need to drop the entire collection (which is a detectable, auditable event in Atlas audit logs).

### 1.4 Operator verification

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://<your-domain>/api/audit-chain/verify
# expect: {"ok":true,"chainLength":<N>,"lastSequenceNo":<N>,"verifiedAt":"<ISO>"}
```

If `ok:false`, the response includes `brokenAtSequenceNo`. Investigate via `db.billAuditChain.find({ sequenceNo: { $gte: N-1, $lte: N+1 } })` to identify the tampering actor (each entry records `actorId` + `actorRole` + `action` + `timestamp` + `ipAddress`). Escalate to owner + CA immediately. The chain is append-only by design — you cannot "fix" it in place.

---

## 2. No-Delete Mode (the PetPooja antithesis)

### 2.1 Setting

`profile.settings.noDeleteMode: boolean` (default `true` for new accounts — tamper-proof by default).

Located on the restaurant `profile` document (`src/utils/database/models/profile.ts`, extended by Task 2-C).

### 2.2 Behavior when ON

- The "Delete bill" UI action is removed from the dashboard.
- All bill-delete API routes return `403 Forbidden` with `{ error: "no_delete_mode_enabled" }`.
- A bill can only be **voided** (never deleted), and voiding requires:
  1. A **reason code** (enum: `customer_cancelled`, `service_error`, `duplicate`, `test`, `other` with mandatory note).
  2. A **second authorized role** (manager+ or admin — not the original bill creator).
  3. A **hash-chain entry** (`action: bill.void`).
- Voided bills remain in the DB, marked `state: "voided"`, visible in the Invoices tab with a red "VOID" badge.

### 2.3 Toggle behavior

Toggling `noDeleteMode` OFF is a high-risk action. The toggle itself:

1. Is hash-chained (`action: no_delete_mode.disabled`).
2. Fires a `compliance.no_delete_disabled` n8n alert to **owner + CA** (instant WhatsApp + email).
3. Requires **2FA confirmation** — an OTP sent to the owner's phone (reuses the existing OTP flow at `/api/auth/send-otp`), entered in a modal before the toggle commits.

This is the asymmetric moat: a malicious or coerced owner cannot silently disable tamper-proofing. The CA always knows.

---

## 3. OWASP Top 10 (2021) controls — mapped to code

| OWASP | Control | Code location |
|---|---|---|
| **A01 — Broken Access Control** | Every admin/cashier/internal API route checks role via `requirePermission` / `withPermission` from `#utils/helper/rbac.ts`. Roles: owner, manager, captain, waiter, chef, kitchen, customer, admin. New `/api/internal/*` routes (Phase 3) verify `N8N_WEBHOOK_SECRET` via constant-time HMAC. | `src/utils/helper/rbac.ts`, `src/app/api/webhooks/n8n/route.ts`, `src/app/api/internal/*/route.ts` |
| **A02 — Cryptographic Failures** | bcrypt (cost 10) for password hashing (`src/utils/helper/passwordHelper.ts`); SHA-256 for the audit chain (`src/utils/helper/auditChain.ts`); HMAC-SHA256 for webhook signatures; `ENCRYPTION_SECRET` for tenant-level field encryption (`src/utils/helper/crypto.ts`). No plaintext PII in logs. | `src/utils/helper/{passwordHelper,auditChain,crypto}.ts` |
| **A03 — Injection** | Mongoose queries use typed fields; no `$where` with user input. All user-provided HTML is sanitized via `sanitizeHtml` (DOMPurify-based) before storage or render. | `src/utils/helper/sanitizeHtml.ts`, all `models/*.ts` |
| **A04 — Insecure Design** | The no-delete mode, hash chain, and shift-Z lock are secure-by-default. `noDeleteMode` defaults to `true` for new accounts. | `src/utils/database/models/profile.ts`, `src/utils/helper/auditChain.ts` |
| **A05 — Security Misconfiguration** | CSP set per-request in `middleware.ts` `buildCsp()` (NOT in `next.config.ts`). Prod policy is strict nonce-based with `strict-dynamic` — no `unsafe-inline` in `script-src`. `X-Frame-Options: DENY` on dashboard. `X-Content-Type-Options: nosniff`. HSTS (`max-age=63072000; includeSubDomains; preload`). `Permissions-Policy: camera=(), microphone=(self), geolocation=(self), payment=(self)`. | `middleware.ts`, `next.config.ts` (headers) |
| **A06 — Vulnerable & Outdated Components** | `bun install` resolves latest; `pnpm` lockfile ships. CI runs `bun run lint && typecheck && test && build`. No pinning of known-vulnerable versions. | `package.json`, `.github/workflows/ci.yml` (planned) |
| **A07 — Identification & Auth Failures** | Rate limiting on OTP send (5/min/IP) and login (configured in `middleware.ts`); lockout after 5 failed logins (Phase 1 Task 1-A). OTP expiry ≤ 5 min (`src/utils/helper/otp.ts`). Sessions: JWT, 8h admin / 24h customer, with `expiresAt` check in the `session` callback. | `src/utils/helper/{rateLimit,otp,authHelper}.ts`, `middleware.ts` |
| **A08 — Software & Data Integrity** | **The hash chain IS this control.** Every financial mutation is integrity-bound. Webhook payloads verified via HMAC. n8n inbound events deduplicated by `eventId` (`src/lib/n8n/idempotency.ts`). | `src/utils/helper/auditChain.ts`, `src/app/api/webhooks/n8n/route.ts` |
| **A09 — Security Logging & Monitoring Failures** | Every financial mutation logs to the chain + Sentry (`captureError` from `#utils/helper/sentryWrapper`). No PII in Sentry tags. Audit log entries include `actorId`, `actorRole`, `ipAddress`, `userAgent`. | `src/utils/helper/{audit,sentryWrapper}.ts`, `src/utils/database/models/auditLog.ts` |
| **A10 — Server-Side Request Forgery (SSRF)** | n8n HTTP Request nodes target `={{ $env.ORDERWORDER_API }}` ONLY (single env-controlled host). The app's outbound calls (NIC, Razorpay, Stripe, WhatsApp, Twilio) are to allow-listed well-known hosts. No user-controlled URLs in any outbound `fetch`. | `docs/n8n/*.json`, `src/utils/{payment,whatsapp,twilio,email,ai}/*.ts` |

---

## 4. Secrets policy

### 4.1 Storage

- **All secrets live in env vars only.** No secrets in code, commits, branch names, or commit messages.
- `.env*` files (except `.env.example`) are gitignored (see `.gitignore`: `.env`, `.env*.local`).
- `.env.example` is the canonical reference — it contains NO real secrets, only placeholders.
- For Vercel: secrets live in Vercel → Project → Settings → Environment Variables (marked Production-only where appropriate).
- For self-hosted: use a secret manager (Doppler, Vault, AWS Secrets Manager) or root-owned `.env.local` with `chmod 600`.

### 4.2 Webhook secrets — constant-time comparison

| Secret | Used by | Verification |
|---|---|---|
| `N8N_WEBHOOK_SECRET` | `src/app/api/webhooks/n8n/route.ts` | HMAC-SHA256 over raw body; verified via `crypto.timingSafeEqual` |
| `RAZORPAY_WEBHOOK_SECRET` | `src/app/api/payment/webhook/route.ts` | HMAC-SHA256 (Razorpay spec) |
| `STRIPE_WEBHOOK_SECRET` | `src/app/api/payment/stripe/webhook/route.ts`, `src/app/api/billing/webhook/route.ts` | Stripe SDK `constructEvent` (constant-time internally) |
| `CRON_SECRET` | `src/app/api/cron/*/route.ts` | Bearer token comparison — string equality is acceptable here (the threat model is eavesdropping, not timing; rotate if leaked) |

The n8n webhook route (`src/app/api/webhooks/n8n/route.ts:11-18`) uses `Buffer.from(header)` + `timingSafeEqual(a, b)` — constant-time, length-checked. The middleware CSRF token comparison (`middleware.ts:44-51`) is a hand-rolled constant-time XOR compare (edge runtime, no `node:crypto`).

### 4.3 The GitHub PAT (post-launch rotation advisory)

> **SECURITY ADVISORY — ACTION REQUIRED BY OWNER.**

The GitHub Personal Access Token used to push this codebase was transmitted in plaintext in the originating chat. **This token MUST be revoked immediately after the push completes:**

1. Go to https://github.com/settings/tokens (fine-grained PATs).
2. Locate the fine-grained PAT scoped to the `Resturant` repository.
3. Click **Revoke**.
4. Generate a new fine-grained PAT scoped to **only** the `Resturant` repo, with **only** `Contents: write` + `Metadata: read`, expiring in ≤ 30 days.
5. Store the new token in a secret manager (1Password, Vault, GitHub Actions secret) — never in a chat, a doc, or a `.env` committed to the repo.

The agent verifies, before declaring done, that `git log -p --all | grep -i "github_pat"` returns nothing. If it returns anything, the agent has failed catastrophically and must purge the history (`git filter-repo` or BFG) and force-push — then escalate to the owner.

### 4.4 Token rotation procedure (webhook secrets)

If any webhook secret is compromised:

1. Generate a new secret: `openssl rand -hex 32`.
2. Update the secret in BOTH places: (a) the app's env vars (`.env.local` + Vercel), (b) the provider's dashboard (Razorpay / Stripe) or n8n's environment.
3. Redeploy the app (Vercel auto-deploys on push if env vars are changed via the dashboard? — no, env var changes require a redeploy).
4. Verify with a test webhook from the provider's dashboard.
5. Document the rotation in `docs/AUDIT_REMEDIATION_TRACKER.md` Notes column for the relevant row.

For `N8N_WEBHOOK_SECRET` specifically: rotate via the procedure in `docs/n8n/README.md` "Webhook secret rotation."

---

## 5. CSP (Content Security Policy)

### 5.1 Where it lives

CSP is set per-request in `middleware.ts` `buildCsp(nonce, isDev)` (NOT in `next.config.ts` — audit finding G-05, fixed by Task 1-F). The middleware generates a fresh nonce per request, sets it on the request header `x-nonce`, and Next.js applies it to inline scripts.

### 5.2 Policy (production)

```
default-src 'self';
script-src 'self' 'nonce-<per-request>' 'strict-dynamic' https:;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https: wss:;
worker-src 'self' blob:;
media-src 'self' blob:;
frame-src 'self' blob: https://checkout.razorpay.com https://api.razorpay.com https://js.stripe.com https://hooks.stripe.com https://maps.google.com https://www.google.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

### 5.3 Policy (development — permissive for HMR)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https: wss: ws:;
worker-src 'self' blob:';
media-src 'self' blob:;
frame-src 'self' blob: https://checkout.razorpay.com https://api.razorpay.com https://js.stripe.com https://hooks.stripe.com https://maps.google.com https://www.google.com;
object-src 'none';
base-uri 'self';
form-action 'self';
```

### 5.4 Adding a new host

If you add a new third-party (e.g., a new payment SDK), add its frame/script/connect host to BOTH the dev and prod arrays in `buildCsp()`. Never add `'unsafe-inline'` to `script-src` in prod — use nonces. Never add `*` to `connect-src`.

---

## 6. CSRF protection

- **Double-submit cookie** pattern, implemented in `middleware.ts:139-146`.
- Cookie `csrf-token` (non-httpOnly so client JS can read it; `sameSite: strict`; `secure: true` in prod) set on every response.
- All state-changing `/api/*` requests must send `X-CSRF-Token: <csrf-token>` header matching the cookie.
- Exempt paths (no CSRF cookie): `/api/auth/`, `/api/payment/webhook`, `/api/payment/stripe/webhook`, `/api/billing/webhook`, `/api/webhooks/n8n`, `/api/inngest` (these authenticate via HMAC signatures instead).
- Comparison via hand-rolled constant-time XOR (`middleware.ts:44-51`) — edge-runtime-safe (no `node:crypto`).

---

## 7. Rate limiting

Implemented in `src/utils/helper/rateLimit.ts` via `@upstash/ratelimit` + `@upstash/redis`. Falls back to in-memory on Redis outage (circuit breaker, 3 failures → 60s in-memory window).

| Path | Method | Limit | Window |
|---|---|---|---|
| `/api/menu` | GET | 100 | 60 s |
| `/api/admin/order/*` | any | 60 | 60 s |
| `/api/kitchen/*` | any | 60 | 60 s |
| `/api/auth/send-otp` | POST | 5 | 60 s |
| `/api/order/place` | POST | 30 | 60 s |

All rate-limited via `middleware.ts` (the edge layer). On 429, response includes `Retry-After: 60`.

---

## 8. PII handling

- Customer phone numbers verified via OTP before any order is placed.
- No PII in Sentry tags (only `route` and `eventType` breadcrumbs).
- No PII in audit-log `metadata` beyond what's strictly required for the action.
- No PII in WhatsApp notification payloads beyond the customer's phone (necessary for delivery) and order reference.
- Customer email is optional (only collected for receipt delivery if requested).
- The public menu API (`/api/menu`) returns only `name`, `tagline`, `logo`, `banner`, `currency`, tax-display config — NEVER `phone`, `gstNumber`, `upiId`, `passwordHash` (audit finding C-01, fixed by Task 1-B).

---

## 9. Incident response

### 9.1 Hash-chain break

1. `verifyAuditChain()` returns `ok:false` (nightly cron OR manual re-verify).
2. `compliance.chain_broken` n8n alert fires to owner WhatsApp + CA email.
3. Owner opens Settings → Audit Chain → sees red "CHAIN BROKEN AT #N" banner.
4. Operator investigates via `db.billAuditChain.find({ sequenceNo: { $gte: N-1, $lte: N+1 } })` to identify the tampering actor.
5. Escalate to CA + legal counsel if fraud is suspected.
6. Do NOT attempt to "fix" the chain in place — it is append-only by design. Document the break, preserve the broken entries as evidence, and continue appending new entries (the chain self-heals forward; the broken entry remains a permanent record of tampering).

### 9.2 Webhook secret compromise

See Section 4.4 above.

### 9.3 GitHub PAT compromise

See Section 4.3 above.

---

## 10. Security checklist (pre-launch)

- [ ] `NEXTAUTH_SECRET` is a unique 32+ char random string (not the default placeholder).
- [ ] `OTP_SECRET` and `ENCRYPTION_SECRET` are set (not falling back to `NEXTAUTH_SECRET`).
- [ ] `DEMO_MODE=false` (or unset) in production.
- [ ] `N8N_INBOUND_ALLOWED_IPS` set to your n8n server's egress IP(s) in production.
- [ ] MongoDB Atlas has auth enabled + IP allowlist (not `0.0.0.0/0` unless on Vercel).
- [ ] Upstash Redis requires the REST token.
- [ ] Razorpay/Stripe/n8n webhooks verify signatures (the included routes do this — verify the env vars are set).
- [ ] HTTPS is enforced (Vercel/Render do this automatically; for self-hosted, use Caddy).
- [ ] Rate limiting is active (the `/api/auth/send-otp` route enforces 5/min/IP).
- [ ] CSP headers are set per-request in `middleware.ts` `buildCsp()` (verify with `curl -I https://<your-domain>/` — look for `Content-Security-Policy`).
- [ ] Sentry is capturing errors (set `SENTRY_DSN`; trigger a test error).
- [ ] Customer phone numbers verified via OTP before any order is placed.
- [ ] `profile.settings.noDeleteMode = true` for every production restaurant (default for new accounts — verify).
- [ ] Hash-chain audit log verifies clean: `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/audit-chain/verify` → `{"ok":true}`.
- [ ] **GitHub PAT used to push the code REVOKED** (Section 4.3).
- [ ] All webhook secrets rotated from their initial values.
- [ ] `git log -p --all | grep -i "github_pat"` returns nothing.
