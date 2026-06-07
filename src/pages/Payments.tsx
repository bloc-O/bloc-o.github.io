import { useMemo, useState } from "react";
import { Button, Card, EmptyState, Input, Modal, Select } from "../components/UI";
import { Payment, Expense } from "../types";
import { currentMonth, formatDA, monthLabel, totalChargesMonthly } from "../store";
import { PageProps } from "./types";

type Mode = "payments" | "expenses" | "unpaid";

export default function Payments({
  state,
  updatePayments,
  updateExpenses,
  totalCharges,
  months = [],
}: PageProps) {
  const [mode, setMode] = useState<Mode>("payments");
  const [month, setMonth] = useState<string>(currentMonth());
  const [showPayModal, setShowPayModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingPay, setEditingPay] = useState<Payment | null>(null);
  const [editingExp, setEditingExp] = useState<Expense | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const [payForm, setPayForm] = useState({
    residentId: "",
    amount: String(state.monthlyFee),
    date: today,
    note: "",
  });
  const [expForm, setExpForm] = useState({
    name: "",
    amount: "",
    date: today,
    note: "",
  });

  const monthPayments = useMemo(
    () => state.payments.filter((p) => p.month === month),
    [state.payments, month]
  );
  const monthExpenses = useMemo(
    () => state.expenses.filter((e) => e.month === month),
    [state.expenses, month]
  );

  const collected = monthPayments.reduce((s, p) => s + p.amount, 0);
  const expected = state.residents.length * state.monthlyFee;
  const expenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const paidIds = new Set(monthPayments.map((p) => p.residentId));
  const unpaid = state.residents.filter((r) => !paidIds.has(r.id));

  const openPay = (residentId?: string, editing?: Payment) => {
    setEditingPay(editing || null);
    setPayForm({
      residentId: editing?.residentId || residentId || "",
      amount: String(editing?.amount ?? state.monthlyFee),
      date: editing?.date || today,
      note: editing?.note || "",
    });
    setShowPayModal(true);
  };

  const savePay = () => {
    if (!payForm.residentId || !payForm.amount) return;
    const resident = state.residents.find((r) => r.id === payForm.residentId);
    if (!resident) return;
    const amount = parseFloat(payForm.amount);
    if (editingPay) {
      updatePayments(
        state.payments.map((p) =>
          p.id === editingPay.id
            ? { ...p, amount, date: payForm.date, note: payForm.note }
            : p
        )
      );
    } else {
      const newP: Payment = {
        id: "p" + Date.now(),
        residentId: payForm.residentId,
        apartmentNumber: resident.apartmentNumber,
        month,
        amount,
        date: payForm.date,
        note: payForm.note,
      };
      updatePayments([...state.payments, newP]);
    }
    setShowPayModal(false);
  };

  const removePay = (p: Payment) => {
    if (!confirm("Supprimer ce paiement ?")) return;
    updatePayments(state.payments.filter((x) => x.id !== p.id));
  };

  const openExp = (editing?: Expense) => {
    setEditingExp(editing || null);
    setExpForm({
      name: editing?.name || "",
      amount: String(editing?.amount ?? ""),
      date: editing?.date || today,
      note: editing?.note || "",
    });
    setShowExpModal(true);
  };

  const saveExp = () => {
    if (!expForm.name.trim() || !expForm.amount) return;
    const amount = parseFloat(expForm.amount);
    if (editingExp) {
      updateExpenses(
        state.expenses.map((e) =>
          e.id === editingExp.id
            ? { ...e, name: expForm.name.trim(), amount, date: expForm.date, note: expForm.note }
            : e
        )
      );
    } else {
      const newE: Expense = {
        id: "e" + Date.now(),
        name: expForm.name.trim(),
        amount,
        month,
        date: expForm.date,
        note: expForm.note,
      };
      updateExpenses([...state.expenses, newE]);
    }
    setShowExpModal(false);
  };

  const removeExp = (e: Expense) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    updateExpenses(state.expenses.filter((x) => x.id !== e.id));
  };

  const payAll = () => {
    if (!confirm(`Marquer tous les ${unpaid.length} habitants comme ayant payé ${formatDA(state.monthlyFee)} pour ${monthLabel(month)} ?`))
      return;
    const newPayments: Payment[] = unpaid.map((r, i) => ({
      id: "p" + Date.now() + "_" + i,
      residentId: r.id,
      apartmentNumber: r.apartmentNumber,
      month,
      amount: state.monthlyFee,
      date: today,
      note: "Paiement groupé",
    }));
    updatePayments([...state.payments, ...newPayments]);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <Select
          label="Mois"
          value={month}
          onChange={setMonth}
          options={[...months].reverse().map((m) => ({ value: m, label: monthLabel(m) }))}
        />
        <div className="flex gap-2 md:ml-auto">
          <Button
            variant={mode === "payments" ? "primary" : "secondary"}
            onClick={() => setMode("payments")}
          >
            💰 Cotisations ({monthPayments.length})
          </Button>
          <Button
            variant={mode === "unpaid" ? "primary" : "secondary"}
            onClick={() => setMode("unpaid")}
          >
            ⚠️ Impayés ({unpaid.length})
          </Button>
          <Button
            variant={mode === "expenses" ? "primary" : "secondary"}
            onClick={() => setMode("expenses")}
          >
            🧾 Dépenses ({monthExpenses.length})
          </Button>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Encaissé</div>
          <div className="text-lg font-bold text-emerald-600 mt-1">
            {formatDA(collected)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Attendu</div>
          <div className="text-lg font-bold text-slate-700 mt-1">
            {formatDA(expected)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Charges fixes</div>
          <div className="text-lg font-bold text-amber-600 mt-1">
            {formatDA(totalChargesMonthly(state.charges))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">
            {collected - totalCharges - expenses >= 0 ? "Solde du mois" : "Déficit"}
          </div>
          <div
            className={`text-lg font-bold mt-1 ${
              collected - totalCharges - expenses >= 0 ? "text-indigo-600" : "text-rose-600"
            }`}
          >
            {formatDA(collected - totalCharges - expenses)}
          </div>
        </Card>
      </div>

      {/* Payments */}
      {mode === "payments" && (
        <Card className="overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b">
            <div className="text-sm text-slate-600">
              {monthPayments.length} paiement(s) enregistré(s) · {monthLabel(month)}
            </div>
            <Button onClick={() => openPay()}>+ Nouveau paiement</Button>
          </div>
          {monthPayments.length === 0 ? (
            <EmptyState text="Aucun paiement pour ce mois" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Habitant</th>
                    <th className="text-left px-4 py-3">Appt</th>
                    <th className="text-left px-4 py-3">Montant</th>
                    <th className="text-left px-4 py-3">Remarque</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monthPayments]
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .map((p) => {
                      const r = state.residents.find((x) => x.id === p.residentId);
                      return (
                        <tr key={p.id} className="border-t hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{p.date}</td>
                          <td className="px-4 py-3 font-medium">{r?.name || "—"}</td>
                          <td className="px-4 py-3 text-indigo-600 font-semibold">
                            #{p.apartmentNumber}
                          </td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">
                            {formatDA(p.amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{p.note || "—"}</td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <Button variant="ghost" onClick={() => openPay(undefined, p)}>
                              ✏️
                            </Button>
                            <Button variant="ghost" onClick={() => removePay(p)}>
                              🗑️
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-4 py-3" colSpan={3}>
                      Total encaissé
                    </td>
                    <td className="px-4 py-3 text-emerald-600">{formatDA(collected)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Unpaid */}
      {mode === "unpaid" && (
        <Card className="overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b">
            <div className="text-sm text-slate-600">
              {unpaid.length} habitant(s) n'{unpaid.length > 1 ? "ont" : "a"}' pas payé · {monthLabel(month)}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={payAll} disabled={unpaid.length === 0}>
                ✓ Tout marquer payé
              </Button>
            </div>
          </div>
          {unpaid.length === 0 ? (
            <EmptyState text="🎉 Tous les habitants sont à jour pour ce mois !" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3">Appt</th>
                    <th className="text-left px-4 py-3">Habitant</th>
                    <th className="text-left px-4 py-3">Téléphone</th>
                    <th className="text-left px-4 py-3">Montant dû</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaid.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 text-indigo-600 font-semibold">
                        #{r.apartmentNumber}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-slate-600">{r.phone || "—"}</td>
                      <td className="px-4 py-3 text-rose-600 font-semibold">
                        {formatDA(state.monthlyFee)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button onClick={() => openPay(r.id)}>Enregistrer</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Expenses */}
      {mode === "expenses" && (
        <Card className="overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b">
            <div className="text-sm text-slate-600">
              {monthExpenses.length} dépense(s) · {monthLabel(month)}
            </div>
            <Button onClick={() => openExp()}>+ Nouvelle dépense</Button>
          </div>
          {monthExpenses.length === 0 ? (
            <EmptyState text="Aucune dépense enregistrée" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Désignation</th>
                    <th className="text-left px-4 py-3">Montant</th>
                    <th className="text-left px-4 py-3">Remarque</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monthExpenses]
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .map((e) => (
                      <tr key={e.id} className="border-t hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{e.date}</td>
                        <td className="px-4 py-3 font-medium">{e.name}</td>
                        <td className="px-4 py-3 text-rose-600 font-semibold">
                          {formatDA(e.amount)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{e.note || "—"}</td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <Button variant="ghost" onClick={() => openExp(e)}>
                            ✏️
                          </Button>
                          <Button variant="ghost" onClick={() => removeExp(e)}>
                            🗑️
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-4 py-3" colSpan={2}>
                      Total dépenses
                    </td>
                    <td className="px-4 py-3 text-rose-600">{formatDA(expenses)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Payment modal */}
      <Modal
        open={showPayModal}
        onClose={() => setShowPayModal(false)}
        title={editingPay ? "Modifier le paiement" : "Nouveau paiement"}
      >
        <div className="space-y-3">
          <Select
            label="Habitant"
            value={payForm.residentId}
            onChange={(v) => setPayForm({ ...payForm, residentId: v })}
            options={[
              { value: "", label: "— Sélectionner —" },
              ...state.residents
                .sort((a, b) => a.apartmentNumber - b.apartmentNumber)
                .map((r) => ({
                  value: r.id,
                  label: `Appt n°${r.apartmentNumber} - ${r.name}`,
                })),
            ]}
          />
          <Input
            label="Montant (DA)"
            value={payForm.amount}
            onChange={(v) => setPayForm({ ...payForm, amount: v })}
            type="number"
            step="0.01"
            required
          />
          <Input
            label="Date de paiement"
            value={payForm.date}
            onChange={(v) => setPayForm({ ...payForm, date: v })}
            type="date"
            required
          />
          <Input
            label="Remarque (optionnel)"
            value={payForm.note}
            onChange={(v) => setPayForm({ ...payForm, note: v })}
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setShowPayModal(false)}>
              Annuler
            </Button>
            <Button onClick={savePay}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Expense modal */}
      <Modal
        open={showExpModal}
        onClose={() => setShowExpModal(false)}
        title={editingExp ? "Modifier la dépense" : "Nouvelle dépense"}
      >
        <div className="space-y-3">
          <Input
            label="Désignation"
            value={expForm.name}
            onChange={(v) => setExpForm({ ...expForm, name: v })}
            required
          />
          <Input
            label="Montant (DA)"
            value={expForm.amount}
            onChange={(v) => setExpForm({ ...expForm, amount: v })}
            type="number"
            step="0.01"
            required
          />
          <Input
            label="Date"
            value={expForm.date}
            onChange={(v) => setExpForm({ ...expForm, date: v })}
            type="date"
            required
          />
          <Input
            label="Remarque (optionnel)"
            value={expForm.note}
            onChange={(v) => setExpForm({ ...expForm, note: v })}
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setShowExpModal(false)}>
              Annuler
            </Button>
            <Button onClick={saveExp}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
