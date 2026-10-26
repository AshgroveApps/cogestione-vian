const dtfDay = new Intl.DateTimeFormat("it-IT", {
  weekday: "short",
  day: "numeric",
  month: "long",
});
const dtfTime = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});
const dtfFull = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDay(iso: string): string {
  return dtfDay.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return dtfTime.format(new Date(iso));
}

export function formatRange(startIso: string, endIso: string): string {
  return `${formatDay(startIso)}, ${formatTime(startIso)} – ${formatTime(endIso)}`;
}

export function formatFull(iso: string): string {
  return dtfFull.format(new Date(iso));
}

export function formatShort(iso: string | null): string {
  if (!iso) return "—";
  return formatFull(iso);
}

export function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputValue(v: string): string {
  if (!v) return "";
  return new Date(v).toISOString();
}
