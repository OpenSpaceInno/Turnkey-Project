import { Router, type IRouter } from "express";
import { eq, desc, and, sql, ne } from "drizzle-orm";
import {
  db,
  procurementVendorQuotesTable,
  procurementVendorQuoteItemsTable,
  procurementRfqsTable,
  procurementRfqItemsTable,
  procurementRfqVendorsTable,
  procurementPurchaseOrdersTable,
  procurementPurchaseOrderItemsTable,
  procurementMaterialRequestsTable,
  procurementNotificationsTable,
  vendorsTable,
  usersTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";

const router: IRouter = Router();

// Transform numeric fields
const fQuote = (r: Record<string, unknown>) =>
  numKeys(r, [
    "rfqId",
    "vendorId",
    "deliveryDays",
    "subtotal",
    "taxPercent",
    "taxAmount",
    "shippingCost",
    "totalAmount",
    "selectedById",
  ]);

const fQuoteItem = (r: Record<string, unknown>) =>
  numKeys(r, ["quoteId", "rfqItemId", "quantity", "unitPrice", "totalPrice"]);

// ═══════════════════════════════════════════════════════════════════════════
// VENDOR QUOTES - List & Get
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/quotes - List all vendor quotes
router.get("/", async (req, res): Promise<void> => {
  try {
    const { rfqId, vendorId, status } = req.query;

    let query = db
      .select({
        quote: procurementVendorQuotesTable,
        vendorName: vendorsTable.name,
        rfqNumber: procurementRfqsTable.rfqNumber,
        selectedByName: usersTable.name,
      })
      .from(procurementVendorQuotesTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementVendorQuotesTable.vendorId))
      .leftJoin(procurementRfqsTable, eq(procurementRfqsTable.id, procurementVendorQuotesTable.rfqId))
      .leftJoin(usersTable, eq(usersTable.id, procurementVendorQuotesTable.selectedById))
      .$dynamic();

    const conditions = [];
    if (rfqId) {
      conditions.push(eq(procurementVendorQuotesTable.rfqId, Number(rfqId)));
    }
    if (vendorId) {
      conditions.push(eq(procurementVendorQuotesTable.vendorId, Number(vendorId)));
    }
    if (status) {
      conditions.push(eq(procurementVendorQuotesTable.status, String(status)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(procurementVendorQuotesTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...fQuote(r.quote),
        vendorName: r.vendorName,
        rfqNumber: r.rfqNumber,
        selectedByName: r.selectedByName,
      }))
    );
  } catch (error) {
    console.error("Error fetching vendor quotes:", error);
    res.status(500).json({ error: "Failed to fetch vendor quotes" });
  }
});

