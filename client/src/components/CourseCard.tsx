import { Link } from "react-router-dom";
import { MapPin, Users, Clock, ArrowUpRight } from "lucide-react";
import type { Course } from "../lib/types";
import { CATEGORY_STYLES } from "../lib/types";
import { formatRange } from "../lib/format";
import { categoryIcon } from "../lib/categoryIcons";

export default function CourseCard({
  course,
  viewerSede,
  footer,
}: {
  course: Course;
  viewerSede?: string | null;
  footer?: React.ReactNode;
}) {
  const cat = CATEGORY_STYLES[course.category] ?? CATEGORY_STYLES.Altro;
  const Icon = categoryIcon(course.category);
  const full = course.spotsLeft <= 0;
  const fillPct = Math.min(100, Math.round((course.booked / course.capacity) * 100));

  return (
    <article className="card card-hover group relative flex flex-col overflow-hidden">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-300 via-gold-500 to-gold-700 opacity-70 transition-opacity group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cat.bg} ${cat.text}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <span className={`chip ${cat.bg} ${cat.text}`}>{course.category}</span>
            <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug tracking-tight">
              <Link to={`/corsi/${course.id}`} className="hover:text-gold-700">
                <span className="absolute inset-0" aria-hidden />
                {course.title}
              </Link>
            </h3>
          </div>
        </div>
        <div
          className={`shrink-0 rounded-xl px-2.5 py-2 text-center ${
            full ? "bg-rose-50 text-rose-700" : "bg-paper-100 text-night-900"
          }`}
        >
          <span className="block font-display text-2xl font-semibold leading-none tabular-nums">
            {course.spotsLeft}
          </span>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide">
            posti
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-4 text-sm text-night-900/70">
        <p className="line-clamp-3">{course.description}</p>
        <div className="mt-auto space-y-2 pt-1">
          <div className="flex flex-wrap gap-1.5">
            <span className="chip bg-night-900/5 text-night-900/75">
              <Clock className="h-3 w-3" /> {formatRange(course.startsAt, course.endsAt)}
            </span>
            <span className="chip bg-night-900/5 text-night-900/75">
              <MapPin className="h-3 w-3" /> Aula {course.room} · {course.sede === "Anguillara" ? "Anguillara" : "Bracciano"}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-night-900/55">
            <Users className="h-3.5 w-3.5" /> {course.booked}/{course.capacity} iscritti
            <span className="text-night-900/30">·</span>
            {course.creatorName} ({course.creatorClass}
            {course.creatorSede === "Anguillara" ? " · Anguillara" : ""})
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                full ? "bg-rose-500" : "bg-gradient-to-r from-gold-400 to-gold-600"
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-night-900/10 bg-paper-50 px-5 py-3.5">
        {footer ?? (
          <span className="btn-outline !py-2 !text-xs relative z-10">
            Dettagli <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        )}
        {viewerSede != null && viewerSede !== course.sede ? (
          <span className="chip ml-auto relative z-10 bg-amber-50 text-amber-800">
            Solo studenti di {course.sede === "Anguillara" ? "Anguillara" : "Bracciano"}
          </span>
        ) : (
          <span
            className={`chip ml-auto relative z-10 ${
              course.bookingOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                course.bookingOpen ? "bg-emerald-500 pulse-dot" : "bg-slate-400"
              }`}
            />
            {course.bookingOpen ? "Prenotazioni aperte" : "Prenotazioni chiuse"}
          </span>
        )}
      </div>
    </article>
  );
}
