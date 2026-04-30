"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useStore, metricValue } from "@/lib/store";
import { eur, formatMetricValue, formatThreshold, metricLabel } from "@/lib/format";
import type { Upgrade } from "@/lib/types";

const CATEGORY_LABEL: Record<Upgrade["category"], string> = {
  self: "Body & mind",
  car: "Wheels",
  home: "Home",
  team: "Team",
  freedom: "Freedom",
  other: "Other",
};

const CATEGORY_ORDER: Upgrade["category"][] = ["self", "freedom", "home", "car", "team", "other"];

export function Empire() {
  const { state, bumpGoalSavings } = useStore();
  const { upgrades } = state;

  const grouped = upgrades.reduce<Record<string, Upgrade[]>>((acc, u) => {
    (acc[u.category] ??= []).push(u);
    return acc;
  }, {});
  const orderedCats = CATEGORY_ORDER.filter((c) => grouped[c]?.length);

  return (
    <div className="space-y-8 pb-32">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Empire</h2>
        <p className="mt-1 text-sm text-white/50">Body first. Then empire. Real progress, not vibes.</p>
      </header>

      {orderedCats.map((cat) => (
        <section key={cat}>
          <h3 className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">{CATEGORY_LABEL[cat]}</h3>
          <div className="space-y-3">
            {grouped[cat]
              .slice()
              .sort((a, b) => a.threshold - b.threshold)
              .map((u) => {
                const value = metricValue(state, u);
                const pct = Math.min(100, (value / u.threshold) * 100);
                const unlocked = !!u.unlockedAt;
                const isCash = u.metric === "cash";
                return (
                  <motion.div
                    key={u.id}
                    layout
                    className={`relative overflow-hidden rounded-2xl border ${
                      unlocked ? "border-amber-300/40 bg-amber-300/5" : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    {u.image && (
                      <div className="relative h-40 w-full overflow-hidden bg-black">
                        <Image
                          src={u.image}
                          alt={u.name}
                          fill
                          sizes="(max-width: 480px) 100vw, 480px"
                          className={`object-cover transition-all duration-700 ${
                            unlocked ? "" : "grayscale opacity-40"
                          }`}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        {!unlocked && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/60 backdrop-blur">
                              Locked
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex items-start gap-4 p-5 ${u.image ? "pt-4" : ""}`}>
                      {!u.image && (
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl ${
                            unlocked ? "bg-amber-300/15 text-amber-300" : "bg-white/5 text-white/30"
                          }`}
                        >
                          {u.icon}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-medium ${unlocked ? "text-white" : "text-white/80"}`}>{u.name}</h4>
                          <span className={`text-[10px] uppercase tracking-[0.2em] ${unlocked ? "text-amber-300" : "text-white/40"}`}>
                            {unlocked ? "Unlocked" : "Locked"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/50">{u.description}</p>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            className={`h-full ${unlocked ? "bg-amber-300" : "bg-white/30"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: "spring", stiffness: 60, damping: 20 }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-[11px] text-white/50">
                          <span>
                            {formatMetricValue(value, u.metric)} / {formatThreshold(u.threshold, u.metric)}
                          </span>
                          <span>{metricLabel(u.metric)}</span>
                        </div>
                        {isCash && !unlocked && (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
                              Allocate
                            </span>
                            {[100, 500, 1000].map((d) => (
                              <button
                                key={d}
                                onClick={() => bumpGoalSavings(u.id, d)}
                                className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/70 hover:bg-white/[0.06] active:bg-white/10"
                              >
                                +{eur(d)}
                              </button>
                            ))}
                            {value > 0 && (
                              <button
                                onClick={() => bumpGoalSavings(u.id, -100)}
                                className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/40 hover:text-white/70"
                              >
                                −{eur(100)}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
