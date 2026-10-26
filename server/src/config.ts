import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const config = {
  port: Number(process.env.PORT || 4000),
  repPin: process.env.REP_PIN || "VianCogestione2026",
  sessionTtlDays: 30,
  dbPath:
    process.env.DB_PATH || path.join(__dirname, "..", "data", "cogestione.db"),
  clientDist: path.join(__dirname, "..", "..", "client", "dist"),
  isProd: process.env.NODE_ENV === "production",
  cookieName: "vian_cogestione_session",
};

export default config;
