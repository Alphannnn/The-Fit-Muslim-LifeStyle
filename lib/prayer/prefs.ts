import {
  CITIES,
  DEFAULT_CITY,
  findCity,
  nearestCity,
} from "./locations";
import type { AsrJuristic, CalculationMethod } from "./times";

/* ============================================================
   Where the visitor prays, held in a tiny external store.

   Read through useSyncExternalStore rather than an effect: the
   server snapshot is null (so SSR output is identical for every
   visitor), and every mounted surface — the floating prayer bar,
   the month table — re-renders together when the city changes.
   ============================================================ */

const STORAGE_KEY = "tfm-prayer-prefs-v1";

export type PrayerPrefs = {
  /** a bundled city slug, or null when using raw coordinates */
  citySlug: string | null;
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
  method: CalculationMethod;
  asr: AsrJuristic;
};

export function prefsFromCity(slug: string, asr: AsrJuristic = "standard"): PrayerPrefs {
  const city = findCity(slug) ?? DEFAULT_CITY;
  return {
    citySlug: city.slug,
    label: `${city.name}, ${city.country}`,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
    method: city.method,
    asr,
  };
}

/** Coordinates from the browser, with a convention borrowed from the nearest city. */
export function prefsFromCoords(
  latitude: number,
  longitude: number,
  asr: AsrJuristic = "standard",
): PrayerPrefs {
  const near = nearestCity(latitude, longitude);
  let timezone = near.timezone;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || near.timezone;
  } catch {
    /* keep the nearest city's zone */
  }
  return {
    citySlug: null,
    label: "Your location",
    latitude,
    longitude,
    timezone,
    method: near.method,
    asr,
  };
}

function read(): PrayerPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PrayerPrefs>;
      if (
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number" &&
        typeof parsed.timezone === "string"
      ) {
        return {
          citySlug: parsed.citySlug ?? null,
          label: parsed.label ?? "Your location",
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          timezone: parsed.timezone,
          method: parsed.method ?? "MWL",
          asr: parsed.asr === "hanafi" ? "hanafi" : "standard",
        };
      }
    }
  } catch {
    /* private mode — fall through to the timezone guess */
  }

  /* No saved choice: match the browser's own timezone before defaulting. */
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = CITIES.find((c) => c.timezone === tz);
    if (match) return prefsFromCity(match.slug);
  } catch {
    /* ignore */
  }
  return prefsFromCity(DEFAULT_CITY.slug);
}

let current: PrayerPrefs | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  current = read();
  emit();
}

export function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    current = read();
    window.addEventListener("storage", onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stable between changes, which is what useSyncExternalStore requires. */
export function getSnapshot(): PrayerPrefs | null {
  return current;
}

export function getServerSnapshot(): PrayerPrefs | null {
  return null;
}

export function setPrefs(next: PrayerPrefs) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* the choice just won't outlive this session */
  }
  emit();
}
