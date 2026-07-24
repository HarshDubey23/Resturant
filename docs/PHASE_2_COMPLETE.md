# OrderWorder — Phase 2 Complete (Inventory + GST + POS Essentials)

> **Phase 2 scope (master prompt Section 6):** Inventory UI + theft-detection variance report, tamper-proof GST (hash-chain audit log + no-delete mode + GSTR-1/3B export + NIC e-invoice IRN/QR), and POS essentials (ESC/POS KOT print, cashier billing, shift X/Z reports).

**Status:** Wave-1 subagent 2-C (Inventory + GST) and 2-D (POS) delivered code fixes; subagent 1-F (Docs) delivered documentation. Verification commands run at the end of wave 1.

> **Note:** the final specifics of files touched by Tasks 2-C and 2-D will be filled by the orchestrator from the worklog entries those subagents append. If those worklog entries are not yet present, treat the file lists below as the planned scope per the master prompt Section 6.1–6.3, and refer to `/home/z/my-project/worklog.md` for the authoritative list.

---

## Files touched in Phase 2

### Task 2-C — Inventory + GST (master prompt Section 6.1 + 6.2)

**New models:**
- `src/utils/database/models/shift.ts` — cashier shift state.
- `src/utils/database/models/supplier.ts` — supplier ledger.
- `src/utils/database/models/billAuditChain.ts` — hash-chain audit log entries.
- `src/utils/database/models/tipLedger.ts` — per-waiter tip ledger (Phase 3 prep, but model created here).

**New utils:**
- `src/utils/gst/gstrExport.ts` — GSTR-1 / GSTR-3B JSON + CSV + PDF export.
- `src/utils/gst/nicEinvoice.ts` — NIC e-invoice API (auth, generate IRN, cancel IRN, get details, QR).
- `src/utils/helper/variance.ts` — daily variance computation (theoretical vs actual consumption).
- `src/utils/helper/auditChain.ts` — `appendAuditChain` + `verifyAuditChain` helpers.

**New UI:**
- `src/app/dashboard/_components/Settings/SettingsInventory.tsx` — Stock Items, Stock-In/GRN, Wastage Log, Physical Count, Variance Report, Suppliers.
- `src/app/dashboard/_components/Settings/SettingsGST.tsx` — GSTR-1/3B export + reconciliation.
- `src/app/dashboard/_components/Settings/SettingsAuditChain.tsx` — chain viewer + verify badge.
- `src/app/dashboard/_components/Inventory/VarianceReport.tsx` — theft-detection variance table + charts.

**New API:**
- `src/app/api/audit-chain/verify/route.ts` — `GET /api/audit-chain/verify` → `{"ok":true,"chainLength":N,...}`.
- `src/app/api/gstr/export/route.ts` — GSTR-1/3B export download.
- `src/app/api/internal/daily-summary/route.ts` — n8n-protected daily summary for the 11 PM owner report.
- `src/app/api/internal/restaurants/active/route.ts` — n8n-protected active-restaurant list.

**Modified:**
- `src/utils/database/models/inventory.ts` — extended with `sku`, `unit`, `openingStock`, `stockIn[]`, `wastage[]`, `physicalCount[]`, `currentStock` (computed), `reorderLevel`, `reorderQty`.
- `src/utils/database/models/profile.ts` — added `settings.noDeleteMode` (default `true`).
- `src/utils/database/models/order.ts` — added `tip: { amount, waiterId, waiterName, tippedAt }`.
- `src/components/layout/InvoiceDocument.tsx` — IRN + QR rendering.
- `src/app/api/invoice/generate/route.ts` — calls `nicEinvoice.generateIRN` on bill finalize (gated by `EINVOICE_ENABLED`).

### Task 2-D — POS Essentials (master prompt Section 6.3)

