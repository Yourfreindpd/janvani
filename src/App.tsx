import React, { useState, useEffect } from "react";
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
  Plus,
  Compass,
  Film,
  Mic,
  Bot,
} from "lucide-react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DashboardOverview } from "./components/DashboardOverview";
import { GrievanceFeed } from "./components/GrievanceFeed";
import { GisMap } from "./components/GisMap";
import { WelfareSchemes } from "./components/WelfareSchemes";
import { OfficerDashboard } from "./components/OfficerDashboard";
import { CivicReelsPage } from "./components/CivicReelsPage";

import { FileGrievanceModal } from "./components/FileGrievanceModal";
import { TrackerModal } from "./components/TrackerModal";
import { FirebaseSecureAuthModal } from "./components/FirebaseSecureAuthModal";
import { GoogleAuthModal } from "./components/GoogleAuthModal";
import { CopilotModal } from "./components/CopilotModal";
import { RtiModal } from "./components/RtiModal";
import { ReceiptModal } from "./components/ReceiptModal";
import { CallOfficerModal } from "./components/CallOfficerModal";
import { EmergencyModal } from "./components/EmergencyModal";
import { LanguageModal } from "./components/LanguageModal";
import { WhatsAppGrievanceModal } from "./components/WhatsAppGrievanceModal";
import { CivicMediaScroller } from "./components/CivicMediaScroller";
import { VoiceComplaintOfficer } from "./components/VoiceComplaintOfficer";
import { AdminControlCenter } from "./components/AdminControlCenter";
import { AdminDeleteConfirmationModal } from "./components/AdminDeleteConfirmationModal";
import { NagrikLeaderboardModal } from "./components/NagrikLeaderboardModal";
import { NagrikPointToast } from "./components/NagrikPointToast";
import { awardNagrikPoints } from "./utils/nagrikPoints";
import { NavTab } from "./components/Sidebar";

