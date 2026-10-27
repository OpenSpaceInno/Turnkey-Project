import cron from "node-cron";
import { db } from "@workspace/db";
import {
  invoicesTable,
  financialInstrumentsTable,
  projectsTable,
  usersTable,
} from "@workspace/db/schema";
import { and, lt, lte, gte, eq, notInArray, sql } from "drizzle-orm";
import { sendWorkflowEmail } from "./email-service";
import { logger } from "./logger";

/**
 * 1. Check for overdue client invoices and trigger notifications.
 */
export async function checkOverdueInvoices(): Promise<{ checked: number; overdueCount: number }> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Query invoices where dueDate < today and not fully paid/closed
    const overdueInvoices = await db
      .select({
        id: invoicesTable.id,
        invoiceNumber: invoicesTable.invoiceNumber,
        clientName: invoicesTable.clientName,
        amount: invoicesTable.amount,
        dueDate: invoicesTable.dueDate,
        status: invoicesTable.status,
        projectId: invoicesTable.projectId,
      })
      .from(invoicesTable)
      .where(
        and(
          lt(invoicesTable.dueDate, today),
          notInArray(invoicesTable.status, ["paid", "closed", "cancelled"])
        )
      );

    if (overdueInvoices.length === 0) {
      return { checked: 0, overdueCount: 0 };
    }

    // Find accountants or admin users to notify
    const accountants = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
      })
      .from(usersTable)
      .where(sql`JSON_CONTAINS(roles, '"accountant"') OR JSON_CONTAINS(roles, '"admin"')`);

    const recipientEmails = accountants.map((a) => a.email).filter(Boolean);
    const targetEmail = recipientEmails[0] || "finance@kanakturnkey.com";

    for (const inv of overdueInvoices) {
      const daysOverdue = Math.round(
        (Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      await sendWorkflowEmail({
        to: targetEmail,
        recipientName: "Finance & Accounts Team",
        eventType: "invoice_overdue",
        subject: `[Overdue Alert] Invoice ${inv.invoiceNumber} is ${daysOverdue} Days Overdue`,
        title: `Client Invoice Overdue: ${inv.invoiceNumber}`,
        message: `Client invoice ${inv.invoiceNumber} for '${inv.clientName}' of ₹${Number(
          inv.amount || 0
        ).toLocaleString("en-IN")} was due on ${inv.dueDate} and is now ${daysOverdue} days overdue. Please follow up on payment collection.`,
        actionUrl: `/finance`,
        actionLabel: "View Overdue Invoice",
        metadata: {
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
          amountDue: `₹ ${Number(inv.amount || 0).toLocaleString("en-IN")}`,
          dueDate: inv.dueDate,
          daysOverdue: `${daysOverdue} days`,
          currentStatus: inv.status,
        },
      });
    }

    logger.info(
      { count: overdueInvoices.length },
      "Completed overdue invoices check and dispatched email alerts"
    );
    return { checked: overdueInvoices.length, overdueCount: overdueInvoices.length };
  } catch (error) {
    logger.error({ err: error }, "Failed to execute checkOverdueInvoices job");
    return { checked: 0, overdueCount: 0 };
  }
}

/**
 * 2. Check for expiring financial instruments (Bank Guarantees, EMDs, Insurance)
 */
export async function checkExpiringFinancialInstruments(): Promise<{ checked: number; expiringCount: number }> {
  try {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    const expiringInstruments = await db
      .select({
        id: financialInstrumentsTable.id,
        instrumentType: financialInstrumentsTable.instrumentType,
        referenceNumber: financialInstrumentsTable.referenceNumber,
        bankName: financialInstrumentsTable.bankName,
        amount: financialInstrumentsTable.amount,
        expiryDate: financialInstrumentsTable.expiryDate,
        projectId: financialInstrumentsTable.projectId,
      })
      .from(financialInstrumentsTable)
      .where(
        and(
          eq(financialInstrumentsTable.status, "active"),
          lte(financialInstrumentsTable.expiryDate, thirtyDaysLater),
          gte(financialInstrumentsTable.expiryDate, todayStr)
        )
      );

    if (expiringInstruments.length === 0) {
      return { checked: 0, expiringCount: 0 };
    }

    const financeAdmins = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
      })
      .from(usersTable)
      .where(sql`JSON_CONTAINS(roles, '"accountant"') OR JSON_CONTAINS(roles, '"admin"')`);

    const targetEmail = financeAdmins[0]?.email || "finance@kanakturnkey.com";

    for (const inst of expiringInstruments) {
      const daysLeft = Math.round(
        (new Date(inst.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      await sendWorkflowEmail({
        to: targetEmail,
        recipientName: "Treasury & Finance Officer",
        eventType: "instrument_expiring",
        subject: `[Expiry Warning] ${inst.instrumentType} #${inst.referenceNumber || inst.id} Expires in ${daysLeft} Days`,
        title: `${inst.instrumentType} Approaching Expiry`,
        message: `${inst.instrumentType} #${inst.referenceNumber || inst.id} (${inst.bankName || "Bank"}) for ₹${Number(
          inst.amount || 0
        ).toLocaleString("en-IN")} will expire on ${inst.expiryDate} (${daysLeft} days remaining). Please initiate extension or release protocol.`,
        actionUrl: `/finance`,
        actionLabel: "Manage Financial Instrument",
        metadata: {
          instrumentType: inst.instrumentType,
          referenceNumber: inst.referenceNumber || `INST-${inst.id}`,
          bankName: inst.bankName || "Scheduled Commercial Bank",
          amount: `₹ ${Number(inst.amount || 0).toLocaleString("en-IN")}`,
          expiryDate: inst.expiryDate,
          daysRemaining: `${daysLeft} days`,
        },
      });
    }

    logger.info(
      { count: expiringInstruments.length },
      "Completed expiring financial instruments check and dispatched alerts"
    );
    return { checked: expiringInstruments.length, expiringCount: expiringInstruments.length };
  } catch (error) {
    logger.error({ err: error }, "Failed to execute checkExpiringFinancialInstruments job");
    return { checked: 0, expiringCount: 0 };
  }
}

/**
 * 3. TDS Auto-computation helper on invoices (Sprint S2-E)
 * Computes TDS (Section 194C / 194J) based on vendor/contractor category:
 * - 1% for individual/HUF contractors
 * - 2% for company/firm contractors (standard construction)
 * - 10% for professional/technical fees
 */
export function computeTdsAmount(
  grossAmount: number,
  category: "contractor_individual" | "contractor_company" | "professional" | "default" = "default"
): { tdsRatePercent: number; tdsAmount: number; netPayable: number } {
  let tdsRatePercent = 2.0; // Standard 2% for construction civil works (194C)
  if (category === "contractor_individual") tdsRatePercent = 1.0;
  else if (category === "professional") tdsRatePercent = 10.0;

  const tdsAmount = Math.round((grossAmount * tdsRatePercent) / 100);
  const netPayable = Math.max(0, grossAmount - tdsAmount);

  return { tdsRatePercent, tdsAmount, netPayable };
}

/**
 * Initialize all scheduled background cron jobs.
 */
export function startCronScheduler(): void {
  // Run daily at 09:00 AM server time
  cron.schedule("0 9 * * *", async () => {
    logger.info("Executing daily scheduled jobs: Overdue invoices & Instrument expiries...");
    await checkOverdueInvoices();
    await checkExpiringFinancialInstruments();
  });

  logger.info("Background Cron Scheduler registered successfully (Daily 09:00 AM)");
}
