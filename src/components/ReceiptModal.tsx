import React, { useEffect } from "react";
import {
  X,
  Printer,
  Building2,
  Lock,
  CheckCircle2,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Sparkles,
} from "lucide-react";
import { Grievance, UserProfile } from "../types";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: Grievance | null;
  currentUser: UserProfile | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  grievance,
  currentUser,
}) => {
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200 print:p-0 print:bg-white print:static"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="print-receipt-paper relative w-full max-w-2xl rounded-2xl bg-white/95 dark:bg-[#303030] backdrop-blur-2xl text-slate-900 dark:text-[#F5F5F5] shadow-2xl overflow-hidden my-auto border border-white/80 dark:border-white/[0.08]"
      >
        {/* Glow effect (hidden in print) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A00]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16 print:hidden" />

        {/* Top Header */}
        <div className="bg-slate-900 dark:bg-[#151515] text-white p-4 flex items-center justify-between border-b border-slate-800 dark:border-white/[0.08] relative z-10 print:bg-white print:text-black print:border-b-2 print:border-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6A00] to-[#FF8A00] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#FF6A00]/25 print:border print:border-black print:text-black print:bg-white">
              JV
            </div>
            <div>
              <div className="text-sm font-bold text-white print:text-black flex items-center gap-1.5">
                <span>JanVani Grievance Redressal Slip</span>
                <span className="text-[10px] bg-[#FF6A00]/20 text-[#FF8A00] border border-[#FF6A00]/30 px-1.5 py-0.5 rounded font-mono print:border-black print:text-black print:bg-white">
                  OFFICIAL
                </span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-[#A8A8A8] print:text-slate-700">Government of India • MoHUA</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 dark:bg-[#383838] hover:bg-slate-700 dark:hover:bg-[#404040] text-slate-300 hover:text-white transition-colors cursor-pointer print:hidden no-print"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Paper Body */}
        <div className="p-6 space-y-5 print:p-4 relative z-10 print:bg-white print:text-black">
          {/* Slip Header */}
          <div className="text-center border-b border-slate-200 dark:border-white/[0.08] pb-4 print:border-b-2 print:border-black">
            <h2 className="text-lg font-black text-slate-900 dark:text-[#F5F5F5] print:text-black uppercase tracking-tight font-heading">
              Official Grievance Acknowledgment
            </h2>
            <div className="text-xs text-slate-500 dark:text-[#A8A8A8] print:text-slate-700 mt-0.5">
              Under Public Services Guarantee Act (लोक सेवा गारंटी अधिनियम 2026)
            </div>
          </div>

          {/* Token & QR row */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#151515]/70 border border-slate-200 dark:border-white/[0.08] print:bg-white print:border print:border-black">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#777777] print:text-black">Tracking Token Number</div>
              <div className="text-base font-black font-mono text-[#FF6A00] dark:text-[#FF8A00] print:text-black mt-0.5">
                {grievance.token}
              </div>
              <div className="text-xs text-slate-600 dark:text-[#A8A8A8] print:text-slate-800 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#FF6A00] print:text-black" />
                <span>Date Filed: {grievance.dateFiled}</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white dark:bg-[#101010] border border-slate-300 dark:border-white/[0.1] rounded-lg p-1 flex items-center justify-center shadow-xs print:border print:border-black print:bg-white">
                <QrCode className="w-12 h-12 text-slate-800 dark:text-[#F5F5F5] print:text-black" />
              </div>
              <span className="text-[9px] text-slate-500 dark:text-[#777777] print:text-black font-mono mt-0.5">SCAN TO TRACK</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-200 dark:border-white/[0.08] print:border print:border-black rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-white/[0.08] print:border-b print:border-black p-2.5 bg-slate-50 dark:bg-[#151515]/90 print:bg-slate-100 font-bold text-slate-700 dark:text-[#F5F5F5] print:text-black">
              <div className="col-span-1">Field</div>
              <div className="col-span-2">Verified Information</div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-white/[0.08] print:border-b print:border-black p-2.5">
              <div className="font-semibold text-slate-500 dark:text-[#A8A8A8] print:text-slate-700">Citizen Name</div>
              <div className="col-span-2 font-bold text-slate-800 dark:text-[#F5F5F5] print:text-black flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997] print:text-black" />
                {grievance.filedByName} (Aadhaar: {grievance.filedByAadhaar})
              </div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-white/[0.08] print:border-b print:border-black p-2.5">
              <div className="font-semibold text-slate-500 dark:text-[#A8A8A8] print:text-slate-700">Grievance Subject</div>
              <div className="col-span-2 text-slate-800 dark:text-[#F5F5F5] print:text-black font-medium">{grievance.title}</div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-white/[0.08] print:border-b print:border-black p-2.5">
              <div className="font-semibold text-slate-500 dark:text-[#A8A8A8] print:text-slate-700">Civic Category</div>
              <div className="col-span-2 text-slate-800 dark:text-[#F5F5F5] print:text-black font-semibold">{grievance.category}</div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-white/[0.08] print:border-b print:border-black p-2.5">
              <div className="font-semibold text-slate-500 dark:text-[#A8A8A8] print:text-slate-700">Jurisdiction / Ward</div>
              <div className="col-span-2 text-slate-800 dark:text-[#F5F5F5] print:text-black">
                {grievance.locality}, {grievance.ward}, {grievance.district} ({grievance.state})
              </div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-white/[0.08] print:border-b print:border-black p-2.5">
              <div className="font-semibold text-slate-500 dark:text-[#A8A8A8] print:text-slate-700">Assigned Department</div>
              <div className="col-span-2 text-slate-800 dark:text-[#F5F5F5] print:text-black">{grievance.department}</div>
            </div>

            <div className="grid grid-cols-3 p-2.5 bg-[#FF6A00]/10 dark:bg-[#FF6A00]/15 print:bg-slate-50">
              <div className="font-semibold text-[#FF6A00] dark:text-[#FF8A00] print:text-black">Target Redressal SLA</div>
              <div className="col-span-2 font-bold text-[#FF6A00] dark:text-[#FF8A00] print:text-black flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#FF6A00] print:text-black" />
                {grievance.targetSlaHours} Hours (Escalation to DM upon expiry)
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-[#777777] print:text-slate-700 text-center leading-relaxed">
            This is an official computer-generated acknowledgment under Digital India Public Infrastructure. No physical signature required.
          </div>
        </div>

        {/* Footer (hidden in print) */}
        <div className="bg-slate-100/90 dark:bg-[#151515] p-4 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between relative z-10 print:hidden no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold shadow-md shadow-[#FF6A00]/25 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Receipt</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-700 dark:text-[#F5F5F5] text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