// GET /api/procurement/quotes/:id - Get single vendor quote with items
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid quote ID" });
      return;
    }

    const [quote] = await db
      .select({
        quote: procurementVendorQuotesTable,
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
        vendorPhone: vendorsTable.phone,
        rfqNumber: procurementRfqsTable.rfqNumber,
        selectedByName: usersTable.name,
      })
      .from(procurementVendorQuotesTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementVendorQuotesTable.vendorId))
      .leftJoin(procurementRfqsTable, eq(procurementRfqsTable.id, procurementVendorQuotesTable.rfqId))
      .leftJoin(usersTable, eq(usersTable.id, procurementVendorQuotesTable.selectedById))
      .where(eq(procurementVendorQuotesTable.id, id));

    if (!quote) {
      res.status(404).json({ error: "Vendor quote not found" });
      return;
    }

    // Get items
    const items = await db
      .select({
        quoteItem: procurementVendorQuoteItemsTable,
        rfqItemName: procurementRfqItemsTable.itemName,
      })
      .from(procurementVendorQuoteItemsTable)
      .leftJoin(
        procurementRfqItemsTable,
        eq(procurementRfqItemsTable.id, procurementVendorQuoteItemsTable.rfqItemId)
      )
      .where(eq(procurementVendorQuoteItemsTable.quoteId, id))
      .orderBy(procurementVendorQuoteItemsTable.sortOrder);

    res.json({
      ...fQuote(quote.quote),
      vendorName: quote.vendorName,
      vendorEmail: quote.vendorEmail,
      vendorPhone: quote.vendorPhone,
      rfqNumber: quote.rfqNumber,
      selectedByName: quote.selectedByName,
      items: items.map((i) => ({
        ...fQuoteItem(i.quoteItem),
        rfqItemName: i.rfqItemName,
      })),
    });
  } catch (error) {
    console.error("Error fetching vendor quote:", error);
    res.status(500).json({ error: "Failed to fetch vendor quote" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// VENDOR QUOTES - Create & Update
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/quotes - Create vendor quote
router.post("/", async (req, res): Promise<void> => {
  try {
    const b = req.body ?? {};

    // Validate RFQ exists and is accepting quotes
    const [rfq] = await db
      .select()
      .from(procurementRfqsTable)
      .where(eq(procurementRfqsTable.id, b.rfqId))
      .limit(1);

    if (!rfq) {
      res.status(404).json({ error: "RFQ not found" });
      return;
    }

    if (rfq.status === "cancelled" || rfq.status === "completed") {
      res.status(400).json({ error: `RFQ is ${rfq.status} and cannot accept new quotes` });
      return;
    }

    // Use extracted or provided quote number if given, otherwise generate
    let quoteNumber = b.quoteNumber && String(b.quoteNumber).trim() !== "" ? String(b.quoteNumber).trim() : "";
    if (quoteNumber) {
      const [existing] = await db
        .select({ id: procurementVendorQuotesTable.id })
        .from(procurementVendorQuotesTable)
        .where(eq(procurementVendorQuotesTable.quoteNumber, quoteNumber))
        .limit(1);
      if (existing) {
        quoteNumber = `${quoteNumber}-${Date.now().toString().slice(-4)}`;
      }
    } else {
      quoteNumber = await generateNumber("QT", procurementVendorQuotesTable, "quoteNumber");
    }

    // Format dates safely for MySQL
    const safeQuotedDate = b.quotedDate
      ? (typeof b.quotedDate === "string" && b.quotedDate.includes("T") ? b.quotedDate.split("T")[0] : String(b.quotedDate))
      : new Date().toISOString().split("T")[0];
    const safeValidUntil = b.validUntil
      ? (typeof b.validUntil === "string" && b.validUntil.includes("T") ? b.validUntil.split("T")[0] : String(b.validUntil))
      : null;

    // Create quote
    const [insertResult] = await db.insert(procurementVendorQuotesTable).values({
      quoteNumber,
      rfqId: b.rfqId,
      vendorId: b.vendorId,
      quotedDate: safeQuotedDate as any,
      validUntil: safeValidUntil as any,
      deliveryDays: Number(b.deliveryDays) || 7,
      deliveryTerms: b.deliveryTerms ?? null,
      paymentTerms: b.paymentTerms ?? null,
      subtotal: String(b.subtotal ?? 0),
      taxPercent: b.taxPercent ? String(b.taxPercent) : "0",
      taxAmount: b.taxAmount ? String(b.taxAmount) : "0",
      shippingCost: b.shippingCost ? String(b.shippingCost) : "0",
      totalAmount: String(b.totalAmount ?? b.subtotal ?? 0),
      status: "submitted",
      notes: b.notes ?? null,
      attachmentUrl: b.attachmentUrl ?? null,
    });

    const insertedQuoteId = (insertResult as any)?.insertId;

    // Get created quote by exact ID if available
    const [quote] = insertedQuoteId
      ? await db
          .select()
          .from(procurementVendorQuotesTable)
          .where(eq(procurementVendorQuotesTable.id, insertedQuoteId))
          .limit(1)
      : await db
          .select()
          .from(procurementVendorQuotesTable)
          .where(eq(procurementVendorQuotesTable.quoteNumber, quoteNumber))
          .orderBy(desc(procurementVendorQuotesTable.id))
          .limit(1);

    // Create items if provided
    if (b.items && Array.isArray(b.items) && b.items.length > 0) {
      // Get existing RFQ items to resolve rfqItemId if not directly supplied
      const rfqItems = await db
        .select()
        .from(procurementRfqItemsTable)
        .where(eq(procurementRfqItemsTable.rfqId, b.rfqId));

      const itemsToInsert = b.items.map((item: any, index: number) => {
        let matchedRfqItemId = item.rfqItemId ? Number(item.rfqItemId) : null;
        if (!matchedRfqItemId && rfqItems.length > 0) {
          const matched = rfqItems.find(
            (ri) => ri.itemName.toLowerCase().trim() === (item.itemName || "").toLowerCase().trim()
          );
          matchedRfqItemId = matched ? matched.id : (rfqItems[index]?.id ?? rfqItems[0]?.id ?? null);
        }

        return {
          quoteId: quote!.id,
          rfqItemId: matchedRfqItemId,
          itemName: item.itemName,
          quantity: String(item.quantity ?? 1),
          unit: item.unit ?? "Pcs",
          unitPrice: String(item.unitPrice ?? 0),
          totalPrice: String(item.totalPrice ?? (Number(item.quantity ?? 1) * Number(item.unitPrice ?? 0))),
          remarks: item.remarks ?? null,
          sortOrder: index,
        };
      });

      await db.insert(procurementVendorQuoteItemsTable).values(itemsToInsert);
    }

    // Update RFQ status to receiving_quotes if it was draft or sent
    if (rfq.status === "sent" || rfq.status === "draft") {
      await db
        .update(procurementRfqsTable)
        .set({ status: "receiving_quotes" })
        .where(eq(procurementRfqsTable.id, b.rfqId));
    }

    // Update or link RFQ vendor status
    const [existingRfqVendor] = await db
      .select()
      .from(procurementRfqVendorsTable)
      .where(
        and(
          eq(procurementRfqVendorsTable.rfqId, b.rfqId),
          eq(procurementRfqVendorsTable.vendorId, b.vendorId)
        )
      )
      .limit(1);

    if (existingRfqVendor) {
      await db
        .update(procurementRfqVendorsTable)
        .set({
          status: "responded",
          respondedDate: new Date(),
        })
        .where(eq(procurementRfqVendorsTable.id, existingRfqVendor.id));
    } else {
      await db.insert(procurementRfqVendorsTable).values({
        rfqId: b.rfqId,
        vendorId: b.vendorId,
        status: "responded",
        respondedDate: new Date(),
      });
    }

    // Update quotesReceivedCount on RFQ
    const [quoteCountRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(procurementVendorQuotesTable)
      .where(eq(procurementVendorQuotesTable.rfqId, b.rfqId));

    await db
      .update(procurementRfqsTable)
      .set({ quotesReceivedCount: Number(quoteCountRow?.count || 1) })
      .where(eq(procurementRfqsTable.id, b.rfqId));

    // Get items for response
    const items = await db
      .select()
      .from(procurementVendorQuoteItemsTable)
      .where(eq(procurementVendorQuoteItemsTable.quoteId, quote!.id))
      .orderBy(procurementVendorQuoteItemsTable.sortOrder);

    res.status(201).json({
      ...fQuote(quote!),
      items: items.map(fQuoteItem),
    });
  } catch (error) {
    console.error("Error creating vendor quote:", error);
    res.status(500).json({ error: "Failed to create vendor quote" });
  }
});

// PUT /api/procurement/quotes/:id - Update vendor quote
router.put("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid quote ID" });
      return;
    }
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.quoteNumber !== undefined && b.quoteNumber) {
      const rawQuoteNum = String(b.quoteNumber).trim();
      const [conflict] = await db
        .select({ id: procurementVendorQuotesTable.id })
        .from(procurementVendorQuotesTable)
        .where(
          and(
            eq(procurementVendorQuotesTable.quoteNumber, rawQuoteNum),
            ne(procurementVendorQuotesTable.id, id)
          )
        )
        .limit(1);
      update.quoteNumber = conflict ? `${rawQuoteNum}-${Date.now().toString().slice(-4)}` : rawQuoteNum;
    }
    if (b.vendorId !== undefined) update.vendorId = Number(b.vendorId);
    if (b.quotedDate !== undefined) {
      update.quotedDate = typeof b.quotedDate === "string" && b.quotedDate.includes("T")
        ? b.quotedDate.split("T")[0]
        : String(b.quotedDate);
    }
    if (b.validUntil !== undefined) {
      update.validUntil = b.validUntil
        ? (typeof b.validUntil === "string" && b.validUntil.includes("T") ? b.validUntil.split("T")[0] : String(b.validUntil))
        : null;
    }
    if (b.deliveryDays !== undefined) update.deliveryDays = Number(b.deliveryDays);
    if (b.deliveryTerms !== undefined) update.deliveryTerms = b.deliveryTerms;
    if (b.paymentTerms !== undefined) update.paymentTerms = b.paymentTerms;
    if (b.subtotal !== undefined) update.subtotal = String(b.subtotal);
    if (b.taxPercent !== undefined) update.taxPercent = String(b.taxPercent);
    if (b.taxAmount !== undefined) update.taxAmount = String(b.taxAmount);
    if (b.shippingCost !== undefined) update.shippingCost = String(b.shippingCost);
    if (b.totalAmount !== undefined) update.totalAmount = String(b.totalAmount);
    if (b.notes !== undefined) update.notes = b.notes;
    if (b.attachmentUrl !== undefined) update.attachmentUrl = b.attachmentUrl;

    if (Object.keys(update).length > 0) {
      await db.update(procurementVendorQuotesTable).set(update).where(eq(procurementVendorQuotesTable.id, id));
    }

    // Update items if provided
    if (b.items && Array.isArray(b.items)) {
      await db
        .delete(procurementVendorQuoteItemsTable)
        .where(eq(procurementVendorQuoteItemsTable.quoteId, id));

      if (b.items.length > 0) {
        const itemsToInsert = b.items.map((item: any, index: number) => ({
          quoteId: id,
          rfqItemId: item.rfqItemId ? Number(item.rfqItemId) : null,
          itemName: item.itemName || "Item",
          quantity: String(item.quantity ?? 1),
          unit: item.unit ?? "Pcs",
          unitPrice: String(item.unitPrice ?? 0),
          totalPrice: String(item.totalPrice ?? (Number(item.quantity ?? 1) * Number(item.unitPrice ?? 0))),
          remarks: item.remarks ?? null,
          sortOrder: index,
        }));

        await db.insert(procurementVendorQuoteItemsTable).values(itemsToInsert);
      }
    }

    const [updated] = await db
      .select()
      .from(procurementVendorQuotesTable)
      .where(eq(procurementVendorQuotesTable.id, id))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Vendor quote not found" });
      return;
    }

    const items = await db
      .select()
      .from(procurementVendorQuoteItemsTable)
      .where(eq(procurementVendorQuoteItemsTable.quoteId, id))
      .orderBy(procurementVendorQuoteItemsTable.sortOrder);

    res.json({
      ...fQuote(updated),
      items: items.map(fQuoteItem),
    });
  } catch (error) {
    console.error("Error updating vendor quote:", error);
    res.status(500).json({ error: "Failed to update vendor quote" });
  }
});

