import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Play,
  Pause,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  ChevronRight,
  Flame,
  MessageSquare,
  Bot,
  FileText,
  Check,
  Share2,
  RotateCcw,
  Info,
  PhoneCall,
  PhoneOff,
  SlidersHorizontal,
  ExternalLink,
  ThumbsUp,
  XCircle,
  HelpCircle,
  Zap,
  CheckCheck,
  Headphones,
  Signal,
  Edit3,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Grievance, UserProfile, LanguageOption, CivicCategory } from "../types";
import { Translations } from "../data/translations";
import {
  detectCurrentLocation,
  getCachedLocation,
  DetectedLocation,
  subscribeToLocation,
  searchLocationOnline,
  setManualLocation,
} from "../services/locationService";
import { saveGrievanceToFirestore } from "../lib/firebase";

interface VoiceComplaintOfficerProps {
  currentUser: UserProfile | null;
  onAddGrievance: (grievance: Grievance) => void;
  onTrackGrievance: (grievance: Grievance) => void;
  onNavigateToFeed: () => void;
  currentLanguage: LanguageOption;
  t: Translations;
  currentDistrict?: string;
  onOpenReportModal?: (prefill?: {
    description?: string;
    title?: string;
    category?: CivicCategory;
    locality?: string;
    ward?: string;
    district?: string;
  }) => void;
}

interface ConversationTurn {
  speaker: "citizen" | "officer";
  text: string;
  time: string;
  categoryBadge?: string;
}

interface ExtractedVoiceData {
  extractedProblem: string;
  extractedCategory: CivicCategory | string;
  extractedLocality: string;
  extractedWard: string;
  extractedDistrict: string;
  severityScore: number;
  assignedDepartment: string;
  targetSlaHours: number;
  suggestedTitle: string;
  voiceReply: string;
  isReadyToSubmit: boolean;
  fullCitizenSpeech: string;
  detectedIntent?: "confirm_submit" | "cancel_retry" | "new_grievance" | "no_civic_issue" | "unclear";
  hasValidCivicIssue?: boolean;
  detectedLanguage?: string;
  detectedLanguageName?: string;
  detectedLanguageCode?: string;
}

