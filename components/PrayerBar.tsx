"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CITIES, utcOffsetHours, zonedNow } from "@/lib/prayer/locations";
import {
  getServerSnapshot,
  getSnapshot,
  prefsFromCity,
  prefsFromCoords,
  setPrefs,
  subscribe,
  type PrayerPrefs,
} from "@/lib/prayer/prefs";
import {
  OBLIGATORY,
  PRAYER_LABELS,
  formatCountdown,
  formatMinutes,
  scheduleFor,
} from "@/lib/prayer/times";
import { formatHijri, seasonFor } from "@/lib/prayer/hijri";

const ease = [0.22, 0.61, 0.36, 1] as const;

/** Prayer schedule + Hijri season for a set of preferences, at a given instant. */
export function useSchedule(prefs: PrayerPrefs | null, tick: number) {
  return useMemo(() => {
    if (!prefs) return null;
    const now = new Date(tick);
    const zoned = zonedNow(prefs.timezone, now);
    const schedule = scheduleFor(zoned.date, zoned.minutes, {
      latitude: prefs.latitude,
      longitude: prefs.longitude,
      utcOffset: utcOffsetHours(prefs.timezone, now),
      method: prefs.method,
      asr: prefs.asr,
    });
    return { schedule, season: seasonFor(now, prefs.timezone), nowMinutes: zoned.minutes };
  }, [prefs, tick]);
}

/** Suhoor / iftar framing of the same times — the fasting view. */
export function fastingWindow(
  times: Record<string, number>,
  nowMinutes: number,
): { label: string; detail: string } {
  const fajr = times.fajr;
  const maghrib = times.maghrib;

  if (nowMinutes < fajr) {
    return {
      label: "Suhoor ends",
      detail: `${formatMinutes(fajr)} · in ${formatCountdown(fajr - nowMinutes)}`,
    };
  }
  if (nowMinutes < maghrib) {
    return {
      label: "Iftar",
      detail: `${formatMinutes(maghrib)} · in ${formatCountdown(maghrib - nowMinutes)}`,
    };
  }
  return { label: "Fast complete", detail: `Broken at ${formatMinutes(maghrib)}` };
}

