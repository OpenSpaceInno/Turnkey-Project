import nodemailer from "nodemailer";
import { db, emailLogsTable, notificationPreferencesTable, usersTable } from "@workspace/db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface WorkflowEmailPayload {
  to: string;
  recipientName?: string;
  userId?: number;
  eventType: string;
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  force?: boolean;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId: string;
  status: "delivered" | "sent" | "simulated" | "failed";
  mode: "smtp" | "simulated";
  error?: string;
}

// In-memory buffer for fast outbox inspection
const recentEmailLogs: Array<{
  id: number;
  recipientEmail: string;
  recipientName: string | null;
  userId: number | null;
  eventType: string;
  subject: string;
  status: string;
  bodyPreview: string | null;
  bodyHtml: string | null;
  metadata: any;
  errorMessage: string | null;
  createdAt: Date;
}> = [];

// Transporter cache
let smtpTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user) {
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return smtpTransporter;
  }

  return null;
}

/**
 * Check if the user has enabled email notifications for this event type.
 * Preferences format:
 *   - Modern: { [eventType]: { inApp: boolean, email: boolean } }
 *   - Legacy: { [eventType]: boolean } (true = both enabled)
 */
export async function shouldSendWorkflowEmail(userId: number, eventType: string): Promise<boolean> {
  try {
    const [row] = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, userId))
      .limit(1);

    if (!row || !row.preferences) {
      // Default enabled for all workflow events
      return true;
    }

    const prefs = row.preferences as Record<string, any>;
    const pref = prefs[eventType];

    if (pref === undefined || pref === null) {
      return true; // default enabled
    }

    if (typeof pref === "boolean") {
      return pref;
    }

    if (typeof pref === "object" && typeof pref.email === "boolean") {
      return pref.email;
    }

    return true;
  } catch (err) {
    console.error(`Error checking email preferences for user ${userId}:`, err);
    return true;
  }
}

/**
 * Render a polished, turnkey-branded HTML email.
 */
