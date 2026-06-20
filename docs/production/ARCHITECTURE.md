# MedGen — Production Architecture Plan

**Version:** 1.1  ·  **Date:** 21 June 2026  ·  **Owner:** Mustafa (mustafa@brade.ai)
**Status:** Beta → Production roadmap

> **Compliance posture (v1.1):** HIPAA is **deferred**. The beta runs on **anonymized / de-identified data only** — no real PHI enters the system, so no BAAs are required and we can use standard (non-HIPAA) hosting tiers. See §5 for what "anonymize beforehand" actually requires, and the conditions under which HIPAA snaps back into scope.

---

## 1. Purpose & scope

This document defines the production-grade architecture for MedGen: an Expo / React Native mobile app backed by a FastAPI service that runs AI agents for medical document generation. It covers the system design, technology choices, security posture, how the system scales from ~10 concurrent users to 1,000+, and the end-to-end process for shipping to the Apple App Store.

Companion document: **`COST_ESTIMATE.md`** (fixed + recurring cost projections to bill the client).

### Key decisions locked for this plan

| Area | Decision |
|---|---|
| Backend hosting | Managed PaaS (Render) — lowest ops burden, scales to ~1,000 users |
| Compliance | **HIPAA deferred** — beta uses anonymized data only; no PHI, no BAAs (standard tiers) |
| Database | Dedicated managed Postgres (Neon) — migrate off shared Supabase DB |
| Voice load | Light — ~10–15 min of transcribed audio per active user per workday |

---

## 2. What you have today (current state)

From the existing repo:

- **Mobile:** Expo SDK 54, React Native 0.81, expo-router, React Query, Zustand, NativeWind, Supabase JS client (auth), expo-secure-store, expo-notifications.
- **Backend:** FastAPI + Uvicorn, SQLAlchemy async + asyncpg, Alembic migrations, **arq + Redis** for background workers, JWT auth (JWKS), httpx.
- **AI / speech:** Anthropic (Claude) for generation; ElevenLabs (primary STT) with Deepgram and Google Gemini as fallbacks; python-docx / docxtpl for document output.
- **Data/auth:** Supabase (Postgres + Auth + JWT).

This is a solid foundation. Going production is mostly **hardening, observability, and a deployment pipeline** — not a rewrite.

---

## 3. Target production architecture

### 3.1 High-level topology

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENT TIER                                                          │
│  iOS app (Expo / React Native) ── distributed via TestFlight / App   │
│  Store. OTA updates via EAS Update.                                   │
└───────────────┬───────────────────────────────────────────────────────┘
                │ HTTPS (TLS 1.2+), JWT bearer
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EDGE / API TIER  (Render)                                            │
│  • FastAPI web service (2+ instances behind Render load balancer)     │
│  • Rate limiting, auth middleware, request logging                    │
└───────┬───────────────────────────────┬───────────────────────────────┘
        │                               │ enqueue jobs
        ▼                               ▼
┌────────────────────┐        ┌──────────────────────────────────────┐
│  DATA TIER          │        │  WORKER TIER (arq)                    │
│  • Managed Postgres │◀──────▶│  • Transcription jobs (STT)           │
│    (Neon)           │        │  • AI document generation (Claude)    │
│  • Redis (queue +   │◀──────▶│  • Document assembly (docx)           │
│    cache)           │        │  • Retries, dead-letter handling      │
│  • Object storage   │                    │ outbound (TLS)            │
│    (audio, docs)    │                    ▼                          │
└────────────────────┘        ┌──────────────────────────────────────┐
                              │  EXTERNAL AI / SPEECH                  │
                              │  • Anthropic Claude                    │
                              │  • STT: ElevenLabs / Deepgram / Gemini │
                              └──────────────────────────────────────┘
