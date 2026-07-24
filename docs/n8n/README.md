# OrderWorder — n8n Workflow Setup (Section 8.3)

> **Canonical source of truth for env vars:** `.env.example` (Section "n8n").
> **Canonical source of truth for WhatsApp templates:** `docs/WHATSAPP_TEMPLATES.md`.
> **Code:** `src/lib/n8n/{client,dispatcher,env,idempotency}.ts`, `src/app/api/webhooks/n8n/route.ts`.

This document walks you through importing the 5 Phase-3 n8n workflows into your n8n instance (Cloud or self-hosted), configuring credentials, test-firing each workflow, and rotating the webhook secret.

---

## 1. Workflow files

The 5 workflow JSON files live alongside this README in `docs/n8n/`:

| File | Workflow name | Purpose | Trigger |
|---|---|---|---|
| `commission_saver.json` | OrderWorder — Commission Saver (D+3 WhatsApp) | Saves customer phone on QR scan; sends a 10%-off WhatsApp offer 3 days later for direct ordering (0% aggregator commission) | Inbound webhook `orderworder/customer-acquired` |
| `owner_daily_report.json` | OrderWorder — 11 PM Owner Report | Cron at 11 PM IST (19:00 UTC) → fetches daily summary → WhatsApp summary to owner | Cron `0 19 * * *` |
| `shift_short_alert.json` | OrderWorder — Shift-Z Shortfall Alert | Instant WhatsApp alert to owner when cashier closes a shift with cash shortfall | Inbound webhook `orderworder/shift-short` |
| `feedback_automation.json` | OrderWorder — Feedback + Refund Automation | Sends rating link post-payment; alerts owner on ≤2★ feedback; delivers refund code | Three inbound webhooks: `orderworder/payment-completed`, `orderworder/feedback-negative`, `orderworder/refund-code-generated` |
| `tip_weekly_report.json` | OrderWorder — Weekly Tip Report (optional) | Weekly per-waiter tip total via WhatsApp | Cron (weekly) |

> The JSON files themselves are created by **Task 3-E (Wave 2)**. The filenames above are the canonical names per the master prompt Section 8.3. If a file is not yet present in this directory, the wave-2 agent has not finished — check the worklog at `/home/z/my-project/worklog.md` for Task 3-E status.

---

## 2. Prerequisites

| Need | Where |
|---|---|
| n8n Cloud account OR self-hosted n8n (≥1.30) | https://n8n.io |
| Meta WhatsApp Cloud API credential (in n8n) | Created in Step 4 below |
| The 5 workflow JSON files | `docs/n8n/*.json` |
| The shared `N8N_WEBHOOK_SECRET` | Same value as the app's env var (HMAC secret) |
| `ORDERWORDER_API` | Your deployment origin (e.g. `https://app.orderworder.com`) |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Cloud API Phone Number ID |
| `PUBLIC_URL` | Same as `ORDERWORDER_API` (used in feedback link templates) |

---

## 3. Import steps (n8n Cloud)

1. Open your n8n instance → **Workflows** → **Add workflow** → **Import from File** (top-right ⋮ menu).
2. Select `docs/n8n/commission_saver.json`. The workflow appears on the canvas.
3. Repeat for each of the 5 JSON files. Each imports as a separate workflow.
4. For each workflow, open every **HTTP Request** node that targets `={{ $env.ORDERWORDER_API }}/...`:
   - The URL expression `={{ $env.ORDERWORDER_API }}` resolves at execution time from n8n's environment variables (set in Step 5).
   - The header `X-N8N-Secret: ={{ $env.N8N_WEBHOOK_SECRET }}` also resolves from env.
5. For each **HTTP Request** node that calls the Meta Graph API (`https://graph.facebook.com/v18.0/...`), bind the **Generic Credential Type**:
   - Click the node → **Credential** → **Create New** → select "WhatsApp Cloud API" generic credential type.
   - Paste your `WHATSAPP_ACCESS_TOKEN` (the permanent system-user token from Meta Business Suite).
   - Name the credential "WhatsApp Cloud API — OrderWorder".
6. Activate each workflow (top-right toggle).

### Import steps (self-hosted n8n)

Same as Cloud, but you can also place the JSON files in your n8n's `~/.n8n/workflows/` directory for auto-import on startup (n8n Cloud does not support this).

---

## 4. Credential setup — WhatsApp Cloud API

n8n uses a "generic credential type" for the WhatsApp Cloud API. Create it once and reuse across all 5 workflows.

