/**
 * Aarogya Voice — self-hosted voice AI orchestrator ("voice-agent").
 *
 * Replaces Vapi.ai. One long-running Node.js process that:
 *   1. Answers Twilio's webhook with TwiML that hands the call to a Media Stream.
 *   2. Receives patient audio (mulaw 8000Hz) over WebSocket and streams it to
 *      Deepgram Nova-2 (STT, also over WebSocket).
 *   3. Injects LIVE clinic state (MongoDB) into a Groq llama-3 system prompt
 *      on every turn (dynamic context injection — current token, next token,
 *      wait estimate, holiday flag).
 *   4. Parses the LLM's JSON action (e.g. {"action":"book_token", ...}).
 *   5. Assigns the REAL token server-side with an atomic $inc (the LLM never
 *      gets to pick the token number — that would race), persists Patient +
 *      Appointment, and emits Socket.io events to the Next.js dashboard.
 *   6. Speaks replies through Deepgram Aura (TTS over WebSocket, mulaw 8000Hz
 *      back into the Twilio media stream).
 *
 * Multi-tenancy rule (security): the clinic is ALWAYS resolved server-side —
 * from the Twilio `To` number in the webhook, then carried into the stream as
 * a custom parameter. The LLM is never trusted to supply a clinic_id.
 *
 * Run: see env.example, then `node server.js`.
 */

require("dotenv").config();

const http = require("http");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server: SocketServer } = require("socket.io");
const { WebSocket, WebSocketServer } = require("ws");

const { Clinic, Patient, Appointment } = require("./models");

// ---------------------------------------------------------------------------
// Boot-time config validation
// ---------------------------------------------------------------------------

const REQUIRED_ENV = [
  "MONGO_URI",
  "DEEPGRAM_API_KEY",
  "GROQ_API_KEY",
  "TWILIO_AUTH_TOKEN",
  "PUBLIC_BASE_URL",
  "PUBLIC_WS_URL",
];
function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `[voice-agent] Missing required env vars: ${missing.join(", ")} — see voice-agent/env.example`
    );
    process.exit(1);
  }
}

const PORT = process.env.PORT || 8080;
const STT_MODEL = process.env.DEEPGRAM_STT_MODEL || "nova-2";
const STT_LANGUAGE = process.env.DEEPGRAM_LANGUAGE || "multi";
const TTS_MODEL = process.env.DEEPGRAM_TTS_MODEL || "aura-asteria-en";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3-8b-8192";

