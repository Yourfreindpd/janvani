import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Globe,
  Sparkles,
  PhoneCall,
  ChevronDown,
  LogOut,
  User,
  Building2,
  Lock,
  Menu,
  CheckCircle2,
  Sun,
  Moon,
  Clock,
  AlertTriangle,
  Flame,
  FileText,
  CheckCheck,
  X,
  ExternalLink,
  Mic,
  Radio,
  ShieldAlert,
  Bot,
  Trophy,
} from "lucide-react";
import { UserProfile, LanguageOption, CivicNotification } from "../types";
import { Translations } from "../data/translations";
import { useTheme } from "../context/ThemeContext";
import { NavTab } from "./Sidebar";
import { isAdminUser } from "../lib/firebase";
import { getStoredNagrikData, getNagrikTier } from "../utils/nagrikPoints";

interface HeaderProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchUserRole: (role: "citizen" | "officer") => void;
  onOpenLanguageModal: () => void;
  onOpenCopilot: () => void;
  onOpenEmergency: () => void;
  onOpenWhatsApp?: () => void;
  onTrackGrievance?: (token: string) => void;
  onOpenNagrikLeaderboard?: () => void;
  currentLanguage: LanguageOption;
  t: Translations;
  grievanceCount: number;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onSwitchUserRole,
  onOpenLanguageModal,
  onOpenCopilot,
  onOpenEmergency,
  onOpenWhatsApp,
  onTrackGrievance,
  onOpenNagrikLeaderboard,
  currentLanguage,
  t,
  grievanceCount,
  onToggleMobileSidebar,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);

  const citizenId = currentUser?.id || currentUser?.email || "default_citizen";
  const [nagrikPoints, setNagrikPoints] = useState(() => getStoredNagrikData(citizenId).points);

  useEffect(() => {
    const handlePointsEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.points === "number") {
        setNagrikPoints(customEvent.detail.points);
      }
    };
    window.addEventListener("nagrik_points_updated", handlePointsEvent);
    return () => window.removeEventListener("nagrik_points_updated", handlePointsEvent);
  }, []);

  const nagrikTier = getNagrikTier(nagrikPoints);
  const [notifications, setNotifications] = useState<CivicNotification[]>([
    {
      id: "notif-1",
      title: "Field Unit Dispatched",
      message: "Inspection team reached Ward 27 for road crater patching under Token JV-MP-DHAR-2026-0891.",
      timestamp: "12 mins ago",
      type: "status_update",
      read: false,
      token: "JV-MP-DHAR-2026-0891",
    },
    {
      id: "notif-2",
      title: "Statutory SLA Alert: 8 Hours Remaining",
      message: "Overhead transformer oil leak near Sector Substation requires urgent clearance before SLA breach.",
      timestamp: "35 mins ago",
      type: "sla_warning",
      read: false,
      token: "JV-MP-DHAR-2026-0418",
    },
    {
      id: "notif-3",
      title: "Grievance Certified & Resolved",
      message: "Drinking water pipeline leak at Civil Hospital junction has been successfully repaired and dual-verified.",
      timestamp: "2 hours ago",
      type: "resolution",
      read: false,
      token: "JV-MP-DHAR-2026-0105",
    },
    {
      id: "notif-4",
      title: "Citizen Support Milestone",
      message: "Your reported civic issue 'Monsoon Road Crater' has garnered 48 community upvotes in your ward.",
      timestamp: "4 hours ago",
      type: "upvote",
      read: true,
      token: "JV-MP-DHAR-2026-0891",
    },
    {
      id: "notif-5",
      title: "WhatsApp Seva Grievance Ingested",
      message: "New public sanitation report ingested via WhatsApp Hotline (+91 90131 51515). Token JV-WA-DHAR-2026-9102 assigned.",
      timestamp: "5 hours ago",
      type: "new_grievance",
      read: true,
      token: "JV-WA-DHAR-2026-9102",
    },
  ]);
  const [unreadCount, setUnreadCount] = useState(3);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Fetch actual notifications from server
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount ?? data.notifications.filter((n: any) => !n.read).length);
          }
        }
      } catch (err) {
        console.warn("Notifications sync notice:", err);
      }
    };
    fetchNotifications();
  }, []);

  // Mark all as read
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.warn("Mark all read notice:", err);
    }
  };

  // Mark single as read and optionally track grievance
  const handleNotificationClick = async (notif: CivicNotification) => {
    if (!notif.read) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
      } catch (err) {
        console.warn("Mark read notice:", err);
      }
    }

    if (notif.token && onTrackGrievance) {
      setNotificationsDropdownOpen(false);
      onTrackGrievance(notif.token);
    } else {
      setNotificationsDropdownOpen(false);
      setCurrentTab("feed");
    }
  };

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileDropdownOpen(false);
        setNotificationsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getPageTitle = () => {
    switch (currentTab) {
      case "dashboard":
        return t.dashboard || "Dashboard";
      case "feed":
        return currentUser?.role === "officer" ? (t.publicWardFeed || t.grievanceFeed || "Public Ward Feed") : (t.grievanceFeed || "Civic Grievances");
      case "voice_seva":
        return "Voice Complaint Seva • आवाज़ सेवा";
      case "reels":
        return "Civic Media Reels";
      case "gis":
        return t.gisMaps || "Ward GIS Map & Heatmap";
      case "schemes":
        return t.welfareSchemes || "Welfare Schemes & DPI";
      case "officer_suite":
        return t.nodalOfficerSuite || "Nodal Officer Suite";
      default:
        return t.dashboard || "Dashboard";
    }
  };

  return (
    <header className="py-2.5 sm:py-4 px-3 sm:px-8 flex items-center justify-between gap-2 sm:gap-4 border-b border-[#e8e1d5]/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#151515]/95 backdrop-blur-2xl sticky top-0 z-30 transition-all min-w-0 w-full shadow-[0_4px_20px_rgba(210,190,165,0.06)] dark:shadow-none">
      {/* Left: Mobile Menu Button & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl border border-white/90 dark:border-white/[0.08] bg-white/90 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] text-slate-800 dark:text-[#F5F5F5] shadow-xs backdrop-blur-md transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center flex-shrink-0 cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-[#F5F5F5] tracking-tight truncate font-heading">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark Mode"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/85 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] border border-white/90 dark:border-white/[0.08] text-slate-700 dark:text-[#F5F5F5] shadow-xs backdrop-blur-md transition-all flex items-center gap-1.5 min-h-[36px] sm:min-h-[40px] group cursor-pointer"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden md:inline text-xs font-bold text-[#A8A8A8]">{t.lightMode || "Light"}</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform" />
              <span className="hidden md:inline text-xs font-bold text-slate-800">{t.darkMode || "Dark"}</span>
            </>
          )}
        </button>

        {/* Language Modal Button */}
        <button
          onClick={onOpenLanguageModal}
          title="Change Portal Language"
          className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/85 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] border border-white/90 dark:border-white/[0.08] text-xs font-semibold text-slate-800 dark:text-[#F5F5F5] shadow-xs backdrop-blur-md transition-all flex items-center gap-1 min-h-[36px] sm:min-h-[40px] cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF6A00] dark:text-[#FF8A00]" />
          <span className="hidden md:inline">{currentLanguage.nativeName}</span>
          <span className="md:hidden text-[10px] font-bold">{currentLanguage.code.toUpperCase()}</span>
        </button>

        {/* Voice Seva Quick Action Button */}
        <button
          onClick={() => setCurrentTab("voice_seva")}
          className={`p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-black shadow-xs backdrop-blur-md transition-all flex items-center gap-1.5 min-h-[36px] sm:min-h-[40px] cursor-pointer ${
            currentTab === "voice_seva"
              ? "bg-[#FF6A00] text-white ring-2 ring-orange-400/40 shadow-md shadow-[#FF6A00]/25"
              : "bg-orange-50/90 dark:bg-[#2a1a10] hover:bg-orange-100 dark:hover:bg-[#382215] border border-orange-200/80 dark:border-orange-500/30 text-[#FF6A00] dark:text-[#FF8A00]"
          }`}
          title="File Complaint via Voice Assistant (आवाज़ सेवा)"
        >
          <div className="relative">
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF6A00] dark:text-[#FF8A00]" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <span className="hidden sm:inline">Voice Seva</span>
          <span className="hidden xl:inline text-[9px] px-1.5 py-0.5 rounded-md bg-[#FF6A00]/20 text-[#FF6A00] dark:text-[#FF8A00] font-black">AI</span>
        </button>

        {/* AI Bot Button (Logo Only Promotion) */}
        <button
          onClick={onOpenCopilot}
          className="p-2 sm:p-2.5 rounded-xl bg-purple-50/90 dark:bg-[#303030] hover:bg-purple-100 dark:hover:bg-[#383838] border border-purple-200/80 dark:border-white/[0.08] text-purple-600 dark:text-[#FF8A00] shadow-xs backdrop-blur-md transition-all flex items-center justify-center min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] cursor-pointer group"
          title="JanVani AI Bot (Gemini 2.5 Copilot)"
          aria-label="JanVani AI Bot"
        >
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform text-purple-600 dark:text-[#FF8A00]" />
        </button>

        {/* Nagrik Points & Best Nagrik Position Hub Trigger */}
        {currentUser && currentUser.role === "citizen" && (
          <button
            type="button"
            onClick={onOpenNagrikLeaderboard}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 hover:from-amber-500/25 hover:to-orange-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-300 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer min-h-[36px] sm:min-h-[40px]"
            title="Nagrik Samman & Best Nagrik Ranking Hub"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF6A00] flex-shrink-0" />
            <div className="text-left hidden md:block">
              <div className="text-[10px] uppercase font-black text-amber-700 dark:text-amber-400 leading-none">
                {nagrikTier.name}
              </div>
              <div className="text-xs font-mono font-black text-slate-900 dark:text-white leading-tight">
                {nagrikPoints} pts
              </div>
            </div>
            <div className="md:hidden font-mono font-black text-xs text-[#FF6A00]">
              {nagrikPoints}p
            </div>
            <span className="hidden xl:inline-block px-1.5 py-0.2 rounded bg-amber-400/25 text-amber-900 dark:text-amber-200 text-[10px] font-black">
              #1 Best Nagrik
            </span>
          </button>
        )}

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)}
            title="Notifications & Civic Alerts"
            className="relative p-2 rounded-xl bg-white/85 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] border border-white/90 dark:border-white/[0.08] shadow-xs text-slate-700 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-white backdrop-blur-md transition-all flex items-center justify-center min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] cursor-pointer"
            aria-label="Toggle notifications"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-[#A8A8A8]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF3B30] text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-[#303030]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover Panel */}
          {notificationsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#202020] border border-slate-200/90 dark:border-white/[0.1] shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800 dark:text-[#F5F5F5]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
                    {t.notifications || "Civic Alerts & Notices"}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/30">
                      {unreadCount} {t.statusPending || "new"}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-slate-500 hover:text-[#FF6A00] dark:text-[#A8A8A8] dark:hover:text-[#FF8A00] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{t.markAllRead || "Mark all read"}</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 dark:text-[#777777]">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{t.noNotificationsYet || "No notifications yet"}</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const getIcon = () => {
                      switch (notif.type) {
                        case "sla_warning":
                          return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
                        case "resolution":
                          return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
                        case "upvote":
                          return <Flame className="w-4 h-4 text-[#FF6A00] flex-shrink-0" />;
                        case "new_grievance":
                          return <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />;
                        default:
                          return <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
                      }
                    };

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 sm:px-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] ${
                          !notif.read ? "bg-orange-50/40 dark:bg-[#FF6A00]/[0.06]" : ""
                        }`}
                      >
                        <div className="mt-0.5">{getIcon()}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={`font-bold truncate ${!notif.read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-[#CCCCCC]"}`}>
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-[#777777] whitespace-nowrap">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-[#A8A8A8] text-[11px] leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                          {notif.token && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#303030] text-[10px] font-mono font-medium text-slate-700 dark:text-[#CCCCCC] border border-slate-200 dark:border-white/[0.08]">
                                {notif.token}
                              </span>
                              <span className="text-[10px] text-[#FF6A00] font-semibold flex items-center gap-0.5">
                                {t.trackGrievance || "Track"} <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          )}
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#FF6A00] mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                <button
                  onClick={() => {
                    setNotificationsDropdownOpen(false);
                    setCurrentTab("feed");
                  }}
                  className="w-full py-1.5 text-center text-xs font-bold text-[#FF6A00] hover:text-[#FF8A00] transition-colors cursor-pointer"
                >
                  {t.grievanceFeed || "View Grievance Feed"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        {currentUser ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:pr-3 rounded-xl bg-white/85 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] border border-white/90 dark:border-white/[0.08] shadow-xs backdrop-blur-md transition-all min-h-[36px] sm:min-h-[40px] cursor-pointer"
            >
              {/* User Avatar Image or Badge */}
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs text-white shadow-sm flex-shrink-0 ${
                  currentUser.role === "officer"
                    ? "bg-gradient-to-br from-[#3B82F6] to-indigo-700"
                    : "bg-gradient-to-br from-[#FF6A00] to-[#FF8A00]"
                }`}
              >
                {currentUser.avatarText}
              </div>

              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#A8A8A8] leading-tight truncate">
                  {currentUser.role === "officer" ? (t.officerRole || "Nodal Officer") : (t.citizenRole || "Citizen")}
                </div>
              </div>

              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/90 dark:bg-[#303030] backdrop-blur-2xl border border-white/90 dark:border-white/[0.08] shadow-[0_20px_50px_rgba(200,180,155,0.25)] dark:shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900 dark:text-[#F5F5F5]">
                <div className="p-2.5 border-b border-slate-100 dark:border-white/[0.08] bg-white/70 dark:bg-[#262626] rounded-xl mb-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-900 dark:text-[#F5F5F5]">{currentUser.name}</div>
                    <span className="text-[9px] font-bold text-emerald-800 dark:text-[#20C997] bg-emerald-100 dark:bg-[#20C997]/15 border border-emerald-300 dark:border-[#20C997]/30 px-1.5 py-0.5 rounded-full">
                      {t.verifiedAadhaar || "Verified"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8] truncate">{currentUser.email}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-800 dark:text-[#FF8A00] font-medium">
                    <Lock className="w-3 h-3 text-[#FF6A00]" />
                    <span>{t.aadhaarNumber || "Aadhaar"}: {currentUser.aadhaarNumber}</span>
                  </div>

                  {currentUser.role === "citizen" && (
                    <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                          <Trophy className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>{nagrikTier.name}</span>
                        </span>
                        <span className="font-mono font-black text-[#FF6A00]">{nagrikPoints} pts</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
                        <span>Rank #1 in Ward 14</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenNagrikLeaderboard?.();
                          }}
                          className="font-bold text-[#FF6A00] hover:underline"
                        >
                          Best Nagrik Hub →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="py-1 space-y-1">
                  <div className="px-2 py-0.5 text-[10px] uppercase font-bold text-slate-400 dark:text-[#777777] tracking-wider">
                    {t.switchPersona || "Switch Persona Demo"}
                  </div>
                  <button
                    onClick={() => {
                      onSwitchUserRole("citizen");
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      currentUser.role === "citizen"
                        ? "bg-orange-50 dark:bg-[#404040] text-orange-900 dark:text-[#FF8A00] font-bold border border-orange-200 dark:border-[#FF6A00]/30"
                        : "text-slate-700 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838]"
                    }`}
                  >
                    <User className="w-4 h-4 text-orange-600 dark:text-[#FF6A00] flex-shrink-0" />
                    <div className="min-w-0">
                      <div>{t.citizenRole || "Citizen"}: Praneet Dubey</div>
                      <div className="text-[10px] text-slate-400 dark:text-[#777777]">Ward 27, Dhar MP (Live Citizen)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSwitchUserRole("officer");
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      currentUser.role === "officer"
                        ? "bg-blue-50 dark:bg-[#404040] text-blue-900 dark:text-[#3B82F6] font-bold border border-blue-200 dark:border-[#3B82F6]/30"
                        : "text-slate-700 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838]"
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-[#3B82F6] flex-shrink-0" />
                    <div className="min-w-0">
                      <div>{t.officerRole || "Officer"}: Er. Rajesh Sharma</div>
                      <div className="text-[10px] text-slate-400 dark:text-[#777777]">AE Civil, Municipal Council</div>
                    </div>
                  </button>
                </div>

                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-white/[0.08]">
                  <button
                    onClick={() => {
                      onLogout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-red-600 dark:text-[#FF3B30] hover:bg-red-50 dark:hover:bg-[#FF3B30]/15 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.signOut || "Sign Out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#FF8A00] text-white text-xs font-bold shadow-lg shadow-[#FF6A00]/25 transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>{t.signIn || "Sign In"}</span>
          </button>
        )}
      </div>
    </header>
  );
};

