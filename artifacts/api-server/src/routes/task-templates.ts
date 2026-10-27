import { Router } from "express";
import { db, taskTemplatesTable, taskTemplateItemsTable, tasksTable } from "@workspace/db";
import { eq, sql, asc } from "drizzle-orm";
import { getCurrentUser } from "../lib/session";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const router = Router();

// ── Seed realistic construction templates on first access ─────────────────────
const SEED_TEMPLATES: Array<{
  name: string;
  description: string;
  projectType: string;
  isDefault: boolean;
  items: Array<{ title: string; phase: string; priority: string; estimatedDays: number; description?: string }>;
}> = [
  {
    name: "Residential Construction — Standard",
    description: "Full lifecycle checklist for villa, apartment, and bungalow projects",
    projectType: "Residential",
    isDefault: true,
    items: [
      // Initiation
      { phase: "Initiation", title: "Obtain building plan approval from local authority", priority: "high", estimatedDays: 30 },
      { phase: "Initiation", title: "Soil investigation / geotechnical report", priority: "high", estimatedDays: 7 },
      { phase: "Initiation", title: "Utility connections application (power, water, sewer)", priority: "medium", estimatedDays: 14 },
      { phase: "Initiation", title: "Mobilise site office and temporary facilities", priority: "medium", estimatedDays: 5 },
      // Design
      { phase: "Design", title: "Architectural working drawings sign-off", priority: "high", estimatedDays: 21 },
      { phase: "Design", title: "Structural design and drawings by licensed engineer", priority: "high", estimatedDays: 14 },
      { phase: "Design", title: "MEP (plumbing, electrical, HVAC) drawings", priority: "medium", estimatedDays: 14 },
      { phase: "Design", title: "Interior design & finishes schedule", priority: "low", estimatedDays: 10 },
      // Procurement
      { phase: "Procurement", title: "Material take-off and BOQ finalisation", priority: "high", estimatedDays: 7 },
      { phase: "Procurement", title: "Vendor short-listing and RFQ for structural steel / cement", priority: "high", estimatedDays: 7 },
      { phase: "Procurement", title: "Purchase orders for long-lead items (lifts, windows, tiles)", priority: "high", estimatedDays: 5 },
      { phase: "Procurement", title: "Subcontractor selection — civil, MEP, finishing", priority: "medium", estimatedDays: 10 },
      // Civil Works
      { phase: "Civil Works", title: "Site clearing, grading, and levelling", priority: "high", estimatedDays: 7 },
      { phase: "Civil Works", title: "Foundation excavation and PCC", priority: "high", estimatedDays: 10 },
      { phase: "Civil Works", title: "Foundation concrete (raft / isolated footings)", priority: "high", estimatedDays: 14 },
      { phase: "Civil Works", title: "Ground floor slab and columns", priority: "high", estimatedDays: 21 },
      { phase: "Civil Works", title: "Superstructure — floor-by-floor slab, beams, columns", priority: "high", estimatedDays: 60 },
      { phase: "Civil Works", title: "Brick masonry and block work", priority: "medium", estimatedDays: 21 },
      { phase: "Civil Works", title: "Roof slab and waterproofing", priority: "high", estimatedDays: 14 },
      // Finishing
      { phase: "Finishing", title: "Internal and external plastering", priority: "medium", estimatedDays: 21 },
      { phase: "Finishing", title: "Flooring — tiles / marble / vitrified", priority: "medium", estimatedDays: 14 },
      { phase: "Finishing", title: "Painting — internal primer + two coats", priority: "medium", estimatedDays: 14 },
      { phase: "Finishing", title: "Doors, windows, and glazing installation", priority: "medium", estimatedDays: 10 },
      { phase: "Finishing", title: "Kitchen and bathroom fixtures", priority: "medium", estimatedDays: 7 },
      { phase: "Finishing", title: "External facade / elevation cladding", priority: "low", estimatedDays: 14 },
      // MEP
      { phase: "MEP", title: "Electrical conduit, wiring, and DB installation", priority: "high", estimatedDays: 21 },
      { phase: "MEP", title: "Plumbing rough-in (supply and drainage)", priority: "high", estimatedDays: 14 },
      { phase: "MEP", title: "HVAC ducting and equipment installation", priority: "medium", estimatedDays: 14 },
      { phase: "MEP", title: "Fire alarm and detection system", priority: "high", estimatedDays: 7 },
      // QC & Handover
      { phase: "QC & Handover", title: "Structural inspection and third-party audit", priority: "high", estimatedDays: 5 },
      { phase: "QC & Handover", title: "MEP testing and commissioning", priority: "high", estimatedDays: 7 },
      { phase: "QC & Handover", title: "Punch list walkthrough with client", priority: "high", estimatedDays: 3 },
      { phase: "QC & Handover", title: "Resolve all punch list items", priority: "high", estimatedDays: 14 },
      { phase: "QC & Handover", title: "Occupation certificate from local authority", priority: "high", estimatedDays: 30 },
      { phase: "QC & Handover", title: "Handover documentation — as-built drawings, warranties", priority: "medium", estimatedDays: 5 },
      { phase: "QC & Handover", title: "Final client sign-off and possession", priority: "high", estimatedDays: 1 },
    ],
  },
  {
    name: "Commercial Build-out — Office / Retail",
    description: "Fit-out and build-out for commercial office, retail, and hospitality spaces",
    projectType: "Commercial",
    isDefault: false,
    items: [
      { phase: "Initiation", title: "Lease / ownership document verification", priority: "high", estimatedDays: 5 },
      { phase: "Initiation", title: "Space planning and programming brief", priority: "high", estimatedDays: 7 },
      { phase: "Initiation", title: "Fire NOC and building department approvals", priority: "high", estimatedDays: 21 },
      { phase: "Design", title: "Concept design and client approval", priority: "high", estimatedDays: 14 },
      { phase: "Design", title: "Detailed construction drawings (architectural + structural)", priority: "high", estimatedDays: 21 },
      { phase: "Design", title: "Lighting and power layout design", priority: "medium", estimatedDays: 10 },
      { phase: "Design", title: "HVAC zoning design and equipment schedule", priority: "medium", estimatedDays: 10 },
      { phase: "Procurement", title: "Furniture, fixtures & equipment (FF&E) procurement", priority: "medium", estimatedDays: 45 },
      { phase: "Procurement", title: "Specialty items — signage, branding elements", priority: "low", estimatedDays: 30 },
      { phase: "Procurement", title: "Subcontractor mobilisation — civil, MEP, AV", priority: "high", estimatedDays: 7 },
      { phase: "Civil & Structure", title: "Demolition of existing partitions / false ceiling", priority: "high", estimatedDays: 7 },
      { phase: "Civil & Structure", title: "New partition walls (drywall / glass)", priority: "medium", estimatedDays: 14 },
      { phase: "Civil & Structure", title: "False ceiling — grid / gypsum / speciality", priority: "medium", estimatedDays: 14 },
      { phase: "Civil & Structure", title: "Raised access flooring (if required)", priority: "low", estimatedDays: 7 },
      { phase: "MEP", title: "Electrical distribution — DB, MCBs, outlets", priority: "high", estimatedDays: 14 },
      { phase: "MEP", title: "Data and networking cabling infrastructure", priority: "high", estimatedDays: 10 },
      { phase: "MEP", title: "HVAC installation, testing, and balancing", priority: "high", estimatedDays: 14 },
      { phase: "MEP", title: "Sprinkler and fire suppression system", priority: "high", estimatedDays: 10 },
      { phase: "MEP", title: "CCTV, access control, and security systems", priority: "medium", estimatedDays: 7 },
      { phase: "Finishing", title: "Flooring — carpet, vinyl, or stone", priority: "medium", estimatedDays: 10 },
      { phase: "Finishing", title: "Painting and wall finishes", priority: "medium", estimatedDays: 10 },
      { phase: "Finishing", title: "Glazed partitions and doors installation", priority: "medium", estimatedDays: 7 },
      { phase: "Finishing", title: "FF&E installation and placement", priority: "medium", estimatedDays: 7 },
      { phase: "QC & Handover", title: "Snagging and defect rectification", priority: "high", estimatedDays: 7 },
      { phase: "QC & Handover", title: "Systems commissioning and user training", priority: "high", estimatedDays: 5 },
      { phase: "QC & Handover", title: "Final client walkthrough and acceptance", priority: "high", estimatedDays: 2 },
    ],
  },
  {
    name: "MEP Installation Works",
    description: "Mechanical, Electrical & Plumbing works for standalone or retrofit projects",
    projectType: "MEP",
    isDefault: false,
    items: [
      { phase: "Engineering", title: "Site survey and load calculation", priority: "high", estimatedDays: 5 },
      { phase: "Engineering", title: "Detailed MEP engineering drawings", priority: "high", estimatedDays: 14 },
      { phase: "Engineering", title: "Material specifications and equipment selection", priority: "high", estimatedDays: 7 },
      { phase: "Procurement", title: "Long-lead equipment procurement (panels, chillers, pumps)", priority: "high", estimatedDays: 30 },
      { phase: "Procurement", title: "Cable, conduit, and piping materials", priority: "high", estimatedDays: 14 },
      { phase: "Electrical", title: "Main LT panel and distribution boards installation", priority: "high", estimatedDays: 10 },
      { phase: "Electrical", title: "Cable tray and conduit routing", priority: "high", estimatedDays: 14 },
      { phase: "Electrical", title: "Power and lighting wiring", priority: "high", estimatedDays: 14 },
      { phase: "Electrical", title: "Earthing and lightning protection", priority: "high", estimatedDays: 7 },
      { phase: "Electrical", title: "Emergency power (DG set / UPS) installation", priority: "medium", estimatedDays: 7 },
      { phase: "Plumbing", title: "Water supply piping (GI/CPVC/PPR)", priority: "high", estimatedDays: 14 },
      { phase: "Plumbing", title: "Sanitary drainage and vent piping", priority: "high", estimatedDays: 14 },
      { phase: "Plumbing", title: "Water treatment plant / STP if applicable", priority: "medium", estimatedDays: 21 },
      { phase: "HVAC", title: "Chiller plant or VRF outdoor units installation", priority: "high", estimatedDays: 7 },
      { phase: "HVAC", title: "AHU / FCU installation and ducting", priority: "high", estimatedDays: 14 },
      { phase: "HVAC", title: "Refrigerant piping and insulation", priority: "high", estimatedDays: 7 },
      { phase: "Fire Protection", title: "Sprinkler main line and branch piping", priority: "high", estimatedDays: 14 },
      { phase: "Fire Protection", title: "Fire alarm panel, detectors, and hooters", priority: "high", estimatedDays: 7 },
      { phase: "Fire Protection", title: "Hydrant and hose reel installation", priority: "high", estimatedDays: 7 },
      { phase: "Commissioning", title: "Electrical testing — IR test, earth fault, load test", priority: "high", estimatedDays: 5 },
      { phase: "Commissioning", title: "Plumbing pressure test and flushing", priority: "high", estimatedDays: 3 },
      { phase: "Commissioning", title: "HVAC commissioning, balancing, and TAB report", priority: "high", estimatedDays: 7 },
      { phase: "Commissioning", title: "Fire system final acceptance test with authority", priority: "high", estimatedDays: 5 },
      { phase: "Commissioning", title: "As-built drawings and O&M manuals handover", priority: "medium", estimatedDays: 7 },
    ],
  },
  {
    name: "Industrial / EPC Project",
    description: "Engineering, Procurement & Construction for factories, warehouses, and plants",
    projectType: "Industrial",
    isDefault: false,
    items: [
      { phase: "Engineering", title: "Process flow diagram (PFD) and P&ID finalization", priority: "high", estimatedDays: 21 },
      { phase: "Engineering", title: "Civil / structural design for foundation and structure", priority: "high", estimatedDays: 21 },
      { phase: "Engineering", title: "Equipment layout and vendor selection", priority: "high", estimatedDays: 14 },
      { phase: "Engineering", title: "Statutory approvals — factory, pollution board, fire", priority: "high", estimatedDays: 60 },
      { phase: "Procurement", title: "Long-lead equipment — reactors, compressors, boilers", priority: "high", estimatedDays: 90 },
      { phase: "Procurement", title: "Structural steel and pre-engineered building (PEB)", priority: "high", estimatedDays: 45 },
      { phase: "Procurement", title: "Electrical MV/LV panels, transformers, DGs", priority: "high", estimatedDays: 60 },
      { phase: "Procurement", title: "Piping materials — CS, SS, GI as per P&ID", priority: "high", estimatedDays: 30 },
      { phase: "Civil Construction", title: "Site clearing, cut & fill, and drainage", priority: "high", estimatedDays: 14 },
      { phase: "Civil Construction", title: "Equipment foundations and anchor bolts", priority: "high", estimatedDays: 21 },
      { phase: "Civil Construction", title: "RCC structure — columns, beams, slabs", priority: "high", estimatedDays: 45 },
      { phase: "Civil Construction", title: "PEB erection and secondary structural members", priority: "high", estimatedDays: 21 },
      { phase: "Civil Construction", title: "Roads, hardstand, and external civil works", priority: "medium", estimatedDays: 21 },
      { phase: "Mechanical", title: "Major equipment erection and alignment", priority: "high", estimatedDays: 30 },
      { phase: "Mechanical", title: "Process piping fabrication and erection", priority: "high", estimatedDays: 30 },
      { phase: "Mechanical", title: "Insulation of hot / cold lines", priority: "medium", estimatedDays: 14 },
      { phase: "Electrical & Instrumentation", title: "HT / LT cable laying and termination", priority: "high", estimatedDays: 21 },
      { phase: "Electrical & Instrumentation", title: "Instrument installation and loop checking", priority: "high", estimatedDays: 21 },
      { phase: "Electrical & Instrumentation", title: "Control room and DCS / SCADA commissioning", priority: "high", estimatedDays: 14 },
      { phase: "Pre-commissioning", title: "Mechanical completion punch list clearance", priority: "high", estimatedDays: 14 },
      { phase: "Pre-commissioning", title: "Piping leak test, flushing, and blowing", priority: "high", estimatedDays: 7 },
      { phase: "Pre-commissioning", title: "Electrical continuity and protection relay tests", priority: "high", estimatedDays: 7 },
      { phase: "Commissioning", title: "Trial runs — individual equipment", priority: "high", estimatedDays: 14 },
      { phase: "Commissioning", title: "Integrated system run and performance guarantee test", priority: "high", estimatedDays: 30 },
      { phase: "Commissioning", title: "Operator training and documentation handover", priority: "high", estimatedDays: 7 },
      { phase: "Commissioning", title: "Final acceptance certificate and defect liability period start", priority: "high", estimatedDays: 1 },
    ],
  },
];

