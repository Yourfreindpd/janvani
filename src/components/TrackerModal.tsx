import React, { useEffect } from "react";
import {
  X,
  Printer,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Camera,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Grievance, UserProfile } from "../types";
import { Translations } from "../data/translations";
import { handleCivicImageError } from "../utils/imageHelper";

interface TrackerModalProps {
  grievance: Grievance | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintReceipt: (grievance: Grievance) => void;
  onDraftRti: (grievance: Grievance) => void;
  onCallOfficer: (grievance: Grievance) => void;
  t: Translations;
  currentUser: UserProfile | null;
}

export const TrackerModal: React.FC<TrackerModalProps> = ({
  grievance,
  isOpen,
  onClose,
  onPrintReceipt,
  onDraftRti,
  onCallOfficer,
  t,
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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2 p-3 sm:p-5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#151515] flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6A00]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 flex-wrap min-w-0 relative z-10">
            <span className="px-2.5 py-1 rounded-lg bg-[#FF6A00]/15 text-[#FF8A00] border border-[#FF6A00]/30 font-mono text-xs font-bold">
              {grievance.token}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FF6A00]/15 text-[#FF8A00] border border-[#FF6A00]/30 flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-ping flex-shrink-0"></span>
              <span className="truncate">{grievance.status}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 relative z-10">
            <button
              onClick={() => onPrintReceipt(grievance)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#383838] hover:bg-slate-100 dark:hover:bg-[#404040] text-xs font-bold text-slate-800 dark:text-[#F5F5F5] border border-slate-200 dark:border-white/[0.08] transition-colors min-h-[38px] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span className="hidden sm:inline">{t.printReceipt}</span>
              <span className="sm:hidden">Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-[#383838] hover:bg-slate-100 dark:hover:bg-[#404040] text-slate-500 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] border border-slate-200 dark:border-white/[0.08] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Header Metadata Strip */}
        <div className="px-3 sm:px-6 py-2.5 bg-slate-100/80 dark:bg-[#383838] border-b border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 dark:text-[#A8A8A8] flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-[#F5F5F5]">
              <MapPin className="w-3.5 h-3.5 text-[#FF6A00] flex-shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-none">{grievance.locality}, {grievance.ward}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#A8A8A8]">
              <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#777777] flex-shrink-0" />
              <span className="truncate max-w-[180px] sm:max-w-none">{grievance.department}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#FF8A00] bg-[#FF6A00]/15 px-2 py-0.5 rounded border border-[#FF6A00]/30">
            <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>SLA: {grievance.targetSlaHours}h Target</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-3 sm:p-6 space-y-5 overflow-y-auto flex-1 bg-white dark:bg-[#303030]">
          {/* Grievance Title & Summary */}
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-[#F5F5F5] leading-tight">
              {grievance.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-[#A8A8A8] leading-relaxed">
              {grievance.description}
            </p>
          </div>

          {/* Photo Evidence (Before / After if resolved) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#151515]">
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-[#151515] border-b border-slate-200 dark:border-white/[0.08] text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] flex items-center justify-between">
                <span>Citizen Photo Proof (Filing Date)</span>
                <span className="text-[10px] text-[#FF8A00]">Geo-Tagged</span>
              </div>
              <img
                src={grievance.imageUrl}
                alt="Grievance proof"
                onError={(e) => handleCivicImageError(e, grievance.category)}
                className="w-full h-36 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#151515] flex flex-col">
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-[#151515] border-b border-slate-200 dark:border-white/[0.08] text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] flex items-center justify-between">
                <span>Field Resolution Proof</span>
                <span className={`text-[10px] font-bold ${grievance.resolvedImageUrl ? "text-[#20C997]" : "text-[#FF8A00]"}`}>
                  {grievance.resolvedImageUrl ? "Dual-Audit Certified" : "Work In Progress"}
                </span>
              </div>
              {grievance.resolvedImageUrl ? (
                <img
                  src={grievance.resolvedImageUrl}
                  alt="Resolved proof"
                  onError={(e) => handleCivicImageError(e, "resolved")}
                  className="w-full h-36 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-slate-100/50 dark:bg-[#151515]/60 min-h-[120px]">
                  <Camera className="w-7 h-7 text-slate-400 dark:text-[#777777] mb-1.5" />
                  <div className="text-xs font-semibold text-slate-600 dark:text-[#A8A8A8]">AI Vision Inspection Pending</div>
                  <div className="text-[10px] text-slate-400 dark:text-[#777777] mt-0.5">Assigned engineer will upload post-remediation proof</div>
                </div>
              )}
            </div>
          </div>

          {/* Grievance Redressal Audit Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#FF6A00]" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F5F5F5] uppercase tracking-wider">
                Grievance Redressal Audit Timeline
              </h3>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/[0.08]">
              {grievance.timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  {/* Status Node Circle */}
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                    event.status === "completed"
                      ? "bg-[#20C997] border-[#20C997] text-white"
                      : event.status === "current"
                      ? "bg-[#FF6A00] border-[#FF8A00] text-white animate-pulse"
                      : "bg-slate-200 dark:bg-[#151515] border-slate-300 dark:border-white/[0.08] text-slate-400"
                  }`}>
                    {event.status === "completed" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="rounded-xl bg-slate-50 dark:bg-[#404040]/70 border border-slate-200 dark:border-white/[0.08] p-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-1.5 flex-wrap">
                        <span>{event.title}</span>
                        {event.verifiedBadge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-[#20C997]/15 text-emerald-800 dark:text-[#20C997] border border-emerald-300 dark:border-[#20C997]/30 flex items-center gap-1 font-bold">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            {event.verifiedBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-[#777777]">{event.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-[#A8A8A8]">{event.description}</p>

                    {event.officerOrEntity && (
                      <div className="mt-1.5 text-[11px] text-slate-500 dark:text-[#777777] flex items-center gap-1">
                        <span>Action by:</span>
                        <span className="font-semibold text-slate-700 dark:text-[#F5F5F5]">{event.officerOrEntity}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Field Officer Card */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#404040]/80 border border-slate-200 dark:border-white/[0.08] p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#FF6A00]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A00] mb-2 relative z-10">
              Assigned Field Officer & Escalation Authority
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#20C997] flex-shrink-0" />
                  <span>{grievance.assignedNodal}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-[#A8A8A8] mt-0.5">{grievance.assignedOfficerTitle}</div>
                <div className="text-[11px] text-slate-400 dark:text-[#777777] mt-0.5">
                  Municipal Council / Nagar Palika Dhar (MP)
                </div>
              </div>

              <button
                type="button"
                onClick={() => onCallOfficer(grievance)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#20C997] to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition-all flex-shrink-0 min-h-[44px] cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Officer ({grievance.assignedOfficerPhone})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-5 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#151515] flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => onDraftRti(grievance)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-[#404040] hover:bg-purple-100 dark:hover:bg-[#4a4a4a] border border-purple-200 dark:border-white/[0.08] text-purple-700 dark:text-[#F5F5F5] text-xs font-bold transition-all min-h-[44px] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-[#FF8A00]" />
            <span>{t.draftRti}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-800 dark:text-[#F5F5F5] font-bold text-xs border border-transparent dark:border-white/[0.08] transition-colors min-h-[44px] cursor-pointer"
          >
            {t.closeTracker}
          </button>
        </div>
      </div>
    </div>
  );
};
