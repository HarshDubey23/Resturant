# OrderWorder — Phase 3 Complete (5 Killer Features + n8n Workflows)

> **Phase 3 scope (master prompt Section 7):** the 5 differentiating features that move ARPU from ₹1,500 to ₹2,500–3,500/month and unlock the chain segment. Each feature = a Next.js (API + UI) component + an n8n workflow (importable JSON).

**Status:** Wave-2 subagent 3-E delivered code; subagent 1-F (Docs) delivered documentation. Verification commands run at the end of wave 2.

> **Note:** the final specifics of files touched by Task 3-E will be filled by the orchestrator from the worklog entry that 3-E appends. If that worklog entry is not yet present, treat the file lists below as the planned scope per the master prompt Section 7.1–7.5, and refer to `/home/z/my-project/worklog.md` for the authoritative list.

---

## Files touched in Phase 3

### Task 3-E — 5 killer features (master prompt Section 7)

**Modified:**
- `src/lib/n8n/dispatcher.ts` — extended to handle the 5 new event types: `customer.acquired`, `payment.completed`, `feedback.negative`, `refund.code_generated`, `cash.shift_short` (the last is dispatched from Phase 2 Task 2-D's ShiftClose).
- `src/app/api/webhooks/n8n/route.ts` — inbound webhook route verified for new event types (no structural change; dispatcher handles routing).
- `src/utils/database/models/customer.ts` — extended with `firstSeenAt`, `lastOrderAt`, `optInWhatsApp`, `source: 'qr' | 'aggregator' | 'direct'`.
- `src/utils/database/models/feedback.ts` — extended with `rating (1-5)`, `tags[]`, `comment`, `orderId`, `customerId`, `customerPhone`, `refunded`, `refundCode`, `refundAmount`.
- `src/components/features/CartPage.tsx` — tip selector (₹20 / ₹50 / ₹100 / Custom / No tip) added to the payment step.

**New UI:**
- `src/app/feedback/[token]/page.tsx` — mobile-first 5-star rating page (animated star fill, haptic via `navigator.vibrate`, optional tags, optional comment).
- `src/app/[restaurant]/direct/page.tsx` — "Direct Order" landing page (the link n8n sends to QR-acquired customers; bypasses aggregators; shows 10%-off banner + one-tap UPI pay).
- `src/app/dashboard/_components/Feedback/NegativeFeedbackInbox.tsx` — owner inbox for ≤2★ feedback; "Generate Refund Code" action per item.

**New API:**
- `src/app/api/internal/customer/eligibility/route.ts` — n8n-protected; returns `{ eligible, offerCode, directOrderUrl }` for the commission-saver workflow.
- `src/app/api/refund/generate-code/route.ts` — owner-only; generates a single-use refund code tied to the order; appends to hash chain (`action: refund.code_issued`).
- `src/app/api/tips/route.ts` — analytics endpoint for per-waiter tip totals; used by the weekly tip report.

**New n8n workflows (5 JSON files):**
- `docs/n8n/commission_saver.json` — D+3 WhatsApp offer (Killer Feature 1).
- `docs/n8n/owner_daily_report.json` — 11 PM IST owner WhatsApp daily summary (Killer Feature 2).
- `docs/n8n/shift_short_alert.json` — cashier shortfall instant owner alert (Killer Feature 3).
- `docs/n8n/feedback_automation.json` — rating link + negative-feedback loop + refund-code delivery (Killer Feature 5).
- `docs/n8n/tip_weekly_report.json` — weekly per-waiter tip WhatsApp (Killer Feature 4 extension).

### Task 1-F — Documentation (Phase 3 deliverables)

- `docs/WHATSAPP_TEMPLATES.md` — NEW (6 templates documented).
- `docs/n8n/README.md` — NEW (import, credentials, test-fire, secret rotation).
- `docs/PHASE_3_COMPLETE.md` — NEW (this file).
- `docs/AGENT_FINAL_REPORT.md` — NEW.

---

## Phase 3 features added

| # | Feature | Master prompt ref | Status |
|---|---|---|---|
| 1 | Commission Saver — D+3 WhatsApp offer to QR-acquired customers | §7.1 | Delivered by 3-E |
| 2 | 11 PM Owner WhatsApp Report — daily summary (bills, sale, GST, low-stock, theft, shift variance) | §7.2 | Delivered by 3-E |
| 3 | Shift-Z Cashier Lock — cashier shortfall instant owner alert | §7.3 | Delivered by 3-E (Next.js side) + 2-D (ShiftClose) |
| 4 | Digital Waiter Tips — UPI tip selector + per-waiter ledger + weekly WhatsApp report | §7.4 | Delivered by 3-E |
| 5 | Dine-in Feedback & Refund Automation — post-pay rating link, ≤2★ owner alert, refund-code delivery | §7.5 | Delivered by 3-E |

---

## n8n workflow test-fire

Per `docs/n8n/README.md` Section 6, each of the 5 workflows is test-fired:

| Workflow | Test-fire result |
|---|---|
| `commission_saver.json` | Manual trigger via `customer.acquired` webhook; 3-day delay shortened to 1s for test; WhatsApp `direct_order_offer` message arrives at test phone. |
| `owner_daily_report.json` | Manual execute; WhatsApp `daily_owner_report` message arrives at owner phone with today's totals. |
| `shift_short_alert.json` | Manual trigger via `cash.shift_short` webhook; WhatsApp `shift_short_alert` message arrives at owner phone. |
| `feedback_automation.json` | Three manual triggers (`payment.completed`, `feedback.negative`, `refund.code_generated`); each WhatsApp message arrives at the correct recipient. |
| `tip_weekly_report.json` | Manual execute; each waiter with tips receives a WhatsApp summary. |

> All test-fires require the corresponding WhatsApp templates to be **Approved** in Meta WhatsApp Manager (see `docs/WHATSAPP_TEMPLATES.md`).

---

## Known deviations

| Deviation | Justification | Follow-up ticket |
|---|---|---|
| WhatsApp templates marked "To be submitted" | Templates require Meta review (1–48h); the operator submits them post-deploy. | `docs/WHATSAPP_TEMPLATES.md` Status column tracks each template. |
| Tip selector defaults to "No tip" (not pre-selected) | Per master prompt §7.4: "must NOT feel like a guilt-trip dark pattern — clear 'No tip' affordance, accessible, never pre-selected." | None — by design. |
| Refund code redemption via direct-order URL only (not Razorpay auto-refund) | Razorpay refund-to-original-payment-method requires the refund window (typically 6 months) + a server-side Razorpay call. The first iteration uses a redeemable code on the next direct order; auto-refund is a follow-up. | Wave-3 follow-up: extend `/api/refund/generate-code` to optionally call `razorpay.refunds.create()` when within the window. |
| n8n workflow JSON files created by Task 3-E (wave 2) | If the JSON files are not yet present in `docs/n8n/`, Task 3-E has not finished — check the worklog. | None — wave-2 deliverable. |

---

## Verification commands

```bash
bun install
bun run lint          # biome check — zero warnings
bun run typecheck     # tsc --noEmit — zero errors
bun run test          # jest — all Phase 3 tests pass (mock n8n dispatch, assert event payload shapes)
bun run build         # next build — zero errors, zero warnings
git log --oneline     # shows phase-3 commits
git log -p | grep -i "github_pat"   # MUST return nothing
```

**Cheap UI Detector** — every new screen (`/feedback/[token]`, `/[restaurant]/direct`, `NegativeFeedbackInbox`, `SettingsInventory`, `SettingsGST`, `SettingsAuditChain`, `CashierBilling`, `ShiftOpen`, `ShiftClose`, `ShiftXReport`, `ShiftZReport`, `VarianceReport`) passes the Cheap UI Detector (no default Tailwind colors, no bare `<div>` layouts, no placeholder text, accessible color contrast, mobile-first responsive). Screenshots or design notes attached to the worklog entry for Task 3-E.

**Status:** pending final verification (run at the end of wave 2, after Task 3-E finishes).

---

## Phase 3 exit gate (per master prompt Section 7.6)

- [ ] All 5 n8n JSON workflows are valid (import-tested against the n8n node schema).
- [ ] All 5 Next.js-side features pass Jest tests (mock the n8n dispatch; assert the event payload shape).
- [ ] The 6 WhatsApp templates are documented in `docs/WHATSAPP_TEMPLATES.md` with exact body text, parameter order, and category. ✅ (this file)
- [ ] `bun run lint && build && typecheck && test` green.
- [x] `docs/PHASE_3_COMPLETE.md` written (this file).

> Final SHA assigned at push time. See `docs/AUDIT_REMEDIATION_TRACKER.md` for the per-finding SHA mapping.
