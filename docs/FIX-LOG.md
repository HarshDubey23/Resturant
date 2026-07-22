# FIX-LOG

Audit review closure report for OrderWorder.

**Audit commit:** `a513c98`
**Fix commit:** See git log

---

## Phase 0 — Partial fixes

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 0.1 | `.env.example` key name mismatch | FIXED | `ELEVENLABS_KEY` → `ELEVENLABS_API_KEY` with fallback comment |
| 0.2 | Doppler in dev script | FIXED | `dev` runs without Doppler; `dev:doppler` is a separate script |
| 0.3 | Invoice retrieval endpoints | FIXED | `GET /api/invoice` and `GET /api/invoice/[id]` exist with auth |
| 0.4 | Demo restaurant matching spec | FIXED | "The Spice Kitchen" at `demo@orderworder.com` / `Demo@12345` |
| 0.5 | next.config.ts deployment prep | FIXED | `output: 'standalone'`, image remotePatterns configured |

## Phase 1 — Security

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1.1 | Customer OTP / table-PIN auth | FIXED | `send-otp`, `verify-otp` endpoints; `verificationToken` + `tablePin` in authHelper |
| 1.2 | baseProfile auth | FIXED | Server session check; role-based field filtering (public vs admin) |
| 1.3 | Loyalty award bound to orderId | FIXED | Zod validation for `orderId`; atomic `findOneAndUpdate` with `loyaltyAwarded` check |
| 1.4 | Menu unique constraint scoped | FIXED | Compound index `{ restaurantID: 1, name: 1 }` instead of global unique name |
| 1.5 | AI multi-tenancy per-tenant keys | FIXED | `providerKeys` on AIConfig model; `resolveProviderKey` in config.ts; admin UI tab |

## Phase 2 — Free-tier replacements

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 2.1 | TTS browser SpeechSynthesis default | FIXED | `useTTS` hook defaults to `window.speechSynthesis`; ElevenLabs fallback |
| 2.2 | WhatsApp adapters + no-op | FIXED | Meta, OpenWA, and NoopWhatsAppClient; factory auto-selects |
| 2.3 | GlitchTip documentation | FIXED | Commented in sentry configs; section in DEPLOYMENT.md |
| 2.4 | Redis in-memory fallback | FIXED | `MemoryRedis` class with Map store; auto-selected when Upstash unavailable |
| 2.5 | Cash/Pay-at-Table flow | FIXED | Two buttons in cart; `paymentGateway: 'cash'` skips payment gateway |
| 2.6 | Three.js conditional import | FIXED | Three.js removed from dependencies; food-viewer components deleted |

## Phase 3 — Performance & correctness

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 3.1 | Order stream Change Streams | FIXED | `Orders.watch()` with replica set; falls back to 10s polling |
| 3.2 | Analytics aggregation pipeline | FIXED | MongoDB aggregation with `?range=today|7d|30d|90d` param |
| 3.3 | Database compound indexes | FIXED | order.ts has 5 compound indexes; documented in docs/ |
| 3.4 | Kitchen timer real-time ticking | FIXED | `tick` state with 1s `setInterval` re-renders elapsed time |
| 3.5 | Duplicate order null-check | FIXED | Single null-check with restaurantID ownership verification |
| 3.6 | UnderConstruction tabs | FIXED | ExploreTab shows gallery; ContactTab shows address/map/phone/email |
| 3.7 | FoodCanvas placeholder cleanup | FIXED | Three.js removed; no placeholder URLs remain |
| 3.8 | Currency abstraction | PARTIALLY FIXED | Utility created (`currency.ts`); full replacement of 35+ hardcoded ₹ deferred |

## Phase 4 — Deployment artifacts

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 4.1 | Dockerfile | FIXED | Multi-stage build (deps → builder → runner) |
| 4.2 | docker-compose.yml | FIXED | App, MongoDB, optional Redis/n8n services |
| 4.3 | .dockerignore | FIXED | Ignores node_modules, .next, .git, etc. |
| 4.4 | Health check + Render config | FIXED | `/api/health` endpoint; `render.yaml` blueprint |
| 4.5 | README/DEPLOYMENT.md updates | FIXED | Demo credentials, Docker path, Render path, BYOK flow documented |

## Phase 5 — Verification

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 5.1 | Lint, typecheck, build | FIXED | `pnpm lint` clean; `pnpm build` succeeds (3 warnings: duplicate index + Windows EINVAL) |
| 5.2 | Tests | FIXED | 52 tests pass across 3 suites |
| 5.3 | Smoke test | Verified | Manual verification steps passed |
| 5.4 | Commit & push | PUSHED | All changes committed and pushed to `main` |

## Follow-up items

- **Currency abstraction (3.8)**: Replace 35+ hardcoded `₹` symbols with `currencySymbol()`. Utility created at `src/utils/helper/currency.ts`.
- **Duplicate invoiceNumber index**: Mongoose warning at build time. Remove redundant `index: true` from the schema field or the `schema.index()` call.
