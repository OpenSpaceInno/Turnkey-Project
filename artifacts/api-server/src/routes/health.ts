import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import { pool, getSanitizedDbInfo } from "@workspace/db";

const router: IRouter = Router();

router.get(["/health", "/healthz"], async (_req, res) => {
  const candidateDistPaths = [
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "artifacts/kanak-turnkey/dist/public"),
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(__dirname, "../public"),
    path.resolve(__dirname, "../../kanak-turnkey/dist/public"),
  ];

  const inspectResults = candidateDistPaths.map((p) => {
    let exists = false;
    let hasIndex = false;
    let files: string[] = [];
    try {
      exists = fs.existsSync(p);
      if (exists) {
        hasIndex = fs.existsSync(path.join(p, "index.html"));
        files = fs.readdirSync(p).slice(0, 10);
      }
    } catch (e: any) {
      files = [e.message];
    }
    return { path: p, exists, hasIndex, files };
  });

  const foundDist = inspectResults.find((r) => r.hasIndex)?.path || null;

  let rootFiles: string[] = [];
  try {
    rootFiles = fs.readdirSync(process.cwd());
  } catch (e: any) {
    rootFiles = [e.message];
  }

  // Live Database Connectivity Probe
  let dbStatus = "unknown";
  let dbLatencyMs: number | null = null;
  let dbError: any = null;

  try {
    const start = Date.now();
    await pool.query("SELECT 1 AS ping;");
    dbLatencyMs = Date.now() - start;
    dbStatus = "connected";
  } catch (err: any) {
    dbStatus = "disconnected";
    dbError = {
      message: err.message,
      code: err.code || "UNKNOWN",
      errno: err.errno,
      syscall: err.syscall,
      address: err.address,
      port: err.port,
    };
  }

  const dbInfo = getSanitizedDbInfo();

  res.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    database: {
      status: dbStatus,
      targetHost: dbInfo.host,
      targetPort: dbInfo.port,
      targetDatabase: dbInfo.database,
      targetUser: dbInfo.user,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    frontendDist: foundDist,
    rootFiles,
    inspectResults,
  });
});

export default router;
