import { Router, type IRouter, type Request, type Response } from "express";
import { db, companySettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

// GET /api/company-settings - Retrieve company branding and banking settings
router.get("/company-settings", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [settings] = await db.select().from(companySettingsTable).limit(1);
    if (!settings) {
      res.json({
        id: 1,
        companyName: "Kanak Turnkey Solutions Pvt. Ltd.",
        address: "Tower 4, Level 8, Cyber City, BKC",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400051",
        currency: "INR",
        gstNumber: "27AABCK1234F1Z5",
        panNumber: "AABCK1234F",
        phone: "+91 22 4590 1200",
        email: "finance@kanak.in",
        website: "https://kanakturnkey.com",
        logoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=200&auto=format&fit=crop&q=80",
        bankName: "HDFC Bank Ltd",
        accountNumber: "50200088921820",
        ifscCode: "HDFC0000060",
        branchName: "BKC Main Branch, Mumbai",
        authorizedSignatory: "Vikram Shah",
        signatoryTitle: "Head of Finance & Accounts",
        invoiceTerms: "1. Payment due within 15 days of invoice date.\n2. Overdue payments subject to 1.5% interest per month.\n3. Please quote invoice number on all remittances.",
        invoiceFooter: "Thank you for partnering with Kanak Turnkey Solutions. Certified ISO 9001:2015 Turnkey Contractor.",
      });
      return;
    }
    res.json(settings);
  } catch (error: any) {
    console.error("Error fetching company settings:", error);
    res.status(500).json({ error: "Failed to fetch company settings" });
  }
});

// PUT /api/company-settings - Update company branding, bank details, and invoice template
router.put("/company-settings", async (req: Request, res: Response): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    // Only admin or accountant can update company settings
    if (!me.roles.includes("admin") && !me.roles.includes("accountant")) {
      res.status(403).json({ error: "Only Admin or Finance/Accountant can modify company settings" });
      return;
    }

    const b = req.body ?? {};
    const updates: Record<string, any> = {
      companyName: b.companyName ?? "Kanak Turnkey Solutions Pvt. Ltd.",
      address: b.address ?? null,
      city: b.city ?? null,
      state: b.state ?? null,
      country: b.country ?? "India",
      pincode: b.pincode ?? null,
      currency: b.currency ?? "INR",
      gstNumber: b.gstNumber ?? null,
      panNumber: b.panNumber ?? null,
      phone: b.phone ?? null,
      email: b.email ?? null,
      website: b.website ?? null,
      logoUrl: b.logoUrl ?? null,
      bankName: b.bankName ?? null,
      accountNumber: b.accountNumber ?? null,
      ifscCode: b.ifscCode ?? null,
      branchName: b.branchName ?? null,
      authorizedSignatory: b.authorizedSignatory ?? null,
      signatoryTitle: b.signatoryTitle ?? null,
      invoiceTerms: b.invoiceTerms ?? null,
      invoiceFooter: b.invoiceFooter ?? null,
    };

    const [existing] = await db.select().from(companySettingsTable).limit(1);
    if (existing) {
      await db.update(companySettingsTable).set(updates).where(eq(companySettingsTable.id, existing.id));
    } else {
      await db.insert(companySettingsTable).values(updates);
    }

    const [saved] = await db.select().from(companySettingsTable).limit(1);
    res.json(saved);
  } catch (error: any) {
    console.error("Error updating company settings:", error);
    res.status(500).json({ error: "Failed to update company settings" });
  }
});

export default router;
