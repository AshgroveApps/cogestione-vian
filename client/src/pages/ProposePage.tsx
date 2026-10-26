import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Send, Info } from "lucide-react";
import { api } from "../lib/api";
import { CATEGORIES } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../lib/hooks";
import { LoginCard } from "../components/AuthCards";

export default function ProposePage() {
  useDocumentTitle("Proponi un corso");
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0] as string,
    room: "",
    sede: (user?.sede as string) ?? "Bracciano",
    capacity: "15",
    startsAt: "",
    endsAt: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/courses", {
        title: form.title,
        description: form.description,
        category: form.category,
        room: form.room,
        sede: form.sede,
        capacity: Number(form.capacity),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      });
      push("success", "Corso proposto! I rappresentanti lo esamineranno a breve.");
      navigate("/area-personale");
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Errore nell'invio.");
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="container-site max-w-xl py-14">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Proponi un corso
          </h1>
          <p className="mt-3 text-night-900/60">
            Per proporre un corso accedi con nome e classe.
          </p>
        </div>
        <LoginCard />
      </div>
    );
  }

  return (
    <div className="container-site max-w-3xl py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
        Diventa docente
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Proponi il tuo corso
      </h1>
      <p className="mt-4 max-w-2xl text-night-900/65">
        Racconta cosa vuoi insegnare ai tuoi compagni. La proposta verrà esaminata dai
        rappresentanti di istituto e, una volta approvata, apparirà nel catalogo.
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Stai proponendo come <strong>{user.name}</strong> ({user.className}
          {user.sede ? ` · sede di ${user.sede === "Anguillara" ? "Anguillara Sabazia" : user.sede}` : ""}
          ). Assicurati che i dati siano corretti: saranno quelli che compariranno come
          relatore. La cogestione copre tutto il Vian: puoi tenere il corso sia a Bracciano
          sia a Anguillara, scegliendo la sede nel modulo.
        </p>
      </div>

      <form onSubmit={submit} className="card mt-8 space-y-5 p-6 sm:p-8">
        <div>
          <label className="label" htmlFor="title">
            Titolo del corso
          </label>
          <input
            id="title"
            className="input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Es. Introduzione al calcolo delle probabilità"
            minLength={3}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Descrizione
          </label>
          <textarea
            id="description"
            className="input min-h-[140px] resize-y"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Di cosa parlerai? A chi è rivolto? Serve qualche prerequisito?"
            minLength={20}
            maxLength={2000}
            required
          />
          <p className="mt-1 text-xs text-night-900/40">
            {form.description.length}/2000 caratteri (min. 20)
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">
              Categoria
            </label>
            <select
              id="category"
              className="input"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="room">
              Aula
            </label>
            <input
              id="room"
              className="input"
              value={form.room}
              onChange={(e) => set("room", e.target.value)}
              placeholder="Es. 12 o Laboratorio info"
              maxLength={60}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="sede">
              Sede del corso
            </label>
            <select
              id="sede"
              className="input"
              value={form.sede}
              onChange={(e) => set("sede", e.target.value)}
            >
              <option value="Bracciano">Bracciano — Largo Cesare Pavese, 1</option>
              <option value="Anguillara">Anguillara Sabazia — Via della Mainella</option>
            </select>
            <p className="mt-1 text-xs text-night-900/40">
              Indica in quale sede terrai la lezione.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="startsAt">
              Inizio (data e ora)
            </label>
            <input
              id="startsAt"
              type="datetime-local"
              className="input"
              value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="endsAt">
              Fine (data e ora)
            </label>
            <input
              id="endsAt"
              type="datetime-local"
              className="input"
              value={form.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="capacity">
            Posti disponibili
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            max={60}
            className="input sm:max-w-[180px]"
            value={form.capacity}
            onChange={(e) => set("capacity", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-night-900/10 pt-5">
          <button className="btn-gold" disabled={busy}>
            <Send className="h-4 w-4" />
            {busy ? "Invio in corso…" : "Invia la proposta"}
          </button>
          <Link to="/corsi" className="btn-ghost">
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}
