// ============================================================================
// Official Pan-India Jurisdictions: 36 States & Union Territories
// Complete with Districts, Local Bodies / Municipalities, and Municipal Wards
// ============================================================================

import { DistrictData, StateData, WardData } from "../types";

export interface OfficialWardItem {
  id: string;
  wardNumber: string;
  name: string;
  shortName: string;
  municipality: string;
  district: string;
  state: string;
  stateCode: string;
}

export interface OfficialDistrictItem {
  id: string;
  name: string;
  municipality: string;
  stateCode: string;
  stateName: string;
  wardsCount: number;
}

export interface OfficialStateItem {
  name: string;
  code: string;
  capital: string;
  isUT?: boolean;
  coords: { x: number; y: number };
  districts: OfficialDistrictItem[];
}

interface RawDistrictDef {
  id: string;
  name: string;
  municipality: string;
  wardsCount?: number;
}

interface RawStateDef {
  name: string;
  code: string;
  capital: string;
  isUT?: boolean;
  coords: { x: number; y: number };
  districts: RawDistrictDef[];
}

const RAW_JURISDICTION_REGISTRY: RawStateDef[] = [
  // 1. Andhra Pradesh
  {
    name: "Andhra Pradesh",
    code: "AP",
    capital: "Amaravati",
    coords: { x: 50, y: 72 },
    districts: [
      { id: "visakhapatnam", name: "Visakhapatnam", municipality: "Visakhapatnam Municipality", wardsCount: 15 },
      { id: "vijayawada", name: "Vijayawada", municipality: "Vijayawada Municipality", wardsCount: 15 },
      { id: "guntur", name: "Guntur", municipality: "Guntur Municipality", wardsCount: 15 },
      { id: "nellore", name: "Nellore", municipality: "Nellore Municipality", wardsCount: 15 },
      { id: "tirupati", name: "Tirupati", municipality: "Tirupati Municipality", wardsCount: 15 },
    ],
  },
  // 2. Arunachal Pradesh
  {
    name: "Arunachal Pradesh",
    code: "AR",
    capital: "Itanagar",
    coords: { x: 88, y: 32 },
    districts: [
      { id: "tawang", name: "Tawang", municipality: "Tawang Municipality", wardsCount: 15 },
      { id: "itanagar", name: "Itanagar", municipality: "Itanagar Municipality", wardsCount: 15 },
      { id: "ziro", name: "Ziro", municipality: "Ziro Municipality", wardsCount: 15 },
      { id: "pasighat", name: "Pasighat", municipality: "Pasighat Municipality", wardsCount: 15 },
    ],
  },
  // 3. Assam
  {
    name: "Assam",
    code: "AS",
    capital: "Dispur",
    coords: { x: 84, y: 38 },
    districts: [
      { id: "kamrup_metropolitan", name: "Kamrup Metropolitan", municipality: "Kamrup Metropolitan Municipality", wardsCount: 15 },
      { id: "jorhat", name: "Jorhat", municipality: "Jorhat Municipality", wardsCount: 15 },
      { id: "dibrugarh", name: "Dibrugarh", municipality: "Dibrugarh Municipality", wardsCount: 15 },
      { id: "silchar", name: "Silchar", municipality: "Silchar Municipality", wardsCount: 15 },
      { id: "tezpur", name: "Tezpur", municipality: "Tezpur Municipality", wardsCount: 15 },
    ],
  },
  // 4. Bihar
  {
    name: "Bihar",
    code: "BR",
    capital: "Patna",
    coords: { x: 67, y: 40 },
    districts: [
      { id: "patna", name: "Patna", municipality: "Patna Municipality", wardsCount: 15 },
      { id: "gaya", name: "Gaya", municipality: "Gaya Municipality", wardsCount: 15 },
      { id: "muzaffarpur", name: "Muzaffarpur", municipality: "Muzaffarpur Municipality", wardsCount: 15 },
      { id: "bhagalpur", name: "Bhagalpur", municipality: "Bhagalpur Municipality", wardsCount: 15 },
      { id: "darbhanga", name: "Darbhanga", municipality: "Darbhanga Municipality", wardsCount: 15 },
    ],
  },
  // 5. Chhattisgarh
  {
    name: "Chhattisgarh",
    code: "CG",
    capital: "Raipur",
    coords: { x: 56, y: 52 },
    districts: [
      { id: "raipur", name: "Raipur", municipality: "Raipur Municipality", wardsCount: 15 },
      { id: "bhilai", name: "Bhilai", municipality: "Bhilai Municipality", wardsCount: 15 },
      { id: "bilaspur", name: "Bilaspur", municipality: "Bilaspur Municipality", wardsCount: 15 },
      { id: "korba", name: "Korba", municipality: "Korba Municipality", wardsCount: 15 },
      { id: "durg", name: "Durg", municipality: "Durg Municipality", wardsCount: 15 },
    ],
  },
  // 6. Goa
  {
    name: "Goa",
    code: "GA",
    capital: "Panaji",
    coords: { x: 36, y: 68 },
    districts: [
      { id: "north_goa", name: "North Goa", municipality: "North Goa Municipality", wardsCount: 15 },
      { id: "south_goa", name: "South Goa", municipality: "South Goa Municipality", wardsCount: 15 },
    ],
  },
  // 7. Gujarat
  {
    name: "Gujarat",
    code: "GJ",
    capital: "Gandhinagar",
    coords: { x: 30, y: 45 },
    districts: [
      { id: "ahmedabad", name: "Ahmedabad", municipality: "Ahmedabad Municipality", wardsCount: 15 },
      { id: "surat", name: "Surat", municipality: "Surat Municipality", wardsCount: 15 },
      { id: "vadodara", name: "Vadodara", municipality: "Vadodara Municipality", wardsCount: 15 },
      { id: "rajkot", name: "Rajkot", municipality: "Rajkot Municipality", wardsCount: 15 },
      { id: "bhavnagar", name: "Bhavnagar", municipality: "Bhavnagar Municipality", wardsCount: 15 },
    ],
  },
  // 8. Haryana
  {
    name: "Haryana",
    code: "HR",
    capital: "Chandigarh",
    coords: { x: 40, y: 26 },
    districts: [
      { id: "gurugram", name: "Gurugram", municipality: "Gurugram Municipality", wardsCount: 15 },
      { id: "faridabad", name: "Faridabad", municipality: "Faridabad Municipality", wardsCount: 15 },
      { id: "panipat", name: "Panipat", municipality: "Panipat Municipality", wardsCount: 15 },
      { id: "ambala", name: "Ambala", municipality: "Ambala Municipality", wardsCount: 15 },
      { id: "rohtak", name: "Rohtak", municipality: "Rohtak Municipality", wardsCount: 15 },
    ],
  },
  // 9. Himachal Pradesh
  {
    name: "Himachal Pradesh",
    code: "HP",
    capital: "Shimla",
    coords: { x: 42, y: 18 },
    districts: [
      { id: "shimla", name: "Shimla", municipality: "Shimla Municipality", wardsCount: 15 },
      { id: "kangra", name: "Kangra", municipality: "Kangra Municipality", wardsCount: 15 },
      { id: "mandi", name: "Mandi", municipality: "Mandi Municipality", wardsCount: 15 },
      { id: "solan", name: "Solan", municipality: "Solan Municipality", wardsCount: 15 },
    ],
  },
  // 10. Jharkhand
  {
    name: "Jharkhand",
    code: "JH",
    capital: "Ranchi",
    coords: { x: 62, y: 46 },
    districts: [
      { id: "ranchi", name: "Ranchi", municipality: "Ranchi Municipality", wardsCount: 15 },
      { id: "jamshedpur", name: "Jamshedpur", municipality: "Jamshedpur Municipality", wardsCount: 15 },
      { id: "dhanbad", name: "Dhanbad", municipality: "Dhanbad Municipality", wardsCount: 15 },
      { id: "bokaro", name: "Bokaro", municipality: "Bokaro Municipality", wardsCount: 15 },
    ],
  },
  // 11. Karnataka
  {
    name: "Karnataka",
    code: "KA",
    capital: "Bengaluru",
    coords: { x: 40, y: 74 },
    districts: [
      { id: "bengaluru_urban", name: "Bengaluru Urban", municipality: "Bengaluru Urban Municipality", wardsCount: 15 },
      { id: "mysuru", name: "Mysuru", municipality: "Mysuru Municipality", wardsCount: 15 },
      { id: "mangaluru", name: "Mangaluru", municipality: "Mangaluru Municipality", wardsCount: 15 },
      { id: "hubballi_dharwad", name: "Hubballi-Dharwad", municipality: "Hubballi-Dharwad Municipality", wardsCount: 15 },
      { id: "belagavi", name: "Belagavi", municipality: "Belagavi Municipality", wardsCount: 15 },
    ],
  },
  // 12. Kerala
  {
    name: "Kerala",
    code: "KL",
    capital: "Thiruvananthapuram",
    coords: { x: 41, y: 90 },
    districts: [
      { id: "thiruvananthapuram", name: "Thiruvananthapuram", municipality: "Thiruvananthapuram Municipality", wardsCount: 15 },
      { id: "ernakulam", name: "Ernakulam", municipality: "Ernakulam Municipality", wardsCount: 15 },
      { id: "kozhikode", name: "Kozhikode", municipality: "Kozhikode Municipality", wardsCount: 15 },
      { id: "thrissur", name: "Thrissur", municipality: "Thrissur Municipality", wardsCount: 15 },
      { id: "kollam", name: "Kollam", municipality: "Kollam Municipality", wardsCount: 15 },
    ],
  },
  // 13. Madhya Pradesh
  {
    name: "Madhya Pradesh",
    code: "MP",
    capital: "Bhopal",
    coords: { x: 48, y: 48 },
    districts: [
      { id: "indore", name: "Indore", municipality: "Indore Municipal Corporation", wardsCount: 85 },
      { id: "bhopal", name: "Bhopal", municipality: "Bhopal Municipality", wardsCount: 15 },
      { id: "gwalior", name: "Gwalior", municipality: "Gwalior Municipality", wardsCount: 15 },
      { id: "jabalpur", name: "Jabalpur", municipality: "Jabalpur Municipality", wardsCount: 15 },
      { id: "ujjain", name: "Ujjain", municipality: "Ujjain Municipality", wardsCount: 15 },
      { id: "dhar", name: "Dhar", municipality: "Dhar Municipal Council", wardsCount: 15 },
    ],
  },
  // 14. Maharashtra
  {
    name: "Maharashtra",
    code: "MH",
    capital: "Mumbai",
    coords: { x: 38, y: 58 },
    districts: [
      { id: "mumbai_city", name: "Mumbai City", municipality: "Mumbai City Municipality", wardsCount: 15 },
      { id: "mumbai_suburban", name: "Mumbai Suburban", municipality: "Mumbai Suburban Municipality", wardsCount: 15 },
      { id: "pune", name: "Pune", municipality: "Pune Municipality", wardsCount: 15 },
      { id: "nagpur", name: "Nagpur", municipality: "Nagpur Municipality", wardsCount: 15 },
      { id: "thane", name: "Thane", municipality: "Thane Municipality", wardsCount: 15 },
      { id: "nashik", name: "Nashik", municipality: "Nashik Municipality", wardsCount: 15 },
    ],
  },
  // 15. Manipur
  {
    name: "Manipur",
    code: "MN",
    capital: "Imphal",
    coords: { x: 88, y: 46 },
    districts: [
      { id: "imphal_west", name: "Imphal West", municipality: "Imphal West Municipality", wardsCount: 15 },
      { id: "imphal_east", name: "Imphal East", municipality: "Imphal East Municipality", wardsCount: 15 },
      { id: "churachandpur", name: "Churachandpur", municipality: "Churachandpur Municipality", wardsCount: 15 },
    ],
  },
  // 16. Meghalaya
  {
    name: "Meghalaya",
    code: "ML",
    capital: "Shillong",
    coords: { x: 80, y: 44 },
    districts: [
      { id: "east_khasi_hills", name: "East Khasi Hills", municipality: "East Khasi Hills Municipality", wardsCount: 15 },
      { id: "west_garo_hills", name: "West Garo Hills", municipality: "West Garo Hills Municipality", wardsCount: 15 },
    ],
  },
  // 17. Mizoram
  {
    name: "Mizoram",
    code: "MZ",
    capital: "Aizawl",
    coords: { x: 86, y: 52 },
    districts: [
      { id: "aizawl", name: "Aizawl", municipality: "Aizawl Municipality", wardsCount: 15 },
      { id: "lunglei", name: "Lunglei", municipality: "Lunglei Municipality", wardsCount: 15 },
    ],
  },
  // 18. Nagaland
  {
    name: "Nagaland",
    code: "NL",
    capital: "Kohima",
    coords: { x: 90, y: 40 },
    districts: [
      { id: "kohima", name: "Kohima", municipality: "Kohima Municipality", wardsCount: 15 },
      { id: "dimapur", name: "Dimapur", municipality: "Dimapur Municipality", wardsCount: 15 },
      { id: "mokokchung", name: "Mokokchung", municipality: "Mokokchung Municipality", wardsCount: 15 },
    ],
  },
  // 19. Odisha
  {
    name: "Odisha",
    code: "OD",
    capital: "Bhubaneswar",
    coords: { x: 64, y: 56 },
    districts: [
      { id: "khordha", name: "Khordha", municipality: "Khordha Municipality", wardsCount: 15 },
      { id: "cuttack", name: "Cuttack", municipality: "Cuttack Municipality", wardsCount: 15 },
      { id: "sundargarh", name: "Sundargarh", municipality: "Sundargarh Municipality", wardsCount: 15 },
      { id: "ganjam", name: "Ganjam", municipality: "Ganjam Municipality", wardsCount: 15 },
    ],
  },
  // 20. Punjab
  {
    name: "Punjab",
    code: "PB",
    capital: "Chandigarh",
    coords: { x: 38, y: 22 },
    districts: [
      { id: "ludhiana", name: "Ludhiana", municipality: "Ludhiana Municipality", wardsCount: 15 },
      { id: "amritsar", name: "Amritsar", municipality: "Amritsar Municipality", wardsCount: 15 },
      { id: "jalandhar", name: "Jalandhar", municipality: "Jalandhar Municipality", wardsCount: 15 },
      { id: "patiala", name: "Patiala", municipality: "Patiala Municipality", wardsCount: 15 },
      { id: "bathinda", name: "Bathinda", municipality: "Bathinda Municipality", wardsCount: 15 },
    ],
  },
  // 21. Rajasthan
  {
    name: "Rajasthan",
    code: "RJ",
    capital: "Jaipur",
    coords: { x: 35, y: 36 },
    districts: [
      { id: "jaipur", name: "Jaipur", municipality: "Jaipur Municipality", wardsCount: 15 },
      { id: "jodhpur", name: "Jodhpur", municipality: "Jodhpur Municipality", wardsCount: 15 },
      { id: "udaipur", name: "Udaipur", municipality: "Udaipur Municipality", wardsCount: 15 },
      { id: "kota", name: "Kota", municipality: "Kota Municipality", wardsCount: 15 },
      { id: "bikaner", name: "Bikaner", municipality: "Bikaner Municipality", wardsCount: 15 },
    ],
  },
  // 22. Sikkim
  {
    name: "Sikkim",
    code: "SK",
    capital: "Gangtok",
    coords: { x: 74, y: 34 },
    districts: [
      { id: "gangtok", name: "Gangtok", municipality: "Gangtok Municipality", wardsCount: 15 },
      { id: "namchi", name: "Namchi", municipality: "Namchi Municipality", wardsCount: 15 },
      { id: "gyalshing", name: "Gyalshing", municipality: "Gyalshing Municipality", wardsCount: 15 },
    ],
  },
  // 23. Tamil Nadu
  {
    name: "Tamil Nadu",
    code: "TN",
    capital: "Chennai",
    coords: { x: 46, y: 84 },
    districts: [
      { id: "chennai", name: "Chennai", municipality: "Chennai Municipality", wardsCount: 15 },
      { id: "coimbatore", name: "Coimbatore", municipality: "Coimbatore Municipality", wardsCount: 15 },
      { id: "madurai", name: "Madurai", municipality: "Madurai Municipality", wardsCount: 15 },
      { id: "tiruchirappalli", name: "Tiruchirappalli", municipality: "Tiruchirappalli Municipality", wardsCount: 15 },
      { id: "salem", name: "Salem", municipality: "Salem Municipality", wardsCount: 15 },
    ],
  },
  // 24. Telangana
  {
    name: "Telangana",
    code: "TG",
    capital: "Hyderabad",
    coords: { x: 48, y: 64 },
    districts: [
      { id: "hyderabad", name: "Hyderabad", municipality: "Hyderabad Municipality", wardsCount: 15 },
      { id: "medchal_malkajgiri", name: "Medchal-Malkajgiri", municipality: "Medchal-Malkajgiri Municipality", wardsCount: 15 },
      { id: "ranga_reddy", name: "Ranga Reddy", municipality: "Ranga Reddy Municipality", wardsCount: 15 },
      { id: "warangal", name: "Warangal", municipality: "Warangal Municipality", wardsCount: 15 },
    ],
  },
  // 25. Tripura
  {
    name: "Tripura",
    code: "TR",
    capital: "Agartala",
    coords: { x: 82, y: 50 },
    districts: [
      { id: "west_tripura", name: "West Tripura", municipality: "West Tripura Municipality", wardsCount: 15 },
      { id: "gomati", name: "Gomati", municipality: "Gomati Municipality", wardsCount: 15 },
    ],
  },
  // 26. Uttar Pradesh
  {
    name: "Uttar Pradesh",
    code: "UP",
    capital: "Lucknow",
    coords: { x: 55, y: 35 },
    districts: [
      { id: "lucknow", name: "Lucknow", municipality: "Lucknow Municipality", wardsCount: 15 },
      { id: "kanpur_nagar", name: "Kanpur Nagar", municipality: "Kanpur Nagar Municipality", wardsCount: 15 },
      { id: "varanasi", name: "Varanasi", municipality: "Varanasi Municipality", wardsCount: 15 },
      { id: "agra", name: "Agra", municipality: "Agra Municipality", wardsCount: 15 },
      { id: "gautam_buddha_nagar", name: "Gautam Buddha Nagar", municipality: "Gautam Buddha Nagar Municipality", wardsCount: 15 },
    ],
  },
  // 27. Uttarakhand
  {
    name: "Uttarakhand",
    code: "UK",
    capital: "Dehradun",
    coords: { x: 46, y: 24 },
    districts: [
      { id: "dehradun", name: "Dehradun", municipality: "Dehradun Municipality", wardsCount: 15 },
      { id: "haridwar", name: "Haridwar", municipality: "Haridwar Municipality", wardsCount: 15 },
      { id: "nainital", name: "Nainital", municipality: "Nainital Municipality", wardsCount: 15 },
      { id: "udham_singh_nagar", name: "Udham Singh Nagar", municipality: "Udham Singh Nagar Municipality", wardsCount: 15 },
    ],
  },
  // 28. West Bengal
  {
    name: "West Bengal",
    code: "WB",
    capital: "Kolkata",
    coords: { x: 74, y: 48 },
    districts: [
      { id: "kolkata", name: "Kolkata", municipality: "Kolkata Municipality", wardsCount: 15 },
      { id: "north_24_parganas", name: "North 24 Parganas", municipality: "North 24 Parganas Municipality", wardsCount: 15 },
      { id: "south_24_parganas", name: "South 24 Parganas", municipality: "South 24 Parganas Municipality", wardsCount: 15 },
      { id: "howrah", name: "Howrah", municipality: "Howrah Municipality", wardsCount: 15 },
      { id: "darjeeling", name: "Darjeeling", municipality: "Darjeeling Municipality", wardsCount: 15 },
    ],
  },

  // UNION TERRITORIES (8 UTs)
  // 29. Delhi (NCT)
  {
    name: "Delhi (NCT)",
    code: "DL",
    capital: "New Delhi",
    isUT: true,
    coords: { x: 42, y: 30 },
    districts: [
      { id: "new_delhi", name: "New Delhi", municipality: "New Delhi Municipality", wardsCount: 15 },
      { id: "central_delhi", name: "Central Delhi", municipality: "Central Delhi Municipality", wardsCount: 15 },
      { id: "south_delhi", name: "South Delhi", municipality: "South Delhi Municipality", wardsCount: 15 },
      { id: "north_west_delhi", name: "North West Delhi", municipality: "North West Delhi Municipality", wardsCount: 15 },
    ],
  },
  // 30. Jammu & Kashmir
  {
    name: "Jammu and Kashmir",
    code: "JK",
    capital: "Srinagar / Jammu",
    isUT: true,
    coords: { x: 38, y: 12 },
    districts: [
      { id: "srinagar", name: "Srinagar", municipality: "Srinagar Municipality", wardsCount: 15 },
      { id: "jammu", name: "Jammu", municipality: "Jammu Municipality", wardsCount: 15 },
      { id: "anantnag", name: "Anantnag", municipality: "Anantnag Municipality", wardsCount: 15 },
      { id: "baramulla", name: "Baramulla", municipality: "Baramulla Municipality", wardsCount: 15 },
    ],
  },
  // 31. Ladakh
  {
    name: "Ladakh",
    code: "LA",
    capital: "Leh",
    isUT: true,
    coords: { x: 45, y: 8 },
    districts: [
      { id: "leh", name: "Leh", municipality: "Leh Municipality", wardsCount: 15 },
      { id: "kargil", name: "Kargil", municipality: "Kargil Municipality", wardsCount: 15 },
    ],
  },
  // 32. Andaman and Nicobar Islands
  {
    name: "Andaman and Nicobar Islands",
    code: "AN",
    capital: "Port Blair",
    isUT: true,
    coords: { x: 80, y: 86 },
    districts: [
      { id: "south_andaman", name: "South Andaman", municipality: "South Andaman Municipality", wardsCount: 15 },
      { id: "north_middle_andaman", name: "North and Middle Andaman", municipality: "North and Middle Andaman Municipality", wardsCount: 15 },
    ],
  },
  // 33. Chandigarh
  {
    name: "Chandigarh",
    code: "CH",
    capital: "Chandigarh",
    isUT: true,
    coords: { x: 41, y: 22 },
    districts: [
      { id: "chandigarh", name: "Chandigarh", municipality: "Chandigarh Municipality", wardsCount: 15 },
    ],
  },
  // 34. Dadra and Nagar Haveli and Daman and Diu
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DNHDD",
    capital: "Daman",
    isUT: true,
    coords: { x: 32, y: 54 },
    districts: [
      { id: "daman", name: "Daman", municipality: "Daman Municipality", wardsCount: 15 },
      { id: "diu", name: "Diu", municipality: "Diu Municipality", wardsCount: 15 },
      { id: "dadra_nagar_haveli", name: "Dadra and Nagar Haveli", municipality: "Dadra and Nagar Haveli Municipality", wardsCount: 15 },
    ],
  },
  // 35. Lakshadweep
  {
    name: "Lakshadweep",
    code: "LD",
    capital: "Kavaratti",
    isUT: true,
    coords: { x: 34, y: 86 },
    districts: [
      { id: "lakshadweep", name: "Lakshadweep", municipality: "Lakshadweep Municipality", wardsCount: 15 },
    ],
  },
  // 36. Puducherry
  {
    name: "Puducherry",
    code: "PY",
    capital: "Puducherry",
    isUT: true,
    coords: { x: 49, y: 82 },
    districts: [
      { id: "puducherry", name: "Puducherry", municipality: "Puducherry Municipality", wardsCount: 15 },
      { id: "karaikal", name: "Karaikal", municipality: "Karaikal Municipality", wardsCount: 15 },
      { id: "mahe", name: "Mahe", municipality: "Mahe Municipality", wardsCount: 15 },
      { id: "yanam", name: "Yanam", municipality: "Yanam Municipality", wardsCount: 15 },
    ],
  },
];

