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
