# 🚀 Complete Setup Guide: सभी Accounts और APIs

> Step-by-step guide में सभी platforms पर account बनाना और required APIs लेना सीखेंगे।

---

## 📋 सभी Platforms की List

| # | Platform | Purpose | API Key | Cost | Link |
|---|----------|---------|---------|------|------|
| 1 | **Vapi.ai** | AI Voice Assistant | VAPI_API_KEY | Free Trial + Paid | https://vapi.ai |
| 2 | **MongoDB Atlas** | Database | MONGO_URI | Free Tier Available | https://www.mongodb.com/cloud/atlas |
| 3 | **GitHub** | Code Repository | GitHub Token | Free | https://github.com |
| 4 | **Vercel** | Frontend Hosting | Auth Token | Free | https://vercel.com |
| 5 | **Render/Railway** | Backend Hosting | Deploy Token | Free Trial | https://render.com |
| 6 | **SendGrid** | Email Service | API Key | Free 100 emails/day | https://sendgrid.com |

---

## 1️⃣ VAPI.AI SETUP (सबसे Important)

### Step 1: Vapi.ai पर Account बनाएं

**जाएं:** https://vapi.ai

1. Homepage पर **"Sign Up"** button दिखेगा (top-right)
2. Click करो

![Vapi Signup](https://via.placeholder.com/600x300?text=Vapi+Signup)

### Step 2: Account Details भरो

```
Email: तुम्हारा email (example@gmail.com)
Password: Strong password बनाओ (8+ characters, numbers, symbols)
Company Name: AI Receptionist Clinic (optional)
Phone: +91XXXXXXXXXX (भारतीय number)
```

3. **"Create Account"** पर click करो
4. Email check करो - Vapi से verification link आएगी
5. Email में से link पर click करो

### Step 3: Dashboard में Login करो

1. https://vapi.ai पर जाओ
2. **"Sign In"** करो अपने email/password से
3. Dashboard खुल जाएगा

### Step 4: API Key निकालो

**Path:** Dashboard में top-right में अपना profile icon → **"Settings"** → **"API Keys"**

```
Vapi Dashboard
    ↓
Top-right corner में 👤 Profile icon
    ↓
Click करो
    ↓
"Settings" या "Account Settings"
    ↓
Left sidebar में "API Keys"
    ↓
"Create New Key" बटन
    ↓
Name दो: "AI Receptionist Backend"
    ↓
"Create" करो
    ↓
Key दिखेगी: sk_vapi_xxxxxxxxxxxx
    ↓
Copy करके कहीं safe रख
```

#### मिलेगी Key:
```
VAPI_API_KEY = sk_vapi_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Phone Number खरीदो

**Path:** Dashboard → **"Phone Numbers"** → **"Buy Number"**

```
Dashboard खुल जाएगा
    ↓
Left sidebar में "Phone Numbers"
    ↓
Blue button "Buy Phone Number"
    ↓
Select Country: India 🇮🇳
    ↓
Select State/City: (Optional - Delhi, Mumbai, etc.)
    ↓
Number type: Voice + SMS
    ↓
Click "Purchase"
    ↓
Payment (Trial के लिए free हो सकता है)
    ↓
मिलेगा: +91XXXXXXXXXX
```

#### मिलेगी Detail:
```
VAPI_PHONE_NUMBER = +91XXXXXXXXXX
VAPI_PHONE_ID = phoneNumber_xxxxxx
```

### Step 6: Assistant बनाओ

**Path:** Dashboard → **"Assistants"** → **"Create New"**

```
Dashboard खोलो
    ↓
Left sidebar में "Assistants"
    ↓
Blue button "Create Assistant"
    ↓
Fill Details:
  Name: "Clinic Receptionist"
  Description: "AI Voice Receptionist for Doctors"
  Model: "GPT-4" (या latest)
  Voice Provider: "Google" या "OpenAI"
  Language: "English (US)" या "Hindi"
    ↓
System Prompt paste करो (नीचे दिया गया)
    ↓
"Save Assistant"
    ↓
मिलेगा Assistant ID: assistant_xxxxxx
```

#### System Prompt:
```
You are an intelligent clinic receptionist for Dr. [CLINIC_NAME].

Welcome Script:
"Hello! Thank you for calling [CLINIC_NAME]. How can I help you today?"

Your responsibilities:
1. Get patient name and phone number
2. Check clinic status and current waiting time
3. Offer appointment booking if slots available
4. Handle clinic closure gracefully

Be professional, friendly, and concise.
Keep each response under 20 seconds.
```

#### मिलेगा:
```
VAPI_ASSISTANT_ID = assistant_xxxxxx
```

### Step 7: Webhook Setup करो

**Path:** Assistant Settings → **"Webhook"**

```
Dashboard → Assistants → अपना Assistant खोलो
    ↓
Settings tab में "Webhook"
    ↓
Webhook URL भरो:
  https://yourdomain.com/api/vapi/webhook
  
Webhook Events select करो:
  ✓ CALL_STARTED
  ✓ CALL_ENDED
  ✓ SPEECH_UPDATE
  ✓ FUNCTION_CALL
    ↓
"Save"
```

#### मिलेगा:
```
VAPI_WEBHOOK_URL = https://yourdomain.com/api/vapi/webhook
VAPI_WEBHOOK_SECRET = (generate करना होगा backend में)
```

---

## 2️⃣ MONGODB ATLAS SETUP (Database)

### Step 1: MongoDB पर Account बनाओ

**जाएं:** https://www.mongodb.com/cloud/atlas

1. **"Start Free"** button पर click करो
2. या direct https://www.mongodb.com/cloud/atlas/register

### Step 2: Account Details भरो

```
First Name: तुम्हारा नाम
Last Name: सरनेम
Email: example@gmail.com
Password: Strong password (8+ chars)
Company: (Optional)
```

3. **Terms agree** करो
4. **"Create Your Account"** करो

### Step 3: Email Verification

1. Email check करो
2. MongoDB से verification link आएगी
3. Link पर click करो
4. Verify हो जाएगा

### Step 4: MongoDB Dashboard में Login

https://www.mongodb.com/cloud/atlas पर login करो

### Step 5: New Cluster/Project बनाओ

```
Dashboard खुल जाएगा
    ↓
"Create" button या "New Project"
    ↓
Project name: "AI Receptionist"
    ↓
"Create Project"
    ↓
"Create a Deployment" / "Build a Database"
    ↓
Choose: "M0 Cluster" (Free tier)
    ↓
Cloud Provider: AWS
    ↓
Region: ap-south-1 (भारत के लिए)
    ↓
Cluster Name: "clinic-db"
    ↓
"Create Cluster"
    ↓
⏳ 2-3 minutes wait करो (Cluster बन रहा है)
```

### Step 6: Database User (Username/Password) बनाओ

```
Cluster ready हो गया
    ↓
"Database Access" tab
    ↓
"Add New Database User"
    ↓
Username: "clinic_admin"
Password: Strong password generate करो (copy करके रख)
    ↓
"Add User"
    ↓
मिलेगा: Username & Password
```

### Step 7: Connection String निकालो

```
Cluster Dashboard पर जाओ
    ↓
"Connect" button (yellow/blue)
    ↓
"Drivers" select करो
    ↓
Language: "Node.js"
    ↓
Connection String दिखेगी:
mongodb+srv://clinic_admin:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
    ↓
Copy करो
    ↓
<password> की जगह actual password रखो
```

#### मिलेगा:
```
MONGO_URI = mongodb+srv://clinic_admin:PASSWORD@cluster.mongodb.net/clinic_db?retryWrites=true&w=majority
MONGO_USERNAME = clinic_admin
MONGO_PASSWORD = (तुम्हारा password)
```

### Step 8: IP Whitelist करो (Important!)

```
Cluster → Security → Network Access
    ↓
"Add IP Address"
    ↓
Current IP address add करो (या 0.0.0.0/0 सभी के लिए)
    ↓
"Confirm"
```

---

## 3️⃣ GITHUB SETUP (Code Repository)

### Step 1: GitHub Account बनाओ

**जाएं:** https://github.com/signup

```
Email: example@gmail.com
Password: Strong password
Username: aman002175 (तुम्हारा desired username)
    ↓
"Create Account"
    ↓
Email verify करो
```

### Step 2: Repository Exist करता है?

तुम्हारा repository पहले से है: **aman002175/amanbishnoi**

### Step 3: Personal Access Token बनाओ

```
GitHub → Top-right profile icon
    ↓
"Settings"
    ↓
Left sidebar में "Developer settings"
    ↓
"Personal access tokens" → "Tokens (classic)"
    ↓
"Generate new token"
    ↓
Token name: "AI Receptionist Backend"
    ↓
Expiration: 90 days
    ↓
Scopes select करो:
  ✓ repo (full control)
  ✓ workflow
  ✓ admin:repo_hook
    ↓
"Generate token"
    ↓
Token copy करो (बाद में नहीं दिखेगी!)
```

#### मिलेगा:
```
GITHUB_TOKEN = ghp_xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO_URL = https://github.com/aman002175/amanbishnoi
```

---

## 4️⃣ VERCEL SETUP (Frontend Hosting)

### Step 1: Vercel पर Signup करो

**जाएं:** https://vercel.com/signup

```
"Sign up with GitHub" (आसान है)
    ↓
GitHub से authenticate करो
    ↓
अपना नाम/email confirm करो
```

### Step 2: Dashboard में जाओ

https://vercel.com/dashboard

### Step 3: New Project Create करो

```
"Add New..." → "Project"
    ↓
अपना GitHub repository select करो: "amanbishnoi"
    ↓
"Import"
    ↓
Framework: "Next.js"
    ↓
Environment Variables add करो (Optional अभी)
    ↓
"Deploy"
    ↓
⏳ Deploy हो रहा है (2-3 minutes)
    ↓
Deploy link मिलेगा: https://amanbishnoi-aman.vercel.app
```

#### मिलेगा:
```
VERCEL_URL = https://amanbishnoi-aman.vercel.app
VERCEL_DEPLOYMENT_TOKEN = (Dashboard में Generate करो)
```

### Step 4: Custom Domain Add करो (Optional)

```
Project Settings → Domains
    ↓
"Add Domain"
    ↓
Domain name भरो
    ↓
DNS records add करो
```

---

## 5️⃣ RENDER.COM SETUP (Backend Hosting)

### Step 1: Render पर Signup करो

**जाएं:** https://render.com

```
"Sign up" button
    ↓
"Sign up with GitHub" (आसान है)
    ↓
GitHub authorize करो
```

### Step 2: Dashboard में जाओ

https://dashboard.render.com

### Step 3: New Web Service बनाओ

```
Dashboard → "New +"
    ↓
"Web Service"
    ↓
"Connect your repository"
    ↓
GitHub से "amanbishnoi" select करो
    ↓
Service details:
  Name: "ai-receptionist-backend"
  Environment: "Node"
  Build Command: npm install
  Start Command: npm start
    ↓
Environment Variables add करो:
  MONGO_URI = ...
  VAPI_API_KEY = ...
  JWT_SECRET = ...
    ↓
"Create Web Service"
    ↓
⏳ Deploy हो रहा है (3-5 minutes)
    ↓
Backend URL मिलेगा: https://ai-receptionist-backend.onrender.com
```

#### मिलेगा:
```
RENDER_URL = https://ai-receptionist-backend.onrender.com
RENDER_API_KEY = (Dashboard में Generate करो)
```

---

## 6️⃣ SENDGRID SETUP (Email Service)

### Step 1: SendGrid पर Signup करो

**जाएं:** https://sendgrid.com/free

```
Email: example@gmail.com
Password: Strong password
Verify करो
```

### Step 2: API Key Generate करो

```
Dashboard → Settings → "API Keys"
    ↓
"Create API Key"
    ↓
Name: "AI Receptionist"
    ↓
Permissions: "Full Access"
    ↓
"Create & Copy"
    ↓
Key copy करो
```

#### मिलेगा:
```
SENDGRID_API_KEY = SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL = noreply@aireceptionist.com
```

---

## 🎯 Final .env.local File

अब सब कुछ के साथ यह `.env.local` file बना:

```bash
# =========================
# VAPI.AI Configuration
# =========================
VAPI_API_KEY=sk_vapi_xxxxxxxxxxxxxxxxxxxxxxxx
VAPI_ASSISTANT_ID=assistant_xxxxxx
VAPI_PHONE_NUMBER=+91XXXXXXXXXX
VAPI_PHONE_ID=phoneNumber_xxxxxx
VAPI_WEBHOOK_SECRET=your_random_secret_key_12345

# =========================
# MongoDB Configuration
# =========================
MONGO_URI=mongodb+srv://clinic_admin:PASSWORD@cluster.mongodb.net/clinic_db?retryWrites=true&w=majority
MONGO_USERNAME=clinic_admin
MONGO_PASSWORD=PASSWORD

# =========================
# Application Configuration
# =========================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_12345
ADMIN_SECRET_KEY=your_admin_password_12345

# =========================
# GitHub Configuration
# =========================
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=aman002175/amanbishnoi

# =========================
# SendGrid Configuration
# =========================
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@aireceptionist.com

# =========================
# Deployment URLs
# =========================
VERCEL_URL=https://amanbishnoi-aman.vercel.app
RENDER_URL=https://ai-receptionist-backend.onrender.com
BACKEND_WEBHOOK_URL=https://ai-receptionist-backend.onrender.com/api/vapi/webhook
```

---

## ✅ Checklist: क्या-क्या Done करना है

```
Account Setup:
  ☑ Vapi.ai पर signup और API Key निकाली
  ☑ Vapi पर phone number खरीदा
  ☑ Vapi पर Assistant बनाया
  ☑ MongoDB पर signup और database बनाया
  ☑ MongoDB user और connection string निकाला
  ☑ GitHub पर personal access token बनाया
  ☑ Vercel पर frontend deploy किया
  ☑ Render पर backend deploy किया
  ☑ SendGrid पर email API key निकाली
  
Environment Setup:
  ☑ .env.local file बनाई और सभी keys भरीं
  ☑ Local development server चला सकते हो
  ☑ Production URLs configure किए
  
Testing:
  ☑ Vapi API key से API call test किया
  ☑ MongoDB connection string काम कर रहा है
  ☑ Webhook URL publicly accessible है
  ☑ Email sending test किया
```

---

## 🆘 Problems और Solutions

### Problem: Vapi API Key काम नहीं कर रही
**Solution:** 
- API Key सही है या check करो Vapi dashboard से
- नई key generate कर
- .env reload करो (restart server)

### Problem: MongoDB Connection Error
**Solution:**
- Connection string में password सही है?
- IP whitelist में अपना IP है?
- Username/password सही है?
- `?` और `@` का placement सही है?

### Problem: Phone Number नहीं आ रहा
**Solution:**
- Vapi payment method add किया?
- Region select किया सही?
- Recharge करना पड़ सकता है

### Problem: Webhook काम नहीं कर रहा
**Solution:**
- URL publicly accessible है (ngrok use करो local testing के लिए)
- Webhook URL में typo है?
- Server running है?
- Logs check करो

---

## 📞 Support Links

- **Vapi Support:** https://docs.vapi.ai
- **MongoDB Help:** https://docs.mongodb.com
- **Vercel Help:** https://vercel.com/docs
- **Render Help:** https://render.com/docs
- **SendGrid Help:** https://docs.sendgrid.com

---

## 🎓 Next Steps

1. ✅ सभी accounts बना ले
2. ✅ सभी API keys निकाल ले
3. ✅ .env.local file भर दे
4. ✅ Local server run कर
5. ✅ अगली step के लिए आ - Backend API structure बनाएंगे

Kya sab kuch clear ho gaya? Agar kisi step में problem hai toh bata! 🚀
