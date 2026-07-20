# OrderWorder — Audit Report

**Date:** 2026-07-21  
**Auditor:** Autonomous Coding Agent  
**Repository:** [Resturant](https://github.com/HarshDubey23/Resturant)  
**Branch:** `main`

---

## 1. CI Build Fix (Phase P0)

### Root Cause
The build failure at `Collecting page data` was caused by `src/utils/database/connect.ts:14-16` throwing at **module load time** (top-level `if (!process.env.MONGODB_URI) throw ...`). Any route importing this module would trigger the error before Next.js could evaluate the route's `dynamic = 'force-dynamic'` export.

### Fixes Applied
1. **Lazy MongoDB connection** — Moved the env-var check inside `connectDB()` function
2. **`force-dynamic` + `runtime = "nodejs"`** — Added to all 22 missing API routes
3. **Node version alignment** — `.nvmrc` updated to `v22.11.0`, `@types/node` to `^22.10.0`, added `engines` field
4. **CI defense-in-depth** — Added dummy env vars for build step

**Verification:** `MONGODB_URI="" pnpm build` now passes. Build no longer throws the module-level error.

---

## 2. Feature Audit Matrix (30 Features)

| # | Feature | Status | Evidence |
|---|---|---|---|
| 1 | QR Code Ordering | IMPLEMENTED | `scan/ScannerClient.tsx` + `setup-tables/route.ts` uses qrcode lib |
| 2 | Jarvis Multi-provider AI failover | IMPLEMENTED | `utils/ai/switcher.ts:51-74` (Groq→Cerebras→Gemini→SiliconFlow) |
| 3 | Voice Ordering (STT/TTS, Hindi) | PARTIAL | `voice/stt/route.ts` hardcodes `language: 'hi'`; TTS silently no-ops if ELEVENLABS_KEY unset; no IVR/Twilio |
| 4 | Customer Phone Auth (+91) | IMPLEMENTED | `UserLogin.tsx` regex `/^\+91[-\s]?[6-9]\d{9}$/` |
| 5 | Admin Auth (plan-based limits) | IMPLEMENTED | `account.ts` plan enum + maxTables/maxMenuItems |
| 6 | Kitchen Auth (sub-credential) | IMPLEMENTED | `kitchen.ts` model + `authHelper.ts:35-43` |
| 7 | Real-time Order Mgmt (SSE, 3 buckets) | PARTIAL | SSE exists but Dashboard uses SWR polling — BUG 9 |
| 8 | Kitchen Display System | PARTIAL | KDS UI works but queries nonexistent 'preparing' state — BUG 1 |
| 9 | Menu Management (dual UI) | IMPLEMENTED | xtreme-ui MenuCard + shadcn MenuEditor coexist |
| 10 | Payments (Razorpay Route/Split/UPI) | PARTIAL | Route, Contact, FundAccount, Payout funcs DEFINED but NEVER called — BUG 7 |
| 11 | Loyalty & Rewards | PARTIAL | Schema good but tier multiplier BYPASSED in `place/route.ts` — BUG 4 |
| 12 | Customer AI Memory | IMPLEMENTED | `customer/memory/route.ts` + chat prompt integration |
| 13 | WhatsApp Marketing | IMPLEMENTED | Cloud API v22.0 + Campaigns model + broadcast |
| 14 | Owner Analytics (Live, AI insights, GST) | PARTIAL | GST collected works; AI insights are hardcoded if/else — BUG 10 |
| 15 | Multi-Outlet & RBAC | MISSING | Only admin/kitchen/customer roles exist; no owner/manager/captain/waiter/chef |
| 16 | Offline-First PWA | IMPLEMENTED | `manifest.ts` + `public/sw.js` + `PWARegister.tsx` |
| 17 | Unified Order Aggregator | PARTIAL | API exists; kitchen page links to `/aggregator-orders` which 404s — BUG 8 |
| 18 | GST / Tax Management | PARTIAL | `gstInclusive` flag declared but never read — BUG 6 |
| 19 | Inventory & Recipe Costing | MISSING | No `inventory.ts` model; no ingredient tracking |
| 20 | Theme Customization (HSL) | BROKEN | UI sends HEX, schema expects HSL — BUG 5 |
| 21 | PDF Invoice (@react-pdf/renderer) | PARTIAL | `Invoice.tsx` fully implemented but NEVER imported/rendered |
| 22 | QR Scanner Page | IMPLEMENTED | Camera enum + torch + zoom 1x-5x |
| 23 | Restaurant Setup Wizard (3-step) | IMPLEMENTED | `setup/page.tsx` tables→menu→qr |
| 24 | Registration/Signup (Zod) | IMPLEMENTED | `validation.ts` signupSchema + `signup/route.ts` |
| 25 | Rate Limiting | PARTIAL | Fixed-window counter, NOT sliding window — mislabeled |
| 26 | Validation & Security (Zod/bcrypt) | IMPLEMENTED | 9 Zod schemas + bcrypt with re-hash protection |
| 27 | SEO & Metadata | IMPLEMENTED | Dynamic OG images + JSON-LD + sitemap + robots |
| 28 | Demo Data (Empire, BrewPoint) | IMPLEMENTED | `refreshDemoData/route.ts` + 2 sample restaurants |
| 29 | Sentry Error Monitoring | PARTIAL | SDK initialized but `captureError` NEVER called — BUG 12 |
| 30 | Multi-language Support (Hindi) | PARTIAL | Hardcoded 'hi' everywhere; no i18n framework |

---

## 3. Additional Missing Components

| Component | Status | Action Required |
|---|---|---|
| 3D Food Viewer (R3F) | MISSING | Implement per Section 5 |
| Stripe Payment Gateway | MISSING | Implement per Section 7 |
| n8n Webhook Integration | MISSING | Implement per Section 8 |
| Inventory Model | MISSING | Implement per Section 6 + 9 |
| Invoice Generation Wired | PARTIAL | Render Invoice.tsx in cart & order confirmation — Section 9 |
| CI Node Version Alignment | FIXED | `.nvmrc=v22.11.0`, `@types/node=^22.10.0`, engines added |

---

## 4. Top 13 Pre-Existing Bugs

| Bug ID | Severity | Description | File | Status |
|---|---|---|---|---|
| BUG 1 | HIGH | Kitchen route queries non-existent 'preparing' state | `kitchen/route.ts:22` | PENDING FIX |
| BUG 2 | HIGH | Payment webhook references `order.amount` (should be `orderTotal + taxTotal`) | `payment/webhook/route.ts:45` | PENDING FIX |
| BUG 3 | MED | `.toFixed(2)` returns string in order tax calculation | `order/place/route.ts:37` | PENDING FIX |
| BUG 4 | HIGH | Loyalty tier multiplier silently bypassed | `order/place/route.ts:61` | PENDING FIX |
| BUG 5 | HIGH | Theme color HEX vs HSL type mismatch | `ThemeSettings.tsx` / `profile.ts` | PENDING FIX |
| BUG 6 | MED | `gstInclusive` flag never read | `profile.ts` / `order/place/route.ts` | PENDING FIX |
| BUG 7 | HIGH | Razorpay Route helpers defined but never wired | `razorpay.ts` / no endpoints | PENDING FIX |
| BUG 8 | MED | `/aggregator-orders` page missing (404) | Kitchen KDS link | PENDING FIX |
| BUG 9 | LOW | Dashboard uses SWR polling instead of SSE | `context/Admin.tsx` | PENDING FIX |
| BUG 10 | LOW | AI Insights are hardcoded, not LLM | `admin/analytics/route.ts` | PENDING FIX |
| BUG 11 | MED | Node version alignment | `.nvmrc` / CI / `@types/node` | FIXED in P0 |
| BUG 12 | LOW | Sentry `captureError` never called | All routes | PENDING FIX |
| BUG 13 | LOW | Dead code (`_totalRefunded`, etc.) | Multiple files | PENDING FIX |

---

## 5. Execution Plan

| Phase | Name | Section | Estimated Time |
|---|---|---|---|
| P0 | Foundation (CI fix) | 1 + 3 | ~1h ✓ DONE |
| P1 | Audit | 2 | ~1h ✓ DONE |
| P2 | Bug Fixes | 4 | ~3h |
| P3 | Schema Updates | 6 | ~2h |
| P4 | Stripe Integration | 7 | ~2h |
| P5 | n8n Integration | 8 | ~3h |
| P6 | Inventory + Invoicing | 9 | ~2h |
| P7 | 3D Viewer | 5 | ~4h |
| P8 | RBAC | 10 | ~3h |
| P9 | Money Flow | 11 | ~2h |
| P10 | Final Verification | 13 + 15 | ~1h |

---

## 6. New Bugs Discovered During Audit

- `sentryWrapper.ts:captureError` defined but never imported in any route
- `themeUpdateSchema` defined in `validation.ts:50-56` but never wired into `admin/theme/route.ts`
- `Invoice.tsx` component exists at `components/layout/Invoice.tsx` but never rendered anywhere
- `createRecurringSubscription` in `razorpay.ts:130` has no corresponding endpoint
- Rate limiting is fixed-window counter, not sliding window (mislabeled in README)
- README claims SSE for dashboard but only KDS uses SSE

---

*Last updated: 2026-07-21*
