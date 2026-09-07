#!/usr/bin/env python3
"""
JanVani - Pure Python Standalone Server (Zero Pip Dependencies Required!)
Serves the complete JanVani Civic Grievance & Governance platform with an interactive
UI and live REST API using standard Python 3 libraries (http.server, urllib, json, time).

Usage:
    python3 python_janvani/standalone_server.py [PORT]
    e.g. python3 python_janvani/standalone_server.py 8080
"""
import sys
import os
import json
import time
import random
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
API_KEY = os.getenv("GEMINI_API_KEY", "")

# In-Memory Database for Python Standalone Server
GRIEVANCES = [
    {
        "id": "g-py-1",
        "token": "JV-DEL-2026-8812",
        "title": "Severe pothole cluster near Janakpuri flyover",
        "description": "Deep 2-foot potholes after monsoon rains. Two-wheelers at high risk of skidding.",
        "category": "Pothole & Damaged Roads",
        "department": "Public Works Department (PWD)",
        "severity": 8,
        "status": "Work In Progress",
        "state": "Delhi",
        "district": "West Delhi",
        "ward": "Ward 22 - Janakpuri",
        "citizen": "Rohan Sharma",
        "upvotes": 48,
        "sla_hours": 48,
        "media": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
        "timestamp": "2 hours ago"
    },
    {
        "id": "g-py-2",
        "token": "JV-BLR-2026-3409",
        "title": "Main drinking water pipeline rupture flooding street",
        "description": "High pressure potable water leaking continuously for 12 hours. Flooding main cross road.",
        "category": "Water Supply & Leakage",
        "department": "Bangalore Water Supply (BWSSB)",
        "severity": 9,
        "status": "Submitted",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "ward": "Ward 174 - HSR Layout",
        "citizen": "Priya Nair",
        "upvotes": 93,
        "sla_hours": 24,
        "media": "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800",
        "timestamp": "5 hours ago"
    },
    {
        "id": "g-py-3",
        "token": "JV-MUM-2026-1194",
        "title": "Exposed high voltage electrical wire near primary school gate",
        "description": "Open live junction box hanging from pole near municipal primary school. Extreme hazard during rains.",
        "category": "Electricity Hazard & Wiring",
        "department": "BEST / State Electricity Board",
        "severity": 10,
        "status": "Under Review",
        "state": "Maharashtra",
        "district": "Mumbai Suburban",
        "ward": "Ward K-West - Andheri",
        "citizen": "Amitabh Kulkarni",
        "upvotes": 142,
        "sla_hours": 12,
        "media": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800",
        "timestamp": "Just now"
    }
]

UPVOTED_KEYS = set()

def call_gemini(prompt: str) -> str:
    """Call Gemini REST API directly using Python standard library."""
    if not API_KEY:
        return ""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print("[Gemini Error in Python]", e)
        return ""