export default function PrayerBar() {
  /* null on the server and for the very first client render, so the markup
     hydrates identically before the stored location is applied. */
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(() => Date.now());
  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const view = useSchedule(prefs, tick);

  const useMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPrefs(prefsFromCoords(latitude, longitude, prefs?.asr ?? "standard"));
        setLocating(false);
        setPicking(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }, [prefs?.asr]);

  /* Nothing is rendered until the client knows where the visitor is — this
     component must never produce different HTML on the server. */
  if (!prefs || !view) return null;

  const { schedule, season, nowMinutes } = view;
  const fasting = fastingWindow(schedule.times, nowMinutes);
  const isFastingSeason = season.key === "ramadan";

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50 print:hidden sm:bottom-6 sm:left-6">
      <AnimatePresence initial={false}>
        {open ? (
          <motion.section
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.4, ease }}
            aria-label="Prayer times"
            className="pointer-events-auto w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-linen bg-ivory/95 shadow-[0_30px_60px_-28px_rgba(21,24,21,0.5)] backdrop-blur-md"
          >
            <header className="flex items-start justify-between gap-3 border-b border-linen bg-sand px-5 py-4">
              <div className="min-w-0">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-gold-deep">
                  {season.key === "ordinary" ? "Prayer Times" : season.label}
                </p>
                <button
                  type="button"
                  onClick={() => setPicking((p) => !p)}
                  className="mt-1 flex max-w-full items-center gap-1.5 truncate text-left font-serif text-base text-ink transition-colors hover:text-green-800"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="2.4" />
                  </svg>
                  <span className="truncate">{prefs.label}</span>
                </button>
                <p className="mt-0.5 text-[0.66rem] text-ink-muted">{formatHijri(season.hijri)}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close prayer times"
                className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border border-linen text-ink-soft transition-colors hover:border-gold hover:text-green-800"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <AnimatePresence initial={false}>
              {picking && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="overflow-hidden border-b border-linen bg-shell px-5"
                >
                  <div className="space-y-3 py-4">
                    <label className="block">
                      <span className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        City
                      </span>
                      <select
                        value={prefs.citySlug ?? ""}
                        onChange={(e) =>
                          e.target.value &&
                          setPrefs(prefsFromCity(e.target.value, prefs.asr))
                        }
                        className="mt-1.5 w-full cursor-pointer rounded-sm border border-linen bg-ivory px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-gold"
                      >
                        <option value="">Using my coordinates</option>
                        {CITIES.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}, {c.country}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        ʿAsr calculation
                      </span>
                      <select
                        value={prefs.asr}
                        onChange={(e) =>
                          setPrefs({
                            ...prefs,
                            asr: e.target.value === "hanafi" ? "hanafi" : "standard",
                          })
                        }
                        className="mt-1.5 w-full cursor-pointer rounded-sm border border-linen bg-ivory px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-gold"
                      >
                        <option value="standard">Standard (Shāfiʿī, Mālikī, Ḥanbalī)</option>
                        <option value="hanafi">Ḥanafī</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={locating}
                      className="w-full cursor-pointer rounded-sm border border-gold/50 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-gold-deep transition-colors hover:bg-gold/10 disabled:opacity-60"
                    >
                      {locating ? "Locating…" : "Use my exact location"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* next prayer */}
            <div className="border-b border-linen px-5 py-4">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                {schedule.nextIsTomorrow ? "Next · tomorrow" : "Next"}
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <span className="font-display text-2xl font-semibold text-ink">
                  {PRAYER_LABELS[schedule.next]}
                </span>
                <span className="text-right">
                  <span className="block font-display text-xl font-semibold text-green-700">
                    {formatMinutes(schedule.times[schedule.next])}
                  </span>
                  <span className="text-[0.68rem] text-ink-muted">
                    in {formatCountdown(schedule.minutesToNext)}
                  </span>
                </span>
              </div>
            </div>

            {/* full day */}
            <ul className="divide-y divide-linen/70 px-5">
              {OBLIGATORY.map((prayer) => {
                const isCurrent = schedule.current === prayer;
                return (
                  <li
                    key={prayer}
                    className={`flex items-center justify-between py-2.5 text-sm ${
                      isCurrent ? "text-green-800" : "text-ink-soft"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                      )}
                      <span className={isCurrent ? "font-semibold" : ""}>
                        {PRAYER_LABELS[prayer]}
                      </span>
                    </span>
                    <span className={`font-display ${isCurrent ? "font-semibold" : ""}`}>
                      {formatMinutes(schedule.times[prayer])}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* fasting strip — always useful, essential in Ramadan */}
            <div
              className={`flex items-center justify-between gap-3 px-5 py-3.5 ${
                isFastingSeason ? "bg-green-800 text-ivory" : "border-t border-linen bg-sand"
              }`}
            >
              <span
                className={`text-[0.58rem] font-semibold uppercase tracking-[0.2em] ${
                  isFastingSeason ? "text-ivory/75" : "text-ink-muted"
                }`}
              >
                {fasting.label}
              </span>
              <span className={`text-[0.78rem] font-semibold ${isFastingSeason ? "" : "text-ink"}`}>
                {fasting.detail}
              </span>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-linen px-5 py-3">
              <Link
                href="/prayer-times"
                onClick={() => setOpen(false)}
                className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-green-700 transition-colors hover:text-green-900"
              >
                Full month →
              </Link>
              <Link
                href="/plan"
                onClick={() => setOpen(false)}
                className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold-deep transition-colors hover:text-gold"
              >
                Plan around these
              </Link>
            </footer>
          </motion.section>
        ) : (
          <motion.button
            key="pill"
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease }}
            aria-label={`Prayer times — ${PRAYER_LABELS[schedule.next]} in ${formatCountdown(schedule.minutesToNext)}`}
            className="pointer-events-auto group flex cursor-pointer items-center gap-3 rounded-full border border-linen bg-ivory/95 py-2.5 pl-3.5 pr-5 shadow-[0_18px_40px_-22px_rgba(21,24,21,0.55)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-gold/50"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-green-800 text-ivory">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 20h14M6 20V11a6 6 0 0 1 12 0v9M12 3v2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-left">
              <span className="block text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                {isFastingSeason ? fasting.label : PRAYER_LABELS[schedule.next]}
              </span>
              <span className="block text-[0.82rem] font-semibold text-ink">
                {isFastingSeason
                  ? fasting.detail.split(" · ")[0]
                  : `${formatMinutes(schedule.times[schedule.next])} · ${formatCountdown(schedule.minutesToNext)}`}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
