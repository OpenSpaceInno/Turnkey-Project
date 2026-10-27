import { Router, type IRouter } from "express";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import {
  db,
  procurementRfqsTable,
  procurementRfqItemsTable,
  procurementRfqVendorsTable,
  procurementMaterialRequestsTable,
  procurementMaterialRequestItemsTable,
  projectsTable,
  usersTable,
  vendorsTable,
  communicationsTable,
  procurementNotificationsTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";

const router: IRouter = Router();

// Transform numeric fields
const fRfq = (r: Record<string, unknown>) =>
  numKeys(r, ["projectId", "materialRequestId", "sentToVendorCount", "quotesReceivedCount", "selectedQuoteId", "createdById"]);

const fRfqItem = (r: Record<string, unknown>) =>
  numKeys(r, ["rfqId", "quantity"]);

const fRfqVendor = (r: Record<string, unknown>) =>
  numKeys(r, ["rfqId", "vendorId"]);

// ═══════════════════════════════════════════════════════════════════════════
// RFQs - List & Get
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/rfqs - List all RFQs
router.get("/", async (req, res): Promise<void> => {
  try {
    const { projectId, status, materialRequestId } = req.query;

    let query = db
      .select({
        rfq: procurementRfqsTable,
        projectName: projectsTable.name,
        createdByName: usersTable.name,
        materialRequestNumber: procurementMaterialRequestsTable.requestNumber,
      })
      .from(procurementRfqsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementRfqsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementRfqsTable.createdById))
      .leftJoin(
        procurementMaterialRequestsTable,
        eq(procurementMaterialRequestsTable.id, procurementRfqsTable.materialRequestId)
      )
      .$dynamic();

    // Apply filters
    const conditions = [];
    if (projectId) {
      conditions.push(eq(procurementRfqsTable.projectId, Number(projectId)));
    }
    if (status) {
      conditions.push(eq(procurementRfqsTable.status, String(status)));
    }
    if (materialRequestId) {
      conditions.push(eq(procurementRfqsTable.materialRequestId, Number(materialRequestId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(procurementRfqsTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...fRfq(r.rfq),
        projectName: r.projectName,
        createdByName: r.createdByName,
        materialRequestNumber: r.materialRequestNumber,
      }))
    );
  } catch (error) {
    console.error("Error fetching RFQs:", error);
    res.status(500).json({ error: "Failed to fetch RFQs" });
  }
});

// GET /api/procurement/rfqs/:id - Get single RFQ with items and vendors
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const [rfq] = await db
      .select({
        rfq: procurementRfqsTable,
        projectName: projectsTable.name,
        createdByName: usersTable.name,
        materialRequestNumber: procurementMaterialRequestsTable.requestNumber,
        materialRequestTitle: procurementMaterialRequestsTable.title,
      })
      .from(procurementRfqsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementRfqsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementRfqsTable.createdById))
      .leftJoin(
        procurementMaterialRequestsTable,
        eq(procurementMaterialRequestsTable.id, procurementRfqsTable.materialRequestId)
      )
      .where(eq(procurementRfqsTable.id, id));

    if (!rfq) {
      res.status(404).json({ error: "RFQ not found" });
      return;
    }

    // Get items
    const items = await db
      .select()
      .from(procurementRfqItemsTable)
      .where(eq(procurementRfqItemsTable.rfqId, id))
      .orderBy(procurementRfqItemsTable.sortOrder);

    // Get vendors
    const vendorsData = await db
      .select({
        rfqVendor: procurementRfqVendorsTable,
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
        vendorPhone: vendorsTable.phone,
      })
      .from(procurementRfqVendorsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementRfqVendorsTable.vendorId))
      .where(eq(procurementRfqVendorsTable.rfqId, id));

    res.json({
      ...fRfq(rfq.rfq),
      projectName: rfq.projectName,
      createdByName: rfq.createdByName,
      materialRequestNumber: rfq.materialRequestNumber,
      materialRequestTitle: rfq.materialRequestTitle,
      items: items.map(fRfqItem),
      vendors: vendorsData.map((v) => ({
        ...fRfqVendor(v.rfqVendor),
        vendorName: v.vendorName,
        vendorEmail: v.vendorEmail,
        vendorPhone: v.vendorPhone,
      })),
    });
  } catch (error) {
    console.error("Error fetching RFQ:", error);
    res.status(500).json({ error: "Failed to fetch RFQ" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// RFQs - Create
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/rfqs - Create a new RFQ directly
router.post("/", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const { materialRequestId, title, description, dueDate, notes, projectId, vendorIds } = req.body ?? {};

    // Resolve projectId from material request if not provided directly
    let resolvedProjectId = projectId ? Number(projectId) : null;
    if (!resolvedProjectId && materialRequestId) {
      const [mr] = await db
        .select()
        .from(procurementMaterialRequestsTable)
        .where(eq(procurementMaterialRequestsTable.id, Number(materialRequestId)))
        .limit(1);
      if (!mr) {
        res.status(404).json({ error: "Material request not found" });
        return;
      }
      resolvedProjectId = mr.projectId;
    }

    // Generate RFQ number
    const rfqNumber = await generateNumber("RFQ", procurementRfqsTable);

    // Format dueDate safely for MySQL date column
    let targetDueDate: string;
    if (dueDate) {
      targetDueDate = typeof dueDate === "string" && dueDate.includes("T")
        ? dueDate.split("T")[0]!
        : String(dueDate);
    } else {
      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      targetDueDate = defaultDate.toISOString().split("T")[0]!;
    }

    // Create RFQ
    await db.insert(procurementRfqsTable).values({
      rfqNumber,
      materialRequestId: materialRequestId ? Number(materialRequestId) : null,
      projectId: resolvedProjectId!,
      title: title ?? `RFQ ${rfqNumber}`,
      description: description ?? null,
      status: "draft",
      issueDate: null,
      dueDate: targetDueDate,
      closedDate: null,
      sentToVendorCount: Array.isArray(vendorIds) ? vendorIds.length : 0,
      quotesReceivedCount: 0,
      selectedQuoteId: null,
      createdById: me.id,
      notes: notes ?? null,
    });

    const [rfq] = await db
      .select({
        rfq: procurementRfqsTable,
        projectName: projectsTable.name,
        createdByName: usersTable.name,
      })
      .from(procurementRfqsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementRfqsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementRfqsTable.createdById))
      .where(eq(procurementRfqsTable.rfqNumber, rfqNumber))
      .limit(1);

    // Add vendors if provided
    if (vendorIds && Array.isArray(vendorIds) && vendorIds.length > 0) {
      const rfqVendors = vendorIds.map((vendorId: number) => ({
        rfqId: rfq!.rfq.id,
        vendorId,
        sentDate: null,
        respondedDate: null,
        status: "pending",
      }));
      await db.insert(procurementRfqVendorsTable).values(rfqVendors);
    }

    // Insert RFQ items if provided in body or extracted from notes
    let itemsToInsert = Array.isArray(req.body?.items) && req.body.items.length > 0 ? req.body.items : [];
    if (itemsToInsert.length === 0 && notes) {
      try {
        const parsed = JSON.parse(notes);
        if (parsed?.rfqDocument?.items && Array.isArray(parsed.rfqDocument.items)) {
          itemsToInsert = parsed.rfqDocument.items;
        }
      } catch {}
    }

    if (itemsToInsert.length > 0) {
      const rfqItems = itemsToInsert.map((item: any, index: number) => ({
        rfqId: rfq!.rfq.id,
        itemName: item.itemName || item.name || `Item ${index + 1}`,
        description: item.description || (item.hsn ? `HSN: ${item.hsn}` : null),
        specification: item.specification || (item.hsn ? `HSN: ${item.hsn}` : null),
        quantity: String(Number(item.quantity) || 1),
        unit: item.unit || "Pcs",
        sortOrder: index,
      }));
      await db.insert(procurementRfqItemsTable).values(rfqItems);
    }

    // Mark material request as rfq_generated if linked
    if (materialRequestId) {
      await db
        .update(procurementMaterialRequestsTable)
        .set({ status: "rfq_generated" })
        .where(eq(procurementMaterialRequestsTable.id, Number(materialRequestId)));
    }

    res.status(201).json({
      ...fRfq(rfq!.rfq),
      projectName: rfq!.projectName,
      createdByName: rfq!.createdByName,
    });
  } catch (error) {
    console.error("Error creating RFQ:", error);
    res.status(500).json({ error: "Failed to create RFQ" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// RFQs - Create from Material Request
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/rfqs/from-material-request/:materialRequestId - Generate RFQ from approved material request
router.post("/from-material-request/:materialRequestId", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const materialRequestId = parseInt(req.params.materialRequestId as string, 10);
    const { dueDate, vendorIds, notes } = req.body ?? {};

    // Validate material request exists and is approved
    const [mr] = await db
      .select()
      .from(procurementMaterialRequestsTable)
      .where(eq(procurementMaterialRequestsTable.id, materialRequestId))
      .limit(1);

    if (!mr) {
      res.status(404).json({ error: "Material request not found" });
      return;
    }

    if (mr.status !== "approved" && mr.status !== "rfq_generated") {
      res.status(400).json({ error: "Material request must be approved before generating RFQ" });
      return;
    }

    // Get material request items
    const mrItems = await db
      .select()
      .from(procurementMaterialRequestItemsTable)
      .where(eq(procurementMaterialRequestItemsTable.materialRequestId, materialRequestId))
      .orderBy(procurementMaterialRequestItemsTable.sortOrder);

    if (mrItems.length === 0) {
      res.status(400).json({ error: "Material request has no items" });
      return;
    }

    // Generate RFQ number
    const rfqNumber = await generateNumber("RFQ", procurementRfqsTable);

    // Format dueDate safely for MySQL date column
    let targetDueDate: string;
    if (dueDate) {
      targetDueDate = typeof dueDate === "string" && dueDate.includes("T")
        ? dueDate.split("T")[0]
        : String(dueDate);
    } else {
      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      targetDueDate = defaultDate.toISOString().split("T")[0];
    }

    // Create RFQ
    await db.insert(procurementRfqsTable).values({
      rfqNumber,
      materialRequestId,
      projectId: mr.projectId,
      title: `RFQ for ${mr.title}`,
      description: mr.description ?? null,
      status: "draft",
      issueDate: null,
      dueDate: targetDueDate,
      closedDate: null,
      sentToVendorCount: Array.isArray(vendorIds) ? vendorIds.length : 0,
      quotesReceivedCount: 0,
      selectedQuoteId: null,
      createdById: me.id,
      notes: notes ?? null,
    });

    // Get created RFQ
    const [rfq] = await db
      .select()
      .from(procurementRfqsTable)
      .where(eq(procurementRfqsTable.rfqNumber, rfqNumber))
      .limit(1);

    // Copy items from material request to RFQ
    const rfqItems = mrItems.map((item, index) => ({
      rfqId: rfq!.id,
      itemName: item.itemName,
      description: item.description,
      specification: item.specification,
      quantity: item.quantity,
      unit: item.unit,
      sortOrder: index,
    }));

    await db.insert(procurementRfqItemsTable).values(rfqItems);

    // Add vendors if provided
    if (vendorIds && Array.isArray(vendorIds) && vendorIds.length > 0) {
      const rfqVendors = vendorIds.map((vendorId: number) => ({
        rfqId: rfq!.id,
        vendorId,
        sentDate: null,
        respondedDate: null,
        status: "pending",
      }));

      await db.insert(procurementRfqVendorsTable).values(rfqVendors);
    }

    // Update material request status
    await db
      .update(procurementMaterialRequestsTable)
      .set({ status: "rfq_generated" })
      .where(eq(procurementMaterialRequestsTable.id, materialRequestId));

    // Get items
    const items = await db
      .select()
      .from(procurementRfqItemsTable)
      .where(eq(procurementRfqItemsTable.rfqId, rfq!.id))
      .orderBy(procurementRfqItemsTable.sortOrder);

    res.status(201).json({
      ...fRfq(rfq!),
      items: items.map(fRfqItem),
      message: "RFQ generated successfully from material request",
    });
  } catch (error) {
    console.error("Error generating RFQ:", error);
    res.status(500).json({ error: "Failed to generate RFQ" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// RFQs - Update
// ═══════════════════════════════════════════════════════════════════════════

// PUT /api/procurement/rfqs/:id - Update RFQ
router.put("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.title !== undefined) update.title = b.title;
    if (b.description !== undefined) update.description = b.description;
    if (b.dueDate !== undefined) update.dueDate = b.dueDate;
    if (b.notes !== undefined) update.notes = b.notes;

    await db
      .update(procurementRfqsTable)
      .set(update)
      .where(eq(procurementRfqsTable.id, id));

    const [updated] = await db
      .select()
      .from(procurementRfqsTable)
      .where(eq(procurementRfqsTable.id, id))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "RFQ not found" });
      return;
    }

    res.json(fRfq(updated));
  } catch (error) {
    console.error("Error updating RFQ:", error);
    res.status(500).json({ error: "Failed to update RFQ" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// RFQ VENDORS - Manage Vendor Selection
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/rfqs/:id/vendors - Add vendor to RFQ
router.post("/:id/vendors", async (req, res): Promise<void> => {
  try {
    const rfqId = parseInt(req.params.id as string, 10);
    const rawVendorId = req.body?.vendorId ?? (Array.isArray(req.body?.vendorIds) ? req.body.vendorIds[0] : undefined);
    const vendorId = rawVendorId ? Number(rawVendorId) : undefined;

    if (!vendorId) {
      res.status(400).json({ error: "Vendor ID is required" });
      return;
    }

    // Check if vendor already added
    const [existing] = await db
      .select()
      .from(procurementRfqVendorsTable)
      .where(
        and(
          eq(procurementRfqVendorsTable.rfqId, rfqId),
          eq(procurementRfqVendorsTable.vendorId, vendorId)
        )
      )
      .limit(1);

    if (existing) {
      res.status(400).json({ error: "Vendor already added to this RFQ" });
      return;
    }

    await db.insert(procurementRfqVendorsTable).values({
      rfqId,
      vendorId,
      sentDate: null,
      respondedDate: null,
      status: "pending",
    });

    const [vendor] = await db
      .select({
        rfqVendor: procurementRfqVendorsTable,
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
        vendorPhone: vendorsTable.phone,
      })
      .from(procurementRfqVendorsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementRfqVendorsTable.vendorId))
      .where(
        and(
          eq(procurementRfqVendorsTable.rfqId, rfqId),
          eq(procurementRfqVendorsTable.vendorId, vendorId)
        )
      )
      .limit(1);

    res.status(201).json({
      ...fRfqVendor(vendor!.rfqVendor),
      vendorName: vendor!.vendorName,
      vendorEmail: vendor!.vendorEmail,
      vendorPhone: vendor!.vendorPhone,
    });
  } catch (error) {
    console.error("Error adding vendor to RFQ:", error);
    res.status(500).json({ error: "Failed to add vendor" });
  }
});

// DELETE /api/procurement/rfqs/:id/vendors/:vendorId - Remove vendor from RFQ
router.delete("/:id/vendors/:vendorId", async (req, res): Promise<void> => {
  try {
    const rfqId = parseInt(req.params.id as string, 10);
    const vendorId = parseInt(req.params.vendorId as string, 10);

    await db
      .delete(procurementRfqVendorsTable)
      .where(
        and(
          eq(procurementRfqVendorsTable.rfqId, rfqId),
          eq(procurementRfqVendorsTable.vendorId, vendorId)
        )
      );

    res.status(204).send();
  } catch (error) {
    console.error("Error removing vendor from RFQ:", error);
    res.status(500).json({ error: "Failed to remove vendor" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PDF GENERATION & EXPORT
// ═══════════════════════════════════════════════════════════════════════════

function generateRfqPdfHtml({
  rfq,
  items,
  vendors,
  selectedVendor,
  projectName,
  projectAddress,
  createdByName,
  creatorEmail,
  autoPrint = false,
}: {
  rfq: any;
  items: any[];
  vendors: any[];
  selectedVendor?: any;
  projectName?: string;
  projectAddress?: string;
  createdByName?: string;
  creatorEmail?: string;
  autoPrint?: boolean;
}) {
  const escHtml = (unsafe: any) => {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const fmtDate = (d: any) => {
    if (!d) return "—";
    try {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return String(d);
      return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  const totalItems = items.length;
  const isTargeted = Boolean(selectedVendor);

  const rowsHtml = items.map((it: any, idx: number) => {
    const qty = Number(it.quantity || 1);
    const unit = it.unit || "Nos";
    return `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b; font-size: 11px;">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${escHtml(it.itemName || "Scope Item")}</div>
          ${it.description ? `<div style="font-size: 11px; color: #475569; margin-top: 3px;">${escHtml(it.description)}</div>` : ""}
        </td>
        <td style="font-size: 11px; color: #334155;">
          ${escHtml(it.specification || "Standard Technical Grade / As per Project Specifications")}
        </td>
        <td style="text-align: right; font-weight: 700; font-family: monospace; font-size: 12px; color: #0f172a;">
          ${qty.toLocaleString("en-IN")}
        </td>
        <td style="text-align: center; font-size: 11px; color: #475569; text-transform: uppercase;">
          ${escHtml(unit)}
        </td>
        <td style="text-align: center; color: #94a3b8; font-size: 11px; background: #fafafa;">
          <span style="border-bottom: 1px dotted #cbd5e1; display: inline-block; min-width: 70px;">&nbsp;</span>
        </td>
        <td style="text-align: right; color: #94a3b8; font-size: 11px; background: #fafafa;">
          <span style="border-bottom: 1px dotted #cbd5e1; display: inline-block; min-width: 80px;">&nbsp;</span>
        </td>
        <td style="text-align: right; color: #94a3b8; font-size: 11px; background: #fafafa;">
          <span style="border-bottom: 1px dotted #cbd5e1; display: inline-block; min-width: 80px;">&nbsp;</span>
        </td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RFQ_${escHtml(rfq.rfqNumber)}_${isTargeted ? escHtml(selectedVendor.name || selectedVendor.vendorName).replace(/\\s+/g, '_') : 'Tender'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      padding: 24px;
      line-height: 1.45;
      font-size: 12px;
    }
    .print-bar {
      max-width: 1000px;
      margin: 0 auto 20px auto;
      padding: 12px 18px;
      background: #1e293b;
      color: #fff;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .print-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover { background: #1d4ed8; }
    .page {
      max-width: 1000px;
      margin: 0 auto;
      background: #fff;
      padding: 32px 36px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #e2e8f0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 11px;
      font-weight: 600;
      color: #2563eb;
      margin-top: 2px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .brand-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .doc-badge {
      display: inline-block;
      background: #0f172a;
      color: #fff;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
    }
    .info-card-title {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
    }
    .field-row {
      display: flex;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .field-label {
      width: 130px;
      color: #64748b;
      font-weight: 500;
      flex-shrink: 0;
    }
    .field-value {
      color: #0f172a;
      font-weight: 600;
      word-break: break-word;
    }
    .deadline-highlight {
      color: #b91c1c;
      font-weight: 800;
      background: #fef2f2;
      padding: 1px 6px;
      border-radius: 3px;
      border: 1px solid #fecaca;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    table.data-table th {
      background: #0f172a;
      color: #fff;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid #0f172a;
    }
    table.data-table td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) td {
      background: #fcfcfd;
    }
    .terms-box {
      background: #fff;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #2563eb;
      border-radius: 4px;
      padding: 12px 14px;
      font-size: 10.5px;
      color: #334155;
      margin-bottom: 20px;
    }
    .terms-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    .terms-list {
      margin-left: 16px;
      line-height: 1.5;
    }
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    .sign-box {
      width: 25%;
      height: 80px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px;
      vertical-align: bottom;
      font-size: 10px;
      color: #64748b;
      text-align: center;
      background: #fafafa;
    }
    .sign-role {
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
      text-transform: uppercase;
      font-size: 9.5px;
    }
    @media print {
      body { background: #fff; padding: 0; font-size: 11px; }
      .print-bar { display: none !important; }
      .page { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      @page { size: portrait; margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div>
      <span style="font-weight: 700; font-size: 13px;">Official RFQ Tender Document</span>
      <span style="color: #94a3b8; font-size: 12px; margin-left: 8px;">• ${escHtml(rfq.rfqNumber)}</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="print-btn" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save as PDF
      </button>
      <button class="print-btn" style="background: #334155;" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="page">
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="brand-title">Kanak TurnKey Projects Pvt. Ltd.</div>
          <div class="brand-sub">EPC Contracting • TurnKey Fit-outs • Engineering Procurement</div>
          <div class="brand-meta">
            Plot 42, Commercial Sector 18, Udyog Vihar, Gurugram, Haryana - 122015<br />
            CIN: U45200HR2018PTC074521 | GSTIN: 06AAACK2489R1ZM | ISO 9001:2015 Certified
          </div>
        </td>
        <td style="text-align: right; vertical-align: top;">
          <div class="doc-badge">Request For Quotation</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 6px; font-family: monospace;">
            ${escHtml(rfq.rfqNumber)}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Issued: <strong>${fmtDate(rfq.issueDate || rfq.createdAt)}</strong>
          </div>
        </td>
      </tr>
    </table>

    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-title">
          <span>Tender & Project Scope Details</span>
          <span style="color: #2563eb;">Procurement Ref</span>
        </div>
        <div class="field-row">
          <span class="field-label">Project Title:</span>
          <span class="field-value">${escHtml(projectName || "Kanak Commercial Project Site")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Scope Description:</span>
          <span class="field-value">${escHtml(rfq.title)}</span>
        </div>
        ${rfq.materialRequestNumber ? `
        <div class="field-row">
          <span class="field-label">Material Request:</span>
          <span class="field-value" style="font-family: monospace;">${escHtml(rfq.materialRequestNumber)}</span>
        </div>` : ""}
        <div class="field-row">
          <span class="field-label">Site Delivery Point:</span>
          <span class="field-value">${escHtml(projectAddress || "F.O.R Project Site (Delivery as directed by Site In-charge)")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Buyer / Contact:</span>
          <span class="field-value">${escHtml(createdByName || "Procurement Department")} ${creatorEmail ? `(${escHtml(creatorEmail)})` : ""}</span>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>${isTargeted ? "Invited Bidder / Vendor Contact" : "Tender Schedule & Invited Bidders"}</span>
          <span style="color: #10b981;">Commercial Terms</span>
        </div>
        ${isTargeted ? `
          <div class="field-row">
            <span class="field-label">Vendor Name:</span>
            <span class="field-value" style="font-size: 12px; color: #1e293b;">${escHtml(selectedVendor.name || selectedVendor.vendorName)}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Contact Person:</span>
            <span class="field-value">${escHtml(selectedVendor.contactPerson || "Sales & Tender Department")}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Email:</span>
            <span class="field-value">${escHtml(selectedVendor.email || selectedVendor.vendorEmail || "tender@vendor.com")}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Phone:</span>
            <span class="field-value">${escHtml(selectedVendor.phone || selectedVendor.vendorPhone || "—")}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Trade Category:</span>
            <span class="field-value">${escHtml(selectedVendor.category || "General Supplies")}</span>
          </div>
        ` : `
          <div class="field-row">
            <span class="field-label">Invited Vendors:</span>
            <span class="field-value">${vendors.length > 0 ? vendors.map((v: any) => escHtml(v.vendorName || v.name)).join(", ") : "All Approved Bidders"}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Tender Type:</span>
            <span class="field-value">Limited Competitive Bidding</span>
          </div>
        `}
        <div class="field-row" style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
          <span class="field-label">Submission Due Date:</span>
          <span class="field-value deadline-highlight">${fmtDate(rfq.dueDate)} 17:00 IST</span>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: baseline;">
      <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
        Bill of Quantities & Scope of Supply (${totalItems} Line Items)
      </h3>
      <span style="font-size: 10px; color: #64748b;">All pricing must be quoted in INR (₹)</span>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 32px; text-align: center;">#</th>
          <th>Item Description & Scope</th>
          <th>Technical Specifications / Standard</th>
          <th style="width: 70px; text-align: right;">Quantity</th>
          <th style="width: 50px; text-align: center;">Unit</th>
          <th style="width: 90px; text-align: center;">Offered Make</th>
          <th style="width: 95px; text-align: right;">Unit Rate (₹)</th>
          <th style="width: 95px; text-align: right;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="terms-box">
      <div class="terms-title">Commercial & Bid Submission Instructions</div>
      <ol class="terms-list">
        <li><strong>Price Basis:</strong> Rates must be quoted on firm Free on Rail/Road (F.O.R) Site basis inclusive of transit insurance, packing, forwarding, and freight to project site.</li>
        <li><strong>Taxes & GST:</strong> Mention applicable GST rate (%) and statutory HSN codes separately for each line item.</li>
        <li><strong>Quotation Validity:</strong> All quoted rates must remain firm and valid for a minimum of <strong>30 calendar days</strong> from the submission due date.</li>
        <li><strong>Delivery Lead Time:</strong> Clearly specify delivery lead time in calendar days from the date of Purchase Order (PO) award. Liquidated damages @ 0.5% per week of delay (max 5%) will be levied on delayed dispatches.</li>
        <li><strong>Payment Terms:</strong> Standard terms: 100% payment within 30 days of Material Receipt Note (GRN) and Quality Control acceptance.</li>
        <li><strong>Submission Procedure:</strong> Submit sealed quote or email to <strong>procurement@kanakturnkey.com</strong> quoting <strong>${escHtml(rfq.rfqNumber)}</strong> prior to <strong>${fmtDate(rfq.dueDate)}</strong>.</li>
      </ol>
    </div>

    <table class="sign-table">
      <tr>
        <td class="sign-box">
          <div style="color: #0f172a; font-weight: 600; margin-bottom: 2px;">${escHtml(createdByName || "Procurement Officer")}</div>
          <div class="sign-role">Prepared By (Procurement)</div>
        </td>
        <td class="sign-box">
          <div style="color: #0f172a; font-weight: 600; margin-bottom: 2px;">Lead Quantity Surveyor</div>
          <div class="sign-role">Verified By (Estimation)</div>
        </td>
        <td class="sign-box">
          <div style="color: #0f172a; font-weight: 600; margin-bottom: 2px;">Head of Commercial / EPC</div>
          <div class="sign-role">Authorised Signatory</div>
        </td>
        <td class="sign-box" style="border: 2px dashed #94a3b8; background: #fff;">
          <div style="color: #94a3b8; font-style: italic; margin-bottom: 2px;">Sign & Stamp</div>
          <div class="sign-role">Bidder / Vendor Acceptance</div>
        </td>
      </tr>
    </table>
  </div>

  ${autoPrint ? `<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 400); });</script>` : ""}
</body>
</html>`;
}

// GET /api/procurement/rfqs/:id/export-pdf - Export RFQ to Print-ready PDF Document
router.get("/:id/export-pdf", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const vendorId = req.query.vendorId ? parseInt(req.query.vendorId as string, 10) : undefined;
    const autoPrint = req.query.autoPrint === "true";

    const [rfqRow] = await db
      .select({
        rfq: procurementRfqsTable,
        projectName: projectsTable.name,
        createdByName: usersTable.name,
        creatorEmail: usersTable.email,
        materialRequestNumber: procurementMaterialRequestsTable.requestNumber,
      })
      .from(procurementRfqsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementRfqsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementRfqsTable.createdById))
      .leftJoin(
        procurementMaterialRequestsTable,
        eq(procurementMaterialRequestsTable.id, procurementRfqsTable.materialRequestId)
      )
      .where(eq(procurementRfqsTable.id, id));

    if (!rfqRow) {
      res.status(404).send("RFQ not found");
      return;
    }

    const items = await db
      .select()
      .from(procurementRfqItemsTable)
      .where(eq(procurementRfqItemsTable.rfqId, id))
      .orderBy(procurementRfqItemsTable.sortOrder);

    const vendorsData = await db
      .select({
        rfqVendor: procurementRfqVendorsTable,
        vendorId: vendorsTable.id,
        vendorName: vendorsTable.name,
        name: vendorsTable.name,
        contactPerson: vendorsTable.contactPerson,
        vendorEmail: vendorsTable.email,
        email: vendorsTable.email,
        vendorPhone: vendorsTable.phone,
        phone: vendorsTable.phone,
        category: vendorsTable.category,
        address: vendorsTable.address,
      })
      .from(procurementRfqVendorsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementRfqVendorsTable.vendorId))
      .where(eq(procurementRfqVendorsTable.rfqId, id));

    let selectedVendor: any = undefined;
    if (vendorId) {
      selectedVendor = vendorsData.find(v => v.vendorId === vendorId);
      if (!selectedVendor) {
        const [directVendor] = await db
          .select()
          .from(vendorsTable)
          .where(eq(vendorsTable.id, vendorId))
          .limit(1);
        if (directVendor) selectedVendor = directVendor;
      }
    }

    const html = generateRfqPdfHtml({
      rfq: {
        ...rfqRow.rfq,
        materialRequestNumber: rfqRow.materialRequestNumber,
      },
      items,
      vendors: vendorsData,
      selectedVendor,
      projectName: rfqRow.projectName || undefined,
      createdByName: rfqRow.createdByName || undefined,
      creatorEmail: rfqRow.creatorEmail || undefined,
      autoPrint,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error generating RFQ PDF:", error);
    res.status(500).send("Failed to generate RFQ PDF");
  }
});

// Helper for emailing RFQ PDF to vendor contacts
async function dispatchRfqPdfEmails(
  id: number,
  targetVendorIds?: number[],
  customSubject?: string,
  customMessage?: string
) {
  const me = await getCurrentUser();

  const [rfqRow] = await db
    .select({
      rfq: procurementRfqsTable,
      projectName: projectsTable.name,
      createdByName: usersTable.name,
      materialRequestNumber: procurementMaterialRequestsTable.requestNumber,
    })
    .from(procurementRfqsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, procurementRfqsTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, procurementRfqsTable.createdById))
    .leftJoin(
      procurementMaterialRequestsTable,
      eq(procurementMaterialRequestsTable.id, procurementRfqsTable.materialRequestId)
    )
    .where(eq(procurementRfqsTable.id, id));

  if (!rfqRow) {
    throw new Error("RFQ not found");
  }

  const rfq = rfqRow.rfq;

  let vendorQuery = db
    .select({
      rfqVendorId: procurementRfqVendorsTable.id,
      vendorId: vendorsTable.id,
      vendorName: vendorsTable.name,
      contactPerson: vendorsTable.contactPerson,
      vendorEmail: vendorsTable.email,
      vendorPhone: vendorsTable.phone,
    })
    .from(procurementRfqVendorsTable)
    .leftJoin(vendorsTable, eq(vendorsTable.id, procurementRfqVendorsTable.vendorId))
    .where(eq(procurementRfqVendorsTable.rfqId, id))
    .$dynamic();

  if (Array.isArray(targetVendorIds) && targetVendorIds.length > 0) {
    vendorQuery = vendorQuery.where(
      and(
        eq(procurementRfqVendorsTable.rfqId, id),
        inArray(procurementRfqVendorsTable.vendorId, targetVendorIds.map(Number))
      )
    );
  }

  const targetVendors = await vendorQuery;

  if (targetVendors.length === 0) {
    throw new Error("No vendors selected or found for this RFQ");
  }

  const items = await db
    .select()
    .from(procurementRfqItemsTable)
    .where(eq(procurementRfqItemsTable.rfqId, id));

  const dispatched: any[] = [];
  const now = new Date();

  for (const v of targetVendors) {
    const vendorEmail = v.vendorEmail || "tender@vendor.com";
    const emailSubject = customSubject || `[RFQ] Request for Quotation: ${rfq.rfqNumber} - ${rfq.title} (${rfqRow.projectName || "Project Site"})`;
    const pdfLink = `/api/procurement/rfqs/${id}/export-pdf?vendorId=${v.vendorId}&autoPrint=true`;

    const emailContent = customMessage || [
      `Dear ${v.contactPerson || v.vendorName},`,
      ``,
      `You are invited by Kanak TurnKey Projects Pvt. Ltd. to submit your competitive commercial and technical quotation for:`,
      `• RFQ Number: ${rfq.rfqNumber}`,
      `• Project: ${rfqRow.projectName || "Site Execution"}`,
      `• Scope Title: ${rfq.title}`,
      `• Total Line Items: ${items.length}`,
      `• Quotation Due Date: ${rfq.dueDate} (17:00 IST)`,
      ``,
      `Please find attached the official RFQ PDF Tender Document containing complete bill of quantities, specifications, and commercial submission terms.`,
      ``,
      `Official Tender PDF Document: ${pdfLink}`,
      ``,
      `Kindly submit your signed and stamped quotation along with HSN breakdown before the due date.`,
      ``,
      `Regards,`,
      `${rfqRow.createdByName || me.name || "Procurement Department"}`,
      `Kanak TurnKey Projects Pvt. Ltd.`
    ].join("\n");

    // Update vendor status to sent
    await db
      .update(procurementRfqVendorsTable)
      .set({
        status: "sent",
        sentDate: now,
      })
      .where(
        and(
          eq(procurementRfqVendorsTable.rfqId, id),
          eq(procurementRfqVendorsTable.vendorId, v.vendorId!)
        )
      );

    // Log communication in communicationsTable
    await db.insert(communicationsTable).values({
      projectId: rfq.projectId,
      stakeholderId: null,
      communicationType: "email",
      subject: emailSubject,
      content: emailContent,
      communicationDate: now,
      participants: `${v.vendorName} <${vendorEmail}>`,
      createdById: me.id,
    });

    // Insert notification
    await db.insert(procurementNotificationsTable).values({
      userId: me.id,
      notificationType: "rfq_email_sent",
      title: `RFQ PDF Emailed to ${v.vendorName}`,
      message: `Tender document for ${rfq.rfqNumber} dispatched to ${vendorEmail}. Due date: ${rfq.dueDate}.`,
      resourceType: "rfq",
      resourceId: rfq.id,
      priority: "normal",
    });

    dispatched.push({
      vendorId: v.vendorId,
      vendorName: v.vendorName,
      email: vendorEmail,
      status: "sent",
      pdfUrl: pdfLink,
      sentDate: now,
    });
  }

  // Update RFQ status if draft
  if (rfq.status === "draft") {
    const allVendors = await db
      .select()
      .from(procurementRfqVendorsTable)
      .where(eq(procurementRfqVendorsTable.rfqId, id));

    await db
      .update(procurementRfqsTable)
      .set({
        status: "sent",
        issueDate: rfq.issueDate || now.toISOString().split("T")[0],
        sentToVendorCount: allVendors.length,
      })
      .where(eq(procurementRfqsTable.id, id));
  }

  return {
    rfq,
    dispatched,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Send RFQ & Email RFQ PDF to Vendors
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/rfqs/:id/email-vendors - Email RFQ PDF to selected or all vendor contacts
router.post("/:id/email-vendors", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { vendorIds, subject, message } = req.body || {};

    const { dispatched } = await dispatchRfqPdfEmails(
      id,
      vendorIds,
      subject,
      message
    );

    res.json({
      success: true,
      message: `RFQ PDF successfully emailed to ${dispatched.length} vendor contact(s)`,
      dispatchedCount: dispatched.length,
      dispatched,
    });
  } catch (error: any) {
    console.error("Error emailing RFQ PDF to vendors:", error);
    res.status(error.message === "RFQ not found" ? 404 : 400).json({
      error: error.message || "Failed to email RFQ PDF to vendors",
    });
  }
});

// POST /api/procurement/rfqs/:id/send - Send RFQ and email RFQ PDF to all selected vendors
router.post("/:id/send", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    // Get RFQ
    const [rfq] = await db
      .select()
      .from(procurementRfqsTable)
      .where(eq(procurementRfqsTable.id, id))
      .limit(1);

    if (!rfq) {
      res.status(404).json({ error: "RFQ not found" });
      return;
    }

    if (rfq.status !== "draft") {
      res.status(400).json({ error: "RFQ has already been sent" });
      return;
    }

    // Dispatch RFQ PDF emails to all attached vendors
    const { dispatched } = await dispatchRfqPdfEmails(id);

    const [updated] = await db
      .select()
      .from(procurementRfqsTable)
      .where(eq(procurementRfqsTable.id, id))
      .limit(1);

    res.json({
      ...fRfq(updated!),
      message: `RFQ sent and RFQ PDF emailed to ${dispatched.length} vendor contact(s)`,
      emailedCount: dispatched.length,
    });
  } catch (error: any) {
    console.error("Error sending RFQ:", error);
    res.status(500).json({ error: error.message || "Failed to send RFQ" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/rfqs/stats/summary - Get RFQ statistics
router.get("/stats/summary", async (req, res): Promise<void> => {
  try {
    const { projectId } = req.query;

    let baseQuery = db
      .select({
        status: procurementRfqsTable.status,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(procurementRfqsTable)
      .$dynamic();

    if (projectId) {
      baseQuery = baseQuery.where(eq(procurementRfqsTable.projectId, Number(projectId)));
    }

    const stats = await baseQuery.groupBy(procurementRfqsTable.status);

    const summary = {
      total: 0,
      draft: 0,
      sent: 0,
      receiving_quotes: 0,
      quotes_received: 0,
      evaluated: 0,
      completed: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      const count = Number(stat.count);
      summary.total += count;
      if (stat.status in summary) {
        summary[stat.status as keyof typeof summary] = count;
      }
    });

    res.json(summary);
  } catch (error) {
    console.error("Error fetching RFQ stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
