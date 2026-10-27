import { Router, type IRouter, type Request, type Response } from "express";
import { db, dailyProgressReportsTable, projectsTable, usersTable, sitePhotosTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

// Helper to parse equipment into a clean array of strings
function parseEquipment(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => (typeof item === "string" ? item.split(",") : String(item).split(",")))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.flatMap((item) => String(item).split(",")).map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      // not JSON, fall through to split by comma
    }
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

// Helper to parse manpower breakdown
function parseManpower(raw: any): Record<string, number> | null {
  if (!raw) return null;
  let obj: any = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof obj !== "object" || obj === null) return null;

  // Clean and filter only numeric values
  const result: Record<string, number> = {};
  let hasValid = false;
  for (const [key, val] of Object.entries(obj)) {
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      result[key] = num;
      if (num > 0) hasValid = true;
    }
  }
  return hasValid ? result : null;
}

// Helper to normalize photos array
function parsePhotos(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((p) => {
      if (typeof p === "string") {
        return { url: p, title: "Site Photo", category: "progress" };
      }
      return p;
    });
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsePhotos(parsed);
    } catch {
      return [{ url: raw, title: "Site Photo", category: "progress" }];
    }
  }
  return [];
}

// GET /api/daily-progress-reports - List Daily Progress Reports with Project Name & Photos
router.get("/daily-progress-reports", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, search, status, date } = req.query;

    const query = db
      .select({
        id: dailyProgressReportsTable.id,
        projectId: dailyProgressReportsTable.projectId,
        projectName: projectsTable.name,
        reportDate: dailyProgressReportsTable.reportDate,
        weather: dailyProgressReportsTable.weather,
        shift: dailyProgressReportsTable.shift,
        workSummary: dailyProgressReportsTable.workSummary,
        workLocation: dailyProgressReportsTable.workLocation,
        materialsConsumed: dailyProgressReportsTable.materialsConsumed,
        manpowerCount: dailyProgressReportsTable.manpowerCount,
        manpowerBreakdown: dailyProgressReportsTable.manpowerBreakdown,
        equipment: dailyProgressReportsTable.equipment,
        photos: dailyProgressReportsTable.photos,
        siteIssues: dailyProgressReportsTable.siteIssues,
        status: dailyProgressReportsTable.status,
        createdById: dailyProgressReportsTable.createdById,
        creatorName: usersTable.name,
        createdAt: dailyProgressReportsTable.createdAt,
        updatedAt: dailyProgressReportsTable.updatedAt,
      })
      .from(dailyProgressReportsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, dailyProgressReportsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, dailyProgressReportsTable.createdById));

    const conditions = [];
    if (projectId && projectId !== "all") {
      conditions.push(eq(dailyProgressReportsTable.projectId, Number(projectId)));
    }
    if (status && status !== "all") {
      conditions.push(eq(dailyProgressReportsTable.status, String(status)));
    }
    if (date) {
      conditions.push(eq(dailyProgressReportsTable.reportDate, String(date)));
    }

    let rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(dailyProgressReportsTable.reportDate), desc(dailyProgressReportsTable.id))
      : await query.orderBy(desc(dailyProgressReportsTable.reportDate), desc(dailyProgressReportsTable.id));

    // Also fetch any photos linked via site_photos table with dpr_id
    const dprIds = rows.map((r) => r.id);
    let linkedPhotosMap = new Map<number, any[]>();
    if (dprIds.length > 0) {
      const sitePhotos = await db
        .select()
        .from(sitePhotosTable)
        .where(inArray(sitePhotosTable.dprId, dprIds));
      
      sitePhotos.forEach((sp) => {
        if (!sp.dprId) return;
        const list = linkedPhotosMap.get(sp.dprId) || [];
        list.push({
          id: sp.id,
          url: sp.imageUrl,
          title: sp.title,
          category: sp.category,
          location: sp.location,
          stage: sp.stage,
          capturedDate: sp.capturedDate,
        });
        linkedPhotosMap.set(sp.dprId, list);
      });
    }

    let formatted = rows.map((r) => {
      const manpower = parseManpower(r.manpowerBreakdown);
      const equipment = parseEquipment(r.equipment);
      
      // Merge direct DPR photos with linked site_photos
      const directPhotos = parsePhotos(r.photos);
      const linkedPhotos = linkedPhotosMap.get(r.id) || [];
      const combinedPhotos = [...directPhotos];
      linkedPhotos.forEach((lp) => {
        if (!combinedPhotos.some((cp) => cp.url === lp.url)) {
          combinedPhotos.push(lp);
        }
      });

      return {
        id: r.id,
        projectId: r.projectId,
        projectName: r.projectName ? r.projectName.trim() : `Project #${r.projectId}`,
        date: r.reportDate,
        reportDate: r.reportDate,
        weather: r.weather || "Sunny / Clear",
        shift: r.shift || "Day Shift",
        workSummary: r.workSummary || "",
        workLocation: r.workLocation || "",
        materialsConsumed: r.materialsConsumed || "",
        manpowerCount: r.manpowerCount != null ? Number(r.manpowerCount) : 0,
        manpower,
        manpowerBreakdown: manpower,
        equipment,
        photos: combinedPhotos,
        siteIssues: r.siteIssues || "",
        status: r.status || "Submitted to PM",
        createdById: r.createdById,
        creatorName: r.creatorName || "Site Engineer",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    if (search) {
      const q = String(search).toLowerCase();
      formatted = formatted.filter(
        (r) =>
          r.workSummary.toLowerCase().includes(q) ||
          r.workLocation.toLowerCase().includes(q) ||
          r.siteIssues.toLowerCase().includes(q) ||
          r.projectName.toLowerCase().includes(q)
      );
    }

    res.json(formatted);
  } catch (error: any) {
    console.error("Error fetching daily progress reports:", error);
    res.status(500).json({ error: "Failed to fetch daily progress reports" });
  }
});

