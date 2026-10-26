import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Users,
  UserRound,
  BookOpenCheck,
  Clock,
  AlertCircle,
} from "lucide-react";
import { api } from "../lib/api";
import type { Course } from "../lib/types";
import { CATEGORY_STYLES } from "../lib/types";
import { useDocumentTitle } from "../lib/hooks";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatFull, formatRange } from "../lib/format";
import { categoryIcon } from "../lib/categoryIcons";
import CourseCard from "../components/CourseCard";
import Reveal from "../components/Reveal";
import { SkeletonLines } from "../components/Skeleton";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { push } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [all, setAll] = useState<Course[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(false);

  useDocumentTitle(course?.title ?? "Corso");

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<{ course: Course }>(`/api/courses/${id}`)
      .then((d) => setCourse(d.course))
      .catch(() => setNotFound(true));
    api
      .get<{ courses: Course[] }>("/api/courses")
      .then((d) => setAll(d.courses))
      .catch(() => setAll([]));
    if (user) {
      api
        .get<{ bookings: { course: { id: string } }[] }>("/api/bookings/mine")
        .then((d) => setBooked(d.bookings.some((b) => b.course.id === id)))
        .catch(() => {});
    } else {
      setBooked(false);
    }
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  const book = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await api.post("/api/bookings", { courseId: id });
      push("success", "Prenotazione confermata! Ci vediamo al corso.");
      load();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Errore nella prenotazione.");
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="container-site py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Corso non trovato</h1>
        <p className="mt-2 text-night-900/60">Forse è stato rimosso o non è ancora approvato.</p>
        <Link to="/corsi" className="btn-primary mt-6">
          Torna al catalogo
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container-site max-w-3xl py-12">
        <SkeletonLines rows={8} />
      </div>
    );
  }

  const cat = CATEGORY_STYLES[course.category] ?? CATEGORY_STYLES.Altro;
  const Icon = categoryIcon(course.category);
  const full = course.spotsLeft <= 0;
  const fillPct = Math.min(100, Math.round((course.booked / course.capacity) * 100));
  const others = all.filter((c) => c.id !== course.id).slice(0, 3);

  return (
    <div>
      {/* Header band */}
      <div className="relative overflow-hidden bg-night-950 text-paper-50">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 100% at 30% 0%, black, transparent)",
          }}
        />
        <div aria-hidden className="orb orb-gold -right-16 -top-24 h-[320px] w-[320px]" />
        <div className="container-site relative max-w-4xl py-10 sm:py-14">
          <Link
            to="/corsi"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-paper-100/60 hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" /> Tutti i corsi
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className={`chip ${cat.bg} ${cat.text}`}>
              <Icon className="h-3.5 w-3.5" /> {course.category}
            </span>
            <span className="chip border border-white/15 bg-white/5 text-paper-100/75">
              <Clock className="h-3.5 w-3.5" /> {formatRange(course.startsAt, course.endsAt)}
            </span>
            <span className="chip border border-white/15 bg-white/5 text-paper-100/75">
              <MapPin className="h-3.5 w-3.5" /> Aula {course.room} · Sede di{" "}
              {course.sede === "Anguillara" ? "Anguillara Sabazia" : "Bracciano"}
            </span>
            {booked && (
              <span className="chip bg-emerald-500/15 text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Sei iscritto/a
              </span>
            )}
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            {course.title}
          </h1>
          <p className="mt-3 text-paper-100/60">
            Proposto da {course.creatorName} · classe {course.creatorClass}
            {course.creatorSede
              ? ` · sede di ${course.creatorSede === "Anguillara" ? "Anguillara Sabazia" : course.creatorSede}`
              : ""}
          </p>
        </div>
      </div>

      <div className="container-site max-w-4xl py-10 sm:py-14">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="card p-6 md:col-span-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-night-900/50">
              <BookOpenCheck className="h-4 w-4 text-gold-600" /> Descrizione
            </h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-night-900/80">
              {course.description}
            </p>
            <div className="mt-6 grid gap-3 border-t border-night-900/10 pt-5 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 text-sm">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                <span>
                  <span className="block font-semibold">{formatRange(course.startsAt, course.endsAt)}</span>
                  <span className="text-night-900/55">{formatFull(course.startsAt).split(",")[0]}</span>
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                <span>
                  <span className="block font-semibold">Aula {course.room}</span>
                  <span className="text-night-900/55">
                    Sede di {course.sede === "Anguillara" ? "Anguillara Sabazia" : "Bracciano"},{" "}
                    {course.sede === "Anguillara"
                      ? "Via della Mainella"
                      : "Largo Cesare Pavese 1"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-night-900/50">
                  Posti liberi
                </h2>
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {course.spotsLeft}
                  <span className="text-base text-night-900/40">/{course.capacity}</span>
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-paper-200">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    full ? "bg-rose-500" : "bg-gradient-to-r from-gold-400 to-gold-600"
                  }`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-night-900/50">
                {course.booked} di {course.capacity} posti già prenotati
              </p>

              <div className="mt-5">
                {!user ? (
                  <Link to="/area-personale" className="btn-primary w-full">
                    <UserRound className="h-4 w-4" /> Accedi per prenotare
                  </Link>
                ) : booked ? (
                  <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    Prenotazione attiva. Puoi annullarla dall'area personale finché le
                    prenotazioni restano aperte.
                  </p>
                ) : user && user.sede !== course.sede ? (
                  <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    Questo corso si tiene nella sede di{" "}
                    {course.sede === "Anguillara" ? "Anguillara Sabazia" : "Bracciano"}: le
                    prenotazioni sono riservate agli studenti di quella sede.
                  </p>
                ) : !course.bookingOpen ? (
                  <p className="flex items-start gap-2 rounded-xl bg-paper-100 px-4 py-3 text-sm text-night-900/60">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    Le prenotazioni per questo corso sono ancora chiuse.
                  </p>
                ) : full ? (
                  <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    Posti esauriti.
                  </p>
                ) : (
                  <button onClick={book} disabled={busy} className="btn-gold w-full">
                    {busy ? "Prenotazione…" : "Prenota il tuo posto"}
                  </button>
                )}
              </div>
            </div>

            <div className="card bg-paper-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-night-900/50">
                Info pratiche
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-night-900/70">
                <li>· Arriva 5 minuti prima dell'inizio.</li>
                <li>· Un posto per studente per corso.</li>
                <li>· Porta carta e penna se serve.</li>
                <li>· La lezione si tiene in sede di{" "}
                  {course.sede === "Anguillara" ? "Anguillara Sabazia" : "Bracciano"}.</li>
              </ul>
            </div>
          </div>
        </div>

        {others.length > 0 && (
          <section className="mt-16">
            <Reveal>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Altro da non perdere</p>
                  <h2 className="mt-1.5 font-display text-2xl font-semibold">Altri corsi</h2>
                </div>
                <Link to="/corsi" className="btn-ghost !text-xs">
                  Tutti i corsi
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((c, i) => (
                <Reveal key={c.id} delay={i * 90}>
                  <CourseCard course={c} viewerSede={user?.sede ?? null} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
