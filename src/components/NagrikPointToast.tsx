import React, { useState, useEffect } from "react";
import { Trophy, Sparkles, X, ChevronRight, Crown } from "lucide-react";
import { NagrikTierInfo } from "../types";

interface ToastData {
  id: string;
  points: number;
  addedPoints: number;
  action: string;
  newTier: NagrikTierInfo;
  tierChanged: boolean;
}

interface NagrikPointToastProps {
  onOpenLeaderboard: () => void;
}

export const NagrikPointToast: React.FC<NagrikPointToastProps> = ({ onOpenLeaderboard }) => {
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);

  useEffect(() => {
    const handlePointsEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setCurrentToast({
          id: `toast-${Date.now()}`,
          ...customEvent.detail,
        });

        // Auto dismiss after 5 seconds
        setTimeout(() => {
          setCurrentToast(null);
        }, 5500);
      }
    };

    window.addEventListener("nagrik_points_updated", handlePointsEvent);
    return () => {
      window.removeEventListener("nagrik_points_updated", handlePointsEvent);
    };
  }, []);

  if (!currentToast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 rounded-2xl bg-slate-900/95 text-white border-2 border-orange-500/80 shadow-2xl backdrop-blur-md flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-amber-400 flex items-center justify-center text-white shrink-0 shadow-md">
          {currentToast.tierChanged ? <Crown className="w-5 h-5 text-yellow-200" /> : <Sparkles className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span>+{currentToast.addedPoints} Nagrik Points!</span>
            </span>
            <button
              type="button"
              onClick={() => setCurrentToast(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-sm font-bold text-white mt-0.5">
            {currentToast.tierChanged
              ? `Promoted to ${currentToast.newTier.name}!`
              : "Civic Contribution Credited"}
          </div>

          <p className="text-xs text-slate-300 mt-0.5">
            Total Points: <span className="font-bold text-amber-400 font-mono">{currentToast.points}</span> •{" "}
            <span className="font-semibold">{currentToast.newTier.name}</span>
          </p>

          <button
            type="button"
            onClick={() => {
              setCurrentToast(null);
              onOpenLeaderboard();
            }}
            className="mt-2 text-xs font-bold text-[#FF8A00] hover:text-amber-300 flex items-center gap-1 group"
          >
            <span>Check Best Nagrik Ward Rank</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
