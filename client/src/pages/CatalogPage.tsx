import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid } from "lucide-react";
import { api } from "../lib/api";
import type { Course, EventSettings } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { useDocumentTitle } from "../lib/hooks";
import { formatShort } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { categoryIcon } from "../lib/categoryIcons";
import CourseCard from "../components/CourseCard";
import Reveal from "../components/Reveal";
import { SkeletonGrid } from "../components/Skeleton";

type SortKey = "data" | "posti" | "titolo";

export default function CatalogPage() {
  useDocumentTitle("Corsi");
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Tutte");
  const [sede, setSede] = useState<string>("Tutte");
  const [sort, setSort] = useState<SortKey>("data");

  useEffect(() => {
    api
      .get<{ courses: Course[] }>("/api/courses")
      .then((d) => setCourses(d.courses))
      .catch(() => setCourses([]));
    api
      .get<EventSettings>("/api/settings")
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  const filtered = useMemo(() => {
    const list = [...(courses ?? [])];
    const q = query.trim().toLowerCase();
    const out = list.filter((c) => {
      if (category !== "Tutte" && c.category !== category) return false;
      if (sede !== "Tutte" && c.sede !== sede) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.room.toLowerCase().includes(q) ||
        c.creatorName.toLowerCase().includes(q)
      );
    });
    out.sort((a, b) => {
      if (sort === "data") return a.startsAt.localeCompare(b.startsAt);
      if (sort === "posti") return b.spotsLeft - a.spotsLeft;
      return a.title.localeCompare(b.title, "it");
    });
    return out;
  }, [courses, query, category, sede, sort]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { Tutte: (courses ?? []).length };
    for (const c of courses ?? []) m[c.category] = (m[c.category] ?? 0) + 1;
    return m;
  }, [courses]);

  return (
    <div className="container-site py-12 sm:py-16">
      <div className="max-w-2xl animate-fadeUp">
        <p className="eyebrow">Catalogo</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Tutti i corsi della cogestione
        </h1>
        <p className="mt-4 text-night-900/65">
          Corsi approvati dai rappresentanti e tenuti dagli studenti del Vian. Le cogestioni
          delle due sedi sono separate: ogni scheda indica la sua sede e lo stato delle
          prenotazioni.{" "}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["Bracciano", "Anguillara"] as const).map((s) => {
            const st = settings?.sedi?.[s];
            return (
              <span
                key={s}
                className={`chip ${st?.bookingOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${st?.bookingOpen ? "bg-emerald-500 pulse-dot" : "bg-slate-400"}`}
                />
                {s}:{" "}
                {st?.bookingOpen
                  ? "prenotazioni aperte"
                  : st?.eventDate
                    ? `aperte il ${formatShort(st.eventDate)}`
                    : "date da configurare"}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-9 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night-900/35" />
          <input
            className="input !pl-11 !py-3"
            placeholder="Cerca per titolo, descrizione, aula o relatore…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Cerca corsi"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input !w-auto !py-3"
            value={sede}
            onChange={(e) => setSede(e.target.value)}
            aria-label="Filtra per sede"
          >
            <option value="Tutte">Tutte le sedi</option>
            <option value="Bracciano">Bracciano</option>
            <option value="Anguillara">Anguillara</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-night-900/50">
            <SlidersHorizontal className="h-4 w-4" />
            <select
              className="input !w-auto !py-3"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Ordina corsi"
            >
              <option value="data">Ordina per data</option>
              <option value="posti">Più posti liberi</option>
              <option value="titolo">Titolo A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["Tutte", ...CATEGORIES].map((c) => {
          const Icon = c === "Tutte" ? LayoutGrid : categoryIcon(c);
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                active
                  ? "border-night-900 bg-night-900 text-paper-50 shadow-soft"
                  : "border-night-900/15 bg-white text-night-900/70 hover:-translate-y-0.5 hover:border-gold-500/50 hover:text-night-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {c}
              <span className={`tabular-nums ${active ? "text-paper-50/55" : "text-night-900/35"}`}>
                {counts[c] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        {courses === null ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <div className="card px-6 py-16 text-center">
            <p className="font-display text-2xl font-semibold">Nessun corso trovato</p>
            <p className="mt-2 text-sm text-night-900/60">
              Prova a cambiare i filtri o torna più tardi: ne arrivano di nuovi.
            </p>
            {(query || category !== "Tutte" || sede !== "Tutte") && (
              <button
                className="btn-outline mt-5"
                onClick={() => {
                  setQuery("");
                  setCategory("Tutte");
                  setSede("Tutte");
                }}
              >
                Azzera i filtri
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-night-900/45">
              {filtered.length} corso{filtered.length === 1 ? "" : "i"}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c, i) => (
                <Reveal key={c.id} delay={(i % 3) * 80}>
                  <CourseCard course={c} viewerSede={user?.sede ?? null} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
