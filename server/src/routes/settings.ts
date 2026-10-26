import { Router, Request, Response } from "express";
import { z } from "zod";
import { db, getSedeSettings } from "../db";
import { requireRep } from "../security";
import { settingsPayload } from "./courses";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(settingsPayload());
});

const sedeWindowSchema = z.object({
  eventDate: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Data evento non valida.")
    .optional(),
  bookingOpensAt: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Data apertura non valida.")
    .optional(),
  bookingClosesAt: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Data chiusura non valida.")
    .optional(),
});

const settingsSchema = z.object({
  eventTitle: z.string().trim().min(3).max(120).optional(),
  eventLocation: z.string().trim().min(1).max(200).optional(),
  eventDescription: z.string().trim().min(10).max(2000).optional(),
  sedi: z
    .object({
      Bracciano: sedeWindowSchema.optional(),
      Anguillara: sedeWindowSchema.optional(),
    })
    .optional(),
});

const KEY_MAP: Record<string, string> = {
  eventTitle: "event_title",
  eventLocation: "event_location",
  eventDescription: "event_description",
};

router.put("/", requireRep, (req: Request, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    });
    return;
  }
  const d = parsed.data;

  for (const [sede, w] of Object.entries(d.sedi ?? {})) {
    if (!w) continue;
    const cur = getSedeSettings(sede);
    const opens = w.bookingOpensAt !== undefined ? w.bookingOpensAt : cur.booking_opens_at;
    const closes = w.bookingClosesAt !== undefined ? w.bookingClosesAt : cur.booking_closes_at;
    if (opens && closes && new Date(opens) > new Date(closes)) {
      res.status(400).json({
        error: `Per la sede di ${sede === "Anguillara" ? "Anguillara Sabazia" : "Bracciano"}: l'apertura delle prenotazioni deve precedere la chiusura.`,
      });
      return;
    }
  }

  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  for (const [k, v] of Object.entries(d)) {
    if (typeof v !== "string") continue;
    const key = KEY_MAP[k];
    if (!key) continue;
    upsert.run(key, v);
  }

  const upsertSede = db.prepare(
    `INSERT INTO sede_settings (sede, event_date, booking_opens_at, booking_closes_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(sede) DO UPDATE SET
       event_date = excluded.event_date,
       booking_opens_at = excluded.booking_opens_at,
       booking_closes_at = excluded.booking_closes_at`
  );
  for (const [sede, w] of Object.entries(d.sedi ?? {})) {
    if (!w) continue;
    const cur = getSedeSettings(sede);
    upsertSede.run(
      sede,
      w.eventDate !== undefined ? w.eventDate : cur.event_date,
      w.bookingOpensAt !== undefined ? w.bookingOpensAt : cur.booking_opens_at,
      w.bookingClosesAt !== undefined ? w.bookingClosesAt : cur.booking_closes_at
    );
  }

  res.json(settingsPayload());
});

export default router;
