# Aarogya Voice — Pricing Model & Unit Economics

> **Status:** Internal planning document. Not customer-facing.
> **Cost inputs:** Vapi platform pricing (screenshots of `dashboard.vapi.ai/settings/billing` and an assistant cost panel), Twilio phone number rate.
> **Figures are planning estimates** — re-verify against live invoices before publishing any price publicly.
> **Exchange rate used throughout:** ₹86 per USD.

---

## 1. Executive summary

The currently published pricing (₹1,499 and ₹3,999 per month) **loses money on every customer.**

| | Amount |
|---|---|
| Current Clinic plan price | ₹3,999/month |
| Fully-loaded cost per clinic (typical usage) | ₹8,067/month |
| **Loss per customer per month** | **₹4,068** |

At the **break-even floor**, no plan priced under **₹8,500/month** is viable — even for the lightest users.

The three decisions that determine whether this business works:

1. **Ten separate Vapi organizations** (₹11,094/month) vs. one shared org. Recommendation: separate orgs, because tenant isolation for medical data is a promise the product makes.
2. **Negotiate Vapi's $0.05/min.** This is 68% of total cost and the single largest lever available.
3. **Metered pricing, never flat.** Usage scales linearly; a flat price is subsidised by heavy users until it isn't.

---

## 2. Cost inputs (as read from the Vapi dashboard)

### 2.1 Vapi platform plans

| Plan | Price | Organizations | Concurrent call lines | Vapi phone numbers | API limits | Data retention | RBAC |
|---|---|---|---|---|---|---|---|
| **Usage** (current) | $0 | 2 | 4 | 1 | 200 req/min | 14 days | Everyone is admin |
| **Core** | $29/mo | 5 | 10 | 5 | 200 req/min | 30 days | Everyone is admin |
| **Business** | $999/mo *or* 10% of total hosting spend | 10 | 30 | 10 | 300 req/min | 180 days | Basic RBAC |
| **Premier** | Negotiated annually with Vapi sales | — | — | — | — | — | Full RBAC, SSO, dedicated SIP trunk, CISO review |

\* The Business tier is a **minimum spend**, not a flat price. If Vapi hosting spend falls below $9,990, the minimum still applies.

### 2.2 Add-ons

| Add-on | Price |
|---|---|
| Concurrent call lines | $10/mo per line |
| Organizations | $20/mo per organization |
| Data retention, extended to 60 days | **$1,000/mo** |
| HIPAA compliance | Enterprise / on request |
| Dedicated SIP trunk | Business+ |
| SSO | Premier |

### 2.3 Per-assistant runtime cost

The assistant panel shows a blended **~$0.05 per minute**, decomposing as:

| Component | Vendor | Cost / min |
|---|---|---|
| Transcriber | Gemini 2.0 Flash Lite (Google, multilingual) | $0.0003 |
| Model | Gemini 2.0 Flash Thinking (Google) | $0.00 |
| Voice | Riya — Inworld TTS 1.5 Mini | $0.003 |
| **Stated blended total** | | **~$0.05** |

Blended latency on that configuration: **~1,790 ms**.

> **Observation that matters commercially:** the three named components sum to **$0.0033/min**. The remaining **~$0.0467/min** is Vapi's platform margin on top. That gap is the negotiation target — see §7.

### 2.4 Twilio

| Item | Price |
|---|---|
| Phone number | ₹250 per number per month |

Twilio is used for phone numbers because the Vapi-issued number allowance tops out at 5 on Core — not enough for 10 clinics.

---

## 3. Call volume assumptions

| Parameter | Light | **Typical** | Heavy |
|---|---|---|---|
| Calls per day | 10 | **15** | 20 |
| Average duration | 3 min | **4 min** | 5 min |
| Working days per month | 26 | **26** | 26 |
| **Minutes per month** | **780** | **1,560** | **2,600** |

**26 working days** assumes a six-day week with Sundays off. A clinic operating seven days moves to roughly **30 days**, raising every minute figure above by about **15%** and every rupee figure by the same.

Duration of 3–5 minutes is the realistic band for a receptionist call: greet, identify the patient, state queue position, book or transfer. Calls that run to 5 minutes skew toward transfers and detailed booking.

---

## 4. Vapi plan selection — do not buy Business