let seeded = false;

async function seedTemplatesIfEmpty() {
  if (seeded) return;
  const existing = await db.select({ id: taskTemplatesTable.id }).from(taskTemplatesTable).limit(1);
  if (existing.length > 0) { seeded = true; return; }

  for (const tpl of SEED_TEMPLATES) {
    // MySQL doesn't support .returning() - insert then query
    await db.insert(taskTemplatesTable).values({
      name: tpl.name,
      description: tpl.description,
      projectType: tpl.projectType,
      isDefault: tpl.isDefault,
    });
    
    // Query to get the inserted record
    const [inserted] = await db
      .select({ id: taskTemplatesTable.id })
      .from(taskTemplatesTable)
      .where(eq(taskTemplatesTable.name, tpl.name))
      .limit(1);
    
    if (!inserted) continue;
    const items = tpl.items.map((item, i) => ({
      templateId: inserted.id,
      title: item.title,
      description: item.description ?? null,
      phase: item.phase,
      priority: item.priority,
      estimatedDays: item.estimatedDays,
      sortOrder: i,
    }));
    if (items.length > 0) {
      await db.insert(taskTemplateItemsTable).values(items);
    }
  }
  seeded = true;
}

// GET /task-templates
router.get("/task-templates", async (req, res) => {
  await seedTemplatesIfEmpty();
  const rows = await db
    .select({
      id: taskTemplatesTable.id,
      name: taskTemplatesTable.name,
      description: taskTemplatesTable.description,
      projectType: taskTemplatesTable.projectType,
      isDefault: taskTemplatesTable.isDefault,
      createdById: taskTemplatesTable.createdById,
      createdAt: taskTemplatesTable.createdAt,
      itemCount: sql<number>`count(${taskTemplateItemsTable.id})`,
    })
    .from(taskTemplatesTable)
    .leftJoin(taskTemplateItemsTable, eq(taskTemplateItemsTable.templateId, taskTemplatesTable.id))
    .groupBy(taskTemplatesTable.id)
    .orderBy(taskTemplatesTable.id);
  res.json(rows);
});

