यहाँ इस प्रोजेक्ट के लिए विस्तृत PRD (Product Requirement Document) और README.md दिया गया है। यह आपके पूरे SaaS प्रोजेक्ट का एक कम्प्लीट ब्लूप्रिंट (Blueprint) है, जिसे देखकर आप खुद कोडिंग कर सकते हैं या किसी डेवलपर से करवा सकते हैं।
------------------------------
## 📑 भाग 1: PRD (Product Requirement Document)## 1. प्रोजेक्ट ओवरव्यू (Project Overview)
यह एक मल्टी-टेंट (Multi-Tenant) AI-पावर्ड वॉइस रिसेप्शनिस्ट SaaS प्लेटफ़ॉर्म है, जो विशेष रूप से भारत के डॉक्टर्स और क्लीनिक्स के लिए डिज़ाइन किया गया है। इसका उद्देश्य क्लीनिक के अपॉइंटमेंट मैनेजमेंट और टोकन सिस्टम को 100% ऑटोमैटिक और डिजिटल बनाना है।

* बिज़नेस मॉडल: SaaS (Subscription-based Monthly Fee)
* मुख्य टारगेट: डेंटिस्ट, स्किन डॉक्टर, फिजियोथेरेपिस्ट और इंडिपेंडेंट क्लीनिक्स।
* कोर टेक्नोलॉजी: React/Next.js (Frontend), Node.js (Backend), MongoDB (Database), Vapi.ai/Bland.ai (Voice AI Engine)।

------------------------------
## 2. कोर फीचर्स और यूजर स्टोरीज (Core Features & User Stories)## A. सुपर एडमिन पैनल (Super Admin Dashboard) — आपके लिए

* क्लाइंट मैनेजमेंट: सभी रजिस्टर्ड डॉक्टर्स की लिस्ट देखना, उन्हें अप्रूव/सस्पेंड करना।
* नंबर असाइनमेंट: जब कोई डॉक्टर साइनअप करे, तो उसे Vapi/Twilio से खरीदा गया नंबर मैन्युअल रूप से अलॉट करना।
* प्लान और बिलिंग: डॉक्टर के प्लान की एक्सपायरी डेट सेट करना, रिन्यूअल ट्रैक करना और सर्विस रोकना।

## B. डॉक्टर / क्लीनिक डैशबोर्ड (Doctor Web Dashboard)

* ऑनबोर्डिंग: डॉक्टर का प्रोफाइल बनाना, क्लीनिक का नाम, सिटिंग टाइम (उदा: 5 PM - 8 PM), स्लॉट टाइम (15 मिनट) सेट करना।
* लाइव टोकन स्क्रीन (Live Queue): वर्तमान में चल रहे मरीज़ का टोकन नंबर देखना।
* वन-क्लिक एक्शन: केबिन में मरीज़ बदलने के लिए सिर्फ एक बड़ा "Next Patient" बटन दबाना।
* लीव मैनेजमेंट: क्लीनिक बंद करने या छुट्टी मार्क करने के लिए एक "Clinic Open/Closed" टॉगल बटन।
* एक्सपायरी अलर्ट: स्क्रीन के ऊपर बड़ा बैनर जो प्लान एक्सपायर होने की चेतावनी देगा।

## C. AI वॉइस असिस्टेंट (AI Voice Engine) — मरीज़ों के लिए

* कॉल उठाना: 24/7 तुरंत इनकमिंग कॉल का जवाब देना।
* लाइव स्टेटस बताना: डेटाबेस से चेक करके मरीज़ को बताना कि अभी कौन-सा टोकन चल रहा है और उसे कौन-सा नंबर मिलेगा।
* स्मार्ट बुकिंग: खाली स्लॉट देखकर नाम और फोन नंबर पूछकर बुकिंग पक्का करना।
* छुट्टी संभालना: अगर डॉक्टर ऑन-लीव हैं, तो आज की बुकिंग मना करके कल का स्लॉट ऑफर करना।

------------------------------
## 3. डेटाबेस आर्किटेक्चर (MongoDB Collections Schema)

// 1. Clinics Collection
{
  _id: ObjectId,
  doctor_name: String,
  clinic_name: String,
  email: String,
  password_hash: String,
  assigned_phone_number: String, // NULL on signup
  number_status: String, // "PENDING", "ACTIVE", "SUSPENDED"
  plan_status: String, // "TRIAL", "ACTIVE", "EXPIRED"
  plan_expires_at: Date,
  config: {
    start_time: String, // "17:00"
    end_time: String,   // "20:00"
    slot_duration: Number // 15
  },
  current_token: Number, // default: 0
  is_open: Boolean // default: true
}
// 2. Appointments Collection
{
  _id: ObjectId,
  clinic_id: ObjectId, // Strict Data Isolation
  patient_name: String,
  patient_phone: String,
  token_number: Number,
  appointment_time: Date,
  status: String, // "Waiting", "Completed", "Cancelled"
  created_at: Date
}

