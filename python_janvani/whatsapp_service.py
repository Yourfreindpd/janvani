"""
JanVani Python Edition - WhatsApp Seva Bot & Webhook Gateway
Supports Meta WhatsApp Cloud API and Twilio WhatsApp gateway for civic complaints.
"""
import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

class WhatsAppService:
    def __init__(self):
        self.verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "janvani_secure_token")
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.twilio_auth = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.twilio_number = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

    def verify_webhook(self, mode: str, token: str, challenge: str) -> Optional[str]:
        """Handles Meta WhatsApp Webhook verification handshake."""
        if mode == "subscribe" and token == self.verify_token:
            return challenge
        return None

    def send_meta_message(self, recipient_phone: str, text: str) -> bool:
        """Sends an outbound WhatsApp message via Meta Cloud API."""
        if not self.access_token or not self.phone_number_id:
            print("[WhatsApp Python] Meta credentials not set. Message simulation:", text)
            return False

        url = f"https://graph.facebook.com/v19.0/{self.phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": recipient_phone,
            "type": "text",
            "text": {"body": text}
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status in (200, 201)
        except Exception as e:
            print("[WhatsApp Python] Error sending Meta message:", e)
            return False

    def process_incoming_payload(self, body: Dict[str, Any], gemini_service) -> Dict[str, Any]:
        """
        Parses incoming WhatsApp webhook payload, classifies civic grievance,
        and generates an auto-acknowledgement with token number.
        """
        # Meta format detection
        entries = body.get("entry", [])
        if entries:
            changes = entries[0].get("changes", [])
            if changes:
                value = changes[0].get("value", {})
                messages = value.get("messages", [])
                if messages:
                    msg = messages[0]
                    from_number = msg.get("from", "unknown")
                    msg_text = msg.get("text", {}).get("body", "")
                    
                    # Run triage
                    triage = gemini_service.triage_grievance(msg_text)
                    import random
                    token = f"JV-WA-{random.randint(10000, 99999)}"
                    
                    reply = (
                        f" Namaste! Your grievance has been registered on JanVani.\n\n"
                        f" Token No: {token}\n"
                        f" Issue: {triage.get('title')}\n"
                        f" Department: {triage.get('department')}\n"
                        f" Severity: {triage.get('severity')}/10\n"
                        f" Target SLA: {triage.get('sla_hours')} Hours\n\n"
                        f"Track online: https://janvani.gov.in/track?token={token}\n"
                        f"Reply 'STATUS {token}' anytime to check updates."
                    )
                    self.send_meta_message(from_number, reply)
                    return {"status": "success", "token": token, "triage": triage, "phone": from_number}

        # Twilio format detection
        body_text = body.get("Body", "")
        from_number = body.get("From", "")
        if body_text and from_number:
            triage = gemini_service.triage_grievance(body_text)
            import random
            token = f"JV-TW-{random.randint(10000, 99999)}"
            return {"status": "success", "token": token, "triage": triage, "phone": from_number}

        return {"status": "ignored", "reason": "No valid text message found"}
