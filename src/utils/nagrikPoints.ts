import {
  NagrikTierId,
  NagrikTierInfo,
  CivicPointAction,
  CivicPointTransaction,
  NagrikLeaderboardEntry,
  NagrikLeaderboardScope,
} from "../types";
import { STATES_DATA, ALL_STATE_DISTRICTS } from "../data/initialData";
import {
  getAllOfficialStates,
  getOfficialDistricts,
  getOfficialWardDropdownOptions,
  getOfficialWards,
  findOfficialState,
  findOfficialDistrict,
} from "../data/jurisdictions";

export const NAGRIK_TIERS: Record<NagrikTierId, NagrikTierInfo> = {
  prathmik: {
    id: "prathmik",
    name: "Prathmik Nagrik",
    hindiName: "प्रारंभिक नागरिक",
    minPoints: 0,
    maxPoints: 99,
    badgeLabel: "🥉 Prathmik Nagrik",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60",
    description: "Welcome to JanVani! Initiating citizen actively learning municipal workflows and logging local civic problems.",
    perks: [
      "Access to public grievance registration",
      "Real-time SMS & WhatsApp SLA notifications",
      "Ward GIS interactive problem heatmap view",
    ],
  },
  jagruk: {
    id: "jagruk",
    name: "Jagruk Nagrik",
    hindiName: "जागरूक नागरिक",
    minPoints: 100,
    maxPoints: 299,
    badgeLabel: "🥈 Jagruk Nagrik",
    badgeColor: "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
    description: "Vigilant resident reporting recurring sanitation, streetlight, and water issues across their neighborhood.",
    perks: [
      "All Prathmik privileges",
      "Citizen discussion & community feedback badges on Civic Reels",
      "Direct upvoting weight on ward infrastructure priorities",
    ],
  },
  karmat: {
    id: "karmat",
    name: "Karmat Nagrik",
    hindiName: "कर्मठ नागरिक",
    minPoints: 300,
    maxPoints: 599,
    badgeLabel: "🏅 Karmat Nagrik",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60",
    description: "Active community builder uploading photo/video proof, following up with nodal officers, and driving tangible fixes.",
    perks: [
      "All Jagruk privileges",
      "Priority triage tag for ward field inspection teams",
      "Direct WhatsApp Hotline voice notes transcription privilege",
      "Special 'Verified Resident' marker on all public feed items",
    ],
  },
  adarsh: {
    id: "adarsh",
    name: "Adarsh Nagrik",
    hindiName: "आदर्श नागरिक",
    minPoints: 600,
    maxPoints: 999,
    badgeLabel: "🌟 Adarsh Nagrik (Top 5%)",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60",
    description: "Model Citizen recognized in the top tier of the municipality. Regularly mobilizes community upvotes and verifies resolved work.",
    perks: [
      "All Karmat privileges",
      "Fast-Track 24h SLA review flag on all filed issues",
      "Monthly Municipal Council Citizen Advisory panel invitation",
      "Official Ward Councillor digital commendation badge",
    ],
  },
  sarvottam: {
    id: "sarvottam",
    name: "Sarvottam Nagrik (Best Nagrik)",
    hindiName: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    minPoints: 1000,
    maxPoints: 999999,
    badgeLabel: "🏆 Best Nagrik (Civic Guardian)",
    badgeColor: "bg-gradient-to-r from-amber-400/20 via-orange-500/20 to-yellow-400/20 text-orange-950 dark:text-amber-300 border-amber-400/80 dark:border-amber-400/50 shadow-sm",
    description: "Highest Civic Honor! The Supreme 'Best Nagrik' of the city. Champion of transparent governance, clean wards, and rapid problem resolution.",
    perks: [
      "All Adarsh privileges",
      "Official 'Best Nagrik Samman Patra' Certificate signed by District Collector & Municipal President",
      "Dedicated Direct-Dial emergency desk with Nodal Executive Engineers",
      "Prominently featured in City Hall of Fame & Ward Leaderboard",
      "Special Golden 'Best Nagrik' crown badge across Reels, Feeds, and Receipts",
    ],
  },
};

export const POINT_RULES: Record<
  CivicPointAction,
  { points: number; title: string; defaultDesc: string }
> = {
  FILE_GRIEVANCE: {
    points: 50,
    title: "Registered Civic Grievance",
    defaultDesc: "Logged an actionable public infrastructure or municipal concern.",
  },
  UPLOAD_PROOF: {
    points: 30,
    title: "Uploaded Media Proof",
    defaultDesc: "Attached verified on-site photograph or geotagged video evidence.",
  },
  VOICE_SEVA_REPORT: {
    points: 40,
    title: "Voice AI Seva Submission",
    defaultDesc: "Used AI voice speech recognition to file instant multi-lingual complaint.",
  },
  UPVOTE_GRIEVANCE: {
    points: 5,
    title: "Endorsed Community Issue",
    defaultDesc: "Supported a neighbor's grievance to accelerate municipal visibility.",
  },
  RECEIVE_UPVOTE: {
    points: 10,
    title: "Community Upvote Received",
    defaultDesc: "Fellow citizens upvoted and endorsed your reported public issue.",
  },
  CONFIRM_RESOLUTION: {
    points: 100,
    title: "Verified Resolution On-Site",
    defaultDesc: "Inspected and confirmed quality of road/drainage/lighting repair work.",
  },
  POST_CIVIC_UPDATE: {
    points: 15,
    title: "Civic Observation Shared",
    defaultDesc: "Contributed constructive ground observation on active grievance reels.",
  },
  RTI_CIVIC_AUDIT: {
    points: 35,
    title: "Civic Audit / RTI Inquiry",
    defaultDesc: "Promoted governance transparency through formal civic inquiry.",
  },
};

export function getNagrikTier(points: number): NagrikTierInfo {
  if (points >= 1000) return NAGRIK_TIERS.sarvottam;
  if (points >= 600) return NAGRIK_TIERS.adarsh;
  if (points >= 300) return NAGRIK_TIERS.karmat;
  if (points >= 100) return NAGRIK_TIERS.jagruk;
  return NAGRIK_TIERS.prathmik;
}