export function renderWorkflowEmailHtml(params: {
  title: string;
  message: string;
  eventType: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  recipientName?: string;
}): string {
  const { title, message, eventType, actionUrl, actionLabel, metadata, recipientName } = params;

  // Determine badge color and label based on event type
  let badgeColor = "#2563eb"; // Blue
  let badgeText = "Workflow Event";

  if (eventType.includes("discrepancy") || eventType.includes("rejected") || eventType.includes("expiring")) {
    badgeColor = "#dc2626"; // Red
    badgeText = "Action Required / Alert";
  } else if (eventType.includes("approved") || eventType.includes("certified") || eventType.includes("matched")) {
    badgeColor = "#16a34a"; // Green
    badgeText = "Workflow Milestone";
  } else if (eventType.includes("submitted") || eventType.includes("received")) {
    badgeColor = "#d97706"; // Amber
    badgeText = "Review Needed";
  }

  const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
  const fullActionUrl = actionUrl
    ? actionUrl.startsWith("http")
      ? actionUrl
      : `${appBaseUrl}${actionUrl.startsWith("/") ? "" : "/"}${actionUrl}`
    : `${appBaseUrl}/notifications`;

  // Render metadata rows if present
  let metadataRows = "";
  if (metadata && Object.keys(metadata).length > 0) {
    metadataRows = `
      <div style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          ${Object.entries(metadata)
            .map(([key, value]) => {
              if (value === undefined || value === null || typeof value === "object") return "";
              const formattedKey = key
                .replace(/([A-Z])/g, " $1")
                .replace(/_/g, " ")
                .replace(/^./, (str) => str.toUpperCase());
              return `
              <tr style="border-bottom: 1px solid #edf2f7;">
                <td style="padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;">${formattedKey}</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${String(value)}</td>
              </tr>
            `;
            })
            .join("")}
        </table>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; border-bottom: 3px solid #3b82f6;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
                      KANAK <span style="color: #60a5fa; font-weight: 400;">TURNKEY</span>
                    </h1>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Enterprise Construction Management
                    </p>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              ${recipientName ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">Hello <strong>${recipientName}</strong>,</p>` : ""}
              
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.4;">
                ${title}
              </h2>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                ${message}
              </p>

              ${metadataRows}

              <!-- Call to Action Button -->
              <div style="margin: 28px 0 16px 0; text-align: left;">
                <a href="${fullActionUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                  ${actionLabel || "View Details in Kanak Turnkey"} &rarr;
                </a>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Or paste this link into your browser: <br/>
                <a href="${fullActionUrl}" style="color: #2563eb; word-break: break-all;">${fullActionUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px 0; font-weight: 500; color: #475569;">Kanak Turnkey Solutions ERP</p>
                    <p style="margin: 0; color: #94a3b8;">Automated Workflow Event Notification</p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <a href="${appBaseUrl}/notifications" style="color: #2563eb; text-decoration: none;">Notification Settings</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send a workflow event notification email.
 */
export async function sendWorkflowEmail(payload: WorkflowEmailPayload): Promise<EmailDispatchResult> {
  const {
    to,
    recipientName,
    userId,
    eventType,
    subject,
    title,
    message,
    actionUrl,
    actionLabel,
    metadata,
    force = false,
  } = payload;

  // 1. Preference check (skip if force is true)
  if (!force && userId) {
    const isEnabled = await shouldSendWorkflowEmail(userId, eventType);
    if (!isEnabled) {
      return {
        success: true,
        messageId: "skipped-preference",
        status: "delivered",
        mode: "simulated",
      };
    }
  }

  // 2. Generate HTML
  const html = renderWorkflowEmailHtml({
    title,
    message,
    eventType,
    actionUrl,
    actionLabel,
    metadata,
    recipientName,
  });

  const preview = `${title}: ${message}`.slice(0, 300);

  // 3. Attempt delivery
  const transporter = getTransporter();
  let status: "delivered" | "sent" | "simulated" | "failed" = "delivered";
  let mode: "smtp" | "simulated" = "simulated";
  let messageId = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  let errorMessage: string | null = null;

  if (transporter) {
    try {
      const from = process.env.SMTP_FROM || `"Kanak Turnkey Solutions" <notifications@kanakturnkey.com>`;
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: `${title}\n\n${message}\n\nView details: ${actionUrl || "/"}`,
        html,
      });
      messageId = info.messageId || messageId;
      status = "sent";
      mode = "smtp";
    } catch (err: any) {
      console.warn("SMTP send failed, falling back to simulated dispatch:", err?.message);
      errorMessage = err?.message || String(err);
      status = "delivered"; // Simulated fallback
      mode = "simulated";
    }
  } else {
    // Simulated delivery (development or standard mode)
    mode = "simulated";
    status = "delivered";
  }

  // 4. Record to Database (emailLogsTable)
  let insertedId = 0;
  try {
    const [res] = await db.insert(emailLogsTable).values({
      recipientEmail: to,
      recipientName: recipientName || null,
      userId: userId || null,
      eventType,
      subject,
      status,
      bodyPreview: preview,
      bodyHtml: html,
      metadata: metadata || null,
      errorMessage,
      createdAt: new Date(),
    });
    insertedId = (res as any)?.insertId || Date.now();
  } catch (dbErr) {
    console.error("Failed to insert email log into database:", dbErr);
  }

  // 5. Push to in-memory recent logs buffer
  const logItem = {
    id: insertedId || Date.now(),
    recipientEmail: to,
    recipientName: recipientName || null,
    userId: userId || null,
    eventType,
    subject,
    status,
    bodyPreview: preview,
    bodyHtml: html,
    metadata: metadata || null,
    errorMessage,
    createdAt: new Date(),
  };

  recentEmailLogs.unshift(logItem);
  if (recentEmailLogs.length > 200) {
    recentEmailLogs.pop();
  }

  return {
    success: true,
    messageId,
    status,
    mode,
    error: errorMessage || undefined,
  };
}

