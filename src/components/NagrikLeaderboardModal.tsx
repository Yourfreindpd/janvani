import React, { useState } from "react";
import {
  Trophy,
  Award,
  Medal,
  Star,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  History,
  Sparkles,
  X,
  FileCheck,
  ThumbsUp,
  Video,
  Mic,
  ArrowUpRight,
  CheckCircle2,
  Crown,
  Share2,
  Download,
  Printer,
  QrCode,
  Building,
  Info,
  Globe,
  MapPin,
  Landmark,
  Search,
  Filter,
} from "lucide-react";
import { UserProfile, CivicPointTransaction, NagrikLeaderboardEntry, NagrikLeaderboardScope } from "../types";
import {
  NAGRIK_TIERS,
  POINT_RULES,
  getNagrikTier,
  getNextTierProgress,
  getStoredNagrikData,
  getRankedLeaderboard,
  awardNagrikPoints,
  getAllAvailableStates,
  getDistrictsForState,
  getWardsForDistrict,
} from "../utils/nagrikPoints";

interface NagrikLeaderboardModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentUser: UserProfile | null;
  onNavigateToFeed?: () => void;
  onOpenReportModal?: () => void;
  mode?: "modal" | "page";
}

export const NagrikLeaderboardModal: React.FC<NagrikLeaderboardModalProps> = ({
  isOpen = true,
  onClose,
  currentUser,
  onNavigateToFeed,
  onOpenReportModal,
  mode = "modal",
}) => {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "tiers" | "history" | "earn">("leaderboard");
  const [scopeFilter, setScopeFilter] = useState<NagrikLeaderboardScope>("district");
  const [selectedStateCode, setSelectedStateCode] = useState<string>("MP");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("dhar");
  const [selectedWardId, setSelectedWardId] = useState<string>("w14");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [certificateScope, setCertificateScope] = useState<NagrikLeaderboardScope>("district");
  const [certificateOpen, setCertificateOpen] = useState(false);

  if (mode === "modal" && !isOpen) return null;

  const currentUserId = currentUser?.id || currentUser?.email || "default_citizen";
  const nagrikData = getStoredNagrikData(currentUserId);
  const currentTier = getNagrikTier(nagrikData.points);
  const progressInfo = getNextTierProgress(nagrikData.points);

  const availableStates = getAllAvailableStates();
  const availableDistricts = getDistrictsForState(selectedStateCode);
  const availableWards = getWardsForDistrict(selectedStateCode, selectedDistrictId);

  const handleStateChange = (newCode: string) => {
    setSelectedStateCode(newCode);
    const districts = getDistrictsForState(newCode);
    const firstDistId = districts.length > 0 ? districts[0].id : "dhar";
    setSelectedDistrictId(firstDistId);
    const wards = getWardsForDistrict(newCode, firstDistId);
    setSelectedWardId(wards.length > 1 ? wards[1].id : "all");
  };

  const handleDistrictChange = (newDistrictId: string) => {
    setSelectedDistrictId(newDistrictId);
    const wards = getWardsForDistrict(selectedStateCode, newDistrictId);
    setSelectedWardId(wards.length > 1 ? wards[1].id : "all");
  };

  const leaderboardResult = getRankedLeaderboard(
    {
      scope: scopeFilter,
      stateCode: selectedStateCode,
      districtId: selectedDistrictId,
      wardId: selectedWardId,
      searchQuery: searchQuery,
    },
    {
      id: currentUserId,
      name: currentUser?.name || "Praneet Dubey",
      avatarText: currentUser?.avatarText || "PD",
      points: nagrikData.points,
      ward: currentUser?.location?.includes("Ward") ? currentUser.location : "Ward 14 (Old Palace & Bada Bazar)",
      district: "Dhar",
      districtId: "dhar",
      state: "Madhya Pradesh",
      stateCode: "MP",
    }
  );

  const {
    entries,
    userRank,
    userEntry,
    userRankSummary,
    stateName,
    districtName,
    wardName,
  } = leaderboardResult;

  const isBestNagrik = nagrikData.points >= 1000 || userRankSummary.districtRank === 1 || userRank === 1;
  const isPage = mode === "page";

  const content = (
    <div className={`relative w-full ${isPage ? "max-w-6xl mx-auto my-4" : "max-w-5xl max-h-[92vh]"} bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden`}>
      {/* ========================================================================= */}
      {/* MODAL / PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                नागरिक सम्मान & Best Nagrik Portal
              </h2>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#FF6A00]/15 text-[#FF6A00] border border-[#FF6A00]/30">
                District • State • Nation
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-Level Civic Contribution Leaderboard, Official Nagrik Ranks & Digital Certificates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCertificateScope(scopeFilter);
              setCertificateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Samman Certificate</span>
          </button>
          {!isPage && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CURRENT CITIZEN HIERARCHICAL RANK MATRIX BANNER */}
      {/* ========================================================================= */}
      <div className="px-5 sm:px-7 py-3.5 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Citizen Identity & Tier */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                {currentUser?.avatarText || "PD"}
              </div>
              {isBestNagrik && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow border-2 border-white dark:border-[#121216]">
                  <Crown className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {currentUser?.name || "Praneet Dubey"}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${currentTier.badgeColor}`}>
                  {currentTier.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{currentUser?.location?.includes("Ward") ? currentUser.location : "Ward 14, Dhar"}</span>
                <span>•</span>
                <span className="font-mono text-[10px]">Aadhaar: {currentUser?.aadhaarNumber || "XXXX-XXXX-5060"}</span>
              </div>
            </div>
          </div>

          {/* Right: 4-Tier Rank Matrix Cards + Points */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full lg:w-auto">
            {/* National Rank */}
            <div
              onClick={() => setScopeFilter("nation")}
              className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                scopeFilter === "nation"
                  ? "bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 shadow-sm"
                  : "bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-amber-400/40"
              }`}
            >
              <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5">
                <Globe className="w-2.5 h-2.5 text-blue-500" />
                <span>India (Nation)</span>
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                #{userRankSummary.nationalRank}
              </div>
              <div className="text-[9px] text-slate-400">of {userRankSummary.totalNational} Nagriks</div>
            </div>

            {/* State Rank */}
            <div
              onClick={() => setScopeFilter("state")}
              className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                scopeFilter === "state"
                  ? "bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 shadow-sm"
                  : "bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-amber-400/40"
              }`}
            >
              <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5 truncate">
                <Landmark className="w-2.5 h-2.5 text-orange-500 shrink-0" />
                <span className="truncate">{stateName}</span>
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                #{userRankSummary.stateRank}
              </div>
              <div className="text-[9px] text-slate-400">of {userRankSummary.totalState} in State</div>
            </div>

            {/* District Rank */}
            <div
              onClick={() => setScopeFilter("district")}
              className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                scopeFilter === "district"
                  ? "bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 shadow-sm"
                  : "bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-amber-400/40"
              }`}
            >
              <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5 truncate">
                <MapPin className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                <span className="truncate">{districtName}</span>
              </div>
              <div className="text-base font-black text-[#FF6A00] mt-0.5 flex items-center justify-center gap-0.5">
                <span>#{userRankSummary.districtRank}</span>
                {userRankSummary.districtRank === 1 && <Crown className="w-3 h-3 text-amber-500" />}
              </div>
              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                of {userRankSummary.totalDistrict} in District
              </div>
            </div>

            {/* Ward Rank */}
            <div
              onClick={() => setScopeFilter("ward")}
              className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                scopeFilter === "ward"
                  ? "bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 shadow-sm"
                  : "bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-amber-400/40"
              }`}
            >
              <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 truncate">
                {availableWards.find((w) => w.id === selectedWardId)?.shortName || wardName.split("(")[0].trim() || "Ward 14"}
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                #{userRankSummary.wardRank}
              </div>
              <div className="text-[9px] text-slate-400 truncate">of {userRankSummary.totalWard} in Ward</div>
            </div>

            {/* Total Points */}
            <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-orange-500/10 dark:bg-orange-950/20 border border-orange-500/30 text-center">
              <div className="text-[9px] uppercase font-bold text-[#FF6A00]">Civic Karma</div>
              <div className="text-base font-black text-[#FF6A00] mt-0.5">
                {nagrikData.points} <span className="text-[10px] font-normal">pts</span>
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">{progressInfo.pointsNeeded} pts to next</div>
            </div>
          </div>
        </div>
      </div>

        {/* ========================================================================= */}
        {/* NAVIGATION TABS */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 px-5 sm:px-7 py-2.5 border-b border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.01] overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === "leaderboard"
                ? "bg-[#FF6A00] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Best Nagrik Leaderboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tiers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === "tiers"
                ? "bg-[#FF6A00] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>Positions & Privileges</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("earn")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === "earn"
                ? "bg-[#FF6A00] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>How to Earn Points</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === "history"
                ? "bg-[#FF6A00] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Points Ledger ({nagrikData.transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setCertificateOpen(true)}
            className="sm:hidden ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certificate</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: BEST NAGRIK LEADERBOARD */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === "leaderboard" && (
            <div className="space-y-5">
              {/* Jurisdiction Scope Tabs */}
              <div className="bg-slate-50 dark:bg-white/[0.02] p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#FF6A00]" />
                      Ranking Scope:
                    </span>
                    <div className="inline-flex rounded-xl p-1 bg-slate-200/80 dark:bg-white/10 text-xs font-bold gap-1">
                      <button
                        type="button"
                        onClick={() => setScopeFilter("nation")}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          scopeFilter === "nation"
                            ? "bg-white dark:bg-[#1f1f26] text-slate-900 dark:text-white shadow-sm font-black"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                        <span>🇮🇳 All-India</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScopeFilter("state")}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          scopeFilter === "state"
                            ? "bg-white dark:bg-[#1f1f26] text-slate-900 dark:text-white shadow-sm font-black"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        <Landmark className="w-3.5 h-3.5 text-orange-500" />
                        <span>🏛️ State</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScopeFilter("district")}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          scopeFilter === "district"
                            ? "bg-white dark:bg-[#1f1f26] text-slate-900 dark:text-white shadow-sm font-black"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>📍 District</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScopeFilter("ward")}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          scopeFilter === "ward"
                            ? "bg-white dark:bg-[#1f1f26] text-slate-900 dark:text-white shadow-sm font-black"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        <span>🏘️ Ward</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Real-time Aadhaar-authenticated Civic Ledger</span>
                  </div>
                </div>

                {/* State, District, Ward Dropdowns + Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1 border-t border-slate-200/70 dark:border-white/5">
                  {/* State Picker */}
                  <div className="sm:col-span-3 flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">State:</label>
                    <select
                      value={selectedStateCode}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1a1a22] border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00] cursor-pointer"
                    >
                      {availableStates.map((st) => (
                        <option key={st.code} value={st.code}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District Picker */}
                  <div className="sm:col-span-3 flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">District:</label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1a1a22] border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00] cursor-pointer"
                    >
                      {availableDistricts.map((dst) => (
                        <option key={dst.id} value={dst.id}>
                          {dst.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ward Picker */}
                  <div className="sm:col-span-3 flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Ward:</label>
                    <select
                      value={selectedWardId}
                      onChange={(e) => setSelectedWardId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1a1a22] border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00] cursor-pointer"
                    >
                      {availableWards.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div className="sm:col-span-3 relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search citizen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#1a1a22] border border-slate-300 dark:border-white/10 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                    />
                  </div>
                </div>

                {/* Real-time Dynamic Rank Status Banner */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/5 border border-[#FF6A00]/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                      #{userRank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          {scopeFilter === "nation" && "🇮🇳 Your All-India National Standing"}
                          {scopeFilter === "state" && `🏛️ Your State Standing in ${stateName}`}
                          {scopeFilter === "district" && `📍 Your District Standing in ${districtName}`}
                          {scopeFilter === "ward" && `🏘️ Your Ward Standing in ${availableWards.find((w) => w.id === selectedWardId)?.shortName || "Ward"}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF6A00] text-white">
                          Rank #{userRank} of {entries.length} Citizens
                        </span>
                        {userRank === 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Best Nagrik in this Jurisdiction!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Active Jurisdiction: <strong className="text-[#FF6A00]">{userRankSummary.activeScopeLabel}</strong> • Verified Score: <strong>{nagrikData.points} Karma pts</strong>
                      </p>
                    </div>
                  </div>

                  {/* Reset to my home location button */}
                  {(selectedStateCode !== "MP" || selectedDistrictId !== "dhar" || selectedWardId !== "w14" || scopeFilter !== "district") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStateCode("MP");
                        setSelectedDistrictId("dhar");
                        setSelectedWardId("w14");
                        setScopeFilter("district");
                        setSearchQuery("");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1f1f26] border border-[#FF6A00]/40 text-[#FF6A00] text-xs font-bold hover:bg-[#FF6A00] hover:text-white transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Reset to My Ward (Ward 14, Dhar)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Podium for Top 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {entries.slice(0, 3).map((citizen) => {
                  const isFirst = citizen.rank === 1;
                  const isSecond = citizen.rank === 2;
                  const isThird = citizen.rank === 3;

                  return (
                    <div
                      key={citizen.id}
                      className={`relative p-4 rounded-2xl border transition-all flex flex-col items-center text-center ${
                        citizen.isCurrentUser
                          ? "bg-orange-50 dark:bg-orange-950/20 border-[#FF6A00] ring-2 ring-[#FF6A00]/20 shadow-md"
                          : isFirst
                          ? "bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/50 shadow-sm"
                          : "bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <div className="absolute -top-3.5 px-3 py-0.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1 bg-amber-400 text-slate-950">
                        {isFirst && <Crown className="w-3.5 h-3.5" />}
                        <span>Rank #{citizen.rank}</span>
                      </div>

                      <div className="relative mt-2 mb-2">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md ${
                            isFirst
                              ? "bg-gradient-to-tr from-amber-500 to-yellow-400 ring-4 ring-amber-400/30"
                              : isSecond
                              ? "bg-gradient-to-tr from-slate-400 to-slate-300"
                              : "bg-gradient-to-tr from-amber-700 to-amber-600"
                          }`}
                        >
                          {citizen.avatarText}
                        </div>
                      </div>

                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                        <span>{citizen.name}</span>
                        {citizen.isCurrentUser && (
                          <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-[#FF6A00] text-white">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Location badges */}
                      <div className="flex flex-wrap items-center justify-center gap-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{citizen.district}</span>
                        <span>•</span>
                        <span>{citizen.state}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{citizen.ward}</div>

                      <div className="mt-2 text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                        {citizen.specialHonor || citizen.position}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 w-full flex items-center justify-around text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Points</div>
                          <div className="font-black text-[#FF6A00]">{citizen.points}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Resolved</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {citizen.resolvedCount}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Upvotes</div>
                          <div className="font-bold text-slate-700 dark:text-slate-300">
                            {citizen.upvotesCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Leaderboard Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="bg-slate-100 dark:bg-white/[0.05] px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>Official Nagrik Honor Roll • {scopeFilter.toUpperCase()} LEVEL</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing: <span className="font-bold text-slate-900 dark:text-white">{entries.length} Citizens</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-white/5 max-h-[420px] overflow-y-auto">
                  {entries.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No citizens found matching your filter criteria. Try adjusting the search or region.
                    </div>
                  ) : (
                    entries.map((citizen) => (
                      <div
                        key={citizen.id}
                        className={`flex items-center justify-between p-3.5 sm:px-5 transition-colors ${
                          citizen.isCurrentUser
                            ? "bg-orange-500/10 dark:bg-orange-950/30 border-l-4 border-[#FF6A00]"
                            : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              citizen.rank === 1
                                ? "bg-amber-400 text-slate-950 shadow-sm"
                                : citizen.rank === 2
                                ? "bg-slate-300 text-slate-800"
                                : citizen.rank === 3
                                ? "bg-amber-700 text-white"
                                : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            #{citizen.rank}
                          </div>

                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {citizen.avatarText}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {citizen.name}
                              </span>
                              {citizen.isCurrentUser && (
                                <span className="px-1.5 py-0.2 text-[10px] font-black rounded bg-[#FF6A00] text-white">
                                  YOU
                                </span>
                              )}
                              {citizen.rank === 1 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                  <Crown className="w-3 h-3 text-amber-500" /> Best Nagrik
                                </span>
                              )}
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                                {citizen.district}, {citizen.stateCode || citizen.state}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{citizen.position}</span>
                              <span>•</span>
                              <span>{citizen.ward}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 text-right shrink-0">
                          <div className="hidden sm:block text-xs">
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                              {citizen.resolvedCount} Resolved
                            </div>
                            <div className="text-[10px] text-slate-400">{citizen.upvotesCount} Endorsements</div>
                          </div>

                          <div className="text-right">
                            <div className="text-base sm:text-lg font-black text-[#FF6A00] font-mono">
                              {citizen.points}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Karma pts</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Call to action */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center shrink-0 shadow-md">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Want to reach #1 Best Nagrik in {scopeFilter === "nation" ? "India" : scopeFilter === "state" ? stateName : `${districtName} District`}?
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Earn +50 pts for new reports, +30 for video proofs, and +100 when you verify resolved work!
                    </p>
                  </div>
                </div>
                {onOpenReportModal && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onClose) onClose();
                      onOpenReportModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#ff791a] text-white text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    File Civic Report (+50 Pts)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TIERS & PRIVILEGES */}
          {/* ========================================================================= */}
          {activeTab === "tiers" && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400">
                The JanVani Citizen Recognition Framework categorizes residents into 5 statutory civic leadership tiers based on genuine contributions to municipal cleanliness, infrastructure reporting, and community auditing.
              </div>

              <div className="space-y-3">
                {Object.values(NAGRIK_TIERS).map((tier) => {
                  const isCurrent = currentTier.id === tier.id;
                  const isUnlocked = nagrikData.points >= tier.minPoints;

                  return (
                    <div
                      key={tier.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isCurrent
                          ? "bg-orange-500/[0.08] border-[#FF6A00] shadow-md ring-1 ring-[#FF6A00]/30"
                          : isUnlocked
                          ? "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10"
                          : "bg-slate-100/60 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 opacity-75"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${tier.badgeColor}`}>
                            {tier.badgeLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {tier.hindiName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#FF6A00]">
                            {tier.minPoints} {tier.maxPoints < 10000 ? `- ${tier.maxPoints}` : "+"} Points
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FF6A00] text-white text-[10px] font-black">
                              YOUR CURRENT POSITION
                            </span>
                          )}
                          {isUnlocked && !isCurrent && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">
                        {tier.description}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                        <div className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span>Exclusive Position Privileges</span>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          {tier.perks.map((perk, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: HOW TO EARN POINTS */}
          {/* ========================================================================= */}
          {activeTab === "earn" && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>JanVani automatically computes points for civic participation and problem solving.</span>
                <span className="font-bold text-[#FF6A00]">Fraud Prevention: Automated GPS & AI Deduplication Active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(POINT_RULES).map(([key, item]) => {
                  let Icon = FileCheck;
                  if (key === "UPLOAD_PROOF") Icon = Video;
                  if (key === "VOICE_SEVA_REPORT") Icon = Mic;
                  if (key === "UPVOTE_GRIEVANCE" || key === "RECEIVE_UPVOTE") Icon = ThumbsUp;
                  if (key === "CONFIRM_RESOLUTION") Icon = Award;

                  return (
                    <div
                      key={key}
                      className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 flex items-start gap-3 hover:border-orange-400/50 transition-all shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-black text-xs">
                            +{item.points} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {item.defaultDesc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Instant Action shortcut */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm">Have a civic issue in your ward right now?</div>
                  <div className="text-xs text-slate-300">File it with video evidence to immediately earn +80 Civic Points!</div>
                </div>
                {onOpenReportModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReportModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#FF6A00] text-white font-bold text-xs hover:bg-[#ff791a] shadow-md transition-all whitespace-nowrap"
                  >
                    File Grievance Now
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: POINTS ACTIVITY LEDGER */}
          {/* ========================================================================= */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>Recent Point Credits & Civic Transactions</span>
                <span>Audit Verified</span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
                {nagrikData.transactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {tx.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {tx.description}
                        </div>
                        {tx.grievanceToken && (
                          <span className="text-[10px] font-mono text-[#FF6A00]">
                            Token: #{tx.grievanceToken}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        +{tx.points} pts
                      </div>
                      <div className="text-[10px] text-slate-400">{tx.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-7 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Under State Department of Public Grievance Redressal (DPG), Madhya Pradesh</span>
          </div>
          {!isPage && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
          {isPage && onNavigateToFeed && (
            <button
              type="button"
              onClick={onNavigateToFeed}
              className="px-4 py-1.5 rounded-xl bg-[#FF6A00] text-white hover:bg-[#ff7d1f] font-bold transition-colors cursor-pointer"
            >
              Go to Grievance Feed →
            </button>
          )}
        </div>
      </div>
  );

  const certificateModal = certificateOpen && (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-2xl bg-amber-50 text-slate-900 border-4 border-amber-600/80 rounded-2xl shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setCertificateOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Level Switcher */}
        <div className="flex items-center gap-1.5 mb-3 bg-amber-200/60 p-1 rounded-xl w-fit">
          <span className="text-[10px] uppercase font-bold text-amber-900 px-2">Level:</span>
          <button
            type="button"
            onClick={() => setCertificateScope("nation")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              certificateScope === "nation"
                ? "bg-amber-600 text-white shadow"
                : "text-amber-900 hover:bg-amber-300/60"
            }`}
          >
            🇮🇳 National
          </button>
          <button
            type="button"
            onClick={() => setCertificateScope("state")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              certificateScope === "state"
                ? "bg-amber-600 text-white shadow"
                : "text-amber-900 hover:bg-amber-300/60"
            }`}
          >
            🏛️ State
          </button>
          <button
            type="button"
            onClick={() => setCertificateScope("district")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              certificateScope === "district"
                ? "bg-amber-600 text-white shadow"
                : "text-amber-900 hover:bg-amber-300/60"
            }`}
          >
            📍 District
          </button>
          <button
            type="button"
            onClick={() => setCertificateScope("ward")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              certificateScope === "ward"
                ? "bg-amber-600 text-white shadow"
                : "text-amber-900 hover:bg-amber-300/60"
            }`}
          >
            🏘️ Ward
          </button>
        </div>

        {/* Inner Gold Border Certificate Sheet */}
        <div className="border-2 border-dashed border-amber-700/60 p-5 sm:p-7 rounded-xl flex flex-col items-center text-center relative bg-gradient-to-b from-amber-100/50 via-amber-50 to-amber-100/50 shadow-inner">
          {/* Emblem */}
          <div className="w-14 h-14 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg mb-2">
            <Crown className="w-8 h-8" />
          </div>

          <div className="text-[10px] uppercase tracking-widest font-black text-amber-900">
            {certificateScope === "nation" && "GOVERNMENT OF INDIA • MINISTRY OF HOUSING & URBAN AFFAIRS"}
            {certificateScope === "state" && `GOVERNMENT OF ${stateName.toUpperCase()} • URBAN DEVELOPMENT & DPG`}
            {certificateScope === "district" && `DISTRICT ADMINISTRATION ${districtName.toUpperCase()} • JANVANI PORTAL`}
            {certificateScope === "ward" && "MUNICIPAL COUNCIL DHAR • WARD 14 CIVIC BODY"}
          </div>

          <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1 font-serif tracking-tight">
            {certificateScope === "nation" && "राष्ट्रीय नागरिक गौरव सम्मान पत्र"}
            {certificateScope === "state" && "राज्य नागरिक गौरव सम्मान पत्र"}
            {certificateScope === "district" && "जिला सर्वोत्तम नागरिक सम्मान पत्र"}
            {certificateScope === "ward" && "वार्ड नागरिक गौरव सम्मान पत्र"}
          </div>

          <div className="text-[11px] uppercase tracking-wider text-amber-800 font-bold mt-0.5">
            {certificateScope === "nation" && "ALL-INDIA CIVIC GUARDIANSHIP & EXCELLENCE AWARD"}
            {certificateScope === "state" && `STATE-LEVEL CIVIC GUARDIANSHIP COMMENDATION (${stateName})`}
            {certificateScope === "district" && `DISTRICT BEST NAGRIK MERIT OF HONOR (${districtName})`}
            {certificateScope === "ward" && `WARD LEVEL NEIGHBORHOOD CIVIC LEADERSHIP (${availableWards.find(w => w.id === selectedWardId)?.shortName || wardName})`}
          </div>

          <div className="w-24 h-0.5 bg-amber-600 my-3" />

          <p className="text-xs text-amber-950 italic">
            This prestigious civic commendation is proudly conferred upon:
          </p>

          <div className="text-2xl sm:text-3xl font-black text-slate-950 font-serif my-1.5 text-amber-950 underline decoration-amber-500/50 decoration-2">
            {currentUser?.name || "Praneet Dubey"}
          </div>

          <p className="text-xs text-slate-800 max-w-lg leading-relaxed">
            {certificateScope === "nation" && (
              <>
                In formal recognition of distinguished civic participation, active public hazard mitigation, and upholding governance transparency nationwide across the <span className="font-bold text-amber-900">Republic of India</span>.
              </>
            )}
            {certificateScope === "state" && (
              <>
                In formal recognition of exemplary civic duty, proactive municipal grievance resolution, and community leadership throughout the State of <span className="font-bold text-amber-900">{stateName}</span>.
              </>
            )}
            {certificateScope === "district" && (
              <>
                In formal recognition of standing as a distinguished civic champion across <span className="font-bold text-amber-900">{districtName} District, {stateName}</span> under the Janvani Civic Portal.
              </>
            )}
            {certificateScope === "ward" && (
              <>
                In formal recognition of tireless neighborhood guardianship and local civic problem resolution across <span className="font-bold text-amber-900">{wardName}</span>.
              </>
            )}
          </p>

          {/* Awarded Position & Standing Box */}
          <div className="my-3 px-4 py-2 rounded-2xl bg-amber-200/80 border-2 border-amber-500/80 shadow-inner flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-800" />
              <div className="text-left">
                <div className="text-[9px] uppercase font-bold text-amber-900">Official Position</div>
                <div className="text-sm font-black text-amber-950">
                  {currentTier.name} ({currentTier.hindiName})
                </div>
              </div>
            </div>

            <div className="pl-3 border-l border-amber-400 text-left">
              <div className="text-[9px] uppercase font-bold text-amber-900">
                {certificateScope === "nation" && "National Standing"}
                {certificateScope === "state" && "State Standing"}
                {certificateScope === "district" && "District Standing"}
                {certificateScope === "ward" && "Ward Standing"}
              </div>
              <div className="text-sm font-black text-amber-950">
                {certificateScope === "nation" && `Rank #${userRankSummary.nationalRank} (All-India)`}
                {certificateScope === "state" && `Rank #${userRankSummary.stateRank} (${stateName})`}
                {certificateScope === "district" && `Rank #${userRankSummary.districtRank} (${districtName})`}
                {certificateScope === "ward" && `Rank #${userRankSummary.wardRank} (${availableWards.find(w => w.id === selectedWardId)?.shortName || wardName.split("(")[0].trim() || "Ward"})`}
              </div>
            </div>

            <div className="pl-3 border-l border-amber-400 text-left">
              <div className="text-[9px] uppercase font-bold text-amber-900">Civic Points</div>
              <div className="text-sm font-black text-amber-950">{nagrikData.points} Karma pts</div>
            </div>
          </div>

          {/* Certificate Signatures and QR Code */}
          <div className="w-full grid grid-cols-3 gap-3 items-end mt-3 pt-3 border-t border-amber-700/30 text-[9px] sm:text-[10px] text-slate-700">
            <div className="text-center">
              <div className="font-serif italic font-bold text-amber-900 mb-0.5">
                {certificateScope === "nation" ? "Shri Rahul Kapoor, IAS" : "Shri Priyank Mishra, IAS"}
              </div>
              <div className="border-t border-slate-600 pt-0.5 font-semibold">
                {certificateScope === "nation" ? "Joint Secretary, MoHUA" : "District Magistrate & Collector"}
              </div>
              <div>{certificateScope === "nation" ? "Government of India" : `District ${districtName}, ${stateName}`}</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="p-1 bg-white rounded-lg border border-amber-400 shadow-sm">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
              <span className="text-[8px] font-mono text-slate-500 mt-0.5">
                JV-{certificateScope.toUpperCase()}-2026-0891
              </span>
            </div>

            <div className="text-center">
              <div className="font-serif italic font-bold text-amber-900 mb-0.5">Er. R. K. Shrivastava</div>
              <div className="border-t border-slate-600 pt-0.5 font-semibold">Director General & Commissioner</div>
              <div>Public Grievances Redressal</div>
            </div>
          </div>
        </div>

        {/* Print & Share Controls */}
        <div className="mt-3 flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-amber-900 font-bold">
            Digitally authenticated under Digital India Citizen Registry.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setCertificateOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isPage) {
    return (
      <div className="w-full px-2 sm:px-4 py-2">
        {content}
        {certificateModal}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {content}
      {certificateModal}
    </div>
  );
};