```

### 3.2 Component responsibilities

**Mobile app (Expo / RN)**
Authenticates the user, captures audio, uploads it, polls/subscribes for job status, renders and shares generated documents. Stores only short-lived tokens in `expo-secure-store`. Ships through EAS Build; receives JS-only fixes through EAS Update (OTA) without an App Store re-review.

**API tier (FastAPI)**
Stateless HTTP layer. Validates JWTs, enforces authorization (a user only sees their own/their org's records), applies rate limits, validates request bodies with Pydantic, and **enqueues** any slow work (transcription, generation) rather than doing it inline. Stateless instances mean you scale horizontally just by adding replicas.

**Worker tier (arq)**
Pulls jobs from Redis and runs the long-running pipeline: send audio → STT, assemble prompt + template → Claude, render `.docx`, persist result, notify the client. Workers are where most CPU/wall-clock time goes, so they scale independently from the API tier. All external calls have timeouts, bounded retries with backoff, and a dead-letter path so a failing vendor never wedges the queue.

**Data tier**
- **Postgres (Neon):** system of record — users, encounters, transcripts, document metadata. Encrypted at rest and in transit (standard on Neon).
- **Redis:** job queue (arq) + short-lived cache + rate-limit counters. Ephemeral.
- **Object storage:** audio and generated documents, with lifecycle rules that auto-expire raw audio after a defined window to keep storage lean.

**External AI / speech**
Anthropic (Claude) for generation; ElevenLabs primary STT with Deepgram and Gemini fallbacks. Since the data is anonymized, the existing fallback chain can stay as-is — no BAA constraints on provider choice.

### 3.3 Why this shape

The API/worker split is the single most important production decision. Document generation takes seconds to tens of seconds (STT + LLM); doing that inside an HTTP request would tie up web workers, blow past timeouts, and make the app feel broken under load. Pushing it onto a queue keeps the API fast and lets you absorb spikes — jobs wait in line instead of failing. Scaling becomes a dial: more web replicas for more concurrent requests, more workers for more throughput.

---

## 4. Scaling plan (10 → 100 → 1,000 users)

The architecture does not change across tiers — only the **number and size of instances** and a few managed-service settings. You should never need a re-architecture to grow, only a configuration change.

| Concern | Beta (~10 users) | Growth (~100 users) | Scale (~1,000 users) |
|---|---|---|---|
| API (FastAPI) | 1–2 Standard instances | 2–3 Standard instances + autoscale | 3–6 Pro instances + autoscale |
| Workers (arq) | 1 worker | 2–3 workers | 4–8 workers, queue-depth autoscaling |
| Postgres | Neon Launch, autoscaling on | Launch/Scale, read replica optional | Scale + read replica, connection pooler (PgBouncer) |
| Redis | Single small instance | Larger instance | HA Redis (primary + replica) |
| Concurrency target | 10 concurrent | 100 concurrent | 1,000 concurrent |
| Object storage | GBs | Tens of GBs | Hundreds of GBs + lifecycle expiry |
| CDN/OTA | EAS Starter | EAS Starter/Production | EAS Production |

**Scaling levers, in priority order:**

1. **Horizontal API replicas** — stateless, so just add instances behind the load balancer.
2. **Worker count tied to queue depth** — autoscale workers on Redis queue length so backlog drains automatically during busy hours.
3. **Database connection pooling** — at 100+ users, put PgBouncer (or Neon's pooled endpoint) in front of Postgres so async workers don't exhaust connections.
4. **Read replica** — at ~1,000 users, route read-heavy queries (history, listings) to a replica.
5. **Caching** — cache document templates, user/org metadata, and idempotent lookups in Redis.
6. **Batch & cache LLM calls** — use Anthropic prompt caching for the static parts of prompts (templates, system instructions) to cut token cost ~90% on the cached portion; use the batch API for non-interactive generation.

**Capacity reasoning (light load):** ~10–15 min audio/user/workday ≈ a handful of generation jobs per user per day. Even at 1,000 users that's a few thousand jobs/day — comfortably handled by a small worker fleet. The binding constraint is **external API latency and rate limits**, not your own compute — which is exactly why the queue + autoscaling-workers design matters.

---

## 5. Security & data handling (anonymized-data posture)

HIPAA is deferred, but you still run a medical app handling sensitive content, so standard security hygiene is non-negotiable.

### 5.1 The anonymization requirement — read this carefully

The entire "no HIPAA needed" position rests on **one assumption: no PHI ever reaches the system.** That is harder than it sounds for a voice-driven medical app, because:

- **Audio is the hard case.** A recording of a clinical encounter routinely contains spoken names, dates, locations, and medical record numbers — and the voice itself is a biometric identifier. "Anonymizing beforehand" means the audio fed to STT must already be free of identifiers, which is difficult to guarantee with raw dictation.
- **De-identification has a real standard.** Under HIPAA Safe Harbor there are **18 identifiers** that must be removed (names, dates more specific than year, contact info, IDs, etc.). Anything short of that is not legally de-identified.
- **Re-identification risk.** Combinations of "anonymous" fields (rare diagnosis + age + region) can re-identify a person.

**Practical implication:** for the beta to truly be PHI-free, the client must feed only synthetic or already-de-identified material (e.g. scripted test cases, fake patient names), not real patient recordings. Make this explicit in writing with the client — it's a shared responsibility and the basis of the whole cost model. The moment real patient data flows, **HIPAA applies** and you revert to the v1.0 compliant architecture (BAAs, HIPAA hosting tiers).

### 5.2 Baseline security (do these regardless)

- **Encryption in transit & at rest** — TLS 1.2+ everywhere; Postgres/Redis/storage encrypted (standard on the managed providers).
- **Access control** — least-privilege; row-level authorization in the API; admin/infra access behind MFA.
- **Secrets management** — no secrets in the repo; use Render environment groups; rotate keys on a schedule.
- **Sensible logging** — structured logs; avoid writing full transcripts/prompts to logs or third-party error trackers even when anonymized.
- **Backups & DR** — automated daily Postgres backups (Neon point-in-time recovery), a tested restore procedure.
- **Data minimization** — auto-expire raw audio after a set window; store only what the product needs.

---

## 6. Observability, reliability & CI/CD

**Monitoring & alerting.** Application performance monitoring (Sentry for errors), uptime checks, and dashboards for queue depth, job latency, error rate, and external-API failure rate. Alert when queue depth or STT/LLM error rate crosses a threshold.

**Logging.** Structured JSON logs, centralized.

**CI/CD.** Git push → CI runs lint + tests + Alembic migration check → deploy to a **staging** environment → manual promote to **production**. Render supports preview/staging environments and zero-downtime deploys. Migrations run as a gated step, never automatically against prod without review.

**Environments.** Three: local dev, staging, production.

**Health checks & graceful degradation.** `/health` endpoints for the load balancer; if the primary STT provider fails, the fallback chain engages; if the LLM is down, jobs retry with backoff and surface a clear "try again" state rather than silently failing.

---

## 7. Apple App Store deployment (you're new to this — full walkthrough)

You ship an iOS app in two phases: **TestFlight** (private beta testing) and **App Store release** (public / client's users). Expo's EAS handles the heavy lifting.

### 7.1 One-time setup

1. **Enroll in the Apple Developer Program** — $99/year, at [developer.apple.com](https://developer.apple.com). For a client app, decide whether to enroll under **your** Apple account or the **client's organization** (recommended for a client deliverable: enroll under the client's legal entity via Apple's organization enrollment, which needs a D-U-N-S number; keeps the app owned by the client). Organization enrollment can take a few days for Apple to verify.
2. **App Store Connect** — create the app record (name, bundle ID, privacy details). Bundle ID must match your Expo config (`ios.bundleIdentifier`).
3. **Certificates & provisioning profiles** — EAS manages these automatically (`eas credentials`); you don't hand-manage them.

### 7.2 Build & submit pipeline (Expo EAS)

```bash
# one-time
npm i -g eas-cli
eas login
eas build:configure