export function getNextTierProgress(points: number): {
  currentTier: NagrikTierInfo;
  nextTier: NagrikTierInfo | null;
  pointsNeeded: number;
  progressPercent: number;
} {
  const currentTier = getNagrikTier(points);
  let nextTier: NagrikTierInfo | null = null;

  if (currentTier.id === "prathmik") nextTier = NAGRIK_TIERS.jagruk;
  else if (currentTier.id === "jagruk") nextTier = NAGRIK_TIERS.karmat;
  else if (currentTier.id === "karmat") nextTier = NAGRIK_TIERS.adarsh;
  else if (currentTier.id === "adarsh") nextTier = NAGRIK_TIERS.sarvottam;
  else nextTier = null;

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      pointsNeeded: 0,
      progressPercent: 100,
    };
  }

  const range = nextTier.minPoints - currentTier.minPoints;
  const currentInRange = points - currentTier.minPoints;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100)));
  const pointsNeeded = Math.max(0, nextTier.minPoints - points);

  return {
    currentTier,
    nextTier,
    pointsNeeded,
    progressPercent,
  };
}

const DEFAULT_INITIAL_TRANSACTIONS: CivicPointTransaction[] = [
  {
    id: "tx-init-1",
    timestamp: "2 days ago",
    points: 50,
    action: "FILE_GRIEVANCE",
    title: "Registered Civic Grievance",
    description: "Monsoon road crater & collapsed manhole near Hospital Road.",
    grievanceToken: "JV-MP-DHAR-2026-0891",
  },
  {
    id: "tx-init-2",
    timestamp: "2 days ago",
    points: 30,
    action: "UPLOAD_PROOF",
    title: "Uploaded Video Evidence",
    description: "Geotagged 9:16 mobile evidence demonstrating water stagnation.",
    grievanceToken: "JV-MP-DHAR-2026-0891",
  },
  {
    id: "tx-init-3",
    timestamp: "Yesterday",
    points: 100,
    action: "CONFIRM_RESOLUTION",
    title: "Verified Resolution On-Site",
    description: "Citizen dual-verification of repaired asphalt patching on Ward 14 roadway.",
    grievanceToken: "JV-MP-DHAR-2026-0105",
  },
  {
    id: "tx-init-4",
    timestamp: "Yesterday",
    points: 10,
    action: "RECEIVE_UPVOTE",
    title: "Community Upvote Milestone",
    description: "Your road crater report was endorsed by 18 ward residents.",
  },
  {
    id: "tx-init-5",
    timestamp: "Today, 10:15 AM",
    points: 40,
    action: "VOICE_SEVA_REPORT",
    title: "Voice AI Seva Submission",
    description: "Reported low voltage transformer sparks via Hindi speech prompt.",
  },
];

export function getStoredNagrikData(userId: string = "default_citizen"): {
  points: number;
  transactions: CivicPointTransaction[];
} {
  try {
    const keyPoints = `janvani_nagrik_points_${userId}`;
    const keyTx = `janvani_nagrik_tx_${userId}`;

    const storedPoints = localStorage.getItem(keyPoints);
    const storedTx = localStorage.getItem(keyTx);

    if (storedPoints !== null && storedTx !== null) {
      return {
        points: parseInt(storedPoints, 10) || 0,
        transactions: JSON.parse(storedTx) || [],
      };
    }
  } catch (err) {
    console.warn("Could not retrieve stored Nagrik points:", err);
  }

  // Initial demo balance for an active citizen: 480 points (Karmat Nagrik)
  const initialPoints = 480;
  try {
    localStorage.setItem(`janvani_nagrik_points_${userId}`, initialPoints.toString());
    localStorage.setItem(
      `janvani_nagrik_tx_${userId}`,
      JSON.stringify(DEFAULT_INITIAL_TRANSACTIONS)
    );
  } catch {
    // ignore
  }

  return {
    points: initialPoints,
    transactions: DEFAULT_INITIAL_TRANSACTIONS,
  };
}

export function awardNagrikPoints(
  userId: string = "default_citizen",
  action: CivicPointAction,
  customTitle?: string,
  customDesc?: string,
  pointsOverride?: number,
  grievanceToken?: string
): {
  newPoints: number;
  addedPoints: number;
  currentTier: NagrikTierInfo;
  tierChanged: boolean;
  message: string;
} {
  const rule = POINT_RULES[action];
  const addedPoints = pointsOverride ?? (rule ? rule.points : 10);
  const current = getStoredNagrikData(userId);
  const prevTier = getNagrikTier(current.points);

  const newPoints = current.points + addedPoints;
  const newTier = getNagrikTier(newPoints);
  const tierChanged = newTier.id !== prevTier.id;

  const newTx: CivicPointTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: "Just now",
    points: addedPoints,
    action,
    title: customTitle || rule?.title || "Civic Contribution",
    description: customDesc || rule?.defaultDesc || "Points credited for civic action.",
    grievanceToken,
  };

  const updatedTx = [newTx, ...current.transactions].slice(0, 50);

  try {
    localStorage.setItem(`janvani_nagrik_points_${userId}`, newPoints.toString());
    localStorage.setItem(`janvani_nagrik_tx_${userId}`, JSON.stringify(updatedTx));
    window.dispatchEvent(
      new CustomEvent("nagrik_points_updated", {
        detail: {
          points: newPoints,
          addedPoints,
          action,
          newTier,
          tierChanged,
        },
      })
    );
  } catch (err) {
    console.warn("Error persisting points:", err);
  }

  return {
    newPoints,
    addedPoints,
    currentTier: newTier,
    tierChanged,
    message: tierChanged
      ? `Promoted to ${newTier.name}! You earned +${addedPoints} Civic Points.`
      : `+${addedPoints} Civic Points added for ${customTitle || rule?.title}!`,
  };
}

export interface LeaderboardFilterOptions {
  scope?: NagrikLeaderboardScope;
  stateCode?: string;
  districtId?: string;
  wardId?: string;
  wardName?: string;
  searchQuery?: string;
}

export interface UserRankSummary {
  nationalRank: number;
  totalNational: number;
  stateRank: number;
  totalState: number;
  stateName: string;
  districtRank: number;
  totalDistrict: number;
  districtName: string;
  wardRank: number;
  totalWard: number;
  wardName: string;
  activeScopeRank: number;
  activeScopeTotal: number;
  activeScopeLabel: string;
  isDistrictBestNagrik: boolean;
  isStateBestNagrik: boolean;
  isNationalBestNagrik: boolean;
}

