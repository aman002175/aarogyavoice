# Documentation Audit: Challenges, Errors, and Corrections

> **Status:** Internal review document. Not customer-facing.
> **Date of review:** 2026-10-05
> **Scope:** All 9 files in `docs/`, plus verification against the live repository and vendor pricing pages.
> **Trigger:** Team decision to drop Vapi and move to a self-hosted open-source voice stack (Twilio Media Streams → Pipecat → Deepgram → Groq → Kokoro).
>
> **Exchange rate used throughout:** ₹86 per USD.

---

## 0. TL;DR — Read This First

**The strategic decision to leave Vapi is sound. This document does not argue against it.**

What this document argues against is the **cost model** used to justify it. The claim that the new stack is *"~$0.017/min, 75% cheaper than Vapi"* is **arithmetically wrong, and inverts the conclusion**. Verified against vendor pricing pages:

| | Cost per minute |
|---|---|
| **Vapi (all-in)** | **$0.0500** |
| **Self-hosted stack (all-in)** | **$0.0618** |
| Difference | **Self-hosted is ~24% MORE expensive** |

The new stack's real, defensible advantages are **latency control, no per-organisation platform fees, and no vendor lock-in** — *not* lower cost per minute.

Three additional findings that block production regardless of cost:

1. **Tenant isolation is broken by design** — `clinic_id` is an LLM-supplied parameter.
2. **The deployment guide cannot work as written** — it never contains the TwiML that connects the call.
3. **Zero implementation exists** — every step described is unimplemented.

---

## 1. Direct Answer: Was Codium AI Right to Drop Vapi?

**Yes. Codium AI's core judgement is correct, and it matches mine.**

We are not in disagreement about whether Vapi is expensive. Both of us concluded it should be removed. Where we differ is in the *quantitative justification* that was written down afterwards.

Let me be precise about what was actually wrong, because the reasoning matters more than the verdict:

### 1.1 What Codium AI got right

| Claim | Verdict |
|---|---|
| Vapi is expensive per minute | ✅ Correct |
| Vapi adds a platform margin on top of raw model costs | ✅ Correct — see 1.3 |
| Open-source self-hosted components are a legitimate alternative | ✅ Correct |
| Vendor lock-in on experimental models is a real risk | ✅ Correct |

### 1.2 What was *not* verified before switching

The decision was made on a per-minute comparison. Two things were never checked:

1. **What Vapi's `$0.05/min` actually includes** — it turns out to be all-in, including the telephony leg (§1.3).
2. **That the new stack is cheaper** — it is not (§2).

### 1.3 The root confusion: comparing different boundaries

Vapi is a **full-stack reseller**. It runs on Twilio telephony internally, so its per-minute price includes the PSTN leg. Its dashboard showed `~$0.05/min` total, with a breakdown bar of which only `~$0.0033` were the individually listed components (transcriber `$0.0003`, model `$0.00`, TTS `$0.003`). The remaining ~`$0.0467` is telephony + platform.

The new architecture is **not** a like-for-like replacement. Someone totalled only the *software* layer — Deepgram + Groq + Kokoro — and compared it against Vapi's *full* price, then subtracted Twilio separately at an estimated ₹0.96/min.

Twilio is not a free add-on. It is **~80% of the total cost** in the new architecture, and in the old architecture it was already inside Vapi's number.

> **Action for the team:** Confirm Vapi's `$0.05/min` breakdown on their billing/usage dashboard before finalising any decision. The calculation in §2 depends on it.

### 1.4 The honest version of the argument

Vapi should still be dropped — but for these reasons, in this priority order:

| Reason | Strength | Notes |
|---|---|---|
| **Latency** — 1,790 ms measured | **Strong** | This is a real product-quality problem for voice. Controllable only by owning the pipeline. |
| **Plan fees** — $29–$129/month for 5–10 orgs | **Moderate** | Real, but ~₹1,100/clinic/month. Smaller than the per-minute gap in §2. |
| **Vendor lock-in / experimental models** | **Moderate** | Gemini Flash Thinking was $0.00/min; pricing on experimental models can change without notice. |
| **Control over data residency & retention** | **Moderate** | Relevant under DPDP. Vapi Usage plan retains 14 days by default. |
| **Cost per minute** | ❌ **False** | Self-hosted is ~24% *more* expensive. Do not use this as justification. |

