import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Building2,
  MapPin,
  Flame,
  Droplet,
  Zap,
  Trash2,
  Lightbulb,
  Crosshair,
  Shield,
  Loader2,
  LocateFixed,
  Navigation,
  Check,
  Video,
  Film,
  Play,
  Pause,
  Search,
  HelpCircle,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { Grievance, CivicCategory, UserProfile } from "../types";
import { STATES_DATA, DISTRICTS_DATA_MP, DISTRICTS_DATA_MH } from "../data/initialData";
import {
  getAllOfficialStates,
  getOfficialDistricts,
  getOfficialWards,
} from "../data/jurisdictions";
import { Translations } from "../data/translations";
import { detectCurrentLocation, DetectedLocation, searchLocationOnline, setManualLocation } from "../services/locationService";
import { uploadFileToStorage } from "../lib/firebase";
import { awardNagrikPoints } from "../utils/nagrikPoints";

interface FileGrievanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newGrievance: Grievance) => void;
  currentUser: UserProfile | null;
  t: Translations;
  prefillData?: Partial<{
    title: string;
    description: string;
    category: CivicCategory;
    state: string;
    district: string;
    ward: string;
    locality: string;
    severityScore: number;
    photoUrl?: string;
  }> | null;
}

const CATEGORY_ITEMS: { category: CivicCategory; icon: any; labelKey: keyof Translations }[] = [
  { category: "Roads & Potholes", icon: AlertTriangle, labelKey: "categoryRoads" },
  { category: "Garbage & Sanitation", icon: Trash2, labelKey: "categoryGarbage" },
  { category: "Drinking Water & Pipeline Leakage", icon: Droplet, labelKey: "categoryWater" },
  { category: "Electricity Hazard & Wiring", icon: Zap, labelKey: "categoryElectricity" },
  { category: "Sewage & Drain Overflow", icon: Flame, labelKey: "categorySewage" },
  { category: "Streetlight Breakdown", icon: Lightbulb, labelKey: "categoryStreetlight" },
  { category: "Public Health & Fogging", icon: Shield, labelKey: "categoryHealth" },
  { category: "Illegal Encroachments", icon: Building2, labelKey: "categoryEncroachments" },
  { category: "Other", icon: HelpCircle, labelKey: "categoryOther" as any },
];

const SAMPLE_PHOTOS = [
  {
    name: "Pothole (Video)",
    category: "Roads & Potholes" as CivicCategory,
    url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Severe 3-Foot Deep Pothole & Waterlogging near Main Colony Road",
    description: "Deep road crater near main junction culvert in Ward 12. Multiple two-wheelers have slipped at night due to poor lighting and loose gravel. Immediate cold-mix asphalt patching required before school bus route opens.",
  },
  {
    name: "Garbage Dump (Video)",
    category: "Garbage & Sanitation" as CivicCategory,
    url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    title: "Overflowing Municipal Garbage Dump & Open Waste Burning behind Main Market",
    description: "Community dumpster in Sector 3 overflowing for 4 consecutive days. Stray cattle and pungent odor causing health issues for nearby residents and school children.",
  },
  {
    name: "Sparking Pole",
    category: "Electricity Hazard & Wiring" as CivicCategory,
    url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
    title: "Low Voltage & Sparking from Overhead Electric Pole near House 720",
    description: "Loose neutral wire sparking violently during evening breeze on electricity distribution pole #72. Spark fell on dry tree branches posing imminent fire hazard.",
  },
  {
    name: "Pipe Leak (Video)",
    category: "Drinking Water & Pipeline Leakage" as CivicCategory,
    url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    title: "Broken Main Potable Water Supply Line on Main Sector Avenue",
    description: "Underground 6-inch municipal water pipe burst near electricity substation. Thousands of liters of drinking water gushing onto the road while households have zero tap pressure.",
  },
];

