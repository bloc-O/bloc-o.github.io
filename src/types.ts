export interface Resident {
  id: string;
  apartmentNumber: number;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface Charge {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "bimonthly" | "quarterly" | "yearly" | "onetime";
  note?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  residentId: string;
  apartmentNumber: number;
  month: string; // YYYY-MM
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface Expense {
  id: string;
  chargeId?: string;
  name: string;
  amount: number;
  month: string;
  date: string;
  note?: string;
}

export interface AppState {
  residents: Resident[];
  charges: Charge[];
  payments: Payment[];
  expenses: Expense[];
  monthlyFee: number;
  totalApartments: number;
}
