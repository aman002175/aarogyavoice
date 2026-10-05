# 🗄️ Database Schema (MongoDB with Mongoose)

> Canonical implementation: **[voice-agent/models.js](../voice-agent/models.js)** — keep this doc in sync with it.

## 1. Clinics Collection
Represents a single doctor/clinic subscribed to the SaaS.

```javascript
const ClinicSchema = new Schema({
  doctor_name: { type: String, required: true },
  clinic_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  
  // Telephony & SaaS Config
  // Multi-tenant key: the incoming Twilio `To` number resolves the clinic.
  // The LLM is NEVER allowed to supply a clinic_id.
  twilio_number: { type: String, required: true, unique: true }, // E.164, e.g. +911140001234
  number_status: { type: String, enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], default: 'PENDING' },
  plan_status: { type: String, enum: ['TRIAL', 'ACTIVE', 'EXPIRED'], default: 'TRIAL' },
  plan_expires_at: { type: Date },
  
  // Clinic Operations
  config: {
    start_time: { type: String, default: "09:00" },
    end_time: { type: String, default: "17:00" },
    avg_minutes_per_token: { type: Number, default: 15 }, // wait ≈ (next token − current running token) × this
    new_patient_fee: { type: Number, default: 100 } // The "Parchi" fee
  },
  
  // Live Dashboard State — dynamic token queue (NO fixed time slots)
  is_on_holiday: { type: Boolean, default: false },
  current_running_token: { type: Number, default: 0 }, // token being served now
  last_assigned_token: { type: Number, default: 0 },   // last token handed out; change ONLY via atomic $inc
  last_served_token: { type: Number, default: 0 },
  token_history: [{ token: Number, served_at: Date }],
  
  created_at: { type: Date, default: Date.now }
});
```

## 2. Patients Collection
Tracks patient identity to determine New vs. Old status.

```javascript
const PatientSchema = new Schema({
  phone_number: { type: String, required: true, index: true },
  name: { type: String, required: true },
  clinic_id: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
  
  is_new_patient: { type: Boolean, default: true }, // Core logic for Parchi rule
  first_visit_date: { type: Date, default: Date.now },
  last_visit_date: { type: Date },
  total_visits: { type: Number, default: 0 }
});

// AUDIT FIX (DOCS_AUDIT_AND_CHALLENGES.md §4b): compound unique index — without
// it the same phone registers twice per clinic and the ₹100 parchi (new
// patient) fee logic breaks.
PatientSchema.index({ clinic_id: 1, phone_number: 1 }, { unique: true });
```

## 3. Appointments Collection
The actual booking records.

```javascript
const AppointmentSchema = new Schema({
  clinic_id: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  
  token_number: { type: Number, required: true },
  day: { type: String, enum: ['today', 'tomorrow'], default: 'today' }, // dynamic token queue — no HH:MM slots
  booked_via: { type: String, enum: ['ai_call', 'dashboard', 'walk_in'], default: 'ai_call' },
  
  status: { 
    type: String, 
    enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], 
    default: 'WAITING' 
  },
  
  notes: { type: String }, // E.g., "Called via AI, confirmed parchi fee"
  created_at: { type: Date, default: Date.now }
});

// Token numbers repeat across days (tomorrow's queue restarts at 1).
AppointmentSchema.index({ clinic_id: 1, token_number: 1, day: 1 });
```
