import React, { useState, useEffect } from "react";
import {
  Layers,
  MapPin,
  Flame,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  Info,
  Navigation,
  Search,
  ExternalLink,
  LocateFixed,
  RefreshCw,
  Compass,
  FileText,
  Shield,
  Droplet,
  Trash2,
  Zap,
  Lightbulb,
  Radio,
  Map as MapIcon,
  Crosshair,
  SlidersHorizontal,
  Globe,
} from "lucide-react";
import { Grievance, StateData, DistrictData, WardData, CivicCategory, GoogleMapsProblemSpot, GoogleMapsGroundingChunk } from "../types";
import { STATES_DATA, ALL_STATE_DISTRICTS, getDistrictsForState } from "../data/initialData";
import { Translations } from "../data/translations";

interface GisMapProps {
  grievances: Grievance[];
  onTrackGrievance: (grievance: Grievance) => void;
  onOpenReportModal: (prefill?: any) => void;
  onOpenRtiModal?: (grievance: Grievance) => void;
  t: Translations;
  selectedStateFilter: string;
  setSelectedStateFilter: (state: string) => void;
  selectedDistrictFilter: string;
  setSelectedDistrictFilter: (district: string) => void;
}

const CATEGORY_FILTERS = [
  "All Civic Issues",
  "Roads & Potholes",
  "Garbage & Sanitation",
  "Drinking Water & Pipeline Leakage",
  "Sewage & Drain Overflow",
  "Electricity Hazard & Wiring",
  "Streetlight Breakdown",
];

