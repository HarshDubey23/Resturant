# Deployment & Cost Analysis (Phases 3-5)

## Phase 3: Zero-Cost Deployment Options

Every service has a free tier sufficient for MVP/demo:

| Service | Plan | Free Tier Limits | Sufficient For |
|---------|------|-----------------|----------------|
| **Vercel** (hosting) | Hobby | 100 GB bandwidth, 6000 build min/mo, serverless functions | Yes — single restaurant |
| **MongoDB Atlas** (DB) | M0 | 512 MB storage, shared RAM | Yes — up to ~10K orders |
| **Upstash Redis** (rate limit) | Free | 10K commands/day, 256 MB | Yes — rate limit only |
| **GitHub Actions** (CI) | Public repo | Unlimited min for public repos | Yes |
| **Sentry** (monitoring) | Free | 5K events/month | Yes — with sampling (0.1 rate) |
| **Cloudflare R2** (images) | Free | 10 GB storage, 1M reads/mo | Yes — demo images only |
| **Groq** (AI chat/STT) | Free | 30 req/min, 14.4K req/day | Yes |
| **Cerebras** (AI failover) | Free | Generous rate limits | Yes |
| **Google Gemini** (AI failover) | Free | 60 req/min via AI Studio | Yes |
| **SiliconFlow** (AI failover) | Free | DeepSeek models | Yes |
| **ElevenLabs** (TTS) | Free | 10K chars/month | Marginal — ~100 orders/mo with voice |
| **n8n** (workflows) | Self-hosted | Free (on your own infra) | Yes |
| **WhatsApp Cloud API** | Free tier | 1K conversations/month | Yes — for demo notifications |
| **NextAuth.js** | OSS | Free | Yes |
| **Doppler** (secrets) | Free | 5 projects | Completely optional |
| **Cloudflare DNS** (domain) | Free | DNS management | Yes — point to Vercel IP |

**Total monthly cost for MVP: \$0** (all within free tiers)

## Phase 4: Free / OSS Alternatives

| Paid Path | Free/OSS Alternative | Status |
|-----------|---------------------|--------|
| ElevenLabs TTS (10K char limit) | Browser `SpeechSynthesis` API | Already implemented as fallback in `voice/tts/route.ts` |
| Sentry (5K event limit) | Self-hosted Sentry (`develop.sentry.dev`) or `console.error` + file logging | Easy swap — just unset `SENTRY_DSN` |
| Doppler (secrets mgmt) | `.env` files directly | Already works via `play` script |
| Stripe (2.9% + \$0.30) | Drop for India-only; Razorpay alone suffices | Razorpay already primary. Just unset Stripe env vars. |
| n8n Cloud (paid) | Self-host n8n via Docker | Use your own VPS or Railway free tier |
| Upstash Redis (paid tier) | In-memory fallback via circuit breaker | Already implemented — Redis outages don't break the app |
| Vercel Pro (\$20/mo) | Vercel Hobby (free) | Sufficient for single restaurant |

## Phase 5: Demo Restaurant Status

Three demo restaurants are fully seeded via `POST /api/refreshDemoData`:

| Restaurant | Slug | Admin Email | Password | Menu Items |
|------------|------|-------------|----------|------------|
| **The Spice Route** | `spiceroute` | `admin@spiceroute.com` | `spiceroute@demo123` | 18 items across 5 categories |
| **Empire Restaurant** | `empire` | `admin@empire.com` | `empire@demo123` | ~20 items across categories |
| **Brewpoint** | `brewpoint` | `admin@brewpoint.com` | `brewpoint@demo123` | ~15 items across categories |

**Gate**: `DEMO_MODE=true` env var required. Production default is `false`.
**Auth**: All admin routes require session with `role === "admin"`.