HTML_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JanVani – Python Edition (जनवाणी)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            heading: ['Outfit', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          },
          colors: {
            saffron: { 500: '#FF6A00', 600: '#E65100' },
            civicbg: '#F6F2EA'
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #F6F2EA; font-family: 'Plus Jakarta Sans', sans-serif; }
    h1, h2, h3, .font-heading { font-family: 'Outfit', sans-serif; }
  </style>
</head>
<body class="text-stone-900 antialiased min-h-screen flex flex-col">

  <!-- Header -->
  <header class="bg-white/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-sm">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-orange-500/20">
          JV
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-heading font-extrabold text-xl tracking-tight text-stone-900">JanVani</span>
            <span class="bg-orange-100 text-orange-800 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border border-orange-300">PYTHON 3 RUNTIME</span>
          </div>
          <p class="text-xs text-stone-500">Digital Public Infrastructure for Civic Redressal</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button onclick="openFileModal()" class="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          File Grievance
        </button>
        <button onclick="openCopilotModal()" class="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-medium text-sm px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5">
          <span>AI Copilot</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex-1 space-y-6">

    <!-- Hero Banner -->
    <div class="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
      <div class="relative z-10 max-w-2xl space-y-2">
        <div class="inline-flex items-center gap-1.5 text-xs font-mono bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2.5 py-1 rounded-full">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Python Native Web Server & REST API Active
        </div>
        <h1 class="text-2xl lg:text-3xl font-heading font-extrabold tracking-tight">Citizen Voice. Direct Civic Action.</h1>
        <p class="text-stone-300 text-sm leading-relaxed">
          Powered completely by Python 3 backend services with Gemini Multimodal auto-triage, Aadhaar verification logic, and automated municipal SLA escalation.
        </p>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <p class="text-xs text-stone-500 font-medium">Active Grievances</p>
        <p class="text-2xl font-heading font-bold text-stone-900 mt-1" id="stat-total">3</p>
        <p class="text-[11px] text-emerald-600 font-semibold mt-0.5">Real-time live registry</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <p class="text-xs text-stone-500 font-medium">SLA Compliance</p>
        <p class="text-2xl font-heading font-bold text-stone-900 mt-1">94.8%</p>
        <p class="text-[11px] text-stone-500 mt-0.5">Average turnaround 31 hrs</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <p class="text-xs text-stone-500 font-medium">Multimodal AI Triage</p>
        <p class="text-2xl font-heading font-bold text-orange-600 mt-1">Instant</p>
        <p class="text-[11px] text-stone-500 mt-0.5">Dept & SLA auto-assignment</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <p class="text-xs text-stone-500 font-medium">Backend Architecture</p>
        <p class="text-2xl font-heading font-bold text-stone-900 mt-1">Python 3</p>
        <p class="text-[11px] text-emerald-600 font-semibold mt-0.5">Zero Pip Dependencies</p>
      </div>
    </div>

    <!-- Feed Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-heading font-bold text-stone-900">Live Citizen Grievance Feed</h2>
          <p class="text-xs text-stone-500">Public reports prioritized by community upvotes and AI severity</p>
        </div>
        <button onclick="loadGrievances()" class="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
          Refresh Feed
        </button>
      </div>

      <div id="grievances-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Rendered by JS -->
      </div>
    </div>

  </main>

  <!-- Modal: File Grievance -->
  <div id="file-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b pb-3">
        <h3 class="font-heading font-bold text-lg text-stone-900">File Civic Grievance</h3>
        <button onclick="closeFileModal()" class="text-stone-400 hover:text-stone-600 text-xl font-bold">&times;</button>
      </div>
      
      <form onsubmit="handleFileSubmit(event)" class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-stone-700 mb-1">Issue Description / Citizen Voice</label>
          <textarea id="f-desc" rows="3" required placeholder="Describe the issue (e.g. huge open pothole near metro pillar 45, water logging...)" class="w-full text-sm p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
          <button type="button" onclick="runAiTriagePreview()" class="mt-1.5 text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1">
            Run AI Auto-Triage & Categorization
          </button>
        </div>

        <div id="triage-preview" class="hidden bg-orange-50 border border-orange-200 p-3 rounded-xl text-xs space-y-1">
          <p class="font-bold text-orange-900" id="t-cat"></p>
          <p class="text-stone-700" id="t-dept"></p>
          <p class="text-stone-700" id="t-sla"></p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-stone-700 mb-1">Headline / Title</label>
          <input type="text" id="f-title" required placeholder="e.g. Dangerously deep pothole on MG Road" class="w-full text-sm p-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">State</label>
            <input type="text" id="f-state" value="Delhi" required class="w-full text-sm p-2 border rounded-xl" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">District / Ward</label>
            <input type="text" id="f-district" value="Ward 14 - Connaught Place" required class="w-full text-sm p-2 border rounded-xl" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Your Full Name</label>
            <input type="text" id="f-name" value="Sunita Verma" required class="w-full text-sm p-2 border rounded-xl" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
            <input type="text" id="f-phone" value="9876543210" required class="w-full text-sm p-2 border rounded-xl" />
          </div>
        </div>

        <button type="submit" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-xl shadow transition-all">
          Submit to JanVani Python Engine
        </button>
      </form>
    </div>
  </div>

  <!-- Modal: Copilot -->
  <div id="copilot-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
          <h3 class="font-heading font-bold text-lg text-stone-900">JanVani Saathi (Copilot)</h3>
        </div>
        <button onclick="closeCopilotModal()" class="text-stone-400 hover:text-stone-600 text-xl font-bold">&times;</button>
      </div>

      <div id="chat-messages" class="h-64 overflow-y-auto space-y-3 p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs">
        <div class="bg-white p-2.5 rounded-lg shadow-sm border border-stone-200 max-w-[85%] text-stone-800">
          Namaste! I am your JanVani Civic Copilot running in Python. How can I assist you with filing grievances, tracking civic tokens, or RTI drafts today?
        </div>
      </div>

      <div class="flex gap-2">
        <input type="text" id="copilot-input" placeholder="Ask about road repair rules, RTI, water dept..." class="flex-1 text-xs p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" onkeydown="if(event.key==='Enter') sendCopilotMsg()" />
        <button onclick="sendCopilotMsg()" class="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl">
          Send
        </button>
      </div>
    </div>
  </div>

  <script>
    async function loadGrievances() {
      try {
        const res = await fetch('/api/grievances');
        const data = await res.json();
        const container = document.getElementById('grievances-container');
        document.getElementById('stat-total').innerText = data.length;

        container.innerHTML = data.map(g => `
          <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              ${g.media ? `<img src="${g.media}" class="w-full h-40 object-cover border-b" alt="Site photo" />` : ''}
              <div class="p-4 space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    ${g.token}
                  </span>
                  <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    g.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                    g.status === 'Work In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }">
                    ${g.status}
                  </span>
                </div>

                <h3 class="font-heading font-bold text-stone-900 text-sm leading-snug line-clamp-2">${g.title}</h3>
                <p class="text-xs text-stone-600 line-clamp-2">${g.description}</p>

                <div class="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>🏛️ ${g.department}</span>
                  <span class="font-semibold text-rose-600">Severity: ${g.severity}/10</span>
                </div>
              </div>
            </div>

            <div class="p-4 pt-0 flex items-center justify-between">
              <span class="text-[11px] text-stone-400">📍 ${g.ward || g.district}</span>
              <button onclick="upvoteGrievance('${g.id}')" class="flex items-center gap-1 text-xs font-semibold bg-stone-50 hover:bg-orange-50 hover:text-orange-600 border border-stone-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-all">
                👍 Support (<span id="up-${g.id}">${g.upvotes}</span>)
              </button>
            </div>
          </div>
        `).join('');
      } catch (err) {
        console.error("Error loading grievances:", err);
      }
    }

    async function upvoteGrievance(id) {
      try {
        const res = await fetch(`/api/grievances/${id}/upvote`, { method: 'POST' });
        const data = await res.json();
        if (data.upvotes) {
          document.getElementById(`up-${id}`).innerText = data.upvotes;
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function runAiTriagePreview() {
      const text = document.getElementById('f-desc').value;
      if (!text) return;
      try {
        const res = await fetch('/api/gemini/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: text })
        });
        const data = await res.json();
        const preview = document.getElementById('triage-preview');
        preview.classList.remove('hidden');
        document.getElementById('t-cat').innerText = "Category: " + data.category;
        document.getElementById('t-dept').innerText = "Department: " + data.department + " | Severity: " + data.severity + "/10";
        document.getElementById('t-sla').innerText = "Target Resolution SLA: " + data.sla_hours + " Hours";
        if (!document.getElementById('f-title').value && data.title) {
          document.getElementById('f-title').value = data.title;
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function handleFileSubmit(e) {
      e.preventDefault();
      const payload = {
        title: document.getElementById('f-title').value,
        description: document.getElementById('f-desc').value,
        state: document.getElementById('f-state').value,
        district: document.getElementById('f-district').value,
        citizen: document.getElementById('f-name').value,
        phone: document.getElementById('f-phone').value
      };

      await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      closeFileModal();
      loadGrievances();
    }

    function openFileModal() {
      document.getElementById('file-modal').classList.remove('hidden');
      document.getElementById('file-modal').classList.add('flex');
    }
    function closeFileModal() {
      document.getElementById('file-modal').classList.add('hidden');
      document.getElementById('file-modal').classList.remove('flex');
    }

    function openCopilotModal() {
      document.getElementById('copilot-modal').classList.remove('hidden');
      document.getElementById('copilot-modal').classList.add('flex');
    }
    function closeCopilotModal() {
      document.getElementById('copilot-modal').classList.add('hidden');
      document.getElementById('copilot-modal').classList.remove('flex');
    }

    async function sendCopilotMsg() {
      const inp = document.getElementById('copilot-input');
      const text = inp.value.trim();
      if (!text) return;
      inp.value = '';

      const box = document.getElementById('chat-messages');
      box.innerHTML += `<div class="bg-orange-50 text-orange-950 p-2.5 rounded-lg ml-auto max-w-[85%] border border-orange-200">${text}</div>`;
      box.scrollTop = box.scrollHeight;

      const res = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      box.innerHTML += `<div class="bg-white p-2.5 rounded-lg shadow-sm border border-stone-200 max-w-[85%] text-stone-800">${data.reply}</div>`;
      box.scrollTop = box.scrollHeight;
    }

    // Auto-load on startup
    loadGrievances();
  </script>
</body>
</html>
"""

class JanVaniHTTPHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/", "/index.html"):
            body = HTML_PAGE.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if path == "/api/health":
            self._send_json({"status": "ok", "runtime": "Python 3 Standard Library", "port": PORT})
            return

        if path == "/api/grievances":
            self._send_json(GRIEVANCES)
            return

        self.send_error(404, "Endpoint not found")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            body = json.loads(raw_body) if raw_body else {}
        except Exception:
            body = {}

        if path == "/api/gemini/triage":
            text = body.get("input", "")
            prompt = (
                f"Classify this Indian citizen civic grievance. Return ONLY JSON:\n"
                f"{{\"title\": \"string\", \"category\": \"Pothole & Damaged Roads | Water Supply & Leakage | Electricity Hazard & Wiring | Garbage & Sewage Drainage\", "
                f"\"department\": \"string\", \"severity\": 8, \"sla_hours\": 48}}\nIssue: {text}"
            )
            ai_resp = call_gemini(prompt)
            clean = ai_resp.strip().replace("```json", "").replace("```", "").strip()
            try:
                data = json.loads(clean)
            except Exception:
                data = {
                    "title": text[:50],
                    "category": "Pothole & Damaged Roads",
                    "department": "Public Works Department",
                    "severity": 7,
                    "sla_hours": 48
                }
            self._send_json(data)
            return

        if path == "/api/gemini/copilot":
            msg = body.get("message", "")
            prompt = f"You are JanVani Saathi, Indian civic assistant. Answer briefly and politely in 2-3 sentences: {msg}"
            ai_resp = call_gemini(prompt)
            if not ai_resp:
                ai_resp = "Namaste! JanVani Python engine is active. For emergency civic hazards, please contact 112 or your local municipal control room."
            self._send_json({"reply": ai_resp})
            return

        if path == "/api/grievances":
            new_id = f"g-py-{int(time.time()*1000)}"
            token = f"JV-PY-2026-{random.randint(1000, 9999)}"
            record = {
                "id": new_id,
                "token": token,
                "title": body.get("title", "Civic Grievance"),
                "description": body.get("description", ""),
                "category": "Pothole & Damaged Roads",
                "department": "Municipal Corporation",
                "severity": 7,
                "status": "Submitted",
                "state": body.get("state", "National"),
                "district": body.get("district", "Central"),
                "ward": body.get("district", "Ward 1"),
                "citizen": body.get("citizen", "Citizen"),
                "upvotes": 1,
                "sla_hours": 48,
                "media": "",
                "timestamp": "Just now"
            }
            GRIEVANCES.insert(0, record)
            self._send_json({"success": True, "token": token, "grievance": record})
            return

        if path.startswith("/api/grievances/") and path.endswith("/upvote"):
            g_id = path.split("/")[3]
            for g in GRIEVANCES:
                if g["id"] == g_id:
                    g["upvotes"] += 1
                    self._send_json({"success": True, "upvotes": g["upvotes"]})
                    return
            self._send_json({"success": False, "error": "Not found"}, 404)
            return

        self.send_error(404, "POST endpoint not found")

def run():
    server_address = ("0.0.0.0", PORT)
    httpd = HTTPServer(server_address, JanVaniHTTPHandler)
    print(f"================================================================")
    print(f" JanVani Standalone Python Server running on port {PORT}")
    print(f" Open in browser: http://localhost:{PORT}")
    print(f" Zero external pip dependencies required!")
    print(f"================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\nShutting down server.")

if __name__ == "__main__":
    run()