export interface RankedLeaderboardResult {
  scope: NagrikLeaderboardScope;
  stateCode: string;
  stateName: string;
  districtId: string;
  districtName: string;
  wardName: string;
  entries: NagrikLeaderboardEntry[];
  userRank: number;
  userEntry: NagrikLeaderboardEntry;
  totalParticipants: number;
  userRankSummary: UserRankSummary;
}

export const SEED_LEADERBOARD_CITIZENS: Omit<NagrikLeaderboardEntry, "rank">[] = [
  // MADHYA PRADESH - DHAR
  {
    id: "cit-mp-dhar-1",
    name: "Rameshwar Patel",
    avatarText: "RP",
    points: 1420,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 14 (Old Palace & Bada Bazar)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 38,
    reportedCount: 42,
    upvotesCount: 264,
    badge: "🏆 Dhar District #1 Best Nagrik",
    specialHonor: "Pioneered 100% Pothole-free heritage road campaign",
  },
  {
    id: "cit-mp-dhar-2",
    name: "Smt. Sunita Verma",
    avatarText: "SV",
    points: 1250,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 07 (Civil Lines & Court Area)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 31,
    reportedCount: 34,
    upvotesCount: 198,
    badge: "🏆 Clean Water Pioneer",
    specialHonor: "Reported underground pipeline contamination within 2 hours",
  },
  {
    id: "cit-mp-dhar-3",
    name: "Dr. Anand Kulkarni",
    avatarText: "AK",
    points: 980,
    position: "Adarsh Nagrik (Model Citizen)",
    hindiPosition: "आदर्श नागरिक",
    tierId: "adarsh",
    ward: "Ward 22 (Industrial Area & Bypass)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 24,
    reportedCount: 28,
    upvotesCount: 162,
    badge: "🌟 Road Safety Vanguard",
  },
  {
    id: "cit-mp-dhar-4",
    name: "Meera Malviya",
    avatarText: "MM",
    points: 840,
    position: "Adarsh Nagrik (Model Citizen)",
    hindiPosition: "आदर्श नागरिक",
    tierId: "adarsh",
    ward: "Ward 14 (Old Palace & Bada Bazar)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 19,
    reportedCount: 22,
    upvotesCount: 135,
    badge: "🌟 Sanitation Sentinel",
  },
  {
    id: "cit-mp-dhar-5",
    name: "Vikram Singh Rathore",
    avatarText: "VR",
    points: 620,
    position: "Adarsh Nagrik (Model Citizen)",
    hindiPosition: "आदर्श नागरिक",
    tierId: "adarsh",
    ward: "Ward 03 (Mandu Gateway)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 15,
    reportedCount: 18,
    upvotesCount: 88,
    badge: "🌟 Pothole Patrol",
  },
  {
    id: "cit-mp-dhar-6",
    name: "Kavita Chouhan",
    avatarText: "KC",
    points: 430,
    position: "Karmat Nagrik (Vigilant Citizen)",
    hindiPosition: "कर्मठ नागरिक",
    tierId: "karmat",
    ward: "Ward 14 (Old Palace & Bada Bazar)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 9,
    reportedCount: 12,
    upvotesCount: 64,
    badge: "🏅 Green Ward Crusader",
  },
  {
    id: "cit-mp-dhar-7",
    name: "Deepak Solanki",
    avatarText: "DS",
    points: 310,
    position: "Karmat Nagrik (Vigilant Citizen)",
    hindiPosition: "कर्मठ नागरिक",
    tierId: "karmat",
    ward: "Ward 19 (Krishi Upaj Mandi)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 6,
    reportedCount: 9,
    upvotesCount: 42,
    badge: "🏅 Lighting Watchdog",
  },
  {
    id: "cit-mp-dhar-8",
    name: "Pooja Bhargava",
    avatarText: "PB",
    points: 190,
    position: "Jagruk Nagrik (Active Citizen)",
    hindiPosition: "जागरूक नागरिक",
    tierId: "jagruk",
    ward: "Ward 11 (Teacher Colony)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 4,
    reportedCount: 6,
    upvotesCount: 29,
    badge: "🥈 Rapid Responder",
  },
  {
    id: "cit-mp-dhar-9",
    name: "Gajendra Patidar",
    avatarText: "GP",
    points: 550,
    position: "Karmat Nagrik (Vigilant Citizen)",
    hindiPosition: "कर्मठ नागरिक",
    tierId: "karmat",
    ward: "Ward 27 (Central Sector 3 Zone)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 13,
    reportedCount: 15,
    upvotesCount: 78,
    badge: "🏅 Sector 3 Civic Lead",
  },
  {
    id: "cit-mp-dhar-10",
    name: "Kailash Choudhary",
    avatarText: "KC",
    points: 720,
    position: "Adarsh Nagrik (Model Citizen)",
    hindiPosition: "आदर्श नागरिक",
    tierId: "adarsh",
    ward: "Ward 01 (Industrial Sector I & II)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 17,
    reportedCount: 20,
    upvotesCount: 110,
    badge: "🌟 Industrial Zone Watchdog",
  },
  {
    id: "cit-mp-dhar-11",
    name: "Dr. Vinita Joshi",
    avatarText: "VJ",
    points: 680,
    position: "Adarsh Nagrik (Model Citizen)",
    hindiPosition: "आदर्श नागरिक",
    tierId: "adarsh",
    ward: "Ward 12 (Hospital Road Sector)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 16,
    reportedCount: 19,
    upvotesCount: 95,
    badge: "🌟 Health Zone Vanguard",
  },
  {
    id: "cit-mp-dhar-12",
    name: "Sanjay Malviya",
    avatarText: "SM",
    points: 390,
    position: "Karmat Nagrik (Vigilant Citizen)",
    hindiPosition: "कर्मठ नागरिक",
    tierId: "karmat",
    ward: "Ward 45 (Patel Nagar & Chhatrapati Chowk)",
    district: "Dhar",
    districtId: "dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 8,
    reportedCount: 11,
    upvotesCount: 52,
    badge: "🏅 Community Mobilizer",
  },

  // MADHYA PRADESH - INDORE
  {
    id: "cit-mp-ind-1",
    name: "Ashish Gehlot",
    avatarText: "AG",
    points: 1490,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 1 (Rajwada & Sarafa)",
    district: "Indore",
    districtId: "indore",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 44,
    reportedCount: 46,
    upvotesCount: 312,
    badge: "🏆 Indore Swachh Guardian #1",
    specialHonor: "Swachh Survekshan #1 City Citizen Volunteer Head",
  },
  {
    id: "cit-mp-ind-2",
    name: "Radhika Mandloi",
    avatarText: "RM",
    points: 1180,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 54 (Vijay Nagar & Scheme 54)",
    district: "Indore",
    districtId: "indore",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 28,
    reportedCount: 31,
    upvotesCount: 185,
    badge: "🌟 Zero-Waste Advocate",
  },

  // MADHYA PRADESH - BHOPAL
  {
    id: "cit-mp-bho-1",
    name: "Sanjay Trivedi",
    avatarText: "ST",
    points: 1320,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 21 (Arera Colony)",
    district: "Bhopal",
    districtId: "bhopal",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 35,
    reportedCount: 39,
    upvotesCount: 240,
    badge: "🏆 Bhopal Lake City Champion",
    specialHonor: "Upper Lake catchment waste prevention champion",
  },
  {
    id: "cit-mp-bho-2",
    name: "Alokita Sen",
    avatarText: "AS",
    points: 890,
    position: "Adarsh Nagrik (Model Citizen)",
    hindiPosition: "आदर्श नागरिक",
    tierId: "adarsh",
    ward: "Ward 10 (New Market)",
    district: "Bhopal",
    districtId: "bhopal",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 21,
    reportedCount: 25,
    upvotesCount: 142,
    badge: "🌟 Smart Transit Watchdog",
  },

  // MADHYA PRADESH - UJJAIN
  {
    id: "cit-mp-ujj-1",
    name: "Mahant Gaurav Sharma",
    avatarText: "GS",
    points: 1210,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 1 (Mahakal Corridor)",
    district: "Ujjain",
    districtId: "ujjain",
    state: "Madhya Pradesh",
    stateCode: "MP",
    resolvedCount: 29,
    reportedCount: 32,
    upvotesCount: 210,
    badge: "🏆 Ujjain Heritage Guardian",
    specialHonor: "Shipra Ghat Cleanliness Volunteer Lead",
  },

  // MAHARASHTRA - PUNE
  {
    id: "cit-mh-pun-1",
    name: "Ananya Deshmukh",
    avatarText: "AD",
    points: 1530,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 12 (Kothrud & Shivaji Nagar)",
    district: "Pune",
    districtId: "pune",
    state: "Maharashtra",
    stateCode: "MH",
    resolvedCount: 47,
    reportedCount: 50,
    upvotesCount: 380,
    badge: "🏆 #1 Maharashtra State Best Nagrik",
    specialHonor: "National Smart Mobility & Pedestrian Safety Awardee",
  },

  // MAHARASHTRA - MUMBAI SUBURBAN
  {
    id: "cit-mh-mum-1",
    name: "Er. Farhan Merchant",
    avatarText: "FM",
    points: 1440,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward H-West (Bandra West & Linking Rd)",
    district: "Mumbai Suburban",
    districtId: "mumbai_suburban",
    state: "Maharashtra",
    stateCode: "MH",
    resolvedCount: 40,
    reportedCount: 43,
    upvotesCount: 305,
    badge: "🏆 Mumbai Civic Vanguard",
    specialHonor: "Monsoon Stormwater Drain Desilting Field Monitor",
  },
  {
    id: "cit-mh-mum-2",
    name: "Tanvi Kulkarni",
    avatarText: "TK",
    points: 1120,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward K-West (Andheri West & Juhu)",
    district: "Mumbai Suburban",
    districtId: "mumbai_suburban",
    state: "Maharashtra",
    stateCode: "MH",
    resolvedCount: 26,
    reportedCount: 30,
    upvotesCount: 178,
    badge: "🌟 Coastline Cleanliness Champion",
  },

  // MAHARASHTRA - NAGPUR & THANE
  {
    id: "cit-mh-nag-1",
    name: "Sandeep Patil",
    avatarText: "SP",
    points: 1280,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 5 (Civil Lines & Ramdaspeth)",
    district: "Nagpur",
    districtId: "nagpur",
    state: "Maharashtra",
    stateCode: "MH",
    resolvedCount: 32,
    reportedCount: 35,
    upvotesCount: 220,
    badge: "🏆 Nagpur Green Ward Champion",
  },
  {
    id: "cit-mh-tha-1",
    name: "Sanjay More",
    avatarText: "SM",
    points: 970,
    position: "Adarsh Nagrik (Model Citizen)",
    hindiPosition: "आदर्श नागरिक",
    tierId: "adarsh",
    ward: "Ward 1 (Naupada & Talao Pali)",
    district: "Thane",
    districtId: "thane",
    state: "Maharashtra",
    stateCode: "MH",
    resolvedCount: 23,
    reportedCount: 26,
    upvotesCount: 154,
    badge: "🌟 Lake Restoration Volunteer",
  },

  // DELHI (NCT)
  {
    id: "cit-dl-nd-1",
    name: "Preeti Kaushik",
    avatarText: "PK",
    points: 1470,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 1 (Connaught Place & Barakhamba)",
    district: "New Delhi",
    districtId: "new_delhi",
    state: "Delhi (NCT)",
    stateCode: "DL",
    resolvedCount: 42,
    reportedCount: 45,
    upvotesCount: 340,
    badge: "🏆 #1 Delhi Capital Best Nagrik",
    specialHonor: "NDMC Anti-Smog & Pedestrian Corridor Monitor",
  },
  {
    id: "cit-dl-sd-1",
    name: "Aman Sehrawat",
    avatarText: "AS",
    points: 1190,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 142 (Hauz Khas & Green Park)",
    district: "South Delhi",
    districtId: "south_delhi",
    state: "Delhi (NCT)",
    stateCode: "DL",
    resolvedCount: 29,
    reportedCount: 32,
    upvotesCount: 195,
    badge: "🌟 Heritage Park Custodian",
  },
  {
    id: "cit-dl-ed-1",
    name: "Shweta Nigam",
    avatarText: "SN",
    points: 940,
    position: "Adarsh Nagrik (Model Citizen)",
    hindiPosition: "आदर्श नागरिक",
    tierId: "adarsh",
    ward: "Ward 205 (Mayur Vihar & Patparganj)",
    district: "East Delhi",
    districtId: "east_delhi",
    state: "Delhi (NCT)",
    stateCode: "DL",
    resolvedCount: 22,
    reportedCount: 25,
    upvotesCount: 148,
    badge: "🌟 Solid Waste Segregation Lead",
  },

  // KARNATAKA - BENGALURU
  {
    id: "cit-ka-blr-1",
    name: "Gurumurthy Reddy",
    avatarText: "GR",
    points: 1485,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 174 (HSR Layout & Silk Board)",
    district: "Bengaluru Urban",
    districtId: "bengaluru_urban",
    state: "Karnataka",
    stateCode: "KA",
    resolvedCount: 45,
    reportedCount: 48,
    upvotesCount: 360,
    badge: "🏆 #1 Karnataka State Best Nagrik",
    specialHonor: "Pothole & Rajakaluve drain overflow citizen watchdog",
  },
  {
    id: "cit-ka-blr-2",
    name: "Lavanya Prasad",
    avatarText: "LP",
    points: 1220,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 85 (Indiranagar & Domlur)",
    district: "Bengaluru Urban",
    districtId: "bengaluru_urban",
    state: "Karnataka",
    stateCode: "KA",
    resolvedCount: 30,
    reportedCount: 33,
    upvotesCount: 215,
    badge: "🌟 Smart Tree Canopy Protector",
  },
  {
    id: "cit-ka-mys-1",
    name: "Dr. Shivakumar Swamy",
    avatarText: "SS",
    points: 1080,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 1 (Devaraja Market & Palace)",
    district: "Mysuru",
    districtId: "mysuru",
    state: "Karnataka",
    stateCode: "KA",
    resolvedCount: 25,
    reportedCount: 28,
    upvotesCount: 165,
    badge: "🏆 Mysuru Heritage City Hero",
  },

  // UTTAR PRADESH - LUCKNOW & VARANASI & NOIDA
  {
    id: "cit-up-lko-1",
    name: "Alok Nath Tiwari",
    avatarText: "AT",
    points: 1465,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 1 (Hazratganj & Narhi)",
    district: "Lucknow",
    districtId: "lucknow",
    state: "Uttar Pradesh",
    stateCode: "UP",
    resolvedCount: 41,
    reportedCount: 44,
    upvotesCount: 325,
    badge: "🏆 #1 Uttar Pradesh State Best Nagrik",
    specialHonor: "Gomti Riverfront Cleanliness Citizen Inspector",
  },
  {
    id: "cit-up-var-1",
    name: "Gopal Pandey",
    avatarText: "GP",
    points: 1350,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 1 (Dashashwamedh Ghat & Chowk)",
    district: "Varanasi",
    districtId: "varanasi",
    state: "Uttar Pradesh",
    stateCode: "UP",
    resolvedCount: 34,
    reportedCount: 37,
    upvotesCount: 255,
    badge: "🏆 Varanasi Ghat Swachhta Champion",
  },
  {
    id: "cit-up-noi-1",
    name: "S.C. Mishra",
    avatarText: "SM",
    points: 1270,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Sector 18 (Commercial Hub & Atta)",
    district: "Gautam Buddha Nagar",
    districtId: "noida_gb_nagar",
    state: "Uttar Pradesh",
    stateCode: "UP",
    resolvedCount: 31,
    reportedCount: 34,
    upvotesCount: 210,
    badge: "🌟 Expressway Road Surface Watchdog",
  },

  // GUJARAT - AHMEDABAD & SURAT
  {
    id: "cit-gj-ahm-1",
    name: "Hitesh Barot",
    avatarText: "HB",
    points: 1435,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 1 (Navrangpura & Ashram Rd)",
    district: "Ahmedabad",
    districtId: "ahmedabad",
    state: "Gujarat",
    stateCode: "GJ",
    resolvedCount: 39,
    reportedCount: 42,
    upvotesCount: 295,
    badge: "🏆 #1 Gujarat State Best Nagrik",
    specialHonor: "Sabarmati Catchment Zero-Plastic Volunteer Lead",
  },
  {
    id: "cit-gj-sur-1",
    name: "Paresh Patel",
    avatarText: "PP",
    points: 1370,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 1 (Athwa & Piplod)",
    district: "Surat",
    districtId: "surat",
    state: "Gujarat",
    stateCode: "GJ",
    resolvedCount: 36,
    reportedCount: 38,
    upvotesCount: 260,
    badge: "🏆 Surat Clean City Champion",
  },

  // TAMIL NADU - CHENNAI
  {
    id: "cit-tn-chn-1",
    name: "Rajeshwari Sundaram",
    avatarText: "RS",
    points: 1515,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 112 (T. Nagar & Mylapore)",
    district: "Chennai",
    districtId: "chennai",
    state: "Tamil Nadu",
    stateCode: "TN",
    resolvedCount: 46,
    reportedCount: 49,
    upvotesCount: 375,
    badge: "🏆 #1 Tamil Nadu State Best Nagrik",
    specialHonor: "Monsoon Stormwater Canal Clearing Vigilance Leader",
  },

  // RAJASTHAN - JAIPUR
  {
    id: "cit-rj-jai-1",
    name: "Vikramaditya Rathore",
    avatarText: "VR",
    points: 1410,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 24 (C-Scheme & Vaishali Nagar)",
    district: "Jaipur",
    districtId: "jaipur",
    state: "Rajasthan",
    stateCode: "RJ",
    resolvedCount: 37,
    reportedCount: 41,
    upvotesCount: 275,
    badge: "🏆 #1 Rajasthan State Best Nagrik",
    specialHonor: "Solar Streetlight Grid & Heritage Zone Pothole Auditor",
  },

  // WEST BENGAL - KOLKATA
  {
    id: "cit-wb-kol-1",
    name: "Meenakshi Sen",
    avatarText: "MS",
    points: 1425,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 31 (Salt Lake Sector 5 & Bidhannagar)",
    district: "Kolkata",
    districtId: "kolkata",
    state: "West Bengal",
    stateCode: "WB",
    resolvedCount: 38,
    reportedCount: 42,
    upvotesCount: 290,
    badge: "🏆 #1 West Bengal State Best Nagrik",
  },

  // KERALA - THIRUVANANTHAPURAM
  {
    id: "cit-kl-tvm-1",
    name: "Devika Nair",
    avatarText: "DN",
    points: 1455,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 18 (Kowdiar & Palayam)",
    district: "Thiruvananthapuram",
    districtId: "thiruvananthapuram",
    state: "Kerala",
    stateCode: "KL",
    resolvedCount: 40,
    reportedCount: 43,
    upvotesCount: 310,
    badge: "🏆 #1 Kerala State Best Nagrik",
    specialHonor: "Decentralized Wet-Waste Composting Pioneer",
  },

  // PUNJAB - LUDHIANA
  {
    id: "cit-pb-lud-1",
    name: "Er. Harpreet Singh",
    avatarText: "HS",
    points: 1405,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 14 (Model Town & Sarabha Nagar)",
    district: "Ludhiana",
    districtId: "ludhiana",
    state: "Punjab",
    stateCode: "PB",
    resolvedCount: 36,
    reportedCount: 40,
    upvotesCount: 270,
    badge: "🏆 #1 Punjab State Best Nagrik",
  },

  // HARYANA - GURUGRAM
  {
    id: "cit-hr-gur-1",
    name: "Naveen Yadav",
    avatarText: "NY",
    points: 1430,
    position: "Sarvottam Nagrik (Best Nagrik)",
    hindiPosition: "सर्वोत्तम नागरिक (बेस्ट नागरिक)",
    tierId: "sarvottam",
    ward: "Ward 22 (DLF Phase 4 & Cyber City)",
    district: "Gurugram",
    districtId: "gurugram",
    state: "Haryana",
    stateCode: "HR",
    resolvedCount: 39,
    reportedCount: 42,
    upvotesCount: 285,
    badge: "🏆 #1 Haryana State Best Nagrik",
  },
];

