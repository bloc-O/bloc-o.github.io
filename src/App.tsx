import { useEffect, useMemo, useState } from "react";
import { AppState, Charge, Expense, Payment, Resident } from "./types";
import {
  currentMonth,
  formatDA,
  lastMonths,
  loadState,
  monthLabel,
  saveState,
  totalChargesMonthly,
} from "./store";
import Dashboard from "./pages/Dashboard";
import Residents from "./pages/Residents";
import Charges from "./pages/Charges";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import { initAuth, logout } from "./hooks/useAuth";

type Page = "dashboard" | "residents" | "charges" | "payments" | "reports" | "settings";

const menu: { key: Page; label: string; icon: string }[] = [
  { key: "dashboard", label: "Tableau de bord", icon: "📊" },
  { key: "residents", label: "Habitants", icon: "👥" },
  { key: "charges", label: "Charges", icon: "💡" },
  { key: "payments", label: "Cotisations", icon: "💰" },
  { key: "reports", label: "Rapports", icon: "📈" },
  { key: "settings", label: "Paramètres", icon: "⚙️" },
];

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(() => initAuth());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateResidents = (residents: Resident[]) =>
    setState((s) => ({ ...s, residents }));
  const updateCharges = (charges: Charge[]) =>
    setState((s) => ({ ...s, charges }));
  const updatePayments = (payments: Payment[]) =>
    setState((s) => ({ ...s, payments }));
  const updateExpenses = (expenses: Expense[]) =>
    setState((s) => ({ ...s, expenses }));

  const month = currentMonth();
  const totalCharges = useMemo(() => totalChargesMonthly(state.charges), [state.charges]);
  const expectedMonthly = state.residents.length * state.monthlyFee;
  const collectedThisMonth = state.payments
    .filter((p) => p.month === month)
    .reduce((sum, p) => sum + p.amount, 0);

  const blackFund = useMemo(() => {
    const monthsArr = Array.from(new Set(state.payments.map((p) => p.month))).sort();
    let total = 0;
    monthsArr.forEach((m) => {
      const collected = state.payments
        .filter((p) => p.month === m)
        .reduce((s, p) => s + p.amount, 0);
      const expenses = state.expenses
        .filter((e) => e.month === m)
        .reduce((s, e) => s + e.amount, 0);
      total += collected - totalCharges - expenses;
    });
    return total;
  }, [state.payments, state.expenses, totalCharges]);

  const ctx = {
    state,
    setState,
    updateResidents,
    updateCharges,
    updatePayments,
    updateExpenses,
    totalCharges,
    expectedMonthly,
    collectedThisMonth,
    blackFund,
  };

  const months = lastMonths(12);

  const handleLogin = () => setIsAuthed(true);

  const handleLogout = () => {
    logout();
    setIsAuthed(false);
  };

  if (!isAuthed) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center font-bold">
            IG
          </div>
          <div>
            <div className="font-semibold text-sm">Immeuble Gestion</div>
            <div className="text-xs text-slate-500">{monthLabel(month)}</div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:sticky top-0 left-0 h-screen lg:h-auto w-64 bg-white border-r shadow-sm transition-transform z-30 lg:z-0`}
        >
          <div className="p-5 border-b hidden lg:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center font-bold">
              IG
            </div>
            <div>
              <div className="font-bold">Immeuble Gestion</div>
              <div className="text-xs text-slate-500">Syndic & Charges</div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {menu.map((m) => (
              <button
                key={m.key}
                onClick={() => {
                  setPage(m.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  page === m.key
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </nav>

          <div className="p-4 mx-3 mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <div className="text-xs opacity-80">Caisse noire cumulée</div>
            <div className="text-xl font-bold mt-1">{formatDA(blackFund)}</div>
            <button
              onClick={handleLogout}
              className="text-xs opacity-80 hover:opacity-100 mt-3 underline"
            >
              Déconnexion
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <main className="flex-1 p-4 lg:p-8 min-w-0">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              {menu.find((m) => m.key === page)?.label}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Mois en cours : {monthLabel(month)} · Cotisation par habitant :{" "}
              {formatDA(state.monthlyFee)}
            </p>
          </header>

          {page === "dashboard" && <Dashboard {...ctx} months={months} />}
          {page === "residents" && <Residents {...ctx} />}
          {page === "charges" && <Charges {...ctx} />}
          {page === "payments" && <Payments {...ctx} months={months} />}
          {page === "reports" && <Reports {...ctx} months={months} />}
          {page === "settings" && <Settings {...ctx} />}

          <footer className="mt-10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Immeuble Gestion · Données sauvegardées localement
          </footer>
        </main>
      </div>
    </div>
  );
}
