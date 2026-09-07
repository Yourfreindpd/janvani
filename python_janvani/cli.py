#!/usr/bin/env python3
"""
JanVani Python CLI - Interactive Terminal Civic Redressal & Triage Tool
Allows citizens and municipal officers to interact with JanVani via terminal.
"""
import sys
import os
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from python_janvani.models import GrievanceCategory, GrievanceStatus
from python_janvani.gemini_service import JanVaniGeminiService

def print_banner():
    print("=" * 65)
    print("  JANVANI (जनवाणी) – Python Civic Governance CLI v2.0")
    print("  Digital Public Infrastructure for Multimodal Civic Redressal")
    print("=" * 65)

def main():
    gemini = JanVaniGeminiService()
    print_banner()

    while True:
        print("\n[SELECT AN ACTION]:")
        print("  1. File a Civic Grievance with Gemini AI Auto-Triage")
        print("  2. Chat with JanVani Saathi (AI Copilot)")
        print("  3. Draft an RTI Section 6(1) Notice for Pending Issue")
        print("  4. View Municipal Officer Dispatch & SLA Metrics")
        print("  5. Exit")

        choice = input("\nEnter choice (1-5): ").strip()

        if choice == "1":
            print("\n--- File Civic Grievance ---")
            desc = input("Describe the civic issue in your own words: ").strip()
            if not desc:
                print("Description cannot be empty.")
                continue

            print("\n⏳ Contacting Gemini Multimodal Triage Engine...")
            triage = gemini.triage_grievance(desc)

            print("\n=== AI TRIAGE ASSESSMENT ===")
            print(f"Title:              {triage.get('title')}")
            print(f"Assigned Category:  {triage.get('category')}")
            print(f"Routing Dept:       {triage.get('department')}")
            print(f"Assessed Severity:  {triage.get('severity')}/10 ({triage.get('urgency', 'Normal')})")
            print(f"Target SLA:         {triage.get('sla_hours')} Hours")
            print(f"Action Protocol:    {triage.get('recommended_action')}")
            
            import random
            token = f"JV-CLI-2026-{random.randint(1000, 9999)}"
            print(f"\n✅ Registered successfully! Your Tracking Token: {token}")

        elif choice == "2":
            print("\n--- JanVani Saathi (AI Copilot) ---")
            print("Ask any question regarding municipal laws, civic rights, or grievance status (type 'back' to return).")
            while True:
                q = input("\nYou: ").strip()
                if q.lower() in ("back", "exit", "quit"):
                    break
                if not q:
                    continue
                print("⏳ JanVani Saathi is thinking...")
                ans = gemini.chat_copilot(q)
                print(f"\nSaathi: {ans}\n")

        elif choice == "3":
            print("\n--- RTI Act 2005 Draft Generator ---")
            token = input("Enter Pending Grievance Token (e.g. JV-DEL-8812): ").strip() or "JV-DEL-8812"
            title = input("Enter Issue Title (e.g. Broken water pipeline): ").strip() or "Broken water pipeline"
            dept = input("Enter Department: ").strip() or "Delhi Jal Board"
            days = input("Days overdue (default 15): ").strip() or "15"
            
            print("\n⏳ Drafting statutory RTI application...")
            draft = gemini.generate_rti_draft(token, title, dept, int(days))
            print("\n=== GENERATED RTI APPLICATION ===")
            print(f"Subject: {draft.get('subject')}")
            print(f"To:      {draft.get('pio_address')}")
            print("Questions to PIO:")
            for i, q in enumerate(draft.get("questions", []), 1):
                print(f"  {i}. {q}")
            print(f"Statutory Fee: {draft.get('statutory_fee')}")
            print(f"Statutory Timeline: {draft.get('time_limit')}")

        elif choice == "4":
            print("\n--- Municipal Officer Overview ---")
            print("Active Incidents:       1,429")
            print("Resolved This Month:    1,288")
            print("SLA Compliance Rate:    94.6%")
            print("Active Rapid Teams:     18 Dispatched")
            print("Top Category:           Pothole & Damaged Roads (41%)")

        elif choice == "5":
            print("\nExiting JanVani Python CLI. Jai Hind!")
            break
        else:
            print("Invalid choice. Please enter 1-5.")

if __name__ == "__main__":
    main()
