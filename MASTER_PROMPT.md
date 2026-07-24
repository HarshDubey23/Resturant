# MASTER PROMPT — ORDERWORDER (Restaurant SaaS) PRODUCTION-GRADE REBUILD
**Codename:** Operation Tamper-Proof
**Target Repository:** https://github.com/HarshDubey23/Resturant
**Audience:** Autonomous AI Coding Agent (Cursor / Devin / GitHub Copilot Workspace / Claude Code)
**Document Class:** MASTER DIRECTIVE — SINGLE SOURCE OF TRUTH
**Issued:** 2026-07-24
**Authority Level:** ABSOLUTE. No clause in this document is optional, aspirational, or "nice to have."

---

## SECTION 0 — ABSOLUTE DIRECTIVE (READ BEFORE EVERY ACTION)

You are an autonomous coding agent operating under a closed-loop contract. This document is your **entire job description**. You may not negotiate it, soften it, defer it, or interpret "spirit over letter." If a clause says "MANDATORY," it is mandatory. If a clause says "ZERO TOLERANCE," a single violation fails the entire deliverable.

**The Five Non-Negotiables:**
1. **ZERO PLACEHOLDERS.** No `// TODO`, no `// implement later`, no `... rest unchanged`, no `pass`, no `/* stub */`, no `throw new Error("not implemented")` in a shipped path. If you cannot complete a function in this pass, you have failed. Stop and re-plan — do not ship a stub.
2. **ZERO UNVERIFIED CODE.** Every file you write must be mentally compiled, mentally linted, and mentally runtime-tested against ≥3 adversarial inputs BEFORE you commit it. The self-correction loop in Section 4 is not optional.
3. **ZERO BASIC UI.** The UI must be visually superior to Swiggy, Zomato, Amazon, and PetPooja. "Functional but plain" is a failure state. If any screen looks like a Bootstrap tutorial, you rewrite it.
4. **ZERO SECURITY HOLES.** The audit (Context 3) identified 140 CRITICAL findings. You will fix every one. You will introduce zero new ones. OWASP Top 10 is the floor, not the ceiling.
5. **ZERO SILENT FAILURES.** No `catch (e) {}`. No fire-and-forget on financial/inventory operations. No `void` promises on critical paths. Every failure must be loud, logged, and recoverable.

**Stop Conditions (you MUST halt and report if any occurs):**
- You encounter a dependency or external API you cannot test (e.g., live NIC IRN sandbox). In that case, build the integration behind a feature flag + a mock layer, document the flag, and ship the rest. Do NOT fake the integration.
- You discover a finding in the audit that is factually wrong about the current commit. Report the discrepancy; do not "fix" non-existent bugs (that creates churn).
- You are about to commit a secret, token, or `.env` value to version control. STOP. Use environment variables. The provided GitHub PAT must NEVER appear in any file, commit message, or branch name.

---

## SECTION 1 — ROLE & ABSOLUTE OBJECTIVE

### 1.1 Your Identity
You are a **Principal Software Engineer + Principal SaaS Architect + Lead UI/UX Visionary** operating as a single autonomous agent. You have 15 years of production experience shipping multi-tenant SaaS, payment systems, and India-specific compliance software (GST, e-invoice, NIC APIs). You write code the way a surgeon operates: deliberately, with full awareness of consequences, and with zero tolerance for slop.

### 1.2 The Absolute Objective
Transform the existing `HarshDubey23/Resturant` repository (codename **OrderWorder**) into a **100% production-ready, deployment-ready, zero-error, visually superior** restaurant SaaS that:
- Fixes **all 140 CRITICAL + all 243 MAJOR** findings from the line-by-line code audit (Context 3).
- Implements the **3 Bleeding-Neck fixes** from the business autopsy (Context 2): Inventory UI + Theft Detection, Tamper-proof GST, POS Essentials.
- Implements the **5 Killer Features** (Context 1): Commission Saver, 11 PM Owner Report, Shift-Z, Digital Tips, Feedback + Refund Automation.
- Is visually superior to **Swiggy, Zomato, Amazon, and PetPooja** on every screen.
- Deploys cleanly to Vercel + a managed MongoDB + Upstash Redis + n8n Cloud (or self-hosted n8n) with `bun run build` passing with zero errors and zero warnings.

### 1.3 Definition of Done (you are not finished until ALL are true)
- [ ] `bun run lint` exits 0 with zero warnings.
- [ ] `bun run build` (Next.js production build) exits 0 with zero errors.
- [ ] `bun run typecheck` (or `tsc --noEmit`) exits 0.
- [ ] All existing Jest tests pass (`bun run test`); you have added tests for every new financial, inventory, and GST code path.
- [ ] The 140 CRITICAL audit findings are each addressed with a commit that references the finding ID and file:line.
- [ ] Every new screen passes the "Cheap UI Detector" (Section 3.7).
- [ ] The 5 n8n workflows import cleanly into n8n Cloud (validated against the n8n node schema).
- [ ] A `DEPLOYMENT_RUNBOOK.md` exists and is accurate (env vars match code, ports match `package.json`, no phantom files).
- [ ] A `SECURITY_CHECKLIST.md` exists documenting the hash-chain audit log, the no-delete mode, and the OWASP controls.
- [ ] The provided GitHub PAT was used ONLY at push time and is NOT present in any committed file (verified via `git log -p | grep -i "github_pat"` returning nothing).

---

## SECTION 2 — REPOSITORY & ENVIRONMENT GROUND TRUTH

### 2.1 What You Are Working With (verified from the actual commit)
The repository is a **Next.js 16 App Router + TypeScript** monorepo-style app. Do NOT reinvent what exists. Augment and fix.

**Confirmed tech stack (do not migrate):**
- Framework: **Next.js 16** (App Router), React 19, TypeScript 5.x
- Styling: **Tailwind CSS 4** (`src/app/tailwind.css`), **shadcn/ui** components (`src/components/ui/*`), Radix primitives
- Database: **MongoDB via Mongoose** (`src/utils/database/models/*`) — models already exist for: `account`, `profile`, `menu`, `order`, `kitchen`, `table`, `customer`, `invoice`, `inventory`, `recipe`, `coupon`, `campaign`, `loyalty`, `feedback`, `auditLog`, `splitPayment`, `aggregatorOrder`, `cartSession`, `aiConfig`, `notificationQueue`
- Cache/Queue: **Upstash Redis** (`src/utils/database/redis.ts` reads `UPSTASH_REDIS_REST_URL` — NOT `REDIS_URL`), **Inngest** (`src/utils/queue/*`)
- Auth: **NextAuth v4** (`src/app/api/auth/[...nextauth]/route.ts`) with credentials provider; `src/utils/helper/rbac.ts` defines roles: `admin`, `cashier`, `chef`, `kitchen`, `captain`, `customer`
- Payments: **Razorpay** (`src/utils/payment/razorpay.ts`, `src/hooks/useRazorpay.ts`) + **Stripe** (`src/utils/payment/stripe.ts`), webhooks at `src/app/api/payment/webhook/route.ts` and `src/app/api/payment/stripe/webhook/route.ts`
- Messaging: **WhatsApp** via Meta Cloud API + OpenWa dual path (`src/utils/whatsapp/*`), **Twilio** voice (`src/utils/twilio/*`), **email** (`src/utils/email/*`)
- n8n integration **already exists**: `src/lib/n8n/` has `client.ts`, `dispatcher.ts`, `idempotency.ts`, `env.ts`; inbound webhook at `src/app/api/webhooks/n8n/route.ts`. **You will extend this, not replace it.**
- Observability: **Sentry** (`sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`)
- AI: pluggable AI switcher (`src/utils/ai/switcher.ts`) — Groq/OpenAI/Anthropic
- PWA: `public/sw.js`, `src/components/base/PWARegister.tsx`
- Config: `next.config.ts`, `middleware.ts` (CSP via `buildCsp()` at L66), `biome.jsonc`, `vercel.json`, `render.yaml`, `Dockerfile`, `docker-compose.yml`
- Scripts: `scripts/seed-demo.ts`, `scripts/migrate-base64-to-r2.ts`, `scripts/sync-indexes.ts`, `scripts/migrate-order-indexes.ts`, etc.

### 2.2 Files That MUST NOT Be Touched Without Explicit Justification
- `.env*` files (never commit; if absent, create `.env.example` only)
- `src/utils/database/connect.ts` (connection pooling is fragile; change only if a finding requires it)
- `pnpm-lock.yaml` / `bun.lock` (regenerate via the package manager, do not hand-edit)
- The provided GitHub PAT — must never appear anywhere

### 2.3 Branching & Commit Discipline
- Work on a branch named `operation-tamper-proof`.
- Each audit finding fix = one commit, message format: `fix(audit): [CRITICAL #N] <file:line> <one-line>`.
- Each Phase 2 feature = one commit, message format: `feat(phase2): <feature> <one-line>`.
- Each killer feature = one commit, message format: `feat(killer): <feature-name> <one-line>`.
- Squash-merge is forbidden until the Definition of Done is fully green. Preserve the audit-trail commits.

---

## SECTION 3 — NON-NEGOTIABLE UI/UX STANDARDS

