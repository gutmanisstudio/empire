// Core domain types for the Empire life-sim tracker.
// All state is single-user and persists in localStorage.

export type UpgradeMetric =
  | "mrr"
  | "cash"
  | "totalRevenue"
  | "mealsStreak" // consecutive days with meals === 3
  | "sleepStreak" // consecutive days with sleepHours >= 7
  | "trainingLast7"; // training sessions in last 7 days

export interface Upgrade {
  id: string;
  name: string;
  category: "self" | "car" | "home" | "team" | "freedom" | "other";
  icon: string; // typographic glyph fallback
  image?: string; // optional /public path, e.g. /images/m340i.png
  description: string;
  metric: UpgradeMetric;
  threshold: number; // € for money metrics, days/sessions otherwise
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
  // Daily checklist items — each is an independent tick.
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  trained: boolean;
  worked: boolean; // worked / made progress on agency
  timeOff: boolean; // deliberate rest / time off
  water: number; // glasses, 0-8
  sleepHours?: number;
  woke?: string; // HH:MM
  sleptAt?: string; // HH:MM previous night
  notes?: string;
  // Daily pipeline counters — quick +/− on the Today screen.
  dmsSent?: number;
  proposalsSent?: number;
  demosDone?: number;
  callsBooked?: number;
  /** @deprecated legacy 0-3 count; kept so old logs still feed streaks */
  meals?: number;
}

export interface UserState {
  bankBalance: number; // current cash €
  mrr: number; // recurring revenue €/mo
  totalRevenue: number; // all-time € collected
  upgrades: Upgrade[];
  outreach: OutreachEntry[];
  routine: Record<string, RoutineLog>; // keyed by date
  goals: Goal[];
  monthlyBurn?: number; // for runway calc — derived from bills + variable costs
  bills?: Bill[]; // recurring monthly non-negotiables
  variableCosts?: VariableCost[]; // fuel, food, utilities — informational
  // Money explicitly earmarked for each cash-metric upgrade (key = upgrade.id).
  // Bank cash alone does NOT count toward goals — only what you allocate here.
  goalSavings?: Record<string, number>;
}

export type BillCategory = "telecom" | "transport" | "subscription" | "loan" | "other";

export interface Bill {
  id: string;
  name: string;
  amount: number; // €
  dueDay: number; // 1-31, day of month
  category: BillCategory;
  // Payment marker per month, key = "YYYY-MM".
  paid?: Record<string, boolean>;
}

export interface VariableCost {
  id: string;
  name: string;
  estimate: number; // typical monthly € spend
}

export interface Goal {
  id: string;
  label: string;
  metric: UpgradeMetric;
  target: number;
  horizonDays?: number;
  createdAt: string;
}
