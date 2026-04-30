"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserState, OutreachEntry, RoutineLog, Upgrade, Bill } from "./types";
import { INITIAL_STATE, STORAGE_KEY, DEFAULT_BILLS, DEFAULT_VARIABLE_COSTS } from "./defaults";
import { deriveStats } from "./streaks";

interface StoreContext {
  state: UserState;
  ready: boolean;
  setState: (updater: (prev: UserState) => UserState) => void;
  // convenience mutators
  addOutreach: (entry: Omit<OutreachEntry, "id">) => void;
  updateOutreach: (id: string, patch: Partial<OutreachEntry>) => void;
  deleteOutreach: (id: string) => void;
  setRoutine: (date: string, patch: Partial<RoutineLog>) => void;
  setMoney: (patch: Partial<Pick<UserState, "bankBalance" | "mrr" | "totalRevenue" | "monthlyBurn">>) => void;
  togglePaidBill: (billId: string, monthKey: string) => void;
  updateBill: (billId: string, patch: Partial<Bill>) => void;
  resetAll: () => void;
}

const Ctx = createContext<StoreContext | null>(null);

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function metricValue(s: UserState, metric: Upgrade["metric"]): number {
  switch (metric) {
    case "mrr":
      return s.mrr;
    case "cash":
      return s.bankBalance;
    case "totalRevenue":
      return s.totalRevenue;
    case "mealsStreak":
      return deriveStats(s.routine).mealsStreak;
    case "sleepStreak":
      return deriveStats(s.routine).sleepStreak;
    case "trainingLast7":
      return deriveStats(s.routine).trainingLast7;
  }
}

function evaluateUnlocks(s: UserState): UserState {
  const now = new Date().toISOString();
  const stats = deriveStats(s.routine);
  const upgrades: Upgrade[] = s.upgrades.map((u) => {
    if (u.unlockedAt) return u;
    let value: number;
    switch (u.metric) {
      case "mrr": value = s.mrr; break;
      case "cash": value = s.bankBalance; break;
      case "totalRevenue": value = s.totalRevenue; break;
      case "mealsStreak": value = stats.mealsStreak; break;
      case "sleepStreak": value = stats.sleepStreak; break;
      case "trainingLast7": value = stats.trainingLast7; break;
    }
    if (value >= u.threshold) return { ...u, unlockedAt: now };
    return u;
  });
  return { ...s, upgrades };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setRaw] = useState<UserState>(INITIAL_STATE);
  const [ready, setReady] = useState(false);

  // load once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserState;
        // Merge defaults onto stored upgrades so newly-added fields
        // (e.g. image, description tweaks) propagate, while preserving unlockedAt.
        const storedById = new Map((parsed.upgrades ?? []).map((u) => [u.id, u] as const));
        const upgrades: Upgrade[] = INITIAL_STATE.upgrades.map((def) => {
          const stored = storedById.get(def.id);
          return stored ? { ...def, unlockedAt: stored.unlockedAt } : def;
        });
        // Keep deprecated upgrades only if they were already unlocked (preserve achievements);
        // drop locked-but-removed ones so renames/restructures clean up automatically.
        const defaultIds = new Set(INITIAL_STATE.upgrades.map((u) => u.id));
        for (const stored of parsed.upgrades ?? []) {
          if (!defaultIds.has(stored.id) && stored.unlockedAt) upgrades.push(stored);
        }
        // Merge bills: defaults provide id/name/amount/dueDay/category;
        // stored entries contribute the paid history. Drop legacy bills that
        // are no longer in defaults to keep the list clean.
        const storedBillsById = new Map((parsed.bills ?? []).map((b) => [b.id, b] as const));
        const bills: Bill[] = DEFAULT_BILLS.map((def) => {
          const stored = storedBillsById.get(def.id);
          return stored ? { ...def, paid: stored.paid } : def;
        });
        const merged: UserState = {
          ...INITIAL_STATE,
          ...parsed,
          upgrades,
          bills,
          variableCosts: parsed.variableCosts ?? DEFAULT_VARIABLE_COSTS,
        };
        // Evaluate unlocks on load so streak milestones already crossed get marked.
        setRaw(evaluateUnlocks(merged));
      }
    } catch {
      // corrupt storage; keep defaults
    }
    setReady(true);
  }, []);

  // persist on every change after ready
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or disabled storage */
    }
  }, [state, ready]);

  const setState = useCallback((updater: (prev: UserState) => UserState) => {
    setRaw((prev) => evaluateUnlocks(updater(prev)));
  }, []);

  const addOutreach = useCallback(
    (entry: Omit<OutreachEntry, "id">) => {
      setState((prev) => ({
        ...prev,
        outreach: [{ ...entry, id: crypto.randomUUID() }, ...prev.outreach],
      }));
    },
    [setState],
  );

  const updateOutreach = useCallback(
    (id: string, patch: Partial<OutreachEntry>) => {
      setState((prev) => ({
        ...prev,
        outreach: prev.outreach.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    [setState],
  );

  const deleteOutreach = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        outreach: prev.outreach.filter((e) => e.id !== id),
      }));
    },
    [setState],
  );

  const setRoutine = useCallback(
    (date: string, patch: Partial<RoutineLog>) => {
      setState((prev) => {
        const existing = prev.routine[date];
        // Use Object.assign to avoid TS duplicate-key warnings while still
        // preserving any legacy fields on pre-checklist entries.
        const base = Object.assign(
          {
            date,
            breakfast: false,
            lunch: false,
            dinner: false,
            trained: false,
            worked: false,
            timeOff: false,
            water: 0,
          },
          existing,
        );
        return {
          ...prev,
          routine: { ...prev.routine, [date]: { ...base, ...patch, date } },
        };
      });
    },
    [setState],
  );

  const setMoney = useCallback(
    (patch: Partial<Pick<UserState, "bankBalance" | "mrr" | "totalRevenue" | "monthlyBurn">>) => {
      setState((prev) => ({ ...prev, ...patch }));
    },
    [setState],
  );

  const togglePaidBill = useCallback(
    (billId: string, monthKey: string) => {
      setState((prev) => ({
        ...prev,
        bills: (prev.bills ?? []).map((b) => {
          if (b.id !== billId) return b;
          const cur = b.paid?.[monthKey] ?? false;
          return { ...b, paid: { ...(b.paid ?? {}), [monthKey]: !cur } };
        }),
      }));
    },
    [setState],
  );

  const updateBill = useCallback(
    (billId: string, patch: Partial<Bill>) => {
      setState((prev) => ({
        ...prev,
        bills: (prev.bills ?? []).map((b) => (b.id === billId ? { ...b, ...patch } : b)),
      }));
    },
    [setState],
  );

  const resetAll = useCallback(() => {
    setRaw(INITIAL_STATE);
  }, []);

  const value = useMemo<StoreContext>(
    () => ({
      state,
      ready,
      setState,
      addOutreach,
      updateOutreach,
      deleteOutreach,
      setRoutine,
      setMoney,
      togglePaidBill,
      updateBill,
      resetAll,
    }),
    [
      state,
      ready,
      setState,
      addOutreach,
      updateOutreach,
      deleteOutreach,
      setRoutine,
      setMoney,
      togglePaidBill,
      updateBill,
      resetAll,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export { todayKey };
