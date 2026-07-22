# OpenWA WhatsApp Setup

OpenWA is a self-hosted, free alternative to Meta's WhatsApp Cloud API.

## Prerequisites

- A server with Docker
- A phone number (secondary is recommended)
- WhatsApp installed on a smartphone

## Setup

1. Deploy OpenWA:

```bash
docker run -d \
  --name openwa \
  -p 3001:3001 \
  -v openwa-data:/app/data \
  openwa/wa-automate:latest
```

2. Access the web interface at `http://localhost:3001`
3. Scan the QR code with WhatsApp
4. Set `OPENWA_API_URL=http://localhost:3001` in your `.env`

## Fallback Behavior

If neither `OPENWA_API_URL` nor `WHATSAPP_ACCESS_TOKEN` is set, the WhatsApp client will silently log messages without sending them. The API will return `{ success: true, skipped: true }` instead of throwing.