1. In n8n → **Credentials** → **Add credential** → search "WhatsApp Cloud API".
2. Fill in:
   - **Name:** WhatsApp Cloud API — OrderWorder
   - **Access Token:** your permanent system-user token from Meta Business Suite → WhatsApp → API Setup.
3. Save.
4. In each workflow's Meta Graph API HTTP Request node, bind this credential via the "Authentication" → "Generic Credential Type" → "WhatsApp Cloud API" dropdown.

> **Token rotation:** if the WhatsApp token is compromised, revoke it in Meta Business Suite → System Users → revoke, generate a new one, update the n8n credential. The workflows pick up the new token on the next execution — no workflow edits needed.

---

## 5. Environment variables (set in n8n)

Set these in n8n → **Settings** → **Variables** (Cloud) or `~/.n8n/.env` (self-hosted):

| Var | Value | Used by |
|---|---|---|
| `ORDERWORDER_API` | Your deployment origin (e.g. `https://app.orderworder.com`) | All HTTP Request nodes that call the app's internal APIs (`/api/internal/*`) |
| `N8N_WEBHOOK_SECRET` | Same value as the app's `N8N_WEBHOOK_SECRET` env var | All HTTP Request nodes that send `X-N8N-Secret` header to the app |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Cloud API Phone Number ID | All Meta Graph API URLs (`/v18.0/{phone_number_id}/messages`) |
| `PUBLIC_URL` | Same as `ORDERWORDER_API` | `feedback_automation.json` — used in the rating-link + dashboard-deep-link templates |

> **`N8N_WEBHOOK_SECRET` must match exactly** on both sides. The app verifies inbound webhook HMAC signatures via `crypto.timingSafeEqual` (constant-time). A single character difference causes `401 invalid_signature`.

---

## 6. Test-fire steps

For each workflow, run the test-fire steps below. Replace `<your-domain>` with your deployment origin (or `http://localhost:3050` for local dev).

### 6.1 `commission_saver.json`

1. Trigger: the app fires `customer.acquired` when a customer scans a QR + pays. To test-fire manually:

   ```bash
   curl -X POST <your-domain>/api/webhooks/n8n \
     -H "Content-Type: application/json" \
     -H "x-n8n-signature: <HMAC of body>" \
     -H "x-request-id: test-cs-1" \
     -d '{"eventType":"customer.acquired","eventId":"test-cs-1","data":{"customerPhone":"+919876543210","restaurantID":"empire","orderTotal":450,"tableId":"T1","acquiredAt":"2026-07-24T10:00:00Z"}}'
   ```

   (Use the HMAC helper from `docs/DEPLOYMENT_RUNBOOK.md` "n8n inbound webhook returns 401" troubleshooting to compute the signature.)

2. Wait for the 3-day delay (or speed it up by editing the "Wait 3 Days" node to "Wait 1 second" for testing).
3. Verify: a WhatsApp message arrives at the test phone with the `direct_order_offer` template (template must be Approved in Meta first).

### 6.2 `owner_daily_report.json`

1. Trigger: cron at 19:00 UTC daily. To test-fire manually, click "Execute workflow" in n8n (the cron trigger supports manual execution).
2. Verify: a WhatsApp message arrives at the owner's phone with the `daily_owner_report` template, populated with today's totals from `/api/internal/daily-summary`.

### 6.3 `shift_short_alert.json`

1. Trigger: the app fires `cash.shift_short` when a cashier closes a shift with shortfall. To test-fire manually:

   ```bash
   curl -X POST <your-domain>/api/webhooks/n8n \
     -H "Content-Type: application/json" \
     -H "x-n8n-signature: <HMAC>" \
     -H "x-request-id: test-ss-1" \
     -d '{"eventType":"cash.shift_short","eventId":"test-ss-1","data":{"restaurantID":"empire","cashierId":"u1","cashierName":"Rahul S.","expected":15420,"counted":14700,"shortfall":720,"shiftId":"s1","ownerPhone":"+919876543210"}}'
   ```

2. Verify: a WhatsApp message arrives at the owner's phone with the `shift_short_alert` template.

### 6.4 `feedback_automation.json`

This workflow has 3 inbound webhooks (3 separate paths). Test each:

**a) `payment-completed` (sends rating link):**

```bash
curl -X POST <your-domain>/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-n8n-signature: <HMAC>" \
  -H "x-request-id: test-fb-1" \
  -d '{"eventType":"payment.completed","eventId":"test-fb-1","data":{"orderId":"o1","customerPhone":"+919876543210","restaurantID":"empire","restaurantName":"Empire Restaurant","token":"<jwt-token>"}}'
```

Verify: customer receives `rate_your_visit` WhatsApp message.