// Build Master State Registry
export const OFFICIAL_STATES: OfficialStateItem[] = RAW_JURISDICTION_REGISTRY.map((st) => ({
  name: st.name,
  code: st.code,
  capital: st.capital,
  isUT: st.isUT,
  coords: st.coords,
  districts: st.districts.map((d) => ({
    id: d.id,
    name: d.name,
    municipality: d.municipality,
    stateCode: st.code,
    stateName: st.name,
    wardsCount: d.wardsCount || 15,
  })),
}));

// Quick lookup map for states by code and lowercase name
const STATE_LOOKUP_MAP = new Map<string, OfficialStateItem>();
for (const state of OFFICIAL_STATES) {
  STATE_LOOKUP_MAP.set(state.code.toUpperCase(), state);
  STATE_LOOKUP_MAP.set(state.name.toLowerCase(), state);
}
// Handle alternative codes
STATE_LOOKUP_MAP.set("TS", STATE_LOOKUP_MAP.get("TG")!); // Telangana alternative code
STATE_LOOKUP_MAP.set("DN", STATE_LOOKUP_MAP.get("DNHDD")!); // DNH alternative code
STATE_LOOKUP_MAP.set("UTTARAKHAND", STATE_LOOKUP_MAP.get("UK")!);

/**
 * Returns all 36 States & Union Territories
 */