/**
 * Deterministic fallback generator for any state and district
 * Ensures that EVERY state and district across India is populated with verified civic champions.
 */
function generateDistrictChampions(
  stateCode: string,
  stateName: string,
  districtId: string,
  districtName: string
): Omit<NagrikLeaderboardEntry, "rank">[] {
  const wards = getOfficialWards(stateCode, districtId);
  const districtObj = findOfficialDistrict(stateCode, districtId);
  const muniName = districtObj?.municipality || `${districtName} Municipality`;

  const seedChamps = [
    { name: "Sunil Sharma", avatar: "SS", pts: 1140, wardIdx: 1 },
    { name: "Anjali Deshmukh", avatar: "AD", pts: 960, wardIdx: 2 },
    { name: "Er. Manoj Kumar", avatar: "MK", pts: 820, wardIdx: 3 },
    { name: "Smt. Shanti Bai", avatar: "SB", pts: 650, wardIdx: 4 },
    { name: "Rajendra Prasad", avatar: "RP", pts: 490, wardIdx: 5 },
    { name: "Pooja Verma", avatar: "PV", pts: 340, wardIdx: 6 },
    { name: "Vivek Choudhary", avatar: "VC", pts: 210, wardIdx: 7 },
  ];

  return seedChamps.map((item, idx) => {
    const tier = getNagrikTier(item.pts);
    const wardObj = wards[item.wardIdx - 1] || wards[0];
    const wardLabel = wardObj ? wardObj.name : `Ward No. 0${item.wardIdx} (${muniName})`;
    return {
      id: `gen-${stateCode.toLowerCase()}-${districtId}-${idx}`,
      name: item.name,
      avatarText: item.avatar,
      points: item.pts,
      position: tier.name,
      hindiPosition: tier.hindiName,
      tierId: tier.id,
      ward: wardLabel,
      district: districtName,
      districtId,
      state: stateName,
      stateCode,
      resolvedCount: Math.max(3, Math.floor(item.pts / 35)),
      reportedCount: Math.max(5, Math.floor(item.pts / 28)),
      upvotesCount: Math.max(15, Math.floor(item.pts / 5)),
      badge: idx === 0 ? `🏆 ${districtName} #1 Best Nagrik` : idx === 1 ? `🥈 ${districtName} Rank #2` : tier.badgeLabel,
    };
  });
}

