import React, { useState } from "react";
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  Phone,
  Briefcase,
  MapPin,
  RefreshCw,
  Fingerprint,
} from "lucide-react";
import { UserProfile } from "../types";
import {
  loginUserWithFirebase,
  registerUserWithFirebase,
  loginWithGoogleFirebase,
  sendPasswordResetWithFirebase,
  isFirebaseAvailable,
} from "../lib/firebase";

interface FirebaseSecureAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialRole?: "citizen" | "officer";
}

export const FirebaseSecureAuthModal: React.FC<FirebaseSecureAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = "citizen",
}) => {
  const [activeRole, setActiveRole] = useState<"citizen" | "officer">(initialRole);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [department, setDepartment] = useState("Public Works & Municipal Administration");
  const [designation, setDesignation] = useState("Assistant Engineer (Civil/PHE)");
  const [employeeCode, setEmployeeCode] = useState("MP-PWD-4412");
  const [wardLocation, setWardLocation] = useState("Ward 18 (Main Market / Bus Stand), Dhar (MP)");

  // State flags
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleQuickCredential = (type: "citizen" | "officer") => {
    setActiveRole(type);
    setAuthMode("signin");
    setErrorMessage(null);
    setSuccessNotice(null);
    if (type === "citizen") {
      setEmail("abc@gmail.com");
      setPassword("CitizenPass@2026");
    } else {
      setEmail("officer.rajesh@mp.gov.in");
      setPassword("GovOfficer@Dhar2026");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      if (authMode === "forgot") {
        if (!email) {
          setErrorMessage("Please enter your registered email address.");
          setIsLoading(false);
          return;
        }
        const res = await sendPasswordResetWithFirebase(email);
        if (res.success) {
          setSuccessNotice(res.message);
        } else {
          setErrorMessage(res.message);
        }
        setIsLoading(false);
        return;
      }

      if (authMode === "signup") {
        if (!email || !password) {
          setErrorMessage("Please fill in email and password.");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage("Password must be at least 6 characters.");
          setIsLoading(false);
          return;
        }
        if (password.length > 32) {
          setErrorMessage("Password cannot exceed 32 characters.");
          setIsLoading(false);
          return;
        }
        if (confirmPassword.length > 32) {
          setErrorMessage("Confirm password cannot exceed 32 characters.");
          setIsLoading(false);
          return;
        }

        const initials = (fullName || email.split("@")[0])
          .split(" ")
          .map((n) => n[0]?.toUpperCase() || "")
          .join("")
          .slice(0, 2) || "JV";

        const newProfile: UserProfile = {
          name: fullName || (activeRole === "officer" ? "Nodal Officer" : "Registered Citizen"),
          email: email.trim().toLowerCase(),
          role: activeRole,
          aadhaarNumber: aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` : (activeRole === "officer" ? "XXXX-XXXX-8921" : "XXXX-XXXX-5060"),
          location: wardLocation,
          department: activeRole === "officer" ? department : undefined,
          designation: activeRole === "officer" ? designation : undefined,
          employeeCode: activeRole === "officer" ? employeeCode : undefined,
          avatarText: initials,
          phone: phoneNumber || "+91 98260 00000",
        };

        const res = await registerUserWithFirebase(newProfile, password);
        if (res.success && res.user) {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMessage(res.error || "Registration encountered an issue. Please retry.");
        }
      } else {
        // Sign In Flow
        if (!email || !password) {
          setErrorMessage("Please provide both email and password.");
          setIsLoading(false);
          return;
        }
        if (password.length > 32) {
          setErrorMessage("Password cannot exceed 32 characters.");
          setIsLoading(false);
          return;
        }

        const res = await loginUserWithFirebase(email.trim().toLowerCase(), password, activeRole);
        if (res.success && res.user) {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMessage(res.error || "Authentication failed. Please verify your credentials.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginWithGoogleFirebase(activeRole);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.error || "Google authentication was cancelled or failed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Google sign in error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white/90 dark:bg-[#303030] backdrop-blur-2xl border border-white/80 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-[#F5F5F5]">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A00]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* Modal Header */}
        <div className="relative px-5 sm:px-6 py-4 sm:py-5 bg-slate-50/90 dark:bg-[#151515] border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF8A00] flex items-center justify-center shadow-lg shadow-[#FF6A00]/25 text-white font-bold text-lg flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading tracking-tight">
                  Firebase Secure Portal Authentication
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse"></span>
                  Firebase Auth
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                Statutory Citizen & Official Sign-in with 256-bit Token Encryption
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-500 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Toggle Selector */}
        <div className="p-4 bg-slate-50/70 dark:bg-[#101010]/80 border-b border-slate-200 dark:border-white/[0.08] relative z-10">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setActiveRole("citizen");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRole === "citizen"
                  ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
                  : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-white dark:hover:bg-[#383838]"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Citizen Portal (नागरिक)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole("officer");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRole === "officer"
                  ? "bg-gradient-to-r from-[#3B82F6] to-indigo-600 text-white shadow-md shadow-[#3B82F6]/25"
                  : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-white dark:hover:bg-[#383838]"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Nodal Officer Suite (अधिकारी)</span>
            </button>
          </div>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-3 flex items-center justify-between text-[11px] bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] px-3 py-1.5 rounded-xl">
            <span className="text-slate-500 dark:text-[#A8A8A8] flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6A00] dark:text-[#FF8A00]" />
              Quick autofill for instant login:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickCredential("citizen")}
                className="text-[#FF6A00] dark:text-[#FF8A00] font-bold hover:underline cursor-pointer"
              >
                Autofill Citizen
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => handleQuickCredential("officer")}
                className="text-[#3B82F6] font-bold hover:underline cursor-pointer"
              >
                Autofill Officer
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 relative z-10">
          {/* 1-Click Google Sign In (Firebase Provider) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm transition-all shadow-md border border-slate-200 disabled:opacity-50 cursor-pointer min-h-[42px]"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google (Firebase SSO)</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.08]"></div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-[#777777] uppercase tracking-wider">
              Or use Firebase Secure Credentials
            </span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.08]"></div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-[#FF3B30]/15 border border-red-200 dark:border-[#FF3B30]/30 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-[#FF3B30]">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-[#20C997]/15 border border-emerald-200 dark:border-[#20C997]/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700 dark:text-[#20C997]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Signup extra fields */}
            {authMode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#A8A8A8] mb-1">
                    {activeRole === "officer" ? "Officer Full Name & Designation" : "Full Name (as on Aadhaar/Gov ID)"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={activeRole === "officer" ? "Er. Rajesh Sharma" : "Vinay Dubey"}
                      className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] min-h-[42px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#A8A8A8] mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98263 12345"
                        className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] min-h-[42px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#A8A8A8] mb-1">
                      {activeRole === "officer" ? "Employee Code" : "Aadhaar (Last 4 Digits)"}
                    </label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                      <input
                        type="text"
                        value={activeRole === "officer" ? employeeCode : aadhaarNumber}
                        onChange={(e) =>
                          activeRole === "officer"
                            ? setEmployeeCode(e.target.value)
                            : setAadhaarNumber(e.target.value)
                        }
                        placeholder={activeRole === "officer" ? "MP-PWD-4412" : "XXXX-XXXX-5060"}
                        className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] min-h-[42px]"
                      />
                    </div>
                  </div>
                </div>

                {activeRole === "officer" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#A8A8A8] mb-1">
                      Department / Nodal Agency
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#3B82F6] min-h-[42px]"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#A8A8A8] mb-1">
                {activeRole === "officer" ? "Official Gov Email (gov.in / nic.in)" : "Email Address"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeRole === "officer"
                      ? "officer.rajesh@mp.gov.in"
                      : "abc@gmail.com"
                  }
                  className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] min-h-[42px]"
                />
              </div>
            </div>

            {/* Password Field */}
            {authMode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#A8A8A8]">
                    Password
                  </label>
                  {authMode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("forgot");
                        setErrorMessage(null);
                        setSuccessNotice(null);
                      }}
                      className="text-[11px] text-[#FF6A00] dark:text-[#FF8A00] hover:underline font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={32}
                    value={password}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length > 32) {
                        setErrorMessage("Password cannot exceed 32 characters.");
                      } else if (errorMessage === "Password cannot exceed 32 characters.") {
                        setErrorMessage(null);
                      }
                      setPassword(val.slice(0, 32));
                    }}
                    placeholder="•••••••••••• (max 32 chars)"
                    className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] rounded-xl py-2.5 pl-9 pr-12 text-xs text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] min-h-[42px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-[#777777] hover:text-slate-700 dark:hover:text-[#F5F5F5] cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {password.length >= 28 && (
                  <p className={`text-[11px] mt-1 text-right ${password.length >= 32 ? "text-amber-500 font-semibold" : "text-slate-400"}`}>
                    {password.length}/32 characters {password.length >= 32 ? "(maximum limit reached)" : ""}
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password for Signup */}
            {authMode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#A8A8A8] mb-1">
                  Confirm Password (Max 32 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={32}
                    value={confirmPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length > 32) {
                        setErrorMessage("Confirm password cannot exceed 32 characters.");
                      } else if (errorMessage === "Confirm password cannot exceed 32 characters.") {
                        setErrorMessage(null);
                      }
                      setConfirmPassword(val.slice(0, 32));
                    }}
                    placeholder="•••••••••••• (max 32 chars)"
                    className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] min-h-[42px]"
                  />
                </div>
                {confirmPassword.length >= 28 && (
                  <p className={`text-[11px] mt-1 text-right ${confirmPassword.length >= 32 ? "text-amber-500 font-semibold" : "text-slate-400"}`}>
                    {confirmPassword.length}/32 characters {confirmPassword.length >= 32 ? "(maximum limit reached)" : ""}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm transition-all shadow-lg disabled:opacity-50 cursor-pointer min-h-[44px] ${
                activeRole === "officer"
                  ? "bg-gradient-to-r from-[#3B82F6] via-indigo-600 to-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/30"
                  : "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] shadow-[#FF6A00]/25 text-white"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Securing Firebase Connection...</span>
                </>
              ) : authMode === "signin" ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to {activeRole === "officer" ? "Officer Suite" : "JanVani"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : authMode === "signup" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Firebase Account</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Password Reset Instructions</span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-[#A8A8A8] border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-center gap-2">
            {authMode === "signin" ? (
              <>
                <span>Don't have a statutory account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  className="font-bold text-[#FF6A00] dark:text-[#FF8A00] hover:underline cursor-pointer"
                >
                  Create Firebase Account
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  className="font-bold text-[#FF6A00] dark:text-[#FF8A00] hover:underline cursor-pointer"
                >
                  Return to Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer Security Certifications */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#151515] border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-[10px] text-slate-500 dark:text-[#777777] relative z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#20C997]" />
            <span>Encrypted with SHA-256 & Firebase Authentication SSO</span>
          </div>
          <span className="text-slate-500 dark:text-[#A8A8A8] font-mono">UID #JV-2026-SEC</span>
        </div>
      </div>
    </div>
  );
};
