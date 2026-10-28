import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get(["/health", "/healthz"], (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
