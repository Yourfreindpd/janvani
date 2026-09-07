export interface DetectedLocation {
  locality: string;
  road?: string;
  suburb?: string;
  ward: string;
  city: string;
  district: string;
  state: string;
  stateCode: string;
  postcode?: string;
  coordinates?: { lat: number; lng: number };
  accuracyMeters?: number;
  formattedAddress: string;
  isLiveGps: boolean;
  status: "success" | "denied" | "unavailable" | "timeout" | "unsupported" | "manual" | "pending";
  errorMessage?: string;
  timestamp: number;
}

const STORAGE_KEY = "janvani_detected_location";

const DEFAULT_LOCATION: DetectedLocation = {
  locality: "Main Market / Central Sector",
  road: "Main Road",
  ward: "Ward 18",
  city: "Dhar",
  district: "Dhar",
  state: "Madhya Pradesh",
  stateCode: "MP",
  coordinates: undefined,
  accuracyMeters: undefined,
  formattedAddress: "Ward 18, Dhar, Madhya Pradesh",
  isLiveGps: false,
  status: "pending",
  timestamp: Date.now(),
};

type LocationListener = (loc: DetectedLocation) => void;
const listeners: LocationListener[] = [];

export function getCachedLocation(): DetectedLocation {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.locality && parsed.district) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_LOCATION;
}

export function saveLocation(loc: DetectedLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // ignore
  }
  listeners.forEach((fn) => {
    try {
      fn(loc);
    } catch (e) {
      console.warn("Location listener err:", e);
    }
  });
}

export function subscribeToLocation(listener: LocationListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

/**
 * Reverse geocode coordinates via server or OpenStreetMap Nominatim
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number,
  accuracyMeters?: number
): Promise<DetectedLocation> {
  // 1. Try server reverse geocode
  try {
    const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      const loc: DetectedLocation = {
        locality: data.locality || `Near GPS Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        road: data.road || "Main Road",
        ward: data.ward || `Ward (${data.road || "Sector Zone"})`,
        city: data.city || data.district || "Dhar",
        district: data.district || "Dhar",
        state: data.state || "Madhya Pradesh",
        stateCode: getStateCode(data.state || "Madhya Pradesh"),
        postcode: data.postcode || "",
        coordinates: { lat, lng },
        accuracyMeters: accuracyMeters !== undefined ? Math.round(accuracyMeters) : undefined,
        formattedAddress: data.fullAddress || `${data.locality}, ${data.district}, ${data.state}`,
        isLiveGps: true,
        status: "success",
        timestamp: Date.now(),
      };
      saveLocation(loc);
      return loc;
    }
  } catch (err) {
    console.warn("Server reverse geocode notice:", err);
  }

  // 2. Direct browser Nominatim fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { "Accept-Language": "en,hi" },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road =
        addr.road ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.village ||
        addr.hamlet ||
        "Live GPS Location";
      const district = addr.state_district || addr.county || addr.city || addr.town || "Dhar";
      const city = addr.city || addr.town || addr.municipality || addr.village || district;
      const state = addr.state || "Madhya Pradesh";
      const postcode = addr.postcode || "";
      const ward = addr.suburb || addr.neighbourhood || `Ward (${road})`;

      const loc: DetectedLocation = {
        locality: `${road}${city !== road ? `, ${city}` : ""}${postcode ? ` - ${postcode}` : ""}`,
        road,
        ward,
        city,
        district,
        state,
        stateCode: getStateCode(state),
        postcode,
        coordinates: { lat, lng },
        accuracyMeters: accuracyMeters !== undefined ? Math.round(accuracyMeters) : undefined,
        formattedAddress: data.display_name || `${road}, ${district}, ${state}`,
        isLiveGps: true,
        status: "success",
        timestamp: Date.now(),
      };
      saveLocation(loc);
      return loc;
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode notice:", err);
  }

  // 3. Coordinate-based fallback
  const loc: DetectedLocation = {
    locality: `GPS Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    ward: `Ward Sector (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
    city: "Municipal Area",
    district: "Dhar",
    state: "Madhya Pradesh",
    stateCode: "MP",
    coordinates: { lat, lng },
    accuracyMeters: accuracyMeters !== undefined ? Math.round(accuracyMeters) : undefined,
    formattedAddress: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
    isLiveGps: true,
    status: "success",
    timestamp: Date.now(),
  };
  saveLocation(loc);
  return loc;
}

/**
 * Automatically fetch current location from real browser GPS
 */
export async function detectCurrentLocation(forceRefresh = false): Promise<DetectedLocation> {
  const cached = getCachedLocation();
  if (
    !forceRefresh &&
    cached &&
    cached.status === "success" &&
    cached.isLiveGps &&
    Date.now() - cached.timestamp < 1000 * 60 * 10
  ) {
    return cached;
  }

  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      const unsupportedLoc: DetectedLocation = {
        ...cached,
        isLiveGps: false,
        coordinates: undefined,
        accuracyMeters: undefined,
        status: "unsupported",
        errorMessage: "Geolocation is not supported by this browser.",
        timestamp: Date.now(),
      };
      saveLocation(unsupportedLoc);
      resolve(unsupportedLoc);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocodeCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy
          );
          resolve(loc);
        } catch {
          const fallbackLoc: DetectedLocation = {
            locality: `GPS Pin (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
            ward: "Current Municipal Ward",
            city: "Municipal Area",
            district: "Dhar",
            state: "Madhya Pradesh",
            stateCode: "MP",
            coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            accuracyMeters: Math.round(pos.coords.accuracy),
            formattedAddress: `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`,
            isLiveGps: true,
            status: "success",
            timestamp: Date.now(),
          };
          saveLocation(fallbackLoc);
          resolve(fallbackLoc);
        }
      },
      (err) => {
        let status: DetectedLocation["status"] = "unavailable";
        let message = "Unable to retrieve device location.";

        if (err.code === 1) {
          status = "denied";
          message = "Location permission was denied. Please allow location access or select your location manually.";
        } else if (err.code === 2) {
          status = "unavailable";
          message = "GPS position is unavailable. Please check your device location settings or enter manually.";
        } else if (err.code === 3) {
          status = "timeout";
          message = "GPS location request timed out. Please retry or enter your location manually.";
        }

        const errorLoc: DetectedLocation = {
          ...cached,
          isLiveGps: false,
          coordinates: undefined,
          accuracyMeters: undefined,
          status,
          errorMessage: message,
          timestamp: Date.now(),
        };
        saveLocation(errorLoc);
        resolve(errorLoc);
      },
      options
    );
  });
}

/**
 * Search locations online via OpenStreetMap / backend search
 */
export async function searchLocationOnline(query: string): Promise<Array<{
  displayName: string;
  locality: string;
  ward: string;
  city: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
}>> {
  if (!query || query.trim().length < 2) return [];

  // Try backend search first
  try {
    const res = await fetch(`/api/location/search?q=${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Backend search err, falling back to nominatim:", err);
  }

  // Direct Nominatim fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&countrycodes=in&limit=5&addressdetails=1`,
      {
        headers: { "Accept-Language": "en,hi" },
      }
    );
    if (res.ok) {
      const items: any[] = await res.json();
      return items.map((it) => {
        const addr = it.address || {};
        const road = addr.road || addr.suburb || addr.neighbourhood || it.display_name.split(",")[0];
        const district = addr.state_district || addr.county || addr.city || addr.town || "Dhar";
        const city = addr.city || addr.town || addr.municipality || district;
        const state = addr.state || "Madhya Pradesh";
        return {
          displayName: it.display_name,
          locality: `${road}, ${city}`,
          ward: addr.suburb || addr.neighbourhood || `Ward (${road})`,
          city,
          district,
          state,
          lat: parseFloat(it.lat),
          lng: parseFloat(it.lon),
        };
      });
    }
  } catch (err) {
    console.warn("Nominatim search error:", err);
  }

  return [];
}

