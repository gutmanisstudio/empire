"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useStore, todayKey } from "@/lib/store";
import { metricValue } from "@/lib/store";
import { eur, formatMetricValue, formatThreshold, metricLabel } from "@/lib/format";
import { deriveStats, sumLastDays } from "@/lib/streaks";
import type { Upgrade, RoutineLog, UserState } from "@/lib/types";

function nextUpgrade(state: UserState): Upgrade | undefined {
  const locked = state.upgrades.filter((u) => !u.unlockedAt);
  return locked
    .map((u) => ({ u, ratio: metricValue(state, u.metric) / u.threshold }))
    .sort((a, b) => b.ratio - a.ratio)[0]?.u;
}

function reminderFor(today: RoutineLog | undefined): string | null {
  const now = new Date();
  const h = now.getHours();
  const breakfast = today?.breakfast ?? false;
  const lunch = today?.lunch ?? false;
  const dinner = today?.dinner ?? false;
  const water = today?.water ?? 0;
  const sleep = today?.sleepHours;

  if (h >= 22 && !dinner) return "Dinner before bed. Even something small.";
  if (h >= 18 && !lunch) return "Eat lunch. Even leftovers. Even now.";
  if (h >= 13 && !breakfast) return "Breakfast missed. Toast. Banana. Anything.";
  if (h >= 10 && !breakfast) return "Have you eaten? Real food, not coffee.";
  if (h >= 16 && water < 4) return "Drink some water before you do anything else.";
  if (h >= 8 && sleep === undefined) return "Log last night's sleep. Even a guess.";
  return null;
}

