/**
 * Mongoose models for the voice orchestrator.
 * Canonical source of truth — keep docs/DATABASE_SCHEMA.md in sync with this.
 */
const { Schema, model } = require("mongoose");

const ClinicSchema = new Schema({
  doctor_name: { type: String, required: true },
  clinic_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },

  // Telephony & SaaS
  // Multi-tenant key: the incoming Twilio `To` number resolves the clinic.
  // NEVER let the LLM supply a clinic_id.
  twilio_number: { type: String, required: true, unique: true, index: true }, // E.164, e.g. +911140001234
  number_status: { type: String, enum: ["PENDING", "ACTIVE", "SUSPENDED"], default: "PENDING" },
  plan_status: { type: String, enum: ["TRIAL", "ACTIVE", "EXPIRED"], default: "TRIAL" },
  plan_expires_at: { type: Date },
  is_active: { type: Boolean, default: true },

  // Live token queue — dynamic, no fixed time slots
  is_on_holiday: { type: Boolean, default: false },
  current_running_token: { type: Number, default: 0, min: 0 }, // token being served now
  last_assigned_token: { type: Number, default: 0, min: 0 },   // last token handed out; ONLY change via atomic $inc
  last_served_token: { type: Number, default: 0, min: 0 },
  avg_minutes_per_token: { type: Number, default: 15 },
  token_history: [{ token: Number, served_at: Date }],

  // Front-desk config
  config: {
    start_time: { type: String, default: "09:00" },
    end_time: { type: String, default: "17:00" },
    new_patient_fee: { type: Number, default: 100 }, // the "parchi" fee
  },
}, { timestamps: true });

const PatientSchema = new Schema({
  clinic_id: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
  phone_number: { type: String, required: true }, // E.164, normalized
  name: { type: String },
}, { timestamps: true });

// AUDIT FIX (docs/DOCS_AUDIT_AND_CHALLENGES.md §4b): without this compound
// unique index the same phone registers twice per clinic, the patient flips
// between "new"/"old", and the ₹100 parchi fee is computed wrong.
PatientSchema.index({ clinic_id: 1, phone_number: 1 }, { unique: true });

const AppointmentSchema = new Schema({
  clinic_id: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
  patient_id: { type: Schema.Types.ObjectId, ref: "Patient", required: true },

  token_number: { type: Number, required: true },
  day: { type: String, enum: ["today", "tomorrow"], default: "today" },

  status: {
    type: String,
    enum: ["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
    default: "WAITING",
  },
  fee_paid: { type: Boolean, default: false },
  booked_via: { type: String, enum: ["ai_call", "dashboard", "walk_in"], default: "ai_call" },
  notes: { type: String },
}, { timestamps: true });

// Token numbers repeat across days (tomorrow's queue starts at 1 again).
AppointmentSchema.index({ clinic_id: 1, token_number: 1, day: 1 });

module.exports = {
  Clinic: model("Clinic", ClinicSchema),
  Patient: model("Patient", PatientSchema),
  Appointment: model("Appointment", AppointmentSchema),
};
