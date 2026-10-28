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

// ─── Session — SESSION_SECRET must be set in production ───────────────────────
const sessionKey = process.env.SESSION_SECRET;
if (!sessionKey && process.env.NODE_ENV === "production") {
  throw new Error(
    "SESSION_SECRET environment variable must be set in production. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}

app.use(
  cookieSession({
    name: "session",
    keys: [sessionKey || "turnkey-dev-only-secret-change-in-production"],
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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
const candidateDistPaths = [
  path.resolve(process.cwd(), "artifacts/kanak-turnkey/dist/public"),
  path.resolve(process.cwd(), "dist/public"),
  path.resolve(process.cwd(), "public"),
  path.resolve(__dirname, "../../kanak-turnkey/dist/public"),
  path.resolve(__dirname, "../public"),
];

const clientDistPath = candidateDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  logger.info({ clientDistPath }, "Serving static frontend bundle from Express");
  app.use(express.static(clientDistPath));

  app.get("*", (req, res, next) => {
    // Skip if path is an API endpoint or uploaded media
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, url: req.url, method: req.method }, "Unhandled server error");
  res.status(err.status || err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// Handle Chrome DevTools .well-known requests silently
app.all("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => {
  res.removeHeader("Content-Security-Policy");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(204).end();
});

export default app;
