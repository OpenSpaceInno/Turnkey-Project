import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db,
  purchaseOrdersTable,
  procurementMaterialReceiptsTable,
  procurementMaterialReceiptItemsTable,
  procurementPurchaseOrdersTable,
  procurementPurchaseOrderItemsTable,
  vendorsTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";

const router: IRouter = Router();

// Transform numeric fields
const fReceipt = (r: Record<string, unknown>) =>
  numKeys(r, ["poId", "projectId", "vendorId", "receivedById"]);

const fReceiptItem = (r: Record<string, unknown>) =>
  numKeys(r, ["receiptId", "poItemId", "receivedQuantity"]);

// ═══════════════════════════════════════════════════════════════════════════
// MATERIAL RECEIPTS - List & Get
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/receipts - List all material receipts
router.get("/", async (req, res): Promise<void> => {
  try {
    const { projectId, vendorId, poId } = req.query;

    let query = db
      .select({
        receipt: procurementMaterialReceiptsTable,
        vendorName: vendorsTable.name,
        projectName: projectsTable.name,
        receivedByName: usersTable.name,
        poNumber: procurementPurchaseOrdersTable.poNumber,
      })
      .from(procurementMaterialReceiptsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementMaterialReceiptsTable.vendorId))
      .leftJoin(projectsTable, eq(projectsTable.id, procurementMaterialReceiptsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementMaterialReceiptsTable.receivedById))
      .leftJoin(
        procurementPurchaseOrdersTable,
        eq(procurementPurchaseOrdersTable.id, procurementMaterialReceiptsTable.poId)
      )
      .$dynamic();

    const conditions = [];
    if (projectId) {
      conditions.push(eq(procurementMaterialReceiptsTable.projectId, Number(projectId)));
    }
    if (vendorId) {
      conditions.push(eq(procurementMaterialReceiptsTable.vendorId, Number(vendorId)));
    }
    if (poId) {
      conditions.push(eq(procurementMaterialReceiptsTable.poId, Number(poId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(procurementMaterialReceiptsTable.receivedDate));

    res.json(
      rows.map((r) => ({
        ...fReceipt(r.receipt),
        vendorName: r.vendorName,
        projectName: r.projectName,
        receivedByName: r.receivedByName,
        poNumber: r.poNumber,
        attachmentUrls:
          typeof r.receipt.attachmentUrls === "string"
            ? JSON.parse(r.receipt.attachmentUrls)
            : r.receipt.attachmentUrls,
      }))
    );
  } catch (error) {
    console.error("Error fetching material receipts:", error);
    res.status(500).json({ error: "Failed to fetch material receipts" });
  }
});

// GET /api/procurement/receipts/:id - Get single receipt with items
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const [receipt] = await db
      .select({
        receipt: procurementMaterialReceiptsTable,
        vendorName: vendorsTable.name,
        projectName: projectsTable.name,
        receivedByName: usersTable.name,
        poNumber: procurementPurchaseOrdersTable.poNumber,
      })
      .from(procurementMaterialReceiptsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementMaterialReceiptsTable.vendorId))
      .leftJoin(projectsTable, eq(projectsTable.id, procurementMaterialReceiptsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementMaterialReceiptsTable.receivedById))
      .leftJoin(
        procurementPurchaseOrdersTable,
        eq(procurementPurchaseOrdersTable.id, procurementMaterialReceiptsTable.poId)
      )
      .where(eq(procurementMaterialReceiptsTable.id, id));

    if (!receipt) {
      res.status(404).json({ error: "Material receipt not found" });
      return;
    }

    // Get items with PO item details
    const items = await db
      .select({
        receiptItem: procurementMaterialReceiptItemsTable,
        poItemName: procurementPurchaseOrderItemsTable.itemName,
        poItemUnit: procurementPurchaseOrderItemsTable.unit,
        poItemQuantity: procurementPurchaseOrderItemsTable.quantity,
      })
      .from(procurementMaterialReceiptItemsTable)
      .leftJoin(
        procurementPurchaseOrderItemsTable,
        eq(procurementPurchaseOrderItemsTable.id, procurementMaterialReceiptItemsTable.poItemId)
      )
      .where(eq(procurementMaterialReceiptItemsTable.receiptId, id));

    res.json({
      ...fReceipt(receipt.receipt),
      vendorName: receipt.vendorName,
      projectName: receipt.projectName,
      receivedByName: receipt.receivedByName,
      poNumber: receipt.poNumber,
      attachmentUrls:
        typeof receipt.receipt.attachmentUrls === "string"
          ? JSON.parse(receipt.receipt.attachmentUrls)
          : receipt.receipt.attachmentUrls,
      items: items.map((i) => ({
        ...fReceiptItem(i.receiptItem),
        poItemName: i.poItemName,
        poItemUnit: i.poItemUnit,
        poItemQuantity: i.poItemQuantity ? Number(i.poItemQuantity) : 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching material receipt:", error);
    res.status(500).json({ error: "Failed to fetch material receipt" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MATERIAL RECEIPTS - Create (Record Delivery)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/receipts - Record material delivery
router.post("/", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const b = req.body ?? {};

    // Get PO details
    let [po] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.id, b.poId))
      .limit(1);

    let isLegacy = false;
    if (!po) {
      const [legacy] = await db
        .select()
        .from(purchaseOrdersTable)
        .where(eq(purchaseOrdersTable.id, b.poId))
        .limit(1);

      if (!legacy) {
        res.status(404).json({ error: "Purchase order not found" });
        return;
      }
      isLegacy = true;
      po = {
        id: legacy.id,
        projectId: legacy.projectId,
        vendorId: legacy.vendorId,
        poNumber: legacy.poNumber,
      } as any;
    }

    // Generate receipt number
    const receiptNumber = await generateNumber("GRN", procurementMaterialReceiptsTable);

    // Create receipt
    await db.insert(procurementMaterialReceiptsTable).values({
      receiptNumber,
      poId: b.poId,
      projectId: po.projectId,
      vendorId: po.vendorId,
      receivedDate: b.receivedDate ? new Date(b.receivedDate) : new Date(),
      receivedById: me?.id || 1,
      deliveryNoteNumber: b.deliveryNoteNumber ?? null,
      vehicleNumber: b.vehicleNumber ?? null,
      driverName: b.driverName ?? null,
      driverContact: b.driverContact ?? null,
      remarks: b.remarks ?? null,
      attachmentUrls: b.attachmentUrls || [],
    });

    // Get created receipt
    const [receipt] = await db
      .select()
      .from(procurementMaterialReceiptsTable)
      .where(eq(procurementMaterialReceiptsTable.receiptNumber, receiptNumber))
      .limit(1);

    // Create receipt items: use provided items, or auto-populate from PO items
    let itemsToProcess = b.items;
    if (!itemsToProcess || !Array.isArray(itemsToProcess) || itemsToProcess.length === 0) {
      const poItems = await db
        .select()
        .from(procurementPurchaseOrderItemsTable)
        .where(eq(procurementPurchaseOrderItemsTable.poId, b.poId));

      itemsToProcess = poItems.map((p) => ({
        poItemId: p.id,
        receivedQuantity: p.quantity,
        remarks: null,
      }));
    }

    if (itemsToProcess.length > 0) {
      const itemsToInsert = itemsToProcess.map((item: any) => ({
        receiptId: receipt!.id,
        poItemId: item.poItemId,
        receivedQuantity: String(item.receivedQuantity),
        remarks: item.remarks ?? null,
      }));

      await db.insert(procurementMaterialReceiptItemsTable).values(itemsToInsert);

      // Update PO items received quantities
      for (const item of itemsToProcess) {
        if (!item.poItemId) continue;
        const [poItem] = await db
          .select()
          .from(procurementPurchaseOrderItemsTable)
          .where(eq(procurementPurchaseOrderItemsTable.id, item.poItemId))
          .limit(1);

        if (poItem) {
          const newReceivedQty = Number(poItem.receivedQuantity) + Number(item.receivedQuantity);
          await db
            .update(procurementPurchaseOrderItemsTable)
            .set({ receivedQuantity: String(newReceivedQty) })
            .where(eq(procurementPurchaseOrderItemsTable.id, item.poItemId));
        }
      }
    }

    const deliveryDateStr = b.receivedDate
      ? (typeof b.receivedDate === "string" ? b.receivedDate.split("T")[0] : new Date(b.receivedDate).toISOString().split("T")[0])
      : new Date().toISOString().split("T")[0];

    // Update PO status
    if (isLegacy) {
      await db
        .update(purchaseOrdersTable)
        .set({
          status: "delivered",
          deliveryDate: deliveryDateStr,
        })
        .where(eq(purchaseOrdersTable.id, b.poId));
    } else {
      await db
        .update(procurementPurchaseOrdersTable)
        .set({
          status: "delivered",
          deliveryStatus: "delivered",
          actualDeliveryDate: deliveryDateStr,
        })
        .where(eq(procurementPurchaseOrdersTable.id, b.poId));
    }

    // Get items for response
    const items = await db
      .select()
      .from(procurementMaterialReceiptItemsTable)
      .where(eq(procurementMaterialReceiptItemsTable.receiptId, receipt!.id));

    res.status(201).json({
      ...fReceipt(receipt!),
      attachmentUrls: b.attachmentUrls || [],
      items: items.map(fReceiptItem),
    });
  } catch (error) {
    console.error("Error creating material receipt:", error);
    res.status(500).json({ error: "Failed to create material receipt" });
  }
});

// PUT /api/procurement/receipts/:id - Update receipt
router.put("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.deliveryNoteNumber !== undefined) update.deliveryNoteNumber = b.deliveryNoteNumber;
    if (b.vehicleNumber !== undefined) update.vehicleNumber = b.vehicleNumber;
    if (b.driverName !== undefined) update.driverName = b.driverName;
    if (b.driverContact !== undefined) update.driverContact = b.driverContact;
    if (b.remarks !== undefined) update.remarks = b.remarks;
    if (b.attachmentUrls !== undefined) update.attachmentUrls = JSON.stringify(b.attachmentUrls);

    await db
      .update(procurementMaterialReceiptsTable)
      .set(update)
      .where(eq(procurementMaterialReceiptsTable.id, id));

    const [updated] = await db
      .select()
      .from(procurementMaterialReceiptsTable)
      .where(eq(procurementMaterialReceiptsTable.id, id))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Material receipt not found" });
      return;
    }

    res.json({
      ...fReceipt(updated),
      attachmentUrls:
        typeof updated.attachmentUrls === "string"
          ? JSON.parse(updated.attachmentUrls)
          : updated.attachmentUrls,
    });
  } catch (error) {
    console.error("Error updating material receipt:", error);
    res.status(500).json({ error: "Failed to update material receipt" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// RECEIPT ITEMS - Manage Items
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/receipts/:id/items - Add item
router.post("/:id/items", async (req, res): Promise<void> => {
  try {
    const receiptId = parseInt(req.params.id as string, 10);
    const b = req.body ?? {};

    await db.insert(procurementMaterialReceiptItemsTable).values({
      receiptId,
      poItemId: b.poItemId,
      receivedQuantity: String(b.receivedQuantity),
      remarks: b.remarks ?? null,
    });

    // Update PO item received quantity
    const [poItem] = await db
      .select()
      .from(procurementPurchaseOrderItemsTable)
      .where(eq(procurementPurchaseOrderItemsTable.id, b.poItemId))
      .limit(1);

    if (poItem) {
      const newReceivedQty = Number(poItem.receivedQuantity) + Number(b.receivedQuantity);
      await db
        .update(procurementPurchaseOrderItemsTable)
        .set({ receivedQuantity: String(newReceivedQty) })
        .where(eq(procurementPurchaseOrderItemsTable.id, b.poItemId));
    }

    const [item] = await db
      .select()
      .from(procurementMaterialReceiptItemsTable)
      .where(
        and(
          eq(procurementMaterialReceiptItemsTable.receiptId, receiptId),
          eq(procurementMaterialReceiptItemsTable.poItemId, b.poItemId)
        )
      )
      .limit(1);

    res.status(201).json(fReceiptItem(item!));
  } catch (error) {
    console.error("Error adding receipt item:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
});

// PUT /api/procurement/receipts/:id/items/:itemId - Update item
router.put("/:id/items/:itemId", async (req, res): Promise<void> => {
  try {
    const itemId = parseInt(req.params.itemId as string, 10);
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.receivedQuantity !== undefined) update.receivedQuantity = String(b.receivedQuantity);
    if (b.remarks !== undefined) update.remarks = b.remarks;

    await db
      .update(procurementMaterialReceiptItemsTable)
      .set(update)
      .where(eq(procurementMaterialReceiptItemsTable.id, itemId));

    const [updated] = await db
      .select()
      .from(procurementMaterialReceiptItemsTable)
      .where(eq(procurementMaterialReceiptItemsTable.id, itemId))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(fReceiptItem(updated));
  } catch (error) {
    console.error("Error updating receipt item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET BY PO
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/receipts/by-po/:poId - Get receipts for a PO
router.get("/by-po/:poId", async (req, res): Promise<void> => {
  try {
    const poId = parseInt(req.params.poId as string, 10);

    const receipts = await db
      .select({
        receipt: procurementMaterialReceiptsTable,
        receivedByName: usersTable.name,
      })
      .from(procurementMaterialReceiptsTable)
      .leftJoin(usersTable, eq(usersTable.id, procurementMaterialReceiptsTable.receivedById))
      .where(eq(procurementMaterialReceiptsTable.poId, poId))
      .orderBy(desc(procurementMaterialReceiptsTable.receivedDate));

    res.json(
      receipts.map((r) => ({
        ...fReceipt(r.receipt),
        receivedByName: r.receivedByName,
        attachmentUrls:
          typeof r.receipt.attachmentUrls === "string"
            ? JSON.parse(r.receipt.attachmentUrls)
            : r.receipt.attachmentUrls,
      }))
    );
  } catch (error) {
    console.error("Error fetching receipts by PO:", error);
    res.status(500).json({ error: "Failed to fetch receipts" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PHOTO UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/receipts/:id/photos - Add photos to receipt
router.post("/:id/photos", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { photoUrls } = req.body ?? {};

    if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
      res.status(400).json({ error: "photoUrls array is required" });
      return;
    }

    // Get current photos
    const [receipt] = await db
      .select()
      .from(procurementMaterialReceiptsTable)
      .where(eq(procurementMaterialReceiptsTable.id, id))
      .limit(1);

    if (!receipt) {
      res.status(404).json({ error: "Receipt not found" });
      return;
    }

    const currentPhotos =
      typeof receipt.attachmentUrls === "string"
        ? JSON.parse(receipt.attachmentUrls)
        : receipt.attachmentUrls || [];

    const updatedPhotos = [...currentPhotos, ...photoUrls];

    await db
      .update(procurementMaterialReceiptsTable)
      .set({ attachmentUrls: JSON.stringify(updatedPhotos) })
      .where(eq(procurementMaterialReceiptsTable.id, id));

    res.json({ message: "Photos added successfully", photoCount: updatedPhotos.length });
  } catch (error) {
    console.error("Error adding photos:", error);
    res.status(500).json({ error: "Failed to add photos" });
  }
});

export default router;