/**
 * Manually set or override user location
 */
export function setManualLocation(manual: {
  locality: string;
  ward?: string;
  city?: string;
  district?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}): DetectedLocation {
  const prev = getCachedLocation();
  const district = manual.district || prev.district || "Dhar";
  const state = manual.state || prev.state || "Madhya Pradesh";
  const locality = manual.locality || prev.locality || "Main Market";
  const ward = manual.ward || prev.ward || `Ward (${locality.split(",")[0]})`;
  const city = manual.city || prev.city || district;

  const updated: DetectedLocation = {
    locality,
    ward,
    city,
    district,
    state,
    stateCode: getStateCode(state),
    coordinates: manual.coordinates,
    accuracyMeters: manual.coordinates ? 10 : undefined,
    formattedAddress: manual.formattedAddress || `${locality}, ${ward}, ${district}, ${state}`,
    isLiveGps: false,
    status: "manual",
    errorMessage: undefined,
    timestamp: Date.now(),
  };

  saveLocation(updated);
  return updated;
}

function getStateCode(stateName: string): string {
  const map: Record<string, string> = {
    "madhya pradesh": "MP",
    "maharashtra": "MH",
    "delhi": "DL",
    "karnataka": "KA",
    "gujarat": "GJ",
    "uttar pradesh": "UP",
    "tamil nadu": "TN",
    "telangana": "TS",
    "west bengal": "WB",
    "rajasthan": "RJ",
    "punjab": "PB",
    "haryana": "HR",
    "bihar": "BR",
    "odisha": "OD",
    "kerala": "KL",
    "andhra pradesh": "AP",
    "assam": "AS",
  };
  return map[stateName.toLowerCase()] || "MP";
}