**Corrected positioning:** *Vapi is being dropped to gain latency control and independence, and we are knowingly paying a ~24% per-minute premium plus real engineering cost to get it.* That is a defensible product decision. The current document's claim is not.

---

## 2. The Core Cost Error (Headline Finding)

### 2.1 Source verification

Rates were pulled from vendor pricing pages on 2026-10-05.

| Component | USD/min | Source |
|---|---|---|
| Twilio PSTN, India (inbound) | **$0.0496** | `twilio.com/en-us/voice/pricing/in` — present in page HTML |
| Twilio PSTN, India (other column) | **$0.0699** | same page |
| Twilio Media Streams | **$0.0044** | `twilio.com/en-us/voice/pricing/us` |
| Deepgram Nova-3 (streaming) | **$0.0048** | `deepgram.com/pricing` |
| Groq Llama 3.3 70B | **~$0.0030** | $0.59/M in, $0.79/M out — see derivation below |
| Kokoro-82M | **$0.0000** | open weights |
| **Self-hosted total** | **$0.0618** | |

**Groq derivation:** a minute of conversation ≈ 8 turns × ~600 input tokens + ~60 output tokens → 4,800 in + 480 out.
`4,800 × $0.59/1e6 + 480 × $0.79/1e6` = `$0.00283 + $0.00038` ≈ **$0.0032/min**. Rounded down to $0.0030 conservatively.

### 2.2 The assumption that failed

`PRICING_AND_BUSINESS.md` lists:

> Twilio Telephony — ₹0.96/min — ₹1,920/month

₹0.96 = **$0.0112/min**. Verified directly against Twilio's page HTML:

```
0.0496  →  2 occurrences  ("<b>$0.0496</b> / min")
0.0699  →  3 occurrences  ("<b>$0.0699</b> / min")
0.0112  →  0 occurrences  ← the assumed rate does not exist on the page
```

**The assumed rate is off by 4.4×.** Twilio also bills India on **CPS (per-second)** basis, not per-minute — a further modelling difference.

### 2.3 A second missing line item

**Twilio Media Streams is billed separately** at `$0.0044/min`, *on top of* Programmable Voice minutes. The TwiML `<Connect><Stream>` mechanism that the entire new architecture depends on is exactly what triggers this charge. It appears nowhere in `PRICING_AND_BUSINESS.md`.

### 2.4 Corrected unit economics — 2,000 min/clinic/month

| Component | In `PRICING_AND_BUSINESS.md` | Corrected | Basis |
|---|---|---|---|
| Twilio telephony | ₹1,920 | **₹8,531** | $0.0496 × 2,000 × 86 |
| Twilio Media Streams | *(omitted)* | **₹757** | $0.0044 × 2,000 × 86 |
| Deepgram STT | ₹820 | **₹826** | $0.0048 × 2,000 × 86 |
| Groq LLM | ₹100 | **₹516** | $0.0030 × 2,000 × 86 |
| Kokoro TTS | ₹0 | ₹0 *(+ GPU, see §5.3)* | open weights |
| Twilio number rent | ₹110 | **₹99** | $1.15 × 86 ✓ correct |
| Railway hosting | ₹100 | **₹430** | $5 × 86 — also understated |
| **TOTAL** | **₹3,050** | **₹11,159** | **+₹8,109** |

**Variable cost per minute:** documented ₹1.42 → **actual ₹5.31**

**At ₹7,999/month revenue: the claimed 61% margin becomes a ₹3,160 monthly loss per clinic.**

### 2.5 Corrected comparison at 10 clinics (20,000 min/month)

| | Vapi | Self-hosted |
|---|---|---|
| Usage (20,000 min) | $1,000.00 | $1,236.00 |
| Plan fees | $129.00 (Core + 5 orgs) | $0.00 |
| Hosting | $0 | $5.00 (Railway) |
| GPU (Kokoro) | $0 | ~$75 |
| **Monthly total** | **$1,129** | **$1,316** |
| **In ₹** | **₹97,094** | **₹113,176** |
| **Per clinic** | **₹9,709** | **₹11,318** |

**Vapi is cheaper by ₹16,082/month — even after paying all platform fees.**

Reason: the per-minute penalty (`$0.0118 × 20,000 = $236/mo`) dwarfs the plan fees it saves (`$129/mo`).

### 2.6 What would make self-hosted win

Break-even requires Twilio PSTN ≤ **$0.042/min**. Current India rate is $0.0496. Options:

