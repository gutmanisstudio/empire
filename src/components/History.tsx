"use client";

import { useStore } from "@/lib/store";
import type { RoutineLog } from "@/lib/types";

// Render every routine entry, newest first. One row per day with a compact
// summary of the routine ticks + pipeline counters.
export function History() {
  const { state } = useStore();
  const days = Object.values(state.routine).sort((a, b) => (a.date < b.date ? 1 : -1));

  if (!days.length) {
    return (
      <div className="space-y-3 pb-32">
        <h2 className="text-2xl font-semibold tracking-tight">History</h2>
        <p className="text-sm text-white/50">No days logged yet. Tick something on Home to start the record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">History</h2>
        <p className="mt-1 text-sm text-white/50">{days.length} days logged · newest first</p>
      </header>

      <ul className="space-y-2">
        {days.map((d) => (
          <DayRow key={d.date} day={d} />
        ))}
      </ul>
    </div>
  );
}

function mealsCount(d: RoutineLog): number {
  const explicit = (d.breakfast ? 1 : 0) + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0);
  if (explicit > 0) return explicit;
  // Legacy entries stored a single meals count.
  return Math.min(3, Math.max(0, d.meals ?? 0));
}

function DayRow({ day }: { day: RoutineLog }) {
  const meals = mealsCount(day);
  const slept = (day.sleepHours ?? 0) >= 7;
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium tabular-nums">{day.date}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          {day.sleepHours !== undefined ? `${day.sleepHours}h sleep` : "—"}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        <Tag label={`${meals}/3 meals`} on={meals === 3} accent="emerald" />
        <Tag label={slept ? "slept 7+" : "slept <7"} on={slept} accent="indigo" />
        <Tag label="trained" on={!!day.trained} accent="amber" />
        <Tag label="worked" on={!!day.worked} accent="sky" />
        <Tag label="time off" on={!!day.timeOff} accent="violet" />
        <Tag label={`${day.water ?? 0}/8 water`} on={(day.water ?? 0) >= 8} accent="sky" />
      </div>
      {(day.dmsSent || day.proposalsSent || day.demosDone || day.callsBooked) ? (
        <div className="mt-2 flex flex-wrap gap-3 border-t border-white/5 pt-2 text-[11px] text-white/60">
          {day.dmsSent ? <span><span className="text-sky-300">{day.dmsSent}</span> dms</span> : null}
          {day.proposalsSent ? <span><span className="text-emerald-300">{day.proposalsSent}</span> prop</span> : null}
          {day.demosDone ? <span><span className="text-amber-300">{day.demosDone}</span> demos</span> : null}
          {day.callsBooked ? <span><span className="text-violet-300">{day.callsBooked}</span> calls</span> : null}
        </div>
      ) : null}
    </li>
  );
}

function Tag({
  label,
  on,
  accent,
}: {
  label: string;
  on: boolean;
  accent: "emerald" | "indigo" | "amber" | "sky" | "violet";
}) {
  const onCls =
    accent === "emerald"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
      : accent === "indigo"
        ? "border-indigo-400/40 bg-indigo-400/10 text-indigo-200"
        : accent === "amber"
          ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
          : accent === "sky"
            ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
            : "border-violet-400/40 bg-violet-400/10 text-violet-200";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 ${
        on ? onCls : "border-white/10 bg-white/[0.02] text-white/30"
      }`}
    >
      {label}
    </span>
  );
}
