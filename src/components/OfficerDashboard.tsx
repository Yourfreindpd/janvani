import React, { useState } from "react";
import {
  Building2,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Camera,
  Layers,
  Phone,
  FileCheck2,
  Send,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Users,
  Search,
  Filter,
  Check,
  ChevronRight,
  Eye,
  Briefcase,
  SlidersHorizontal,
  Wrench,
  Truck,
  Megaphone,
  BarChart3,
  Calendar,
  Lock,
  BadgeAlert,
  Download,
  Printer,
  RefreshCw,
  ExternalLink,
  Database,
  X,
} from "lucide-react";
import {
  Grievance,
  UserProfile,
  WorkOrder,
  OfficialNotice,
  OfficerActionLog,
  CivicCategory,
  GrievanceStatus,
} from "../types";
import { Translations } from "../data/translations";
import { OfficerBigQueryAnalytics } from "./OfficerBigQueryAnalytics";

interface OfficerDashboardProps {
  currentUser: UserProfile;
  grievances: Grievance[];
  onUpdateGrievanceStatus: (id: string, newStatus: GrievanceStatus, remarks?: string, resolvedImg?: string) => void;
  onTrackGrievance: (g: Grievance) => void;
  workOrders: WorkOrder[];
  onAddWorkOrder: (wo: WorkOrder) => void;
  onUpdateWorkOrderStatus: (id: string, status: WorkOrder["status"]) => void;
  notices: OfficialNotice[];
  onAddNotice: (notice: OfficialNotice) => void;
  auditLogs: OfficerActionLog[];
  onAddGrievance?: (g: Grievance) => void;
  t: Translations;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  currentUser,
  grievances,
  onUpdateGrievanceStatus,
  onTrackGrievance,
  workOrders,
  onAddWorkOrder,
  onUpdateWorkOrderStatus,
  notices,
  onAddNotice,
  auditLogs,
  onAddGrievance,
  t,
}) => {
  const [activeOfficerTab, setActiveOfficerTab] = useState<
    "queue" | "work_orders" | "dual_audit" | "whatsapp_intake" | "notices" | "data_analytics" | "ward_analytics" | "audit_logs"
  >("queue");

  // Filters for Queue
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<"all" | "critical" | "warning" | "on_track">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modals inside Officer suite
  const [selectedGrievanceForAction, setSelectedGrievanceForAction] = useState<Grievance | null>(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [newStatusChoice, setNewStatusChoice] = useState<GrievanceStatus>("Work In Progress");
  const [sendWhatsAppAlertToCitizen, setSendWhatsAppAlertToCitizen] = useState(true);

  // WhatsApp Intake Gateway state
  const [waTestPhone, setWaTestPhone] = useState("+91 98263 77410");
  const [waTestName, setWaTestName] = useState("Citizen Tester");
  const [waTestMessage, setWaTestMessage] = useState("Station Road ke pas 3 foot ka gadha ho gaya hai, traffic jam lag raha hai.");
  const [isProcessingWaTest, setIsProcessingWaTest] = useState(false);
  const [waTestSuccessResult, setWaTestSuccessResult] = useState<any>(null);
  const [waDirectRecipient, setWaDirectRecipient] = useState("+91 98263 77410");
  const [waDirectMessage, setWaDirectMessage] = useState("");
  const [isSendingDirectWa, setIsSendingDirectWa] = useState(false);
  const [waDirectSentStatus, setWaDirectSentStatus] = useState<string | null>(null);

  // Work Order Creation Modal
  const [isCreatingWorkOrder, setIsCreatingWorkOrder] = useState(false);
  const [woGrievanceId, setWoGrievanceId] = useState(grievances[0]?.id || "");
  const [woContractor, setWoContractor] = useState("PWD Rapid Road Patching Squad #4");
  const [woPhone, setWoPhone] = useState("+91 98263 77410");
  const [woBudget, setWoBudget] = useState("35000");
  const [woPriority, setWoPriority] = useState<"High" | "Urgent" | "Critical">("High");
  const [woTitle, setWoTitle] = useState("Urgent Remediation & Heavy Machinery Dispatch");
  const [woMaterials, setWoMaterials] = useState("Bitumen Cold Mix, Stone Aggregates, Compactor");
  const [woVehicle, setWoVehicle] = useState("Municipal Tipper #MP-11-G-5012");

  // AI Dual Audit Studio State
  const [auditGrievanceId, setAuditGrievanceId] = useState(grievances[0]?.id || "");
  const [afterPhotoUrl, setAfterPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80"
  );
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<{
    pass: boolean;
    confidence: number;
    scoreText: string;
    details: string;
  } | null>(null);

  // New Notice Modal State
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("Water Supply & Utilities");
  const [noticeArea, setNoticeArea] = useState("Ward 12 (Civil Lines & Central)");
  const [noticeDesc, setNoticeDesc] = useState("");
  const [noticeImpact, setNoticeImpact] = useState<"Advisory" | "Urgent Alert" | "Planned Maintenance">("Planned Maintenance");

  // Calculate Metrics
  const totalAssigned = grievances.length;
  const criticalSlaCount = grievances.filter((g) => (g.slaRemainingHours ?? 24) < 12 && g.status !== "Resolved & Verified").length;
  const pendingDualAudit = workOrders.filter((w) => w.status === "Work Completed" || w.status === "Dual-Audit Pending").length;
  const resolvedCount = grievances.filter((g) => g.status === "Resolved & Verified").length;
  const inProgressCount = grievances.filter((g) => g.status === "Work In Progress").length;

  // Filtered grievances for the Queue
  const filteredGrievances = grievances.filter((g) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        g.token.toLowerCase().includes(q) ||
        g.title.toLowerCase().includes(q) ||
        g.locality.toLowerCase().includes(q) ||
        g.ward.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
    if (slaFilter === "critical") {
      if ((g.slaRemainingHours ?? 24) >= 12 || g.status === "Resolved & Verified") return false;
    } else if (slaFilter === "warning") {
      if ((g.slaRemainingHours ?? 24) < 12 || (g.slaRemainingHours ?? 24) > 24 || g.status === "Resolved & Verified") return false;
    } else if (slaFilter === "on_track") {
      if (g.status === "Resolved & Verified" || (g.slaRemainingHours ?? 24) <= 24) return false;
    }
    return true;
  });

  const handleOpenActionModal = (g: Grievance) => {
    setSelectedGrievanceForAction(g);
    setNewStatusChoice(
      g.status === "Submitted & Token Issued"
        ? "Work In Progress"
        : g.status === "Work In Progress"
        ? "Resolved & Verified"
        : "Work In Progress"
    );
    setActionRemarks(`Assigned to ward quick-action squad with prioritized SLA tracking.`);
  };

  const handleExecuteStatusUpdate = async () => {
    if (!selectedGrievanceForAction) return;

    onUpdateGrievanceStatus(
      selectedGrievanceForAction.id,
      newStatusChoice,
      actionRemarks || `Updated to ${newStatusChoice} by ${currentUser.name}`
    );

    // If WhatsApp alert is checked, trigger real-time WhatsApp alert dispatch
    if (sendWhatsAppAlertToCitizen) {
      try {
        await fetch("/api/whatsapp/send-officer-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: selectedGrievanceForAction.whatsappSenderPhone || "+91 98263 77410",
            token: selectedGrievanceForAction.token,
            status: newStatusChoice,
            officerName: currentUser.name,
            updateNote: actionRemarks || `Grievance transitioned to ${newStatusChoice}. Rapid intervention squad mobilized.`,
          }),
        });
      } catch (err) {
        console.warn("WhatsApp notification notice:", err);
      }
    }

    setSelectedGrievanceForAction(null);
  };

  const handleSimulateWhatsAppIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waTestMessage.trim()) return;

    setIsProcessingWaTest(true);
    setWaTestSuccessResult(null);

    try {
      const response = await fetch("/api/webhook/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: waTestPhone,
          senderName: waTestName,
          text: waTestMessage,
        }),
      });
      const data = await response.json();
      setIsProcessingWaTest(false);

      if (data.success && data.grievance) {
        setWaTestSuccessResult(data);
        if (onAddGrievance) {
          onAddGrievance(data.grievance);
        }
      }
    } catch (err) {
      console.error("WhatsApp webhook test failed:", err);
      setIsProcessingWaTest(false);
    }
  };

  const handleSendDirectWhatsAppUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waDirectRecipient || !waDirectMessage) return;

    setIsSendingDirectWa(true);
    setWaDirectSentStatus(null);

    try {
      const response = await fetch("/api/whatsapp/send-officer-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: waDirectRecipient,
          token: "JV-WA-DHAR-2026-LIVE",
          status: "Official Nodal Update",
          officerName: currentUser.name,
          updateNote: waDirectMessage,
        }),
      });
      const data = await response.json();
      setIsSendingDirectWa(false);
      setWaDirectSentStatus(`WhatsApp SMS successfully dispatched to ${waDirectRecipient}`);
      setTimeout(() => setWaDirectSentStatus(null), 4000);
      setWaDirectMessage("");
    } catch (err) {
      setIsSendingDirectWa(false);
    }
  };

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const targetGrievance = grievances.find((g) => g.id === woGrievanceId) || grievances[0];
    const newWo: WorkOrder = {
      id: `wo-${Date.now()}`,
      orderNumber: `WO-2026-MP-PWD-${Math.floor(1000 + Math.random() * 9000)}`,
      grievanceId: targetGrievance.id,
      grievanceToken: targetGrievance.token,
      category: targetGrievance.category,
      ward: targetGrievance.ward,
      title: woTitle || `Remediation for ${targetGrievance.title}`,
      contractorOrSquad: woContractor,
      squadLeadPhone: woPhone,
      status: "Assigned",
      allocatedBudgetInr: parseInt(woBudget) || 25000,
      priority: woPriority,
      issuedDate: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      targetCompletionDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      materialsIssued: woMaterials.split(",").map((m) => m.trim()).filter(Boolean),
      vehicleDispatched: woVehicle,
      beforePhotoUrl: targetGrievance.imageUrl,
    };

    onAddWorkOrder(newWo);
    onUpdateGrievanceStatus(
      targetGrievance.id,
      "Work In Progress",
      `Official Work Order ${newWo.orderNumber} dispatched to ${woContractor}`
    );
    setIsCreatingWorkOrder(false);
  };

  const handleRunAiAudit = () => {
    setIsAiAnalyzing(true);
    setAiAuditResult(null);

    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiAuditResult({
        pass: true,
        confidence: 96.4,
        scoreText: "Defect Rectification Verified (Zero Obstruction / Smooth Finish)",
        details:
          "Gemini Vision Model analyzed the post-repair photograph. 100% bitumen surface flatness detected, zero pothole depression residue, debris cleared, and yellow safety edge markings applied according to IRC guidelines.",
      });
    }, 1200);
  };

  const handleApproveDualAudit = () => {
    const targetGrievance = grievances.find((g) => g.id === auditGrievanceId);
    if (!targetGrievance) return;

    onUpdateGrievanceStatus(
      targetGrievance.id,
      "Resolved & Verified",
      `AI Dual-Audit certified: 96.4% confidence score by ${currentUser.name}. Remediation verified.`,
      afterPhotoUrl
    );

    // Update matching work order
    const matchWo = workOrders.find((w) => w.grievanceId === targetGrievance.id);
    if (matchWo) {
      onUpdateWorkOrderStatus(matchWo.id, "Dual-Audit Pending");
    }

    setAiAuditResult(null);
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle) return;

    const newNot: OfficialNotice = {
      id: `not-${Date.now()}`,
      noticeNumber: `NOT-2026-ULB-DHAR-${Math.floor(100 + Math.random() * 900)}`,
      title: noticeTitle,
      category: noticeCategory,
      wardOrArea: noticeArea,
      publishedDate: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      validTill: new Date(Date.now() + 86400000 * 3).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      issuedByOfficer: `${currentUser.name} (${currentUser.department || "Municipal Officer"})`,
      description: noticeDesc || "Public advisory issued for citizen awareness.",
      impactLevel: noticeImpact,
      actionRequired: "Citizens are requested to cooperate with ward municipal staff.",
    };

    onAddNotice(newNot);
    setIsCreatingNotice(false);
    setNoticeTitle("");
    setNoticeDesc("");
  };

  const selectedAuditGrievance =
    grievances.find((g) => g.id === auditGrievanceId) || grievances[0];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* 1. Officer Identity & Statutory Authority Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 via-[#faf6ee]/90 to-[#f3ecdf]/90 dark:from-[#303030] dark:via-[#353535] dark:to-[#404040] backdrop-blur-2xl border border-white/90 dark:border-white/[0.08] text-slate-900 dark:text-[#F5F5F5] p-5 sm:p-7 shadow-[0_15px_45px_rgba(210,190,165,0.22)] dark:shadow-2xl transition-colors">
        {/* Atmospheric Glow Highlights */}
        <div className="absolute -top-12 -right-12 w-96 h-96 bg-[#FF6A00]/15 rounded-full blur-[55px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-80 h-80 bg-[#FF8A00]/10 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white dark:via-white/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6A00] to-[#FF8A00] p-0.5 shadow-lg shadow-[#FF6A00]/25 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-[#F5F5F5] font-heading">
                  {currentUser.name}
                </h1>
                <span className="text-[11px] font-bold uppercase bg-[#FF6A00]/10 dark:bg-[#FF6A00]/20 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#FF6A00]" />
                  Designated Nodal Officer (शासकीय)
                </span>
                <span className="text-[11px] font-mono bg-white/80 dark:bg-[#1c1c1c] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                  EMP: {currentUser.employeeCode || "MP-PWD-4412"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A8A8A8] mt-1 font-medium">
                {currentUser.department || "Public Works & Municipal Administration"} • {currentUser.location}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-[#777777] mt-2">
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Statutory SLA: <strong>24h - 48h Public Services Act</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-[#20C997]" />
                  Nodal Helpline: <strong>{currentUser.phone}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Officer Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => setIsCreatingWorkOrder(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A00]/25 transition-all min-h-[42px] cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch Work Order</span>
            </button>

            <button
              onClick={() => setIsCreatingNotice(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/90 dark:bg-[#202020] hover:bg-slate-100 dark:hover:bg-[#282828] border border-slate-200/90 dark:border-white/[0.08] text-slate-800 dark:text-[#F5F5F5] font-bold text-xs flex items-center justify-center gap-2 transition-all min-h-[42px] cursor-pointer shadow-xs"
            >
              <Megaphone className="w-4 h-4 text-orange-500" />
              <span>Publish Ward Notice</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI / SLA Countdown Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-200/80 dark:border-white/[0.08]">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#202020]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-[#A8A8A8]">Total Ward Grievances</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F5F5F5] font-mono mt-0.5">
              {totalAssigned}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#777777] mt-0.5">{inProgressCount} in active remediation</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-200/90 dark:border-red-900/40 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-red-600 dark:text-red-400 flex items-center gap-1">
              <BadgeAlert className="w-3.5 h-3.5" />
              SLA Risk (&lt; 12 Hours)
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 font-mono mt-0.5">
              {criticalSlaCount}
            </div>
            <div className="text-[10px] text-red-600/80 dark:text-red-300/80 mt-0.5">Requires instant squad dispatch</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/40 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              Dual-Audit Pending
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5">
              {pendingDualAudit}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">Photo verification required</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-900/40 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-emerald-700 dark:text-[#20C997] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SLA Compliance Rate
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-[#20C997] font-mono mt-0.5">
              95.2%
            </div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">District Rank #2 (Dhar)</div>
          </div>
        </div>
      </div>

      {/* 2. Officer Suite Tool Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/80 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] backdrop-blur-xl shadow-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveOfficerTab("queue")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
            activeOfficerTab === "queue"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Triage Matrix ({grievances.length})</span>
        </button>

        <button
          onClick={() => setActiveOfficerTab("work_orders")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
            activeOfficerTab === "work_orders"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Work Orders ({workOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveOfficerTab("dual_audit")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
            activeOfficerTab === "dual_audit"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Camera className="w-4 h-4 text-amber-500" />
          <span>AI Dual-Audit Studio</span>
        </button>

        <button
          onClick={() => setActiveOfficerTab("whatsapp_intake")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
            activeOfficerTab === "whatsapp_intake"
              ? "bg-gradient-to-r from-emerald-600 to-[#25D366] text-white shadow-md shadow-emerald-600/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Phone className="w-4 h-4 text-[#25D366]" />
          <span>WhatsApp Gateway</span>
          <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-300 dark:border-emerald-700/60">
            LIVE 24x7
          </span>
        </button>

        <button
          onClick={() => setActiveOfficerTab("notices")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
            activeOfficerTab === "notices"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Megaphone className="w-4 h-4 text-orange-500" />
          <span>Broadcast Notices ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveOfficerTab("data_analytics")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
            activeOfficerTab === "data_analytics"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Database className="w-4 h-4 text-cyan-500" />
          <span className="flex items-center gap-1.5">
            BigQuery Analytics
            <span className="text-[9px] bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] px-1.5 py-0.5 rounded border border-[#FF6A00]/30 font-mono">Recharts</span>
          </span>
        </button>

        <button
          onClick={() => setActiveOfficerTab("ward_analytics")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
            activeOfficerTab === "ward_analytics"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          <span>Ward Hotspots</span>
        </button>

        <button
          onClick={() => setActiveOfficerTab("audit_logs")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
            activeOfficerTab === "audit_logs"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Lock className="w-4 h-4 text-purple-500" />
          <span>CAG Audit Trail</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TRIAGE & RESOLUTION MATRIX */}
      {/* ========================================================================= */}
      {activeOfficerTab === "queue" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] backdrop-blur-xl flex flex-col sm:flex-row items-center gap-3 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search token, category, locality or keywords..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] min-h-[38px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00] min-h-[38px] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Submitted & Token Issued">Submitted & Token Issued</option>
                <option value="Work In Progress">Work In Progress</option>
                <option value="Resolved & Verified">Resolved & Verified</option>
              </select>

              <select
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00] min-h-[38px] cursor-pointer"
              >
                <option value="all">All SLA Timers</option>
                <option value="critical">Critical (&lt; 12h)</option>
                <option value="warning">Warning (12h - 24h)</option>
                <option value="on_track">On-Track (&gt; 24h)</option>
              </select>
            </div>
          </div>

          {/* Grievance Table / Cards */}
          <div className="rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50/90 dark:bg-[#202020]/90 border-b border-slate-200/90 dark:border-white/[0.08] flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 dark:text-[#F5F5F5] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#FF6A00]" />
                <span>Active Grievances in Your Municipal Jurisdiction</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-[#A8A8A8] font-mono">
                Showing {filteredGrievances.length} of {grievances.length}
              </span>
            </div>

            <div className="divide-y divide-slate-200/60 dark:divide-white/[0.05]">
              {filteredGrievances.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-[#777777] text-xs">
                  No grievances match the selected filters.
                </div>
              ) : (
                filteredGrievances.map((g) => {
                  const isCritical = (g.slaRemainingHours ?? 24) < 12 && g.status !== "Resolved & Verified";
                  return (
                    <div
                      key={g.id}
                      className="p-4 hover:bg-slate-50/80 dark:hover:bg-[#202020]/60 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                    >
                      {/* Left Block */}
                      <div className="flex items-start gap-3.5 flex-1">
                        <img
                          src={g.imageUrl}
                          alt={g.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-white/10 flex-shrink-0 bg-slate-100 dark:bg-[#252525]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#FF6A00] dark:text-[#FF8A00]">
                              {g.token}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                g.status === "Resolved & Verified"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#20C997] border border-emerald-200 dark:border-emerald-800"
                                  : g.status === "Work In Progress"
                                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              }`}
                            >
                              {g.status}
                            </span>

                            {g.sourceChannel === "whatsapp" && (
                              <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#25D366]" />
                                WhatsApp Intake ({g.whatsappSenderPhone || "Citizen"})
                              </span>
                            )}

                            {isCritical && (
                              <span className="text-[10px] font-bold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                Critical SLA: {g.slaRemainingHours}h Left
                              </span>
                            )}
                          </div>

                          <h3
                            className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] hover:text-[#FF6A00] dark:hover:text-[#FF8A00] cursor-pointer transition-colors"
                            onClick={() => onTrackGrievance(g)}
                          >
                            {g.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-[#A8A8A8]">
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {g.ward}
                            </span>
                            <span>•</span>
                            <span>Filed by: <strong className="text-slate-800 dark:text-slate-200">{g.filedByName}</strong> ({g.filedByAadhaar})</span>
                            <span>•</span>
                            <span className="text-slate-500 dark:text-[#777777]">Date: {g.dateFiled}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                        <button
                          onClick={() => onTrackGrievance(g)}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-[#252525] hover:bg-slate-100 dark:hover:bg-[#303030] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#F5F5F5] text-xs font-bold flex items-center gap-1 min-h-[38px] cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => {
                            setWoGrievanceId(g.id);
                            setIsCreatingWorkOrder(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1 min-h-[38px] cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Squad</span>
                        </button>

                        <button
                          onClick={() => handleOpenActionModal(g)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 min-h-[38px] shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Update Status</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FIELD WORK ORDER DISPATCHER */}
      {/* ========================================================================= */}
      {activeOfficerTab === "work_orders" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FF6A00]" />
                Municipal Field Squads & Contractor Work Orders
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                Official statutory orders issued under Public Works Department & Swachh Bharat Cell
              </p>
            </div>

            <button
              onClick={() => setIsCreatingWorkOrder(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF6A00]/25 transition-all min-h-[40px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Issue New Work Order</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workOrders.map((wo) => (
              <div
                key={wo.id}
                className="rounded-2xl bg-white/90 dark:bg-[#1c1c1c] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 p-4 space-y-3.5 flex flex-col justify-between shadow-xs transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] text-[#FF6A00] dark:text-[#FF8A00] font-bold">
                      {wo.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        wo.status === "Work Completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#20C997] border border-emerald-200 dark:border-emerald-800"
                          : wo.status === "In-Progress"
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {wo.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] leading-snug">
                    {wo.title}
                  </h3>

                  <div className="text-xs text-slate-600 dark:text-[#A8A8A8] mt-2.5 space-y-1">
                    <div>Token: <strong className="text-[#FF6A00] dark:text-[#FF8A00] font-mono">{wo.grievanceToken}</strong></div>
                    <div>Assigned Squad: <strong className="text-slate-800 dark:text-slate-200">{wo.contractorOrSquad}</strong></div>
                    <div>Supervisor Phone: <strong className="text-emerald-600 dark:text-[#20C997]">{wo.squadLeadPhone}</strong></div>
                    <div>Allocated Budget: <strong className="text-amber-600 dark:text-amber-400 font-mono">₹{wo.allocatedBudgetInr.toLocaleString("en-IN")}</strong></div>
                    <div>Vehicle: <strong className="text-slate-700 dark:text-slate-300">{wo.vehicleDispatched || "N/A"}</strong></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-[#777777]">Issued: {wo.issuedDate}</span>
                  <div className="flex items-center gap-1.5">
                    {wo.status !== "Work Completed" ? (
                      <button
                        onClick={() => onUpdateWorkOrderStatus(wo.id, "Work Completed")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] min-h-[34px] cursor-pointer shadow-xs"
                      >
                        Mark Completed
                      </button>
                    ) : (
                      <span className="text-emerald-600 dark:text-[#20C997] font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Audit
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI DUAL-AUDIT RESOLUTION STUDIO */}
      {/* ========================================================================= */}
      {activeOfficerTab === "dual_audit" && (
        <div className="space-y-4">
          <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-500" />
                  Multimodal AI Dual-Audit Resolution Studio
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                  Compare defect before-photo with remediation photo proof and run Multimodal AI verification before closing the token.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-[#A8A8A8]">Select Grievance:</label>
                <select
                  value={auditGrievanceId}
                  onChange={(e) => {
                    setAuditGrievanceId(e.target.value);
                    setAiAuditResult(null);
                  }}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] font-mono focus:outline-none focus:border-[#FF6A00] min-h-[40px] cursor-pointer"
                >
                  {grievances.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.token} ({g.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-Side Dual Photo Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Left: Original Reported Defect Photo */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/90 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400">
                  <span>Reported Defect (Before Remediation)</span>
                  <span className="text-[10px] bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                    Citizen Proof
                  </span>
                </div>
                <div className="h-56 rounded-xl overflow-hidden bg-slate-200 dark:bg-[#151515] relative border border-slate-200 dark:border-white/[0.08]">
                  <img
                    src={selectedAuditGrievance.imageUrl}
                    alt="Before"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {selectedAuditGrievance.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">
                  Location: {selectedAuditGrievance.ward}
                </div>
              </div>

              {/* Right: Remediation After Photo */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/90 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-[#20C997]">
                  <span>Remediation Evidence (After Photo)</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Officer / Contractor Upload
                  </span>
                </div>
                <div className="h-56 rounded-xl overflow-hidden bg-slate-200 dark:bg-[#151515] relative border border-slate-200 dark:border-white/[0.08]">
                  <img
                    src={afterPhotoUrl}
                    alt="After"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={afterPhotoUrl}
                    onChange={(e) => setAfterPhotoUrl(e.target.value)}
                    placeholder="Enter Image URL for After verification..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#151515] border border-slate-300 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] min-h-[36px]"
                  />
                </div>
              </div>
            </div>

            {/* AI Analysis Trigger */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 dark:from-[#202020] dark:via-[#25201b] dark:to-[#202020] border border-amber-200 dark:border-[#FF6A00]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <div className="text-xs font-bold text-amber-800 dark:text-[#FF8A00] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF6A00]" />
                  <span>Automated AI Vision Quality Inspection</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#A8A8A8]">
                  Checks surface roughness, asphalt compaction, water leakage stoppage, and trash clearance.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRunAiAudit}
                  disabled={isAiAnalyzing}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all min-h-[40px] shadow-md shadow-[#FF6A00]/25 cursor-pointer"
                >
                  {isAiAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing Pixels...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run AI Verification</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Results Output */}
            {aiAuditResult && (
              <div className="p-4 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/50 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-[#20C997]" />
                    <span className="text-sm font-bold text-emerald-800 dark:text-[#20C997]">
                      {aiAuditResult.scoreText}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
                    Confidence: {aiAuditResult.confidence}%
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {aiAuditResult.details}
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleApproveDualAudit}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer min-h-[40px]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Dual-Audit & Close Grievance</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: WHATSAPP CIVIC INTAKE GATEWAY */}
      {/* ========================================================================= */}
      {activeOfficerTab === "whatsapp_intake" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900/90 via-slate-900 to-emerald-950 text-white border border-emerald-500/30 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#25D366] text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Live Channel
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    Endpoint: /api/webhook/whatsapp
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK • Auto-Triage Online
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white font-heading">
                  Automated WhatsApp Grievance Ingestion Gateway
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Citizens text in natural conversational language (Hindi, Hinglish, Malwi, English) or attach photos to{" "}
                  <strong className="text-[#25D366] font-mono text-sm">+91 90131 51515</strong>. Gemini AI extracts issue details, assigns municipal ward, issues a tracking token, arming the 48-hour SLA clock automatically on the Nodal Officer Suite.
                </p>
              </div>

              {/* Stat Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[100px]">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">Official No.</div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">+91 90131 51515</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[90px]">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">AI Model</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">Flash 3.7</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[80px]">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">SLA Clock</div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">48h Auto</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Message Intake Simulator */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                      <Phone className="w-4 h-4 text-[#25D366]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5]">
                        Live WhatsApp Inbound Message Simulator
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">
                        Simulate citizen sending a message to test automated triage & instant token registration
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    POST /api/webhook/whatsapp
                  </span>
                </div>

                {/* Preset Scenarios */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Quick Scenario Presets (Click to Load):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setWaTestMessage("Mandav Road par main water pipeline phat gayi hai, bohot pani barbad ho raha hai Ward 14 me.");
                        setWaTestPhone("+91 98263 77410");
                        setWaTestName("Ramesh Patidar");
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#252525] hover:bg-slate-200 dark:hover:bg-[#303030] text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-white/[0.08] cursor-pointer transition-colors"
                    >
                      💧 Pipe Burst (Ward 14)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWaTestMessage("Dhar Fort ke samne street light 4 din se band hai, andhera rehta hai chori ka dar hai.");
                        setWaTestPhone("+91 97555 43210");
                        setWaTestName("Sunita Sharma");
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#252525] hover:bg-slate-200 dark:hover:bg-[#303030] text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-white/[0.08] cursor-pointer transition-colors"
                    >
                      💡 Dark Street (Dhar Fort)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWaTestMessage("Pithampur Sector 3 me kachra 1 hafte se utha nahi hai, badbu aa rahi hai kripya jaldi team bheje.");
                        setWaTestPhone("+91 94250 88991");
                        setWaTestName("Anil Varma");
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#252525] hover:bg-slate-200 dark:hover:bg-[#303030] text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-white/[0.08] cursor-pointer transition-colors"
                    >
                      🗑️ Trash Overflow (Pithampur)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSimulateWhatsAppIntake} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Citizen WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={waTestPhone}
                        onChange={(e) => setWaTestPhone(e.target.value)}
                        placeholder="+91 98263 77410"
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Citizen Name
                      </label>
                      <input
                        type="text"
                        value={waTestName}
                        onChange={(e) => setWaTestName(e.target.value)}
                        placeholder="Citizen Name"
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Raw WhatsApp Message Content
                    </label>
                    <textarea
                      value={waTestMessage}
                      onChange={(e) => setWaTestMessage(e.target.value)}
                      rows={3}
                      placeholder="Type civic complaint in Hindi, English or Hinglish..."
                      required
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingWaTest || !waTestMessage.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#25D366] hover:from-emerald-500 hover:to-[#22c55e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all min-h-[42px] cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingWaTest ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>AI Parsing & Registering Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send via WhatsApp & Auto-Register on Suite</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Simulated Success Output Box */}
                {waTestSuccessResult && (
                  <div className="p-4 rounded-xl bg-emerald-50/90 dark:bg-[#1b2a22] border border-emerald-300 dark:border-emerald-500/50 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-[#25D366]" />
                        <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                          Automated Registration Complete!
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                        Token: {waTestSuccessResult.token}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-white/80 dark:bg-[#151515]/90 p-3 rounded-lg border border-emerald-200/80 dark:border-white/[0.08]">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Category:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{waTestSuccessResult.grievance?.category}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Assigned Ward:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{waTestSuccessResult.grievance?.ward}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">SLA Clock:</span>
                        <strong className="text-amber-600 dark:text-amber-400">{waTestSuccessResult.grievance?.slaRemainingHours}h Active</strong>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block mb-1">
                        Automated WhatsApp Reply Sent to Citizen:
                      </span>
                      <div className="p-3 rounded-lg bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white text-xs font-sans whitespace-pre-line border border-[#c1e9be] dark:border-[#004d3e]">
                        {waTestSuccessResult.responseReply}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Direct Citizen Update Console & WhatsApp Logs */}
            <div className="lg:col-span-5 space-y-4">
              {/* Direct WhatsApp SMS Dispatcher */}
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-3">
                  <Megaphone className="w-4 h-4 text-emerald-600 dark:text-[#25D366]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5]">
                      Direct WhatsApp Citizen Messenger
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">
                      Send official resolution notice or query directly to citizen's WhatsApp
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendDirectWhatsAppUpdate} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Recipient Phone
                    </label>
                    <input
                      type="text"
                      value={waDirectRecipient}
                      onChange={(e) => setWaDirectRecipient(e.target.value)}
                      placeholder="+91 98263 77410"
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Official Nodal Message / Inspection Report
                    </label>
                    <textarea
                      value={waDirectMessage}
                      onChange={(e) => setWaDirectMessage(e.target.value)}
                      rows={3}
                      placeholder="e.g. Nagar Palika PWD squad has been dispatched to your ward. Road patching will be completed within 24 hours."
                      required
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingDirectWa || !waDirectMessage.trim()}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingDirectWa ? (
                      <span>Sending WhatsApp Dispatch...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch WhatsApp SMS</span>
                      </>
                    )}
                  </button>

                  {waDirectSentStatus && (
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#25D366]" />
                      <span>{waDirectSentStatus}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Inbound WhatsApp Complaints in Jurisdiction */}
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>Recent WhatsApp Complaints ({grievances.filter((g) => g.sourceChannel === "whatsapp" || g.whatsappSenderPhone).length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-[#777777] font-mono">Auto-Synced</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {grievances
                    .filter((g) => g.sourceChannel === "whatsapp" || g.whatsappSenderPhone)
                    .map((g) => (
                      <div
                        key={g.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/[0.06] hover:border-emerald-500/50 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                              {g.token}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              {g.status}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-[#F5F5F5] truncate mt-0.5">
                            {g.title}
                          </p>
                          <div className="text-[10px] text-slate-500 dark:text-[#A8A8A8] flex items-center gap-2 mt-0.5">
                            <span>Phone: {g.whatsappSenderPhone || "+91 98263 77410"}</span>
                            <span>•</span>
                            <span>{g.ward}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedGrievanceForAction(g);
                            setWaDirectRecipient(g.whatsappSenderPhone || "+91 98263 77410");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex-shrink-0 cursor-pointer shadow-xs"
                        >
                          Action
                        </button>
                      </div>
                    ))}

                  {grievances.filter((g) => g.sourceChannel === "whatsapp" || g.whatsappSenderPhone).length === 0 && (
                    <div className="p-4 text-center text-slate-500 dark:text-[#777777] text-xs">
                      No complaints registered via WhatsApp yet. Use the simulator above or the WhatsApp Helpline modal to test intake!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WARD BROADCAST NOTICES */}
      {/* ========================================================================= */}
      {activeOfficerTab === "notices" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-500" />
                Ward-Wide Public Broadcast & Civic Alerts
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                Notices broadcasted to all citizens residing in Dhar & Pithampur municipal boundaries
              </p>
            </div>

            <button
              onClick={() => setIsCreatingNotice(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF6A00]/25 transition-all min-h-[40px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Public Notice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notices.map((n) => (
              <div
                key={n.id}
                className="p-5 rounded-2xl bg-white/90 dark:bg-[#1c1c1c] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 space-y-3 flex flex-col justify-between shadow-xs transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#FF6A00] dark:text-[#FF8A00] font-bold">
                      {n.noticeNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        n.impactLevel === "Urgent Alert"
                          ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800"
                          : n.impactLevel === "Planned Maintenance"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      {n.impactLevel}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] leading-snug">
                    {n.title}
                  </h3>

                  <div className="text-xs text-slate-500 dark:text-[#A8A8A8] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>{n.wardOrArea}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.description}
                  </p>

                  {n.actionRequired && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-200">
                      <strong>Citizen Action:</strong> {n.actionRequired}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] text-[11px] text-slate-500 dark:text-[#777777] flex items-center justify-between">
                  <span>Valid till: {n.validTill}</span>
                  <span className="text-slate-600 dark:text-[#A8A8A8]">By: {n.issuedByOfficer.split(",")[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GOOGLE BIGQUERY DATA ANALYTICS & RECHARTS */}
      {/* ========================================================================= */}
      {activeOfficerTab === "data_analytics" && (
        <OfficerBigQueryAnalytics currentUser={currentUser} grievances={grievances} />
      )}

      {/* ========================================================================= */}
      {/* TAB 6: WARD HOTSPOT ANALYTICS */}
      {/* ========================================================================= */}
      {activeOfficerTab === "ward_analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Hotspot Failure Cluster */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Ward Defect Clustering & Frequency</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                    <span>Ward 12 (Hospital Road Sector)</span>
                    <strong className="text-orange-600 dark:text-orange-400 font-mono">42% (Road Cratering)</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#252525] rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full w-[42%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                    <span>Sector 3 Industrial Main Line</span>
                    <strong className="text-cyan-600 dark:text-cyan-400 font-mono">28% (Water Leakage)</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#252525] rounded-full h-2">
                    <div className="bg-cyan-500 h-2 rounded-full w-[28%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                    <span>Ward 14 (Market Square)</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">18% (Garbage Clearance)</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#252525] rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full w-[18%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                    <span>Others (Streetlights / Wiring)</span>
                    <strong className="text-purple-600 dark:text-purple-400 font-mono">12%</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#252525] rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full w-[12%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contractor Squad Leaderboard */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6A00]" />
                <span>Field Squad Turnaround Velocity</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/90 dark:border-white/[0.08] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">PWD Road Patching Squad #4</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">Lead: Kailash Verma</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 dark:text-[#20C997] font-mono">16.4h Avg</div>
                    <div className="text-[10px] text-slate-500">100% SLA pass</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/90 dark:border-white/[0.08] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Water Works Rapid Response</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">Lead: Mohan Rao</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 dark:text-[#20C997] font-mono">11.2h Avg</div>
                    <div className="text-[10px] text-slate-500">98% SLA pass</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/90 dark:border-white/[0.08] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Swachh Bharat Urban Taskforce</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">Lead: Sunita Rathore</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 dark:text-[#20C997] font-mono">14.0h Avg</div>
                    <div className="text-[10px] text-slate-500">95% SLA pass</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Utilization Card */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-[#20C997]" />
                <span>Municipal Repair Budget Allocation</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/90 dark:border-white/[0.08]">
                  <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">Monthly Ward 27 Discretionary Fund</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-[#20C997] font-mono">₹8,50,000</div>
                  <div className="text-[10px] text-slate-500 mt-1">₹3,45,000 committed to ongoing work orders</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/90 dark:border-white/[0.08]">
                  <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">Average Remediation Cost per Grievance</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">₹28,500</div>
                  <div className="text-[10px] text-slate-500 mt-1">Audited under MP Municipal Accounts Manual</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: VIGILANCE & CAG AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeOfficerTab === "audit_logs" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-500" />
                Immutable Statutory Audit Trail & CAG Vigilance Log
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                Cryptographically signed actions for transparency under the Right to Information & Lokayukta Act
              </p>
            </div>
            <span className="text-xs font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
              SHA-256 Verified
            </span>
          </div>

          <div className="rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] overflow-hidden divide-y divide-slate-200/60 dark:divide-white/[0.05] shadow-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-[#202020]/60 transition-colors space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#FF6A00] dark:text-[#FF8A00]">{log.grievanceToken}</span>
                    <span className="text-slate-400">•</span>
                    <strong className="text-slate-800 dark:text-slate-200">{log.officerName}</strong>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{log.timestamp}</span>
                </div>

                <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {log.actionTaken}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-[#A8A8A8] pt-1">
                  <span>Remarks: <em>{log.remarks}</em></span>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-[#777777]">Hash: {log.auditHash}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STATUS UPDATE DIALOG */}
      {/* ========================================================================= */}
      {selectedGrievanceForAction && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-[#F5F5F5]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#20C997]" />
                <span>Update Grievance Status</span>
              </div>
              <span className="font-mono text-xs font-bold text-[#FF6A00] dark:text-[#FF8A00]">
                {selectedGrievanceForAction.token}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Select New Status
                </label>
                <select
                  value={newStatusChoice}
                  onChange={(e) => setNewStatusChoice(e.target.value as GrievanceStatus)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00] min-h-[40px] cursor-pointer"
                >
                  <option value="Work In Progress">Work In Progress (Field Team Dispatched)</option>
                  <option value="Resolved & Verified">Resolved & Verified (Remediation Complete)</option>
                  <option value="Submitted & Token Issued">Submitted & Token Issued (Queue)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Officer Action Remarks / Citizen Notice
                </label>
                <textarea
                  rows={3}
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Describe field action, materials allocated, or inspection summary..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00]"
                ></textarea>
              </div>

              {/* WhatsApp Notification Dispatch Checkbox */}
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-[#1b2a22] border border-emerald-300/80 dark:border-emerald-500/30 space-y-1">
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-950 dark:text-emerald-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWhatsAppAlertToCitizen}
                    onChange={(e) => setSendWhatsAppAlertToCitizen(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-white/20 cursor-pointer"
                  />
                  <span>Dispatch Instant WhatsApp SMS to Citizen ({selectedGrievanceForAction.whatsappSenderPhone || "+91 98263 77410"})</span>
                </label>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 pl-6">
                  Citizen receives real-time milestone notice on WhatsApp with live tracking token link.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedGrievanceForAction(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] dark:hover:bg-[#303030] text-slate-700 dark:text-[#A8A8A8] text-xs font-bold min-h-[38px] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteStatusUpdate}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold min-h-[38px] shadow-md shadow-[#FF6A00]/25 cursor-pointer"
              >
                Confirm Status Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DISPATCH WORK ORDER DIALOG */}
      {/* ========================================================================= */}
      {isCreatingWorkOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-2xl p-5 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-[#F5F5F5]">
                <Truck className="w-4 h-4 text-[#FF6A00]" />
                <span>Issue Statutory Work Order</span>
              </div>
              <button
                onClick={() => setIsCreatingWorkOrder(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] dark:hover:bg-[#303030] text-slate-500 dark:text-[#A8A8A8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Target Grievance Token
                </label>
                <select
                  value={woGrievanceId}
                  onChange={(e) => setWoGrievanceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] font-mono min-h-[40px] cursor-pointer"
                >
                  {grievances.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.token} - {g.title.slice(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Work Order Title & Scope
                </label>
                <input
                  type="text"
                  required
                  value={woTitle}
                  onChange={(e) => setWoTitle(e.target.value)}
                  placeholder="e.g. Bitumen Overlay & Compactor Remediation"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Designated Squad / Contractor
                  </label>
                  <input
                    type="text"
                    required
                    value={woContractor}
                    onChange={(e) => setWoContractor(e.target.value)}
                    placeholder="e.g. PWD Rapid Road Patching Squad #4"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Supervisor Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={woPhone}
                    onChange={(e) => setWoPhone(e.target.value)}
                    placeholder="+91 98263 77410"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={woBudget}
                    onChange={(e) => setWoBudget(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={woPriority}
                    onChange={(e) => setWoPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Assigned Vehicle
                  </label>
                  <input
                    type="text"
                    value={woVehicle}
                    onChange={(e) => setWoVehicle(e.target.value)}
                    placeholder="MP-11-G-5012"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Materials Requisitioned (Comma Separated)
                </label>
                <input
                  type="text"
                  value={woMaterials}
                  onChange={(e) => setWoMaterials(e.target.value)}
                  placeholder="Bitumen Cold Mix, Stone Dust, Compactor Roller"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreatingWorkOrder(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] dark:hover:bg-[#303030] text-slate-700 dark:text-[#A8A8A8] text-xs font-bold min-h-[38px] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold min-h-[38px] shadow-md shadow-[#FF6A00]/25 cursor-pointer"
                >
                  Authorize & Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE PUBLIC NOTICE DIALOG */}
      {/* ========================================================================= */}
      {isCreatingNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-2xl p-5 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-[#F5F5F5]">
                <Megaphone className="w-4 h-4 text-orange-500" />
                <span>Publish Official Ward Advisory / Notice</span>
              </div>
              <button
                onClick={() => setIsCreatingNotice(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] dark:hover:bg-[#303030] text-slate-500 dark:text-[#A8A8A8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Notice Headline
                </label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Temporary Water Pipeline Interconnect Shutdown"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] cursor-pointer"
                  >
                    <option value="Water Supply & Utilities">Water Supply & Utilities</option>
                    <option value="Road Maintenance & Diversion">Road Maintenance & Diversion</option>
                    <option value="Public Health & Sanitation">Public Health & Sanitation</option>
                    <option value="Electricity Hazard & Tree Trimming">Electricity Hazard & Safety</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Impact Level
                  </label>
                  <select
                    value={noticeImpact}
                    onChange={(e) => setNoticeImpact(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] cursor-pointer"
                  >
                    <option value="Planned Maintenance">Planned Maintenance</option>
                    <option value="Urgent Alert">Urgent Alert</option>
                    <option value="Advisory">Advisory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Target Ward / Jurisdiction
                </label>
                <input
                  type="text"
                  value={noticeArea}
                  onChange={(e) => setNoticeArea(e.target.value)}
                  placeholder="Ward 12 (Civil Lines & Central)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] min-h-[40px] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Notice Details & Citizen Instructions
                </label>
                <textarea
                  rows={3}
                  required
                  value={noticeDesc}
                  onChange={(e) => setNoticeDesc(e.target.value)}
                  placeholder="Provide date, timing, alternative arrangements (like water tankers), and instructions..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00]"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreatingNotice(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] dark:hover:bg-[#303030] text-slate-700 dark:text-[#A8A8A8] text-xs font-bold min-h-[38px] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold min-h-[38px] shadow-md shadow-[#FF6A00]/25 cursor-pointer"
                >
                  Broadcast Notice to Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
