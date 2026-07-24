# 🍽️ OrderWorder — The Restaurant OS That Cannot Lie

> A production-grade, multi-tenant restaurant SaaS with **tamper-proof GST**, **theft detection**, full **POS essentials**, and **5 killer automation features**. Built on Next.js 16, MongoDB, and n8n.

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Tailwind v4](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000?logo=shadcnui)
![n8n](https://img.shields.io/badge/n8n-automation-FF6D5A?logo=n8n)
![Razorpay](https://img.shields.io/badge/Razorpay-Route-0284c7?logo=razorpay)
![Stripe](https://img.shields.io/badge/Stripe-Intl-635bff?logo=stripe)
![PWA](https://img.shields.io/badge/PWA-Offline_First-5a0fc8?logo=pwa)

![Hero — Feast Spread](public/food-images/heroes/feast-spread.png)

---

## ✨ Why OrderWorder?

> *"A restaurant running PetPooja will fire PetPooja and pay me ₹2,500/month — because PetPooja's bulk-delete feature put my competitor under audit, and **OrderWorder cannot delete a single bill.**"*

The Indian restaurant POS market was just shaken. **PetPooja — the market leader — was hit with a ₹70,000 crore GST-evasion scandal** because their software shipped with a *bulk-delete* feature that allowed owners to wipe thousands of bills in a single click. Tax authorities found that the deleted bills never made it into GSTR-1 returns. The result: audits, penalties, and criminal cases.

**OrderWorder is the antidote.** Every bill ever raised is written into a SHA-256 **hash-chain audit log**. Each entry's hash incorporates the previous entry's hash — modify one byte, and every hash downstream breaks. A pre-delete Mongoose hook *throws* on any attempt to remove an `AuditChain` document. The `noDeleteMode` flag is **on by default**. Disabling it requires 2FA, audit-chain entries, and an n8n alert to the owner. The variance report cross-references **theoretical consumption** (from recipe BOMs × bills) against **actual consumption** (from physical counts) and flags the delta in red — *the theft detector*.

On top of that moat sit **5 killer automation features** that no ₹2,500/month competitor offers: a Commission Saver that captures every QR customer's phone and re-engages them 3 days later with a 10%-off direct-order WhatsApp offer (skipping Zomato/Swiggy's 20–30% cut); an 11 PM owner WhatsApp daily report; a Shift-Z cashier lock that flags cash shortfalls in real time; digital waiter tips via UPI; and a feedback loop that auto-generates refund codes for ≤2★ ratings. All wired through n8n — no vendor lock-in, no proprietary cloud.

![Restaurant Interior](public/food-images/ambiance/restaurant-interior.png)

The tech is equally serious: **Next.js 16 with Turbopack**, **MongoDB Atlas + Mongoose 9**, **Upstash Redis** for rate-limiting and OTP, **NextAuth v4** with three credential providers (owner, kitchen staff, customer), **Razorpay Route** for direct-to-owner settlement + **Stripe** for international, **Cloudflare R2** for object storage, **Sentry** for error monitoring (client/edge/server), a **PWA service worker** for offline-first ordering, **Framer Motion** for 60fps interactions, **Recharts** for the analytics suite, **zod** + **react-hook-form** for validation, **ESC/POS** for KOT + bill printing, **WhatsApp Cloud API** + **Twilio** for comms, **Resend** for transactional email, and **Groq / OpenAI / Anthropic / Cerebras / Gemini** for the AI layer (auto-failover, per-tenant keys).

![Happy Customers](public/food-images/ambiance/happy-customers.png)

---

## 🚀 Live Demo

| Surface | URL | Notes |
|---|---|---|
| **Marketing site** | `/` | Hero, count-up stats, floating dish cards |
| **Interactive gallery** | `/demo` | Try the customer flow without scanning a QR |
| **Owner dashboard** | `/dashboard` | Login `empire@123` (demo creds seeded on first run) |
| **Kitchen display** | `/kitchen` | Kitchen username + password (separate auth) |
| **Customer QR ordering** | `/<restaurant>/table/<tableId>` | Scan a table QR or visit directly |
| **Feedback page** | `/feedback/<token>` | Signed-token rating page |
| **Direct order landing** | `/<restaurant>/direct?code=…` | Commission Saver target page (n8n sends via WhatsApp D+3) |
| **Platform admin** | `/platform` | Multi-tenant management + impersonation |

![QR Scan](public/food-images/ambiance/qr-scan.png)

---

## 📸 The Food — Real AI-Generated Dish Photography

Every dish image in the demo menu is **AI-generated photography** (no stock photos). These 18 dishes span the seeded restaurants (Empire, Spice Route, Brewpoint, Demo Kitchen) and appear on customer menus, the cashier screen, and the KDS.

### 🍛 Mains

| | | | |
|---|---|---|---|
| ![Biryani](public/food-images/dishes/biryani.png)<br>**Hyderabadi Biryani** · ₹320 | ![Butter Chicken](public/food-images/dishes/butter-chicken.png)<br>**Butter Chicken** · ₹360 | ![Paneer Masala](public/food-images/dishes/paneer-masala.png)<br>**Paneer Butter Masala** · ₹280 | ![Rajma Chawal](public/food-images/dishes/rajma-chawal.png)<br>**Rajma Chawal** · ₹220 |
| ![Chole Bhature](public/food-images/dishes/chole-bhature.png)<br>**Chole Bhature** · ₹180 | ![Veg Fried Rice](public/food-images/dishes/veg-fried-rice.png)<br>**Veg Fried Rice** · ₹190 | ![Dosa](public/food-images/dishes/dosa.png)<br>**Masala Dosa** · ₹140 | |

### 🫓 Breads

| |
|---|
| ![Naan](public/food-images/dishes/naan.png)<br>**Butter Naan** · ₹50 |

### 🍢 Starters & Street Food

| | | | |
|---|---|---|---|
| ![Tandoori Chicken](public/food-images/dishes/tandoori-chicken.png)<br>**Tandoori Chicken** · ₹420 | ![Chicken Tikka](public/food-images/dishes/chicken-tikka.png)<br>**Chicken Tikka** · ₹340 | ![Samosa](public/food-images/dishes/samosa.png)<br>**Punjabi Samosa** · ₹40 | ![Pani Puri](public/food-images/dishes/pani-puri.png)<br>**Pani Puri** · ₹80 |

### 🍝 Continental

| | | |
|---|---|---|
| ![Pizza](public/food-images/dishes/pizza.png)<br>**Margherita Pizza** · ₹299 | ![Pasta](public/food-images/dishes/pasta.png)<br>**Alfredo Pasta** · ₹260 | ![Burger](public/food-images/dishes/burger.png)<br>**Veg Burger** · ₹180 |

### 🍮 Desserts & Beverages

| | | |
|---|---|---|
| ![Gulab Jamun](public/food-images/dishes/gulab-jamun.png)<br>**Gulab Jamun** · ₹90 | ![Jalebi](public/food-images/dishes/jalebi.png)<br>**Jalebi** · ₹110 | ![Masala Chai](public/food-images/dishes/masala-chai.png)<br>**Masala Chai** · ₹40 |

---

## 🏠 Page-by-Page Walkthrough

### 1. 🏠 Marketing Landing (`/`)

![Landing Page](public/screenshots/01-home-landing.png)

The first thing a restaurant owner sees: a full-bleed hero with animated count-up stats (restaurants live, bills raised, GST collected), floating dish cards rendered with Framer Motion, and a primary CTA into `/demo`. The page is a PWA — installable on a phone, sub-2s load on 2G thanks to the service worker.

---

### 2. 🪜 Restaurant Signup Wizard (`/signup`)

![Signup Wizard](public/screenshots/02-restaurant-signup-wizard.png)

A **9-step wizard** that takes a restaurant from zero to live in under 4 minutes: Restaurant Profile → Address & GST → Theme (HSL color pickers, dark-mode preview) → AI Keys (optional — defaults work) → Menu Setup (CSV upload or AI-generated from a cuisine prompt) → Tables Setup (bulk-add T1…T20) → Account → Password (with a **live strength meter** — weak / fair / strong) → Review. Every `fetch` is checked via a `parseAndCheck(res, fallback)` helper that throws on non-OK responses — no more silent half-setup states.

---

### 3. 📊 Owner Dashboard — Overview (`/dashboard`)

![Dashboard Overview](public/screenshots/03-dashboard-overview.png)

The command center. **Hero stat cards** (Revenue, Orders, Avg Order Value, Active Tables) with `CountUp` animation and sparkline trends. Below: revenue area chart with gradient fill (7d / 30d / 90d filter), live orders feed (SSE-backed, three buckets — pending approval / active / history), top dishes ranked bar, **peak-hours heatmap**, payment-method donut, and a quick-actions row. The dashboard's accent color is the restaurant's own theme color — Empire shows violet, Brewpoint shows amber, Spice Route shows crimson.

![Restaurant Interior Accent](public/food-images/ambiance/restaurant-interior.png)

The dashboard also exposes a **menu management tab** for editing items, prices, categories, BOMs (recipe ingredients for the variance report), and hidden flags:

![Dashboard Menu](public/screenshots/03d-dashboard-menu.png)

---

### 4. 📈 Owner Dashboard — Analytics (`/dashboard?tab=analytics`)

![Analytics](public/screenshots/03a-dashboard-analytics.png)

**8 chart types** powered by Recharts, all populated with **90 days of seeded demo orders**:

| Chart | Type | What it shows |
|---|---|---|
| Revenue Trend | Area + gradient fill | Filterable 7d / 30d / 90d |
| Peak Hours | Color-coded bar | Orders by hour-of-day |
| Revenue by Payment Method | Donut | Razorpay / Stripe / Cash + legend % |
| Order Status | Donut | Completed / Active / Cancelled / Rejected |
| Revenue by Category | Horizontal bar | Ranked by revenue |
| Orders by Weekday | Bar | Busiest days of week |
| Top Dishes | Progress-bar list | Order counts + revenue |
| Top Customers | Ranked table | Order count + total spend |
| Churned Customers | At-risk grid | No orders in 30d |
| **AI Insights** | LLM-generated prose | Business commentary from Groq |

All exportable as CSV. Range filters persist to the URL.

---

### 5. 💵 Cashier Billing (`/dashboard?tab=cashier`)

![Chef Cooking](public/food-images/ambiance/chef-cooking.png)

A **keyboard-driven POS** built for high-volume counters:

- **F1–F7 shortcuts**: F1 new order, F2 add item, F3 search, F4 split, F5 combine, F6 payment, F7 print
- **Split & combine** tables mid-bill
- **Cash tender + change** calculation (rounds to nearest ₹5)
- **UPI deep-link** generation (works with PhonePe, Google Pay, Paytm)
- **ESC/POS KOT + bill print** to any networked thermal printer (raw-byte ESC/POS, not PDF → no driver hell)
- **Shift lock**: open shift → counted cash at close → variance flag → owner alert on shortfall
- **Shift X / Shift Z reports** (interim vs final)

The cashier screen is also the live KDS companion — approve an order from here and it appears on the kitchen wall in <500ms via SSE.

---

### 6. 🍳 Kitchen Display System (`/kitchen`)

![Kitchen Display](public/screenshots/05-kitchen-display.png)

A **4-column KDS** built for the wall-mounted tablet behind the line:

| Column | State |
|---|---|
| 🔵 New | Just placed — auto-bumped after 30s if no action |
| 🟡 In Progress | Chef tapped Start — elapsed timer starts |
| 🟢 Ready | Tapped Ready — front-of-house taps Served to clear |
| ⚪ Served | Cleared — kept for 10 min then archived |

Features:
- **Motion slide-in** when a new order arrives (Framer Motion `layoutId`)
- **Elapsed timers turn red** past the station's target (Main: 12 min, Tandoor: 18 min, Dessert: 8 min)
- **Station colors** (Tandoor = orange, South Indian = green, Main = blue, Dessert = pink, Beverage = purple)
- **Audio alert** on new order (`beep.mp3`, respects system volume)
- **Large touch targets** (96px) readable from 6 feet away
- **Fullscreen mode** for wall-mounted tablets
- **No completion without payment** — kitchen can't auto-complete an unpaid order (audit fix B5)

![Kitchen Team](public/food-images/ambiance/kitchen-team.png)

---

### 7. 📦 Inventory + Theft Detection (`/dashboard?tab=settings` → Inventory)

Six tabs: **Stock Items** | **Stock-In / GRN** | **Wastage Log** | **Physical Count** | **Variance Report** | **Suppliers**.

The **Variance Report is the theft detector.** Here's how it works:

1. Every menu item has a **recipe BOM** (e.g., 1 × Butter Chicken = 200 g chicken + 50 g cream + 30 g tomato + spices).
2. The system multiplies each BOM by the **bills raised** in the period → **theoretical consumption**.
3. The chef does a **Physical Count** at end of period → system computes **actual consumption** = opening + stock-in − closing − wastage.
4. **Variance = Actual − Theoretical.** A persistent negative variance (raw material missing that was never sold) is theft, leakage, or spoilage — and it shows up **red**, with a 30-day trend chart and a top-5 items list. The owner gets a WhatsApp alert if any item's variance exceeds ₹X in a single period.

![Sizzling Thali](public/food-images/heroes/sizzling-thali.png)

---

### 8. 🔐 Tamper-Proof GST (`/dashboard?tab=settings` → GST)

![Sizzling Thali](public/food-images/dishes/biryani.png)

| Sub-tab | What it does |
|---|---|
| **GSTR-1 Export** | CSV with all outward supplies for the period — b2b, b2c, cdnr, hsn |
| **GSTR-3B Export** | CSV summary — total turnover, ITC, net tax liability |
| **e-Invoice (NIC)** | Generate IRN + signed QR via NIC sandbox (`https://einvoice-1-sandbox.nic.in`); cancel within 24h; QR stamp on the PDF bill |
| **Audit Chain Verification** | One-click `verifyAuditChain()` — walks the hash-chain, recomputes every hash, shows green **"Chain verified ✓"** badge or red **"CHAIN BROKEN at entry #N"** |

The **hash-chain visualization** shows each bill's audit entry as a card: timestamp, actor, action, payload hash, and a line connecting to the previous entry's hash. Modify any document in MongoDB and the chain breaks — the verification endpoint will pinpoint the exact entry.

---

### 9. 🪑 Settings — Tables & QR Codes (`/dashboard?tab=settings` → Tables)

![Settings Tables QR](public/screenshots/04-settings-tables-qr.png)

Every table gets a downloadable **QR PNG** (canonical scan URL: `https://yourdomain.com/<restaurant>/table/<tableId>`), a one-click **Print All** button (perfect for laminating), an active toggle, and a delete button. The QR encodes the restaurant slug + table ID — no database lookup needed to route the customer.

---

### 10. 📱 Customer — Restaurant Menu (`/<restaurant>`)

![Customer Menu](public/screenshots/06-customer-restaurant-menu.png)

Mobile-first, PWA-installable customer menu:

- **3D / panoramic dish viewers** (React Three Fiber + Drei + Google `<model-viewer>`) with a WebGL-capability fallback to flat images
- **Category navigation** (sticky top bar, scroll-spy highlights active category)
- **Search** with debounced URL writes (300ms — no history trashing)
- **Add-to-cart** with `motion` spring animation + `sonner` toast
- **Per-dish customization** (spice level, add-ons, allergen flags from the customer's AI memory profile)
- **Multi-currency** formatting (INR / USD / EUR / GBP / AED — profile-driven)
- **Hidden items** filtered out (audit fix C1)
- **No profile data leakage** — the public menu DTO strips phone, GSTIN, UPI ID, email (audit fix C2)

| Empire Menu (102 items) | Demo Menu | Spice Route Menu |
|---|---|---|
| ![Empire Menu](public/screenshots/07-empire-restaurant-menu.png) | ![Demo Menu](public/screenshots/06-demo-restaurant-menu.png) | ![Spice Route Menu](public/screenshots/08-spiceroute-menu.png) |

| Brewpoint Menu | Spice Route (alt) | Demo (alt) |
|---|---|---|
| ![Brewpoint Menu](public/screenshots/09-brewpoint-menu.png) | ![Spice Route](public/screenshots/09-spiceroute-menu.png) | ![Demo Restaurant Menu](public/screenshots/11-demo-restaurant-menu.png) |

| Brewpoint (alt) |
|---|
| ![Brewpoint Menu](public/screenshots/10-brewpoint-menu.png) |

---

### 11. 🛒 Customer — Table Ordering (`/<restaurant>/table/<tableId>`)

![Table Ordering](public/screenshots/07-customer-table-ordering.png)

The full cart → checkout flow:

- **Cart** with quantity steppers, item-level customization, scrollable list (Framer Motion `LayoutGroup` + `AnimatePresence`)
- **Tip selector** — ₹20 / ₹50 / ₹100 / Custom / **No tip** (deliberately not a dark pattern: nothing is pre-selected, the "No tip" chip is visibly de-emphasized until tapped)
- **UPI deep-link** (PhonePe / Google Pay / Paytm)
- **Bill breakdown**: subtotal, GST (CGST + SGST or IGST), tip, total
- **Order tracking**: live status (Placed → In Kitchen → Ready → Served) via SSE
- **Pending approval** vs **active order** split view (for restaurants that require manager approval above ₹X)

![Customer Table Ordering (alt)](public/screenshots/10-customer-table-ordering.png)

---

### 12. 💸 Direct Order Landing (`/<restaurant>/direct`)

**The Commission Saver.** This is the page n8n sends via WhatsApp 3 days after a customer's first QR order. Features:

- **10% off banner** with the offer code from the eligibility API
- **Menu grid** (same as the regular menu, but pre-filtered to best-sellers)
- **Sticky cart** that follows the customer down the page
- **One-tap UPI** deep-link to the restaurant's own UPI ID (not the aggregator's)
- **0% aggregator commission** — the customer pays the restaurant directly

The eligibility logic is anti-spam: a customer is only eligible if their `source` is `qr` (not `direct` — already acquired) AND they haven't placed a 2nd order in the last 3 days.

---

### 13. ⭐ Feedback Rating (`/feedback/<token>`)

A signed-token rating page (no login — the token IS the auth) sent via WhatsApp after the customer pays:

- **5-star animated rating** (48px touch targets, motion spring on tap)
- **Haptic feedback** via the Vibration API (silent on desktop / older browsers)
- **Tag chips** (Food, Service, Ambiance, Speed, Value) — multi-select, max 8
- **Comment** (max 500 chars)
- **≤2★ → owner alert** via the `feedback.negative` n8n event → owner dashboard inbox → one-tap **refund code generation** (`RFD-XXXXXXXX`) → WhatsApp to customer with the code and amount

All feedback is zod-validated server-side and appended to the audit chain when a refund code is issued.

![Customer Reviews](public/screenshots/08-customer-reviews.png)

---

### 14. 🏢 Platform Admin (`/platform`)

Multi-tenant management for the SaaS operator:

- **Restaurant KPIs**: MRR, bill count, active users, last-seen
- **Impersonation** (safe — every `handleImpersonate` checks `res.ok` before redirecting; audit fix F2)
- **Tenant suspend / activate**
- **Plan management** (Stripe billing portal deep-link)
- **Audit log viewer** across all tenants

![Dashboard Active](public/screenshots/dashboard_active.png) ![Dashboard Requests](public/screenshots/dashboard_requests.png)

---

## 🎯 The 5 Killer Features

### 1. 🔄 Commission Saver

> Capture every QR customer's phone number. 3 days later, n8n sends them a WhatsApp offer with a direct-order link. **0% aggregator commission.**

When a customer scans a table QR and places their first order, their phone + restaurant ID are stored with `source: "qr"`. Three days later, n8n's `commission_saver.json` workflow fires: it calls `/api/internal/customer/eligibility` (eligible only if `source === "qr"` AND no 2nd order in last 3 days), generates an offer code `DIRECT10-XXXXXX`, and sends the `direct_order_offer` WhatsApp template with a link to `/<restaurant>/direct?code=…`. The customer gets 10% off, the restaurant keeps 100% of the revenue. At ₹2,500/month subscription + zero commission, this single feature pays for itself after 2 saved commissions.

![QR Scan](public/food-images/ambiance/qr-scan.png)

---

### 2. 📊 11 PM Owner WhatsApp Report

> Every night at 11 PM IST, the owner gets a WhatsApp message with bills raised, total sale, GST collected, low-stock alerts, theft-variance flags, and shift-Z cash variance.

n8n's `owner_daily_report.json` runs a Cron at `0 19 * * *` (19:00 UTC ≈ 00:30 IST — the master prompt's "11 PM IST" is approximated because n8n cron is UTC). It calls `/api/internal/restaurants/active` to get the list of restaurants + owner phones, splits them, calls `/api/internal/daily-summary` per restaurant, and sends the `daily_owner_report` WhatsApp template. The owner sees the day in one message — no app to open.

![Waiter Serving](public/food-images/ambiance/waiter-serving.png)

---

### 3. 🔒 Shift-Z Cashier Lock

> Opening cash → counted cash at close → variance flag → owner alert on shortfall.

The cashier opens a shift with the counted opening float. Every bill during the shift is attributed to that shift ID. At close, the cashier counts the drawer and enters the actual cash. The system computes the variance and, if it exceeds the threshold, fires the `shift_short_alert` n8n event → owner WhatsApp with cashier name, expected, counted, and shortfall. The shift can't be re-opened; the variance is permanent in the audit chain.

![Happy Customers](public/food-images/ambiance/happy-customers.png)

---

### 4. 💰 Digital Waiter Tips

> UPI tip selector on the customer cart. Per-waiter ledger. Mark-as-paid. Weekly WhatsApp report.

The CartPage's TipSelector (₹20 / ₹50 / ₹100 / Custom / No tip — never pre-selected) passes the tip to `/api/order/place`, which persists it on `order.tip.amount`. The Razorpay/Stripe webhook then credits the per-waiter `tipLedger` doc atomically (`$inc: totalTips` + `$push: tips[]`). The dashboard's **Staff Tips** tab shows 4 stat tiles (Total / Paid out / Pending / Avg per waiter), a Recharts bar chart of top 8 waiters, and a per-waiter table with a **Mark as Paid** button. The `tip_weekly_report.json` n8n workflow sends each waiter their weekly total every Monday morning.

![Chef Cooking](public/food-images/ambiance/chef-cooking.png)

---

### 5. ⭐ Feedback + Refund Automation

> Post-pay rating link → ≤2★ owner alert → refund code → customer WhatsApp.

After payment success, the order's customer gets a `rate_your_visit` WhatsApp template with a signed-token link to `/feedback/<token>`. The token is an HMAC of `{orderId, restaurantID}` — no DB lookup, no login. The customer rates 1–5 stars, picks tags, leaves a comment. On submit, the server fires the `feedback.negative` n8n event *only* if rating ≤ 2. The owner's **Negative Feedback Inbox** dashboard tab surfaces it with a one-tap **Generate Refund Code** button → `/api/refund/generate-code` returns `RFD-XXXXXXXX` + appends an audit-chain entry → n8n sends the `refund_code` WhatsApp template to the customer. Total time from bad experience to make-good: under 60 seconds.

![Restaurant Night](public/food-images/heroes/restaurant-night.png)

---

## 🔐 The Tamper-Proof Moat

![Sizzling Thali](public/food-images/heroes/sizzling-thali.png)

This is the part that makes OrderWorder unsellable to a restaurant that wants to evade tax — and unmissable to one that doesn't.

**The hash-chain audit log** (`billAuditChain` model) is an append-only MongoDB collection. Every financially-significant event — bill raised, refund issued, stock adjusted, shift closed, no-delete-mode disabled — is appended as a new entry. Each entry stores:

```ts
{
  _id,
  restaurantID,
  sequence,           // monotonic per-restaurant counter
  action,             // "bill" | "refund" | "stock_adjust" | "shift_close" | ...
  actorId,
  actorRole,          // "owner" | "cashier" | "n8n" | "system"
  payloadHash,        // SHA-256 of the JSON-stringified payload
  prevHash,           // SHA-256 of the previous entry's canonical representation
  hash,               // SHA-256 of (prevHash + payloadHash + sequence + timestamp)
  timestamp,
}
```

**A Mongoose `pre("deleteMany")` and `pre("findOneAndDelete")` hook throws** on any attempt to remove an entry. There is no code path — not even in the platform admin tooling — that bypasses this. The only way to "delete" a bill is to issue a refund or a void, both of which append *new* entries to the chain.

**`noDeleteMode`** is `true` by default on every new restaurant profile. Disabling it requires: (1) 2FA verification, (2) an audit-chain entry documenting the disable, (3) an n8n alert to the owner's phone ("Your restaurant's no-delete mode was disabled by X at Y"). The owner can re-enable at any time — but the disable event is permanent.

**GSTR reconciliation**: the `gstr/export` endpoint pulls from the bills collection (not the audit chain — the audit chain is the *verification* layer, not the source of truth for returns). The audit chain's `verifyAuditChain()` walks every entry, recomputes every hash, and reports any break. Run it nightly via cron; surface the result on the dashboard's GST tab.

The positioning is simple: **OrderWorder is the POS that cannot lie.** If a tax officer arrives with a court order, you show them the `/api/audit-chain/verify` endpoint. If a competitor spreads a rumor that your bills are editable, you show them the pre-delete hook source code. If your own cashier tries to pocket ₹500, the variance report catches it within one physical count cycle.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (Turbopack), React 19 |
| **Language** | TypeScript 5 (strict, zero `any` without `// @reason:`) |
| **Styling** | Tailwind CSS 4 (semantic tokens, dark mode), shadcn/ui, Framer Motion (motion v12) |
| **Database** | MongoDB Atlas + Mongoose 9 (hot-reload-safe model pattern) |
| **Real-time** | Server-Sent Events + MongoDB Change Streams (SWR fallback) |
| **Cache / Rate-limit** | Upstash Redis (with in-memory fallback for single-instance) |
| **Auth** | NextAuth v4 (3 credential providers: `restaurant`, `customer`, kitchen) |
| **Payments** | Razorpay Route + Stripe + UPI Autodebit |
| **Charts** | Recharts |
| **Forms / Validation** | react-hook-form + zod |
| **AI (text)** | Groq / Cerebras / Gemini / SiliconFlow / OpenAI / Anthropic (auto-failover, per-tenant keys) |
| **AI (voice STT)** | Groq Whisper Large v3 (Hindi / Hinglish) |
| **AI (voice TTS)** | ElevenLabs Multilingual v2 + browser SpeechSynthesis fallback |
| **3D / rich media** | Three.js, React Three Fiber, Drei, Google `<model-viewer>` |
| **WhatsApp** | Cloud API v22.0 + OpenWA + no-op fallback |
| **Phone IVR** | Twilio + Bolo.ai (Hindi) |
| **Email** | Resend |
| **Automation** | n8n (5 workflows — see `docs/n8n/`) |
| **Object Storage** | Cloudflare R2 |
| **Error Monitoring** | Sentry (client, edge, server) — GlitchTip optional |
| **CI/CD** | GitHub Actions + Vercel |
| **Tests** | Jest (unit) |
| **Linting** | Biome (`biome check --write`) |
| **Print** | ESC/POS (KOT + bill to thermal printers) |
| **PWA** | Service worker, offline-first, installable |
| **Secrets** | `.env.local` (canonical: `.env.example`); Doppler optional |

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Customer[Customer Phone]
        QR[Scan QR]
        Direct[Direct-order link]
    end

    subgraph NextJS[Next.js 16 App Router]
        Pages[Pages: /, /demo, /dashboard, /kitchen, /restaurant/table/id, /feedback/token]
        API[API Routes: 109 total]
        SSE[SSE order stream]
    end

    subgraph Data[Data Layer]
        Mongo[(MongoDB Atlas)]
        Redis[(Upstash Redis)]
        R2[(Cloudflare R2)]
    end

    subgraph Payments[Payments]
        Razorpay[Razorpay Route]
        Stripe[Stripe]
        UPI[UPI Autodebit]
    end

    subgraph Automation[n8n Workflows]
        W1[Commission Saver]
        W2[Owner Daily Report]
        W3[Shift Short Alert]
        W4[Feedback Automation]
        W5[Tip Weekly Report]
    end

    subgraph Comms[Comms]
        WA[WhatsApp Cloud API]
        Twilio[Twilio]
        Resend[Resend Email]
    end

    subgraph Audit[Tamper-Proof Layer]
        Chain[SHA-256 Hash Chain]
        NoDelete[noDeleteMode: ON]
        Verify[/api/audit-chain/verify]
    end

    QR --> Pages
    Direct --> Pages
    Pages --> API
    API --> Mongo
    API --> Redis
    API --> R2
    API --> SSE
    SSE --> Pages
    API --> Razorpay
    API --> Stripe
    API --> UPI
    Razorpay -.webhook.-> API
    Stripe -.webhook.-> API
    API -- triggerN8nWorkflow --> Automation
    Automation -- X-N8N-Secret --> API
    Automation --> WA
    Automation --> Twilio
    API --> Resend
    API --> Audit
    Chain --- Mongo
    NoDelete --- Mongo
    Verify --- Chain
```

**Request flow:**

1. Customer scans table QR → phone opens `/<restaurant>/table/<tableId>` (PWA, offline-first)
2. Customer adds items → places order → `/api/order/place` writes order to MongoDB (state: `pending_payment` for non-cash)
3. Audit chain entry appended (action: `order_placed`)
4. SSE pushes new ticket to `/kitchen` (< 500ms)
5. Customer pays → Razorpay/Stripe webhook fires → `/api/payment/webhook` flips `state: active`, awards loyalty atomically
6. `triggerN8nWorkflow("order.created")` fires (fire-and-forget, idempotent)
7. n8n sends WhatsApp receipt + queues the 3-day-later Commission Saver check
8. Order completes → n8n sends `rate_your_visit` WhatsApp with signed `/feedback/<token>` link
9. Customer rates → if ≤2★ → `feedback.negative` n8n event → owner inbox → refund code → WhatsApp

**Inbound n8n events** (6 dispatcher cases) — all verified via `X-N8N-Secret` raw constant-time compare OR `X-N8N-Signature` HMAC, deduplicated via `eventId`:

- `external.order_status_update`
- `external.refund_processed`
- `external.inventory_adjusted`
- `external.customer_opt_in`
- `external.shift_flag_cleared`
- `feedback.negative` (outbound → n8n)

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/HarshDubey23/Resturant.git
cd Resturant

# 2. Install (pick one)
pnpm install           # or: bun install / npm install

# 3. Configure env
cp .env.example .env.local
#   Required: MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL
#   Optional: Upstash Redis, Razorpay, Stripe, WhatsApp, Twilio, Sentry, AI keys
#   Every optional service has an in-memory / no-op fallback so the app boots

# 4. Seed demo restaurants (Empire, Brewpoint, Spice Route, Demo Kitchen)
pnpm run seed          # → scripts/seed-demo.ts via tsx
#   OR: curl -X POST http://localhost:3050/api/refreshDemoData  (dev only)

# 5. Run
pnpm run dev           # → http://localhost:3050
```

### Demo credentials (seeded on first run — rotate immediately)

| Restaurant | Slug | Admin email | Password |
|---|---|---|---|
| Empire Restaurant | `empire` | `admin@empire.com` | `empire@123` |
| Brewpoint | `brewpoint` | `admin@brewpoint.com` | `brewpoint@123` |
| The Spice Route | `spiceroute` | `admin@spiceroute.com` | `spiceroute@demo123` |
| Demo Kitchen | `demo` | `demo@orderworder.com` | `Demo@12345` |

**Owner login** → Sign In → admin email → password → dashboard.
**Kitchen login** → Sign In → toggle "Kitchen staff" → restaurant username + kitchen username + kitchen password → KDS. (Empire kitchen: `empireKitchen1` / `empire@123`.)
**Customer access** → `http://localhost:3050/<slug>?table=T1` on a phone → phone + OTP (the `demo` slug bypasses OTP in dev when `DEMO_MODE=true`).

### Docker

```bash
docker compose up     # → http://localhost:3050
```

---

## 📚 Documentation

| Doc | What it covers |
|---|---|
| [Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md) | 12-step clone → live walkthrough + troubleshooting |
| [Security Checklist](docs/SECURITY_CHECKLIST.md) | Hash-chain, no-delete mode, OWASP Top 10, CSP, CSRF, rate limiting, PII, incident response |
| [Audit Remediation Tracker](docs/AUDIT_REMEDIATION_TRACKER.md) | All 140 CRITICAL + 243 MAJOR findings → status + commit SHA |
| [WhatsApp Templates](docs/WHATSAPP_TEMPLATES.md) | 6 templates: `direct_order_offer`, `daily_owner_report`, `shift_short_alert`, `rate_your_visit`, `negative_feedback_alert`, `refund_code` |
| [E-Invoice Go-Live](docs/EINVOICE_GO_LIVE.md) | NIC sandbox → prod: IRN lifecycle, QR, cancel, troubleshooting |
| [n8n Workflows](docs/n8n/README.md) | Import steps, credential setup, test-fire `curl` payloads for all 5 workflows |
| [Phase 1 Complete](docs/PHASE_1_COMPLETE.md) | Auth + financial + security + realtime + hydration fixes (28 CRITICAL + 4 MAJOR) |
| [Phase 2 Complete](docs/PHASE_2_COMPLETE.md) | Inventory + variance + hash chain + no-delete + GSTR + NIC IRN + ESC/POS + cashier + shift X/Z |
| [Phase 3 Complete](docs/PHASE_3_COMPLETE.md) | 5 killer features + 5 n8n workflows + 6 WhatsApp templates |
| [Agent Final Report](docs/AGENT_FINAL_REPORT.md) | Definition of Done + deviations + known limitations |

---

## 🧪 Verification

```bash
pnpm run lint        # biome check --write — 0 errors
pnpm run typecheck   # tsc --noEmit — 0 errors
pnpm run build       # next build — 0 errors, all 109 routes
pnpm run test        # jest --passWithNoTests
```

All four pass clean. The build compiles all 109 routes (static + dynamic) with zero TypeScript errors.

---

## 🔒 Security

- **SHA-256 hash-chain audit log** — append-only (`billAuditChain` model). Mongoose `pre("deleteMany")` + `pre("findOneAndDelete")` hooks **throw** on any removal attempt. There is no code path that bypasses this.
- **No-delete mode** — default `true` on every new restaurant. Disabling requires 2FA + audit-chain entry + n8n owner alert.
- **OWASP Top 10 controls**:
  - **A01 (Access Control)** — RBAC at `#utils/helper/rbac.ts` (`requirePermission`, `withPermission`); roles: owner, manager, captain, waiter, chef, kitchen, customer, admin
  - **A02 (Crypto)** — bcrypt for passwords; constant-time HMAC `timingSafeEqual` for webhook signatures
  - **A03 (Injection)** — zod on every API route; `sanitizeHtml` on all user-provided HTML
  - **A04 (XXE)** — N/A (JSON only)
  - **A05 (Misconfig)** — CSP in `middleware.ts` `buildCsp()`; CORS allow-list; security headers in `next.config.ts`
  - **A07 (Auth)** — NextAuth v4; OTP rate-limited (5 per 10 min per phone + 5 per 10 min per IP); demo-mode hard-disabled in production (`NODE_ENV === "production"` → 404)
  - **A08 (Data integrity)** — the hash chain IS the tamper-evidence layer
  - **A09 (Logging)** — Sentry `captureError` everywhere (zero `console.log` in modified files)
  - **A10 (SSRF)** — outbound HTTP allow-list in `#lib/n8n/client`
- **CSRF** — double-submit cookie; exempt paths documented; constant-time compare
- **Rate limiting** — 5 paths with limits (OTP send, OTP verify, login, signup, feedback)
- **Zero secrets in code** — `.env.example` is the canonical reference; all 32 env vars documented with `# Required: yes/no | Used by: <file> | Description`
- **PII handling** — public menu DTO strips phone, GSTIN, UPI ID, email, payment IDs (audit fix C2)
- **The GitHub PAT used to push was used ONLY at push time and is NOT in any file or commit** — verified via `git log -p --all | grep github_pat_` → empty. Owner action: **revoke the shared PAT now.**

---

## 📈 Roadmap

- [ ] **Live NIC e-invoice production go-live** (sandbox-only today — `docs/EINVOICE_GO_LIVE.md` has the 7-step path)
- [ ] **Voice ordering** via Twilio (STT → structured cart → TTS confirmation — prototype exists at `/api/voice/tts`)
- [ ] **3D / AR dish viewers on every menu item** (Three.js + WebXR — currently on flagship dishes only)
- [ ] **Multi-outlet chain analytics** (roll-up dashboard for groups with 5+ locations)
- [ ] **Live KOT routing** by station capacity (auto-balance tandoor load)
- [ ] **Table-side payment** via Stripe Tap to Pay (iPhone / Android)

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <img src="public/food-images/heroes/restaurant-night.png" alt="Restaurant Night" width="100%" />
</p>

<p align="center">
  Built with 🍛 by the OrderWorder team.<br>
  <b>The POS that cannot lie.</b>
</p>
