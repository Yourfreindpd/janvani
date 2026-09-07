import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Printer,
  Copy,
  Check,
  FileText,
  Building2,
  Shield,
  Loader2,
} from "lucide-react";
import { Grievance, UserProfile } from "../types";

interface RtiModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: Grievance | null;
  currentUser: UserProfile | null;
}

export const RtiModal: React.FC<RtiModalProps> = ({
  isOpen,
  onClose,
  grievance,
  currentUser,
}) => {
  const [rtiText, setRtiText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && grievance) {
      fetchRtiDraft();
    }
  }, [isOpen, grievance]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !grievance) return null;

  const fetchRtiDraft = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/gemini/draft-rti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grievance,
          citizen: currentUser || {
            name: "Praneet Dubey",
            location: "Ward 18, Main Market, Dhar MP",
            aadhaarNumber: "XXXX-XXXX-5060",
          },
        }),
      });
      const data = await res.json();
      if (data.letter) {
        setRtiText(data.letter);
      }
    } catch (e) {
      console.error(e);
      // Fallback legal template
      setRtiText(`FORM 'A'
[See Rule 3(1)]
APPLICATION FOR INFORMATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

To,
The Public Information Officer (PIO) / Commissioner,
${grievance.department},
District: ${grievance.district}, State: ${grievance.state}

1. Full Name of Applicant: ${currentUser?.name || "Praneet Dubey"}
2. Address / Ward: ${grievance.locality}, ${grievance.ward}, ${grievance.district} (${grievance.stateCode})
3. e-Aadhaar Verified ID: ${currentUser?.aadhaarNumber || "XXXX-XXXX-5060"}

SUBJECT: Information regarding Unresolved Civic Grievance Token ${grievance.token} for ${grievance.title}

Sir/Madam,
Under Section 6(1) of the RTI Act 2005, please furnish certified information and copies of public records regarding the following:

1. Certified copy of the daily progress report and file notings from the date of filing (Token: ${grievance.token}) till date.
2. Name, designation, and official contact numbers of the sub-engineers / contractors assigned for the remediation of ${grievance.title}.
3. The sanctioned municipal budget and estimated expenditure allocated for road repair / sanitation in Ward 27 for FY 2025-26.
4. As per the MP Public Services Guarantee Act SLA of 48 Hours, state reasons for non-compliance and details of penal action initiated against defaulting officials under Section 20 of the RTI Act.

I hereby declare that I am a Citizen of India and the application fee of ₹10 is enclosed herewith.

Date: 31 August 2026
Place: ${grievance.district}, ${grievance.state}

Yours Faithfully,
${currentUser?.name || "Praneet Dubey"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rtiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-2xl bg-white/90 dark:bg-[#303030] backdrop-blur-2xl border border-white/80 dark:border-white/[0.08] text-slate-900 dark:text-[#F5F5F5] shadow-2xl overflow-hidden my-auto"
      >
        {/* Subtle orange / purple atmospheric glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A00]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#151515]/90 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">
                  Formal RTI / Jan Sunwai Petition Draft
                </h3>
                <span className="text-[10px] bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/60 px-2 py-0.5 rounded-full font-bold">
                  Section 6(1) RTI Act 2005
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">
                Auto-generated legal petition for Token: <span className="font-mono font-bold text-[#FF6A00] dark:text-[#FF8A00]">{grievance.token}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto relative z-10">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-[#F5F5F5]">
                Drafting Formal Legal Petition with Gemini AI...
              </div>
              <div className="text-xs text-slate-500 dark:text-[#A8A8A8]">
                Extracting jurisdiction, Municipal Acts & RTI statutory clauses
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] p-4 font-mono text-xs text-slate-800 dark:text-[#F5F5F5] leading-relaxed whitespace-pre-wrap selection:bg-[#FF6A00]/30">
              {rtiText}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#151515]/90 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-800 dark:text-[#F5F5F5] text-xs font-bold border border-slate-300 dark:border-white/[0.08] transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#20C997]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied to Clipboard" : "Copy Petition"}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold shadow-md shadow-[#FF6A00]/25 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Application</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-700 dark:text-[#F5F5F5] text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