const log = {
  info: (...args) => console.log(`[voice-agent ${new Date().toISOString()}]`, ...args),
  error: (...args) => console.error(`[voice-agent ${new Date().toISOString()}]`, ...args),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize a phone to loose E.164 ("tel:+91140...", "0114..." -> keep digits + leading +). */
function normalizePhone(raw) {
  if (!raw) return "";
  const trimmed = String(raw).replace(/^tel:/i, "").replace(/[\s()-]/g, "");
  return trimmed.startsWith("+") ? "+" + trimmed.slice(1).replace(/\D/g, "") : trimmed.replace(/\D/g, "");
}

/** Canonical payload Twilio signs: URL + params sorted by key, concatenated. */
function twilioSignaturePayload(url, params) {
  return Object.keys(params || {})
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
}

/**
 * Validate Twilio's X-Twilio-Signature header (HMAC-SHA1 over the full URL +
 * alphabetically-sorted POST params). The old Vapi HMAC snippet in the docs
 * never existed; Twilio's real signature scheme is what must be enforced here.
 */
function isTwilioRequestValid(req) {
  if (process.env.TWILIO_SKIP_SIGNATURE_CHECK === "true") {
    log.error("TWILIO_SKIP_SIGNATURE_CHECK is enabled — dev only, never ship this way");
    return true;
  }
  const signature = req.headers["x-twilio-signature"];
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!signature || !authToken) return false;
  const url = `${process.env.PUBLIC_BASE_URL.replace(/\/+$/, "")}/twilio/voice`;
  const data = twilioSignaturePayload(url, req.body || {});
  const expected = crypto
    .createHmac("sha1", authToken)
    .update(Buffer.from(data, "utf8"))
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const sayTwiml = (text) =>
  `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="hi-IN">${text}</Say><Hangup/></Response>`;

function serializeClinic(c) {
  return {
    id: c._id,
    clinicName: c.clinic_name,
    doctorName: c.doctor_name,
    twilioNumber: c.twilio_number,
    isOnHoliday: c.is_on_holiday,
    currentRunningToken: c.current_running_token,
    lastAssignedToken: c.last_assigned_token,
    avgMinutesPerToken: c.avg_minutes_per_token,
    newPatientFee: c.config?.new_patient_fee ?? 100,
  };
}

function estimateWaitMinutes(clinic, forToken) {
  const per = clinic.avg_minutes_per_token || 15;
  return Math.max(0, (forToken - (clinic.current_running_token || 0)) * per);
}

/** IST calendar date key ("YYYY-MM-DD"). India has no DST — fixed +05:30. */
function istDateKey(date) {
  return new Date(new Date(date).getTime() + 5.5 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Token counters are per-day. On the first touch of a new IST day, reset them
 * so yesterday's queue never leaks into today's. Idempotent; safe to call
 * from the webhook and the dashboard endpoints.
 */
async function ensureFreshDay(clinic) {
  const today = istDateKey(new Date());
  if (clinic.last_reset_date && istDateKey(clinic.last_reset_date) === today) {
    return clinic;
  }
  const updated = await Clinic.findOneAndUpdate(
    { _id: clinic._id },
    {
      $set: {
        current_running_token: 0,
        last_assigned_token: 0,
        last_served_token: 0,
        token_history: [],
        last_reset_date: new Date(),
      },
    },
    { new: true }
  );
  log.info(`clinic ${clinic._id}: new day (${today}) — token counters reset`);
  return updated || clinic;
}

/**
 * The dynamic system prompt. Rebuilt on EVERY LLM turn from a fresh Mongo read,
 * so wait estimates never go stale mid-call.
 */
function buildSystemPrompt(clinic, callerPhone) {
  const nextToken = (clinic.last_assigned_token || 0) + 1;
  const waitMinutes = estimateWaitMinutes(clinic, nextToken);
  const fee = clinic.config?.new_patient_fee ?? 100;
  const hours = `${clinic.config?.start_time || "09:00"} se ${clinic.config?.end_time || "17:00"}`;
  const status = clinic.is_on_holiday
    ? "AAJ CLINIC CHHUTTI PAR HAI (band hai)"
    : `Khula hai. Timings: ${hours}`;

  return `Tum "Priya" ho — ${clinic.clinic_name} (Doctor ${clinic.doctor_name}) ki AI receptionist. Natural, conversational Hinglish bolo (Hindi + English mix).

LIVE CLINIC STATE (server ne abhi inject kiya hai — hamesha isi ka use karo, apne pehle ke statements par bharosa mat karo):
- Clinic status: ${status}
- Current running token: ${clinic.current_running_token} (ye token abhi doctor ke paas hai)
- Last assigned token: ${clinic.last_assigned_token} (agla token ${nextToken} hoga)
- Estimated wait for token ${nextToken}: ~${waitMinutes} minute (${clinic.avg_minutes_per_token} min per token)
- Nayi file (parchi) fee: ₹${fee}
- Caller ka phone (Twilio se verified): ${callerPhone || "unknown"}

RULES:
1. Output sirf EK JSON object ho, koi extra text nahi. Schema:
   {"reply": "<jo patient ko bolna hai, Hinglish>", "action": "none" | "book_token" | "end_call", "patient_name": "<string ya null>", "phone": "<string ya null>", "day": "today" | "tomorrow"}
2. action "book_token" TABHI jab patient ne apna naam de diya ho aur confirm kar diya ho. Phone na mile to "phone": null chhodo — server caller-ID use karega.
3. Clinic chhutti par hai to pehle clearly batao ki aaj band hai, aur booking "day": "tomorrow" offer karo.
4. Tum sirf appointment/timings/info desk ho. Medical advice KABHI nahi: "Sir/Ma'am, main medical advice nahi de sakti, appointment book kar lete hain."
5. Chhote jawab do — ek-do line. Ye phone call hai. Jab relevant ho, live token/wait status use karo.
6. Token number TUM assign nahi karti — booking ke baad server final token bolega. Isliye kisi naye token number ka specific claim apni reply me mat karo.`;
}

/** Tolerant JSON parse: raw object, fenced/mixed text, or null. */
function parseLLMJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = String(raw).match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

/** Groq chat completion, forced into JSON mode. Returns a normalized action object. */
async function callGroq(systemPrompt, history, userText) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 220,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userText },
      ],
    }),
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`Groq API ${res.status}: ${body}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";
  const parsed = parseLLMJson(raw);
  if (!parsed || typeof parsed.reply !== "string") {
    // JSON mode can still fail on edge inputs; degrade gracefully to raw text.
    return { reply: raw.slice(0, 300) || "Ji, bataiye.", action: "none" };
  }
  return {
    reply: parsed.reply,
    action: parsed.action,
    patient_name: parsed.patient_name,
    phone: parsed.phone,
    day: parsed.day,
  };
}

/** End the Twilio call leg via the REST API (used for clean hangups). */
async function completeCall(callSid) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !callSid) return;
  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${callSid}.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ Status: "completed" }),
    });
  } catch (err) {
    log.error("completeCall failed:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Booking — the atomic, race-safe path
// ---------------------------------------------------------------------------

/**
 * Assign the next token with findOneAndUpdate({ $inc }) so two simultaneous
 * calls can never receive the same token. The LLM's suggested number (if any)
 * is intentionally ignored — the server's counter is the only source of truth.
 */
async function handleBookToken(session, clinicId, llm) {
  const phone = normalizePhone(llm.phone || session.callerPhone || "");
  if (!llm.patient_name || !phone) return null;

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) return null;

  const updated = await Clinic.findOneAndUpdate(
    { _id: clinic._id },
    { $inc: { last_assigned_token: 1 } },
    { new: true }
  );
  const token = updated.last_assigned_token;

  const existing = await Patient.findOne({ clinic_id: clinic._id, phone_number: phone });
  const patient = await Patient.findOneAndUpdate(
    { clinic_id: clinic._id, phone_number: phone },
    { $setOnInsert: { clinic_id: clinic._id, phone_number: phone, name: llm.patient_name } },
    { upsert: true, new: true }
  );

  const day = llm.day === "tomorrow" ? "tomorrow" : "today";
  await Appointment.create({
    clinic_id: clinic._id,
    patient_id: patient._id,
    token_number: token,
    day,
    status: "WAITING",
    fee_paid: false,
    booked_via: "ai_call",
    notes: existing ? undefined : "New patient — parchi fee at counter",
  });

  const waitMinutes = day === "today" ? estimateWaitMinutes(updated, token) : 0;
  const payload = {
    clinicId: clinic._id,
    tokenNumber: token,
    patientName: llm.patient_name,
    day,
    waitMinutes,
    lastAssignedToken: updated.last_assigned_token,
  };
  io.to(`clinic:${clinic._id}`).emit("token:booked", payload);

  return {
    ok: true,
    name: llm.patient_name,
    token,
    waitMinutes,
    day,
    isNewPatient: !existing,
    fee: updated.config?.new_patient_fee ?? 100,
  };
}

function bookingConfirmationText(r) {
  const waitStr =
    r.waitMinutes >= 60
      ? `${Math.floor(r.waitMinutes / 60)} ghante ${r.waitMinutes % 60} minute`
      : `${r.waitMinutes} minute`;
  const parchi = r.isNewPatient && r.fee > 0 ? ` Naya patient hain, isliye counter par ₹${r.fee} ki parchi lagegi.` : "";
  if (r.day === "tomorrow") {
    return `Ji ${r.name}, confirm — kal aapka token number ${r.token} ho gaya hai. Aap aayein, yahi number pukara jayega.${parchi} Dhanyavaad!`;
  }
  return `Ji ${r.name}, confirm — aapka token number ${r.token} ho gaya hai. Lagbhag ${waitStr} ka wait hai.${parchi} Dhanyavaad!`;
}

// ---------------------------------------------------------------------------
// Express app — webhook + REST API
// ---------------------------------------------------------------------------

const app = express();
app.use(express.urlencoded({ extended: false })); // Twilio webhooks POST form-encoded
app.use(express.json());
// CORS is exact-origin + credentials — never "*" — so the admin session
// cookie (SameSite=None) can only be sent by the known frontend origin.
const corsOrigin = (process.env.FRONTEND_URL || "").replace(/\/+$/, "") || false;
app.use(cors({ origin: corsOrigin, credentials: true, methods: ["GET", "POST"] }));

// Baseline hardening headers on every response.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.get("/healthz", (_req, res) => res.json({ ok: true, activeCalls: activeSessions.size }));

/**
 * Twilio incoming-call webhook. Resolves the tenant from the `To` number and
 * returns TwiML that connects the call to our Media Stream. NOTE: this is the
 * TwiML that DEPLOYMENT_GUIDE.md was missing — Twilio console only needs this
 * URL + HTTP POST; everything else happens here.
 */
app.post("/twilio/voice", async (req, res) => {
  try {
    if (!isTwilioRequestValid(req)) {
      return res.status(403).type("text/xml").send(sayTwiml("Unauthorized request."));
    }
    const to = normalizePhone(req.body.To);
    const from = normalizePhone(req.body.From);
    const callSid = req.body.CallSid || "";

    let clinic = await Clinic.findOne({ twilio_number: to, is_active: true });
    if (!clinic) {
      log.info(`call ${callSid}: no clinic owns ${to} — rejecting`);
      return res.type("text/xml").send(sayTwiml("Sorry, is number par abhi koi clinic active nahi hai."));
    }
    clinic = await ensureFreshDay(clinic);

    log.info(`call ${callSid}: resolved clinic ${clinic._id} (${clinic.clinic_name})`);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${process.env.PUBLIC_WS_URL}">
      <Parameter name="clinicId" value="${clinic._id.toString()}"/>
      <Parameter name="callerPhone" value="${from}"/>
    </Stream>
  </Connect>
</Response>`;
    return res.type("text/xml").send(twiml);
  } catch (err) {
    log.error("/twilio/voice failed:", err);
    return res.type("text/xml").send(sayTwiml("Maaf kijiye, system mein dikkat hai. Kripya baad mein call karein."));
  }
});

