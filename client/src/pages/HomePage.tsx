import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  CheckCheck,
  Compass,
  GraduationCap,
  Lightbulb,
  MapPin,
  Quote,
  School,
  Users,
} from "lucide-react";
import { api } from "../lib/api";
import type { Course, EventSettings } from "../lib/types";
import { useDocumentTitle } from "../lib/hooks";
import { useAuth } from "../context/AuthContext";
import CourseCard from "../components/CourseCard";
import Reveal from "../components/Reveal";
import { SkeletonGrid } from "../components/Skeleton";
import { formatShort } from "../lib/format";

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return useMemo(() => {
    if (!target) return null;
    const diff = new Date(target).getTime() - now;
    if (Number.isNaN(diff)) return null;
    const past = diff <= 0;
    const s = Math.max(0, Math.floor(diff / 1000));
    return {
      past,
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    };
  }, [target, now]);
}

function CountdownBlock({
  label,
  value,
  small,
}: {
  label: string;
  value: number;
  small?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      className={
        small
          ? "min-w-[54px] flex-1 rounded-xl border border-white/15 bg-white/5 px-2 py-2 text-center backdrop-blur-md"
          : "min-w-[74px] rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-center backdrop-blur-md sm:min-w-[88px] sm:px-4 sm:py-4"
      }
    >
      <motion.div
        key={value}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`font-display font-semibold tabular-nums text-gold-400 ${
          small ? "text-xl" : "text-3xl sm:text-4xl"
        }`}
      >
        {String(value).padStart(2, "0")}
      </motion.div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-100/55">
        {label}
      </div>
    </motion.div>
  );
}

const STEPS = [
  {
    step: "01",
    icon: Lightbulb,
    title: "Proponi il tuo corso",
    text: "Accedi con nome, classe e sede — che tu sia di Bracciano o di Anguillara — e descrivi il corso che vuoi tenere: titolo, programma, aula, sede, orario e posti disponibili.",
  },
  {
    step: "02",
    icon: CheckCheck,
    title: "I rappresentanti approvano",
    text: "I rappresentanti di istituto esaminano ogni proposta in un'area riservata. Se viene approvata, il corso entra nel catalogo e diventa visibile a tutti.",
  },
  {
    step: "03",
    icon: CalendarDays,
    title: "Prenota e partecipa",
    text: "Al momento giusto si aprono le prenotazioni: scegli i corsi, prenota il tuo posto fino a esaurimento e il giorno della cogestione segui le lezioni dei tuoi compagni, nella sede indicata in ogni scheda.",
  },
];

const SEDI = [
  {
    name: "Bracciano",
    role: "Sede centrale",
    address: "Largo Cesare Pavese, 1 — 00062 Bracciano (RM)",
    note: "Sede centrale dell'istituto: anche qui si tengono i corsi della cogestione.",
    map: "https://www.google.com/maps/search/?api=1&query=Largo+Cesare+Pavese+1+00062+Bracciano",
    highlight: true,
  },
  {
    name: "Anguillara Sabazia",
    role: "Sede associata",
    address: "Via della Mainella, s.n.c. — 00061 Anguillara Sabazia (RM)",
    note: "Anche gli studenti di Anguillara propongono, tengono e seguono corsi della cogestione.",
    map: "https://www.google.com/maps/search/?api=1&query=Via+della+Mainella+00061+Anguillara+Sabazia",
    highlight: true,
  },
];

const FAQ = [
  {
    q: "Chi può proporre un corso?",
    a: "Qualunque studente del Liceo «Ignazio Vian», sia della sede di Bracciano sia di Anguillara Sabazia. Basta accedere con nome, classe e sede.",
  },
  {
    q: "Come faccio a sapere se il mio corso è stato approvato?",
    a: "Trovi lo stato di ogni proposta nell'Area personale: se i rappresentanti la rifiutano, trovi anche il motivo. I corsi approvati compaiono subito nel catalogo.",
  },
  {
    q: "Quando si aprono le prenotazioni?",
    a: "Ogni sede ha la sua finestra di prenotazione: lo stato (aperte/chiuse) è indicato nella home, nel catalogo e su ogni scheda corso.",
  },
  {
    q: "Posso prenotare un corso dell'altra sede?",
    a: "No: le due cogestioni sono separate. Gli studenti di Bracciano prenotano i corsi di Bracciano e quelli di Anguillara quelli di Anguillara.",
  },
  {
    q: "Quanti corsi posso prenotare?",
    a: "Puoi prenotare più corsi, ma un solo posto per ciascun corso, fino a esaurimento dei posti. Finché le prenotazioni restano aperte puoi annullare e cambiare idea.",
  },
];