export const FileGrievanceModal: React.FC<FileGrievanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  t,
  prefillData,
}) => {
  const [category, setCategory] = useState<CivicCategory>("Roads & Potholes");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [locality, setLocality] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number>(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Strict Validation State (Sequence: Description -> AI Semantic Check -> Category -> Media)
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<"description" | "category" | "media" | null>(null);
  const [isValidatingAI, setIsValidatingAI] = useState(false);

  // In-form Voice Dictation State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [severityScore, setSeverityScore] = useState(8);

  // Live Location / GPS Geolocation State
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

  // Manual Location Search State
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [locationMode, setLocationMode] = useState<"gps" | "search" | "dropdowns">("search");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic official jurisdiction mapping for all 36 States/UTs, Districts and Wards
  const officialStates = getAllOfficialStates();
  const matchedState = officialStates.find(
    (s) =>
      s.name.toLowerCase() === selectedState.toLowerCase() ||
      s.code.toLowerCase() === selectedState.toLowerCase()
  );
  const availableDistricts = matchedState ? getOfficialDistricts(matchedState.code) : [];
  const matchedDistrict = availableDistricts.find(
    (d) =>
      d.name.toLowerCase() === selectedDistrict.toLowerCase() ||
      d.id.toLowerCase() === selectedDistrict.toLowerCase()
  );
  const availableWards =
    matchedState && matchedDistrict ? getOfficialWards(matchedState.code, matchedDistrict.id) : [];

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const stateObj = officialStates.find(
      (s) =>
        s.name.toLowerCase() === newState.toLowerCase() ||
        s.code.toLowerCase() === newState.toLowerCase()
    );
    if (stateObj) {
      const districts = getOfficialDistricts(stateObj.code);
      if (districts.length > 0) {
        setSelectedDistrict(districts[0].name);
        const wards = getOfficialWards(stateObj.code, districts[0].id);
        if (wards.length > 0) {
          setSelectedWard(wards[0].name);
        } else {
          setSelectedWard("");
        }
      } else {
        setSelectedDistrict("");
        setSelectedWard("");
      }
    } else {
      setSelectedDistrict("");
      setSelectedWard("");
    }
  };

  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    if (matchedState) {
      const distObj = availableDistricts.find(
        (d) =>
          d.name.toLowerCase() === newDistrict.toLowerCase() ||
          d.id.toLowerCase() === newDistrict.toLowerCase()
      );
      if (distObj) {
        const wards = getOfficialWards(matchedState.code, distObj.id);
        if (wards.length > 0) {
          setSelectedWard(wards[0].name);
        } else {
          setSelectedWard("");
        }
      } else {
        setSelectedWard("");
      }
    }
  };

  // Reset or Sync prefill data when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (prefillData) {
        if (prefillData.title) setTitle(prefillData.title);
        if (prefillData.description) setDescription(prefillData.description);
        if (prefillData.category) setCategory(prefillData.category as CivicCategory);
        if (prefillData.state) setSelectedState(prefillData.state);
        if (prefillData.district) setSelectedDistrict(prefillData.district);
        if (prefillData.ward) setSelectedWard(prefillData.ward);
        if (prefillData.locality) setLocality(prefillData.locality);
        if (prefillData.severityScore) setSeverityScore(prefillData.severityScore);
        if (prefillData.photoUrl) setPhotoUrl(prefillData.photoUrl);
      } else {
        // Clear all fields on fresh open (do not prefill information)
        setTitle("");
        setDescription("");
        setCategory("Roads & Potholes");
        setSelectedState("");
        setSelectedDistrict("");
        setSelectedWard("");
        setLocality("");
        setPhotoUrl("");
        setVideoUrl("");
        setGpsCoords(null);
        setLocationSuccessMsg(null);
        setLocationErrorMsg(null);
        setManualSearchQuery("");
        setSearchResults([]);
        setShowSearchDropdown(false);
        setSeverityScore(8);
      }
    }
  }, [isOpen, prefillData]);

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

  // GPS Current Location Catcher with Reverse Geocoding
  const handleCatchCurrentLocation = async () => {
    setIsLocating(true);
    setLocationSuccessMsg(null);
    setLocationErrorMsg(null);

    try {
      // Fetch live GPS location and real address details
      const loc = await detectCurrentLocation(true);
      if (loc.status === "denied") {
        setLocationErrorMsg("⚠️ Location permission was denied. Please enable location in your browser or search your locality manually below.");
        setGpsCoords(null);
      } else if (loc.status === "unavailable" || loc.status === "timeout") {
        setLocationErrorMsg("⚠️ GPS signal unavailable or timed out. Please enter or search your location manually below.");
        setGpsCoords(null);
      } else if (loc.status === "success" && loc.coordinates) {
        if (loc.state) setSelectedState(loc.state);
        if (loc.district) setSelectedDistrict(loc.district);
        if (loc.ward) setSelectedWard(loc.ward);
        const locAddress = loc.formattedAddress || `${loc.locality}, ${loc.district}`;
        setLocality(locAddress);

        setGpsCoords({
          lat: Number(loc.coordinates.lat.toFixed(5)),
          lng: Number(loc.coordinates.lng.toFixed(5)),
          accuracy: loc.accuracyMeters || 15,
        });
        setLocationSuccessMsg(
          `📍 GPS Locked: ${loc.coordinates.lat.toFixed(4)}°N, ${loc.coordinates.lng.toFixed(4)}°E (±${loc.accuracyMeters || 15}m accuracy)`
        );
        setLocationErrorMsg(null);
      } else {
        if (loc.state) setSelectedState(loc.state);
        if (loc.district) setSelectedDistrict(loc.district);
        if (loc.ward) setSelectedWard(loc.ward);
        const locAddress = loc.formattedAddress || `${loc.locality}, ${loc.district}`;
        setLocality(locAddress);
        setLocationSuccessMsg(`📍 Location Identified: ${loc.district}, ${loc.state}`);
        setLocationErrorMsg(null);
      }
    } catch (err) {
      console.warn("Location detection error:", err);
      setLocationErrorMsg("⚠️ GPS access failed. Please search or select your location manually below.");
    } finally {
      setIsLocating(false);
    }
  };

  // Online search for street/colony/district/city
  const handleManualSearch = async (query: string) => {
    setManualSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    setIsSearchingLocation(true);
    setShowSearchDropdown(true);
    try {
      const results = await searchLocationOnline(query);
      setSearchResults(results);
    } catch (e) {
      console.warn("Location search error:", e);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // User clicked a manual location search result
  const handleSelectSearchResult = (result: (typeof searchResults)[0]) => {
    setSelectedState(result.state);
    setSelectedDistrict(result.district);
    setSelectedWard(result.ward);
    setLocality(`${result.locality}, ${result.district}`);
    setGpsCoords({
      lat: Number(result.lat.toFixed(5)),
      lng: Number(result.lng.toFixed(5)),
      accuracy: 10,
    });
    setManualLocation({
      district: result.district,
      state: result.state,
      ward: result.ward,
      locality: result.locality,
      formattedAddress: result.displayName,
      coordinates: { lat: result.lat, lng: result.lng },
    });
    setLocationSuccessMsg(`📍 Selected: ${result.locality}, ${result.district} (${result.state})`);
    setLocationErrorMsg(null);
    setShowSearchDropdown(false);
    setManualSearchQuery(result.displayName);
  };

  if (!isOpen) return null;

  // 1. In-Form Speech Recognition & Dictation
  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatusText("Speech recognition not supported in this browser. Please type your grievance.");
      setTimeout(() => setVoiceStatusText(null), 4000);
      return;
    }

    if (isRecordingVoice) {
      // Stop recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsRecordingVoice(false);
      setVoiceStatusText(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN"; // Supports Hindi, English & Indian accents
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecordingVoice(true);
        setVoiceStatusText("Listening... Speak your civic grievance clearly");
        if (invalidField === "description") {
          setValidationError(null);
          setInvalidField(null);
        }
      };

      recognition.onresult = (event: any) => {
        let speechChunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            speechChunk += event.results[i][0].transcript + " ";
          }
        }
        if (speechChunk.trim()) {
          setDescription((prev) => (prev ? `${prev.trim()} ${speechChunk.trim()}` : speechChunk.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event?.error);
        setIsRecordingVoice(false);
        if (event?.error === "not-allowed") {
          setVoiceStatusText("Microphone permission was denied. Please allow microphone access or type your grievance.");
        } else {
          setVoiceStatusText("Dictation stopped. You can edit the description text manually.");
        }
        setTimeout(() => setVoiceStatusText(null), 4000);
      };

      recognition.onend = () => {
        setIsRecordingVoice(false);
        setVoiceStatusText(null);
        // Automatically run semantic categorization when voice dictation finishes
        if (description.trim()) {
          runAutoCategorization(description.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition initialization notice:", err);
      setIsRecordingVoice(false);
      setVoiceStatusText("Could not access microphone. Please type your grievance.");
      setTimeout(() => setVoiceStatusText(null), 4000);
    }
  };

  // 2. Semantic Auto-Categorization (Gemini AI with Local Fallback)
  const runAutoCategorization = async (textToTriage?: string) => {
    const text = textToTriage || description || title;
    if (!text || text.trim().length < 3) return;
    setIsTriaging(true);

    try {
      const res = await fetch("/api/gemini/validate-grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text, title, category }),
      });
      const data = await res.json();
      if (data.isValid && data.category && data.category !== "Other") {
        setCategory(data.category as CivicCategory);
      }
      if (data.suggestedTitle && !title) {
        setTitle(data.suggestedTitle);
      }
    } catch (e) {
      console.warn("Auto-categorization notice:", e);
    } finally {
      setIsTriaging(false);
    }
  };

  // Legacy triage alias
  const runGeminiTriage = runAutoCategorization;

  // 3. Auto-Enhance with Gemini
  const handleAutoEnhance = async () => {
    if (!description && !title) return;
    setIsEnhancing(true);
    try {
      const res = await fetch("/api/gemini/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          locality,
        }),
      });
      const data = await res.json();
      if (data.enhancedText) {
        setDescription(data.enhancedText);
        runAutoCategorization(data.enhancedText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  // 4. Smooth Photo & Video Uploads with Real-Time Progress Tracking
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const localUrl = URL.createObjectURL(file);
    setPhotoUrl(localUrl); // Instant thumbnail preview
    setIsUploadingPhoto(true);
    setPhotoUploadProgress(15);
    if (invalidField === "media") {
      setValidationError(null);
      setInvalidField(null);
    }

    try {
      const uploadedUrl = await uploadFileToStorage(file, "grievance_photos", (progress) => {
        setPhotoUploadProgress(progress);
      });
      setPhotoUrl(uploadedUrl);
    } catch (err) {
      console.warn("Photo upload fallback to local URL:", err);
    } finally {
      setIsUploadingPhoto(false);
      setPhotoUploadProgress(100);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl); // Instant thumbnail preview
    setIsUploadingVideo(true);
    setVideoUploadProgress(10);
    if (invalidField === "media") {
      setValidationError(null);
      setInvalidField(null);
    }

    try {
      const uploadedUrl = await uploadFileToStorage(file, "grievance_videos", (progress) => {
        setVideoUploadProgress(progress);
      });
      setVideoUrl(uploadedUrl);
    } catch (err) {
      console.warn("Video upload fallback to local URL:", err);
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(100);
    }
  };

  // 5. Submit Grievance with Strict 4-Step Validation Flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setInvalidField(null);

    // STEP 1: Is description text present?
    if (!description || description.trim() === "") {
      setValidationError("Please describe the civic problem before submitting.");
      setInvalidField("description");
      const el = document.getElementById("grievance-description-textarea");
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // STEP 2: Does the AI validate it as a genuine civic issue (Not spam/test)?
    setIsValidatingAI(true);
    let aiValidationResult: { isValid: boolean; category?: string; rejectionMessage?: string | null } = { isValid: true };
    try {
      const res = await fetch("/api/gemini/validate-grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), title: title.trim(), category }),
      });
      aiValidationResult = await res.json();
    } catch (err) {
      // Local fallback classification if endpoint unavailable
      const text = description.trim().toLowerCase();
      const isSpam = /^(hi|hello|hey|test|testing|123|asdf|qwerty)$/i.test(text);
      aiValidationResult = {
        isValid: !isSpam && text.length >= 4,
        rejectionMessage: isSpam ? "This doesn't appear to be a valid civic issue. Please describe a specific problem you'd like to report." : null,
        category: category || "Other",
      };
    } finally {
      setIsValidatingAI(false);
    }

    if (!aiValidationResult.isValid) {
      setValidationError(
        aiValidationResult.rejectionMessage ||
        "This doesn't appear to be a valid civic issue. Please describe a specific problem you'd like to report."
      );
      setInvalidField("description");
      const el = document.getElementById("grievance-description-textarea");
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Auto-update category if suggested by AI and user hadn't explicitly customized
    let finalCategory = category;
    if ((!finalCategory || finalCategory === "Other") && aiValidationResult.category && aiValidationResult.category !== "Other") {
      finalCategory = aiValidationResult.category as CivicCategory;
      setCategory(finalCategory);
    }

    // STEP 3: Is a category selected?
    if (!finalCategory || finalCategory.trim() === "") {
      setValidationError("Please select a civic category for this report.");
      setInvalidField("category");
      const el = document.getElementById("grievance-category-section");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // STEP 4: Is visual evidence (Photo or Video) attached?
    const hasVisualEvidence = Boolean(photoUrl || videoUrl || photoFile || videoFile);
    if (!hasVisualEvidence) {
      setValidationError("Please upload a photo or video of the issue before submitting.");
      setInvalidField("media");
      const el = document.getElementById("grievance-media-section");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // All 4 validations passed! Proceed with verified submission.
    setIsSubmitting(true);

    const finalPhotoUrl = photoUrl;
    const finalVideoUrl = videoUrl;

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const finalState = selectedState || "Madhya Pradesh";
    const finalDistrict = selectedDistrict || "Local District";
    const finalWard = selectedWard || "Local Ward";
    const finalLocality = locality || "Reported Location";

    const distPrefix = finalDistrict.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "DIST";
    const token = `JV-${distPrefix}-2026-${randomDigits}`;

    const newGrievance: Grievance = {
      id: `g_${Date.now()}`,
      token: token,
      title: title || "Severe Civic Infrastructure Issue Reported by Citizen",
      description: description || "Civic grievance filed under JanVani National Portal.",
      category: category,
      state: finalState,
      stateCode: matchedState?.code || (finalState === "Madhya Pradesh" ? "MP" : finalState === "Maharashtra" ? "MH" : "IN"),
      district: finalDistrict,
      ward: finalWard,
      locality: finalLocality,
      department:
        category === "Roads & Potholes"
          ? `Public Works Department (${finalDistrict})`
          : category === "Garbage & Sanitation"
          ? `Swachh Bharat Mission Cell, Nagar Palika (${finalDistrict})`
          : category === "Drinking Water & Pipeline Leakage"
          ? `PHED / Municipal Water Supply Board (${finalDistrict})`
          : `Municipal Administration & Public Works (${finalDistrict})`,
      status: "Submitted & Token Issued",
      dateFiled: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      severityScore: severityScore,
      targetSlaHours: category === "Garbage & Sanitation" || category === "Drinking Water & Pipeline Leakage" ? 24 : 48,
      slaRemainingHours: 48,
      assignedNodal: "Nodal Grievance Officer, Municipal Council",
      assignedOfficerTitle: "Executive Officer / Zonal Engineer",
      assignedOfficerPhone: "07292-222201",
      photoUrl: finalPhotoUrl || (finalVideoUrl ? "" : SAMPLE_PHOTOS[0].url),
      imageUrl: finalPhotoUrl || (finalVideoUrl ? "" : SAMPLE_PHOTOS[0].url),
      videoUrl: finalVideoUrl || undefined,
      mediaType: finalVideoUrl ? "video" : "photo",
      upvotes: 1,
      hasUpvoted: true,
      filedByName: currentUser?.name || "Verified Citizen",
      filedByAadhaar: currentUser?.aadhaarNumber || "XXXX-XXXX-5060",
      geoCoords: gpsCoords
        ? { x: 52, y: 48, lat: gpsCoords.lat, lng: gpsCoords.lng }
        : { x: 52, y: 48, lat: 22.601, lng: 75.338 },
      timeline: [
        {
          title: "e-Aadhaar Verified Grievance Filed",
          description: `Filed with UIDAI-binding (${currentUser?.name || "Verified Citizen"}, ${finalWard}), ${finalDistrict} | Token: ${token} issued.${gpsCoords ? ` GPS Geotag: ${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : ""}`,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          status: "completed",
          verifiedBadge: `Verified Resident (${finalDistrict})`,
        },
        {
          title: "AI Triage & Geo-Clustering Complete",
          description: `Multimodal AI priority routing to ${category} engineer squad. Target SLA: 48 Hours.`,
          timestamp: "Auto-Assigned",
          status: "completed",
          officerOrEntity: "JanVani AI Engine",
        },
        {
          title: "Site Inspection & Work Order Assigned",
          description: "Field squad mobilized for on-site inspection.",
          timestamp: "In Queue",
          status: "current",
        },
      ],
    };

    setIsSubmitting(false);
    onSubmit(newGrievance);

    // Award Nagrik Contribution Points for Civic Reporting
    try {
      const citizenId = currentUser?.id || currentUser?.email || "default_citizen";
      awardNagrikPoints(
        citizenId,
        "FILE_GRIEVANCE",
        "Registered Civic Grievance",
        newGrievance.title,
        50,
        newGrievance.token
      );

      if (finalPhotoUrl || finalVideoUrl) {
        awardNagrikPoints(
          citizenId,
          "UPLOAD_PROOF",
          "Uploaded Photographic / Video Proof",
          "Evidence attached to support fast civic resolution",
          30,
          newGrievance.token
        );
      }
    } catch (pointsErr) {
      console.warn("Points attribution notice:", pointsErr);
    }

    onClose();

    // Fire & Forget: Trigger ViaSocket Webhook if configured
    try {
      fetch("/api/viasocket/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "NEW_GRIEVANCE",
          payload: newGrievance,
        }),
      });
    } catch (err) {
      console.warn("Failed to trigger ViaSocket webhook automatically:", err);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-[#303030] border border-[#e8e1d5] dark:border-white/[0.08] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-colors"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-[#e8e1d5] dark:border-white/[0.08] bg-[#f7f3eb] dark:bg-[#151515] flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6A00]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 min-w-0 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/15 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] dark:text-[#FF8A00] flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-[#F5F5F5] truncate">
                  {t.fileGrievanceTitle || "File Civic Grievance"}
                </h2>
                <span className="text-[10px] bg-emerald-100 dark:bg-[#20C997]/15 text-emerald-800 dark:text-[#20C997] border border-emerald-300 dark:border-[#20C997]/30 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> {t.aadhaarVerified || "Aadhaar Verified"}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-[#A8A8A8] truncate">
                {t.modalSubtitle || "AI Multimodal Auto-Triage • GPS Location Tagged • SLA Timers"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white dark:bg-[#383838] hover:bg-[#ede5d8] dark:hover:bg-[#404040] text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] border border-[#e8e1d5] dark:border-white/[0.08] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center flex-shrink-0 cursor-pointer relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body (Touch Friendly scroll) */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 bg-white dark:bg-[#18181b]">
          {/* Top Validation & Verification Error Alert */}
          {validationError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border-2 border-red-500/40 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{validationError}</span>
              </div>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 p-1 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 1. Voice AI Triage Banner */}
          <div className="rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-[#27272a] dark:via-[#1f1f23] dark:to-[#27272a] border border-purple-200 dark:border-white/[0.08] p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden shadow-sm">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#FF6A00]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md flex-shrink-0 cursor-pointer ${
                  isRecordingVoice
                    ? "bg-[#FF3B30] text-white animate-pulse ring-4 ring-red-400/30"
                    : "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white shadow-[#FF6A00]/25"
                }`}
                title={isRecordingVoice ? "Click to stop listening" : "Click to speak grievance"}
              >
                {isRecordingVoice ? <MicOff className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
              </button>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-1.5">
                  <span>{t.voiceAiTitle || "JanVani Voice AI"}</span>
                  {isRecordingVoice && <span className="text-[10px] text-[#FF3B30] animate-pulse font-mono">{t.voiceListening || "Listening..."}</span>}
                </div>
                <div className="text-[11px] text-purple-700 dark:text-[#A8A8A8]">
                  {voiceStatusText || t.voiceAiSubtitle || "Speak in Hindi or English to describe civic issue."}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => runAutoCategorization()}
              disabled={isTriaging || (!description && !title)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#121214] dark:hover:bg-[#202024] border border-purple-500 dark:border-white/[0.08] text-white dark:text-[#FF8A00] text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0 min-h-[40px] cursor-pointer relative z-10"
            >
              {isTriaging ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-purple-200 dark:text-[#FF8A00]" />
              )}
              <span>{isTriaging ? (t.triaging || "Analyzing...") : (t.runGeminiTriage || "Run Gemini Triage")}</span>
            </button>
          </div>

          {/* 2. Select Civic Category Grid */}
          <div id="grievance-category-section" className={invalidField === "category" ? "p-2 rounded-xl border-2 border-red-500/50 bg-red-500/5" : ""}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-[#F5F5F5] uppercase tracking-wider">
                {t.selectCivicCategory || "SELECT CIVIC CATEGORY"}
              </label>
              {invalidField === "category" && (
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Category Required
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORY_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = category === item.category;
                const displayLabel = t[item.labelKey] || item.category;
                return (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => {
                      setCategory(item.category);
                      if (invalidField === "category") {
                        setValidationError(null);
                        setInvalidField(null);
                      }
                    }}
                    className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border text-left text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                      isSelected
                        ? "bg-amber-50 dark:bg-[#FF6A00]/15 border-[#FF6A00] text-amber-900 dark:text-[#FF8A00] shadow-sm shadow-[#FF6A00]/20"
                        : "bg-[#fbf9f5] dark:bg-[#121214] border-[#e8e1d5] dark:border-white/[0.08] text-slate-600 dark:text-[#A8A8A8] hover:border-amber-300 dark:hover:border-white/[0.15] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-[#FF6A00] dark:text-[#FF8A00]" : "text-slate-400 dark:text-[#777777]"}`} />
                    <span className="truncate text-[11px] sm:text-xs">{displayLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Grievance Title Input */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-[#F5F5F5] uppercase tracking-wider mb-1">
              {t.grievanceTitleLabel || "GRIEVANCE TITLE"}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.grievanceTitlePlaceholder || "e.g. Broken water pipe or severe road crater near Market Square"}
              className="w-full px-3.5 py-2.5 bg-[#fbf9f5] dark:bg-[#121214] border border-[#dfd5c5] dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] min-h-[44px]"
            />
          </div>

          {/* 4. Detailed Description Textarea */}
          <div className={invalidField === "description" ? "p-2 rounded-xl border-2 border-red-500/50 bg-red-500/5" : ""}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
                <span>{t.detailedDescriptionLabel || "DETAILED DESCRIPTION"}</span>
                {invalidField === "description" && (
                  <span className="text-[10px] font-bold text-red-500">Required</span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isRecordingVoice
                      ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30"
                      : "bg-amber-500/10 hover:bg-amber-500/20 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/30"
                  }`}
                  title="Dictate grievance using microphone"
                >
                  {isRecordingVoice ? (
                    <>
                      <MicOff className="w-3 h-3 animate-spin" />
                      <span>Stop Dictation</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3" />
                      <span>Voice Dictate</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleAutoEnhance}
                  disabled={isEnhancing || (!description && !title)}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#FF6A00] dark:text-[#FF8A00] hover:text-[#ff791a] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-[#FF6A00] dark:text-[#FF8A00]" />
                  )}
                  <span>{isEnhancing ? (t.enhancing || "Enhancing...") : (t.autoEnhanceWithGemini || "Auto-Enhance with Gemini")}</span>
                </button>
              </div>
            </div>
            <textarea
              id="grievance-description-textarea"
              rows={3}
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (invalidField === "description") {
                  setValidationError(null);
                  setInvalidField(null);
                }
              }}
              placeholder={t.descriptionPlaceholder || "Describe the civic problem, duration, safety risks, and landmarks..."}
              className={`w-full px-3.5 py-2.5 bg-[#fbf9f5] dark:bg-[#121214] border rounded-xl text-xs text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] focus:outline-none focus:ring-1 ${
                invalidField === "description"
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-[#dfd5c5] dark:border-white/[0.08] focus:border-[#FF6A00] focus:ring-[#FF6A00]"
              }`}
            />
          </div>

          {/* 5. Photo & Video Proof Upload (AI Vision & Civic Media Reels) */}
          <div
            id="grievance-media-section"
            className={`space-y-3 transition-all ${
              invalidField === "media"
                ? "p-3 rounded-xl border-2 border-red-500/50 bg-red-500/5 shadow-sm"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
                <span>{t.attachMediaProof || "ATTACH MEDIA PROOF (PHOTO & VIDEO REEL)"}</span>
                <span className="text-red-500 text-xs font-black">*</span>
                {invalidField === "media" && (
                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Mandatory Proof Required
                  </span>
                )}
              </label>
              <span className="text-[10px] text-slate-500 dark:text-[#A8A8A8] font-medium">
                {t.photoVisionVideoReel || "Photo (AI Vision) & Video (Civic Reel)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Photo Evidence */}
              <div className="rounded-xl border border-[#dfd5c5] dark:border-white/[0.12] bg-[#fbf9f5] dark:bg-[#121214] p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F5F5F5] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#FF6A00]" />
                    {t.photoEvidence || "Photo Evidence"}
                  </span>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl("");
                        setPhotoFile(null);
                        setPhotoUploadProgress(0);
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-semibold cursor-pointer"
                    >
                      {t.remove || "Remove"}
                    </button>
                  )}
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-32 rounded-lg border-2 border-dashed border-[#dfd5c5] dark:border-white/[0.12] hover:border-[#FF6A00] bg-white dark:bg-[#1a1a1e] flex flex-col items-center justify-center p-2 cursor-pointer group transition-colors overflow-hidden"
                >
                  {photoUrl ? (
                    <>
                      <img
                        src={photoUrl}
                        alt="Photo Preview"
                        className="w-full h-full object-cover rounded"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-white font-bold bg-[#151515]/90 px-2.5 py-1 rounded-md">
                          {t.changePhoto || "Change Photo"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-slate-400 dark:text-[#777777] group-hover:text-[#FF6A00] mb-1" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-[#F5F5F5]">
                        {t.uploadPhoto || "Upload / Snap Photo"}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-[#777777]">
                        {t.photoFormats || "JPEG, PNG, WebP"}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Photo Upload Status & Progress */}
                {isUploadingPhoto ? (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#FF6A00]">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading Photo...
                      </span>
                      <span className="font-mono">{photoUploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] transition-all duration-300 ease-out"
                        style={{ width: `${photoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : photoUrl ? (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#20C997] font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Photo Attached & Ready
                  </div>
                ) : null}
              </div>

              {/* Card 2: Video Evidence (Civic Reel) */}
              <div className="rounded-xl border border-[#dfd5c5] dark:border-white/[0.12] bg-[#fbf9f5] dark:bg-[#121214] p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F5F5F5] flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-[#FF6A00]" />
                    {t.videoEvidence || "Video Evidence (Civic Reel)"}
                  </span>
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setVideoUrl("");
                        setVideoFile(null);
                        setVideoUploadProgress(0);
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-semibold cursor-pointer"
                    >
                      {t.remove || "Remove"}
                    </button>
                  )}
                </div>

                <div
                  onClick={() => videoFileInputRef.current?.click()}
                  className="relative h-32 rounded-lg border-2 border-dashed border-[#dfd5c5] dark:border-white/[0.12] hover:border-[#FF6A00] bg-white dark:bg-[#1a1a1e] flex flex-col items-center justify-center p-2 cursor-pointer group transition-colors overflow-hidden"
                >
                  {videoUrl ? (
                    <>
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover rounded pointer-events-none"
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                      <div className="absolute top-2 left-2 bg-[#FF6A00] text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                        <Film className="w-2.5 h-2.5" /> {t.reelAttached || "REEL ATTACHED"}
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-white font-bold bg-[#151515]/90 px-2.5 py-1 rounded-md">
                          {t.changeVideo || "Change Video"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Video className="w-6 h-6 text-slate-400 dark:text-[#777777] group-hover:text-[#FF6A00] mb-1" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-[#F5F5F5]">
                        {t.uploadVideo || "Upload Video Report"}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-[#777777]">
                        {t.videoFormats || "MP4, WebM, MOV (Max 50MB)"}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    onChange={handleVideoUpload}
                    accept="video/*"
                    className="hidden"
                  />
                </div>

                {/* Video Upload Status & Progress */}
                {isUploadingVideo ? (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#FF6A00]">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading Video Reel...
                      </span>
                      <span className="font-mono">{videoUploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] transition-all duration-300 ease-out"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : videoUrl ? (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#20C997] font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Video Reel Attached & Ready
                  </div>
                ) : null}
              </div>
            </div>

            {/* Quick Test Presets with Real Video/Photo Grievance */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-slate-500 dark:text-[#777777] uppercase flex items-center justify-between">
                <span>{t.orSelectSample || "Or Select Sample Grievance Media:"}</span>
                <span className="text-[9px] text-[#FF6A00] font-normal">{t.sampleIncludesHd || "Includes HD video & photos"}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {SAMPLE_PHOTOS.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => {
                      setPhotoUrl(sample.url);
                      setVideoUrl(sample.videoUrl || "");
                      setCategory(sample.category);
                      setTitle(sample.title);
                      setDescription(sample.description);
                      if (invalidField === "media" || invalidField === "category" || invalidField === "description") {
                        setValidationError(null);
                        setInvalidField(null);
                      }
                    }}
                    className="px-2 py-1.5 rounded-lg bg-[#f7f3eb] dark:bg-[#151515]/70 hover:bg-[#ede5d8] dark:hover:bg-[#383838] border border-[#e8e1d5] dark:border-white/[0.08] text-[11px] font-semibold text-slate-700 dark:text-[#A8A8A8] text-left truncate flex items-center gap-1.5 transition-colors min-h-[36px] cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sample.videoUrl ? "bg-[#FF6A00]" : "bg-blue-500"}`} />
                    <span className="truncate">{sample.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Administrative Jurisdiction (State, District, Ward) & Catch Current Location / Manual Search */}
          <div className="rounded-xl bg-[#f7f3eb] dark:bg-[#404040]/50 border border-[#e8e1d5] dark:border-white/[0.08] p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-[#F5F5F5] flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF6A00] dark:text-[#FF8A00]" />
                <span>{t.adminJurisdiction || "Administrative Jurisdiction & Location"}</span>
              </span>

              {/* Action Buttons: Detect GPS & Search / Manual */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCatchCurrentLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white font-bold text-[11px] shadow-sm shadow-[#FF6A00]/25 transition-all cursor-pointer disabled:opacity-50 min-h-[34px]"
                  title="Detect live browser GPS"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>{isLocating ? (t.catchingGps || "Catching GPS...") : (t.catchLocationBtn || "Detect Location")}</span>
                </button>
              </div>
            </div>

            {/* Manual Location Search Input */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-600 dark:text-[#A8A8A8] block mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Search className="w-3 h-3 text-[#FF6A00]" />
                  <span>MANUAL LOCATION SEARCH / OVERRIDE</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Type colony, street, landmark, district or city</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => handleManualSearch(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchDropdown(true);
                  }}
                  placeholder="Search any place in India (e.g. Rajwada Indore, Connaught Place Delhi, MG Road Pune)..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-[#151515] border border-[#dfd5c5] dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[38px] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {isSearchingLocation && (
                  <Loader2 className="w-3.5 h-3.5 text-[#FF6A00] animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
                {manualSearchQuery && !isSearchingLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualSearchQuery("");
                      setSearchResults([]);
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-[#1f1f1f] border border-[#dfd5c5] dark:border-white/10 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-white/5 animate-in fade-in">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left px-3 py-2 hover:bg-orange-50 dark:hover:bg-white/5 text-xs flex items-start gap-2 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#FF6A00] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {item.locality || item.ward}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {item.district ? `${item.district}, ` : ""}{item.state}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error Banner if GPS failed/denied */}
            {locationErrorMsg && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{locationErrorMsg}</span>
                </div>
              </div>
            )}

            {/* Location Success / Locked Banner */}
            {locationSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-[#20C997]/15 border border-emerald-300 dark:border-[#20C997]/30 text-emerald-800 dark:text-[#20C997] text-xs flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-[#20C997] shrink-0" />
                  <span className="font-medium">{locationSuccessMsg}</span>
                </div>
                {gpsCoords && (
                  <span className="text-[10px] font-mono bg-emerald-200 dark:bg-[#20C997]/25 px-2 py-0.5 rounded text-emerald-900 dark:text-[#20C997] border border-emerald-300 dark:border-[#20C997]/40 shrink-0">
                    {t.gpsLock || "GPS LOCK"}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-[#A8A8A8] block mb-1">
                  {t.stateLabel || "1. STATE / UT"}
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white dark:bg-[#151515] border border-[#dfd5c5] dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-[#F5F5F5] min-h-[40px] cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-[#151515]">{t.selectStatePlaceholder || "-- Select State / UT --"}</option>
                  {selectedState && !officialStates.some((s) => s.name.toLowerCase() === selectedState.toLowerCase() || s.code.toLowerCase() === selectedState.toLowerCase()) && (
                    <option value={selectedState} className="bg-white dark:bg-[#151515] font-semibold">{selectedState} (Custom / Detected)</option>
                  )}
                  {officialStates.map((s) => (
                    <option key={s.code} value={s.name} className="bg-white dark:bg-[#151515]">
                      {s.name} ({s.code}) {s.isUT ? "[UT]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-[#A8A8A8] block mb-1">
                  {t.modalDistrictLabel || "2. DISTRICT"}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!selectedState}
                  className="w-full px-2.5 py-2 text-xs bg-white dark:bg-[#151515] border border-[#dfd5c5] dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-[#F5F5F5] min-h-[40px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-white dark:bg-[#151515]">{t.selectDistrictPlaceholder || "-- Select District --"}</option>
                  {selectedDistrict && !availableDistricts.some((d) => d.name.toLowerCase() === selectedDistrict.toLowerCase() || d.id.toLowerCase() === selectedDistrict.toLowerCase()) && (
                    <option value={selectedDistrict} className="bg-white dark:bg-[#151515] font-semibold">{selectedDistrict} (Detected)</option>
                  )}
                  {availableDistricts.map((d) => (
                    <option key={d.id} value={d.name} className="bg-white dark:bg-[#151515]">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-[#A8A8A8] block mb-1">
                  {t.wardLabel || "3. WARD / SECTOR"}
                </label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  disabled={!selectedDistrict}
                  className="w-full px-2.5 py-2 text-xs bg-white dark:bg-[#151515] border border-[#dfd5c5] dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-[#F5F5F5] min-h-[40px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-white dark:bg-[#151515]">{t.selectWardPlaceholder || "-- Select Ward / Sector --"}</option>
                  {selectedWard && !availableWards.some((w) => w.name.toLowerCase() === selectedWard.toLowerCase() || w.id.toLowerCase() === selectedWard.toLowerCase()) && (
                    <option value={selectedWard} className="bg-white dark:bg-[#151515] font-semibold">{selectedWard} (Custom / Detected)</option>
                  )}
                  {availableWards.map((w) => (
                    <option key={w.id} value={w.name} className="bg-white dark:bg-[#151515]">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-[#A8A8A8] block">
                  {t.modalLocalityLabel || "SPECIFIC LOCALITY / LANDMARK / GPS PIN"}
                </label>
                {gpsCoords && (
                  <span className="text-[10px] text-[#3B82F6] flex items-center gap-1 font-mono">
                    <Navigation className="w-2.5 h-2.5" /> {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder={t.localityPlaceholder || "e.g. Near Market Square, Sector 2 (or search above / click 'Detect Location')"}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#151515] border border-[#dfd5c5] dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#777777] min-h-[40px]"
              />
            </div>

            <div className="pt-2 border-t border-[#e8e1d5] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-600 dark:text-[#A8A8A8] flex-wrap gap-1">
              <span className="text-slate-500 dark:text-[#777777]">{t.verifiedCitizenLabel || "Verified Citizen:"}</span>
              <span className="text-emerald-700 dark:text-[#20C997] font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {currentUser?.name || "Verified Citizen"} ({currentUser?.aadhaarNumber || "UIDAI Verified"})
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#e8e1d5] dark:border-white/[0.08]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Trophy className="w-4 h-4 text-[#FF6A00] shrink-0" />
              <span>Earn +50 Nagrik Points (or +80 with media proof) for Best Nagrik rank</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              {!photoUrl && !videoUrl && !photoFile && !videoFile && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 justify-center">
                  <AlertCircle className="w-3 h-3" /> Photo or video proof required
                </span>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-[#f7f3eb] dark:bg-[#27272a] hover:bg-[#ede5d8] dark:hover:bg-[#3f3f46] text-slate-700 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] font-bold text-xs transition-colors min-h-[44px] cursor-pointer"
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isValidatingAI ||
                    isUploadingPhoto ||
                    isUploadingVideo ||
                    (!photoUrl && !videoUrl && !photoFile && !videoFile)
                  }
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white font-bold text-xs shadow-lg shadow-[#FF6A00]/25 transition-all min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Issuing Token & Filing...</span>
                    </>
                  ) : isValidatingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI Triage & Verification...</span>
                    </>
                  ) : isUploadingPhoto || isUploadingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Media ({isUploadingVideo ? `${videoUploadProgress}%` : `${photoUploadProgress}%`})...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.submitVerified || "Submit Verified Grievance"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
