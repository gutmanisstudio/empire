"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useStore, todayKey } from "@/lib/store";
import { eur } from "@/lib/format";
import type { Upgrade } from "@/lib/types";

function nextUpgrade(upgrades: Upgrade[], mrr: number, cash: number, totalRev: number): Upgrade | undefined {
  const locked = upgrades.filter((u) => !u.unlockedAt);
  return locked
    .map((u) => {
      const v = u.metric === "mrr" ? mrr : u.metric === "cash" ? cash : totalRev;
      return { u, ratio: v / u.threshold };
    })
    .sort((a, b) => b.ratio - a.ratio)[0]?.u;
}

export function Dashboard() {
  const { state, setMoney, setRoutine } = useStore();
  const today = state.routine[todayKey()] ?? { date: todayKey(), meals: 0, trained: false };
  const next = nextUpgrade(state.upgrades, state.mrr, state.bankBalance, state.totalRevenue);
  const nextValue = next ? (next.metric === "mrr" ? state.mrr : next.metric === "cash" ? state.bankBalance : state.totalRevenue) : 0;
  const nextProgress = next ? Math.min(100, (nextValue / next.threshold) * 100) : 0;

  // outreach today
  const today6Iso = new Date(); today6Iso.setHours(0, 0, 0, 0);
  const todayCount = state.outreach.filter((e) => e.date === todayKey()).length;
  const todayReplies = state.outreach.filter((e) => e.date === todayKey() && e.replied).length;

  // runway
  const runway = state.monthlyBurn && state.monthlyBurn > 0 ? state.bankBalance / state.monthlyBurn : null;

  return (
    <div className="space-y-6 pb-32">
      {/* Money headline */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard
          label="Bank"
          value={eur(state.bankBalance)}
          editable
          onChange={(n) => setMoney({ bankBalance: n })}
          raw={state.bankBalance}
        />
        <StatCard
          label="MRR"
          value={eur(state.mrr)}
          editable
          onChange={(n) => setMoney({ mrr: n })}
          raw={state.mrr}
          highlight
        />
        <StatCard
          label="All-time revenue"
          value={eur(state.totalRevenue)}
          editable
          onChange={(n) => setMoney({ totalRevenue: n })}
          raw={state.totalRevenue}
        />
        <StatCard
          label={runway === null ? "Burn (set)" : "Runway"}
          value={runway === null ? eur(state.monthlyBurn ?? 0) : `${runway.toFixed(1)}mo`}
          editable={runway === null}
          onChange={(n) => setMoney({ monthlyBurn: n })}
          raw={state.monthlyBurn ?? 0}
          subtitle={runway === null ? "monthly" : `at ${eur(state.monthlyBurn ?? 0)}/mo`}
        />
      </section>

      {/* Next upgrade */}
      {next && (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-white/5 to-transparent">
          {next.image && (
            <div className="relative h-44 w-full overflow-hidden bg-black">
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
                {!next.image && <span className="text-3xl text-amber-300">{next.icon}</span>}
                <h3 className="text-lg font-medium">{next.name}</h3>
              </div>
              {next.image && (
                <span className="text-xs text-white/50">{nextProgress.toFixed(0)}%</span>
              )}
            </div>
            <p className="mt-1 text-sm text-white/60">{next.description}</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-200"
                initial={{ width: 0 }}
                animate={{ width: `${nextProgress}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 18 }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/50">
              <span>{eur(nextValue)} / {eur(next.threshold)}</span>
              <span>{next.metric === "mrr" ? "MRR" : next.metric === "cash" ? "Cash" : "Total revenue"}</span>
            </div>
          </div>
        </section>
      )}

      {/* Routine */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
          <span>Today</span>
          <span>{todayKey()}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <RoutineCell
            label="Meals"
            value={`${today.meals}/3`}
            active={today.meals >= 3}
            onClick={() => setRoutine(todayKey(), { meals: (today.meals + 1) % 4 })}
          />
          <RoutineCell
            label="Trained"
            value={today.trained ? "✓" : "—"}
            active={today.trained}
            onClick={() => setRoutine(todayKey(), { trained: !today.trained })}
          />
          <RoutineCell
            label="Sleep"
            value={today.sleepHours ? `${today.sleepHours}h` : "—"}
            active={!!today.sleepHours && today.sleepHours >= 7}
            onClick={() => {
              const cur = today.sleepHours ?? 0;
              const next = cur >= 10 ? 0 : cur + 1;
              setRoutine(todayKey(), { sleepHours: next });
            }}
          />
        </div>
        <p className="mt-3 text-xs text-white/40">Tap to cycle. Meals 0→3, sleep 0→10h.</p>
      </section>

      {/* Today's outreach quick-stat */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
          <span>Today's outreach</span>
          <span>{todayCount} sent</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-2xl">{todayCount}</div>
            <div className="text-xs text-white/50">DMs sent</div>
          </div>
          <div>
            <div className="text-2xl">{todayReplies}</div>
            <div className="text-xs text-white/50">Replies</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/40">Log new from the Funnel tab.</p>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  editable,
  onChange,
  raw,
  highlight,
}: {
  label: string;
  value: string;
  subtitle?: string;
  editable?: boolean;
  onChange?: (n: number) => void;
  raw?: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-amber-300/30 bg-amber-300/5" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">{label}</div>
      {editable && onChange ? (
        <input
          type="number"
          inputMode="decimal"
          value={raw ?? 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="mt-1 w-full bg-transparent text-2xl font-medium tracking-tight outline-none"
        />
      ) : (
        <div className="mt-1 text-2xl font-medium tracking-tight">{value}</div>
      )}
      {!editable && <div className="text-xs text-white/40">{subtitle ?? ""}</div>}
      {editable && <div className="text-xs text-white/40">{subtitle ?? value}</div>}
    </div>
  );
}

function RoutineCell({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-colors ${
        active ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.02] text-white/80"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">{label}</div>
      <div className="mt-1 text-xl font-medium">{value}</div>
    </button>
  );
}
