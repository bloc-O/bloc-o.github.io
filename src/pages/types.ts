import { AppState, Charge, Expense, Payment, Resident } from "../types";

export interface PageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  updateResidents: (r: Resident[]) => void;
  updateCharges: (c: Charge[]) => void;
  updatePayments: (p: Payment[]) => void;
  updateExpenses: (e: Expense[]) => void;
  totalCharges: number;
  expectedMonthly: number;
  collectedThisMonth: number;
  blackFund: number;
  months?: string[];
}
