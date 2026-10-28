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
  const foundDist = candidateDistPaths.find((p) => {
    try {
      return fs.existsSync(p) && fs.existsSync(path.join(p, "index.html"));
    } catch {
      return false;
    }
  });

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    frontendDist: foundDist || null,
  });
});

export default router;
