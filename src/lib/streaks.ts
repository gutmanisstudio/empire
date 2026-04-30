import type { RoutineLog } from "./types";

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Walks back day-by-day from today, counting consecutive days where the predicate holds.
// A missing log breaks the streak.
export function consecutiveStreak(
  routine: Record<string, RoutineLog>,
  predicate: (r: RoutineLog) => boolean,
  maxDays = 365,
): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < maxDays; i++) {
    const log = routine[dateKey(d)];
    if (log && predicate(log)) streak++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Counts how many of the last `days` days satisfy the predicate (gaps OK).
export function countLastDays(
  routine: Record<string, RoutineLog>,
  predicate: (r: RoutineLog) => boolean,
  days = 7,
): number {
  let count = 0;
  const d = new Date();
  for (let i = 0; i < days; i++) {
    const log = routine[dateKey(d)];
    if (log && predicate(log)) count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export const streakPredicates = {
  // Either all three meal checkboxes ticked today, or legacy meals count >= 3.
  meals3: (r: RoutineLog) =>
    (!!r.breakfast && !!r.lunch && !!r.dinner) || (r.meals ?? 0) >= 3,
  sleep7: (r: RoutineLog) => (r.sleepHours ?? 0) >= 7,
  trained: (r: RoutineLog) => r.trained,
};

export interface DerivedStats {
  mealsStreak: number;
  sleepStreak: number;
  trainingLast7: number;
}

export function deriveStats(routine: Record<string, RoutineLog>): DerivedStats {
  return {
    mealsStreak: consecutiveStreak(routine, streakPredicates.meals3),
    sleepStreak: consecutiveStreak(routine, streakPredicates.sleep7),
    trainingLast7: countLastDays(routine, streakPredicates.trained, 7),
  };
}

// Sums a numeric counter field across the last `days` calendar days (today incl).
export function sumLastDays(
  routine: Record<string, RoutineLog>,
  field: "dmsSent" | "proposalsSent" | "demosDone" | "callsBooked",
  days = 7,
): number {
  let total = 0;
  const d = new Date();
  for (let i = 0; i < days; i++) {
    const log = routine[dateKey(d)];
    if (log) total += (log[field] as number | undefined) ?? 0;
    d.setDate(d.getDate() - 1);
  }
  return total;
}
