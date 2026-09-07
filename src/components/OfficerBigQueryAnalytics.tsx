import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Database,
  TrendingUp,
  Clock,
  MapPin,
  Flame,
  Shield,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Download,
  Terminal,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  ChevronRight,
  Play,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { Grievance, UserProfile } from "../types";

interface OfficerBigQueryAnalyticsProps {
  currentUser: UserProfile;
  grievances: Grievance[];
}

const CATEGORY_COLORS = [
  "#3b82f6", // Blue - Roads
  "#10b981", // Emerald - Garbage
  "#06b6d4", // Cyan - Water
  "#f59e0b", // Amber - Sewage
  "#ef4444", // Red - Electricity
  "#8b5cf6", // Purple - Streetlight
  "#ec4899", // Pink - Health
];

export const OfficerBigQueryAnalytics: React.FC<OfficerBigQueryAnalyticsProps> = ({
  currentUser,
  grievances,
}) => {
  // Filter States
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "fy26">("30d");
  const [selectedState, setSelectedState] = useState<string>("Madhya Pradesh");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All Districts");
  const [activeChartTab, setActiveChartTab] = useState<"trends" | "resolution" | "hotspots" | "departments" | "sql_workbench">("trends");

  // Data Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);

  // SQL Workbench State
  const [sqlQuery, setSqlQuery] = useState("");
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // AI Governance Insights State
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [predictiveTrend, setPredictiveTrend] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Initial Fetch
  const fetchBigQueryAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/bigquery/analytics?timeRange=${timeRange}&state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
        setMetadata(data.metadata);
        if (!sqlQuery) {
          setSqlQuery(data.standardSql);
        }
      }
    } catch (err) {
      console.error("Failed to load BigQuery analytics", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAiInsights = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch("/api/bigquery/governance-ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: selectedDistrict === "All Districts" ? "Dhar" : selectedDistrict,
          state: selectedState,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data.insights || []);
        setPredictiveTrend(data.predictiveTrendText || "");
      }
    } catch (err) {
      console.error("Failed to fetch AI insights", err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchBigQueryAnalytics();
    fetchAiInsights();
  }, [timeRange, selectedState, selectedDistrict]);

  // Execute Custom SQL or Natural Language in BigQuery
  const handleExecuteBigQuery = async (isNl = false) => {
    setIsExecutingSql(true);
    try {
      const textToRun = isNl ? naturalLanguageQuery : sqlQuery;
      const res = await fetch("/api/bigquery/run-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryText: textToRun,
          isNaturalLanguage: isNl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQueryResult(data);
        if (isNl && data.sql) {
          setSqlQuery(data.sql);
        }
      }
    } catch (err) {
      console.error("Error executing query", err);
    } finally {
      setIsExecutingSql(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!analyticsData) return;
    const rows = analyticsData.trends || [];
    let csvContent = "data:text/csv;charset=utf-8,Date,Submitted,Resolved,SLA_Breached,Avg_Resolution_Hours,Active_Pending\n";
    rows.forEach((r: any) => {
      csvContent += `${r.date},${r.submitted},${r.resolved},${r.slaBreached},${r.avgResolutionHours},${r.pendingActive}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `JanVani_BigQuery_Analytics_${selectedDistrict}_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Chart Tooltips
  const CustomTrendsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-[#1a1a1a]/95 border border-slate-700 dark:border-white/10 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-white">
          <p className="font-bold text-white mb-1">{label} (BigQuery Partition)</p>
          <p className="text-blue-400 font-semibold">Submitted Influx: {payload[0]?.value} cases</p>
          <p className="text-emerald-400 font-semibold">Resolved Velocity: {payload[1]?.value} cases</p>
          {payload[2] && <p className="text-red-400 font-semibold">SLA Breaches: {payload[2]?.value} cases</p>}
          {payload[3] && <p className="text-amber-400 font-semibold">Avg Turnaround: {payload[3]?.value} hrs</p>}
        </div>
      );
    }
    return null;
  };

  const CustomSlaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-[#1a1a1a]/95 border border-slate-700 dark:border-white/10 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-white">
          <p className="font-bold text-white mb-1">{label}</p>
          <p className="text-amber-400 font-semibold">Actual Avg Time: {payload[0]?.value} hrs</p>
          <p className="text-blue-400 font-semibold">Statutory Target SLA: {payload[1]?.value} hrs</p>
          {payload[0]?.payload?.p95Hours && (
            <p className="text-purple-400 font-semibold">P95 Worst-case: {payload[0]?.payload?.p95Hours} hrs</p>
          )}
          {payload[0]?.payload?.complianceRate && (
            <p className="text-emerald-400 font-semibold">SLA Compliance: {payload[0]?.payload?.complianceRate}%</p>
          )}
        </div>
      );
    }
    return null;
  };

  const trends = analyticsData?.trends || [];
  const categorySla = analyticsData?.categorySla || [];
  const districtHotspots = analyticsData?.districtHotspots || [];
  const departmentWorkload = analyticsData?.departmentWorkload || [];
  const wardDensity = analyticsData?.wardDensity || [];

  return (
    <div className="space-y-5">
      {/* 1. BigQuery Telemetry Header & Query Engine Status */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900/90 via-indigo-950 to-slate-950 dark:from-[#081120] dark:via-[#09152b] dark:to-[#0d1c38] border border-blue-500/40 p-4 sm:p-5 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-400/50 flex items-center justify-center text-blue-400 font-black shadow-lg flex-shrink-0">
              <Database className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2 font-heading">
                  Google BigQuery Data Governance & Telemetry
                </h2>
                <span className="text-[10px] font-mono bg-blue-950/80 text-blue-300 border border-blue-700/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  SQL Engine Active (v2026.8)
                </span>
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  Partitioned & Clustered
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                GCP Project: <strong className="font-mono text-blue-300">gov-janvani-national-analytics</strong> • Dataset: <strong className="font-mono text-cyan-300">gov_janvani_dw.grievances_partitioned_clustered</strong>
              </p>
            </div>
          </div>

          {/* Quick Engine Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={fetchBigQueryAnalytics}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Query Cache</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 min-h-[38px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Mart</span>
            </button>
          </div>
        </div>

        {/* BigQuery Execution Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Telemetry Rows</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {metadata?.totalRowsAnalyzed?.toLocaleString("en-IN") || "1,48,290"}
            </div>
            <div className="text-[10px] text-emerald-400">Across 36 States & UTs</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Bytes Scanned (Partition)</div>
            <div className="text-lg font-black text-cyan-400 font-mono mt-0.5">
              {metadata?.bytesScannedMb || "42.8"} MB
            </div>
            <div className="text-[10px] text-slate-400">Zero Full-Table Scans</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Slot Execution Time</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              {metadata?.slotExecutionTimeMs || "184"} ms
            </div>
            <div className="text-[10px] text-emerald-400">BI Engine In-Memory Cache</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">District SLA Pass Rate</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
              94.6%
            </div>
            <div className="text-[10px] text-slate-400">Statutory 24h/48h Charter</div>
          </div>
        </div>
      </div>

      {/* 2. Global Filter & Time Range Selector Strip */}
      <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#202020] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs">
            <Filter className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Time Horizon:</span>
            <div className="flex items-center gap-1 ml-1">
              {(["7d", "30d", "90d", "fy26"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeRange === t
                      ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#303030]"
                  }`}
                >
                  {t === "7d" ? "7 Days" : t === "30d" ? "30 Days" : t === "90d" ? "90 Days" : "FY 2026-27"}
                </button>
              ))}
            </div>
          </div>

          {/* State Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#202020] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">State:</span>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("All Districts");
              }}
              className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="Madhya Pradesh" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Madhya Pradesh (MP)</option>
              <option value="Maharashtra" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Maharashtra (MH)</option>
              <option value="Delhi NCT" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Delhi NCT (DL)</option>
              <option value="Karnataka" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Karnataka (KA)</option>
              <option value="Uttar Pradesh" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Uttar Pradesh (UP)</option>
              <option value="Gujarat" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Gujarat (GJ)</option>
            </select>
          </div>

          {/* District Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#202020] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="All Districts" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">All Districts Aggregation</option>
              <option value="Dhar" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Dhar (Pithampur / Nalchha)</option>
              <option value="Indore" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Indore Municipal Corp</option>
              <option value="Bhopal" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Bhopal Smart City</option>
              <option value="Ujjain" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Ujjain Nagar Nigam</option>
              <option value="Jabalpur" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Jabalpur Cantonment</option>
              <option value="Gwalior" className="bg-white dark:bg-[#202020] text-slate-900 dark:text-white">Gwalior Municipal Corp</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          Last Synced: <span className="text-slate-800 dark:text-slate-200 font-bold">{new Date().toLocaleTimeString("en-IN")}</span>
        </div>
      </div>

      {/* 3. Analytics Sub-Tabs (Recharts Visualizer Views) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/80 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] overflow-x-auto scrollbar-none shadow-xs">
        <button
          onClick={() => setActiveChartTab("trends")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer ${
            activeChartTab === "trends"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Grievance Inflow & Velocity</span>
        </button>

        <button
          onClick={() => setActiveChartTab("resolution")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer ${
            activeChartTab === "resolution"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Resolution Time Averages (SLAs)</span>
        </button>

        <button
          onClick={() => setActiveChartTab("hotspots")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer ${
            activeChartTab === "hotspots"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>District Hot-Spot Density</span>
        </button>

        <button
          onClick={() => setActiveChartTab("departments")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer ${
            activeChartTab === "departments"
              ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Department Workload & Velocity</span>
        </button>

        <button
          onClick={() => setActiveChartTab("sql_workbench")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer ${
            activeChartTab === "sql_workbench"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900"
              : "text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#202020]"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>SQL Workbench & AI Query</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* CHART VIEW 1: GRIEVANCE INFLUX & RESOLUTION TRENDS (RECHARTS AREA/LINE) */}
      {/* ========================================================================= */}
      {activeChartTab === "trends" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>Time-Series Grievance Inflow vs Resolution Velocity</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                  BigQuery partitioned daily ingestion aggregations with statutory SLA breach tracking
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                  Citizen Submissions
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Completed Resolutions
                </span>
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                  SLA Breaches
                </span>
              </div>
            </div>

            {/* Recharts Area/Line Chart */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorBreach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip content={<CustomTrendsTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey="submitted"
                    name="Submitted Complaints"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSubmitted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Remediated & Verified"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                  />
                  <Area
                    type="monotone"
                    dataKey="slaBreached"
                    name="SLA Breached"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBreach)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Metrics Callout Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/[0.08]">
                <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">Peak Daily Influx Volume</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">340 Cases / Day</div>
                <div className="text-[10px] text-slate-500">Recorded on August 24, 2026</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/[0.08]">
                <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">Average Turnaround Velocity</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-[#20C997] font-mono mt-0.5">23.4 Hours</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Within 24h-48h Citizen Charter</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/[0.08]">
                <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">Resolution-to-Intake Ratio</div>
                <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">92.8%</div>
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400">+4.1% MoM Governance Efficiency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHART VIEW 2: RESOLUTION TIME AVERAGES VS STATUTORY SLA (RECHARTS BAR) */}
      {/* ========================================================================= */}
      {activeChartTab === "resolution" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Category-wise Average Resolution Hours vs Statutory SLA Thresholds</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                  Comparison against statutory Public Services Guarantee Act (Madhya Pradesh & Central Rules)
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Actual Turnaround (Avg Hrs)
                </span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                  Target SLA (Max Hours)
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySla} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                  <XAxis
                    dataKey="category"
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    label={{ value: "Hours", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip content={<CustomSlaTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "25px" }} />
                  <ReferenceLine y={24} stroke="#10b981" strokeDasharray="3 3" label={{ value: "24h SLA Target", fill: "#10b981", fontSize: 10 }} />
                  <ReferenceLine y={48} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "48h Max Limit", fill: "#ef4444", fontSize: 10 }} />
                  <Bar dataKey="actualAvgHours" name="Actual Avg Hours" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="statutorySlaHours" name="Statutory SLA Target (Hours)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Performance Breakdown Table */}
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden text-xs">
              <div className="grid grid-cols-5 p-2.5 bg-slate-100 dark:bg-[#202020] font-bold text-slate-700 dark:text-slate-300">
                <div>Civic Category</div>
                <div className="text-center">Actual Avg (Hrs)</div>
                <div className="text-center">Target SLA</div>
                <div className="text-center">P95 Worst-Case</div>
                <div className="text-right">SLA Compliance</div>
              </div>
              <div className="divide-y divide-slate-200/60 dark:divide-white/[0.05]">
                {categorySla.map((c: any) => (
                  <div key={c.category} className="grid grid-cols-5 p-2.5 hover:bg-slate-50 dark:hover:bg-[#202020]/40 text-slate-700 dark:text-slate-300">
                    <div className="font-semibold text-slate-900 dark:text-white">{c.category}</div>
                    <div className="text-center font-mono text-amber-600 dark:text-amber-400">{c.actualAvgHours}h</div>
                    <div className="text-center font-mono text-blue-600 dark:text-blue-400">{c.statutorySlaHours}h</div>
                    <div className="text-center font-mono text-purple-600 dark:text-purple-400">{c.p95Hours}h</div>
                    <div className="text-right font-mono font-bold text-emerald-600 dark:text-[#20C997]">{c.complianceRate}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHART VIEW 3: DISTRICT HOT-SPOT DENSITY MATRIX (RECHARTS HORIZONTAL BAR) */}
      {/* ========================================================================= */}
      {activeChartTab === "hotspots" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: District Hotspot Density Index (Horizontal Bar) */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Inter-District Hot-Spot Density & Problem Vulnerability Index</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                    Calculated by BigQuery: complaint frequency per sq.km weighted by severity score (1-10)
                  </p>
                </div>
              </div>

              <div className="h-80 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={districtHotspots}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis dataKey="district" type="category" stroke="#64748b" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 dark:bg-[#1a1a1a]/95 border border-slate-700 dark:border-white/10 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-white">
                              <p className="font-bold text-white">{d.district} ({d.state})</p>
                              <p className="text-orange-400 font-semibold">Hotspot Density Index: {d.hotspotDensityIndex} / 100</p>
                              <p className="text-blue-400">Total Volume: {d.totalComplaints} cases</p>
                              <p className="text-emerald-400">SLA Compliance Rate: {d.slaPassRate}%</p>
                              <p className="text-red-400">Critical Red Zones: {d.criticalZonesCount} hotspots</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="hotspotDensityIndex"
                      name="Hot-Spot Density Index (0-100)"
                      fill="#f97316"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Ward-Level Granular Concentration for District Dhar */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>Ward Hotspot Clusters (Dhar)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                  Micro-jurisdiction clustering in District Dhar & Pithampur
                </p>

                <div className="space-y-3 mt-4">
                  {wardDensity.map((w: any) => (
                    <div key={w.ward} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{w.ward}</span>
                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{w.densityPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-[#252525] rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                          style={{ width: `${w.densityPct * 2}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-[#A8A8A8] flex justify-between">
                        <span>{w.primaryIssue}</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{w.complaints} cases</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 mt-2">
                <strong className="text-blue-700 dark:text-blue-300">Nodal Directive:</strong> Prioritize daily inspection squad allocation to Ward 18 (Main Market) and Ward 8 (Hospital Gate).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHART VIEW 4: DEPARTMENT WORKLOAD & VELOCITY (RECHARTS BAR + PIE) */}
      {/* ========================================================================= */}
      {activeChartTab === "departments" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Department Turnaround & Active Workload (Bar Chart) */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span>Municipal Department Workload & Average Resolution Velocity</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                    Aggregated across PWD, Solid Waste, Water Supply, Electricity, and Drainage Wings
                  </p>
                </div>
              </div>

              <div className="h-80 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentWorkload} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                    <XAxis
                      dataKey="department"
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 dark:bg-[#1a1a1a]/95 border border-slate-700 dark:border-white/10 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-white">
                              <p className="font-bold text-white">{d.department}</p>
                              <p className="text-blue-400">Active Workload: {d.activeLoad} cases</p>
                              <p className="text-emerald-400">Completed All-Time: {d.completedTotal} cases</p>
                              <p className="text-amber-400">Avg Duration: {d.avgDurationHours} hrs</p>
                              <p className="text-cyan-400">Expenditure: ₹{d.expenditureLakhs} Lakhs</p>
                              <p className="text-purple-400">Efficiency Score: {d.efficiencyScore} / 100</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "25px" }} />
                    <Bar dataKey="activeLoad" name="Active Open Cases" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="avgDurationHours" name="Avg Turnaround (Hours)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Pie Distribution of Defect Categories */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-cyan-500" />
                  <span>Category Volume Share</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                  Proportion of civic grievance volume logged
                </p>

                <div className="h-56 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySla}
                        dataKey="complaintsCount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {categorySla.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900/95 dark:bg-[#1a1a1a]/95 border border-slate-700 dark:border-white/10 p-2.5 rounded-xl shadow-xl text-xs text-white">
                                <p className="font-bold text-white">{payload[0].name}</p>
                                <p className="text-cyan-400 font-mono">{payload[0].value?.toLocaleString("en-IN")} complaints</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 text-[11px] pt-1">
                  {categorySla.slice(0, 4).map((c: any, idx: number) => (
                    <div key={c.category} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: CATEGORY_COLORS[idx] }}
                        ></span>
                        {c.category}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{c.complaintsCount?.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GOOGLE BIGQUERY SQL WORKBENCH & NATURAL LANGUAGE TO SQL */}
      {/* ========================================================================= */}
      {activeChartTab === "sql_workbench" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#151515] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-500" />
                  <span>Google BigQuery SQL Query Workbench</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-0.5">
                  Execute standard GoogleSQL queries or use Gemini to translate natural language prompts into analytical SQL
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(sqlQuery)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#202020] dark:hover:bg-[#282828] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 min-h-[36px] cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? "Copied SQL" : "Copy SQL"}</span>
                </button>
              </div>
            </div>

            {/* Natural Language Prompt Input */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/[0.08] space-y-2">
              <label className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Ask BigQuery in Plain English (AI-Powered Text-to-SQL):</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={naturalLanguageQuery}
                  onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                  placeholder="e.g. Find top 5 wards in Dhar with highest pothole SLA breaches in last 30 days"
                  className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-[#151515] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 min-h-[40px]"
                />
                <button
                  type="button"
                  onClick={() => handleExecuteBigQuery(true)}
                  disabled={isExecutingSql || !naturalLanguageQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-950 transition-all min-h-[40px] disabled:opacity-50 cursor-pointer"
                >
                  {isExecutingSql ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Synthesizing SQL...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Translate & Run</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SQL Code Editor Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">BigQuery GoogleSQL Editor:</span>
                <span className="text-[11px]">Standard SQL Dialect • Cost Estimate: 0.05 slot-sec</span>
              </div>
              <div className="relative">
                <textarea
                  rows={7}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full p-4 font-mono text-xs bg-slate-900 dark:bg-[#101010] border border-slate-300 dark:border-white/[0.08] rounded-xl text-emerald-400 focus:outline-none focus:border-blue-500 leading-relaxed shadow-inner"
                  spellCheck={false}
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Target: `gov-janvani-national-analytics.gov_janvani_dw`</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteBigQuery(false)}
                  disabled={isExecutingSql}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-950 transition-all min-h-[40px] cursor-pointer"
                >
                  {isExecutingSql ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Executing on BigQuery...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-emerald-300 fill-emerald-300" />
                      <span>Run Query (Ctrl + Enter)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Query Results / Table */}
            {queryResult && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/[0.08] space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Query Execution Succeeded</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>Bytes: <strong className="text-cyan-600 dark:text-cyan-300">{queryResult.executionStats?.bytesProcessed}</strong></span>
                    <span>•</span>
                    <span>Time: <strong className="text-amber-600 dark:text-amber-300">{queryResult.executionStats?.queryTimeMs}ms</strong></span>
                    <span>•</span>
                    <span>Slots: <strong className="text-purple-600 dark:text-purple-300">{queryResult.executionStats?.slotMilliseconds}ms</strong></span>
                  </div>
                </div>

                {queryResult.explanation && (
                  <p className="text-xs text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 p-2.5 rounded-lg">
                    <strong>AI Query Analysis:</strong> {queryResult.explanation}
                  </p>
                )}

                {/* Tabular Output */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-[#151515] text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        {queryResult.columns?.map((col: string) => (
                          <th key={col} className="p-2.5 border-b border-slate-200 dark:border-white/[0.08]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.05]">
                      {queryResult.rows?.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-100/50 dark:hover:bg-[#252525]">
                          {queryResult.columns?.map((col: string) => (
                            <td key={col} className="p-2.5 font-mono">
                              {typeof row[col] === "number"
                                ? row[col].toLocaleString("en-IN")
                                : row[col]?.toString()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. AI-POWERED DATA-DRIVEN GOVERNANCE STRATEGIC INTELLIGENCE CARD */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-cyan-50/90 dark:from-[#151515] dark:via-[#1c2230] dark:to-[#151515] border border-blue-200 dark:border-cyan-500/30 space-y-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-200/80 dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-500/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: "6s" }} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                BigQuery AI Governance Intelligence & Predictive Decision Support
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Actionable policy interventions and predictive municipal insights synthesized by Gemini
              </p>
            </div>
          </div>

          <button
            onClick={fetchAiInsights}
            disabled={isLoadingAi}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-cyan-950 hover:bg-slate-100 dark:hover:bg-cyan-900 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 text-xs font-bold flex items-center gap-1.5 min-h-[36px] cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 ${isLoadingAi ? "animate-spin" : ""}`} />
            <span>Regenerate Insights</span>
          </button>
        </div>

        {predictiveTrend && (
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/40 text-xs text-slate-800 dark:text-cyan-100 flex items-start gap-2.5 shadow-xs">
            <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-cyan-700 dark:text-cyan-300">Predictive ML Risk Forecast:</strong> {predictiveTrend}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {aiInsights.map((insight, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white/95 dark:bg-[#202020] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 space-y-2 flex flex-col justify-between shadow-xs transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      insight.severity === "CRITICAL"
                        ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800"
                        : insight.severity === "HIGH"
                        ? "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                        : "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {insight.severity} PRIORITY
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Insight #{idx + 1}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {insight.title}
                </h4>

                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-mono bg-amber-50/70 dark:bg-[#151515] p-2 rounded border border-amber-200 dark:border-white/[0.08]">
                  {insight.metric}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                  <strong>Recommendation:</strong> {insight.recommendation}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Impact: {insight.projectedImpact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