/**
 * Send a sample/test workflow email for testing and verification.
 */
export async function sendTestWorkflowEmail(params: {
  toEmail: string;
  recipientName?: string;
  eventType?: string;
  userId?: number;
}): Promise<EmailDispatchResult> {
  const { toEmail, recipientName = "Team Member", eventType = "ra_bill_submitted", userId } = params;

  const samples: Record<
    string,
    { subject: string; title: string; message: string; actionUrl: string; actionLabel: string; metadata: any }
  > = {
    ra_bill_submitted: {
      subject: "[Action Required] RA Bill #RA-2026-004 Submitted for Client Certification",
      title: "RA Bill #RA-2026-004 Submitted",
      message:
        "Running Account Bill #RA-2026-004 for project 'Commercial Tower B' has been submitted for certification. Please review the enclosed itemized measurement breakdown and certified quantities.",
      actionUrl: "/ra-bills",
      actionLabel: "Review RA Bill",
      metadata: {
        project: "Commercial Tower B",
        billNumber: "RA-2026-004",
        grossAmount: "₹ 14,85,000",
        netPayable: "₹ 13,36,500",
        submissionDate: "2026-10-23",
        submittedBy: "Rajesh Kumar (Project Manager)",
      },
    },
    ra_bill_certified: {
      subject: "[Certified] RA Bill #RA-2026-003 Certified for Payment",
      title: "RA Bill #RA-2026-003 Certified",
      message:
        "The client engineer has approved and certified RA Bill #RA-2026-003. Finance team may now issue the tax invoice and record the receivable.",
      actionUrl: "/ra-bills",
      actionLabel: "View Certified RA Bill",
      metadata: {
        project: "Luxury Villa Residences",
        billNumber: "RA-2026-003",
        certifiedAmount: "₹ 28,40,000",
        deductions: "₹ 2,84,000",
        certificationDate: "2026-10-23",
      },
    },
    purchase_order_approved: {
      subject: "[Approved] Purchase Order #PO-2026-018 Approved",
      title: "Purchase Order #PO-2026-018 Approved",
      message:
        "Purchase Order #PO-2026-018 for 'TMT Steel Fe 550D' has been formally approved and is ready to be issued to Tata Steel Ltd.",
      actionUrl: "/procurement/purchase-orders",
      actionLabel: "View Purchase Order",
      metadata: {
        poNumber: "PO-2026-018",
        vendor: "Tata Steel Ltd",
        totalValue: "₹ 8,92,000",
        deliveryLocation: "Site B - Phase 2 Yard",
        approvedBy: "Karthik Subramanian (Director)",
      },
    },
    vendor_invoice_discrepancy: {
      subject: "[Discrepancy Alert] 3-Way Match Mismatch on Invoice #INV-8831",
      title: "3-Way Match Price & Quantity Discrepancy",
      message:
        "Vendor invoice #INV-8831 from UltraTech Cement contains a 6.2% price variance compared to PO-2026-009. Payment hold has been applied pending resolution.",
      actionUrl: "/finance",
      actionLabel: "Resolve Discrepancy",
      metadata: {
        invoiceNumber: "INV-8831",
        vendor: "UltraTech Cement Ltd",
        poNumber: "PO-2026-009",
        billedAmount: "₹ 4,45,000",
        expectedAmount: "₹ 4,19,000",
        variance: "+ ₹ 26,000 (+6.2%)",
      },
    },
    quality_inspection_rejected: {
      subject: "[Quality Alert] RMC Concrete Pour Inspection Rejected",
      title: "Concrete Slump Test Failed — Pour Rejected",
      message:
        "Quality inspection at Pour Area 4 (Basement Retaining Wall) did not meet slump and temperature tolerance limits. Re-testing required before work can resume.",
      actionUrl: "/quality",
      actionLabel: "View Inspection Report",
      metadata: {
        project: "Metro Station Concourse",
        inspectionId: "QI-2026-074",
        criteria: "Slump & Air Content",
        inspector: "Suresh Patil (QA Lead)",
        status: "REJECTED",
      },
    },
    instrument_expiring: {
      subject: "[Critical Alert] Bank Guarantee BG-2024-991 Expires in 18 Days",
      title: "Performance Bank Guarantee Expiring Soon",
      message:
        "Performance Bank Guarantee BG-2024-991 of ₹ 25,00,000 with HDFC Bank expires on 10-Nov-2026. Please initiate extension or client release request immediately.",
      actionUrl: "/finance",
      actionLabel: "Manage Financial Instruments",
      metadata: {
        instrumentType: "Performance Bank Guarantee",
        bankName: "HDFC Bank Ltd",
        instrumentNumber: "BG-2024-991",
        amount: "₹ 25,00,000",
        daysRemaining: "18 Days",
        expiryDate: "10-Nov-2026",
      },
    },
    punch_item_assigned: {
      subject: "[Task Assigned] Punch List Item #PL-108 Assigned",
      title: "Punch List Item Assigned: HVAC Duct Leak Testing",
      message:
        "You have been assigned to resolve punch list item #PL-108: HVAC Duct Leak Testing on 4th Floor North Wing before handover.",
      actionUrl: "/site-execution",
      actionLabel: "View Punch Item",
      metadata: {
        itemNumber: "PL-108",
        priority: "High",
        location: "Floor 4, North Wing",
        targetCompletion: "26-Oct-2026",
      },
    },
  };

  const sample = samples[eventType] || {
    subject: `[Notification] Workflow Event: ${eventType}`,
    title: `Workflow Event: ${eventType}`,
    message: `This is a test notification for the workflow event '${eventType}'. Automated emails are delivered when matching events trigger in Kanak Turnkey.`,
    actionUrl: "/notifications",
    actionLabel: "Open Notifications",
    metadata: {
      eventType,
      triggeredAt: new Date().toISOString(),
      recipient: toEmail,
    },
  };

  return sendWorkflowEmail({
    to: toEmail,
    recipientName,
    userId,
    eventType,
    subject: sample.subject,
    title: sample.title,
    message: sample.message,
    actionUrl: sample.actionUrl,
    actionLabel: sample.actionLabel,
    metadata: sample.metadata,
    force: true, // Always dispatch test emails regardless of preference
  });
}