// GET /api/daily-progress-reports/:id - Get single DPR
router.get("/daily-progress-reports/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({
        id: dailyProgressReportsTable.id,
        projectId: dailyProgressReportsTable.projectId,
        projectName: projectsTable.name,
        reportDate: dailyProgressReportsTable.reportDate,
        weather: dailyProgressReportsTable.weather,
        shift: dailyProgressReportsTable.shift,
        workSummary: dailyProgressReportsTable.workSummary,
        workLocation: dailyProgressReportsTable.workLocation,
        materialsConsumed: dailyProgressReportsTable.materialsConsumed,
        manpowerCount: dailyProgressReportsTable.manpowerCount,
        manpowerBreakdown: dailyProgressReportsTable.manpowerBreakdown,
        equipment: dailyProgressReportsTable.equipment,
        photos: dailyProgressReportsTable.photos,
        siteIssues: dailyProgressReportsTable.siteIssues,
        status: dailyProgressReportsTable.status,
        createdById: dailyProgressReportsTable.createdById,
        creatorName: usersTable.name,
        createdAt: dailyProgressReportsTable.createdAt,
        updatedAt: dailyProgressReportsTable.updatedAt,
      })
      .from(dailyProgressReportsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, dailyProgressReportsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, dailyProgressReportsTable.createdById))
      .where(eq(dailyProgressReportsTable.id, id))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Daily Progress Report not found" });
      return;
    }

    const linkedPhotos = await db
      .select()
      .from(sitePhotosTable)
      .where(eq(sitePhotosTable.dprId, id));

    const directPhotos = parsePhotos(row.photos);
    const combinedPhotos = [...directPhotos];
    linkedPhotos.forEach((lp) => {
      if (!combinedPhotos.some((cp) => cp.url === lp.imageUrl)) {
        combinedPhotos.push({
          id: lp.id,
          url: lp.imageUrl,
          title: lp.title,
          category: lp.category,
          location: lp.location,
          stage: lp.stage,
          capturedDate: lp.capturedDate,
        });
      }
    });

    res.json({
      ...row,
      date: row.reportDate,
      manpower: parseManpower(row.manpowerBreakdown),
      manpowerBreakdown: parseManpower(row.manpowerBreakdown),
      equipment: parseEquipment(row.equipment),
      photos: combinedPhotos,
    });
  } catch (error: any) {
    console.error("Error fetching DPR by id:", error);
    res.status(500).json({ error: "Failed to fetch DPR" });
  }
});

