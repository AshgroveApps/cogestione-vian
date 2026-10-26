import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import config from "./config";
import { sessionMiddleware } from "./security";
import authRouter from "./routes/auth";
import coursesRouter from "./routes/courses";
import bookingsRouter from "./routes/bookings";
import settingsRouter from "./routes/settings";
import repRouter from "./routes/rep";

const app = express();

app.disable("x-powered-by");

if (config.isProd) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: config.isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin) {
      try {
        const o = new URL(origin);
        const host = req.headers.host;
        if (o.host !== host) {
          res.status(403).json({ error: "Origine non autorizzata." });
          return;
        }
      } catch {
        res.status(403).json({ error: "Origine non autorizzata." });
        return;
      }
    }
  }
  next();
});

app.use(express.json({ limit: "32kb" }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Troppe richieste. Riprova più tardi." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Troppe tentativi. Riprova tra qualche minuto." },
});
const actionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Troppe operazioni. Riprova tra qualche minuto." },
});

app.use("/api", globalLimiter);
app.use(sessionMiddleware);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/courses", actionLimiter, coursesRouter);
app.use("/api/bookings", actionLimiter, bookingsRouter);
app.use("/api/settings", actionLimiter, settingsRouter);
app.use("/api/rep", actionLimiter, repRouter);

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint non trovato." });
});

if (fs.existsSync(config.clientDist)) {
  app.use(
    express.static(config.clientDist, {
      index: false,
      maxAge: config.isProd ? "1h" : 0,
    })
  );
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(config.clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });
}

app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Errore interno del server." });
  }
);

export default app;
