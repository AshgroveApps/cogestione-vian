import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} — Cogestione Vian` : "Cogestione Vian — Vian";
  }, [title]);
}