1. **Alternative carrier** — Exotel (Indian), Telnyx, or Plivo. India-native rates can be materially lower than Twilio's international tariff. *This is the highest-leverage lever by far — 80% of cost sits in this one line.*
2. **Negotiated Twilio volume tier** — documented threshold is ~$5,000/month spend. At 10 clinics we reach ~$1,236. **Not yet eligible.** At ~40 clinics we would be.
3. **Cap minutes** — the model breaks if heavy users are unbilled. See §6.3.
4. **Toll-free vs local** — inbound rates differ by number type; must be modelled per number type.

---

## 3. Documents Reviewed

| File | Lines | Status |
|---|---|---|
| `ARCHITECTURE.md` | 38 | Conceptually sound; 3 gaps (§5.1, §6.1, §7.1) |
| `DATABASE_SCHEMA.md` | 72 | **2 blocking bugs** (§4.1, §4.2) |
| `DEPLOYMENT_GUIDE.md` | 39 | **Cannot work as written** (§4.3) |
| `PRICING_AND_BUSINESS.md` | 46 | **Cost model wrong** (§2) |
| `VOICE_AGENT_PROMPT.md` | 56 | **Isolation hole** (§4.1) |
| `VAPI_SETUP.md` | 393 | ⚠️ **Obsolete** — superseded architecture (§8.1) |
| `ACCOUNT_SETUP_GUIDE.md` | 634 | ⚠️ **Obsolete** — contradicts current design (§8.2) |
| `PRICING_MODEL.md` | 263 | ⚠️ **Superseded** cost basis (§8.3) |
| `LAUNCH_PLAN.md` | 295 | ⚠️ Partially superseded (§8.3) |

---

## 4. Security and Correctness Bugs

### 4.1 🔴 BLOCKER — `clinic_id` is supplied by the LLM

**File:** `VOICE_AGENT_PROMPT.md` §2

Both business tools declare `clinic_id` as a model-supplied parameter:

```
check_slot_availability:  clinic_id (string, required)
book_appointment:         clinic_id (string, required)
```

**Why this is broken:** the architecture runs **one shared Pipecat pipeline across 10 clinics**. The LLM is given no reliable way to know which clinic the caller dialled. It will guess, hallucinate, or reuse a stale value from conversation history.

**Impact:** a caller to Clinic A can cause a read or write against Clinic B's appointments and patient records. This is a cross-tenant data breach, reachable by ordinary conversation.

**This also invalidates the isolation claim** made in `PRICING_MODEL.md` and in the public FAQ ("records isolated"). That claim is currently false.

**Correct approach — derive, never accept:**

```python
# clinic_id comes from which Twilio number received the call, resolved at
# connection time and injected into the LLM context as a system fact.
# The LLM has no parameter for it and cannot influence it.

inbound = await twilio_lookup(from_number)      # -> clinic_id
context = SystemContext(
    clinic_id=inbound.clinic_id,                # trusted, not model-generated
    clinic_name=inbound.name,
    opening_hours=inbound.config.start_time,
)

# Tools take NO clinic_id argument at all.
@function_tool
async def check_slot_availability(date: str, time: str) -> SlotResult:
    return await backend.slots(clinic_id=context.clinic_id, date=date, time=time)
```

Also cache this at connection setup — do not re-resolve per tool call.

---

### 4.2 🔴 BLOCKER — No unique constraint on patients

**File:** `DATABASE_SCHEMA.md` §2

```js
const PatientSchema = new Schema({
  phone_number: { type: String, required: true, index: true },
  clinic_id:    { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
  ...
});
```

`index: true` is a **non-unique** index. There is no compound uniqueness on `(clinic_id, phone_number)`.

**Impact:** two concurrent calls for the same number create two patient records. History splits. `total_visits` fragments. `last_visit_date` becomes wrong.

**Why this is a business-critical bug, not just a data-quality one:** the entire new/old patient determination — which decides whether the patient is charged the ₹100 registration fee (`new_patient_fee`) — depends on a single unambiguous patient record. Duplicate rows mean a returning patient is quoted as new and charged again. That is a patient-facing billing error caused by a concurrency race.

**Correct:**

```js
const PatientSchema = new Schema({
  phone_number: { type: String, required: true, trim: true },
  clinic_id:    { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
  ...
});

// Enforce one patient per (clinic, phone). Also normalises Indian numbers.
PatientSchema.index(
  { clinic_id: 1, phone_number: 1 },
  { unique: true }
);
```