const SUPPORTED_VOICE_LANGUAGES = [
  { code: "hi-IN", name: "हिन्दी (Hindi)", flag: "🇮🇳", sample: "वार्ड 27 में सड़क पर गहरा गड्ढा है, गाड़ियां गिर रही हैं तुरंत ठीक कराएं।" },
  { code: "en-IN", name: "English (India)", flag: "🇮🇳", sample: "Drinking water pipeline burst and leaking clean water on main road in Dhar." },
  { code: "mr-IN", name: "मराठी (Marathi)", flag: "🇮🇳", sample: "रस्त्यावर कचऱ्याचा मोठा ढीग साचला आहे, दुर्गंधी येत आहे." },
  { code: "gu-IN", name: "ગુજરાતી (Gujarati)", flag: "🇮🇳", sample: "શેરીમાં સ્ટ્રીટ લાઈટ બંધ છે અને અંધારું છે." },
  { code: "bn-IN", name: "বাংলা (Bengali)", flag: "🇮🇳", sample: "রাস্তার ড্রেন উপচে জল জমে গেছে, মশার উপদ্রব।" },
  { code: "ta-IN", name: "தமிழ் (Tamil)", flag: "🇮🇳", sample: "தெருவில் கழிவுநீர் தேங்கி நிற்கிறது, துர்நாற்றம் வீசுகிறது." },
  { code: "te-IN", name: "తెలుగు (Telugu)", flag: "🇮🇳", sample: "తాగునీటి పైపులైన్ పగిలి రోడ్డుపై నీరు ప్రవహిస్తోంది." },
  { code: "kn-IN", name: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳", sample: "ರಸ್ತೆಯಲ್ಲಿ ಕಸದ ರಾಶಿ ಬಿದ್ದಿದೆ, ದುರ್ವಾಸನೆ ಬರುತ್ತಿದೆ." },
];

// Rich pictorial category metadata for low-literacy / illiterate comprehension
const CATEGORY_VISUALS: Record<
  string,
  {
    icon: string;
    hindiName: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    imgIllustration: string;
    description: string;
  }
> = {
  "Roads & Potholes": {
    icon: "🛣️",
    hindiName: "सड़क व गड्ढा (Road Pothole)",
    bgColor: "bg-orange-500/15 dark:bg-orange-500/25",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-500/40",
    imgIllustration: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    description: "सड़क टूटी होना, गड्ढे, डामर उखड़ना",
  },
  "Garbage & Sanitation": {
    icon: "🗑️",
    hindiName: "कचरा व सफाई (Garbage & Waste)",
    bgColor: "bg-emerald-500/15 dark:bg-emerald-500/25",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/40",
    imgIllustration: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
    description: "कचरे का ढेर, बदबू, डस्टबिन ओवरफ्लो",
  },
  "Drinking Water & Pipeline Leakage": {
    icon: "💧",
    hindiName: "पीने का पानी व लीकेज (Drinking Water)",
    bgColor: "bg-blue-500/15 dark:bg-blue-500/25",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/40",
    imgIllustration: "https://images.unsplash.com/photo-1583542225715-473a32c9b0ef?w=600&auto=format&fit=crop&q=80",
    description: "पानी की पाइपलाइन फूटना, गंदा पानी आना",
  },
  "Electricity Hazard & Wiring": {
    icon: "⚡",
    hindiName: "बिजली तार व ट्रांसफार्मर (Electricity & Pole)",
    bgColor: "bg-amber-500/15 dark:bg-amber-500/25",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500/40",
    imgIllustration: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80",
    description: "तार लटकना, स्पार्किंग, बिजली का खंभा टूटना",
  },
  "Sewage & Drain Overflow": {
    icon: "🌊",
    hindiName: "गटर व नाली का पानी (Sewage & Drain)",
    bgColor: "bg-purple-500/15 dark:bg-purple-500/25",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-500/40",
    imgIllustration: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=600&auto=format&fit=crop&q=80",
    description: "नाली जाम, गंदा पानी सड़क पर बहना",
  },
  "Streetlight Breakdown": {
    icon: "💡",
    hindiName: "स्ट्रीट लाइट बंद होना (Streetlight Dark Spot)",
    bgColor: "bg-yellow-500/15 dark:bg-yellow-500/25",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-500/40",
    imgIllustration: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    description: "स्ट्रीट लाइट बंद, सड़क पर अंधेरा होना",
  },
  "Public Health & Fogging": {
    icon: "🦟",
    hindiName: "मच्छर, डेंगू व दवाई छिड़काव (Public Health)",
    bgColor: "bg-rose-500/15 dark:bg-rose-500/25",
    textColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-500/40",
    imgIllustration: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&auto=format&fit=crop&q=80",
    description: "मच्छरों का प्रकोप, फॉगिंग स्प्रे की जरूरत",
  },
  "Illegal Encroachments": {
    icon: "🚧",
    hindiName: "अवैध अतिक्रमण व फुटपाथ ब्लॉक (Encroachments)",
    bgColor: "bg-slate-500/15 dark:bg-slate-500/25",
    textColor: "text-slate-700 dark:text-slate-300",
    borderColor: "border-slate-500/40",
    imgIllustration: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80",
    description: "रास्ते पर अवैध कब्जा, फुटपाथ अवरुद्ध",
  },
  "Other": {
    icon: "📋",
    hindiName: "अन्य नागरिक समस्या (Other Civic Issue)",
    bgColor: "bg-indigo-500/15 dark:bg-indigo-500/25",
    textColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-500/40",
    imgIllustration: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
    description: "अन्य कोई नागरिक या सार्वजनिक समस्या",
  },
};

// Affirmative voice command patterns across Indian languages
const AFFIRMATIVE_VOICE_REGEX =
  /\b(haan|ha|haa|haji|haanji|kar do|kardo|darj karo|darj|sahi hai|theek hai|thik hai|yes|yep|yeah|submit|confirm|okay|ok|file it|proceed|go ahead|kardo bhai|ho|hoya|haam|avunu|haudu|darj kar do|done)\b|^(हाँ|हाँजी|हाँ जी|दर्ज करो|दर्ज कर दो|कर दो|कर दीजिए|ठीक है|सही है|हो|हो करा|नोंदवा|હા|બરાબર|হ্যাঁ|জমা দিন|ஆம்|அவுను|ಹೌದು)/i;

const NEGATIVE_VOICE_REGEX =
  /\b(nahin|nahi|no|cancel|badlo|change|ruko|na|roko|ruk)\b|^(ना|नहीं|नको|না|வேண்டாம்|వద్దు|ಬೇಡ)/i;

export const VoiceComplaintOfficer: React.FC<VoiceComplaintOfficerProps> = ({
  currentUser,
  onAddGrievance,
  onTrackGrievance,
  onNavigateToFeed,
  currentLanguage,
  t,
  currentDistrict = "Dhar",
  onOpenReportModal,
}) => {
  // Active Speech Recognition language
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<string>(() => {
    if (currentLanguage.code === "hi") return "hi-IN";
    if (currentLanguage.code === "mr") return "mr-IN";
    if (currentLanguage.code === "gu") return "gu-IN";
    if (currentLanguage.code === "bn") return "bn-IN";
    if (currentLanguage.code === "ta") return "ta-IN";
    if (currentLanguage.code === "te") return "te-IN";
    if (currentLanguage.code === "kn") return "kn-IN";
    return "hi-IN";
  });

  // IVR Call State: "idle" | "greeting" | "listening" | "processing" | "awaiting_confirmation" | "submitted"
  const [sessionState, setSessionState] = useState<
    "idle" | "greeting" | "listening" | "processing" | "awaiting_confirmation" | "submitted"
  >("idle");

  // Recognition state
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [accumulatedSpeech, setAccumulatedSpeech] = useState("");
  const [manualInputText, setManualInputText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isCommandListening, setIsCommandListening] = useState(false);

  // Audio Voice Synth Out
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Call duration counter
  const [callDuration, setCallDuration] = useState(0);

  // Conversation history (1 complaint per session)
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);

  // Live Structured Extraction (Single Complaint Focus)
  const [extractedData, setExtractedData] = useState<ExtractedVoiceData | null>(null);
  const [submittedGrievance, setSubmittedGrievance] = useState<Grievance | null>(null);
  const [isEditingReport, setIsEditingReport] = useState(false);

  const ALL_CIVIC_CATEGORIES: CivicCategory[] = [
    "Roads & Potholes",
    "Garbage & Sanitation",
    "Drinking Water & Pipeline Leakage",
    "Electricity Hazard & Wiring",
    "Sewage & Drain Overflow",
    "Streetlight Breakdown",
    "Public Health & Fogging",
    "Illegal Encroachments",
  ];

  const handleCategoryChange = (newCat: CivicCategory) => {
    if (!extractedData) return;
    const catMap: Record<string, { dept: string; sla: number; severity: number }> = {
      "Roads & Potholes": { dept: "Public Works Department (PWD / Roads Wing)", sla: 48, severity: 8 },
      "Garbage & Sanitation": { dept: "Swachh Bharat Mission & Solid Waste Management Cell", sla: 24, severity: 7 },
      "Drinking Water & Pipeline Leakage": { dept: "PHED / Municipal Potable Water Division", sla: 24, severity: 8 },
      "Electricity Hazard & Wiring": { dept: "Electricity Board (MPPKVVCL) & Safety Wing", sla: 24, severity: 9 },
      "Sewage & Drain Overflow": { dept: "Municipal Drainage & Stormwater Division", sla: 48, severity: 8 },
      "Streetlight Breakdown": { dept: "Municipal Public Streetlighting Cell", sla: 48, severity: 6 },
      "Public Health & Fogging": { dept: "District Vector-borne Disease & Health Wing", sla: 24, severity: 7 },
      "Illegal Encroachments": { dept: "Municipal Anti-Encroachment & Town Planning Wing", sla: 72, severity: 6 },
    };
    const info = catMap[newCat] || { dept: "Municipal Administration Wing", sla: 48, severity: 7 };
    setExtractedData({
      ...extractedData,
      extractedCategory: newCat,
      assignedDepartment: info.dept,
      targetSlaHours: info.sla,
      severityScore: info.severity,
    });
  };

  const handleLocalityChange = (newLocality: string) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, extractedLocality: newLocality });
  };

  const handleProblemChange = (newText: string) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, suggestedTitle: newText, extractedProblem: newText });
  };

  // Audio equalizer bars animation
  const [audioBars, setAudioBars] = useState<number[]>([20, 45, 80, 60, 30, 70, 90, 40, 65, 85, 30, 50]);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAwaitingConfirmationRef = useRef(false);
  const extractedDataRef = useRef<ExtractedVoiceData | null>(null);

  // 3-second Idle Auto-Off and Auto-Process timers
  const accumulatedSpeechRef = useRef("");
  const liveTranscriptRef = useRef("");
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [idleCountdown, setIdleCountdown] = useState<number>(3.0);
  const [idleNotice, setIdleNotice] = useState<string | null>(null);

  // Audio source ref for Gemini TTS PCM player
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Live Geolocation state
  const [detectedLoc, setDetectedLoc] = useState<DetectedLocation>(() => getCachedLocation());
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Manual Location Search State
  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);
  const [manualLocationQuery, setManualLocationQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<
    Array<{
      displayName: string;
      locality: string;
      ward: string;
      city: string;
      district: string;
      state: string;
      lat: number;
      lng: number;
    }>
  >([]);

  useEffect(() => {
    // Subscribe to location updates
    const unsubscribe = subscribeToLocation((loc) => {
      setDetectedLoc(loc);
    });

    // Auto-detect on mount
    setIsDetectingLocation(true);
    detectCurrentLocation()
      .then((loc) => {
        setDetectedLoc(loc);
        if (loc.status === "denied") {
          setLocationNotice("⚠️ GPS permission denied. You can search or select your location manually.");
        } else if (loc.status === "unavailable") {
          setLocationNotice("⚠️ GPS signal unavailable. Please select your location manually.");
        }
      })
      .finally(() => {
        setIsDetectingLocation(false);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSearchLocationOnline = async (q: string) => {
    setManualLocationQuery(q);
    if (!q || q.trim().length < 2) {
      setLocationSearchResults([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const results = await searchLocationOnline(q);
      setLocationSearchResults(results);
    } catch (e) {
      console.warn("Location search failed:", e);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectLocationResult = (item: (typeof locationSearchResults)[0]) => {
    const newLoc = setManualLocation({
      district: item.district,
      state: item.state,
      ward: item.ward,
      locality: item.locality,
      formattedAddress: item.displayName,
      coordinates: { lat: item.lat, lng: item.lng },
    });
    setDetectedLoc(newLoc);
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        extractedLocality: item.locality || item.ward,
        extractedWard: item.ward,
      });
    }
    setShowLocationSearchModal(false);
    setManualLocationQuery("");
    setLocationSearchResults([]);
    setLocationNotice(`📍 Location set to ${item.locality}, ${item.district}`);
    setTimeout(() => setLocationNotice(null), 4000);
  };

  // Keep refs synchronized
  useEffect(() => {
    isAwaitingConfirmationRef.current = sessionState === "awaiting_confirmation";
  }, [sessionState]);

  useEffect(() => {
    extractedDataRef.current = extractedData;
  }, [extractedData]);

  useEffect(() => {
    accumulatedSpeechRef.current = accumulatedSpeech;
  }, [accumulatedSpeech]);

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  // Call duration ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (sessionState !== "idle" && sessionState !== "submitted") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionState]);

  // Equalizer animation effect when speaking or listening
  useEffect(() => {
    if (isSpeaking || isListening) {
      const eqInterval = setInterval(() => {
        setAudioBars((prev) =>
          prev.map(() => Math.floor(15 + Math.random() * (isSpeaking ? 75 : 55)))
        );
      }, 120);
      return () => clearInterval(eqInterval);
    } else {
      setAudioBars([15, 20, 15, 25, 15, 20, 15, 25, 15, 20, 15, 20]);
    }
  }, [isSpeaking, isListening]);

  // Sound chimes for illiterate accessibility feedback
  const playChime = useCallback((type: "start" | "success" | "command_heard" | "processing") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "start") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.21);
      } else if (type === "command_heard") {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (type === "success") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(freq, now + idx * 0.08);
          g.gain.setValueAtTime(0.15, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          o.start(now + idx * 0.08);
          o.stop(now + idx * 0.08 + 0.36);
        });
      }
    } catch {
      // AudioContext not permitted yet
    }
  }, []);

  // Play PCM 24kHz Base64 audio from Gemini TTS
  const playPcmAudio = useCallback((base64Data: string, sampleRate = 24000): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pcm16 = new Int16Array(bytes.buffer);
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          reject(new Error("AudioContext not supported"));
          return;
        }
        const audioCtx = new AudioCtx({ sampleRate });
        const buffer = audioCtx.createBuffer(1, pcm16.length, sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < pcm16.length; i++) {
          channelData[i] = pcm16[i] / 32768.0;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        activeAudioSourceRef.current = source;
        source.onended = () => {
          activeAudioSourceRef.current = null;
          resolve();
        };
        source.start();
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  // Start Listening specifically for Voice Confirmation Command ("हाँ" / "Yes")
  const startListeningForVoiceCommand = useCallback(() => {
    isAwaitingConfirmationRef.current = true;
    setIsCommandListening(true);
    setIsListening(true);
    setSessionState("awaiting_confirmation");
    setLiveTranscript("");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedVoiceLang;
        recognitionRef.current.start();
      } catch {
        // already active
      }
    }
  }, [selectedVoiceLang]);

  // Text-To-Speech Playback (Gemini AI Neural Voice + Browser Fallback)
  const speakText = useCallback(
    async (
      textToSpeak: string,
      langCode: string = selectedVoiceLang,
      autoArmAction?: "listen_problem" | "listen_confirmation"
    ) => {
      if (isMuted) {
        if (autoArmAction === "listen_confirmation") {
          setTimeout(() => startListeningForVoiceCommand(), 800);
        } else if (autoArmAction === "listen_problem") {
          setTimeout(() => startListening(), 800);
        }
        return;
      }

      // Stop any existing speech synthesis or active audio node
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (activeAudioSourceRef.current) {
        try {
          activeAudioSourceRef.current.stop();
        } catch {
          // ignore
        }
      }

      setIsSpeaking(true);

      // Attempt Gemini Neural TTS first
      let playedWithGemini = false;
      try {
        const res = await fetch("/api/gemini/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToSpeak, voiceName: "Kore" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.audioBase64) {
            await playPcmAudio(data.audioBase64, data.sampleRate || 24000);
            playedWithGemini = true;
          }
        }
      } catch (err) {
        console.warn("Gemini TTS playback fallback to Web Speech:", err);
      }

      if (!playedWithGemini) {
        // Fallback to browser Web Speech API
        if (window.speechSynthesis) {
          try {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = langCode;
            utterance.rate = 0.95;
            utterance.pitch = 1.05;

            const voices = window.speechSynthesis.getVoices();
            const targetVoice = voices.find(
              (v) =>
                v.lang.replace("_", "-").startsWith(langCode.slice(0, 2)) ||
                v.name.includes("India") ||
                v.name.includes("Hindi")
            );
            if (targetVoice) {
              utterance.voice = targetVoice;
            }

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
              setIsSpeaking(false);
              if (autoArmAction === "listen_confirmation") {
                startListeningForVoiceCommand();
              } else if (autoArmAction === "listen_problem") {
                startListening();
              }
            };
            utterance.onerror = () => {
              setIsSpeaking(false);
              if (autoArmAction === "listen_confirmation") {
                startListeningForVoiceCommand();
              } else if (autoArmAction === "listen_problem") {
                startListening();
              }
            };

            window.speechSynthesis.speak(utterance);
            return;
          } catch (err) {
            console.warn("Browser speech error:", err);
          }
        }
      }

      setIsSpeaking(false);
      if (autoArmAction === "listen_confirmation") {
        startListeningForVoiceCommand();
      } else if (autoArmAction === "listen_problem") {
        startListening();
      }
    },
    [isMuted, playPcmAudio, selectedVoiceLang, startListeningForVoiceCommand]
  );

  // Auto Voice Command Submission Handler (No Clicks Needed)
  const executeVoiceSubmission = useCallback(
    (dataToSubmit?: ExtractedVoiceData) => {
      const data = dataToSubmit || extractedDataRef.current;
      if (!data) return;

      playChime("command_heard");
      setTimeout(() => playChime("success"), 250);

      const tokenNumber = `JV-VOICE-${currentDistrict.slice(0, 3).toUpperCase()}-2026-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const newGrievance: Grievance = {
        id: `g-voice-${Date.now()}`,
        token: tokenNumber,
        title: data.suggestedTitle || data.extractedProblem,
        description: `[Voice Intake Record via JanVani AI IVR Assistant - Single Complaint Flow]\nSpoken Transcript: "${
          data.fullCitizenSpeech || accumulatedSpeech
        }"\nIdentified Defect: ${data.extractedProblem}\nLocality: ${data.extractedLocality || detectedLoc.locality}`,
        category: (data.extractedCategory as any) || "Roads & Potholes",
        status: "Submitted & Token Issued",
        severityScore: data.severityScore || 8,
        targetSlaHours: data.targetSlaHours || 48,
        slaRemainingHours: data.targetSlaHours || 48,
        dateFiled: "Today, Just now",
        district: data.extractedDistrict || detectedLoc.district || currentDistrict,
        state: detectedLoc.state || "Madhya Pradesh",
        stateCode: detectedLoc.stateCode || "MP",
        ward: data.extractedWard || detectedLoc.ward || currentUser?.ward || "Ward 12 (Central Zone)",
        locality: data.extractedLocality || detectedLoc.formattedAddress || `${detectedLoc.locality}, ${detectedLoc.district}`,
        assignedNodal: "Er. Rajesh Sharma",
        assignedOfficerTitle: "Assistant Engineer (Public Works)",
        assignedOfficerPhone: "+91 98260 12345",
        filedByName: currentUser?.name || "Citizen (Voice Reported)",
        filedByAadhaar: "XXXX-XXXX-9120",
        department: data.assignedDepartment,
        imageUrl:
          CATEGORY_VISUALS[data.extractedCategory]?.imgIllustration ||
          "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
        geoCoords: detectedLoc.coordinates ? { x: 50, y: 50, lat: detectedLoc.coordinates.lat, lng: detectedLoc.coordinates.lng } : undefined,
        upvotes: 1,
        hasUpvoted: true,
        timeline: [
          {
            title: "Voice Grievance Registered (आवाज़ द्वारा दर्ज)",
            description: `Auto-ingested via JanVani AI IVR Assistant with Live Location (${detectedLoc.locality || "Current Location"}). Token #${tokenNumber} issued without manual forms.`,
            timestamp: "Just now",
            status: "completed",
            officerOrEntity: "JanVani Voice Officer AI",
            verifiedBadge: "AI Voice & Geo-Verified",
          },
          {
            title: "Auto-Assigned to Department Nodal",
            description: `Auto-routed to ${data.assignedDepartment} under ${data.targetSlaHours || 48}h SLA guarantee.`,
            timestamp: "In Queue",
            status: "current",
            officerOrEntity: "Er. Rajesh Sharma (Assistant Engineer)",
          },
        ],
      };

      onAddGrievance(newGrievance);
      setSubmittedGrievance(newGrievance);

      // Persist to Cloud Firestore
      saveGrievanceToFirestore(newGrievance).catch((err) => {
        console.warn("Firestore voice grievance save warning:", err);
      });

      setSessionState("submitted");
      setIsCommandListening(false);
      setIsListening(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.55 },
        colors: ["#FF6A00", "#FF8A00", "#20C997", "#3B82F6", "#FFD700"],
      });

      const completionVoice = selectedVoiceLang.startsWith("hi")
        ? `बधाई हो! आपकी शिकायत टोकन नंबर ${tokenNumber} के साथ अपने आप दर्ज हो गई है। ${data.assignedDepartment} को समाधान आदेश भेज दिया गया है। धन्यवाद!`
        : `Congratulations! Your complaint is registered with Token ${tokenNumber}. Work order issued to ${data.assignedDepartment}. Thank you!`;

      speakText(completionVoice);
    },
    [accumulatedSpeech, currentDistrict, currentUser, onAddGrievance, playChime, selectedVoiceLang, speakText]
  );

  // Stop Mic Listening & Process Voice Automatically with Gemini
  const stopListeningAndProcess = useCallback(
    async (textOverride?: string) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);

      const fullSpoken = (
        textOverride !== undefined
          ? textOverride
          : (accumulatedSpeechRef.current + " " + liveTranscriptRef.current)
      ).trim();

      // If user stopped voice without speaking anything: provide courteous audible AI reply
      if (!fullSpoken) {
        setSessionState("idle");
        const offReply = selectedVoiceLang.startsWith("hi")
          ? "आपने आवाज़ बंद की है। जब भी आप तैयार हों, माइक दबाकर अपनी नगर निगम समस्या बताएं। मैं आपकी शिकायत दर्ज करने के लिए उपस्थित हूँ।"
          : selectedVoiceLang.startsWith("mr")
          ? "तुम्ही माइक बंद केला आहे. जेव्हा तुम्ही तयार असाल, माइक सुरू करा आणि आपली नागरी समस्या सांगा. जनवाणी आपल्या सेवेसाठी सदैव तत्पर आहे."
          : selectedVoiceLang.startsWith("bn")
          ? "আপনি মাইক বন্ধ করেছেন। প্রস্তুত হলে মাইক চালু করে আপনার পৌর সমস্যা জানান।"
          : selectedVoiceLang.startsWith("ta")
          ? "நீங்கள் மைக்ரோஃபோனை முடக்கியுள்ளீர்கள். தயாராக இருக்கும்போது மீண்டும் பேசி புகாரைப் பதிவு செய்யவும்."
          : selectedVoiceLang.startsWith("gu")
          ? "તમે માઈક બંધ કર્યું છે. જ્યારે પણ તમે તૈયાર હોવ, માઈક ચાલુ કરીને તમારી સમસ્યા જણાવો."
          : "You turned off the microphone. Whenever you are ready, tap the mic and describe your municipal grievance; I am ready to help.";

        setConversation((prev) => [
          ...prev,
          {
            speaker: "officer",
            text: offReply,
            time: "Just now",
          },
        ]);
        setIdleNotice(
          selectedVoiceLang.startsWith("hi")
            ? "माइक बंद किया गया • अधिकारी का उत्तर सुनें"
            : "Voice stopped • Officer replied"
        );
        speakText(offReply, selectedVoiceLang);
        return;
      }

      setSessionState("processing");

      // Add citizen turn to conversation
      const newCitizenTurn: ConversationTurn = {
        speaker: "citizen",
        text: fullSpoken,
        time: "Just now",
      };
      setConversation((prev) => [...prev, newCitizenTurn]);

      try {
        const activeLangObj = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === selectedVoiceLang);
        const res = await fetch("/api/gemini/voice-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spokenTranscript: fullSpoken,
            language: selectedVoiceLang,
            languageName: activeLangObj?.name || "Hindi",
            conversationHistory: conversation.map((c) => ({
              role: c.speaker === "citizen" ? "user" : "model",
              text: c.text,
            })),
            currentUserLocation: detectedLoc.formattedAddress || `${detectedLoc.locality}, ${detectedLoc.district}`,
            currentUserDistrict: detectedLoc.district || currentDistrict,
            currentUserWard: detectedLoc.ward || currentUser?.ward || "Ward 12 (Central Zone)",
            currentStage: "listening",
          }),
        });

        const data: ExtractedVoiceData = await res.json();

        // 1. Language auto-detect: switch voice language if detected
        if (data.detectedLanguageCode && data.detectedLanguageCode !== selectedVoiceLang) {
          setSelectedVoiceLang(data.detectedLanguageCode);
        }

        // 2. Reject non-actionable speech / no civic issue (do not create fake report!)
        if (data.hasValidCivicIssue === false || !data.isReadyToSubmit) {
          setExtractedData(null);
          setSessionState("idle");
          const activeCode = data.detectedLanguageCode || selectedVoiceLang;
          const promptReply = data.voiceReply || (
            activeCode.startsWith("hi")
              ? "नमस्ते! कृपया अपनी नगर निगम समस्या (जैसे सड़क का गड्ढा, कचरा, पानी की लीकेज) और अपना क्षेत्र बताएं।"
              : activeCode.startsWith("mr")
              ? "नमस्कार! कृपया आपली नागरी समस्या (जसे खड्डा, कचरा, पाण्याची गळती) आणि ठिकाण सांगा."
              : "Hello! Please describe your municipal issue (such as a road pothole, garbage, or water leak) along with your location."
          );

          setConversation((prev) => [
            ...prev,
            {
              speaker: "officer",
              text: promptReply,
              time: "Just now",
            },
          ]);

          speakText(promptReply, activeCode, "listen_problem");
          return;
        }

        setExtractedData(data);
        setIsEditingReport(false);

        // Check if citizen said YES directly during input
        if (data.detectedIntent === "confirm_submit" && extractedDataRef.current) {
          executeVoiceSubmission(extractedDataRef.current);
          return;
        }

        // Category visual helper
        const visual = CATEGORY_VISUALS[data.extractedCategory] || CATEGORY_VISUALS["Roads & Potholes"];

        // Formulate spoken officer reply with explicit instruction to say "हाँ" / "Yes"
        const officerReply =
          data.voiceReply ||
          `मैंने आपकी समस्या समझ ली है: ${data.extractedLocality || detectedLoc.locality} में ${visual.hindiName}। क्या मैं इसे दर्ज कर दूँ? बोलें 'हाँ' या 'नहीं'।`;

        setConversation((prev) => [
          ...prev,
          {
            speaker: "officer",
            text: officerReply,
            time: "Just now",
            categoryBadge: data.extractedCategory,
          },
        ]);

        setSessionState("awaiting_confirmation");

        // Speak aloud to citizen and AUTOMATICALLY open the microphone to listen for "हाँ / YES"
        speakText(officerReply, data.detectedLanguageCode || selectedVoiceLang, "listen_confirmation");
      } catch (err) {
        console.warn("Voice processing fallback:", err);
        // If the speech was short or conversational greeting, don't generate random report
        const isCasual = /^(hello|hi|hey|namaste|test|kaise|who|good morning|kya|123|one two)/i.test(fullSpoken) && fullSpoken.length < 25;
        if (isCasual) {
          setExtractedData(null);
          setSessionState("idle");
          const reply = selectedVoiceLang.startsWith("hi")
            ? "नमस्ते! कृपया अपनी नगर पालिका की समस्या और क्षेत्र बताएं।"
            : "Hello! Please tell me about your municipal issue and location.";
          setConversation((prev) => [
            ...prev,
            { speaker: "officer", text: reply, time: "Just now" },
          ]);
          speakText(reply, selectedVoiceLang, "listen_problem");
          return;
        }

        // Fast smart fallback
        const fallbackCat = /water|pipe|pani|nal/i.test(fullSpoken)
          ? "Drinking Water & Pipeline Leakage"
          : /garbage|trash|kachra|safai/i.test(fullSpoken)
          ? "Garbage & Sanitation"
          : /electric|bijli|wire|light/i.test(fullSpoken)
          ? "Electricity Hazard & Wiring"
          : "Roads & Potholes";

        const fallback: ExtractedVoiceData = {
          extractedProblem: fullSpoken.slice(0, 60),
          extractedCategory: fallbackCat,
          extractedLocality: detectedLoc.locality || detectedLoc.road || "Local Area",
          extractedWard: detectedLoc.ward || currentUser?.ward || "Ward 12",
          extractedDistrict: detectedLoc.district || currentDistrict,
          severityScore: 8,
          assignedDepartment: "Public Works & Municipal Services",
          targetSlaHours: 48,
          suggestedTitle: fullSpoken.slice(0, 50),
          voiceReply: `मैंने आपकी समस्या नोट कर ली है: ${fallbackCat}। क्या इसे दर्ज करें? बोलें 'हाँ'।`,
          isReadyToSubmit: true,
          fullCitizenSpeech: fullSpoken,
          detectedIntent: "new_grievance",
        };

        setExtractedData(fallback);
        setIsEditingReport(false);
        setSessionState("awaiting_confirmation");
        speakText(fallback.voiceReply, selectedVoiceLang, "listen_confirmation");
      }
    },
    [conversation, currentDistrict, currentUser, detectedLoc, executeVoiceSubmission, selectedVoiceLang, speakText]
  );

  // 3-second Idle Timer Controller
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);

    const DURATION = 3000;
    const startTime = Date.now();
    setIdleCountdown(3.0);

    idleIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (DURATION - elapsed) / 1000);
      setIdleCountdown(Number(remaining.toFixed(1)));
      if (remaining <= 0 && idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
      }
    }, 100);

    idleTimerRef.current = setTimeout(() => {
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
      setIdleCountdown(0);

      if (isAwaitingConfirmationRef.current) {
        return;
      }

      const currentText = (accumulatedSpeechRef.current + " " + liveTranscriptRef.current).trim();
      if (currentText.length >= 5) {
        // Spoke a complaint -> automatically stop mic and process!
        stopListeningAndProcess(currentText);
      } else {
        // No speech heard within 3 seconds -> automatically turn off microphone!
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
        }
        setIsListening(false);
        setSessionState("idle");
        setIdleNotice("माइक 3 सेकंड शांत रहने पर स्वतः बंद हुआ (Mic auto-off after 3s idle)");
        setTimeout(() => setIdleNotice(null), 4500);
      }
    }, DURATION);
  }, [stopListeningAndProcess]);

  // Start Mic Listening for citizen problem
  const startListening = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    playChime("start");
    setSessionState("listening");
    setIsListening(true);
    setIsCommandListening(false);
    setLiveTranscript("");
    setIdleNotice(null);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedVoiceLang;
        recognitionRef.current.start();
      } catch {
        // already active
      }
    }

    // Immediately arm 3-second idle countdown on mic toggle start
    resetIdleTimer();
  }, [playChime, resetIdleTimer, selectedVoiceLang]);

  // Initiate IVR Call Assistant (Greets first, then listens)
  const initiateIvrCall = useCallback(async () => {
    setSessionState("greeting");
    setIsListening(false);
    setIsCommandListening(false);
    setLiveTranscript("");
    setAccumulatedSpeech("");
    setExtractedData(null);
    setSubmittedGrievance(null);
    setCallDuration(0);

    const activeLangObj = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === selectedVoiceLang);
    let greetingText =
      selectedVoiceLang.startsWith("hi")
        ? `नमस्ते! जनवाणी आवाज़ सेवा में आपका स्वागत है। मैं आपका AI सहायता अधिकारी हूँ। कृपया बताइए, मैं आपकी क्या सहायता कर सकता हूँ? अपनी समस्या और स्थान बोलें।`
        : `Namaste! Welcome to JanVani Voice Helpline for ${currentDistrict}. I am your AI Civic Assistant. How can I help you today? Please tell me your complaint and location.`;

    try {
      const res = await fetch("/api/gemini/ivr-greeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedVoiceLang,
          languageName: activeLangObj?.name || "Hindi",
          district: currentDistrict,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.greeting) greetingText = data.greeting;
      }
    } catch {
      // ignore
    }

    setConversation([
      {
        speaker: "officer",
        text: greetingText,
        time: "Just now",
      },
    ]);

    // AI Officer speaks the greeting, then automatically arms the microphone to listen!
    speakText(greetingText, selectedVoiceLang, "listen_problem");
  }, [currentDistrict, selectedVoiceLang, speakText]);

  // Manual Stop Voice & Immediate AI Reply Handler
  const handleManualStopVoiceAndReply = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setIsCommandListening(false);

    const currentText = (accumulatedSpeechRef.current + " " + liveTranscriptRef.current).trim();
    // Stop listening and immediately trigger the AI reply (handles both spoken text and manual empty stop)
    stopListeningAndProcess(currentText);
  }, [stopListeningAndProcess]);

  // Toggle Microphone On / Off
  const toggleMic = useCallback(() => {
    if (sessionState === "idle") {
      initiateIvrCall();
    } else if (sessionState === "awaiting_confirmation") {
      executeVoiceSubmission();
    } else if (isListening) {
      // Toggle OFF -> Immediately process and reply!
      handleManualStopVoiceAndReply();
    } else {
      // Toggle ON
      startListening();
    }
  }, [executeVoiceSubmission, handleManualStopVoiceAndReply, initiateIvrCall, isListening, sessionState, startListening]);

  // Initialize Speech Recognition Engine
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedVoiceLang;

    recognition.onresult = (event: any) => {
      let currentFinal = "";
      let currentInterim = "";
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript + " ";
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      const heardText = (currentInterim || currentFinal).trim();

      // Check if we are in Confirmation Command Listening Mode (Awaiting YES / NO Voice Command)
      if (isAwaitingConfirmationRef.current) {
        setLiveTranscript(heardText);
        liveTranscriptRef.current = heardText;

        if (AFFIRMATIVE_VOICE_REGEX.test(heardText)) {
          // CITIZEN SPOKE "हाँ" / "YES" / "SUBMIT" -> SUBMIT AUTOMATICALLY!
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
          executeVoiceSubmission();
          return;
        } else if (NEGATIVE_VOICE_REGEX.test(heardText)) {
          // CITIZEN SPOKE "नहीं" / "NO" / "CANCEL" -> RESET AND LISTEN AGAIN
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
          setSessionState("idle");
          setIsCommandListening(false);
          const retryVoice = selectedVoiceLang.startsWith("hi")
            ? `कोई बात नहीं! कृपया अपनी समस्या दोबारा बोलें...`
            : `No problem! Please speak your complaint again...`;
          speakText(retryVoice, selectedVoiceLang, "listen_problem");
          return;
        }
      }

      const finalTrimmed = currentFinal.trim();
      const interimTrimmed = currentInterim.trim();

      if (finalTrimmed) {
        setAccumulatedSpeech(finalTrimmed);
        accumulatedSpeechRef.current = finalTrimmed;
      }
      setLiveTranscript(interimTrimmed);
      liveTranscriptRef.current = interimTrimmed;

      // RESET 3-SECOND IDLE TIMEOUT ON EVERY SOUND / SPEECH DETECTED
      resetIdleTimer();
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setSpeechSupported(false);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if we are supposed to be listening
      if (isCommandListening || isListening) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [
    selectedVoiceLang,
    executeVoiceSubmission,
    speakText,
    isCommandListening,
    isListening,
    resetIdleTimer,
  ]);

  // Reset Session (Single Complaint per session)
  const handleResetSession = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.stop();
      } catch {
        // ignore
      }
    }
    setSessionState("idle");
    setLiveTranscript("");
    setAccumulatedSpeech("");
    setManualInputText("");
    setIsCommandListening(false);
    setIsListening(false);
    setIsSpeaking(false);
    setExtractedData(null);
    setSubmittedGrievance(null);
    setCallDuration(0);
    setConversation([]);
  };

  // Preset 1-click audio simulation scenarios (Great for quick tests)
  const handleRunSampleScenario = (sampleText: string) => {
    setAccumulatedSpeech(sampleText);
    stopListeningAndProcess(sampleText);
  };

  // Voice Instructions Aloud (For Illiterate Citizens)
  const speakHowToUse = () => {
    const guide = selectedVoiceLang.startsWith("hi")
      ? `जनवाणी आवाज़ सेवा का उपयोग बहुत आसान है: पहला, 'कॉल शुरू करें' दबाएं। AI अधिकारी पूछेगा 'मैं आपकी क्या सहायता कर सकता हूँ?'। दूसरा, अपनी समस्या और स्थान बोलें। तीसरा, जब AI पूछे तो सिर्फ 'हाँ' बोलें, आपकी एक शिकायत तुरंत दर्ज हो जाएगी!`
      : `Using JanVani Voice Helpline is simple: First, tap 'Start AI Call'. The officer will ask how they can help you. Second, speak your civic complaint. Third, just say 'YES' to submit hands-free!`;
    speakText(guide, selectedVoiceLang);
  };

  const activeVisual = extractedData
    ? CATEGORY_VISUALS[extractedData.extractedCategory] || CATEGORY_VISUALS["Roads & Potholes"]
    : null;

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* 1. TOP IVR HELPLINE STATUS HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-orange-50/50 to-amber-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-orange-200 dark:border-orange-500/40 text-slate-900 dark:text-white p-5 sm:p-7 shadow-lg dark:shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-gradient-to-br from-[#FF6A00]/15 to-amber-500/10 dark:from-[#FF6A00]/25 dark:to-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
                <span>24x7 AI Voice Helpline • 1800-JAN-VANI</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>Single Complaint Focus • 1 शिकायत प्रति कॉल</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-medium flex items-center gap-1 shadow-xs">
                <Signal className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Gemini 3.8 Neural IVR</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>AI Voice Complaint Seva (IVR Helpline)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              AI अधिकारी आपसे पूछेगा <strong className="text-amber-700 dark:text-amber-400 font-bold">"मैं आपकी क्या सहायता कर सकता हूँ?"</strong>। अपनी समस्या बोलें और अंत में केवल <strong className="text-emerald-700 dark:text-emerald-400 font-bold">"हाँ"</strong> बोलें!
            </p>
          </div>

          {/* Quick controls: Language Selector + Audio Mute + Voice Help */}
          <div className="flex flex-wrap items-center gap-2 bg-white/90 dark:bg-white/[0.08] backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 dark:border-white/15 shadow-sm">
            <button
              type="button"
              onClick={speakHowToUse}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Hear how to use aloud"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>नियम सुनें (Audio Help)</span>
            </button>

            <select
              value={selectedVoiceLang}
              onChange={(e) => {
                setSelectedVoiceLang(e.target.value);
                if (sessionState !== "idle" && sessionState !== "submitted") {
                  handleResetSession();
                }
              }}
              className="bg-white dark:bg-black/80 border border-slate-300 dark:border-white/25 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#FF6A00] cursor-pointer shadow-xs"
            >
              {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                if (!isMuted && window.speechSynthesis) window.speechSynthesis.cancel();
                setIsMuted(!isMuted);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shadow-xs ${
                isMuted
                  ? "bg-red-50 hover:bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/40"
                  : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40"
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? "Muted" : "Audio On"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN IVR INTERACTION CALL CENTER VIEW */}
      {sessionState !== "submitted" ? (
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
          {/* Active Call Status Bar */}
          <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 relative" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                  {sessionState === "idle"
                    ? "IVR Line Ready (कॉल शुरू करने के लिए तैयार)"
                    : sessionState === "greeting"
                    ? "AI Officer Speaking Greeting (अधिकारी स्वागत कर रहे हैं)"
                    : sessionState === "listening"
                    ? "Listening to your problem (आपकी समस्या सुन रहे हैं)"
                    : sessionState === "processing"
                    ? "AI Analyzing Category & Location (AI विश्लेषण कर रहा है)"
                    : "Awaiting Confirmation 'YES' (हाँ / Yes बोलने की प्रतीक्षा)"}
                </span>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span>District: <strong className="text-slate-900 dark:text-white font-bold">{detectedLoc.district || currentDistrict}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{detectedLoc.locality || detectedLoc.ward || "Live Location Detected"}</span>
                    {detectedLoc.isLiveGps && <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/30 text-[10px] text-emerald-800 dark:text-emerald-200 font-bold">GPS</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetectingLocation(true);
                      detectCurrentLocation(true).finally(() => setIsDetectingLocation(false));
                    }}
                    disabled={isDetectingLocation}
                    className="text-[10px] text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold underline cursor-pointer ml-1"
                    title="Refresh current location"
                  >
                    {isDetectingLocation ? "Detecting..." : "Update GPS"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLocationSearchModal(true)}
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold underline cursor-pointer ml-1 flex items-center gap-0.5"
                    title="Manually search and set location"
                  >
                    <Search className="w-2.5 h-2.5" />
                    <span>Search / Manual</span>
                  </button>
                </div>
                {locationNotice && (
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5 animate-fadeIn font-medium">
                    {locationNotice}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white dark:bg-white/10 text-xs font-mono font-bold text-amber-800 dark:text-amber-300 border border-slate-200 dark:border-transparent flex items-center gap-1.5 shadow-xs">
                <Clock className="w-3 h-3" />
                <span>{formatCallTime(callDuration)}</span>
              </span>

              {sessionState !== "idle" && (
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>End Call</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-8 space-y-6">
            {/* Center Stage: AI Voice Orb & Waveform */}
            <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
              <div className="relative flex items-center justify-center">
                {/* Glowing animation rings */}
                {(isSpeaking || isListening) && (
                  <>
                    <div className="absolute w-36 h-36 rounded-full bg-[#FF6A00]/20 animate-ping opacity-75" />
                    <div className="absolute w-44 h-44 rounded-full bg-amber-500/10 animate-pulse" />
                  </>
                )}

                <button
                  type="button"
                  onClick={toggleMic}
                  className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-2xl ${
                    sessionState === "idle"
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white hover:scale-105 ring-4 ring-emerald-500/30"
                      : sessionState === "listening"
                      ? "bg-gradient-to-tr from-red-600 to-[#FF6A00] text-white ring-8 ring-red-500/40 animate-pulse"
                      : sessionState === "awaiting_confirmation"
                      ? "bg-gradient-to-tr from-emerald-500 to-green-600 text-white ring-8 ring-emerald-500/40 animate-bounce"
                      : sessionState === "processing"
                      ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white ring-6 ring-purple-500/40"
                      : "bg-gradient-to-tr from-[#FF6A00] to-amber-500 text-white ring-6 ring-orange-500/40"
                  }`}
                  title={sessionState === "idle" ? "Start AI Voice Call" : "Toggle Microphone"}
                >
                  {sessionState === "idle" ? (
                    <>
                      <PhoneCall className="w-9 h-9 sm:w-10 sm:h-10 mb-1" />
                      <span className="text-[11px] font-black uppercase tracking-wider">कॉल शुरू करें</span>
                    </>
                  ) : isListening ? (
                    <>
                      <Mic className="w-9 h-9 sm:w-10 sm:h-10 mb-1 animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        {sessionState === "awaiting_confirmation" ? "बोलें 'हाँ'" : "सुन रहे हैं..."}
                      </span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <Volume2 className="w-9 h-9 sm:w-10 sm:h-10 mb-1 animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-wider">AI बोल रहा है</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-9 h-9 sm:w-10 sm:h-10 mb-1 animate-spin" />
                      <span className="text-[11px] font-black uppercase tracking-wider">प्रोसेसिंग...</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Waveform Visualizer */}
              <div className="flex items-center justify-center gap-1.5 h-12 w-full max-w-sm px-4">
                {audioBars.map((height, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-100 ${
                      isSpeaking
                        ? "bg-gradient-to-t from-amber-500 to-[#FF6A00]"
                        : isListening
                        ? "bg-gradient-to-t from-emerald-500 to-teal-400"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>

              {/* 3-Second Idle Countdown Notice Bar */}
              {isListening && (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-300 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                    <span>3 सेकंड शांत रहने पर स्वतः प्रोसेस होगा • Auto-Off Timer: {idleCountdown}s</span>
                  </div>
                  <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF6A00] transition-all duration-100"
                      style={{ width: `${(idleCountdown / 3.0) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {idleNotice && (
                <div className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium animate-fadeIn">
                  ℹ️ {idleNotice}
                </div>
              )}
            </div>

            {/* REAL-TIME LIVE TRANSCRIPTION DISPLAY PANEL */}
            {(isListening || accumulatedSpeech || liveTranscript || sessionState !== "idle") && (
              <div className="w-full rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                {/* Live Header Bar */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {isListening && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                    </span>
                    <span className="font-mono font-bold tracking-wide uppercase text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{isListening ? "🔴 LIVE TRANSCRIBING (रीयल-टाइम आवाज़ रूपांतरण)" : "📝 Live Transcription Record"}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-transparent font-medium text-slate-700 dark:text-slate-300 shadow-xs">
                      {SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === selectedVoiceLang)?.flag}{" "}
                      {SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === selectedVoiceLang)?.name.split(" ")[0]}
                    </span>
                    {(accumulatedSpeech || liveTranscript) && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-mono font-bold text-[10px]">
                        {(accumulatedSpeech + " " + liveTranscript).trim().split(/\s+/).filter(Boolean).length} शब्द (Words)
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Transcription Content Body */}
                <div className="p-4 sm:p-5 min-h-[90px] flex flex-col justify-between space-y-3">
                  <div className="text-sm sm:text-base leading-relaxed break-words">
                    {accumulatedSpeech || liveTranscript ? (
                      <div className="text-slate-900 dark:text-white">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {accumulatedSpeech}
                        </span>
                        {liveTranscript && (
                          <span className="text-sky-700 dark:text-sky-300 font-semibold italic ml-1.5 bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-200/50 dark:border-transparent">
                            {liveTranscript}
                          </span>
                        )}
                        {isListening && (
                          <span className="inline-block w-2 h-4 ml-1.5 bg-sky-600 dark:bg-sky-400 animate-pulse align-middle" />
                        )}
                      </div>
                    ) : isListening ? (
                      <div className="text-slate-500 dark:text-slate-400 italic flex items-center gap-2 text-xs sm:text-sm">
                        <Mic className="w-4 h-4 text-sky-600 dark:text-sky-400 animate-bounce shrink-0" />
                        <span>आपकी आवाज़ सुनी जा रही है... बोलना शुरू करें जैसे: <em className="text-sky-700 dark:text-sky-300 font-semibold">"हमारे वार्ड 12 में सड़क पर गड्ढा है..."</em></span>
                      </div>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400 text-xs text-center py-1">
                        माइक चालू करें या 'कॉल शुरू करें' दबाएं। आपका बोला गया हर शब्द यहाँ रीयल-टाइम में दिखेगा।
                      </div>
                    )}
                  </div>

                  {/* Manual Voice Off & Action Bar */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      {isListening ? (
                        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
                          <span>आवाज़ सक्रिय है • बोलने के बाद नीचे लाल बटन से बंद करें</span>
                        </span>
                      ) : (
                        <span>
                          {sessionState === "processing" ? "AI अधिकारी उत्तर तैयार कर रहा है..." : "माइक बंद करने पर AI अधिकारी तुरंत उत्तर देगा"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isListening && (
                        <button
                          type="button"
                          onClick={handleManualStopVoiceAndReply}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-red-900/20 flex items-center gap-1.5 cursor-pointer"
                          title="Manually turn off voice and receive instant AI reply"
                        >
                          <MicOff className="w-3.5 h-3.5" />
                          <span>आवाज़ बंद करें व उत्तर सुनें (Stop Voice & Reply)</span>
                        </button>
                      )}

                      {(accumulatedSpeech || liveTranscript) && !isListening && sessionState !== "awaiting_confirmation" && sessionState !== "processing" && (
                        <button
                          type="button"
                          onClick={() => stopListeningAndProcess(accumulatedSpeech || liveTranscript)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>उत्तर प्राप्त करें (Reply)</span>
                        </button>
                      )}

                      {(accumulatedSpeech || liveTranscript) && onOpenReportModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenReportModal({
                              description: accumulatedSpeech || liveTranscript,
                              title: (accumulatedSpeech || liveTranscript).slice(0, 60),
                              locality: extractedData.extractedLocality || currentDistrict,
                              category: extractedData.extractedCategory as CivicCategory,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          title="Open Grievance Form with this transcribed voice text"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>फॉर्म में भरें (File Grievance →)</span>
                        </button>
                      )}

                      {(accumulatedSpeech || liveTranscript) && !isListening && (
                        <button
                          type="button"
                          onClick={() => {
                            setAccumulatedSpeech("");
                            setLiveTranscript("");
                            accumulatedSpeechRef.current = "";
                            liveTranscriptRef.current = "";
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                          title="Clear transcript"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>साफ़ करें</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation turns bubble log (AI Officer vs Citizen) */}
            <div className="space-y-3 max-h-80 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/10">
              {conversation.length === 0 ? (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p>कॉल शुरू करने के लिए ऊपर हरे <strong>'कॉल शुरू करें'</strong> बटन पर टैप करें।</p>
                  <p className="text-[11px] text-slate-400 mt-1">Tap 'Start Call' to begin speaking with your AI Civic Officer.</p>
                </div>
              ) : (
                conversation.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${
                      turn.speaker === "citizen" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-md ${
                        turn.speaker === "citizen"
                          ? "bg-blue-600 text-white"
                          : "bg-gradient-to-r from-[#FF6A00] to-amber-500 text-white"
                      }`}
                    >
                      {turn.speaker === "citizen" ? "👤" : "🤖"}
                    </div>
                    <div
                      className={`max-w-md sm:max-w-lg p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm ${
                        turn.speaker === "citizen"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-tl-none"
                      }`}
                    >
                      <div className="font-bold text-[11px] opacity-75 mb-1 flex items-center justify-between gap-2">
                        <span>{turn.speaker === "citizen" ? "आप (Citizen)" : "जनवाणी AI अधिकारी (Officer)"}</span>
                        {turn.categoryBadge && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-300 font-bold text-[10px]">
                            {turn.categoryBadge}
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed">{turn.text}</p>
                    </div>
                  </div>
                ))
              )}

              {/* Live Transcript floating speech bubble */}
              {(liveTranscript || accumulatedSpeech) && isListening && (
                <div className="flex items-start gap-3 flex-row-reverse animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    🎙️
                  </div>
                  <div className="max-w-md p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 text-xs sm:text-sm rounded-tr-none">
                    <span className="text-[10px] font-black uppercase text-blue-500 block mb-0.5">Live Speaking...</span>
                    {accumulatedSpeech} {liveTranscript}
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Details Card when awaiting confirmation */}
            {extractedData && sessionState === "awaiting_confirmation" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-amber-500/10 to-orange-500/10 border-2 border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>AI द्वारा पहचाना गया विवरण</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingReport(!isEditingReport)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-500/30 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingReport ? "सहेजें (Done Editing)" : "विवरण सुधारें (Edit Details)"}</span>
                    </button>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-sm">
                    SLA: {extractedData.targetSlaHours}h Guarantee
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Category - Auto-selected and Editable */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">श्रेणी (Civic Category)</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {isEditingReport ? "चुनें ▾" : "AI Auto-Selected"}
                      </span>
                    </div>
                    {isEditingReport ? (
                      <select
                        value={extractedData.extractedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value as CivicCategory)}
                        className="w-full mt-1 p-1.5 text-xs font-bold rounded-lg border border-emerald-400 bg-emerald-50/50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {ALL_CIVIC_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <strong className="text-slate-900 dark:text-white text-sm block">
                        {extractedData.extractedCategory}
                      </strong>
                    )}
                  </div>

                  {/* Locality - Auto-detected and Editable */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">स्थान (Ward / Locality)</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowLocationSearchModal(true)}
                          className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Search className="w-2.5 h-2.5" />
                          <span>खोजें (Search)</span>
                        </button>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {isEditingReport ? "• सुधारें ✎" : "• Auto"}
                        </span>
                      </div>
                    </div>
                    {isEditingReport ? (
                      <input
                        type="text"
                        value={extractedData.extractedLocality}
                        onChange={(e) => handleLocalityChange(e.target.value)}
                        placeholder="वार्ड / सड़क / लैंडमार्क..."
                        className="w-full mt-1 p-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <strong className="text-slate-900 dark:text-white text-sm block truncate">
                        {extractedData.extractedLocality}
                      </strong>
                    )}
                  </div>

                  {/* Problem Description / Title - Editable */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">समस्या विवरण (Issue Summary)</span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {isEditingReport ? "संपादित करें ✎" : "AI Summary"}
                      </span>
                    </div>
                    {isEditingReport ? (
                      <input
                        type="text"
                        value={extractedData.suggestedTitle || extractedData.extractedProblem}
                        onChange={(e) => handleProblemChange(e.target.value)}
                        placeholder="समस्या का संक्षिप्त विवरण..."
                        className="w-full mt-1 p-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <strong className="text-slate-900 dark:text-white text-sm block">
                        {extractedData.suggestedTitle || extractedData.extractedProblem}
                      </strong>
                    )}
                  </div>

                  {/* Assigned Department */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 sm:col-span-2 shadow-sm">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">संबंधित विभाग (Assigned Department)</span>
                    <strong className="text-slate-900 dark:text-white text-xs sm:text-sm block text-emerald-700 dark:text-emerald-300">
                      {extractedData.assignedDepartment}
                    </strong>
                  </div>
                </div>

                {/* Voice Action Prompt */}
                <div className="p-3 rounded-xl bg-emerald-600 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2 text-center sm:text-left">
                    <Mic className="w-5 h-5 animate-bounce shrink-0" />
                    <span className="text-xs sm:text-sm font-bold">
                      दर्ज करने के लिए माइक में <strong>'हाँ' (YES)</strong> या <strong>'दर्ज करो'</strong> बोलें!
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenReportModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenReportModal({
                            description: extractedData.extractedProblem || accumulatedSpeech || liveTranscript,
                            title: extractedData.suggestedTitle,
                            category: extractedData.extractedCategory as CivicCategory,
                            locality: extractedData.extractedLocality,
                            ward: extractedData.extractedWard,
                            district: extractedData.extractedDistrict,
                          });
                        }}
                        className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                        title="Transfer details directly to full Grievance filing form"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>फॉर्म में खोलें (Open in Form →)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => executeVoiceSubmission()}
                      className="px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black shrink-0 shadow-md cursor-pointer"
                    >
                      हाँ, दर्ज करो (Submit Now)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick 1-Tap Voice Simulation Chips */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
                ⚡ 1-क्लिक टेस्ट समस्या (Quick Audio Simulation Chips):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "🛣️ सड़क का गड्ढा", text: "हमारे वार्ड 27 में मुख्य सड़क पर 2 फीट गहरा गड्ढा है, गाड़ियां दुर्घटनाग्रस्त हो रही हैं तुरंत रिपेयर कराएं।" },
                  { label: "💧 पानी की लीकेज", text: "बागडुन तालाब के पास पीने के पानी की मुख्य पाइपलाइन टूट गई है और 3 दिन से लाखों लीटर साफ पानी बह रहा है।" },
                  { label: "🗑️ कचरे का ढेर", text: "मार्केट के सामने 4 दिन से कचरा पेटी ओवरफ्लो हो रही है, बदबू से बीमारियां फैलने का डर है तुरंत सफाई कराएं।" },
                  { label: "⚡ बिजली तार का खतरा", text: "बिजली के खंभे से लाइव वायर नीचे झूल रहा है और स्पार्किंग हो रही है, बड़ा खतरा हो सकता है।" },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRunSampleScenario(chip.text)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 3. REGISTERED GRIEVANCE RECEIPT CARD (SINGLE COMPLAINT ONLY) */
        submittedGrievance && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-lg">
                  ✅
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                    Complaint Successfully Registered • एक शिकायत दर्ज हुई
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    टोकन जारी: #{submittedGrievance.token}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(submittedGrievance.token);
                    alert(`Token #${submittedGrievance.token} copied to clipboard!`);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer"
                >
                  📋 कॉपी टोकन
                </button>
                <button
                  type="button"
                  onClick={() => onTrackGrievance(submittedGrievance)}
                  className="px-4 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#FF8A00] text-white text-xs font-black transition-all shadow-md cursor-pointer"
                >
                  लाइव ट्रैक करें →
                </button>
              </div>
            </div>

            {/* Structured Complaint Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">शिकायत का विषय</span>
                <p className="font-black text-slate-900 dark:text-white text-sm">{submittedGrievance.title}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">श्रेणी व विभाग</span>
                <p className="font-black text-slate-900 dark:text-white text-sm">{submittedGrievance.category}</p>
                <p className="text-[11px] text-slate-500">{submittedGrievance.department}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">SLA गारंटी व नोडल</span>
                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">⏱️ {submittedGrievance.targetSlaHours} Hours</p>
                <p className="text-[11px] text-slate-500">{submittedGrievance.assignedNodal}</p>
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                लाइव स्टेटस: {submittedGrievance.status}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                आपकी आवाज़ से दर्ज की गई यह शिकायत नगर निगम के संबंधित नोडल अधिकारी को प्रेषित कर दी गई है।
              </p>
            </div>

            {/* Prominent Action to Start Another Complaint */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={onNavigateToFeed}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer text-center"
              >
                ← मुख्य डैशबोर्ड पर जाएं (Back to Feed)
              </button>

              <button
                type="button"
                onClick={handleResetSession}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-black transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>नई शिकायत दर्ज करें (Start New Complaint Call)</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* Manual Location Search Dialog Modal */}
      {showLocationSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  स्थान चुनें या खोजें (Select or Search Location)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLocationSearchModal(false);
                  setManualLocationQuery("");
                  setLocationSearchResults([]);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              अपनी कॉलोनी, मोहल्ला, वार्ड, सड़क या शहर का नाम लिखकर खोजें (Search any landmark, street, colony, ward or city):
            </p>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={manualLocationQuery}
                onChange={(e) => handleSearchLocationOnline(e.target.value)}
                placeholder="उदा. राजवाड़ा इंदौर, कनाट प्लेस दिल्ली, MG रोड..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {isSearchingLocation && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-white/5">
              {locationSearchResults.length === 0 && manualLocationQuery.length >= 2 && !isSearchingLocation && (
                <div className="p-4 text-center text-xs text-slate-400">
                  कोई स्थान नहीं मिला। कृपया दूसरा नाम या शहर लिखकर देखें।
                </div>
              )}
              {locationSearchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectLocationResult(res)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-white/5 transition-all text-xs flex items-start gap-2.5 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {res.locality || res.ward}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {res.district ? `${res.district}, ` : ""}{res.state}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 self-center mr-1">त्वरित चयन:</span>
              {[
                { name: "धार (Dhar, MP)", district: "Dhar", state: "Madhya Pradesh", lat: 22.601, lng: 75.338 },
                { name: "इंदौर (Indore, MP)", district: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
                { name: "भोपाल (Bhopal, MP)", district: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
                { name: "मुंबई (Mumbai, MH)", district: "Mumbai Suburban", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
                { name: "नई दिल्ली (New Delhi)", district: "South Delhi", state: "Delhi (NCT)", lat: 28.6139, lng: 77.209 },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    handleSelectLocationResult({
                      displayName: `${preset.name}`,
                      locality: preset.district,
                      ward: "Central Ward",
                      city: preset.district,
                      district: preset.district,
                      state: preset.state,
                      lat: preset.lat,
                      lng: preset.lng,
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-orange-100 dark:hover:bg-orange-950/30 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
