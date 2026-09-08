/* ============================================================
   Hijri dates via the platform's Umm al-Qura calendar data.

   Local moon sighting can still differ by a day — every surface
   that shows a Hijri date should say so rather than imply the
   store has decided when Ramadan begins.
   ============================================================ */

export type HijriDate = {
  year: number;
  month: number; // 1 = Muḥarram
  day: number;
  monthName: string;
};

export const HIJRI_MONTHS = [
  "Muḥarram",
  "Ṣafar",
  "Rabīʿ al-Awwal",
  "Rabīʿ al-Thānī",
  "Jumādā al-Ūlā",
  "Jumādā al-Thāniyah",
  "Rajab",
  "Shaʿbān",
  "Ramaḍān",
  "Shawwāl",
  "Dhū al-Qaʿdah",
  "Dhū al-Ḥijjah",
];

export const RAMADAN = 9;
export const SHABAN = 8;
export const SHAWWAL = 10;
export const DHUL_HIJJAH = 12;

/** Tabular Islamic calendar — the fallback when ICU data is unavailable. */
function tabularHijri(date: Date): HijriDate {
  const jd =
    Math.floor(date.getTime() / 86_400_000) + 2440587.5 + 0.5;
  const days = Math.floor(jd) - 1948440 + 10632;
  const cycles = Math.floor((days - 1) / 10631);
  let remainder = days - 10631 * cycles + 354;
  const yearInCycle =
    Math.floor((10985 - remainder) / 5316) * Math.floor((50 * remainder) / 17719) +
    Math.floor(remainder / 5670) * Math.floor((43 * remainder) / 15238);
  remainder =
    remainder -
    Math.floor((30 - yearInCycle) / 15) * Math.floor((17719 * yearInCycle) / 50) -
    Math.floor(yearInCycle / 16) * Math.floor((15238 * yearInCycle) / 43) +
    29;
  const month = Math.floor((24 * remainder) / 709);
  const day = remainder - Math.floor((709 * month) / 24);
  const year = 30 * cycles + yearInCycle - 30;

  return { year, month, day, monthName: HIJRI_MONTHS[month - 1] ?? "" };
}

export function toHijri(date = new Date(), timezone?: string): HijriDate {
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(date);

    const get = (type: string) =>
      Number.parseInt(parts.find((p) => p.type === type)?.value ?? "", 10);

    const year = get("year");
    const month = get("month");
    const day = get("day");

    if ([year, month, day].some(Number.isNaN)) return tabularHijri(date);
    return { year, month, day, monthName: HIJRI_MONTHS[month - 1] ?? "" };
  } catch {
    return tabularHijri(date);
  }
}

export function formatHijri(h: HijriDate): string {
  return `${h.day} ${h.monthName} ${h.year} AH`;
}

export type SeasonKey = "ramadan" | "pre-ramadan" | "eid-al-fitr" | "hajj" | "ordinary";

export type Season = {
  key: SeasonKey;
  label: string;
  /** short line the storefront can show under the banner */
  note: string;
  hijri: HijriDate;
};

/**
 * What time of year it is, in the terms the store cares about. Drives the
 * Ramadan plan mode, the seasonal banner, and which bundle is promoted.
 */
export function seasonFor(date = new Date(), timezone?: string): Season {
  const hijri = toHijri(date, timezone);

  if (hijri.month === RAMADAN) {
    return {
      key: "ramadan",
      label: `Ramaḍān · Day ${hijri.day}`,
      note: "Your plan is in fasting mode — meals are anchored to suhoor and iftar.",
      hijri,
    };
  }
  if (hijri.month === SHABAN && hijri.day >= 15) {
    return {
      key: "pre-ramadan",
      label: "Ramaḍān Prep",
      note: "Ramaḍān is close. Build the habit now so the first week isn't the hardest.",
      hijri,
    };
  }
  if (hijri.month === SHAWWAL && hijri.day <= 3) {
    return {
      key: "eid-al-fitr",
      label: "ʿĪd Mubārak",
      note: "Rest, celebrate, and ease back in — your plan has a return-to-training week.",
      hijri,
    };
  }
  if (hijri.month === DHUL_HIJJAH && hijri.day <= 13) {
    return {
      key: "hajj",
      label: "Dhū al-Ḥijjah",
      note: "The best ten days of the year. Lighter training, heavier worship.",
      hijri,
    };
  }
  return {
    key: "ordinary",
    label: formatHijri(hijri),
    note: "",
    hijri,
  };
}

export const isRamadan = (date = new Date(), timezone?: string): boolean =>
  toHijri(date, timezone).month === RAMADAN;
