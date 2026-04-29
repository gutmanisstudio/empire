"use client";

import { useStore } from "@/lib/store";
import { eur } from "@/lib/format";
import type { DealStage, OutreachEntry } from "@/lib/types";

const STAGES: DealStage[] = ["dm_sent", "replied", "demo_sent", "call_booked", "closed_won", "closed_lost"];

const STAGE_LABEL: Record<DealStage, string> = {
  dm_sent: "DM sent",
  replied: "Replied",
  demo_sent: "Demo sent",
  call_booked: "Call booked",
  closed_won: "Closed won",
  closed_lost: "Closed lost",
};

export function Log() {
  const { state, updateOutreach, deleteOutreach, setMoney } = useStore();
  const entries = state.outreach;

  function advance(e: OutreachEntry, newStage: DealStage) {
    const patch: Partial<OutreachEntry> = { stage: newStage };
    if (!e.replied && (newStage === "replied" || newStage === "demo_sent" || newStage === "call_booked" || newStage === "closed_won")) {
      patch.replied = true;
      patch.repliedAt = new Date().toISOString();
    }
    if (newStage === "closed_won") {
      patch.closedAt = new Date().toISOString();
      const value = Number(prompt("Deal value (€)?", String(e.dealValue ?? 200)) ?? 0);
      if (value > 0) {
        patch.dealValue = value;
        // bump revenue + bank balance optimistically
        setMoney({
          bankBalance: state.bankBalance + value,
          totalRevenue: state.totalRevenue + value,
        });
      }
    }
    updateOutreach(e.id, patch);
  }

  if (!entries.length) {
    return (
      <div className="space-y-3 pb-32">
        <h2 className="text-2xl font-semibold tracking-tight">Log</h2>
        <p className="text-sm text-white/50">No outreach yet. Hit + Log DM on the Funnel tab to start.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Log</h2>
        <p className="mt-1 text-sm text-white/50">{entries.length} entries · tap stage to advance</p>
      </header>

      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{e.business}</span>
                  {e.dealValue ? (
                    <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] text-amber-300">{eur(e.dealValue)}</span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-[11px] text-white/40 capitalize">
                  {e.date} · {e.channel.replace("_", " ")} · {e.niche}{e.template ? ` · ${e.template}` : ""}
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete entry for ${e.business}?`)) deleteOutreach(e.id);
                }}
                className="text-xs text-white/30 hover:text-red-300"
                aria-label="Delete"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {STAGES.map((s) => {
                const active = e.stage === s;
                return (
                  <button
                    key={s}
                    onClick={() => advance(e, s)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                      active
                        ? s === "closed_won"
                          ? "border-amber-300/60 bg-amber-300/15 text-amber-200"
                          : s === "closed_lost"
                            ? "border-red-400/40 bg-red-400/10 text-red-200"
                            : "border-white/30 bg-white/10 text-white"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {STAGE_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
