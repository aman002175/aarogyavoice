# 🏗️ System Architecture: AI Voice Receptionist

## 1. High-Level Overview
Ye system ek multi-tenant SaaS hai jo clinics ke liye 24/7 AI voice receptionist provide karta hai. System ko do alag parts mein divide kiya gaya hai taaki latency aur scalability maintain rahe.

- **Web Application (Next.js on Vercel):** Doctor dashboard, admin panel, aur REST APIs.
- **Voice Pipeline (Python/Pipecat on Railway):** Real-time WebSocket audio processing. Vercel yahan use nahi hoga kyunki wo long-running WebSocket connections ko timeout kar deta hai.

## 2. Component Breakdown

### A. Telephony Layer (Twilio)
- **Role:** Call routing aur Media Streams.
- **Flow:** Patient call karta hai -> Twilio number receive karta hai -> Twilio `<Connect><Stream>` TwiML use karke audio chunks ko WebSocket (`wss://your-app.railway.app/call`) par bhejta hai.

### B. Voice Processing Pipeline (Pipecat on Railway)
- **Role:** Real-time audio-to-audio conversion.
- **Components:**
  - **Transport:** Twilio WebSocket handler.
  - **STT (Speech-to-Text):** Deepgram Nova-2 (Hinglish optimized).
  - **LLM (Brain):** Groq API (Llama 3 70B) with Tool Calling.
  - **TTS (Text-to-Speech):** Kokoro (Self-hosted locally on Railway).
- **Latency Target:** < 800ms end-to-end.

### C. Application Backend (Next.js API Routes on Vercel)
- **Role:** Business logic aur Database operations.
- **Flow:** Pipecat pipeline LLM tool calling ke through Next.js API ko hit karti hai (`/api/check-patient`, `/api/book-appointment`). Next.js MongoDB se data fetch karke Pipecat ko JSON return karta hai.

### D. Database (MongoDB Atlas)
- **Role:** Multi-tenant data storage (Clinics, Patients, Appointments).

## 3. Real-Time Call Flow
1. **Inbound Call:** Twilio receives call -> Opens WebSocket to Railway.
2. **Greeting:** Pipecat plays initial TTS greeting.
3. **Listening:** Deepgram transcribes patient speech to text.
4. **Reasoning:** Groq LLM analyzes text. If patient gives phone number, LLM triggers `check_patient` tool.
5. **Tool Execution:** Pipecat sends HTTP POST to Vercel (`/api/check-patient`). Vercel queries MongoDB.
6. **Context Injection:** Vercel returns `{ is_new: true, fee: 100 }`. LLM generates response: "Nayi file ke liye ₹100 lagenge."
7. **Response:** Kokoro TTS converts text to audio -> Sent back to Twilio via WebSocket.