export function getAllOfficialStates(): { code: string; name: string; capital: string; isUT?: boolean }[] {
  return OFFICIAL_STATES.map((s) => ({
    code: s.code,
    name: s.name,
    capital: s.capital,
    isUT: s.isUT,
  }));
}

/**
 * Resolve state object by code or name
 */
export function findOfficialState(stateCodeOrName: string): OfficialStateItem | undefined {
  if (!stateCodeOrName) return undefined;
  const key = stateCodeOrName.trim();
  return STATE_LOOKUP_MAP.get(key.toUpperCase()) || STATE_LOOKUP_MAP.get(key.toLowerCase());
}

/**
 * Returns all official districts for a state code or state name
 */
export function getOfficialDistricts(stateCodeOrName: string): OfficialDistrictItem[] {
  const state = findOfficialState(stateCodeOrName);
  if (!state) {
    // Default fallback to Madhya Pradesh
    return OFFICIAL_STATES.find((s) => s.code === "MP")!.districts;
  }
  return state.districts;
}

/**
 * Find specific district item
 */
export function findOfficialDistrict(stateCodeOrName: string, districtIdOrName: string): OfficialDistrictItem | undefined {
  const districts = getOfficialDistricts(stateCodeOrName);
  const key = (districtIdOrName || "").trim().toLowerCase();
  return districts.find((d) => d.id === key || d.name.toLowerCase() === key);
}

