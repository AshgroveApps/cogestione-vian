export type Role = "student" | "rep";

export type Sede = "Bracciano" | "Anguillara";

export const sedeFull = (s?: string | null) =>
  s === "Anguillara" ? "Anguillara Sabazia" : s ? "Bracciano" : "";

export const SEDE_ADDRESS: Record<string, string> = {
  Bracciano: "Largo Cesare Pavese, 1 — 00062 Bracciano (RM)",
  Anguillara: "Via della Mainella, s.n.c. — 00061 Anguillara Sabazia (RM)",
};

export const SEDI: Sede[] = ["Bracciano", "Anguillara"];

export interface User {
  role: Role;
  name: string;
  className: string;
  sede: string;
}

export type CourseStatus = "pending" | "approved" | "rejected";

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  room: string;
  sede: string;
  capacity: number;
  startsAt: string;
  endsAt: string;
  status: CourseStatus;
  reviewNote: string | null;
  creatorName: string;
  creatorClass: string;
  creatorSede: string;
  createdAt: string;
  reviewedAt: string | null;
  booked: number;
  spotsLeft: number;
  bookingOpen: boolean;
}

export interface Booking {
  id: string;
  bookedAt: string;
  course: {
    id: string;
    title: string;
    category: string;
    room: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    booked: number;
    spotsLeft: number;
  };
}

export interface AdminBooking {
  id: string;
  studentName: string;
  studentClass: string;
  studentSede: string;
  createdAt: string;
  ip: string;
  device: string;
}

export interface SedeSettings {
  eventDate: string | null;
  bookingOpensAt: string | null;
  bookingClosesAt: string | null;
  bookingOpen: boolean;
}

export interface EventSettings {
  eventTitle: string;
  eventLocation: string;
  eventDescription: string;
  bookingOpen: boolean;
  sedi: Record<string, SedeSettings>;
}

export const CATEGORIES = [
  "Scienze",
  "Matematica",
  "Lingue",
  "Tecnologia",
  "Arte e cultura",
  "Sport",
  "Orientamento",
  "Altro",
] as const;

export const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  Scienze: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Matematica: { bg: "bg-sky-50", text: "text-sky-700" },
  Lingue: { bg: "bg-violet-50", text: "text-violet-700" },
  Tecnologia: { bg: "bg-indigo-50", text: "text-indigo-700" },
  "Arte e cultura": { bg: "bg-fuchsia-50", text: "text-fuchsia-700" },
  Sport: { bg: "bg-orange-50", text: "text-orange-700" },
  Orientamento: { bg: "bg-amber-50", text: "text-amber-800" },
  Altro: { bg: "bg-slate-100", text: "text-slate-700" },
};

export const STATUS_STYLES: Record<CourseStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-800", label: "In attesa" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Approvato" },
  rejected: { bg: "bg-rose-50", text: "text-rose-700", label: "Non approvato" },
};