Handle the duplicate-key error (`E11000`) in the booking tool by **re-reading and returning the existing record** rather than failing the call.

---

### 4.3 🔴 BLOCKER — `DEPLOYMENT_GUIDE.md` is missing the TwiML

**File:** `DEPLOYMENT_GUIDE.md` §3

The guide instructs you to set Twilio's *"A call comes in"* webhook to:

```
https://your-app.up.railway.app/call      (HTTP POST)
```

That part is correct — it is the **TwiML endpoint**. But the document **never shows what that endpoint must return.** Twilio calls it, expects TwiML XML in the response, and connects the call only if that XML is correct.

The required response is absent from the entire `docs/` set:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://your-app.up.railway.app/media" />
  </Connect>
</Response>
```

**Two errors in one line:**

1. `wss://` is a **WebSocket** URL. The `https://` domain cannot be used inside `<Stream>`.
2. The WebSocket path (`/media`) is a **different endpoint** from the TwiML endpoint (`/call`). One accepts HTTP POST and returns XML; the other holds a persistent duplex audio socket. The guide conflates them into a single `/call` URL.

**Following the guide literally produces an endpoint that answers HTTP but connects no audio — every call reaches a dead line.**

**Also missing:** how to derive the public `wss://` URL from Railway's `https://` domain, and how the inbound caller's number reaches the pipeline (it arrives as the `From` SIP header on the TwiML request — this is the trusted input for §4.1's `clinic_id` resolution).

---

### 4.4 🟠 HIGH — Patient enumeration

**File:** `VOICE_AGENT_PROMPT.md` §2, Tool 1

```
check_patient_history → returns { status: "OLD", last_visit: "2023-10-01" }
```

The only input is a phone number. There is no authentication of any kind.

**Impact:** anyone who knows or guesses a patient's number learns that they are a registered patient and when they last visited. It also functions as an enumeration oracle — iterating a number range reveals clinic patient volume.

**Mitigations, cheapest first:**

1. Drop `last_visit_date` from the response. It is conversational garnish, not required by the script.
2. Return only `{ is_new_patient: bool }` — the minimum the "parchi fee" dialogue actually needs.
3. Rate-limit the tool per call and per number.
4. For the fee disclosure itself, note it is already public at the clinic counter, so disclosing the *rule* is fine — it is the *per-patient visit history* that must not leak.

---

### 4.5 🟠 HIGH — Token counter reintroduces a known desync bug

**File:** `DATABASE_SCHEMA.md` §1

```js
current_token: { type: Number, default: 1 },
```

This stores a mutable counter **separately from the appointment list**. This is precisely the bug that was found and fixed in the dashboard during the frontend review: a separate counter drifts from the queue, so cancelling the patient currently being served leaves the public display announcing a token that is no longer correct.

**It is being reintroduced at the database layer.**

Two further problems:

- **No concurrency control.** Two calls finishing simultaneously, or the dashboard's "Next patient" racing an incoming call, will interleave read-modify-write and skip or duplicate tokens. A plain `findOneAndUpdate` on a counter is not safe here.
- **No per-clinic queue concept.** `current_token` on the `Clinic` document assumes one linear queue per clinic, which is fine, but it must be derived or guarded.

**Correct approaches — pick one:**

```js
// Option A — derive, never store. Serving token = head of waiting queue.
const serving = await Appointment.findOne({
  clinic_id, status: 'IN_PROGRESS'
}).sort({ token_number: 1 });

// Option B — atomic increment (safe against races).
await Clinic.findOneAndUpdate(
  { _id: clinic_id },
  { $inc: { current_token: 1 } },
  { new: true }
);
```

Option A is preferable: it cannot desync by construction, which is the property the dashboard fix established. Keep `current_token` only as a display convenience, and reconcile it — never treat it as the source of truth.

---

### 4.6 🟡 MEDIUM — Credentials and secret handling

**File:** `ACCOUNT_SETUP_GUIDE.md` (obsolete, but patterns may be copied forward)

| Line | Problem |
|---|---|
| `ADMIN_SECRET_KEY=your_admin_password_12345` | Teaches a hardcoded, weak, publicly-guessable secret |
| IP whitelist: `0.0.0.0/0` | Exposes the database to the entire internet. Never for production |
| `MONGO_PASSWORD` stored separately *and* inside `MONGO_URI` | Redundant; doubles the exposure surface |
| `GITHUB_TOKEN=ghp_...` in `.env.local` | Unnecessary — the repository is already connected through a managed GitHub App credential |
| `JWT_SECRET=your_jwt_secret_key_12345` | Same weak-secret problem |

**Corrections:**

- Generate secrets, never type them: `openssl rand -base64 48`
- Atlas network access: allowlist specific IPs. If the runtime egress IP is dynamic, use a private endpoint or an IP-range rule — never `0.0.0.0/0`
- `MONGO_URI` alone is sufficient; derive nothing, store the password nowhere else
- If MongoDB holds patient records, enable encryption at rest and IP allowlisting **before** any real data is written

---

### 4.7 🟡 MEDIUM — Dead references and broken links

- `VAPI_SETUP.md` line ~300 documents an `x-vapi-signature` HMAC scheme. **Vapi has no such header.** Their current model is Custom Credentials (`credentialId` → Bearer Token / OAuth 2.0 / HMAC), with `x-vapi-secret` as the legacy header. The snippet also re-serialises `req.body` for HMAC comparison, which cannot match the signed raw bytes, and uses a non-timing-safe comparison.
- Placeholder images use `via.placeholder.com`, which no longer serves these reliably.

Moot if the Vapi docs are removed — see §8.1.

---

## 5. Architecture Gaps

### 5.1 🟠 HIGH — Latency target is optimistic, and barge-in is unaddressed

**Claimed:** `< 800ms` end-to-end (`ARCHITECTURE.md` §2.B).

**Realistic budget for a cascaded STT → LLM → TTS pipeline:**

| Stage | Typical |
|---|---|
| VAD / endpointing (speech-end to transcript-final) | 300–500 ms |
| LLM time-to-first-token | 150–250 ms |
| TTS synthesis | 150–400 ms |
| Network (Twilio ↔ server, ×2) | 80–150 ms |
| **Realistic total** | **~700 ms – 1,300 ms** |

The figure is achievable only at the optimistic end, and **Kokoro makes it harder**: Kokoro-82M is a **non-streaming** TTS — it requires the complete sentence before it can begin synthesising. Long LLM responses therefore cannot be spoken progressively, which directly adds to perceived latency.

**Barge-in (interruption) is not mentioned anywhere in `docs/`.** This is the defining problem of conversational voice: when a patient interrupts mid-sentence, the pipeline must cancel in-flight TTS, discard queued audio, and resume listening. With a non-streaming TTS plus full-sentence generation this is genuinely hard, and no design decision is documented about it.

**What should be documented:**
- Target latency per stage, with measured values — not one end-to-end number
- VAD and endpointing configuration (this dominates the budget)
- Maximum sentence length enforced on LLM output to bound TTT
- Explicit barge-in design: interruption detection, audio cancellation, turn state machine
- A **measured** p50 / p95 latency, from the pilot, before any latency claim is published

### 5.2 🟠 HIGH — Single shared pipeline has no tenant isolation boundary

`ARCHITECTURE.md` §1 describes one Pipecat service for all clinics. Combined with §4.1, there is currently **no mechanism preventing one clinic's call from touching another's data.**

Needed at the connection boundary:
- Number → clinic resolution (§4.1)
- Per-clinic rate and concurrency limits
- Every tool call scoped to the resolved clinic, enforced server-side
- Cross-clinic access treated as a **security incident**, not a bug

### 5.3 🟡 MEDIUM — "Kokoro ₹0.00" omits the GPU

Kokoro's weights are free. **Inference is not.** Kokoro-82M is small enough for CPU, but CPU inference will not meet the latency target in §5.1 — a GPU is effectively required.

An RTX T4-class instance is roughly **$0.30/hr**. At 20,000 minutes/month (~333 hours if the GPU runs continuously) that is ~$100/month — and that assumes you can run it continuously, which is wasteful for a spiky clinic workload.

**Correct treatment:** Kokoro cost = GPU provisioning, either dedicated (~$75–100/mo) or spun up on demand, allocated per clinic.

Two separate understatements sit here:

| Item | Claimed | Actual | Understated by |
|---|---|---|---|
| Railway hosting | ₹100 | ₹430 ($5 × 86) | ₹330/clinic/mo |
| Kokoro GPU | ₹0 | ₹6,500–8,600/clinic/mo | entire line missing |

Across 10 clinics that is roughly **₹68,000/month of unmodelled cost.**

---

## 6. Consistency and Process Issues

### 6.1 Backend hosting is specified three different ways

| Document | Backend host |
|---|---|
| `ACCOUNT_SETUP_GUIDE.md` §5 | Render |
| `DEPLOYMENT_GUIDE.md` | Railway |
| `ARCHITECTURE.md` | Vercel (app) + Railway (voice) |

**Also:** `ACCOUNT_SETUP_GUIDE.md` recommends Render's **free tier**. Free instances sleep after ~15 minutes idle. During clinic hours a cold start means webhook and API timeouts — the exact failure the product exists to prevent.

**Decision needed.** Note that Freebuff-managed hosting is Node-only and cannot run the Python voice service, so the voice pipeline needs a separate host regardless. Recommended: **Vercel** for the Next.js app + **Railway** (paid, no-sleep) for the voice service.

### 6.2 Two pricing documents contradict each other

| | `PRICING_MODEL.md` | `PRICING_AND_BUSINESS.md` |
|---|---|---|
| Cost per clinic | ₹8,067 | ₹3,050 |
| Headline price | ₹7,999 / ₹14,999 / ₹44,999 | ₹7,999 + ₹2,999 setup |
| Structure | Metered (600 / 1,500 / 5,000 min) | Flat 2,500 min |
| Overage | ₹7 / ₹6 | ₹3.50 |
| Margin | 52–54% | 61% |

Same headline price, entirely different economics. **Neither is currently valid** — both are built on superseded cost inputs. One must be chosen and the other removed.

### 6.3 No fair-use cap or minute limit in the current model

`PRICING_AND_BUSINESS.md` includes 2,500 minutes and ₹3.50 overage. With corrected variable cost (~₹5.31/min), **3,500 minutes of overage costs ₹18,585 against ₹12,250 of overage revenue — a losing customer.**

At the documented ₹3,050 cost, this worked. At the real cost, it does not. Any published plan needs a hard fair-use ceiling and an overage rate above variable cost.

### 6.4 Filenames contain trailing whitespace

```
DATABASE_SCHEMA.md··      (U+00A0 non-breaking space ×2)
VOICE_AGENT_PROMPT.md··   (U+00A0 non-breaking space ×2)
```

Verified via `od -c`. Any script, link, or `grep` referencing these paths by exact name will fail silently. Rename to strip the trailing bytes.

### 6.5 Naming is unresolved

| Source | Name |
|---|---|
| App config (`src/lib/config.ts`) | **Aarogya Voice** |
| `README.md` title | AI Receptionist |
| SendGrid sender | `noreply@aireceptionist.com` |
| Repository | `aman002175/amanbishnoi` |

No account, domain, package, or invoice should be created before this is settled — the sender domain and platform project names are all derived from it.

---

## 7. Implementation Status

### 7.1 Nothing described in the docs has been built

Verified against the repository:

```
voice-agent/         → does not exist
requirements.txt     → does not exist
*.py                 → 0 files
src/                 → 15 files, all frontend, no API routes
```

`DEPLOYMENT_GUIDE.md` instructs: *"ensure your Pipecat code is in a specific folder like `/voice-agent`"* and *"Deploy the code to GitHub. Railway will auto-deploy."* Neither is currently possible.

`PRICING_AND_BUSINESS.md` §3 Phase 2 also schedules *"Deploy the Pipecat stack on Railway"* for **days 8–15** — roughly 8 days of engineering work that is not scoped, not started, and not budgeted. The 30-day plan is not achievable as written.

### 7.2 Environment is empty

`freebuff-env list` returns no variables. No provider accounts have been provisioned. No cost in either pricing document has been validated against a real invoice.

**This is good news:** every number in this document can still be corrected cheaply, before any money is committed.

---

## 8. What the Docs Should Actually Contain

### 8.1 Remove or clearly archive the obsolete Vapi documents

`VAPI_SETUP.md` (393 lines) and `ACCOUNT_SETUP_GUIDE.md` (634 lines) describe an architecture that has been abandoned — **1,027 lines of actively misleading documentation.** `ACCOUNT_SETUP_GUIDE.md` additionally documents Render, SendGrid, a GitHub PAT, and a Vercel frontend, none of which match the current design.

**Recommendation:** delete both, or move to `docs/archive/` with a prominent header stating they describe a superseded design. Leaving them in `docs/` means the next person — or the next AI tool — will follow them.

### 8.2 Replace with a single source of truth

One architecture document covering:

1. Number → clinic resolution, and how `clinic_id` is trusted (§4.1)
2. The TwiML endpoint **and** its exact XML (§4.3)
3. The separate WebSocket media endpoint
4. Tool definitions with **no** `clinic_id` parameter
5. Barge-in and turn-taking design (§5.1)
6. Per-stage latency budget with measured targets
7. Hosting topology, with no-sleep guarantee for the voice service (§6.1)

### 8.3 One pricing document, built from verified rates

Rebuild from vendor sources, with a **date and source URL on every line**, and record whether each rate is inbound or outbound and whether it is per-minute or per-second. Keep a single "assumptions" block that states: minutes/clinic/month, clinics, exchange rate, and the confirmed Twilio India inbound rate.

### 8.4 Data model corrections

- Compound unique index on `(clinic_id, phone_number)` (§4.2)
- Serving token derived from queue head, not stored as source of truth (§4.5)
- Explicit retention policy for transcripts — call recordings contain patient health information
- Documented consent flow at first call

---

## 9. Recommended Sequence

Ordered by dependency. Steps 1–3 are prerequisites for any further pricing work.

1. **Confirm the Twilio India inbound rate** from your own Twilio billing console. Everything in §2 depends on it. *(5 minutes)*
2. **Confirm Vapi's `$0.05/min` breakdown** — specifically whether telephony is included. *(5 minutes)*
3. **Quarantine obsolete docs** — delete or archive `VAPI_SETUP.md` and `ACCOUNT_SETUP_GUIDE.md` so nothing further is built on them. *(5 minutes)*
4. **Fix §4.1 and §4.2 before writing any pipeline code.** Both are schema-level decisions; changing them after the tool layer exists is far more expensive.
5. **Write the TwiML (§4.3).** Without it, no call can connect, and nothing can be tested end to end.
6. **Build the smallest possible vertical slice** — one number, one clinic, TwiML → WebSocket → fixed greeting audio. Measure real latency before writing any STT or LLM code. *(This de-risks §5.1 cheaply.)*
7. **Add Deepgram, then Groq, then Kokoro**, measuring latency after each. Kokoro's contribution to turn latency is the largest unknown.
8. **Re-derive pricing** from measured per-minute cost, with the fair-use cap from §6.3.
9. **Only then** start the pilot described in `PRICING_AND_BUSINESS.md` §3.

**Alternative worth evaluating:** keep Vapi for the pilot while the self-hosted pipeline is built, and migrate once measured latency justifies it. This avoids betting the entire business on an unvalidated latency hypothesis, and costs at most a few thousand rupees for the pilot period.

---

## 10. Open Questions

| # | Question | Blocks |
|---|---|---|
| 1 | Confirmed Twilio India inbound rate (mobile vs landline)? | All pricing |
| 2 | Does Vapi's `$0.05/min` include the PSTN leg? | Decision to switch |
| 3 | What is the product's final name? | Accounts, domains, invoices |
| 4 | Which telephony provider — Twilio, Exotel, Telnyx, Plivo? | ~80% of COGS |
| 5 | Is the GPU dedicated or spun up on demand? | Kokoro cost, latency |
| 6 | Vercel or self-hosted for the Next.js app? | Hosting topology |
| 7 | Transcript and recording retention policy under DPDP? | Compliance, schema |
| 8 | Which pricing document is authoritative? | Customer-facing material |
| 9 | Is 2,000 minutes/clinic/month realistic for Indian clinics? | Every derived number |

---

## Appendix A — Source URLs

- Twilio India voice pricing: `https://www.twilio.com/en-us/voice/pricing/in`
- Twilio US voice pricing (Media Streams): `https://www.twilio.com/en-us/voice/pricing/us`
- Twilio Media Streams overview: `https://www.twilio.com/docs/voice/media-streams`
- Deepgram pricing: `https://deepgram.com/pricing`
- Groq pricing (Llama 3.3 70B): `https://console.groq.com/docs/model/llama-3.3-70b-versatile`
- Vapi server authentication: `https://docs.vapi.ai/server-url/server-authentication`
- Kokoro-82M: `https://huggingface.co/hexgrad/Kokoro-82M`

*All rates verified 2026-10-05. Vendor pricing changes without notice — re-verify before any public pricing is published.*