"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { eur } from "@/lib/format";
import type { Upgrade } from "@/lib/types";

function progressFor(u: Upgrade, mrr: number, cash: number, totalRev: number) {
  const v = u.metric === "mrr" ? mrr : u.metric === "cash" ? cash : totalRev;
  return { value: v, pct: Math.min(100, (v / u.threshold) * 100) };
}

const CATEGORY_LABEL: Record<Upgrade["category"], string> = {
  car: "Wheels",
  home: "Home",
  team: "Team",
  freedom: "Freedom",
  other: "Other",
};

export function Empire() {
  const { state } = useStore();
  const { mrr, bankBalance, totalRevenue, upgrades } = state;

  const grouped = upgrades.reduce<Record<string, Upgrade[]>>((acc, u) => {
    (acc[u.category] ??= []).push(u);
    return acc;
  }, {});

  return (
    <div className="space-y-8 pb-32">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Empire</h2>
        <p className="mt-1 text-sm text-white/50">Real upgrades unlock when real numbers cross thresholds.</p>
      </header>

      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat}>
          <h3 className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">{CATEGORY_LABEL[cat as Upgrade["category"]]}</h3>
          <div className="space-y-3">
            {items
              .slice()
              .sort((a, b) => a.threshold - b.threshold)
              .map((u) => {
                const { value, pct } = progressFor(u, mrr, bankBalance, totalRevenue);
                const unlocked = !!u.unlockedAt;
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
                          <span>{eur(value)} / {eur(u.threshold)}</span>
                          <span>{u.metric === "mrr" ? "MRR" : u.metric === "cash" ? "Cash" : "Total"}</span>
                        </div>
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