/**
 * Returns list of all available states from state registry
 */
export function getAllAvailableStates(): { code: string; name: string; isUT?: boolean }[] {
  const official = getAllOfficialStates();
  if (official && official.length > 0) {
    return official;
  }
  return STATES_DATA.map((s) => ({
    code: s.code,
    name: s.name,
    isUT: s.isUT,
  }));
}

/**
 * Returns all districts for a given state code
 */
export function getDistrictsForState(stateCode: string): { id: string; name: string }[] {
  const official = getOfficialDistricts(stateCode);
  if (official && official.length > 0) {
    return official.map((d) => ({ id: d.id, name: d.name }));
  }

  const registered = ALL_STATE_DISTRICTS[stateCode];
  if (registered && registered.length > 0) {
    return registered.map((d) => ({ id: d.id, name: d.name }));
  }

  // Fallback for states not directly declared in ALL_STATE_DISTRICTS
  const state = STATES_DATA.find((s) => s.code === stateCode);
  const capital = state?.capital || "Central City";
  return [
    { id: capital.toLowerCase().replace(/\s+/g, "_"), name: `${capital} District (Headquarters)` },
    { id: "north_district", name: "North Division District" },
    { id: "south_district", name: "South Division District" },
    { id: "east_district", name: "East Division District" },
  ];
}

