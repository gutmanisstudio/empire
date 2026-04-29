import type { UserState, Upgrade } from "./types";

export const DEFAULT_UPGRADES: Upgrade[] = [
  {
    id: "car-340i",
    name: "BMW M340i",
    category: "car",
    icon: "◢",
    image: "/images/m340i.png",
    description: "Upgrade from the modded E91 to a real M340i.",
    metric: "mrr",
    threshold: 2000,
  },
  {
    id: "home-700",
    name: "€700/mo apartment",
    category: "home",
    icon: "◆",
    description: "Move into your own place. Stable income covers rent.",
    metric: "mrr",
    threshold: 2000,
  },
  {
    id: "freedom-runway",
    name: "6-month runway",
    category: "freedom",
    icon: "▲",
    description: "Six months of survival saved. Real safety net.",
    metric: "cash",
    threshold: 6000,
  },
  {
    id: "freedom-trip",
    name: "First travel reward",
    category: "freedom",
    icon: "✦",
    description: "Cash to take a real trip without panic.",
    metric: "cash",
    threshold: 3000,
  },
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
  {
    id: "team-office",
    name: "Office space",
    category: "team",
    icon: "◫",
    description: "Real space, real team, real momentum.",
    metric: "mrr",
    threshold: 25000,
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
};

export const STORAGE_KEY = "empire.v1";