------------------------------
## 4. सुरक्षा और डेटा अलगाव (Security & Data Isolation)

* Multi-Tenancy Guard: प्रत्येक API रिक्वेस्ट में assigned_phone_number से clinic_id को निकाला जाएगा। डेटाबेस की हर क्वेरी में clinic_id को हार्डकोड करके फिल्टर किया जाएगा, ताकि डॉक्टर-A का डेटा कभी भी डॉक्टर-B को न दिखे।
* एक्सपायरी लॉक: यदि current_date > plan_expires_at है, तो AI रिसेप्शनिस्ट कॉल पर सीधे ग्रेसफुल मैसेज (उदा: "सर्विस अस्थायी रूप से अनुपलब्ध है") बोलेगी और बुकिंग बंद रखेगी।

------------------------------
------------------------------
## 🛠️ भाग 2: README.md (Technical Documentation)
यहाँ आपके प्रोजेक्ट के लिए प्रोफेशनल README.md फाइल की रूपरेखा दी गई है:

# AI Receptionist for Doctors (SaaS Platform)
यह एक मल्टी-टेंट, नो-कैलेंडर (Pure MongoDB) AI वॉइस रिसेप्शनिस्ट प्लेटफ़ॉर्म है। यह डॉक्टरों को एक साधारण वेब डैशबोर्ड देता है और मरीज़ों के लिए फ़ोन कॉल पर 24/7 अपॉइंटमेंट बुकिंग की सुविधा प्रदान करता है।
## 🚀 सिस्टम आर्किटेक्चर (System Architecture)

[Patient Call] ──> [Vapi.ai Voice Bot]
│
(Custom Webhook)
│
▼
[Node.js / Next.js API]
/ 
▼ ▼
[MongoDB Database] [Doctor's Web Dashboard]


## 🛠️ टेक स्टैक (Tech Stack)
- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** Node.js (Express) या Next.js API Routes
- **Database:** MongoDB (Mongoose)
- **AI Calling Engine:** Vapi.ai / Bland.ai API

## 📋 मुख्य कंपोनेंट्स और वर्कफ़्लो

### 1. डॉक्टर साइनअप और एडमिन अप्रूवल
1. डॉक्टर प्लेटफ़ॉर्म पर रजिस्टर करता है और क्लीनिक की सेटिंग्स (समय और स्लॉट) कॉन्फ़िगर करता है।
2. साइनअप पर, `assigned_phone_number` खाली रहता है और डैशबोर्ड पर **"Number Assignment Soon"** का बैनर दिखता है।
3. सुपर एडमिन अपने पैनल से Vapi का एक नया नंबर इस डॉक्टर की `clinic_id` के साथ मैप करके `number_status: "ACTIVE"` कर देता है।

### 2. AI कॉलिंग और लाइव कतार (Live Queue Calculation)
जब कोई मरीज़ कॉल करता है, Vapi आपके बैकएंड `/api/vapi/webhook` को हिट करता है:
- बैकएंड इनकमिंग नंबर से `clinic_id` ढूंढता है।
- यह चेक करता है कि डॉक्टर का प्लान एक्टिव है या नहीं (`plan_status: "ACTIVE"`).
- यह आज के बुक हो चुके टोकन और वर्तमान में चल रहे टोकन (`current_token`) का गणित लगाकर Vapi को रिस्पॉन्स देता है।

### 3. डॉक्टर का "Next Patient" बटन
- डॉक्टर जब डैशबोर्ड पर **"Next"** क्लिक करता है, तो बैकएंड API `current_token` को `+1` बढ़ा देती है।
- पूरा डेटाबेस और कतार रियल-टाइम में अपडेट हो जाती है।

## 💻 लोकल सेटअप गाइड (Local Setup)

### 1. पर्यावरण वेरिएबल्स (.env File)
प्रोजेक्ट के रूट में एक `.env` फ़ाइल बनाएं:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_for_auth
VAPI_API_KEY=your_vapi_secret_key
ADMIN_SECRET_KEY=your_super_admin_password
```

### 2. इंस्टॉलेशन (Installation)
```bash
# रिपोजिटरी क्लोन करें
git clone https://github.com

# डिपेंडेंसी इनस्टॉल करें
cd ai-receptionist-saas
npm install

# डेवलपमेंट सर्वर चालू करें
npm run dev
```

## 🔒 एपीआई एंडपॉइंट्स (Key API Endpoints)

- `POST /api/vapi/webhook` - Vapi.ai द्वारा कॉल के दौरान लाइव डेटा पढ़ने/लिखने के लिए।
- `POST /api/doctor/next-patient` - डॉक्टर द्वारा वर्तमान टोकन आगे बढ़ाने के लिए।
- `POST /api/admin/assign-number` - सुपर एडमिन द्वारा डॉक्टर को नंबर अलॉट करने के लिए।
- `POST /api/doctor/toggle-status` - क्लीनिक ओपन/क्लोज या छुट्टी मार्क करने के लिए।

------------------------------