/**
 * Generates all official wards for a given state and district
 * Follows exact user specification:
 * - Ward No. 01 through Ward No. 15 for all standard municipalities
 * - Ward No. 01 through Ward No. 85 for Indore Municipal Corporation
 */
export function getOfficialWards(
  stateCodeOrName: string,
  districtIdOrName: string
): OfficialWardItem[] {
  const state = findOfficialState(stateCodeOrName) || OFFICIAL_STATES[0];
  const districts = state.districts;
  const districtKey = (districtIdOrName || "").trim().toLowerCase();
  const district = districts.find((d) => d.id === districtKey || d.name.toLowerCase() === districtKey) || districts[0];

  const count = district.wardsCount;
  const wards: OfficialWardItem[] = [];

  for (let i = 1; i <= count; i++) {
    const numStr = i < 10 ? `0${i}` : `${i}`;
    const wardNumber = `Ward No. ${numStr}`;
    wards.push({
      id: `${district.id}_w${numStr}`,
      wardNumber,
      shortName: wardNumber,
      name: `${wardNumber} (${district.municipality})`,
      municipality: district.municipality,
      district: district.name,
      state: state.name,
      stateCode: state.code,
    });
  }

  return wards;
}

/**
 * Returns options formatted for UI dropdowns:
 * Includes the District-Wide "All Wards" option as the top choice.
 */
