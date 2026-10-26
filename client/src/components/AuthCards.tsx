import { FormEvent, useState } from "react";
import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { SEDI } from "../lib/types";

export function LoginCard({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [sede, setSede] = useState<string>(SEDI[0]);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(name, className, sede);
      push("success", `Benvenuto/a, ${name}!`);
      onSuccess?.();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Errore nell'accesso.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-night-900 text-gold-400">
          <LogIn className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Accedi</h2>
          <p className="text-sm text-night-900/55">Nome e classe, nient'altro.</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="login-name">
            Nome e cognome
          </label>
          <input
            id="login-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Giulia Bianchi"
            maxLength={60}
            required
            minLength={2}
            autoComplete="name"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="login-class">
              Classe
            </label>
            <input
              id="login-class"
              className="input"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Es. 4A"
              maxLength={30}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="login-sede">
              Sede
            </label>
            <select
              id="login-sede"
              className="input"
              value={sede}
              onChange={(e) => setSede(e.target.value)}
              required
            >
              {SEDI.map((s) => (
                <option key={s} value={s}>
                  {s === "Anguillara" ? "Anguillara Sabazia" : s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <button className="btn-primary mt-6 w-full" disabled={busy}>
        {busy ? "Accesso in corso…" : "Entra"}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-night-900/45">
        Solo studenti del Vian, di Bracciano o di Anguillara Sabazia: nome, classe e sede,
        nient'altro — nessuna password, nessun indirizzo email.
      </p>
    </form>
  );
}

export function RepLoginCard({ onSuccess }: { onSuccess?: () => void }) {
  const { repLogin } = useAuth();
  const { push } = useToast();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await repLogin(pin);
      push("success", "Accesso rappresentanti effettuato.");
      onSuccess?.();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "PIN errato.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-700">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Accesso rappresentanti
          </h2>
          <p className="text-sm text-night-900/55">Inserisci il PIN d'istituto.</p>
        </div>
      </div>
      <label className="label" htmlFor="rep-pin">
        PIN
      </label>
      <input
        id="rep-pin"
        type="password"
        className="input"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="••••••••"
        required
        maxLength={128}
        autoComplete="off"
      />
      <button className="btn-gold mt-6 w-full" disabled={busy}>
        <KeyRound className="h-4 w-4" />
        {busy ? "Verifica…" : "Entra nell'area riservata"}
      </button>
    </form>
  );
}
