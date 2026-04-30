"use client";

import { useStore } from "@/lib/store";
import { eur } from "@/lib/format";
import type { Bill, BillCategory, VariableCost } from "@/lib/types";

// "YYYY-MM" key for the current month's payment marker.
function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Days remaining (or overdue, negative) until a bill's due day this month.
function daysUntil(dueDay: number, now = new Date()): number {
  const today = now.getDate();
  return dueDay - today;
}

const CATEGORY_LABEL: Record<BillCategory, string> = {
  telecom: "Telecom",
  transport: "Transport",
  subscription: "Subscription",
  loan: "Loan",
  other: "Other",
};

export function Bills() {
  const { state, togglePaidBill } = useStore();
  const bills = (state.bills ?? []).slice().sort((a, b) => a.dueDay - b.dueDay);
  const variable = state.variableCosts ?? [];
  const mk = monthKey();

  const totalFixed = bills.reduce((s, b) => s + b.amount, 0);
  const paidFixed = bills.filter((b) => b.paid?.[mk]).reduce((s, b) => s + b.amount, 0);
  const remainingFixed = totalFixed - paidFixed;
  const totalVariable = variable.reduce((s, v) => s + v.estimate, 0);

  const surplus = state.mrr - totalFixed;
  const coversBills = state.mrr >= totalFixed;

  return (
    <div className="space-y-5 pb-32">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Bills</h2>
        <p className="mt-1 text-sm text-white/50">
          Non-negotiables first. Empire upgrades come from what's left.
        </p>
      </header>

      {/* Headline: monthly fixed + paid/remaining */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
          {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-semibold tabular-nums">{eur(totalFixed)}</div>
            <div className="text-[11px] text-white/50">fixed bills / month</div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-medium tabular-nums ${remainingFixed === 0 ? "text-emerald-300" : "text-amber-300"}`}>
              {eur(remainingFixed)}
            </div>
            <div className="text-[11px] text-white/50">left to pay</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-emerald-400 transition-all"
            style={{ width: `${totalFixed ? (paidFixed / totalFixed) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-white/50">
          <span>
            {bills.filter((b) => b.paid?.[mk]).length}/{bills.length} paid · {eur(paidFixed)} done
          </span>
          <span>{coversBills ? "MRR covers ✓" : `MRR short ${eur(totalFixed - state.mrr)}`}</span>
        </div>
      </section>

      {/* Surplus indicator — what's left for goals */}
      <section
        className={`rounded-2xl border p-4 ${
          coversBills
            ? "border-emerald-400/30 bg-emerald-400/5"
            : "border-amber-300/30 bg-amber-300/5"
        }`}
      >
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">
          {coversBills ? "Surplus → empire" : "Bills not covered yet"}
        </div>
        <div className={`mt-1 text-2xl font-semibold tabular-nums ${coversBills ? "text-emerald-300" : "text-amber-300"}`}>
          {coversBills ? `+${eur(surplus)}/mo` : `${eur(state.mrr)} / ${eur(totalFixed)}`}
        </div>
        <div className="mt-1 text-[11px] text-white/50">
          {coversBills
            ? "MRR above bills. Anything earned over this funds new apt, car, veneers."
            : "Cover your bills first. Then the empire stack unlocks."}
        </div>
      </section>

      {/* Bills list */}
      <section>
        <h3 className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">Due this month</h3>
        <ul className="space-y-2">
          {bills.map((b) => (
            <BillRow key={b.id} bill={b} mk={mk} onToggle={() => togglePaidBill(b.id, mk)} />
          ))}
        </ul>
      </section>

      {/* Variable costs */}
      <section>
        <h3 className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">
          Living costs (variable · {eur(totalVariable)}/mo est.)
        </h3>
        <ul className="space-y-2">
          {variable.map((v) => (
            <VariableRow key={v.id} v={v} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function BillRow({
  bill,
  mk,
  onToggle,
}: {
  bill: Bill;
  mk: string;
  onToggle: () => void;
}) {
  const paid = !!bill.paid?.[mk];
  const left = daysUntil(bill.dueDay);
  const overdue = !paid && left < 0;
  const dueSoon = !paid && left >= 0 && left <= 3;
  const dueLabel = paid
    ? "Paid"
    : left === 0
      ? "Due today"
      : left > 0
        ? `Due in ${left}d`
        : `Overdue ${-left}d`;
  return (
    <li>
      <button
        onClick={onToggle}
        aria-pressed={paid}
        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
          paid
            ? "border-emerald-400/30 bg-emerald-400/5"
            : overdue
              ? "border-red-400/40 bg-red-400/5"
              : dueSoon
                ? "border-amber-300/30 bg-amber-300/5"
                : "border-white/10 bg-white/[0.02]"
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${
            paid
              ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
              : "border-white/15 bg-white/[0.02]"
          }`}
        >
          {paid && (
            <svg viewBox="0 0 12 12" className="h-4 w-4" aria-hidden>
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
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-sm font-medium ${paid ? "text-white/60 line-through decoration-white/30" : "text-white"}`}>
              {bill.name}
            </span>
            <span className={`text-sm font-semibold tabular-nums ${paid ? "text-white/40" : "text-white/90"}`}>
              {eur(bill.amount)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[11px] text-white/40">
            <span>
              {CATEGORY_LABEL[bill.category]} · day {bill.dueDay}
            </span>
            <span
              className={
                paid
                  ? "text-emerald-300"
                  : overdue
                    ? "text-red-300"
                    : dueSoon
                      ? "text-amber-300"
                      : ""
              }
            >
              {dueLabel}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

function VariableRow({ v }: { v: VariableCost }) {
  return (
    <li className="flex items-baseline justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div>
        <div className="text-sm font-medium">{v.name}</div>
        <div className="text-[11px] text-white/40">monthly estimate</div>
      </div>
      <div className="text-sm font-semibold tabular-nums text-white/80">{eur(v.estimate)}</div>
    </li>
  );
}