/**
 * Returns available municipal wards for a given district
 */
export function getWardsForDistrict(
  stateCode: string,
  districtId: string
): { id: string; name: string; shortName: string; municipality?: string }[] {
  const officialOptions = getOfficialWardDropdownOptions(stateCode, districtId);
  if (officialOptions && officialOptions.length > 0) {
    return officialOptions;
  }

  if (districtId === "dhar") {
    return [
      { id: "all", name: "All Wards (Dhar District-Wide)", shortName: "All Wards" },
      { id: "w14", name: "Ward 14 (Old Palace & Bada Bazar)", shortName: "Ward 14" },
      { id: "w07", name: "Ward 07 (Civil Lines & Court Area)", shortName: "Ward 07" },
      { id: "w22", name: "Ward 22 (Industrial Area & Bypass)", shortName: "Ward 22" },
      { id: "w03", name: "Ward 03 (Mandu Gateway)", shortName: "Ward 03" },
      { id: "w11", name: "Ward 11 (Teacher Colony)", shortName: "Ward 11" },
      { id: "w19", name: "Ward 19 (Krishi Upaj Mandi)", shortName: "Ward 19" },
      { id: "w27", name: "Ward 27 (Central Sector 3 Zone)", shortName: "Ward 27" },
      { id: "w01", name: "Ward 01 (Industrial Sector I & II)", shortName: "Ward 01" },
      { id: "w12", name: "Ward 12 (Hospital Road Sector)", shortName: "Ward 12" },
      { id: "w45", name: "Ward 45 (Patel Nagar & Chhatrapati Chowk)", shortName: "Ward 45" },
    ];
  }

  const registeredDistricts = ALL_STATE_DISTRICTS[stateCode] || [];
  const matchedDistrict = registeredDistricts.find((d) => d.id === districtId);
  if (matchedDistrict && matchedDistrict.wards && matchedDistrict.wards.length > 0) {
    const list = matchedDistrict.wards.map((w) => ({
      id: w.id,
      name: `${w.wardNumber} (${w.name})`,
      shortName: w.wardNumber,
    }));
    return [
      { id: "all", name: `All Wards (${matchedDistrict.name} District-Wide)`, shortName: "All Wards" },
      ...list,
    ];
  }

  const distName = matchedDistrict?.name || "District";
  return [
    { id: "all", name: `All Wards (${distName} District-Wide)`, shortName: "All Wards" },
    { id: "w1", name: "Ward 1 (Collectorate & Main Bazar)", shortName: "Ward 1" },
    { id: "w2", name: "Ward 2 (Civil Lines & Court Area)", shortName: "Ward 2" },
    { id: "w3", name: "Ward 3 (Hospital & Medical Enclave)", shortName: "Ward 3" },
    { id: "w4", name: "Ward 4 (Station Colony & Transport Hub)", shortName: "Ward 4" },
    { id: "w5", name: "Ward 5 (Industrial & Subhash Nagar)", shortName: "Ward 5" },
  ];
}

