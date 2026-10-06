/**
 * Create the Clinic document that answers a Twilio number.
 *
 * The webhook resolves tenants by the incoming `To` number, so at least one
 * clinic row must exist with `twilio_number` set before any call can work.
 *
 * Usage:
 *   node seed.js +911140001234 "Sharma Dental Care" [doctorPassword]
 *   npm run seed -- +911140001234 "Sharma Dental Care" "s3cret-password"
 *
 * The optional password enables /api/auth/doctor-login for this clinic
 * (scrypt-hashed, same scheme as hash-password.js).
 */
require("dotenv").config();

const crypto = require("crypto");
const mongoose = require("mongoose");
const { Clinic } = require("./models");

function scryptHashFor(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function main() {
  const [number, clinicName, doctorPassword] = process.argv.slice(2);
  if (!number || !/^\+\d{8,15}$/.test(number)) {
    console.error(
      'Usage: node seed.js +911140001234 "Clinic Name" [doctorPassword]  (E.164, e.g. your Twilio number)'
    );
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set — see env.example");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const clinic = await Clinic.findOneAndUpdate(
    { twilio_number: number },
    {
      $setOnInsert: {
        doctor_name: "Dr. Ananya Sharma",
        clinic_name: clinicName || "Aarogya Dental Care",
        email: `demo+${number.replace(/\D/g, "")}@aarogyavoice.com`,
        password_hash: doctorPassword
          ? scryptHashFor(doctorPassword)
          : "set-me-later", // without a password, doctor login stays disabled
        twilio_number: number,
        is_active: true,
        avg_minutes_per_token: 15,
        config: { start_time: "09:00", end_time: "17:00", new_patient_fee: 100 },
      },
    },
    { upsert: true, new: true }
  );

  console.log(
    `Clinic ready:\n  id            ${clinic._id.toString()}\n  clinic_name   ${clinic.clinic_name}\n  email         ${clinic.email}\n  twilio_number ${clinic.twilio_number}\n  doctor login  ${doctorPassword ? "ENABLED (use the email above)" : "disabled — pass a password to enable"}\n  tokens        current=${clinic.current_running_token} last_assigned=${clinic.last_assigned_token}`
  );

  await mongoose.connection.close(false);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
