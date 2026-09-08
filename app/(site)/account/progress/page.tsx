import type { Metadata } from "next";
import ProgressLogger from "@/components/ProgressLogger";
import { getCurrentUser } from "@/lib/auth/session";
import { getProgress, getProgressSummary } from "@/lib/account";
import { deleteProgressAction } from "@/lib/progress/actions";

export const metadata: Metadata = {
  title: "Progress",
  robots: { index: false, follow: false },
};

/** Weight over time as a plain SVG line — no charting library needed. */
function WeightTrend({ points }: { points: { day: string; weight: number }[] }) {
  if (points.length < 2) return null;

  const width = 640;
  const height = 140;
  const pad = 12;

  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((p.weight - min) / span) * (height - pad * 2);
    return { x, y, ...p };
  });

  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${(width - pad).toFixed(1)},${height - pad}`;

  return (
    <figure className="rounded-lg border border-linen bg-shell p-5">
      <figcaption className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Weight</h2>
        <span className="text-[0.7rem] text-ink-muted">
          {min}kg – {max}kg · {points.length} entries
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-36 w-full"
        role="img"
        aria-label={`Weight trend from ${points[0].weight}kg to ${points[points.length - 1].weight}kg`}
      >
        <defs>
          <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-green-500)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-green-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#weight-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-green-700)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c) => (
          <circle key={c.day} cx={c.x} cy={c.y} r="2.5" fill="var(--color-green-800)" />
        ))}
      </svg>
    </figure>
  );
}

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [logs, summary] = await Promise.all([
    getProgress(user.id, 60),
    getProgressSummary(user.id),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  /* getProgress returns newest first; the chart reads left to right in time. */
  const trend = [...logs]
    .reverse()
    .filter((l) => l.weightKg != null)
    .map((l) => ({ day: l.loggedOn, weight: l.weightKg as number }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Streak", value: summary.streak > 0 ? `${summary.streak}d` : "—" },
          {
            label: "Weight",
            value: summary.latestWeightKg != null ? `${summary.latestWeightKg}kg` : "—",
          },
          { label: "Workouts / 7d", value: `${summary.workoutsLast7}` },
          { label: "Salah / 7d", value: `${summary.prayersLast7}/35` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-linen bg-shell p-5">
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              {s.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <WeightTrend points={trend} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressLogger today={today} />

        <section className="rounded-lg border border-linen bg-shell">
          <h2 className="border-b border-linen px-5 py-4 font-display text-lg font-semibold text-ink">
            History
          </h2>

          {logs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-soft">
              Nothing logged yet. One entry a day is enough — the streak is the point.
            </p>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-linen overflow-y-auto">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[0.8rem] font-semibold text-ink">
                      {new Date(`${log.loggedOn}T00:00:00`).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="mt-0.5 text-[0.72rem] text-ink-muted">
                      {[
                        log.weightKg != null ? `${log.weightKg}kg` : null,
                        log.waistCm != null ? `${log.waistCm}cm waist` : null,
                        log.workouts > 0
                          ? `${log.workouts} workout${log.workouts > 1 ? "s" : ""}`
                          : null,
                        `${log.prayersOnTime}/5 salah`,
                        log.fasted ? "fasted" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {log.notes && (
                      <p className="mt-1 text-[0.76rem] italic text-ink-soft">{log.notes}</p>
                    )}
                  </div>

                  <form action={deleteProgressAction.bind(null, log.id)}>
                    <button
                      type="submit"
                      aria-label={`Delete entry for ${log.loggedOn}`}
                      className="cursor-pointer text-ink-muted transition-colors hover:text-red-700"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                      </svg>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
