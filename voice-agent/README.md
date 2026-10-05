# voice-agent — Self-hosted Voice Orchestrator (replaces Vapi)

Node.js + Express + ws service that answers Twilio calls, runs the
STT → LLM → TTS loop in-process, books live tokens in MongoDB, and pushes
real-time updates to the Next.js dashboard over Socket.io.

```
Patient calls clinic number
        ↓
POST /twilio/voice   (Twilio webhook — clinic resolved from `To` number)
        ↓  TwiML: <Connect><Stream url="wss://…/media-stream">
WS  /media-stream   (Twilio Media Streams, base64 mulaw 8000Hz)
        ├─ Deepgram Nova-2  (STT, WebSocket, mulaw 8000 in)
        ├─ Groq llama-3     (JSON action, live token context injected each turn)
        ├─ MongoDB          (atomic $inc token assignment, Patient + Appointment)
        └─ Deepgram Aura    (TTS, WebSocket, mulaw 8000 out → back to Twilio)
        ↓
Socket.io  "token:booked" / "token:advanced"  →  Next.js dashboard (Vercel)
```

Security model: the tenant is resolved **server-side** from the Twilio `To`
number; the webhook is signature-validated (`X-Twilio-Signature`, HMAC-SHA1);
the LLM never supplies a `clinic_id` and never picks the final token number —
the server's atomic counter is the only source of truth.

## Quickstart

```bash
cd voice-agent
cp env.example .env        # fill in the keys (never commit .env)
npm install
npm run seed -- +911140001234 "Clinic Name"   # create the clinic row your Twilio number resolves to
npm run dev                # node --watch server.js
```

Required env vars: `MONGO_URI`, `DEEPGRAM_API_KEY`, `GROQ_API_KEY`,
`TWILIO_AUTH_TOKEN`, `PUBLIC_BASE_URL`, `PUBLIC_WS_URL` (see `env.example`).

## Twilio console setup

1. Buy a number (Phone Numbers → Manage → Active numbers).
2. Voice Configuration → **"A call comes in"** → Webhook:
   `https://<your-domain>/twilio/voice` — HTTP **POST**.
3. Nothing else to configure: the webhook returns this TwiML, which moves the
   call's audio onto the WebSocket (this was the piece DEPLOYMENT_GUIDE.md was
   missing):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://<your-domain>/media-stream">
      <Parameter name="clinicId" value="<clinic._id>"/>
      <Parameter name="callerPhone" value="<caller E.164>"/>
    </Stream>
  </Connect>
</Response>
```

## REST + realtime API (frontend contract)

| Endpoint | Method | Purpose |
|---|---|---|
| `/twilio/voice` | POST | Twilio webhook → TwiML `<Connect><Stream>` |
| `/media-stream` | WS | Twilio Media Streams audio loop |
| `/api/clinic/next-token` | POST `{clinicId}` | "Next Patient" — atomic advance + `token:advanced` emit |
| `/api/clinic/:id/state` | GET | Initial dashboard hydration |
| `/socket.io/` | WS | Rooms `clinic:<id>`; events `token:booked`, `token:advanced` |

Socket.io client (Next.js): `io(BACKEND_URL, { auth: { clinicId } })`, then
listen for `token:booked` / `token:advanced`.

## Deploy (Railway / Koyeb)

- Set the service **root directory to `voice-agent/`** (it has its own
  `package.json`); start command `node server.js`, or `npm start`.
- Koyeb: use a Dockerfile or Buildpack with the same root directory.
- Set `PUBLIC_BASE_URL` / `PUBLIC_WS_URL` to the deployed domain — signature
  validation and the TwiML both depend on it.
- Same repo for now ("polyrepo-ready"): the folder is self-contained and can be
  split into its own repository later without frontend changes.

## Honest open items

- **Aura Hindi voice:** verify in the Deepgram console which Aura voices cover
  Hindi before launch; `aura-asteria-en` (default) is English. If Hindi TTS is
  not available, that is a launch blocker to solve (alternative TTS +
  resampling to mulaw 8kHz).
- **Groq model:** spec says `llama-3-8b-8192`; if Groq deprecates it,
  `llama-3.1-8b-instant` is the drop-in.
- **Auth:** `/api/clinic/next-token` and Socket.io rooms need JWT checks before
  anything public.
- **Barge-in** (patient interrupting TTS) and per-turn mark tracking are not
  implemented yet.
- **Daily token reset:** `last_assigned_token` / `current_running_token` need a
  day-rollover job (reset to 0 at clinic open time).
- **Billing reality:** Twilio Media Streams bills $0.0044/min on top of the
  inbound per-minute rate — it applies to this architecture exactly as it did
  to the Vapi plan (see docs/DOCS_AUDIT_AND_CHALLENGES.md).
