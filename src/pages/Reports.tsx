import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Button, Card, EmptyState } from "../components/UI";
import { formatDA, monthLabel, totalChargesMonthly } from "../store";
import { PageProps } from "./types";

export default function Reports({ state, totalCharges, blackFund, months = [] }: PageProps) {
  const [view, setView] = useState<"summary" | "badPayeurs" | "history" | "export">(
    "summary"
  );

  const monthlyData = useMemo(
    () =>
      months.map((m) => {
        const collected = state.payments
          .filter((p) => p.month === m)
          .reduce((s, p) => s + p.amount, 0);
        const expenses = state.expenses
          .filter((e) => e.month === m)
          .reduce((s, e) => s + e.amount, 0);
        const expected = state.residents.length * state.monthlyFee;
        const paidCount = new Set(
          state.payments.filter((p) => p.month === m).map((p) => p.residentId)
        ).size;
        return {
          month: monthLabel(m),
          Attendu: expected,
          Encaissé: collected,
          Charges: totalCharges,
          Dépenses: expenses,
          "Caisse noire": collected - totalCharges - expenses,
          payeurs: paidCount,
          taux: state.residents.length > 0 ? (paidCount / state.residents.length) * 100 : 0,
        };
      }),
    [months, state.payments, state.expenses, state.residents.length, state.monthlyFee, totalCharges]
  );

  // Bad payeurs: tous les habitants avec leur historique
  const badPayeurs = useMemo(() => {
    const last12 = months.slice(-12);
    return state.residents
      .map((r) => {
        const unpaid = last12.filter(
          (m) => !state.payments.some((p) => p.residentId === r.id && p.month === m)
        );
        const totalDue = unpaid.length * state.monthlyFee;
        const totalPaid = state.payments
          .filter((p) => p.residentId === r.id)
          .reduce((s, p) => s + p.amount, 0);
        return { resident: r, unpaid, totalDue, totalPaid };
      })
      .sort((a, b) => b.totalDue - a.totalDue);
  }, [state.residents, state.payments, months, state.monthlyFee]);

  const withDebt = badPayeurs.filter((r) => r.totalDue > 0);
  const totalDebt = withDebt.reduce((s, r) => s + r.totalDue, 0);

  const exportCSV = () => {
    const rows = [
      ["Mois", "Habitant", "Appartement", "Montant", "Date", "Type"],
      ...state.payments.map((p) => {
        const r = state.residents.find((x) => x.id === p.residentId);
        return [p.month, r?.name || "", String(p.apartmentNumber), String(p.amount), p.date, "Paiement"];
      }),
      ...state.expenses.map((e) => [e.month, e.name, "", String(-e.amount), e.date, "Dépense"]),
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gestion-immeuble-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap gap-2">
        <Button variant={view === "summary" ? "primary" : "secondary"} onClick={() => setView("summary")}>
          📊 Synthèse
        </Button>
        <Button variant={view === "badPayeurs" ? "primary" : "secondary"} onClick={() => setView("badPayeurs")}>
          ⚠️ Mauvais payeurs ({withDebt.length})
        </Button>
        <Button variant={view === "history" ? "primary" : "secondary"} onClick={() => setView("history")}>
          📅 Historique par mois
        </Button>
        <Button variant={view === "export" ? "primary" : "secondary"} onClick={() => setView("export")}>
          💾 Exporter
        </Button>
      </Card>

      {view === "summary" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="text-xs text-slate-500">Total encaissé (12 mois)</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">
                {formatDA(monthlyData.reduce((s, m) => s + m.Encaissé, 0))}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500">Total charges (12 mois)</div>
              <div className="text-lg font-bold text-amber-600 mt-1">
                {formatDA(totalChargesMonthly(state.charges) * 12)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500">Dettes en cours</div>
              <div className="text-lg font-bold text-rose-600 mt-1">
                {formatDA(totalDebt)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500">Caisse noire cumulée</div>
              <div className="text-lg font-bold text-indigo-600 mt-1">
                {formatDA(blackFund)}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold mb-1">Évolution 12 mois</h3>
            <p className="text-xs text-slate-500 mb-4">
              Encaissé vs charges fixes vs dépenses
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(v: unknown) => formatDA(Number(v))}
                    contentStyle={{ borderRadius: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="Encaissé" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((_, i) => (
                      <Cell key={i} fill={COLORS[1]} />
                    ))}
                  </Bar>
                  <Bar dataKey="Charges" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((_, i) => (
                      <Cell key={i} fill={COLORS[2]} />
                    ))}
                  </Bar>
                  <Bar dataKey="Dépenses" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((_, i) => (
                      <Cell key={i} fill={COLORS[3]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {view === "badPayeurs" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold">État des dettes</div>
              <div className="text-xs text-slate-500">
                Sur les 12 derniers mois · Total dû :{" "}
                <span className="font-bold text-rose-600">{formatDA(totalDebt)}</span>
              </div>
            </div>
            <Badge tone="rose">{withDebt.length} habitant(s) en retard</Badge>
          </div>
          {badPayeurs.length === 0 ? (
            <EmptyState text="Aucune donnée" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3">Appt</th>
                    <th className="text-left px-4 py-3">Habitant</th>
                    <th className="text-left px-4 py-3">Téléphone</th>
                    <th className="text-center px-4 py-3">Mois impayés</th>
                    <th className="text-right px-4 py-3">Total payé</th>
                    <th className="text-right px-4 py-3">Dette</th>
                  </tr>
                </thead>
                <tbody>
                  {badPayeurs.map(({ resident, unpaid, totalDue, totalPaid }) => (
                    <tr key={resident.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 text-indigo-600 font-semibold">
                        #{resident.apartmentNumber}
                      </td>
                      <td className="px-4 py-3 font-medium">{resident.name}</td>
                      <td className="px-4 py-3 text-slate-600">{resident.phone || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {unpaid.length === 0 ? (
                          <Badge tone="emerald">À jour</Badge>
                        ) : (
                          <Badge tone={unpaid.length <= 2 ? "amber" : "rose"}>
                            {unpaid.length} mois
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                        {formatDA(totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {totalDue > 0 ? (
                          <span className="text-rose-600">{formatDA(totalDue)}</span>
                        ) : (
                          <span className="text-emerald-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {view === "history" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-semibold">Historique mensuel détaillé</div>
            <div className="text-xs text-slate-500">
              Taux de recouvrement et caisse noire par mois
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3">Mois</th>
                  <th className="text-right px-4 py-3">Payeurs</th>
                  <th className="text-right px-4 py-3">Taux</th>
                  <th className="text-right px-4 py-3">Encaissé</th>
                  <th className="text-right px-4 py-3">Charges</th>
                  <th className="text-right px-4 py-3">Dépenses</th>
                  <th className="text-right px-4 py-3">Caisse noire</th>
                </tr>
              </thead>
              <tbody>
                {[...monthlyData].reverse().map((m) => (
                  <tr key={m.month} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{m.month}</td>
                    <td className="px-4 py-3 text-right">
                      {m.payeurs}/{state.residents.length}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge tone={m.taux >= 90 ? "emerald" : m.taux >= 60 ? "amber" : "rose"}>
                        {m.taux.toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                      {formatDA(m.Encaissé)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600">
                      {formatDA(m.Charges)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-600">
                      {formatDA(m.Dépenses)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        m["Caisse noire"] >= 0 ? "text-indigo-600" : "text-rose-600"
                      }`}
                    >
                      {formatDA(m["Caisse noire"])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {view === "export" && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Exporter les données</h3>
          <p className="text-sm text-slate-500 mb-6">
            Sauvegardez vos données ou exportez les mouvements financiers en CSV.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 border-2 border-dashed border-slate-200 rounded-xl">
              <div className="text-3xl mb-2">📄</div>
              <div className="font-semibold">Export CSV (mouvements)</div>
              <p className="text-xs text-slate-500 mb-4">
                Liste de tous les paiements et dépenses, ouvrable dans Excel.
              </p>
              <Button onClick={exportCSV}>Télécharger CSV</Button>
            </div>
            <div className="p-5 border-2 border-dashed border-slate-200 rounded-xl">
              <div className="text-3xl mb-2">💾</div>
              <div className="font-semibold">Sauvegarde complète (JSON)</div>
              <p className="text-xs text-slate-500 mb-4">
                Toutes vos données (habitants, charges, paiements). À conserver précieusement.
              </p>
              <Button onClick={exportJSON}>Télécharger JSON</Button>
            </div>
          </div>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            💡 <strong>Conseil :</strong> exportez une sauvegarde JSON chaque fin de mois.
            Les données sont stockées dans le navigateur (localStorage) — changer de navigateur
            ou d'appareil perd les données.
          </div>
        </Card>
      )}
    </div>
  );
}
