import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/UI";
import { Charge } from "../types";
import { formatDA, totalChargesMonthly } from "../store";
import { PageProps } from "./types";

const freqOptions = [
  { value: "monthly", label: "Mensuel" },
  { value: "bimonthly", label: "Bimensuel (ex: ascenseur / 45j)" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "yearly", label: "Annuel" },
  { value: "onetime", label: "Ponctuel" },
];

export default function Charges({ state, updateCharges, totalCharges }: PageProps) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Charge | null>(null);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as Charge["frequency"],
    note: "",
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", amount: "", frequency: "monthly", note: "" });
    setShowModal(true);
  };

  const openEdit = (c: Charge) => {
    setEditing(c);
    setForm({
      name: c.name,
      amount: String(c.amount),
      frequency: c.frequency,
      note: c.note ?? "",
    });
    setShowModal(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (editing) {
      updateCharges(
        state.charges.map((c) =>
          c.id === editing.id
            ? { ...c, name: form.name.trim(), amount, frequency: form.frequency, note: form.note }
            : c
        )
      );
    } else {
      const newC: Charge = {
        id: "c" + Date.now(),
        name: form.name.trim(),
        amount,
        frequency: form.frequency,
        note: form.note,
        createdAt: new Date().toISOString(),
      };
      updateCharges([...state.charges, newC]);
    }
    setShowModal(false);
  };

  const remove = (c: Charge) => {
    if (!confirm(`Supprimer "${c.name}" ?`)) return;
    updateCharges(state.charges.filter((x) => x.id !== c.id));
  };

  const monthlyEquivalent = (c: Charge) => {
    switch (c.frequency) {
      case "monthly":
        return c.amount;
      case "bimonthly":
        return c.amount / 2;
      case "quarterly":
        return c.amount / 3;
      case "yearly":
        return c.amount / 12;
      default:
        return 0;
    }
  };

  const perResident =
    state.residents.length > 0 ? totalCharges / state.residents.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-sm text-slate-500">Total charges / mois</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {formatDA(totalChargesMonthly(state.charges))}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {formatDA(perResident)} / habitant
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-slate-500">Cotisation / habitant</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {formatDA(state.monthlyFee)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {state.residents.length} habitants → {formatDA(state.residents.length * state.monthlyFee)} / mois
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-slate-500">Excédent théorique / mois</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatDA(state.residents.length * state.monthlyFee - totalCharges)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Soit {formatDA(state.monthlyFee - perResident)} / habitant (caisse noire)
          </div>
        </Card>
      </div>

      <Card className="p-4 flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {state.charges.length} charge(s) configurée(s)
        </div>
        <Button onClick={openNew}>+ Ajouter une charge</Button>
      </Card>

      <Card className="overflow-hidden">
        {state.charges.length === 0 ? (
          <EmptyState text="Aucune charge" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Charge</th>
                  <th className="text-left px-4 py-3">Montant</th>
                  <th className="text-left px-4 py-3">Fréquence</th>
                  <th className="text-left px-4 py-3">Équivalent / mois</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.charges.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.name}</div>
                      {c.note && (
                        <div className="text-xs text-slate-500">{c.note}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatDA(c.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge tone="indigo">
                        {freqOptions.find((f) => f.value === c.frequency)?.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">
                      {formatDA(monthlyEquivalent(c))}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" onClick={() => openEdit(c)}>
                        ✏️
                      </Button>
                      <Button variant="ghost" onClick={() => remove(c)}>
                        🗑️
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3" colSpan={3}>
                    Total mensuel
                  </td>
                  <td className="px-4 py-3 text-amber-600">
                    {formatDA(totalChargesMonthly(state.charges))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Modifier la charge" : "Ajouter une charge"}
      >
        <div className="space-y-3">
          <Input
            label="Nom de la charge"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <Input
            label="Montant (DA)"
            value={form.amount}
            onChange={(v) => setForm({ ...form, amount: v })}
            type="number"
            step="0.01"
            required
          />
          <Select
            label="Fréquence"
            value={form.frequency}
            onChange={(v) => setForm({ ...form, frequency: v as Charge["frequency"] })}
            options={freqOptions}
          />
          <Input
            label="Remarque (optionnel)"
            value={form.note}
            onChange={(v) => setForm({ ...form, note: v })}
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button onClick={save}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
