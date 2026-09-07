import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  User,
  Building2,
  Shield,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { UserProfile } from "../types";
import { loginWithGoogleFirebase } from "../lib/firebase";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  defaultRole?: "citizen" | "officer";
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = "citizen",
}) => {
  const [selectedRole, setSelectedRole] = useState<"citizen" | "officer">(defaultRole);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const res = await loginWithGoogleFirebase(selectedRole);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.error || "Google authentication failed. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred during Google sign-in.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white/95 dark:bg-[#303030] backdrop-blur-2xl text-slate-900 dark:text-[#F5F5F5] shadow-2xl overflow-hidden my-auto border border-white/80 dark:border-white/[0.08]">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6A00]/15 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            {/* Google G SVG */}
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-[#F5F5F5] font-heading leading-tight">Firebase Google Sign-In</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">JanVani National Grievance Portal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-500 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector */}
        <div className="p-4 bg-slate-50 dark:bg-[#151515]/90 border-b border-slate-200 dark:border-white/[0.08] relative z-10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#777777] mb-1.5">
            Select Role / भूमिका चुनें
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole("citizen")}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                selectedRole === "citizen"
                  ? "bg-[#20C997]/15 dark:bg-[#20C997]/20 border-[#20C997] text-[#20C997] shadow-sm shadow-[#20C997]/20"
                  : "bg-white dark:bg-[#303030] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838]"
              }`}
            >
              <User className="w-4 h-4 text-[#20C997] flex-shrink-0" />
              <div>
                <div>Citizen (नागरिक)</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-[#777777]">Public Grievances</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("officer")}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                selectedRole === "officer"
                  ? "bg-[#3B82F6]/15 dark:bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6] shadow-sm shadow-[#3B82F6]/20"
                  : "bg-white dark:bg-[#303030] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838]"
              }`}
            >
              <Building2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
              <div>
                <div>Officer (अधिकारी)</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-[#777777]">Gov / ULB Suite</div>
              </div>
            </button>
          </div>
        </div>

        {/* Action Area */}
        <div className="p-5 space-y-4 relative z-10">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151515]/70 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-600 dark:text-[#A8A8A8] space-y-2">
            <div className="font-semibold text-slate-800 dark:text-[#F5F5F5] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#20C997]" />
              <span>Direct Google Identity Services</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Clicking below opens the official Google OAuth popup powered by Firebase Authentication. Your verified Google name, email, and authentication token will be linked to your JanVani {selectedRole === "officer" ? "Officer" : "Citizen"} profile.
            </p>
          </div>

          <button
            type="button"
            disabled={isAuthenticating}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-xl bg-white dark:bg-[#252525] hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-800 dark:text-[#F5F5F5] font-bold text-xs border border-slate-300 dark:border-white/[0.15] shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer min-h-[46px] disabled:opacity-60"
          >
            {isAuthenticating ? (
              <div className="flex items-center gap-2 text-slate-600 dark:text-[#A8A8A8]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#FF6A00]" />
                <span>Authenticating with Google...</span>
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google as {selectedRole === "officer" ? "Officer" : "Citizen"}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </>
            )}
          </button>
        </div>

        {/* Footer Security Notice */}
        <div className="p-3 bg-slate-50 dark:bg-[#151515]/90 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-[10px] text-slate-500 dark:text-[#777777] relative z-10">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#20C997]" />
            <span>256-Bit SSL Encrypted OAuth</span>
          </div>
          <span>Digital India Standard</span>
        </div>
      </div>
    </div>
  );
};