import { AuthScreen } from "./components/AuthScreen";
import {
  Grievance,
  UserProfile,
  LanguageOption,
  WorkOrder,
  OfficialNotice,
  OfficerActionLog,
  AdminAuditLog,
  GrievanceStatus,
} from "./types";
import {
  INITIAL_GRIEVANCES,
  INITIAL_USER_CITIZEN,
  INITIAL_USER_OFFICER,
  INITIAL_WORK_ORDERS,
  INITIAL_OFFICIAL_NOTICES,
  INITIAL_OFFICER_LOGS,
  LANGUAGES,
} from "./data/initialData";
import { TRANSLATIONS_MAP } from "./data/translations";
import {
  getSavedSessionUser,
  logoutFirebase,
  subscribeToAuthChanges,
  isAdminUser,
  saveGrievanceToFirestore,
  updateGrievanceInFirestore,
  subscribeToFirestoreGrievances,
} from "./lib/firebase";

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  // Require explicit login/registration first (check saved session or default to null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    () => getSavedSessionUser() || null
  );
  const [grievances, setGrievances] = useState<Grievance[]>(() => {
    try {
      const storedUpvotes: string[] = JSON.parse(
        localStorage.getItem("janvani_user_upvotes") || "[]"
      );
      if (Array.isArray(storedUpvotes) && storedUpvotes.length > 0) {
        return INITIAL_GRIEVANCES.map((g) => ({
          ...g,
          hasUpvoted: storedUpvotes.includes(g.id) || !!g.hasUpvoted,
        }));
      }
    } catch {
      // ignore
    }
    return INITIAL_GRIEVANCES;
  });
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [notices, setNotices] = useState<OfficialNotice[]>(INITIAL_OFFICIAL_NOTICES);
  const [auditLogs, setAuditLogs] = useState<OfficerActionLog[]>(INITIAL_OFFICER_LOGS);
  const [adminAuditLogs, setAdminAuditLogs] = useState<AdminAuditLog[]>(() => {
    try {
      const stored = localStorage.getItem("janvani_admin_audit_logs");
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: "log-init-1",
        timestamp: "Yesterday, 14:30",
        action: "DELETE_VIDEO" as const,
        targetId: "g-init-demo",
        targetToken: "JV-AUDIT-9921",
        targetTitle: "Exposed live high voltage transformer",
        targetCategory: "Electricity Hazard & Wiring",
        reason: "Inappropriate / Obscene Audio Overlay in Citizen Video",
        adminName: "Vinay Dubey",
        adminEmail: "vinay.dubey213@gmail.com",
        adminRole: "Super Administrator",
        details: "Video media removed; complaint text and timeline retained for civic repair.",
      },
    ];
  });
  const [adminDeleteModalOpen, setAdminDeleteModalOpen] = useState(false);
  const [adminDeleteModalGrievance, setAdminDeleteModalGrievance] = useState<Grievance | null>(null);
  const [adminDeleteModalMode, setAdminDeleteModalMode] = useState<"all" | "video_only">("all");
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(() => {
    try {
      const savedCode = localStorage.getItem("janvani_language");
      if (savedCode) {
        const found = LANGUAGES.find((l) => l.code === savedCode);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return LANGUAGES[0];
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("janvani_language", currentLanguage.code);
    } catch {
      // ignore
    }
  }, [currentLanguage]);

  // Subscribe to Firebase auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for Grievances
  useEffect(() => {
    const unsubscribe = subscribeToFirestoreGrievances((firestoreGrievances) => {
      if (firestoreGrievances && firestoreGrievances.length > 0) {
        setGrievances((prev) => {
          const firestoreIds = new Set(firestoreGrievances.map((g) => g.id));
          const existingRemaining = prev.filter((g) => !firestoreIds.has(g.id));
          return [...firestoreGrievances, ...existingRemaining];
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Filters
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("all");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>("All Districts");

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<"citizen" | "officer">("citizen");
  const [googleAuthOpen, setGoogleAuthOpen] = useState(false);
  const [googleAuthRole, setGoogleAuthRole] = useState<"citizen" | "officer">("citizen");

  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [filePrefillData, setFilePrefillData] = useState<any>(null);
  const [trackerGrievance, setTrackerGrievance] = useState<Grievance | null>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState("");
  const [rtiGrievance, setRtiGrievance] = useState<Grievance | null>(null);
  const [receiptGrievance, setReceiptGrievance] = useState<Grievance | null>(null);
  const [callOfficerGrievance, setCallOfficerGrievance] = useState<Grievance | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [mediaScrollerOpen, setMediaScrollerOpen] = useState(false);
  const [mediaScrollerInitialIndex, setMediaScrollerInitialIndex] = useState(0);
  const [nagrikModalOpen, setNagrikModalOpen] = useState(false);

  const handleOpenMediaScroller = (grievance?: Grievance) => {
    if (grievance) {
      const idx = grievances.findIndex((g) => g.id === grievance.id);
      setMediaScrollerInitialIndex(idx >= 0 ? idx : 0);
    } else {
      setMediaScrollerInitialIndex(0);
    }
    setMediaScrollerOpen(true);
  };

  const t = TRANSLATIONS_MAP[currentLanguage.code] || TRANSLATIONS_MAP.en;

  // Handle Login & Persona Switch
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    setGoogleAuthOpen(false);
    // If officer, automatically switch view to officer suite
    if (user.role === "officer") {
      setCurrentTab("officer_suite");
    }
  };

  const handleTrackByToken = (token: string) => {
    const cleanToken = token.trim().toLowerCase();
    const found = grievances.find(
      (g) => g.token.toLowerCase() === cleanToken || g.id.toLowerCase() === cleanToken
    );
    if (found) {
      setTrackerGrievance(found);
    } else {
      setCurrentTab("feed");
    }
  };

  const handleLogout = async () => {
    await logoutFirebase();
    setCurrentUser(null);
    setCurrentTab("dashboard");
  };

  const handleSwitchUserRole = (role: "citizen" | "officer") => {
    if (role === "citizen") {
      setCurrentUser(INITIAL_USER_CITIZEN);
      if (currentTab === "officer_suite") {
        setCurrentTab("dashboard");
      }
    } else {
      setCurrentUser(INITIAL_USER_OFFICER);
      setCurrentTab("officer_suite");
    }
  };

  // Add Grievance
  const handleAddNewGrievance = (newGrievance: Grievance) => {
    setGrievances((prev) => [newGrievance, ...prev]);

    // Persist to Cloud Firestore
    saveGrievanceToFirestore(newGrievance).catch((err) => {
      console.warn("Firestore grievance save notice:", err);
    });

    // Log audit trail
    const auditLog: OfficerActionLog = {
      id: `log-${Date.now()}`,
      grievanceToken: newGrievance.token,
      officerName: "System AI Classifier",
      actionTaken: "Grievance Registered & Auto-Triaged",
      previousStatus: "None",
      newStatus: "Submitted & Token Issued",
      timestamp: "Just now",
      remarks: `Filed under ${newGrievance.category}. Assigned SLA: ${newGrievance.targetSlaHours} hours.`,
      auditHash: `0x${Date.now().toString(16)}`,
    };
    setAuditLogs((prev) => [auditLog, ...prev]);
  };

  // Update Grievance Status
  const handleUpdateGrievanceStatus = (
    id: string,
    newStatus: GrievanceStatus,
    resolutionNote?: string,
    resolutionPhoto?: string
  ) => {
    let oldStatus = "In Progress";
    let updatedItem: Grievance | undefined;

    setGrievances((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          oldStatus = item.status;
          const nowTime = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const updatedTimeline = [
            ...item.timeline,
            {
              title: newStatus,
              description: resolutionNote || `Status updated to ${newStatus}`,
              timestamp: `Today, ${nowTime}`,
              status: "completed" as const,
              officerOrEntity: currentUser?.name || "Nodal Officer",
              verifiedBadge: newStatus === "Resolved & Verified" ? "Ward Nodal Officer" : undefined,
            },
          ];

          updatedItem = {
            ...item,
            status: newStatus,
            resolutionPhotoUrl: resolutionPhoto || item.resolutionPhotoUrl,
            timeline: updatedTimeline,
          };
          return updatedItem;
        }
        return item;
      })
    );

    // Persist to Cloud Firestore
    if (updatedItem) {
      updateGrievanceInFirestore(id, {
        status: newStatus,
        resolutionPhotoUrl: resolutionPhoto,
        timeline: (updatedItem as Grievance).timeline,
      }).catch((err) => {
        console.warn("Firestore update notice:", err);
      });
    }

    // Add officer action log
    const targetGrievance = grievances.find((g) => g.id === id);
    if (targetGrievance) {
      const logEntry: OfficerActionLog = {
        id: `log-${Date.now()}`,
        grievanceToken: targetGrievance.token,
        officerName: currentUser?.name || "Ward Engineer",
        actionTaken: `Status Updated to ${newStatus}`,
        previousStatus: targetGrievance.status,
        newStatus: newStatus,
        timestamp: "Just now",
        remarks: resolutionNote || "Standard administrative progression.",
        auditHash: `0x${Date.now().toString(16)}`,
      };
      setAuditLogs((prev) => [logEntry, ...prev]);
    }
  };

  // Add Work Order
  const handleAddWorkOrder = (newWorkOrder: WorkOrder) => {
    setWorkOrders((prev) => [newWorkOrder, ...prev]);
  };

  // Update Work Order Status
  const handleUpdateWorkOrderStatus = (id: string, newStatus: WorkOrder["status"]) => {
    setWorkOrders((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
    );
  };

  // Add Notice
  const handleAddNotice = (newNotice: OfficialNotice) => {
    setNotices((prev) => [newNotice, ...prev]);
  };

  // Upvote Grievance (Enforce single-vote per citizen via backend and local storage)
  const handleUpvote = async (id: string) => {
    const target = grievances.find((g) => g.id === id);
    if (!target) return;

    // Disallow if already supported by this citizen
    if (target.hasUpvoted) {
      return;
    }

    // Determine unique voter ID
    let voterId = currentUser?.email || currentUser?.phone || currentUser?.id;
    if (!voterId) {
      let storedAnonId = localStorage.getItem("janvani_citizen_anon_id");
      if (!storedAnonId) {
        storedAnonId = "citizen_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("janvani_citizen_anon_id", storedAnonId);
      }
      voterId = storedAnonId;
    }

    // Optimistically update
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, upvotes: g.upvotes + 1, hasUpvoted: true } : g
      )
    );

    // Award Nagrik Points for supporting community issue
    try {
      awardNagrikPoints(
        currentUser?.id || currentUser?.email || "default_citizen",
        "UPVOTE_GRIEVANCE",
        "Endorsed Community Issue",
        `Supported grievance: ${target.title.slice(0, 45)}...`,
        5,
        target.token
      );
    } catch (e) {
      console.warn("Point award notice:", e);
    }

    // Save locally
    try {
      const stored: string[] = JSON.parse(
        localStorage.getItem("janvani_user_upvotes") || "[]"
      );
      if (!stored.includes(id)) {
        stored.push(id);
        localStorage.setItem("janvani_user_upvotes", JSON.stringify(stored));
      }
    } catch {
      // ignore
    }

    // Backend enforcement call
    try {
      const res = await fetch(`/api/grievances/${id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: voterId,
          currentUpvotes: target.upvotes,
        }),
      });
      const data = await res.json();
      if (data && typeof data.upvotes === "number") {
        setGrievances((prev) =>
          prev.map((g) =>
            g.id === id ? { ...g, upvotes: data.upvotes, hasUpvoted: true } : g
          )
        );
      }
    } catch (err) {
      console.warn("Upvote backend sync error:", err);
    }
  };

  const handleOpenCopilotWithQuery = (query: string) => {
    setCopilotQuery(query);
    setCopilotOpen(true);
  };

  const handleTriggerReport = (prefill?: any) => {
    if (prefill) {
      setFilePrefillData(prefill);
    } else {
      setFilePrefillData(null);
    }
    if (!currentUser) {
      setAuthModalRole("citizen");
      setAuthModalOpen(true);
    } else {
      setFileModalOpen(true);
    }
  };

  const handleOpenAdminDeleteModal = (grievance: Grievance, mode: "all" | "video_only" = "all") => {
    setAdminDeleteModalGrievance(grievance);
    setAdminDeleteModalMode(mode);
    setAdminDeleteModalOpen(true);
  };

  const handleConfirmDeleteComplaint = async (grievanceId: string, reason: string) => {
    const target = grievances.find((g) => g.id === grievanceId);
    if (!target) return;

    // Filter out complaint from state
    setGrievances((prev) => prev.filter((g) => g.id !== grievanceId));
    // Remove related work order if any
    setWorkOrders((prev) => prev.filter((w) => w.grievanceId !== grievanceId && w.grievanceToken !== target.token));

    // Record admin audit log
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const log: AdminAuditLog = {
      id: `admin-log-${Date.now()}`,
      timestamp: `Today, ${nowTime}`,
      action: "DELETE_COMPLAINT",
      targetId: grievanceId,
      targetToken: target.token,
      targetTitle: target.title,
      targetCategory: target.category,
      reason,
      adminName: currentUser?.name || "Admin",
      adminEmail: currentUser?.email || "admin@janvani.gov.in",
      adminRole: currentUser?.role === "admin" || isAdminUser(currentUser) ? "Super Administrator" : "Officer Admin",
      details: `Permanent purge of complaint ${target.token} (${target.title}) from all feeds.`,
    };

    setAdminAuditLogs((prev) => {
      const updated = [log, ...prev];
      try {
        localStorage.setItem("janvani_admin_audit_logs", JSON.stringify(updated.slice(0, 100)));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleConfirmDeleteVideo = async (grievanceId: string, reason: string) => {
    const target = grievances.find((g) => g.id === grievanceId);
    if (!target) return;

    // Remove video URL from grievance while retaining complaint
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === grievanceId) {
          return {
            ...g,
            videoUrl: undefined,
            mediaType: "photo" as const,
          };
        }
        return g;
      })
    );

    // Record admin audit log
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const log: AdminAuditLog = {
      id: `admin-log-${Date.now()}`,
      timestamp: `Today, ${nowTime}`,
      action: "DELETE_VIDEO",
      targetId: grievanceId,
      targetToken: target.token,
      targetTitle: target.title,
      targetCategory: target.category,
      reason,
      adminName: currentUser?.name || "Admin",
      adminEmail: currentUser?.email || "admin@janvani.gov.in",
      adminRole: currentUser?.role === "admin" || isAdminUser(currentUser) ? "Super Administrator" : "Officer Admin",
      details: `Purged citizen video upload from complaint ${target.token}; grievance details preserved.`,
    };

    setAdminAuditLogs((prev) => {
      const updated = [log, ...prev];
      try {
        localStorage.setItem("janvani_admin_audit_logs", JSON.stringify(updated.slice(0, 100)));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleBulkDelete = (ids: string[], reason: string) => {
    if (!ids || ids.length === 0) return;
    const targetSet = new Set(ids);
    setGrievances((prev) => prev.filter((g) => !targetSet.has(g.id)));

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const log: AdminAuditLog = {
      id: `admin-log-${Date.now()}`,
      timestamp: `Today, ${nowTime}`,
      action: "BULK_DELETE_COMPLAINTS",
      targetId: ids.join(", "),
      reason,
      adminName: currentUser?.name || "Admin",
      adminEmail: currentUser?.email || "admin@janvani.gov.in",
      adminRole: "Super Administrator",
      details: `Bulk deleted ${ids.length} complaint records.`,
    };

    setAdminAuditLogs((prev) => {
      const updated = [log, ...prev];
      try {
        localStorage.setItem("janvani_admin_audit_logs", JSON.stringify(updated.slice(0, 100)));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f6f2ea] dark:bg-[#101010] text-slate-900 dark:text-[#F5F5F5] font-sans relative overflow-hidden">
        {/* Soft atmospheric ambient glow orbs in light & dark mode */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#FF6A00]/10 dark:bg-[#FF6A00]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#FF8A00]/10 dark:bg-[#FF8A00]/10 rounded-full blur-[90px] pointer-events-none" />
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          currentLanguage={currentLanguage}
          onOpenLanguageModal={() => setLanguageModalOpen(true)}
          onOpenEmergency={() => setEmergencyOpen(true)}
          t={t}
        />

        <LanguageModal
          isOpen={languageModalOpen}
          onClose={() => setLanguageModalOpen(false)}
          selectedLang={currentLanguage}
          onSelectLang={(lang) => setCurrentLanguage(lang)}
        />

        <EmergencyModal
          isOpen={emergencyOpen}
          onClose={() => setEmergencyOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f6f2ea] dark:bg-[#101010] text-slate-900 dark:text-[#F5F5F5] flex font-sans selection:bg-[#FF6A00] selection:text-white relative">
      {/* Background ambient lighting orbs */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#FF6A00]/10 dark:bg-[#FF6A00]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-[#FF8A00]/8 dark:bg-[#FF8A00]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. Left Persistent Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenCopilot={() => {
          setCopilotQuery("");
          setCopilotOpen(true);
        }}
        onOpenEmergency={() => setEmergencyOpen(true)}
        onOpenLanguageModal={() => setLanguageModalOpen(true)}
        onOpenWhatsApp={() => setWhatsAppModalOpen(true)}
        onOpenMediaScroller={() => setCurrentTab("reels")}
        onOpenAuth={() => {
          setAuthModalRole("citizen");
          setAuthModalOpen(true);
        }}
        onOpenReportModal={() => handleTriggerReport()}
        onLogout={handleLogout}
        currentLanguage={currentLanguage}
        t={t}
        grievanceCount={grievances.length}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Right Container */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen min-w-0 w-full max-w-full overflow-x-hidden p-0 lg:p-3.5 transition-all relative z-10">
        <div className="flex-1 bg-white/75 dark:bg-[#101010] backdrop-blur-2xl text-slate-900 dark:text-[#F5F5F5] rounded-none lg:rounded-[26px] border-0 lg:border border-white/80 dark:border-white/[0.08] shadow-[0_15px_50px_rgba(200,180,155,0.18)] dark:shadow-2xl flex flex-col min-w-0 w-full overflow-x-hidden min-h-screen lg:min-h-[calc(100vh-1.75rem)] transition-colors">
          {/* Header inside the workspace */}
          <Header
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            currentUser={currentUser}
            onOpenAuth={() => {
              setAuthModalRole("citizen");
              setAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            onSwitchUserRole={handleSwitchUserRole}
            onOpenLanguageModal={() => setLanguageModalOpen(true)}
            onOpenWhatsApp={() => setWhatsAppModalOpen(true)}
            onOpenCopilot={() => {
              setCopilotQuery("");
              setCopilotOpen(true);
            }}
            onOpenEmergency={() => setEmergencyOpen(true)}
            currentLanguage={currentLanguage}
            t={t}
            grievanceCount={grievances.length}
            onTrackGrievance={handleTrackByToken}
            onOpenNagrikLeaderboard={() => setNagrikModalOpen(true)}
            onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          />

          {/* Main Content Body */}
          <main
            className={`flex-1 min-w-0 w-full max-w-full transition-all ${
              currentTab === "reels"
                ? "p-0 pb-16 lg:pb-0 overflow-hidden"
                : "p-3 sm:p-5 lg:p-8 overflow-y-auto overflow-x-hidden pb-24 lg:pb-8"
            }`}
          >
            {currentTab === "dashboard" && (
              <DashboardOverview
                grievances={grievances}
                currentUser={currentUser}
                onTrackGrievance={(g) => setTrackerGrievance(g)}
                onOpenReportModal={() => handleTriggerReport()}
                onViewFeed={() => setCurrentTab("feed")}
                onViewGis={() => setCurrentTab("gis")}
                onOpenCopilot={() => {
                  setCopilotQuery("");
                  setCopilotOpen(true);
                }}
                onOpenVoiceSeva={() => setCurrentTab("voice_seva")}
                t={t}
              />
            )}

            {currentTab === "feed" && (
              <GrievanceFeed
                grievances={grievances}
                onOpenReportModal={() => handleTriggerReport()}
                onTrackGrievance={(g) => setTrackerGrievance(g)}
                onUpvoteGrievance={handleUpvote}
                onOpenMediaScroller={(g) => {
                  if (g) {
                    setCurrentTab("reels");
                  } else {
                    setCurrentTab("reels");
                  }
                }}
                t={t}
                currentUserId={currentUser?.id}
                selectedStateFilter={selectedStateFilter}
                setSelectedStateFilter={setSelectedStateFilter}
                selectedDistrictFilter={selectedDistrictFilter}
                setSelectedDistrictFilter={setSelectedDistrictFilter}
              />
            )}

            {currentTab === "reels" && (
              <CivicReelsPage
                grievances={grievances}
                onUpvoteGrievance={handleUpvote}
                onTrackGrievance={(g) => setTrackerGrievance(g)}
                t={t}
                onNavigateToFeed={() => setCurrentTab("feed")}
                currentDistrict={selectedDistrictFilter || "Dhar"}
              />
            )}

            {currentTab === "voice_seva" && (
              <VoiceComplaintOfficer
                currentUser={currentUser}
                onAddGrievance={handleAddNewGrievance}
                onTrackGrievance={(g) => setTrackerGrievance(g)}
                onNavigateToFeed={() => setCurrentTab("feed")}
                currentLanguage={currentLanguage}
                t={t}
                currentDistrict={selectedDistrictFilter || "Dhar"}
                onOpenReportModal={(prefill) => handleTriggerReport(prefill)}
              />
            )}

            {currentTab === "gis" && (
              <GisMap
                grievances={grievances}
                onTrackGrievance={(g) => setTrackerGrievance(g)}
                onOpenReportModal={() => handleTriggerReport()}
                onOpenRtiModal={(g) => setRtiGrievance(g)}
                t={t}
                selectedStateFilter={selectedStateFilter}
                setSelectedStateFilter={setSelectedStateFilter}
                selectedDistrictFilter={selectedDistrictFilter}
                setSelectedDistrictFilter={setSelectedDistrictFilter}
              />
            )}

            {currentTab === "schemes" && (
              <WelfareSchemes
                t={t}
                onOpenCopilotWithQuery={handleOpenCopilotWithQuery}
              />
            )}

            {currentTab === "nagrik_samman" && (
              <NagrikLeaderboardModal
                mode="page"
                currentUser={currentUser}
                onNavigateToFeed={() => setCurrentTab("feed")}
                onOpenReportModal={() => handleTriggerReport()}
              />
            )}

            {currentTab === "officer_suite" && currentUser?.role === "officer" && (
              <OfficerDashboard
                currentUser={currentUser}
                grievances={grievances}
                onUpdateGrievanceStatus={handleUpdateGrievanceStatus}
                onTrackGrievance={(g) => setTrackerGrievance(g)}
                workOrders={workOrders}
                onAddWorkOrder={handleAddWorkOrder}
                onUpdateWorkOrderStatus={handleUpdateWorkOrderStatus}
                notices={notices}
                onAddNotice={handleAddNotice}
                auditLogs={auditLogs}
                onAddGrievance={handleAddNewGrievance}
                t={t}
              />
            )}

            {currentTab === "admin" && (isAdminUser(currentUser) || currentUser?.role === "admin") && (
              <AdminControlCenter
                currentUser={currentUser}
                grievances={grievances}
                auditLogs={adminAuditLogs}
                onOpenDeleteModal={handleOpenAdminDeleteModal}
                onTrackGrievance={(g) => setTrackerGrievance(g)}
                onBulkDelete={handleBulkDelete}
                t={t}
              />
            )}
          </main>
        </div>
      </div>

      {/* Floating AI Bot Copilot FAB (Logo Only) */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 flex flex-col items-end gap-2 group">
        <button
          onClick={() => setCopilotOpen(true)}
          className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6A00] via-[#FF8A00] to-amber-500 text-white shadow-xl shadow-[#FF6A00]/30 hover:shadow-2xl hover:shadow-[#FF6A00]/50 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer ring-4 ring-white/90 dark:ring-[#151515]"
          aria-label="Open JanVani AI Bot"
          title="JanVani AI Assistant"
        >
          {/* Subtle ambient glow ping */}
          <span className="absolute inset-0 rounded-2xl bg-[#FF6A00]/40 animate-ping pointer-events-none opacity-30 duration-1000" />
          <Bot className="w-7 h-7 text-white drop-shadow-md relative z-10 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#151515] flex items-center justify-center z-20 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </span>
        </button>
      </div>

      {/* 3. Mobile Sticky Bottom Navigation Dock (Phones & Portrait Tablets) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#151515]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/[0.08] px-3 py-2 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.08)] safe-area-bottom"
      >
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => setCurrentTab("dashboard")}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all min-h-[44px] min-w-[54px] ${
            currentTab === "dashboard"
              ? "text-[#FF6A00] font-bold"
              : "text-slate-500 hover:text-slate-900 dark:text-[#A8A8A8] dark:hover:text-[#F5F5F5]"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{t.dashboard || "Home"}</span>
        </button>

        {/* Tab 2: Feed */}
        <button
          onClick={() => setCurrentTab("feed")}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all min-h-[44px] min-w-[48px] relative ${
            currentTab === "feed"
              ? "text-[#FF6A00] font-bold"
              : "text-slate-500 hover:text-slate-900 dark:text-[#A8A8A8] dark:hover:text-[#F5F5F5]"
          }`}
        >
          <FileCheck2 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{t.grievanceFeed || "Feed"}</span>
          {grievances.length > 0 && (
            <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6A00] ring-2 ring-white dark:ring-[#151515]" />
          )}
        </button>

        {/* Tab 2: Voice Seva (AI Voice Officer) */}
        <button
          onClick={() => setCurrentTab("voice_seva")}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all min-h-[44px] min-w-[48px] relative ${
            currentTab === "voice_seva"
              ? "text-[#FF6A00] font-bold"
              : "text-slate-500 hover:text-slate-900 dark:text-[#A8A8A8] dark:hover:text-[#F5F5F5]"
          }`}
        >
          <Mic className="w-5 h-5 text-[#FF6A00]" />
          <span className="text-[10px] tracking-tight">Voice Seva</span>
          <span className="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </button>

        {/* Tab 2.5: Civic Media Reels (Instagram Style) */}
        <button
          onClick={() => setCurrentTab("reels")}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all min-h-[44px] min-w-[48px] relative ${
            currentTab === "reels"
              ? "text-[#FF6A00] font-bold"
              : "text-slate-500 hover:text-slate-900 dark:text-[#A8A8A8] dark:hover:text-[#F5F5F5]"
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Reels</span>
          <span className="absolute top-0.5 right-1 text-[7px] font-black px-1 rounded-full bg-[#FF6A00] text-white">
            HOT
          </span>
        </button>

        {/* Tab 3: Center Report Issue Action (Prominent 44px+ hit area) */}
        <button
          onClick={() => handleTriggerReport()}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer"
          aria-label="Report Civic Issue"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF6A00] to-[#FF8A00] text-white flex items-center justify-center shadow-lg shadow-[#FF6A00]/40 ring-4 ring-white dark:ring-[#151515] active:scale-90 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-black text-[#FF6A00] mt-0.5 tracking-tight uppercase">
            {t.fileGrievanceBtn || t.reportCivicIssue || "Report"}
          </span>
        </button>

        {/* Tab 4: GIS Map */}
        <button
          onClick={() => setCurrentTab("gis")}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all min-h-[44px] min-w-[54px] ${
            currentTab === "gis"
              ? "text-[#FF6A00] font-bold"
              : "text-slate-500 hover:text-slate-900 dark:text-[#A8A8A8] dark:hover:text-[#F5F5F5]"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{t.gisMaps || "GIS Map"}</span>
        </button>

        {/* Tab 5: Welfare Schemes or Officer Suite */}
        {currentUser?.role === "officer" ? (
          <button
            onClick={() => setCurrentTab("officer_suite")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all min-h-[44px] min-w-[54px] ${
              currentTab === "officer_suite"
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-[#A8A8A8] dark:hover:text-[#F5F5F5]"
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{t.officerRole || "Officer"}</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentTab("schemes")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all min-h-[44px] min-w-[54px] ${
              currentTab === "schemes"
                ? "text-[#FF6A00] font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-[#A8A8A8] dark:hover:text-[#F5F5F5]"
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{t.welfareSchemes || "Schemes"}</span>
          </button>
        )}
      </nav>

      {/* 4. Modals & Drawers */}
      <FirebaseSecureAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={authModalRole}
      />

      <GoogleAuthModal
        isOpen={googleAuthOpen}
        onClose={() => setGoogleAuthOpen(false)}
        onSuccess={handleLoginSuccess}
        defaultRole={googleAuthRole}
      />

      <FileGrievanceModal
        isOpen={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        onSubmit={handleAddNewGrievance}
        currentUser={currentUser}
        t={t}
        prefillData={filePrefillData}
      />

      <TrackerModal
        grievance={trackerGrievance}
        isOpen={!!trackerGrievance}
        onClose={() => setTrackerGrievance(null)}
        onPrintReceipt={(g) => setReceiptGrievance(g)}
        onDraftRti={(g) => setRtiGrievance(g)}
        onCallOfficer={(g) => setCallOfficerGrievance(g)}
        t={t}
        currentUser={currentUser}
      />

      <CopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        currentUser={currentUser}
        initialQuery={copilotQuery}
        t={t}
      />

      <RtiModal
        isOpen={!!rtiGrievance}
        onClose={() => setRtiGrievance(null)}
        grievance={rtiGrievance}
        currentUser={currentUser}
      />

      <ReceiptModal
        isOpen={!!receiptGrievance}
        onClose={() => setReceiptGrievance(null)}
        grievance={receiptGrievance}
        currentUser={currentUser}
      />

      <CallOfficerModal
        isOpen={!!callOfficerGrievance}
        onClose={() => setCallOfficerGrievance(null)}
        grievance={callOfficerGrievance}
      />

      <EmergencyModal
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />

      <LanguageModal
        isOpen={languageModalOpen}
        onClose={() => setLanguageModalOpen(false)}
        selectedLang={currentLanguage}
        onSelectLang={(lang) => setCurrentLanguage(lang)}
        t={t}
      />

      <WhatsAppGrievanceModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        currentUser={currentUser}
        onAutoRegisterGrievance={(newGrievance) => {
          handleAddNewGrievance(newGrievance);
        }}
        t={t}
      />

      {mediaScrollerOpen && (
        <CivicMediaScroller
          grievances={grievances}
          initialIndex={mediaScrollerInitialIndex}
          onUpvote={handleUpvote}
          onTrack={(g) => {
            setMediaScrollerOpen(false);
            setTrackerGrievance(g);
          }}
          t={t}
          mode="modal"
          onClose={() => setMediaScrollerOpen(false)}
        />
      )}

      <AdminDeleteConfirmationModal
        isOpen={adminDeleteModalOpen}
        onClose={() => {
          setAdminDeleteModalOpen(false);
          setAdminDeleteModalGrievance(null);
        }}
        grievance={adminDeleteModalGrievance}
        currentUser={currentUser}
        onConfirmDeleteComplaint={handleConfirmDeleteComplaint}
        onConfirmDeleteVideo={handleConfirmDeleteVideo}
        initialMode={adminDeleteModalMode}
      />

      <NagrikLeaderboardModal
        isOpen={nagrikModalOpen}
        onClose={() => setNagrikModalOpen(false)}
        currentUser={currentUser}
        onNavigateToFeed={() => {
          setNagrikModalOpen(false);
          setCurrentTab("feed");
        }}
        onOpenReportModal={() => {
          setNagrikModalOpen(false);
          handleTriggerReport();
        }}
      />

      <NagrikPointToast />
    </div>
  );
}

export default App;
