#!/usr/bin/env python3
"""
JanVani Python Bridge - Invoked by backend to run Gemini Triage & calculations natively in Python.
"""
import sys
import os
import json

# Ensure parent directory is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from python_janvani.gemini_service import JanVaniGeminiService

def main():
    try:
        raw_input = sys.stdin.read()
        req = json.loads(raw_input) if raw_input else {}
        action = req.get("action", "triage")
        gemini = JanVaniGeminiService()

        if action == "triage":
            text = req.get("text", "")
            img = req.get("image_base64", None)
            lang = req.get("language", "English")
            result = gemini.triage_grievance(text, img, lang)
            print(json.dumps({"success": True, "source": "Python 3.10 Engine", "result": result}))
        elif action == "copilot":
            msg = req.get("message", "")
            lang = req.get("language", "English")
            reply = gemini.chat_copilot(msg, language=lang)
            print(json.dumps({"success": True, "source": "Python 3.10 Engine", "reply": reply}))
        elif action == "rti":
            token = req.get("token", "")
            title = req.get("title", "")
            dept = req.get("department", "")
            days = req.get("days", 15)
            draft = gemini.generate_rti_draft(token, title, dept, days)
            print(json.dumps({"success": True, "source": "Python 3.10 Engine", "draft": draft}))
        else:
            print(json.dumps({"success": True, "source": "Python 3.10 Engine", "message": f"Python bridge active for action '{action}'"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "source": "Python 3.10 Engine"}))

if __name__ == "__main__":
    main()
