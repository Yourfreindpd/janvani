import React, { useState, useEffect, useMemo } from "react";
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Building2,
  Plus,
  Shield,
  Layers,
  Search,
  Users,
  Activity,
  ArrowRight,
  HelpCircle,
  BarChart3,
  Flame,
  ThumbsUp,
  Eye,
  Mic,
  Radio,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Grievance, UserProfile } from "../types";
import { Translations } from "../data/translations";
import { useTheme } from "../context/ThemeContext";

interface DashboardOverviewProps {
  grievances: Grievance[];
  currentUser: UserProfile | null;
  onTrackGrievance: (grievance: Grievance) => void;
  onOpenReportModal: () => void;
  onViewFeed: () => void;
  onViewGis: () => void;
  onOpenCopilot: () => void;
  onOpenVoiceSeva?: () => void;
  t: Translations;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  grievances,
  currentUser,
  onTrackGrievance,
  onOpenReportModal,
  onViewFeed,
  onViewGis,
  onOpenCopilot,
  onOpenVoiceSeva,
  t,
}) => {
  const { isDarkMode } = useTheme();
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"week" | "month">("week");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);

  // Fetch live BigQuery analytics data whenever the selected timeframe changes
  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        const timeRangeParam = analyticsTimeframe === "week" ? "7d" : "30d";
        const res = await fetch(`/api/bigquery/analytics?timeRange=${timeRangeParam}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAnalyticsData(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch BigQuery analytics:", err);
      } finally {
        if (isMounted) {
          setIsLoadingAnalytics(false);
        }
      }
    };

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [analyticsTimeframe]);

  // Filter grievances dynamically by date range based on selected timeframe
  const filteredGrievances = useMemo(() => {
    if (analyticsTimeframe === "week") {
      // In the current civic dataset (Aug 2026), "This Week" covers the last 7 days (Aug 25 - Aug 31)
      return grievances.filter((g) => {
        if (!g.dateFiled) return true;
        const match = g.dateFiled.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = match[2].toLowerCase();
          if (month.startsWith("aug")) {
            return day >= 25;
          }
        }
        return true;
      });
    }
    // "This Month" covers all grievances in August 2026
    return grievances;
  }, [grievances, analyticsTimeframe]);

  // Real-time KPI metrics derived directly from filtered underlying data
  const totalGrievances = filteredGrievances.length;
  const inProgressCount = filteredGrievances.filter(
    (g) => g.status === "Work In Progress" || g.status === "Submitted & Token Issued" || g.status === "Under Inspection"
  ).length;
  const resolvedCount = filteredGrievances.filter((g) => g.status === "Resolved & Verified").length;
  const urgentCount = filteredGrievances.filter((g) => g.severityScore >= 8).length;
  const resolutionRate = totalGrievances > 0 ? Math.round((resolvedCount / totalGrievances) * 100) : 94;

  // Period-specific summary statistics and trend badges
  const periodSummary = useMemo(() => {
    if (analyticsData?.summary) {
      return analyticsData.summary;
    }
    return analyticsTimeframe === "week"
      ? {
          rateChange: "+12% this week",
          avgSpeed: "21.2h",
          slaMax: "48h max",
          periodLabel: "This Week (Aug 25 - 31)",
        }
      : {
          rateChange: "+18% this month",
          avgSpeed: "19.8h",
          slaMax: "30-Day Rate: 96.4%",
          periodLabel: "This Month (August 2026)",
        };
  }, [analyticsData, analyticsTimeframe]);

  // Departmental SLA & Category Analysis Data - updates per timeframe
  const departmentAnalysis = useMemo(() => {
    if (analyticsTimeframe === "week") {
      return [
        { name: "Roads & Potholes", issues: 14, resolved: 12, rate: "85.7%", slaAvg: "28h", color: "#FF6A00" },
        { name: "Drinking Water & Pipe", issues: 11, resolved: 10, rate: "90.9%", slaAvg: "17h", color: "#3B82F6" },
        { name: "Sanitation & Garbage", issues: 9, resolved: 9, rate: "100%", slaAvg: "13h", color: "#20C997" },
        { name: "Electricity & Wiring", issues: 6, resolved: 6, rate: "100%", slaAvg: "11h", color: "#FF8A00" },
        { name: "Drain & Sewage", issues: 4, resolved: 3, rate: "75.0%", slaAvg: "24h", color: "#8b5cf6" },
      ];
    }
    return [
      { name: "Roads & Potholes", issues: 48, resolved: 44, rate: "91.6%", slaAvg: "31h", color: "#FF6A00" },
      { name: "Drinking Water & Pipe", issues: 34, resolved: 33, rate: "97.0%", slaAvg: "18h", color: "#3B82F6" },
      { name: "Sanitation & Garbage", issues: 29, resolved: 28, rate: "96.5%", slaAvg: "14h", color: "#20C997" },
      { name: "Electricity & Wiring", issues: 19, resolved: 18, rate: "94.7%", slaAvg: "12h", color: "#FF8A00" },
      { name: "Drain & Sewage", issues: 12, resolved: 11, rate: "91.6%", slaAvg: "26h", color: "#8b5cf6" },
    ];
  }, [analyticsTimeframe]);

  // Daily & Weekly Resolution Velocity Trend Data for Chart
  const weeklyVelocityData = [
    { day: "Mon", reported: 182, resolved: 174, slaSpeed: 21.2 },
    { day: "Tue", reported: 215, resolved: 202, slaSpeed: 22.4 },
    { day: "Wed", reported: 310, resolved: 290, slaSpeed: 24.1 },
    { day: "Thu", reported: 260, resolved: 248, slaSpeed: 20.8 },
    { day: "Fri", reported: 275, resolved: 260, slaSpeed: 21.8 },
    { day: "Sat", reported: 165, resolved: 172, slaSpeed: 18.2 },
    { day: "Sun", reported: 120, resolved: 128, slaSpeed: 17.5 },
  ];

  const monthlyVelocityData = [
    { day: "Week 1", reported: 1820, resolved: 1710, slaSpeed: 22.6 },
    { day: "Week 2", reported: 2140, resolved: 2010, slaSpeed: 21.8 },
    { day: "Week 3", reported: 2490, resolved: 2320, slaSpeed: 23.4 },
    { day: "Week 4", reported: 1970, resolved: 1890, slaSpeed: 19.8 },
  ];

  const currentVelocityData = useMemo(() => {
    if (analyticsData?.trends && Array.isArray(analyticsData.trends) && analyticsData.trends.length > 0) {
      return analyticsData.trends;
    }
    return analyticsTimeframe === "week" ? weeklyVelocityData : monthlyVelocityData;
  }, [analyticsData, analyticsTimeframe]);

  // Dynamic Category Distribution computed from the active filtered grievances
  const categoryPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredGrievances.forEach((g) => {
      let cat = g.category;
      if (cat.includes("Road") || cat.includes("Pothole")) cat = "Roads & Potholes";
      else if (cat.includes("Water") || cat.includes("Pipe")) cat = "Water Supply";
      else if (cat.includes("Sanitation") || cat.includes("Garbage") || cat.includes("Waste")) cat = "Sanitation";
      else if (cat.includes("Electric") || cat.includes("Streetlight") || cat.includes("Wiring")) cat = "Electricity";
      else if (cat.includes("Drain") || cat.includes("Sewage")) cat = "Drain & Sewage";
      else cat = "Others";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors: Record<string, string> = {
      "Roads & Potholes": "#FF6A00",
      "Water Supply": "#3B82F6",
      "Sanitation": "#20C997",
      "Electricity": "#FF8A00",
      "Drain & Sewage": "#8b5cf6",
      Others: "#94a3b8",
    };

    const total = filteredGrievances.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: colors[name] || "#FF6A00",
    }));
  }, [filteredGrievances]);

  // Ward Hotspots & Triage Data
  const wardHotspots = [
    {
      ward: "Ward 12 (Hospital Road)",
      district: "Dhar (MP)",
      activeIssues: 5,
      severity: "High (8.4/10)",
      slaCompliance: "96%",
      primaryIssue: "Monsoon road crater & culvert waterlogging",
      nodal: "Er. Rajesh Sharma",
    },
    {
      ward: "Ward 14 (Pithampur Sec 1)",
      district: "Dhar (MP)",
      activeIssues: 3,
      severity: "Moderate (6.2/10)",
      slaCompliance: "98%",
      primaryIssue: "Overhead cable sagging & transformer leakage",
      nodal: "Er. Amit Patidar",
    },
    {
      ward: "Ward 08 (Indore Naka)",
      district: "Dhar (MP)",
      activeIssues: 2,
      severity: "Low (3.1/10)",
      slaCompliance: "100%",
      primaryIssue: "Secondary garbage bin clearance required",
      nodal: "Dr. Sunita Verma",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Civic Resolution SLA Hero Banner with Atmospheric Orange Glow & Glossy Glass */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-[#faf6ee]/90 to-[#f3ecdf]/90 dark:from-[#303030] dark:via-[#353535] dark:to-[#404040] backdrop-blur-2xl border border-white/90 dark:border-white/[0.08] text-slate-900 dark:text-[#F5F5F5] p-5 sm:p-8 shadow-[0_15px_45px_rgba(210,190,165,0.22)] dark:shadow-2xl transition-colors">
        {/* Soft, Diffused Orange Atmospheric Glow Layers */}
        <div className="absolute -top-12 -right-12 w-96 h-96 bg-[#FF6A00]/20 rounded-full blur-[55px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-80 h-80 bg-[#FF8A00]/15 rounded-full blur-[50px] pointer-events-none" />
        {/* Top subtle light reflection highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white dark:via-white/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-[#FF6A00]/20 text-orange-800 dark:text-[#FF8A00] border border-[#FF6A00]/30 backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-ping" />
                {t.statutorySlaRedressal || "Statutory Citizen SLA Redressal"}
              </span>
              <span className="text-xs text-slate-600 dark:text-[#A8A8A8] font-mono px-2 py-0.5 rounded-md bg-white/60 dark:bg-transparent border border-black/5 dark:border-transparent">
                Ward 27 • Dhar • MP (2026)
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-[#F5F5F5] leading-snug font-heading">
              {t.heroTitle || "Track, Report & Audit Municipal Grievances in Real-Time"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A8A8A8] leading-relaxed">
              {t.heroSubtitle || "Every complaint is sealed with an automated token, AI-triaged for severity, and tied to legally binding 48-hour SLA resolution mandates."}
            </p>

            {/* Hero Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={onOpenReportModal}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#FF6A00]/30 transition-all min-h-[42px] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t.fileGrievanceBtn || t.fileGrievanceTitle || "File Grievance"}</span>
              </button>

              {onOpenVoiceSeva && (
                <button
                  onClick={onOpenVoiceSeva}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 active:scale-95 text-xs sm:text-sm font-bold shadow-lg shadow-black/20 dark:shadow-white/10 transition-all min-h-[42px] cursor-pointer group"
                >
                  <div className="relative">
                    <Mic className="w-4 h-4 text-[#FF6A00] group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  </div>
                  <span>Voice Seva (बोलकर शिकायत)</span>
                </button>
              )}

              <button
                onClick={onViewGis}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/85 dark:bg-[#303030]/90 hover:bg-white dark:hover:bg-[#383838] active:scale-95 text-slate-800 dark:text-[#F5F5F5] text-xs sm:text-sm font-semibold border border-white/90 dark:border-white/[0.08] shadow-xs transition-all min-h-[42px] cursor-pointer backdrop-blur-md hover:shadow-md"
              >
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-[#20C997]" />
                <span>{t.exploreGisBtn || "Explore Ward GIS Map"}</span>
              </button>

              <button
                onClick={onOpenCopilot}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-purple-50/85 dark:bg-[#303030]/90 hover:bg-purple-100 dark:hover:bg-[#383838] active:scale-95 text-purple-900 dark:text-[#F5F5F5] text-xs sm:text-sm font-semibold border border-purple-200/90 dark:border-white/[0.08] shadow-xs transition-all min-h-[42px] cursor-pointer backdrop-blur-md hover:shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-[#FF8A00]" />
                <span>{t.askCopilotBtn || t.aiCopilot || "Ask AI Copilot"}</span>
              </button>
            </div>
          </div>

          {/* Quick SLA Badge Card */}
          <div className="bg-white/90 dark:bg-[#282828]/95 backdrop-blur-xl border border-white/95 dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4 lg:w-72 shadow-[0_10px_30px_rgba(200,180,155,0.18)] dark:shadow-xl transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-[#A8A8A8] uppercase tracking-wider">{t.wardStatus || "Ward Status"}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50/90 dark:bg-[#20C997]/20 text-emerald-800 dark:text-[#20C997] border border-emerald-300 dark:border-[#20C997]/30">
                {t.liveAndActive || "Live & Active"}
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F5F5F5] font-heading">{resolutionRate}%</div>
              <div className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">{t.statutoryRedressalRate || "District Statutory Redressal Rate"}</div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/[0.08] text-xs text-slate-700 dark:text-[#F5F5F5]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-[#A8A8A8]">{t.avgResolutionTime || "Avg. Resolution"}:</span>
                <span className="font-bold text-[#FF6A00] dark:text-[#FF8A00]">{periodSummary.avgSpeed || "21.2 Hours"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-[#A8A8A8]">{t.activeFieldUnits || "Active Field Units"}:</span>
                <span className="font-bold text-emerald-700 dark:text-[#20C997]">14 Dispatched</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards (2 Columns on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-3.5 sm:p-5 shadow-[0_8px_30px_-4px_rgba(200,180,155,0.18)] hover:shadow-[0_14px_35px_-4px_rgba(255,106,0,0.18)] dark:shadow-none hover:border-orange-300/60 dark:hover:border-white/[0.15] transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-[#A8A8A8] uppercase tracking-wider truncate">
              {t.totalRegistered || "Total Registered"}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-orange-50/90 dark:bg-[#FF6A00]/15 border border-orange-200 dark:border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] flex-shrink-0 shadow-xs">
              <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-[#F5F5F5] font-heading">{totalGrievances}</div>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-emerald-700 dark:text-[#20C997] font-semibold truncate">
              <TrendingUp className="w-3 h-3 flex-shrink-0" />
              <span>{periodSummary.rateChange}</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-3.5 sm:p-5 shadow-[0_8px_30px_-4px_rgba(200,180,155,0.18)] hover:shadow-[0_14px_35px_-4px_rgba(255,106,0,0.18)] dark:shadow-none hover:border-orange-300/60 dark:hover:border-white/[0.15] transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-[#A8A8A8] uppercase tracking-wider truncate">
              {t.inActiveProgress || "In Action"}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-50/90 dark:bg-[#FF8A00]/15 border border-amber-200 dark:border-[#FF8A00]/30 flex items-center justify-center text-amber-600 dark:text-[#FF8A00] flex-shrink-0 shadow-xs">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-black text-[#FF6A00] dark:text-[#FF8A00] font-heading">{inProgressCount}</div>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-[#777777] font-medium truncate">
              <span>{t.slaMaxHours || "Under 48h SLA"}</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-3.5 sm:p-5 shadow-[0_8px_30px_-4px_rgba(200,180,155,0.18)] hover:shadow-[0_14px_35px_-4px_rgba(255,106,0,0.18)] dark:shadow-none hover:border-emerald-300/60 dark:hover:border-white/[0.15] transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-[#A8A8A8] uppercase tracking-wider truncate">
              {t.certifiedResolved || "Resolved"}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-50/90 dark:bg-[#20C997]/15 border border-emerald-200 dark:border-[#20C997]/30 flex items-center justify-center text-emerald-700 dark:text-[#20C997] flex-shrink-0 shadow-xs">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-black text-emerald-700 dark:text-[#20C997] font-heading">{resolvedCount}</div>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-emerald-700 dark:text-[#20C997] font-semibold truncate">
              <Shield className="w-3 h-3 flex-shrink-0" />
              <span>{t.aiDualCertified || "AI Dual-Certified"}</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-3.5 sm:p-5 shadow-[0_8px_30px_-4px_rgba(200,180,155,0.18)] hover:shadow-[0_14px_35px_-4px_rgba(255,59,48,0.18)] dark:shadow-none hover:border-red-300/60 dark:hover:border-white/[0.15] transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-[#A8A8A8] uppercase tracking-wider truncate">
              {t.highSeverityAlerts || "Urgent"}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-red-50/90 dark:bg-[#FF3B30]/15 border border-red-200 dark:border-[#FF3B30]/30 flex items-center justify-center text-red-600 dark:text-[#FF3B30] flex-shrink-0 shadow-xs">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-black text-red-600 dark:text-[#FF3B30] font-heading">{urgentCount} Priority</div>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-[#777777] font-medium truncate">
              <span>{t.scoreAbove8 || "Score > 8.0"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Civic Analysis Section (Charts & Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: SLA Resolution Velocity Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white/80 dark:bg-[#303030] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_8px_32px_-4px_rgba(200,180,155,0.16)] dark:shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">
                  {t.resolutionVelocityTitle || "Resolution Velocity & Daily Inflow"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                {t.resolutionVelocitySubtitle || "Comparison of daily reported civic issues vs certified field remediations"}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-[#202020] p-1 rounded-xl border border-slate-200/60 dark:border-white/[0.05]">
              {(["week", "month"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAnalyticsTimeframe(mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    analyticsTimeframe === mode
                      ? "bg-white dark:bg-[#383838] text-slate-900 dark:text-[#F5F5F5] shadow-xs border border-white/90 dark:border-white/[0.08]"
                      : "text-slate-500 dark:text-[#A8A8A8] hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {mode === "week" ? (t.thisWeek || "This Week") : (t.thisMonth || "This Month")}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Bar Chart - Dark & Light Mode Adaptive */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentVelocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(200, 180, 160, 0.2)"} />
                <XAxis dataKey="day" stroke={isDarkMode ? "#A8A8A8" : "#8c8276"} fontSize={12} tickLine={false} />
                <YAxis stroke={isDarkMode ? "#A8A8A8" : "#8c8276"} fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#202020" : "#ffffff",
                    borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2d8cc",
                    borderRadius: "12px",
                    color: isDarkMode ? "#F5F5F5" : "#1f1a17",
                    fontSize: "12px",
                    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.15)",
                  }}
                  cursor={{ fill: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 106, 0, 0.04)" }}
                />
                <Bar dataKey="reported" name={t.reportedIssues || "Reported Issues"} fill={isDarkMode ? "#4a4a4a" : "#d8cfc4"} radius={[6, 6, 0, 0]} />
                <Bar dataKey="resolved" name={t.certifiedFixes || "Certified Fixes"} fill="#FF6A00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.08] text-xs text-slate-600 dark:text-[#A8A8A8] gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded inline-block ${isDarkMode ? "bg-[#4a4a4a]" : "bg-[#d8cfc4]"}`}></span>
                <span>{t.reportedIssues || "Reported Issues"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#FF6A00] inline-block"></span>
                <span className="font-semibold text-slate-900 dark:text-[#F5F5F5]">{t.certifiedFixes || "Certified Fixes"}</span>
              </div>
            </div>
            <div className="font-semibold text-[#FF6A00] dark:text-[#FF8A00] flex items-center gap-1">
              <span>
                {`${t.avgSpeed || "Average Speed"}: ${periodSummary.avgSpeed} (${periodSummary.slaMax})`}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Category Distribution Breakdown */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#303030] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_8px_32px_-4px_rgba(200,180,155,0.16)] dark:shadow-none space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">
                {t.categoryDistribution || "Issue Categories"}
              </h3>
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#A8A8A8]">Live Mix</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
              {t.categorySubtitle || "Distribution of civic challenges across wards"}
            </p>

            <div className="h-44 w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? "#202020" : "#ffffff",
                      borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2d8cc",
                      borderRadius: "10px",
                      color: isDarkMode ? "#F5F5F5" : "#1f1a17",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {categoryPieData.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="text-slate-700 dark:text-[#A8A8A8] font-medium">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-[#F5F5F5]">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onViewFeed}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-white dark:bg-[#282828] hover:bg-slate-50 dark:hover:bg-[#383838] text-slate-800 dark:text-[#F5F5F5] text-xs font-bold border border-slate-200/90 dark:border-white/[0.08] flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer hover:border-[#FF6A00]/30"
          >
            <span>{t.viewFullFeed || "View All in Feed"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Departmental SLA Performance & Hotspot Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department SLA Scorecard */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#303030] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_8px_32px_-4px_rgba(200,180,155,0.16)] dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">
                {t.departmentalSlaTitle || "Departmental SLA Scorecard"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                {t.departmentalSlaSubtitle || "Statutory resolution times by administrative department"}
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50/90 dark:bg-[#20C997]/20 text-emerald-800 dark:text-[#20C997] border border-emerald-300 dark:border-[#20C997]/30">
              Audit Passed
            </span>
          </div>

          <div className="space-y-3">
            {departmentAnalysis.map((dept, index) => (
              <div key={index} className="p-3 rounded-xl bg-white/70 dark:bg-[#282828] border border-slate-200/70 dark:border-white/[0.08] space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-[#F5F5F5]">{dept.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-[#A8A8A8]">Avg: <strong className="text-slate-800 dark:text-[#F5F5F5]">{dept.slaAvg}</strong></span>
                    <span className="font-bold text-emerald-700 dark:text-[#20C997]">{dept.rate}</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200/80 dark:bg-[#202020] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: dept.rate,
                      backgroundColor: dept.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#777777]">
                  <span>{dept.issues} Issues Registered</span>
                  <span>{dept.resolved} Certified Resolved</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ward Hotspots & Triage Radar */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#303030] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_8px_32px_-4px_rgba(200,180,155,0.16)] dark:shadow-none space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">
                  {t.wardHotspotsTitle || "Ward Hotspots & Triage Radar"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                  {t.wardHotspotsSubtitle || "High-frequency grievance clusters requiring attention"}
                </p>
              </div>
              <button
                onClick={onViewGis}
                className="text-xs font-bold text-[#FF6A00] dark:text-[#FF8A00] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full GIS Map</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {wardHotspots.map((wh, idx) => (
                <div
                  key={idx}
                  onClick={onViewGis}
                  className="p-3 rounded-xl bg-white/70 dark:bg-[#282828] hover:bg-white dark:hover:bg-[#383838] border border-slate-200/70 dark:border-white/[0.08] hover:border-[#FF6A00]/30 dark:hover:border-white/[0.15] transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FF6A00] flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] group-hover:text-[#FF6A00] transition-colors">
                          {wh.ward}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-[#777777]">({wh.district})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-[#A8A8A8] mt-1 line-clamp-1">
                        {wh.primaryIssue}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        wh.severity.includes("High")
                          ? "bg-red-50/90 dark:bg-[#FF3B30]/20 text-red-700 dark:text-[#FF3B30] border border-red-200 dark:border-[#FF3B30]/30"
                          : wh.severity.includes("Moderate")
                          ? "bg-amber-50/90 dark:bg-[#FF8A00]/20 text-amber-700 dark:text-[#FF8A00] border border-amber-200 dark:border-[#FF8A00]/30"
                          : "bg-emerald-50/90 dark:bg-[#20C997]/20 text-emerald-700 dark:text-[#20C997] border border-emerald-200 dark:border-[#20C997]/30"
                      }`}>
                        {wh.severity.split(" ")[0]}
                      </span>
                      <div className="text-[10px] text-slate-500 dark:text-[#777777] mt-0.5">
                        {wh.activeIssues} Active
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-[#A8A8A8]">Field Dispatch Protocol:</span>
            <span className="font-semibold text-emerald-700 dark:text-[#20C997]">Geo-tagged Field Teams Assigned</span>
          </div>
        </div>
      </div>

      {/* 5. Live Recent Grievances Stream */}
      <div className="rounded-2xl bg-white/80 dark:bg-[#303030] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_8px_32px_-4px_rgba(200,180,155,0.16)] dark:shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">
                {t.recentUrgentTitle || "Recent Public Grievances in Ward"}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50/90 dark:bg-[#FF6A00]/20 text-orange-800 dark:text-[#FF8A00] border border-orange-200 dark:border-[#FF6A00]/30">
                Live Stream
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
              {t.recentUrgentSubtitle || "Click any token to inspect live remediation audit, upload evidence, or draft statutory RTI"}
            </p>
          </div>

          <button
            onClick={onViewFeed}
            className="text-xs font-bold text-[#FF6A00] hover:text-[#FF8A00] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>{t.viewFullFeed || `Explore All ${grievances.length} Grievances`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grievances.slice(0, 3).map((g) => (
            <div
              key={g.id}
              className="rounded-2xl border border-white/90 dark:border-white/[0.08] hover:border-orange-300/60 dark:hover:border-white/[0.15] bg-white/70 dark:bg-[#282828] hover:bg-white dark:hover:bg-[#383838] p-4 transition-all duration-200 shadow-[0_4px_20px_-2px_rgba(200,180,155,0.14)] hover:shadow-[0_12px_30px_-4px_rgba(255,106,0,0.15)] dark:shadow-none flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] font-bold text-orange-800 dark:text-[#FF8A00] bg-orange-50/90 dark:bg-[#FF6A00]/15 px-2 py-0.5 rounded-md border border-orange-200 dark:border-[#FF6A00]/30">
                    #{g.token.split("-").slice(-2).join("-")}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    g.status === "Resolved & Verified"
                      ? "bg-emerald-50/90 dark:bg-[#20C997]/20 text-emerald-800 dark:text-[#20C997] border border-emerald-200 dark:border-[#20C997]/30"
                      : "bg-amber-50/90 dark:bg-[#FF8A00]/20 text-amber-800 dark:text-[#FF8A00] border border-amber-200 dark:border-[#FF8A00]/30"
                  }`}>
                    {g.status === "Resolved & Verified" ? (t.statusResolved || "Resolved") : (t.statusInProgress || "In Action")}
                  </span>
                </div>

                <div
                  onClick={() => onTrackGrievance(g)}
                  className="relative h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#202020] border border-slate-200/80 dark:border-white/[0.08] cursor-pointer shadow-xs"
                >
                  <img
                    src={g.imageUrl}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-white/95 dark:bg-[#151515]/90 backdrop-blur-sm text-[10px] font-medium text-slate-800 dark:text-[#F5F5F5] truncate flex items-center gap-1 shadow-xs border border-slate-200/60 dark:border-white/5">
                    <MapPin className="w-3 h-3 text-[#FF6A00] flex-shrink-0" />
                    <span className="truncate">{g.locality}</span>
                  </div>
                </div>

                <h4
                  onClick={() => onTrackGrievance(g)}
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F5F5F5] group-hover:text-[#FF6A00] transition-colors line-clamp-2 cursor-pointer font-heading"
                >
                  {g.title}
                </h4>

                <p className="text-[11px] text-slate-500 dark:text-[#A8A8A8] line-clamp-2 leading-relaxed">
                  {g.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8] font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#FF6A00]" />
                  <span>SLA: {g.targetSlaHours}h</span>
                </div>

                <button
                  type="button"
                  onClick={() => onTrackGrievance(g)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6A00]/25 cursor-pointer"
                >
                  <span>{t.trackGrievance || "Track SLA"}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. AI Copilot Prompt Suggestions Hub */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-500/10 via-orange-500/10 to-indigo-500/10 dark:from-[#303030] dark:via-[#383838] dark:to-[#303030] backdrop-blur-xl border border-purple-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_8px_32px_-4px_rgba(200,180,155,0.16)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#FF6A00]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-[#FF8A00]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">
                {t.aiCopilot || "24x7 Multilingual AI Civic Copilot"}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A8A8A8]">
              {t.voiceTextAssistant || "Need assistance with statutory timelines, welfare scheme eligibility, or RTI drafting?"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCopilot}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6A00]/25 cursor-pointer"
            >
              {t.askCopilotBtn || "Open AI Assistant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