**Business ($999/mo) is the wrong tier for 10 clinics.** It exists to sell 180-day data retention, RBAC, and HIPAA posture. Indian clinics operate under the **Digital Personal Data Protection Act, 2023**, not HIPAA — none of those are requirements here, and it is a **minimum spend**, so it does not scale down.

### 4.1 Recommended configuration

| Component | Quantity | Rate | Monthly |
|---|---|---|---|
| Core plan | 1 | $29 | $29 |
| Additional organizations | 5 | $20 | $100 |
| Concurrent call lines | 10 (included in Core) | — | $0 |
| **Total** | | | **$129 ≈ ₹11,094** |

**The 60-day data retention add-on must not be purchased.** At $1,000/month it costs more than the entire rest of the stack combined and is being sold at a punitive multiple. Core's 30 days is sufficient; call logs are operational data, not the legal medical record.

### 4.2 Why concurrent call lines are not a constraint

Ten clinics do not mean ten simultaneous calls. Reception overflow is rare and short — a clinic typically has 0–2 calls in flight at once, with evening peak being the worst case. **10 concurrent lines (included in Core) carries comfortable headroom.** Do not buy the $10/line add-ons.

### 4.3 The organization decision

**Ten orgs = ₹11,094/month = ₹1,109 per clinic per month.**

The alternative — running all ten clinics inside one Vapi organization with separate assistants per clinic — costs ₹0, but removes hard tenant isolation.

| Option | Monthly cost | Per clinic | Trade-off |
|---|---|---|---|
| 1 org, 10 assistants | ₹0 | ₹0 | No hard isolation; a query bug can leak across clinics |
| **10 orgs (recommended)** | **₹11,094** | **₹1,109** | Real isolation boundary |

**Recommendation: buy the 10 orgs.** The product already promises isolation to customers — the pricing FAQ states *"each clinic's records are isolated from every other clinic's."* That claim should be structurally true, not a matter of careful query writing. At ₹1,109/clinic/month it is roughly 13% of the recommended plan price, which is affordable and removes a class of compliance risk entirely.

---

## 5. Unit economics per clinic

### 5.1 Variable cost — Vapi usage

At $0.05/min and ₹86/USD, one minute of conversation costs **₹4.30**.

| Scenario | Minutes | USD | INR |
|---|---|---|---|
| Light | 780 | $39 | ₹3,354 |
| **Typical** | **1,560** | **$78** | **₹6,708** |
| Heavy | 2,600 | $130 | ₹11,180 |

### 5.2 Fixed cost per clinic (at 10 clinics)

| Item | Monthly | Per clinic |
|---|---|---|
| Vapi platform (Core + orgs) | ₹11,094 | ₹1,109 |
| Twilio number | ₹2,500 | ₹250 |
| **Total** | **₹13,594** | **₹1,359** |

### 5.3 Fully-loaded cost per clinic

This is the number every price decision must clear.

| Scenario | Vapi usage | Fixed | **Total cost** |
|---|---|---|---|
| Light | ₹3,354 | ₹1,359 | **₹4,713** |
| **Typical** | ₹6,708 | ₹1,359 | **₹8,067** |
| Heavy | ₹11,180 | ₹1,359 | **₹12,539** |

### 5.4 Break-even

> **Break-even price per clinic = ₹8,500/month.**

Any plan priced below this loses money on a typical clinic. The current ₹1,499 and ₹3,999 plans are **2.7× to 5.7× below break-even.**

---

## 6. Recommended pricing

Because cost is driven by minutes, pricing must be **metered**. A flat monthly fee is silently subsidised by heavy users until one of them uses 3,000 minutes and the margin inverts.

| Plan | Price | Included minutes | Overage rate | Intended for |
|---|---|---|---|---|
| **Starter** | **₹7,999/mo** | 600 | ₹7/min | Solo practitioner, single chair |
| **Clinic** *(featured)* | **₹14,999/mo** | 1,500 | ₹6/min | 2–5 doctors, multi-chair clinic |
| **Group** | **₹44,999/mo** | 5,000 | ₹6/min | Multi-location practices and hospital groups |

**Every overage rate is set above the ₹4.30/min direct cost** — that is the structural guarantee that heavy users cannot invert the margin.

### 6.1 Margin at typical usage (1,560 min/clinic)

| Plan | Revenue | Cost | Gross margin |
|---|---|---|---|
| Starter | ₹7,999 + (960 × ₹7) = **₹14,719** | ₹7,094 | **52%** |
| Clinic | ₹14,999 + (60 × ₹6) = **₹15,359** | ₹7,094 | **54%** |
| Group *(3 clinics pooled)* | **₹44,999** | ₹21,282 | **53%** |

