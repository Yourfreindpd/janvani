import React from "react";
import {
  LayoutDashboard,
  FileCheck2,
  Layers,
  Shield,
  Building2,
  Sparkles,
  PhoneCall,
  Globe,
  Settings,
  LogOut,
  User,
  Plus,
  Compass,
  Sun,
  Moon,
  Film,
  Mic,
  Radio,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import { UserProfile, LanguageOption } from "../types";
import { Translations } from "../data/translations";
import { useTheme } from "../context/ThemeContext";
import { isAdminUser } from "../lib/firebase";

export type NavTab =
  | "dashboard"
  | "feed"
  | "voice_seva"
  | "reels"
  | "gis"
  | "schemes"
  | "nagrik_samman"
  | "officer_suite"
  | "admin";

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  currentUser: UserProfile | null;
  onOpenCopilot: () => void;
  onOpenEmergency: () => void;
  onOpenLanguageModal: () => void;
  onOpenAuth: () => void;
  onOpenReportModal: () => void;
  onOpenWhatsApp?: () => void;
  onOpenMediaScroller?: () => void;
  onLogout: () => void;
  currentLanguage: LanguageOption;
  t: Translations;
  grievanceCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenCopilot,
  onOpenEmergency,
  onOpenLanguageModal,
  onOpenAuth,
  onOpenReportModal,
  onOpenWhatsApp,
  onOpenMediaScroller,
  onLogout,
  currentLanguage,
  t,
  grievanceCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const menuItems = [
    {
      id: "dashboard" as NavTab,
      label: t.dashboard || "Dashboard & Analysis",
      icon: LayoutDashboard,
      badge: null,
      color: "text-orange-500",
    },
    {
      id: "feed" as NavTab,
      label: t.grievanceFeed || "Public Grievance Feed",
      icon: FileCheck2,
      badge: grievanceCount.toString(),
      color: "text-amber-500",
    },
    {
      id: "voice_seva" as NavTab,
      label: "Voice Complaint Seva",
      icon: Mic,
      badge: "VOICE AI",
      badgeColor: "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-[#FF6A00] dark:text-[#FF8A00] border-orange-300 dark:border-orange-500/40 animate-pulse",
      color: "text-[#FF6A00]",
    },
    {
      id: "reels" as NavTab,
      label: "Civic Media Reels",
      icon: Film,
      badge: "REELS",
      badgeColor: "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-[#FF6A00] dark:text-[#FF8A00] border-orange-300 dark:border-orange-500/40",
      color: "text-[#FF6A00]",
    },
    {
      id: "gis" as NavTab,
      label: t.gisMaps || "Ward GIS & Heatmap",
      icon: Layers,
      badge: "LIVE",
      badgeColor: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60",
      color: "text-emerald-500",
    },
    {
      id: "schemes" as NavTab,
      label: t.welfareSchemes || "Welfare Schemes & DPI",
      icon: Shield,
      badge: "6 Schemes",
      badgeColor: "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/60",
      color: "text-blue-500",
    },
    {
      id: "nagrik_samman" as NavTab,
      label: "Best Nagrik & Points",
      icon: Trophy,
      badge: "RANK #1",
      badgeColor: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-800 dark:text-amber-300 border-amber-400/50 font-black",
      color: "text-[#FF6A00]",
    },
  ];

  // If nodal officer, append officer suite tab
  if (currentUser?.role === "officer") {
    menuItems.push({
      id: "officer_suite" as NavTab,
      label: t.nodalOfficerSuite || "Nodal Officer Suite",
      icon: Building2,
      badge: "OFFICER",
      badgeColor: "bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/60",
      color: "text-purple-500",
    });
  }

  // If Admin user, append Admin Console tab
  if (isAdminUser(currentUser)) {
    menuItems.push({
      id: "admin" as NavTab,
      label: "Admin Console (Purge & Audit)",
      icon: ShieldAlert,
      badge: "SUPER ADMIN",
      badgeColor: "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700/60 animate-pulse font-black",
      color: "text-red-500",
    });
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white/70 dark:bg-[#151515]/95 backdrop-blur-2xl text-slate-900 dark:text-[#F5F5F5] flex flex-col justify-between border-r border-[#e8e1d5]/80 dark:border-white/[0.08] shadow-[4px_0_24px_rgba(200,180,155,0.08)] dark:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Subtle decorative glow in sidebar */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-[#FF6A00]/8 dark:bg-[#FF6A00]/10 rounded-full blur-3xl pointer-events-none -ml-16 -mt-16" />

        {/* Top: Portal Branding */}
        <div className="p-4 border-b border-[#e8e1d5]/80 dark:border-white/[0.08] relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Indian Tiranga / Saffron Accent Logo */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A00] via-[#FF8A00] to-emerald-500 p-[2px] shadow-lg shadow-[#FF6A00]/25 flex-shrink-0">
                <div className="w-full h-full bg-[#101010] rounded-[10px] flex items-center justify-center">
                  <span className="text-base font-black text-white tracking-tighter">जन</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-slate-900 dark:text-[#F5F5F5] font-heading">JanVani</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FF6A00]/15 dark:bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/30">
                    2026
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-[#777777] font-bold tracking-wider uppercase">
                  Digital India • MoHUA
                </p>
              </div>
            </div>

            {/* Close button for mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-[#A8A8A8] dark:hover:text-white rounded-lg hover:bg-white/80 dark:hover:bg-[#383838]"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>

          {/* Quick Action: File Grievance Button */}
          <button
            onClick={() => {
              onOpenReportModal();
              onCloseMobile();
            }}
            className="mt-4 w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white font-bold text-xs shadow-md shadow-[#FF6A00]/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="tracking-wide">{t.fileGrievanceBtn || t.reportCivicIssue || "File Civic Grievance"}</span>
          </button>
        </div>

        {/* Middle: Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-5 relative z-10">
          {/* Main Navigation */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-[#777777] uppercase tracking-wider">
              {t.corePortal || "Core Portal"}
            </div>
            <div className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white/95 dark:bg-[#404040] text-slate-950 dark:text-[#F5F5F5] shadow-[0_4px_16px_rgba(200,180,155,0.22)] dark:shadow-md border border-white dark:border-white/[0.08]"
                        : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-950 dark:hover:text-[#F5F5F5] hover:bg-white/60 dark:hover:bg-[#383838]/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? "text-[#FF6A00]" : "text-slate-400 dark:text-[#777777]"
                        }`}
                      />
                      <span className="whitespace-nowrap truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border flex-shrink-0 ${
                          item.badgeColor ||
                          (isActive
                            ? "bg-[#FF6A00]/15 dark:bg-[#FF6A00]/20 text-[#FF6A00] dark:text-[#FF8A00] border-[#FF6A00]/30"
                            : "bg-white/80 dark:bg-[#303030] text-slate-700 dark:text-[#A8A8A8] border-slate-200 dark:border-white/[0.08]")
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Civic Assistance */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-[#777777] uppercase tracking-wider">
              {t.intelligentServices || "Intelligent Services"}
            </div>
            <div>
              <button
                onClick={() => {
                  onOpenCopilot();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold bg-purple-50/80 dark:bg-[#303030] hover:bg-purple-100/90 dark:hover:bg-[#383838] text-purple-950 dark:text-[#F5F5F5] border border-purple-200/80 dark:border-white/[0.08] shadow-xs backdrop-blur-md transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-[#FF8A00] flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="text-left min-w-0">
                    <div className="font-bold text-purple-950 dark:text-[#F5F5F5] whitespace-nowrap truncate">{t.aiCopilot || "AI Civic Copilot"}</div>
                    <div className="text-[10px] text-purple-700/80 dark:text-[#A8A8A8] font-normal whitespace-nowrap truncate">
                      {t.voiceTextAssistant || "Voice / Text Assistant"}
                    </div>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-purple-100/90 dark:bg-[#FF6A00]/15 text-purple-900 dark:text-[#FF8A00] border border-purple-300 dark:border-[#FF6A00]/30 flex-shrink-0">
                  Gemini
                </span>
              </button>
            </div>
          </div>

          {/* Quick Utility Links */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-[#777777] uppercase tracking-wider">
              {t.citizenTools || "Citizen Tools"}
            </div>
            <div className="space-y-1">
              {/* Dark / Light Mode Switch */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#A8A8A8] hover:text-slate-950 dark:hover:text-[#F5F5F5] hover:bg-white/60 dark:hover:bg-[#383838]/60 transition-colors min-h-[36px] group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {isDarkMode ? (
                    <Sun className="w-4 h-4 text-amber-500 dark:text-[#FF8A00] group-hover:rotate-45 transition-transform" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:-rotate-12 transition-transform" />
                  )}
                  <span className="font-medium">{isDarkMode ? (t.lightMode || "Light Mode") : (t.darkMode || "Dark Mode")}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  isDarkMode
                    ? "bg-[#303030] text-[#FF8A00] border-white/[0.08]"
                    : "bg-white text-indigo-700 border-indigo-200 shadow-xs"
                }`}>
                  {isDarkMode ? (t.darkMode || "DARK") : (t.lightMode || "LIGHT")}
                </span>
              </button>

              <button
                onClick={() => {
                  onOpenEmergency();
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-[#FF3B30] hover:text-red-700 dark:hover:text-[#ff5c52] hover:bg-red-50/80 dark:hover:bg-[#FF3B30]/15 transition-colors min-h-[36px] cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-red-600 dark:text-[#FF3B30] flex-shrink-0" />
                <span className="whitespace-nowrap">{t.emergency112 || "Emergency 112 SOS"}</span>
              </button>

              <button
                onClick={() => {
                  onOpenLanguageModal();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#A8A8A8] hover:text-slate-950 dark:hover:text-[#F5F5F5] hover:bg-white/60 dark:hover:bg-[#383838]/60 transition-colors min-h-[36px] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-slate-400 dark:text-[#777777] flex-shrink-0" />
                  <span className="whitespace-nowrap">{t.languageSelector || "Language / भाषा"}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-600 dark:text-[#A8A8A8] font-bold">
                  {currentLanguage.code.toUpperCase()}
                </span>
              </button>

              <button
                onClick={() => {
                  onOpenAuth();
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#A8A8A8] hover:text-slate-950 dark:hover:text-[#F5F5F5] hover:bg-white/60 dark:hover:bg-[#383838]/60 transition-colors min-h-[36px] cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400 dark:text-[#777777] flex-shrink-0" />
                <span className="whitespace-nowrap">{t.portalSettings || "Portal Settings"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: User Persona / Login Pill */}
        <div className="p-3.5 border-t border-[#e8e1d5]/80 dark:border-white/[0.08] bg-white/40 dark:bg-[#151515] relative z-10">
          {currentUser ? (
            <div>
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/90 dark:bg-[#303030] border border-white dark:border-white/[0.08] shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white flex-shrink-0 ${
                      currentUser.role === "officer"
                        ? "bg-gradient-to-br from-[#3B82F6] to-indigo-700"
                        : "bg-gradient-to-br from-[#FF6A00] to-[#FF8A00]"
                    }`}
                  >
                    {currentUser.avatarText}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-[#A8A8A8] truncate">
                      {currentUser.role === "officer" ? (t.officerRole || "Nodal Officer") : (t.citizenRole || "Citizen (Ward 27)")}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-[#FF3B30] transition-colors rounded-lg hover:bg-[#ede5d8] dark:hover:bg-[#383838] flex-shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {currentUser.role === "citizen" && (
                <button
                  onClick={() => {
                    setCurrentTab("nagrik_samman");
                    onCloseMobile();
                  }}
                  className="mt-2 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-900 dark:text-amber-300 w-full hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>Best Nagrik Rank</span>
                  </span>
                  <span className="font-mono text-[#FF6A00] dark:text-amber-400 font-black">#1 • 480 pts</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                onCloseMobile();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#FF6A00]/25 transition-all min-h-[38px] cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.signIn || "Sign In"} / {t.register || "Register"}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
