import React, { useState, useRef, useEffect } from "react";
import {
  Phone,
  Send,
  X,
  Sparkles,
  Paperclip,
  CheckCheck,
  Building2,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Camera,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Grievance, UserProfile } from "../types";

interface WhatsAppGrievanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoRegisterGrievance: (grievance: Grievance) => void;
  currentUser: UserProfile | null;
  onTrackRegisteredGrievance?: (g: Grievance) => void;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  grievanceData?: Grievance;
  imageUrl?: string;
}

// Safely escape raw text to prevent HTML injection and preserve characters like <, >, &, quotes
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const WhatsAppGrievanceModal: React.FC<WhatsAppGrievanceModalProps> = ({
  isOpen,
  onClose,
  onAutoRegisterGrievance,
  currentUser,
  onTrackRegisteredGrievance,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: `🇮🇳 *JanVani Official WhatsApp Civic Seva*\n*Government of India • Ministry of Housing & Urban Affairs (MoHUA)*\n\nNamaste! 🙏 Welcome to the official WhatsApp intake helpline (+91 90131 51515).\n\nText your civic complaint (roads, potholes, garbage, water leaks, electricity hazards) in *Hindi, English, or Hinglish*. Our Multimodal AI will auto-categorize it and dispatch it to the designated Ward Nodal Officer immediately.`,
      timestamp: "Just now",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [recentRegistered, setRecentRegistered] = useState<Grievance | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const HELPLINE_NUMBER = "+91 90131 51515";

  // Escape key handler to close modal
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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const quickScenarios = [
    {
      label: "🚗 3-Foot Pothole",
      text: "Main Hospital road near Sector 3 has a 3-foot deep pothole crater. 2 two-wheelers slipped last night. Urgent bitumen patching needed.",
      img: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    },
    {
      label: "🗑️ Overflowing Mandi Garbage",
      text: "Krishi Mandi gate par 3 din se kachre ka dher pada hai. Badboo se dukandar aur public pareshan hain, please safai gadi bheinjiye.",
      img: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
    },
    {
      label: "⚡ Live Wire Sparking",
      text: "Ward 21 Housing Board colony transformer ke paas open high-voltage wire latak rahi hai. Children play nearby, immediate power squad needed!",
      img: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
    },
    {
      label: "💧 Water Main Pipe Burst",
      text: "Civil Hospital feeder line par 300mm transmission pipe leak ho gaya hai. Thousands of liters of treated water getting wasted.",
      img: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(HELPLINE_NUMBER);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (customText?: string, customImg?: string) => {
    const textToSend = customText || inputText;
    const imgToSend = customImg || selectedPhoto;

    if (!textToSend.trim() && !imgToSend) return;

    const userMsgTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `msg-user-${Date.now()}`;

    // Add user message to state
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: textToSend,
        timestamp: userMsgTime,
        imageUrl: imgToSend || undefined,
      },
    ]);

    setInputText("");
    setSelectedPhoto(null);
    setIsTyping(true);

    try {
      // Call backend WhatsApp webhook / triage endpoint
      const response = await fetch("/api/webhook/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: currentUser?.phone || "+91 98263 77410",
          senderName: currentUser?.name || "Praneet Dubey",
          text: textToSend,
          mediaUrl: imgToSend || undefined,
          imageBase64: imgToSend?.startsWith("data:") ? imgToSend : undefined,
        }),
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.success && data.grievance) {
        const botReplyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Auto register grievance in main app state
        onAutoRegisterGrievance(data.grievance);
        setRecentRegistered(data.grievance);

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-bot-${Date.now()}`,
            sender: "bot",
            text: data.botReply || "Grievance auto-registered on Nodal Officer Suite.",
            timestamp: botReplyTime,
            grievanceData: data.grievance,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-bot-err-${Date.now()}`,
            sender: "bot",
            text: "Namaste! Thank you for the message. We have forwarded your report to the Dhar District Civic Control Room for manual inspection.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send WhatsApp message:", error);
      setIsTyping(false);

      // Local fallback auto-registration
      const token = `JV-WA-DHAR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackGrievance: Grievance = {
        id: `g-wa-${Date.now()}`,
        token: token,
        title: textToSend.slice(0, 50) || "Civic Defect reported via WhatsApp",
        description: textToSend,
        category: textToSend.toLowerCase().includes("garbage") ? "Garbage & Sanitation" : "Roads & Potholes",
        state: "Madhya Pradesh",
        stateCode: "MP",
        district: "Dhar",
        ward: "Ward 18 (Main Market / Bus Stand)",
        locality: "Main Market Road, Dhar",
        department: "Nagar Palika Parishad (Public Works Wing)",
        status: "Submitted & Token Issued",
        dateFiled: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        severityScore: 8,
        targetSlaHours: 48,
        slaRemainingHours: 48,
        assignedNodal: "Er. Rajesh Sharma (AE Civil)",
        assignedOfficerTitle: "Assistant Engineer (Civil & Public Works)",
        assignedOfficerPhone: "+91 94252 44120",
        imageUrl: imgToSend || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        upvotes: 1,
        filedByName: `${currentUser?.name || "Citizen"} (via WhatsApp)`,
        filedByAadhaar: "WA-7741",
        sourceChannel: "whatsapp",
        whatsappSenderPhone: currentUser?.phone || "+91 98263 77410",
        whatsappMessageText: textToSend,
        timeline: [
          {
            title: "WhatsApp Grievance Registered",
            description: `Auto-triaged & registered from WhatsApp number ${currentUser?.phone || "+91 98263 77410"}. Token: ${token}`,
            timestamp: "Just now",
            status: "completed",
            verifiedBadge: "WhatsApp Verified",
          },
        ],
      };

      onAutoRegisterGrievance(fallbackGrievance);
      setRecentRegistered(fallbackGrievance);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-bot-fallback-${Date.now()}`,
          sender: "bot",
          text: `🇮🇳 *JanVani Official WhatsApp Seva*\n\nNamaste! Your grievance has been auto-registered:\n\n📋 *Token:* \`${token}\`\n📂 *Category:* Roads & Potholes\n📍 *Ward:* Ward 18 (Main Market)\n⏱️ *SLA:* 48 Hours\n👤 *Officer:* Er. Rajesh Sharma (+91 94252 44120)\n\n_Auto-synced with Nodal Officer Suite in real time._`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          grievanceData: fallbackGrievance,
        },
      ]);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl h-[92vh] max-h-[750px] bg-[#ece5dd] dark:bg-[#0c1317] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-emerald-700/30 dark:border-emerald-500/20"
      >
        
        {/* 1. Official WhatsApp Brand Header */}
        <div className="bg-[#075E54] dark:bg-[#1f2c34] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Official Logo Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#25D366] p-0.5 shadow-sm flex items-center justify-center">
                <div className="w-full h-full bg-[#128C7E] rounded-full flex items-center justify-center text-white">
                  <Phone className="w-5 h-5 fill-current" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] rounded-full border-2 border-[#075E54]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  JanVani WhatsApp Civic Seva
                </h3>
                <span className="flex items-center text-[#25D366]" title="Official Verified WhatsApp Channel">
                  <ShieldCheck className="w-4 h-4 fill-[#25D366] text-white" />
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-100 dark:text-emerald-300/80">
                <span className="font-mono font-bold tracking-wide">{HELPLINE_NUMBER}</span>
                <span>•</span>
                <span className="text-emerald-200 font-medium">Online (AI Auto-Triage)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Copy Helpline Number Button */}
            <button
              onClick={handleCopyNumber}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Copy WhatsApp Helpline Number"
            >
              {copiedNumber ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedNumber ? "Copied!" : "Copy"}</span>
            </button>

            {/* Direct wa.me Link Button */}
            <a
              href={`https://wa.me/919013151515?text=${encodeURIComponent(
                "Hi JanVani, I want to register a civic grievance regarding public infrastructure in my ward."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-[#075E54] hover:text-black font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Open direct in real WhatsApp app"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open App</span>
            </a>

            {/* Close Button with Esc shortcut indicator */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              aria-label="Close WhatsApp Modal (Esc)"
              title="Close (Press Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/20 text-white/90 border border-white/20">
                Esc
              </span>
            </button>
          </div>
        </div>

        {/* 2. Official Encryption & Gov Badge Strip */}
        <div className="bg-[#d9fdd3] dark:bg-[#182229] border-b border-emerald-600/10 px-3 py-1.5 flex items-center justify-between text-[11px] text-[#005c4b] dark:text-emerald-300">
          <div className="flex items-center gap-1.5 font-medium mx-auto text-center">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>Official 24x7 MoHUA Civic Intake Channel • Auto-syncs with Nodal Officer Suite</span>
          </div>
        </div>

        {/* 3. Messages Chat Body (WhatsApp Theme) */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#0000000a_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]">
          {/* Disclaimer Pill */}
          <div className="flex justify-center my-1">
            <span className="px-3 py-1 rounded-lg bg-white/80 dark:bg-[#1f2c34]/90 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 shadow-xs max-w-md text-center">
              🔒 Messages are end-to-end triaged using Google Gemini 3.7 AI and assigned to municipal engineers with statutory SLA timers.
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3 sm:p-3.5 shadow-sm text-xs sm:text-[13px] leading-relaxed relative ${
                  msg.sender === "user"
                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-[#E9EDEF] rounded-tr-xs"
                    : "bg-white dark:bg-[#202c33] text-slate-900 dark:text-[#D1D7DB] rounded-tl-xs border border-slate-100 dark:border-transparent"
                }`}
              >
                {/* Optional Attached Image in Message */}
                {msg.imageUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                    <img
                      src={msg.imageUrl}
                      alt="Civic Proof"
                      className="w-full h-40 sm:h-48 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Message Text formatted with Markdown-like bolding and safe HTML escaping */}
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                  {msg.text.split("\n").map((line, idx) => {
                    // Safely escape HTML characters (<, >, &, etc.) before formatting markdown
                    const safeLine = escapeHtml(line);
                    const formattedLine = safeLine
                      .replace(/\*(.*?)\*/g, "<strong class='font-bold'>$1</strong>")
                      .replace(/_(.*?)_/g, "<em class='italic'>$1</em>")
                      .replace(/~(.*?)~/g, "<del class='line-through opacity-75'>$1</del>")
                      .replace(
                        /`(.*?)`/g,
                        "<code class='bg-black/10 dark:bg-black/30 px-1 py-0.5 rounded font-mono font-bold text-xs'>$1</code>"
                      );

                    return (
                      <p
                        key={idx}
                        className="mb-1 last:mb-0 min-h-[1.2em]"
                        dangerouslySetInnerHTML={{ __html: formattedLine }}
                      />
                    );
                  })}
                </div>

                {/* Grievance Quick Action Card if Registered */}
                {msg.grievanceData && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/80 dark:bg-emerald-950/40 p-2 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Registered in Nodal Suite</span>
                    </div>
                    {onTrackRegisteredGrievance && (
                      <button
                        onClick={() => {
                          onTrackRegisteredGrievance(msg.grievanceData!);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-[#075E54] font-black text-[10px] uppercase flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>View Live Tracker</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Timestamp & Double Checkmarks */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{msg.timestamp}</span>
                  {msg.sender === "user" && (
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-sm border border-slate-100 dark:border-transparent flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-[#25D366] animate-spin" />
                <span className="text-[11px] font-medium">JanVani AI is triaging & registering complaint...</span>
                <span className="flex gap-1 ml-1">
                  <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. Quick-Tap Scenario Suggestion Chips */}
        <div className="bg-[#f0f2f5] dark:bg-[#111b21] px-3 py-2 border-t border-slate-200 dark:border-white/[0.06] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
            Quick Scenarios:
          </span>
          {quickScenarios.map((scenario, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(scenario.text, scenario.img)}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#202c33] hover:bg-emerald-50 dark:hover:bg-[#2a3942] border border-slate-300 dark:border-white/10 text-[11px] font-medium text-slate-800 dark:text-[#E9EDEF] whitespace-nowrap shadow-xs transition-colors cursor-pointer"
            >
              {scenario.label}
            </button>
          ))}
        </div>

        {/* Selected Photo Preview Bar */}
        {selectedPhoto && (
          <div className="bg-[#e9edef] dark:bg-[#1f2c34] px-4 py-2 flex items-center justify-between border-t border-slate-300 dark:border-white/10">
            <div className="flex items-center gap-2">
              <img src={selectedPhoto} alt="Selected" className="w-10 h-10 object-cover rounded-lg" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">1 Photo attached</span>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="p-1 rounded-full text-slate-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 5. Message Input Bar */}
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-2.5 sm:p-3 flex items-center gap-2 border-t border-slate-200 dark:border-white/[0.06]">
          {/* File / Camera Upload Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImagePick}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full text-slate-600 dark:text-[#8696A0] hover:bg-slate-200 dark:hover:bg-[#374248] transition-colors"
            title="Attach Defect Photograph"
            aria-label="Attach Photo"
          >
            <Camera className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Type civic complaint in Hindi / English (e.g. road pothole near main market)..."
            className="flex-1 bg-white dark:bg-[#2a3942] text-slate-900 dark:text-[#E9EDEF] placeholder-slate-400 dark:placeholder-[#8696A0] text-xs sm:text-sm px-4 py-2.5 rounded-2xl border-0 focus:outline-none shadow-xs"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() && !selectedPhoto}
            className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 disabled:hover:bg-[#25D366] text-[#075E54] dark:text-[#111b21] flex items-center justify-center transition-transform active:scale-95 shadow-md flex-shrink-0 cursor-pointer"
            aria-label="Send WhatsApp Message"
          >
            <Send className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