### 6.2 Why these numbers

- **~53% gross margin at typical usage** covers payment gateway fees (~2%), support time, infrastructure, and still leaves operating profit.
- **Overage above ₹4.30/min** is non-negotiable. At ₹4/min the margin on every overage minute is zero.
- **Starter's 600 minutes** covers roughly 10 three-minute calls across a 20-day month — a genuine solo-practitioner workload, not a token allowance.
- **Clinic's 1,500 minutes** sits just under typical usage, so the common case pays close to list and heavier days earn overage rather than being blocked.
- **Group pools minutes** across locations, which suits multi-site groups where one branch is quiet.

### 6.3 Fair-use caps are mandatory

Uncapped metered pricing has a tail risk: a Group customer running 12,000 minutes/month would drop the margin to **34%**.

- Apply a **monthly soft cap** per plan, with notification at 80% and 100%.
- Set a **hard ceiling** above which usage requires a custom plan.
- Consider **annual plans with a discount** to improve cash flow and reduce churn — but only after the metered rate is stable.

---

## 7. The Vapi rate negotiation — highest-leverage action

At $0.05/min, Vapi usage is **~68% of the fully-loaded cost** of a typical clinic (₹6,708 of ₹8,067).

**The gap worth attacking:** named components cost $0.0033/min; the blended charge is $0.05/min. The difference is platform margin.

**Ask: $0.035/min.**

| | At $0.05/min | At $0.035/min |
|---|---|---|
| Cost per clinic (typical) | ₹8,067 | **₹6,958** |
| Margin on Clinic plan | 54% | **61%** |
| Monthly cost across 10 clinics | ₹80,674 | ₹60,574 |
| **Monthly saving** | — | **₹20,120** |

**Why the ask is reasonable:** at ten clinics, monthly Vapi usage is roughly **$780**. That is a real, recurring, growing account. $20,100/month — about ₹2.4 lakh/year — is a modest discount against a visible, committed volume.

**Levers if Vapi declines:** move to the "Cost Saver" model preset shown in the assistant panel; shorten call handling to reduce billed minutes; revisit annually once usage is proven.

---

## 8. Ten-clinic P&L shape

At ten clinics on the Clinic plan:

| Line | Amount |
|---|---|
| Revenue (10 × ₹14,999) | **₹1,49,990** |
| Vapi usage (10 × ₹6,708) | ₹67,080 |
| Vapi platform (Core + orgs) | ₹11,094 |
| Twilio (10 numbers) | ₹2,500 |
| **Total COGS** | **₹80,674** |
| **Gross profit** | **₹69,316 (46%)** |
| Infrastructure, email, database, domain (est.) | ~₹8,000 |
| **Net before salaries** | **~₹61,300/month** |

A viable small business — roughly **₹7.4 lakh/year** gross profit — but not yet a venture-scale one. Margin improves to ~55% and absolute profit scales with volume past this point, so thirty to fifty clinics is the realistic target.

---

## 9. Open items to verify before publishing

1. **Live Vapi invoice** — confirm the $0.05/min blended rate and whether components are billed separately.
2. **Rate negotiation outcome** — the entire model shifts if it succeeds.
3. **Seven-day operation** — if clinics run Sunday too, multiply all minute figures by ~1.15.
4. **Payment gateway fees** — Razorpay/Stripe in India; confirm the exact percentage before finalising margin claims.
5. **Trial cost** — a 14-day free trial at typical usage costs ~₹3,354/clinic in Vapi time. Decide whether trials are card-up-front or capped.
6. **Growth assumption for orgs** — the ₹20/org add-on scales linearly with clinic count.

---

## 10. Summary of decisions required

| # | Decision | Recommendation |
|---|---|---|
| 1 | Vapi organization strategy | **10 separate orgs** — data isolation is a promise already made to customers |
| 2 | Vapi rate negotiation | **Target $0.035/min** — saves ₹20,120/month at ten clinics |
| 3 | Pricing structure | **Metered with overage** — flat ₹3,999 is never sustainable |
| 4 | Retain Vapi numbers or Twilio? | **Twilio** — Vapi caps at 5 on Core |
| 5 | Data retention add-on | **Do not buy** — ₹83,000/month for 30 extra days is indefensible |
