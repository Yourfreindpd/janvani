import React, { useState } from "react";
import {
  Shield,
  Search,
  CheckCircle2,
  ExternalLink,
  Users,
  IndianRupee,
  FileCheck2,
  Sparkles,
  Award,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { WelfareScheme } from "../types";
import { WELFARE_SCHEMES } from "../data/initialData";
import { Translations } from "../data/translations";

interface WelfareSchemesProps {
  t: Translations;
  onOpenCopilotWithQuery?: (query: string) => void;
}

export const WelfareSchemes: React.FC<WelfareSchemesProps> = ({
  t,
  onOpenCopilotWithQuery,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMinistry, setSelectedMinistry] = useState("all");

  const filteredSchemes = WELFARE_SCHEMES.filter((scheme) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = scheme.title.toLowerCase().includes(q);
      const matchesSub = scheme.subtitle.toLowerCase().includes(q);
      const matchesCategory = scheme.category.toLowerCase().includes(q);
      if (!matchesName && !matchesSub && !matchesCategory) {
        return false;
      }
    }
    if (selectedMinistry !== "all") {
      if (!scheme.ministry.toLowerCase().includes(selectedMinistry.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-5 animate-in fade-in duration-300">
      {/* Top Banner with Atmospheric Orange Glow & Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-[#faf6ee]/90 to-[#f3ecdf]/90 dark:from-[#303030] dark:via-[#353535] dark:to-[#404040] backdrop-blur-2xl border border-white/90 dark:border-white/[0.08] text-slate-900 dark:text-[#F5F5F5] p-5 sm:p-7 shadow-[0_15px_45px_rgba(210,190,165,0.22)] dark:shadow-2xl transition-colors">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#FF6A00]/15 dark:bg-[#FF6A00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-[#FF8A00]/10 dark:bg-[#FF8A00]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6A00]/10 dark:bg-[#FF6A00]/15 border border-[#FF6A00]/25 text-[#FF6A00] dark:text-[#FF8A00] text-xs font-bold mb-2">
              <Award className="w-3.5 h-3.5" />
              Direct Benefit Transfer (DBT) & Municipal Entitlements
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F5F5F5] tracking-tight font-heading">
              Government Welfare Schemes & Civic Subsidies
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A8A8A8] mt-1 max-w-2xl leading-relaxed">
              Official benefits database integrated with JanVani grievance resolution. Check eligibility, required documents, and apply via national single-window portal.
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() =>
                onOpenCopilotWithQuery?.(
                  "Which government welfare schemes am I eligible for as an urban resident?"
                )
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold shadow-lg shadow-[#FF6A00]/30 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Copilot for Eligibility</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mt-5 pt-4 border-t border-slate-200/80 dark:border-white/[0.08] relative z-10">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#777777]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search welfare schemes by name, keyword, DBT benefit or subsidy..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-[#151515]/70 border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] transition-all min-h-[42px]"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedMinistry}
              onChange={(e) => setSelectedMinistry(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/90 dark:bg-[#151515]/70 border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00] transition-all appearance-none cursor-pointer min-h-[42px]"
            >
              <option value="all" className="bg-white dark:bg-[#151515]">All Central Ministries</option>
              <option value="Housing" className="bg-white dark:bg-[#151515]">Ministry of Housing & Urban Affairs (MoHUA)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {filteredSchemes.map((scheme) => (
          <div
            key={scheme.id}
            className="flex flex-col justify-between rounded-2xl bg-white/80 dark:bg-[#303030] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] hover:border-orange-300/60 dark:hover:border-white/[0.15] p-5 shadow-[0_8px_30px_-4px_rgba(200,180,155,0.18)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-white/[0.08]">
                <span className="px-2.5 py-0.5 rounded-md bg-[#FF6A00]/10 dark:bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/25 font-bold text-xs font-mono">
                  {scheme.category}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#777777] font-medium truncate max-w-[160px]">
                  {scheme.ministry}
                </span>
              </div>

              {/* Title */}
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-[#F5F5F5] group-hover:text-[#FF6A00] dark:group-hover:text-[#FF8A00] transition-colors leading-snug font-heading">
                {scheme.title}
              </h3>

              {/* Subtitle */}
              <p className="mt-1 text-xs text-slate-600 dark:text-[#A8A8A8] leading-relaxed font-medium">
                {scheme.subtitle}
              </p>

              {/* Key Benefits List */}
              <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 dark:bg-[#151515]/60 border border-emerald-200/80 dark:border-[#20C997]/20 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-[#20C997]">Key Entitlements & Subsidies</div>
                {scheme.keyBenefits.map((b, idx) => (
                  <div key={idx} className="text-xs text-emerald-900 dark:text-[#20C997] flex items-start gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#20C997] flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Eligibility */}
              <div className="mt-3 space-y-1 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#777777]">Eligibility Criteria:</div>
                <div className="space-y-1">
                  {scheme.eligibility.map((el, idx) => (
                    <div key={idx} className="text-slate-700 dark:text-[#A8A8A8] text-xs bg-slate-50 dark:bg-[#151515]/60 p-2 rounded-lg border border-slate-200/80 dark:border-white/[0.08]">
                      • {el}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats pill */}
              <div className="mt-3 text-[11px] font-mono font-bold text-[#FF6A00] dark:text-[#FF8A00] bg-[#FF6A00]/10 dark:bg-[#FF6A00]/15 border border-[#FF6A00]/25 p-2 rounded-lg">
                {scheme.statsText}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2">
              <a
                href={scheme.officialPortal}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-[#383838] hover:bg-slate-200 dark:hover:bg-[#404040] text-slate-800 dark:text-[#F5F5F5] text-xs font-bold border border-slate-200 dark:border-white/[0.08] transition-colors min-h-[38px] cursor-pointer"
              >
                <span>National Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() =>
                  onOpenCopilotWithQuery?.(`Tell me how to apply for ${scheme.title} and what documents are required.`)
                }
                className="flex items-center justify-center gap-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6A00]/25 min-h-[38px] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Guide Me</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
