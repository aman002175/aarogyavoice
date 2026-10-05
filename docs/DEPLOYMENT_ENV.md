# 🚀 Deployment & Environment Variables Guide

> **One repo, two deployables.** Frontend → **Vercel** (repo root). Voice backend →
> **Railway** (recommended) or Render, with **Root Directory = `voice-agent/`**.
> Related: [voice-agent/README.md](../voice-agent/README.md) ·
> old Pipecat-era guide (superseded): [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 0. The golden rule (read first)

**Secrets sirf backend (voice-agent) par jaate hain.** Frontend me koi secret NAHI hai —
`NEXT_PUBLIC_*` variables browser bundle me compile hote hain, wo **public config** hai,
secret nahi. Isliye frontend env me sirf ek variable chahiye.

## 1. MongoDB Atlas (free M0, ~5 min)

1. mongodb.com/atlas → free **M0** cluster banao
2. **Database Access** → user + strong password
3. **Network Access** → `0.0.0.0/0` (Railway/Render IPs dynamic hote hain)
4. Connection string copy karo aur db name jodo → ye hi `MONGO_URI` hai (🔒):
   `mongodb+srv://user:pass@cluster.mongodb.net/aarogya`

## 2. Backend deploy — Railway (recommended)

1. railway.app → **New Project → Deploy from GitHub repo** → `amanbishnoi`
2. Service → **Settings → Root Directory = `voice-agent`** ← sabse important step
3. Start command: `npm start` (auto-detect bhi chalega)
4. Settings → Networking → **Generate Domain** → e.g. `https://xyz.up.railway.app`
5. **Variables** tab me ye daalo:

### Backend env variables (Railway → Variables)

| Variable | Type | Kahan se milega |
|---|---|---|
| `MONGO_URI` | 🔒 SECRET | Step 1.4 (Atlas connection string) |
| `TWILIO_ACCOUNT_SID` | 🔒 SECRET | console.twilio.com → Account Info (`AC…`) |
| `TWILIO_AUTH_TOKEN` | 🔒 SECRET | Twilio console → Account Info → Auth Token |
| `DEEPGRAM_API_KEY` | 🔒 SECRET | console.deepgram.com → API Keys |
| `GROQ_API_KEY` | 🔒 SECRET | console.groq.com → API Keys |
| `PUBLIC_BASE_URL` | public config | `https://xyz.up.railway.app` (step 2.4) |
| `PUBLIC_WS_URL` | public config | `wss://xyz.up.railway.app/media-stream` |
| `FRONTEND_URL` | public config | Vercel domain (step 3 ke baad) — CORS ke liye |
| `PORT` | auto | Railway khud inject karta hai (server.js reads it) |
| `GROQ_MODEL` | optional | default `llama-3-8b-8192`; deprecated error aaye to `llama-3.1-8b-instant` |
| `DEEPGRAM_STT_MODEL` | optional | default `nova-2` |
| `DEEPGRAM_LANGUAGE` | optional | default `multi` (Hinglish); `hi`/`en` pure |
| `DEEPGRAM_TTS_MODEL` | optional | default `aura-asteria-en` (⚠️ English — Hindi voice console me verify karo) |
| `TWILIO_SKIP_SIGNATURE_CHECK` | ❌ PROD ME KABHI NAHI | sirf local ngrok testing ke liye |

6. Deploy → verify: `GET https://xyz.up.railway.app/healthz` → `{"ok":true,...}`
7. Clinic seed: Railway shell (ya locally `MONGO_URI` set karke):
   `npm run seed -- +911140001234 "Clinic Name"`

## 3. Frontend deploy — Vercel

1. vercel.com → **Add New Project → Import** `amanbishnoi`
2. Framework auto-detect (Next.js), **Root Directory = repo root**, defaults rakho
3. Environment Variables:

### Frontend env variables (Vercel)

| Variable | Type | Value |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | public config (browser me visible — yahan SECRET kabhi na rakho) | `https://xyz.up.railway.app` |

> Bas. Frontend ko abhi koi secret nahi chahiye. Doctor auth aane par bhi
> `JWT_SECRET` jaisa secret **backend** par hoga, frontend par nahi.

4. ⚠️ `NEXT_PUBLIC_*` **build-time** inline hota hai — set karne ke **baad redeploy** zaroori
5. Deploy → dashboard kholo → queue header me **"Live"** badge dikhna chahiye

## 4. Twilio console

1. Testing: **trial credit** + apna phone number "Verified Caller IDs" me add karo
   (trial sirf verified numbers par call kar sakta hai)
2. Production: number **buy** karo — India ke liye regulatory bundle (KYC) lagega
3. Number → Voice Configuration → **"A call comes in"** → Webhook, **HTTP POST** →
   `https://xyz.up.railway.app/twilio/voice`

## 5. Order of operations (isi sequence me karo)

1. Atlas → `MONGO_URI` ready
2. Railway deploy → 5 secrets + `PUBLIC_BASE_URL`/`PUBLIC_WS_URL` → `healthz` green
3. Vercel deploy → domain note karo
4. Railway me `FRONTEND_URL` set → **redeploy**
5. Vercel me `NEXT_PUBLIC_BACKEND_URL` set → **redeploy**
6. Twilio webhook set → apne phone se call karo (trial)
7. Dashboard "Live" badge + queue instant-update confirm karo

## 6. Render alternative (Railway ki jagah)

- New → **Web Service** → repo → **Root Directory `voice-agent`**
- Build: `npm install` · Start: `npm start`
- Wahi env variables (upar wali table) · Render WebSockets support karta hai

## 7. Security checklist

- [ ] 5 secrets (`MONGO_URI`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `DEEPGRAM_API_KEY`, `GROQ_API_KEY`) sirf Railway Variables me — repo/.env/frontend me kabhi nahi
- [ ] `TWILIO_SKIP_SIGNATURE_CHECK` production me unset/false
- [ ] Mongo URI (password ke sath) kabhi git me commit na ho
- [ ] Key leak ho jaye to turant rotate karo (Twilio/Deepgram/Groq consoles)
- [ ] Freebuff preview ko Live dikhana ho to: **Settings → Environment** me `NEXT_PUBLIC_BACKEND_URL` add karo
