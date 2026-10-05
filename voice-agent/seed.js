/**
 * Create the Clinic document that answers a Twilio number.
 *
 * The webhook resolves tenants by the incoming `To` number, so at least one
 * clinic row must exist with `twilio_number` set before any call can work.
 *
 * Usage:
 *   node seed.js +911140001234 "Sharma Dental Care"
 *   npm run seed -- +911140001234 "Sharma Dental Care"
 */
require("dotenv").config();

const mongoose = require("mongoose");
const { Clinic } = require("./models");

async function main() {
  const [number, clinicName] = process.argv.slice(2);
  if (!number || !/^\+\d{8,15}$/.test(number)) {
    console.error(
      'Usage: node seed.js +911140001234 "Clinic Name"  (E.164, e.g. your Twilio number)'
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
        password_hash: "set-me-later", // doctor auth is not implemented yet
        twilio_number: number,
        is_active: true,
        avg_minutes_per_token: 15,
        config: { start_time: "09:00", end_time: "17:00", new_patient_fee: 100 },
      },
    },
    { upsert: true, new: true }
  );

  console.log(
    `Clinic ready:\n  id            ${clinic._id.toString()}\n  clinic_name   ${clinic.clinic_name}\n  twilio_number ${clinic.twilio_number}\n  tokens        current=${clinic.current_running_token} last_assigned=${clinic.last_assigned_token}`
  );

  await mongoose.connection.close(false);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