export default function HomePage() {
  useDocumentTitle("Home");
  const { user } = useAuth();
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [courses, setCourses] = useState<Course[] | null>(null);

  useEffect(() => {
    api.get<EventSettings>("/api/settings").then(setSettings).catch(() => setSettings(null));
    api
      .get<{ courses: Course[] }>("/api/courses")
      .then((d) => setCourses(d.courses))
      .catch(() => setCourses([]));
  }, []);

  const cdBracciano = useCountdown(settings?.sedi?.Bracciano?.eventDate ?? null);
  const cdAnguillara = useCountdown(settings?.sedi?.Anguillara?.eventDate ?? null);
  const approved = courses ?? [];
  const featured = approved.slice(0, 6);
  const totalSpots = approved.reduce((a, c) => a + c.spotsLeft, 0);
  const totalBooked = approved.reduce((a, c) => a + c.booked, 0);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-night-950 text-paper-50">
        <div aria-hidden className="orb orb-gold -left-24 -top-32 h-[420px] w-[420px]" />
        <div aria-hidden className="orb orb-teal right-[-120px] top-10 h-[380px] w-[380px]" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-paper-50"
        />

        <div className="container-site relative py-20 sm:py-28 lg:py-36">
          <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-300 animate-fadeUp">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400 pulse-dot" />
            Liceo Vian · Bracciano e Anguillara
          </p>

          <h1 className="max-w-4xl font-display text-[2.75rem] font-semibold leading-[1.04] tracking-tight animate-fadeUp sm:text-6xl lg:text-[5rem]">
            Le aule cambiano padroni.
            <span className="mt-2 block italic gradient-text">
              Gli studenti diventano docenti.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-paper-100/75 animate-fadeUp sm:text-xl">
            {settings?.eventDescription ??
              "Un giorno in cui le aule del Vian cambiano padroni: gli studenti diventano docenti e tengono corsi per i loro compagni."}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3 animate-fadeUp">
            <Link to="/corsi" className="btn-gold btn-lg">
              Esplora i corsi <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/proponi"
              className="btn btn-lg border border-white/20 bg-white/5 !text-paper-50 hover:!bg-white/10"
            >
              Proponi un corso
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-paper-100/50 animate-fadeUp">
            <span className="inline-flex items-center gap-1.5">
              <School className="h-4 w-4 text-gold-500/70" /> Scuola dal 1967
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-gold-500/70" /> Classico · Scientifico ·
              Linguistico · Scienze Umane
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-gold-500/70" /> Progetto 100%
              studentesco
            </span>
          </div>

          {(settings?.sedi?.Bracciano?.eventDate || settings?.sedi?.Anguillara?.eventDate) && (
            <div className="mt-14 grid max-w-3xl gap-4 animate-fadeUp sm:grid-cols-2">
              {(
                [
                  ["Bracciano", settings?.sedi?.Bracciano, cdBracciano],
                  ["Anguillara Sabazia", settings?.sedi?.Anguillara, cdAnguillara],
                ] as const
              ).map(([sedeName, st, cd]) => (
                <div
                  key={sedeName}
                  className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-md"
                >
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-paper-100/55">
                    <CalendarDays className="h-3.5 w-3.5 text-gold-400" />
                    Cogestione di {sedeName}
                  </p>
                  {st?.eventDate ? (
                    <p className="mt-2 text-sm text-paper-100/75">
                      {cd && !cd.past
                        ? `Il ${formatShort(st.eventDate)}`
                        : `Tenutasi il ${formatShort(st.eventDate)}`}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-paper-100/55">Data da definire</p>
                  )}
                  {cd && !cd.past && (
                    <div className="mt-3 flex gap-2">
                      <CountdownBlock label="Giorni" value={cd.days} small />
                      <CountdownBlock label="Ore" value={cd.hours} small />
                      <CountdownBlock label="Min" value={cd.minutes} small />
                      <CountdownBlock label="Sec" value={cd.seconds} small />
                    </div>
                  )}
                  {st?.eventDate && st.bookingOpen && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                      Prenotazioni aperte
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="container-site relative z-10 -mt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: BookOpenText, label: "Corsi approvati", value: courses === null ? "—" : String(approved.length) },
            { icon: Users, label: "Iscritti finora", value: courses === null ? "—" : String(totalBooked) },
            { icon: CalendarDays, label: "Posti liberi", value: courses === null ? "—" : String(totalSpots) },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="card flex items-center gap-4 px-5 py-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-night-900 to-night-700 text-gold-400 shadow-soft">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-3xl font-semibold tabular-nums">{s.value}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-night-900/45">
                    {s.label}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COME FUNZIONA */}
      <section className="container-site mt-24">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Il meccanismo</p>
              <h2 className="section-title">Come funziona la cogestione</h2>
            </div>
            <Link to="/come-funziona" className="btn-outline">
              Regolamento completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="relative grid gap-5 md:grid-cols-3">
          <span
            aria-hidden
            className="absolute left-[16%] right-[16%] top-[54px] hidden h-px bg-gradient-to-r from-gold-500/0 via-gold-500/50 to-gold-500/0 md:block"
          />
          {STEPS.map((c, i) => (
            <Reveal key={c.step} delay={i * 120}>
              <div className="card card-hover relative h-full p-6">
                <span className="absolute right-5 top-4 font-display text-5xl font-semibold text-night-900/5">
                  {c.step}
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-night-950 shadow-[0_10px_24px_-10px_rgba(201,162,39,0.7)]">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-night-900/65">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SEDI */}
      <section className="mt-24 bg-white py-20 ring-1 ring-inset ring-night-900/10">
        <div className="container-site">
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <p className="eyebrow">Le sedi</p>
              <h2 className="section-title">Un istituto, due sedi, un solo progetto</h2>
              <p className="mt-4 text-night-900/65">
                Ogni sede organizza la propria giornata di cogestione, con data e prenotazioni
                dedicate: gli studenti di Bracciano e di Anguillara propongono e tengono i
                corsi nella propria sede.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            {SEDI.map((s, i) => (
              <Reveal key={s.name} delay={i * 120}>
                <article
                  className={`card card-hover relative flex h-full flex-col p-6 sm:p-7 ${
                    s.highlight ? "ring-1 ring-gold-500/40" : ""
                  }`}
                >
                  {s.highlight && (
                    <span className="chip absolute right-5 top-5 bg-gold-500/15 text-gold-700">
                      Cogestione qui
                    </span>
                  )}
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-night-900 text-gold-400">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-night-900/45">
                    {s.role}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold">{s.name}</h3>
                  <address className="mt-3 text-sm not-italic leading-relaxed text-night-900/70">
                    {s.address}
                  </address>
                  <p className="mt-3 text-sm leading-relaxed text-night-900/60">{s.note}</p>
                  {(() => {
                    const key = s.name.startsWith("Anguillara") ? "Anguillara" : "Bracciano";
                    const st = settings?.sedi?.[key];
                    return st?.eventDate ? (
                      <p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-night-900/5 px-3 py-1 text-xs font-semibold text-night-900/75">
                        <CalendarDays className="h-3.5 w-3.5 text-gold-600" />
                        Cogestione: {formatShort(st.eventDate)}
                      </p>
                    ) : null;
                  })()}
                  <a
                    href={s.map}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost mt-5 w-fit !px-3 !text-xs"
                  >
                    Apri in Maps <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="relative overflow-hidden bg-night-950 py-20 text-paper-50">
        <div aria-hidden className="orb orb-gold right-[-140px] top-[-80px] h-[360px] w-[360px]" />
        <div className="container-site relative">
          <Reveal>
            <figure className="mx-auto max-w-3xl text-center">
              <Quote className="mx-auto h-8 w-8 text-gold-500/70" />
              <blockquote className="mt-6 font-display text-2xl font-medium italic leading-snug text-paper-50 sm:text-3xl">
                «Non ho mai insegnato ai miei allievi, ho solo cercato di fornire le condizioni
                in cui possano imparare.»
              </blockquote>
              <figcaption className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
                Albert Einstein
              </figcaption>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-paper-100/55">
                È l'idea che sta dietro la cogestione: chi propone un corso impara mentre
                insegna, chi lo segue impara dai propri compagni.
              </p>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* CORSI IN EVIDENZA */}
      <section className="container-site mt-24">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Catalogo</p>
              <h2 className="section-title">Corsi in evidenza</h2>
            </div>
            <Link to="/corsi" className="btn-outline">
              Vedi tutti i corsi <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        {courses === null ? (
          <SkeletonGrid />
        ) : featured.length === 0 ? (
          <Reveal>
            <div className="card px-6 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-700">
                <Lightbulb className="h-7 w-7" />
              </span>
              <p className="mt-5 font-display text-2xl font-semibold">Ancora nessun corso approvato</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-night-900/60">
                Sii il primo/a a proporre un corso: dopo l'approvazione dei rappresentanti,
                apparirà qui nel catalogo.
              </p>
              <Link to="/proponi" className="btn-gold mt-6">
                Proponi un corso
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c, i) => (
              <Reveal key={c.id} delay={(i % 3) * 100}>
                <CourseCard course={c} viewerSede={user?.sede ?? null} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="container-site mt-24">
        <Reveal>
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow">Domande frequenti</p>
            <h2 className="section-title">Tutto quello che c'è da sapere</h2>
          </div>
        </Reveal>
        <div className="grid gap-3">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 70}>
              <details className="faq card group px-5 py-4 open:bg-white open:shadow-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-night-900">
                  {f.q}
                  <span className="faq-chevron shrink-0 rounded-full bg-night-900/5 p-1.5 text-night-900/60 transition-transform duration-300">
                    <ArrowRight className="h-4 w-4 -rotate-90" />
                  </span>
                </summary>
                <p className="mt-3 border-t border-night-900/10 pt-3 text-sm leading-relaxed text-night-900/70">
                  {f.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-site mt-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-night-900 via-night-950 to-night-900 px-7 py-14 text-center text-paper-50 shadow-lift sm:px-16">
            <div aria-hidden className="orb orb-gold left-1/2 top-[-140px] h-[300px] w-[500px] -translate-x-1/2" />
            <div className="relative">
              <p className="eyebrow !text-gold-400">Pronto a salire in cattedra?</p>
              <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Il tuo corso può essere quello che tutti aspettano.
              </h2>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/proponi" className="btn-gold btn-lg">
                  Proponi un corso <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/corsi"
                  className="btn btn-lg border border-white/20 bg-white/5 !text-paper-50 hover:!bg-white/10"
                >
                  Sfoglia il catalogo
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
