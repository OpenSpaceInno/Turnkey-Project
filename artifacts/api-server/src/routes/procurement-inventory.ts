import { Router, type IRouter } from "express";
import { eq, desc, and, sql, lt, or, like } from "drizzle-orm";
import {
  db,
  procurementInventoryItemsTable,
  procurementInventoryTransactionsTable,
  projectsTable,
  usersTable,
  tasksTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";

const router: IRouter = Router();

// Transform numeric fields
const fInventoryItem = (r: Record<string, unknown>) =>
  numKeys(r, [
    "projectId",
    "totalQuantity",
    "availableQuantity",
    "allocatedQuantity",
    "consumedQuantity",
    "minimumStock",
    "reorderLevel",
    "averageCost",
    "lastPurchasePrice",
  ]);

const fTransaction = (r: Record<string, unknown>) =>
  numKeys(r, [
    "inventoryItemId",
    "projectId",
    "quantity",
    "unitPrice",
    "totalValue",
    "balanceQuantity",
    "poId",
    "inspectionId",
    "taskId",
    "createdById",
  ]);

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY ITEMS - List & Get
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/inventory - List all inventory items
router.get("/", async (req, res): Promise<void> => {
  try {
    const { projectId, category, status } = req.query;

    let query = db
      .select({
        item: procurementInventoryItemsTable,
        projectName: projectsTable.name,
      })
      .from(procurementInventoryItemsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementInventoryItemsTable.projectId))
      .$dynamic();

    const conditions = [];
    if (projectId) {
      conditions.push(eq(procurementInventoryItemsTable.projectId, Number(projectId)));
    }
    if (category) {
      conditions.push(eq(procurementInventoryItemsTable.category, String(category)));
    }
    if (status) {
      conditions.push(eq(procurementInventoryItemsTable.status, String(status)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(procurementInventoryItemsTable.itemName);

    res.json(
      rows.map((r) => ({
        ...fInventoryItem(r.item),
        projectName: r.projectName,
      }))
    );
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    res.status(500).json({ error: "Failed to fetch inventory items" });
  }
});

// GET /api/procurement/inventory/:id - Get single inventory item
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const [item] = await db
      .select({
        item: procurementInventoryItemsTable,
        projectName: projectsTable.name,
      })
      .from(procurementInventoryItemsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementInventoryItemsTable.projectId))
      .where(eq(procurementInventoryItemsTable.id, id));

    if (!item) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }

    res.json({
      ...fInventoryItem(item.item),
      projectName: item.projectName,
    });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    res.status(500).json({ error: "Failed to fetch inventory item" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY ITEMS - Create & Update
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inventory - Create inventory item (manual)
router.post("/", async (req, res): Promise<void> => {
  try {
    const b = req.body ?? {};

    // Generate item code
    const itemCode = await generateNumber("INV", procurementInventoryItemsTable, "itemCode");

    await db.insert(procurementInventoryItemsTable).values({
      itemCode,
      projectId: b.projectId ?? null,
      itemName: b.itemName,
      description: b.description ?? null,
      category: b.category,
      unit: b.unit,
      totalQuantity: b.totalQuantity ? String(b.totalQuantity) : "0",
      availableQuantity: b.availableQuantity ? String(b.availableQuantity) : "0",
      allocatedQuantity: "0",
      consumedQuantity: "0",
      minimumStock: b.minimumStock ? String(b.minimumStock) : "0",
      reorderLevel: b.reorderLevel ? String(b.reorderLevel) : "0",
      averageCost: b.averageCost ? String(b.averageCost) : "0",
      lastPurchasePrice: b.lastPurchasePrice ? String(b.lastPurchasePrice) : null,
      lastPurchaseDate: b.lastPurchaseDate ?? null,
      warehouseLocation: b.warehouseLocation ?? null,
      status: "active",
    });

    const [item] = await db
      .select()
      .from(procurementInventoryItemsTable)
      .where(eq(procurementInventoryItemsTable.itemCode, itemCode))
      .limit(1);

    res.status(201).json(fInventoryItem(item!));
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

// PUT /api/procurement/inventory/:id - Update inventory item
router.put("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const b = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (b.itemName !== undefined) update.itemName = b.itemName;
    if (b.description !== undefined) update.description = b.description;
    if (b.category !== undefined) update.category = b.category;
    if (b.unit !== undefined) update.unit = b.unit;
    if (b.minimumStock !== undefined) update.minimumStock = String(b.minimumStock);
    if (b.reorderLevel !== undefined) update.reorderLevel = String(b.reorderLevel);
    if (b.warehouseLocation !== undefined) update.warehouseLocation = b.warehouseLocation;
    if (b.status !== undefined) update.status = b.status;

    await db
      .update(procurementInventoryItemsTable)
      .set(update)
      .where(eq(procurementInventoryItemsTable.id, id));

    const [updated] = await db
      .select()
      .from(procurementInventoryItemsTable)
      .where(eq(procurementInventoryItemsTable.id, id))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }

    res.json(fInventoryItem(updated));
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/inventory/:id/transactions - Get transactions for item
router.get("/:id/transactions", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const transactions = await db
      .select({
        transaction: procurementInventoryTransactionsTable,
        createdByName: usersTable.name,
        projectName: projectsTable.name,
      })
      .from(procurementInventoryTransactionsTable)
      .leftJoin(usersTable, eq(usersTable.id, procurementInventoryTransactionsTable.createdById))
      .leftJoin(projectsTable, eq(projectsTable.id, procurementInventoryTransactionsTable.projectId))
      .where(eq(procurementInventoryTransactionsTable.inventoryItemId, id))
      .orderBy(desc(procurementInventoryTransactionsTable.transactionDate));

    res.json(
      transactions.map((t) => ({
        ...fTransaction(t.transaction),
        createdByName: t.createdByName,
        projectName: t.projectName,
      }))
    );
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY OPERATIONS - Issue to Project
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inventory/:id/issue - Issue material to project/task
router.post("/:id/issue", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { quantity, projectId, taskId, remarks } = req.body ?? {};

    if (!quantity || quantity <= 0) {
      res.status(400).json({ error: "Valid quantity is required" });
      return;
    }

    // Get inventory item
    const [item] = await db
      .select()
      .from(procurementInventoryItemsTable)
      .where(eq(procurementInventoryItemsTable.id, id))
      .limit(1);

    if (!item) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }

    // Check available quantity
    const availableQty = Number(item.availableQuantity);
    if (availableQty < quantity) {
      res.status(400).json({
        error: "Insufficient available quantity",
        available: availableQty,
        requested: quantity,
      });
      return;
    }

    // Update inventory quantities
    const newAvailable = availableQty - quantity;
    const newAllocated = Number(item.allocatedQuantity) + quantity;

    await db
      .update(procurementInventoryItemsTable)
      .set({
        availableQuantity: String(newAvailable),
        allocatedQuantity: String(newAllocated),
      })
      .where(eq(procurementInventoryItemsTable.id, id));

    // Create transaction
    const transactionNumber = await generateNumber(
      "TXN",
      procurementInventoryTransactionsTable,
      "transactionNumber"
    );

    await db.insert(procurementInventoryTransactionsTable).values({
      transactionNumber,
      inventoryItemId: id,
      projectId: projectId ?? null,
      transactionType: "issue_to_project",
      transactionDate: new Date(),
      quantity: String(quantity),
      unitPrice: item.averageCost,
      totalValue: String(Number(item.averageCost) * quantity),
      balanceQuantity: String(Number(item.totalQuantity)),
      taskId: taskId ?? null,
      remarks: remarks ?? null,
      createdById: me.id,
    });

    res.json({
      message: "Material issued successfully",
      transactionNumber,
      newAvailableQuantity: newAvailable,
    });
  } catch (error) {
    console.error("Error issuing material:", error);
    res.status(500).json({ error: "Failed to issue material" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY OPERATIONS - Return from Project
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inventory/:id/return - Return material from project
router.post("/:id/return", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { quantity, projectId, taskId, remarks } = req.body ?? {};

    if (!quantity || quantity <= 0) {
      res.status(400).json({ error: "Valid quantity is required" });
      return;
    }

    // Get inventory item
    const [item] = await db
      .select()
      .from(procurementInventoryItemsTable)
      .where(eq(procurementInventoryItemsTable.id, id))
      .limit(1);

    if (!item) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }

    // Update inventory quantities
    const newAvailable = Number(item.availableQuantity) + quantity;
    const newAllocated = Number(item.allocatedQuantity) - quantity;

    await db
      .update(procurementInventoryItemsTable)
      .set({
        availableQuantity: String(newAvailable),
        allocatedQuantity: String(newAllocated >= 0 ? newAllocated : 0),
      })
      .where(eq(procurementInventoryItemsTable.id, id));

    // Create transaction
    const transactionNumber = await generateNumber(
      "TXN",
      procurementInventoryTransactionsTable,
      "transactionNumber"
    );

    await db.insert(procurementInventoryTransactionsTable).values({
      transactionNumber,
      inventoryItemId: id,
      projectId: projectId ?? null,
      transactionType: "return_from_project",
      transactionDate: new Date(),
      quantity: String(quantity),
      unitPrice: item.averageCost,
      totalValue: String(Number(item.averageCost) * quantity),
      balanceQuantity: String(Number(item.totalQuantity)),
      taskId: taskId ?? null,
      remarks: remarks ?? null,
      createdById: me.id,
    });

    res.json({
      message: "Material returned successfully",
      transactionNumber,
      newAvailableQuantity: newAvailable,
    });
  } catch (error) {
    console.error("Error returning material:", error);
    res.status(500).json({ error: "Failed to return material" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY OPERATIONS - Adjustment
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inventory/:id/adjust - Stock adjustment
router.post("/:id/adjust", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { quantity, adjustmentType, remarks } = req.body ?? {};

    // adjustmentType: 'increase' or 'decrease'
    if (!quantity || quantity <= 0) {
      res.status(400).json({ error: "Valid quantity is required" });
      return;
    }

    if (!adjustmentType || !["increase", "decrease"].includes(adjustmentType)) {
      res.status(400).json({ error: "Valid adjustmentType is required (increase/decrease)" });
      return;
    }

    // Get inventory item
    const [item] = await db
      .select()
      .from(procurementInventoryItemsTable)
      .where(eq(procurementInventoryItemsTable.id, id))
      .limit(1);

    if (!item) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }

    // Calculate new quantities
    const multiplier = adjustmentType === "increase" ? 1 : -1;
    const adjustmentQty = quantity * multiplier;
    const newTotal = Number(item.totalQuantity) + adjustmentQty;
    const newAvailable = Number(item.availableQuantity) + adjustmentQty;

    if (newTotal < 0 || newAvailable < 0) {
      res.status(400).json({ error: "Adjustment would result in negative quantity" });
      return;
    }

    // Update inventory
    await db
      .update(procurementInventoryItemsTable)
      .set({
        totalQuantity: String(newTotal),
        availableQuantity: String(newAvailable),
      })
      .where(eq(procurementInventoryItemsTable.id, id));

    // Create transaction
    const transactionNumber = await generateNumber(
      "TXN",
      procurementInventoryTransactionsTable,
      "transactionNumber"
    );

    await db.insert(procurementInventoryTransactionsTable).values({
      transactionNumber,
      inventoryItemId: id,
      projectId: item.projectId,
      transactionType: "adjustment",
      transactionDate: new Date(),
      quantity: String(adjustmentQty),
      unitPrice: item.averageCost,
      totalValue: String(Number(item.averageCost) * Math.abs(adjustmentQty)),
      balanceQuantity: String(newTotal),
      remarks: remarks ?? `Stock adjustment - ${adjustmentType}`,
      createdById: me.id,
    });

    res.json({
      message: "Stock adjusted successfully",
      transactionNumber,
      newTotalQuantity: newTotal,
      newAvailableQuantity: newAvailable,
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    res.status(500).json({ error: "Failed to adjust stock" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// LOW STOCK ALERTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/inventory/low-stock - Get items with low stock
router.get("/low-stock", async (req, res): Promise<void> => {
  try {
    const { projectId } = req.query;

    let query = db
      .select({
        item: procurementInventoryItemsTable,
        projectName: projectsTable.name,
      })
      .from(procurementInventoryItemsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementInventoryItemsTable.projectId))
      .where(
        or(
          sql`${procurementInventoryItemsTable.availableQuantity} <= ${procurementInventoryItemsTable.minimumStock}`,
          sql`${procurementInventoryItemsTable.availableQuantity} <= ${procurementInventoryItemsTable.reorderLevel}`
        )
      )
      .$dynamic();

    if (projectId) {
      query = query.where(eq(procurementInventoryItemsTable.projectId, Number(projectId)));
    }

    const rows = await query.orderBy(procurementInventoryItemsTable.itemName);

    res.json(
      rows.map((r) => ({
        ...fInventoryItem(r.item),
        projectName: r.projectName,
        isLowStock: Number(r.item.availableQuantity) <= Number(r.item.minimumStock),
        shouldReorder: Number(r.item.availableQuantity) <= Number(r.item.reorderLevel),
      }))
    );
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({ error: "Failed to fetch low stock items" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY BY PROJECT
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/inventory/by-project/:projectId - Get inventory for project
router.get("/by-project/:projectId", async (req, res): Promise<void> => {
  try {
    const projectId = parseInt(req.params.projectId as string, 10);

    const items = await db
      .select()
      .from(procurementInventoryItemsTable)
      .where(eq(procurementInventoryItemsTable.projectId, projectId))
      .orderBy(procurementInventoryItemsTable.itemName);

    res.json(items.map(fInventoryItem));
  } catch (error) {
    console.error("Error fetching project inventory:", error);
    res.status(500).json({ error: "Failed to fetch project inventory" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/inventory/stats/summary - Get summary statistics
router.get("/stats/summary", async (req, res): Promise<void> => {
  try {
    const { projectId } = req.query;

    let baseQuery = db
      .select({
        status: procurementInventoryItemsTable.status,
        count: sql<number>`COUNT(*)`.as("count"),
        totalValue: sql<number>`SUM(${procurementInventoryItemsTable.totalQuantity} * ${procurementInventoryItemsTable.averageCost})`.as(
          "totalValue"
        ),
      })
      .from(procurementInventoryItemsTable)
      .$dynamic();

    if (projectId) {
      baseQuery = baseQuery.where(eq(procurementInventoryItemsTable.projectId, Number(projectId)));
    }

    const stats = await baseQuery.groupBy(procurementInventoryItemsTable.status);

    // Get low stock count
    let lowStockQuery = db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(procurementInventoryItemsTable)
      .where(
        sql`${procurementInventoryItemsTable.availableQuantity} <= ${procurementInventoryItemsTable.minimumStock}`
      )
      .$dynamic();

    if (projectId) {
      lowStockQuery = lowStockQuery.where(
        eq(procurementInventoryItemsTable.projectId, Number(projectId))
      );
    }

    const [lowStock] = await lowStockQuery;

    const summary = {
      totalItems: 0,
      totalValue: 0,
      active: 0,
      low_stock: Number(lowStock?.count ?? 0),
      out_of_stock: 0,
      discontinued: 0,
    };

    stats.forEach((stat) => {
      const count = Number(stat.count);
      const value = Number(stat.totalValue || 0);
      summary.totalItems += count;
      summary.totalValue += value;
      if (stat.status in summary) {
        summary[stat.status as keyof typeof summary] = count as never;
      }
    });

    res.json(summary);
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ITEM HISTORY
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/inventory/:id/history - Get complete history of item
router.get("/:id/history", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    // Get item
    const [item] = await db
      .select()
      .from(procurementInventoryItemsTable)
      .where(eq(procurementInventoryItemsTable.id, id))
      .limit(1);

    if (!item) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }

    // Get all transactions
    const transactions = await db
      .select({
        transaction: procurementInventoryTransactionsTable,
        createdByName: usersTable.name,
        projectName: projectsTable.name,
        taskTitle: tasksTable.title,
      })
      .from(procurementInventoryTransactionsTable)
      .leftJoin(usersTable, eq(usersTable.id, procurementInventoryTransactionsTable.createdById))
      .leftJoin(projectsTable, eq(projectsTable.id, procurementInventoryTransactionsTable.projectId))
      .leftJoin(tasksTable, eq(tasksTable.id, procurementInventoryTransactionsTable.taskId))
      .where(eq(procurementInventoryTransactionsTable.inventoryItemId, id))
      .orderBy(desc(procurementInventoryTransactionsTable.transactionDate));

    res.json({
      item: fInventoryItem(item),
      transactions: transactions.map((t) => ({
        ...fTransaction(t.transaction),
        createdByName: t.createdByName,
        projectName: t.projectName,
        taskTitle: t.taskTitle,
      })),
    });
  } catch (error) {
    console.error("Error fetching item history:", error);
    res.status(500).json({ error: "Failed to fetch item history" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/inventory/search - Search inventory items
router.post("/search", async (req, res): Promise<void> => {
  try {
    const { query, projectId, category } = req.body ?? {};

    let searchQuery = db
      .select({
        item: procurementInventoryItemsTable,
        projectName: projectsTable.name,
      })
      .from(procurementInventoryItemsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, procurementInventoryItemsTable.projectId))
      .$dynamic();

    const conditions = [];

    if (query) {
      conditions.push(
        or(
          like(procurementInventoryItemsTable.itemName, `%${query}%`),
          like(procurementInventoryItemsTable.itemCode, `%${query}%`),
          like(procurementInventoryItemsTable.description, `%${query}%`)
        )!
      );
    }

    if (projectId) {
      conditions.push(eq(procurementInventoryItemsTable.projectId, Number(projectId)));
    }

    if (category) {
      conditions.push(eq(procurementInventoryItemsTable.category, String(category)));
    }

    if (conditions.length > 0) {
      searchQuery = searchQuery.where(and(...conditions));
    }

    const rows = await searchQuery
      .orderBy(procurementInventoryItemsTable.itemName)
      .limit(50);

    res.json(
      rows.map((r) => ({
        ...fInventoryItem(r.item),
        projectName: r.projectName,
      }))
    );
  } catch (error) {
    console.error("Error searching inventory:", error);
    res.status(500).json({ error: "Failed to search inventory" });
  }
});

export default router;
