# OrderWorder — Live Demo Playbook for Restaurant Owners

> **Use this script when sitting next to a restaurant owner (or over Zoom) to walk them through the entire OrderWorder experience — from sign-up to a live customer order — in under 15 minutes.**

---

## Before You Start (2 minutes)

### What you need
1. **Laptop or tablet** with the app open at the production URL (or your staging URL).
2. **Phone** with a working camera (yours or the owner's) — to scan a QR code live.
3. **Printed demo QR codes** (optional but powerful): print 2–3 QR cards in advance from the demo restaurant's Settings → Tables page so you can hand the owner a physical card.

### What the owner needs to bring
- Their **logo image** (square, any size — we'll crop) and **cover photo** (landscape).
- A **menu** (paper, photo, or PDF) with at least 3–5 dishes and prices.
- Their **UPI ID** for payments (e.g. `restaurant@hdfcbank`).
- Their **GST number** (optional — only if they want GST-compliant invoices).
- An **email + password** they'll use to log in to the dashboard.

---

## Act 1 — Sign Up Their Restaurant (5 minutes)

**URL:** `https://yourdomain.com/signup`

### Step 1 · Brand identity
- **Restaurant name** → type their real name (e.g. "Saffron Street").
  - The URL slug auto-fills as you type (e.g. `saffron-street`).
  - **Watch the green "Available" badge** appear next to the URL — this is real-time availability checking.
- **Tagline** → 1 sentence (e.g. "Modern Indian comfort food in the heart of Bandra").
- **Logo upload** → drag the logo file in (PNG/JPG, up to 2 MB). The live preview card on the right updates instantly.
- **Cover photo** → drag the cover image in.
- Click **Continue**.

### Step 2 · Location & contact
- **Full address** → paste from Google Maps for accuracy.
- **Phone** → the restaurant's landline or mobile (used for invoices and customer support).
- **Gallery photos** → upload up to 4 interior/food shots (shown in the "Explore" tab of the customer menu).
- Click **Continue**.

### Step 3 · Theme
- Pick from **10 preset swatches** (Saffron, Chili, Curry, Basil, Plum, Ocean, Royal, Mint, Sunset, Slate) or fine-tune with HSL sliders.
- The preview card updates live.
- Click **Continue**.

### Step 4 · Menu items
- The default categories are: `starters, main, breads, desserts, beverages`. Edit or add new ones.
- For each dish, click **Add item** and fill in:
  - **Name** (e.g. "Paneer Butter Masala")
  - **Price** (e.g. 280)
  - **Category** (dropdown)
  - **Type** (Veg / Non-Veg / Contains Egg)
  - **Photo** (upload or paste URL)
  - **Taste profile** (Spicy / Extra Spicy / Sweet / None) — optional
- Add at least 3 dishes so the menu looks real. Click **Continue**.

### Step 5 · Tables
- Set the **table count** (default 5, max 100).
- Set a **prefix** (default "T" → tables will be T1, T2, T3…).
- The QR preview grid shows what will be generated. Click **Continue**.

### Step 6 · Payments
- **Currency** → INR / USD / EUR / GBP / AED (default INR).
- **UPI ID** → e.g. `saffronstreet@okicici` (required for online payouts).
- **GST number** → 15-char GSTIN (optional — leave blank if not registered).
- **GST inclusive** toggle → on if menu prices already include GST, off if GST is added on top.
- Click **Continue**.

### Step 7 · Account
- **Email** → owner's email (this is their dashboard login).
- **Password** → min 8 chars (the strength meter shows Weak → Strong in real time).
- **Confirm password**.
- **Kitchen password** (optional) → a separate PIN for kitchen staff to log in to the KDS without admin access.
- Click **Continue**.

### Step 8 · AI keys (optional — skip in most demos)
- If the owner wants AI chat recommendations, paste a Groq or Gemini API key here.
- Otherwise, click **Skip** (or Continue — the app falls back to rule-based recommendations if no keys are set).
- Click **Continue**.

### Step 9 · Review & launch
- Review the summary card (items count, tables count, currency, etc.).
- Click **Launch my restaurant**.

### ✨ The success screen
After ~5 seconds, you'll see:
- **"Saffron Street is live!"** headline with a confetti-style party popper icon.
- **All the table QR codes rendered as PNGs** — ready to print or download.
- A **"Print all"** button that opens a print-ready A4 layout.
- A **"What's next?"** checklist.
- Two CTAs: **Enter your dashboard** or **Print QR codes now**.

👉 **Demo tip:** Click **Print all** right there and hand the owner a printout. This is the "wow" moment — they're holding their restaurant's QR codes within 5 minutes of starting.

---

## Act 2 — The Owner Dashboard (3 minutes)

**URL:** `https://yourdomain.com/dashboard`

Walk the owner through the 7 tabs in the left sidebar:

### Overview
- 4 KPI cards: Today's revenue, Today's orders, In kitchen now, Avg ticket.
- 7-day revenue area chart (fills in as orders come in).
- "Quick actions" panel → one-click jumps to Order requests, Analytics, Menu editor, WhatsApp campaigns.
- "Recent orders" list (live, refreshes every 5s).

### Orders
- Three sub-tabs at the top: **Requests / Active / History**.
- **Requests** = new orders waiting for the kitchen to accept.
- **Active** = orders being prepared.
- **History** = completed / cancelled / rejected.
- Click any order to see items, customer info, payment status, and action buttons (Accept / Reject / Complete / Settle payout).

### Analytics
- Range selector (7d / 30d / 90d).
- Revenue trend line chart, peak-hours bar chart, top dishes, top customers, churned customers, AI insights panel.

### Campaigns
- WhatsApp broadcast composer with template picker.
- Schedule campaigns or send immediately.
- History list shows delivery stats.

### Invoices
- Searchable, paginated list of every invoice generated.
- Click any invoice to preview, then download as PDF.

### Loyalty
- 4 tier cards (Platinum / Gold / Silver / base) with counts.
- Sortable customer leaderboard by points or visits.

### Settings (6 sub-tabs)
- **Account** — name, description, password change, theme color.
- **Business** — phone, address, GST, UPI, currency.
- **Menu** — full CRUD on menu items: search, filter by category, add new items, edit prices, hide/show, upload images.
- **Tables** — add new tables (auto-generates QR), delete tables, download individual PNGs, print all.
- **AI Keys** — paste/test API keys for 5 providers.
- (Theme is inside Account.)

👉 **Demo tip:** In Settings → Tables, click **Add Table** to create a new table live. The owner sees the QR appear instantly. Then click **Print all** to show how they'd restock tables after a reno.

---

## Act 3 — The Kitchen Display (2 minutes)

**URL:** `https://yourdomain.com/kitchen`

- **Login with the kitchen password** you set during signup (or the admin password if no kitchen password was set).
- Show the **5 station filters** (All / Main / Grill / Bar / Pastry) and **4 status filters**.
- Explain the **countdown timer colors**: green (<5 min), yellow (<10 min), orange (<15 min), red+pulse (>15 min).
- Show the **3-tone audio chime** that plays when a new order arrives (click "Test sound" if available, or place a test order in the next act).
- Mention **fullscreen mode** for wall-mounted tablets.

👉 **Demo tip:** Bookmark `/kitchen` on a kitchen tablet and tell the owner "this is what your chef sees." The cleaner the screen, the more they trust it.

---

## Act 4 — The Customer Experience (3 minutes)

### Scan the QR
- Hand the owner a printed QR card (from Act 1's success screen or Act 2's Settings → Tables).
- Have them scan it with their phone camera.
- The menu opens in **under 2 seconds** — no app install, no login wall.

### Browse the menu
- Show the **hero banner** with the cover photo.
- **Search bar** with voice search (microphone icon) — try saying "paneer" aloud.
- **Category pills** at the top — tap to jump.
- Each menu card shows: photo, veg/non-veg dot, spice level, price, "Add" button.
- Tap the **3D / 360° preview** buttons on supported items.

### Add to cart & order
- Tap **Add** on 2–3 items. The floating cart button at the bottom shows the count and total.
- Tap the cart → review → tap **Place Order**.
- **Login modal opens:**
  1. Enter phone number (10-digit Indian mobile) → **Send WhatsApp OTP**.
  2. Enter the 6-digit OTP (in dev mode, it's shown on screen in an amber box; in production, it arrives via WhatsApp).
  3. Enter first + last name → **Start Ordering**.
- (For the demo restaurant with `DEMO_MODE=true`, the OTP step is skipped — instant login.)
- Tap **Place Order** again → choose **Pay at table** (cash) or **Pay online** (Razorpay/Stripe).

### Order success screen
- Animated checkmark, order ID, live kitchen status stepper (Received → Preparing → Ready → Served).
- Order summary with items + total.
- **Download Invoice (PDF)** button — generates and downloads a real PDF.
- **Track my order** button → live tracking page.

### Track the order
- Opens `/track` page → shows the same 4-step stepper, refreshing every 5 seconds.
- When the kitchen accepts → "Received" → "Preparing".
- When the kitchen marks ready → "Ready" (customer gets a WhatsApp notification if opted in).

---

## Act 5 — Close the Loop (1 minute)

Back on the dashboard (or kitchen display), place the order you just took:

1. **Dashboard → Orders → Requests** → the order appears at the top with a "NEW" pulse.
2. Click it → **Accept** → it moves to **Active**.
3. (Optional) Switch to the kitchen display → the order card shows in the Main station with a countdown.
4. Click **Mark Ready** on the kitchen card → customer gets notified.
5. Back on dashboard → **Active** → click the order → **Complete**.
6. The order moves to **History**, an invoice is auto-generated, and loyalty points are awarded.
7. Show the owner the **Invoices** tab — the new invoice is there with a PDF download.

🎉 **Done.** The owner has seen the full loop: registration → QR codes → customer orders → kitchen → invoice → analytics. All in under 15 minutes.

---

## Common Owner Questions (with answers)

| Question | Answer |
|---|---|
| **"What if my customer doesn't have WhatsApp?"** | OTP falls back to SMS if you configure a Twilio account. In dev mode, the OTP is shown on screen. |
| **"Can I change prices without re-printing QR codes?"** | Yes — QR codes are tied to the table, not the menu. Edit prices in Settings → Menu anytime; customers see updates instantly. |
| **"What happens if my internet goes down?"** | The dashboard caches the last 50 orders client-side. The kitchen display continues showing active orders. New orders will queue at the customer's phone and sync when you reconnect. |
| **"Do I need a POS system?"** | No — OrderWorder is the POS. The dashboard handles orders, payments, invoices, and analytics. If you have an existing POS, you can export orders as CSV from Analytics. |
| **"How do customers pay?"** | Three options: online (Razorpay/Stripe/UPI), pay-at-table (cash), or split payment. The owner configures which are enabled in Business Settings. |
| **"Can I have multiple staff logins?"** | Yes — the owner account is admin. They can share the kitchen password with chefs (kitchen-only access) and add more admin accounts in Settings → Account. |
| **"Is my data backed up?"** | Yes — MongoDB Atlas takes daily snapshots. The owner can also export their full menu + orders as CSV anytime. |
| **"What does it cost?"** | Free plan: up to 10 tables + 50 menu items. Pro plan: 50 tables + 200 items + analytics. Enterprise: unlimited. See the pricing page on the homepage. |

---

## Demo Killers (things to avoid)

1. **Don't show the signup wizard without a real logo + cover image.** The live preview looks empty and unprofessional without them.
2. **Don't skip the OTP step in the customer flow** unless you're on the demo restaurant. Real OTP flow is the security selling point.
3. **Don't show the analytics tab on a fresh account** — the charts are empty. Place 2–3 test orders first, or use the demo restaurant which has seeded data.
4. **Don't try to print QR codes from a phone.** Use a laptop + printer for the "wow" moment in Act 1.
5. **Don't forget to set `DEMO_MODE=true` in `.env.local`** if you want the demo restaurant's OTP to be skipped. Without it, the demo customer login requires a real Redis + WhatsApp setup.

---

## Pre-Demo Checklist (5 minutes before the meeting)

- [ ] App is deployed and reachable at the demo URL.
- [ ] `.env.local` has `DEMO_MODE=true`, `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_URL` set.
- [ ] Redis is connected (for OTP) OR demo restaurant is being used (OTP skip).
- [ ] Demo restaurant has seeded data (run `pnpm seed` if not).
- [ ] 2–3 QR cards printed from the demo restaurant's Settings → Tables.
- [ ] Phone is charged and has camera access.
- [ ] Laptop has a printer connected (for the live "Print all QR" moment).
- [ ] Kitchen display is open in a separate browser tab (ready to switch to).
- [ ] A test order has been placed on the demo restaurant so Analytics isn't empty.

---

## Post-Demo Next Steps for the Owner

1. **Within 24 hours:** Owner signs up at `/signup`, uploads real logo + menu, prints QR codes.
2. **Within 48 hours:** Owner places QR cards on tables, tests the customer flow with a staff member.
3. **Within 1 week:** Owner trains kitchen staff on the KDS, configures WhatsApp campaign opt-in.
4. **Within 2 weeks:** Owner reviews Analytics, adjusts menu pricing based on top dishes, runs first loyalty campaign.

**You (the sales rep) should:**
- Follow up at 24 hours, 7 days, and 30 days.
- Offer a 30-minute onboarding call to train their staff.
- Send them the `/docs/DEMO.md` link (this file) so they can re-read the flow.
- Add them to the customer Slack/Discord for support.
