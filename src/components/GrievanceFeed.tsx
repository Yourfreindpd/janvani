import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  Star,
  Layers,
  ChevronDown,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  X,
  RotateCcw,
  LayoutGrid,
  List,
  MapPin,
  Building2,
  Users,
  Film,
  Maximize2,
} from "lucide-react";
import { Grievance, CivicCategory } from "../types";
import { GrievanceCard } from "./GrievanceCard";
import { CivicMediaScroller } from "./CivicMediaScroller";
import { STATES_DATA, getDistrictsForState } from "../data/initialData";
import { Translations } from "../data/translations";

interface GrievanceFeedProps {
  grievances: Grievance[];
  onOpenReportModal: () => void;
  onTrackGrievance: (grievance: Grievance) => void;
  onUpvoteGrievance: (id: string) => void;
  onOpenMediaScroller?: (grievance: Grievance) => void;
  onOpenDeleteModal?: (grievance: Grievance, initialMode?: "all" | "video_only") => void;
  isAdmin?: boolean;
  t: Translations;
  currentUserId?: string;
  selectedStateFilter: string;
  setSelectedStateFilter: (state: string) => void;
  selectedDistrictFilter: string;
  setSelectedDistrictFilter: (district: string) => void;
}

export const GrievanceFeed: React.FC<GrievanceFeedProps> = ({
  grievances,
  onOpenReportModal,
  onTrackGrievance,
  onUpvoteGrievance,
  onOpenMediaScroller,
  onOpenDeleteModal,
  isAdmin = false,
  t,
  currentUserId,
  selectedStateFilter,
  setSelectedStateFilter,
  selectedDistrictFilter,
  setSelectedDistrictFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<"all" | "in_progress" | "resolved" | "my_reports">("all");
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "scroll">("grid");

  const categoryChips = useMemo(() => [
    { id: "all", label: t.allFilter || "All Issues", icon: "✨" },
    { id: "Roads & Potholes", label: t.catRoads || "Potholes & Roads", icon: "🛣️" },
    { id: "Garbage & Sanitation", label: t.catSanitation || "Cleanliness & Waste", icon: "🗑️" },
    { id: "Drinking Water & Pipeline Leakage", label: t.catWater || "Water Supply", icon: "💧" },
    { id: "Electricity Hazard & Wiring", label: t.catElectricity || "Electricity", icon: "⚡" },
    { id: "Sewage & Drain Overflow", label: t.catDrainage || "Drain & Sewage", icon: "🌊" },
    { id: "Streetlight Breakdown", label: t.catStreetlights || "Streetlights", icon: "💡" },
    { id: "Public Health & Fogging", label: t.catHealth || "Health & Fogging", icon: "🏥" },
  ], [t]);

  // Dynamic districts based on selected state from full nationwide dataset
  const availableDistricts = useMemo(() => {
    if (selectedStateFilter && selectedStateFilter !== "all") {
      const stateObj = STATES_DATA.find(
        (s) =>
          s.name.toLowerCase() === selectedStateFilter.toLowerCase() ||
          s.code.toLowerCase() === selectedStateFilter.toLowerCase()
      );
      if (stateObj) {
        const districts = getDistrictsForState(stateObj.code);
        return ["All Districts", ...districts.map((d) => `${d.name} (${stateObj.code})`)];
      }
    }
    // "All States" selected: aggregate all districts from active records & major hubs
    const uniqueDistricts = new Set<string>();
    grievances.forEach((g) => {
      if (g.district) {
        uniqueDistricts.add(`${g.district} (${g.stateCode})`);
      }
    });
    ["Dhar (MP)", "Indore (MP)", "Bhopal (MP)", "Mumbai Suburban (MH)", "Pune (MH)", "Bengaluru Urban (KA)", "New Delhi (NDMC Zone) (DL)", "Jaipur (RJ)", "Chennai (TN)"].forEach((d) =>
      uniqueDistricts.add(d)
    );
    return ["All Districts", ...Array.from(uniqueDistricts)];
  }, [selectedStateFilter, grievances]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStateFilter && selectedStateFilter !== "all") count++;
    if (selectedDistrictFilter && selectedDistrictFilter !== "all" && selectedDistrictFilter !== "All Districts") count++;
    if (selectedCategory && selectedCategory !== "all") count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedStateFilter, selectedDistrictFilter, selectedCategory, searchQuery]);

  // Filter logic
  const filteredGrievances = useMemo(() => {
    return grievances.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesToken = item.token.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesLocality = item.locality.toLowerCase().includes(q);
        const matchesDept = item.department.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesState = item.state.toLowerCase().includes(q);
        const matchesDistrict = item.district.toLowerCase().includes(q);
        if (!matchesToken && !matchesTitle && !matchesLocality && !matchesDept && !matchesDesc && !matchesState && !matchesDistrict) {
          return false;
        }
      }

      // 2. State Filter
      if (selectedStateFilter && selectedStateFilter !== "all") {
        if (
          !item.state.toLowerCase().includes(selectedStateFilter.toLowerCase()) &&
          !item.stateCode.toLowerCase().includes(selectedStateFilter.toLowerCase())
        ) {
          return false;
        }
      }

      // 3. District Filter
      if (selectedDistrictFilter && selectedDistrictFilter !== "all" && selectedDistrictFilter !== "All Districts") {
        const cleanFilter = selectedDistrictFilter.replace(/\s*\([A-Za-z]+\)$/, "").toLowerCase().trim();
        const itemDistrict = item.district.toLowerCase().trim();
        if (!itemDistrict.includes(cleanFilter) && !cleanFilter.includes(itemDistrict)) {
          return false;
        }
      }

      // 4. Category Filter
      if (selectedCategory !== "all") {
        if (item.category !== selectedCategory) {
          return false;
        }
      }

      // 5. Status Tab
      if (statusTab === "in_progress") {
        return item.status === "Work In Progress" || item.status === "Submitted & Token Issued" || item.status === "Under Inspection";
      } else if (statusTab === "resolved") {
        return item.status === "Resolved & Verified";
      } else if (statusTab === "my_reports") {
        return item.filedByName.toLowerCase().includes("praneet");
      }

      return true;
    });
  }, [
    grievances,
    searchQuery,
    selectedStateFilter,
    selectedDistrictFilter,
    selectedCategory,
    statusTab,
  ]);

  const countAll = grievances.length;
  const countInProgress = grievances.filter(
    (g) => g.status === "Work In Progress" || g.status === "Submitted & Token Issued"
  ).length;
  const countResolved = grievances.filter((g) => g.status === "Resolved & Verified").length;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStateFilter("all");
    setSelectedDistrictFilter("All Districts");
    setSelectedCategory("all");
    setStatusTab("all");
  };

  return (
    <div className="space-y-5">
      {/* 1. Pulse Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#303030] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F5F5F5] tracking-tight">
              {t.grievanceFeed}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-[#FF6A00]/15 text-orange-700 dark:text-[#FF8A00] border border-orange-200 dark:border-[#FF6A00]/30">
              Live Ward Watch
            </span>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "scroll" ? "grid" : "scroll")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                viewMode === "scroll"
                  ? "bg-[#FF6A00] text-white shadow-orange-500/30"
                  : "bg-slate-100 dark:bg-white/10 hover:bg-orange-50 dark:hover:bg-[#FF6A00]/20 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10"
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>{viewMode === "scroll" ? "Exit Reel View" : "📱 Scroll Media Reel"}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-1">
            Public issues reported across your district with real-time statutory resolution tracking
          </p>
        </div>

        {/* Quick Resolution Counters */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto relative z-10">
          <div className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#151515]/60 border border-slate-200 dark:border-white/[0.08] text-center">
            <div className="text-[10px] text-slate-400 dark:text-[#777777] font-medium">{t.statusInProgress || "In Action"}</div>
            <div className="text-sm font-black text-amber-600 dark:text-amber-400">{countInProgress}</div>
          </div>
          <div className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#151515]/60 border border-slate-200 dark:border-white/[0.08] text-center">
            <div className="text-[10px] text-slate-400 dark:text-[#777777] font-medium">{t.statusResolved || "Fixed & Verified"}</div>
            <div className="text-sm font-black text-emerald-600 dark:text-[#20C997]">{countResolved}</div>
          </div>
          <div className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#151515]/60 border border-slate-200 dark:border-white/[0.08] text-center">
            <div className="text-[10px] text-slate-400 dark:text-[#777777] font-medium">{t.resolutionRate || "Success Rate"}</div>
            <div className="text-sm font-black text-cyan-700 dark:text-[#3B82F6]">94.8%</div>
          </div>
        </div>
      </div>

      {/* 2. Fast Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
        {categoryChips.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[38px] cursor-pointer ${
                isSelected
                  ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
                  : "bg-white dark:bg-[#303030] hover:bg-slate-50 dark:hover:bg-[#383838] text-slate-700 dark:text-[#A8A8A8] dark:hover:text-[#F5F5F5] border border-slate-200 dark:border-white/[0.08]"
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Filters Panel */}
      <div className="rounded-2xl bg-white dark:bg-[#303030] border border-slate-200/90 dark:border-white/[0.08] p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder || "Search by area, colony, problem keyword, or token..."}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-[#151515]/60 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] focus:bg-white dark:focus:bg-[#151515] transition-all min-h-[42px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-[#777777] dark:hover:text-[#F5F5F5] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* State Picker */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedStateFilter}
                onChange={(e) => {
                  setSelectedStateFilter(e.target.value);
                  setSelectedDistrictFilter("All Districts");
                }}
                className="w-full sm:w-40 px-3 py-2.5 bg-slate-50 dark:bg-[#151515]/60 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-800 dark:text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00] focus:bg-white dark:focus:bg-[#151515] transition-all appearance-none cursor-pointer min-h-[42px] font-medium pr-8"
              >
                <option value="all" className="bg-white dark:bg-[#151515]">{t.allStates || "All States"}</option>
                {STATES_DATA.map((st) => (
                  <option key={st.code} value={st.name} className="bg-white dark:bg-[#151515]">
                    {st.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#777777] pointer-events-none" />
            </div>

            {/* District Picker */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedDistrictFilter}
                onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                className="w-full sm:w-40 px-3 py-2.5 bg-slate-50 dark:bg-[#151515]/60 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-800 dark:text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00] focus:bg-white dark:focus:bg-[#151515] transition-all appearance-none cursor-pointer min-h-[42px] font-medium pr-8"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-[#151515]">
                    {d === "All Districts" ? (t.allDistricts || "All Districts") : d}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#777777] pointer-events-none" />
            </div>

            {/* Grid vs Compact vs Scroll Media Reel View */}
            <div className="flex items-center bg-slate-100 dark:bg-[#151515]/60 border border-slate-200 dark:border-white/[0.08] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Card Grid View"
                className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-[#383838] text-[#FF6A00] shadow-sm"
                    : "text-slate-500 dark:text-[#777777] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("compact")}
                title="Compact List View"
                className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "compact"
                    ? "bg-white dark:bg-[#383838] text-[#FF6A00] shadow-sm"
                    : "text-slate-500 dark:text-[#777777] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
                }`}
              >
                <List className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("scroll")}
                title="Scroll Media Reports (Photos & Videos with 1-Tap Support)"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "scroll"
                    ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white shadow-md shadow-[#FF6A00]/25"
                    : "text-slate-500 dark:text-[#777777] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
                }`}
              >
                <Film className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Reel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
            <button
              onClick={() => setStatusTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[34px] cursor-pointer ${
                statusTab === "all"
                  ? "bg-[#FF6A00] text-white shadow-sm shadow-[#FF6A00]/25"
                  : "text-slate-600 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838] dark:hover:text-[#F5F5F5]"
              }`}
            >
              {t.allFilter || "All"} ({countAll})
            </button>

            <button
              onClick={() => setStatusTab("in_progress")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[34px] cursor-pointer ${
                statusTab === "in_progress"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/40"
                  : "text-slate-600 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838] dark:hover:text-[#F5F5F5]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{t.statusInProgress || "In Action"} ({countInProgress})</span>
            </button>

            <button
              onClick={() => setStatusTab("resolved")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[34px] cursor-pointer ${
                statusTab === "resolved"
                  ? "bg-emerald-50 dark:bg-[#20C997]/15 text-emerald-800 dark:text-[#20C997] border border-emerald-300 dark:border-[#20C997]/30"
                  : "text-slate-600 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838] dark:hover:text-[#F5F5F5]"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#20C997]" />
              <span>{t.statusResolved || "Resolved"} ({countResolved})</span>
            </button>

            <button
              onClick={() => setStatusTab("my_reports")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[34px] cursor-pointer ${
                statusTab === "my_reports"
                  ? "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700/40"
                  : "text-slate-600 dark:text-[#A8A8A8] hover:bg-slate-100 dark:hover:bg-[#383838] dark:hover:text-[#F5F5F5]"
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{t.myGrievances || "My Reports"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <div className="text-[11px] text-slate-500 dark:text-[#777777] font-medium">
              Showing <span className="text-slate-900 dark:text-[#F5F5F5] font-bold">{filteredGrievances.length}</span> issues
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-[#FF6A00] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.resetFilters || "Reset"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Grievances Stream */}
      {filteredGrievances.length > 0 ? (
        viewMode === "scroll" ? (
          <div className="space-y-4">
            {/* Scroll Reel Helper Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FF8A00] text-white flex items-center justify-center font-bold shadow-md shadow-[#FF6A00]/20">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Field Media Reel</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6A00] text-white">
                      Live Scroll
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Scroll up/down through citizen field reports (videos & photos). Tap the glowing orange button to cast your citizen support!
                  </p>
                </div>
              </div>

              {onOpenMediaScroller && (
                <button
                  type="button"
                  onClick={() => onOpenMediaScroller(filteredGrievances[0])}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer shrink-0"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Open Fullscreen Reel</span>
                </button>
              )}
            </div>

            {/* The CivicMediaScroller Component */}
            <CivicMediaScroller
              grievances={filteredGrievances}
              onUpvote={onUpvoteGrievance}
              onTrack={onTrackGrievance}
              t={t}
              mode="inline"
            />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGrievances.map((grievance) => (
              <GrievanceCard
                key={grievance.id}
                grievance={grievance}
                onTrack={onTrackGrievance}
                onUpvote={onUpvoteGrievance}
                onOpenMediaScroller={onOpenMediaScroller}
                onOpenDeleteModal={onOpenDeleteModal}
                isAdmin={isAdmin}
                t={t}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGrievances.map((grievance) => (
              <GrievanceCard
                key={grievance.id}
                grievance={grievance}
                onTrack={onTrackGrievance}
                onUpvote={onUpvoteGrievance}
                onOpenMediaScroller={onOpenMediaScroller}
                onOpenDeleteModal={onOpenDeleteModal}
                isAdmin={isAdmin}
                t={t}
                viewMode="compact"
              />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <AlertCircle className="w-10 h-10 text-slate-400 dark:text-[#777777] mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-[#F5F5F5]">No matching issues found</h4>
          <p className="text-xs text-slate-500 dark:text-[#A8A8A8] mt-1 max-w-sm mx-auto">
            Try choosing another category or clearing your search keywords.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-[#FF6A00] text-white hover:bg-[#ff791a] text-xs font-bold transition-colors min-h-[38px] cursor-pointer shadow-md shadow-[#FF6A00]/25"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* 5. Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-xl shadow-[#FF6A00]/30 transition-all min-h-[46px] cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Report Civic Issue</span>
        </button>
      </div>
    </div>
  );
};
