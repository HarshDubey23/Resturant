# OrderWorder — NIC E-Invoice Go-Live (Section 6.2.4)

> **Canonical source of truth for env vars:** `.env.example` (Section "NIC E-Invoice").
> **Canonical source of truth for security:** `docs/SECURITY_CHECKLIST.md`.
> **Code:** `src/utils/gst/nicEinvoice.ts` (Phase 2, Task 2-C).

This document walks an operator through enabling India B2B e-invoicing (IRN + QR) via the NIC (National Informatics Centre) e-invoice API. The integration is gated behind the `EINVOICE_ENABLED` feature flag — until you flip it, the app produces GST-compliant invoices **without** an IRN (a mock returns a valid-shaped IRN response for local testing).

---

## 1. What is e-invoicing?

Under India's e-invoicing mandate, businesses with turnover above a threshold (currently ₹5 Cr, lowering over time) MUST register with the NIC Invoice Registration Portal (IRP) and obtain an **Invoice Reference Number (IRN)** + signed **QR code** for every B2B invoice. The IRN is a unique 64-character hash that proves the invoice was registered with the government before being issued to the buyer.

**OrderWorder's role:** on bill finalization (payment success for a B2B invoice where the customer has a GSTIN), OrderWorder calls the NIC API to generate the IRN + QR, stores them on the invoice document, and renders the QR on the invoice PDF.

**What you need from NIC:** an ASN (Application Software Number), a username, and a password — issued when you register your billing software with NIC.

---

## 2. Prerequisites

| Need | How to get it |
|---|---|
| **GSTIN-registered business** | Your restaurant (or restaurant group) must have an active GSTIN. |
| **NIC IRP account** | Register at https://einvoice-1.nic.in → "Registration" → "Software" → apply for an ASN for your billing software (OrderWorder). |
| **NIC sandbox access** | Register at https://einvoice-1-sandbox.nic.in (separate from prod) — same portal, "Sandbox" tab. |
| **Digital Signature Certificate (DSC)** | Optional — for prod, if your invoices require DSC-based signing. Most small restaurants use the GSTIN-based auto-signing. |
| **Restaurant profile fields** | In OrderWorder: `profile.gstNumber`, `profile.legalName`, `profile.address` (place of supply), `profile.gstinRegistrationDate` — these go into the IRN payload. |

---

## 3. URLs

| Environment | Base URL |
|---|---|
| **Sandbox** | `https://einvoice-1-sandbox.nic.in` |
| **Production** | `https://einvoice-1.nic.in` |

The code selects the URL based on `NIC_ENV`:

```
NIC_ENV=sandbox  → https://einvoice-1-sandbox.nic.in
NIC_ENV=prod     → https://einvoice-1.nic.in
```

---

## 4. Environment variables

Set these in `.env.local` (and Vercel env vars for prod). All are documented in `.env.example` Section "NIC E-Invoice".

| Var | Required? | Description |
|---|---|---|
| `EINVOICE_ENABLED` | Yes (master switch) | `false` (default) = skip IRN generation, produce GST-compliant invoice without IRN. `true` = call NIC on every B2B bill finalize. |
| `NIC_ENV` | Yes when enabled | `sandbox` or `prod`. Start in `sandbox`. Switch to `prod` only after go-live sign-off. |
| `NIC_ASN` | Yes when enabled | Application Software Number issued by NIC at software registration. Identifies OrderWorder to the IRP. |
| `NIC_USER` | Yes when enabled | NIC portal username (typically your GSTIN-registered user account). |
| `NIC_PASSWORD` | Yes when enabled | NIC portal password. |
| `NIC_GSTIN` | Yes when enabled | The restaurant's own GSTIN — used as the issuer for IRN generation. |

> **Per-restaurant GSTIN:** `NIC_GSTIN` is the platform-level default. Multi-tenant deployments where each restaurant has its own GSTIN should store the GSTIN on `profile.gstNumber` and use that per-restaurant. The `nicEinvoice.ts` helper checks `profile.gstNumber` first, falling back to `NIC_GSTIN`.

---

## 5. Go-live steps

### Step 1 — Register on the NIC portal

