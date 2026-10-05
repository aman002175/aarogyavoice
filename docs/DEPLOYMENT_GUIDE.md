# 🚀 Deployment Guide: Pipecat Voice Pipeline on Railway

> ⚠️ **SUPERSEDED (Oct 2026).** This guide targets the Python/Pipecat pipeline, is missing the Twilio TwiML step entirely, and uses a `/call` path that was never implemented. The voice service is now the Node.js **`voice-agent/`** (Twilio Media Streams + Deepgram + Groq on Railway/Koyeb). Follow **[voice-agent/README.md](../voice-agent/README.md)** instead.

## 1. Prerequisites
- GitHub Account
- Railway.app Account (Free trial available, then $5/mo)
- Twilio Account
- Deepgram API Key
- Groq API Key

## 2. Railway.app Setup (Backend Hosting)
1. Go to [Railway.app](https://railway.app) and create a new project.
2. Select **"Deploy from GitHub repo"** and connect your `amanbishnoi` repository.
3. Railway will auto-detect the Python/Pipecat service (ensure your Pipecat code is in a specific folder like `/voice-agent` and has a `requirements.txt`).
4. **Crucial:** In Railway settings, set the **Start Command** to: `python main.py` (or whatever your Pipecat entry file is).
5. Go to the **Networking** tab in Railway and generate a public domain (e.g., `your-app.up.railway.app`).

## 3. Twilio Media Streams Configuration
1. Buy a phone number in Twilio Console.
2. Go to **Phone Numbers** -> **Manage** -> **Active Numbers**.
3. Scroll to **Voice Configuration**.
4. Set "A call comes in" to **Webhook**.
5. Enter the URL: `https://your-app.up.railway.app/call` (Replace with your actual Railway URL).
6. Set HTTP method to **HTTP POST**.
7. Save.

## 4. Environment Variables (Railway)
Add these in the Railway "Variables" tab:
```env
DEEPGRAM_API_KEY=your_deepgram_key
GROQ_API_KEY=your_groq_key
NEXTJS_BACKEND_URL=https://your-nextjs-app.vercel.app
TWILIO_AUTH_TOKEN=your_twilio_token
```

## 5. Testing the Pipeline
1. Deploy the code to GitHub. Railway will auto-deploy.
2. Check Railway logs to ensure the WebSocket server is listening on port 8000 (or your defined port).
3. Call your Twilio number from your mobile.
4. If you hear the AI greeting, the pipeline is live.
