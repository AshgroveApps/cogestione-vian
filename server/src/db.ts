import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import config from "./config";

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new DatabaseSync(config.dbPath);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student', 'rep')),
  name TEXT NOT NULL DEFAULT '',
  class_name TEXT NOT NULL DEFAULT '',
  sede TEXT NOT NULL DEFAULT 'Bracciano',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  room TEXT NOT NULL,
  sede TEXT NOT NULL DEFAULT 'Bracciano',
  capacity INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT,
  creator_name TEXT NOT NULL,
  creator_class TEXT NOT NULL,
  creator_sede TEXT NOT NULL DEFAULT 'Bracciano',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  student_sede TEXT NOT NULL DEFAULT 'Bracciano',
  created_at TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_bookings_course ON bookings (course_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sede_settings (
  sede TEXT PRIMARY KEY CHECK (sede IN ('Bracciano', 'Anguillara')),
  event_date TEXT NOT NULL DEFAULT '',
  booking_opens_at TEXT NOT NULL DEFAULT '',
  booking_closes_at TEXT NOT NULL DEFAULT ''
);
`);

function ensureColumn(table: string, column: string, ddl: string): void {
  const cols = db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as unknown as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}
ensureColumn("sessions", "sede", "sede TEXT NOT NULL DEFAULT 'Bracciano'");
ensureColumn("courses", "creator_sede", "creator_sede TEXT NOT NULL DEFAULT 'Bracciano'");
ensureColumn("courses", "sede", "sede TEXT NOT NULL DEFAULT 'Bracciano'");
ensureColumn("bookings", "student_sede", "student_sede TEXT NOT NULL DEFAULT 'Bracciano'");
ensureColumn("bookings", "ip", "ip TEXT NOT NULL DEFAULT ''");
ensureColumn("bookings", "device", "device TEXT NOT NULL DEFAULT ''");

db.exec("DROP INDEX IF EXISTS uq_booking;");
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS uq_booking
  ON bookings (course_id, student_name COLLATE NOCASE, student_class COLLATE NOCASE, student_sede COLLATE NOCASE);`);

const DEFAULT_SETTINGS: Record<string, string> = {
  event_title: "La Cogestione al Vian",
  event_date: "",
  event_location: "Bracciano e Anguillara Sabazia — sedi del Liceo Vian",
  event_description:
    "Un giorno in cui le aule del Vian cambiano padroni: gli studenti diventano docenti e tengono corsi per i loro compagni.",
  booking_opens_at: "",
  booking_closes_at: "",
};

const insertSetting = db.prepare(
  "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
);
for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  insertSetting.run(key, value);
}

// Sedi: migrazione dal vecchio settings unico → Bracciano
const sedeCount = (db.prepare("SELECT COUNT(*) AS c FROM sede_settings").get() as { c: number }).c;
if (sedeCount === 0) {
  const legacy = getSettings();
  const mig = db.prepare(
    `INSERT OR IGNORE INTO sede_settings (sede, event_date, booking_opens_at, booking_closes_at)
     VALUES (?, ?, ?, ?)`
  );
  mig.run("Bracciano", legacy.event_date || "", legacy.booking_opens_at || "", legacy.booking_closes_at || "");
  mig.run("Anguillara", "", "", "");
}

