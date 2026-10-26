import { Router, Request, Response } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { db, bookingWindowOpen, CourseRow } from "../db";
import { requireAuth, deviceHash } from "../security";

const router = Router();

router.get("/mine", requireAuth, (req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT b.id AS booking_id, b.created_at AS booked_at,
              c.id AS course_id, c.title, c.category, c.room,
              c.starts_at, c.ends_at, c.capacity,
              (SELECT COUNT(*) FROM bookings x WHERE x.course_id = c.id) AS booked
       FROM bookings b
       JOIN courses c ON c.id = b.course_id
        WHERE b.student_name = ? AND b.student_class = ? AND b.student_sede = ?
        ORDER BY c.starts_at ASC`
    )
    .all(req.user!.name, req.user!.className, req.user!.sede) as unknown as {
    booking_id: string;
    booked_at: string;
    course_id: string;
    title: string;
    category: string;
    room: string;
    starts_at: string;
    ends_at: string;
    capacity: number;
    booked: number;
  }[];
  res.json({
    bookings: rows.map((r) => ({
      id: r.booking_id,
      bookedAt: r.booked_at,
      course: {
        id: r.course_id,
        title: r.title,
        category: r.category,
        room: r.room,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        capacity: r.capacity,
        booked: r.booked,
        spotsLeft: Math.max(0, r.capacity - r.booked),
      },
    })),
  });
});

router.post("/", requireAuth, (req: Request, res: Response) => {
  const schema = z.object({ courseId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dati non validi." });
    return;
  }
  const course = db
    .prepare("SELECT * FROM courses WHERE id = ?")
    .get(parsed.data.courseId) as CourseRow | undefined;
  if (!course || course.status !== "approved") {
    res.status(404).json({ error: "Corso non trovato." });
    return;
  }
  if (course.sede !== req.user!.sede) {
    res.status(403).json({
      error: `Questo corso si tiene nella sede di ${course.sede === "Anguillara" ? "Anguillara Sabazia" : "Bracciano"}: le prenotazioni sono riservate agli studenti di quella sede.`,
    });
    return;
  }
  if (!bookingWindowOpen(course.sede)) {
    res.status(403).json({
      error: `Le prenotazioni per la sede di ${course.sede === "Anguillara" ? "Anguillara Sabazia" : "Bracciano"} non sono ancora aperte o sono chiuse.`,
    });
    return;
  }

  const ip = (req.ip || req.socket.remoteAddress || "").replace(/^::ffff:/, "");
  const device = deviceHash(req);
  const uname = req.user!.name;
  const uclass = req.user!.className;
  const usede = req.user!.sede;

  // 1) Massimo 10 prenotazioni attive per identità (nome + classe + sede)
  const mine = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM bookings
         WHERE student_name = ? AND student_class = ? AND student_sede = ?`
      )
      .get(uname, uclass, usede) as { c: number }
  ).c;
  if (mine >= 10) {
    res.status(409).json({
      error: "Hai già 10 prenotazioni attive: annullane alcune prima di continuare.",
    });
    return;
  }

  // 2) Massimo 12 prenotazioni al giorno dallo stesso dispositivo
  if (device !== "n/a") {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const devDay = (
      db
        .prepare("SELECT COUNT(*) AS c FROM bookings WHERE device = ? AND created_at >= ?")
        .get(device, dayAgo) as { c: number }
    ).c;
    if (devDay >= 12) {
      res.status(429).json({
        error: "Troppe prenotazioni da questo dispositivo nelle ultime 24 ore. Riprova più tardi o contatta i rappresentanti.",
      });
      return;
    }
    // 3) Al massimo 2 prenotazioni per corso dallo stesso dispositivo
    const devCourse = (
      db
        .prepare("SELECT COUNT(*) AS c FROM bookings WHERE course_id = ? AND device = ?")
        .get(course.id, device) as { c: number }
    ).c;
    if (devCourse >= 2) {
      res.status(409).json({
        error: "Questo dispositivo ha già raggiunto il massimo di prenotazioni per questo corso.",
      });
      return;
    }
  }

  // 4) Massimo 1/3 dei posti (min 3) per singola classe
  const classCap = Math.max(3, Math.ceil(course.capacity / 3));
  const classCount = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM bookings
         WHERE course_id = ? AND student_class = ? COLLATE NOCASE`
      )
      .get(course.id, uclass) as { c: number }
  ).c;
  if (classCount >= classCap) {
    res.status(409).json({
      error: `La classe ${uclass} ha già occupato i suoi ${classCap} posti in questo corso (massimo ${classCap} su ${course.capacity} per classe): i posti restanti sono aperti alle altre classi.`,
    });
    return;
  }
  try {
    db.exec("BEGIN IMMEDIATE");
    const booked = (
      db
        .prepare("SELECT COUNT(*) AS c FROM bookings WHERE course_id = ?")
        .get(course.id) as { c: number }
    ).c;
    if (booked >= course.capacity) {
      db.exec("ROLLBACK");
      res.status(409).json({ error: "Questo corso ha già esaurito i posti." });
      return;
    }
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO bookings (id, course_id, student_name, student_class, student_sede, created_at, ip, device)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      course.id,
      uname,
      uclass,
      usede,
      new Date().toISOString(),
      ip,
      device
    );
    db.exec("COMMIT");
    res.status(201).json({ ok: true, bookingId: id });
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      res.status(409).json({
        error: "Sei già iscritto a questo corso.",
      });
      return;
    }
    console.error("booking error:", err);
    res.status(500).json({ error: "Impossibile completare la prenotazione." });
  }
});

router.delete("/:id", requireAuth, (req: Request, res: Response) => {
  const row = db
    .prepare(
      `SELECT b.id, b.student_name, b.student_class, b.student_sede, c.sede AS course_sede
       FROM bookings b JOIN courses c ON c.id = b.course_id
       WHERE b.id = ?`
    )
    .get(req.params.id) as
    | {
        id: string;
        student_name: string;
        student_class: string;
        student_sede: string;
        course_sede: string;
      }
    | undefined;
  if (!row) {
    res.status(404).json({ error: "Prenotazione non trovata." });
    return;
  }
  if (!bookingWindowOpen(row.course_sede)) {
    res.status(403).json({
      error: "Non puoi più modificare le prenotazioni: la finestra è chiusa.",
    });
    return;
  }
  if (
    req.user!.role !== "rep" &&
    (row.student_name !== req.user!.name ||
      row.student_class !== req.user!.className ||
      row.student_sede !== req.user!.sede)
  ) {
    res.status(403).json({ error: "Questa prenotazione non è tua." });
    return;
  }
  db.prepare("DELETE FROM bookings WHERE id = ?").run(row.id);
  res.json({ ok: true });
});

export default router;
