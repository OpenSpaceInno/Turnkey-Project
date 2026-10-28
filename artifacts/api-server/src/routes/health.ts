import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

import fs from "fs";
import path from "path";

const router: IRouter = Router();

router.get(["/health", "/healthz"], (_req, res) => {
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

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    frontendDist: foundDist,
    rootFiles,
    inspectResults,
  });
});

export default router;
