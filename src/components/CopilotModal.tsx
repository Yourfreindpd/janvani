import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  Building2,
  FileText,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { CopilotMessage, UserProfile } from "../types";

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  initialQuery?: string;
  t?: any;
}


export const CopilotModal: React.FC<CopilotModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialQuery,
  t,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Namaste! I am the JanVani 24x7 AI Civic Copilot. I can assist you with filing grievances, tracking municipal SLA timelines, drafting RTI / Jan Sunwai appeals, checking central & state welfare scheme eligibility, and identifying your ward nodal officers. How can I help you today?",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
    }
  }, [initialQuery]);

  // Safely scroll internal chat container only, never displacing parent window/iframe
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/gemini/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: chatHistory,
          userContext: {
            name: currentUser?.name || "Citizen",
            location: currentUser?.location || "Ward 27, Dhar MP",
            role: currentUser?.role || "citizen",
          },
        }),
      });

      const data = await res.json();
      const assistantMsg: CopilotMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: data.reply || "I am currently processing your request. Please try again.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      const fallbackMsg: CopilotMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content:
          "Under the Madhya Pradesh Public Services Guarantee Act (लोक सेवा गारंटी अधिनियम), civic grievances like road repair and sewage overflow have a statutory SLA of 48 to 72 hours. If your complaint is delayed, you can file an automatic first appeal with the Sub-Divisional Magistrate (SDM) or call 181 / CM Helpline.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden bg-black/70 dark:bg-black/85 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
    >
      {/* Outside Floating Quick Dismiss Button (Guarantees visible close option regardless of viewport) */}
      <button
        onClick={onClose}
        className="fixed top-4 left-4 z-50 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md cursor-pointer border border-white/20 transition-all active:scale-95"
        title="Close (Esc)"
      >
        <X className="w-4 h-4 text-[#FF6A00]" />
        <span>Close / बंद करें (Esc)</span>
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg h-full bg-white dark:bg-[#151515] border-l border-slate-200/90 dark:border-white/[0.08] shadow-2xl flex flex-col justify-between text-slate-900 dark:text-[#F5F5F5] overflow-hidden"
      >
        {/* Atmospheric Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF6A00]/15 rounded-full blur-[60px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF8A00]/10 rounded-full blur-[50px] pointer-events-none -ml-20 -mb-20" />

        {/* Sticky Header - Stays pinned and cannot be scrolled out */}
        <div className="sticky top-0 z-30 flex-shrink-0 p-3.5 sm:p-4 border-b border-slate-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF8A00] p-0.5 shadow-md shadow-[#FF6A00]/25 flex items-center justify-center text-white flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5F5F5] font-heading truncate">
                  JanVani 24x7 AI Copilot
                </h3>
                <span className="text-[10px] bg-[#FF6A00]/10 dark:bg-[#FF6A00]/20 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/30 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#A8A8A8] truncate">
                Civic Law, RTI Drafting, SLA Escalations & Scheme Eligibility
              </p>
            </div>
          </div>

          {/* Prominent Header Close Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-[#252525] dark:hover:bg-red-950/40 text-slate-700 hover:text-red-600 dark:text-[#A8A8A8] dark:hover:text-red-400 transition-colors cursor-pointer border border-slate-200/80 dark:border-white/[0.08] flex-shrink-0 shadow-xs"
            aria-label="Close Copilot"
            title="Close / बंद करें (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="text-xs font-bold">Close</span>
          </button>
        </div>

        {/* Message Stream */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 overscroll-contain">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-[#FF6A00]/10 dark:bg-[#FF6A00]/20 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] dark:text-[#FF8A00] flex-shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white rounded-br-none shadow-md shadow-[#FF6A00]/25 font-medium"
                    : "bg-white/95 dark:bg-[#252525] text-slate-800 dark:text-[#F5F5F5] border border-slate-200/90 dark:border-white/[0.08] rounded-bl-none shadow-sm dark:shadow-md"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-[#777777] pt-1.5 border-t border-slate-200/80 dark:border-white/10">
                  <span>{msg.timestamp}</span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer font-medium"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#20C997]" />
                          <span className="text-[#20C997]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-[#303030] border border-slate-300 dark:border-white/[0.08] flex items-center justify-center text-slate-700 dark:text-[#A8A8A8] flex-shrink-0 mt-0.5 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-[#FF6A00]/10 dark:bg-[#FF6A00]/20 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00]">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white/95 dark:bg-[#252525] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-3 text-xs text-slate-600 dark:text-[#A8A8A8] flex items-center gap-2 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6A00] animate-pulse" />
                <span>Consulting Indian civic laws & municipal regulations...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-[#101010] relative z-10 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything in English or Hindi / हिंदी या अंग्रेजी में पूछें..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] min-h-[42px]"
            />

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white font-bold disabled:opacity-50 transition-all shadow-md shadow-[#FF6A00]/25 min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