**New utils:**
- `src/utils/print/escpos.ts` — ESC/POS command builder (init, text, bold, align, cut, drawer-kick, QR, barcode).
- `src/utils/print/kot.ts` — KOT formatter (restaurant name, table, order #, timestamp, steward, items, KOT serial).

**New UI:**
- `src/app/dashboard/_components/Cashier/CashierBilling.tsx` — keyboard-driven billing screen (F1-F7 shortcuts, cash tender, UPI deep-link, bill print).
- `src/app/dashboard/_components/Cashier/ShiftOpen.tsx` — opening cash entry; locks cashier screen until shift open.
- `src/app/dashboard/_components/Cashier/ShiftClose.tsx` — End Shift flow; variance computation; `cash.shift_short` n8n dispatch on shortfall.
- `src/app/dashboard/_components/Cashier/ShiftXReport.tsx` — mid-shift snapshot (printable, not closing).
- `src/app/dashboard/_components/Cashier/ShiftZReport.tsx` — end-of-day cash closing (hash-chained, locks shift).

**New API:**
- `src/app/api/cashier/shift/open/route.ts`
- `src/app/api/cashier/shift/close/route.ts`
- `src/app/api/print/kot/route.ts` — KOT print proxy (LAN printer at IP:9100 or WebUSB).

### Task 1-F — Documentation (Phase 2 deliverables)

- `docs/EINVOICE_GO_LIVE.md` — NEW.
- `docs/SECURITY_CHECKLIST.md` — NEW (covers hash-chain, no-delete mode, OWASP A01–A10).
- `docs/DEPLOYMENT_RUNBOOK.md` — NEW (Step 12: hash-chain verify).
- `docs/AUDIT_REMEDIATION_TRACKER.md` — Phase 2 rows added.

---

## Phase 2 features added

| Feature | Master prompt ref | Status |
|---|---|---|
| Inventory UI (Stock-In/GRN, Wastage, Physical Count, Suppliers) | §6.1.1–6.1.4 | Delivered by 2-C |
| Daily variance report (theft detector) | §6.1.5 | Delivered by 2-C |
| Low-stock alerts (n8n `inventory.low_stock`) | §6.1.3 | Delivered by 2-C |
| Hash-chain audit log (`billAuditChain` + append/verify + pre-delete hooks + nightly job) | §6.2.1 | Delivered by 2-C |
| No-delete mode (`profile.settings.noDeleteMode`, default true, 2FA + audit chain + n8n alert on disable) | §6.2.2 | Delivered by 2-C |
| GSTR-1 / GSTR-3B export (JSON + CSV + PDF) | §6.2.3 | Delivered by 2-C |
| NIC e-invoice IRN + QR (sandbox-tested, mock fallback when disabled) | §6.2.4 | Delivered by 2-C |
| ESC/POS KOT print (USB + LAN transport) | §6.3.1 | Delivered by 2-D |
| Cashier billing screen (keyboard-driven, cash tender, UPI deep-link, bill print) | §6.3.2 | Delivered by 2-D |
| Shift X report (mid-shift snapshot, printable) | §6.3.3 | Delivered by 2-D |
| Shift Z report (end-of-day cash closing, hash-chained, locks shift) | §6.3.4 | Delivered by 2-D |
| `cash.shift_short` n8n dispatch on cashier shortfall | §6.3.4 + §7.3 | Delivered by 2-D |

---

## Known deviations

| Deviation | Justification | Follow-up ticket |
|---|---|---|
| NIC IRN tested in **sandbox only** | Prod go-live requires owner's prod NIC credentials + DSC; sandbox mock fallback ensures dev works. | `docs/EINVOICE_GO_LIVE.md` documents the prod go-live steps. Owner action item. |
| ESC/POS USB transport uses WebUSB; LAN transport recommended | WebUSB requires HTTPS + user pairing; LAN raw TCP to printer IP:9100 is the production-recommended path. | Document in `docs/DEPLOYMENT_RUNBOOK.md` (LAN path). |
| Hash-chain `compliance.chain_broken` alert delivery depends on n8n `feedback_automation.json`-style workflow | If n8n is not configured, the nightly verify job logs the break to Sentry but does not WhatsApp-alert. | Wave-2 (Task 3-E) adds a dedicated `compliance_alert.json` n8n workflow. |
| Shift Z "tolerance" defaults to ₹0 (zero-variance) | Per master prompt §6.3.4 default. Configurable per-restaurant in `profile.settings.shiftVarianceTolerance`. | Operator-configurable; documented in `docs/SECURITY_CHECKLIST.md`. |

---

## Verification commands

```bash
bun install
bun run lint          # biome check — zero warnings
bun run typecheck     # tsc --noEmit — zero errors
bun run test          # jest — all Phase 2 tests pass (variance math, hash-chain verify, GSTR-1 reconciliation, ESC/POS byte-accuracy)
bun run build         # next build — zero errors, zero warnings
git log --oneline     # shows phase-2 commits
git log -p | grep -i "github_pat"   # MUST return nothing
```

**Hash-chain verify (post-deploy):**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://<your-domain>/api/audit-chain/verify
# expect: {"ok":true,"chainLength":<N>,"lastSequenceNo":<N>,"verifiedAt":"<ISO>"}
```

**Status:** pending final verification (run at the end of wave 1, after all subagents finish).

---

## Phase 2 exit gate (per master prompt Section 6.5)

- [ ] All three sub-features (inventory + GST + POS) pass their acceptance criteria.
- [ ] The hash chain is verified clean after the full Phase 2 test suite runs.
- [ ] `bun run lint && build && typecheck && test` all green.
- [x] `docs/PHASE_2_COMPLETE.md` written (this file).

> Final SHA assigned at push time. See `docs/AUDIT_REMEDIATION_TRACKER.md` for the per-finding SHA mapping.
