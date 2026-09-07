import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Compass,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MapPin,
  Clock,
  Building2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Film,
  Camera,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Send,
  SlidersHorizontal,
  Check,
  Disc3,
  Copy,
  UserCheck,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Flame as FireIcon,
  Maximize2,
  Minimize2,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Grievance, CivicCategory } from "../types";
import { Translations } from "../data/translations";
import { handleCivicImageError } from "../utils/imageHelper";
import { Trash2 } from "lucide-react";

interface CivicReelsPageProps {
  grievances: Grievance[];
  onUpvoteGrievance: (id: string) => void;
  onTrackGrievance: (grievance: Grievance) => void;
  onOpenDeleteModal?: (grievance: Grievance, initialMode?: "all" | "video_only") => void;
  isAdmin?: boolean;
  t: Translations;
  initialGrievanceId?: string;
  onNavigateToFeed?: () => void;
  currentDistrict?: string;
}

export const CivicReelsPage: React.FC<CivicReelsPageProps> = ({
  grievances,
  onUpvoteGrievance,
  onTrackGrievance,
  onOpenDeleteModal,
  isAdmin = false,
  t,
  initialGrievanceId,
  onNavigateToFeed,
  currentDistrict = "Dhar",
}) => {
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<"all" | "video_only">("all");
  const [activeDistrict, setActiveDistrict] = useState<string>(currentDistrict);

  // Filtered grievances list: EXCLUSIVELY visual media posts (photos or videos)
  const filteredGrievances = React.useMemo(() => {
    return grievances.filter((g) => {
      // Must contain real visual media (photo or video)
      const hasPhoto = Boolean(
        (g.photoUrl && g.photoUrl.trim() !== "" && !g.photoUrl.includes("placeholder")) ||
        (g.imageUrl && g.imageUrl.trim() !== "" && !g.imageUrl.includes("placeholder"))
      );
      const hasVideo = Boolean(g.videoUrl && g.videoUrl.trim() !== "");
      const hasVisualMedia = hasPhoto || hasVideo;

      // Exclude text-only posts, empty cards, or broken media
      if (!hasVisualMedia) return false;

      const matchCat = selectedCategory === "all" || g.category === selectedCategory;
      const matchVideo = filterMode === "all" || hasVideo;
      return matchCat && matchVideo;
    });
  }, [grievances, selectedCategory, filterMode]);

  // Active reel index
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync initial grievance if provided
  useEffect(() => {
    if (initialGrievanceId && filteredGrievances.length > 0) {
      const idx = filteredGrievances.findIndex((g) => g.id === initialGrievanceId);
      if (idx !== -1) setActiveIndex(idx);
    }
  }, [initialGrievanceId, filteredGrievances]);

  // Keep index within bounds
  useEffect(() => {
    if (activeIndex >= filteredGrievances.length && filteredGrievances.length > 0) {
      setActiveIndex(filteredGrievances.length - 1);
    }
  }, [filteredGrievances.length, activeIndex]);

  // Global Audio Mute state across reels (Instagram style)
  const [isMuted, setIsMuted] = useState(true);

  // Mobile side details sheet visibility
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  // Copied token notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comments / Updates state
  const [customCommentText, setCustomCommentText] = useState("");
  const [commentsList, setCommentsList] = useState<{ [id: string]: { user: string; text: string; time: string; verified?: boolean }[] }>({
    g1: [
      { user: "Sunil Verma (Ward 27 Rep)", text: "Pothole depth verified. PWD crew scheduled for emergency cold-mix asphalt patching tomorrow morning.", time: "2h ago", verified: true },
      { user: "Anita Sharma (Resident)", text: "Very dangerous for two-wheelers during night hours. Thank you for escalating to collectorate!", time: "4h ago" },
    ],
    g2: [
      { user: "Health Inspector (Swachh Cell)", text: "Swachh Bharat waste compactor vehicle dispatched to clear community bin.", time: "1h ago", verified: true },
    ],
  });

  // Double-tap heart animation trigger state: { id, key }
  const [heartBurst, setHeartBurst] = useState<{ id: string; key: number } | null>(null);

  // Sound chime synthesizer for support
  const playSupportChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.12, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.31);
      });
    } catch {
      // Audio protected
    }
  }, []);

  const triggerSupport = (grievanceId: string) => {
    onUpvoteGrievance(grievanceId);
    playSupportChime();
    setHeartBurst({ id: grievanceId, key: Date.now() });

    // Haptic confetti burst
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.65 },
      colors: ["#FF6A00", "#FF8A00", "#FF3B30", "#20C997", "#FFD700"],
      disableForReducedMotion: true,
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Scroll container ref
  const containerRef = useRef<HTMLDivElement>(null);

  // Navigate up/down reels
  const scrollToReel = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= filteredGrievances.length) return;
    setActiveIndex(newIndex);
    const container = containerRef.current;
    if (container) {
      const reelElements = container.querySelectorAll("[data-reel-item]");
      const targetElement = reelElements[newIndex] as HTMLElement;
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Keyboard navigation (Arrow keys & J/K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowDown", "j", "J"].includes(e.key)) {
        e.preventDefault();
        scrollToReel(activeIndex + 1);
      } else if (["ArrowUp", "k", "K"].includes(e.key)) {
        e.preventDefault();
        scrollToReel(activeIndex - 1);
      } else if (e.key === "m" || e.key === "M") {
        setIsMuted((prev) => !prev);
      } else if (e.key === "l" || e.key === "L" || e.key === "s" || e.key === "S") {
        const current = filteredGrievances[activeIndex];
        if (current) triggerSupport(current.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, filteredGrievances]);

  // Observe scroll position to update activeIndex
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const scrollPosition = container.scrollTop;
    const itemHeight = container.clientHeight;
    if (itemHeight > 0) {
      const newIndex = Math.round(scrollPosition / itemHeight);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < filteredGrievances.length) {
        setActiveIndex(newIndex);
      }
    }
  };

  // Share handler
  const handleShare = async (grievance: Grievance) => {
    const shareData = {
      title: `JanVani Civic Report: ${grievance.title}`,
      text: `[Token: ${grievance.token}] Civic issue reported in ${grievance.ward}, ${grievance.district}. Support this grievance to expedite resolution!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast("Reel shared successfully!");
      } catch {
        // user cancelled or failed
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${window.location.href}`);
      showToast(`Token ${grievance.token} copied to clipboard!`);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    showToast(`Token ${token} copied!`);
  };

  const handleAddComment = (grievanceId: string) => {
    if (!customCommentText.trim()) return;
    const newEntry = {
      user: "You (Citizen)",
      text: customCommentText.trim(),
      time: "Just now",
    };
    setCommentsList((prev) => ({
      ...prev,
      [grievanceId]: [...(prev[grievanceId] || []), newEntry],
    }));
    setCustomCommentText("");
    showToast("Citizen observation posted!");
  };

  const activeGrievance = filteredGrievances[activeIndex];

  return (
    <div className="relative w-full h-[calc(100vh-68px)] lg:h-[calc(100vh-80px)] bg-slate-100 dark:bg-[#09090b] text-slate-900 dark:text-white flex flex-col md:flex-row overflow-hidden select-none transition-colors">
      {/* Toast popup */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white dark:bg-slate-900/95 text-slate-900 dark:text-white border border-slate-200 dark:border-white/20 text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT COLUMN: CATEGORIES & FEED FILTER SIDEBAR (DESKTOP) */}
      {/* ========================================================================= */}
      <aside className="hidden xl:flex flex-col justify-between w-64 p-4 bg-white dark:bg-[#111114] border-r border-slate-200 dark:border-white/10 shrink-0 z-20 transition-colors">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FF8A00] text-white flex items-center justify-center shadow-lg shadow-[#FF6A00]/25">
                <Film className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Civic Reels</h2>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FF6A00]/15 dark:bg-[#FF6A00]/20 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/30 dark:border-[#FF6A00]/40">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Field proof reels uploaded by citizens of {activeDistrict}.
            </p>
          </div>

          {/* Quick Counter */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
            <div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Active Reel</div>
              <div className="text-base font-black text-[#FF6A00]">
                {filteredGrievances.length > 0 ? activeIndex + 1 : 0}
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal"> / {filteredGrievances.length}</span>
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Video Reports</div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {grievances.filter((g) => !!g.videoUrl).length}
              </div>
            </div>
          </div>

          {/* Filter by Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Category Filter</span>
            </label>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setActiveIndex(0);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-[#FF6A00] text-white font-bold shadow-md shadow-[#FF6A00]/25"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 dark:hover:bg-white/[0.08]"
                }`}
              >
                <span>✨ All Reports Reel</span>
                <span className="text-[10px] opacity-80">{grievances.length}</span>
              </button>

              {[
                { name: "Roads & Potholes", icon: "🛣️" },
                { name: "Garbage & Sanitation", icon: "🗑️" },
                { name: "Drinking Water & Pipeline Leakage", icon: "💧" },
                { name: "Electricity Hazard & Wiring", icon: "⚡" },
                { name: "Sewage & Drain Overflow", icon: "🌊" },
                { name: "Streetlight Breakdown", icon: "💡" },
              ].map((cat) => {
                const count = grievances.filter((g) => g.category === cat.name).length;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setActiveIndex(0);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      selectedCategory === cat.name
                        ? "bg-[#FF6A00] text-white font-bold shadow-md shadow-[#FF6A00]/25"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 dark:hover:bg-white/[0.08]"
                    }`}
                  >
                    <span className="truncate">{cat.icon} {cat.name}</span>
                    <span className="text-[10px] opacity-80">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video Only Toggle */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-[#FF8A00]" />
              <div className="text-[11px] font-semibold text-slate-800 dark:text-white">Video Proof Only</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFilterMode(filterMode === "video_only" ? "all" : "video_only");
                setActiveIndex(0);
              }}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                filterMode === "video_only" ? "bg-[#FF6A00]" : "bg-slate-300 dark:bg-white/20"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  filterMode === "video_only" ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Navigation Shortcuts */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
            <span>Scroll with mouse / keys:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollToReel(activeIndex - 1)}
                disabled={activeIndex <= 0}
                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white disabled:opacity-30 cursor-pointer"
                title="Previous Reel"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToReel(activeIndex + 1)}
                disabled={activeIndex >= filteredGrievances.length - 1}
                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white disabled:opacity-30 cursor-pointer"
                title="Next Reel"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
            [↑/↓] Scroll • [Space] Pause • [M] Mute • [L] Support
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. CENTER STAGE: CLEAN, UNOBSTRUCTED 9:16 VIDEO REEL */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col items-center justify-center relative h-full overflow-hidden bg-slate-200/90 dark:bg-black/60 transition-colors">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-tight">Civic Reels</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FF6A00] text-white">
              {activeIndex + 1}/{filteredGrievances.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 active:scale-95"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#FF8A00]" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileDetailsOpen(true)}
              className="px-2.5 py-1 rounded-full bg-[#FF6A00] text-white text-xs font-bold flex items-center gap-1 shadow-md"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
          </div>
        </div>

        {/* Snap Scrolling Container for Media Reels */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden scrollbar-none flex flex-col items-center"
        >
          {filteredGrievances.length > 0 ? (
            filteredGrievances.map((grievance, index) => {
              const isActive = index === activeIndex;
              return (
                <ReelMediaCanvas
                  key={grievance.id}
                  grievance={grievance}
                  isActive={isActive}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(!isMuted)}
                  onSupport={() => triggerSupport(grievance.id)}
                  onOpenDetailsMobile={() => setMobileDetailsOpen(true)}
                  heartBurstActive={heartBurst?.id === grievance.id ? heartBurst.key : null}
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Film className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Reels in this Category</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                No active video or photographic field reports matched your current filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setFilterMode("all");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#FF6A00] text-white text-xs font-bold cursor-pointer shadow-md"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. RIGHT COLUMN: DEDICATED GRIEVANCE DETAILS & ACTION SIDE PANEL (DESKTOP) */}
      {/* ========================================================================= */}
      {activeGrievance && (
        <aside className="hidden lg:flex flex-col justify-between w-96 xl:w-[420px] bg-white dark:bg-[#121216] border-l border-slate-200 dark:border-white/10 shrink-0 z-20 h-full overflow-hidden shadow-xl transition-colors">
          {/* Scrollable details body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {/* Top Bar: Reporter Identity & Verified Status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF6A00] to-emerald-500 p-[2px] shrink-0">
                  <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    {activeGrievance.filedByName ? activeGrievance.filedByName.charAt(0) : "C"}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {activeGrievance.filedByName || "Citizen"}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" title="e-Aadhaar Verified Resident" />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <span>{activeGrievance.dateFiled || "Active Report"}</span>
                    <span>•</span>
                    <span className="text-orange-600 dark:text-[#FF8A00] font-semibold">{activeGrievance.ward}</span>
                  </div>
                </div>
              </div>

              {/* Token Copy Badge */}
              <button
                type="button"
                onClick={() => copyToken(activeGrievance.token)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer group"
                title="Click to copy official tracking token"
              >
                <span className="text-orange-600 dark:text-[#FF8A00]">#{activeGrievance.token.split("-").slice(-2).join("-")}</span>
                <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Status & Priority Badge Strip */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${
                  activeGrievance.status === "Resolved & Verified"
                    ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40"
                    : activeGrievance.status === "Work In Progress"
                    ? "bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40"
                    : "bg-orange-50 dark:bg-[#FF6A00]/20 text-orange-700 dark:text-[#FF8A00] border-orange-300 dark:border-[#FF6A00]/40"
                }`}
              >
                {activeGrievance.status}
              </span>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-white/[0.04] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-white/10 flex items-center gap-1">
                <FireIcon className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Severity {activeGrievance.severityScore}/10</span>
              </span>

              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>SLA: {activeGrievance.slaRemainingHours ?? activeGrievance.targetSlaHours}h left</span>
              </span>
            </div>

            {/* Grievance Title & Full Description */}
            <div className="space-y-2">
              <h1 className="text-base font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                {activeGrievance.title}
              </h1>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {activeGrievance.description}
              </div>
            </div>

            {/* Administrative Hierarchy & Location Grid */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Jurisdiction & Department
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                {/* Department */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-[#FF8A00] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Assigned Department</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{activeGrievance.department}</div>
                  </div>
                </div>

                {/* Location */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Location & Locality</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {activeGrievance.locality || activeGrievance.ward}, {activeGrievance.district}, {activeGrievance.state}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar: Support & Track */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Primary Upvote/Support Button */}
              <button
                type="button"
                onClick={() => triggerSupport(activeGrievance.id)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md cursor-pointer ${
                  activeGrievance.hasUpvoted
                    ? "bg-gradient-to-r from-red-600 to-[#FF6A00] text-white ring-2 ring-red-400/40 shadow-red-500/20"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-800 dark:text-white border border-slate-200 dark:border-white/15 hover:border-[#FF6A00]/50"
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform ${
                    activeGrievance.hasUpvoted ? "fill-white text-white scale-110" : "text-red-500 dark:text-red-400"
                  }`}
                />
                <span>{activeGrievance.hasUpvoted ? "Supported" : "Support"}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-black/40 text-slate-800 dark:text-white text-[10px] font-mono border border-slate-200 dark:border-transparent">
                  {activeGrievance.upvotes}
                </span>
              </button>

              {/* Track Official SLA Timeline */}
              <button
                type="button"
                onClick={() => onTrackGrievance(activeGrievance)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Track SLA</span>
              </button>
            </div>

            {/* Share Quick Button */}
            <button
              type="button"
              onClick={() => handleShare(activeGrievance)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Share Grievance Report</span>
            </button>

            {/* Admin Delete Grievance / Video Button */}
            {isAdmin && onOpenDeleteModal && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-300 flex items-center gap-1">
                  <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                  <span>Admin Authority Controls</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeGrievance.videoUrl && (
                    <button
                      type="button"
                      onClick={() => onOpenDeleteModal(activeGrievance, "video_only")}
                      className="py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Delete Video Only
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenDeleteModal(activeGrievance, "all")}
                    className={`py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-all cursor-pointer ${
                      !activeGrievance.videoUrl ? "col-span-2" : ""
                    }`}
                  >
                    Delete Entire Complaint
                  </button>
                </div>
              </div>
            )}

            {/* Administrative Progress Timeline & Comments Stream */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>Citizen Updates & Audit Trail</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {(commentsList[activeGrievance.id]?.length || 0) + activeGrievance.timeline.length} updates
                </span>
              </div>

              {/* Timeline checkpoints */}
              <div className="space-y-2 pl-3 border-l-2 border-[#FF6A00]/40 ml-1.5">
                {activeGrievance.timeline.slice(0, 3).map((event, idx) => (
                  <div key={idx} className="relative pl-3 text-xs">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#FF6A00] ring-4 ring-white dark:ring-[#121216]" />
                    <div className="font-bold text-slate-900 dark:text-white text-[11px]">{event.title}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{event.description}</div>
                  </div>
                ))}
              </div>

              {/* Community Comments */}
              <div className="space-y-2">
                {(commentsList[activeGrievance.id] || []).map((comm, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-xs">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        {comm.user}
                        {comm.verified && <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />}
                      </span>
                      <span className="text-slate-500 font-mono">{comm.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{comm.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Fixed Comment Input */}
          <div className="p-3 bg-slate-50 dark:bg-[#0d0d10] border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={customCommentText}
              onChange={(e) => setCustomCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddComment(activeGrievance.id);
              }}
              placeholder="Post citizen update / observation..."
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00]"
            />
            <button
              type="button"
              onClick={() => handleAddComment(activeGrievance.id)}
              className="p-2 rounded-xl bg-[#FF6A00] hover:bg-[#ff791a] text-white active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 4. MOBILE SLIDE-OVER SIDE/BOTTOM DETAILS SHEET */}
      {/* ========================================================================= */}
      {mobileDetailsOpen && activeGrievance && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full bg-white dark:bg-[#16161a] border-t border-slate-200 dark:border-white/15 rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 text-slate-900 dark:text-white">
            {/* Sheet Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Grievance Details</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-white/10 text-orange-700 dark:text-[#FF8A00]">
                  #{activeGrievance.token.split("-").slice(-2).join("-")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDetailsOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title & Reporter */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{activeGrievance.filedByName}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{activeGrievance.ward}</span>
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{activeGrievance.title}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{activeGrievance.description}</p>
              </div>

              {/* Status and Department */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{activeGrievance.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Target SLA:</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                    {activeGrievance.slaRemainingHours ?? activeGrievance.targetSlaHours}h remaining
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerSupport(activeGrievance.id);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#FF6A00] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Support ({activeGrievance.upvotes})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileDetailsOpen(false);
                    onTrackGrievance(activeGrievance);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-cyan-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Compass className="w-4 h-4" />
                  <span>Track Timeline</span>
                </button>
              </div>

              {/* Admin Quick Purge in Mobile Sheet */}
              {isAdmin && onOpenDeleteModal && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-300 flex items-center gap-1">
                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                    <span>Admin Authority Controls</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {activeGrievance.videoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileDetailsOpen(false);
                          onOpenDeleteModal(activeGrievance, "video_only");
                        }}
                        className="py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                      >
                        Delete Video
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileDetailsOpen(false);
                        onOpenDeleteModal(activeGrievance, "all");
                      }}
                      className={`py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold ${
                        !activeGrievance.videoUrl ? "col-span-2" : ""
                      }`}
                    >
                      Delete Grievance
                    </button>
                  </div>
                </div>
              )}

              {/* Citizen Comments & Progress */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Updates & Comments</div>
                <div className="space-y-1.5">
                  {(commentsList[activeGrievance.id] || []).map((comm, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{comm.user}: </span>
                      <span className="text-slate-600 dark:text-slate-300">{comm.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Comment Input */}
            <div className="p-3 bg-slate-50 dark:bg-[#111114] border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={customCommentText}
                onChange={(e) => setCustomCommentText(e.target.value)}
                placeholder="Add citizen observation..."
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.08] border border-slate-300 dark:border-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6A00]"
              />
              <button
                type="button"
                onClick={() => handleAddComment(activeGrievance.id)}
                className="p-2 rounded-xl bg-[#FF6A00] hover:bg-[#ff791a] text-white active:scale-95 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Sub-Component: Clean, Pristine 9:16 Reel Media Player Canvas
// =========================================================================
interface ReelMediaCanvasProps {
  grievance: Grievance;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onSupport: () => void;
  onOpenDetailsMobile: () => void;
  heartBurstActive: number | null;
}

const ReelMediaCanvas: React.FC<ReelMediaCanvasProps> = ({
  grievance,
  isActive,
  isMuted,
  onToggleMute,
  onSupport,
  onOpenDetailsMobile,
  heartBurstActive,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaView, setMediaView] = useState<"video" | "photo" | "resolved">("video");

  // Double tap detector on media
  const lastTapRef = useRef<number>(0);
  const [localHeartBurst, setLocalHeartBurst] = useState(false);

  // Play / Pause control based on isActive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && mediaView === "video") {
      video.currentTime = 0;
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, mediaView]);

  // Video progress updater
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  // Single Tap to Play/Pause & Double Tap to Like
  const handleMediaClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      onSupport();
      setLocalHeartBurst(true);
      setTimeout(() => setLocalHeartBurst(false), 900);
    } else {
      // Single tap toggle play/pause
      if (mediaView === "video" && videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 600);
      }
    }
    lastTapRef.current = now;
  };

  const hasVideo = !!grievance.videoUrl;
  const hasResolvedPhoto = !!(grievance.resolvedImageUrl || grievance.resolutionPhotoUrl);

  return (
    <div
      data-reel-item
      className="w-full h-full snap-start snap-always shrink-0 flex items-center justify-center p-0 sm:py-3"
    >
      {/* 9:16 Ratio Reel Canvas (Uncluttered, Crystal-Clear View of the Civic Issue) */}
      <div className="relative w-full sm:max-w-[420px] h-full sm:h-[94vh] sm:rounded-3xl overflow-hidden bg-black shadow-2xl border-0 sm:border border-slate-300 dark:border-white/10 sm:ring-1 sm:ring-black/5 flex flex-col justify-between">
        {/* 1. MEDIA LAYER */}
        <div
          onClick={handleMediaClick}
          className="absolute inset-0 z-0 bg-black cursor-pointer overflow-hidden flex items-center justify-center"
        >
          {hasVideo && mediaView === "video" ? (
            <video
              ref={videoRef}
              src={grievance.videoUrl}
              playsInline
              loop
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full object-cover"
            />
          ) : mediaView === "resolved" && hasResolvedPhoto ? (
            <img
              src={grievance.resolutionPhotoUrl || grievance.resolvedImageUrl}
              alt="Resolved remediation"
              className="w-full h-full object-cover"
              onError={handleCivicImageError}
            />
          ) : (
            <img
              src={grievance.photoUrl || grievance.imageUrl}
              alt={grievance.title}
              className="w-full h-full object-cover scale-105"
              onError={handleCivicImageError}
            />
          )}

          {/* Minimal Vignettes for subtle contrast */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* Play/Pause Pulse Icon */}
          {showPlayIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white ring-2 ring-white/30">
                {isPlaying ? <Play className="w-8 h-8 ml-1" /> : <Pause className="w-8 h-8" />}
              </div>
            </div>
          )}

          {/* Double-tap animated heart explosion */}
          {(localHeartBurst || heartBurstActive) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in zoom-in-50 fade-out-0 duration-700">
              <Heart className="w-28 h-28 text-red-500 fill-red-500 drop-shadow-[0_0_25px_rgba(255,59,48,0.8)] scale-125 animate-pulse" />
            </div>
          )}
        </div>

        {/* 2. TOP FLOATING BAR: STATUS PILL, MEDIA TOGGLE & MUTE */}
        <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between pointer-events-auto">
          {/* Subtle Status Pill */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border ${
                grievance.status === "Resolved & Verified"
                  ? "bg-emerald-500/80 text-white border-emerald-400"
                  : grievance.status === "Work In Progress"
                  ? "bg-amber-500/80 text-white border-amber-400"
                  : "bg-[#FF6A00]/80 text-white border-orange-400"
              }`}
            >
              {grievance.status}
            </span>

            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-black/50 backdrop-blur-md text-amber-300 border border-white/20 flex items-center gap-1">
              <FireIcon className="w-3 h-3 text-[#FF6A00]" />
              <span>Sev {grievance.severityScore}/10</span>
            </span>
          </div>

          {/* Media Switcher & Mute */}
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/20">
            {hasVideo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaView("video");
                }}
                className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  mediaView === "video" ? "bg-[#FF6A00] text-white" : "text-white/70 hover:text-white"
                }`}
                title="Watch Field Video"
              >
                <Film className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMediaView("photo");
              }}
              className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
                mediaView === "photo" ? "bg-[#FF6A00] text-white" : "text-white/70 hover:text-white"
              }`}
              title="View Inspection Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {hasResolvedPhoto && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaView("resolved");
                }}
                className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  mediaView === "resolved" ? "bg-emerald-600 text-white" : "text-emerald-400 hover:text-emerald-300"
                }`}
                title="View Resolved After-Proof"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mute Button */}
            {hasVideo && mediaView === "video" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute();
                }}
                className="p-1.5 rounded-full text-white/90 hover:text-white cursor-pointer"
                title={isMuted ? "Unmute sound" : "Mute sound"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#FF8A00]" />}
              </button>
            )}
          </div>
        </div>

        {/* 3. MINIMAL FLOATING ACTION RAIL (HEART / SUPPORT & DETAILS ON MOBILE) */}
        <div className="absolute right-3 bottom-8 z-20 flex flex-col items-center gap-3.5 pointer-events-auto">
          {/* Support Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSupport();
            }}
            className={`w-11 h-11 rounded-full flex flex-col items-center justify-center backdrop-blur-xl border transition-all active:scale-75 shadow-xl cursor-pointer ${
              grievance.hasUpvoted
                ? "bg-gradient-to-tr from-red-600 to-[#FF6A00] text-white border-red-400 shadow-red-500/40 ring-4 ring-red-500/20"
                : "bg-black/60 text-white border-white/20 hover:bg-black/80 hover:scale-110"
            }`}
            aria-label="Support this Grievance"
          >
            <Heart
              className={`w-5 h-5 transition-transform ${
                grievance.hasUpvoted ? "fill-white text-white scale-110" : "text-white"
              }`}
            />
          </button>

          {/* Rotating Audio/Reel Disc */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-900 via-black to-slate-800 border-2 border-white/30 p-1 flex items-center justify-center shadow-lg animate-spin-slow">
            <div className="w-full h-full rounded-full bg-[#FF6A00] flex items-center justify-center">
              <Disc3 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* 4. MINIMAL BOTTOM STRIP (Mobile: Quick Title preview with 1-tap "Open Details") */}
        <div className="lg:hidden relative z-10 p-3 pb-4 pointer-events-auto">
          <button
            type="button"
            onClick={onOpenDetailsMobile}
            className="w-full text-left p-2.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 hover:bg-black/90 transition-all flex items-center justify-between"
          >
            <div className="min-w-0 pr-2">
              <div className="text-[10px] font-bold text-[#FF8A00] flex items-center gap-1">
                <span>#{grievance.token.split("-").slice(-2).join("-")}</span>
                <span>•</span>
                <span className="text-white truncate">{grievance.filedByName}</span>
              </div>
              <div className="text-xs font-bold text-white truncate mt-0.5">
                {grievance.title}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FF6A00] text-white flex items-center gap-1 shrink-0">
              <span>View Details</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </button>
        </div>

        {/* 5. THIN VIDEO SCRUBBER PROGRESS BAR */}
        {hasVideo && mediaView === "video" && (
          <div className="relative z-20 w-full h-1 bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
