import React, { useEffect } from "react";
import { X, PhoneCall, AlertTriangle, Shield, HeartPulse, Flame, Phone } from "lucide-react";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMERGENCY_SERVICES = [
  { name: "National Emergency (ERSS)", number: "112", icon: Shield, color: "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/30 hover:bg-[#FF3B30]/15" },
  { name: "Police Emergency & Control Room", number: "100", icon: Shield, color: "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30 hover:bg-[#3B82F6]/15" },
  { name: "Fire & Rescue Services", number: "101", icon: Flame, color: "text-[#FF6A00] bg-[#FF6A00]/10 border-[#FF6A00]/30 hover:bg-[#FF6A00]/15" },
  { name: "Ambulance & Trauma Medical", number: "108", icon: HeartPulse, color: "text-[#20C997] bg-[#20C997]/10 border-[#20C997]/30 hover:bg-[#20C997]/15" },
  { name: "CM Helpline & Citizen Support", number: "181", icon: Phone, color: "text-purple-500 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/15" },
  { name: "Women National Safety Line", number: "1091", icon: PhoneCall, color: "text-pink-500 bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/15" },
];

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
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

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-white/90 dark:bg-[#303030] backdrop-blur-2xl border border-white/80 dark:border-white/[0.08] shadow-2xl overflow-hidden my-auto p-4 sm:p-6 space-y-4 text-slate-900 dark:text-[#F5F5F5]"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF3B30]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-500 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FF3B30]/15 dark:bg-[#FF3B30]/20 border border-[#FF3B30]/40 flex items-center justify-center text-[#FF3B30] flex-shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">
              National Emergency Helplines (24x7)
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A8A8A8]">
              Government of India Emergency Response Support System (ERSS)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {EMERGENCY_SERVICES.map((srv) => {
            const Icon = srv.icon;
            return (
              <a
                key={srv.number}
                href={`tel:${srv.number}`}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer ${srv.color}`}
              >
                <div>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{srv.name}</div>
                  <div className="text-base font-black font-mono mt-0.5">{srv.number}</div>
                </div>
                <PhoneCall className="w-4 h-4 opacity-80" />
              </a>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-500 dark:text-[#777777] text-center pt-2 border-t border-slate-200 dark:border-white/[0.08]">
          In case of imminent disaster or live wire hazard, dial 112 immediately.
        </div>
      </div>
    </div>
  );
};
