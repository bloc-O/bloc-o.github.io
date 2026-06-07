import { useState } from "react";
import { Card, Button, Input } from "../components/UI";
import { login } from "../hooks/useAuth";

interface AuthProps {
  onLogin: () => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center text-2xl font-bold mx-auto shadow-lg">
            IG
          </div>
          <h1 className="text-xl font-bold mt-4 text-slate-900">
            Gestion Immeuble
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Accès réservé au gestionnaire
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Mot de passe"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="Entrez le mot de passe"
            required
          />
          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
              Mot de passe incorrect
            </p>
          )}
          <Button type="submit" className="w-full">
            Se connecter
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Application de gestion de syndic<br />
          Données stockées localement
        </p>
      </Card>
    </div>
  );
}