export function Dashboard() {
  const { state, setMoney, setRoutine, setState } = useStore();
  // Functional bump for daily counters — avoids stale-closure issues from
  // rapid taps that would otherwise all read the same `value` prop.
  const bumpCounter = (field: "dmsSent" | "proposalsSent" | "demosDone" | "callsBooked", delta: number) => {
    setState((prev) => {
      const date = todayKey();
      const existing = prev.routine[date];
      const base: RoutineLog = {
        date,
        breakfast: false,
        lunch: false,
        dinner: false,
        trained: false,
        worked: false,
        timeOff: false,
        water: 0,
        ...existing,
      };
      const cur = (base[field] as number | undefined) ?? 0;
      return {
        ...prev,
        routine: { ...prev.routine, [date]: { ...base, [field]: Math.max(0, cur + delta) } },
      };
    });
  };
  const todayLog: RoutineLog =
    state.routine[todayKey()] ?? {
      date: todayKey(),
      breakfast: false,
      lunch: false,
      dinner: false,
      trained: false,
      worked: false,
      timeOff: false,
      water: 0,
    };
  const stats = deriveStats(state.routine);
  const next = nextUpgrade(state);
  const nextValue = next ? metricValue(state, next.metric) : 0;
  const nextProgress = next ? Math.min(100, (nextValue / next.threshold) * 100) : 0;
  const reminder = reminderFor(todayLog);

  const todayCount = state.outreach.filter((e) => e.date === todayKey()).length;
  const todayReplies = state.outreach.filter((e) => e.date === todayKey() && e.replied).length;
  const runway = state.monthlyBurn && state.monthlyBurn > 0 ? state.bankBalance / state.monthlyBurn : null;

  return (
    <div className="space-y-5 pb-32">
      {/* Reminder banner — only when something basic is missing */}
      {reminder && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4 text-sm text-emerald-100"
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300/80">Reminder</div>
          <div className="mt-1">{reminder}</div>
        </motion.div>
      )}

      {/* Today — routine first, big and tappable */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
          <span>Today</span>
          <span>{todayKey()}</span>
        </div>

        {/* Daily checklist — tap each row to tick. */}
        <div className="mt-4 divide-y divide-white/5">
          <CheckRow
            label="Breakfast"
            time="09:00"
            checked={todayLog.breakfast}
            onToggle={() => setRoutine(todayKey(), { breakfast: !todayLog.breakfast })}
            accent="emerald"
          />
          <CheckRow
            label="Work block"
            time="10:00"
            checked={todayLog.worked}
            onToggle={() => setRoutine(todayKey(), { worked: !todayLog.worked })}
            accent="sky"
          />
          <CheckRow
            label="Lunch"
            time="13:00"
            checked={todayLog.lunch}
            onToggle={() => setRoutine(todayKey(), { lunch: !todayLog.lunch })}
            accent="emerald"
          />
          <CheckRow
            label="Train"
            time="17:00"
            checked={todayLog.trained}
            onToggle={() => setRoutine(todayKey(), { trained: !todayLog.trained })}
            accent="amber"
          />
          <CheckRow
            label="Dinner"
            time="19:00"
            checked={todayLog.dinner}
            onToggle={() => setRoutine(todayKey(), { dinner: !todayLog.dinner })}
            accent="emerald"
          />
          <CheckRow
            label="Time off"
            time="21:00"
            checked={todayLog.timeOff}
            onToggle={() => setRoutine(todayKey(), { timeOff: !todayLog.timeOff })}
            accent="violet"
          />
          <CheckRow
            label="Sleep (7+ hrs)"
            time="23:00"
            checked={(todayLog.sleepHours ?? 0) >= 7}
            onToggle={() =>
              setRoutine(todayKey(), {
                sleepHours: (todayLog.sleepHours ?? 0) >= 7 ? 0 : 8,
              })
            }
            accent="indigo"
            right={todayLog.sleepHours !== undefined ? `${todayLog.sleepHours}h` : undefined}
          />
        </div>

        {/* Water still tracks count, not a single tick. */}
        <div className="mt-5">
          <Row label="Water" right={`${todayLog.water ?? 0}/8`}>
            <SegmentBar
              value={todayLog.water ?? 0}
              max={8}
              onChange={(v) => setRoutine(todayKey(), { water: v })}
              activeClass="bg-sky-400/70"
            />
          </Row>
        </div>
      </section>

      {/* Daily pipeline counters — DMs, proposals, demos, calls. */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
          <span>Pipeline today</span>
          <span>tap +/−</span>
        </div>
        {/* Rolling 7-day totals — quick glance at recent output. */}
        <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
          <Last7 label="DMs" value={sumLastDays(state.routine, "dmsSent")} accent="text-sky-300" />
          <Last7 label="Prop" value={sumLastDays(state.routine, "proposalsSent")} accent="text-emerald-300" />
          <Last7 label="Demos" value={sumLastDays(state.routine, "demosDone")} accent="text-amber-300" />
          <Last7 label="Calls" value={sumLastDays(state.routine, "callsBooked")} accent="text-violet-300" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <CounterCard
            label="DMs sent"
            value={todayLog.dmsSent ?? 0}
            onIncrement={() => bumpCounter("dmsSent", 1)}
            onDecrement={() => bumpCounter("dmsSent", -1)}
            accent="sky"
          />
          <CounterCard
            label="Proposals"
            value={todayLog.proposalsSent ?? 0}
            onIncrement={() => bumpCounter("proposalsSent", 1)}
            onDecrement={() => bumpCounter("proposalsSent", -1)}
            accent="emerald"
          />
          <CounterCard
            label="Demos"
            value={todayLog.demosDone ?? 0}
            onIncrement={() => bumpCounter("demosDone", 1)}
            onDecrement={() => bumpCounter("demosDone", -1)}
            accent="amber"
          />
          <CounterCard
            label="Calls booked"
            value={todayLog.callsBooked ?? 0}
            onIncrement={() => bumpCounter("callsBooked", 1)}
            onDecrement={() => bumpCounter("callsBooked", -1)}
            accent="violet"
          />
        </div>
      </section>

      {/* Streaks */}
      <section className="grid grid-cols-3 gap-3">
        <StreakCard label="Eating" value={stats.mealsStreak} unit="days" target={7} accent="emerald" />
        <StreakCard label="Sleep" value={stats.sleepStreak} unit="days" target={7} accent="indigo" />
        <StreakCard label="Training" value={stats.trainingLast7} unit="of 7" target={4} accent="amber" />
      </section>

      {/* Next unlock — auto picks the closest goal (health usually wins early) */}
      {next && (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-white/5 to-transparent">
          {next.image && (
            <div className="relative h-40 w-full overflow-hidden bg-black">
              <Image
                src={next.image}
                alt={next.name}
                fill
                sizes="(max-width: 480px) 100vw, 480px"
                priority
                className="object-cover grayscale opacity-50"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rounded-full border border-amber-300/40 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-amber-300 backdrop-blur">
                  Next unlock
                </span>
              </div>
            </div>
          )}
          <div className="p-5">
            {!next.image && (
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
                <span>Next unlock</span>
                <span>{nextProgress.toFixed(0)}%</span>
              </div>
            )}
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                {!next.image && <span className="text-2xl text-amber-300">{next.icon}</span>}
                <h3 className="text-base font-medium">{next.name}</h3>
              </div>
              {next.image && <span className="text-xs text-white/50">{nextProgress.toFixed(0)}%</span>}
            </div>
            <p className="mt-1 text-xs text-white/60">{next.description}</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-200"
                initial={{ width: 0 }}
                animate={{ width: `${nextProgress}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 18 }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-white/50">
              <span>
                {formatMetricValue(nextValue, next.metric)} / {formatThreshold(next.threshold, next.metric)}
              </span>
              <span>{metricLabel(next.metric)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Compact money strip — bottom, deliberately small */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">Money</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MoneyMini label="Bank" raw={state.bankBalance} onChange={(n) => setMoney({ bankBalance: n })} />
          <MoneyMini label="MRR" raw={state.mrr} onChange={(n) => setMoney({ mrr: n })} />
          <MoneyMini label="All-time" raw={state.totalRevenue} onChange={(n) => setMoney({ totalRevenue: n })} />
          <MoneyMini
            label={runway === null ? "Burn/mo" : "Runway"}
            raw={state.monthlyBurn ?? 0}
            onChange={(n) => setMoney({ monthlyBurn: n })}
            display={runway !== null ? `${runway.toFixed(1)}mo` : undefined}
          />
        </div>
        {todayCount > 0 && (
          <div className="mt-3 border-t border-white/5 pt-3 text-[11px] text-white/50">
            Today's outreach: {todayCount} sent · {todayReplies} replied
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, right, children }: { label: string; right: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/50">
        <span>{label}</span>
        <span className="text-white/70">{right}</span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SegmentBar({
  value,
  max,
  onChange,
  activeClass,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  activeClass: string;
}) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            onClick={() => onChange(filled ? i : i + 1)}
            className={`h-9 flex-1 rounded-md border transition-colors ${
              filled ? `${activeClass} border-transparent` : "border-white/10 bg-white/[0.03]"
            }`}
            aria-label={`set to ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

function CheckRow({
  label,
  time,
  checked,
  onToggle,
  accent,
  right,
}: {
  label: string;
  time?: string;
  checked: boolean;
  onToggle: () => void;
  accent: "emerald" | "amber" | "sky" | "indigo" | "violet";
  right?: string;
}) {
  const accentBox =
    accent === "emerald"
      ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
      : accent === "amber"
        ? "border-amber-300 bg-amber-300/20 text-amber-300"
        : accent === "sky"
          ? "border-sky-400 bg-sky-400/20 text-sky-300"
          : accent === "indigo"
            ? "border-indigo-400 bg-indigo-400/20 text-indigo-300"
            : "border-violet-400 bg-violet-400/20 text-violet-300";
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 py-3 text-left"
      aria-pressed={checked}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked ? accentBox : "border-white/15 bg-white/[0.02]"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" aria-hidden>
            <path
              d="M2 6.5 L5 9.5 L10 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {time && (
        <span
          className={`w-12 shrink-0 text-[11px] tabular-nums tracking-tight ${
            checked ? "text-white/40" : "text-white/50"
          }`}
        >
          {time}
        </span>
      )}
      <span className={`flex-1 text-sm ${checked ? "text-white" : "text-white/70"}`}>
        {label}
      </span>
      {right && <span className="text-[11px] text-white/40">{right}</span>}
    </button>
  );
}

function Last7({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="py-1">
      <div className={`text-base font-semibold tabular-nums ${accent}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">7d {label}</div>
    </div>
  );
}

function CounterCard({
  label,
  value,
  onIncrement,
  onDecrement,
  accent,
}: {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  accent: "sky" | "emerald" | "amber" | "violet";
}) {
  const accentText =
    accent === "sky"
      ? "text-sky-300"
      : accent === "emerald"
        ? "text-emerald-300"
        : accent === "amber"
          ? "text-amber-300"
          : "text-violet-300";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={onDecrement}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:bg-white/[0.06] active:bg-white/10"
          aria-label={`decrement ${label}`}
        >
          −
        </button>
        <span className={`text-xl font-semibold tabular-nums ${accentText}`}>{value}</span>
        <button
          onClick={onIncrement}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/80 transition-colors hover:bg-white/[0.06] active:bg-white/10"
          aria-label={`increment ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function StreakCard({
  label,
  value,
  unit,
  target,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  target: number;
  accent: "emerald" | "indigo" | "amber";
}) {
  const accentText =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "indigo"
        ? "text-indigo-300"
        : "text-amber-300";
  const accentBar =
    accent === "emerald"
      ? "bg-emerald-400"
      : accent === "indigo"
        ? "bg-indigo-400"
        : "bg-amber-400";
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${accentText}`}>{value}</div>
      <div className="text-[10px] text-white/40">{unit}</div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full ${accentBar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MoneyMini({
  label,
  raw,
  onChange,
  display,
}: {
  label: string;
  raw: number;
  onChange: (n: number) => void;
  display?: string;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      {display ? (
        <div className="mt-0.5 text-base font-medium">{display}</div>
      ) : (
        <input
          type="number"
          inputMode="decimal"
          value={raw}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="mt-0.5 w-full bg-transparent text-base font-medium outline-none"
        />
      )}
      <div className="text-[10px] text-white/30">{display ? `at ${eur(raw)}/mo` : eur(raw)}</div>
    </label>
  );
}