// POST /api/daily-progress-reports - Create a new Daily Progress Report (with Camera Photos)
router.post("/daily-progress-reports", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const body = req.body;

    if (!body.projectId || !body.workSummary) {
      res.status(400).json({ error: "Project and Work Execution Summary are required." });
      return;
    }

    const projectId = Number(body.projectId);
    const reportDate = String(body.reportDate || body.date || new Date().toISOString().split("T")[0]).trim();
    const weather = body.weather ? String(body.weather).trim() : "Sunny / Clear";
    const shift = body.shift ? String(body.shift).trim() : "Day Shift";
    const workSummary = String(body.workSummary).trim();
    const workLocation = body.workLocation ? String(body.workLocation).trim() : null;
    const materialsConsumed = body.materialsConsumed ? String(body.materialsConsumed).trim() : null;
    const manpowerCount = body.manpowerCount !== undefined && body.manpowerCount !== "" ? Number(body.manpowerCount) : 0;
    const siteIssues = body.siteIssues ? String(body.siteIssues).trim() : "";
    const status = body.status ? String(body.status).trim() : "Submitted to PM";

    // Manpower & Equipment
    const manpowerBreakdown = parseManpower(body.manpowerBreakdown || body.manpower);
    const equipment = parseEquipment(body.equipment || body.equipmentNotes);

    // Photos (from camera or file upload)
    const photos = parsePhotos(body.photos);

    const [result] = await db.insert(dailyProgressReportsTable).values({
      projectId,
      reportDate,
      weather,
      shift,
      workSummary,
      workLocation,
      materialsConsumed,
      manpowerCount,
      manpowerBreakdown: manpowerBreakdown || null,
      equipment,
      photos,
      siteIssues,
      status,
      createdById: me.id || 17,
    });

    const newId = Number(result.insertId);

    // Also auto-sync each attached photo into the site_photos table with dprId
    if (photos.length > 0) {
      for (const p of photos) {
        if (!p.url) continue;
        try {
          await db.insert(sitePhotosTable).values({
            projectId,
            capturedDate: p.capturedDate || reportDate,
            title: p.title || `DPR Work Photo - ${reportDate}`,
            category: p.category || "progress",
            imageUrl: p.url,
            location: p.location || workLocation,
            latitude: p.latitude !== undefined && p.latitude !== null && p.latitude !== "" ? Number(p.latitude) : null,
            longitude: p.longitude !== undefined && p.longitude !== null && p.longitude !== "" ? Number(p.longitude) : null,
            gpsAccuracy: p.gpsAccuracy !== undefined && p.gpsAccuracy !== null && p.gpsAccuracy !== "" ? Number(p.gpsAccuracy) : null,
            geotagAddress: p.geotagAddress ? String(p.geotagAddress) : null,
            description: p.description || p.caption || workSummary.slice(0, 150),
            stage: p.stage || "Civil & Execution",
            dprId: newId,
            createdById: me.id || 17,
          });
        } catch (photoErr) {
          console.warn("Could not mirror photo to site_photos:", photoErr);
        }
      }
    }

    // Fetch created record
    const [row] = await db
      .select({
        id: dailyProgressReportsTable.id,
        projectId: dailyProgressReportsTable.projectId,
        projectName: projectsTable.name,
        reportDate: dailyProgressReportsTable.reportDate,
        weather: dailyProgressReportsTable.weather,
        shift: dailyProgressReportsTable.shift,
        workSummary: dailyProgressReportsTable.workSummary,
        workLocation: dailyProgressReportsTable.workLocation,
        materialsConsumed: dailyProgressReportsTable.materialsConsumed,
        manpowerCount: dailyProgressReportsTable.manpowerCount,
        manpowerBreakdown: dailyProgressReportsTable.manpowerBreakdown,
        equipment: dailyProgressReportsTable.equipment,
        photos: dailyProgressReportsTable.photos,
        siteIssues: dailyProgressReportsTable.siteIssues,
        status: dailyProgressReportsTable.status,
        createdById: dailyProgressReportsTable.createdById,
        createdAt: dailyProgressReportsTable.createdAt,
      })
      .from(dailyProgressReportsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, dailyProgressReportsTable.projectId))
      .where(eq(dailyProgressReportsTable.id, newId))
      .limit(1);

    res.status(201).json({
      ...row,
      date: row.reportDate,
      manpower: parseManpower(row.manpowerBreakdown),
      manpowerBreakdown: parseManpower(row.manpowerBreakdown),
      equipment: parseEquipment(row.equipment),
      photos: parsePhotos(row.photos),
    });
  } catch (error: any) {
    console.error("Error creating daily progress report:", error);
    res.status(500).json({ error: "Failed to create daily progress report" });
  }
});

