import React, { useState } from "react";
import {
  MapPin,
  Building2,
  ThumbsUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  Film,
  Play,
  Camera,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { Grievance } from "../types";
import { Translations } from "../data/translations";
import { handleCivicImageError } from "../utils/imageHelper";

interface GrievanceCardProps {
  grievance: Grievance;
  onTrack: (grievance: Grievance) => void;
  onUpvote: (id: string) => void;
  onOpenMediaScroller?: (grievance: Grievance) => void;
  onOpenDeleteModal?: (grievance: Grievance, initialMode?: "all" | "video_only") => void;
  isAdmin?: boolean;
  t: Translations;
  viewMode?: "grid" | "compact";
}

export const GrievanceCard: React.FC<GrievanceCardProps> = ({
  grievance,
  onTrack,
  onUpvote,
  onOpenMediaScroller,
  onOpenDeleteModal,
  isAdmin = false,
  t,
  viewMode = "grid",
}) => {
  const getStatusConfig = () => {
    switch (grievance.status) {
      case "Resolved & Verified":
        return {
          label: t.statusResolved || "Resolved",
          bgColor: "bg-emerald-50 dark:bg-[#20C997]/15 text-emerald-700 dark:text-[#20C997] border border-emerald-200 dark:border-[#20C997]/30",
          dotColor: "bg-[#20C997]",
          icon: CheckCircle2,
        };
      case "Work In Progress":
        return {
          label: t.statusInProgress || "In Progress",
          bgColor: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40",
          dotColor: "bg-amber-500 animate-pulse",
          icon: Clock,
        };
      default:
        return {
          label: t.statusReported || "Reported",
          bgColor: "bg-blue-50 dark:bg-[#3B82F6]/15 text-blue-700 dark:text-[#3B82F6] border border-blue-200 dark:border-[#3B82F6]/30",
          dotColor: "bg-[#3B82F6]",
          icon: Sparkles,
        };
    }
  };

  const getPriorityBadge = () => {
    const score = grievance.severityScore;
    if (score >= 8) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-[#FF3B30]/15 text-red-700 dark:text-[#FF3B30] border border-red-200 dark:border-[#FF3B30]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-ping"></span>
          {t.priorityUrgent || "Urgent"}
        </span>
      );
    } else if (score >= 6) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-[#FF6A00]/15 text-orange-700 dark:text-[#FF8A00] border border-orange-200 dark:border-[#FF6A00]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]"></span>
          {t.priorityHigh || "Priority"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-[#151515]/60 text-slate-600 dark:text-[#A8A8A8] border border-slate-200 dark:border-white/[0.08]">
        {t.priorityStandard || "Standard"}
      </span>
    );
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

  const status = getStatusConfig();

  // ==========================================
  // 1. COMPACT LIST VIEW
  // ==========================================
  if (viewMode === "compact") {
    return (
      <div className="group rounded-2xl bg-white/80 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] hover:border-orange-300/60 dark:hover:border-white/[0.15] p-3 sm:p-3.5 transition-all shadow-[0_6px_24px_-4px_rgba(200,180,155,0.16)] hover:shadow-[0_12px_30px_-4px_rgba(255,106,0,0.16)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            onClick={() => {
              if (onOpenMediaScroller) {
                onOpenMediaScroller(grievance);
              } else {
                onTrack(grievance);
              }
            }}
            title="Click to view full photo/video reel"
            className="relative w-16 h-16 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-[#151515] border border-slate-200/80 dark:border-white/[0.08] cursor-pointer shadow-xs group/thumb"
          >
            <img
              src={grievance.imageUrl}
              alt={grievance.title}
              onError={(e) => handleCivicImageError(e, grievance.category)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {grievance.videoUrl && (
              <span className="absolute top-1 left-1 bg-black/70 backdrop-blur-md rounded px-1 py-0.5 text-[9px] font-bold text-white flex items-center gap-0.5 border border-white/20 shadow-xs">
                <Play className="w-2 h-2 fill-white text-white" />
              </span>
            )}
            <span className="absolute bottom-0.5 right-0.5 text-xs bg-white/95 dark:bg-[#151515]/90 rounded px-1 shadow-xs border border-slate-200/60 dark:border-white/[0.08]">
              {getCategoryIcon(grievance.category)}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bgColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}></span>
                {status.label}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-[#A8A8A8] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#FF6A00]" />
                <span className="truncate">{grievance.locality}, {grievance.district}</span>
              </span>
            </div>

            <h4
              onClick={() => onTrack(grievance)}
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F5F5F5] group-hover:text-[#FF6A00] dark:group-hover:text-[#FF8A00] transition-colors cursor-pointer line-clamp-1 font-heading"
            >
              {grievance.title}
            </h4>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-[#777777]">
              <span className="font-mono text-slate-500 dark:text-[#A8A8A8]">#{grievance.token.split("-").slice(-2).join("-")}</span>
              <span>•</span>
              <span className="text-slate-600 dark:text-[#A8A8A8]">{grievance.department.split("(")[0]}</span>
              <span>•</span>
              <span className="text-orange-700 dark:text-[#FF8A00] font-medium">SLA: {grievance.targetSlaHours}h</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/[0.08] flex-shrink-0">
          {isAdmin && onOpenDeleteModal && (
            <button
              type="button"
              onClick={() => onOpenDeleteModal(grievance, "all")}
              title="Admin Purge: Delete complaint / media"
              className="p-1.5 rounded-xl bg-red-100 dark:bg-red-950/70 hover:bg-red-200 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/50 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden md:inline">Admin Delete</span>
            </button>
          )}

          <button
            type="button"
            disabled={grievance.hasUpvoted}
            onClick={() => onUpvote(grievance.id)}
            title={grievance.hasUpvoted ? "You have supported this issue" : "Support this grievance"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] shadow-xs ${
              grievance.hasUpvoted
                ? "bg-orange-50 dark:bg-[#FF6A00]/20 text-orange-800 dark:text-[#FF8A00] border border-orange-300 dark:border-[#FF6A00]/40 cursor-default opacity-95"
                : "bg-white/80 dark:bg-[#151515]/60 text-slate-700 dark:text-[#A8A8A8] hover:text-slate-950 dark:hover:text-[#F5F5F5] border border-slate-200/80 dark:border-white/[0.08] hover:bg-white dark:hover:bg-[#383838] cursor-pointer"
            }`}
          >
            {grievance.hasUpvoted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00]" />
            ) : (
              <ThumbsUp className="w-3.5 h-3.5" />
            )}
            <span>{grievance.upvotes}</span>
          </button>

          <button
            type="button"
            onClick={() => onTrack(grievance)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6A00]/25 min-h-[36px] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.trackGrievance || "Track"}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. MODERN GRID VIEW
  // ==========================================
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-[#303030] hover:bg-white dark:hover:bg-[#383838]/80 backdrop-blur-xl border border-white/90 dark:border-white/[0.08] hover:border-orange-300/60 dark:hover:border-white/[0.15] transition-all duration-200 shadow-[0_8px_30px_-4px_rgba(200,180,155,0.18)] hover:shadow-[0_16px_36px_-4px_rgba(255,106,0,0.18)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between overflow-hidden group">
      <div>
        <div className="p-3.5 pb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm">{getCategoryIcon(grievance.category)}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-[#F5F5F5] truncate font-heading">
              {grievance.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {getPriorityBadge()}
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${status.bgColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}></span>
              {status.label}
            </span>
          </div>
        </div>

        <div
          className="relative mx-3.5 h-36 sm:h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#151515] border border-slate-200/80 dark:border-white/[0.08] shadow-xs group/thumb"
        >
          <img
            src={grievance.imageUrl}
            alt={grievance.title}
            onClick={() => onTrack(grievance)}
            onError={(e) => handleCivicImageError(e, grievance.category)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* Media Reel Trigger Badge */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5 z-10">
            {onOpenMediaScroller && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMediaScroller(grievance);
                }}
                title="Open interactive video & photo reel"
                className="px-2 py-1 rounded-lg bg-black/75 hover:bg-black/90 text-white backdrop-blur-md text-[10px] font-bold border border-white/20 shadow-md flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                {grievance.videoUrl ? (
                  <>
                    <Film className="w-3 h-3 text-[#FF8A00]" />
                    <span>Watch Video Reel</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3 h-3 text-cyan-300" />
                    <span>Scroll Media</span>
                  </>
                )}
              </button>
            )}

            {isAdmin && onOpenDeleteModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDeleteModal(grievance, "all");
                }}
                title="Admin Delete: Purge complaint or remove video"
                className="px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-700 text-white backdrop-blur-md text-[10px] font-bold border border-white/30 shadow-md flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-white" />
                <span>Admin Delete</span>
              </button>
            )}
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
            <div className="px-2.5 py-1 rounded-lg bg-white/95 dark:bg-[#151515]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] text-[11px] font-medium text-slate-800 dark:text-[#F5F5F5] flex items-center gap-1.5 truncate max-w-[80%] shadow-xs">
              <MapPin className="w-3 h-3 text-[#FF6A00] flex-shrink-0" />
              <span className="truncate">{grievance.locality}, {grievance.district}</span>
            </div>

            <div className="px-2 py-1 rounded-lg bg-white/95 dark:bg-[#151515]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] text-[10px] font-mono text-slate-600 dark:text-[#A8A8A8] shadow-xs">
              #{grievance.token.split("-").slice(-2).join("-")}
            </div>
          </div>
        </div>

        <div className="p-3.5 pt-3 space-y-1.5">
          <h3
            onClick={() => onTrack(grievance)}
            className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5F5F5] group-hover:text-[#FF6A00] dark:group-hover:text-[#FF8A00] transition-colors leading-snug cursor-pointer line-clamp-2 font-heading"
          >
            {grievance.title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-[#A8A8A8] leading-relaxed line-clamp-2">
            {grievance.description}
          </p>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-[#777777] border-t border-slate-100 dark:border-white/[0.08]">
            <div className="flex items-center gap-1 truncate max-w-[65%]">
              <Building2 className="w-3 h-3 text-slate-400 dark:text-[#777777] flex-shrink-0" />
              <span className="truncate text-slate-600 dark:text-[#A8A8A8]">{grievance.department.split("(")[0]}</span>
            </div>

            <div className="flex items-center gap-1 font-medium text-orange-700 dark:text-[#FF8A00] flex-shrink-0">
              <Clock className="w-3 h-3 text-[#FF6A00]" />
              <span>Target: {grievance.targetSlaHours}h</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 pt-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={grievance.hasUpvoted}
            onClick={() => onUpvote(grievance.id)}
            title={grievance.hasUpvoted ? "You have supported this issue" : "Support this grievance"}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
              grievance.hasUpvoted
                ? "bg-orange-50 dark:bg-[#FF6A00]/20 text-orange-800 dark:text-[#FF8A00] border border-orange-300 dark:border-[#FF6A00]/40 cursor-default opacity-95"
                : "bg-white/80 dark:bg-[#151515]/60 hover:bg-white dark:hover:bg-[#383838] text-slate-700 dark:text-[#A8A8A8] dark:hover:text-[#F5F5F5] border border-slate-200/80 dark:border-white/[0.08] cursor-pointer"
            }`}
          >
            {grievance.hasUpvoted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00]" />
            ) : (
              <ThumbsUp className="w-3.5 h-3.5" />
            )}
            <span>{grievance.hasUpvoted ? `${t.upvoteBtn || "Supported"} (${grievance.upvotes})` : `${t.upvoteBtn || "Support"} (${grievance.upvotes})`}</span>
          </button>

          <button
            type="button"
            onClick={() => onTrack(grievance)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-[#FF6A00]/25 min-h-[38px] cursor-pointer"
          >
            <span>{t.trackGrievance || "Track Progress"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
