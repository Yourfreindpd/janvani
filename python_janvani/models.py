"""
JanVani Python Edition - Core Data Models & Schemas
Matches JanVani Civic Grievance & Governance Platform data structures.
"""
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any
from enum import Enum
import time
import uuid

class GrievanceStatus(str, Enum):
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    WORK_IN_PROGRESS = "Work In Progress"
    RESOLVED = "Resolved"
    REJECTED = "Rejected"
    ESCALATED = "Escalated"

class GrievanceCategory(str, Enum):
    POTHOLE_ROADS = "Pothole & Damaged Roads"
    WATER_SUPPLY = "Water Supply & Leakage"
    GARBAGE_DRAINAGE = "Garbage & Sewage Drainage"
    ELECTRICITY = "Electricity Hazard & Wiring"
    STREETLIGHT = "Broken Streetlight"
    HEALTH_HYGIENE = "Public Health & Sanitation"
    OTHER = "Other Civic Issue"

class UserRole(str, Enum):
    CITIZEN = "citizen"
    OFFICER = "officer"
    ADMIN = "admin"

@dataclass
class LocationDetails:
    state: str
    district: str
    ward: str
    pincode: str
    latitude: float
    longitude: float
    landmark: Optional[str] = None
    formatted_address: Optional[str] = None

@dataclass
class TimelineEvent:
    id: str
    timestamp: str
    title: str
    description: str
    actor_name: str
    actor_role: str
    action_type: str
    status: GrievanceStatus

@dataclass
class Grievance:
    id: str
    token_number: str
    title: str
    description: str
    category: GrievanceCategory
    department: str
    severity: int  # 1 to 10
    status: GrievanceStatus
    location: LocationDetails
    citizen_id: str
    citizen_name: str
    citizen_phone_masked: str
    is_aadhaar_verified: bool
    upvotes: int = 1
    media_urls: List[str] = field(default_factory=list)
    media_type: str = "image"  # image, video, none
    timeline: List[TimelineEvent] = field(default_factory=list)
    sla_hours: int = 48
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class WorkOrder:
    id: str
    grievance_id: str
    token_number: str
    department: str
    assigned_officer_name: str
    assigned_officer_id: str
    priority: str  # High, Critical, Medium, Normal
    status: str
    sla_deadline: str
    created_at: str
    notes: Optional[str] = None

@dataclass
class RTIApplication:
    id: str
    registration_number: str
    grievance_token: str
    department: str
    public_authority_name: str
    pio_address: str
    questions: List[str]
    citizen_name: str
    citizen_address: str
    application_date: str
    fee_mode: str = "Online / e-IPO"
    status: str = "Generated / Ready to File"
