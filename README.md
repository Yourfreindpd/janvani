# 🇮🇳 JanVani (जनवाणी) — WhatsApp Civic Seva & Nodal Officer Platform

> **Official 24x7 WhatsApp Civic Intake Helpline: `+91 90131 51515`**  
> Automated Civic Grievance Triage, Statutory SLA Tracking & Nodal Governance Suite for Urban & Rural Jurisdictions.

---

## 📋 Table of Contents
1. [Current State vs. Full Live Activation](#1-current-state-vs-full-live-activation)
2. [Why It Is Not Working on Its Fullest Yet](#2-why-it-is-not-working-on-its-fullest-yet)
3. [Method 1: Meta WhatsApp Cloud API Setup (Recommended & Free Tier)](#3-method-1-meta-whatsapp-cloud-api-setup-recommended--free-tier)
4. [Method 2: Twilio WhatsApp Sandbox Setup (Quick 3-Minute Alternative)](#4-method-2-twilio-whatsapp-sandbox-setup-quick-3-minute-alternative)
5. [In-App Testing Without Any External Setup](#5-in-app-testing-without-any-external-setup)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [End-to-End Architecture & Data Flow](#7-end-to-end-architecture--data-flow)
8. [Troubleshooting & Verification Checklist](#8-troubleshooting--verification-checklist)

---

## 1. Current State vs. Full Live Activation

| Feature | In-App / Simulator Mode (Current) | Fullest Live Mode (With API Keys) |
| :--- | :---: | :---: |
| **Interactive Citizen WhatsApp UI** | ✅ Works immediately | ✅ Works immediately |
| **Officer Gateway Intake Simulator** | ✅ Works immediately | ✅ Works immediately |
| **Gemini 3.7 AI Auto-Categorization** | ✅ Active | ✅ Active |
| **Statutory SLA Clock (48h/24h)** | ✅ Active | ✅ Active |
| **Token Generation (`JV-WA-DHAR-2026-XXXX`)** | ✅ Active | ✅ Active |
| **Officer Dashboard Real-time Queue Sync** | ✅ Active | ✅ Active |
| **Real WhatsApp Messages from Physical Smartphones** | ⚠️ Needs Webhook Connection | 🟢 **Fully Connected** |
| **Real WhatsApp SMS Sent Back to Citizen's Phone** | ⚠️ Needs Meta/Twilio Token | 🟢 **Fully Connected** |

---

## 2. Why It Is Not Working on Its Fullest Yet

Right now, **JanVani already has all the backend endpoints, AI parsers, and frontend UI ready**:
- Webhook verification: `GET /api/webhook/whatsapp`
- Inbound message handler: `POST /api/webhook/whatsapp`
- Real-time officer status updates: `POST /api/whatsapp/send-officer-update`
- Telemetry log stream: `GET /api/whatsapp/messages`

However, **WhatsApp is a closed telecom ecosystem owned by Meta**. A web application cannot intercept messages sent from a physical WhatsApp app on a smartphone unless you connect your webhook to an official gateway provider:
1. **Meta WhatsApp Business Cloud API** (Direct from Meta, free tier of 1,000 conversations/month), **OR**
2. **Twilio for WhatsApp** (Developer sandbox with instant setup).

Follow either **Method 1** or **Method 2** below to connect the live gateway in under 10 minutes.

---

## 3. Method 1: Meta WhatsApp Cloud API Setup (Recommended & Free Tier)

Meta provides the **WhatsApp Business Cloud API** with **1,000 free service conversations per month**.

### Step 1: Create a Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com) and log in.
2. Click **My Apps** → **Create App**.
3. Select **Other** → **Business** as the app type.
4. Name your app (e.g., `JanVani-Civic-Seva`) and link your Business Account.

### Step 2: Add WhatsApp Product
1. On the App Dashboard, find **WhatsApp** and click **Set up**.
2. Go to **WhatsApp** → **API Setup** in the left sidebar.
3. You will see:
   - **Temporary Access Token**
   - **Phone number ID** (e.g., `105938472910293`)
   - **WhatsApp Business Account ID**
   - A test phone number provided by Meta.

### Step 3: Configure Webhook in Meta Dashboard
1. Go to **WhatsApp** → **Configuration** in the left sidebar.
2. In the **Webhook** section, click **Edit**:
   - **Callback URL**:  
     ```
     https://<YOUR_APPLET_URL>/api/webhook/whatsapp
     ```
     *(Replace `<YOUR_APPLET_URL>` with your Cloud Run deployment or development URL, e.g., `https://ais-dev-pp2n4b2x2ewuyih6z2plt3-685415530529.asia-southeast1.run.app/api/webhook/whatsapp`)*
   - **Verify Token**:  
     ```
     janvani_secure_token
     ```
     *(Or the custom string you configured in `WHATSAPP_VERIFY_TOKEN`)*
3. Click **Verify and Save**. Meta will send a `GET` request to verify the token. JanVani will respond with `200 OK` and the challenge handshake.
4. Under **Webhook Fields**, click **Manage** and subscribe to:
   - ✅ **`messages`** (Required for receiving incoming citizen chats and photos)

### Step 4: Add Environment Variables in AI Studio
In your AI Studio project **Settings** → **Secrets** (or your `.env` file):

```env
WHATSAPP_VERIFY_TOKEN=janvani_secure_token
WHATSAPP_ACCESS_TOKEN=EAAG...<your_permanent_or_temporary_token>
WHATSAPP_PHONE_NUMBER_ID=<your_phone_number_id>
```

> 💡 **Tip for Permanent Token**: The temporary token expires after 24 hours. To get a permanent token:
> 1. Go to Meta **Business Settings** → **System Users**.
> 2. Create a System User with role **Admin**.
> 3. Assign your WhatsApp App asset to this user.
> 4. Click **Generate New Token** and check `whatsapp_business_messaging` and `whatsapp_business_management`.
> 5. Copy the generated permanent token into `WHATSAPP_ACCESS_TOKEN`.

### Step 5: Test on Your Smartphone
1. In the Meta API Setup page, add your personal WhatsApp phone number to the **Recipient Phone Number** test whitelist.
2. Open WhatsApp on your phone and send a message to the Meta Test Number:
   > *"Station Road ke pas 3 foot ka gadha ho gaya hai, traffic jam lag raha hai Ward 14 me"*
3. Within 2 seconds:
   - JanVani's Gemini AI parses the issue.
   - An auto-reply arrives on your WhatsApp with your **Token ID (`JV-WA-DHAR-2026-XXXX`)**, severity rating, assigned officer, and SLA target.
   - The grievance appears live on the **JanVani Officer Dashboard**!

---

## 4. Method 2: Twilio WhatsApp Sandbox Setup (Quick 3-Minute Alternative)

If you already have a Twilio account, setup takes 3 minutes via the Twilio Sandbox.

### Step 1: Open Twilio WhatsApp Sandbox
1. Go to [console.twilio.com](https://console.twilio.com).
2. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**.
3. You will see a sandbox number (e.g., `+1 415 523 8886`) and a join phrase (e.g., `join proud-eagle`).

### Step 2: Set the Inbound Webhook
1. Go to **Messaging** → **Settings** → **WhatsApp sandbox settings**.
2. Under **"When a message comes in"**:
   - URL: `https://<YOUR_APPLET_URL>/api/webhook/whatsapp`
   - Method: `HTTP POST`
3. Click **Save**.

### Step 3: Add Twilio Environment Variables
In AI Studio **Settings** → **Secrets** (or `.env`):

```env
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Step 4: Test from Your Phone
1. From your WhatsApp, text `join <your-sandbox-code>` to `+1 415 523 8886`.
2. Once connected, text any civic complaint:
   > *"Mandav Road par main water pipeline phat gayi hai, bohot pani barbad ho raha hai"*
3. You will instantly receive the JanVani bot receipt, and the ticket will populate in the Officer Suite.

---

## 5. In-App Testing Without Any External Setup

You do **not** have to wait for Meta verification to test the complete workflow right now! The application has two built-in simulators:

### Option A: Citizen Floating WhatsApp Modal
1. Click the green **WhatsApp Seva** button in the Top Header or the floating bottom-right action button.
2. The modal simulates the exact WhatsApp conversation interface with official branding (`+91 90131 51515`).
3. Type or click one of the quick scenario pills (e.g., *Pipe Burst*, *Pothole Emergency*, *Garbage Dump*).
4. Watch Gemini AI triage the issue, generate the statutory token, and register it directly into the state.

### Option B: Officer Gateway Simulator (Nodal Suite)
1. Switch your role to **Officer / Admin** via the top bar or sidebar.
2. Click the **WhatsApp Gateway** tab.
3. Under **Live WhatsApp Inbound Message Simulator**:
   - Pick a scenario preset or type custom text in Hindi, Hinglish, or English.
   - Click **Send via WhatsApp & Auto-Register on Suite**.
   - Review the parsed severity score, department assignment, and SLA timer.
4. Under **Direct WhatsApp Citizen Messenger**:
   - Enter a citizen's phone number and send an official resolution notice.
   - If Meta/Twilio credentials are set, the message will be delivered to their physical phone!

---

## 6. Environment Variables Reference

Add these variables in AI Studio (`Settings` → `Secrets`) or `.env`:

| Variable | Required For | Description | Example |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | AI Triage | Auto-injected by AI Studio; drives the multimodal civic parser | `AIzaSy...` |
| `APP_URL` | Webhooks | The base public URL of the application | `https://...run.app` |
| `WHATSAPP_VERIFY_TOKEN` | Meta Webhook | Security token used during Meta webhook verification handshake | `janvani_secure_token` |
| `WHATSAPP_ACCESS_TOKEN` | Meta Outbound | Meta System User Bearer token for sending WhatsApp replies | `EAAG...` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Outbound | WhatsApp Cloud API Phone Number ID | `105938472910293` |
| `TWILIO_ACCOUNT_SID` | Twilio Alternative | Twilio Account SID | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio Alternative | Twilio Auth Token | `...` |
| `TWILIO_WHATSAPP_NUMBER` | Twilio Alternative | Twilio WhatsApp sender number | `whatsapp:+14155238886` |

---

## 7. End-to-End Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────┐
│              Citizen's Smartphone (WhatsApp)            │
└───────────────────────────┬─────────────────────────────┘
                            │ (1) Texts civic complaint / sends photo
                            ▼
┌─────────────────────────────────────────────────────────┐
│     Meta WhatsApp Cloud API / Twilio Gateway            │
└───────────────────────────┬─────────────────────────────┘
                            │ (2) Webhook POST
                            ▼
┌─────────────────────────────────────────────────────────┐
│     JanVani Server (/api/webhook/whatsapp)              │
│  - Verifies payload & extracts sender details           │
│  - Calls Gemini 3.7 Flash Multimodal AI                 │
│  - Auto-extracts category, severity, ward & SLA         │
│  - Generates token: JV-WA-DHAR-2026-XXXX                │
└─────────────┬─────────────────────────────┬─────────────┘
              │                             │
              │ (3) Real-time sync          │ (4) Outbound dispatch
              ▼                             ▼
┌───────────────────────────────┐  ┌───────────────────────┐
│  Nodal Officer Suite          │  │  Citizen's WhatsApp   │
│  - Real-time Queue Badge      │  │  - Instant Token SMS  │
│  - 48h SLA Countdown Active   │  │  - Officer Contact    │
│  - Field Squad Work Orders    │  │  - Live Tracking Link │
└───────────────────────────────┘  └───────────────────────┘
```

---

## 8. Troubleshooting & Verification Checklist

1. **Meta Webhook Verification Fails (`403 Forbidden`)**:
   - Ensure the token entered in Meta's Dashboard matches `WHATSAPP_VERIFY_TOKEN` (default: `janvani_secure_token`).
   - Test manually in your browser: `https://<YOUR_APP_URL>/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=janvani_secure_token&hub.challenge=1158201444` → should return `1158201444`.

2. **Inbound Messages Not Showing in Officer Suite**:
   - Verify that you subscribed to the `messages` field in Meta Webhook configuration.
   - Inspect incoming telemetry at `GET /api/whatsapp/messages`.

3. **WhatsApp 24-Hour Customer Care Window**:
   - Meta allows free-form bot replies within **24 hours** of a user sending an inbound message.
   - Since JanVani sends an instant receipt reply to an incoming complaint, it is always within this 24-hour window.
   - For updates sent days later, you can use Meta approved utility templates.

4. **Phone Number Formatting**:
   - Always ensure numbers include country codes in E.164 format (e.g., `+919826377410` or `919826377410`). The parser automatically cleans non-digit characters.

---

*JanVani Civic Platform — Designed for Citizen Transparency & Rapid Municipal Remediation.*
