import React, { useState } from "react";
import {
  AlertTriangle,
  Trash2,
  Film,
  FileText,
  X,
  ShieldAlert,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Grievance, UserProfile } from "../types";

interface AdminDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: Grievance | null;
  currentUser: UserProfile | null;
  onConfirmDeleteComplaint: (grievanceId: string, reason: string) => Promise<void> | void;
  onConfirmDeleteVideo: (grievanceId: string, reason: string) => Promise<void> | void;
  initialMode?: "all" | "video_only";
}

const PRESET_REASONS = [
  { id: "spam", label: "Duplicate or Spam Report (नकली / दोहराई गई शिकायत)" },
  { id: "inappropriate", label: "Inappropriate or Offensive Media (अनुचित / आपत्तिजनक वीडियो)" },
  { id: "privacy", label: "PII / Privacy Violation (व्यक्तिगत गोपनीयता उल्लंघन)" },
  { id: "test", label: "Internal Testing or Erroneous Entry (परीक्षण / त्रुटिवश प्रविष्टि)" },
  { id: "citizen_request", label: "Citizen Formal Removal Request (नागरिक का हटाने का अनुरोध)" },
  { id: "custom", label: "Other Administrative / Legal Grounds (अन्य विधिक कारण)" },
];

export const AdminDeleteConfirmationModal: React.FC<AdminDeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  grievance,
  currentUser,
  onConfirmDeleteComplaint,
  onConfirmDeleteVideo,
  initialMode = "all",
}) => {
  const [deleteTarget, setDeleteTarget] = useState<"complaint" | "video">(
    initialMode === "video_only" && grievance?.videoUrl ? "video" : "complaint"
  );
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0].label);
  const [customReasonText, setCustomReasonText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen || !grievance) return null;

  const hasVideo = !!grievance.videoUrl;

  const handleExecute = async () => {
    const finalReason =
      selectedReason.startsWith("Other") && customReasonText.trim()
        ? `Custom: ${customReasonText.trim()}`
        : selectedReason;

    setIsProcessing(true);
    try {
      if (deleteTarget === "video") {
        await onConfirmDeleteVideo(grievance.id, finalReason);
      } else {
        await onConfirmDeleteComplaint(grievance.id, finalReason);
      }
      onClose();
    } catch (err) {
      console.error("Admin deletion error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#252525] border border-red-200 dark:border-red-900/50 shadow-2xl overflow-hidden my-auto"
      >
        {/* Top Warning Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white relative overflow-hidden flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">Admin Deletion Control</h3>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono uppercase tracking-wider font-bold">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-red-100 mt-0.5">
                Authorized deletion for compliance, vigilance & data sanitation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-slate-800 dark:text-slate-100">
          {/* Target Grievance Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800/40">
                {grievance.token}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {grievance.category}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
              {grievance.title}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Ward: {grievance.ward}</span>
              <span>•</span>
              <span>Filed by: {grievance.filedByName}</span>
            </div>
          </div>

          {/* Action Scope Selection (If Video is attached) */}
          {hasVideo && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Deletion Scope:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget("complaint")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    deleteTarget === "complaint"
                      ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 ring-2 ring-red-500/20"
                      : "border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#2e2e2e]"
                  }`}
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Purge Entire Complaint</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Deletes full record, timeline & media
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget("video")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    deleteTarget === "video"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                      : "border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#2e2e2e]"
                  }`}
                >
                  <Film className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Remove Video Only</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Clears video, preserves complaint
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Reason Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Administrative Justification (Audit Logged):
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {PRESET_REASONS.map((reason) => (
                <label
                  key={reason.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedReason === reason.label
                      ? "bg-slate-100 dark:bg-white/[0.08] border-orange-500 dark:border-orange-400 font-medium"
                      : "border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteReason"
                    checked={selectedReason === reason.label}
                    onChange={() => setSelectedReason(reason.label)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>

            {selectedReason.startsWith("Other") && (
              <textarea
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                placeholder="Enter statutory reason or administrative order number..."
                rows={2}
                className="mt-2 w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1c1c1c] border border-slate-300 dark:border-white/[0.12] focus:ring-2 focus:ring-red-500 outline-none"
              />
            )}
          </div>

          {/* Audit Notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Audit Trail Notice:</strong> This action will be permanently recorded in the official
              system audit log under admin account <strong>{currentUser?.email || "Super Admin"}</strong>.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#1a1a1a] border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-white dark:bg-[#303030] hover:bg-slate-100 dark:hover:bg-[#383838] text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isProcessing
                ? "Processing..."
                : deleteTarget === "video"
                ? "Confirm: Delete Video Evidence"
                : "Confirm: Delete Entire Complaint"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
