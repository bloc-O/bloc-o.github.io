import { useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal } from "../components/UI";
import { formatDA, monthLabel, currentMonth } from "../store";
import { Resident } from "../types";
import { PageProps } from "./types";

export default function Residents({ state, updateResidents, updatePayments }: PageProps) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [form, setForm] = useState({ apartmentNumber: "", name: "", phone: "", email: "" });

  const month = currentMonth();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return state.residents
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          String(r.apartmentNumber).includes(q) ||
          (r.phone ?? "").includes(q)
      )
      .sort((a, b) => a.apartmentNumber - b.apartmentNumber);
  }, [state.residents, search]);

  const openNew = () => {
    setEditing(null);
    const nextNum =
      state.residents.reduce((m, r) => Math.max(m, r.apartmentNumber), 0) + 1;
    setForm({ apartmentNumber: String(nextNum), name: "", phone: "", email: "" });
    setShowModal(true);
  };

  const openEdit = (r: Resident) => {
    setEditing(r);
    setForm({
      apartmentNumber: String(r.apartmentNumber),
      name: r.name,
      phone: r.phone ?? "",
      email: r.email ?? "",
    });
    setShowModal(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.apartmentNumber) return;
    if (editing) {
      updateResidents(
        state.residents.map((r) =>
          r.id === editing.id
            ? {
                ...r,
                apartmentNumber: parseInt(form.apartmentNumber),
                name: form.name.trim(),
                phone: form.phone,
                email: form.email,
              }
            : r
        )
      );
    } else {
      const newR: Resident = {
        id: "r" + Date.now(),
        apartmentNumber: parseInt(form.apartmentNumber),
        name: form.name.trim(),
        phone: form.phone,
        email: form.email,
        createdAt: new Date().toISOString(),
      };
      updateResidents([...state.residents, newR]);
    }
    setShowModal(false);
  };

  const remove = (r: Resident) => {
    if (!confirm(`Supprimer ${r.name} (appt n°${r.apartmentNumber}) ?`)) return;
    updateResidents(state.residents.filter((x) => x.id !== r.id));
    // also remove their payments
    updatePayments(state.payments.filter((p) => p.residentId !== r.id));
  };

  const hasPaidThisMonth = (id: string) =>
    state.payments.some((p) => p.residentId === id && p.month === month);

  const unpaidMonthsCount = (id: string) => {
    // count unpaid months in last 6
    const d = new Date();
    let count = 0;
    for (let i = 0; i < 6; i++) {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (!state.payments.some((p) => p.residentId === id && p.month === key)) count++;
      d.setMonth(d.getMonth() - 1);
    }
    return count;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <Input
          value={search}
          onChange={setSearch}
          placeholder="🔍 Rechercher par nom, appartement, téléphone..."
        />
        <div className="flex gap-2">
          <div className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium whitespace-nowrap">
            {state.residents.length} habitants
          </div>
          <Button onClick={openNew}>+ Ajouter</Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState text="Aucun habitant trouvé" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Appt</th>
                  <th className="text-left px-4 py-3">Nom</th>
                  <th className="text-left px-4 py-3">Téléphone</th>
                  <th className="text-left px-4 py-3">{monthLabel(month)}</th>
                  <th className="text-left px-4 py-3">Retard (6 mois)</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const paid = hasPaidThisMonth(r.id);
                  const late = unpaidMonthsCount(r.id);
                  return (
                    <tr
                      key={r.id}
                      className="border-t hover:bg-slate-50 transition"
                    >
                      <td className="px-4 py-3 font-semibold text-indigo-600">
                        #{r.apartmentNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white grid place-items-center text-xs font-bold">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{r.name}</div>
                            {r.email && (
                              <div className="text-xs text-slate-500">{r.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.phone || "—"}</td>
                      <td className="px-4 py-3">
                        {paid ? (
                          <Badge tone="emerald">✓ Payé {formatDA(state.monthlyFee)}</Badge>
                        ) : (
                          <Badge tone="rose">✗ Impayé</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {late === 0 ? (
                          <Badge tone="emerald">À jour</Badge>
                        ) : late <= 2 ? (
                          <Badge tone="amber">{late} mois</Badge>
                        ) : (
                          <Badge tone="rose">{late} mois</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button variant="ghost" onClick={() => openEdit(r)}>
                          ✏️
                        </Button>
                        <Button variant="ghost" onClick={() => remove(r)}>
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Modifier l'habitant" : "Ajouter un habitant"}
      >
        <div className="space-y-3">
          <Input
            label="Numéro d'appartement"
            value={form.apartmentNumber}
            onChange={(v) => setForm({ ...form, apartmentNumber: v })}
            type="number"
            required
          />
          <Input
            label="Nom complet"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <Input
            label="Téléphone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <Input
            label="Email (optionnel)"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
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
