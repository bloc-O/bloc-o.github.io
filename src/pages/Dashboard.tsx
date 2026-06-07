import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, StatCard, Badge } from "../components/UI";
import { currentMonth, formatDA, monthLabel, totalChargesMonthly } from "../store";
import { PageProps } from "./types";

export default function Dashboard({
  state,
  totalCharges,
  expectedMonthly,
  collectedThisMonth,
  blackFund,
  months = [],
}: PageProps) {
  const month = currentMonth();
  const paidResidents = new Set(
    state.payments.filter((p) => p.month === month).map((p) => p.residentId)
  );
  const unpaidCount = state.residents.filter((r) => !paidResidents.has(r.id)).length;
  const paidCount = state.residents.length - unpaidCount;
  const paymentRate =
    state.residents.length > 0 ? (paidCount / state.residents.length) * 100 : 0;

  // Monthly data for charts
  const monthlyData = months.map((m) => {
    const collected = state.payments
      .filter((p) => p.month === m)
      .reduce((s, p) => s + p.amount, 0);
    const expenses = state.expenses
      .filter((e) => e.month === m)
      .reduce((s, e) => s + e.amount, 0);
    const expected = state.residents.length * state.monthlyFee;
    return {
      month: monthLabel(m).slice(0, 3),
      Attendu: expected,
      Encaissé: collected,
      Charges: totalCharges,
      Dépenses: expenses,
      "Caisse noire": collected - totalCharges - expenses,
    };
  });

  // Charge distribution
  const chargeDist = state.charges.map((c) => ({
    name: c.name.length > 22 ? c.name.slice(0, 22) + "…" : c.name,
    value: c.amount,
  }));
  const COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#ef4444",
  ];

  // Bad payeurs (habitants avec au moins un mois impayé dans les 6 derniers)
  const last6 = months.slice(-6);
  const badPayeurs = state.residents
    .map((r) => {
      const unpaid = last6.filter(
        (m) => !state.payments.some((p) => p.residentId === r.id && p.month === m)
      );
      return { resident: r, unpaidCount: unpaid.length, lastUnpaid: unpaid[0] };
    })
    .filter((r) => r.unpaidCount > 0)
    .sort((a, b) => b.unpaidCount - a.unpaidCount)
    .slice(0, 5);

  // Recent payments
  const recentPayments = [...state.payments]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Habitants"
          value={`${state.residents.length}`}
          sub={`sur ${state.totalApartments} appartements`}
          icon="👥"
          tone="indigo"
        />
        <StatCard
          title="Encaissé ce mois"
          value={formatDA(collectedThisMonth)}
          sub={`${paidCount} payeurs · ${paymentRate.toFixed(0)}%`}
          icon="💰"
          tone="emerald"
        />
        <StatCard
          title="Charges mensuelles"
          value={formatDA(totalCharges)}
          sub={`${formatDA(totalCharges / Math.max(state.residents.length, 1))} / hab.`}
          icon="💡"
          tone="amber"
        />
        <StatCard
          title="Caisse noire"
          value={formatDA(blackFund)}
          sub="Cumulée depuis le début"
          icon="🏦"
          tone="rose"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                Évolution mensuelle (12 derniers mois)
              </h3>
              <p className="text-xs text-slate-500">
                Attendu vs encaissé vs charges
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(v) => formatDA(Number(v))}
                  contentStyle={{ borderRadius: 12 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Attendu"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Encaissé"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Charges"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-1">
            Répartition des charges
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            Total : {formatDA(totalChargesMonthly(state.charges))}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chargeDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ percent }) =>
                    `${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {chargeDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatDA(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs space-y-1 mt-2">
            {chargeDist.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-slate-600 truncate">{c.name}</span>
                <span className="ml-auto text-slate-400">{formatDA(c.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Caisse noire / mois</h3>
          <p className="text-xs text-slate-500 mb-3">
            Excédent après charges et dépenses
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip formatter={(v) => formatDA(Number(v))} />
                <Bar dataKey="Caisse noire" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d["Caisse noire"] >= 0 ? "#6366f1" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Top mauvais payeurs</h3>
            <Badge tone="rose">{badPayeurs.length}</Badge>
          </div>
          {badPayeurs.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              🎉 Tous les habitants sont à jour !
            </div>
          ) : (
            <ul className="space-y-3">
              {badPayeurs.map(({ resident, unpaidCount }) => (
                <li
                  key={resident.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white grid place-items-center text-sm font-bold">
                    {resident.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {resident.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Appt n°{resident.apartmentNumber}
                    </div>
                  </div>
                  <Badge tone="rose">
                    {unpaidCount} mois ·{" "}
                    {formatDA(unpaidCount * state.monthlyFee)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Paiements récents</h3>
            <Badge tone="emerald">{recentPayments.length}</Badge>
          </div>
          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Aucun paiement enregistré
            </div>
          ) : (
            <ul className="space-y-3">
              {recentPayments.map((p) => {
                const r = state.residents.find((x) => x.id === p.residentId);
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white grid place-items-center text-sm font-bold">
                      {(r?.name ?? "?").charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {r?.name ?? "Inconnu"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.date} · {monthLabel(p.month)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">
                      +{formatDA(p.amount)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Progress card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">
              Progression du mois ({monthLabel(month)})
            </h3>
            <p className="text-xs text-slate-500">
              {paidCount} sur {state.residents.length} habitants ont payé
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">
              {paymentRate.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">
              {formatDA(collectedThisMonth)} / {formatDA(expectedMonthly)}
            </div>
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
            style={{ width: `${Math.min(paymentRate, 100)}%` }}
          />
        </div>
        {unpaidCount > 0 && (
          <p className="text-xs text-rose-600 mt-3">
            ⚠️ {unpaidCount} habitant{unpaidCount > 1 ? "s" : ""} n'{unpaidCount > 1 ? "ont" : "a"}' pas encore réglé ce mois.
          </p>
        )}
      </Card>
    </div>
  );
}
