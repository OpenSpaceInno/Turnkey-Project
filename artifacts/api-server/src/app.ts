import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieSession from "cookie-session";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV !== "development") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS with credentials support
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Trust reverse proxy (Coolify/Traefik/Nginx)
app.set("trust proxy", 1);

// ─── Session — SESSION_SECRET with secure fallback ─────────────────────────────
const defaultSecret =
  "b72fa82e5b38d7c4912d8a4392f7ae8e47bfec99f0e1adbc62a3424cb45100a7fa06de48a0cbead28ea4e4cbef4ecbb547bf14e5904ef2c39db8c0a83350ea26";
const sessionKey = process.env.SESSION_SECRET || defaultSecret;
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  logger.warn(
    "SESSION_SECRET environment variable is not explicitly set; using built-in fallback. " +
    "For production hardening, set SESSION_SECRET in your .env"
  );
}

app.use(
  cookieSession({
    name: "session",
    keys: [sessionKey],
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
  })
);

// ─── Protected /uploads — require active session ──────────────────────────────
import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";

const uploadsPath = path.join(process.cwd(), "uploads");
const rootUploadsPath = path.resolve(process.cwd(), "..", "..", "uploads");

function requireSessionForUploads(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "development") return next(); // allow in dev
  if (!req.session || !(req.session as any).userId) {
    return res.status(401).json({ error: "Authentication required to access files" });
  }
  next();
}

app.use("/uploads", requireSessionForUploads, express.static(uploadsPath));
if (fs.existsSync(rootUploadsPath)) {
  app.use("/uploads", requireSessionForUploads, express.static(rootUploadsPath));
}

app.get("/uploads/:filename", requireSessionForUploads, (req, res) => {
  const reqFilename = req.params.filename;
  const filePath = path.join(uploadsPath, reqFilename);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  const rootFilePath = path.join(rootUploadsPath, reqFilename);
  if (fs.existsSync(rootFilePath)) return res.sendFile(rootFilePath);
  res.status(404).send("File not found");
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Serve Frontend in Production ─────────────────────────────────────────────
export function getFrontendDist(): string | null {
  const candidateDistPaths = [
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "artifacts/kanak-turnkey/dist/public"),
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(__dirname, "../public"),
    path.resolve(__dirname, "../../kanak-turnkey/dist/public"),
  ];

  return (
    candidateDistPaths.find((p) => {
      try {
        return fs.existsSync(p) && fs.existsSync(path.join(p, "index.html"));
      } catch {
        return false;
      }
    }) || null
  );
}

const initialFrontendDist = getFrontendDist();
if (initialFrontendDist) {
  logger.info({ initialFrontendDist }, "Serving static frontend bundle from Express");
  app.use(express.static(initialFrontendDist));
} else {
  logger.warn("Frontend static bundle directory (index.html) not found at startup; will check per-request");
}

// Explicit root handler
app.get("/", (_req, res, next) => {
  const dist = getFrontendDist();
  if (dist) {
    return res.sendFile(path.join(dist, "index.html"));
  }
  next();
});

// Express 5 SPA catch-all middleware for client-side routing
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  const dist = getFrontendDist();
  if (dist) {
    return res.sendFile(path.join(dist, "index.html"));
  }
  next();
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, url: req.url, method: req.method, stack: err?.stack }, "Unhandled server error");
  const statusCode = err.status || err.statusCode || (err.name === "UnauthorizedError" ? 401 : 500);
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    details: err?.cause?.message || err?.sqlMessage || (process.env.NODE_ENV !== "production" ? err?.message : undefined),
  });
});

// Handle Chrome DevTools .well-known requests silently
app.all("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => {
  res.removeHeader("Content-Security-Policy");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(204).end();
});

export default app;