export const GisMap: React.FC<GisMapProps> = ({
  grievances,
  onTrackGrievance,
  onOpenReportModal,
  onOpenRtiModal,
  t,
  selectedStateFilter,
  setSelectedStateFilter,
  selectedDistrictFilter,
  setSelectedDistrictFilter,
}) => {
  // Navigation & Scope states: 1 = National, 2 = State, 3 = District, 4 = Real Place / Live GPS
  const [scopeTier, setScopeTier] = useState<1 | 2 | 3 | 4>(4);
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [selectedWardId, setSelectedWardId] = useState<string>("");
  const [heatmapActive, setHeatmapActive] = useState<boolean>(true);
  
  // Google Maps Grounding & Place Spotter state
  const [placeSearchQuery, setPlaceSearchQuery] = useState<string>("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All Civic Issues");
  const [isLoadingSpots, setIsLoadingSpots] = useState<boolean>(false);
  const [groundedSpots, setGroundedSpots] = useState<GoogleMapsProblemSpot[]>([]);
  const [groundingReport, setGroundingReport] = useState<string>("");
  const [groundingChunks, setGroundingChunks] = useState<GoogleMapsGroundingChunk[]>([]);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<"standard" | "satellite">("standard");
  const [activeSpotForPreview, setActiveSpotForPreview] = useState<GoogleMapsProblemSpot | null>(null);

  // Selected State object
  const currentState = selectedStateCode ? STATES_DATA.find((s) => s.code === selectedStateCode) || null : null;

  // Selected Districts list based on current state
  const currentDistricts = selectedStateCode ? getDistrictsForState(selectedStateCode) : [];

  // Selected District object
  const currentDistrict = selectedDistrictId
    ? currentDistricts.find((d) => d.id === selectedDistrictId) || null
    : null;

  // Current Wards list
  const currentWards = currentDistrict?.wards || [];

  // Selected Ward object
  const currentWard = selectedWardId
    ? currentWards.find((w) => w.id === selectedWardId) || null
    : null;

  // Fetch Google Maps grounded problem spots from server
  const fetchGoogleMapsProblemSpots = async (
    scope: "national" | "state" | "district" | "real_place",
    stName = currentState?.name || "Pan-India",
    distName = currentDistrict?.name || "National",
    query = placeSearchQuery,
    coords = liveLocation
  ) => {
    setIsLoadingSpots(true);
    try {
      const response = await fetch("/api/gemini/maps-spot-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          stateName: stName || "Pan-India",
          districtName: distName || "National",
          placeQuery: query || "India",
          category: activeCategoryFilter,
          latitude: coords?.lat,
          longitude: coords?.lng,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Google Maps spots");
      }

      const data = await response.json();
      setGroundedSpots(data.spots || []);
      setGroundingReport(data.reportMarkdown || "");
      setGroundingChunks(data.groundingChunks || []);
      if (data.spots && data.spots.length > 0) {
        setActiveSpotForPreview(data.spots[0]);
      }
    } catch (err) {
      console.error("Maps grounding fetch error:", err);
    } finally {
      setIsLoadingSpots(false);
    }
  };

  // Initial load - show national overview without pre-filling specific user location
  useEffect(() => {
    fetchGoogleMapsProblemSpots("national", "Pan-India", "National", "National Corridors");
  }, []);

  // Handle tier switches
  const handleSwitchScope = (newTier: 1 | 2 | 3 | 4) => {
    setScopeTier(newTier);
    if (newTier === 1) {
      fetchGoogleMapsProblemSpots("national", "Pan-India", "National");
    } else if (newTier === 2) {
      fetchGoogleMapsProblemSpots("state", currentState?.name || "Pan-India", currentDistrict?.name || "All Districts");
    } else if (newTier === 3) {
      fetchGoogleMapsProblemSpots("district", currentState?.name || "Pan-India", currentDistrict?.name || "All Districts");
    } else {
      fetchGoogleMapsProblemSpots("real_place", currentState?.name || "Pan-India", currentDistrict?.name || "National", placeSearchQuery);
    }
  };

  // Handle State Selection (Dropdown / Card / Chip)
  const handleSelectStateCode = (code: string) => {
    if (!code) {
      setSelectedStateCode("");
      setSelectedStateFilter("");
      setSelectedDistrictId("");
      setSelectedDistrictFilter("");
      setSelectedWardId("");
      return;
    }
    const targetState = STATES_DATA.find((s) => s.code === code) || STATES_DATA[0];
    setSelectedStateCode(targetState.code);
    setSelectedStateFilter(targetState.name);
    
    // Auto-select first district in new state
    const districtsForNewState = getDistrictsForState(targetState.code);
    const firstDistrict = districtsForNewState[0];
    if (firstDistrict) {
      setSelectedDistrictId(firstDistrict.id);
      setSelectedDistrictFilter(firstDistrict.name);
      if (firstDistrict.wards && firstDistrict.wards.length > 0) {
        setSelectedWardId(firstDistrict.wards[0].id);
      }
      setPlaceSearchQuery(`${firstDistrict.name}, ${targetState.name}`);
      fetchGoogleMapsProblemSpots("district", targetState.name, firstDistrict.name, `${firstDistrict.name}`);
    } else {
      setSelectedDistrictId("");
      setSelectedDistrictFilter("");
      setSelectedWardId("");
      setPlaceSearchQuery(`${targetState.capital || targetState.name}, ${targetState.name}`);
      fetchGoogleMapsProblemSpots("state", targetState.name, targetState.capital || targetState.name);
    }
  };

  // Handle District Selection (Dropdown / Card)
  const handleSelectDistrictId = (districtId: string) => {
    if (!districtId) {
      setSelectedDistrictId("");
      setSelectedDistrictFilter("");
      setSelectedWardId("");
      return;
    }
    const targetDistrict = currentDistricts.find((d) => d.id === districtId);
    if (targetDistrict) {
      setSelectedDistrictId(targetDistrict.id);
      setSelectedDistrictFilter(targetDistrict.name);
      if (targetDistrict.wards && targetDistrict.wards.length > 0) {
        setSelectedWardId(targetDistrict.wards[0].id);
      }
      setPlaceSearchQuery(`${targetDistrict.name}, ${currentState?.name || ""}`);
      setScopeTier(3);
      fetchGoogleMapsProblemSpots("district", currentState?.name || "State", targetDistrict.name, `${targetDistrict.name}`);
    }
  };

  // Handle Ward Selection
  const handleSelectWardId = (wardId: string) => {
    setSelectedWardId(wardId);
    const targetWard = currentWards.find((w) => w.id === wardId);
    if (targetWard) {
      setPlaceSearchQuery(`${targetWard.name}, ${currentDistrict?.name || ""}`);
      fetchGoogleMapsProblemSpots("district", currentState?.name || "State", currentDistrict?.name || "District", `${targetWard.name}, ${currentDistrict?.name || ""}`);
    }
  };

  // Handle live GPS geolocation - Detect and fill details on click
  const handleGetLiveLocation = () => {
    setIsLocating(true);

    const applyDetectedLocation = (
      coords: { lat: number; lng: number },
      detectedStateName: string,
      detectedDistrictName: string,
      resolvedQuery: string
    ) => {
      setLiveLocation(coords);
      setIsLocating(false);
      setScopeTier(4);

      // Match State
      if (detectedStateName) {
        const matchedState = STATES_DATA.find(
          (s) =>
            s.name.toLowerCase().includes(detectedStateName.toLowerCase()) ||
            detectedStateName.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matchedState) {
          setSelectedStateCode(matchedState.code);
          setSelectedStateFilter(matchedState.name);

          const dists = getDistrictsForState(matchedState.code);
          if (detectedDistrictName && dists.length > 0) {
            const matchedDist = dists.find(
              (d) =>
                d.name.toLowerCase().includes(detectedDistrictName.toLowerCase()) ||
                detectedDistrictName.toLowerCase().includes(d.name.toLowerCase())
            );
            if (matchedDist) {
              setSelectedDistrictId(matchedDist.id);
              setSelectedDistrictFilter(matchedDist.name);
              if (matchedDist.wards && matchedDist.wards.length > 0) {
                setSelectedWardId(matchedDist.wards[0].id);
              }
            } else {
              setSelectedDistrictId(dists[0].id);
              setSelectedDistrictFilter(dists[0].name);
            }
          }
        }
      }

      const finalQuery =
        resolvedQuery ||
        (detectedDistrictName && detectedStateName
          ? `${detectedDistrictName}, ${detectedStateName}`
          : `GPS Pin: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);

      setPlaceSearchQuery(finalQuery);
      fetchGoogleMapsProblemSpots(
        "real_place",
        detectedStateName || "Pan-India",
        detectedDistrictName || "Detected Location",
        finalQuery,
        coords
      );
    };

    const tryIpGeolocationFallback = async () => {
      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.latitude && ipData.longitude) {
            const ipCoords = { lat: ipData.latitude, lng: ipData.longitude };
            const detectedStateName = ipData.region || ipData.region_name || "";
            const detectedDistrictName = ipData.city || "";
            const resolvedQuery = [detectedDistrictName, detectedStateName, ipData.country_name]
              .filter(Boolean)
              .join(", ");
            applyDetectedLocation(ipCoords, detectedStateName, detectedDistrictName, resolvedQuery);
            return;
          }
        }
      } catch (ipErr) {
        console.warn("IP geolocation fallback also failed:", ipErr);
      }

      // If both GPS and IP geocoding fail, gracefully end locating without pre-filling fake data
      setIsLocating(false);
      alert("Location permission was not granted or is unavailable. Please select your State & District from the dropdown menus.");
    };

    if (!navigator.geolocation) {
      tryIpGeolocationFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        let detectedStateName = "";
        let detectedDistrictName = "";
        let resolvedQuery = "";

        // Reverse Geocode via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            detectedStateName = addr.state || "";
            detectedDistrictName =
              addr.state_district ||
              addr.county ||
              addr.city ||
              addr.town ||
              addr.district ||
              "";
            const subName =
              addr.suburb ||
              addr.neighbourhood ||
              addr.road ||
              addr.village ||
              "";

            resolvedQuery = [subName, detectedDistrictName, detectedStateName]
              .filter(Boolean)
              .join(", ");
          }
        } catch (e) {
          console.warn("Reverse geocode fetch issue:", e);
        }

        applyDetectedLocation(coords, detectedStateName, detectedDistrictName, resolvedQuery);
      },
      (error) => {
        console.warn("Geolocation permission or timeout:", error.message);
        // Try IP geolocation if GPS permission was denied or timed out
        tryIpGeolocationFallback();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Handle Custom Search
  const handleRunSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!placeSearchQuery.trim()) return;
    setScopeTier(4);
    fetchGoogleMapsProblemSpots("real_place", currentState?.name || "Pan-India", currentDistrict?.name || "National", placeSearchQuery);
  };

  // Convert a spotted problem to a prefilled grievance
  const handleFileFromSpot = (spot: GoogleMapsProblemSpot) => {
    onOpenReportModal({
      title: spot.title,
      description: `${spot.hazardDescription}\n\n[Google Maps Verified Location: ${spot.locationName} (${spot.googleMapsUrl})]`,
      category: (spot.category as CivicCategory) || "Roads & Potholes",
      state: spot.state === "National" ? (currentState?.name || "National") : spot.state,
      district: spot.district === "Inter-State" ? (currentDistrict?.name || "District") : spot.district,
      ward: currentWard?.name || "Ward 18 (Main Market / Bus Stand)",
      locality: spot.locationName,
      severityScore: spot.severity === "CRITICAL" ? 10 : spot.severity === "HIGH" ? 8 : 6,
    });
  };

  // Active Map Query for Google Maps Embed URL
  const getGoogleMapsEmbedQuery = () => {
    if (activeSpotForPreview) {
      return encodeURIComponent(`${activeSpotForPreview.title}, ${activeSpotForPreview.locationName}, India`);
    }
    if (scopeTier === 1) return encodeURIComponent("India National Highways");
    if (scopeTier === 2) return encodeURIComponent(`${currentState?.name || "India"}, India`);
    if (scopeTier === 3) return encodeURIComponent(`${currentDistrict?.name || "District"} Municipal Corporation, ${currentState?.name || "India"}, India`);
    return encodeURIComponent(placeSearchQuery || (currentDistrict ? `${currentDistrict.name}, ${currentState?.name || ""}` : "India"));
  };

  const currentEmbedUrl = `https://maps.google.com/maps?q=${getGoogleMapsEmbedQuery()}&t=${mapMode === "satellite" ? "k" : "m"}&z=${scopeTier === 1 ? 5 : scopeTier === 2 ? 8 : scopeTier === 3 ? 12 : 15}&ie=UTF8&iwloc=&output=embed`;

  // Quick State Hop Shortcuts
  const POPULAR_STATES = [
    { code: "MP", label: "Madhya Pradesh" },
    { code: "MH", label: "Maharashtra" },
    { code: "DL", label: "Delhi (NCT)" },
    { code: "UP", label: "Uttar Pradesh" },
    { code: "KA", label: "Karnataka" },
    { code: "GJ", label: "Gujarat" },
    { code: "TN", label: "Tamil Nadu" },
    { code: "WB", label: "West Bengal" },
    { code: "RJ", label: "Rajasthan" },
    { code: "BR", label: "Bihar" },
    { code: "TS", label: "Telangana" },
    { code: "KL", label: "Kerala" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-5 animate-in fade-in duration-300">
      {/* 1. Top Google Maps Intelligence Hero & Multi-Scope Tabs */}
      <div className="rounded-3xl bg-white/80 dark:bg-[#303030] backdrop-blur-2xl border border-white/90 dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_15px_45px_rgba(210,190,165,0.22)] dark:shadow-2xl relative overflow-hidden transition-colors">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-28 bg-[#FF6A00]/15 dark:bg-[#FF6A00]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#FF6A00]/10 dark:bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/25">
                <MapIcon className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-[#F5F5F5] tracking-tight flex items-center gap-2 flex-wrap font-heading">
                <span>Google Maps Data & Real-Place Spotter</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 dark:bg-[#151515] text-emerald-700 dark:text-[#20C997] border border-emerald-200 dark:border-[#20C997]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#20C997] animate-pulse"></span>
                  Maps Grounding Active
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A8A8A8] mt-1">
              Spot real-world civic bottlenecks, hazardous potholes, sanitation clusters, and waterlogging across <strong>National Corridors</strong>, <strong>States</strong>, <strong>Districts</strong>, or <strong>Real Landmarks</strong> using Google Maps intelligence.
            </p>
          </div>

          {/* Quick Actions / Heatmap / GPS Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGetLiveLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/20 border border-blue-400/30 transition-all cursor-pointer min-h-[38px]"
              title="Use GPS Geolocation to spot problems around you"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-blue-200" : "text-white"}`} />
              <span>{isLocating ? "Locating GPS..." : "Spot at My Live Location"}</span>
            </button>

            <button
              onClick={() => setHeatmapActive(!heatmapActive)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer min-h-[38px] ${
                heatmapActive
                  ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-[#FF3B30] border-red-200 dark:border-[#FF3B30]/30 shadow-sm"
                  : "bg-slate-100 dark:bg-[#383838] text-slate-600 dark:text-[#A8A8A8] border-slate-200 dark:border-white/[0.08]"
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${heatmapActive ? "text-red-600 dark:text-[#FF3B30] animate-pulse" : "text-slate-400"}`} />
              <span>Heatmap: {heatmapActive ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>

        {/* 4-Scale Scope Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          <button
            onClick={() => handleSwitchScope(1)}
            className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden cursor-pointer ${
              scopeTier === 1
                ? "bg-orange-50 dark:bg-[#151515] border-[#FF6A00] dark:border-[#FF6A00] text-slate-900 dark:text-[#F5F5F5] shadow-sm ring-1 ring-[#FF6A00]/30"
                : "bg-white dark:bg-[#252525] border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-[#A8A8A8] hover:border-orange-200 dark:hover:border-white/[0.15] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF6A00]"></span>
                <span>1. National-Wide</span>
              </div>
              <span className="text-[10px] font-mono bg-white dark:bg-[#383838] px-1.5 py-0.5 rounded text-slate-600 dark:text-[#A8A8A8] border border-slate-200 dark:border-white/[0.08]">
                Pan-India
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#777777] mt-1">Inter-State Highways & Corridors</div>
          </button>

          <button
            onClick={() => handleSwitchScope(2)}
            className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden cursor-pointer ${
              scopeTier === 2
                ? "bg-amber-50 dark:bg-[#151515] border-[#FF8A00] dark:border-[#FF8A00] text-slate-900 dark:text-[#F5F5F5] shadow-sm ring-1 ring-[#FF8A00]/30"
                : "bg-white dark:bg-[#252525] border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-[#A8A8A8] hover:border-amber-200 dark:hover:border-white/[0.15] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF8A00]"></span>
                <span>2. State-Wise</span>
              </div>
              <span className="text-[10px] font-mono bg-white dark:bg-[#383838] px-1.5 py-0.5 rounded text-slate-600 dark:text-[#A8A8A8] border border-slate-200 dark:border-white/[0.08]">
                {currentState ? currentState.code : "--"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#777777] mt-1">
              {currentState ? `${currentState.name} (${currentState.districtsCount} Dist.)` : "Select State"}
            </div>
          </button>

          <button
            onClick={() => handleSwitchScope(3)}
            className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden cursor-pointer ${
              scopeTier === 3
                ? "bg-emerald-50 dark:bg-[#151515] border-[#20C997] dark:border-[#20C997] text-slate-900 dark:text-[#F5F5F5] shadow-sm ring-1 ring-[#20C997]/30"
                : "bg-white dark:bg-[#252525] border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-[#A8A8A8] hover:border-emerald-200 dark:hover:border-white/[0.15] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#20C997]"></span>
                <span>3. District-Wise</span>
              </div>
              <span className="text-[10px] font-mono bg-white dark:bg-[#383838] px-1.5 py-0.5 rounded text-slate-600 dark:text-[#A8A8A8] border border-slate-200 dark:border-white/[0.08]">
                {currentDistrict ? currentDistrict.name : "--"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#777777] mt-1">
              {currentDistrict ? `${currentDistrict.name} ULB & Wards` : "Select District"}
            </div>
          </button>

          <button
            onClick={() => handleSwitchScope(4)}
            className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden cursor-pointer ${
              scopeTier === 4
                ? "bg-blue-50 dark:bg-[#151515] border-[#3B82F6] dark:border-[#3B82F6] text-slate-900 dark:text-[#F5F5F5] shadow-sm ring-1 ring-[#3B82F6]/30"
                : "bg-white dark:bg-[#252525] border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-[#A8A8A8] hover:border-blue-200 dark:hover:border-white/[0.15] hover:text-slate-900 dark:hover:text-[#F5F5F5]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
                <span>4. Real Place / Pinpoint</span>
              </div>
              <span className="text-[10px] font-mono bg-white dark:bg-[#383838] px-1.5 py-0.5 rounded text-slate-600 dark:text-[#A8A8A8] border border-slate-200 dark:border-white/[0.08]">
                Live Pin
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#777777] mt-1">
              {placeSearchQuery ? placeSearchQuery.slice(0, 30) : "Search Street or Click Spot Location"}
            </div>
          </button>
        </div>

        {/* PROMINENT STATE & DISTRICT SELECTOR CONTROLS */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#151515]/90 border border-slate-200/80 dark:border-white/[0.08] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[#FF6A00]/10 dark:bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] border border-[#FF6A00]/25">
                <Globe className="w-4 h-4" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F5F5F5]">
                Choose State, District & Municipal Jurisdiction:
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-[#A8A8A8] flex items-center gap-2 flex-wrap">
              <span>Active: <strong className="text-[#FF6A00] dark:text-[#FF8A00]">{currentState ? currentState.name : "Not selected"}</strong></span>
              <span>•</span>
              <span>District: <strong className="text-[#20C997]">{currentDistrict ? currentDistrict.name : "Not selected"}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* 1. STATE SELECTOR DROPDOWN */}
            <div className="sm:col-span-4 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] uppercase tracking-wider">
                Select State / UT (36)
              </label>
              <select
                value={selectedStateCode}
                onChange={(e) => handleSelectStateCode(e.target.value)}
                className="w-full bg-white dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] focus:border-[#FF6A00] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#F5F5F5] font-medium outline-none transition-all cursor-pointer min-h-[42px]"
              >
                <option value="" className="bg-white dark:bg-[#151515] text-slate-400">
                  -- Select State / UT --
                </option>
                {STATES_DATA.map((st) => (
                  <option key={st.code} value={st.code} className="bg-white dark:bg-[#151515] text-slate-900 dark:text-[#F5F5F5]">
                    {st.name} ({st.code}) — {st.districtsCount} Districts
                  </option>
                ))}
              </select>
            </div>

            {/* 2. DISTRICT SELECTOR DROPDOWN */}
            <div className="sm:col-span-4 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] uppercase tracking-wider">
                Select District ({currentDistricts.length})
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleSelectDistrictId(e.target.value)}
                disabled={!selectedStateCode || currentDistricts.length === 0}
                className="w-full bg-white dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] focus:border-[#20C997] disabled:opacity-50 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#F5F5F5] font-medium outline-none transition-all cursor-pointer min-h-[42px]"
              >
                <option value="" className="bg-white dark:bg-[#151515] text-slate-400">
                  {selectedStateCode ? "-- Select District --" : "-- First select a state --"}
                </option>
                {currentDistricts.map((dist) => (
                  <option key={dist.id} value={dist.id} className="bg-white dark:bg-[#151515] text-slate-900 dark:text-[#F5F5F5]">
                    {dist.name} (SLA: {dist.slaPercentage}%)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. WARD / ULB ZONE SELECTOR DROPDOWN */}
            <div className="sm:col-span-4 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A8A8A8] uppercase tracking-wider">
                Select Ward / ULB Zone {currentWards.length > 0 ? `(${currentWards.length})` : ""}
              </label>
              <select
                value={selectedWardId}
                onChange={(e) => handleSelectWardId(e.target.value)}
                disabled={!selectedDistrictId || currentWards.length === 0}
                className="w-full bg-white dark:bg-[#303030] border border-slate-200 dark:border-white/[0.08] focus:border-[#3B82F6] disabled:opacity-50 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#F5F5F5] font-medium outline-none transition-all cursor-pointer min-h-[42px]"
              >
                <option value="" className="bg-white dark:bg-[#151515] text-slate-400">
                  {selectedDistrictId ? "-- Select Ward / Sector --" : "-- First select a district --"}
                </option>
                {currentWards.length > 0 ? (
                  currentWards.map((w) => (
                    <option key={w.id} value={w.id} className="bg-white dark:bg-[#151515] text-slate-900 dark:text-[#F5F5F5]">
                      {w.wardNumber}: {w.name} ({w.activeCount} active)
                    </option>
                  ))
                ) : (
                  currentDistrict && <option value="all">All Central Wards ({currentDistrict.name})</option>
                )}
              </select>
            </div>
          </div>

          {/* Quick State Hop Chips */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#777777] whitespace-nowrap uppercase tracking-wider mr-1">
              Quick State Hop:
            </span>
            {POPULAR_STATES.map((pst) => (
              <button
                key={pst.code}
                onClick={() => handleSelectStateCode(pst.code)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border cursor-pointer ${
                  selectedStateCode === pst.code
                    ? "bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] text-white border-transparent shadow-sm"
                    : "bg-white dark:bg-[#383838] text-slate-700 dark:text-[#F5F5F5] border-slate-200 dark:border-white/[0.08] hover:border-orange-300 dark:hover:border-white/[0.15]"
                }`}
              >
                {pst.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar & Category Filters for Real-Place Spotting */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-3">
          <form onSubmit={handleRunSearch} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 dark:text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={placeSearchQuery}
                onChange={(e) => setPlaceSearchQuery(e.target.value)}
                placeholder="Search real Google Maps landmark (e.g. MG Road, Rajwada Indore, Linking Road Mumbai, Civil Hospital)..."
                className="w-full bg-slate-50/80 dark:bg-[#151515]/80 border border-slate-200/80 dark:border-white/[0.08] focus:border-[#FF6A00] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#F5F5F5] placeholder:text-slate-400 dark:placeholder:text-[#777777] outline-none transition-all min-h-[42px]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoadingSpots}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A00]/25 transition-all whitespace-nowrap cursor-pointer min-h-[42px]"
            >
              {isLoadingSpots ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Google Maps...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Spot Problems on Maps</span>
                </>
              )}
            </button>
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#777777] flex items-center gap-1 whitespace-nowrap mr-1">
              <SlidersHorizontal className="w-3 h-3" /> Focus:
            </span>
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategoryFilter(cat);
                  fetchGoogleMapsProblemSpots(
                    scopeTier === 1 ? "national" : scopeTier === 2 ? "state" : scopeTier === 3 ? "district" : "real_place",
                    currentState?.name || "Pan-India",
                    currentDistrict?.name || "National",
                    placeSearchQuery
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap border cursor-pointer ${
                  activeCategoryFilter === cat
                    ? "bg-[#FF6A00]/15 text-[#FF6A00] dark:text-[#FF8A00] border-[#FF6A00]/30 shadow-sm"
                    : "bg-white dark:bg-[#383838] text-slate-600 dark:text-[#A8A8A8] border-slate-200 dark:border-white/[0.08] hover:border-orange-300 dark:hover:border-white/[0.15]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive Google Maps Embed & Multi-Tier Jurisdiction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Live Google Maps Stage & Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-white/80 dark:bg-[#303030] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-5 shadow-[0_15px_45px_rgba(210,190,165,0.18)] dark:shadow-2xl flex flex-col justify-between transition-colors">
            {/* Map Header & Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08] text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-[#3B82F6] border border-blue-200 dark:border-blue-500/20">
                  <MapPin className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-[#F5F5F5] text-sm">
                    {scopeTier === 1
                      ? "Pan-India National Highways & Urban Corridors"
                      : scopeTier === 2
                      ? `${currentState?.name || "State"} Geo-Grid`
                      : scopeTier === 3
                      ? `${currentDistrict?.name || "District"} Municipal Jurisdiction`
                      : placeSearchQuery
                      ? `Real Place: ${placeSearchQuery.slice(0, 35)}`
                      : "Live GPS & Real-Place Spotter"}
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-[#777777]">
                    Live Google Maps Interactive Coordinates
                  </div>
                </div>
              </div>

              {/* Map Layer / External Toggle */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMapMode(mapMode === "standard" ? "satellite" : "standard")}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#383838] hover:bg-slate-200 dark:hover:bg-[#404040] text-[11px] font-bold text-slate-700 dark:text-[#F5F5F5] border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer min-h-[34px]"
                >
                  {mapMode === "standard" ? "Satellite View" : "Road View"}
                </button>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${getGoogleMapsEmbedQuery()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-[#151515] hover:bg-blue-100 dark:hover:bg-[#383838] text-[11px] font-bold text-blue-700 dark:text-[#3B82F6] border border-blue-200 dark:border-blue-500/30 transition-all min-h-[34px]"
                  title="Open in official Google Maps"
                >
                  <span>Open Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Embedded Live Google Maps Frame */}
            <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-slate-100 dark:bg-[#151515] border border-slate-200/80 dark:border-white/[0.08] overflow-hidden my-3 shadow-inner">
              <iframe
                title="Google Maps Real Place Spotter"
                src={currentEmbedUrl}
                className="w-full h-full border-0 filter brightness-[1.0] dark:brightness-[0.95] contrast-[1.0] dark:contrast-[1.05]"
                loading="lazy"
                allowFullScreen
              />

              {/* Overlaid Spot Pin Indicator on Map */}
              {activeSpotForPreview && (
                <div className="absolute top-3 left-3 max-w-xs p-3 rounded-2xl bg-white/95 dark:bg-[#151515]/95 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] shadow-2xl text-left z-10 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-[#FF3B30] border border-red-200 dark:border-[#FF3B30]/30">
                      {activeSpotForPreview.severity} SPOT
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-[#777777] font-mono">Google Maps Pin</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] mt-1.5 truncate">
                    {activeSpotForPreview.title}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-[#A8A8A8] line-clamp-2 mt-0.5">
                    {activeSpotForPreview.reportedCondition}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Scope Drill-Down Viewers */}
            {scopeTier === 1 && (
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#151515]/80 border border-slate-200/80 dark:border-white/[0.08]">
                <div className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] mb-2 flex items-center justify-between">
                  <span>Pan-India High-Resolution State Redressal Directory</span>
                  <span className="text-[10px] text-slate-500 dark:text-[#777777]">Click to drill down to state</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                  {STATES_DATA.map((st) => (
                    <button
                      key={st.code}
                      onClick={() => handleSelectStateCode(st.code)}
                      className={`p-2 rounded-xl border text-left transition-all group cursor-pointer ${
                        selectedStateCode === st.code
                          ? "bg-amber-100 dark:bg-[#383838] border-[#FF6A00] dark:border-[#FF6A00] text-slate-900 dark:text-[#F5F5F5] shadow-sm"
                          : "bg-white dark:bg-[#252525] hover:bg-amber-50 dark:hover:bg-[#353535] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-[#A8A8A8]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] group-hover:text-[#FF6A00] dark:group-hover:text-[#FF8A00] truncate">
                          {st.name}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-[#777777]">{st.code}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-[#777777] mt-0.5">
                        SLA: <strong className="text-emerald-600 dark:text-[#20C997]">{st.slaPercentage}%</strong>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {scopeTier === 2 && (
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#151515]/80 border border-slate-200/80 dark:border-white/[0.08]">
                <div className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] mb-2 flex items-center justify-between">
                  <span>{currentState ? `${currentState.name} • District Administrative Hubs` : "Select a State above to inspect districts"}</span>
                  {currentState && <span className="text-[10px] text-slate-500 dark:text-[#777777]">Click to inspect district</span>}
                </div>
                {currentDistricts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                    {currentDistricts.map((dist) => (
                      <button
                        key={dist.id}
                        onClick={() => handleSelectDistrictId(dist.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedDistrictId === dist.id
                            ? "bg-amber-100 dark:bg-[#383838] border-[#FF8A00] dark:border-[#FF8A00] text-slate-900 dark:text-[#F5F5F5] shadow-sm"
                            : "bg-white dark:bg-[#252525] hover:bg-slate-100 dark:hover:bg-[#353535] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-[#A8A8A8]"
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] truncate">{dist.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-[#777777] mt-0.5">
                          {dist.wardsCount} Wards • {dist.totalComplaints} Cases
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-[#777777] py-2">
                    Please select a State / UT from the dropdown or click a quick hop button above.
                  </p>
                )}
              </div>
            )}

            {scopeTier === 3 && (
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#151515]/80 border border-slate-200/80 dark:border-white/[0.08]">
                <div className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] mb-2 flex items-center justify-between">
                  <span>{currentDistrict ? `${currentDistrict.name} Municipal Council • Ward Micro-Grid` : "Select a District above to inspect wards"}</span>
                  {currentWards.length > 0 && <span className="text-[10px] text-slate-500 dark:text-[#777777]">Select ward for local triage</span>}
                </div>
                {currentWards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {currentWards.map((ward) => (
                      <button
                        key={ward.id}
                        onClick={() => handleSelectWardId(ward.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedWardId === ward.id
                            ? "bg-emerald-100 dark:bg-[#383838] border-[#20C997] dark:border-[#20C997] text-slate-900 dark:text-[#F5F5F5] shadow-sm"
                            : "bg-white dark:bg-[#252525] hover:bg-slate-100 dark:hover:bg-[#353535] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-[#A8A8A8]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] truncate">{ward.name}</span>
                          <span className="text-[9px] bg-amber-100 dark:bg-[#151515] text-amber-800 dark:text-[#FF8A00] border border-amber-300 dark:border-[#FF8A00]/30 px-2 py-0.5 rounded-full font-bold">
                            {ward.activeCount} Active
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-[#777777] mt-0.5">
                          AE: {ward.nodalEngineerName}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-[#777777] py-2">
                    Please select a District from the dropdown or click 'Spot at My Live Location'.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Google Maps Grounded Real-Place Problem Spots List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-white/80 dark:bg-[#303030] backdrop-blur-xl border border-white/90 dark:border-white/[0.08] p-5 shadow-[0_15px_45px_rgba(210,190,165,0.18)] dark:shadow-2xl space-y-3.5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5F5F5] flex items-center gap-1.5 font-heading">
                  <Flame className="w-4 h-4 text-[#FF6A00] dark:text-[#FF8A00]" />
                  <span>Real Problem Spots ({groundedSpots.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-[#777777]">
                  Grounded via Google Maps Places & Citizen Grounding
                </p>
              </div>

              <button
                onClick={() => fetchGoogleMapsProblemSpots(
                  scopeTier === 1 ? "national" : scopeTier === 2 ? "state" : scopeTier === 3 ? "district" : "real_place",
                  currentState?.name || "Pan-India",
                  currentDistrict?.name || "National",
                  placeSearchQuery
                )}
                disabled={isLoadingSpots}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#383838] hover:bg-slate-200 dark:hover:bg-[#404040] text-slate-700 dark:text-[#F5F5F5] border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Refresh Google Maps spots"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSpots ? "animate-spin text-[#FF6A00]" : ""}`} />
              </button>
            </div>

            {/* Grounded Problem Cards List */}
            {isLoadingSpots ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-xs font-bold text-slate-700 dark:text-[#F5F5F5]">
                  Querying Google Maps Real-Time Grounding Engine...
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#777777] max-w-xs mx-auto">
                  Extracting place landmarks, road hazards, waterlogging intersections, and municipal jurisdictions.
                </p>
              </div>
            ) : groundedSpots.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-[#151515]/60 border border-slate-200/80 dark:border-white/[0.08] text-center space-y-2">
                <Info className="w-6 h-6 text-slate-400 dark:text-[#777777] mx-auto" />
                <div className="text-xs font-bold text-slate-700 dark:text-[#F5F5F5]">No specific spots returned</div>
                <p className="text-[11px] text-slate-500 dark:text-[#777777]">
                  Try searching for another landmark or state/district name.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {groundedSpots.map((spot) => {
                  const isSelected = activeSpotForPreview?.id === spot.id;
                  return (
                    <div
                      key={spot.id}
                      onClick={() => setActiveSpotForPreview(spot)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                        isSelected
                          ? "bg-orange-50/60 dark:bg-[#383838] border-[#FF6A00] dark:border-[#FF6A00] shadow-md shadow-[#FF6A00]/15 ring-1 ring-[#FF6A00]/40"
                          : "bg-white dark:bg-[#252525] hover:bg-slate-50 dark:hover:bg-[#353535] border-slate-200/80 dark:border-white/[0.08] hover:border-orange-300 dark:hover:border-white/[0.15] shadow-sm"
                      }`}
                    >
                      {/* Top Row: Severity Badge & Category */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                            spot.severity === "CRITICAL"
                              ? "bg-red-100 dark:bg-[#151515] text-red-800 dark:text-[#FF3B30] border-red-200 dark:border-[#FF3B30]/30"
                              : spot.severity === "HIGH"
                              ? "bg-amber-100 dark:bg-[#151515] text-amber-800 dark:text-[#FF8A00] border-amber-200 dark:border-[#FF8A00]/30"
                              : "bg-blue-100 dark:bg-[#151515] text-blue-800 dark:text-[#3B82F6] border-blue-200 dark:border-[#3B82F6]/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              spot.severity === "CRITICAL"
                                ? "bg-red-500 dark:bg-[#FF3B30] animate-pulse"
                                : spot.severity === "HIGH"
                                ? "bg-amber-500 dark:bg-[#FF8A00]"
                                : "bg-blue-500 dark:bg-[#3B82F6]"
                            }`}
                          ></span>
                          <span>{spot.severity} HAZARD</span>
                        </span>

                        <span className="text-[10px] font-semibold text-slate-500 dark:text-[#777777] truncate max-w-[160px]">
                          {spot.category}
                        </span>
                      </div>

                      {/* Spot Title */}
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F5F5F5] mt-2 group-hover:text-[#FF6A00] dark:group-hover:text-[#FF8A00] transition-colors flex items-start justify-between gap-2 font-heading">
                        <span>{spot.title}</span>
                        <MapPin className="w-3.5 h-3.5 text-[#FF6A00] dark:text-[#FF8A00] shrink-0 mt-0.5" />
                      </h4>

                      {/* Location Address */}
                      <div className="text-[11px] text-slate-500 dark:text-[#A8A8A8] mt-0.5 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-slate-400 dark:text-[#777777] shrink-0" />
                        <span className="truncate">{spot.locationName}</span>
                      </div>

                      {/* Hazard Description */}
                      <p className="text-[11px] text-slate-700 dark:text-[#A8A8A8] mt-2 line-clamp-3 bg-slate-50 dark:bg-[#151515]/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
                        {spot.hazardDescription}
                      </p>

                      {/* Authority & SLA */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-[10px] text-slate-500 dark:text-[#777777]">
                        <div className="truncate max-w-[180px]">
                          Dept: <strong className="text-slate-800 dark:text-[#F5F5F5]">{spot.responsibleAuthority}</strong>
                        </div>
                        <span className="text-emerald-600 dark:text-[#20C997] font-bold">SLA: 24h - 48h</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 mt-3">
                        {/* 1. Open in Google Maps */}
                        <a
                          href={spot.googleMapsUrl || spot.placeSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-[#383838] hover:bg-slate-200 dark:hover:bg-[#404040] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-[#F5F5F5] text-[10px] font-bold flex items-center justify-center gap-1 transition-all min-h-[34px]"
                        >
                          <ExternalLink className="w-3 h-3 text-[#3B82F6]" />
                          <span>Google Maps</span>
                        </a>

                        {/* 2. File Geotagged Grievance from this spot */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileFromSpot(spot);
                          }}
                          className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A00] hover:from-[#ff791a] hover:to-[#ff991a] text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer min-h-[34px]"
                        >
                          <FileText className="w-3 h-3" />
                          <span>File Grievance</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grounding Sources & Official Citations */}
            {groundingChunks && groundingChunks.length > 0 && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#151515]/90 border border-slate-200/80 dark:border-white/[0.08]">
                <div className="text-[11px] font-bold text-slate-800 dark:text-[#F5F5F5] flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#FF6A00] dark:text-[#FF8A00]" />
                  <span>Google Maps Grounded References ({groundingChunks.length})</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {groundingChunks.map((chunk, idx) => {
                    const title = chunk.maps?.title || chunk.web?.title || `Google Maps Citation #${idx + 1}`;
                    const uri = chunk.maps?.uri || chunk.web?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`;
                    return (
                      <a
                        key={idx}
                        href={uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 dark:text-[#3B82F6] hover:text-blue-700 dark:hover:text-[#60a5fa] hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{title}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