// PUT /api/daily-progress-reports/:id - Edit an existing DPR
router.put("/daily-progress-reports/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const me = await getCurrentUser(req);

    const updateData: any = {};
    if (body.reportDate || body.date) updateData.reportDate = String(body.reportDate || body.date).trim();
    if (body.weather) updateData.weather = String(body.weather).trim();
    if (body.shift) updateData.shift = String(body.shift).trim();
    if (body.workSummary) updateData.workSummary = String(body.workSummary).trim();
    if (body.workLocation !== undefined) updateData.workLocation = body.workLocation ? String(body.workLocation).trim() : null;
    if (body.materialsConsumed !== undefined) updateData.materialsConsumed = body.materialsConsumed ? String(body.materialsConsumed).trim() : null;
    if (body.manpowerCount !== undefined) updateData.manpowerCount = Number(body.manpowerCount);
    if (body.manpowerBreakdown || body.manpower) updateData.manpowerBreakdown = parseManpower(body.manpowerBreakdown || body.manpower);
    if (body.equipment || body.equipmentNotes) updateData.equipment = parseEquipment(body.equipment || body.equipmentNotes);
    if (body.siteIssues !== undefined) updateData.siteIssues = body.siteIssues ? String(body.siteIssues).trim() : "";
    if (body.status) updateData.status = String(body.status).trim();
    if (body.photos !== undefined) updateData.photos = parsePhotos(body.photos);

    await db.update(dailyProgressReportsTable).set(updateData).where(eq(dailyProgressReportsTable.id, id));

    // If new photos were passed, mirror any not already in site_photos
    if (Array.isArray(body.photos)) {
      const existingSitePhotos = await db.select({ url: sitePhotosTable.imageUrl }).from(sitePhotosTable).where(eq(sitePhotosTable.dprId, id));
      const existingUrls = new Set(existingSitePhotos.map((p) => p.url));

      for (const p of parsePhotos(body.photos)) {
        if (!p.url || existingUrls.has(p.url)) continue;
        try {
          await db.insert(sitePhotosTable).values({
            projectId: Number(body.projectId || 19),
            capturedDate: p.capturedDate || body.reportDate || new Date().toISOString().split("T")[0],
            title: p.title || `DPR Work Photo #${id}`,
            category: p.category || "progress",
            imageUrl: p.url,
            location: p.location || body.workLocation,
            description: p.description || p.caption || "Attached via DPR update",
            stage: p.stage || "Civil & Execution",
            dprId: id,
            createdById: me.id || 17,
          });
        } catch (photoErr) {
          console.warn("Could not insert site photo on DPR update:", photoErr);
        }
      }
    }

    const [updated] = await db
      .select({
        id: dailyProgressReportsTable.id,
        projectId: dailyProgressReportsTable.projectId,
        projectName: projectsTable.name,
        reportDate: dailyProgressReportsTable.reportDate,
        weather: dailyProgressReportsTable.weather,
        shift: dailyProgressReportsTable.shift,
        workSummary: dailyProgressReportsTable.workSummary,
        workLocation: dailyProgressReportsTable.workLocation,
        materialsConsumed: dailyProgressReportsTable.materialsConsumed,
        manpowerCount: dailyProgressReportsTable.manpowerCount,
        manpowerBreakdown: dailyProgressReportsTable.manpowerBreakdown,
        equipment: dailyProgressReportsTable.equipment,
        photos: dailyProgressReportsTable.photos,
        siteIssues: dailyProgressReportsTable.siteIssues,
        status: dailyProgressReportsTable.status,
        createdById: dailyProgressReportsTable.createdById,
        createdAt: dailyProgressReportsTable.createdAt,
      })
      .from(dailyProgressReportsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, dailyProgressReportsTable.projectId))
      .where(eq(dailyProgressReportsTable.id, id))
      .limit(1);

    res.json({
      ...updated,
      date: updated.reportDate,
      manpower: parseManpower(updated.manpowerBreakdown),
      equipment: parseEquipment(updated.equipment),
      photos: parsePhotos(updated.photos),
    });
  } catch (error: any) {
    console.error("Error updating daily progress report:", error);
    res.status(500).json({ error: "Failed to update daily progress report" });
  }
});

