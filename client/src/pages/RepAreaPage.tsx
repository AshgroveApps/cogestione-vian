import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Check,
  ClipboardList,
  Download,
  Plus,
  Settings2,
  Trash2,
  Users,
  X,
  BarChart3,
} from "lucide-react";
import { api } from "../lib/api";
import type { AdminBooking, Course, CourseStatus, EventSettings } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../lib/hooks";
import { RepLoginCard } from "../components/AuthCards";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import StatsCharts from "../components/StatsCharts";
import { formatFull, formatRange, fromLocalInputValue, toLocalInputValue } from "../lib/format";

type Tab = "pending" | "all" | "create" | "bookings" | "settings" | "analytics";

export default function RepAreaPage() {
  useDocumentTitle("Area rappresentanti");
  const { user } = useAuth();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("pending");
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Course | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bookingsFor, setBookingsFor] = useState<Course | null>(null);
  const [bookingsList, setBookingsList] = useState<AdminBooking[] | null>(null);

  const load = useCallback(() => {
    api
      .get<{ courses: Course[] }>("/api/courses")
      .then((d) => setCourses(d.courses))
      .catch(() => setCourses([]));
    api
      .get<EventSettings>("/api/settings")
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  useEffect(() => {
    if (user?.role === "rep") load();
  }, [user, load]);

  const review = async (course: Course, action: "approve" | "reject", note?: string) => {
    setBusyId(course.id);
    try {
      await api.patch(`/api/courses/${course.id}/review`, { action, note });
      push(
        "success",
        action === "approve" ? `«${course.title}» approvato.` : `«${course.title}» non approvato.`
      );
      setRejectTarget(null);
      setRejectNote("");
      load();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Errore nell'operazione.");
    } finally {
      setBusyId(null);
    }
  };

  const openBookings = async (course: Course) => {
    setBookingsFor(course);
    setBookingsList(null);
    try {
      const d = await api.get<{ bookings: AdminBooking[] }>(`/api/courses/${course.id}/bookings`);
      setBookingsList(d.bookings);
    } catch {
      setBookingsList([]);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      await api.del(`/api/bookings/${id}`);
      push("success", "Prenotazione eliminata.");
      if (bookingsFor) openBookings(bookingsFor);
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Errore nell'eliminazione.");
    }
  };

  if (!user || user.role !== "rep") {
    return (
      <div className="container-site max-w-xl py-14">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Area rappresentanti
          </h1>
          <p className="mt-3 text-night-900/60">
            Sezione riservata: accedi con il PIN d'istituto dei rappresentanti.
          </p>
        </div>
        <RepLoginCard />
      </div>
    );
  }

  const pending = (courses ?? []).filter((c) => c.status === "pending");
  const sorted = [...(courses ?? [])].sort((a, b) =>
    a.status === "pending" ? -1 : b.status === "pending" ? 1 : 0
  );

  return (
    <div className="container-site py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
        Area riservata
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Rappresentanti d'istituto
        </h1>
        <span className="chip bg-gold-500/15 text-gold-700">
          {pending.length} proposte in attesa
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          {
            label: "Da approvare",
            value: pending.length,
            tone: "text-amber-700",
          },
          {
            label: "Corsi totali",
            value: courses?.length ?? null,
            tone: "text-night-900",
          },
          {
            label: "Iscritti totali",
            value:
              courses === null
                ? null
                : courses.reduce((a, c) => a + c.booked, 0),
            tone: "text-emerald-700",
          },
          {
            label: "Posti ancora liberi",
            value:
              courses === null
                ? null
                : courses.filter((c) => c.status === "approved").reduce((a, c) => a + c.spotsLeft, 0),
            tone: "text-gold-700",
          },
        ].map((s) => (
          <div key={s.label} className="card flex min-w-[165px] items-center gap-3 px-4 py-3.5">
            <span className={`font-display text-3xl font-semibold tabular-nums ${s.tone}`}>
              {s.value === null ? "—" : s.value}
            </span>
            <span className="text-[11px] font-semibold uppercase leading-tight tracking-[0.12em] text-night-900/50">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-night-900/10 pb-px">
        {(
          [
            ["pending", "Da approvare", ClipboardList],
            ["all", "Tutti i corsi", Users],
            ["create", "Crea corso", Plus],
            ["bookings", "Iscrizioni", CalendarClock],
            ["analytics", "Statistiche", BarChart3],
            ["settings", "Impostazioni evento", Settings2],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === key
                ? "border-b-2 border-gold-500 text-night-900"
                : "text-night-900/50 hover:text-night-900"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a className="btn-outline !py-2 !text-xs" href="/api/rep/schedule.csv">
          <Download className="h-3.5 w-3.5" /> CSV giornata (tutti i corsi approvati)
        </a>
        <a className="btn-ghost !py-2 !text-xs" href="/api/rep/backup.json">
          <Download className="h-3.5 w-3.5" /> Backup JSON
        </a>
        <span className="text-xs text-night-900/40">
          Esportazioni riservate ai rappresentanti
        </span>
      </div>

      <div className="mt-8">
        {tab === "pending" && (
          <>
            {courses === null ? (
              <div className="space-y-3">
                <div className="skeleton h-28 w-full" />
                <div className="skeleton h-28 w-full" />
              </div>
            ) : pending.length === 0 ? (
              <div className="card px-6 py-14 text-center">
                <Check className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-3 font-display text-xl font-semibold">
                  Nessuna proposta da approvare
                </p>
                <p className="mt-1 text-sm text-night-900/55">
                  Controlla più tardi: le nuove proposte compariranno qui.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {pending.map((c) => (
                  <li key={c.id} className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill status={c.status} />
                          <span className="chip bg-paper-100 text-night-900/70">{c.category}</span>
                        </div>
                        <h3 className="mt-2 font-display text-xl font-semibold">{c.title}</h3>
                        <p className="mt-1 text-sm text-night-900/60">
                          {c.creatorName} ({c.creatorClass}
                          {c.creatorSede === "Anguillara" ? " · Anguillara" : ""}) · proposto il{" "}
                          {formatFull(c.createdAt)}
                        </p>
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-night-900/75">
                          {c.description}
                        </p>
                        <p className="mt-3 text-sm text-night-900/70">
                          {formatRange(c.startsAt, c.endsAt)} · Aula {c.room} ·{" "}
                          {c.sede === "Anguillara" ? "Anguillara" : "Bracciano"} ·{" "}
                          {c.capacity} posti
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          className="btn-gold"
                          disabled={busyId === c.id}
                          onClick={() => review(c, "approve")}
                        >
                          <Check className="h-4 w-4" /> Approva
                        </button>
                        <button
                          className="btn-danger"
                          disabled={busyId === c.id}
                          onClick={() => {
                            setRejectTarget(c);
                            setRejectNote("");
                          }}
                        >
                          <X className="h-4 w-4" /> Rifiuta
                        </button>
                        <Link to={`/corsi/${c.id}`} className="btn-ghost !text-xs">
                          Anteprima
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "all" &&
          (sorted.length === 0 ? (
            <div className="card px-6 py-14 text-center text-night-900/60">
              Nessun corso presente.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-night-900/10 bg-white shadow-soft">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-night-900/10 bg-paper-100/70 text-xs uppercase tracking-wide text-night-900/55">
                  <tr>
                    <th className="px-4 py-3">Corso</th>
                    <th className="px-4 py-3">Stato</th>
                    <th className="px-4 py-3">Relatore</th>
                    <th className="px-4 py-3">Iscritti</th>
                    <th className="px-4 py-3">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-night-900/10">
                  {sorted.map((c) => (
                    <tr key={c.id} className="hover:bg-paper-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/corsi/${c.id}`}
                          className="font-semibold hover:text-gold-700"
                        >
                          {c.title}
                        </Link>
                        <p className="text-xs text-night-900/50">{c.category} · Aula {c.room} · {c.sede === "Anguillara" ? "Anguillara" : "Bracciano"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-night-900/70">
                        {c.creatorName} ({c.creatorClass}
                        {c.creatorSede === "Anguillara" ? " · Anguillara" : ""})
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {c.booked}/{c.capacity}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {c.status === "pending" && (
                            <>
                              <button
                                className="btn-gold !px-3 !py-1.5 !text-xs"
                                disabled={busyId === c.id}
                                onClick={() => review(c, "approve")}
                              >
                                Approva
                              </button>
                              <button
                                className="btn-danger !px-3 !py-1.5 !text-xs"
                                disabled={busyId === c.id}
                                onClick={() => {
                                  setRejectTarget(c);
                                  setRejectNote("");
                                }}
                              >
                                Rifiuta
                              </button>
                            </>
                          )}
                          <button
                            className="btn-outline !px-3 !py-1.5 !text-xs"
                            onClick={() => {
                              setTab("bookings");
                              openBookings(c);
                            }}
                          >
                            Iscritti
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "create" && (
          <CreateCourseForm
            onCreated={() => {
              setTab("all");
              load();
            }}
          />
        )}

        {tab === "bookings" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-semibold">Scegli un corso</h2>
              <ul className="mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {(courses ?? [])
                  .filter((c) => c.status !== "pending")
                  .map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => openBookings(c)}
                        className={`card flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:border-gold-500/40 ${
                          bookingsFor?.id === c.id ? "border-gold-500/60 bg-gold-500/5" : ""
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{c.title}</span>
                          <span className="block text-xs text-night-900/50">
                            {c.booked}/{c.capacity} iscritti
                          </span>
                        </span>
                        <Download className="h-4 w-4 shrink-0 text-night-900/40" />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="card p-5">
              {!bookingsFor ? (
                <p className="py-12 text-center text-sm text-night-900/55">
                  Seleziona un corso per vedere la lista degli iscritti ed esportarla in CSV.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{bookingsFor.title}</h3>
                      <p className="text-xs text-night-900/50">
                        {bookingsList === null
                          ? "Caricamento…"
                          : `${bookingsList.length} iscritti`}
                      </p>
                    </div>
                    <a
                      className="btn-outline !py-2 !text-xs"
                      href={`/api/courses/${bookingsFor.id}/bookings.csv`}
                    >
                      <Download className="h-3.5 w-3.5" /> Esporta CSV
                    </a>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-night-900/50">
                        <tr className="border-b border-night-900/10">
                          <th className="py-2 pr-3">Nome</th>
                          <th className="py-2 pr-3">Classe</th>
                          <th className="py-2 pr-3">Sede</th>
                          <th className="py-2 pr-3">IP</th>
                          <th className="py-2 pr-3">Data</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-night-900/10">
                        {bookingsList === null ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-night-900/45">
                              Caricamento iscritti…
                            </td>
                          </tr>
                        ) : bookingsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-night-900/45">
                              Nessun iscritto per ora.
                            </td>
                          </tr>
                        ) : (
                          bookingsList.map((b) => (
                            <tr key={b.id}>
                              <td className="py-2.5 pr-3 font-medium">{b.studentName}</td>
                              <td className="py-2.5 pr-3">{b.studentClass}</td>
                              <td className="py-2.5 pr-3">
                                {b.studentSede === "Anguillara" ? "Anguillara" : "Bracciano"}
                              </td>
                              <td className="py-2.5 pr-3 font-mono text-xs text-night-900/55">
                                {b.ip || "—"}
                              </td>
                              <td className="py-2.5 text-night-900/55">
                                {formatFull(b.createdAt)}
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  className="rounded-lg p-1.5 text-night-900/40 transition hover:bg-rose-50 hover:text-rose-600"
                                  title="Elimina questa prenotazione"
                                  onClick={() => deleteBooking(b.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "settings" && settings && <SettingsForm settings={settings} onSaved={load} />}
        {tab === "settings" && !settings && (
          <div className="skeleton h-64 w-full" />
        )}

        {tab === "analytics" && courses && (
          <div>
            <h2 className="mb-6 font-display text-2xl font-semibold">Statistiche della cogestione</h2>
            <StatsCharts
              categoryData={CATEGORIES.map((cat) => ({
                name: cat,
                value: courses.filter((c) => c.category === cat).length,
              }))}
              bookingData={courses
                .filter((c) => c.status === "approved")
                .slice(0, 10)
                .map((c) => ({
                  name: c.title.substring(0, 20) + (c.title.length > 20 ? "..." : ""),
                  bookings: c.booked || 0,
                  capacity: c.capacity,
                }))}
            />
          </div>
        )}
        {tab === "analytics" && !courses && (
          <div className="skeleton h-64 w-full" />
        )}
      </div>

      <Modal
        title="Rifiuta la proposta"
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
      >
        <p className="text-sm text-night-900/70">
          Stai rifiutando <strong>{rejectTarget?.title}</strong>. Il motivo verrà mostrato al
          relatore nell'area personale.
        </p>
        <label className="label mt-4" htmlFor="reject-note">
          Motivo (facoltativo)
        </label>
        <textarea
          id="reject-note"
          className="input min-h-[100px]"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          maxLength={500}
          placeholder="Es. Orario incompatibile con lezioni o troppo simile a un altro corso."
        />
        <div className="mt-5 flex gap-2">
          <button
            className="btn-danger flex-1"
            disabled={!rejectTarget || busyId === rejectTarget.id}
            onClick={() => rejectTarget && review(rejectTarget, "reject", rejectNote)}
          >
            Conferma rifiuto
          </button>
          <button className="btn-ghost" onClick={() => setRejectTarget(null)}>
            Annulla
          </button>
        </div>
      </Modal>
    </div>
  );
}

function SettingsForm({
  settings,
  onSaved,
}: {
  settings: EventSettings;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [form, setForm] = useState({
    eventTitle: settings.eventTitle,
    eventLocation: settings.eventLocation,
    eventDescription: settings.eventDescription,
  });
  const [sedi, setSedi] = useState(() => {
    const out: Record<string, { eventDate: string; bookingOpensAt: string; bookingClosesAt: string }> = {};
    for (const s of ["Bracciano", "Anguillara"]) {
      const st = settings.sedi?.[s];
      out[s] = {
        eventDate: toLocalInputValue(st?.eventDate ?? null),
        bookingOpensAt: toLocalInputValue(st?.bookingOpensAt ?? null),
        bookingClosesAt: toLocalInputValue(st?.bookingClosesAt ?? null),
      };
    }
    return out;
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setSede = (sede: string, k: string, v: string) =>
    setSedi((f) => ({ ...f, [sede]: { ...f[sede], [k]: v } }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put("/api/settings", {
        eventTitle: form.eventTitle,
        eventLocation: form.eventLocation,
        eventDescription: form.eventDescription,
        sedi: {
          Bracciano: {
            eventDate: fromLocalInputValue(sedi.Bracciano.eventDate),
            bookingOpensAt: fromLocalInputValue(sedi.Bracciano.bookingOpensAt),
            bookingClosesAt: fromLocalInputValue(sedi.Bracciano.bookingClosesAt),
          },
          Anguillara: {
            eventDate: fromLocalInputValue(sedi.Anguillara.eventDate),
            bookingOpensAt: fromLocalInputValue(sedi.Anguillara.bookingOpensAt),
            bookingClosesAt: fromLocalInputValue(sedi.Anguillara.bookingClosesAt),
          },
        },
      });
      push("success", "Impostazioni aggiornate per entrambe le sedi.");
      onSaved();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Errore nel salvataggio.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-5 p-6 sm:p-8">
      <div>
        <label className="label" htmlFor="eventTitle">
          Titolo dell'evento
        </label>
        <input
          id="eventTitle"
          className="input"
          value={form.eventTitle}
          onChange={(e) => set("eventTitle", e.target.value)}
          minLength={3}
          maxLength={120}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="eventLocation">
          Luogo
        </label>
        <input
          id="eventLocation"
          className="input"
          value={form.eventLocation}
          onChange={(e) => set("eventLocation", e.target.value)}
          maxLength={200}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="eventDescription">
          Descrizione (compare nella home)
        </label>
        <textarea
          id="eventDescription"
          className="input min-h-[110px]"
          value={form.eventDescription}
          onChange={(e) => set("eventDescription", e.target.value)}
          minLength={10}
          maxLength={2000}
          required
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {(["Bracciano", "Anguillara"] as const).map((sede) => {
          const label = sede === "Anguillara" ? "Anguillara Sabazia" : "Bracciano";
          const st = settings.sedi?.[sede];
          return (
            <div
              key={sede}
              className="rounded-2xl border border-night-900/10 bg-paper-50 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">Cogestione di {label}</h3>
                <span
                  className={`chip ${st?.bookingOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {st?.bookingOpen ? "Prenotazioni APERTE" : "Prenotazioni CHIUSE"}
                </span>
              </div>
              <div>
                <label className="label" htmlFor={`ev-${sede}`}>
                  Data e ora della cogestione
                </label>
                <input
                  id={`ev-${sede}`}
                  type="datetime-local"
                  className="input"
                  value={sedi[sede].eventDate}
                  onChange={(e) => setSede(sede, "eventDate", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor={`bo-${sede}`}>
                    Apertura prenotazioni
                  </label>
                  <input
                    id={`bo-${sede}`}
                    type="datetime-local"
                    className="input"
                    value={sedi[sede].bookingOpensAt}
                    onChange={(e) => setSede(sede, "bookingOpensAt", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`bc-${sede}`}>
                    Chiusura prenotazioni
                  </label>
                  <input
                    id={`bc-${sede}`}
                    type="datetime-local"
                    className="input"
                    value={sedi[sede].bookingClosesAt}
                    onChange={(e) => setSede(sede, "bookingClosesAt", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs leading-relaxed text-night-900/55">
                Le due cogestioni sono separate: data e finestra di questa sede non
                influenzano l'altra.
              </p>
            </div>
          );
        })}
      </div>
      <button className="btn-gold" disabled={busy}>
        <Settings2 className="h-4 w-4" />
        {busy ? "Salvataggio…" : "Salva impostazioni"}
      </button>
    </form>
  );
}

function CreateCourseForm({ onCreated }: { onCreated: () => void }) {
  const { push } = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0] as string,
    room: "",
    sede: "Bracciano",
    capacity: "20",
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
      push("success", "Corso creato ed approvato: è già visibile nel catalogo.");
      onCreated();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Errore nella creazione.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-5 p-6 sm:p-8">
      <div>
        <p className="rounded-xl bg-gold-500/10 px-4 py-3 text-xs leading-relaxed text-gold-800">
          I corsi creati qui dai rappresentanti vengono <strong>approvati subito</strong> e
          compaiono nel catalogo. Gli stessi controlli di aula/orario valgono anche per voi.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="c-title">
          Titolo del corso
        </label>
        <input
          id="c-title"
          className="input"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          minLength={3}
          maxLength={120}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="c-description">
          Descrizione
        </label>
        <textarea
          id="c-description"
          className="input min-h-[120px]"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          minLength={20}
          maxLength={2000}
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-category">
            Categoria
          </label>
          <select
            id="c-category"
            className="input"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="c-room">
            Aula
          </label>
          <input
            id="c-room"
            className="input"
            value={form.room}
            onChange={(e) => set("room", e.target.value)}
            maxLength={60}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="c-sede">
            Sede del corso
          </label>
          <select
            id="c-sede"
            className="input"
            value={form.sede}
            onChange={(e) => set("sede", e.target.value)}
          >
            <option value="Bracciano">Bracciano</option>
            <option value="Anguillara">Anguillara Sabazia</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="c-capacity">
            Posti disponibili
          </label>
          <input
            id="c-capacity"
            type="number"
            min={1}
            max={60}
            className="input"
            value={form.capacity}
            onChange={(e) => set("capacity", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="c-startsAt">
            Inizio (data e ora)
          </label>
          <input
            id="c-startsAt"
            type="datetime-local"
            className="input"
            value={form.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="c-endsAt">
            Fine (data e ora)
          </label>
          <input
            id="c-endsAt"
            type="datetime-local"
            className="input"
            value={form.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
            required
          />
        </div>
      </div>
      <div className="border-t border-night-900/10 pt-5">
        <button className="btn-gold" disabled={busy}>
          <Plus className="h-4 w-4" />
          {busy ? "Creazione…" : "Crea e approva il corso"}
        </button>
      </div>
    </form>
  );
}