export interface CourseRow {
  id: string;
  title: string;
  description: string;
  category: string;
  room: string;
  sede: string;
  capacity: number;
  starts_at: string;
  ends_at: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  creator_name: string;
  creator_class: string;
  creator_sede: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface BookingRow {
  id: string;
  course_id: string;
  student_name: string;
  student_class: string;
  student_sede: string;
  created_at: string;
  ip: string;
  device: string;
}

export function getSettings(): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const out: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export interface SedeSettingsRow {
  sede: string;
  event_date: string;
  booking_opens_at: string;
  booking_closes_at: string;
}

export function getSedeSettings(sede: string): SedeSettingsRow {
  const row = db
    .prepare("SELECT * FROM sede_settings WHERE sede = ?")
    .get(sede) as unknown as SedeSettingsRow | undefined;
  return {
    sede,
    event_date: row?.event_date || "",
    booking_opens_at: row?.booking_opens_at || "",
    booking_closes_at: row?.booking_closes_at || "",
  };
}

export function bookingWindowOpen(sede: string, now = new Date()): boolean {
  const s = getSedeSettings(sede);
  const opens = s.booking_opens_at ? new Date(s.booking_opens_at) : null;
  const closes = s.booking_closes_at ? new Date(s.booking_closes_at) : null;
  if (!opens) return false;
  if (now < opens) return false;
  if (closes && now > closes) return false;
  return true;
}

export function anyBookingWindowOpen(now = new Date()): boolean {
  return bookingWindowOpen("Bracciano", now) || bookingWindowOpen("Anguillara", now);
}

function seedDemo(): void {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM courses").get() as { c: number }).c;
  if (count > 0) return;

  const now = new Date();
  // Due cogestioni separate: Bracciano sabato prossimo, Anguillara il sabato dopo
  const nextSaturday = (from: Date) => {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    return d;
  };
  const eventB = nextSaturday(now);
  const eventA = new Date(eventB);
  eventA.setDate(eventA.getDate() + 7);
  const at = (day: Date, h: number, m: number) => {
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const slot = (n: number): [string, string] => {
    if (n === 1) return [at(eventB, 9, 0), at(eventB, 10, 30)];
    if (n === 2) return [at(eventB, 10, 45), at(eventB, 12, 15)];
    return [at(eventB, 12, 30), at(eventB, 14, 0)];
  };

  const upsertSede = db.prepare(
    `INSERT INTO sede_settings (sede, event_date, booking_opens_at, booking_closes_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(sede) DO UPDATE SET
       event_date = excluded.event_date,
       booking_opens_at = excluded.booking_opens_at,
       booking_closes_at = excluded.booking_closes_at`
  );
  const opensNow = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  upsertSede.run("Bracciano", eventB.toISOString(), opensNow, at(eventB, 23, 59));
  upsertSede.run("Anguillara", eventA.toISOString(), opensNow, at(eventA, 23, 59));

  const insert = db.prepare(
    `INSERT INTO courses
      (id, title, description, category, room, sede, capacity, starts_at, ends_at,
       status, creator_name, creator_class, creator_sede, created_at, reviewed_at, reviewed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const demo: Array<{
    title: string;
    description: string;
    category: string;
    room: string;
    sede: string;
    capacity: number;
    slot: number;
    creator: [string, string, string];
    status?: "approved" | "pending";
  }> = [
    {
      title: "Introduzione alla fotografia con lo smartphone",
      description:
        "Impariamo a comporre uno scatto, usare la luce naturale e ritoccare senza esagerare. Porta il tuo telefono: alla fine scattiamo insieme un piccolo reportage della scuola.",
      category: "Arte e cultura",
      room: "Aula 5",
      sede: "Bracciano",
      capacity: 30,
      slot: 1,
      creator: ["Giulia Moretti", "3A", "Bracciano"],
    },
    {
      title: "Scacchi: dalle regole alla tattica",
      description:
        "Per chi non ha mai mosso una pedina e per chi vuole fare il passo successivo: regole base, tattiche fondamentali e una mini-sfida a squadre alla fine.",
      category: "Altro",
      room: "Aula 3",
      sede: "Anguillara",
      capacity: 16,
      slot: 1,
      creator: ["Marco De Santis", "2C", "Anguillara"],
    },
    {
      title: "Creare un videogioco con Godot",
      description:
        "Dal niente a un piccolo gioco giocabile: nodi, scene e script base nel motore open source Godot. Porta il portatile se puoi, altrimenti posti in laboratorio.",
      category: "Tecnologia",
      room: "Laboratorio informatica",
      sede: "Bracciano",
      capacity: 18,
      slot: 1,
      creator: ["Chiara Neri", "3C", "Bracciano"],
    },
    {
      title: "Il caffè e la chimica",
      description:
        "Che cosa succede quando maciniamo i chicchi, perché l'estratto cambia colore e come si misura l'estrazione. Laboratorio pratico con degustazione finale.",
      category: "Scienze",
      room: "Laboratorio chimica",
      sede: "Bracciano",
      capacity: 20,
      slot: 2,
      creator: ["Sofia Ricci", "4B", "Bracciano"],
    },
    {
      title: "Spagnolo per viaggiatori",
      description:
        "Le 100 parole che servono davvero: presentarsi, ordinare, chiedere strada, sopravvivere a un mercatino. Si parte da zero, si finisce parlando.",
      category: "Lingue",
      room: "Aula 8",
      sede: "Anguillara",
      capacity: 24,
      slot: 2,
      creator: ["Luca Bianchi", "2A", "Anguillara"],
    },
    {
      title: "Fibonacci e i numeri della natura",
      description:
        "Conchiglie, girasoli, rami degli alberi: perché la sequenza di Fibonacci compare ovunque. Con dimostrazioni visive e un po' di curiosità storiche.",
      category: "Matematica",
      room: "Aula 12",
      sede: "Bracciano",
      capacity: 22,
      slot: 2,
      creator: ["Elena Russo", "2B", "Bracciano"],
    },
    {
      title: "Yoga e postura: studiare meglio",
      description:
        "Posizioni semplici per scaricare schiena e collo dopo le ore di studio, esercizi di respirazione e consigli pratici per la scrivania di casa.",
      category: "Sport",
      room: "Palestra",
      sede: "Anguillara",
      capacity: 25,
      slot: 3,
      creator: ["Anna Conti", "4A", "Anguillara"],
    },
    {
      title: "Orientamento: sopravvivere al primo anno di scienze",
      description:
        "Come si organizza lo studio scientifico, quali errori evitare e come chiedere aiuto: un corso tenuto dai ragazzi delle classi superiori per chi arriva.",
      category: "Orientamento",
      room: "Aula magna",
      sede: "Bracciano",
      capacity: 40,
      slot: 3,
      creator: ["Davide Palombo", "5A", "Bracciano"],
    },
    {
      title: "Breakdance per principianti",
      description:
        "Footwork, top rock e freeze: i fundamenti del break dance in un'ora di pratica. Non serve esperienza, serve un paio di scarpe comode.",
      category: "Sport",
      room: "Palestra",
      sede: "Bracciano",
      capacity: 20,
      slot: 1,
      creator: ["Ivan Serra", "1A", "Bracciano"],
      status: "pending",
    },
  ];

  const nowISO = now.toISOString();
  const anguillaraDay = new Date(eventA);
  for (const c of demo) {
    let [s, e] = slot(c.slot);
    if (c.sede === "Anguillara") {
      // Lezioni di Anguillara sul giorno della loro cogestione, stesse fasce
      const shift = (iso: string) => {
        const d = new Date(iso);
        d.setFullYear(anguillaraDay.getFullYear(), anguillaraDay.getMonth(), anguillaraDay.getDate());
        return d.toISOString();
      };
      s = shift(s);
      e = shift(e);
    }
    insert.run(
      crypto.randomUUID(),
      c.title,
      c.description,
      c.category,
      c.room,
      c.sede,
      c.capacity,
      s,
      e,
      c.status ?? "approved",
      c.creator[0],
      c.creator[1],
      c.creator[2],
      nowISO,
      nowISO,
      "Rappresentanti d'Istituto"
    );
  }
  console.log(
    `Seed: inseriti ${demo.length} corsi dimostrativi (1 in attesa) — Bracciano ${eventB.toLocaleDateString("it-IT")}, Anguillara ${eventA.toLocaleDateString("it-IT")}.`
  );
}
seedDemo();
