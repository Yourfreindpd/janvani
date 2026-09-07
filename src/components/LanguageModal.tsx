import React, { useEffect } from "react";
import { X, Globe, Check } from "lucide-react";
import { LanguageOption } from "../types";
import { Translations } from "../data/translations";
import { LANGUAGES } from "../data/initialData";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLang: LanguageOption;
  onSelectLang: (lang: LanguageOption) => void;
  t?: Translations;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  selectedLang,
  onSelectLang,
  t,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (lang: LanguageOption) => {
    try {
      localStorage.setItem("janvani_language", lang.code);
    } catch (e) {}
    onSelectLang(lang);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-white/90 dark:bg-[#303030] backdrop-blur-2xl border border-white/80 dark:border-white/[0.08] shadow-2xl overflow-hidden my-auto p-4 sm:p-6 space-y-4 text-slate-900 dark:text-[#F5F5F5]"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A00]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/15 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] dark:text-[#FF8A00]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading">
                {t?.selectLanguage || "Select Portal Language / भाषा चुनें"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#A8A8A8]">
                {t?.officialLanguages || "12 Official Regional Indian Languages"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-[#383838] hover:bg-slate-300 dark:hover:bg-[#404040] text-slate-500 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto p-1 relative z-10">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang.code === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                  isSelected
                    ? "bg-[#FF6A00]/15 dark:bg-[#FF6A00]/20 border-[#FF6A00] text-[#FF6A00] dark:text-[#FF8A00] shadow-md shadow-[#FF6A00]/15"
                    : "bg-slate-50 dark:bg-[#151515] hover:bg-slate-100 dark:hover:bg-[#383838] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#A8A8A8]"
                }`}
              >
                <div>
                  <div className="text-xs font-bold group-hover:text-[#FF6A00] dark:group-hover:text-[#FF8A00]">{lang.nativeName}</div>
                  <div className="text-[10px] text-slate-400 dark:text-[#777777]">{lang.name}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#FF6A00] dark:text-[#FF8A00]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

