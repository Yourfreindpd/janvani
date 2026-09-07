import React, { useEffect } from "react";
import { X, PhoneCall, Building2, UserCheck, Shield, ExternalLink } from "lucide-react";
import { Grievance } from "../types";

interface CallOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: Grievance | null;
}

export const CallOfficerModal: React.FC<CallOfficerModalProps> = ({
  isOpen,
  onClose,
  grievance,
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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-white/90 dark:bg-[#303030] backdrop-blur-2xl border border-white/80 dark:border-white/[0.08] shadow-2xl overflow-hidden my-auto p-5 text-center space-y-4 text-slate-900 dark:text-[#F5F5F5]"
      >
        {/* Atmospheric Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#20C997]/15 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-500 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-[#20C997]/15 dark:bg-[#20C997]/20 border border-[#20C997]/40 flex items-center justify-center text-[#20C997] mx-auto shadow-lg shadow-[#20C997]/20">
          <PhoneCall className="w-7 h-7 animate-bounce" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">Direct Officer Hotline</h3>
          <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
            Connecting you directly with the assigned nodal engineering department.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] text-left space-y-2">
          <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8] flex items-center justify-between">
            <span>Official:</span>
            <span className="font-bold text-slate-900 dark:text-[#F5F5F5]">{grievance.assignedNodal}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8] flex items-center justify-between">
            <span>Designation:</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{grievance.assignedOfficerTitle}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8] flex items-center justify-between">
            <span>Hotline:</span>
            <span className="font-mono font-bold text-[#20C997]">{grievance.assignedOfficerPhone}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8] flex items-center justify-between">
            <span>Token:</span>
            <span className="font-mono font-bold text-[#FF6A00] dark:text-[#FF8A00]">{grievance.token}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <a
            href={`tel:${grievance.assignedOfficerPhone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#20C997] hover:bg-[#18b385] text-white text-xs font-bold shadow-lg shadow-[#20C997]/30 transition-all cursor-pointer min-h-[42px]"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Now ({grievance.assignedOfficerPhone})</span>
          </a>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-700 dark:text-[#F5F5F5] text-xs font-bold transition-colors cursor-pointer min-h-[42px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
