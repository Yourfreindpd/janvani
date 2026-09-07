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
  Clock,
  Phone,
  Globe,
  MapPin,
  Flame,
  Droplet,
  Zap,
  Trash2,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Search,
  Check,
} from "lucide-react";
import { LanguageOption, Grievance } from "../types";
import { LANGUAGES, INITIAL_GRIEVANCES, STATES_DATA } from "../data/initialData";
import { Translations } from "../data/translations";

interface LandingPageProps {
  onOpenCitizenLogin: () => void;
  onOpenCitizenRegister: () => void;
  onOpenOfficerLogin: () => void;
  onOpenGoogleAuth: (role: "citizen" | "officer") => void;
  onDemoLogin: (role: "citizen" | "officer") => void;
  onOpenLanguageModal: () => void;
  onOpenEmergency: () => void;
  currentLanguage: LanguageOption;
  t: Translations;
}

const LIVE_SHOWCASES = [
  {
    title: "Main Colony Road 3-Foot Pothole Repaired",
    ward: "Ward 18, Dhar (MP)",
    category: "Roads & Potholes",
    sla: "Resolved in 18 Hours",
    officer: "Er. Rajesh Sharma (AE Civil)",
    beforeImg: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    afterImg: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
    token: "JV-DHAR-8941",
  },
  {
    title: "Potable Water Pipeline Burst & Leakage Fixed",
    ward: "Sector 3 Main Avenue, Dhar",
    category: "Drinking Water & Pipeline Leakage",
    sla: "Resolved in 11 Hours",
    officer: "Shri Priyank Mishra, IAS (DM)",
    beforeImg: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
    afterImg: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=600&q=80",
    token: "JV-DHAR-7104",
  },
  {
    title: "Community Garbage Dump Cleared & Sanitized",
    ward: "Market Square, Pithampur",
    category: "Garbage & Sanitation",
    sla: "Resolved in 14 Hours",
    officer: "Swachh Bharat Cell Dhar",
    beforeImg: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
    afterImg: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    token: "JV-DHAR-8912",
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenCitizenLogin,
  onOpenCitizenRegister,
  onOpenOfficerLogin,
  onOpenGoogleAuth,
  onDemoLogin,
  onOpenLanguageModal,
  onOpenEmergency,
  currentLanguage,
  t,
}) => {
  const [selectedShowcase, setSelectedShowcase] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101010] text-slate-900 dark:text-[#F5F5F5] font-sans selection:bg-[#FF6A00] selection:text-white flex flex-col transition-colors duration-200">
      {/* 1. National Official Header Bar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#151515]/95 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] shadow-md">
        <div className="bg-slate-100/90 dark:bg-[#101010]/95 border-b border-slate-200/80 dark:border-white/[0.08] px-3 sm:px-6 py-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-[#A8A8A8]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#20C997] animate-pulse"></span>
            <span className="font-semibold text-slate-900 dark:text-[#F5F5F5]">
              National Digital Public Infrastructure (DPI)
            </span>
            <span className="hidden md:inline text-slate-400 dark:text-[#777777]">|</span>
            <span className="hidden md:inline text-slate-600 dark:text-[#A8A8A8]">
              Ministry of Housing & Urban Affairs (MoHUA) • Government of India
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-1 text-[#FF3B30] hover:underline font-bold cursor-pointer"
            >
              <Phone className="w-3 h-3" />
              <span>112 Emergency</span>
            </button>
            <span className="text-slate-300 dark:text-[#777777]">•</span>
            <button
              onClick={onOpenLanguageModal}
              className="flex items-center gap-1 text-[#FF6A00] dark:text-[#FF8A00] hover:underline font-medium cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>{currentLanguage.native} ({currentLanguage.code.toUpperCase()})</span>
            </button>
          </div>
        </div>

        {/* Main Nav Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A00] via-[#FF8A00] to-[#20C997] p-0.5 shadow-lg shadow-[#FF6A00]/20 flex-shrink-0">
              <div className="w-full h-full bg-white dark:bg-[#151515] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#FF6A00] dark:text-[#FF8A00]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#F5F5F5] tracking-tight">JanVani</span>
                <span className="text-[10px] font-bold bg-[#FF6A00]/10 dark:bg-[#FF6A00]/20 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/30 px-1.5 py-0.2 rounded font-mono">
                  जनवाणी 2026
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-[#A8A8A8] truncate max-w-[220px] sm:max-w-none">
                National Citizen Civic Grievance & SLA Governance Platform
              </p>
            </div>
          </div>

          {/* Top Auth Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenOfficerLogin}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#303030] hover:bg-slate-200 dark:hover:bg-[#383838] border border-blue-200 dark:border-[#3B82F6]/40 text-[#3B82F6] hover:text-blue-700 dark:hover:text-blue-300 text-xs font-bold transition-all min-h-[40px] cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#3B82F6]" />
              <span>Officer Suite (शासकीय)</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenGoogleAuth("citizen")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#303030] hover:bg-slate-100 dark:hover:bg-[#383838] border border-slate-300 dark:border-white/[0.08] text-slate-800 dark:text-[#F5F5F5] text-xs font-bold shadow-sm transition-all min-h-[40px] cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span className="hidden sm:inline">Google Login</span>
              <span className="sm:hidden">Google</span>
            </button>

            <button
              type="button"
              onClick={onOpenCitizenLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#e55f00] hover:to-[#e67d00] text-white text-xs font-bold shadow-lg shadow-[#FF6A00]/25 transition-all min-h-[40px] cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 border-b border-slate-200 dark:border-white/[0.08] bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#151515] dark:via-[#101010] dark:to-[#101010]">
        {/* Blurred orange atmospheric glow layers */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#FF6A00]/15 dark:bg-[#FF6A00]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -right-24 w-[400px] h-[300px] bg-[#20C997]/15 dark:bg-[#20C997]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-4">
            {/* Top National Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF6A00]/10 dark:bg-[#FF6A00]/20 border border-[#FF6A00]/30 text-[#FF6A00] dark:text-[#FF8A00] text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-ping"></span>
              <span>Pan-India Civic Redressal Guarantee • 28 States & 8 UTs</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-[#F5F5F5] tracking-tight leading-[1.15]">
              Empowering 1.4 Billion Citizens with{" "}
              <span className="bg-gradient-to-r from-[#FF6A00] via-[#FF8A00] to-[#20C997] bg-clip-text text-transparent">
                Transparent Civic Governance
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-[#A8A8A8] max-w-3xl mx-auto leading-relaxed">
              Snap a photo or speak in any of 12 Indian languages. JanVani uses Multimodal AI to geo-tag defects, dispatch work orders to ward nodal engineers, and guarantees 24-48h resolution under the Public Services Act.
            </p>

            {/* 3 Prominent Entry Action Portals */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-4xl mx-auto text-left">
              {/* Card 1: Citizen Access */}
              <div className="rounded-2xl bg-white/90 dark:bg-[#303030] backdrop-blur-2xl border border-white/80 dark:border-white/[0.08] p-5 flex flex-col justify-between shadow-xl hover:border-[#20C997] transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#20C997]/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#20C997]/15 text-[#20C997] flex items-center justify-center border border-[#20C997]/30">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/30 px-2 py-0.5 rounded-full">
                      Public Portal
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] group-hover:text-[#20C997] transition-colors">
                    Citizen Sign In & Register
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-1">
                    File grievances, track ward progress, draft RTIs, and access welfare schemes with e-Aadhaar verification.
                  </p>
                </div>

                <div className="mt-4 space-y-2 relative z-10">
                  <button
                    type="button"
                    onClick={() => onOpenGoogleAuth("citizen")}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-[#151515] hover:bg-slate-50 dark:hover:bg-[#383838] text-slate-800 dark:text-[#F5F5F5] text-xs font-bold flex items-center justify-center gap-2 shadow-sm border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                    <span>Firebase Google SSO</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenCitizenLogin}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#20C997] to-teal-600 hover:from-[#1bb386] hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#20C997]/25 transition-all cursor-pointer"
                  >
                    <span>Firebase Secure Login / Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Officer Access */}
              <div className="rounded-2xl bg-white/90 dark:bg-[#303030] backdrop-blur-2xl border border-white/80 dark:border-white/[0.08] p-5 flex flex-col justify-between shadow-xl hover:border-[#3B82F6] transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center border border-[#3B82F6]/30">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 px-2 py-0.5 rounded-full">
                      Gov / ULB Suite
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] group-hover:text-[#3B82F6] transition-colors">
                    Nodal Officer & Authority Suite
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-1">
                    Designated portal for Assistant Engineers, Municipal Commissioners, and District Collectors (Firebase Gov Auth & Token SSO).
                  </p>
                </div>

                <div className="mt-4 space-y-2 relative z-10">
                  <button
                    type="button"
                    onClick={() => onOpenGoogleAuth("officer")}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-[#151515] hover:bg-slate-50 dark:hover:bg-[#383838] text-slate-800 dark:text-[#F5F5F5] text-xs font-bold flex items-center justify-center gap-2 shadow-sm border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Officer Firebase Google SSO</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenOfficerLogin}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#3B82F6]/25 transition-all cursor-pointer"
                  >
                    <span>Firebase Gov Email Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: 1-Click Fast Live Demo */}
              <div className="sm:col-span-2 lg:col-span-1 rounded-2xl bg-white/90 dark:bg-[#404040] backdrop-blur-2xl border border-[#FF6A00]/40 dark:border-white/[0.08] p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6A00]/15 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] flex items-center justify-center border border-[#FF6A00]/30">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/30 px-2 py-0.5 rounded-full">
                      Instant Trial
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5]">
                    1-Click Instant Demo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-1">
                    Explore live grievances in Dhar (MP) without entering any credentials:
                  </p>
                </div>

                <div className="mt-4 space-y-2 relative z-10">
                  <button
                    type="button"
                    onClick={() => onDemoLogin("citizen")}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#20C997]/15 hover:bg-[#20C997]/25 border border-[#20C997]/40 text-[#20C997] text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>Enter as Citizen (Praneet Dubey)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDemoLogin("officer")}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/40 text-[#3B82F6] text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>Enter as Officer (Er. Rajesh Sharma)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Metrics Ribbon */}
      <section className="py-6 bg-white dark:bg-[#151515] border-b border-slate-200 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 border border-slate-200 dark:border-white/[0.08] rounded-xl bg-slate-50 dark:bg-[#303030]">
              <div className="text-2xl sm:text-3xl font-black text-[#FF6A00] dark:text-[#FF8A00] font-mono">1,248,993+</div>
              <div className="text-xs text-slate-500 dark:text-[#A8A8A8] font-medium mt-0.5">Civic Grievances Resolved</div>
            </div>
            <div className="p-3 border border-slate-200 dark:border-white/[0.08] rounded-xl bg-slate-50 dark:bg-[#303030]">
              <div className="text-2xl sm:text-3xl font-black text-[#20C997] font-mono">94.8%</div>
              <div className="text-xs text-slate-500 dark:text-[#A8A8A8] font-medium mt-0.5">SLA Compliance (&lt; 48h)</div>
            </div>
            <div className="p-3 border border-slate-200 dark:border-white/[0.08] rounded-xl bg-slate-50 dark:bg-[#303030]">
              <div className="text-2xl sm:text-3xl font-black text-[#3B82F6] font-mono">28 States / 8 UTs</div>
              <div className="text-xs text-slate-500 dark:text-[#A8A8A8] font-medium mt-0.5">Pan-India Integration</div>
            </div>
            <div className="p-3 border border-slate-200 dark:border-white/[0.08] rounded-xl bg-slate-50 dark:bg-[#303030]">
              <div className="text-2xl sm:text-3xl font-black text-purple-500 dark:text-purple-400 font-mono">4,500+ ULBs</div>
              <div className="text-xs text-slate-500 dark:text-[#A8A8A8] font-medium mt-0.5">Connected Municipal Bodies</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Resolution Proof Showcase (Before & After) */}
      <section className="py-12 sm:py-16 bg-slate-50 dark:bg-[#101010] border-b border-slate-200 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#20C997] mb-1">
                Verified Civic Impact
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F5F5F5]">
                Live Resolution Proof & Dual-Audit Verifications
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A8A8A8] max-w-md">
              Every resolved grievance is backed by geo-tagged photographic evidence, AI inspection check, and citizen sign-off.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {LIVE_SHOWCASES.map((item) => (
              <div
                key={item.token}
                className="rounded-2xl bg-white dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] hover:border-[#FF6A00]/40 overflow-hidden flex flex-col shadow-md transition-all"
              >
                {/* Before / After Dual Image Container */}
                <div className="grid grid-cols-2 h-44 relative bg-slate-100 dark:bg-[#151515] border-b border-slate-200 dark:border-white/[0.08]">
                  <div className="relative border-r border-slate-200 dark:border-white/[0.08]">
                    <img
                      src={item.beforeImg}
                      alt="Before"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                      Reported (Before)
                    </span>
                  </div>
                  <div className="relative">
                    <img
                      src={item.afterImg}
                      alt="After"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 right-2 bg-[#20C997] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                      <CheckCircle2 className="w-3 h-3 text-white" /> Resolved
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-mono text-slate-500 dark:text-[#A8A8A8]">{item.token}</span>
                      <span className="text-[11px] font-bold text-[#20C997] bg-[#20C997]/15 border border-[#20C997]/30 px-2 py-0.5 rounded">
                        {item.sla}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] leading-snug">
                      {item.title}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6A00] dark:text-[#FF8A00] flex-shrink-0" />
                      <span>{item.ward}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-xs text-slate-500 dark:text-[#A8A8A8]">
                    <span>Officer: <strong className="text-slate-800 dark:text-[#F5F5F5]">{item.officer}</strong></span>
                    <button
                      type="button"
                      onClick={() => onDemoLogin("citizen")}
                      className="text-[#FF6A00] dark:text-[#FF8A00] hover:underline font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <span>Track</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 4-Step How JanVani Works */}
      <section className="py-12 sm:py-16 bg-white dark:bg-[#151515] border-b border-slate-200 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs font-bold uppercase tracking-wider text-[#FF6A00] dark:text-[#FF8A00] mb-1">
              End-to-End Governance Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F5F5F5]">
              How Civic Redressal Works on JanVani
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] font-bold flex items-center justify-center font-mono text-base border border-[#FF6A00]/30">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5]">Voice & Photo Capture</h3>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] leading-relaxed">
                Report issues via voice in 12 languages or snap a photo. Multimodal AI automatically classifies category and defect severity.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center font-mono text-base border border-purple-500/30">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5]">e-Aadhaar & Geo-Lock</h3>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] leading-relaxed">
                Tamper-proof UIDAI-binding prevents bot spam. The complaint is geo-tagged to the exact municipal ward and street coordinates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] font-bold flex items-center justify-center font-mono text-base border border-[#3B82F6]/30">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5]">Ward Dispatch & SLA Timer</h3>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] leading-relaxed">
                Instantly dispatched to the designated Assistant Engineer with an enforceable 24h-48h SLA countdown timer.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#20C997]/15 text-[#20C997] font-bold flex items-center justify-center font-mono text-base border border-[#20C997]/30">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5]">Dual-Audit Resolution</h3>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] leading-relaxed">
                Field squad uploads post-remediation photo proof. Token closes only after AI verification and citizen sign-off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Citizen Charter & Public Services Guarantee Act SLA */}
      <section className="py-12 sm:py-16 bg-slate-50 dark:bg-[#101010] border-b border-slate-200 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-r from-white via-slate-50 to-white dark:from-[#303030] dark:via-[#404040] dark:to-[#303030] border border-slate-200 dark:border-white/[0.08] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#20C997]/15 border border-[#20C997]/30 text-[#20C997] text-xs font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  Public Services Guarantee Act (लोक सेवा गारंटी)
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F5F5F5]">
                  Legally Guaranteed Timeframes for Civic Redressal
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A8A8A8] leading-relaxed">
                  Under the Citizen Charter, municipal bodies and departments are bound by statutory resolution limits:
                </p>
              </div>

              {/* SLA Badges Grid */}
              <div className="grid grid-cols-2 gap-3 w-full lg:w-auto font-mono">
                <div className="p-3 rounded-xl bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] text-left shadow-xs">
                  <div className="text-xs text-slate-500 dark:text-[#A8A8A8]">Potholes & Roads</div>
                  <div className="text-lg font-bold text-[#FF6A00] dark:text-[#FF8A00]">48 Hours SLA</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] text-left shadow-xs">
                  <div className="text-xs text-slate-500 dark:text-[#A8A8A8]">Water Pipeline Leak</div>
                  <div className="text-lg font-bold text-[#3B82F6]">24 Hours SLA</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] text-left shadow-xs">
                  <div className="text-xs text-slate-500 dark:text-[#A8A8A8]">Garbage Dump Clear</div>
                  <div className="text-lg font-bold text-[#20C997]">24 Hours SLA</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/[0.08] text-left shadow-xs">
                  <div className="text-xs text-slate-500 dark:text-[#A8A8A8]">Sparking Wire Hazard</div>
                  <div className="text-lg font-bold text-[#FF3B30]">12 Hours SLA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section className="py-12 bg-white dark:bg-[#151515]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#F5F5F5]">
            Ready to file or resolve your civic grievance?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A8A8A8] max-w-xl mx-auto">
            Log in with your Google account, e-Aadhaar, or government officer credentials to access the full portal.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenGoogleAuth("citizen")}
              className="px-6 py-3 rounded-xl bg-white dark:bg-[#303030] hover:bg-slate-100 dark:hover:bg-[#383838] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-[#F5F5F5] font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
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
              <span>Sign In with Google</span>
            </button>

            <button
              type="button"
              onClick={onOpenCitizenLogin}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#e55f00] hover:to-[#e67d00] text-white font-bold text-xs sm:text-sm shadow-xl shadow-[#FF6A00]/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Public Citizen Portal</span>
            </button>

            <button
              type="button"
              onClick={onOpenOfficerLogin}
              className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-[#303030] hover:bg-slate-200 dark:hover:bg-[#383838] border border-blue-200 dark:border-[#3B82F6]/40 text-[#3B82F6] hover:text-blue-700 dark:hover:text-blue-300 font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#3B82F6]" />
              <span>Officer Suite</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. Institutional Footer */}
      <footer className="mt-auto bg-slate-100 dark:bg-[#101010] border-t border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-[#A8A8A8] py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF6A00] flex items-center justify-center text-white font-bold text-xs">
              JV
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-[#F5F5F5]">JanVani National Portal 2026</div>
              <div className="text-[11px] text-slate-500 dark:text-[#777777]">Government of India • MoHUA • Digital India Initiative</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>e-Aadhaar UIDAI Compliant</span>
            <span>•</span>
            <span>DigiLocker & RTI Integrated</span>
            <span>•</span>
            <span>ISO 27001 Certified Infrastructure</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
