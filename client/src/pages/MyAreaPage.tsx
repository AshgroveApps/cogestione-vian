import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, FileText, Trash2 } from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { Booking, Course } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../lib/hooks";
import { LoginCard } from "../components/AuthCards";
import StatusPill from "../components/StatusPill";
import { formatRange } from "../lib/format";

export default function MyAreaPage() {
  useDocumentTitle("Area personale");
  const { user } = useAuth();
  const { push } = useToast();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [proposals, setProposals] = useState<Course[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    api
      .get<{ bookings: Booking[] }>("/api/bookings/mine")
      .then((d) => setBookings(d.bookings))
      .catch(() => setBookings([]));
    api
      .get<{ courses: Course[] }>("/api/courses/mine")
      .then((d) => setProposals(d.courses))
      .catch(() => setProposals([]));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id: string) => {
    setBusyId(id);
    try {
      await api.del(`/api/bookings/${id}`);
      push("success", "Prenotazione annullata.");
      load();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Impossibile annullare la prenotazione.";
      push("error", msg);
    } finally {
      setBusyId(null);
    }
  };

  if (!user) {
    return (
      <div className="container-site max-w-xl py-14">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Area personale</h1>
          <p className="mt-3 text-night-900/60">
            Accedi con nome e classe per vedere le tue prenotazioni e proposte.
          </p>
        </div>
        <LoginCard onSuccess={load} />
      </div>
    );
  }

  return (
    <div className="container-site py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
        Bentornato/a
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {user.name}
        {user.className ? <span className="text-night-900/35"> · {user.className}</span> : null}
        {user.sede ? (
          <span className="block text-lg font-normal text-night-900/45 sm:mt-1">
            sede di {user.sede === "Anguillara" ? "Anguillara Sabazia" : user.sede}
          </span>
        ) : null}
      </h1>

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          {
            k: "prenotazioni",
            label: "Prenotazioni attive",
            value: bookings?.length ?? null,
          },
          {
            k: "proposte",
            label: "Corsi proposti",
            value: proposals?.length ?? null,
          },
          {
            k: "approvati",
            label: "Corsi approvati",
            value:
              proposals === null
                ? null
                : proposals.filter((p) => p.status === "approved").length,
          },
        ].map((s) => (
          <div
            key={s.k}
            className="card flex min-w-[160px] items-center gap-3 px-4 py-3.5"
          >
            <span className="font-display text-3xl font-semibold tabular-nums text-gold-600">
              {s.value === null ? "—" : s.value}
            </span>
            <span className="text-[11px] font-semibold uppercase leading-tight tracking-[0.12em] text-night-900/50">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
            <CalendarCheck className="h-5 w-5 text-gold-600" /> Le mie prenotazioni
          </h2>
          {bookings === null ? (
            <div className="mt-4 space-y-3">
              <div className="skeleton h-24 w-full" />
              <div className="skeleton h-24 w-full" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="card mt-4 px-5 py-10 text-center">
              <p className="font-medium">Non hai ancora nessuna prenotazione.</p>
              <Link to="/corsi" className="btn-outline mt-4">
                Sfoglia i corsi
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {bookings.map((b) => (
                <li key={b.id} className="card flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/corsi/${b.course.id}`}
                      className="font-display text-lg font-semibold hover:text-gold-700"
                    >
                      {b.course.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-night-900/60">
                      {formatRange(b.course.startsAt, b.course.endsAt)} · Aula {b.course.room}
                    </p>
                  </div>
                  <button
                    className="btn-danger !py-2 !text-xs"
                    disabled={busyId === b.id}
                    onClick={() => cancel(b.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {busyId === b.id ? "Annullamento…" : "Annulla"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
            <FileText className="h-5 w-5 text-gold-600" /> Le mie proposte
          </h2>
          <div className="mt-3">
            <Link to="/proponi" className="btn-gold">
              Proponi un nuovo corso
            </Link>
          </div>
          {proposals === null ? (
            <div className="mt-4 space-y-3">
              <div className="skeleton h-24 w-full" />
              <div className="skeleton h-24 w-full" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="card mt-4 px-5 py-10 text-center">
              <p className="font-medium">Non hai ancora proposto nessun corso.</p>
              <p className="mt-1 text-sm text-night-900/55">
                Hai un'idea? Diventa docente per un giorno.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {proposals.map((c) => (
                <li key={c.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      {c.status === "approved" ? (
                        <Link
                          to={`/corsi/${c.id}`}
                          className="font-display text-lg font-semibold hover:text-gold-700"
                        >
                          {c.title}
                        </Link>
                      ) : (
                        <p className="font-display text-lg font-semibold">{c.title}</p>
                      )}
                      <p className="mt-0.5 text-sm text-night-900/60">
                        {formatRange(c.startsAt, c.endsAt)} · Aula {c.room} · {c.booked}/
                        {c.capacity} iscritti
                      </p>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                  {c.status === "rejected" && c.reviewNote && (
                    <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
                      <strong>Motivo:</strong> {c.reviewNote}
                    </p>
                  )}
                  {c.status === "pending" && (
                    <p className="mt-3 text-xs text-night-900/50">
                      In attesa di approvazione da parte dei rappresentanti.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
