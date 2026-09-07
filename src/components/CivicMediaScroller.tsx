import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ThumbsUp,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MapPin,
  Clock,
  Building2,
  Eye,
  Share2,
  Sparkles,
  X,
  Layers,
  MessageSquare,
  AlertTriangle,
  Flame,
  Shield,
  Maximize2,
  Minimize2,
  Check,
  Film,
  Camera,
  RotateCcw,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Grievance, CivicCategory } from "../types";
import { Translations } from "../data/translations";
import { handleCivicImageError } from "../utils/imageHelper";

interface CivicMediaScrollerProps {
  grievances: Grievance[];
  onUpvote: (id: string) => void;
  onTrack: (grievance: Grievance) => void;
  onOpenDeleteModal?: (grievance: Grievance, initialMode?: "all" | "video_only") => void;
  isAdmin?: boolean;
  t: Translations;
  initialIndex?: number;
  mode?: "inline" | "modal";
  onClose?: () => void;
}

export const CivicMediaScroller: React.FC<CivicMediaScrollerProps> = ({
  grievances,
  onUpvote,
  onTrack,
  onOpenDeleteModal,
  isAdmin = false,
  t,
  initialIndex = 0,
  mode = "inline",
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(0, initialIndex), Math.max(0, grievances.length - 1))
  );
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showDescriptionFull, setShowDescriptionFull] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [mediaPreference, setMediaPreference] = useState<"video" | "photo" | "resolved">("video");
  const [supportAnim, setSupportAnim] = useState<string | null>(null);

  // Video refs & state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);

  // Touch gesture handling
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const wheelLock = useRef(false);

  const currentGrievance: Grievance | undefined = grievances[currentIndex];

  // Sound chime synthesizer on support
  const playSupportChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.14, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.33);
      });
    } catch {
      // Audio playback silently guarded
    }
  }, []);

  // Sync preference whenever current grievance changes
  useEffect(() => {
    setShowDescriptionFull(false);
    setCommentsOpen(false);
    setVideoError(false);
    setVideoProgress(0);
    if (currentGrievance?.videoUrl) {
      setMediaPreference("video");
      setIsPlaying(true);
    } else {
      setMediaPreference("photo");
    }
  }, [currentIndex, currentGrievance?.id, currentGrievance?.videoUrl]);

  // Video playback controller
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentGrievance?.videoUrl || mediaPreference !== "video") return;

    video.muted = isMuted;

    if (isPlaying) {
      video.play().catch(() => {
        // Autoplay may be restricted by browser until user interaction
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [isPlaying, isMuted, currentIndex, mediaPreference, currentGrievance?.videoUrl]);

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (currentIndex < grievances.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, grievances.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Wheel listener for smooth mouse scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelLock.current) return;
    if (Math.abs(e.deltaY) > 30) {
      wheelLock.current = true;
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      setTimeout(() => {
        wheelLock.current = false;
      }, 500);
    }
  };

  // Touch listener for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;
    const diff = touchStartY.current - touchEndY.current;
    const threshold = 50; // min swipe px
    if (diff > threshold) {
      // Swiped UP -> Go to NEXT
      goToNext();
    } else if (diff < -threshold) {
      // Swiped DOWN -> Go to PREV
      goToPrev();
    }
    touchStartY.current = null;
    touchEndY.current = null;
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === " " && currentGrievance?.videoUrl && mediaPreference === "video") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "m") {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      } else if (e.key === "s" || e.key === "S") {
        if (currentGrievance && !currentGrievance.hasUpvoted) {
          handleSupportClick();
        }
      } else if (e.key === "Escape" && mode === "modal" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, currentGrievance, mediaPreference, mode, onClose]);

  // Support Button Action
  const handleSupportClick = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (!currentGrievance) return;
    if (currentGrievance.hasUpvoted) return;

    // Trigger celebration chime
    playSupportChime();

    // Trigger confetti explosion
    let originX = 0.85;
    let originY = 0.65;
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      originX = (rect.left + rect.width / 2) / window.innerWidth;
      originY = (rect.top + rect.height / 2) / window.innerHeight;
    }

    confetti({
      particleCount: 65,
      spread: 70,
      origin: { x: originX, y: originY },
      colors: ["#FF6A00", "#FF8A00", "#20C997", "#3B82F6", "#F59E0B", "#FFFFFF"],
      zIndex: 99999,
    });

    // Visual animated text feedback
    setSupportAnim(currentGrievance.id);
    setTimeout(() => setSupportAnim(null), 1800);

    // Call upvote handler
    onUpvote(currentGrievance.id);
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
    setShowPlayPauseIcon(true);
    setTimeout(() => setShowPlayPauseIcon(false), 700);
  };

  // Share report
  const handleShare = async () => {
    if (!currentGrievance) return;
    const textToCopy = `Civic Grievance #${currentGrievance.token}: "${currentGrievance.title}" in ${currentGrievance.locality}, ${currentGrievance.district}. Track & support on JanVani!`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopiedToken(currentGrievance.token);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch {
      setCopiedToken(currentGrievance.token);
      setTimeout(() => setCopiedToken(null), 2500);
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes("Road") || category.includes("Pothole")) return "🛣️";
    if (category.includes("Garbage") || category.includes("Sanitation")) return "🗑️";
    if (category.includes("Water") || category.includes("Pipeline")) return "💧";
    if (category.includes("Electricity") || category.includes("Wiring")) return "⚡";
    if (category.includes("Sewage") || category.includes("Drain")) return "🌊";
    if (category.includes("Streetlight")) return "💡";
    if (category.includes("Health") || category.includes("Fogging")) return "🏥";
    return "📍";
  };

  if (!currentGrievance) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#303030] p-8 text-center text-slate-600 dark:text-[#A8A8A8] border border-slate-200 dark:border-white/[0.08]">
        No reports available to scroll.
      </div>
    );
  }

  const isVideoAvailable = !!currentGrievance.videoUrl && !videoError;
  const isResolvedPhotoAvailable = !!currentGrievance.resolvedImageUrl;

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative select-none ${
        mode === "modal"
          ? "fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 overflow-hidden"
          : "w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800"
      }`}
    >
      {/* Background Ambient Blur of Current Media */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 blur-3xl scale-125">
        <img
          src={currentGrievance.imageUrl}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Main Reels Card Container */}
      <div
        className={`relative w-full overflow-hidden flex flex-col justify-between bg-[#0b0f19] ${
          mode === "modal"
            ? "h-full sm:h-[94vh] sm:max-w-[460px] sm:rounded-3xl border border-white/10 shadow-2xl"
            : "h-[80vh] sm:h-[680px] max-w-full"
        }`}
      >
        {/* ========================================================= */}
        {/* TOP STATUS & CONTROLS HEADER */}
        {/* ========================================================= */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3.5 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2">
          {/* Left: Category & Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-white border border-white/20 truncate shadow-sm">
              <span>{getCategoryIcon(currentGrievance.category)}</span>
              <span className="truncate">{currentGrievance.category}</span>
            </span>

            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-black/50 backdrop-blur-md text-slate-300 border border-white/10 shrink-0">
              {currentIndex + 1} / {grievances.length}
            </span>
          </div>

          {/* Right: Media Switcher & Sound / Close Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle Video / Photo if video is present */}
            {isVideoAvailable && (
              <div className="flex items-center bg-black/60 backdrop-blur-md rounded-xl p-0.5 border border-white/15 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMediaPreference("video")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    mediaPreference === "video"
                      ? "bg-[#FF6A00] text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaPreference("photo")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    mediaPreference === "photo"
                      ? "bg-[#FF6A00] text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>Photo</span>
                </button>
              </div>
            )}

            {/* If Resolved Photo is available */}
            {isResolvedPhotoAvailable && (
              <button
                type="button"
                onClick={() =>
                  setMediaPreference((prev) => (prev === "resolved" ? "photo" : "resolved"))
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold backdrop-blur-md transition-all border cursor-pointer ${
                  mediaPreference === "resolved"
                    ? "bg-emerald-500 text-white border-emerald-400"
                    : "bg-black/50 text-emerald-300 border-emerald-500/40 hover:bg-emerald-950/60"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>{mediaPreference === "resolved" ? "Before View" : "Resolved View"}</span>
              </button>
            )}

            {/* Mute Toggle (When Video is playing) */}
            {isVideoAvailable && mediaPreference === "video" && (
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                title={isMuted ? "Unmute Audio (M)" : "Mute Audio (M)"}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-[#20C997]" />}
              </button>
            )}

            {/* Close button if in modal mode */}
            {mode === "modal" && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CENTER STAGE: VIDEO OR PHOTO VIEWER */}
        {/* ========================================================= */}
        <div
          onClick={isVideoAvailable && mediaPreference === "video" ? togglePlayPause : undefined}
          className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black cursor-pointer"
        >
          {isVideoAvailable && mediaPreference === "video" ? (
            <>
              <video
                ref={videoRef}
                src={currentGrievance.videoUrl}
                poster={currentGrievance.imageUrl}
                loop
                playsInline
                muted={isMuted}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setVideoProgress(videoRef.current.currentTime);
                    setVideoDuration(videoRef.current.duration || 0);
                  }
                }}
                onError={() => {
                  console.warn("Video failed to play, falling back to photo");
                  setVideoError(true);
                  setMediaPreference("photo");
                }}
                className="w-full h-full object-cover sm:object-contain"
              />

              {/* Play / Pause Animated Overlay Badge on Click */}
              {showPlayPauseIcon && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-200">
                  <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-2xl">
                    {isPlaying ? <Play className="w-8 h-8 ml-1" /> : <Pause className="w-8 h-8" />}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={
                  mediaPreference === "resolved" && currentGrievance.resolvedImageUrl
                    ? currentGrievance.resolvedImageUrl
                    : currentGrievance.imageUrl
                }
                alt={currentGrievance.title}
                onError={(e) => handleCivicImageError(e, currentGrievance.category)}
                className="w-full h-full object-cover sm:object-contain transition-all duration-300"
                referrerPolicy="no-referrer"
              />

              {/* Resolved Watermark Tag */}
              {mediaPreference === "resolved" && (
                <div className="absolute top-16 left-4 px-3 py-1 rounded-xl bg-emerald-500/90 text-white text-xs font-black tracking-wide border border-emerald-300 shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OFFICIAL POST-RESOLUTION AUDIT PHOTO</span>
                </div>
              )}
            </div>
          )}

          {/* Floating "+1 Supported" Heart / Sparkle Burst Effect */}
          {supportAnim === currentGrievance.id && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-out fade-out zoom-out duration-1000">
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white font-black text-sm sm:text-base shadow-2xl border border-white/30 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                <span>+1 Citizen Support Recorded!</span>
              </div>
            </div>
          )}

          {/* Video Bottom Scrub Bar */}
          {isVideoAvailable && mediaPreference === "video" && videoDuration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
              <div
                className="h-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] transition-all"
                style={{ width: `${(videoProgress / videoDuration) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE FLOATING ACTION RAIL (THE SUPPORT BUTTON IS HERE) */}
        {/* ========================================================= */}
        <div className="absolute right-3 bottom-24 sm:bottom-28 z-30 flex flex-col items-center gap-3.5">
          {/* 1. PRIMARY SUPPORT BUTTON (CORE FEATURE) */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              id="reel-support-btn"
              onClick={handleSupportClick}
              title={
                currentGrievance.hasUpvoted
                  ? "You have supported this issue"
                  : "Support this grievance (S key)"
              }
              className={`group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl min-h-[48px] min-w-[48px] cursor-pointer ${
                currentGrievance.hasUpvoted
                  ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/40 ring-4 ring-emerald-400/30 scale-105"
                  : "bg-gradient-to-tr from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white shadow-[#FF6A00]/40 hover:scale-110 active:scale-95"
              }`}
            >
              {currentGrievance.hasUpvoted ? (
                <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
              ) : (
                <ThumbsUp className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:-rotate-12 group-hover:scale-110" />
              )}

              {/* Pulsing ring if not yet supported */}
              {!currentGrievance.hasUpvoted && (
                <span className="absolute inset-0 rounded-full bg-[#FF6A00] opacity-40 animate-ping pointer-events-none" />
              )}
            </button>
            <span
              className={`text-xs font-black tracking-tight px-2 py-0.5 rounded-full shadow-md backdrop-blur-md border ${
                currentGrievance.hasUpvoted
                  ? "bg-emerald-500/90 text-white border-emerald-300/40"
                  : "bg-black/75 text-white border-white/20"
              }`}
            >
              {currentGrievance.upvotes}
            </span>
            <span className="text-[10px] font-bold text-white/90 drop-shadow-md">
              {currentGrievance.hasUpvoted ? "Supported" : "Support"}
            </span>
          </div>

          {/* 2. TRACK STATUS BUTTON */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onTrack(currentGrievance)}
              title="Track Full Timeline & SLA"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            >
              <Eye className="w-5 h-5 text-cyan-400" />
            </button>
            <span className="text-[10px] font-bold text-white/90 drop-shadow-md">Track</span>
          </div>

          {/* 3. COMMUNITY NOTES & COMMENTS */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setCommentsOpen((prev) => !prev)}
              title="Community Notes & Activity"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </button>
            <span className="text-[10px] font-bold text-white/90 drop-shadow-md">
              {currentGrievance.timeline.length}
            </span>
          </div>

          {/* 4. SHARE BUTTON */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              title="Share Report & Token"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            >
              {copiedToken ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5 text-purple-300" />}
            </button>
            <span className="text-[10px] font-bold text-white/90 drop-shadow-md">
              {copiedToken ? "Copied!" : "Share"}
            </span>
          </div>

          {/* 5. ADMIN DELETE / PURGE BUTTON */}
          {isAdmin && onOpenDeleteModal && (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenDeleteModal(currentGrievance, "all")}
                title="Admin Delete: Purge complaint / remove video"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-600/90 hover:bg-red-700 backdrop-blur-md border border-white/40 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/50 cursor-pointer animate-pulse"
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
              <span className="text-[10px] font-bold text-red-300 drop-shadow-md">Admin</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* BOTTOM METADATA & DETAILS OVERLAY */}
        {/* ========================================================= */}
        <div className="relative z-20 p-4 pt-10 pb-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent text-white space-y-2 max-w-[84%] sm:max-w-[80%]">
          {/* Priority, SLA & Token Pill */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-orange-300 border border-white/20">
              #{currentGrievance.token.split("-").slice(-2).join("-")}
            </span>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                currentGrievance.status === "Resolved & Verified"
                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                  : "bg-amber-500/30 text-amber-300 border border-amber-500/50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {currentGrievance.status}
            </span>

            <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#FF6A00]" />
              <span>SLA: {currentGrievance.targetSlaHours}h</span>
            </span>
          </div>

          {/* Grievance Title */}
          <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug drop-shadow-md font-heading line-clamp-2">
            {currentGrievance.title}
          </h3>

          {/* Grievance Description with Show More */}
          <p
            onClick={() => setShowDescriptionFull((prev) => !prev)}
            className={`text-xs text-slate-300 leading-relaxed cursor-pointer ${
              showDescriptionFull ? "" : "line-clamp-2"
            }`}
          >
            {currentGrievance.description}
            {!showDescriptionFull && (
              <span className="text-[#FF8A00] font-bold ml-1 text-[11px]">...more</span>
            )}
          </p>

          {/* Locality & Department Tags */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300 pt-1">
            <div className="flex items-center gap-1 text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
              <span className="truncate">
                {currentGrievance.locality}, {currentGrievance.district} ({currentGrievance.stateCode})
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{currentGrievance.department.split("(")[0]}</span>
            </div>
          </div>

          {/* Citizen Reporter Tag */}
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Reported by {currentGrievance.filedByName} • Aadhaar-Verified Resident</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VERTICAL SCROLL NAVIGATION ARROWS (DESKTOP & ACCESSIBILITY) */}
        {/* ========================================================= */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={goToPrev}
            title="Previous Report (Up Arrow)"
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          <button
            type="button"
            disabled={currentIndex === grievances.length - 1}
            onClick={goToNext}
            title="Next Report (Down Arrow)"
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* COMMUNITY TIMELINE & NOTES DRAWER */}
        {/* ========================================================= */}
        {commentsOpen && (
          <div className="absolute inset-x-0 bottom-0 z-40 max-h-[70%] bg-[#10141f] border-t border-white/15 rounded-t-3xl p-4 sm:p-5 flex flex-col animate-in slide-in-from-bottom duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Statutory Action Log & Timeline</h4>
              </div>
              <button
                type="button"
                onClick={() => setCommentsOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pt-3 flex-1">
              {currentGrievance.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        event.status === "completed" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    {idx < currentGrievance.timeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-white/10 my-1" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="font-bold text-slate-200">{event.title}</div>
                    <div className="text-[11px] text-slate-400">{event.description}</div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                      <span>{event.timestamp}</span>
                      {event.officerOrEntity && (
                        <span className="text-orange-400 font-medium">{event.officerOrEntity}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Track Action in Drawer */}
            <div className="pt-3 border-t border-white/10 mt-2">
              <button
                type="button"
                onClick={() => {
                  setCommentsOpen(false);
                  onTrack(currentGrievance);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Open Full Nodal Audit Details</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Keyboard Navigation Hint on Desktop */}
      <div className="hidden lg:flex items-center gap-3 absolute bottom-3 right-6 text-[11px] text-slate-400 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 pointer-events-none">
        <span>Use <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px]">↓</kbd> or Mouse Scroll</span>
        <span>•</span>
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[#FF6A00] text-white font-mono text-[10px]">S</kbd> to Support</span>
      </div>
    </div>
  );
};