/**
 * Dashboard "Next Patient" button. Advances the queue atomically and pushes a
 * Socket.io event so every connected dashboard updates instantly.
 */
app.post("/api/clinic/next-token", async (req, res) => {
  try {
    // Doctor JWT auth: the token's `sub` is the ONLY tenant this request may
    // touch — a client-supplied clinicId is never trusted.
    const auth = requireDoctor(req);
    if (!auth) return res.status(401).json({ error: "Unauthorized" });
    const clinicId = auth.sub;

    let clinic = await Clinic.findById(clinicId);
    if (!clinic) return res.status(404).json({ error: "Clinic not found" });
    clinic = await ensureFreshDay(clinic);
    if (clinic.current_running_token >= clinic.last_assigned_token) {
      return res.status(409).json({ error: "Queue already caught up — no waiting tokens", clinic: serializeClinic(clinic) });
    }

    // Atomic pipeline update: within one $set stage all expressions read the
    // pre-update doc, so token_history pushes the OLD current token.
    const updated = await Clinic.findOneAndUpdate(
      { _id: clinic._id },
      [
        {
          $set: {
            last_served_token: "$current_running_token",
            current_running_token: { $add: ["$current_running_token", 1] },
            token_history: {
              $concatArrays: [
                { $slice: ["$token_history", -499] },
                [{ token: "$current_running_token", served_at: "$$NOW" }],
              ],
            },
          },
        },
      ],
      { new: true }
    );

    const servedToken = updated.last_served_token;
    await Appointment.updateMany(
      { clinic_id: updated._id, token_number: servedToken, status: "WAITING" },
      { $set: { status: "COMPLETED" } }
    );

    const payload = {
      clinicId: updated._id,
      servedToken,
      currentRunningToken: updated.current_running_token,
      lastAssignedToken: updated.last_assigned_token,
    };
    io.to(`clinic:${updated._id}`).emit("token:advanced", payload);
    return res.json(payload);
  } catch (err) {
    log.error("/api/clinic/next-token failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

/**
 * Dashboard "Cancel" on a waiting patient. Marks the appointment CANCELLED
 * and tells every connected dashboard; token numbers are never reused.
 */
app.post("/api/clinic/cancel-token", async (req, res) => {
  try {
    const auth = requireDoctor(req);
    if (!auth) return res.status(401).json({ error: "Unauthorized" });
    const { tokenNumber } = req.body || {};
    if (!Number.isInteger(tokenNumber)) {
      return res.status(400).json({ error: "integer tokenNumber is required" });
    }
    const clinicId = auth.sub;

    const updated = await Appointment.findOneAndUpdate(
      { clinic_id: clinicId, token_number: tokenNumber, day: "today", status: "WAITING" },
      { $set: { status: "CANCELLED" } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "No waiting appointment with that token" });

    const payload = { clinicId, tokenNumber, status: "CANCELLED" };
    io.to(`clinic:${clinicId}`).emit("token:cancelled", payload);
    return res.json(payload);
  } catch (err) {
    log.error("/api/clinic/cancel-token failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

/** Initial dashboard hydration before the Socket.io subscription kicks in. */
app.get("/api/clinic/:id/state", async (req, res) => {
  try {
    const auth = requireDoctor(req);
    if (!auth) return res.status(401).json({ error: "Unauthorized" });
    if (auth.sub !== req.params.id) return res.status(403).json({ error: "Forbidden" });
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ error: "Clinic not found" });
    const waiting = await Appointment.find({ clinic_id: clinic._id, status: "WAITING", day: "today" })
      .sort({ token_number: 1 })
      .populate("patient_id", "name phone_number")
      .lean();
    return res.json({ clinic: serializeClinic(clinic), waiting });
  } catch (err) {
    log.error("/api/clinic/:id/state failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---------------------------------------------------------------------------
// Socket.io — real-time push to the Next.js frontend
// ---------------------------------------------------------------------------

const server = http.createServer(app);
const io = new SocketServer(server, {
  path: "/socket.io",
  cors: { origin: corsOrigin, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  // Room membership requires a valid doctor JWT — the token's `sub` decides
  // the room; a client-supplied clinicId is never trusted.
  const auth = verifyDoctorToken(socket.handshake.auth?.token);
  if (!auth) {
    log.warn(`socket ${socket.id} rejected — missing/expired doctor token`);
    socket.disconnect(true);
    return;
  }
  socket.join(`clinic:${auth.sub}`);
  log.info(`socket ${socket.id} subscribed to clinic:${auth.sub}`);
  socket.on("clinic:unsubscribe", (id) => {
    if (id) socket.leave(`clinic:${id}`);
  });
});

// Events emitted to rooms (documented contract for the frontend):
//   "token:booked"   -> { clinicId, tokenNumber, patientName, day, waitMinutes, lastAssignedToken }
//   "token:advanced" -> { clinicId, servedToken, currentRunningToken, lastAssignedToken }
//   "token:cancelled" -> { clinicId, tokenNumber, status: "CANCELLED" }

// ---------------------------------------------------------------------------
// WebSocket — Twilio Media Streams
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ server, path: "/media-stream" });
const activeSessions = new Set();

wss.on("connection", (twilioWs) => {
  const session = {
    twilioWs,
    streamSid: null,
    callSid: null,
    clinicId: null,
    callerPhone: "",
    dg: null,
    tts: null,
    dgKeepAlive: null,
    utteranceBuffer: "",
    history: [],
    thinking: false,
    pendingUtterance: null,
    ttsQueue: [],
    ttsBusy: false,
    closed: false,
  };
  activeSessions.add(session);

  twilioWs.on("message", (raw) => {
    if (session.closed) return;
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    try {
      switch (msg.event) {
        case "start":
          void onStreamStart(session, msg.start || {}).catch((err) => {
            log.error("onStreamStart failed:", err);
            closeSession(session);
          });
          break;
        case "media":
          // Twilio media payload = base64 mulaw 8000Hz -> straight to Deepgram.
          if (session.dg && session.dg.readyState === WebSocket.OPEN) {
            session.dg.send(Buffer.from(msg.media.payload, "base64"));
          }
          break;
        case "stop":
          closeSession(session);
          break;
        case "mark":
        case "connected":
          break; // acknowledged implicitly; barge-in via marks is a follow-up
        default:
          break;
      }
    } catch (err) {
      log.error("WS message handling failed:", err);
    }
  });

  twilioWs.on("close", () => closeSession(session));
  twilioWs.on("error", (err) => {
    log.error("Twilio WS error:", err.message);
    closeSession(session);
  });
});

async function onStreamStart(session, start) {
  session.streamSid = start.streamSid || null;
  session.callSid = start.callSid || null;
  const params = start.customParameters || {};
  session.clinicId = params.clinicId || null;
  session.callerPhone = normalizePhone(params.callerPhone || "");

  if (!session.clinicId || !/^[a-f\d]{24}$/i.test(session.clinicId)) {
    log.error(`call ${session.callSid}: missing/invalid clinicId custom parameter — hanging up`);
    await completeCall(session.callSid);
    closeSession(session);
    return;
  }

  const clinic = await Clinic.findById(session.clinicId);
  if (!clinic || !clinic.is_active) {
    log.error(`call ${session.callSid}: clinic ${session.clinicId} not found/inactive — hanging up`);
    await completeCall(session.callSid);
    closeSession(session);
    return;
  }

  log.info(`call ${session.callSid}: stream started for clinic ${clinic.clinic_name}`);
  openTTS(session, clinic); // greeting speaks as soon as the TTS socket opens
  openSTT(session);
}

// ----------------------------- Deepgram STT --------------------------------

function openSTT(session) {
  const params = new URLSearchParams({
    model: STT_MODEL,
    language: STT_LANGUAGE, // "multi" handles Hinglish; "hi"/"en" for pure
    encoding: "mulaw",
    sample_rate: "8000",
    channels: "1",
    punctuate: "true",
    smart_format: "true",
    endpointing: "350",
    utterance_end_ms: "1200",
    interim_results: "false",
  });
  const dg = new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`, {
    headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
  });
  session.dg = dg;

  dg.on("open", () => log.info(`call ${session.callSid}: Deepgram STT connected`));
  dg.on("message", (data, isBinary) => {
    if (isBinary || session.closed) return;
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (msg.type === "Results" && msg.is_final) {
      const text = msg.channel?.alternatives?.[0]?.transcript?.trim();
      if (text) session.utteranceBuffer = `${session.utteranceBuffer} ${text}`.trim();
    } else if (msg.type === "UtteranceEnd") {
      const utterance = session.utteranceBuffer;
      session.utteranceBuffer = "";
      if (utterance) void processUtterance(session, utterance);
    }
  });
  dg.on("error", (err) => log.error(`call ${session.callSid}: Deepgram STT error:`, err.message));
  dg.on("close", () => log.info(`call ${session.callSid}: Deepgram STT closed`));

  session.dgKeepAlive = setInterval(() => {
    if (dg.readyState === WebSocket.OPEN) dg.send(JSON.stringify({ type: "KeepAlive" }));
  }, 5000);
}

// ----------------------------- LLM turn ------------------------------------

async function processUtterance(session, userText) {
  if (session.closed) return;
  if (session.thinking) {
    // Patient spoke again while we were reasoning — handle the latest after.
    session.pendingUtterance = userText;
    return;
  }
  session.thinking = true;
  try {
    // Fresh read every turn: the prompt always carries live token state.
    const clinic = await Clinic.findById(session.clinicId);
    if (!clinic) throw new Error("clinic disappeared mid-call");

    const llm = await callGroq(
      buildSystemPrompt(clinic, session.callerPhone),
      session.history.slice(-10),
      userText
    );

    let assistantText = llm.reply;
    if (llm.action === "book_token") {
      const result = await handleBookToken(session, session.clinicId, llm);
      if (result) {
        assistantText = bookingConfirmationText(result);
      } else {
        assistantText = "Ji, token book karne ke liye pehle apna naam bata dijiye, phir main confirm kar deti hoon.";
      }
    } else if (llm.action === "end_call") {
      setTimeout(() => completeCall(session.callSid), 3000); // after TTS finishes
    }

    session.history.push({ role: "user", content: userText }, { role: "assistant", content: assistantText });
    if (session.history.length > 20) session.history = session.history.slice(-20);

    speak(session, assistantText);
  } catch (err) {
    log.error(`call ${session.callSid}: turn failed:`, err.message);
    speak(session, "Maaf kijiye, system mein thodi dikkat aa rahi hai. Kripya thodi der baad dobara call karein.");
  } finally {
    session.thinking = false;
    if (session.pendingUtterance && !session.closed) {
      const next = session.pendingUtterance;
      session.pendingUtterance = null;
      void processUtterance(session, next);
    }
  }
}

// ----------------------------- Deepgram Aura TTS ---------------------------

function openTTS(session, clinic) {
  const params = new URLSearchParams({
    model: TTS_MODEL,
    encoding: "mulaw", // Twilio-native format straight back into the stream
    sample_rate: "8000",
    container: "none",
  });
  const tts = new WebSocket(`wss://api.deepgram.com/v1/speak?${params}`, {
    headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
  });
  session.tts = tts;

  tts.on("open", () => {
    log.info(`call ${session.callSid}: Deepgram TTS connected`);
    speak(session, greetingText(clinic));
  });
  tts.on("message", (data, isBinary) => {
    if (session.closed) return;
    if (isBinary) {
      sendMedia(session, data); // raw mulaw (container=none) -> Twilio
      return;
    }
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (msg.type === "Finished" || msg.type === "Flushed") {
      session.ttsBusy = false;
      pumpTTS(session);
    }
  });
  tts.on("error", (err) => log.error(`call ${session.callSid}: Deepgram TTS error:`, err.message));
  tts.on("close", () => log.info(`call ${session.callSid}: Deepgram TTS closed`));
}

function greetingText(clinic) {
  if (clinic.is_on_holiday) {
    return `Namaste! ${clinic.clinic_name} aaj chhutti par hai. Kya main aapke liye kal ka token book kar doon?`;
  }
  const nextToken = (clinic.last_assigned_token || 0) + 1;
  const waitMinutes = estimateWaitMinutes(clinic, nextToken);
  return `Namaste! ${clinic.clinic_name} mein aapka swagat hai. Abhi token number ${clinic.current_running_token} chal raha hai, isliye agle token par lagbhag ${waitMinutes} minute ka wait hai. Bataiye, main aapka token book kar doon?`;
}

function splitSentences(text) {
  const parts = text
    .split(/(?<=[.?!।])\s+/)
    .flatMap((s) => (s.length <= 280 ? [s] : s.match(/.{1,280}(\s|$)/g) || [s]))
    .filter(Boolean);
  return parts;
}

function speak(session, text) {
  if (!text || session.closed) return;
  session.ttsQueue.push(...splitSentences(text));
  pumpTTS(session);
}

function pumpTTS(session) {
  const tts = session.tts;
  if (!tts || tts.readyState !== WebSocket.OPEN || session.ttsBusy || session.ttsQueue.length === 0) return;
  session.ttsBusy = true;
  const text = session.ttsQueue.shift();
  tts.send(JSON.stringify({ type: "Speak", text }));
  tts.send(JSON.stringify({ type: "Flush" })); // force end-of-audio so "Finished" fires
}

function sendMedia(session, mulawBuffer) {
  if (!session.twilioWs || session.twilioWs.readyState !== WebSocket.OPEN || !session.streamSid) return;
  session.twilioWs.send(
    JSON.stringify({
      event: "media",
      streamSid: session.streamSid,
      media: { payload: mulawBuffer.toString("base64") },
    })
  );
}

// ----------------------------- teardown ------------------------------------

function closeSession(session) {
  if (session.closed) return;
  session.closed = true;
  if (session.dgKeepAlive) clearInterval(session.dgKeepAlive);
  for (const ws of [session.dg, session.tts]) {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      try {
        ws.close();
      } catch {
        /* already dying */
      }
    }
  }
  activeSessions.delete(session);
  log.info(`call ${session.callSid || "?"}: session closed (active: ${activeSessions.size})`);
}

// ---------------------------------------------------------------------------
// Super-admin auth (hidden /aarogya-super-admin console)
// ---------------------------------------------------------------------------
// Security model:
//   - Credentials live ONLY in backend env (SUPER_ADMIN_ID + scrypt password hash).
//   - ID and password are compared length-hiding (sha256 + timingSafeEqual) so
//     response timing never reveals which part was wrong.
//   - Per-IP brute-force guard: 5 failures / 15 min -> 15-minute lockout.
//   - Session = HMAC-SHA256-signed token in an HttpOnly + Secure + SameSite=None
//     cookie (cross-site Vercel -> Railway needs None; CSRF is covered by
//     requiring a custom header that cross-site pages cannot forge, since CORS
//     only approves the known frontend origin).
//   - Generic error strings everywhere; failures are audit-logged with IP.

const ADMIN_COOKIE = "aarogya_admin_session";
const ADMIN_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const loginAttempts = new Map(); // ip -> { count, firstAt, lockedUntil }

function adminAuthConfigured() {
  return Boolean(
    process.env.SUPER_ADMIN_ID &&
      process.env.ADMIN_SESSION_SECRET &&
      (process.env.SUPER_ADMIN_PASSWORD_HASH || process.env.SUPER_ADMIN_PASSWORD)
  );
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

function sha256(input) {
  return crypto.createHash("sha256").update(String(input)).digest();
}

/** Length-hiding constant-time string compare (hash both sides first). */
function safeEqualStr(a, b) {
  return crypto.timingSafeEqual(sha256(a), sha256(b));
}

/** Verify `scrypt$N$r$p$saltHex$hashHex` (generate with: npm run hash-password). */
function verifyScryptHash(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = crypto.scryptSync(String(password), salt, expected.length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr),
  });
  return crypto.timingSafeEqual(actual, expected);
}

function verifyAdminPassword(password) {
  if (process.env.SUPER_ADMIN_PASSWORD_HASH) {
    return verifyScryptHash(password, process.env.SUPER_ADMIN_PASSWORD_HASH);
  }
  if (process.env.SUPER_ADMIN_PASSWORD) {
    log.error("SUPER_ADMIN_PASSWORD is plaintext — generate SUPER_ADMIN_PASSWORD_HASH with `npm run hash-password` instead");
    return safeEqualStr(password, process.env.SUPER_ADMIN_PASSWORD);
  }
  return false;
}

function signAdminToken(ttlMs = ADMIN_TTL_MS) {
  const payload = Buffer.from(
    JSON.stringify({ role: "super_admin", iat: Date.now(), exp: Date.now() + ttlMs })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "")
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token) return false;
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return false;
  const expected = crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "")
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.role === "super_admin" && typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

function requireSuperAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifyAdminToken(cookies[ADMIN_COOKIE]);
}

function registerFailedLogin(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip) || { count: 0, firstAt: now, lockedUntil: 0 };
  if (now - rec.firstAt > LOGIN_WINDOW_MS) {
    rec.count = 0;
    rec.firstAt = now;
  }
  rec.count += 1;
  if (rec.count >= MAX_LOGIN_ATTEMPTS) rec.lockedUntil = now + LOGIN_LOCKOUT_MS;
  loginAttempts.set(ip, rec);
  if (loginAttempts.size > 10000) loginAttempts.clear(); // crude memory cap
}

function isLoginLocked(ip) {
  const rec = loginAttempts.get(ip);
  return Boolean(rec && rec.lockedUntil > Date.now());
}

function adminGuards(req, res) {
  if (!adminAuthConfigured()) {
    res.status(503).json({ error: "Admin auth is not configured" });
    return false;
  }
  // Custom header cross-site pages cannot forge — this is the CSRF defense.
  if (req.headers["x-aarogya-admin"] !== "1") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  if (corsOrigin && req.headers.origin && req.headers.origin !== corsOrigin) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

app.post("/api/admin/login", async (req, res) => {
  if (!adminGuards(req, res)) return;
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  if (isLoginLocked(ip)) {
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }
  const { adminId, password } = req.body || {};
  const idOk =
    typeof adminId === "string" &&
    adminId.length > 0 &&
    safeEqualStr(adminId, process.env.SUPER_ADMIN_ID);
  const passOk = typeof password === "string" && password.length > 0 && verifyAdminPassword(password);
  if (!idOk || !passOk) {
    registerFailedLogin(ip);
    await new Promise((r) => setTimeout(r, 400)); // slow online guessing
    log.warn(`admin login FAILED from ${ip}`);
    return res.status(401).json({ error: "Invalid credentials" });
  }
  loginAttempts.delete(ip);
  log.info(`admin login OK from ${ip}`);
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${signAdminToken()}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${ADMIN_TTL_MS / 1000}`
  );
  return res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  if (!adminGuards(req, res)) return;
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`
  );
  return res.json({ ok: true });
});

app.get("/api/admin/clinics", async (req, res) => {
  if (!adminGuards(req, res)) return;
  if (!requireSuperAdmin(req)) {
    return res.status(401).json({ error: "Session expired" });
  }
  try {
    const clinics = await Clinic.find({})
      .select(
        "clinic_name doctor_name twilio_number plan_status plan_expires_at current_running_token last_assigned_token is_on_holiday createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      clinics: clinics.map((c) => ({
        id: c._id,
        clinicName: c.clinic_name,
        doctorName: c.doctor_name,
        twilioNumber: c.twilio_number,
        planStatus: c.plan_status,
        planExpiresAt: c.plan_expires_at,
        currentRunningToken: c.current_running_token,
        lastAssignedToken: c.last_assigned_token,
        isOnHoliday: c.is_on_holiday,
      })),
    });
  } catch (err) {
    log.error("/api/admin/clinics failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---------------------------------------------------------------------------
// Doctor (dashboard) auth — dependency-free HMAC-SHA256 JWT
// ---------------------------------------------------------------------------

const DOCTOR_TTL_MS = 12 * 60 * 60 * 1000;
// Dedicated secret; falls back to the admin secret so small deployments need
// one less env var. Rotating either invalidates the sessions signed with it.
const doctorSecret = () =>
  process.env.DOCTOR_JWT_SECRET || process.env.ADMIN_SESSION_SECRET || "";

function scryptHashFor(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}
// Verified against when the email does not exist, so login timing does not
// reveal whether an account exists (user-enumeration defense).
const DUMMY_SCRYPT_HASH = scryptHashFor("timing-equalizer-dummy");

function signDoctorToken(clinicId, ttlMs = DOCTOR_TTL_MS) {
  const payload = Buffer.from(
    JSON.stringify({
      role: "doctor",
      sub: String(clinicId),
      iat: Date.now(),
      exp: Date.now() + ttlMs,
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", doctorSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function verifyDoctorToken(token) {
  const secret = doctorSecret();
  if (!token || !secret) return null;
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return null;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (
      data.role !== "doctor" ||
      typeof data.exp !== "number" ||
      data.exp <= Date.now() ||
      typeof data.sub !== "string" ||
      !/^[a-f\d]{24}$/i.test(data.sub)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** Extracts and verifies the `Authorization: Bearer <jwt>` doctor token. */
function requireDoctor(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return verifyDoctorToken(token);
}

app.post("/api/auth/doctor-login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const emailKey = email.trim().toLowerCase();
    const clinic = await Clinic.findOne({ email: emailKey }).select(
      "password_hash is_active clinic_name doctor_name twilio_number"
    );
    const hash =
      typeof clinic?.password_hash === "string" ? clinic.password_hash : "";
    // Always run one scrypt verify so response timing is similar for unknown
    // emails and wrong passwords.
    const passOk = verifyScryptHash(
      password,
      /^scrypt\$/.test(hash) ? hash : DUMMY_SCRYPT_HASH
    );
    if (!clinic || !clinic.is_active || !passOk) {
      await new Promise((r) => setTimeout(r, 400)); // slow online guessing
      log.warn(`doctor login FAILED for ${emailKey}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    log.info(`doctor login OK for clinic ${clinic._id}`);
    return res.json({
      token: signDoctorToken(clinic._id.toString()),
      expiresInMs: DOCTOR_TTL_MS,
      clinic: {
        id: clinic._id,
        clinicName: clinic.clinic_name,
        doctorName: clinic.doctor_name,
        twilioNumber: clinic.twilio_number,
      },
    });
  } catch (err) {
    log.error("/api/auth/doctor-login failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

/** Who am I — lets the dashboard re-hydrate the workspace after a refresh. */
app.get("/api/auth/doctor-me", async (req, res) => {
  const auth = requireDoctor(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    const clinic = await Clinic.findById(auth.sub).select(
      "clinic_name doctor_name twilio_number"
    );
    if (!clinic) return res.status(404).json({ error: "Clinic not found" });
    return res.json({
      clinic: {
        id: clinic._id,
        clinicName: clinic.clinic_name,
        doctorName: clinic.doctor_name,
        twilioNumber: clinic.twilio_number,
      },
    });
  } catch (err) {
    log.error("/api/auth/doctor-me failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

if (require.main === module) {
  assertEnv();
  mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 }) // fail fast on a bad URI instead of retrying for 30s
    .then(() => {
      log.info("MongoDB connected");
      server.listen(PORT, () => {
        log.info(`voice-agent listening on :${PORT}`);
        log.info(`  webhook  POST ${process.env.PUBLIC_BASE_URL}/twilio/voice`);
        log.info(`  stream   ${process.env.PUBLIC_WS_URL}`);
      });
    })
    .catch((err) => {
      log.error("MongoDB connection failed:", err.message);
      process.exit(1);
    });
}

process.on("unhandledRejection", (reason) => log.error("Unhandled rejection:", reason));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

function shutdown(signal) {
  log.info(`${signal} received — draining ${activeSessions.size} active call(s)`);
  server.close(() => mongoose.connection.close(false).then(() => process.exit(0)));
  setTimeout(() => process.exit(0), 8000).unref();
}

// Exported for unit tests (test/unit.test.js) — pure logic only, no side effects.
module.exports = {
  normalizePhone,
  estimateWaitMinutes,
  buildSystemPrompt,
  parseLLMJson,
  twilioSignaturePayload,
  bookingConfirmationText,
  splitSentences,
  istDateKey,
  ensureFreshDay,
  parseCookies,
  verifyScryptHash,
  signAdminToken,
  verifyAdminToken,
  signDoctorToken,
  verifyDoctorToken,
};
