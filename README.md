# 🏥 AI Receptionist for Doctors

> **Intelligent 24/7 Voice Assistant for Clinics** — Automatic appointment booking, patient queuing, and clinic management without calendars.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)
![React](https://img.shields.io/badge/React-Next.js-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🎯 What is AI Receptionist?

A **SaaS platform** that replaces traditional clinic receptionists with an intelligent voice AI. Patients call a dedicated number, the AI:
- ✅ Answers instantly (24/7)
- ✅ Tells real-time appointment status
- ✅ Books a token in the live queue
- ✅ Handles clinic closures and leave automatically

**Perfect for:** Dentists, Dermatologists, Physiotherapists, and Independent Healthcare Practitioners.

---

## 🚀 Quick Overview

### For Patients
```
Patient calls → AI Receptionist answers
                ↓
            "Current token is 5, wait time ~30 mins"
                ↓
            "Book appointment? [Yes/No]"
```

### For Doctors
- ✨ One-click web dashboard
- 📊 Live patient queue display
- ⏭️ Simple "Next Patient" button
- 🔔 Automatic plan expiry alerts
- 🗓️ Zero calendar complexity

### For Super Admin
- 👥 Clinic & doctor management
- 📞 Phone number allocation
- 💰 Plan & billing tracking
- 📈 Usage analytics

---

## 📊 System Architecture

```
Patient calls clinic number
     ↓
Twilio Media Streams  (webhook: POST /twilio/voice → TwiML <Connect><Stream>)
     ↓  WebSocket, mulaw 8000Hz
voice-agent (Node.js + Express + ws on Railway/Koyeb)
     ├─ Deepgram Nova-2 (STT, WebSocket)
     ├─ Groq Llama-3 (JSON actions, live token context injected per turn)
     ├─ Deepgram Aura (TTS, mulaw 8000Hz)
     └─ MongoDB (clinics, patients, appointments, live tokens)
     ↓
Socket.io events → Doctor Dashboard / Queue Display (instant UI updates)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14+, React, Tailwind CSS, WebSocket for real-time updates |
| **Backend** | Node.js + Express + ws (`voice-agent/` on Railway/Koyeb) + Socket.io |
| **Database** | MongoDB (Mongoose ODM) |
| **Voice AI** | Twilio Media Streams + Deepgram Nova-2 (STT) + Deepgram Aura (TTS) + Groq Llama-3 |
| **Auth** | JWT (Doctor) + Admin Secret Key (Super Admin) |
| **Hosting** | Vercel (Frontend), Node.js Server (Backend) |

---

## 🗄️ Database Schema (MongoDB)

### Clinics Collection
```javascript
{
  _id: ObjectId,
  doctor_name: String,
  clinic_name: String,
  email: String,
  password_hash: String,
  twilio_number: String,            // E.164 — the multi-tenant key (resolved from Twilio `To`)
  number_status: "PENDING" | "ACTIVE" | "SUSPENDED",
  plan_status: "TRIAL" | "ACTIVE" | "EXPIRED",
  plan_expires_at: Date,
  config: {
    start_time: "09:00",    // HH:MM format
    end_time: "17:00",
    slot_duration: 15       // minutes
  },
  is_on_holiday: Boolean,
  current_running_token: Number,   // token being served now
  last_assigned_token: Number      // last token handed out (atomic $inc)
  created_at: Date
}
```

### Appointments Collection
```javascript
{
  _id: ObjectId,
  clinic_id: ObjectId,       // Foreign key - data isolation
  patient_name: String,
  patient_phone: String,
  token_number: Number,      // Sequential: 1, 2, 3...
  day: "today" | "tomorrow",       // dynamic token queue — no fixed time slots
  status: "WAITING" | "COMPLETED" | "CANCELLED",
  notes: String,
  created_at: Date
}
```

---

## 🔑 Key Features

### ✅ Phase 1: Landing Page + Core Setup
- [x] Professional landing page (coming soon)
- [x] MongoDB schema & collections
- [x] Doctor authentication (signup/login)
- [x] Basic admin panel structure
- [ ] Phone number assignment flow

### ⏭️ Phase 2: AI Voice Integration
- [ ] Twilio Media Streams + Deepgram + Groq pipeline (boilerplate in `voice-agent/`)
- [ ] Voice bot script & conversation flow
- [ ] Real-time appointment creation via voice
- [ ] Twilio SMS notifications

### 🔮 Phase 3: Advanced Features
- [ ] Analytics dashboard
- [ ] Multi-language voice support
- [ ] Payment gateway integration
- [ ] Clinic analytics & reports

---

## 📋 API Endpoints (Overview)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/doctor-signup` | POST | Doctor registration |
| `/api/auth/doctor-login` | POST | Doctor login |
| `/api/doctor/dashboard` | GET | Get clinic status & queue |
| `/api/doctor/next-patient` | POST | Increment current token |
| `/api/doctor/toggle-status` | POST | Open/Close clinic |
| `/api/admin/assign-number` | POST | Assign phone to clinic |
| `/twilio/voice` | POST | Twilio webhook — TwiML `<Connect><Stream>` |
| `/media-stream` | WS | Twilio Media Streams (STT → LLM → TTS loop) |
| `/api/clinic/next-token` | POST | Advance the live token queue |
| `/socket.io/` | WS | Real-time queue events to the dashboard |
| `/api/appointments/today` | GET | Today's appointments |

---

## 🔒 Security Features

- **Multi-Tenancy:** Strict clinic data isolation via `clinic_id`
- **JWT Auth:** Doctor authentication with secure tokens
- **Plan Verification:** Automatic call rejection for expired plans
- **Rate Limiting:** API protection against abuse
- **Data Encryption:** Passwords hashed with bcrypt

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/aman002175/amanbishnoi.git
   cd amanbishnoi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Server runs at `http://localhost:3000`

### Environment Variables Template
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_SECRET_KEY=super_admin_password_12345

# Voice pipeline (voice-agent/)
TWILIO_AUTH_TOKEN=your_twilio_auth_token
DEEPGRAM_API_KEY=your_deepgram_key
GROQ_API_KEY=your_groq_key

# App
NODE_ENV=development
NEXTAUTH_SECRET=your_nextauth_secret

# Frontend → voice-agent (set on Vercel / preview env)
NEXT_PUBLIC_BACKEND_URL=https://your-voice-agent.up.railway.app
```

---

## 📚 Documentation

### Current architecture (self-hosted voice pipeline)

- **[DOCS_AUDIT_AND_CHALLENGES.md](./docs/DOCS_AUDIT_AND_CHALLENGES.md)** — ⚠️ **Read first.** Review of every doc: cost errors, security bugs, and contradictions
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Original Pipecat-era design *(superseded by `voice-agent/`)*
- **[DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)** — Railway deploy (Pipecat-era; use `voice-agent/README.md`)
- **[voice-agent/README.md](./voice-agent/README.md)** — ⭐ Live setup guide for the Node.js voice orchestrator
- **[PRICING_AND_BUSINESS.md](./docs/PRICING_AND_BUSINESS.md)** — Pricing strategy and 30-day plan *(cost inputs unverified — see audit)*
- **[DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** — MongoDB collections for clinics, patients, appointments
- **[VOICE_AGENT_PROMPT.md](./docs/VOICE_AGENT_PROMPT.md)** — System prompt and tool definitions

### Planning

- **[LAUNCH_PLAN.md](./docs/LAUNCH_PLAN.md)** — Go-to-market plan for the first 10 clinics
- **[PRICING_MODEL.md](./docs/PRICING_MODEL.md)** — Prior Vapi-based cost analysis *(superseded)*

### Archived (Vapi.ai era)

- **[docs/archive/VAPI_SETUP.md](./docs/archive/VAPI_SETUP.md)** and **[docs/archive/ACCOUNT_SETUP_GUIDE.md](./docs/archive/ACCOUNT_SETUP_GUIDE.md)** — dropped with the Vapi stack; kept for reference only

> ⚠️ **Status:** `voice-agent/` holds the Node.js orchestrator **boilerplate**, and the Next.js dashboard auto-falls back to demo data until `NEXT_PUBLIC_BACKEND_URL` points at a deployed voice-agent. No keys are wired and no calls have flowed yet.

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open Pull Request

---

## 📞 Support

- 📧 Email: support@aireceptionist.io
- 💬 Discord: [Join Community](https://discord.gg/)
- 📖 Docs: [Full Documentation](https://docs.aireceptionist.io)

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with Next.js, Node.js, Twilio, Deepgram, Groq, and MongoDB
- Inspired by modern clinic management systems
- Made for Indian healthcare practitioners

---

<div align="center">

**[⭐ Star this repo](https://github.com/aman002175/amanbishnoi)** if you find it helpful!

Made with ❤️ by Aman Bishnoi

</div>