# build a signed iOS binary in the cloud
eas build --platform ios --profile production

# submit the build to App Store Connect / TestFlight
eas submit --platform ios --latest
```

`eas build` produces a signed `.ipa` in Apple's cloud (no Mac required). `eas submit` uploads it to App Store Connect.

### 7.3 TestFlight (beta — what your client + their users use first)

- **Internal testing:** up to 100 testers (people on your App Store Connect team) — instant, no Apple review. Good for you + the client's core team.
- **External testing:** up to 10,000 testers via a public or email link — requires a light "Beta App Review" (usually quick). This is how the client's broader users test.

TestFlight builds expire after 90 days; push new builds as you iterate.

### 7.4 App Store review — what to prepare for a medical app

When you promote from beta to public release, Apple reviews the app. Medical apps get **extra scrutiny**:

- **Privacy policy** (required) and **App Privacy "nutrition label"** declaring exactly what data you collect (audio, identifiers) and how it's used.
- **Health-data handling:** Apple's guidelines (§5.1.3) restrict using health data for advertising/data-mining and require a privacy policy.
- **Account deletion:** apps with account creation must offer in-app account deletion.
- **Demo account:** provide Apple reviewers working test credentials.
- **Justify permissions:** clear `NSMicrophoneUsageDescription` explaining why you need the mic.
- Expect 1–3 days for review; medical apps occasionally get follow-up questions.

### 7.5 Updates after launch

- **JS/content changes:** ship instantly over-the-air with **EAS Update** — no re-review.
- **Native changes** (new native module, permission, SDK bump): require a new `eas build` + `eas submit` + Apple review.

---

## 8. Recommended go-live sequence

1. **Confirm the anonymization boundary in writing** with the client — beta uses synthetic/de-identified data only (§5.1).
2. **Provision infra** — Render Pro workspace, Neon Postgres, Redis, object storage. (Standard tiers; no BAAs.)
3. **Migrate data layer** off Supabase Postgres to Neon; run Alembic migrations against Neon.
4. **Harden the app** — rate limiting, sensible logging, secrets in env groups, audio retention/expiry jobs.
5. **Stand up observability + CI/CD** — staging environment, Sentry, dashboards, alerts.
6. **Wire the deployment pipeline** — EAS Build/Submit, App Store Connect record, TestFlight internal build.
7. **Internal TestFlight** with the client.
8. **External TestFlight** for the client's users.
9. **App Store submission** for public release.
10. **Scale on demand** — add API/worker replicas and DB capacity per §4 as user count grows.

---

## 9. Key risks & open items

- **Anonymization is the whole ballgame** — if real PHI ever flows, HIPAA applies and costs/architecture revert to the compliant version. Get the data boundary agreed in writing. *Highest priority.*
- **Auth migration** — moving off Supabase Auth (if you do) needs a plan so existing beta users aren't disrupted; decide on the replacement (app-managed JWT on Neon, or another auth provider).
- **Apple organization enrollment** — start early; D-U-N-S verification can add days.
- **Vendor rate limits** — confirm Anthropic and STT rate limits support your peak concurrency at the 1,000-user tier; request increases ahead of need.

---

*A HIPAA-compliant variant of this architecture (BAAs, HIPAA hosting/DB tiers) is available on request for when real patient data enters scope. Sources for platform pricing/claims are listed at the end of `COST_ESTIMATE.md`.*
