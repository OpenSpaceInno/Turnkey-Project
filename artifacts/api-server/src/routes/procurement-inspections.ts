import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  db,
  procurementQualityInspectionsTable,
  procurementQualityInspectionItemsTable,
  procurementMaterialReceiptsTable,
  procurementMaterialReceiptItemsTable,
  purchaseOrdersTable,
  procurementPurchaseOrdersTable,
  procurementPurchaseOrderItemsTable,
  procurementMaterialRequestsTable,
  procurementInventoryItemsTable,
  procurementInventoryTransactionsTable,
  procurementNotificationsTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";

const router: IRouter = Router();

// Transform numeric fields
const fInspection = (r: Record<string, unknown>) =>
  numKeys(r, ["receiptId", "poId", "projectId", "inspectedById", "approvedById"]);

const fInspectionItem = (r: Record<string, unknown>) =>
  numKeys(r, [
    "inspectionId",
    "receiptItemId",
    "poItemId",
    "receivedQuantity",
    "acceptedQuantity",
    "rejectedQuantity",
  ]);

// ═══════════════════════════════════════════════════════════════════════════
// QUALITY INSPECTIONS - List & Get
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/inspections - List all quality inspections
router.get("/", async (req, res): Promise<void> => {
  try {
    const { projectId, result, poId } = req.query;

    let query = db
      .select({
        inspection: procurementQualityInspectionsTable,
        projectName: projectsTable.name,
        inspectedByName: usersTable.name,
        poNumber: procurementPurchaseOrdersTable.poNumber,
        receiptNumber: procurementMaterialReceiptsTable.receiptNumber,
      })
      .from(procurementQualityInspectionsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementQualityInspectionsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementQualityInspectionsTable.inspectedById))
      .leftJoin(
        procurementPurchaseOrdersTable,
        eq(procurementPurchaseOrdersTable.id, procurementQualityInspectionsTable.poId)
      )
      .leftJoin(
        procurementMaterialReceiptsTable,
        eq(procurementMaterialReceiptsTable.id, procurementQualityInspectionsTable.receiptId)
      )
      .$dynamic();

    const conditions = [];
    if (projectId) {
      conditions.push(eq(procurementQualityInspectionsTable.projectId, Number(projectId)));
    }
    if (result) {
      conditions.push(eq(procurementQualityInspectionsTable.result, String(result)));
    }
    if (poId) {
      conditions.push(eq(procurementQualityInspectionsTable.poId, Number(poId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(procurementQualityInspectionsTable.inspectionDate));

    res.json(
      rows.map((r) => ({
        ...fInspection(r.inspection),
        projectName: r.projectName,
        inspectedByName: r.inspectedByName,
        poNumber: r.poNumber,
        receiptNumber: r.receiptNumber,
        photoUrls:
          typeof r.inspection.photoUrls === "string"
            ? JSON.parse(r.inspection.photoUrls)
            : r.inspection.photoUrls,
      }))
    );
  } catch (error) {
    console.error("Error fetching quality inspections:", error);
    res.status(500).json({ error: "Failed to fetch quality inspections" });
  }
});

// GET /api/procurement/inspections/:id - Get single inspection with items
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const [inspection] = await db
      .select({
        inspection: procurementQualityInspectionsTable,
        projectName: projectsTable.name,
        inspectedByName: usersTable.name,
        approvedByName: sql<string>`approved_by.name`.as("approvedByName"),
        poNumber: procurementPurchaseOrdersTable.poNumber,
        receiptNumber: procurementMaterialReceiptsTable.receiptNumber,
      })
      .from(procurementQualityInspectionsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementQualityInspectionsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementQualityInspectionsTable.inspectedById))
      .leftJoin(
        sql`users AS approved_by`,
        sql`approved_by.id = ${procurementQualityInspectionsTable.approvedById}`
      )
      .leftJoin(
        procurementPurchaseOrdersTable,
        eq(procurementPurchaseOrdersTable.id, procurementQualityInspectionsTable.poId)
      )
      .leftJoin(
        procurementMaterialReceiptsTable,
        eq(procurementMaterialReceiptsTable.id, procurementQualityInspectionsTable.receiptId)
      )
      .where(eq(procurementQualityInspectionsTable.id, id));

    if (!inspection) {
      res.status(404).json({ error: "Quality inspection not found" });
      return;
    }

    // Get items
    const items = await db
      .select()
      .from(procurementQualityInspectionItemsTable)
      .where(eq(procurementQualityInspectionItemsTable.inspectionId, id))
      .orderBy(procurementQualityInspectionItemsTable.sortOrder);

    res.json({
      ...fInspection(inspection.inspection),
      projectName: inspection.projectName,
      inspectedByName: inspection.inspectedByName,
      approvedByName: inspection.approvedByName,
      poNumber: inspection.poNumber,
      receiptNumber: inspection.receiptNumber,
      photoUrls:
        typeof inspection.inspection.photoUrls === "string"
          ? JSON.parse(inspection.inspection.photoUrls)
          : inspection.inspection.photoUrls,
      items: items.map(fInspectionItem),
    });
  } catch (error) {
    console.error("Error fetching quality inspection:", error);
    res.status(500).json({ error: "Failed to fetch quality inspection" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// QUALITY INSPECTIONS - Create from Receipt
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inspections - Create inspection from receipt
router.post("/", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const b = req.body ?? {};

    // Get receipt details
    const [receipt] = await db
      .select()
      .from(procurementMaterialReceiptsTable)
      .where(eq(procurementMaterialReceiptsTable.id, b.receiptId))
      .limit(1);

    if (!receipt) {
      res.status(404).json({ error: "Material receipt not found" });
      return;
    }

    // Generate inspection number
    const inspectionNumber = await generateNumber(
      "QI",
      procurementQualityInspectionsTable
    );

    // Create inspection
    await db.insert(procurementQualityInspectionsTable).values({
      inspectionNumber,
      receiptId: b.receiptId,
      poId: receipt.poId,
      projectId: receipt.projectId,
      inspectionDate: b.inspectionDate ? new Date(b.inspectionDate) : new Date(),
      inspectedById: me?.id || 1,
      inspectorName: b.inspectorName || me?.name || "Site Inspector",
      result: "pending",
      findings: b.findings ?? null,
      defectsFound: b.defectsFound ?? null,
      recommendations: b.recommendations ?? null,
      photoUrls: b.photoUrls || [],
    });

    // Get created inspection
    const [inspection] = await db
      .select()
      .from(procurementQualityInspectionsTable)
      .where(eq(procurementQualityInspectionsTable.inspectionNumber, inspectionNumber))
      .limit(1);

    // Create inspection items from receipt items: use provided items or auto-populate from receipt
    let itemsToProcess = b.items;
    if (!itemsToProcess || !Array.isArray(itemsToProcess) || itemsToProcess.length === 0) {
      const receiptItems = await db
        .select({
          receiptItem: procurementMaterialReceiptItemsTable,
          poItem: procurementPurchaseOrderItemsTable,
        })
        .from(procurementMaterialReceiptItemsTable)
        .leftJoin(
          procurementPurchaseOrderItemsTable,
          eq(procurementPurchaseOrderItemsTable.id, procurementMaterialReceiptItemsTable.poItemId)
        )
        .where(eq(procurementMaterialReceiptItemsTable.receiptId, b.receiptId));

      itemsToProcess = receiptItems.map((r, index) => ({
        receiptItemId: r.receiptItem.id,
        poItemId: r.receiptItem.poItemId,
        itemName: r.poItem?.itemName || "Material Item",
        receivedQuantity: r.receiptItem.receivedQuantity,
        status: "pending",
        acceptedQuantity: String(r.receiptItem.receivedQuantity),
        rejectedQuantity: "0",
        qualityGrade: b.qualityGrade ?? "A",
        defectDescription: null,
        remarks: null,
        sortOrder: index,
      }));
    }

    if (itemsToProcess.length > 0) {
      const itemsToInsert = itemsToProcess.map((item: any, index: number) => ({
        inspectionId: inspection!.id,
        receiptItemId: item.receiptItemId,
        poItemId: item.poItemId,
        itemName: item.itemName,
        receivedQuantity: String(item.receivedQuantity),
        status: "pending",
        acceptedQuantity: String(item.acceptedQuantity ?? item.receivedQuantity),
        rejectedQuantity: String(item.rejectedQuantity ?? "0"),
        qualityGrade: item.qualityGrade ?? b.qualityGrade ?? null,
        defectDescription: item.defectDescription ?? null,
        remarks: item.remarks ?? null,
        sortOrder: index,
      }));

      await db.insert(procurementQualityInspectionItemsTable).values(itemsToInsert);
    }

    // Update PO status
    await db
      .update(procurementPurchaseOrdersTable)
      .set({ status: "inspected" })
      .where(eq(procurementPurchaseOrdersTable.id, receipt.poId));

    // Get items for response
    const items = await db
      .select()
      .from(procurementQualityInspectionItemsTable)
      .where(eq(procurementQualityInspectionItemsTable.inspectionId, inspection!.id))
      .orderBy(procurementQualityInspectionItemsTable.sortOrder);

    res.status(201).json({
      ...fInspection(inspection!),
      photoUrls: b.photoUrls || [],
      items: items.map(fInspectionItem),
    });
  } catch (error) {
    console.error("Error creating quality inspection:", error);
    res.status(500).json({ error: "Failed to create quality inspection" });
  }
});

// PUT /api/procurement/inspections/:id - Update inspection
router.put("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.findings !== undefined) update.findings = b.findings;
    if (b.defectsFound !== undefined) update.defectsFound = b.defectsFound;
    if (b.recommendations !== undefined) update.recommendations = b.recommendations;
    if (b.photoUrls !== undefined) update.photoUrls = JSON.stringify(b.photoUrls);

    await db
      .update(procurementQualityInspectionsTable)
      .set(update)
      .where(eq(procurementQualityInspectionsTable.id, id));

    const [updated] = await db
      .select()
      .from(procurementQualityInspectionsTable)
      .where(eq(procurementQualityInspectionsTable.id, id))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Quality inspection not found" });
      return;
    }

    res.json({
      ...fInspection(updated),
      photoUrls:
        typeof updated.photoUrls === "string" ? JSON.parse(updated.photoUrls) : updated.photoUrls,
    });
  } catch (error) {
    console.error("Error updating quality inspection:", error);
    res.status(500).json({ error: "Failed to update quality inspection" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INSPECTION ITEMS - Manage Items
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inspections/:id/items - Add item
router.post("/:id/items", async (req, res): Promise<void> => {
  try {
    const inspectionId = parseInt(req.params.id as string, 10);
    const b = req.body ?? {};

    const [maxSort] = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), -1)` })
      .from(procurementQualityInspectionItemsTable)
      .where(eq(procurementQualityInspectionItemsTable.inspectionId, inspectionId));

    const sortOrder = (maxSort?.maxOrder ?? -1) + 1;

    await db.insert(procurementQualityInspectionItemsTable).values({
      inspectionId,
      receiptItemId: b.receiptItemId,
      poItemId: b.poItemId,
      itemName: b.itemName,
      receivedQuantity: String(b.receivedQuantity),
      status: "pending",
      acceptedQuantity: "0",
      rejectedQuantity: "0",
      qualityGrade: b.qualityGrade ?? null,
      defectDescription: b.defectDescription ?? null,
      remarks: b.remarks ?? null,
      sortOrder,
    });

    const [item] = await db
      .select()
      .from(procurementQualityInspectionItemsTable)
      .where(
        and(
          eq(procurementQualityInspectionItemsTable.inspectionId, inspectionId),
          eq(procurementQualityInspectionItemsTable.sortOrder, sortOrder)
        )
      )
      .limit(1);

    res.status(201).json(fInspectionItem(item!));
  } catch (error) {
    console.error("Error adding inspection item:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
});

// PUT /api/procurement/inspections/:id/items/:itemId - Update item
router.put("/:id/items/:itemId", async (req, res): Promise<void> => {
  try {
    const itemId = parseInt(req.params.itemId as string, 10);
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.status !== undefined) update.status = b.status;
    if (b.acceptedQuantity !== undefined) update.acceptedQuantity = String(b.acceptedQuantity);
    if (b.rejectedQuantity !== undefined) update.rejectedQuantity = String(b.rejectedQuantity);
    if (b.qualityGrade !== undefined) update.qualityGrade = b.qualityGrade;
    if (b.defectDescription !== undefined) update.defectDescription = b.defectDescription;
    if (b.remarks !== undefined) update.remarks = b.remarks;

    await db
      .update(procurementQualityInspectionItemsTable)
      .set(update)
      .where(eq(procurementQualityInspectionItemsTable.id, itemId));

    const [updated] = await db
      .select()
      .from(procurementQualityInspectionItemsTable)
      .where(eq(procurementQualityInspectionItemsTable.id, itemId))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(fInspectionItem(updated));
  } catch (error) {
    console.error("Error updating inspection item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Approve Inspection
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inspections/:id/approve - Approve inspection & add to inventory
router.post("/:id/approve", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);

    // Get inspection details
    const [inspection] = await db
      .select()
      .from(procurementQualityInspectionsTable)
      .where(eq(procurementQualityInspectionsTable.id, id))
      .limit(1);

    if (!inspection) {
      res.status(404).json({ error: "Inspection not found" });
      return;
    }

    // Get inspection items
    const items = await db
      .select({
        inspectionItem: procurementQualityInspectionItemsTable,
        poItem: procurementPurchaseOrderItemsTable,
      })
      .from(procurementQualityInspectionItemsTable)
      .leftJoin(
        procurementPurchaseOrderItemsTable,
        eq(procurementPurchaseOrderItemsTable.id, procurementQualityInspectionItemsTable.poItemId)
      )
      .where(eq(procurementQualityInspectionItemsTable.inspectionId, id));

    // Update inspection status
    await db
      .update(procurementQualityInspectionsTable)
      .set({
        result: "approved",
        approvedById: me?.id || 1,
        approvalDate: new Date(),
      })
      .where(eq(procurementQualityInspectionsTable.id, id));

    const todayDateStr = new Date().toISOString().split("T")[0];

    // Add approved items to inventory
    for (const item of items) {
      let acceptedQty = Number(item.inspectionItem.acceptedQuantity);
      if (acceptedQty <= 0 && Number(item.inspectionItem.rejectedQuantity) <= 0) {
        acceptedQty = Number(item.inspectionItem.receivedQuantity);
      }

      // Update inspection item status
      await db
        .update(procurementQualityInspectionItemsTable)
        .set({
          status: "approved",
          acceptedQuantity: String(acceptedQty),
        })
        .where(eq(procurementQualityInspectionItemsTable.id, item.inspectionItem.id));

      if (acceptedQty > 0) {
        // Generate item code
        const itemCode = await generateNumber("INV", procurementInventoryItemsTable);

        // Check if item already exists in inventory
        const [existingItem] = await db
          .select()
          .from(procurementInventoryItemsTable)
          .where(
            and(
              eq(procurementInventoryItemsTable.itemName, item.inspectionItem.itemName),
              eq(procurementInventoryItemsTable.projectId, inspection.projectId)
            )
          )
          .limit(1);

        if (existingItem) {
          // Update existing inventory item
          const newTotal = Number(existingItem.totalQuantity) + acceptedQty;
          const newAvailable = Number(existingItem.availableQuantity) + acceptedQty;

          await db
            .update(procurementInventoryItemsTable)
            .set({
              totalQuantity: String(newTotal),
              availableQuantity: String(newAvailable),
              lastPurchasePrice: item.poItem?.unitPrice || existingItem.lastPurchasePrice,
              lastPurchaseDate: todayDateStr,
            })
            .where(eq(procurementInventoryItemsTable.id, existingItem.id));

          // Create inventory transaction
          const transactionNumber = await generateNumber(
            "TXN",
            procurementInventoryTransactionsTable
          );

          await db.insert(procurementInventoryTransactionsTable).values({
            transactionNumber,
            inventoryItemId: existingItem.id,
            projectId: inspection.projectId,
            transactionType: "goods_receipt",
            transactionDate: new Date(),
            quantity: String(acceptedQty),
            unitPrice: item.poItem?.unitPrice || null,
            totalValue: item.poItem?.totalPrice || null,
            balanceQuantity: String(newTotal),
            poId: inspection.poId,
            inspectionId: id,
            remarks: `Quality inspection approved - ${inspection.inspectionNumber}`,
            createdById: me?.id || 1,
          });
        } else {
          // Create new inventory item
          await db.insert(procurementInventoryItemsTable).values({
            itemCode,
            projectId: inspection.projectId,
            itemName: item.inspectionItem.itemName,
            description: item.poItem?.description || null,
            category: "general",
            unit: item.poItem?.unit || "pcs",
            totalQuantity: String(acceptedQty),
            availableQuantity: String(acceptedQty),
            allocatedQuantity: "0",
            consumedQuantity: "0",
            minimumStock: "0",
            reorderLevel: "0",
            averageCost: item.poItem?.unitPrice || "0",
            lastPurchasePrice: item.poItem?.unitPrice || null,
            lastPurchaseDate: todayDateStr,
            status: "active",
          });

          // Get created item
          const [newItem] = await db
            .select()
            .from(procurementInventoryItemsTable)
            .where(eq(procurementInventoryItemsTable.itemCode, itemCode))
            .limit(1);

          // Create inventory transaction
          const transactionNumber = await generateNumber(
            "TXN",
            procurementInventoryTransactionsTable
          );

          await db.insert(procurementInventoryTransactionsTable).values({
            transactionNumber,
            inventoryItemId: newItem!.id,
            projectId: inspection.projectId,
            transactionType: "goods_receipt",
            transactionDate: new Date(),
            quantity: String(acceptedQty),
            unitPrice: item.poItem?.unitPrice || null,
            totalValue: item.poItem?.totalPrice || null,
            balanceQuantity: String(acceptedQty),
            poId: inspection.poId,
            inspectionId: id,
            remarks: `Quality inspection approved - ${inspection.inspectionNumber}`,
            createdById: me?.id || 1,
          });
        }

        // Update PO item accepted quantity
        if (item.poItem) {
          const newAcceptedQty = Number(item.poItem.acceptedQuantity) + acceptedQty;
          await db
            .update(procurementPurchaseOrderItemsTable)
            .set({ acceptedQuantity: String(newAcceptedQty) })
            .where(eq(procurementPurchaseOrderItemsTable.id, item.inspectionItem.poItemId));
        }
      }
    }

    // Update PO status to completed
    await db
      .update(procurementPurchaseOrdersTable)
      .set({ status: "completed" })
      .where(eq(procurementPurchaseOrdersTable.id, inspection.poId));

    await db
      .update(purchaseOrdersTable)
      .set({ status: "completed", inspectionStatus: "passed" })
      .where(eq(purchaseOrdersTable.id, inspection.poId));

    // Also get the PO to find the linked materialRequestId and update its status
    const [linkedPo] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.id, inspection.poId))
      .limit(1);

    if (linkedPo && linkedPo.materialRequestId) {
      await db
        .update(procurementMaterialRequestsTable)
        .set({ status: "fulfilled" })
        .where(eq(procurementMaterialRequestsTable.id, linkedPo.materialRequestId));
    }

    res.json({
      message: "Inspection approved and items added to inventory",
      inspectionId: id,
      itemsProcessed: items.length,
    });
  } catch (error) {
    console.error("Error approving inspection:", error);
    res.status(500).json({ error: "Failed to approve inspection" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Reject Inspection
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inspections/:id/reject - Reject inspection (trigger re-procurement)
router.post("/:id/reject", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { reason } = req.body ?? {};

    if (!reason) {
      res.status(400).json({ error: "Rejection reason is required" });
      return;
    }

    // Get inspection details
    const [inspection] = await db
      .select()
      .from(procurementQualityInspectionsTable)
      .where(eq(procurementQualityInspectionsTable.id, id))
      .limit(1);

    if (!inspection) {
      res.status(404).json({ error: "Inspection not found" });
      return;
    }

    // Update inspection status
    await db
      .update(procurementQualityInspectionsTable)
      .set({
        result: "rejected",
        rejectionReason: reason,
        approvedById: me.id,
        approvalDate: new Date(),
      })
      .where(eq(procurementQualityInspectionsTable.id, id));

    // Update PO status (could trigger return/re-procurement)
    await db
      .update(procurementPurchaseOrdersTable)
      .set({ status: "cancelled" })
      .where(eq(procurementPurchaseOrdersTable.id, inspection.poId));

    await db
      .update(purchaseOrdersTable)
      .set({ status: "cancelled", inspectionStatus: "failed" })
      .where(eq(purchaseOrdersTable.id, inspection.poId));

    // TODO: Automatically create new RFQ for re-procurement

    res.json({
      message: "Inspection rejected. Re-procurement process can be initiated.",
      inspectionId: id,
    });
  } catch (error) {
    console.error("Error rejecting inspection:", error);
    res.status(500).json({ error: "Failed to reject inspection" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PHOTO MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inspections/:id/photos - Add photos
router.post("/:id/photos", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { photoUrls } = req.body ?? {};

    if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
      res.status(400).json({ error: "photoUrls array is required" });
      return;
    }

    const [inspection] = await db
      .select()
      .from(procurementQualityInspectionsTable)
      .where(eq(procurementQualityInspectionsTable.id, id))
      .limit(1);

    if (!inspection) {
      res.status(404).json({ error: "Inspection not found" });
      return;
    }

    const currentPhotos =
      typeof inspection.photoUrls === "string"
        ? JSON.parse(inspection.photoUrls)
        : inspection.photoUrls || [];

    const updatedPhotos = [...currentPhotos, ...photoUrls];

    await db
      .update(procurementQualityInspectionsTable)
      .set({ photoUrls: JSON.stringify(updatedPhotos) })
      .where(eq(procurementQualityInspectionsTable.id, id));

    res.json({ message: "Photos added successfully", photoCount: updatedPhotos.length });
  } catch (error) {
    console.error("Error adding photos:", error);
    res.status(500).json({ error: "Failed to add photos" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PENDING INSPECTIONS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/inspections/pending - Get pending inspections
router.get("/pending", async (req, res): Promise<void> => {
  try {
    const { projectId } = req.query;

    let query = db
      .select({
        inspection: procurementQualityInspectionsTable,
        projectName: projectsTable.name,
        poNumber: procurementPurchaseOrdersTable.poNumber,
      })
      .from(procurementQualityInspectionsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementQualityInspectionsTable.projectId))
      .leftJoin(
        procurementPurchaseOrdersTable,
        eq(procurementPurchaseOrdersTable.id, procurementQualityInspectionsTable.poId)
      )
      .where(eq(procurementQualityInspectionsTable.result, "pending"))
      .$dynamic();

    if (projectId) {
      query = query.where(eq(procurementQualityInspectionsTable.projectId, Number(projectId)));
    }

    const rows = await query.orderBy(procurementQualityInspectionsTable.inspectionDate);

    res.json(
      rows.map((r) => ({
        ...fInspection(r.inspection),
        projectName: r.projectName,
        poNumber: r.poNumber,
        photoUrls:
          typeof r.inspection.photoUrls === "string"
            ? JSON.parse(r.inspection.photoUrls)
            : r.inspection.photoUrls,
      }))
    );
  } catch (error) {
    console.error("Error fetching pending inspections:", error);
    res.status(500).json({ error: "Failed to fetch pending inspections" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/inspections/stats/summary - Get summary statistics
router.get("/stats/summary", async (req, res): Promise<void> => {
  try {
    const { projectId } = req.query;

    let baseQuery = db
      .select({
        result: procurementQualityInspectionsTable.result,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(procurementQualityInspectionsTable)
      .$dynamic();

    if (projectId) {
      baseQuery = baseQuery.where(
        eq(procurementQualityInspectionsTable.projectId, Number(projectId))
      );
    }

    const stats = await baseQuery.groupBy(procurementQualityInspectionsTable.result);

    const summary = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      partial_approved: 0,
    };

    stats.forEach((stat) => {
      const count = Number(stat.count);
      summary.total += count;
      if (stat.result in summary) {
        summary[stat.result as keyof typeof summary] = count;
      }
    });

    res.json(summary);
  } catch (error) {
    console.error("Error fetching inspection stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