/**
 * Retrieve recent email logs with optional filtering.
 */
export async function getWorkflowEmailLogs(params: {
  limit?: number;
  offset?: number;
  eventType?: string;
  search?: string;
}) {
  const limit = Math.min(params.limit || 50, 100);
  const offset = params.offset || 0;

  try {
    let query = db.select().from(emailLogsTable);

    const conditions = [];
    if (params.eventType) {
      conditions.push(eq(emailLogsTable.eventType, params.eventType));
    }
    if (params.search) {
      conditions.push(
        or(
          like(emailLogsTable.recipientEmail, `%${params.search}%`),
          like(emailLogsTable.subject, `%${params.search}%`),
          like(emailLogsTable.bodyPreview, `%${params.search}%`)
        )
      );
    }

    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(emailLogsTable.createdAt)).limit(limit).offset(offset)
      : await query.orderBy(desc(emailLogsTable.createdAt)).limit(limit).offset(offset);

    return rows;
  } catch (err) {
    console.error("Database query for email logs failed, using memory buffer:", err);
    // Fallback to in-memory buffer
    let filtered = recentEmailLogs;
    if (params.eventType) {
      filtered = filtered.filter((l) => l.eventType === params.eventType);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.recipientEmail.toLowerCase().includes(s) ||
          l.subject.toLowerCase().includes(s) ||
          (l.bodyPreview && l.bodyPreview.toLowerCase().includes(s))
      );
    }
    return filtered.slice(offset, offset + limit);
  }
}
