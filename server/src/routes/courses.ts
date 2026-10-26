import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { db, CourseRow, getSettings, getSedeSettings, bookingWindowOpen, anyBookingWindowOpen } from "../db";
import { requireAuth, requireRep } from "../security";

const router = Router();

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

const courseSchema = z.object({
  title: z.string().trim().min(3, "Il titolo deve avere almeno 3 caratteri.").max(120),
  description: z
    .string()
    .trim()
    .min(20, "Descrivi il corso con almeno 20 caratteri.")
    .max(2000, "Descrizione troppo lunga."),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Seleziona una categoria valida." }),
  }),
  room: z.string().trim().min(1, "Indica l'aula.").max(60),
  sede: z
    .enum(["Bracciano", "Anguillara"], {
      errorMap: () => ({ message: "Seleziona la sede del corso." }),
    })
    .default("Bracciano"),
  capacity: z.coerce
    .number()
    .int("La capacità deve essere un numero intero.")
    .min(1, "Almeno 1 posto.")
    .max(60, "Massimo 60 posti."),
  startsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data/ora di inizio non valida."),
  endsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data/ora di fine non valida."),
});

function courseWithStats(row: CourseRow) {
  const booked = (
    db
      .prepare("SELECT COUNT(*) AS c FROM bookings WHERE course_id = ?")
      .get(row.id) as { c: number }
  ).c;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    room: row.room,
    sede: row.sede,
    capacity: row.capacity,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    reviewNote: row.review_note,
    creatorName: row.creator_name,
    creatorClass: row.creator_class,
    creatorSede: row.creator_sede,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    booked,
    spotsLeft: Math.max(0, row.capacity - booked),
    bookingOpen: bookingWindowOpen(row.sede),
  };
}

router.get("/", (req: Request, res: Response) => {
  const q = typeof req.query.status === "string" ? req.query.status : "";
  const isRep = req.user?.role === "rep";
  const valid = ["pending", "approved", "rejected"].includes(q);
  let rows: CourseRow[];
  if (isRep && valid) {
    rows = db
      .prepare("SELECT * FROM courses WHERE status = ? ORDER BY created_at DESC")
      .all(q) as unknown as CourseRow[];
  } else if (isRep) {
    rows = db
      .prepare("SELECT * FROM courses ORDER BY created_at DESC")
      .all() as unknown as CourseRow[];
  } else {
    rows = db
      .prepare(
        "SELECT * FROM courses WHERE status = 'approved' ORDER BY starts_at ASC"
      )
      .all() as unknown as CourseRow[];
  }
  res.json({
    bookingOpen: anyBookingWindowOpen(),
    courses: rows.map(courseWithStats),
  });
});

