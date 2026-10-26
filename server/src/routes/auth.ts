import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  timingSafeEqualStr,
} from "../security";
import config from "../config";

const router = Router();

const loginSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Il nome deve avere almeno 2 caratteri.")
    .max(60, "Il nome è troppo lungo.")
    .regex(
      /^[\p{L}\p{M}][\p{L}\p{M}' .\-]*$/u,
      "Il nome contiene caratteri non ammessi."
    ),
  className: z
    .string()
    .trim()
    .min(1, "Indica la classe.")
    .max(30, "Classe troppo lunga.")
    .regex(/^[A-Za-zÀ-ÿ0-9\s\-.]+$/, "Classe non valida."),
  sede: z.enum(["Bracciano", "Anguillara"], {
    errorMap: () => ({ message: "Seleziona la sede." }),
  }),
});

router.get("/me", (req: Request, res: Response) => {
  if (!req.user) {
    res.json({ user: null });
    return;
  }
  res.json({
    user: {
      role: req.user.role,
      name: req.user.name,
      className: req.user.className,
      sede: req.user.sede,
    },
  });
});

router.post("/login", (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    });
    return;
  }
  const { name, className, sede } = parsed.data;
  const { token, expiresAt } = createSession("student", name, className, sede);
  setSessionCookie(res, token, expiresAt);
  res.json({ user: { role: "student", name, className, sede } });
});

const repSchema = z.object({
  pin: z.string().min(4, "PIN non valido.").max(128, "PIN non valido."),
});

router.post("/rep-login", (req: Request, res: Response) => {
  const parsed = repSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "PIN non valido." });
    return;
  }
  if (!timingSafeEqualStr(parsed.data.pin, config.repPin)) {
    res.status(401).json({ error: "PIN errato." });
    return;
  }
  const { token, expiresAt } = createSession("rep", "Rappresentanti d'Istituto", "", "");
  setSessionCookie(res, token, expiresAt);
  res.json({
    user: { role: "rep", name: "Rappresentanti d'Istituto", className: "", sede: "" },
  });
});

router.post("/logout", requireAuth, (req: Request, res: Response) => {
  if (req.user) destroySession(req.user.tokenHash);
  clearSessionCookie(res);
  res.json({ ok: true });
});

export default router;
