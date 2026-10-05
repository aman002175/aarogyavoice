#  Pricing Strategy & Execution Plan

## 1. Unit Economics (Per Clinic / Month)
Based on realistic usage of **2,000 minutes/month** (approx. 30 calls/day).

| Component | Cost per Minute (INR) | Monthly Cost (INR) |
| :--- | :--- | :--- |
| Twilio Telephony | ₹0.96 | ₹1,920 |
| Deepgram STT | ₹0.41 | ₹820 |
| Groq LLM | ₹0.05 | ₹100 |
| Kokoro TTS | ₹0.00 | ₹0 |
| Twilio Number Rent | Fixed | ₹110 |
| Railway Hosting (Shared) | Fixed | ₹100 |
| **TOTAL COST** | **~₹1.42 / min** | **~₹3,050 / month** |

## 2. SaaS Pricing Model (What Doctors Pay)
Do not sell "minutes". Sell "Peace of Mind".

- **One-Time Setup Fee:** **₹2,999** (Covers Twilio number, onboarding, prompt tuning).
- **Monthly Subscription:** **₹7,999 / month** (Includes up to 2,500 minutes).
- **Overage Charge:** **₹3.50 / extra minute** (Ensures high margin on heavy users).

**Profit Margin per Clinic:** ₹7,999 (Revenue) - ₹3,050 (Cost) = **₹4,949 / month (61% Margin)**.

## 3. 30-Day Execution Plan

### Phase 1: The "Trojan Horse" Pilot (Days 1-7)
- Find **1** local clinic (Dentist/Physio) in your network.
- Offer: *"14 days free trial. Zero risk. I will handle all setup."*
- Goal: Get real call data. Find out where the AI fails in Hinglish.

### Phase 2: Build & Refine (Days 8-15)
- Deploy the Pipecat stack on Railway.
- Refine the System Prompt based on pilot call logs.
- Ensure latency stays under 800ms.

### Phase 3: The First Paid Conversion (Days 16-30)
- Show the doctor the data: *"We handled 45 calls, booked 12 appointments. Zero missed calls."*
- Pitch the ₹7,999/month plan.
- Use the first paid revenue to fund Twilio costs for the next 3 clinics.

## 4. Competitive Moat
Code is a commodity. Your moat is **Workflow Integration**.
- Competitors give doctors a complex dashboard.
- You will send a simple WhatsApp message to the doctor: *"Rahul Sharma booked for 4 PM. New patient. Collect ₹100."*
- Win the UX, win the market.
