/* ============================================================
   Prayer times, computed from solar geometry.

   No API and no key: the times are derived from the sun's
   declination and the equation of time for the given date and
   coordinates, which is the same approach the well-known
   PrayTimes reference implementation takes. That keeps the
   personalisation layer working offline and rate-limit free.
   ============================================================ */

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

const sin = (d: number) => Math.sin(d * D2R);
const cos = (d: number) => Math.cos(d * D2R);
const tan = (d: number) => Math.tan(d * D2R);
const arcsin = (x: number) => Math.asin(x) * R2D;
const arccos = (x: number) => Math.acos(x) * R2D;
const arctan2 = (y: number, x: number) => Math.atan2(y, x) * R2D;
const arccot = (x: number) => Math.atan(1 / x) * R2D;

const fixAngle = (a: number) => ((a % 360) + 360) % 360;
const fixHour = (h: number) => ((h % 24) + 24) % 24;

export type Prayer = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_LABELS: Record<Prayer, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "ʿAsr",
  maghrib: "Maghrib",
  isha: "ʿIshā",
};

/** The five obligatory prayers, in order — sunrise is informational. */
export const OBLIGATORY: Prayer[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export type CalculationMethod =
  | "MWL"
  | "ISNA"
  | "EGYPT"
  | "MAKKAH"
  | "KARACHI";

type MethodParams = {
  label: string;
  fajrAngle: number;
  /** either an angle below the horizon, or a fixed interval after Maghrib */
  ishaAngle?: number;
  ishaIntervalMinutes?: number;
};

export const METHODS: Record<CalculationMethod, MethodParams> = {
  MWL: { label: "Muslim World League", fajrAngle: 18, ishaAngle: 17 },
  ISNA: { label: "Islamic Society of North America", fajrAngle: 15, ishaAngle: 15 },
  EGYPT: { label: "Egyptian General Authority", fajrAngle: 19.5, ishaAngle: 17.5 },
  MAKKAH: { label: "Umm al-Qura, Makkah", fajrAngle: 18.5, ishaIntervalMinutes: 90 },
  KARACHI: { label: "University of Islamic Sciences, Karachi", fajrAngle: 18, ishaAngle: 18 },
};

/** Shāfiʿī/Mālikī/Ḥanbalī use a shadow factor of 1; Ḥanafī uses 2. */
export type AsrJuristic = "standard" | "hanafi";

export type PrayerOptions = {
  latitude: number;
  longitude: number;
  /** hours east of UTC for the given date, DST included */
  utcOffset: number;
  method?: CalculationMethod;
  asr?: AsrJuristic;
};

/* Julian day at 00:00 UT for a civil date. */
function julian(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    b -
    1524.5
  );
}

/** Sun declination and equation of time for a Julian day. */
function sunPosition(jd: number): { declination: number; equationOfTime: number } {
  const d = jd - 2451545.0;
  const meanAnomaly = fixAngle(357.529 + 0.98560028 * d);
  const meanLongitude = fixAngle(280.459 + 0.98564736 * d);
  const eclipticLongitude = fixAngle(
    meanLongitude + 1.915 * sin(meanAnomaly) + 0.02 * sin(2 * meanAnomaly),
  );
  const obliquity = 23.439 - 0.00000036 * d;

  const rightAscension =
    arctan2(cos(obliquity) * sin(eclipticLongitude), cos(eclipticLongitude)) / 15;

  return {
    declination: arcsin(sin(obliquity) * sin(eclipticLongitude)),
    equationOfTime: meanLongitude / 15 - fixHour(rightAscension),
  };
}

/**
 * Minutes past local midnight for each prayer. `null` means the sun never
 * reaches that depression angle on this date — the high-latitude case,
 * which the caller resolves with `resolveHighLatitude`.
 */
export type RawTimes = Record<Prayer, number | null>;

