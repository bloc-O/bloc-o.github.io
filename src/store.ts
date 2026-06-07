import { AppState, Charge, Payment, Resident } from "./types";

const STORAGE_KEY = "immeuble_gestion_state_v1";

export const defaultCharges: Charge[] = [
  {
    id: "c1",
    name: "Responsable du bâtiment",
    amount: 8000,
    frequency: "monthly",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c2",
    name: "Femme de ménage",
    amount: 20000,
    frequency: "monthly",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c3",
    name: "Agent de nettoyage",
    amount: 18000,
    frequency: "monthly",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c4",
    name: "Entretien d'ascenseur (2 ascenseurs / 45 jours)",
    amount: 14000,
    frequency: "monthly",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c5",
    name: "Factures d'électricité",
    amount: 6900,
    frequency: "monthly",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c6",
    name: "Détergent",
    amount: 2000,
    frequency: "monthly",
    createdAt: new Date().toISOString(),
  },
];

export function generateResidents(): Resident[] {
  const names = [
    "Benali Mohamed", "Khelifi Fatima", "Boudjenane Karim", "Amari Samira",
    "Bouazza Ahmed", "Cherif Leila", "Derradji Yacine", "Fellah Nadia",
    "Gherbi Rachid", "Haddad Souad", "Ibrahim Khaled", "Jaziri Mounia",
    "Kaci Abdelkader", "Lakhdar Amina", "Mansouri Djamel", "Nacer Chafia",
    "Othmani Hakim", "Pacha Malika", "Quamar Reda", "Rahal Yamina",
    "Saadi Mourad", "Tahar Saliha", "Uthman Bilal", "Vidal Salim",
    "Wahid Farid", "Xhaferi Nora", "Yahia Omar", "Ziane Ines",
    "Abbas Tarek", "Bacha Djamila", "Charef Anes", "Debbih Loubna",
    "Essaidi Mehdi", "Farid Sabrina", "Guechi Sofiane", "Hamida Dalila","Walid Helis","l3ayech Hamza"
  ];
  return names.slice(0, 38).map((name, i) => ({
    id: `r${i + 1}`,
    apartmentNumber: i + 1,
    name,
    phone: `0${Math.floor(5 + Math.random() * 5)} ${String(
      Math.floor(10000000 + Math.random() * 89999999)
    )}`,
    createdAt: new Date().toISOString(),
  }));
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      return {
        residents: parsed.residents ?? generateResidents(),
        charges: parsed.charges ?? defaultCharges,
        payments: parsed.payments ?? [],
        expenses: parsed.expenses ?? [],
        monthlyFee: parsed.monthlyFee ?? 2000,
        totalApartments: parsed.totalApartments ?? 46,
      };
    }
  } catch (e) {
    console.error(e);
  }
  return {
    residents: generateResidents(),
    charges: defaultCharges,
    payments: [],
    expenses: [],
    monthlyFee: 2000,
    totalApartments: 46,
  };
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function formatDA(n: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + " DA";
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function lastMonths(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out.reverse();
}

export function totalChargesMonthly(charges: Charge[]): number {
  return charges.reduce((sum, c) => {
    let monthly = c.amount;
    if (c.frequency === "bimonthly") monthly = c.amount / 2;
    else if (c.frequency === "quarterly") monthly = c.amount / 3;
    else if (c.frequency === "yearly") monthly = c.amount / 12;
    else if (c.frequency === "onetime") monthly = 0;
    return sum + monthly;
  }, 0);
}

export function getPaymentsForMonth(payments: Payment[], month: string) {
  return payments.filter((p) => p.month === month);
}