// POST /api/procurement/quotes/:id/attach-document - Attach document and save extracted data
router.post("/:id/attach-document", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid quote ID" });
      return;
    }
    const { fileUrl, fileName, fileSize, fileType, extractedData } = req.body ?? {};

    if (!fileUrl) {
      res.status(400).json({ error: "fileUrl is required" });
      return;
    }

    const update: Record<string, unknown> = {
      attachmentUrl: fileUrl,
    };

    if (extractedData) {
      if (extractedData.quoteNumber) {
        const rawQuoteNum = String(extractedData.quoteNumber).trim();
        const [conflict] = await db
          .select({ id: procurementVendorQuotesTable.id })
          .from(procurementVendorQuotesTable)
          .where(
            and(
              eq(procurementVendorQuotesTable.quoteNumber, rawQuoteNum),
              ne(procurementVendorQuotesTable.id, id)
            )
          )
          .limit(1);
        update.quoteNumber = conflict ? `${rawQuoteNum}-${Date.now().toString().slice(-4)}` : rawQuoteNum;
      }
      if (extractedData.matchedVendorId) update.vendorId = Number(extractedData.matchedVendorId);
      if (extractedData.deliveryDays) update.deliveryDays = Number(extractedData.deliveryDays);
      if (extractedData.paymentTerms) update.paymentTerms = String(extractedData.paymentTerms);
      if (extractedData.deliveryTerms) update.deliveryTerms = String(extractedData.deliveryTerms);
      if (extractedData.subtotal !== undefined) update.subtotal = String(extractedData.subtotal);
      if (extractedData.taxAmount !== undefined) update.taxAmount = String(extractedData.taxAmount);
      if (extractedData.taxPercent !== undefined) update.taxPercent = String(extractedData.taxPercent);
      if (extractedData.shippingCost !== undefined) update.shippingCost = String(extractedData.shippingCost);
      if (extractedData.totalAmount !== undefined) update.totalAmount = String(extractedData.totalAmount);

      // Save document extraction details in notes
      update.notes = JSON.stringify({
        documentName: fileName,
        documentSize: fileSize,
        documentType: fileType,
        extractedAt: new Date().toISOString(),
        extracted: extractedData,
      });
    }

    await db.update(procurementVendorQuotesTable).set(update).where(eq(procurementVendorQuotesTable.id, id));

    // If item prices were extracted, update or insert items
    if (extractedData?.items && Array.isArray(extractedData.items) && extractedData.items.length > 0) {
      await db
        .delete(procurementVendorQuoteItemsTable)
        .where(eq(procurementVendorQuoteItemsTable.quoteId, id));

      // Get quote to find rfqId
      const [quoteRec] = await db
        .select({ rfqId: procurementVendorQuotesTable.rfqId })
        .from(procurementVendorQuotesTable)
        .where(eq(procurementVendorQuotesTable.id, id))
        .limit(1);

      const rfqItems = quoteRec?.rfqId
        ? await db
            .select()
            .from(procurementRfqItemsTable)
            .where(eq(procurementRfqItemsTable.rfqId, quoteRec.rfqId))
        : [];

      const itemsToInsert = extractedData.items.map((item: any, index: number) => {
        let matchedRfqItemId = item.rfqItemId ? Number(item.rfqItemId) : null;
        if (!matchedRfqItemId && rfqItems.length > 0) {
          const matched = rfqItems.find(
            (ri) => ri.itemName.toLowerCase().trim() === (item.itemName || "").toLowerCase().trim()
          );
          matchedRfqItemId = matched ? matched.id : (rfqItems[index]?.id ?? rfqItems[0]?.id ?? null);
        }

        return {
          quoteId: id,
          rfqItemId: matchedRfqItemId,
          itemName: item.itemName,
          quantity: String(item.quantity || 1),
          unit: item.unit || "Nos",
          unitPrice: String(item.unitPrice || 0),
          totalPrice: String(item.totalPrice || (Number(item.quantity || 1) * Number(item.unitPrice || 0))),
          remarks: item.remarks ?? "Auto-extracted from document",
          sortOrder: index,
        };
      });

      await db.insert(procurementVendorQuoteItemsTable).values(itemsToInsert);
    }

    // Return updated quote with items
    const [updated] = await db
      .select({
        quote: procurementVendorQuotesTable,
        vendorName: vendorsTable.name,
      })
      .from(procurementVendorQuotesTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementVendorQuotesTable.vendorId))
      .where(eq(procurementVendorQuotesTable.id, id))
      .limit(1);

    const items = await db
      .select({
        quoteItem: procurementVendorQuoteItemsTable,
        rfqItemName: procurementRfqItemsTable.itemName,
      })
      .from(procurementVendorQuoteItemsTable)
      .leftJoin(procurementRfqItemsTable, eq(procurementRfqItemsTable.id, procurementVendorQuoteItemsTable.rfqItemId))
      .where(eq(procurementVendorQuoteItemsTable.quoteId, id))
      .orderBy(procurementVendorQuoteItemsTable.sortOrder);

    res.json({
      ...fQuote(updated!.quote),
      vendorName: updated!.vendorName,
      items: items.map((i) => ({
        ...fQuoteItem(i.quoteItem),
        rfqItemName: i.rfqItemName,
      })),
      message: "Document attached and data extracted successfully",
    });
  } catch (error) {
    console.error("Error attaching document to quote:", error);
    res.status(500).json({ error: "Failed to attach document to quote" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// QUOTE ITEMS - Manage Items
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/quotes/:id/items - Add item
router.post("/:id/items", async (req, res): Promise<void> => {
  try {
    const quoteId = parseInt(req.params.id as string, 10);
    if (isNaN(quoteId)) {
      res.status(400).json({ error: "Invalid quote ID" });
      return;
    }
    const b = req.body ?? {};

    const [maxSort] = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), -1)` })
      .from(procurementVendorQuoteItemsTable)
      .where(eq(procurementVendorQuoteItemsTable.quoteId, quoteId));

    const sortOrder = (maxSort?.maxOrder ?? -1) + 1;

    await db.insert(procurementVendorQuoteItemsTable).values({
      quoteId,
      rfqItemId: b.rfqItemId,
      itemName: b.itemName,
      quantity: String(b.quantity),
      unit: b.unit,
      unitPrice: String(b.unitPrice),
      totalPrice: String(b.totalPrice),
      remarks: b.remarks ?? null,
      sortOrder,
    });

    const [item] = await db
      .select()
      .from(procurementVendorQuoteItemsTable)
      .where(
        and(
          eq(procurementVendorQuoteItemsTable.quoteId, quoteId),
          eq(procurementVendorQuoteItemsTable.sortOrder, sortOrder)
        )
      )
      .limit(1);

    res.status(201).json(fQuoteItem(item!));
  } catch (error) {
    console.error("Error adding quote item:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
});

// PUT /api/procurement/quotes/:id/items/:itemId - Update item
router.put("/:id/items/:itemId", async (req, res): Promise<void> => {
  try {
    const itemId = parseInt(req.params.itemId as string, 10);
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.itemName !== undefined) update.itemName = b.itemName;
    if (b.quantity !== undefined) update.quantity = String(b.quantity);
    if (b.unit !== undefined) update.unit = b.unit;
    if (b.unitPrice !== undefined) update.unitPrice = String(b.unitPrice);
    if (b.totalPrice !== undefined) update.totalPrice = String(b.totalPrice);
    if (b.remarks !== undefined) update.remarks = b.remarks;

    await db
      .update(procurementVendorQuoteItemsTable)
      .set(update)
      .where(eq(procurementVendorQuoteItemsTable.id, itemId));

    const [updated] = await db
      .select()
      .from(procurementVendorQuoteItemsTable)
      .where(eq(procurementVendorQuoteItemsTable.id, itemId))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(fQuoteItem(updated));
  } catch (error) {
    console.error("Error updating quote item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE /api/procurement/quotes/:id/items/:itemId - Delete item
router.delete("/:id/items/:itemId", async (req, res): Promise<void> => {
  try {
    const itemId = parseInt(req.params.itemId as string, 10);

    await db
      .delete(procurementVendorQuoteItemsTable)
      .where(eq(procurementVendorQuoteItemsTable.id, itemId));

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting quote item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Select Winning Quote
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/quotes/:id/select - Select winning quote
router.post("/:id/select", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid quote ID" });
      return;
    }
    const me = await getCurrentUser(req);
    const { reason } = req.body ?? {};

    // Get quote details
    const [quote] = await db
      .select()
      .from(procurementVendorQuotesTable)
      .where(eq(procurementVendorQuotesTable.id, id))
      .limit(1);

    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }

    // Unselect all other quotes for this RFQ
    await db
      .update(procurementVendorQuotesTable)
      .set({
        isSelected: false,
        status: "rejected",
      })
      .where(
        and(
          eq(procurementVendorQuotesTable.rfqId, quote.rfqId),
          ne(procurementVendorQuotesTable.id, id)
        )
      );

    // Select this quote
    await db
      .update(procurementVendorQuotesTable)
      .set({
        isSelected: true,
        status: "selected",
        selectionReason: reason ?? null,
        selectedById: me.id,
        selectedDate: new Date(),
      })
      .where(eq(procurementVendorQuotesTable.id, id));

    // Update RFQ with selected quote
    await db
      .update(procurementRfqsTable)
      .set({
        selectedQuoteId: id,
        status: "evaluated",
      })
      .where(eq(procurementRfqsTable.id, quote.rfqId));

    // Get RFQ details to link with project and material request
    const [rfq] = await db
      .select()
      .from(procurementRfqsTable)
      .where(eq(procurementRfqsTable.id, quote.rfqId))
      .limit(1);

    // Check if a PO already exists for this quote
    let [existingPo] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.quoteId, id))
      .limit(1);

    let poId = existingPo ? existingPo.id : null;
    let poNumber = existingPo ? existingPo.poNumber : null;

    if (!existingPo && rfq) {
      // Generate PO Number
      poNumber = await generateNumber("PO", procurementPurchaseOrdersTable);
      
      const expectedDelivery = new Date();
      expectedDelivery.setDate(expectedDelivery.getDate() + (quote.deliveryDays || 7));

      await db.insert(procurementPurchaseOrdersTable).values({
        poNumber,
        rfqId: rfq.id,
        quoteId: id,
        materialRequestId: rfq.materialRequestId,
        projectId: rfq.projectId,
        vendorId: quote.vendorId,
        poDate: new Date(),
        expectedDeliveryDate: expectedDelivery,
        subtotal: String(quote.subtotal),
        taxAmount: String(quote.taxAmount || "0"),
        shippingCost: String(quote.shippingCost || "0"),
        totalAmount: String(quote.totalAmount),
        deliveryTerms: quote.deliveryTerms || null,
        paymentTerms: quote.paymentTerms || null,
        status: "draft",
        deliveryStatus: "pending",
        createdById: me.id,
        notes: `Generated automatically from winning quote ${quote.quoteNumber}`,
      });

      const [newPo] = await db
        .select()
        .from(procurementPurchaseOrdersTable)
        .where(eq(procurementPurchaseOrdersTable.poNumber, poNumber))
        .limit(1);

      if (newPo) {
        poId = newPo.id;
        
        // Copy line items from quote to PO
        const quoteItems = await db
          .select()
          .from(procurementVendorQuoteItemsTable)
          .where(eq(procurementVendorQuoteItemsTable.quoteId, id))
          .orderBy(procurementVendorQuoteItemsTable.sortOrder);

        if (quoteItems.length > 0) {
          const poItems = quoteItems.map((qi, idx) => ({
            poId: newPo.id,
            itemName: qi.itemName,
            description: qi.remarks || null,
            specification: null,
            quantity: String(qi.quantity),
            unit: qi.unit,
            unitPrice: String(qi.unitPrice),
            totalPrice: String(qi.totalPrice),
            receivedQuantity: "0",
            acceptedQuantity: "0",
            rejectedQuantity: "0",
            sortOrder: idx,
          }));

          await db.insert(procurementPurchaseOrderItemsTable).values(poItems);
        }
      }
    }

    res.json({
      message: "Quote selected and Purchase Order created successfully",
      quoteId: id,
      poId,
      poNumber,
      selectedBy: me.name,
    });
  } catch (error) {
    console.error("Error selecting quote:", error);
    res.status(500).json({ error: "Failed to select quote" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPARISON VIEW
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/rfqs/:rfqId/quotes - Get all quotes for an RFQ (comparison)
router.get("/rfqs/:rfqId/quotes", async (req, res): Promise<void> => {
  try {
    const rfqId = parseInt(req.params.rfqId as string, 10);

    const quotes = await db
      .select({
        quote: procurementVendorQuotesTable,
        vendorName: vendorsTable.name,
        vendorRating: vendorsTable.rating,
      })
      .from(procurementVendorQuotesTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementVendorQuotesTable.vendorId))
      .where(eq(procurementVendorQuotesTable.rfqId, rfqId))
      .orderBy(procurementVendorQuotesTable.totalAmount);

    // Get items for all quotes
    const quoteIds = quotes.map((q) => q.quote.id);
    let allItems: any[] = [];

    if (quoteIds.length > 0) {
      allItems = await db
        .select({
          quoteItem: procurementVendorQuoteItemsTable,
          rfqItemName: procurementRfqItemsTable.itemName,
        })
        .from(procurementVendorQuoteItemsTable)
        .leftJoin(
          procurementRfqItemsTable,
          eq(procurementRfqItemsTable.id, procurementVendorQuoteItemsTable.rfqItemId)
        )
        .where(sql`${procurementVendorQuoteItemsTable.quoteId} IN (${sql.join(quoteIds, sql`, `)})`);
    }

    // Group items by quote
    const quotesWithItems = quotes.map((q) => ({
      ...fQuote(q.quote),
      vendorName: q.vendorName,
      vendorRating: q.vendorRating ? Number(q.vendorRating) : 0,
      items: allItems
        .filter((i) => i.quoteItem.quoteId === q.quote.id)
        .map((i) => ({
          ...fQuoteItem(i.quoteItem),
          rfqItemName: i.rfqItemName,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));

    res.json(quotesWithItems);
  } catch (error) {
    console.error("Error fetching quotes comparison:", error);
    res.status(500).json({ error: "Failed to fetch quotes comparison" });
  }
});

// GET /api/procurement/quotes/:id/comparison - Get comparison data for a specific quote
router.get("/:id/comparison", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid quote ID" });
      return;
    }

    // Get the quote
    const [quote] = await db
      .select()
      .from(procurementVendorQuotesTable)
      .where(eq(procurementVendorQuotesTable.id, id))
      .limit(1);

    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }

    // Get all quotes for the same RFQ
    const allQuotes = await db
      .select({
        quote: procurementVendorQuotesTable,
        vendorName: vendorsTable.name,
      })
      .from(procurementVendorQuotesTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementVendorQuotesTable.vendorId))
      .where(eq(procurementVendorQuotesTable.rfqId, quote.rfqId));

    // Calculate statistics
    const amounts = allQuotes.map((q) => Number(q.quote.totalAmount));
    const lowestAmount = Math.min(...amounts);
    const averageAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const rank = amounts.filter((a) => a < Number(quote.totalAmount)).length + 1;

    res.json({
      quote: fQuote(quote),
      comparison: {
        totalQuotes: allQuotes.length,
        lowestAmount,
        averageAmount,
        rank,
        isLowest: Number(quote.totalAmount) === lowestAmount,
        percentageAboveLowest:
          ((Number(quote.totalAmount) - lowestAmount) / lowestAmount) * 100,
      },
    });
  } catch (error) {
    console.error("Error fetching quote comparison:", error);
    res.status(500).json({ error: "Failed to fetch quote comparison" });
  }
});

export default router;
