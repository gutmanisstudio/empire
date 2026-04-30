import type { UserState, Upgrade, Bill, VariableCost } from "./types";

// Monthly non-negotiables. Sorted by due day so the list reads chronologically.
export const DEFAULT_BILLS: Bill[] = [
  { id: "bite", name: "Bite (mobile)", amount: 68, dueDay: 15, category: "telecom" },
  { id: "lmt", name: "LMT (mobile)", amount: 110, dueDay: 15, category: "telecom" },
  { id: "car-payment", name: "Car payment", amount: 220, dueDay: 15, category: "transport" },
  { id: "car-insurance", name: "Car insurance", amount: 23, dueDay: 15, category: "transport" },
  { id: "pc-payment", name: "PC payment", amount: 60, dueDay: 20, category: "loan" },
  { id: "netlify", name: "Netlify", amount: 9, dueDay: 20, category: "subscription" },
  { id: "claude", name: "Claude", amount: 110, dueDay: 23, category: "subscription" },
  { id: "canva", name: "Canva", amount: 13, dueDay: 24, category: "subscription" },
  { id: "spotify", name: "Spotify", amount: 17, dueDay: 28, category: "subscription" },
  { id: "capcut", name: "CapCut", amount: 30, dueDay: 1, category: "subscription" },
];

// Variable costs — informational, family helps cover when needed.
export const DEFAULT_VARIABLE_COSTS: VariableCost[] = [
  { id: "fuel", name: "Car fuel", estimate: 200 },
  { id: "food", name: "Food", estimate: 0 },
  { id: "utilities", name: "Utilities", estimate: 100 },
];

export const DEFAULT_UPGRADES: Upgrade[] = [
  // --- Self / body first. These come before any money goal on purpose. ---
  {
    id: "self-meals-3",
    name: "First 3 days fed",
    category: "self",
    icon: "✺",
    description: "Three days in a row eating three meals. Body remembers.",
    metric: "mealsStreak",
    threshold: 3,
  },
  {
    id: "self-meals-7",
    name: "Eating rhythm",
    category: "self",
    icon: "✺",
    description: "A full week of three meals every day.",
    metric: "mealsStreak",
    threshold: 7,
  },
  {
    id: "self-meals-30",
    name: "Eating reliable",
    category: "self",
    icon: "✺",
    description: "30 days. Eating is no longer something you forget.",
    metric: "mealsStreak",
    threshold: 30,
  },
  {
    id: "self-sleep-7",
    name: "Sleep stable",
    category: "self",
    icon: "◐",
    description: "Seven consecutive nights of 7+ hours.",
    metric: "sleepStreak",
    threshold: 7,
  },
  {
    id: "self-sleep-30",
    name: "Sleep mastered",
    category: "self",
    icon: "◐",
    description: "30 nights of real sleep. Mood follows the body.",
    metric: "sleepStreak",
    threshold: 30,
  },
  {
    id: "self-train-week",
    name: "Weekly training",
    category: "self",
    icon: "▲",
    description: "Four training sessions in any 7-day window.",
    metric: "trainingLast7",
    threshold: 4,
  },
  // --- Money / empire upgrades. Ordered by your real priority list. ---
  // 1) Apartment first — split into deposit + monthly so both unlock visibly.
  {
    id: "home-apt-deposit",
    name: "Apartment: deposit ready",
    category: "home",
    icon: "◆",
    description: "€2k saved for the deposit on a €700/mo place.",
    metric: "cash",
    threshold: 2000,
  },
  {
    id: "home-apt-monthly",
    name: "Apartment: rent covered",
    category: "home",
    icon: "◆",
    description: "MRR covers €700 rent + €150 utilities + a buffer.",
    metric: "mrr",
    threshold: 1000,
  },
  // 2) Wife's surgery — €3.5k cash. Promise made, promise kept.
  {
    id: "freedom-wife-surgery",
    name: "Wife's surgery fund",
    category: "freedom",
    icon: "✦",
    description: "€3.5k cash set aside. Promised, then delivered.",
    metric: "cash",
    threshold: 3500,
  },
  // Veneers — for the wife and for you. Smile flex unlocks.
  {
    id: "freedom-wife-veneers",
    name: "Wife's veneers",
    category: "freedom",
    icon: "✦",
    description: "€5k cash. Full set of veneers for the wife.",
    metric: "cash",
    threshold: 5000,
  },
  {
    id: "freedom-self-veneers",
    name: "My veneers",
    category: "freedom",
    icon: "✦",
    description: "€5k cash. Full set for you. Smile like you mean it.",
    metric: "cash",
    threshold: 5000,
  },
  // Safety net before bigger flexes.
  {
    id: "freedom-runway",
    name: "6-month runway",
    category: "freedom",
    icon: "▲",
    description: "Six months of survival saved. Real safety net.",
    metric: "cash",
    threshold: 6000,
  },
  // 3) M340i — split into financing entry point and the full flex.
  {
    id: "car-340i-deposit",
    name: "M340i: down payment",
    category: "car",
    icon: "◢",
    image: "/images/m340i.png",
    description: "€10k saved. Financing path to the M340i is open.",
    metric: "cash",
    threshold: 10000,
  },
  {
    id: "car-340i-outright",
    name: "M340i: bought outright",
    category: "car",
    icon: "◢",
    image: "/images/m340i.png",
    description: "€40k. The car is yours. No bank, no installments.",
    metric: "cash",
    threshold: 40000,
  },
  // 4) Office — somewhere down the line.
  {
    id: "team-office",
    name: "Office space",
    category: "team",
    icon: "◫",
    description: "Real space, real team, real momentum.",
    metric: "mrr",
    threshold: 5000,
  },
  // Long-tail aspirational.
  {
    id: "home-mortgage",
    name: "Mortgage approval",
    category: "home",
    icon: "◇",
    description: "First property buy. Real asset, not rent.",
    metric: "mrr",
    threshold: 5000,
  },
  {
    id: "team-first-hire",
    name: "First employee",
    category: "team",
    icon: "◈",
    description: "Hand off the busywork. Empire scales beyond you.",
    metric: "mrr",
    threshold: 10000,
  },
];

export const INITIAL_STATE: UserState = {
  bankBalance: 0,
  mrr: 0,
  totalRevenue: 0,
  upgrades: DEFAULT_UPGRADES,
  outreach: [],
  routine: {},
  goals: [],
  monthlyBurn: 0,
  bills: DEFAULT_BILLS,
  variableCosts: DEFAULT_VARIABLE_COSTS,
};

export const STORAGE_KEY = "empire.v1";
