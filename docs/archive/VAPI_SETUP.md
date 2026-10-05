# 🎙️ Vapi.ai Integration Guide

> Complete setup guide for integrating Vapi.ai voice assistant with your AI Receptionist platform.

---

## 📋 Table of Contents

1. [Vapi.ai Overview](#overview)
2. [Setup Requirements](#setup-requirements)
3. [API Key Configuration](#api-key-configuration)
4. [Webhook Configuration](#webhook-configuration)
5. [Assistant Setup](#assistant-setup)
6. [Phone Number Management](#phone-number-management)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**Vapi.ai** is an AI voice platform that:
- ✅ Receives incoming calls on assigned phone numbers
- ✅ Executes custom voice conversations (via system prompt)
- ✅ Sends real-time webhook events to your backend
- ✅ Handles call transcription and recording
- ✅ Supports multiple languages and accents

### Call Flow with Vapi

```
Patient calls dedicated number
         ↓
Vapi receives call
         ↓
Vapi plays greeting from system prompt
         ↓
Vapi sends CALL_STARTED webhook to your backend
         ↓
Your backend fetches clinic status from MongoDB
         ↓
Vapi follows conversation flow (script)
         ↓
Vapi sends CALL_ENDED webhook with transcript
         ↓
Your backend saves appointment (if booked)
```

---

## 🔧 Setup Requirements

### Before You Start
- ✅ Vapi.ai account (https://vapi.ai)
- ✅ API Key from Vapi dashboard
- ✅ Webhook URL (your backend)
- ✅ MongoDB clinic data ready
- ✅ Node.js backend running

### Create Vapi Account
1. Go to [vapi.ai](https://vapi.ai)
2. Sign up with email
3. Verify email
4. Go to Dashboard → API Keys
5. Create new API key (keep it safe!)

---

## 🔑 API Key Configuration

### Store in Environment Variables

```bash
# .env.local
VAPI_API_KEY=your_vapi_api_key_here
VAPI_ASSISTANT_ID=your_assistant_id_here
VAPI_WEBHOOK_SECRET=your_webhook_secret_key
BACKEND_URL=https://yourdomain.com
```

### Test API Key
```bash
curl -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  https://api.vapi.ai/assistant \
  -X GET
```

Expected response: `200 OK` with list of assistants

---

## 🌐 Webhook Configuration

Your backend must expose a webhook endpoint for Vapi to send events.

### Webhook Endpoint
```
POST /api/vapi/webhook
```

### Vapi Sends These Events

| Event | Trigger | Use Case |
|-------|---------|----------|
| `CALL_STARTED` | Patient calls | Fetch clinic status |
| `CALL_ENDED` | Patient hangs up | Save appointment, transcript |
| `SPEECH_UPDATE` | Patient says something | Real-time processing |
| `FUNCTION_CALL` | Bot needs external data | Query MongoDB |
| `MESSAGE_RECEIVED` | Bot receives message | Log interaction |

### Example Webhook Payload (CALL_STARTED)

```json
{
  "message": {
    "type": "CALL_STARTED",
    "call": {
      "id": "call_12345",
      "phoneNumber": "+911234567890",
      "assistantId": "assistant_xyz",
      "startedAt": "2026-10-04T14:30:00Z"
    }
  }
}
```

### Example Webhook Payload (CALL_ENDED)

```json
{
  "message": {
    "type": "CALL_ENDED",
    "call": {
      "id": "call_12345",
      "transcript": "Hello, I want to book an appointment...",
      "summary": "Patient booked appointment for Oct 5, 3 PM",
      "recordingUrl": "https://vapi.ai/recordings/...",
      "endedAt": "2026-10-04T14:35:00Z"
    }
  }
}
```

---

## 🤖 Assistant Setup

### Create Assistant via Vapi Dashboard

1. **Login to Vapi Dashboard**
2. **Click "Create Assistant"**
3. **Configure Details:**

| Setting | Value |
|---------|-------|
| **Name** | Clinic Receptionist |
| **Model** | GPT-4 (or latest) |
| **Voice** | Google (EN-US or HI) |
| **Language** | English or Hindi |

### System Prompt Template

```
You are an intelligent clinic receptionist for Dr. [CLINIC_NAME].

Current Status:
- Current Token: [CURRENT_TOKEN]
- Clinic Hours: [START_TIME] - [END_TIME]
- Is Clinic Open: [IS_OPEN]
- Available Slots Today: [AVAILABLE_SLOTS]

Your Job:
1. Greet the caller warmly
2. Ask their name and phone number
3. Tell them the current wait time
4. Offer to book an appointment if slots available
5. Handle clinic closed scenario gracefully

IMPORTANT: Be professional, friendly, and concise.
Keep responses under 30 seconds.

If clinic is closed:
"Sorry, our clinic is closed right now. Our working hours are [START] to [END]. Would you like me to book an appointment for tomorrow?"

If no slots:
"Unfortunately, all slots are full today. Can I book you for tomorrow?"

If booking successful:
"Great! You're booked as Token #[TOKEN]. Please arrive 10 minutes early. Your appointment is at [TIME]."
```

### Configure Vapi Assistant in Dashboard

1. **Model:** GPT-4
2. **Voice:** Google (Select accent)
3. **System Prompt:** (Copy template above)
4. **Webhook URL:** `https://yourdomain.com/api/vapi/webhook`
5. **Webhook Secret:** (Create random string, store in .env)
6. **Save Assistant**

After saving, you'll get `ASSISTANT_ID` → Save in `.env.local`

---

## 📞 Phone Number Management

### Buy Phone Number from Vapi

1. Go to **Vapi Dashboard → Phone Numbers**
2. Click **"Buy New Number"**
3. Select:
   - Country: India (or target country)
   - Area Code: (Optional)
   - Features: Call & SMS
4. Click **"Purchase"**
5. You'll get a phone number like `+91XXXXXXXXXX`

### Link Phone Number to Assistant

**Option A: Via Dashboard**
1. Go to Phone Numbers
2. Select purchased number
3. Assign to Assistant → Select your assistant
4. Save

**Option B: Via API**
```bash
curl -X POST https://api.vapi.ai/phoneNumber \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+91XXXXXXXXXX",
    "assistantId": "assistant_xyz",
    "name": "Clinic Main Number"
  }'
```

### Store in MongoDB

After buying number, save to clinic:

```javascript
// Backend route: POST /api/admin/assign-number
await Clinic.findByIdAndUpdate(clinicId, {
  assigned_phone_number: "+91XXXXXXXXXX",
  number_status: "ACTIVE",
  vapi_number_id: "phoneNumber_xyz"
}, { new: true });
```

---

## 🧪 Testing

### Test 1: Manual Call
1. Buy a test number from Vapi
2. Call that number from your phone
3. Verify AI answers
4. Check your terminal logs (webhook events)

### Test 2: Webhook Testing
Use Postman or curl to simulate Vapi webhook:

```bash
curl -X POST http://localhost:3000/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "message": {
      "type": "CALL_STARTED",
      "call": {
        "id": "test_call_123",
        "phoneNumber": "+91XXXXXXXXXX",
        "assistantId": "assistant_xyz",
        "startedAt": "2026-10-04T14:30:00Z"
      }
    }
  }'
```

### Test 3: End-to-End
1. Doctor creates clinic in dashboard
2. Admin assigns Vapi number to clinic
3. You call the number
4. AI greets you
5. Book appointment via AI
6. Check MongoDB → appointment saved
7. Doctor sees it in dashboard

---

## 🔐 Security Best Practices

### 1. Validate Webhook Signature
```javascript
// middleware/validateVapiWebhook.ts
import crypto from 'crypto';

export const validateVapiWebhook = (req, res, next) => {
  const signature = req.headers['x-vapi-signature'];
  const body = JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.VAPI_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};
```

### 2. Rate Limiting
```javascript
// api/vapi/webhook.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // limit each IP to 100 requests per windowMs
});

router.post('/api/vapi/webhook', limiter, (req, res) => {
  // Handle webhook
});
```

### 3. Encrypt Sensitive Data
- Never log full phone numbers
- Encrypt API keys
- Use HTTPS only

---

## 🛠️ Troubleshooting

### Issue: "Invalid API Key"
**Solution:** 
- Check .env.local has correct VAPI_API_KEY
- Regenerate key from Vapi dashboard
- Restart dev server

### Issue: Webhook Not Receiving Events
**Solution:**
- Ensure `BACKEND_URL` is publicly accessible (ngrok for dev)
- Check firewall/security groups allow inbound on webhook port
- Verify webhook URL in Vapi dashboard matches exactly
- Check Vapi webhook logs in dashboard

### Issue: AI Not Following Script
**Solution:**
- Refine system prompt (be more specific)
- Use function calls for dynamic data
- Test with simple script first
- Check model selection (GPT-4 recommended)

### Issue: Phone Number Not Working
**Solution:**
- Verify number is ACTIVE in Vapi dashboard
- Check number is linked to correct assistant
- Test call from different number
- Check call logs in Vapi dashboard

### Issue: Appointments Not Saving
**Solution:**
- Add console logs to webhook handler
- Check MongoDB connection
- Verify clinic_id in webhook matches DB
- Check API error responses

---

## 📚 Useful Resources

- **Vapi Docs:** https://docs.vapi.ai
- **Vapi API Reference:** https://api.vapi.ai
- **Vapi Community:** https://discord.gg/vapi
- **Webhook Testing Tool:** https://webhook.site

---

## 📞 Support

- Vapi Support: support@vapi.ai
- Status Page: https://status.vapi.ai
- Twitter: @vapi_ai

---

**Next Step:** Implement webhook handler in backend! 🚀
