"use client";

import { useState } from "react";
import { useStore, todayKey } from "@/lib/store";
import { eur, pct } from "@/lib/format";
import type { Channel, Niche, OutreachEntry } from "@/lib/types";

const CHANNELS: Channel[] = ["whatsapp", "instagram", "email", "cold_call", "referral", "other"];
const NICHES: Niche[] = ["restaurants", "salons", "furniture", "florists", "fitness", "other"];

export function Funnel() {
  const { state, addOutreach } = useStore();
  const [open, setOpen] = useState(false);
  const [business, setBusiness] = useState("");
  const [channel, setChannel] = useState<Channel>("instagram");
  const [niche, setNiche] = useState<Niche>("restaurants");
  const [template, setTemplate] = useState("");

  const all = state.outreach;
  const sent = all.length;
  const replied = all.filter((e) => e.replied).length;
  const demos = all.filter((e) => ["demo_sent", "call_booked", "closed_won", "closed_lost"].includes(e.stage)).length;
  const calls = all.filter((e) => ["call_booked", "closed_won", "closed_lost"].includes(e.stage)).length;
  const closed = all.filter((e) => e.stage === "closed_won").length;
  const closedValue = all.filter((e) => e.stage === "closed_won").reduce((sum, e) => sum + (e.dealValue ?? 0), 0);

  const byChannel = groupRates(all, (e) => e.channel);
  const byNiche = groupRates(all, (e) => e.niche);

  function submitQuick() {
    if (!business.trim()) return;
    addOutreach({
      date: todayKey(),
      channel,
      niche,
      business: business.trim(),
      template: template.trim() || undefined,
      replied: false,
      stage: "dm_sent",
    });
    setBusiness("");
    setTemplate("");
    setOpen(false);
  }

  return (
    <div className="space-y-6 pb-32">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Funnel</h2>
        <p className="mt-1 text-sm text-white/50">Real conversion data. Tap +Log to add a DM.</p>
      </header>

      {/* Funnel stages */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <Stage label="DMs sent" count={sent} of={sent} />
        <Stage label="Replied" count={replied} of={sent} />
        <Stage label="Demo sent" count={demos} of={replied} />
        <Stage label="Call booked" count={calls} of={demos} />
        <Stage label="Closed won" count={closed} of={calls} accent />
        <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-sm">
          <span className="text-white/60">Total closed €</span>
          <span className="text-amber-300">{eur(closedValue)}</span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-white/40">
          <span>€ per DM</span>
          <span>{sent ? eur(closedValue / sent) : "—"}</span>
        </div>
      </section>

      {/* Breakdown by channel */}
      <BreakdownTable title="By channel" rows={byChannel} />
      <BreakdownTable title="By niche" rows={byNiche} />

      {/* Quick log button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-30 rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-black shadow-xl shadow-amber-300/20"
      >
        + Log DM
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
          <div className="w-full rounded-t-3xl border-t border-white/10 bg-zinc-950 p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <h3 className="mb-4 text-lg font-medium">Log outreach</h3>
            <div className="space-y-3">
              <Field label="Business name">
                <input
                  autoFocus
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  placeholder="e.g. Cafe Riga"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base outline-none focus:border-amber-300/50"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Channel">
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as Channel)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 outline-none"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c} className="bg-zinc-950">{c.replace("_", " ")}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Niche">
                  <select
                    value={niche}
                    onChange={(e) => setNiche(e.target.value as Niche)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 outline-none"
                  >
                    {NICHES.map((n) => (
                      <option key={n} value={n} className="bg-zinc-950">{n}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Pitch template (optional)">
                <input
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="e.g. v3-restaurant"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300/50"
                />
              </Field>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={submitQuick}
                  disabled={!business.trim()}
                  className="flex-1 rounded-lg bg-amber-300 py-3 text-sm font-medium text-black disabled:opacity-40"
                >
                  Log DM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stage({ label, count, of, accent }: { label: string; count: number; of: number; accent?: boolean }) {
  const ratio = of > 0 ? Math.min(100, (count / of) * 100) : 0;
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between">
        <span className={`text-sm ${accent ? "text-amber-300" : "text-white/80"}`}>{label}</span>
        <span className="text-xs text-white/50">
          {count} <span className="text-white/30">· {pct(count, of)}</span>
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full ${accent ? "bg-amber-300" : "bg-white/30"}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-white/50">{label}</span>
      {children}
    </label>
  );
}

interface RateRow {
  key: string;
  sent: number;
  replied: number;
  closed: number;
  revenue: number;
}

function groupRates(entries: OutreachEntry[], keyFn: (e: OutreachEntry) => string): RateRow[] {
  const map = new Map<string, RateRow>();
  for (const e of entries) {
    const k = keyFn(e);
    const row = map.get(k) ?? { key: k, sent: 0, replied: 0, closed: 0, revenue: 0 };
    row.sent += 1;
    if (e.replied) row.replied += 1;
    if (e.stage === "closed_won") {
      row.closed += 1;
      row.revenue += e.dealValue ?? 0;
    }
    map.set(k, row);
  }
  return Array.from(map.values()).sort((a, b) => b.sent - a.sent);
}

function BreakdownTable({ title, rows }: { title: string; rows: RateRow[] }) {
  if (!rows.length) return null;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">{title}</h3>
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-5 text-[10px] uppercase tracking-[0.15em] text-white/30">
          <span className="col-span-2">Group</span>
          <span className="text-right">Sent</span>
          <span className="text-right">Reply%</span>
          <span className="text-right">€</span>
        </div>
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-5 items-center">
            <span className="col-span-2 truncate text-white/80 capitalize">{r.key.replace("_", " ")}</span>
            <span className="text-right text-white/60">{r.sent}</span>
            <span className="text-right text-white/60">{pct(r.replied, r.sent)}</span>
            <span className="text-right text-amber-300/80">{eur(r.revenue)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
