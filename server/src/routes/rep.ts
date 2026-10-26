import { Router, Request, Response } from "express";
import { db, getSettings, CourseRow, BookingRow } from "../db";
import { requireRep } from "../security";

const router = Router();

const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });

router.get("/schedule.csv", requireRep, (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT * FROM courses WHERE status = 'approved' ORDER BY starts_at ASC, sede ASC, room ASC`
    )
    .all() as unknown as CourseRow[];
  const booked = (id: string) =>
    (db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE course_id = ?").get(id) as { c: number }).c;
  const lines = [
    "Inizio;Fine;Titolo;Categoria;Sede;Aula;Relatore;Classe;Iscritti;Posti",
    ...rows.map(
      (c) =>
        `${esc(fmt(c.starts_at))};${esc(fmt(c.ends_at))};${esc(c.title)};${esc(c.category)};${esc(c.sede)};${esc(c.room)};${esc(c.creator_name)};${esc(c.creator_class)};${booked(c.id)};${c.capacity}`
    ),
  ];
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="giornata-cogestione.csv"`);
  res.send("﻿" + lines.join("\r\n"));
});

router.get("/backup.json", requireRep, (_req: Request, res: Response) => {
  const courses = db.prepare("SELECT * FROM courses").all() as unknown as CourseRow[];
  const bookings = db.prepare("SELECT * FROM bookings").all() as unknown as BookingRow[];
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="backup-cogestione.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    note: "Backup Cogestione Vian — impostazioni, corsi e prenotazioni.",
    settings: getSettings(),
    courses,
    bookings,
  });
});

export default router;
