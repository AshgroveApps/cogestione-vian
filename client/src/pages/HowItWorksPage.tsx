import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  CalendarClock,
  ShieldCheck,
  MapPin,
  PencilLine,
  BadgeCheck,
  CalendarCheck2,
  ListChecks,
} from "lucide-react";
import { useDocumentTitle } from "../lib/hooks";
import Reveal from "../components/Reveal";

const steps = [
  {
    icon: PencilLine,
    title: "Accedi e proponi",
    text: "Entra con nome, classe e sede (Bracciano o Anguillara) e compila il modulo del corso: titolo, descrizione, categoria, aula, sede, orario e quanti posti vuoi offrire.",
  },
  {
    icon: BadgeCheck,
    title: "Approvazione dei rappresentanti",
    text: "I rappresentanti di istituto valutano ogni proposta nell'area riservata: possono approvarla o rifiutarla motivando la scelta. Troverai l'esito nell'area personale.",
  },
  {
    icon: CalendarCheck2,
    title: "Prenota il tuo posto",
    text: "Al momento stabilito si apre la finestra di prenotazione (data e ora indicate nella home). Un posto per corso, fino a esaurimento: puoi annullare finché resta aperta.",
  },
  {
    icon: ListChecks,
    title: "Giorno della cogestione",
    text: "Ti rechi nell'aula e nella sede indicate nella scheda del corso, prendi posto e segui le lezioni tenute dai tuoi compagni. Buon lavoro a chi insegna, buon ascolto a chi impara!",
  },
];

const rules = [
  {
    icon: BookOpen,
    title: "Chi può proporre",
    text: "Qualunque studente del Liceo «Ignazio Vian», sia della sede di Bracciano sia della sede di Anguillara Sabazia, accedendo con nome, classe e sede.",
  },
  {
    icon: ClipboardCheck,
    title: "Chi approva",
    text: "I rappresentanti di istituto, con un PIN riservato. Possono approvare o rifiutare ogni proposta: il motivo del rifiuto resta visibile solo al proponente.",
  },
  {
    icon: CalendarClock,
    title: "Quando si prenota",
    text: "La finestra di prenonote è configurabile dai rappresentanti e compare sempre nella home, con apertura, chiusura e countdown dell'evento.",
  },
  {
    icon: ShieldCheck,
    title: "Regole di base",
    text: "Un posto per studente per corso; nessun dato personalizzato oltre nome, classe e sede; le prenotazioni si annullano solo finché la finestra è aperta.",
  },
  {
    icon: MapPin,
    title: "Dove si svolge",
    text: "Il sito e la cogestione coprono tutto il Vian: i corsi si tengono sia nella sede di Bracciano sia in quella di Anguillara. Ogni scheda corso indica aula e sede.",
  },
];

const FAQ = [
  {
    q: "Chi può proporre un corso?",
    a: "Qualunque studente del Vian, di Bracciano o di Anguillara Sabazia. Nell'accesso indichi nome, classe e sede: quei dati diventano la tua identità sul sito.",
  },
  {
    q: "Come faccio a sapere se il mio corso è stato approvato?",
    a: "Nell'Area personale, sotto «Le mie proposte»: trovi lo stato (in attesa, approvato, non approvato) e, in caso di rifiuto, il motivo lasciato dai rappresentanti.",
  },
  {
    q: "Quando si aprono le prenotazioni?",
    a: "È configurato dai rappresentanti, per ogni sede separatamente: apertura e chiusura sono mostrate nella home e su ogni scheda corso. Prima dell'apertura non è possibile prenotare.",
  },
  {
    q: "Posso prenotare un corso dell'altra sede?",
    a: "No. Le cogestioni di Bracciano e Anguillara sono due giornate separate: ogni studente prenota e segue i corsi della propria sede. Sui corsi dell'altra sede vedi «Solo studenti di…».",
  },
  {
    q: "Quanti corsi posso prenotare?",
    a: "Puoi prenotare più corsi, ma un solo posto per ciascuno, fino a esaurimento. Se cambi idea, annulla la prenotazione finché la finestra è aperta.",
  },
  {
    q: "Serve una password per accedere?",
    a: "No: identifichi con nome, classe e sede. Non chiediamo email né credenziali: è un sistema pensato per l'uso interno alla scuola.",
  },
  {
    q: "Chi vede i miei dati?",
    a: "I dati servono solo a gestire proposte e prenotazioni: i rappresentanti li vedono nell'area riservata (con il CSV degli iscritti), nessun altro studente può vederli.",
  },
];

export default function HowItWorksPage() {
  useDocumentTitle("Come funziona");
  return (
    <div>
      <div className="relative overflow-hidden bg-night-950 text-paper-50">
        <div aria-hidden className="orb orb-gold -left-20 -top-24 h-[340px] w-[340px]" />
        <div className="container-site relative max-w-4xl py-14 sm:py-20">
          <p className="eyebrow !text-gold-400">Regolamento</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Come funziona la cogestione
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-paper-100/70">
            La cogestione è il giorno in cui la scuola è guidata dagli studenti: chi propone un
            corso ne diventa il docente, chi lo segue ne diventa l'allievo. Tutto passa da
            questo sito, in quattro semplici passi.
          </p>
        </div>
      </div>

      <div className="container-site max-w-4xl py-14">
        {/* 4 passi */}
        <section>
          <Reveal>
            <p className="eyebrow">Il percorso</p>
            <h2 className="section-title">Dal modulo alla lezione</h2>
          </Reveal>
          <ol className="mt-9 space-y-4">
            {steps.map((s, i) => (
              <Reveal
                key={s.title}
                delay={i * 90}
                as="li"
                className="card relative flex gap-5 p-6 pl-6 sm:pl-8"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-night-950 shadow-[0_10px_24px_-10px_rgba(201,162,39,0.7)]">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-600">
                    Passo {i + 1}
                  </span>
                  <h3 className="mt-0.5 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-night-900/70">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Regole */}
        <section className="mt-16">
          <Reveal>
            <p className="eyebrow">Le regole</p>
            <h2 className="section-title">Cosa c'è da sapere</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {rules.map((r, i) => (
              <Reveal key={r.title} delay={i * 70}>
                <div className="card h-full p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-night-900 text-gold-400">
                    <r.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{r.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-night-900/70">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <Reveal>
            <p className="eyebrow">Domande frequenti</p>
            <h2 className="section-title">Le risposte alle domande più comuni</h2>
          </Reveal>
          <div className="mt-8 grid gap-3">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
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

        <Reveal>
          <div className="mt-16 flex flex-wrap gap-3">
            <Link to="/proponi" className="btn-gold btn-lg">
              Proponi un corso <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/corsi" className="btn-outline btn-lg">
              Vai al catalogo
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
