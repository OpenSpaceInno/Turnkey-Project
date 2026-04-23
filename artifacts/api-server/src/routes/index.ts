import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import leadsRouter from "./leads";
import projectsRouter from "./projects";
import financeRouter from "./finance";
import procurementRouter from "./procurement";
import communicationRouter from "./communication";
import systemRouter from "./system";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(leadsRouter);
router.use(projectsRouter);
router.use(financeRouter);
router.use(procurementRouter);
router.use(communicationRouter);
router.use(systemRouter);

export default router;