// POST /api/daily-progress-reports/:id/photos - Attach new camera photo(s) to a DPR
router.post("/daily-progress-reports/:id/photos", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const photoObj = (body.photo && typeof body.photo === "object") ? body.photo : {};
    const photoUrl = body.photoUrl || body.url || photoObj.url || photoObj.imageUrl;
    const title = body.title || photoObj.title;
    const location = body.location || photoObj.location;
    const category = body.category || photoObj.category;
    const stage = body.stage || photoObj.stage;
    const caption = body.caption || photoObj.caption || photoObj.description;
    const me = await getCurrentUser(req);

    if (!photoUrl) {
      res.status(400).json({ error: "photoUrl is required" });
      return;
    }

    const [dpr] = await db
      .select()
      .from(dailyProgressReportsTable)
      .where(eq(dailyProgressReportsTable.id, id))
      .limit(1);

    if (!dpr) {
      res.status(404).json({ error: "DPR not found" });
      return;
    }

    const currentPhotos = parsePhotos(dpr.photos);
    const latitude = req.body.latitude !== undefined && req.body.latitude !== null && req.body.latitude !== "" ? Number(req.body.latitude) : null;
    const longitude = req.body.longitude !== undefined && req.body.longitude !== null && req.body.longitude !== "" ? Number(req.body.longitude) : null;
    const gpsAccuracy = req.body.gpsAccuracy !== undefined && req.body.gpsAccuracy !== null && req.body.gpsAccuracy !== "" ? Number(req.body.gpsAccuracy) : null;
    const geotagAddress = req.body.geotagAddress ? String(req.body.geotagAddress) : null;

    const newPhoto = {
      url: photoUrl,
      title: title || `Work Photo — ${dpr.reportDate}`,
      location: location || dpr.workLocation || "",
      category: category || "progress",
      stage: stage || "Civil & Execution",
      caption: caption || "",
      latitude,
      longitude,
      gpsAccuracy,
      geotagAddress,
      capturedDate: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
    };

    currentPhotos.push(newPhoto);

    await db
      .update(dailyProgressReportsTable)
      .set({ photos: currentPhotos })
      .where(eq(dailyProgressReportsTable.id, id));

    // Also insert to site_photos table
    try {
      await db.insert(sitePhotosTable).values({
        projectId: dpr.projectId,
        capturedDate: newPhoto.capturedDate,
        title: newPhoto.title,
        category: newPhoto.category,
        imageUrl: photoUrl,
        location: newPhoto.location,
        latitude,
        longitude,
        gpsAccuracy,
        geotagAddress,
        description: newPhoto.caption || "Captured via DPR Camera Tool",
        stage: newPhoto.stage,
        dprId: id,
        createdById: me.id || 17,
      });
    } catch (spErr) {
      console.warn("Could not insert to site_photos:", spErr);
    }

    res.status(201).json({
      success: true,
      dprId: id,
      photo: newPhoto,
      totalPhotos: currentPhotos.length,
      photos: currentPhotos,
    });
  } catch (error: any) {
    console.error("Error attaching photo to DPR:", error);
    res.status(500).json({ error: "Failed to attach photo to DPR" });
  }
});

// PATCH /api/daily-progress-reports/:id/status - Update approval status
router.patch("/daily-progress-reports/:id/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    await db
      .update(dailyProgressReportsTable)
      .set({ status: String(status) })
      .where(eq(dailyProgressReportsTable.id, id));

    res.json({ success: true, id, status });
  } catch (error: any) {
    console.error("Error updating DPR status:", error);
    res.status(500).json({ error: "Failed to update DPR status" });
  }
});

// DELETE /api/daily-progress-reports/:id - Delete a report
router.delete("/daily-progress-reports/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await db.delete(dailyProgressReportsTable).where(eq(dailyProgressReportsTable.id, id));
    res.json({ success: true, message: "Daily progress report deleted" });
  } catch (error: any) {
    console.error("Error deleting daily progress report:", error);
    res.status(500).json({ error: "Failed to delete daily progress report" });
  }
});

export default router;
