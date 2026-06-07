import { useRef, useState } from "react";
import { Button, Card, Input } from "../components/UI";
import { defaultCharges, formatDA, generateResidents, totalChargesMonthly } from "../store";
import { PageProps } from "./types";

export default function Settings({ state, setState }: PageProps) {
  const [fee, setFee] = useState(String(state.monthlyFee));
  const [totalApts, setTotalApts] = useState(String(state.totalApartments));
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const saveFee = () => {
    const v = parseFloat(fee);
    if (isNaN(v) || v <= 0) return;
    setState((s) => ({ ...s, monthlyFee: v }));
    setMsg("✅ Cotisation mise à jour");
    setTimeout(() => setMsg(null), 2500);
  };

  const saveApts = () => {
    const v = parseInt(totalApts);
    if (isNaN(v) || v <= 0) return;
    setState((s) => ({ ...s, totalApartments: v }));
    setMsg("✅ Nombre d'appartements mis à jour");
    setTimeout(() => setMsg(null), 2500);
  };

  const resetAll = () => {
    if (!confirm("⚠️ Êtes-vous sûr ? Cela effacera TOUTES vos données (habitants, paiements, charges).")) return;
    if (!confirm("Vraiment sûr ? Action irréversible.")) return;
    setState({
      residents: generateResidents(),
      charges: defaultCharges,
      payments: [],
      expenses: [],
      monthlyFee: 2000,
      totalApartments: 46,
    });
    setMsg("🔄 Application réinitialisée");
    setTimeout(() => setMsg(null), 2500);
  };

  const clearPayments = () => {
    if (!confirm("Supprimer tous les paiements et dépenses ?")) return;
    setState((s) => ({ ...s, payments: [], expenses: [] }));
    setMsg("✅ Historique effacé");
    setTimeout(() => setMsg(null), 2500);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(String(ev.target?.result));
        if (!data.residents || !data.charges) throw new Error("Format invalide");
        setState({
          residents: data.residents,
          charges: data.charges,
          payments: data.payments ?? [],
          expenses: data.expenses ?? [],
          monthlyFee: data.monthlyFee ?? 2000,
          totalApartments: data.totalApartments ?? 46,
        });
        setMsg("✅ Import réussi");
      } catch (err) {
        setMsg("❌ Fichier invalide");
      }
      setTimeout(() => setMsg(null), 3000);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const totalCharges = totalChargesMonthly(state.charges);
  const expected = state.residents.length * state.monthlyFee;
  const surplus = expected - totalCharges;

  return (
    <div className="space-y-4">
      {msg && (
        <div className="fixed top-4 right-4 z-50 bg-white border shadow-lg rounded-xl px-4 py-3 text-sm">
          {msg}
        </div>
      )}

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-1">Paramètres financiers</h3>
        <p className="text-sm text-slate-500 mb-6">
          Configurez la cotisation mensuelle par habitant et le nombre total d'appartements.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Input
              label="Cotisation mensuelle par habitant (DA)"
              value={fee}
              onChange={setFee}
              type="number"
              step="0.01"
            />
            <Button onClick={saveFee}>Enregistrer la cotisation</Button>
          </div>
          <div className="space-y-3">
            <Input
              label="Nombre total d'appartements dans l'immeuble"
              value={totalApts}
              onChange={setTotalApts}
              type="number"
            />
            <Button onClick={saveApts}>Enregistrer</Button>
          </div>
        </div>

        <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <h4 className="font-semibold text-indigo-900 mb-3">📊 Synthèse théorique</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-slate-500 text-xs">Habitants</div>
              <div className="font-bold text-lg">{state.residents.length}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Recettes / mois</div>
              <div className="font-bold text-lg text-emerald-600">{formatDA(expected)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Charges / mois</div>
              <div className="font-bold text-lg text-amber-600">{formatDA(totalCharges)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Excédent / mois (caisse noire)</div>
              <div className={`font-bold text-lg ${surplus >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
                {formatDA(surplus)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-1">Données & sauvegarde</h3>
        <p className="text-sm text-slate-500 mb-6">
          Importez / exportez vos données. Utile pour changer d'appareil ou pour les sauvegardes mensuelles.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl">
            <div className="font-semibold mb-2">📥 Importer une sauvegarde</div>
            <p className="text-xs text-slate-500 mb-3">
              Fichier JSON généré par cette application.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={importJSON}
              className="text-sm"
            />
          </div>
          <div className="p-4 border rounded-xl">
            <div className="font-semibold mb-2">⚠️ Zone sensible</div>
            <p className="text-xs text-slate-500 mb-3">
              Effacez l'historique ou réinitialisez toute l'application.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={clearPayments}>
                Effacer l'historique
              </Button>
              <Button variant="danger" onClick={resetAll}>
                🔄 Réinitialiser
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-slate-50 to-white">
        <h3 className="font-semibold text-lg mb-2">ℹ️ À propos</h3>
        <div className="text-sm text-slate-600 space-y-2">
          <p>
            <strong>Application de gestion de syndic</strong> — conçue pour un immeuble de{" "}
            {state.totalApartments} appartements avec {state.residents.length} habitants.
          </p>
          <p>
            Toutes les données sont stockées localement dans votre navigateur
            (localStorage). Aucune information n'est envoyée sur un serveur.
          </p>
          <p className="text-xs text-slate-400">
            Version 1.0 · {new Date().getFullYear()}
          </p>
        </div>
      </Card>
    </div>
  );
}
