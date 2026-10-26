import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { parse as parseCookie } from "cookie";
import config from "./config";
import { db } from "./db";

export interface SessionUser {
  role: "student" | "rep";
  name: string;
  className: string;
  sede: string;
  tokenHash: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSession(
  role: "student" | "rep",
  name: string,
  className: string,
  sede = ""
): { token: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + config.sessionTtlDays * 24 * 60 * 60 * 1000
  );
  db.prepare(
    `INSERT INTO sessions (token_hash, role, name, class_name, sede, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    tokenHash,
    role,
    name,
    className,
    sede,
    now.toISOString(),
    expiresAt.toISOString()
  );
  return { token, expiresAt };
}

export function destroySession(tokenHash: string): void {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: config.isProd,
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    sameSite: "strict",
    secure: config.isProd,
    path: "/",
  });
}

export function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.cookie;
  const cookies = header ? parseCookie(header) : {};
  // Cookie "dispositivo": identifica il browser/device per i limiti anti-abuso
  if (!cookies["cg_dev"]) {
    res.cookie("cg_dev", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "strict",
      secure: config.isProd,
      path: "/",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }
  const token = cookies[config.cookieName];
  if (!token) {
    next();
    return;
  }
  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      "SELECT token_hash, role, name, class_name, sede, expires_at FROM sessions WHERE token_hash = ?"
    )
    .get(tokenHash) as
    | {
        token_hash: string;
        role: "student" | "rep";
        name: string;
        class_name: string;
        sede: string;
        expires_at: string;
      }
    | undefined;
  if (!row) {
    next();
    return;
  }
  if (new Date(row.expires_at) < new Date()) {
    destroySession(tokenHash);
    next();
    return;
  }
  req.user = {
    role: row.role,
    name: row.name,
    className: row.class_name,
    sede: row.sede,
    tokenHash,
  };
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Devi effettuare il login per continuare." });
    return;
  }
  next();
}

export function requireRep(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Devi effettuare il login per continuare." });
    return;
  }
  if (req.user.role !== "rep") {
    res.status(403).json({ error: "Sezione riservata ai rappresentanti di istituto." });
    return;
  }
  next();
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function getCookieValue(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  return parseCookie(header)[name];
}

export function deviceHash(req: Request): string {
  const dev = getCookieValue(req, "cg_dev");
  if (!dev) return "n/a";
  return crypto.createHash("sha256").update(dev).digest("hex").slice(0, 12);
}
