import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db,
  procurementVendorFollowUpsTable,
  procurementPurchaseOrdersTable,
  vendorsTable,
  usersTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

// Transform numeric fields
const fFollowUp = (r: Record<string, unknown>) =>
  numKeys(r, ["poId", "vendorId", "followUpById"]);

// ═══════════════════════════════════════════════════════════════════════════
// VENDOR FOLLOW-UPS - List & Get
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/follow-ups - List all follow-ups
router.get("/", async (req, res): Promise<void> => {
  try {
    const { poId, vendorId, status } = req.query;

    let query = db
      .select({
        followUp: procurementVendorFollowUpsTable,
        poNumber: procurementPurchaseOrdersTable.poNumber,
        vendorName: vendorsTable.name,
        followUpByName: usersTable.name,
      })
      .from(procurementVendorFollowUpsTable)
      .leftJoin(
        procurementPurchaseOrdersTable,
        eq(procurementPurchaseOrdersTable.id, procurementVendorFollowUpsTable.poId)
      )
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementVendorFollowUpsTable.vendorId))
      .leftJoin(usersTable, eq(usersTable.id, procurementVendorFollowUpsTable.followUpById))
      .$dynamic();

    const conditions = [];
    if (poId) {
      conditions.push(eq(procurementVendorFollowUpsTable.poId, Number(poId)));
    }
    if (vendorId) {
      conditions.push(eq(procurementVendorFollowUpsTable.vendorId, Number(vendorId)));
    }
    if (status) {
      conditions.push(eq(procurementVendorFollowUpsTable.status, String(status)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(procurementVendorFollowUpsTable.followUpDate));

    res.json(
      rows.map((r) => ({
        ...fFollowUp(r.followUp),
        poNumber: r.poNumber,
        vendorName: r.vendorName,
        followUpByName: r.followUpByName,
      }))
    );
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    res.status(500).json({ error: "Failed to fetch follow-ups" });
  }
});

// GET /api/procurement/follow-ups/:id - Get single follow-up
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const [followUp] = await db
      .select({
        followUp: procurementVendorFollowUpsTable,
        poNumber: procurementPurchaseOrdersTable.poNumber,
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
        vendorPhone: vendorsTable.phone,
        followUpByName: usersTable.name,
      })
      .from(procurementVendorFollowUpsTable)
      .leftJoin(
        procurementPurchaseOrdersTable,
        eq(procurementPurchaseOrdersTable.id, procurementVendorFollowUpsTable.poId)
      )
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementVendorFollowUpsTable.vendorId))
      .leftJoin(usersTable, eq(usersTable.id, procurementVendorFollowUpsTable.followUpById))
      .where(eq(procurementVendorFollowUpsTable.id, id));

    if (!followUp) {
      res.status(404).json({ error: "Follow-up not found" });
      return;
    }

    res.json({
      ...fFollowUp(followUp.followUp),
      poNumber: followUp.poNumber,
      vendorName: followUp.vendorName,
      vendorEmail: followUp.vendorEmail,
      vendorPhone: followUp.vendorPhone,
      followUpByName: followUp.followUpByName,
    });
  } catch (error) {
    console.error("Error fetching follow-up:", error);
    res.status(500).json({ error: "Failed to fetch follow-up" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// VENDOR FOLLOW-UPS - Create
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/follow-ups - Create follow-up
router.post("/", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser();
    const b = req.body ?? {};

    await db.insert(procurementVendorFollowUpsTable).values({
      poId: b.poId,
      vendorId: b.vendorId,
      followUpDate: b.followUpDate || new Date(),
      followUpType: b.followUpType || "email",
      followUpReason: b.followUpReason,
      message: b.message ?? null,
      response: null,
      responseDate: null,
      followUpById: me.id,
      status: "sent",
    });

    // Get the created follow-up (MySQL doesn't support RETURNING)
    const [followUp] = await db
      .select()
      .from(procurementVendorFollowUpsTable)
      .where(
        and(
          eq(procurementVendorFollowUpsTable.poId, b.poId),
          eq(procurementVendorFollowUpsTable.vendorId, b.vendorId)
        )
      )
      .orderBy(desc(procurementVendorFollowUpsTable.createdAt))
      .limit(1);

    res.status(201).json(fFollowUp(followUp!));
  } catch (error) {
    console.error("Error creating follow-up:", error);
    res.status(500).json({ error: "Failed to create follow-up" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// VENDOR FOLLOW-UPS - Update Response
// ═══════════════════════════════════════════════════════════════════════════

// PUT /api/procurement/follow-ups/:id/response - Record vendor response
router.put("/:id/response", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { response } = req.body ?? {};

    if (!response) {
      res.status(400).json({ error: "Response is required" });
      return;
    }

    await db
      .update(procurementVendorFollowUpsTable)
      .set({
        response,
        responseDate: new Date(),
        status: "responded",
      })
      .where(eq(procurementVendorFollowUpsTable.id, id));

    const [updated] = await db
      .select()
      .from(procurementVendorFollowUpsTable)
      .where(eq(procurementVendorFollowUpsTable.id, id))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Follow-up not found" });
      return;
    }

    res.json(fFollowUp(updated));
  } catch (error) {
    console.error("Error updating follow-up response:", error);
    res.status(500).json({ error: "Failed to update follow-up response" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET FOLLOW-UPS BY PO
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/follow-ups/by-po/:poId - Get all follow-ups for a PO
router.get("/by-po/:poId", async (req, res): Promise<void> => {
  try {
    const poId = parseInt(req.params.poId as string, 10);

    const followUps = await db
      .select({
        followUp: procurementVendorFollowUpsTable,
        vendorName: vendorsTable.name,
        followUpByName: usersTable.name,
      })
      .from(procurementVendorFollowUpsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementVendorFollowUpsTable.vendorId))
      .leftJoin(usersTable, eq(usersTable.id, procurementVendorFollowUpsTable.followUpById))
      .where(eq(procurementVendorFollowUpsTable.poId, poId))
      .orderBy(desc(procurementVendorFollowUpsTable.followUpDate));

    res.json(
      followUps.map((r) => ({
        ...fFollowUp(r.followUp),
        vendorName: r.vendorName,
        followUpByName: r.followUpByName,
      }))
    );
  } catch (error) {
    console.error("Error fetching follow-ups by PO:", error);
    res.status(500).json({ error: "Failed to fetch follow-ups" });
  }
});

export default router;
