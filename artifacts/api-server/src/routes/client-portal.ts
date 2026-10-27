import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  dailyProgressReportsTable,
  invoicesTable,
  raBillsTable,
} from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

/**
 * GET /api/client-portal/summary
 * Client overview of all assigned / active projects, overall completion, and invoices.
 */
router.get("/client-portal/summary", async (req, res): Promise<void> => {
  try {
    const user = await getCurrentUser(req);

    // Fetch projects (scoped by organization or client identity)
    const projects = await db
      .select({
        id: projectsTable.id,
        name: projectsTable.name,
        type: projectsTable.type,
        location: projectsTable.location,
        clientName: projectsTable.clientName,
        startDate: projectsTable.startDate,
        endDate: projectsTable.endDate,
        status: projectsTable.status,
        progress: projectsTable.progress,
        lifecycleStage: projectsTable.lifecycleStage,
      })
      .from(projectsTable)
      .where(eq(projectsTable.organizationId, user.organizationId || 1));

    const [invoices, dprs, raBills] = await Promise.all([
      db.select().from(invoicesTable),
      db.select().from(dailyProgressReportsTable).orderBy(desc(dailyProgressReportsTable.reportDate)),
      db.select().from(raBillsTable),
    ]);

    const projectSummaries = projects.map((p) => {
      const pInvoices = invoices.filter((i) => i.projectId === p.id);
      const pDprs = dprs.filter((d) => d.projectId === p.id);
      const pRaBills = raBills.filter((b) => b.projectId === p.id);

      const totalInvoiced = pInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      const totalPaid = pInvoices
        .filter((i) => i.status === "paid" || i.status === "closed")
        .reduce((s, i) => s + Number(i.amount || 0), 0);
      const pendingPayment = Math.max(0, totalInvoiced - totalPaid);

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        location: p.location,
        clientName: p.clientName,
        startDate: p.startDate,
        targetHandover: p.endDate,
        status: p.status,
        progressPercent: Number(p.progress || 0),
        totalInvoiced,
        totalPaid,
        pendingPayment,
        dprCount: pDprs.length,
        latestDprDate: pDprs[0]?.reportDate || null,
        certifiedBillsCount: pRaBills.filter((b) => b.status === "approved" || b.status === "invoice_generated").length,
      };
    });

    const portfolioProgress =
      projectSummaries.length > 0
        ? Math.round(projectSummaries.reduce((s, p) => s + p.progressPercent, 0) / projectSummaries.length)
        : 0;

    res.json({
      clientInfo: {
        userName: user.name,
        userEmail: user.email,
        role: user.activeRole,
      },
      portfolioProgress,
      totalActiveSites: projectSummaries.length,
      projects: projectSummaries,
    });
  } catch (error) {
    console.error("Error fetching client portal summary:", error);
    res.status(500).json({ error: "Failed to fetch client portal summary" });
  }
});

/**
 * GET /api/client-portal/projects/:id
 * Client detailed project view with DPR logs, photos, and certified invoices.
 */
router.get("/client-portal/projects/:id", async (req, res): Promise<void> => {
  try {
    const rawId = req.params.id as string;
    const projectId = parseInt(rawId, 10);

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId));

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const [dprs, invoices, raBills] = await Promise.all([
      db
        .select({
          id: dailyProgressReportsTable.id,
          reportDate: dailyProgressReportsTable.reportDate,
          weather: dailyProgressReportsTable.weather,
          shift: dailyProgressReportsTable.shift,
          workSummary: dailyProgressReportsTable.workSummary,
          manpowerCount: dailyProgressReportsTable.manpowerCount,
          siteIssues: dailyProgressReportsTable.siteIssues,
        })
        .from(dailyProgressReportsTable)
        .where(eq(dailyProgressReportsTable.projectId, projectId))
        .orderBy(desc(dailyProgressReportsTable.reportDate))
        .limit(30),

      db
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.projectId, projectId))
        .orderBy(desc(invoicesTable.invoiceDate)),

      db
        .select()
        .from(raBillsTable)
        .where(eq(raBillsTable.projectId, projectId))
        .orderBy(desc(raBillsTable.billingPeriodEnd)),
    ]);

    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      amount: Number(inv.amount || 0),
      grossAmount: Number(inv.grossAmount || inv.amount || 0),
      taxAmount: Number(inv.taxAmount || 0),
      netAmount: Number(inv.netAmount || inv.amount || 0),
      status: inv.status,
      pdfDownloadUrl: `/api/invoices/${inv.id}/export-pdf`,
    }));

    const formattedRaBills = raBills.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      milestone: b.milestone || b.description,
      periodStart: b.billingPeriodStart,
      periodEnd: b.billingPeriodEnd,
      grossAmount: Number(b.grossAmount || 0),
      retentionAmount: Number(b.retentionAmount || 0),
      netPayableAmount: Number(b.netPayableAmount || b.amount || 0),
      status: b.status,
      pdfDownloadUrl: `/api/ra-bills/${b.id}/export-pdf`,
    }));

    res.json({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        location: project.location,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        progressPercent: Number(project.progress || 0),
      },
      dprs,
      invoices: formattedInvoices,
      raBills: formattedRaBills,
    });
  } catch (error) {
    console.error("Error fetching client project detail:", error);
    res.status(500).json({ error: "Failed to fetch client project detail" });
  }
});

export default router;