// POST /task-templates
router.post("/task-templates", async (req, res) => {
  const { name, description, projectType, isDefault } = req.body;
  const user = (req as any).user;
  await db.insert(taskTemplatesTable).values({
    name,
    description: description ?? null,
    projectType: projectType ?? null,
    isDefault: isDefault ?? false,
    createdById: user?.id ?? null,
  });
  
  // MySQL doesn't support .returning() - query after insert
  const [row] = await db
    .select()
    .from(taskTemplatesTable)
    .where(eq(taskTemplatesTable.name, name))
    .orderBy(sql`${taskTemplatesTable.id} DESC`)
    .limit(1);
  
  res.status(201).json({ ...row, itemCount: 0 });
});

// GET /task-templates/:id
router.get("/task-templates/:id", async (req, res) => {
  await seedTemplatesIfEmpty();
  const id = parseInt(req.params.id!);
  const [tpl] = await db
    .select({
      id: taskTemplatesTable.id,
      name: taskTemplatesTable.name,
      description: taskTemplatesTable.description,
      projectType: taskTemplatesTable.projectType,
      isDefault: taskTemplatesTable.isDefault,
      createdById: taskTemplatesTable.createdById,
      createdAt: taskTemplatesTable.createdAt,
      itemCount: sql<number>`count(${taskTemplateItemsTable.id})`,
    })
    .from(taskTemplatesTable)
    .leftJoin(taskTemplateItemsTable, eq(taskTemplateItemsTable.templateId, taskTemplatesTable.id))
    .where(eq(taskTemplatesTable.id, id))
    .groupBy(taskTemplatesTable.id);

  if (!tpl) return res.status(404).json({ error: "Not found" });

  const items = await db
    .select()
    .from(taskTemplateItemsTable)
    .where(eq(taskTemplateItemsTable.templateId, id))
    .orderBy(asc(taskTemplateItemsTable.sortOrder));

  res.json({ ...tpl, items });
});

