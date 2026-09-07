# JanVani (जनवाणी) – Python Edition

Complete Python conversion of the **JanVani Citizen Civic Grievance & Governance Platform**, featuring Gemini Multimodal auto-triage, WhatsApp Seva integration, and automated municipal work-order dispatch.

---

## 🚀 Quick Start (Zero External Dependencies)

JanVani includes a standalone Python web server that requires **no external packages** and runs on any standard Python 3.10+ runtime:

```bash
# Start standalone server on port 8080 (or any custom port)
python3 python_janvani/standalone_server.py 8080
```
Open your browser at `http://localhost:8080` to access the full interactive civic portal with live grievance submission, upvoting, and Gemini AI auto-triage.

---

## ⚡ Running with FastAPI & Uvicorn (Production)

To run the modern async FastAPI backend:

```bash
# 1. Install dependencies
pip install -r python_janvani/requirements.txt

# 2. Export your Gemini API Key
export GEMINI_API_KEY="your_gemini_api_key_here"

# 3. Start Uvicorn
uvicorn python_janvani.app:app --reload --port 8000
```

Interactive API documentation will be available at:
* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

---

## 💻 Terminal CLI Tool

You can interact with JanVani directly from your terminal:

```bash
python3 -m python_janvani.cli
```

Features in the CLI:
1. **Multimodal AI Auto-Triage**: Input citizen voice descriptions to auto-classify categories, severity scores (1-10), governing departments, and SLAs.
2. **JanVani Saathi (Copilot)**: Interactive conversational assistant for civic advice and statutory rights.
3. **RTI Draft Generator**: Automatically drafts Section 6(1) Right to Information notices for delayed grievances.
4. **Officer Overview**: Inspect real-time SLA compliance and field team dispatches.

---

## 📱 WhatsApp Seva Gateway (Meta Cloud API / Twilio)

The Python service includes full webhook handlers for automated grievance filing via WhatsApp:

* **Endpoint**: `POST /api/whatsapp/webhook`
* **Verification**: `GET /api/whatsapp/webhook`
* **Environment Variables**:
  * `WHATSAPP_VERIFY_TOKEN`: Your custom webhook verification token
  * `WHATSAPP_ACCESS_TOKEN`: Meta WhatsApp Cloud API Bearer token
  * `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp Business Phone ID

---

## 🐳 Docker Deployment

```bash
docker build -t janvani-python -f python_janvani/Dockerfile .
docker run -p 8000:8000 -e GEMINI_API_KEY="your_key" janvani-python
```

---

## 📂 Project Structure

```
python_janvani/
├── app.py                 # Full FastAPI application & API endpoints
├── standalone_server.py   # Zero-dependency Python 3 HTTP server with embedded UI
├── gemini_service.py      # Gemini Multimodal triage, Copilot & RTI generator
├── whatsapp_service.py    # Meta WhatsApp Cloud API & Twilio integration
├── models.py              # Pydantic & dataclass schemas for civic entities
├── cli.py                 # Interactive command-line terminal tool
├── requirements.txt       # Python dependencies
├── Dockerfile             # Container definition for Cloud Run / Docker
└── README.md              # Documentation
```
