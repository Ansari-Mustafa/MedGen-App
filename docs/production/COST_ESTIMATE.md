# MedGen — Cost Estimate (Client Billing)

**Version:** 1.1  ·  **Date:** 21 June 2026  ·  **Owner:** Mustafa (mustafa@brade.ai)
**Companion doc:** `ARCHITECTURE.md`

> **How to read this doc.** Costs are split into **(A) Fixed / one-time**, **(B) Recurring monthly by scale tier**, and **(C) Usage detail**. All figures are USD, current as of June 2026, sourced from public vendor pricing (see §F). They are **estimates to bill in advance** — real spend varies with usage; bill with a buffer (§E).
>
> **Compliance posture (v1.1):** HIPAA is **deferred** — the beta runs on **anonymized data only**, so this uses standard (non-HIPAA) hosting tiers and no BAAs. This cuts the cost floor dramatically vs. the HIPAA version. ⚠️ If real PHI ever enters the system, HIPAA applies and costs rise materially (the HIPAA estimate is available on request). The anonymization boundary must be agreed with the client in writing (see `ARCHITECTURE.md` §5.1).

---

## A. Fixed & one-time costs

| Item | Cost | Frequency | Notes |
|---|---|---|---|
| Apple Developer Program | **$99** | per year | Required to publish to App Store / TestFlight. Enroll under the **client's** org for a clean deliverable (needs a D-U-N-S number; free, allow a few days). |
| Domain name | ~$15–40 | per year | For API + privacy policy / marketing page. |
| TLS / SSL certificates | $0 | — | Managed automatically by Render. |
| App store assets (icon, screenshots) | $0–500 | one-time | $0 if produced in-house. |
| **One-time implementation / setup labor** | *your rate × est. days* | one-time | Migration off Supabase, hardening, CI/CD, App Store setup. Bill separately as professional services — **placeholder for you to fill.** |

**Fixed cash outlay before launch (excluding your labor): ≈ $115–140 for year one.**

---

## B. Recurring monthly costs by scale tier

Three tiers matching the architecture scaling plan. The **Beta** column is what you bill now; the others are forward projections.

| Line item | Beta (~10 users) | Growth (~100 users) | Scale (~1,000 users) |
|---|---:|---:|---:|
| Hosting platform — Render Pro workspace | $25 | $25 | $25 |
| Compute — API + worker + Redis | ~$75 | ~$200 | ~$900 |
| Database — Neon Postgres | ~$30 | ~$100 | ~$400 |
| Object storage (audio + documents) | ~$5 | ~$20 | ~$80 |
| Mobile build/OTA — Expo EAS | $19 (Starter) | $19 (Starter) | $199 (Production) |
| Monitoring / logging / uptime | ~$26 | ~$80 | ~$150 |
| **Speech-to-text (STT) usage** | ~$20 | ~$200 | ~$1,800 |
| **LLM usage (Claude API)** | ~$30 | ~$300 | ~$3,000 |
| **Estimated total / month** | **≈ $230** | **≈ $950** | **≈ $6,550** |
| **Implied cost / active user / month** | ~$23 | ~$9.50 | ~$6.50 |

**Context:** dropping HIPAA removes the ~$700/mo compliance floor from v1.0 — the Render platform fee falls from $499 (Scale, HIPAA) to $25 (Pro), and STT can use standard usage-based providers. The beta run-rate drops from ~$850/mo to **~$230/mo**.

---

## C. Usage cost detail (what drives the variable lines)

**Assumptions (light voice load):** ~12 min of transcribed audio per active user per workday × ~22 workdays ≈ **264 min (~4.4 hours) of audio per user per month**, producing roughly **30 document-generation jobs per user per month**.

### Speech-to-text (STT)
- Standard usage-based pricing: **ElevenLabs Scribe ~$0.40/hr** or **Deepgram Nova-3 ~$0.46/hr** (your existing providers, no BAA needed for anonymized data). ~4.4 hr/user/month ≈ **~$2/user/month**.
- At the Scale tier, volume/annual discounts (ElevenLabs Business ~$0.28/hr, Deepgram Growth ~$0.39/hr) bring the effective rate down — the $1,800 figure is conservative.