1. Go to https://einvoice-1.nic.in → "Registration" → "Software".
2. Apply for an ASN for "OrderWorder" (or your fork's name). NIC issues the ASN after reviewing your software (typically 1–2 weeks).
3. While waiting, register on the **sandbox** at https://einvoice-1-sandbox.nic.in → "Sandbox" → "Sign Up". Sandbox access is instant.

### Step 2 — Get sandbox credentials

1. In the sandbox portal, navigate to "API Registration" → "User Registration".
2. Create a username + password (these are your `NIC_USER` + `NIC_PASSWORD`).
3. Note your sandbox ASN (provided on the sandbox dashboard — typically `0AA002` for testing).

### Step 3 — Configure OrderWorder in sandbox mode

1. Edit `.env.local`:

   ```bash
   EINVOICE_ENABLED=true
   NIC_ENV=sandbox
   NIC_ASN=<your-sandbox-asn>
   NIC_USER=<your-sandbox-username>
   NIC_PASSWORD=<your-sandbox-password>
   NIC_GSTIN=<your-test-gstin>
   ```

2. Restart the dev server: `bun run dev`.

3. Verify the auth-token endpoint works:

   ```bash
   # The nicEinvoice.ts helper calls this internally; you can test directly:
   curl -X POST https://einvoice-1-sandbox.nic.in/irp/v1.03/auth \
     -H "Content-Type: application/json" \
     -d '{"UserName":"<NIC_USER>","Password":"<NIC_PASSWORD>","AppKey":"<base64-encrypted-app-key>","ForceRefreshAccessToken":false}'
   # expect: {"Status":1,"Data":"<base64-jwt-token>"}
   ```

### Step 4 — Test the IRN lifecycle in sandbox

1. Sign in to the OrderWorder dashboard as admin.
2. Create a B2B order: in the customer menu, set the customer's GSTIN (Settings → Customers → Edit → GSTIN field).
3. Place the order, pay via any method.
4. On payment success, the invoice finalize flow calls `nicEinvoice.generateIRN(invoice)`.
5. Verify in the Invoices tab:
   - The invoice shows an "IRN" badge with the 64-char hash.
   - The PDF (download) shows the signed QR code in the top-right corner.
6. Verify in the NIC sandbox portal: search by IRN — the invoice appears in the IRP records.

### Step 5 — Test IRN cancellation in sandbox

1. Void the invoice from the dashboard (requires reason + 2nd authorizer — see `docs/SECURITY_CHECKLIST.md` Section 2.2).
2. The void handler calls `nicEinvoice.cancelIRN(irn, reason)`.
3. Verify in the NIC sandbox portal: the IRN shows "Cancelled" status.

### Step 6 — Get prod credentials

1. Once sandbox tests pass for ~1 week, apply for prod access: https://einvoice-1.nic.in → "API Registration" → "User Registration" (prod portal).
2. Create a prod username + password.
3. Use the same ASN as sandbox (or apply for a prod-specific ASN if NIC requires).

### Step 7 — Go live in prod

1. Update `.env.local` / Vercel env vars:

   ```bash
   EINVOICE_ENABLED=true
   NIC_ENV=prod
   NIC_ASN=<your-prod-asn>
   NIC_USER=<your-prod-username>
   NIC_PASSWORD=<your-prod-password>
   NIC_GSTIN=<your-prod-gstin>
   ```

2. Redeploy the app.
3. Run one test B2B invoice end-to-end and verify the IRN lands in the prod NIC portal.
4. Mark the go-live in `docs/AUDIT_REMEDIATION_TRACKER.md` Notes column.

---

## 6. IRN lifecycle

### 6.1 Generate (on bill finalize)

| Step | Actor | Code |
|---|---|---|
| 1. Payment verified for a B2B invoice (customer has GSTIN) | Payment webhook | `src/app/api/payment/webhook/route.ts` |
| 2. Invoice finalize handler calls `generateIRN(invoice)` | Invoice finalize | `src/app/api/invoice/generate/route.ts` |
| 3. `nicEinvoice.generateIRN` builds the IRN payload (seller GSTIN, buyer GSTIN, invoice no, date, value, HSN, tax) | `src/utils/gst/nicEinvoice.ts` | — |
| 4. Calls NIC `/irp/v1.03/Invoice` with the auth token | NIC API | — |
| 5. Stores `irn`, `ackNo`, `ackDt`, `qrPayload` on the invoice document | `src/utils/database/models/invoice.ts` | — |
| 6. Appends to the hash-chain audit log (`action: bill.irn_generated`) | `src/utils/helper/auditChain.ts` | — |
| 7. Renders the QR on the invoice PDF | `src/components/layout/InvoiceDocument.tsx` | — |

### 6.2 Cancel (on void)

| Step | Actor | Code |
|---|---|---|
| 1. Owner voids the invoice (reason + 2nd authorizer required) | Dashboard | `src/app/api/invoice/[id]/void/route.ts` |
| 2. Void handler calls `cancelIRN(irn, reason)` | Invoice void | — |
| 3. `nicEinvoice.cancelIRN` calls NIC `/irp/v1.03/Invoice/Cancel` with the IRN + reason | `src/utils/gst/nicEinvoice.ts` | — |
| 4. NIC returns cancellation ack; stored on the invoice | `src/utils/database/models/invoice.ts` | — |
| 5. Appends to the hash-chain audit log (`action: bill.irn_cancelled`) | `src/utils/helper/auditChain.ts` | — |

> **Time limit:** NIC allows cancellation within 24 hours of IRN generation. After 24 hours, the IRN cannot be cancelled — the void handler must surface this to the operator and fall back to issuing a credit note.

### 6.3 QR on invoice PDF

The QR payload returned by NIC is a signed JWT containing the seller GSTIN, buyer GSTIN, invoice no, date, value, tax, and IRN hash. OrderWorder renders this as a QR code on the invoice PDF (`src/components/layout/InvoiceDocument.tsx`) in the top-right corner. Buyers can scan this QR to verify the invoice's authenticity on the NIC portal.

---

## 7. Mock fallback (when `EINVOICE_ENABLED=false`)

When the flag is `false` (or any NIC env var is missing), `nicEinvoice.ts` returns a mock IRN response:

```ts
{
  irn: `MOCK-${invoice._id}-${Date.now()}`,
  ackNo: 0,
  ackDt: new Date().toISOString(),
  qrPayload: "MOCK_QR_DO_NOT_USE_IN_PROD",
}
```

The mock is clearly marked — the QR payload is `MOCK_QR_DO_NOT_USE_IN_PROD`, and the IRN is prefixed with `MOCK-`. This lets the rest of the invoice flow (PDF rendering, hash-chain append, dashboard display) work end-to-end in dev without a NIC account.

> **CRITICAL:** The mock MUST NEVER be used in production. Set `EINVOICE_ENABLED=true` only when ALL of `NIC_ENV`, `NIC_ASN`, `NIC_USER`, `NIC_PASSWORD`, `NIC_GSTIN` are set. The `nicEinvoice.ts` helper validates this on startup and throws if the flag is on but any cred is missing.

---

## 8. Troubleshooting

### "401 Unauthorized from NIC"
**Cause:** Auth token expired (NIC tokens are valid for 60 min) or wrong credentials.
**Fix:** The `nicEinvoice.ts` helper auto-refreshes the token on 401. If it persists, verify `NIC_USER` + `NIC_PASSWORD` against the portal login.

### "2150 — Invalid GSTIN"
**Cause:** `NIC_GSTIN` (or `profile.gstNumber`) does not match the GSTIN registered with NIC.
**Fix:** Verify the GSTIN is active on https://www.gst.gov.in → Search Taxpayer. Use the exact same case as on the GST portal.

### "2285 — IRN already generated for the invoice"
**Cause:** The same invoice number + GSTIN + date combination was already submitted. Duplicate submission is rejected.
**Fix:** The `nicEinvoice.generateIRN` helper catches this error and fetches the existing IRN details via `getIRNDetails(irn)`. Verify the existing IRN is on the invoice document.

### "IRN cancellation window expired (24h)"
**Cause:** The invoice was voided more than 24 hours after IRN generation.
**Fix:** Issue a credit note instead. OrderWorder's void handler surfaces this and offers the credit-note path.

### "E-invoice disabled in prod despite flag set"
**Cause:** One of `NIC_ENV`, `NIC_ASN`, `NIC_USER`, `NIC_PASSWORD`, `NIC_GSTIN` is missing or empty.
**Fix:** Check the app logs for the startup validation error. All 5 vars must be non-empty when `EINVOICE_ENABLED=true`.

---

## 9. Acceptance criteria (per master prompt Section 6.2.5)

- [ ] IRN generation works in **sandbox** (live NIC sandbox returns a valid IRN + QR).
- [ ] IRN cancellation works in sandbox (within 24h window).
- [ ] QR renders on the invoice PDF.
- [ ] Hash-chain audit log shows `bill.irn_generated` and `bill.irn_cancelled` entries.
- [ ] Mock fallback works when `EINVOICE_ENABLED=false` (clearly-marked mock IRN; no NIC calls).
- [ ] Go-live in prod is documented as a follow-up ticket (do NOT enable prod without explicit owner sign-off).

> **Known limitation:** IRN is tested in sandbox only. Production go-live requires the owner's NIC prod credentials and is tracked as a post-launch follow-up. The mock fallback ensures the invoice flow works end-to-end in dev/demo without a NIC account.
