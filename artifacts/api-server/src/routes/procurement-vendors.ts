import { Router, type IRouter } from "express";
import { eq, desc, like, or } from "drizzle-orm";
import { db, vendorsTable } from "@workspace/db";
import { numKeys } from "../lib/transforms";

const router: IRouter = Router();

// Transform numeric fields
const fVendor = (r: Record<string, unknown>) => numKeys(r, ["rating"]);

// ═══════════════════════════════════════════════════════════════════════════
// VENDORS - List & Get
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/vendors - List all vendors
router.get("/", async (req, res): Promise<void> => {
  try {
    const { category, status, search } = req.query;

    let query = db.select().from(vendorsTable).$dynamic();

    const conditions = [];

    if (category) {
      conditions.push(eq(vendorsTable.category, String(category)));
    }

    if (status) {
      conditions.push(eq(vendorsTable.status, String(status)));
    }

    if (search) {
      conditions.push(
        or(
          like(vendorsTable.name, `%${search}%`),
          like(vendorsTable.email, `%${search}%`),
          like(vendorsTable.contactPerson, `%${search}%`)
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(
        conditions.length === 1 ? conditions[0] : conditions.reduce((a, b) => or(a, b)!)
      );
    }

    const rows = await query.orderBy(vendorsTable.name);

    res.json(rows.map(fVendor));
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// GET /api/procurement/vendors/:id - Get single vendor
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const [vendor] = await db
      .select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, id))
      .limit(1);

    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    res.json(fVendor(vendor));
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// VENDORS - Create & Update
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/vendors - Create vendor
router.post("/", async (req, res): Promise<void> => {
  try {
    const b = req.body ?? {};

    await db.insert(vendorsTable).values({
      name: b.name,
      contactPerson: b.contactPerson ?? null,
      email: b.email ?? null,
      phone: b.phone ?? null,
      address: b.address ?? null,
      category: b.category ?? null,
      rating: b.rating ? String(b.rating) : "0",
      status: b.status || "active",
    });

    // Get the created vendor
    const [vendor] = await db
      .select()
      .from(vendorsTable)
      .where(eq(vendorsTable.name, b.name))
      .orderBy(desc(vendorsTable.createdAt))
      .limit(1);

    res.status(201).json(fVendor(vendor!));
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

// PUT /api/procurement/vendors/:id - Update vendor
router.put("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.name !== undefined) update.name = b.name;
    if (b.contactPerson !== undefined) update.contactPerson = b.contactPerson;
    if (b.email !== undefined) update.email = b.email;
    if (b.phone !== undefined) update.phone = b.phone;
    if (b.address !== undefined) update.address = b.address;
    if (b.category !== undefined) update.category = b.category;
    if (b.rating !== undefined) update.rating = String(b.rating);
    if (b.status !== undefined) update.status = b.status;

    await db.update(vendorsTable).set(update).where(eq(vendorsTable.id, id));

    const [updated] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id)).limit(1);

    if (!updated) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    res.json(fVendor(updated));
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

export default router;
