"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CITIES, utcOffsetHours, zonedNow } from "@/lib/prayer/locations";
import {
  getServerSnapshot,
  getSnapshot,
  prefsFromCity,
  setPrefs,
  subscribe,
  type PrayerPrefs,
} from "@/lib/prayer/prefs";
import {
  METHODS,
  OBLIGATORY,
  PRAYER_LABELS,
  formatMinutes,
  prayerTimes,
  resolveHighLatitude,
  type AsrJuristic,
} from "@/lib/prayer/times";
import { formatHijri, seasonFor, toHijri } from "@/lib/prayer/hijri";

const DAYS = 30;

export default function PrayerMonth() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const rows = useMemo(() => {
    if (!prefs) return [];
    const today = new Date();

    return Array.from({ length: DAYS }, (_, offset) => {
      const date = new Date(today.getTime() + offset * 86_400_000);
      const zoned = zonedNow(prefs.timezone, date);
      const times = resolveHighLatitude(
        prayerTimes(zoned.date, {
          latitude: prefs.latitude,
          longitude: prefs.longitude,
          utcOffset: utcOffsetHours(prefs.timezone, date),
          method: prefs.method,
          asr: prefs.asr,
        }),
      );
      return {
        key: zoned.date.toISOString().slice(0, 10),
        date: zoned.date,
        hijri: toHijri(date, prefs.timezone),
        season: seasonFor(date, prefs.timezone),
        times,
        isToday: offset === 0,
        fastLength: times.maghrib - times.fajr,
      };
    });
  }, [prefs]);

  if (!prefs) {
    return <div className="h-96 animate-pulse rounded-xl border border-linen bg-sand" aria-hidden />;
  }

  const selectClass =
    "cursor-pointer rounded-sm border border-linen bg-shell px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold";

  return (
    <div>
      {/* controls */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-linen bg-sand p-5">
        <label className="block">
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            City
          </span>
          <select
            value={prefs.citySlug ?? ""}
            onChange={(e) =>
              e.target.value && setPrefs(prefsFromCity(e.target.value, prefs.asr))
            }
            className={`mt-1.5 block ${selectClass}`}
          >
            {prefs.citySlug === null && <option value="">Your coordinates</option>}
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Convention
          </span>
          <select
            value={prefs.method}
            onChange={(e) =>
              setPrefs({ ...prefs, method: e.target.value as PrayerPrefs["method"] })
            }
            className={`mt-1.5 block ${selectClass}`}
          >
            {Object.entries(METHODS).map(([key, m]) => (
              <option key={key} value={key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            ʿAsr
          </span>
          <select
            value={prefs.asr}
            onChange={(e) => setPrefs({ ...prefs, asr: e.target.value as AsrJuristic })}
            className={`mt-1.5 block ${selectClass}`}
          >
            <option value="standard">Standard</option>
            <option value="hanafi">Ḥanafī</option>
          </select>
        </label>

        <p className="ml-auto max-w-xs text-[0.72rem] leading-relaxed text-ink-muted">
          Computed from solar geometry for {prefs.label}. Local moon sighting can move
          Hijri dates by a day — follow your masjid.
        </p>
      </div>

      {/* table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-linen">
        <table className="w-full min-w-[46rem] border-collapse bg-shell text-sm">
          <thead>
            <tr className="border-b border-linen bg-sand">
              <th scope="col" className="px-4 py-3 text-left text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Date
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Hijri
              </th>
              {OBLIGATORY.map((prayer) => (
                <th
                  key={prayer}
                  scope="col"
                  className="px-4 py-3 text-right text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink-muted"
                >
                  {PRAYER_LABELS[prayer]}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Fast
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className={`border-b border-linen/70 last:border-0 ${
                  row.isToday ? "bg-green-800/6" : ""
                }`}
              >
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className={row.isToday ? "font-semibold text-green-800" : "text-ink"}>
                    {row.date.toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  {row.isToday && (
                    <span className="ml-2 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-green-700">
                      Today
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[0.8rem] text-ink-muted">
                  {row.hijri.day} {row.hijri.monthName}
                  {row.season.key === "ramadan" && (
                    <span className="ml-2 rounded-full bg-green-800 px-2 py-0.5 text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-ivory">
                      Ramaḍān
                    </span>
                  )}
                </td>
                {OBLIGATORY.map((prayer) => (
                  <td
                    key={prayer}
                    className="whitespace-nowrap px-4 py-2.5 text-right font-display text-[0.85rem] text-ink"
                  >
                    {formatMinutes(row.times[prayer])}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-[0.78rem] text-ink-muted">
                  {Math.floor(row.fastLength / 60)}h {String(row.fastLength % 60).padStart(2, "0")}m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-[0.75rem] text-ink-muted">
        Today is {formatHijri(rows[0]?.hijri ?? toHijri())}. Times are calculated, not
        fetched — they work offline and never rate-limit.
      </p>
    </div>
  );
}
