# 🗄️ Database Schema (MongoDB with Mongoose)

## 1. Clinics Collection
Represents a single doctor/clinic subscribed to the SaaS.

```javascript
const ClinicSchema = new Schema({
  doctor_name: { type: String, required: true },
  clinic_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  
  // Telephony & SaaS Config
  assigned_phone_number: { type: String, default: null },
  number_status: { type: String, enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], default: 'PENDING' },
  plan_status: { type: String, enum: ['TRIAL', 'ACTIVE', 'EXPIRED'], default: 'TRIAL' },
  plan_expires_at: { type: Date },
  
  // Clinic Operations
  config: {
    start_time: { type: String, default: "09:00" },
    end_time: { type: String, default: "17:00" },
    slot_duration: { type: Number, default: 15 }, // in minutes
    new_patient_fee: { type: Number, default: 100 } // The "Parchi" fee
  },
  
  // Live Dashboard State
  current_token: { type: Number, default: 1 },
  is_open: { type: Boolean, default: true },
  
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
```

## 3. Appointments Collection
The actual booking records.

```javascript
const AppointmentSchema = new Schema({
  clinic_id: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  
  token_number: { type: Number, required: true },
  appointment_date: { type: Date, required: true },
  appointment_time: { type: String, required: true }, // HH:MM
  
  status: { 
    type: String, 
    enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], 
    default: 'WAITING' 
  },
  
  notes: { type: String }, // E.g., "Called via AI, confirmed parchi fee"
  created_at: { type: Date, default: Date.now }
});
```