router.get("/mine", requireAuth, (req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT * FROM courses
       WHERE creator_name = ? AND creator_class = ? AND creator_sede = ?
       ORDER BY created_at DESC`
    )
    .all(req.user!.name, req.user!.className, req.user!.sede) as unknown as CourseRow[];
  res.json({ courses: rows.map(courseWithStats) });
});

router.get("/:id", (req: Request, res: Response) => {
  const row = db
    .prepare("SELECT * FROM courses WHERE id = ?")
    .get(req.params.id) as unknown as CourseRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Corso non trovato." });
    return;
  }
  const isRep = req.user?.role === "rep";
  const isOwner =
    req.user &&
    req.user.name === row.creator_name &&
    req.user.className === row.creator_class &&
    req.user.sede === row.creator_sede;
  if (row.status !== "approved" && !isRep && !isOwner) {
    res.status(404).json({ error: "Corso non trovato." });
    return;
  }
  res.json({
    bookingOpen: bookingWindowOpen(row.sede),
    course: courseWithStats(row),
  });
});

router.post("/", requireAuth, (req: Request, res: Response) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    });
    return;
  }
  const d = parsed.data;
  const starts = new Date(d.startsAt);
  const ends = new Date(d.endsAt);
  if (ends <= starts) {
    res.status(400).json({ error: "L'orario di fine deve essere successivo all'inizio." });
    return;
  }
  const startsISO = starts.toISOString();
  const endsISO = ends.toISOString();
  const isRep = req.user!.role === "rep";
  const uname = req.user!.name;
  const uclass = req.user!.className;
  const usede = req.user!.sede;

  if (!isRep) {
    const mine = db
      .prepare(
        `SELECT COUNT(*) AS c FROM courses
         WHERE creator_name = ? AND creator_class = ? AND creator_sede = ?
           AND status != 'rejected'`
      )
      .get(uname, uclass, usede) as { c: number };
    if (mine.c >= 3) {
      res.status(409).json({
        error: "Hai già 3 proposte attive. Attendi che vengano valutate prima di proporre di nuovo.",
      });
      return;
    }
    const mineClash = db
      .prepare(
        `SELECT title FROM courses
         WHERE creator_name = ? AND creator_class = ? AND creator_sede = ?
           AND status != 'rejected' AND starts_at < ? AND ends_at > ?`
      )
      .get(uname, uclass, usede, endsISO, startsISO) as { title: string } | undefined;
    if (mineClash) {
      res.status(409).json({
        error: `Hai già «${mineClash.title}» nello stesso orario: scegli una fascia diversa.`,
      });
      return;
    }
  }

  const roomClash = db
    .prepare(
      `SELECT title FROM courses
       WHERE sede = ? AND LOWER(room) = LOWER(?) AND status != 'rejected'
         AND starts_at < ? AND ends_at > ?`
    )
    .get(d.sede, d.room, endsISO, startsISO) as { title: string } | undefined;
  if (roomClash) {
    res.status(409).json({
      error: `L'aula «${d.room}» a ${d.sede} è già occupata da «${roomClash.title}» in quell'orario.`,
    });
    return;
  }

  const status = isRep ? "approved" : "pending";
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO courses
      (id, title, description, category, room, sede, capacity, starts_at, ends_at,
       status, creator_name, creator_class, creator_sede, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    d.title,
    d.description,
    d.category,
    d.room,
    d.sede,
    d.capacity,
    startsISO,
    endsISO,
    status,
    uname,
    uclass,
    usede,
    now
  );
  const row = db.prepare("SELECT * FROM courses WHERE id = ?").get(id) as unknown as CourseRow;
  res.status(201).json({ course: courseWithStats(row) });
});

router.delete("/:id", requireAuth, (req: Request, res: Response) => {
  const row = db
    .prepare("SELECT * FROM courses WHERE id = ?")
    .get(req.params.id) as unknown as CourseRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Corso non trovato." });
    return;
  }
  const isRep = req.user!.role === "rep";
  const isOwner =
    req.user!.name === row.creator_name &&
    req.user!.className === row.creator_class &&
    req.user!.sede === row.creator_sede;
  if (!isRep && !isOwner) {
    res.status(403).json({ error: "Non puoi eliminare questo corso." });
    return;
  }
  if (row.status === "approved") {
    const bookings = (
      db
        .prepare("SELECT COUNT(*) AS c FROM bookings WHERE course_id = ?")
        .get(row.id) as { c: number }
    ).c;
    if (bookings > 0 && !isRep) {
      res.status(400).json({
        error: "Non puoi eliminare un corso approvato con iscritti. Contatta i rappresentanti.",
      });
      return;
    }
  }
  db.prepare("DELETE FROM courses WHERE id = ?").run(row.id);
  res.json({ ok: true });
});

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
});

router.patch("/:id/review", requireRep, (req: Request, res: Response) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dati non validi." });
    return;
  }
  const row = db
    .prepare("SELECT * FROM courses WHERE id = ?")
    .get(req.params.id) as unknown as CourseRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Corso non trovato." });
    return;
  }
  const status = parsed.data.action === "approve" ? "approved" : "rejected";
  db.prepare(
    `UPDATE courses
     SET status = ?, review_note = ?, reviewed_at = ?, reviewed_by = ?
     WHERE id = ?`
  ).run(
    status,
    parsed.data.note ?? null,
    new Date().toISOString(),
    req.user!.name,
    row.id
  );
  const updated = db
    .prepare("SELECT * FROM courses WHERE id = ?")
    .get(row.id) as unknown as CourseRow;
  res.json({ course: courseWithStats(updated) });
});

router.get("/:id/bookings", requireRep, (req: Request, res: Response) => {
  const row = db
    .prepare("SELECT id, title FROM courses WHERE id = ?")
    .get(req.params.id) as { id: string; title: string } | undefined;
  if (!row) {
    res.status(404).json({ error: "Corso non trovato." });
    return;
  }
  const rows = db
    .prepare(
      "SELECT id, student_name, student_class, student_sede, created_at, ip, device FROM bookings WHERE course_id = ? ORDER BY created_at ASC"
    )
    .all(row.id) as unknown as {
    id: string;
    student_name: string;
    student_class: string;
    student_sede: string;
    created_at: string;
    ip: string;
    device: string;
  }[];
  res.json({
    course: { id: row.id, title: row.title },
    bookings: rows.map((b) => ({
      id: b.id,
      studentName: b.student_name,
      studentClass: b.student_class,
      studentSede: b.student_sede,
      createdAt: b.created_at,
      ip: b.ip,
      device: b.device,
    })),
  });
});

router.get("/:id/bookings.csv", requireRep, (req: Request, res: Response) => {
  const row = db
    .prepare("SELECT id, title FROM courses WHERE id = ?")
    .get(req.params.id) as { id: string; title: string } | undefined;
  if (!row) {
    res.status(404).json({ error: "Corso non trovato." });
    return;
  }
  const rows = db
    .prepare(
      "SELECT student_name, student_class, student_sede, created_at FROM bookings WHERE course_id = ? ORDER BY created_at ASC"
    )
    .all(row.id) as unknown as {
    student_name: string;
    student_class: string;
    student_sede: string;
    created_at: string;
  }[];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    "Nome;Classe;Sede;Data prenotazione",
    ...rows.map(
      (b) =>
        `${esc(b.student_name)};${esc(b.student_class)};${esc(b.student_sede)};${esc(new Date(b.created_at).toLocaleString("it-IT"))}`
    ),
  ];
  const safeTitle = row.title.replace(/[^\p{L}\p{N}\-_ ]/gu, "").slice(0, 60);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="iscritti-${safeTitle || "corso"}.csv"`
  );
  res.send("﻿" + lines.join("\r\n"));
});

export function settingsPayload() {
  const s = getSettings();
  const sedePayload = (sede: string) => {
    const ss = getSedeSettings(sede);
    return {
      eventDate: ss.event_date || null,
      bookingOpensAt: ss.booking_opens_at || null,
      bookingClosesAt: ss.booking_closes_at || null,
      bookingOpen: bookingWindowOpen(sede),
    };
  };
  return {
    eventTitle: s.event_title,
    eventLocation: s.event_location,
    eventDescription: s.event_description,
    bookingOpen: anyBookingWindowOpen(),
    sedi: {
      Bracciano: sedePayload("Bracciano"),
      Anguillara: sedePayload("Anguillara"),
    },
  };
}

export default router;