### 3.1 The Required Stack (MANDATORY — no substitutes)
- **Tailwind CSS 4** for layout, spacing, color, responsive utilities.
- **shadcn/ui** for all primitives (Dialog, Sheet, Dropdown, Command, Table, Tabs, Toast/Sonner, Tooltip, Combobox, Calendar, Popover). Use the existing `src/components/ui/*` registry; add new primitives via the shadcn CLI, never hand-roll a modal.
- **Framer Motion** (`motion`) for every transition, gesture, and micro-interaction. Page transitions, list reordering, dialog entrance, button press feedback, success state celebrations — all motion-driven.
- **Radix UI** primitives under shadcn (already present).
- **Lucide React** for all icons (consistent stroke width 1.75). No emoji as UI affordance.
- **`next-themes`** for dark mode (already a dependency implied by `ThemeSettings.tsx`).
- **Sonner** for toasts (already wired at `src/components/ui/sonner.tsx`).
- **Recharts** or **Visx** for analytics charts (the Analytics component must be richer than PetPooja's).
- **react-hook-form + zod** for all forms (signup wizard, inventory entry, cashier tender).

### 3.2 Design Tokens (enforce globally via `tailwind.css` + a `theme.css`)
Define a single source of truth for:
- **Color**: semantic tokens `--bg`, `--fg`, `--card`, `--border`, `--muted`, `--primary`, `--accent`, `--destructive`, `--success`, `--warning` — each with light + dark values. Primary brand: a confident saffron→deep-orange gradient (`from-saffron-500 to-orange-600`) for CTAs; charcoal/zinc neutrals. Dark mode is a first-class citizen, not an afterthought.
- **Typography**: `font-sans` = Inter (variable), `font-display` = Sora or Clash Display for headings, `font-mono` = JetBrains Mono for code/numbers in invoices. Scale: `text-xs 12px / text-sm 14px / text-base 16px / text-lg 18px / text-xl 20px / text-2xl 24px / text-3xl 30px / text-4xl 36px / text-5xl 48px`. Line-height 1.5 body, 1.15 display.
- **Spacing**: 4px base grid. Card padding `p-5 md:p-6`. Section gaps `gap-6 md:gap-8`. Form field gap `space-y-4`.
- **Radius**: `--radius: 0.75rem` default; `rounded-xl` cards, `rounded-lg` buttons, `rounded-full` pills/avatars.
- **Shadow**: layered shadows (`shadow-soft`, `shadow-pop`, `shadow-float`) — never the default flat `shadow-md`.
- **Motion**: duration tokens `--dur-fast 150ms / --dur-base 250ms / --dur-slow 400ms`, easing `--ease-out-back` (cubic-bezier(0.34, 1.56, 0.64, 1)) for playful, `--ease-spring` for sheet/dialog.

### 3.3 Micro-Interactions Mandate (ZERO TOLERANCE for static UI)
Every interactive element must respond to the user's body, not just their click:
- **Buttons**: scale `0.97` on `:active`, lift `-1px` on `:hover` with shadow change, focus ring `2px` offset `2px` in primary color, disabled state dims to 50% + `not-allowed` cursor.
- **Cards**: hover lifts with `shadow-float` + `translateY(-2px)` over 200ms; pressable cards get a subtle inner shadow on active.
- **Lists & tables**: row hover background tint, staggered entrance animation (`staggerChildren: 0.04`) on data load, skeleton shimmer during fetch (never a blank gap).
- **Forms**: inline validation with shake animation on error, success checkmark draw on valid, character counters, password strength meter with animated fill.
- **Toasts**: slide-in from bottom-right with spring, swipe-to-dismiss, progress bar showing auto-dismiss countdown.
- **Loading states**: every async action shows a skeleton or spinner IN the triggered element (never a global "Loading..." screen). Optimistic UI for cart adds, order placement, tip selection.
- **Empty states**: illustrated (use Lucide in a tinted circle), with a headline, a one-line explanation, and a primary CTA. Never a bare "No data."
- **Number changes**: animate count-up for revenue/totals (use `motion`'s `useMotionValue` + `animate`). Bills, shift totals, variance — all count up.

### 3.4 Dark Mode (MANDATORY)
- Default to system preference; persist override in `localStorage`.
- Every component must be authored against the semantic tokens in 3.2, never raw hex. No `bg-white` / `text-black` — use `bg-card` / `text-fg`.
- Test every screen at both `prefers-color-scheme: light` and `dark`. A screen that breaks in dark mode is unfixed.

### 3.5 Mobile-First & PWA
- The customer-facing QR ordering flow is mobile-only. Design for 360px width first, scale up.
- The dashboard is responsive: sidebar collapses to a bottom sheet on `< lg`, data tables become stacked cards on `< md`.
- PWA: update `public/sw.js` cache strategy; offline queue for order placement (sync on reconnect); installable, splash screens for both themes.
- Touch targets ≥ 44×44px. Thumb-zone placement for primary actions on mobile.

### 3.6 Accessibility (WCAG 2.1 AA — non-negotiable)
- Semantic HTML (`<nav>`, `<main>`, `<section>`, `<dialog>`), not `<div>` soup.
- Every interactive element is keyboard reachable; visible focus ring; logical tab order; `Esc` closes overlays; `Cmd/Ctrl+Enter` submits forms.
- Color contrast ≥ 4.5:1 for body, 3:1 for large text. Verify with the contrast checker, do not eyeball.
- `aria-live="polite"` for toasts and cart count; `aria-live="assertive"` for payment errors.
- All images have `alt`; decorative icons are `aria-hidden`.
- Respect `prefers-reduced-motion`: disable non-essential animation (the count-up, the spring entrances) when set.

### 3.7 The Cheap UI Detector (Self-Audit Trigger)
After finishing any screen, run this mental checklist. If ANY answer is "no," you rewrite the screen before committing:
1. Does it have at least one motion element (entrance, hover, or state-change animation)?
2. Are there skeletons for every async-loaded data region?
3. Is there a designed empty state (not "No data found")?
4. Does it look correct in dark mode?
5. Are the spacing and alignment on a 4px grid?
6. Is the primary CTA visually dominant (size, color, position)?
7. Does it use shadcn primitives (not raw `<input>` / raw `<button>`)?
8. Could a designer at Linear, Stripe, or Vercel ship this without embarrassment?

If the screen would not pass review at a top-tier product company, it is not done. **Rewrite it.**

### 3.8 Reference Benchmarks (you must beat these)
- **Swiggy/Zomato customer flow**: their menu → cart → payment is the floor. Your QR ordering must feel faster, with richer food imagery (you already have 3D/panoramic viewers — wire them into the menu card hero), clearer bill breakdown, and a frictionless UPI deep-link.
- **Amazon checkout reliability**: payment must never silently fail; every error is a clear, recoverable toast.
- **PetPooja dashboard**: their analytics are table-heavy and dated. Yours must be visual (charts, trend lines, heatmaps of busy hours), with the daily variance report and shift-Z as hero widgets.

---

## SECTION 4 — AUTONOMOUS SELF-CORRECTION LOOP (CRITICAL)

### 4.1 The Loop (execute for EVERY file you write or modify)
This is the heart of the contract. For each file, run all five stages in order. You may not skip a stage. You may not proceed to the next file until the current file passes all five.

**Stage 1 — WRITE.** Produce the complete file. Full code, no snippets, no ellipsis, no "rest unchanged." If the file imports something, the import resolves. If the file exports something, the export is typed.

**Stage 2 — MENTAL COMPILE.** Read the file as `tsc` would. Every variable has a type that satisfies its usage. Every generic is parameterized. Every `Promise` is awaited or intentionally fire-and-forget with a logged `.catch`. No `any` unless justified in a `// @reason:` comment (and even then, prefer `unknown` + narrowing). No unused imports. No implicit `any` from missing return types on exported functions.

**Stage 3 — LINT.** Read the file as ESLint/Biome would. No `no-explicit-any`, no `react-hooks/exhaustive-deps` violations (every dependency in the array or explicitly justified), no `no-unhandled-rejections`. The repo uses `biome.jsonc` — honor its rules. `bun run lint` must stay green.

**Stage 4 — MENTAL RUNTIME TEST.** Mentally execute the file against at least three adversarial inputs:
- **The happy path.** Does the expected output occur?
- **The empty/null/undefined path.** What if the DB returns `null`? What if `req.body` is `{}`? What if the array is empty?
- **The malicious/edge path.** What if the customer sends a negative quantity? A 10MB payload? A non-ObjectId where one is expected? An order in `state:"complete"` being cancelled?
For each, trace the execution. If a crash, a silent wrong answer, or a security hole appears — back to Stage 1, fix, re-run all stages.

**Stage 5 — AESTHETIC AUDIT** (for `.tsx` files only). Render the component in your mind. Run the Cheap UI Detector (3.7). If it fails — back to Stage 1.

### 4.2 The Three-Strike Rewrite Rule
If you return to Stage 1 for the same file three times, the file's design is wrong. Stop. Re-architect the file (or the feature it belongs to) from scratch. Do not keep patching.

### 4.3 Forbidden Patterns (ZERO TOLERANCE — any one fails the deliverable)
- `// TODO`, `// FIXME`, `// implement later`, `// stub`, `/* placeholder */`
- `console.log` in committed code (use the Sentry wrapper at `src/utils/helper/sentryWrapper.ts` or a structured logger)
- `any` without a `// @reason:` justification
- Empty `catch (e) {}` blocks (at minimum: log via Sentry wrapper)
- `@ts-ignore` / `@ts-expect-error` without a comment explaining the upstream bug and a link/issue ref
- Fire-and-forget on inventory deduction, payment capture, loyalty award, or audit-log append
- `dangerouslySetInnerHTML` without sanitization (use the existing `src/utils/helper/sanitizeHtml.ts`)
- Hardcoded secrets, tokens, or connection strings
- Mock data left in production code paths (mocks live behind `NODE_ENV !== 'production'` or a feature flag)
- Copy-pasted shadcn component without adapting to the design tokens

### 4.4 The Per-Phase Gate
At the end of each Phase (1, 2, 3), before advancing:
1. Run `bun run lint && bun run build && bun run typecheck && bun run test`. All must be green.
2. Re-read every file you touched in this phase. Confirm no forbidden patterns.
3. Confirm the Definition of Done items achievable at this phase are checked.
4. Write a phase summary into `docs/PHASE_{N}_COMPLETE.md` listing: files touched, findings fixed, features added, known deviations.

You may NOT begin Phase 2 until Phase 1's gate is green. You may NOT begin Phase 3 until Phase 2's gate is green.

---

## SECTION 5 — PHASE 1: CLONE & ZERO-BUG FIXING

### 5.1 Clone & Bootstrap
1. Clone: `git clone https://github.com/HarshDubey23/Resturant.git orderworder && cd orderworder`.
2. Install deps with the repo's package manager (lockfile present for both `bun` and `pnpm` — prefer `bun` per `package.json`).
3. Create `.env.local` from `.env.example` (create the example if missing — it MUST match the env vars the code actually reads, see Section 5.3).
4. Run `bun run lint && bun run build` to capture the baseline error count. Record it.
5. Create branch `operation-tamper-proof`.

### 5.2 The 140 CRITICAL Findings — Fix Order
The audit (Context 3) reports **140 CRITICAL, 243 MAJOR, 217 MINOR** findings across six layers. You will fix ALL CRITICAL and ALL MAJOR. MINOR findings are fixed opportunistically when you touch the same file. Below are the **highest-impact CRITICAL findings with exact file:line and the required fix directive**. These are NOT the entirety of your work — they are the prioritized spine. After these, sweep the remaining CRITICAL/MAJOR findings file-by-file per the audit's Section 3.

**A. Auth & Login (the founder's reported bug — fix FIRST):**
- `src/components/sections/LoginSection.tsx` L36-63: submits `username: email` to the credentials provider, but `src/app/signup/SignupWizard.tsx` L148 stores `username: state.restaurantID` (the slug). **FIX:** unify the identifier. Either (a) make the credentials provider accept BOTH email and slug by looking up the account by either field, or (b) change the login form to collect the restaurant slug + password, with email as a secondary recovery path. Option (a) is better UX. The login form must also surface a real error message (not silently reset) on failure. Wire `sonner` toast: "Invalid credentials. Check your Restaurant ID and password."
- `src/app/signup/SignupWizard.tsx` L207-265 (`submitAll`): six sequential fetches with no `res.ok` check. A 400/500 on any step is swallowed and the wizard reports success. **FIX:** check `res.ok` on every fetch; on failure, throw with the server's error message; show the error on the relevant step; do NOT advance to dashboard until all steps succeed. Wrap the whole sequence in a transaction-like guard: if step 3 fails, the user can resume from step 3, not restart.
- `src/app/signup/SignupWizard.tsx` L~457 vs L100: placeholder says "Min 6 characters," validator requires 8. **FIX:** align both to 8, update the placeholder, add a live strength meter.
- `src/components/features/UserLogin.tsx` L98-110: `handleSendOtp` catch block silently calls `setStep("details")` for the demo restaurant on ANY OTP error — user "logs in" unverified. **FIX:** only skip OTP when a server-confirmed `demoMode` flag is returned; never skip on a catch. Surface real OTP errors.
- `src/types/next-auth.d.ts` L30-32: `interface Session extends AuthUser` is a type lie. **FIX:** declare `Session` with the correct NextAuth shape (`{ user: User; expires: string }`) and extend `User` with `role`, `restaurantID`, `username`. Audit every call site of `session.role` vs `session.user.role` and normalize.

**B. Order & Payment Financial Integrity (money-loss bugs — fix IMMEDIATELY after login):**
- `src/app/api/order/place/route.ts` L67-82: `validateAndRedeemCoupon()` runs BEFORE the `if (order)` branch — coupon `usedCount` increments but discount never applies to a merged order. **FIX:** redeem the coupon only after the order line items are finalized; if the merge path is taken, apply the discount to the merged total; on any failure, roll back `usedCount` atomically (use the existing coupon helper's transaction).
- `src/app/api/order/place/route.ts` L109-123 + `src/app/api/loyalty/route.ts` L68-75: loyalty points double-issued (place-award + `/api/loyalty` award). **FIX:** single source of truth — award loyalty ONLY in the order completion handler (payment success webhook), gated by `order.loyaltyAwarded` set atomically with a conditional update (`findOneAndUpdate({ _id, loyaltyAwarded: false }, { $set: { loyaltyAwarded: true }, $inc: { ... } })`). Remove the award path from `/api/loyalty` or make it a no-op when `loyaltyAwarded` is true.
- `src/app/api/order/place/route.ts` L84-107: non-cash orders get `state: undefined` → Mongoose default `"active"` → unpaid Razorpay/Stripe orders go active and reach the kitchen. **FIX:** for non-cash, set `state: "pending_payment"`; transition to `"active"` only on payment-verified webhook. Kitchen must NOT receive `pending_payment` orders.
- `src/app/api/order/place/route.ts` L138: `deductInventoryForOrder(...).catch(...)` fire-and-forget. Order confirmed before inventory deduction. **FIX:** `await` the deduction; on failure (insufficient stock), roll back the order (delete or mark `state: "rejected_inventory"`), restore any coupon, return a 409 to the customer with the out-of-stock item list. The deduction and the order save must be in the same Mongoose transaction.
- `src/app/api/order/cancel/route.ts` L23: `order.state = "cancel"` with no guard. **FIX:** only allow cancel from `state: "active"` or `state: "pending_payment"`; on cancel of a paid order, trigger refund; restore inventory; claw back loyalty (deduct the previously awarded points, floor at 0). Log to the immutable audit chain (Section 6.2).
- `src/app/api/kitchen/action/route.ts` L59-62: kitchen can mark an order `complete` regardless of payment status, bypassing admin + invoice generation. **FIX:** kitchen can only transition `preparing → ready`; `ready → complete` requires `paymentStatus: "paid"` AND an admin/cashier role. Unpaid `ready` orders block in a "Awaiting Payment" KDS column.

**C. Data Exposure & IDOR:**
- `src/app/api/menu/route.ts` L27-30: public menu exposes hidden items + leaks `phone`, `gstNumber`, `upiId` from profile. **FIX:** filter `m.hidden === false` on the menu array; build an explicit public profile DTO (name, tagline, logo, banner, currency, tax config display only — NEVER `phone`, `gstNumber`, `upiId`, `passwordHash`).
- `src/app/api/invoice/[id]/pdf/route.ts` L25: checks restaurant scope but NOT customer ownership — customer IDOR for PII. **FIX:** mirror the ownership check in `/api/invoice/[id]/route.ts` L24-31: require `invoice.customerId === sessionCustomerId` (or admin/cashier role).
- `src/app/api/refreshDemoData/route.ts` L80-86: `DEMO_MODE` check before admin auth — public mass-destruction if `DEMO_MODE=true` in prod. **FIX:** admin auth FIRST; hard-disable the route when `NODE_ENV === 'production'` (return 404); the demo seed passwords must NOT work against the real auth flow (use a separate demo auth namespace or disable demo logins in prod).

**D. Real-Time & Performance:**
- `src/app/api/order/stream/route.ts` L115-117: SSE runs BOTH a change-stream AND a 10s polling interval per client → MongoDB connection exhaustion. **FIX:** choose ONE. Prefer change-stream with a heartbeat comment every 15s to keep the proxy alive; remove the polling interval; cap concurrent streams per restaurant; close the stream on client disconnect (listen for `req.on('close')`).
- `src/components/features/OrderPage.tsx` L152-154: writes `searchValue` to URL on every keystroke — router thrash + input lag. **FIX:** debounce 300ms (`useDeferredValue` or a `setTimeout` with cleanup) before updating the URL.
- `src/app/scan/ScannerClient.tsx` L62-91: `setInterval(checkCapabilities, 500)` polls forever if camera denied — memory leak + CPU drain. **FIX:** cap retries (e.g., 20), exit on error state, clear interval in cleanup.

**E. Silent Sign-Out / Hydration Bugs:**
- `src/components/features/OrderPage.tsx` L156-161: `signOut()` fires when `session.data?.restaurant?.username !== restaurant?.username` — during hydration `restaurant` is undefined → erroneous sign-out. **FIX:** guard with a `isHydrated` flag (use `useEffect`'s mount + a ref); only compare once both are non-null; use a stable dependency array.
- `src/components/features/CartPage.tsx` L44-50: cancels order + signs out when `order.table !== table` but `table` can be null on first render. **FIX:** skip the effect when `table` is null; only act when both are defined and genuinely mismatched; never cancel on a transient null.

**F. Error Handling in Forms:**
- `src/app/dashboard/_components/Settings/PasswordSettings.tsx` L28-55 & L57-73: `await fetch` with no try/catch — network throw leaves button loading forever. **FIX:** wrap in try/catch/finally; `finally { setLoading(false) }`; surface network errors via Sonner.
- `src/app/platform/tenants/page.tsx` L60-75: `handleImpersonate` redirects to `/dashboard` regardless of `res.ok`. **FIX:** check `res.ok`; on failure, show error toast and stay on the tenants page; only redirect on success.

**G. Deployment Documentation (CRITICAL — onboarding blockers):**
- `DEPLOYMENT_ANALYSIS.md` L47-48: Empire/Brewpoint passwords listed as `empire@demo123` / `brewpoint@demo123` but code uses `empire@123` / `brewpoint@123`. **FIX:** reconcile docs to code OR (better) remove hardcoded demo passwords from docs entirely; document that demo creds are seeded and rotated.
- `docs/DEPLOYMENT.md` L149: health check uses wrong port (3000 vs actual 3050). **FIX:** correct to 3050 (or whatever `package.json` scripts.start specifies).
- `docs/DEPLOYMENT.md` L174, L209: references `REDIS_URL`; code reads `UPSTASH_REDIS_REST_URL`. **FIX:** correct the env var name; remove the false claim about OTP login failing without it (in-memory fallback exists).
- `docs/DEPLOYMENT.md` L186-187: references `WHATSAPP_BASE_URL` / `WHATSAPP_API_KEY`; code uses `OPENWA_API_URL`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`. **FIX:** correct the env var names to match `src/utils/whatsapp/*`.
- `docs/DEPLOYMENT.md` L339: claims CSP is in `next.config.ts`; it's in `middleware.ts` `buildCsp()`. **FIX:** correct the file reference.
- `DEPLOYMENT.md` L348: references `proxy.ts` — no such file exists. **FIX:** remove the reference; document `middleware.ts` as the edge layer.

**H. The Remaining CRITICAL/MAJOR Sweep:**
After A–G, walk every file listed in the audit's Section 3 (file-by-file). For each `[CRITICAL]` or `[MAJOR]` finding, apply the audit's stated fix. Track progress in `docs/AUDIT_REMEDIATION_TRACKER.md` with columns: `Finding ID | File:Line | Severity | Status | Commit SHA | Notes`. This tracker is part of the deliverable.

### 5.3 Env Var Reconciliation (MANDATORY)
Produce a single `.env.example` that lists EVERY env var the code actually reads. Scan all `process.env.*` references. Group them: Database, Auth, Payments, WhatsApp, Twilio, Email, AI, n8n, Storage (R2), Sentry, Redis, Feature Flags. Each entry has a comment: `# Required: yes/no | Used by: <file> | Description`. The deployment docs MUST point to this file as the single source of truth.

### 5.4 Phase 1 Exit Gate
- `bun run lint` green, zero warnings.
- `bun run build` green, zero errors.
- `bun run typecheck` green.
- All Jest tests pass.
- `docs/AUDIT_REMEDIATION_TRACKER.md` shows every CRITICAL + MAJOR as `Resolved` with a commit SHA.
- The founder's reported login bug is fixed and verified by a new Jest test that signs up via the wizard and logs in via the login form.

---

## SECTION 6 — PHASE 2: BLEEDING-NECK FIXES

The business autopsy (Context 2) is unambiguous: OrderWorder is a ₹1,500/month add-on until it solves theft (Bleeding Neck #2) and compliance (#3) and replaces the POS (#4, via POS essentials). These three features move ARPU from ₹1,500 to ₹2,500-3,500/month and unlock the chain segment. Build them in the order below.

### 6.1 Feature 2.1 — Inventory UI + Theft Detection Variance Report (Weeks 1-3)

**Why:** The backend (`src/utils/database/models/inventory.ts`, `models/recipe.ts`, `utils/database/helper/deductInventory.ts`) already exists. The operator UI does not. Without it, the inventory layer is inoperable and the variance report (the actual theft detector) cannot be generated.

**Build `Settings → Inventory` with these sub-modules:**

**6.1.1 Stock-In / GRN (Goods Receipt Note):**
- New model fields on `inventory.ts` if missing: `sku`, `unit` (kg/L/pcs), `openingStock`, `stockIn[]` (each: `{ qty, rate, supplier, invoiceRef, receivedBy, date }`), `wastage[]` (each: `{ qty, reasonCode, authorizedBy, date }`), `physicalCount[]` (each: `{ qty, countedBy, date }`), `currentStock` (computed), `reorderLevel`, `reorderQty`.
- UI: `src/app/dashboard/_components/Settings/SettingsInventory.tsx` with tabs: "Stock Items", "Stock-In / GRN", "Wastage Log", "Physical Count", "Variance Report", "Suppliers".
- Stock-In form: item selector (searchable combobox), qty, unit, rate, supplier (with supplier ledger create-on-the-fly), invoice ref, received-by (auto = logged-in user). On submit: push to `stockIn[]`, recompute `currentStock`, append to audit chain.

**6.1.2 Wastage Logging:**
- Reason codes enum: `spoilage`, `breakage`, `expired`, `over-portions`, `staff-consumption`, `sample`, `other` (with mandatory note).
- UI: quick-log modal accessible from the Stock Items table and from the KDS (chef logs wastage mid-service). Requires `authorizedBy` (role ≥ captain). Appends to `wastage[]` and audit chain.

**6.1.3 Low-Stock Alerts:**
- When `currentStock ≤ reorderLevel`, fire an n8n event `inventory.low_stock` with the item, current qty, reorder qty, supplier. The n8n workflow (Section 7.2 owner-report workflow also reads this) sends a WhatsApp alert to the owner. UI shows a persistent "Low Stock" badge in the sidebar + a dedicated alert tray.

**6.1.4 Supplier Ledger:**
- New model `supplier.ts`: `{ name, phone, gstin, items[], outstandingBalance, payments[] }`.
- UI: supplier list with outstanding balance; record-payment flow; ledger export (CSV + PDF).

**6.1.5 The Killer Sub-Feature — Daily Variance Report (THE theft detector):**
- Compute **theoretical consumption** per item per day: sum over all KDS-routed orders of `recipeBOM.qty * orderLine.qty` for each menu item that includes this inventory item in its BOM (`recipe.ts`).
- Compute **actual consumption**: `openingStock + Σ(stockIn.qty) − Σ(wastage.qty) − physicalCount.qty` (closing).
- **Variance** = `theoretical − actual`. Positive variance = missing stock (theft or unrecorded wastage). Negative variance = over-issuance or under-portioning.
- UI: `VarianceReport.tsx` — a table (item, theoretical, actual, variance, variance %, variance ₹ value at last purchase rate) with red highlighting for variance beyond a configurable threshold (default ±3% or ₹500, whichever lower). Charts: variance trend over 30 days per item; top-5 theft-suspect items.
- **Theft alert:** if variance exceeds threshold for any item, fire `inventory.theft_suspected` n8n event → owner WhatsApp alert (item, variance qty, ₹ value, shift, staff on duty).
- Schedule: the variance report is generated nightly by an n8n cron (or an Inngest nightly job) after the physical count is entered at shift close.

**6.1.6 Acceptance Criteria:**
- An operator can add stock, log wastage, enter a physical count, and see a variance report — all without leaving the dashboard.
- Seeded demo data produces a non-zero variance for at least one item, demonstrating the theft-detection flow end-to-end.
- Jest tests cover: `currentStock` recompute, variance math (theoretical vs actual), low-stock threshold trigger, audit-chain append on every mutation.

### 6.2 Feature 2.2 — Tamper-Proof GST (Weeks 4-6)

**Why:** The PetPooja ₹70,000 Cr tax-evasion scandal (Context 2, Table 11) is your asymmetric opening. Position OrderWorder as "the tamper-proof POS." This requires three sub-features: an immutable edit log with a cryptographic hash chain, a hard "no-bill-deletion mode," and GSTR-1/3B export + NIC e-invoice IRN/QR.

**6.2.1 Cryptographic Hash Chain Audit Log:**
- New collection `billAuditChain.ts`: `{ _id, billId, restaurantID, sequenceNo, prevHash, payloadHash, hash, actorRole, actorId, action, timestamp }`.
- `hash = sha256(prevHash + payloadHash + sequenceNo + restaurantID + timestamp)`. `payloadHash = sha256(JSON.stringify(canonicalBillSnapshot))`.
- Every mutation to a bill (create, edit, cancel, refund, void) appends a chain entry. The chain is append-only — no updates, no deletes (enforce at the DB layer with a pre-delete hook that throws).
- A nightly job (n8n cron or Inngest) re-walks the chain from genesis and verifies `hash === recomputedHash` for every entry; any break fires a `compliance.chain_broken` alert to owner + CA.
- UI: `Settings → Audit Chain` shows the chain (paginated, filterable by bill), with a green "Chain verified ✓" badge or a red "CHAIN BROKEN AT #N" banner.

**6.2.2 Hard "No-Bill-Deletion Mode" (the PetPooja antithesis):**
- A restaurant-level setting `profile.settings.noDeleteMode: boolean` (default `true` for new accounts — make tamper-proof the default).
- When `noDeleteMode` is on: the "Delete bill" UI action is removed; the API returns 403 on any delete attempt; a bill can only be `voided` (with a reason code, a second authorized role, and a hash-chain entry) — never deleted.
- When an owner toggles `noDeleteMode` OFF, the toggle itself is hash-chained, a `compliance.no_delete_disabled` alert fires to owner + CA, and the toggle requires a second-factor confirmation (OTP to owner phone).

**6.2.3 GSTR-1 / GSTR-3B Export:**
- Build `src/utils/gst/gstrExport.ts` that produces JSON in the official GST portal schema (GSTR-1: B2B, B2C, HSN summary, document issued; GSTR-3B: outward supplies, ITC, net tax payable).
- UI: `Settings → GST Returns` — pick month, pick return type (1 or 3B), preview the JSON, download JSON + CSV + PDF. Show a reconciliation summary: total outward supplies, CGST/SGST/IGST split, document count vs chain count (must match — else red flag).
- An "accountant" role (`rbac.ts` already supports custom roles) gets read-only access to this screen — the CA channel from the autopsy.

**6.2.4 E-Invoice IRN + QR via NIC API:**
- Build `src/utils/gst/nicEinvoice.ts` implementing the NIC e-invoice API (sandbox: `https://einvoice-1-sandbox.nic.in`): auth (via ASN), generate IRN, cancel IRN, get IRN details, generate QR code.
- Flow: on bill finalization (payment success for B2B invoices with GSTIN), call NIC to generate IRN + QR; store `irn`, `ackNo`, `ackDt`, `qrPayload` on the invoice; render the QR on the invoice PDF (`src/components/layout/InvoiceDocument.tsx`).
- Feature-flag: `EINVOICE_ENABLED` + `NIC_ENV=sandbox|prod` + `NIC_ASN`, `NIC_USER`, `NIC_PASSWORD`, `NIC_GSTIN`. When disabled, skip IRN generation but still produce a GST-compliant invoice. Document the flag in the runbook.
- **If you cannot test against the NIC sandbox:** build the integration, gate it behind the flag, ship a mock that returns a valid-shaped IRN response, and document the go-live steps in `docs/EINVOICE_GO_LIVE.md`. Do NOT fake a real IRN.

**6.2.5 Acceptance Criteria:**
- A bill can be created, edited (with reason), voided (with reason + 2nd authorizer), but never deleted — verified by a test that attempts a delete and expects 403.
- The hash chain verifies clean after 1,000 simulated bill mutations.
- GSTR-1 export for a seeded month matches a hand-computed total.
- IRN generation works in sandbox OR is documented-as-flagged with a mock.

### 6.3 Feature 2.3 — POS Essentials (Weeks 7-10)

**Why:** Without KOT print, a cashier billing screen, cash tender, and shift X/Z, OrderWorder is an add-on, not a replacement. This feature is the difference between "we use OrderWorder alongside PetPooja" and "we cancelled PetPooja."

**6.3.1 ESC/POS KOT Print:**
- Build `src/utils/print/escpos.ts` — an ESC/POS command builder (init, text, bold, align, cut, drawer-kick, QR, barcode). Output as a `Uint8Array` for the printer.
- Build `src/utils/print/kot.ts` — formats a KOT: restaurant name, table, order #, timestamp, steward, item × qty, modifiers, KOT serial number, "——— KOT ———" header. One KOT per course/station.
- Printer transport: support both **USB** (via WebUSB in the browser, with a pairing flow) and **LAN** (raw TCP to the printer IP:9100, via a small Next.js API route proxy or a local print agent). Document the LAN path as the recommended one for kitchens.
- UI: a "Print KOT" button on the KDS order card; auto-print on order acceptance (configurable). A print-queue indicator (retry on failure).
- Acceptance: a KOT prints cleanly to a 2-inch (58mm) or 3-inch (80mm) thermal printer; the layout is legible; the serial number is unique and hash-chained.

**6.3.2 Cashier Billing Screen:**
- New route `src/app/dashboard/_components/Cashier/CashierBilling.tsx` — a fast, keyboard-driven billing screen (PetPooja's speed is the bar).
- Features: table/order search, item add by SKU/name (fuzzy), quantity, modifiers, hold/recall bill, split bill (the `splitPayment` model exists), combine bills, discount application (with reason + authorization for >X%), cash tender with auto-change calculation, UPI deep-link generation, bill print (A5 + thermal), bill email/WhatsApp.
- Keyboard shortcuts: F1 search, F2 hold, F3 recall, F4 discount, F5 print, F6 pay cash, F7 pay UPI, Esc cancel. Show a shortcuts overlay on `?`.
- Cash drawer kick on cash tender (ESC/POS command `1B 70 00 32 00`).

**6.3.3 Shift X Report (mid-shift):**
- A snapshot of the current shift's activity: opening cash, sales by payment mode, voids, discounts, refunds, KOT count, tips. Does NOT close the shift. Printable.

**6.3.4 Shift Z Report (end-of-day cash closing):**
- Closes the shift. Requires entering the counted cash in the drawer. Computes expected cash = opening + cash sales − cash refunds − cash payouts + cash tips. **Variance = counted − expected.**
- If variance ≠ 0 (configurable tolerance, default ₹0), the Z report flags it; if variance < 0 (short) beyond tolerance, fire `cash.shift_short` n8n alert to owner (this connects to Killer Feature 3 — Shift-Z).
- Z report is printable, hash-chained, and stored. After Z, the shift is locked; further bills require a new shift.

**6.3.5 Acceptance Criteria:**
- A cashier can take an order, tender cash, give change, print a KOT + bill, and close the shift with a Z report — all in under 60 seconds (the PetPooja speed bar).
- Shift X and Z reports are correct against seeded data (verified by Jest).
- ESC/POS output is byte-accurate against a reference KOT (include a fixture in tests).

### 6.5 Phase 2 Exit Gate
- All three sub-features pass their acceptance criteria.
- The hash chain is verified clean after the full Phase 2 test suite runs.
- `bun run lint && build && typecheck && test` all green.
- `docs/PHASE_2_COMPLETE.md` written.

---

## SECTION 7 — PHASE 3: THE 5 KILLER FEATURES

Each feature = a Next.js (API + UI) component + an n8n workflow (importable JSON). The repo already has `src/lib/n8n/dispatcher.ts` — use `dispatchEvent(eventName, payload)` to fire events into n8n. Inbound n8n → app calls land at `src/app/api/webhooks/n8n/route.ts` (secure with an `N8N_WEBHOOK_SECRET` HMAC header).

### 7.1 Killer Feature 1 — The "Zomato/Swiggy Commission Saver"

**Concept:** Save the customer's phone on QR scan/pay. n8n sends a WhatsApp offer 3 days later for direct ordering. 0% aggregator commission.

**Next.js side:**
- Extend `customer.ts` model: ensure `phone`, `firstSeenAt`, `lastOrderAt`, `optInWhatsApp`, `source: 'qr' | 'aggregator' | 'direct'`.
- On QR scan (`src/app/scan/page.tsx` → `src/app/[restaurant]/table/[tableId]/page.tsx`), capture phone (optional, with a clear opt-in + WhatsApp template consent). On UPI pay success, re-confirm phone.
- On order completion, dispatch `customer.acquired` to n8n with `{ customerPhone, restaurantID, orderTotal, tableId, acquiredAt }`.
- A "Direct Order" landing page `src/app/[restaurant]/direct/page.tsx` — the link n8n sends. It bypasses aggregators; shows a "Welcome back, here's 10% off your direct order" banner with a one-tap UPI pay.

**n8n workflow `commission_saver.json` (D+3 WhatsApp offer):**
```json
{
  "name": "OrderWorder — Commission Saver (D+3 WhatsApp)",
  "active": true,
  "nodes": [
    {
      "parameters": { "httpMethod": "POST", "path": "orderworder/customer-acquired", "responseMode": "responseNode" },
      "id": "acquired-webhook", "name": "Customer Acquired", "type": "n8n-nodes-base.webhook", "typeVersion": 1.1, "position": [0, 0]
    },
    {
      "parameters": { "dataType": "date", "value": "={{ $json.body.acquiredAt }}", "offset": 259200 },
      "id": "schedule-d3", "name": "Wait 3 Days", "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1, "position": [220, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.ORDERWORDER_API }}/api/internal/customer/eligibility",
        "sendHeaders": true,
        "headerParameters": { "parameters": [{ "name": "X-N8N-Secret", "value": "={{ $env.N8N_WEBHOOK_SECRET }}" }] },
        "sendBody": true, "bodyParameters": { "parameters": [{ "name": "customerPhone", "value": "={{ $json.body.customerPhone }}" }, { "name": "restaurantID", "value": "={{ $json.body.restaurantID }}" }] }
      },
      "id": "check-eligible", "name": "Check Eligibility (no repeat order)", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [440, 0]
    },
    {
      "parameters": { "conditions": { "boolean": [{ "value1": "={{ $json.eligible }}", "value2": true }] } },
      "id": "if-eligible", "name": "Eligible?", "type": "n8n-nodes-base.if", "typeVersion": 1, "position": [660, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "authentication": "genericCredentialType", "genericAuthType": "whatsappCloudApi",
        "sendBody": true, "contentType": "json",
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.customerPhone }}\",\n  \"type\": \"template\",\n  \"template\": {\n    \"name\": \"direct_order_offer\",\n    \"language\": { \"code\": \"en\" },\n    \"components\": [{ \"type\": \"body\", \"parameters\": [{ \"type\": \"text\", \"text\": \"{{ $json.offerCode }}\" }, { \"type\": \"text\", \"text\": \"{{ $json.directOrderUrl }}\" }] }]\n  }\n}"
      },
      "id": "send-wa", "name": "Send WhatsApp Offer", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [880, -100]
    },
    {
      "parameters": { "respondWith": "json", "responseBody": "={\"status\":\"scheduled\"}" },
      "id": "respond", "name": "Respond", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1, "position": [880, 100]
    }
  ],
  "connections": {
    "Customer Acquired": { "main": [[{ "node": "Wait 3 Days", "type": "main", "index": 0 }]] },
    "Wait 3 Days": { "main": [[{ "node": "Check Eligibility (no repeat order)", "type": "main", "index": 0 }]] },
    "Check Eligibility (no repeat order)": { "main": [[{ "node": "Eligible?", "type": "main", "index": 0 }]] },
    "Eligible?": { "main": [[{ "node": "Send WhatsApp Offer", "type": "main", "index": 0 }], [{ "node": "Respond", "type": "main", "index": 0 }]] },
    "Send WhatsApp Offer": { "main": [[{ "node": "Respond", "type": "main", "index": 0 }]] }
  },
  "settings": { "executionOrder": "v1" }
}
```
**WhatsApp template `direct_order_offer`:** body `"Hi! Here's your code {{1}} for 10% off your next direct order (no app fees). Tap: {{2}}"`. Register + approve in Meta WhatsApp Manager.

**Internal API:** `src/app/api/internal/customer/eligibility/route.ts` — verifies `N8N_WEBHOOK_SECRET`, returns `{ eligible: boolean, offerCode, directOrderUrl }`. Eligible = customer has not placed a 2nd order in the last 3 days (so we don't spam repeat customers).

### 7.2 Killer Feature 2 — The "11 PM Owner WhatsApp Report"

**Concept:** n8n cron at 11 PM IST queries the DB (via an internal read API) and sends the owner a WhatsApp summary: total bills, sale, GST collected, inventory warnings, theft alerts, shift variance.

**Next.js side:**
- `src/app/api/internal/daily-summary/route.ts` — protected by `N8N_WEBHOOK_SECRET`. Accepts `{ restaurantID, date }`. Returns `{ totalBills, grossSales, netSales, cgst, sgst, igst, paymentBreakdown: {cash, upi, card}, voids, refunds, lowStockItems[], theftAlerts[], shiftVariance, topItems[], newCustomers, returningCustomers }`.
- The aggregation uses the existing order/invoice models + the new inventory/audit models.

**n8n workflow `owner_daily_report.json`:**
```json
{
  "name": "OrderWorder — 11 PM Owner Report",
  "active": true,
  "nodes": [
    {
      "parameters": { "rule": { "interval": [{ "field": "cronExpression", "expression": "0 19 * * *" }] } },
      "id": "cron-11pm-ist", "name": "11 PM IST Cron (19:00 UTC)", "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1, "position": [0, 0]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.ORDERWORDER_API }}/api/internal/restaurants/active",
        "sendHeaders": true,
        "headerParameters": { "parameters": [{ "name": "X-N8N-Secret", "value": "={{ $env.N8N_WEBHOOK_SECRET }}" }] }
      },
      "id": "list-restaurants", "name": "List Active Restaurants", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [220, 0]
    },
    {
      "parameters": {},
      "id": "split", "name": "Split By Restaurant", "type": "n8n-nodes-base.splitInItems", "typeVersion": 1, "position": [440, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.ORDERWORDER_API }}/api/internal/daily-summary",
        "sendHeaders": true,
        "headerParameters": { "parameters": [{ "name": "X-N8N-Secret", "value": "={{ $env.N8N_WEBHOOK_SECRET }}" }] },
        "sendBody": true, "contentType": "json",
        "specifyBody": "json",
        "jsonBody": "={\"restaurantID\":\"{{ $json.restaurantID }}\",\"date\":\"{{ $today.toISODate() }}\"}"
      },
      "id": "fetch-summary", "name": "Fetch Daily Summary", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [660, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "authentication": "genericCredentialType", "genericAuthType": "whatsappCloudApi",
        "sendBody": true, "contentType": "json", "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\":\"whatsapp\",\n  \"to\":\"{{ $json.ownerPhone }}\",\n  \"type\":\"template\",\n  \"template\":{\n    \"name\":\"daily_owner_report\",\n    \"language\":{\"code\":\"en\"},\n    \"components\":[\n      {\"type\":\"body\",\"parameters\":[\n        {\"type\":\"text\",\"text\":\"{{ $json.date }}\"},\n        {\"type\":\"text\",\"text\":\"{{ $json.totalBills }}\"},\n        {\"type\":\"text\",\"text\":\"₹{{ $json.netSales }}\"},\n        {\"type\":\"text\",\"text\":\"₹{{ $json.cgst + $json.sgst + $json.igst }}\"},\n        {\"type\":\"text\",\"text\":\"{{ $json.lowStockItems.length }}\"},\n        {\"type\":\"text\",\"text\":\"{{ $json.theftAlerts.length }}\"},\n        {\"type\":\"text\",\"text\":\"₹{{ $json.shiftVariance }}\"}\n      ]}\n    ]\n  }\n}"
      },
      "id": "send-wa", "name": "Send WhatsApp Report", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [880, 0]
    }
  ],
  "connections": {
    "11 PM IST Cron (19:00 UTC)": { "main": [[{ "node": "List Active Restaurants", "type": "main", "index": 0 }]] },
    "List Active Restaurants": { "main": [[{ "node": "Split By Restaurant", "type": "main", "index": 0 }]] },
    "Split By Restaurant": { "main": [[{ "node": "Fetch Daily Summary", "type": "main", "index": 0 }]] },
    "Fetch Daily Summary": { "main": [[{ "node": "Send WhatsApp Report", "type": "main", "index": 0 }]] }
  },
  "settings": { "executionOrder": "v1" }
}
```
**WhatsApp template `daily_owner_report`:** body `"📋 {{1}} Daily Report\nBills: {{2}} | Sale: ₹{{3}} | GST: ₹{{4}}\nLow-stock items: {{5}} | Theft alerts: {{6}}\nShift variance: ₹{{7}}\n— OrderWorder"`. Register with Meta (parameters must match the template registration).

### 7.3 Killer Feature 3 — "Shift-Z" Cashier Lock

**Concept:** Cashier enters starting cash at shift open. On "End Shift," the system asks for counted counter-cash. If counted < expected, a RED flag + owner alert. (This is the cashier-facing layer over Feature 2.3.4's Z report.)

**Next.js side:**
- New model `shift.ts`: `{ _id, restaurantID, cashierId, openedAt, closedAt, openingCash, countedCash, expectedCash, variance, status: 'open'|'closed'|'flagged', bills[], kotCount, flaggedReason }`.
- `src/app/dashboard/_components/Cashier/ShiftOpen.tsx` — requires entering opening cash to begin a shift. Locks the cashier screen until a shift is open (no billing without an open shift).
- `src/app/dashboard/_components/Cashier/ShiftClose.tsx` — the End Shift flow: shows expected cash (opening + cash sales − cash refunds − payouts + cash tips), prompts for counted cash, computes variance. If `counted < expected - tolerance`: status = `flagged`, red banner, dispatch `cash.shift_short` n8n event with `{ restaurantID, cashierId, expected, counted, shortfall, shiftId }`.
- A shift cannot be re-opened; a new shift must start. Mid-shift, only Shift X (snapshot) is available.

**n8n workflow `shift_short_alert.json`:**
```json
{
  "name": "OrderWorder — Shift-Z Shortfall Alert",
  "active": true,
  "nodes": [
    {
      "parameters": { "httpMethod": "POST", "path": "orderworder/shift-short", "responseMode": "responseNode" },
      "id": "short-webhook", "name": "Shift Short Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 1.1, "position": [0, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "authentication": "genericCredentialType", "genericAuthType": "whatsappCloudApi",
        "sendBody": true, "contentType": "json", "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\":\"whatsapp\",\n  \"to\":\"{{ $json.body.ownerPhone }}\",\n  \"type\":\"template\",\n  \"template\":{\n    \"name\":\"shift_short_alert\",\n    \"language\":{\"code\":\"en\"},\n    \"components\":[{\"type\":\"body\",\"parameters\":[\n      {\"type\":\"text\",\"text\":\"{{ $json.body.cashierName }}\"},\n      {\"type\":\"text\",\"text\":\"₹{{ $json.body.expected }}\"},\n      {\"type\":\"text\",\"text\":\"₹{{ $json.body.counted }}\"},\n      {\"type\":\"text\",\"text\":\"₹{{ $json.body.shortfall }}\"}\n    ]}]\n  }\n}"
      },
      "id": "send-wa", "name": "Alert Owner WhatsApp", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [220, 0]
    },
    {
      "parameters": { "respondWith": "json", "responseBody": "={\"status\":\"alert_sent\"}" },
      "id": "respond", "name": "Respond", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1, "position": [440, 0]
    }
  ],
  "connections": {
    "Shift Short Webhook": { "main": [[{ "node": "Alert Owner WhatsApp", "type": "main", "index": 0 }]] },
    "Alert Owner WhatsApp": { "main": [[{ "node": "Respond", "type": "main", "index": 0 }]] }
  },
  "settings": { "executionOrder": "v1" }
}
```

### 7.4 Killer Feature 4 — Digital Waiter Tips

**Concept:** On the UPI payment screen, add "Add Tip for Staff? (₹20 / ₹50 / Custom)." Track per-waiter.

**Next.js side:**
- Extend `order.ts` with `tip: { amount, waiterId, waiterName, tippedAt }` (default amount 0).
- On the UPI pay screen (`src/components/features/CartPage.tsx` payment step, or the cashier billing screen): a tip selector — three preset chips (₹20, ₹50, ₹100), a "Custom" input, and "No tip." Selected tip adds to the UPI deep-link amount and to the Razorpay order amount.
- On payment success webhook: record `order.tip`; increment the waiter's tip ledger.
- New model `tipLedger.ts` (or extend `account.ts` staff): `{ waiterId, waiterName, restaurantID, totalTips, tips[]: { amount, orderId, date, paidOut: false } }`.
- Dashboard: `Analytics → Staff Tips` — per-waiter total (today/week/month), payout status, mark-as-paid flow. A weekly n8n report can send each waiter their tip total via WhatsApp (optional extension).

**UI/UX mandate:** the tip selector must NOT feel like a guilt-trip dark pattern — clear "No tip" affordance, accessible, never pre-selected. This is a trust feature, not a squeeze.

### 7.5 Killer Feature 5 — Dine-in Feedback & Refund Automation

**Concept:** Post-pay WhatsApp link "Rate (1-5 stars)." 1-2 stars triggers immediate owner alert + owner generates a refund code via the system to the customer's WhatsApp.

**Next.js side:**
- The `feedback.ts` model exists. Extend: `{ rating (1-5), tags[], comment, orderId, customerId, customerPhone, refunded: false, refundCode, refundAmount, createdAt }`.
- On payment success, dispatch `payment.completed` n8n event with `{ orderId, customerPhone, restaurantID }`. n8n sends the rating link via WhatsApp.
- Rating page `src/app/feedback/[token]/page.tsx` — a beautiful, fast, mobile-first 5-star rating (animated star fill on tap, haptic via `navigator.vibrate`), optional tags ("Food quality", "Service", "Cleanliness", "Wait time"), optional comment, submit.
- On submit: if `rating ≤ 2`, dispatch `feedback.negative` n8n event → owner WhatsApp alert (instant) with a one-tap "Generate refund code" deep link into the dashboard.
- Owner dashboard: `Feedback → Negative` inbox; each item has a "Generate Refund Code" action → creates a single-use `refundCode` tied to the order; the refund code + amount is sent to the customer's WhatsApp via n8n; the customer redeems it on their next direct order (or it triggers a Razorpay refund to the original payment method if within the refund window).
- The refund action appends to the hash-chain audit log (Section 6.2.1) — refunds are tamper-proof too.

**n8n workflow `feedback_automation.json` (rating link + negative-loop):**
```json
{
  "name": "OrderWorder — Feedback + Refund Automation",
  "active": true,
  "nodes": [
    {
      "parameters": { "httpMethod": "POST", "path": "orderworder/payment-completed", "responseMode": "responseNode" },
      "id": "pay-webhook", "name": "Payment Completed", "type": "n8n-nodes-base.webhook", "typeVersion": 1.1, "position": [0, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "authentication": "genericCredentialType", "genericAuthType": "whatsappCloudApi",
        "sendBody": true, "contentType": "json", "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\":\"whatsapp\",\n  \"to\":\"{{ $json.body.customerPhone }}\",\n  \"type\":\"template\",\n  \"template\":{\n    \"name\":\"rate_your_visit\",\n    \"language\":{\"code\":\"en\"},\n    \"components\":[{\"type\":\"body\",\"parameters\":[\n      {\"type\":\"text\",\"text\":\"{{ $json.body.restaurantName }}\"},\n      {\"type\":\"text\",\"text\":\"{{ $env.PUBLIC_URL }}/feedback/{{ $json.body.token }}\"}\n    ]}]\n  }\n}"
      },
      "id": "send-rating-link", "name": "Send Rating Link", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [220, 0]
    },
    {
      "parameters": { "respondWith": "json", "responseBody": "={\"status\":\"rating_link_sent\"}" },
      "id": "respond-1", "name": "Respond", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1, "position": [440, 0]
    },
    {
      "parameters": { "httpMethod": "POST", "path": "orderworder/feedback-negative", "responseMode": "responseNode" },
      "id": "neg-webhook", "name": "Negative Feedback (≤2★)", "type": "n8n-nodes-base.webhook", "typeVersion": 1.1, "position": [0, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "authentication": "genericCredentialType", "genericAuthType": "whatsappCloudApi",
        "sendBody": true, "contentType": "json", "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\":\"whatsapp\",\n  \"to\":\"{{ $json.body.ownerPhone }}\",\n  \"type\":\"template\",\n  \"template\":{\n    \"name\":\"negative_feedback_alert\",\n    \"language\":{\"code\":\"en\"},\n    \"components\":[{\"type\":\"body\",\"parameters\":[\n      {\"type\":\"text\",\"text\":\"{{ $json.body.customerName }}\"},\n      {\"type\":\"text\",\"text\":\"{{ $json.body.rating }}★\"},\n      {\"type\":\"text\",\"text\":\"{{ $json.body.comment }}\"},\n      {\"type\":\"text\",\"text\":\"{{ $env.PUBLIC_URL }}/dashboard/feedback?orderId={{ $json.body.orderId }}\"}\n    ]}]\n  }\n}"
      },
      "id": "alert-owner", "name": "Alert Owner", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [220, 200]
    },
    {
      "parameters": { "httpMethod": "POST", "path": "orderworder/refund-code-generated", "responseMode": "responseNode" },
      "id": "refund-webhook", "name": "Refund Code Generated", "type": "n8n-nodes-base.webhook", "typeVersion": 1.1, "position": [0, 400]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "authentication": "genericCredentialType", "genericAuthType": "whatsappCloudApi",
        "sendBody": true, "contentType": "json", "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\":\"whatsapp\",\n  \"to\":\"{{ $json.body.customerPhone }}\",\n  \"type\":\"template\",\n  \"template\":{\n    \"name\":\"refund_code\",\n    \"language\":{\"code\":\"en\"},\n    \"components\":[{\"type\":\"body\",\"parameters\":[\n      {\"type\":\"text\",\"text\":\"{{ $json.body.refundCode }}\"},\n      {\"type\":\"text\",\"text\":\"₹{{ $json.body.refundAmount }}\"},\n      {\"type\":\"text\",\"text\":\"{{ $env.PUBLIC_URL }}/{{ $json.body.restaurantID }}/direct\"}\n    ]}]\n  }\n}"
      },
      "id": "send-refund-wa", "name": "Send Refund Code to Customer", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [220, 400]
    },
    {
      "parameters": { "respondWith": "json", "responseBody": "={\"status\":\"sent\"}" },
      "id": "respond-2", "name": "Respond", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1, "position": [440, 400]
    }
  ],
  "connections": {
    "Payment Completed": { "main": [[{ "node": "Send Rating Link", "type": "main", "index": 0 }]] },
    "Send Rating Link": { "main": [[{ "node": "Respond", "type": "main", "index": 0 }]] },
    "Negative Feedback (≤2★)": { "main": [[{ "node": "Alert Owner", "type": "main", "index": 0 }]] },
    "Refund Code Generated": { "main": [[{ "node": "Send Refund Code to Customer", "type": "main", "index": 0 }]] },
    "Send Refund Code to Customer": { "main": [[{ "node": "Respond", "type": "main", "index": 0 }]] }
  },
  "settings": { "executionOrder": "v1" }
}
```

**WhatsApp templates required (register in Meta WhatsApp Manager, get them approved — this is a documentation deliverable in `docs/WHATSAPP_TEMPLATES.md`):** `direct_order_offer`, `daily_owner_report`, `shift_short_alert`, `rate_your_visit`, `negative_feedback_alert`, `refund_code`. Each must be submitted with the exact parameter count and order matching the JSON above.

### 7.6 Phase 3 Exit Gate
- All 5 n8n JSON workflows are valid (import-tested mentally against the n8n node schema; provide a `docs/n8n/IMPORT.md` with import steps).
- All 5 Next.js-side features pass Jest tests (mock the n8n dispatch; assert the event payload shape).
- The 6 WhatsApp templates are documented in `docs/WHATSAPP_TEMPLATES.md` with exact body text, parameter order, and category (MARKETING / UTILITY).
- `bun run lint && build && typecheck && test` green.

---

## SECTION 8 — FINAL OUTPUT FORMAT

### 8.1 File Structure (what you will create / modify)
Produce the complete file tree of additions and modifications. Example (non-exhaustive — fill in fully):
```
MODIFIED:
  src/components/sections/LoginSection.tsx              # audit fix A
  src/app/signup/SignupWizard.tsx                        # audit fix A
  src/components/features/UserLogin.tsx                  # audit fix A
  src/types/next-auth.d.ts                               # audit fix A
  src/app/api/order/place/route.ts                       # audit fix B (financial)
  src/app/api/order/cancel/route.ts                      # audit fix B
  src/app/api/kitchen/action/route.ts                    # audit fix B
  src/app/api/loyalty/route.ts                           # audit fix B
  src/app/api/menu/route.ts                              # audit fix C
  src/app/api/invoice/[id]/pdf/route.ts                  # audit fix C
  src/app/api/refreshDemoData/route.ts                   # audit fix C
  src/app/api/order/stream/route.ts                      # audit fix D
  src/components/features/OrderPage.tsx                  # audit fix D + E
  src/components/features/CartPage.tsx                   # audit fix E
  src/app/scan/ScannerClient.tsx                         # audit fix D
  src/app/dashboard/_components/Settings/PasswordSettings.tsx  # audit fix F
  src/app/platform/tenants/page.tsx                      # audit fix F
  src/utils/database/models/inventory.ts                 # Phase 2.1
  src/utils/database/models/profile.ts                   # noDeleteMode setting
  src/components/layout/InvoiceDocument.tsx              # IRN/QR rendering
  src/lib/n8n/dispatcher.ts                              # new events
  src/app/api/webhooks/n8n/route.ts                      # new inbound handlers
  docs/DEPLOYMENT.md, DEPLOYMENT.md, DEPLOYMENT_ANALYSIS.md  # audit fix G
  .env.example                                            # Section 5.3

NEW:
  src/utils/database/models/shift.ts
  src/utils/database/models/supplier.ts
  src/utils/database/models/billAuditChain.ts
  src/utils/database/models/tipLedger.ts
  src/utils/gst/gstrExport.ts
  src/utils/gst/nicEinvoice.ts
  src/utils/print/escpos.ts
  src/utils/print/kot.ts
  src/app/dashboard/_components/Settings/SettingsInventory.tsx
  src/app/dashboard/_components/Settings/SettingsGST.tsx
  src/app/dashboard/_components/Settings/SettingsAuditChain.tsx
  src/app/dashboard/_components/Cashier/CashierBilling.tsx
  src/app/dashboard/_components/Cashier/ShiftOpen.tsx
  src/app/dashboard/_components/Cashier/ShiftClose.tsx
  src/app/dashboard/_components/Cashier/ShiftXReport.tsx
  src/app/dashboard/_components/Cashier/ShiftZReport.tsx
  src/app/dashboard/_components/Inventory/VarianceReport.tsx
  src/app/dashboard/_components/Feedback/NegativeFeedbackInbox.tsx
  src/app/feedback/[token]/page.tsx
  src/app/[restaurant]/direct/page.tsx
  src/app/api/internal/customer/eligibility/route.ts
  src/app/api/internal/daily-summary/route.ts
  src/app/api/internal/restaurants/active/route.ts
  src/app/api/cashier/shift/open/route.ts
  src/app/api/cashier/shift/close/route.ts
  src/app/api/tips/route.ts
  src/app/api/refund/generate-code/route.ts
  src/app/api/gstr/export/route.ts
  src/app/api/audit-chain/verify/route.ts
  src/app/api/print/kot/route.ts
  docs/n8n/commission_saver.json
  docs/n8n/owner_daily_report.json
  docs/n8n/shift_short_alert.json
  docs/n8n/feedback_automation.json
  docs/n8n/tip_weekly_report.json        # optional, Feature 4 extension
  docs/WHATSAPP_TEMPLATES.md
  docs/EINVOICE_GO_LIVE.md
  docs/PHASE_1_COMPLETE.md
  docs/PHASE_2_COMPLETE.md
  docs/PHASE_3_COMPLETE.md
  docs/AUDIT_REMEDIATION_TRACKER.md
  docs/DEPLOYMENT_RUNBOOK.md
  docs/SECURITY_CHECKLIST.md
```

### 8.2 Code Delivery Rules (ZERO TOLERANCE for snippets)
- Every file you create or modify is delivered as a **complete file**, start to finish. No `// ... existing code ...`. No `// ... rest unchanged ...`. No "imagine the rest." If the file is 800 lines, you output 800 lines.
- Every code block is fenced with the language tag (```typescript, ```json, ```tsx) so the agent's downstream parser can extract it.
- Every new file begins with a 2-4 line header comment: `/** @file <purpose> * @phase <1|2|3> * @audit-finding <ID or 'n/a'> */`.
- Imports are sorted, unused imports removed, no circular imports.

### 8.3 n8n Workflow Delivery
- Each of the 5 (or 6) workflows is delivered as a standalone `.json` file in `docs/n8n/`.
- Each JSON is importable into n8n Cloud via "Import from File" with zero edits.
- Each workflow uses `{{ $env.X }}` for ALL secrets — never hardcodes a token. The required env vars are listed in `docs/n8n/README.md`.
- `docs/n8n/README.md` documents: import steps, credential setup (WhatsApp Cloud API generic credential), env var table, test-fire steps, and the webhook secret rotation procedure.

### 8.4 Verification Commands (the agent must run and show green output)
```bash
bun install
bun run lint          # zero warnings
bun run typecheck     # zero errors
bun run test          # all pass
bun run build         # zero errors, zero warnings
git log --oneline     # shows audit-fix + phase commits
git log -p | grep -i "github_pat"   # MUST return nothing
```

### 8.5 Deployment Readiness Checklist (the final gate)
- [ ] `.env.example` complete and matches all `process.env.*` reads.
- [ ] `vercel.json` correct (build command, output dir, env var allow-list).
- [ ] `docs/DEPLOYMENT_RUNBOOK.md` walks a new operator from clone to live in <30 minutes, with correct ports, env vars, and webhook URLs.
- [ ] n8n workflows imported and test-fired (document the test-fire output).
- [ ] WhatsApp templates submitted for approval (document submission status).
- [ ] Sentry DSN configured; a test error captured.
- [ ] The hash-chain audit log verifies clean after a full seed + order + refund cycle.
- [ ] The Cheap UI Detector passes on every new screen (screenshots or design notes in `docs/PHASE_3_COMPLETE.md`).

---

## SECTION 9 — SECURITY & COMPLIANCE MANDATES

### 9.1 Secrets
- ZERO secrets in code. All via env vars. The provided GitHub PAT is used ONLY at `git push` time, via the remote URL, and is NEVER written to a file, a commit message, or a branch name. After the push, the PAT must be rotated by the owner (see Section 10).
- `.env*` (except `.env.example`) in `.gitignore` (verify it is).
- Webhook secrets (`N8N_WEBHOOK_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`) verified via HMAC, not string equality; use constant-time comparison.

### 9.2 OWASP Top 10 (the floor)
- A01 Broken Access Control: every admin/cashier/internal API route checks role via `rbac.ts`; the new `/api/internal/*` routes verify `N8N_WEBHOOK_SECRET`.
- A02 Cryptographic Failures: bcrypt for passwords (already); the hash chain uses SHA-256 (consider SHA-256 with a server-side pepper for the chain); no plaintext PII in logs.
- A03 Injection: Mongoose queries use typed fields, no `$where` with user input; sanitizeHtml on any user-provided HTML.
- A04 Insecure Design: the no-delete mode, the hash chain, and the shift-Z lock are secure-by-default.
- A05 Misconfig: CSP in `middleware.ts` tightened (no `unsafe-inline` if avoidable — use nonces); `X-Frame-Options: DENY` on dashboard; `X-Content-Type-Options: nosniff`; HSTS in prod.
- A07 Auth Failures: rate-limit OTP send + login (the existing `rateLimit.ts`); lockout after 5 failed logins; OTP expiry ≤5 min.
- A08 Software & Data Integrity: the hash chain IS this control.
- A09 Logging: every financial mutation logs to the chain + Sentry; no PII in Sentry tags.
- A10 SSRF: the n8n HTTP request nodes target `{{ $env.ORDERWORDER_API }}` only; the app's outbound calls (NIC, Razorpay, Stripe, WhatsApp, Twilio) are to allow-listed hosts.

### 9.3 The Tamper-Proof Positioning (the asymmetric moat)
Every revenue-affecting action — bill create, edit, void, refund, shift close, stock adjustment, wastage — appends to the hash chain. The chain is append-only, nightly-verified, and its "verified ✓" status is visible to the owner and the CA. This is not a feature; it is the product's identity. Market it as "the POS that cannot lie." This is your answer to the PetPooja scandal (Context 2, Table 11) and the founder's one-sentence pitch (Context 2, Table 13): *"A restaurant running PetPooja will fire PetPooja and pay me ₹2,500/month because PetPooja's bulk-delete feature put my competitor under audit, and OrderWorder cannot delete a single bill."*

---

## SECTION 10 — POST-EXECUTION OBLIGATIONS & SECURITY ADVISORY

### 10.1 Security Advisory (READ THIS — it affects the owner's account safety)
The GitHub Personal Access Token used to push this Master Prompt to the repository was transmitted in plaintext in the originating request. **This token MUST be rotated immediately** after the push completes:
1. Go to https://github.com/settings/tokens (fine-grained PATs).
2. Locate the fine-grained PAT scoped to the `Resturant` repository (the one used for this push).
3. Click **Revoke**.
4. Generate a new fine-grained PAT scoped to only the `Resturant` repo, with only `Contents: write` + `Metadata: read`, expiring in ≤30 days.
5. Store the new token in a secret manager (1Password, Vault, GitHub Actions secret) — never in a chat, a doc, or a `.env` committed to the repo.

The agent must verify, before declaring done, that `git log -p --all | grep -i "github_pat"` returns nothing. If it returns anything, the agent has failed catastrophically and must purge the history (`git filter-repo` or BFG) and force-push — then escalate to the owner.

### 10.2 The Agent's Final Report
When the agent believes the work is complete, it produces `docs/AGENT_FINAL_REPORT.md` containing:
- The Definition of Done checklist, every box checked, with evidence (command output, file paths, commit SHAs).
- The audit remediation tracker summary (X of 140 CRITICAL resolved, Y of 243 MAJOR resolved).
- The list of deviations (anything skipped, deferred, or flag-gated), each with a justification and a follow-up ticket.
- The known limitations (e.g., NIC IRN tested in sandbox only).
- The deployment runbook pointer.
- The security advisory acknowledgment (token rotated by owner).

The agent does NOT declare success until every checkbox is evidenced. "I'll do that next" is not a state; it is a failure.

---

## CLOSING DIRECTIVE

This is a closed contract. You do not have the latitude to ship "good enough." The audit found 140 CRITICAL defects in a codebase attempting to enter the most punishing SMB SaaS market in the world. The business autopsy says the product is a ₹1,500/month add-on until it solves theft, compliance, and POS essentials. The five killer features are the differentiation. The UI must be visually superior to four reference products. The output must be 100% production-ready.

Execute the phases in order. Honor the self-correction loop on every file. Fix the financial bugs before the features. Make the hash chain unbreakable. Make the UI beautiful. Make the deployment work the first time. Make the founder's login bug a memory.

Begin with Phase 1, Step 1: clone the repository. Do not return until the Definition of Done is fully evidenced.

— END OF MASTER PROMPT —
