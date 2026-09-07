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
  ArrowRight,
  Sparkles,
  Phone,
  Briefcase,
  MapPin,
  Fingerprint,
  Globe,
  HelpCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
} from "lucide-react";
import { UserProfile, LanguageOption } from "../types";
import {
  loginUserWithFirebase,
  registerUserWithFirebase,
  loginWithGoogleFirebase,
  sendPasswordResetWithFirebase,
} from "../lib/firebase";
import { INITIAL_USER_CITIZEN, INITIAL_USER_OFFICER, LANGUAGES } from "../data/initialData";
import { Translations } from "../data/translations";

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  currentLanguage: LanguageOption;
  onOpenLanguageModal: () => void;
  onOpenEmergency: () => void;
  t: Translations;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  currentLanguage,
  onOpenLanguageModal,
  onOpenEmergency,
  t,
}) => {
  const [activeRole, setActiveRole] = useState<"citizen" | "officer">("citizen");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [locality, setLocality] = useState("Main Market / Sector 2");
  const [district, setDistrict] = useState("Dhar (MP)");
  const [department, setDepartment] = useState("Public Works Department (PWD)");
  const [designation, setDesignation] = useState("Assistant Engineer (Civil/PHE)");
  const [employeeCode, setEmployeeCode] = useState("MP-PWD-4412");

  // State flags
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleDirectDemoLogin = (role: "citizen" | "officer") => {
    const user = role === "citizen" ? INITIAL_USER_CITIZEN : INITIAL_USER_OFFICER;
    onLoginSuccess(user);
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
        if (!fullName.trim()) {
          setErrorMessage("Please provide your full legal name.");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage("Password must be at least 6 characters long.");
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
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.");
          setIsLoading(false);
          return;
        }

        const profile: UserProfile = {
          name: fullName,
          email,
          role: activeRole,
          phone: phoneNumber || "+91 98260 00000",
          aadhaarNumber: activeRole === "citizen" ? `XXXX-XXXX-${aadhaarNumber.slice(-4) || "8914"}` : "XXXX-XXXX-9921",
          location: activeRole === "citizen" ? `${locality}, ${district}` : "Ward 18 (Main Market), Dhar (MP)",
          department: activeRole === "officer" ? department : undefined,
          designation: activeRole === "officer" ? designation : undefined,
          employeeCode: activeRole === "officer" ? employeeCode : undefined,
          avatarText: fullName.slice(0, 2).toUpperCase() || "JV",
        };

        const res = await registerUserWithFirebase(profile, password);

        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMessage(res.error || "Registration failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // SIGN IN
      if (!email || !password) {
        setErrorMessage("Please fill in both email and password.");
        setIsLoading(false);
        return;
      }
      if (password.length > 32) {
        setErrorMessage("Password cannot exceed 32 characters.");
        setIsLoading(false);
        return;
      }

      const res = await loginUserWithFirebase(email, password, activeRole);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || "Invalid credentials. Please verify your details.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginWithGoogleFirebase(activeRole);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || "Google Sign-In was not completed. Please try again or use the explicit demo buttons below.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Google sign in encountered an issue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAF7F2] dark:bg-[#101010] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#FF6A00] selection:text-white relative">
      {/* Atmospheric Ambient Glow Orbs */}
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-radial from-[#FF6A00]/15 to-transparent blur-[80px] pointer-events-none -z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[350px] bg-radial from-[#FF8A00]/12 to-transparent blur-[80px] pointer-events-none -z-0" />

      {/* Top Header Strip */}
      <header className="relative z-10 border-b border-[#e4dcce] dark:border-white/[0.08] bg-white/70 dark:bg-[#151515]/80 backdrop-blur-xl px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between min-w-0 w-full">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Authentic JanVani Logo */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#FF6A00] via-[#FF8A00] to-emerald-600 p-[2px] shadow-md shadow-orange-500/20 flex-shrink-0">
            <div className="w-full h-full bg-white dark:bg-[#101010] rounded-[10px] flex items-center justify-center">
              <span className="text-sm sm:text-base font-black text-[#FF6A00] dark:text-white tracking-tighter">जन</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-heading">JanVani</span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] border border-orange-200 dark:border-[#FF6A00]/30 font-bold">
                2026
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase truncate block max-w-[180px] sm:max-w-none">
              Digital India • MoHUA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Language Selector */}
          <button
            type="button"
            onClick={onOpenLanguageModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#111111]/80 border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-[#FF6A00]/40 transition-colors min-h-[36px] shadow-xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span className="hidden sm:inline">{currentLanguage.native}</span>
            <span className="sm:hidden text-[10px] font-bold">{currentLanguage.code.toUpperCase()}</span>
          </button>

          {/* Emergency 112 */}
          <button
            type="button"
            onClick={onOpenEmergency}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-xs font-bold text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors min-h-[36px] shadow-xs cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
            <span>112</span>
          </button>
        </div>
      </header>

      {/* Main Center Auth Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-10 min-w-0 w-full max-w-full">
        <div className="w-full max-w-xl bg-white/85 dark:bg-[#151515]/90 backdrop-blur-2xl border border-white/90 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_20px_50px_-10px_rgba(200,170,140,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Decorative Inner Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-radial from-[#FF6A00]/15 to-transparent blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-radial from-[#FF8A00]/10 to-transparent blur-2xl pointer-events-none -ml-16 -mb-16" />

          <div className="relative z-10 space-y-5 sm:space-y-6">
            {/* Header Text */}
            <div className="text-center space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-[#FF6A00]/15 border border-orange-200 dark:border-[#FF6A00]/30 text-orange-700 dark:text-[#FF8A00] text-xs font-bold">
                  <Shield className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>Statutory Citizen Redressal</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Firebase Auth Connected</span>
                </div>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                {authMode === "signup"
                  ? activeRole === "citizen"
                    ? "Citizen Registration"
                    : "Nodal Officer Onboarding"
                  : authMode === "forgot"
                  ? "Reset Account Password"
                  : activeRole === "citizen"
                  ? "Citizen Portal Login"
                  : "Nodal Officer Portal Login"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {authMode === "signup"
                  ? "Create your statutory profile with e-Aadhaar verification to report civic grievances and track 48-hour SLAs."
                  : "Sign in to access your ward dashboard, live grievance tracking, and certified remediation audits."}
              </p>
            </div>

            {/* Role Selection Tabs (Citizen vs Nodal Officer) */}
            {authMode !== "forgot" && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRole("citizen");
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] cursor-pointer ${
                    activeRole === "citizen"
                      ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{t.citizenRole || "Citizen (नागरिक)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveRole("officer");
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] cursor-pointer ${
                    activeRole === "officer"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{t.officerRole || "Nodal Officer (अधिकारी)"}</span>
                </button>
              </div>
            )}

            {/* Auth Mode Toggle (Sign In vs Sign Up) */}
            {authMode !== "forgot" && (
              <div className="flex border-b border-slate-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authMode === "signin"
                      ? "border-[#FF6A00] text-[#FF6A00] dark:text-[#FF8A00]"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.signIn || "Sign In"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authMode === "signup"
                      ? "border-[#FF6A00] text-[#FF6A00] dark:text-[#FF8A00]"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.register || "New Registration"}</span>
                </button>
              </div>
            )}

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Extra Registration Fields for Citizen */}
              {authMode === "signup" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Legal Name (as on Aadhaar/Govt ID) *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Vinay Dubey / Rajesh Sharma"
                        className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number (for SMS OTP)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+91 98260 12345"
                          className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {activeRole === "citizen" ? "Aadhaar (Last 4 Digits)" : "Govt Employee Code"}
                      </label>
                      <div className="relative">
                        <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={activeRole === "citizen" ? aadhaarNumber : employeeCode}
                          onChange={(e) =>
                            activeRole === "citizen"
                              ? setAadhaarNumber(e.target.value)
                              : setEmployeeCode(e.target.value)
                          }
                          placeholder={activeRole === "citizen" ? "e.g. 8914" : "e.g. MP-PWD-4412"}
                          className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
                        />
                      </div>
                    </div>
                  </div>

                  {activeRole === "citizen" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Locality / Colony / Ward
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={locality}
                            onChange={(e) => setLocality(e.target.value)}
                            placeholder="e.g. Main Market / Sector 2"
                            className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          District / State
                        </label>
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="e.g. Dhar (MP)"
                          className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="PWD / Nagar Palika"
                          className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Designation
                        </label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="Assistant Engineer"
                          className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {activeRole === "officer" ? "Official Govt Email ID *" : "Email Address *"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      activeRole === "officer"
                        ? "e.g. officer.rajesh@mp.gov.in"
                        : "e.g. abc@gmail.com"
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
                  />
                </div>
              </div>

              {/* Password */}
              {authMode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password *</label>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">(Max 32 chars)</span>
                    </div>
                    {authMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("forgot");
                          setErrorMessage(null);
                        }}
                        className="text-[11px] font-semibold text-[#FF6A00] dark:text-[#FF8A00] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      maxLength={32}
                      value={password}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > 32) {
                          setErrorMessage("Password cannot exceed 32 characters.");
                        } else {
                          if (errorMessage === "Password cannot exceed 32 characters.") setErrorMessage(null);
                        }
                        setPassword(val.slice(0, 32));
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length >= 28 && (
                    <p className={`text-[11px] mt-1 text-right ${password.length >= 32 ? "text-amber-500 font-semibold" : "text-slate-400"}`}>
                      {password.length}/32 characters {password.length >= 32 ? "(maximum limit reached)" : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Confirm Password (Registration only) */}
              {authMode === "signup" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Confirm Password *
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">(Max 32 chars)</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      maxLength={32}
                      value={confirmPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > 32) {
                          setErrorMessage("Confirm password cannot exceed 32 characters.");
                        } else {
                          if (errorMessage === "Confirm password cannot exceed 32 characters.") setErrorMessage(null);
                        }
                        setConfirmPassword(val.slice(0, 32));
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-[#111111]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all min-h-[42px]"
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
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A00]/30 transition-all disabled:opacity-50 min-h-[46px] cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Processing...</span>
                  </span>
                ) : (
                  <>
                    <span>
                      {authMode === "signup"
                        ? "Complete Registration & Enter Dashboard"
                        : authMode === "forgot"
                        ? "Send Password Reset Link"
                        : "Sign In to JanVani Dashboard"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {authMode === "forgot" && (
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Back to Sign In
                </button>
              )}
            </form>

            {/* Quick 1-Tap Google Sign In */}
            {authMode !== "forgot" && (
              <>
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-slate-200 dark:border-white/[0.08] w-full"></div>
                  <span className="bg-white/80 dark:bg-[#151515] px-3 text-[11px] text-slate-500 uppercase font-semibold">
                    Or continue with
                  </span>
                  <div className="border-t border-slate-200 dark:border-white/[0.08] w-full"></div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#111111]/80 hover:bg-slate-50 dark:hover:bg-[#1c1c1c] border border-slate-200/80 dark:border-white/[0.08] text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2.5 transition-all min-h-[42px] shadow-xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <span>Sign in with Google (Fast 1-Tap)</span>
                  </button>
                </div>

                {/* Fast One-Click Demo Accounts */}
                <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#111111]/60 border border-slate-200/80 dark:border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    <span>⚡ Quick Demo Sandbox Access:</span>
                    <span className="text-[10px] text-[#FF6A00] font-bold">Pre-filled credentials</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDirectDemoLogin("citizen")}
                      className="py-2 px-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-800/50 text-[11px] font-bold text-orange-800 dark:text-orange-300 flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-xs"
                    >
                      <User className="w-3 h-3 text-[#FF6A00] flex-shrink-0" />
                      <span className="truncate">Citizen (Praneet Dubey)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDirectDemoLogin("officer")}
                      className="py-2 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 text-[11px] font-bold text-blue-800 dark:text-blue-300 flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-xs"
                    >
                      <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="truncate">Nodal Officer (AE Civil)</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Bottom Security Seals */}
            <div className="pt-2 flex items-center justify-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>e-Aadhaar 256-bit SSL</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>NIC Government Cloud</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>Statutory 48h SLA</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Strip */}
      <footer className="relative z-10 border-t border-[#e4dcce] dark:border-white/[0.08] bg-white/70 dark:bg-[#151515]/80 backdrop-blur-xl px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
        © 2026 JanVani (जनवाणी) • Citizen Grievance Redressal & Statutory Service Level Guarantee Portal
      </footer>
    </div>
  );
};
