/**
 * Pure-logic unit tests — no API keys, no network, no database.
 *
 * Run: npm test   (node --test test/)
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizePhone,
  estimateWaitMinutes,
  buildSystemPrompt,
  parseLLMJson,
  twilioSignaturePayload,
  bookingConfirmationText,
  splitSentences,
  istDateKey,
  parseCookies,
  verifyScryptHash,
  signAdminToken,
  verifyAdminToken,
  signDoctorToken,
  verifyDoctorToken,
} = require("../server.js");
const crypto = require("crypto");

test("normalizePhone strips tel:, spaces and separators", () => {
  assert.equal(normalizePhone("tel:+91 98765-43210"), "+919876543210");
  assert.equal(normalizePhone("(0114) 123 4567"), "01141234567");
  assert.equal(normalizePhone(""), "");
  assert.equal(normalizePhone(null), "");
});

test("estimateWaitMinutes multiplies queue position by avg minutes", () => {
  const clinic = { current_running_token: 12, avg_minutes_per_token: 15 };
  assert.equal(estimateWaitMinutes(clinic, 46), 510); // the spec example
  assert.equal(estimateWaitMinutes(clinic, 12), 0);
  assert.equal(estimateWaitMinutes(clinic, 5), 0); // never negative
  assert.equal(
    estimateWaitMinutes({ current_running_token: 0 }, 2),
    30, // default 15 min/token
  );
});

test("buildSystemPrompt injects live token state and holiday status", () => {
  const clinic = {
    clinic_name: "Test Clinic",
    doctor_name: "Dr. T",
    current_running_token: 12,
    last_assigned_token: 45,
    avg_minutes_per_token: 15,
    is_on_holiday: false,
    config: { start_time: "09:00", end_time: "17:00", new_patient_fee: 100 },
  };
  const prompt = buildSystemPrompt(clinic, "+919876543210");
  assert.match(prompt, /Current running token: 12/);
  assert.match(prompt, /agla token 46 hoga/);
  assert.match(prompt, /510 minute/);
  assert.match(prompt, /\+919876543210/);
  assert.match(prompt, /₹100/);
  // The LLM must never claim to assign token numbers itself.
  assert.match(prompt, /Token number TUM assign nahi karti/);

  const holiday = buildSystemPrompt({ ...clinic, is_on_holiday: true }, "");
  assert.match(holiday, /CHHUTTI/);
});

test("parseLLMJson handles raw JSON, fenced JSON and garbage", () => {
  assert.deepEqual(parseLLMJson('{"reply":"hi","action":"none"}'), {
    reply: "hi",
    action: "none",
  });
  assert.deepEqual(
    parseLLMJson('```json\n{"reply":"ji","action":"book_token"}\n```'),
    { reply: "ji", action: "book_token" },
  );
  assert.equal(parseLLMJson("sorry, no json here"), null);
  assert.equal(parseLLMJson(""), null);
});

test("twilioSignaturePayload sorts params by key after the URL", () => {
  const payload = twilioSignaturePayload("https://x/twilio/voice", {
    To: "+91",
    From: "+92",
    CallSid: "CA1",
  });
  assert.equal(payload, "https://x/twilio/voiceCallSidCA1From+92To+91");
  assert.equal(twilioSignaturePayload("https://x", {}), "https://x");
});

test("bookingConfirmationText includes real token, wait and parchi fee", () => {
  const today = bookingConfirmationText({
    name: "Ravi",
    token: 46,
    waitMinutes: 510,
    day: "today",
    isNewPatient: true,
    fee: 100,
  });
  assert.match(today, /token number 46/);
  assert.match(today, /8 ghante 30 minute/);
  assert.match(today, /₹100/);

  const tomorrow = bookingConfirmationText({
    name: "Sita",
    token: 1,
    waitMinutes: 0,
    day: "tomorrow",
    isNewPatient: false,
    fee: 100,
  });
  assert.match(tomorrow, /kal aapka token number 1/);
  assert.doesNotMatch(tomorrow, /₹100/);
});

test("splitSentences splits Hinglish punctuation and chunks long text", () => {
  const parts = splitSentences(
    "Namaste! Aapka token 46 hai. Kya confirm karein?",
  );
  assert.equal(parts.length, 3);
  const long = splitSentences("a".repeat(600));
  assert.ok(long.length >= 1);
  assert.ok(long.every((s) => s.length <= 280));
});

test("istDateKey uses fixed +05:30 offset (no DST)", () => {
  assert.equal(istDateKey(new Date("2026-10-04T20:00:00Z")), "2026-10-05"); // 01:30 IST
  assert.equal(istDateKey(new Date("2026-10-05T18:00:00Z")), "2026-10-05"); // 23:30 IST
  assert.equal(istDateKey(new Date("2026-10-05T18:31:00Z")), "2026-10-06"); // 00:01 IST
});

test("parseCookies handles multiple pairs and = inside values", () => {
  assert.deepEqual(parseCookies("a=1; b=two=parts; c="), { a: "1", b: "two=parts", c: "" });
  assert.deepEqual(parseCookies(""), {});
});

test("scrypt hash verifies the right password and rejects wrong/empty", () => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync("correct horse battery", salt, 64, { N: 16384, r: 8, p: 1 });
  const stored = `scrypt$16384$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
  assert.equal(verifyScryptHash("correct horse battery", stored), true);
  assert.equal(verifyScryptHash("wrong password", stored), false);
  assert.equal(verifyScryptHash("correct horse battery", "garbage"), false);
  assert.equal(verifyScryptHash("correct horse battery", ""), false);
});

test("admin session token: sign -> verify, and tamper/expiry rejection", () => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-for-unit-tests-only";
  const token = signAdminToken(60_000);
  assert.equal(verifyAdminToken(token), true);

  const [payload, sig] = token.split(".");
  const tamperedSig = Buffer.from("x").toString("base64url");
  assert.equal(verifyAdminToken(`${payload}.${tamperedSig}`), false);
  assert.equal(verifyAdminToken(`${payload}`), false);
  assert.equal(verifyAdminToken(""), false);

  const expired = signAdminToken(-1_000); // already expired
  assert.equal(verifyAdminToken(expired), false);

  const other = signAdminToken(60_000);
  process.env.ADMIN_SESSION_SECRET = "a-different-secret";
  assert.equal(verifyAdminToken(other), false); // wrong signing secret
  process.env.ADMIN_SESSION_SECRET = "test-secret-for-unit-tests-only";
});

test("doctor JWT: sign -> verify carries clinic sub, rejects tamper/expiry/wrong secret", () => {
  process.env.DOCTOR_JWT_SECRET = "test-doctor-secret-for-unit-tests-only";
  const clinicId = "64b1f0c9a1b2c3d4e5f60718";
  const token = signDoctorToken(clinicId, 60_000);
  const verified = verifyDoctorToken(token);
  assert.ok(verified, "token should verify");
  assert.equal(verified.sub, clinicId);
  assert.equal(verified.role, "doctor");

  const [payload, sig] = token.split(".");
  const tamperedSig = Buffer.from("x").toString("base64url");
  assert.equal(verifyDoctorToken(`${payload}.${tamperedSig}`), null);
  assert.equal(verifyDoctorToken(payload), null);
  assert.equal(verifyDoctorToken(""), null);
  assert.equal(verifyDoctorToken(null), null);

  const expired = signDoctorToken(clinicId, -1_000); // already expired
  assert.equal(verifyDoctorToken(expired), null);

  // The token's sub must be a 24-hex clinic id — the only tenant it grants.
  const badSub = signDoctorToken("not-a-clinic-id", 60_000);
  assert.equal(verifyDoctorToken(badSub), null);

  // Wrong signing secret must fail.
  const other = signDoctorToken(clinicId, 60_000);
  process.env.DOCTOR_JWT_SECRET = "a-different-doctor-secret";
  assert.equal(verifyDoctorToken(other), null);

  // Secret unset -> fail closed (no fallback in tests because we set one).
  delete process.env.DOCTOR_JWT_SECRET;
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal(verifyDoctorToken(other), null);
  process.env.DOCTOR_JWT_SECRET = "test-doctor-secret-for-unit-tests-only";
});

test("doctor JWT falls back to ADMIN_SESSION_SECRET when DOCTOR_JWT_SECRET unset", () => {
  delete process.env.DOCTOR_JWT_SECRET;
  process.env.ADMIN_SESSION_SECRET = "fallback-secret-doctor-tests";
  const token = signDoctorToken("64b1f0c9a1b2c3d4e5f60718", 60_000);
  assert.ok(verifyDoctorToken(token), "fallback secret should verify");
  delete process.env.ADMIN_SESSION_SECRET;
});