### LLM (Claude API)
- Claude **Sonnet 4.6** at $3 / $15 per million tokens (in/out). A typical generation (~10K input incl. template/context + ~2K output) ≈ **$0.06**; ~30/user/month ≈ **$2–3/user/month**.
- **Cost levers:** **prompt caching** cuts cached input ~90%; the **batch API** is 50% cheaper for non-interactive jobs; **Haiku 4.5** ($1 / $5) handles simpler steps at ~⅓ the cost. The table is the un-optimized, conservative figure — applying these can cut the LLM line 30–60%.

---

## D. Client billing summary

### What to bill now (Beta)

| Bucket | Amount |
|---|---|
| One-time: Apple Developer Program (year 1) | $99 |
| One-time: domain (year 1) | ~$20 |
| One-time: implementation / setup labor | *your rate × days* (fill in) |
| Recurring: infrastructure + usage | **≈ $230 / month** |

**Suggested invoice-in-advance figure for the beta period:** bill the **$230/mo run-rate plus a 20% buffer ≈ $275/mo**, plus the ~$120 year-one fixed items, plus your setup labor. For a 3-month pre-billed beta window: **≈ $825 infra + $120 fixed + setup labor.**

### Recommended billing practices
- **Add a 15–25% contingency buffer** on the recurring estimate. Vendor prices change and STT/LLM usage can spike.
- **Pass infra through at cost + buffer**, and **bill your engineering/maintenance time separately** as a retainer or hourly. Don't bury your labor in the infra number.
- **Re-baseline quarterly** with real usage data (measured minutes transcribed, tokens used).
- **Watch the two variable lines** (STT + LLM) — the only ones that grow with usage. Put billing alerts on both vendor accounts.

---

## E. Assumptions, caveats & cost-reduction options

**Assumptions baked in**
- Light voice load (~4.4 hr audio/user/month).
- **Anonymized data only — no PHI, no HIPAA, standard tiers.**
- "Active users" = the tier headcount; many inactive users → lower variable cost.

**Ways to lower cost further**
- **LLM optimizations** (prompt caching, batch, Haiku for simple steps) — 30–60% off the LLM line.
- **STT volume discounts** at the Growth/Scale tiers.
- **Scale-to-zero / autoscaling** on Neon and workers so you pay for capacity only when used.
- **Keep Supabase Pro ($25/mo)** instead of migrating to Neon if you'd rather avoid migration effort for the beta — comparable cost at low scale.

**Caveats**
- ⚠️ **The whole estimate assumes no PHI.** If real patient data flows, HIPAA applies: Render jumps to the Scale plan ($499/mo + 20% compute premium), DB/STT/LLM move to BAA tiers, and the beta floor returns to ~$850/mo. Keep the data boundary firm.
- All vendor prices are public list prices as of June 2026 and **will drift**; confirm at contract time.
- These are infrastructure/run costs only — they exclude your development and maintenance labor.

---

## F. Sources

- Apple Developer Program fee ($99/yr): [Apple Developer Program cost breakdown 2026](https://richestsoft.com/blog/apple-developer-program-cost/)
- Claude API pricing (Sonnet 4.6 $3/$15, Haiku 4.5 $1/$5; caching −90%, batch −50%): [Claude API pricing 2026](https://www.metacto.com/blogs/anthropic-api-pricing-a-full-breakdown-of-costs-and-integration), [CloudZero](https://www.cloudzero.com/blog/claude-api-pricing/)
- ElevenLabs Scribe STT pricing (~$0.40/hr, $0.28/hr Business): [ElevenLabs API pricing](https://elevenlabs.io/pricing/api), [Flexprice breakdown 2026](https://flexprice.io/blog/elevenlabs-pricing-breakdown)
- Deepgram Nova-3 pricing (~$0.46/hr PAYG, $0.39/hr Growth): [Deepgram pricing 2026](https://diyai.io/ai-tools/speech-to-text/deepgram-pricing-2026/)
- Render plans (Pro $25/mo, Scale $499/mo): [Render new workspace plans](https://render.com/docs/new-workspace-plans), [Render pricing blog](https://render.com/blog/better-pricing-for-fast-growing-teams)
- Neon Postgres pricing: [Neon pricing 2026](https://vela.simplyblock.io/articles/neon-serverless-postgres-pricing-2026/)
- Expo EAS plans (Starter $19, Production $199): [Expo billing plans](https://docs.expo.dev/billing/plans/)
- Supabase pricing (Pro $25/mo alternative): [Supabase pricing 2026](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance)
