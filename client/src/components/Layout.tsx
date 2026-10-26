import { useEffect, useState, ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  UserRound,
  ArrowUp,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import SEO from "./SEO";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/corsi", label: "Corsi" },
  { to: "/come-funziona", label: "Come funziona" },
  { to: "/proponi", label: "Proponi un corso" },
  { to: "/area-personale", label: "Area personale" },
];

function ScrollChrome() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
      setShowTop(h.scrollTop > 700);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent"
      >
        <div
          className="h-full bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Torna in alto"
        className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-night-900/10 bg-white text-night-900 shadow-lift transition-all duration-300 hover:border-gold-500 hover:text-gold-700 ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEO />
      <ScrollChrome />
      <header className="sticky top-0 z-50 border-b border-night-900/10 bg-paper-50/85 backdrop-blur-xl dark:border-dark-border dark:bg-dark-bg/85">
        <div className="container-site flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-night-900 text-gold-400 dark:bg-gold-500 dark:text-night-950">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold tracking-tight dark:text-dark-text">
                Cogestione <span className="text-gold-600 dark:text-gold-400">Vian</span>
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-widest text-night-900/45 dark:text-dark-textSecondary">
                Bracciano
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-night-900 text-paper-50 dark:bg-gold-500 dark:text-night-950"
                      : "text-night-900/65 hover:bg-night-900/5 hover:text-night-900 dark:text-dark-textSecondary dark:hover:bg-dark-card dark:hover:text-dark-text"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-night-900/65 hover:bg-night-900/5 hover:text-night-900 transition-colors"
              aria-label={theme === "dark" ? "Attiva modalità chiara" : "Attiva modalità scura"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user?.role === "rep" && (
              <Link to="/rappresentanti" className="btn-gold !py-2 !text-xs">
                <LayoutDashboard className="h-3.5 w-3.5" /> Area rappresentanti
              </Link>
            )}
            {user ? (
              <>
                <span className="max-w-[180px] truncate text-sm text-night-900/60">
                  <UserRound className="mr-1 inline h-3.5 w-3.5" />
                  {user.name}
                  {user.className ? ` · ${user.className}` : ""}
                </span>
                <button onClick={handleLogout} className="btn-ghost !py-2 !text-xs">
                  <LogOut className="h-3.5 w-3.5" /> Esci
                </button>
              </>
            ) : (
              <Link to="/area-personale" className="btn-primary !py-2 !text-xs">
                Accedi
              </Link>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-night-900 hover:bg-night-900/5 dark:text-dark-text dark:hover:bg-dark-card lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Chiudi menu" : "Apri menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-night-900/10 bg-paper-50 dark:border-dark-border dark:bg-dark-bg lg:hidden">
            <div className="container-site flex flex-col gap-1 py-3">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? "bg-night-900 text-paper-50 dark:bg-gold-500 dark:text-night-950"
                        : "text-night-900/75 hover:bg-night-900/5 dark:text-dark-textSecondary dark:hover:bg-dark-card"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  toggleTheme();
                  setOpen(false);
                }}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-night-900/75 hover:bg-night-900/5 flex items-center gap-2 dark:text-dark-textSecondary dark:hover:bg-dark-card"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Modalità chiara" : "Modalità scura"}
              </button>
              {user?.role === "rep" && (
                <Link
                  to="/rappresentanti"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-gold-500/15 px-3 py-2.5 text-sm font-semibold text-gold-700 dark:bg-gold-500/20 dark:text-gold-400"
                >
                  Area rappresentanti
                </Link>
              )}
              {user ? (
                <button onClick={handleLogout} className="btn-ghost mt-1 justify-start">
                  <LogOut className="h-4 w-4" /> Esci ({user.name})
                </button>
              ) : (
                <Link to="/area-personale" onClick={() => setOpen(false)} className="btn-primary mt-1">
                  Accedi
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="relative mt-20 bg-night-900 text-paper-100 dark:bg-dark-bg dark:text-dark-text">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"
        />
        <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400 dark:bg-gold-500/20 dark:text-gold-400">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-semibold text-paper-50 dark:text-dark-text">
                Cogestione Vian
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper-100/65 dark:text-dark-textSecondary">
              Gli studenti del Liceo Scientifico Statale «Ignazio Vian» propongono corsi,
              li insegnano ai compagni e li vivono insieme. Un progetto di scuola, per la scuola.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gold-400 dark:text-gold-400">
              La scuola
            </h3>
            <address className="mt-4 space-y-1.5 text-sm not-italic text-paper-100/70 dark:text-dark-textSecondary">
              <p>Liceo Scientifico Statale «Ignazio Vian»</p>
              <p>Largo Cesare Pavese, 1 — 00062 Bracciano (RM)</p>
              <p>Via della Mainella, snc — 00061 Anguillara Sabazia (RM)</p>
              <p className="pt-2">
                <a
                  className="underline decoration-gold-500/50 underline-offset-4 hover:text-gold-300 dark:hover:text-gold-400"
                  href="https://www.liceovian.edu.it"
                  target="_blank"
                  rel="noreferrer"
                >
                  Sito istituzionale liceovian.edu.it
                </a>
              </p>
              <p className="pt-1">
                <a
                  className="underline decoration-gold-500/50 underline-offset-4 hover:text-gold-300 dark:hover:text-gold-400"
                  href="https://sites.google.com/liceovian.edu.it/bullismocyberbullismo/scegli"
                  target="_blank"
                  rel="noreferrer"
                >
                  Sito anti-bullismo
                </a>
              </p>
            </address>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gold-400">
              Contatti
            </h3>
            <address className="mt-4 space-y-1.5 text-sm not-italic text-paper-100/70">
              <p>Centralino: 06 121122345</p>
              <p>Email: rmps33000x@istruzione.it</p>
              <p>PEC: rmps33000x@pec.istruzione.it</p>
            </address>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gold-400">
              Navigazione
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-paper-100/70">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link className="hover:text-gold-300" to={l.to} onClick={() => setOpen(false)}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Credits */}
        <div className="border-t border-white/10">
          <div className="container-site flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/15 font-display text-sm font-semibold text-gold-400">
                A
              </span>
              <div className="text-sm">
                <p className="font-semibold text-paper-50">Ashgrove Apps</p>
                <p className="text-paper-100/55">
                  Progetto e sviluppo di{" "}
                  <span className="font-medium text-paper-100/80">Abdelghafour Boucham</span> — classe 2ª R
                </p>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-paper-100/40">
              Design &amp; sviluppo · {new Date().getFullYear()}
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs text-paper-100/45 sm:flex-row">
            <p>© {new Date().getFullYear()} Cogestione Vian — Liceo «Ignazio Vian»</p>
            <p>Bracciano · Anguillara Sabazia — Sito a scopo didattico</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
