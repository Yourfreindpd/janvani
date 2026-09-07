import React, { useState } from "react";
import {
  Shield,
  Layers,
  Sparkles,
  Lock,
  UserCheck,
  Building2,
  User,
  ArrowRight,
  Fingerprint,
  Mic,
  Camera,
  CheckCircle2,
  X,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  KeyRound,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { UserProfile } from "../types";
import { INITIAL_USER_CITIZEN, INITIAL_USER_OFFICER, STATES_DATA } from "../data/initialData";
import { registerUserWithFirebase, loginUserWithFirebase } from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialRole?: "citizen" | "officer";
  onOpenGoogleAuth?: (role: "citizen" | "officer") => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = "citizen",
  onOpenGoogleAuth,
}) => {
  const [role, setRole] = useState<"citizen" | "officer">(initialRole);
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");

  // Citizen Login State
  const [citizenIdentifier, setCitizenIdentifier] = useState("");
  const [citizenOtpOrPass, setCitizenOtpOrPass] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Citizen Register State
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regState, setRegState] = useState("Madhya Pradesh");
  const [regDistrict, setRegDistrict] = useState("Dhar");
  const [regWard, setRegWard] = useState("Ward 18 (Main Market / Bus Stand)");

  // Officer Login State
  const [officerEmail, setOfficerEmail] = useState("");
  const [officerPass, setOfficerPass] = useState("");
  const [officerGovId, setOfficerGovId] = useState("");

  // Officer Register State
  const [offRegName, setOffRegName] = useState("");
  const [offRegEmail, setOffRegEmail] = useState("");
  const [offRegDept, setOffRegDept] = useState("Public Works & Municipal Administration");
  const [offRegDesignation, setOffRegDesignation] = useState("Assistant Engineer (Civil)");
  const [offRegEmpCode, setOffRegEmpCode] = useState("MP-PWD-4412");
  const [offRegUlb, setOffRegUlb] = useState("Municipal Council Dhar");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoLogin = (targetRole: "citizen" | "officer") => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(
        targetRole === "citizen" ? INITIAL_USER_CITIZEN : INITIAL_USER_OFFICER
      );
      onClose();
    }, 300);
  };

  const handleSendOtp = () => {
    if (!citizenIdentifier) return;
    setIsOtpSent(true);
  };

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (authMode === "register") {
        if (!regName.trim() || !regEmail.trim()) {
          setErrorMessage("Please enter your full name and valid email address.");
          setIsLoading(false);
          return;
        }
        const initials = regName
          .split(" ")
          .map((n) => n[0]?.toUpperCase() || "")
          .join("")
          .slice(0, 2) || "JD";

        const newCitizen: UserProfile = {
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          role: "citizen",
          aadhaarNumber: regAadhaar ? `XXXX-XXXX-${regAadhaar.slice(-4)}` : "XXXX-XXXX-5060",
          location: `${regWard}, ${regDistrict} (${regState})`,
          avatarText: initials,
          phone: regPhone || "+91 98260 00000",
        };

        const res = await registerUserWithFirebase(newCitizen, citizenOtpOrPass || "Pass@1234");
        if (res.success && res.user) {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMessage(res.error || "Registration failed. Please try again.");
        }
      } else {
        if (!citizenIdentifier.trim() || !citizenOtpOrPass.trim()) {
          setErrorMessage("Please enter both registered email and password.");
          setIsLoading(false);
          return;
        }
        if (citizenOtpOrPass.length > 32) {
          setErrorMessage("Password cannot exceed 32 characters.");
          setIsLoading(false);
          return;
        }
        const email = citizenIdentifier.includes("@") ? citizenIdentifier.trim() : `${citizenIdentifier.trim()}@janvani.gov.in`;
        const res = await loginUserWithFirebase(email, citizenOtpOrPass, "citizen");
        if (res.success && res.user) {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMessage(res.error || "Invalid email or password. Please verify credentials or register a new account.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (authMode === "register") {
        if (!offRegName.trim() || !offRegEmail.trim()) {
          setErrorMessage("Please enter officer name and government email address.");
          setIsLoading(false);
          return;
        }
        const initials = offRegName
          .split(" ")
          .map((n) => n[0]?.toUpperCase() || "")
          .join("")
          .slice(0, 2) || "OF";

        const newOfficer: UserProfile = {
          name: offRegName.trim(),
          email: offRegEmail.trim().toLowerCase(),
          role: "officer",
          aadhaarNumber: "XXXX-XXXX-8921",
          department: `${offRegDept} (${offRegUlb})`,
          location: `${offRegUlb}, Dhar (MP)`,
          avatarText: initials,
          phone: "+91 94252 44120",
          employeeCode: offRegEmpCode || "MP-PWD-4412",
          designation: offRegDesignation || "Assistant Engineer (Civil)",
        };

        const res = await registerUserWithFirebase(newOfficer, officerPass || "Gov@Officer2026");
        if (res.success && res.user) {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMessage(res.error || "Officer registration failed.");
        }
      } else {
        if (!officerEmail.trim() || !officerPass.trim()) {
          setErrorMessage("Please enter official email and security password.");
          setIsLoading(false);
          return;
        }
        if (officerPass.length > 32) {
          setErrorMessage("Password cannot exceed 32 characters.");
          setIsLoading(false);
          return;
        }
        const res = await loginUserWithFirebase(officerEmail.trim(), officerPass, "officer");
        if (res.success && res.user) {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMessage(res.error || "Invalid officer credentials.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Officer login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white/90 dark:bg-[#303030] backdrop-blur-2xl border border-white/80 dark:border-white/[0.08] shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-slate-900 dark:text-[#F5F5F5]">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF6A00]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-xl bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-500 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-white transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Pan-India National Ticker */}
        <div className="bg-slate-100 dark:bg-[#151515] border-b border-slate-200 dark:border-white/[0.08] px-4 py-2 text-center text-xs font-bold text-slate-700 dark:text-[#A8A8A8] flex-shrink-0 relative z-10">
          <span className="text-[#FF6A00] dark:text-[#FF8A00] font-bold">JanVani National Portal</span> • Unified Portal for 1.4B Citizens & 4,500+ ULBs
        </div>

        {/* Master Portal Switcher: Citizen vs Officer */}
        <div className="p-3 sm:p-5 bg-slate-50/70 dark:bg-[#101010]/80 border-b border-slate-200 dark:border-white/[0.08] flex-shrink-0 relative z-10">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#777777] mb-2 text-center">
            Select Your Designated Access Portal / प्रवेश पोर्टल चुनें
          </div>
          <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => {
                setRole("citizen");
                setIsOtpSent(false);
              }}
              className={`flex items-center justify-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all min-h-[46px] cursor-pointer ${
                role === "citizen"
                  ? "bg-[#20C997]/15 dark:bg-[#20C997]/20 border-[#20C997] text-[#20C997] shadow-md shadow-[#20C997]/20"
                  : "bg-white dark:bg-[#151515] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838]"
              }`}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#20C997] flex-shrink-0" />
              <div className="text-left">
                <div>Citizen Portal (सार्वजनिक)</div>
                <div className="text-[10px] font-normal text-slate-400 dark:text-[#777777] hidden sm:block">Public Complaints & Schemes</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("officer");
                setIsOtpSent(false);
              }}
              className={`flex items-center justify-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all min-h-[46px] cursor-pointer ${
                role === "officer"
                  ? "bg-[#3B82F6]/15 dark:bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6] shadow-md shadow-[#3B82F6]/20"
                  : "bg-white dark:bg-[#151515] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838]"
              }`}
            >
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6] flex-shrink-0" />
              <div className="text-left">
                <div>Officer Suite (शासकीय)</div>
                <div className="text-[10px] font-normal text-slate-400 dark:text-[#777777] hidden sm:block">Nodal Officers & Municipal Staff</div>
              </div>
            </button>
          </div>
        </div>

        {/* Real Error Message Banner */}
        {errorMessage && (
          <div className="mx-3.5 sm:mx-6 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs sm:text-sm font-medium flex items-center gap-2.5 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-3.5 sm:p-6 overflow-y-auto flex-1 relative z-10">
          {/* Left Column: Info & 1-Click Fast Trial */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="rounded-xl bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FF6A00] dark:text-[#FF8A00] mb-2">
                <Sparkles className="w-4 h-4" />
                <span>{role === "citizen" ? "Public Citizen Rights" : "Officer Redressal Mandate"}</span>
              </div>

              {role === "citizen" ? (
                <ul className="space-y-2 text-xs text-slate-600 dark:text-[#A8A8A8]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997] flex-shrink-0 mt-0.5" />
                    <span>File geo-tagged complaints with Voice AI & photo evidence.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997] flex-shrink-0 mt-0.5" />
                    <span>e-Aadhaar verification ensures anti-spam fast-track SLA (24h-48h).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997] flex-shrink-0 mt-0.5" />
                    <span>Track real-time resolution with before/after dual audit photos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997] flex-shrink-0 mt-0.5" />
                    <span>Generate instant RTI drafts and official receipts.</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-xs text-slate-600 dark:text-[#A8A8A8]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                    <span>Access ward-level 3-tier GIS jurisdiction map.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                    <span>Manage SLA countdown timers & dispatch field work orders.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                    <span>Upload AI Vision verified resolution proof to close tokens.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                    <span>Direct citizen escalation and calling line integration.</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Instant Demo Access Box */}
            <div className="rounded-xl bg-slate-50 dark:bg-[#151515] border border-[#FF6A00]/30 p-3.5 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#FF6A00] dark:text-[#FF8A00] flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4" />
                  1-Click Instant Demo Login
                </span>
                <span className="text-[10px] bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] px-1.5 py-0.5 rounded font-bold">
                  No Password
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#A8A8A8] mb-3">
                Experience the verified portal instantly using preset credentials:
              </p>

              {role === "citizen" ? (
                <button
                  type="button"
                  onClick={() => handleDemoLogin("citizen")}
                  className="w-full p-2.5 rounded-xl bg-[#20C997]/10 hover:bg-[#20C997]/20 border border-[#20C997]/40 text-left transition-all group flex items-center justify-between min-h-[44px] cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#20C997]">
                      Citizen Demo: Praneet Dubey
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#A8A8A8]">Ward 18 (Main Market), Dhar MP (Aadhaar Verified)</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#20C997] group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDemoLogin("officer")}
                  className="w-full p-2.5 rounded-xl bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-left transition-all group flex items-center justify-between min-h-[44px] cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#3B82F6]">
                      Officer Demo: Er. Rajesh Sharma
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#A8A8A8]">AE Civil, Municipal Council Dhar</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#3B82F6] group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

            {/* Google Quick Sign-In Option */}
            <div className="rounded-xl bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] p-3">
              <button
                type="button"
                onClick={() => {
                  if (onOpenGoogleAuth) {
                    onOpenGoogleAuth(role);
                  } else {
                    handleDemoLogin(role);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm border border-slate-200 transition-all min-h-[44px] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google Account</span>
              </button>
            </div>
          </div>

          {/* Right Column: Forms for Citizen or Officer */}
          <div className="lg:col-span-7 rounded-xl bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] p-4 sm:p-5">
            {/* Mode Switcher: Sign In vs Register */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-[#303030] p-1 rounded-xl mb-4 border border-slate-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[38px] cursor-pointer ${
                  authMode === "signin"
                    ? "bg-white dark:bg-[#151515] text-slate-900 dark:text-[#F5F5F5] shadow-sm"
                    : "text-slate-500 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
                }`}
              >
                Sign In (प्रवेश)
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[38px] cursor-pointer ${
                  authMode === "register"
                    ? "bg-white dark:bg-[#151515] text-slate-900 dark:text-[#F5F5F5] shadow-sm"
                    : "text-slate-500 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
                }`}
              >
                Register Account (नया पंजीकरण)
              </button>
            </div>

            {/* 1. CITIZEN FORMS */}
            {role === "citizen" && (
              <>
                {authMode === "signin" ? (
                  <form onSubmit={handleCitizenSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#A8A8A8] uppercase mb-1">
                        Mobile Number / Email / 12-Digit Aadhaar
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                        <input
                          type="text"
                          required
                          value={citizenIdentifier}
                          onChange={(e) => setCitizenIdentifier(e.target.value)}
                          placeholder="e.g. +91 98263 12345 or abc@gmail.com"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#20C997] min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-[#A8A8A8] uppercase">
                          Password or e-Aadhaar OTP
                        </label>
                        {!isOtpSent ? (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-[11px] font-bold text-[#20C997] hover:underline cursor-pointer"
                          >
                            Send OTP to Mobile
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#20C997] font-bold">
                            OTP Sent (Use 123456 for demo)
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                        <input
                          type="password"
                          required
                          maxLength={32}
                          value={citizenOtpOrPass}
                          onChange={(e) => setCitizenOtpOrPass(e.target.value.slice(0, 32))}
                          placeholder={isOtpSent ? "Enter 6-digit OTP (e.g. 123456)" : "Enter your password / OTP (max 32 chars)"}
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#20C997] min-h-[44px]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#20C997] to-teal-600 hover:from-[#1bb386] hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#20C997]/25 transition-all min-h-[44px] cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Sign In to Citizen Portal</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCitizenSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] block mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Vinay Dubey"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] block mb-1">Mobile Number</label>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+91 98263 12345"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] block mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="abc@gmail.com"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] block mb-1">12-Digit Aadhaar No.</label>
                        <input
                          type="text"
                          value={regAadhaar}
                          onChange={(e) => setRegAadhaar(e.target.value)}
                          placeholder="XXXX-XXXX-5060"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#777777] block mb-1">State / UT</label>
                        <select
                          value={regState}
                          onChange={(e) => setRegState(e.target.value)}
                          className="w-full px-2 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[38px]"
                        >
                          {STATES_DATA.slice(0, 10).map((st) => (
                            <option key={st.code} value={st.name}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#777777] block mb-1">District</label>
                        <select
                          value={regDistrict}
                          onChange={(e) => setRegDistrict(e.target.value)}
                          className="w-full px-2 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[38px]"
                        >
                          <option value="Dhar">Dhar</option>
                          <option value="Indore">Indore</option>
                          <option value="Bhopal">Bhopal</option>
                          <option value="Mumbai Suburban">Mumbai</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#777777] block mb-1">Ward / Area</label>
                        <input
                          type="text"
                          value={regWard}
                          onChange={(e) => setRegWard(e.target.value)}
                          placeholder="Ward 27"
                          className="w-full px-2 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[38px]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#20C997] to-teal-600 hover:from-[#1bb386] hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#20C997]/25 transition-all min-h-[44px] cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Register & Link e-Aadhaar</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* 2. OFFICER FORMS */}
            {role === "officer" && (
              <>
                {authMode === "signin" ? (
                  <form onSubmit={handleOfficerSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#A8A8A8] uppercase mb-1">
                        Government / NIC Email Address (@gov.in / @nic.in)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                        <input
                          type="email"
                          required
                          value={officerEmail}
                          onChange={(e) => setOfficerEmail(e.target.value)}
                          placeholder="e.g. rajesh.sharma@mp.gov.in or officer@nic.in"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#3B82F6] min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-[#A8A8A8] uppercase block mb-1">
                          Officer / Parichay Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                          <input
                            type="password"
                            required
                            maxLength={32}
                            value={officerPass}
                            onChange={(e) => setOfficerPass(e.target.value.slice(0, 32))}
                            placeholder="•••••••••••• (max 32 chars)"
                            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#3B82F6] min-h-[44px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-[#A8A8A8] uppercase block mb-1">
                          Gov Employee Code (Optional)
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
                          <input
                            type="text"
                            value={officerGovId}
                            onChange={(e) => setOfficerGovId(e.target.value)}
                            placeholder="e.g. MP-PWD-4412"
                            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#3B82F6] min-h-[44px]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#3B82F6]/25 transition-all min-h-[44px] cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4" />
                          <span>Login to Officer Administration Suite</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOfficerSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] block mb-1">Officer Full Name</label>
                        <input
                          type="text"
                          required
                          value={offRegName}
                          onChange={(e) => setOffRegName(e.target.value)}
                          placeholder="e.g. Er. Rajesh Sharma"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] block mb-1">Govt / Official Email</label>
                        <input
                          type="email"
                          required
                          value={offRegEmail}
                          onChange={(e) => setOffRegEmail(e.target.value)}
                          placeholder="rajesh.sharma@mp.gov.in"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] block mb-1">Official Designation</label>
                        <input
                          type="text"
                          required
                          value={offRegDesignation}
                          onChange={(e) => setOffRegDesignation(e.target.value)}
                          placeholder="e.g. Assistant Engineer (Civil)"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] block mb-1">Employee Code / Parichay ID</label>
                        <input
                          type="text"
                          required
                          value={offRegEmpCode}
                          onChange={(e) => setOffRegEmpCode(e.target.value)}
                          placeholder="MP-PWD-4412"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] block mb-1">Municipal Body / ULB / Department</label>
                      <input
                        type="text"
                        required
                        value={offRegUlb}
                        onChange={(e) => setOffRegUlb(e.target.value)}
                        placeholder="Nagar Palika Parishad Dhar / PWD Division"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#3B82F6]/25 transition-all min-h-[44px] cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Register Officer Credential</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer info strip */}
        <div className="p-3 bg-slate-50 dark:bg-[#151515] border-t border-slate-200 dark:border-white/[0.08] text-[11px] text-slate-500 dark:text-[#777777] flex flex-wrap items-center justify-between gap-2 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#20C997]" />
            <span>Ministry of Housing and Urban Affairs • Government of India</span>
          </div>
          <span>Digital Personal Data Protection (DPDP) Act 2023 Compliant</span>
        </div>
      </div>
    </div>
  );
};
