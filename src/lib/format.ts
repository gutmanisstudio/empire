import type { UpgradeMetric } from "./types";

export function eur(n: number): string {
  if (!Number.isFinite(n)) return "€0";
  const abs = Math.abs(n);
  if (abs >= 10000) return `€${(n / 1000).toFixed(abs >= 100000 ? 0 : 1)}k`;
  return `€${Math.round(n).toLocaleString("en-US")}`;
}

export function pct(num: number, denom: number): string {
  if (!denom) return "—";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

const STREAK_METRICS: UpgradeMetric[] = ["mealsStreak", "sleepStreak", "trainingLast7"];

export function isStreakMetric(m: UpgradeMetric): boolean {
  return STREAK_METRICS.includes(m);
}

export function formatMetricValue(value: number, metric: UpgradeMetric): string {
  if (isStreakMetric(metric)) {
    if (metric === "trainingLast7") return `${value}/7`;
    return `${value}d`;
  }
  return eur(value);
}

export function formatThreshold(threshold: number, metric: UpgradeMetric): string {
  if (isStreakMetric(metric)) {
    if (metric === "trainingLast7") return `${threshold} of 7`;
    return `${threshold} days`;
  }
  return eur(threshold);
}

export function metricLabel(metric: UpgradeMetric): string {
  switch (metric) {
    case "mrr": return "MRR";
    case "cash": return "Cash";
    case "totalRevenue": return "Total revenue";
    case "mealsStreak": return "Eating streak";
    case "sleepStreak": return "Sleep streak";
    case "trainingLast7": return "Training/week";
  }
}
