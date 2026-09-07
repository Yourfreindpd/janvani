"""
JanVani Python Edition - Gemini Multimodal AI Triage & Copilot Service
Supports both the official google-genai SDK and standard library urllib HTTPS fallback.
"""
import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

class JanVaniGeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = "gemini-3.6-flash"
        self._sdk_client = None

        # Try initializing google-genai SDK if available
        try:
            from google import genai
            if self.api_key:
                self._sdk_client = genai.Client(api_key=self.api_key)
        except Exception:
            self._sdk_client = None

    def _call_gemini_rest(self, prompt: str, image_base64: Optional[str] = None, mime_type: str = "image/jpeg") -> str:
        """Call Gemini API via REST using standard Python urllib (no external dependencies required)."""
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured in environment or passed to service.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        parts = []
        if image_base64:
            clean_b64 = image_base64.split(",")[-1] if "," in image_base64 else image_base64
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": clean_b64
                }
            })
        parts.append({"text": prompt})

        payload = {
            "contents": [
                {
                    "parts": parts
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.95
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode("utf-8"))
                candidates = result.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    return "".join(p.get("text", "") for p in parts)
                return ""
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            raise RuntimeError(f"Gemini API HTTP {e.code}: {err_body}")

    def triage_grievance(self, text: str, image_base64: Optional[str] = None, language: str = "English") -> Dict[str, Any]:
        """
        Multimodal auto-triage of citizen grievances.
        Classifies category, department, severity (1-10), estimated SLA, and action recommendations.
        """
        prompt = f"""You are the JanVani AI Civic Triage Engine for the Government of India.
Analyze the citizen grievance input below and provide a structured JSON response.

Citizen Description:
"{text}"

Preferred Language: {language}

Return ONLY a valid raw JSON object with this exact schema:
{{
  "title": "A crisp, professional headline for the issue (max 10 words)",
  "category": "One of: Pothole & Damaged Roads, Water Supply & Leakage, Garbage & Sewage Drainage, Electricity Hazard & Wiring, Broken Streetlight, Public Health & Sanitation, Other Civic Issue",
  "department": "Governing body (e.g. Public Works Department (PWD), Municipal Corporation, Jal Board, Electricity Board (DISCOM))",
  "severity": 7, // Integer 1-10 (10 = immediate life hazard, 1 = minor cosmetic)
  "urgency": "Low | Medium | High | Critical",
  "sla_hours": 48, // Recommended resolution turnaround in hours
  "summary": "2-sentence clear civic summary of the problem and immediate public hazard",
  "keywords": ["tag1", "tag2", "tag3"],
  "recommended_action": "Initial protocol for the dispatched field officer",
  "duplicate_likelihood_pct": 10
}}
"""
        try:
            raw_text = self._call_gemini_rest(prompt, image_base64)
            # Clean markdown codeblocks
            clean = raw_text.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.startswith("```"):
                clean = clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            return json.loads(clean.strip())
        except Exception as e:
            # Safe civic fallback
            lower = text.lower()
            cat = "Pothole & Damaged Roads"
            dept = "Public Works Department (PWD)"
            sev = 6
            if "water" in lower or "leak" in lower:
                cat = "Water Supply & Leakage"
                dept = "Jal Board / Water Supply Dept"
            elif "garbage" in lower or "waste" in lower or "drain" in lower:
                cat = "Garbage & Sewage Drainage"
                dept = "Municipal Corporation Solid Waste"
            elif "electric" in lower or "wire" in lower or "shock" in lower:
                cat = "Electricity Hazard & Wiring"
                dept = "State Electricity Board (DISCOM)"
                sev = 9
            elif "light" in lower or "dark" in lower:
                cat = "Broken Streetlight"
                dept = "Municipal Electrical Division"

            return {
                "title": text[:60] + "..." if len(text) > 60 else text,
                "category": cat,
                "department": dept,
                "severity": sev,
                "urgency": "High" if sev >= 8 else "Medium",
                "sla_hours": 24 if sev >= 8 else 48,
                "summary": f"Civic issue reported regarding {cat}. Routed to {dept} for inspection.",
                "keywords": ["civic", "grievance", cat.split()[0].lower()],
                "recommended_action": "Field engineer inspection and safety cordoning.",
                "duplicate_likelihood_pct": 5,
                "fallback_mode": True,
                "error": str(e)
            }

    def chat_copilot(self, user_message: str, history: Optional[list] = None, language: str = "English") -> str:
        """Citizen 24x7 Copilot for civic guidance, RTI tracking, and governance rights."""
        system_instruction = (
            "You are JanVani Saathi (जनवाणी साथी), an official, empathetic, and knowledgeable AI Copilot "
            "for citizens of India. Guide citizens on filing civic complaints, tracking municipal work orders, "
            "understanding RTI rights, and accessing government welfare schemes. Keep answers practical, step-by-step, "
            "and polite."
        )
        full_prompt = f"{system_instruction}\nLanguage: {language}\nUser Question: {user_message}\nYour Response:"
        try:
            return self._call_gemini_rest(full_prompt)
        except Exception as e:
            return f"Namaste! JanVani AI Copilot is currently processing your request offline. Regarding '{user_message}': You can track your grievance token directly in the JanVani tracker or call your municipal helpline. Error: {str(e)}"

    def generate_rti_draft(self, grievance_token: str, title: str, department: str, days_pending: int) -> Dict[str, Any]:
        """Generate official Right to Information (RTI) Section 6(1) query draft."""
        prompt = f"""Generate an official Right to Information (RTI) Act 2005 Section 6(1) query draft.
Grievance Token: {grievance_token}
Subject: {title}
Public Authority: {department}
Days Pending: {days_pending} days

Output a JSON object with:
{{
  "subject": "Application under Section 6(1) of RTI Act 2005 regarding...",
  "pio_address": "The Public Information Officer (PIO), {department}",
  "questions": [
    "Certified copy of action taken report (ATR) on grievance token {grievance_token}",
    "Name and designation of officers responsible for inspection and execution",
    "Daily progress report and reasons for delay beyond citizen charter SLA",
    "Certified copies of work orders issued to contractors for this site"
  ],
  "statutory_fee": "Rs 10/- via Indian Postal Order (IPO) or online portal",
  "time_limit": "30 days from receipt of application under Section 7(1)"
}}
"""
        try:
            raw = self._call_gemini_rest(prompt)
            clean = raw.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            return {
                "subject": f"RTI Application under Section 6(1) for Grievance {grievance_token}",
                "pio_address": f"Public Information Officer, {department}",
                "questions": [
                    f"Action Taken Report (ATR) on JanVani token {grievance_token}",
                    "Reasons for non-resolution within Citizen Charter SLA",
                    "Details of funds allocated and contractor appointed"
                ],
                "statutory_fee": "Rs 10/-",
                "time_limit": "30 days"
            }
