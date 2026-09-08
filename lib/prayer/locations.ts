import type { CalculationMethod } from "./times";

export type City = {
  slug: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  /** the convention normally followed locally */
  method: CalculationMethod;
};

/* A bundled shortlist rather than a geocoding dependency: enough coverage to
   pick a sensible default, with browser geolocation for everyone else. */
export const CITIES: City[] = [
  { slug: "makkah", name: "Makkah", country: "Saudi Arabia", latitude: 21.3891, longitude: 39.8579, timezone: "Asia/Riyadh", method: "MAKKAH" },
  { slug: "madinah", name: "Madinah", country: "Saudi Arabia", latitude: 24.5247, longitude: 39.5692, timezone: "Asia/Riyadh", method: "MAKKAH" },
  { slug: "london", name: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276, timezone: "Europe/London", method: "MWL" },
  { slug: "birmingham", name: "Birmingham", country: "United Kingdom", latitude: 52.4862, longitude: -1.8904, timezone: "Europe/London", method: "MWL" },
  { slug: "manchester", name: "Manchester", country: "United Kingdom", latitude: 53.4808, longitude: -2.2426, timezone: "Europe/London", method: "MWL" },
  { slug: "new-york", name: "New York", country: "United States", latitude: 40.7128, longitude: -74.006, timezone: "America/New_York", method: "ISNA" },
  { slug: "chicago", name: "Chicago", country: "United States", latitude: 41.8781, longitude: -87.6298, timezone: "America/Chicago", method: "ISNA" },
  { slug: "houston", name: "Houston", country: "United States", latitude: 29.7604, longitude: -95.3698, timezone: "America/Chicago", method: "ISNA" },
  { slug: "los-angeles", name: "Los Angeles", country: "United States", latitude: 34.0522, longitude: -118.2437, timezone: "America/Los_Angeles", method: "ISNA" },
  { slug: "toronto", name: "Toronto", country: "Canada", latitude: 43.6532, longitude: -79.3832, timezone: "America/Toronto", method: "ISNA" },
  { slug: "dubai", name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708, timezone: "Asia/Dubai", method: "MAKKAH" },
  { slug: "doha", name: "Doha", country: "Qatar", latitude: 25.2854, longitude: 51.531, timezone: "Asia/Qatar", method: "MAKKAH" },
  { slug: "cairo", name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357, timezone: "Africa/Cairo", method: "EGYPT" },
  { slug: "istanbul", name: "Istanbul", country: "Türkiye", latitude: 41.0082, longitude: 28.9784, timezone: "Europe/Istanbul", method: "MWL" },
  { slug: "karachi", name: "Karachi", country: "Pakistan", latitude: 24.8607, longitude: 67.0011, timezone: "Asia/Karachi", method: "KARACHI" },
  { slug: "lahore", name: "Lahore", country: "Pakistan", latitude: 31.5204, longitude: 74.3587, timezone: "Asia/Karachi", method: "KARACHI" },
  { slug: "delhi", name: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209, timezone: "Asia/Kolkata", method: "KARACHI" },
  { slug: "hyderabad", name: "Hyderabad", country: "India", latitude: 17.385, longitude: 78.4867, timezone: "Asia/Kolkata", method: "KARACHI" },
  { slug: "dhaka", name: "Dhaka", country: "Bangladesh", latitude: 23.8103, longitude: 90.4125, timezone: "Asia/Dhaka", method: "KARACHI" },
  { slug: "kuala-lumpur", name: "Kuala Lumpur", country: "Malaysia", latitude: 3.139, longitude: 101.6869, timezone: "Asia/Kuala_Lumpur", method: "MWL" },
  { slug: "jakarta", name: "Jakarta", country: "Indonesia", latitude: -6.2088, longitude: 106.8456, timezone: "Asia/Jakarta", method: "MWL" },
  { slug: "singapore", name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, timezone: "Asia/Singapore", method: "MWL" },
  { slug: "paris", name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522, timezone: "Europe/Paris", method: "MWL" },
  { slug: "berlin", name: "Berlin", country: "Germany", latitude: 52.52, longitude: 13.405, timezone: "Europe/Berlin", method: "MWL" },
  { slug: "amsterdam", name: "Amsterdam", country: "Netherlands", latitude: 52.3676, longitude: 4.9041, timezone: "Europe/Amsterdam", method: "MWL" },
  { slug: "stockholm", name: "Stockholm", country: "Sweden", latitude: 59.3293, longitude: 18.0686, timezone: "Europe/Stockholm", method: "MWL" },
  { slug: "lagos", name: "Lagos", country: "Nigeria", latitude: 6.5244, longitude: 3.3792, timezone: "Africa/Lagos", method: "MWL" },
  { slug: "johannesburg", name: "Johannesburg", country: "South Africa", latitude: -26.2041, longitude: 28.0473, timezone: "Africa/Johannesburg", method: "MWL" },
  { slug: "sydney", name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney", method: "MWL" },
  { slug: "melbourne", name: "Melbourne", country: "Australia", latitude: -37.8136, longitude: 144.9631, timezone: "Australia/Melbourne", method: "MWL" },
];

export const DEFAULT_CITY =
  CITIES.find((c) => c.slug === "london") ?? CITIES[0];

export function findCity(slug: string | null | undefined): City | null {
  if (!slug) return null;
  return CITIES.find((c) => c.slug === slug) ?? null;
}

/** Nearest bundled city — used to turn browser coordinates into a method. */
export function nearestCity(latitude: number, longitude: number): City {
  let best = CITIES[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const city of CITIES) {
    /* squared euclidean on lat/lng is plenty for choosing a convention */
    const d =
      (city.latitude - latitude) ** 2 + (city.longitude - longitude) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = city;
    }
  }
  return best;
}

/**
 * Hours east of UTC for an IANA zone on a given date, DST included.
 * Derived from the platform's own zone data rather than a hardcoded table.
 */
export function utcOffsetHours(timezone: string, date = new Date()): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    }).format(date);

    const match = formatted.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0; // "GMT" with no offset means UTC
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2]) + Number(match[3] ?? 0) / 60);
  } catch {
    return 0;
  }
}

/** Local wall-clock date parts in an arbitrary zone. */
export function zonedNow(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = get("hour") % 24;

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    /** minutes past local midnight */
    minutes: hour * 60 + get("minute"),
    date: new Date(get("year"), get("month") - 1, get("day")),
  };
}
