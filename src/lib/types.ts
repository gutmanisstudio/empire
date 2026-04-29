// Core domain types for the Empire life-sim tracker.
// All state is single-user and persists in localStorage.

export type UpgradeMetric = "mrr" | "cash" | "totalRevenue";

export interface Upgrade {
  id: string;
  name: string;
  category: "car" | "home" | "team" | "freedom" | "other";
  icon: string; // typographic glyph fallback
  image?: string; // optional /public path, e.g. /images/m340i.png
  description: string;
  metric: UpgradeMetric;
  threshold: number; // €
  unlockedAt?: string; // ISO date string when crossed
}

export type Channel = "whatsapp" | "instagram" | "email" | "cold_call" | "referral" | "other";
export type Niche = "restaurants" | "salons" | "furniture" | "florists" | "fitness" | "other";
export type DealStage = "dm_sent" | "replied" | "demo_sent" | "call_booked" | "closed_won" | "closed_lost";

export interface OutreachEntry {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  channel: Channel;
  niche: Niche;
  business: string; // free-text business name
  template?: string; // pitch template id/name
  replied: boolean;
  repliedAt?: string;
  stage: DealStage;
  dealValue?: number; // € if closed_won
  closedAt?: string;
  notes?: string;
}

export interface RoutineLog {
  // Per-day record. key = ISO date (YYYY-MM-DD).
  date: string;
  meals: number; // 0-3
  trained: boolean;
  sleepHours?: number;
  woke?: string; // HH:MM
  sleptAt?: string; // HH:MM previous night
  notes?: string;
}

export interface UserState {
  bankBalance: number; // current cash €
  mrr: number; // recurring revenue €/mo
  totalRevenue: number; // all-time € collected
  upgrades: Upgrade[];
  outreach: OutreachEntry[];
  routine: Record<string, RoutineLog>; // keyed by date
  goals: Goal[];
  monthlyBurn?: number; // for runway calc
}

export interface Goal {
  id: string;
  label: string;
  metric: UpgradeMetric;
  target: number;
  horizonDays?: number;
  createdAt: string;
}
