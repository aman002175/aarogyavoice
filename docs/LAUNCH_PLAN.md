# Aarogya Voice — Go-To-Market & Launch Plan (First 10 Clinics)

> **Status:** Internal planning document. Not customer-facing.
> **Scope:** Getting from zero paying customers to a stable base of ten clinics that are profitable to serve.
> **Companion document:** [`PRICING_MODEL.md`](./PRICING_MODEL.md) — contains the cost analysis these numbers depend on.

---

## 1. The goal

Ten paying clinics, retained for ninety days, at a blended price that holds gross margin above 50%.

This is deliberately small. The economics only work when volume exists, but ten clinics is also the smallest number where the per-clinic fixed cost (Vapi organizations, Twilio numbers) has already been proven. The point of the first ten is not revenue — it is **learning whether a clinic renews**, and the answer to that determines whether the business scales.

### Definition of success at month 3

| Metric | Target |
|---|---|
| Paying clinics | 10 |
| Gross margin | > 50% |
| Average revenue per clinic | ₹14,000+/month |
| Churn in first 90 days | 0 |
| Median onboarding time | < 48 hours |
| Calls handled per clinic per day | 10–20 |
| Missed-call rate (clinic's perspective) | Effectively 0 |

---

## 2. Who the first ten are

Not "any clinic." The first ten must be clinics where the volume assumption holds and the owner is reachable.

### Target profile

| Attribute | Target |
|---|---|
| Specialty | Dental, physiotherapy, dermatology, ophthalmology |
| Size | 1–3 chairs, 1–3 doctors |
| Location | Tier 1 or strong Tier 2 city |
| Existing reception | Owner or family member doubles as receptionist |
| Pain | Owner misses calls while treating a patient |
| Volume | 10–20 calls/day |

**Why these specialties:** appointment-driven, high no-show rate, phone is the primary booking channel, and the owner is usually the decision-maker. Avoid multi-specialty hospitals for the first ten — procurement runs through an admin, and the sales cycle triples.

### Where to find them

| Channel | Why it works | Expected per month |
|---|---|---|
| **Warm intros from the first clinic** | Highest conversion by far; clinics talk to other clinics | 2–3 |
| **Local dental/physio associations** | Member directories, WhatsApp groups, monthly meets | 1–2 |
| **Neighbourhood clinics, in person** | Owner is usually on the floor; 10-minute demo closes | 2–3 |
| **Instagram / Google Maps** | Clinics with weak Google presence and a phone number are ideal | 1–2 |
| **Referring pharmacists, labs, eyewear shops** | Adjacent businesses see the same patients | 1–2 |

**Target: 5 clinics in month 1, 5 in month 2.**

### What to avoid for now

- Chains and hospital groups — long procurement, no learning value at this stage
- Clinics that already run a proper reception desk — no pain, no urgency
- Any clinic asking for WhatsApp or CRM integration at the first meeting — that is a different product
- Free-pilot clinics. A pilot that never converts teaches nothing and costs real Vapi minutes.

---

## 3. Product readiness gates

Ten clinics cannot be onboarded until these are true. Each one is currently **not** implemented.

### Blocking — cannot sell without

- [ ] **Real authentication.** Sessions, not a redirect. Currently the auth form pushes to `/dashboard` after a timeout with no session; `/dashboard` is reachable by direct URL. Unshippable.
- [ ] **Live Vapi webhooks.** Bookings and queue changes must come from Vapi, not mock data.
- [ ] **Persistent storage.** Queue state currently resets on refresh; bookings would vanish.
- [ ] **Twilio number provisioning per clinic.** Manual today; must be automated or at least a repeatable documented process.
- [ ] **Per-clinic assistant configuration.** Clinic hours, speciality, slot rules — the things that make an AI receptionist sound like *their* receptionist.

### Required before onboarding clinic #6

- [ ] Appointment cancellation and rescheduling by voice
- [ ] Transfer to the on-call number when the AI cannot resolve a query
- [ ] SMS confirmation in the clinic's preferred language
- [ ] A clinic-visible record of every call, so the doctor can verify what was said
- [ ] Usage metering per clinic, so overage can be billed
- [ ] Failure alerting — if a clinic's number stops answering, someone must know within minutes

### Nice to have, after ten clinics

- [ ] WhatsApp confirmations
- [ ] Multi-chair slot rules
- [ ] Monthly usage and revenue reporting for the owner

> **Note on the demo:** the current landing page and dashboard are frontend-only with mock data. They are a credible *visual* demo and that is genuinely useful for the sales conversation. They must not be shown as though they are a working system, and the trial must not be sold as one.

---

## 4. The sales motion

### The pitch

Not "AI receptionist." Doctors have heard that phrase and it means something expensive and unreliable to them.

> *"Aapka phone 3 baje bhi uthega. Aaj 14 missed calls hain jo aapko pata bhi nahi — woh log kal dobara call karenge, tab tak unka time doosre clinic me chala gaya."*

That is the whole pitch. It leads with a pain they have already felt, not a feature they have to imagine.

### The demo sequence (in the clinic, 10 minutes)

1. **Call their number from your own phone.** Let it ring. This is the hook — nothing is on the other end at 8 AM or 11 PM.
2. **Place a real call through the live assistant.** Speak as a patient would: *"Namaste, appointment lena hai."* Let them hear their own clinic's greeting.
3. **Ask the queue position.** Shows it answers the question that a receptionist actually gets asked twenty times a day.
4. **Book a slot.** The moment of the demo.
5. **Show the dashboard on a laptop.** Tokens, queue, call log.
6. **Hand over the price and stop talking.** Clinic owners decide quickly when the demo has already made the argument.

### Objection handling

| Objection | Response |
|---|---|
| *"Patients will want a real person"* | Nobody reaches a human during clinic hours anyway. This catches the calls that currently go nowhere — and the ones that come at 11 PM. Patients are asking whether someone answers, not whether a person does. |
| *"AI will mis-book something"* | The AI states the time back and asks for confirmation before booking. You see every booking in the dashboard, and you can cancel any of them. |
| *"It will get the timings wrong"* | Your hours and slot rules are set once, by you. The AI does not decide them — it reads them. |
| *"What if it goes down?"* | Say plainly: it does not have human-grade fallback yet. Do not overpromise here — losing one clinic to a bad answer costs more than a cautious close. |
| *"₹15,000 is a lot"* | Against a missed appointment, this is the cost of three or four patients. A single recovered implant consultation pays for six months. |

### Pricing conversation

Lead with **₹14,999 (Clinic)**. Starter at ₹7,999 exists for solo practices — but a clinic with 10–20 calls/day should be on Clinic, and if they hesitate, they are usually a Starter fit, which is fine.

Do not lead with the ₹44,999 Group plan. It is on the page for credibility; it is not the first-ten motion.

**Set the expectation that pricing is metered.** This is more honest and it protects against the usage surprise that kills renewals.

---

## 5. Onboarding each clinic

Target: **under 48 hours** from signed to live.

| Step | Owner | Time |
|---|---|---|
| Collect clinic name, doctor name, speciality | Founder | 10 min |
| Collect clinic hours, slot duration, holidays | Founder | 10 min |
| Provision Twilio number | Founder | 10 min |
| Configure Vapi assistant for the clinic | Founder | 30 min |
| Wire number → assistant, test 5 calls | Founder | 20 min |
| Walk the doctor through the dashboard | Founder | 20 min |
| **Total** | | **~1.7 hours** |

Until step 3 is automated, this is the largest single bottleneck. Every clinic costs nearly two hours of founder time. At ten clinics that is seventeen hours. If the first ten succeed, automate provisioning before clinic eleven — otherwise onboarding will silently cap growth.

### First-week check-in

Call each clinic in week one. Three questions:

1. How many calls came in?
2. Did it ever surprise you?
3. Anything you wish it would say?

These answers are the raw material for prompt improvement across all clinics.

---

## 6. Retention — the actual business

A clinic that churns at month three returns you to zero, having already paid onboarding. Retention is not a later concern.

### The 90-day pattern

| Period | Action |
|---|---|
| Day 1 | Onboarding call, as above |
| Day 7 | Founder check-in, three questions |
| Day 30 | Usage report — calls handled, bookings made. This is the **retention moment**: a clinic that sees 90 handled calls is very unlikely to leave. |
| Day 60 | Ask for the day-30 report renewal. Begin renewal conversation. |
| Day 90 | Renewal. Expect 2–3 months' commitment in exchange for a rate. |

### Why the day-30 report matters

It converts an abstract subscription into a visible result. The doctor did not spend ₹15,000 to receive a service; they spent it to recover calls that were being lost. The report quantifies that.

Track: calls handled, bookings made, average wait quoted, peak hour.

### What causes churn

| Cause | Response |
|---|---|
| Assistant mis-booked something | Fix the prompt that week. This is the most damaging failure and it must be answered fast. |
| Volume too low to justify price | Move them to Starter rather than lose them. Retention at lower margin beats churn at zero. |
| Doctor or staff disliked it | Ask early. Some clinics want a human on the line; better to know at day 30. |
| Feature gap (WhatsApp, cancellation) | Log it. Do not promise dates. |

---

## 7. Financial shape at ten clinics

From [`PRICING_MODEL.md`](./PRICING_MODEL.md). Fully-loaded cost per clinic is **₹8,067/month** at typical usage — against a ₹14,999 price, that is the ₹6,932 of headroom per clinic before platform costs.

| Line | Monthly |
|---|---|
| Revenue (10 × ₹14,999) | ₹1,49,990 |
| Vapi usage (10 × ₹6,708) | ₹67,080 |
| Vapi platform — Core + 10 orgs | ₹11,094 |
| Twilio — 10 numbers | ₹2,500 |
| **Total COGS** | **₹80,674** |
| **Gross profit** | **₹69,316 (46%)** |
| Infrastructure, email, database, domain | ~₹8,000 |
| **Net before salaries** | **~₹61,300** |

Two things improve this materially and both are addressed in the pricing document:

- **Vapi rate negotiation to $0.035/min** — saves ₹20,120/month
- **Ten-org isolation** — costs ₹11,094/month, but is the right call

### Cash timing

- Vapi and Twilio bill in USD, monthly, in advance — **roughly ₹81,000 of COGS leaves the account before revenue arrives**, because customers typically pay at month end.
- With a 14-day trial and monthly billing, plan for **two months of runway** before revenue covers costs.
- **Collect payment up front each month**, not in arrears. It removes most of the cash gap.

---

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Vapi raises rates** | Medium | High | Negotiate now. Model remains viable at ~$0.065/min. Track usage monthly. |
| **Breaks on an Indian accent** | Medium | High | Test with 10 real clinics in the first month. Keep a human transfer path. |
| **A serious mis-booking** | Medium | **High** | Confirmation loop before booking. Call log. Same-day prompt fix. Insurance question answered *before* launch, not after. |
| **Clinic wants WhatsApp/CRM** | High | Low | Say it is on the roadmap. Do not build it for the first ten. |
| **Churn in month 3** | Medium | High | Day-30 usage report is the primary defence. |
| **Founder time is the bottleneck** | **High** | Medium | Automate number provisioning after clinic ten. |
| **Twilio provisioning delay** | Medium | Medium | Start provisioning during onboarding, not after the sale. |
| **Vapi platform outage** | Low | High | Communicated status. Callers hear a fallback message with the clinic's hours. |
| **Unitharded personal data** | Low | **High** | Per-clinic orgs. Log every booking. Written retention policy published in the FAQ before launch. |

---

## 9. First 90 days

### Month 1 — prove it works with five clinics

- [ ] Ship auth with real sessions
- [ ] Ship Vapi webhook integration — bookings and queue become real
- [ ] Ship persistent storage
- [ ] Provision Twilio numbers for five clinics
- [ ] Close five clinics, all on Clinic plan
- [ ] Negotiate Vapi rate
- [ ] Publish the pricing page honestly: metered, no fake numbers

### Month 2 — five more, and the pattern

- [ ] Onboard clinics 6–10
- [ ] Day-30 reports for clinics 1–5
- [ ] Log every objection verbatim — this becomes the sales script
- [ ] Automate Twilio number provisioning
- [ ] First renewals due

### Month 3 — decide whether to scale

- [ ] Ten clinics live and retained
- [ ] Gross margin above 50%
- [ ] Onboarding under 2 hours, ideally under 1
- [ ] Written decision: scale to thirty, or fix what is broken first

> **The real output of the first ten is a repeatable sales sentence and a prompt that does not embarrass anyone.** Everything else is arithmetic.

---

## 10. Not doing yet

Explicitly out of scope until after clinic ten. Writing these down prevents scope creep during the exact phase where founder time is the scarcest resource.

- Calendar integrations (Google Calendar, Practo)
- WhatsApp or SMS-first booking
- Payments or billing collection
- Multi-branch chains
- Insurance or claims
- A public marketing site — the first ten come from direct outreach
- Building a CRM

---

## 11. Decisions required

| # | Decision | Recommendation |
|---|---|---|
| 1 | Auth before launch | **Blocking.** Cannot onboard a clinic without it. |
| 2 | Ten Vapi orgs vs one | **Ten orgs.** Isolation is already a published promise. |
| 3 | Vapi rate negotiation | **$0.035/min target.** Saves ₹20,120/month at ten clinics. |
| 4 | Pricing structure | **Metered with overage.** Flat is never viable. |
| 5 | Collections | **Up front monthly,** to close the COGS-before-revenue gap. |
| 6 | Provisioning automation | **After clinic ten,** unless onboarding blocks a sale first. |
| 7 | Data residency | Indian clinics fall under **DPDP Act 2023**, not HIPAA. Publish the policy; do not buy the add-ons. |
