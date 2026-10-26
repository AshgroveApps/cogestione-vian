import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useDocumentTitle } from "../lib/hooks";

export default function NotFoundPage() {
  useDocumentTitle("Pagina non trovata");
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-night-950 text-paper-50">
      <div aria-hidden className="orb orb-gold left-1/4 top-10 h-[300px] w-[300px]" />
      <div className="container-site relative py-20 text-center">
        <p className="gradient-text font-display text-[7rem] font-semibold leading-none sm:text-[10rem]">
          404
        </p>
        <h1 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
          Questa pagina è andata a lezione da un'altra parte
        </h1>
        <p className="mx-auto mt-3 max-w-md text-paper-100/65">
          L'indirizzo che hai cercato non esiste. Torna alla cogestione e continua a esplorare.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-gold btn-lg">
            Torna alla home
          </Link>
          <Link
            to="/corsi"
            className="btn btn-lg border border-white/20 bg-white/5 !text-paper-50 hover:!bg-white/10"
          >
            <Compass className="h-4 w-4" /> Scopri i corsi
          </Link>
        </div>
      </div>
    </div>
  );
}
