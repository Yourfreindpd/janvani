export type CivicCategory =
  | "Roads & Potholes"
  | "Garbage & Sanitation"
  | "Drinking Water & Pipeline Leakage"
  | "Electricity Hazard & Wiring"
  | "Sewage & Drain Overflow"
  | "Streetlight Breakdown"
  | "Public Health & Fogging"
  | "Illegal Encroachments"
  | "Other";

export type GrievanceStatus =
  | "Submitted & Token Issued"
  | "Work In Progress"
  | "Resolved & Verified"
  | "Under Inspection";

export interface TimelineEvent {
  title: string;
  description: string;
  timestamp: string;
  status: "completed" | "current" | "pending";
  officerOrEntity?: string;
  verifiedBadge?: string;
}

export interface Grievance {
  id: string;
  token: string;
  title: string;
  description: string;
  category: CivicCategory;
  state: string;
  stateCode: string;
  district: string;
  ward: string;
  locality: string;
  department: string;
  status: GrievanceStatus;
  dateFiled: string;
  severityScore: number; // 1-10
  targetSlaHours: number;
  slaRemainingHours?: number;
  assignedNodal: string;
  assignedOfficerTitle: string;
  assignedOfficerPhone: string;
  assignedOfficerEmail?: string;
  imageUrl: string;
  photoUrl?: string;
  videoUrl?: string;
  mediaType?: "photo" | "video";
  resolvedImageUrl?: string;
  resolutionPhotoUrl?: string;
  additionalPhotos?: string[];
  upvotes: number;
  hasUpvoted?: boolean;
  filedByName: string;
  filedByAadhaar: string; // masked: XXXX-XXXX-5060
  sourceChannel?: "portal" | "whatsapp" | "call_112" | "rti";
  whatsappSenderPhone?: string;
  whatsappSenderName?: string;
  whatsappMessageText?: string;
  whatsappChatLog?: { from: "citizen" | "bot"; message: string; timestamp: string }[];
  timeline: TimelineEvent[];
  geoCoords?: { x: number; y: number; lat?: number; lng?: number };
}

export interface StateData {
  name: string;
  code: string;
  capital: string;
  districtsCount: number;
  totalComplaints: number;
  resolvedComplaints: number;
  slaPercentage: number;
  avgResolutionDays: number;
  topPriorities: string[];
  stateNodalOfficer: {
    name: string;
    designation: string;
    office: string;
    phone: string;
    email: string;
  };
  isUT?: boolean;
  coords: { x: number; y: number }; // percentage on India SVG map
}

export interface DistrictData {
  id: string;
  name: string;
  stateCode: string;
  wardsCount: number;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingSla: number;
  slaPercentage: number;
  collectorName: string;
  collectorDesignation: string;
  collectorOffice: string;
  helpline: string;
  topPriorities: string[];
  wards: WardData[];
}

export interface WardData {
  id: string;
  wardNumber: string;
  name: string;
  councillorName: string;
  councillorPhone: string;
  nodalEngineerName: string;
  nodalEngineerDesignation: string;
  approxPopulation: number;
  resolvedCount: number;
  activeCount: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: "citizen" | "officer" | "admin";
  aadhaarNumber: string; // masked
  location: string;
  department?: string;
  avatarText: string;
  phone: string;
  designation?: string;
  employeeCode?: string;
  ulbJurisdiction?: string;
  nagrikPoints?: number;
  nagrikPosition?: string;
  nagrikBadges?: string[];
  wardRank?: number;
  districtRank?: number;
}

export type NagrikTierId = "prathmik" | "jagruk" | "karmat" | "adarsh" | "sarvottam";

export interface NagrikTierInfo {
  id: NagrikTierId;
  name: string;
  hindiName: string;
  minPoints: number;
  maxPoints: number;
  badgeLabel: string;
  badgeColor: string;
  description: string;
  perks: string[];
}