// PATCH /task-templates/:id
router.patch("/task-templates/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const { name, description, projectType, isDefault } = req.body;
  await db.update(taskTemplatesTable)
    .set({ name, description, projectType, isDefault })
    .where(eq(taskTemplatesTable.id, id));
  
  // MySQL doesn't support .returning() - query after update
  const [row] = await db
    .select()
    .from(taskTemplatesTable)
    .where(eq(taskTemplatesTable.id, id))
    .limit(1);
  
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json({ ...row, itemCount: 0 });
});

// DELETE /task-templates/:id
router.delete("/task-templates/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  await db.delete(taskTemplateItemsTable).where(eq(taskTemplateItemsTable.templateId, id));
  await db.delete(taskTemplatesTable).where(eq(taskTemplatesTable.id, id));
  res.status(204).end();
});

// POST /task-templates/:id/items
router.post("/task-templates/:id/items", async (req, res) => {
  const templateId = parseInt(req.params.id!);
  const { title, description, phase, priority, estimatedDays, sortOrder } = req.body;
  await db.insert(taskTemplateItemsTable).values({
    templateId,
    title,
    description: description ?? null,
    phase: phase ?? null,
    priority: priority ?? "medium",
    estimatedDays: estimatedDays ?? null,
    sortOrder: sortOrder ?? 0,
  });
  
  // MySQL doesn't support .returning() - query after insert
  const [row] = await db
    .select()
    .from(taskTemplateItemsTable)
    .where(eq(taskTemplateItemsTable.templateId, templateId))
    .orderBy(sql`${taskTemplateItemsTable.id} DESC`)
    .limit(1);
  
  res.status(201).json(row);
});