export function prayerTimes(date: Date, options: PrayerOptions): RawTimes {
  const { latitude, longitude, utcOffset } = options;
  const method = METHODS[options.method ?? "MWL"];
  const shadowFactor = options.asr === "hanafi" ? 2 : 1;

  /* Offset the Julian day by longitude so the solar quantities are computed
     for the observer's meridian rather than Greenwich. */
  const jd =
    julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - longitude / 360;
  const { declination, equationOfTime } = sunPosition(jd);

  const solarNoon = fixHour(12 - equationOfTime);

  /** Hours from solar noon at which the sun sits `angle` below the horizon. */
  const hourAngle = (angle: number): number | null => {
    const cosine =
      (-sin(angle) - sin(declination) * sin(latitude)) /
      (cos(declination) * cos(latitude));
    if (cosine > 1 || cosine < -1) return null; // never happens at this latitude today
    return arccos(cosine) / 15;
  };

  const before = (angle: number) => {
    const h = hourAngle(angle);
    return h === null ? null : solarNoon - h;
  };
  const after = (angle: number) => {
    const h = hourAngle(angle);
    return h === null ? null : solarNoon + h;
  };

  /* ʿAsr: when an object's shadow reaches `factor` times its own length. */
  const asrAngle = -arccot(shadowFactor + tan(Math.abs(latitude - declination)));

  /* 0.833° accounts for atmospheric refraction and the solar disc. */
  const HORIZON = 0.833;

  const maghrib = after(HORIZON);
  const isha =
    method.ishaIntervalMinutes !== undefined
      ? maghrib === null
        ? null
        : maghrib + method.ishaIntervalMinutes / 60
      : after(method.ishaAngle!);

  /* Convert from local solar hours to civil clock hours. */
  const toClock = (h: number | null) =>
    h === null ? null : Math.round((h + utcOffset - longitude / 15) * 60);

  return {
    fajr: toClock(before(method.fajrAngle)),
    sunrise: toClock(before(HORIZON)),
    dhuhr: toClock(solarNoon),
    asr: toClock(after(asrAngle)),
    maghrib: toClock(maghrib),
    isha: toClock(isha),
  };
}

/**
 * At high latitudes Fajr and ʿIshā can be undefined for weeks. The common
 * fallback ("one seventh") splits the night into sevenths and places the
 * missing prayer at the first/last boundary.
 */
export function resolveHighLatitude(times: RawTimes): Record<Prayer, number> {
  const sunrise = times.sunrise ?? 5 * 60;
  const sunset = times.maghrib ?? 19 * 60;
  const dhuhr = times.dhuhr ?? 12 * 60;
  const nightLength = 24 * 60 - (sunset - sunrise);
  const seventh = nightLength / 7;

  return {
    fajr: times.fajr ?? Math.round(sunrise - seventh),
    sunrise,
    dhuhr,
    /* midway between Dhuhr and sunset is a reasonable stand-in when the
       shadow-length angle itself is unreachable */
    asr: times.asr ?? Math.round((dhuhr + sunset) / 2),
    maghrib: sunset,
    isha: times.isha ?? Math.round(sunset + seventh),
  };
}

export type PrayerSchedule = {
  /** minutes past local midnight, always defined */
  times: Record<Prayer, number>;
  /** the prayer whose window we are currently in */
  current: Prayer;
  /** the next prayer, and how many minutes until it */
  next: Prayer;
  minutesToNext: number;
  /** true when the next prayer falls tomorrow (after ʿIshā) */
  nextIsTomorrow: boolean;
};

/** Wraps the raw calculation up with "where are we now" for the UI. */
export function scheduleFor(
  date: Date,
  nowMinutes: number,
  options: PrayerOptions,
): PrayerSchedule {
  const times = resolveHighLatitude(prayerTimes(date, options));

  const ordered = OBLIGATORY.map((p) => ({ prayer: p, at: times[p] })).sort(
    (a, b) => a.at - b.at,
  );

  const upcoming = ordered.find((entry) => entry.at > nowMinutes);
  const next = upcoming?.prayer ?? ordered[0].prayer;
  const nextIsTomorrow = !upcoming;
  const nextAt = upcoming ? upcoming.at : ordered[0].at + 24 * 60;

  /* the current window is the last prayer that has already begun; before
     Fajr we are still inside yesterday's ʿIshā */
  const started = ordered.filter((entry) => entry.at <= nowMinutes);
  const current = started.length ? started[started.length - 1].prayer : "isha";

  return {
    times,
    current,
    next,
    minutesToNext: nextAt - nowMinutes,
    nextIsTomorrow,
  };
}

/* ------------------------------ formatting ------------------------------ */

export function formatMinutes(minutes: number, hour12 = true): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  if (!hour12) return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function formatCountdown(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