export type CivicPointAction =
  | "FILE_GRIEVANCE"
  | "UPLOAD_PROOF"
  | "VOICE_SEVA_REPORT"
  | "UPVOTE_GRIEVANCE"
  | "RECEIVE_UPVOTE"
  | "CONFIRM_RESOLUTION"
  | "POST_CIVIC_UPDATE"
  | "RTI_CIVIC_AUDIT";

export interface CivicPointTransaction {
  id: string;
  timestamp: string;
  points: number;
  action: CivicPointAction;
  title: string;
  description: string;
  grievanceToken?: string;
}

export type NagrikLeaderboardScope = "nation" | "state" | "district" | "ward";

export interface NagrikLeaderboardEntry {
  id: string;
  name: string;
  avatarText: string;
  points: number;
  position: string;
  hindiPosition: string;
  tierId: NagrikTierId;
  ward: string;
  district: string;
  districtId?: string;
  state?: string;
  stateCode?: string;
  resolvedCount: number;
  reportedCount: number;
  upvotesCount: number;
  isCurrentUser?: boolean;
  rank: number;
  badge: string;
  specialHonor?: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: "DELETE_COMPLAINT" | "DELETE_VIDEO" | "DELETE_PHOTO" | "BULK_DELETE_COMPLAINTS" | "SYSTEM_PURGE";
  targetId: string;
  targetToken?: string;
  targetTitle?: string;
  targetCategory?: string;
  reason: string;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  details?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  grievanceId: string;
  grievanceToken: string;
  category: CivicCategory;
  ward: string;
  title: string;
  contractorOrSquad: string;
  squadLeadPhone: string;
  status: "Assigned" | "Dispatched" | "In-Progress" | "Work Completed" | "Dual-Audit Pending";
  allocatedBudgetInr: number;
  priority: "High" | "Urgent" | "Critical";
  issuedDate: string;
  targetCompletionDate: string;
  materialsIssued: string[];
  vehicleDispatched?: string;
  beforePhotoUrl: string;
  afterPhotoUrl?: string;
}

export interface OfficialNotice {
  id: string;
  noticeNumber: string;
  title: string;
  category: string;
  wardOrArea: string;
  publishedDate: string;
  validTill: string;
  issuedByOfficer: string;
  description: string;
  impactLevel: "Advisory" | "Urgent Alert" | "Planned Maintenance";
  actionRequired?: string;
}

export interface OfficerActionLog {
  id: string;
  timestamp: string;
  grievanceToken: string;
  officerName: string;
  actionTaken: string;
  previousStatus: string;
  newStatus: string;
  remarks: string;
  auditHash: string;
}

export interface WelfareScheme {
  id: string;
  title: string;
  subtitle: string;
  ministry: string;
  category: string;
  keyBenefits: string[];
  eligibility: string[];
  applicationMode: string;
  officialPortal: string;
  activeGrievanceChannel: string;
  statsText: string;
  iconName: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  greeting: string;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface GoogleMapsGroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri?: string;
    title?: string;
    placeId?: string;
    address?: string;
    placeAnswerSources?: {
      reviewSnippets?: Array<{
        snippet?: string;
        reviewUri?: string;
      }>;
    };
  };
}

export interface GoogleMapsProblemSpot {
  id: string;
  title: string;
  locationName: string;
  state: string;
  district: string;
  category: CivicCategory | string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  hazardDescription: string;
  reportedCondition: string;
  googleMapsUrl: string;
  placeSearchUrl: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  responsibleAuthority: string;
  actionProtocol: string;
  distanceKm?: number;
  groundingSources?: Array<{ title: string; uri: string }>;
}

export interface WhatsAppMessage {
  id: string;
  senderPhone: string;
  senderName: string;
  messageText: string;
  mediaUrl?: string;
  timestamp: string;
  status: "received" | "triaged" | "registered" | "failed";
  generatedToken?: string;
  category?: CivicCategory;
  department?: string;
  severityScore?: number;
  slaHours?: number;
  assignedOfficer?: string;
  aiResponseText?: string;
}

export interface CivicNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "status_update" | "sla_warning" | "resolution" | "upvote" | "new_grievance";
  read: boolean;
  token?: string;
  grievanceId?: string;
}