// PATCH /task-templates/:id/items/:itemId
router.patch("/task-templates/:id/items/:itemId", async (req, res) => {
  const itemId = parseInt(req.params.itemId!);
  const { title, description, phase, priority, estimatedDays, sortOrder } = req.body;
  await db.update(taskTemplateItemsTable)
    .set({ title, description, phase, priority, estimatedDays, sortOrder })
    .where(eq(taskTemplateItemsTable.id, itemId));
  
  // MySQL doesn't support .returning() - query after update
  const [row] = await db
    .select()
    .from(taskTemplateItemsTable)
    .where(eq(taskTemplateItemsTable.id, itemId))
    .limit(1);
  
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

// DELETE /task-templates/:id/items/:itemId
router.delete("/task-templates/:id/items/:itemId", async (req, res) => {
  const itemId = parseInt(req.params.itemId!);
  await db.delete(taskTemplateItemsTable).where(eq(taskTemplateItemsTable.id, itemId));
  res.status(204).end();
});

// Deduplicate tasks across projects
export async function deduplicateTasks(projectId?: number): Promise<number> {
  try {
    const allTasks = projectId
      ? await db.select().from(tasksTable).where(eq(tasksTable.projectId, projectId))
      : await db.select().from(tasksTable);

    const seen = new Map<string, typeof allTasks[0]>();
    const toDelete: number[] = [];

    for (const t of allTasks) {
      const key = `${t.projectId}___${t.title.trim().toLowerCase()}`;
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        if (existing.status === "todo" && t.status !== "todo") {
          toDelete.push(existing.id);
          seen.set(key, t);
        } else {
          toDelete.push(t.id);
        }
      } else {
        seen.set(key, t);
      }
    }

    for (const id of toDelete) {
      await db.delete(tasksTable).where(eq(tasksTable.id, id));
    }

    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} duplicate tasks from database.`);
    }
    return toDelete.length;
  } catch (err) {
    console.error("Error during task deduplication:", err);
    return 0;
  }
}

// Run deduplication on startup
deduplicateTasks().catch(console.error);

// POST /tasks/deduplicate
router.post("/tasks/deduplicate", async (req, res) => {
  const { projectId } = req.body ?? {};
  const removed = await deduplicateTasks(projectId ? Number(projectId) : undefined);
  res.json({ removedCount: removed });
});

// POST /task-templates/:id/apply & POST /task-templates/:id
const handleApplyTemplate = async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id!);
    const { projectId, startDate } = req.body ?? {};
    const me = await getCurrentUser(req);

    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    // Deduplicate any existing duplicates first
    await deduplicateTasks(Number(projectId));

    const items = await db
      .select()
      .from(taskTemplateItemsTable)
      .where(eq(taskTemplateItemsTable.templateId, templateId))
      .orderBy(asc(taskTemplateItemsTable.sortOrder));

    if (items.length === 0) return res.json({ tasksCreated: 0 });

    // Check existing tasks for this project
    const existingTasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.projectId, Number(projectId)));
    const existingTitles = new Set(existingTasks.map(t => t.title.trim().toLowerCase()));

    // Filter out items that are already present
    const itemsToInsert = items.filter(item => !existingTitles.has(item.title.trim().toLowerCase()));

    if (itemsToInsert.length === 0) {
      return res.json({ tasksCreated: 0, message: "All tasks from this template already exist in the project." });
    }

    let cursor = startDate ? new Date(startDate) : new Date();
    const toInsert = itemsToInsert.map(item => {
      const taskStart = formatDate(cursor);
      const days = item.estimatedDays ?? 7;
      const taskEnd = formatDate(addDays(cursor, days));
      cursor = addDays(cursor, days);
      return {
        projectId: Number(projectId),
        title: item.title,
        description: item.phase ? `[${item.phase}] ${item.description ?? ""}`.trim() : (item.description ?? null),
        priority: (item.priority as "high" | "medium" | "low") || "medium",
        status: "todo" as const,
        progress: 0,
        startDate: taskStart,
        endDate: taskEnd,
        createdById: me?.id ?? 1,
      };
    });

    await db.insert(tasksTable).values(toInsert);
    res.json({ tasksCreated: toInsert.length });
  } catch (error) {
    console.error("Error applying task template:", error);
    res.status(500).json({ error: "Failed to apply task template" });
  }
};

router.post("/task-templates/:id/apply", handleApplyTemplate);
router.post("/task-templates/:id", handleApplyTemplate);

export default router;