export function getOfficialWardDropdownOptions(
  stateCodeOrName: string,
  districtIdOrName: string
): { id: string; name: string; shortName: string; municipality: string }[] {
  const state = findOfficialState(stateCodeOrName) || OFFICIAL_STATES[0];
  const districts = state.districts;
  const districtKey = (districtIdOrName || "").trim().toLowerCase();
  const district = districts.find((d) => d.id === districtKey || d.name.toLowerCase() === districtKey) || districts[0];

  const wards = getOfficialWards(state.code, district.id);

  return [
    {
      id: "all",
      name: `All Wards (${district.municipality} - District Wide)`,
      shortName: "All Wards",
      municipality: district.municipality,
    },
    ...wards.map((w) => ({
      id: w.id,
      name: w.name,
      shortName: w.shortName,
      municipality: w.municipality,
    })),
  ];
}

/**
 * Generate full DistrictData structures for legacy app integration
 */
export function getOfficialDistrictDataRecords(stateCode: string): DistrictData[] {
  const state = findOfficialState(stateCode);
  if (!state) return [];

  return state.districts.map((d) => {
    const wardsList: WardData[] = [];
    for (let i = 1; i <= Math.min(d.wardsCount, 15); i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      wardsList.push({
        id: `${d.id}_w${numStr}`,
        wardNumber: `Ward No. ${numStr}`,
        name: `${d.municipality}`,
        councillorName: `Ward ${numStr} Councillor`,
        councillorPhone: `+91 98000 ${numStr}00`,
        nodalEngineerName: `Er. Assistant Engineer`,
        nodalEngineerDesignation: `AE (${d.municipality})`,
        approxPopulation: 20000 + i * 500,
        resolvedCount: 30 + (i % 10) * 4,
        activeCount: 2 + (i % 4),
      });
    }

    return {
      id: d.id,
      name: d.name,
      stateCode: state.code,
      wardsCount: d.wardsCount,
      totalComplaints: d.wardsCount * 120,
      resolvedComplaints: Math.floor(d.wardsCount * 120 * 0.94),
      pendingSla: Math.floor(d.wardsCount * 120 * 0.06),
      slaPercentage: 94.2,
      collectorName: `District Magistrate, ${d.name}`,
      collectorDesignation: `Collector & DM, ${d.name}`,
      collectorOffice: `Collectorate, ${d.name} (${state.name})`,
      helpline: "0755-1800112",
      topPriorities: [
        `${d.municipality} Cleanliness`,
        "Pothole Remediation & Road Asphalt",
        "24x7 Water Supply & Drainage",
      ],
      wards: wardsList,
    };
  });
}