/**
 * Primary ranking engine supporting National, State, District, and Ward scopes
 * Dynamically computes user rankings and comparative standings across all jurisdictions.
 */
export function getRankedLeaderboard(
  optionsOrScope: LeaderboardFilterOptions | NagrikLeaderboardScope,
  currentUser: {
    id?: string;
    name: string;
    avatarText: string;
    points: number;
    ward?: string;
    district?: string;
    districtId?: string;
    state?: string;
    stateCode?: string;
  }
): RankedLeaderboardResult {
  const options: LeaderboardFilterOptions =
    typeof optionsOrScope === "string"
      ? { scope: optionsOrScope }
      : optionsOrScope || {};

  const scope: NagrikLeaderboardScope = options.scope || "nation";
  const userStateCode = currentUser.stateCode || "MP";
  const userDistrictId = currentUser.districtId || "dhar";
  const userDistrictName = currentUser.district || "Dhar";
  const userWardName = currentUser.ward || "Ward 14 (Old Palace & Bada Bazar)";

  // The active jurisdiction selected by the user
  const selectedStateCode = options.stateCode || userStateCode;
  const stateObj = STATES_DATA.find((s) => s.code === selectedStateCode) || STATES_DATA[0];
  const stateName = stateObj?.name || "Madhya Pradesh";

  // Districts for current selected state
  const availableDistricts = getDistrictsForState(selectedStateCode);
  let selectedDistrictId =
    options.districtId ||
    (selectedStateCode === userStateCode ? userDistrictId : availableDistricts[0]?.id || "dhar");

  // Verify selectedDistrictId is in availableDistricts
  if (!availableDistricts.some((d) => d.id === selectedDistrictId)) {
    selectedDistrictId = availableDistricts[0]?.id || "dhar";
  }

  const districtObj = availableDistricts.find((d) => d.id === selectedDistrictId);
  const districtName = districtObj?.name || userDistrictName;

  // Wards for current selected district
  const availableWards = getWardsForDistrict(selectedStateCode, selectedDistrictId);
  let selectedWardId = options.wardId;
  let selectedWardName = options.wardName;

  if (!selectedWardId && !selectedWardName) {
    if (selectedStateCode === userStateCode && selectedDistrictId === userDistrictId) {
      selectedWardName = userWardName;
      selectedWardId = availableWards.find((w) => userWardName.includes(w.shortName))?.id || "w14";
    } else {
      selectedWardId = "all";
      selectedWardName = availableWards[0]?.name || "All Wards";
    }
  } else if (selectedWardId && !selectedWardName) {
    const match = availableWards.find((w) => w.id === selectedWardId);
    selectedWardName = match ? match.name : availableWards[0]?.name || "All Wards";
  } else if (selectedWardName && !selectedWardId) {
    const match = availableWards.find(
      (w) => w.name === selectedWardName || selectedWardName!.includes(w.shortName)
    );
    selectedWardId = match ? match.id : "all";
  }

  // Build current user entry
  const currentTier = getNagrikTier(currentUser.points);
  const userEntry: NagrikLeaderboardEntry = {
    id: currentUser.id || "current_user",
    name: `${currentUser.name} (You)`,
    avatarText: currentUser.avatarText || "YOU",
    points: currentUser.points,
    position: currentTier.name,
    hindiPosition: currentTier.hindiName,
    tierId: currentTier.id,
    ward: userWardName,
    district: userDistrictName,
    districtId: userDistrictId,
    state: currentUser.state || "Madhya Pradesh",
    stateCode: userStateCode,
    resolvedCount: Math.max(1, Math.floor(currentUser.points / 40)),
    reportedCount: Math.max(2, Math.floor(currentUser.points / 25)),
    upvotesCount: Math.max(5, Math.floor(currentUser.points / 6)),
    isCurrentUser: true,
    rank: 1,
    badge: currentUser.points >= 1000 ? "🏆 Best Nagrik Awardee" : currentTier.badgeLabel,
  };

  // Compile national master pool
  let masterPool: Omit<NagrikLeaderboardEntry, "rank">[] = [...SEED_LEADERBOARD_CITIZENS];

  // If selected district has few or no records, inject generated district champs
  const districtHasSeeds = masterPool.some(
    (c) => c.stateCode === selectedStateCode && c.districtId === selectedDistrictId
  );
  if (!districtHasSeeds) {
    const generated = generateDistrictChampions(
      selectedStateCode,
      stateName,
      selectedDistrictId,
      districtName
    );
    masterPool = [...masterPool, ...generated];
  }

  // 1. National Rankings (all citizens across India + user)
  const allNational = [...masterPool, userEntry].sort((a, b) => b.points - a.points);
  const nationalRank = Math.max(1, allNational.findIndex((c) => c.isCurrentUser) + 1);

  // 2. State Rankings (citizens in the SELECTED state + user for comparative rank)
  const stateCitizens = masterPool.filter((c) => c.stateCode === selectedStateCode);
  const allState = [...stateCitizens, userEntry].sort((a, b) => b.points - a.points);
  const stateRank = Math.max(1, allState.findIndex((c) => c.isCurrentUser) + 1);

  // 3. District Rankings (citizens in the SELECTED district + user for comparative rank)
  const districtCitizens = masterPool.filter(
    (c) =>
      c.stateCode === selectedStateCode &&
      (c.districtId === selectedDistrictId || c.district.toLowerCase() === districtName.toLowerCase())
  );
  const allDistrict = [...districtCitizens, userEntry].sort((a, b) => b.points - a.points);
  const districtRank = Math.max(1, allDistrict.findIndex((c) => c.isCurrentUser) + 1);

  // 4. Ward Rankings (citizens in the SELECTED ward or user's ward + user)
  const wardCitizens = districtCitizens.filter((c) => {
    if (!selectedWardName || selectedWardId === "all") return true;
    const wardKey = selectedWardName.split("(")[0].trim().toLowerCase(); // e.g. "ward 14"
    return c.ward.toLowerCase().includes(wardKey);
  });
  const allWard = [...wardCitizens, userEntry].sort((a, b) => b.points - a.points);
  const wardRank = Math.max(1, allWard.findIndex((c) => c.isCurrentUser) + 1);

  // Determine active view pool based on scope
  let activePool: (Omit<NagrikLeaderboardEntry, "rank"> | NagrikLeaderboardEntry)[] = [];
  if (scope === "nation") {
    activePool = allNational;
  } else if (scope === "state") {
    activePool = allState;
  } else if (scope === "district") {
    activePool = allDistrict;
  } else if (scope === "ward") {
    activePool = allWard;
  }

  // Remove duplicate entries by id
  const seenIds = new Set<string>();
  const uniquePool: (Omit<NagrikLeaderboardEntry, "rank"> | NagrikLeaderboardEntry)[] = [];
  for (const item of activePool) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniquePool.push(item);
    }
  }

  // Apply optional search query
  let searchedPool = uniquePool;
  if (options.searchQuery && options.searchQuery.trim() !== "") {
    const q = options.searchQuery.toLowerCase().trim();
    searchedPool = uniquePool.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ward.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        (c.state && c.state.toLowerCase().includes(q))
    );
  }

  // Sort descending by points
  searchedPool.sort((a, b) => b.points - a.points);

  // Assign sequential ranks and contextual Best Nagrik titles
  let userRankInView = 1;
  const wardDisplayName = selectedWardName || userWardName;
  const wardShortDisplayName =
    availableWards.find((w) => w.id === selectedWardId)?.shortName ||
    wardDisplayName.split("(")[0].trim() ||
    "Ward 14";

  const rankedEntries: NagrikLeaderboardEntry[] = searchedPool.map((entry, index) => {
    const rank = index + 1;
    if (entry.isCurrentUser) {
      userRankInView = rank;
    }

    let contextualBadge = entry.badge;
    if (rank === 1) {
      if (scope === "nation") contextualBadge = "🏆 All-India #1 Best Nagrik";
      else if (scope === "state") contextualBadge = `🏆 ${stateName} #1 State Best Nagrik`;
      else if (scope === "district") contextualBadge = `🏆 ${districtName} #1 District Best Nagrik`;
      else if (scope === "ward") contextualBadge = `🏆 ${wardShortDisplayName} #1 Ward Best Nagrik`;
    } else if (rank === 2) {
      contextualBadge =
        scope === "nation"
          ? "🥈 National Rank #2"
          : scope === "state"
          ? `🥈 ${stateName} Rank #2`
          : scope === "district"
          ? `🥈 ${districtName} Rank #2`
          : `🥈 ${wardShortDisplayName} Rank #2`;
    } else if (rank === 3) {
      contextualBadge =
        scope === "nation"
          ? "🥉 National Rank #3"
          : scope === "state"
          ? `🥉 ${stateName} Rank #3`
          : scope === "district"
          ? `🥉 ${districtName} Rank #3`
          : `🥉 ${wardShortDisplayName} Rank #3`;
    }

    return {
      ...entry,
      rank,
      badge: contextualBadge,
    };
  });

  const activeScopeLabel =
    scope === "nation"
      ? "All-India (National Level)"
      : scope === "state"
      ? `${stateName} (State Level)`
      : scope === "district"
      ? `${districtName} District (${stateName})`
      : `${wardShortDisplayName} (${districtName}, ${stateName})`;

  const userRankSummary: UserRankSummary = {
    nationalRank,
    totalNational: allNational.length,
    stateRank,
    totalState: allState.length,
    stateName,
    districtRank,
    totalDistrict: allDistrict.length,
    districtName,
    wardRank,
    totalWard: allWard.length,
    wardName: wardDisplayName,
    activeScopeRank: userRankInView,
    activeScopeTotal: rankedEntries.length,
    activeScopeLabel,
    isDistrictBestNagrik: districtRank === 1 || currentUser.points >= 1000,
    isStateBestNagrik: stateRank === 1,
    isNationalBestNagrik: nationalRank === 1,
  };

  return {
    scope,
    stateCode: selectedStateCode,
    stateName,
    districtId: selectedDistrictId,
    districtName,
    wardName: wardDisplayName,
    entries: rankedEntries,
    userRank: userRankInView,
    userEntry: rankedEntries.find((e) => e.isCurrentUser) || { ...userEntry, rank: userRankInView },
    totalParticipants: rankedEntries.length,
    userRankSummary,
  };
}