**b) `feedback-negative` (alerts owner on ≤2★):**

```bash
curl -X POST <your-domain>/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-n8n-signature: <HMAC>" \
  -H "x-request-id: test-fb-2" \
  -d '{"eventType":"feedback.negative","eventId":"test-fb-2","data":{"customerName":"Priya Sharma","rating":1,"comment":"Food was cold.","orderId":"o1","ownerPhone":"+919876543210"}}'
```

Verify: owner receives `negative_feedback_alert` WhatsApp message.

**c) `refund-code-generated` (delivers refund code to customer):**

```bash
curl -X POST <your-domain>/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-n8n-signature: <HMAC>" \
  -H "x-request-id: test-fb-3" \
  -d '{"eventType":"refund.code_generated","eventId":"test-fb-3","data":{"customerPhone":"+919876543210","refundCode":"REF-7K3M9P","refundAmount":250,"restaurantID":"empire"}}'
```

Verify: customer receives `refund_code` WhatsApp message.

### 6.5 `tip_weekly_report.json`

1. Trigger: weekly cron. To test-fire manually, click "Execute workflow" in n8n.
2. Verify: each waiter with tips this week receives a WhatsApp summary.

---

## 7. Webhook secret rotation procedure

If `N8N_WEBHOOK_SECRET` is compromised (or you're rotating as a quarterly hygiene practice):

1. Generate a new secret: `openssl rand -hex 32`.
2. Update the secret in **both** places:
   - **App side:** `.env.local` → `N8N_WEBHOOK_SECRET=<new>`. Redeploy (Vercel: change the env var in the dashboard → redeploy).
   - **n8n side:** n8n → Settings → Variables → `N8N_WEBHOOK_SECRET=<new>`. No workflow restart needed — n8n picks up env var changes on the next execution.
3. Verify the rotation with the test-fire steps above (the inbound webhook `x-n8n-signature` HMAC must use the new secret on both sides).
4. Document the rotation in `docs/AUDIT_REMEDIATION_TRACKER.md` Notes column.
5. Optionally, force-rotate all 5 n8n webhook URLs (in n8n → each workflow's Webhook node → "Path" → regenerate) to invalidate any leaked webhook URLs.

> **Zero-downtime rotation trick:** if you need zero-downtime, set up a brief overlap period where the app accepts BOTH the old and new secret (requires a code change in `src/app/api/webhooks/n8n/route.ts` to try both HMACs). Not currently implemented — schedule a 5-min maintenance window instead.

---

## 8. Troubleshooting

### "401 invalid_signature from the app"
**Cause:** `N8N_WEBHOOK_SECRET` in n8n differs from the app's, OR the signature header name is wrong.
**Fix:** Both sides must use the **exact same** secret. The app's `/api/webhooks/n8n/route.ts` reads the signature from the `x-n8n-signature` header (lowercase). Verify with the `curl` HMAC test in `docs/DEPLOYMENT_RUNBOOK.md` "n8n inbound webhook returns 401 invalid_signature".

### "400 from Meta Graph API — code 132013"
**Cause:** The WhatsApp template referenced in the workflow is not yet Approved in Meta WhatsApp Manager.
**Fix:** Submit the template (see `docs/WHATSAPP_TEMPLATES.md`) and wait for approval. Until approved, the workflow will fail at the WhatsApp send step.

### "Workflow executes but no WhatsApp message arrives"
**Cause:** The recipient phone number is not in the Meta test allow-list (for test numbers) OR the `WHATSAPP_PHONE_NUMBER_ID` is wrong.
**Fix:** For test numbers, add the recipient to the allow-list at https://developers.facebook.com/apps/ → your app → WhatsApp → API Setup → "To" field. For prod, verify `WHATSAPP_PHONE_NUMBER_ID` matches the phone number approved for messaging.

### "HTTP Request to /api/internal/* returns 401"
**Cause:** The `X-N8N-Secret` header in the n8n HTTP Request node is missing or doesn't match `N8N_WEBHOOK_SECRET`.
**Fix:** Open the HTTP Request node → "Send Headers" → ensure `X-N8N-Secret: ={{ $env.N8N_WEBHOOK_SECRET }}` is set. Verify `$env.N8N_WEBHOOK_SECRET` is set in n8n → Settings → Variables.

### "Inbound webhook is deduplicated"
**Cause:** The app's idempotency layer (`src/lib/n8n/idempotency.ts`) detected a duplicate `eventId`.
**Fix:** This is correct behavior — the app returns `{"ok":true,"deduplicated":true}`. Each test-fire must use a unique `eventId` (and `x-request-id` header) to avoid deduplication.
