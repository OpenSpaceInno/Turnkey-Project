import { Router, type IRouter } from "express";
import { eq, desc, and, sql, lt } from "drizzle-orm";
import {
  db,
  purchaseOrdersTable,
  procurementPurchaseOrdersTable,
  procurementPurchaseOrderItemsTable,
  procurementVendorQuotesTable,
  procurementVendorQuoteItemsTable,
  procurementRfqsTable,
  procurementMaterialRequestsTable,
  procurementVendorFollowUpsTable,
  procurementNotificationsTable,
  vendorsTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { numKeys } from "../lib/transforms";
import { getCurrentUser } from "../lib/session";
import { generateNumber } from "../lib/numbers";
import { numberToWordsINR } from "../lib/document-extractor";

const router: IRouter = Router();

// Transform numeric fields
const fPO = (r: Record<string, unknown>) =>
  numKeys(r, [
    "rfqId",
    "quoteId",
    "materialRequestId",
    "projectId",
    "vendorId",
    "subtotal",
    "taxAmount",
    "shippingCost",
    "totalAmount",
    "createdById",
    "approvedById",
    "followUpCount",
  ]);

const fPOItem = (r: Record<string, unknown>) =>
  numKeys(r, [
    "poId",
    "quantity",
    "unitPrice",
    "totalPrice",
    "receivedQuantity",
    "acceptedQuantity",
    "rejectedQuantity",
  ]);

// ═══════════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS - List & Get
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/purchase-orders - List all purchase orders
router.get("/", async (req, res): Promise<void> => {
  try {
    const { projectId, vendorId, status, deliveryStatus } = req.query;

    let query = db
      .select({
        po: procurementPurchaseOrdersTable,
        vendorName: vendorsTable.name,
        projectName: projectsTable.name,
        createdByName: usersTable.name,
      })
      .from(procurementPurchaseOrdersTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementPurchaseOrdersTable.vendorId))
      .leftJoin(projectsTable, eq(projectsTable.id, procurementPurchaseOrdersTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, procurementPurchaseOrdersTable.createdById))
      .$dynamic();

    const conditions = [];
    if (projectId) {
      conditions.push(eq(procurementPurchaseOrdersTable.projectId, Number(projectId)));
    }
    if (vendorId) {
      conditions.push(eq(procurementPurchaseOrdersTable.vendorId, Number(vendorId)));
    }
    if (status) {
      conditions.push(eq(procurementPurchaseOrdersTable.status, String(status)));
    }
    if (deliveryStatus) {
      conditions.push(eq(procurementPurchaseOrdersTable.deliveryStatus, String(deliveryStatus)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(procurementPurchaseOrdersTable.createdAt));

    // Also fetch standard purchase_orders to provide a unified list
    let legacyQuery = db
      .select({
        po: purchaseOrdersTable,
        vendorName: vendorsTable.name,
        projectName: projectsTable.name,
        createdByName: usersTable.name,
      })
      .from(purchaseOrdersTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, purchaseOrdersTable.vendorId))
      .leftJoin(projectsTable, eq(projectsTable.id, purchaseOrdersTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, purchaseOrdersTable.createdById))
      .$dynamic();

    const legacyConditions = [];
    if (projectId) {
      legacyConditions.push(eq(purchaseOrdersTable.projectId, Number(projectId)));
    }
    if (vendorId) {
      legacyConditions.push(eq(purchaseOrdersTable.vendorId, Number(vendorId)));
    }
    if (status) {
      legacyConditions.push(eq(purchaseOrdersTable.status, String(status)));
    }

    if (legacyConditions.length > 0) {
      legacyQuery = legacyQuery.where(and(...legacyConditions));
    }

    const legacyRows = await legacyQuery.orderBy(desc(purchaseOrdersTable.createdAt));

    const procPoNumbers = new Set(rows.map((r) => r.po.poNumber));

    const formattedProcRows = rows.map((r) => ({
      ...fPO(r.po),
      vendorName: r.vendorName,
      projectName: r.projectName,
      createdByName: r.createdByName,
    }));

    const formattedLegacyRows = legacyRows
      .filter((r) => !procPoNumbers.has(r.po.poNumber))
      .map((r) => {
        const p = r.po;
        const total = Number(p.totalAmount) || 0;
        const isDelivered = p.status === "delivered" || p.status === "completed";
        const isAck = ["acknowledged", "in_transit", "delivered", "inspected", "completed"].includes(p.status);
        const delStatus = p.status === "in_transit" ? "in_transit" : (isDelivered ? "delivered" : "pending");

        return {
          id: p.id,
          poNumber: p.poNumber,
          rfqId: null,
          quoteId: null,
          materialRequestId: null,
          projectId: p.projectId,
          vendorId: p.vendorId,
          poDate: p.createdAt,
          expectedDeliveryDate: p.deliveryDate || p.createdAt,
          actualDeliveryDate: isDelivered ? p.updatedAt : null,
          subtotal: total,
          taxAmount: 0,
          shippingCost: 0,
          totalAmount: total,
          deliveryTerms: "Standard Delivery",
          paymentTerms: "Net 30",
          status: p.status,
          isAcknowledged: isAck,
          acknowledgmentDate: isAck ? p.updatedAt : null,
          acknowledgmentNotes: null,
          deliveryStatus: delStatus,
          trackingNumber: null,
          followUpCount: 0,
          lastFollowUpDate: null,
          createdById: p.createdById,
          approvedById: null,
          notes: p.description,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          vendorName: r.vendorName,
          projectName: r.projectName,
          createdByName: r.createdByName,
        };
      });

    const combined = [...formattedProcRows, ...formattedLegacyRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(combined);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PURCHASE ORDER PDF GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function escHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtCurrency(val: any): string {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function fmtDate(val: any): string {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(val);
  }
}

interface GeneratePoPdfOptions {
  po: any;
  items: any[];
  vendor: {
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    category?: string;
  };
  projectName?: string;
  projectLocation?: string;
  clientName?: string;
  createdByName?: string;
  approvedByName?: string;
  rfqNumber?: string;
  materialRequestNumber?: string;
  autoPrint?: boolean;
}

function generatePoPdfHtml(opts: GeneratePoPdfOptions): string {
  const {
    po,
    items,
    vendor,
    projectName,
    projectLocation,
    clientName,
    createdByName,
    approvedByName,
    rfqNumber,
    materialRequestNumber,
    autoPrint = false,
  } = opts;

  const totalItems = items.length;
  const subtotal = Number(po.subtotal) || items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
  const taxAmount = Number(po.taxAmount) || 0;
  const shippingCost = Number(po.shippingCost) || 0;
  const totalAmount = Number(po.totalAmount) || (subtotal + taxAmount + shippingCost);
  const amountWords = numberToWordsINR(totalAmount);

  // Status badge styling
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
    issued: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    approved: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    acknowledged: { bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
    in_transit: { bg: "#fefce8", text: "#a16207", border: "#fde047" },
    delivered: { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" },
    completed: { bg: "#ecfdf5", text: "#065f46", border: "#6ee7b7" },
    cancelled: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  };

  const statusKey = (po.status || "issued").toLowerCase();
  const statusStyle = statusColors[statusKey] || statusColors.issued;

  const rowsHtml = items.map((it, idx) => {
    const qty = Number(it.quantity) || 0;
    const unitPrice = Number(it.unitPrice) || 0;
    const lineTotal = Number(it.totalPrice) || (qty * unitPrice);

    return `
      <tr>
        <td style="text-align: center; font-weight: 500; color: #64748b;">${idx + 1}</td>
        <td>
          <div style="font-weight: 600; color: #0f172a; font-size: 11.5px;">${escHtml(it.itemName)}</div>
          ${it.specification ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px; line-height: 1.35;">${escHtml(it.specification)}</div>` : ""}
        </td>
        <td style="text-align: center; color: #475569; font-size: 11px;">${escHtml(it.unit || "unit")}</td>
        <td style="text-align: right; font-weight: 600; font-size: 11px; color: #1e293b;">${qty.toLocaleString("en-IN")}</td>
        <td style="text-align: right; font-family: monospace; font-size: 11px; color: #334155;">${fmtCurrency(unitPrice)}</td>
        <td style="text-align: right; font-weight: 700; font-family: monospace; font-size: 11.5px; color: #0f172a;">${fmtCurrency(lineTotal)}</td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Order ${escHtml(po.poNumber)} - Kanak TurnKey Projects</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background-color: #f8fafc;
      font-size: 11px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }

    .no-print {
      position: sticky;
      top: 0;
      z-index: 999;
      background: #0f172a;
      color: #fff;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .no-print .action-title {
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .no-print .btn-group {
      display: flex;
      gap: 10px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: #2563eb;
      color: #fff;
      border-color: #1d4ed8;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #334155;
      color: #f8fafc;
      border-color: #475569;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    .po-sheet {
      width: 100%;
      max-width: 880px;
      margin: 20px auto;
      background: #ffffff;
      padding: 28px 34px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
    }

    /* Header / Corporate Letterhead */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }

    .header-logo-cell {
      vertical-align: top;
      width: 58%;
    }

    .header-meta-cell {
      vertical-align: top;
      width: 42%;
      text-align: right;
    }

    .company-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
      margin-bottom: 2px;
      text-transform: uppercase;
    }

    .company-tagline {
      font-size: 10px;
      font-weight: 600;
      color: #d97706;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .company-address {
      font-size: 9.5px;
      color: #475569;
      line-height: 1.35;
      margin-bottom: 2px;
    }

    .company-statutory {
      font-size: 9px;
      color: #64748b;
      line-height: 1.35;
    }

    .doc-badge {
      display: inline-block;
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .po-num-badge {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
      font-family: monospace;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #ffffff;
    }

    .info-card-header {
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding-bottom: 5px;
      margin-bottom: 7px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
    }

    .field-row {
      display: flex;
      font-size: 10px;
      margin-bottom: 3.5px;
      line-height: 1.35;
    }

    .field-label {
      width: 105px;
      font-weight: 600;
      color: #64748b;
      flex-shrink: 0;
    }

    .field-value {
      font-weight: 500;
      color: #1e293b;
      flex-grow: 1;
    }

    .field-value.strong {
      font-weight: 700;
      color: #0f172a;
    }

    .highlight-date {
      color: #b45309;
      font-weight: 700;
    }

    /* Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border: 1px solid #cbd5e1;
    }

    .data-table thead th {
      background: #0f172a;
      color: #f8fafc;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 6px 8px;
      border: 1px solid #0f172a;
    }

    .data-table tbody td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    .data-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Financials & Words */
    .summary-wrap {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    .words-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #fafafa;
    }

    .words-box-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    .words-content {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      font-style: italic;
      line-height: 1.4;
    }

    .notes-box {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
      font-size: 9.5px;
      color: #475569;
    }

    .fin-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    .fin-table td {
      padding: 5px 8px;
      font-size: 10px;
      border-bottom: 1px solid #e2e8f0;
    }

    .fin-table tr:last-child td {
      border-bottom: none;
      background: #0f172a;
      color: #ffffff;
      font-size: 11.5px;
      font-weight: 800;
      padding: 7px 8px;
    }

    .fin-label {
      color: #475569;
      font-weight: 600;
    }

    .fin-val {
      text-align: right;
      font-family: monospace;
      font-weight: 600;
      color: #0f172a;
    }

    .fin-table tr:last-child .fin-label,
    .fin-table tr:last-child .fin-val {
      color: #ffffff;
    }

    /* Terms */
    .terms-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      background: #f8fafc;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .terms-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    .terms-list {
      padding-left: 14px;
      font-size: 8.5px;
      color: #475569;
      line-height: 1.4;
    }

    .terms-list li {
      margin-bottom: 2px;
    }

    /* Sign-off */
    .sign-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 8px 0;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }

    .sign-box {
      width: 25%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #fafafa;
      padding: 8px 6px;
      text-align: center;
      height: 70px;
      vertical-align: bottom;
    }

    .sign-name {
      font-size: 9.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .sign-role {
      font-size: 8.5px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-top: 1px dashed #cbd5e1;
      padding-top: 3px;
    }

    .footer-note {
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      margin-top: 6px;
    }

    /* Print media overrides */
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }

    @media print {
      body {
        background: #ffffff !important;
        font-size: 10px;
      }
      .no-print {
        display: none !important;
      }
      .po-sheet {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
      .page-break-avoid {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <div class="action-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <span>Purchase Order Document: <strong>${escHtml(po.poNumber)}</strong></span>
    </div>
    <div class="btn-group">
      <button onclick="window.print()" class="btn btn-primary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Print / Save PDF
      </button>
      <button onclick="window.close()" class="btn btn-secondary">
        Close
      </button>
    </div>
  </div>

  <div class="po-sheet">

    <!-- Header Letterhead -->
    <table class="header-table">
      <tr>
        <td class="header-logo-cell">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <div style="width: 38px; height: 38px; border-radius: 8px; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); display: flex; align-items: center; justify-content: center; color: #f59e0b; font-weight: 900; font-size: 16px; border: 1.5px solid #d97706;">
              KT
            </div>
            <div>
              <div class="company-title">KANAK TURNKEY PROJECTS PVT. LTD.</div>
              <div class="company-tagline">Engineering &bull; Procurement &bull; Construction Management</div>
            </div>
          </div>
          <div class="company-address">
            Regd. Office: Plot 42, Udyog Vihar, Phase IV, Gurugram, Haryana - 122016<br>
            Phone: +91 124 456 7890 &bull; Email: procurement@kanakturnkey.com &bull; Web: www.kanakturnkey.com
          </div>
          <div class="company-statutory">
            CIN: U45200HR2018PTC074521 &bull; GSTIN: 06AAACK2489R1ZM &bull; PAN: AAACK2489R &bull; ISO 9001:2015
          </div>
        </td>
        <td class="header-meta-cell">
          <div class="doc-badge">PURCHASE ORDER</div>
          <br>
          <div class="po-num-badge">${escHtml(po.poNumber)}</div>
          <br>
          <div style="font-size: 10px; color: #475569; margin-bottom: 4px;">
            <strong>PO Date:</strong> ${fmtDate(po.poDate || po.createdAt)}
          </div>
          <span class="status-badge" style="background-color: ${statusStyle.bg}; color: ${statusStyle.text}; border-color: ${statusStyle.border};">
            ${escHtml((po.status || "ISSUED").toUpperCase())}
          </span>
        </td>
      </tr>
    </table>

    <!-- Two-Column Information Cards -->
    <div class="info-grid">
      <!-- Vendor Card -->
      <div class="info-card">
        <div class="info-card-header">
          <span>Supplier / Vendor (Issued To)</span>
          <span style="color: #64748b;">Vendor ID: #${escHtml(po.vendorId || "—")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Company Name:</span>
          <span class="field-value strong">${escHtml(vendor.name || "Vendor Partner")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Contact Person:</span>
          <span class="field-value">${escHtml(vendor.contactPerson || "Sales & Accounts Department")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Email Address:</span>
          <span class="field-value">${escHtml(vendor.email || "accounts@vendor.com")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Contact Phone:</span>
          <span class="field-value">${escHtml(vendor.phone || "—")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Office Address:</span>
          <span class="field-value">${escHtml(vendor.address || "Registered Vendor Commercial Address")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Trade Category:</span>
          <span class="field-value">${escHtml(vendor.category || "Building Materials & Contracting")}</span>
        </div>
      </div>

      <!-- Shipping & Order Terms Card -->
      <div class="info-card">
        <div class="info-card-header">
          <span>Ship To / Site & Commercial Terms</span>
          <span style="color: #0284c7;">Direct Site Consignment</span>
        </div>
        <div class="field-row">
          <span class="field-label">Project:</span>
          <span class="field-value strong">${escHtml(projectName || "Kanak Turnkey Project")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Site / Delivery To:</span>
          <span class="field-value">${escHtml(projectLocation || "Project Construction Site")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Client / Owner:</span>
          <span class="field-value">${escHtml(clientName || "Turnkey Client")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Delivery Date:</span>
          <span class="field-value highlight-date">${fmtDate(po.expectedDeliveryDate)}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Delivery Terms:</span>
          <span class="field-value">${escHtml(po.deliveryTerms || "F.O.R Project Site (Freight Included)")}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Payment Terms:</span>
          <span class="field-value">${escHtml(po.paymentTerms || "Net 30 Days from MRN / QC Acceptance")}</span>
        </div>
        ${rfqNumber || materialRequestNumber ? `
          <div class="field-row" style="margin-top: 3px; padding-top: 3px; border-top: 1px dashed #e2e8f0;">
            <span class="field-label">References:</span>
            <span class="field-value" style="font-size: 9px; color: #475569;">
              ${rfqNumber ? `RFQ: <strong>${escHtml(rfqNumber)}</strong> ` : ""}
              ${materialRequestNumber ? `| MR: <strong>${escHtml(materialRequestNumber)}</strong>` : ""}
            </span>
          </div>
        ` : ""}
      </div>
    </div>

    <!-- Items Table -->
    <div style="margin-bottom: 5px; display: flex; justify-content: space-between; align-items: baseline;">
      <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
        Itemized Scope of Supply & Bill of Quantities (${totalItems} ${totalItems === 1 ? "Line Item" : "Line Items"})
      </div>
      <div style="font-size: 9.5px; color: #64748b;">Currency: Indian Rupees (INR ₹)</div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 32px; text-align: center;">#</th>
          <th>Item Description & Technical Specifications</th>
          <th style="width: 55px; text-align: center;">Unit</th>
          <th style="width: 75px; text-align: right;">Quantity</th>
          <th style="width: 95px; text-align: right;">Unit Rate (₹)</th>
          <th style="width: 105px; text-align: right;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || `<tr><td colspan="6" style="text-align: center; padding: 18px; color: #64748b;">No line items detailed on this purchase order.</td></tr>`}
      </tbody>
    </table>

    <!-- Financial Breakdown & Words -->
    <div class="summary-wrap page-break-avoid">
      <div class="words-box">
        <div class="words-box-title">Amount Chargeable in Words (INR):</div>
        <div class="words-content">${escHtml(amountWords)}</div>
        ${po.notes ? `
          <div class="notes-box">
            <strong>Order Notes / Special Instructions:</strong><br>
            ${escHtml(po.notes)}
          </div>
        ` : `
          <div class="notes-box">
            <strong>Dispatch Instructions:</strong> All consignments must include copy of this PO, triplicate tax invoice, manufacturer test certificate (MTC), and valid GST E-Way Bill.
          </div>
        `}
      </div>

      <div>
        <table class="fin-table">
          <tr>
            <td class="fin-label">Subtotal (Excl. Tax):</td>
            <td class="fin-val">${fmtCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td class="fin-label">Applicable GST / Taxes:</td>
            <td class="fin-val">${fmtCurrency(taxAmount)}</td>
          </tr>
          <tr>
            <td class="fin-label">Freight & Transit Insurance:</td>
            <td class="fin-val">${shippingCost > 0 ? fmtCurrency(shippingCost) : "Included"}</td>
          </tr>
          <tr>
            <td class="fin-label">GRAND TOTAL (INR):</td>
            <td class="fin-val">${fmtCurrency(totalAmount)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Commercial Terms & Conditions -->
    <div class="terms-box">
      <div class="terms-title">Standard Purchase Terms & Commercial Conditions</div>
      <ol class="terms-list">
        <li><strong>Order Acceptance:</strong> Acceptance of this PO must be confirmed within 48 hours. Dispatch of goods constitutes unconditional acceptance of all terms stated herein.</li>
        <li><strong>Delivery & Time Essence:</strong> Time is the essence of this contract. Delivery must be executed on or before the committed date. Liquidated damages @ 0.5% per week of delay (maximum 5% of order value) will apply to delayed dispatches.</li>
        <li><strong>Quality & Inspection:</strong> All goods are subject to inspection and quality acceptance by Kanak TurnKey Site Quality In-charge upon receipt at project site. Defective or non-compliant materials will be rejected and replaced at supplier's sole expense.</li>
        <li><strong>Statutory & Tax Compliance:</strong> Supplier warrants compliance with GST regulations and timely upload of invoices to the GST portal (GSTR-1) to ensure eligible Input Tax Credit (ITC) flow to Kanak TurnKey Projects Pvt. Ltd.</li>
        <li><strong>Warranty & Defect Liability:</strong> Materials supplied shall carry a standard 12-month manufacturer defect warranty from the date of final site commissioning.</li>
        <li><strong>Payment Terms:</strong> Payment will be released strictly as per stated terms upon receipt of certified Material Receipt Note (MRN) and verification of original invoice.</li>
        <li><strong>Jurisdiction:</strong> Any dispute arising out of or in connection with this purchase order shall be subject to the exclusive jurisdiction of courts at Gurugram, Haryana.</li>
      </ol>
    </div>

    <!-- 4 Statutory Signature Boxes -->
    <table class="sign-table">
      <tr>
        <td class="sign-box">
          <div class="sign-name">${escHtml(createdByName || "Procurement Officer")}</div>
          <div class="sign-role">Prepared By (Procurement)</div>
        </td>
        <td class="sign-box">
          <div class="sign-name">Project Manager / QS</div>
          <div class="sign-role">Verified By (Site Ops)</div>
        </td>
        <td class="sign-box">
          <div class="sign-name">${escHtml(approvedByName || "Authorised Signatory")}</div>
          <div class="sign-role">Authorised Signatory</div>
        </td>
        <td class="sign-box" style="border: 1.5px dashed #94a3b8; background: #ffffff;">
          <div class="sign-name" style="color: #94a3b8; font-style: italic;">Seal & Signature</div>
          <div class="sign-role">Vendor Acceptance</div>
        </td>
      </tr>
    </table>

    <div class="footer-note">
      This is a computer-generated, officially authorized Purchase Order issued by Kanak TurnKey Projects Pvt. Ltd.
    </div>

  </div>

  ${autoPrint ? `<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 400); });</script>` : ""}
</body>
</html>`;
}

// GET /api/procurement/purchase-orders/:id/export-pdf - Export PO to Print-ready PDF Document
router.get("/:id/export-pdf", async (req, res): Promise<void> => {
  try {
    const rawId = req.params.id as string;
    const id = parseInt(rawId, 10);
    const autoPrint = req.query.autoPrint === "true";

    let poRecord: any = null;

    if (!Number.isNaN(id)) {
      const [found] = await db
        .select({
          po: procurementPurchaseOrdersTable,
          vendorName: vendorsTable.name,
          vendorContactPerson: vendorsTable.contactPerson,
          vendorEmail: vendorsTable.email,
          vendorPhone: vendorsTable.phone,
          vendorAddress: vendorsTable.address,
          vendorCategory: vendorsTable.category,
          projectName: projectsTable.name,
          projectLocation: projectsTable.location,
          clientName: projectsTable.clientName,
          createdByName: usersTable.name,
          approvedByName: sql<string>`approved_by.name`.as("approvedByName"),
          rfqNumber: procurementRfqsTable.rfqNumber,
          materialRequestNumber: procurementMaterialRequestsTable.requestNumber,
        })
        .from(procurementPurchaseOrdersTable)
        .leftJoin(vendorsTable, eq(vendorsTable.id, procurementPurchaseOrdersTable.vendorId))
        .leftJoin(projectsTable, eq(projectsTable.id, procurementPurchaseOrdersTable.projectId))
        .leftJoin(usersTable, eq(usersTable.id, procurementPurchaseOrdersTable.createdById))
        .leftJoin(
          sql`users AS approved_by`,
          sql`approved_by.id = ${procurementPurchaseOrdersTable.approvedById}`
        )
        .leftJoin(procurementRfqsTable, eq(procurementRfqsTable.id, procurementPurchaseOrdersTable.rfqId))
        .leftJoin(
          procurementMaterialRequestsTable,
          eq(procurementMaterialRequestsTable.id, procurementPurchaseOrdersTable.materialRequestId)
        )
        .where(eq(procurementPurchaseOrdersTable.id, id));

      poRecord = found;
    }

    if (!poRecord && rawId) {
      const [foundByNumber] = await db
        .select({
          po: procurementPurchaseOrdersTable,
          vendorName: vendorsTable.name,
          vendorContactPerson: vendorsTable.contactPerson,
          vendorEmail: vendorsTable.email,
          vendorPhone: vendorsTable.phone,
          vendorAddress: vendorsTable.address,
          vendorCategory: vendorsTable.category,
          projectName: projectsTable.name,
          projectLocation: projectsTable.location,
          clientName: projectsTable.clientName,
          createdByName: usersTable.name,
          approvedByName: sql<string>`approved_by.name`.as("approvedByName"),
          rfqNumber: procurementRfqsTable.rfqNumber,
          materialRequestNumber: procurementMaterialRequestsTable.requestNumber,
        })
        .from(procurementPurchaseOrdersTable)
        .leftJoin(vendorsTable, eq(vendorsTable.id, procurementPurchaseOrdersTable.vendorId))
        .leftJoin(projectsTable, eq(projectsTable.id, procurementPurchaseOrdersTable.projectId))
        .leftJoin(usersTable, eq(usersTable.id, procurementPurchaseOrdersTable.createdById))
        .leftJoin(
          sql`users AS approved_by`,
          sql`approved_by.id = ${procurementPurchaseOrdersTable.approvedById}`
        )
        .leftJoin(procurementRfqsTable, eq(procurementRfqsTable.id, procurementPurchaseOrdersTable.rfqId))
        .leftJoin(
          procurementMaterialRequestsTable,
          eq(procurementMaterialRequestsTable.id, procurementPurchaseOrdersTable.materialRequestId)
        )
        .where(eq(procurementPurchaseOrdersTable.poNumber, rawId));

      poRecord = foundByNumber;
    }

    let items: any[] = [];

    if (poRecord) {
      items = await db
        .select()
        .from(procurementPurchaseOrderItemsTable)
        .where(eq(procurementPurchaseOrderItemsTable.poId, poRecord.po.id))
        .orderBy(procurementPurchaseOrderItemsTable.sortOrder);
    } else {
      // Fallback: Check standard purchase_orders table
      const [legacyPo] = await db
        .select({
          po: purchaseOrdersTable,
          vendorName: vendorsTable.name,
          vendorContactPerson: vendorsTable.contactPerson,
          vendorEmail: vendorsTable.email,
          vendorPhone: vendorsTable.phone,
          vendorAddress: vendorsTable.address,
          vendorCategory: vendorsTable.category,
          projectName: projectsTable.name,
          projectLocation: projectsTable.location,
          clientName: projectsTable.clientName,
          createdByName: usersTable.name,
        })
        .from(purchaseOrdersTable)
        .leftJoin(vendorsTable, eq(vendorsTable.id, purchaseOrdersTable.vendorId))
        .leftJoin(projectsTable, eq(projectsTable.id, purchaseOrdersTable.projectId))
        .leftJoin(usersTable, eq(usersTable.id, purchaseOrdersTable.createdById))
        .where(
          Number.isNaN(id)
            ? eq(purchaseOrdersTable.poNumber, rawId)
            : eq(purchaseOrdersTable.id, id)
        );

      if (!legacyPo) {
        res.status(404).send("Purchase order not found");
        return;
      }

      const p = legacyPo.po;
      const totalAmount = Number(p.totalAmount) || 0;

      poRecord = {
        po: {
          id: p.id,
          poNumber: p.poNumber,
          rfqId: null,
          quoteId: null,
          materialRequestId: null,
          projectId: p.projectId,
          vendorId: p.vendorId,
          poDate: p.createdAt,
          expectedDeliveryDate: p.deliveryDate || p.createdAt,
          actualDeliveryDate: null,
          subtotal: totalAmount,
          taxAmount: 0,
          shippingCost: 0,
          totalAmount: totalAmount,
          deliveryTerms: "F.O.R Project Site (Standard Delivery)",
          paymentTerms: "Net 30 Days",
          status: p.status,
          deliveryStatus: p.status === "in_transit" ? "in_transit" : (p.status === "delivered" ? "delivered" : "pending"),
          trackingNumber: null,
          notes: p.description,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
        vendorName: legacyPo.vendorName,
        vendorContactPerson: legacyPo.vendorContactPerson,
        vendorEmail: legacyPo.vendorEmail,
        vendorPhone: legacyPo.vendorPhone,
        vendorAddress: legacyPo.vendorAddress,
        vendorCategory: legacyPo.vendorCategory,
        projectName: legacyPo.projectName,
        projectLocation: legacyPo.projectLocation,
        clientName: legacyPo.clientName,
        createdByName: legacyPo.createdByName,
        approvedByName: null,
        rfqNumber: null,
        materialRequestNumber: null,
      };

      items = [
        {
          id: 1,
          poId: p.id,
          itemName: p.description || `Materials for PO ${p.poNumber}`,
          specification: "Standard procurement item as per contract",
          quantity: 1,
          unit: "lot",
          unitPrice: totalAmount,
          totalPrice: totalAmount,
        },
      ];
    }

    const html = generatePoPdfHtml({
      po: poRecord.po,
      items,
      vendor: {
        name: poRecord.vendorName,
        contactPerson: poRecord.vendorContactPerson,
        email: poRecord.vendorEmail,
        phone: poRecord.vendorPhone,
        address: poRecord.vendorAddress,
        category: poRecord.vendorCategory,
      },
      projectName: poRecord.projectName,
      projectLocation: poRecord.projectLocation,
      clientName: poRecord.clientName,
      createdByName: poRecord.createdByName,
      approvedByName: poRecord.approvedByName,
      rfqNumber: poRecord.rfqNumber,
      materialRequestNumber: poRecord.materialRequestNumber,
      autoPrint,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error generating Purchase Order PDF:", error);
    res.status(500).send("Failed to generate Purchase Order PDF");
  }
});

// GET /api/procurement/purchase-orders/:id - Get single PO with items
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const rawId = req.params.id as string;
    const id = parseInt(rawId, 10);

    let po: any = null;

    if (!Number.isNaN(id)) {
      const [found] = await db
        .select({
          po: procurementPurchaseOrdersTable,
          vendorName: vendorsTable.name,
          vendorEmail: vendorsTable.email,
          vendorPhone: vendorsTable.phone,
          projectName: projectsTable.name,
          createdByName: usersTable.name,
          approvedByName: sql<string>`approved_by.name`.as("approvedByName"),
          rfqNumber: procurementRfqsTable.rfqNumber,
          materialRequestNumber: procurementMaterialRequestsTable.requestNumber,
        })
        .from(procurementPurchaseOrdersTable)
        .leftJoin(vendorsTable, eq(vendorsTable.id, procurementPurchaseOrdersTable.vendorId))
        .leftJoin(projectsTable, eq(projectsTable.id, procurementPurchaseOrdersTable.projectId))
        .leftJoin(usersTable, eq(usersTable.id, procurementPurchaseOrdersTable.createdById))
        .leftJoin(
          sql`users AS approved_by`,
          sql`approved_by.id = ${procurementPurchaseOrdersTable.approvedById}`
        )
        .leftJoin(procurementRfqsTable, eq(procurementRfqsTable.id, procurementPurchaseOrdersTable.rfqId))
        .leftJoin(
          procurementMaterialRequestsTable,
          eq(procurementMaterialRequestsTable.id, procurementPurchaseOrdersTable.materialRequestId)
        )
        .where(eq(procurementPurchaseOrdersTable.id, id));

      po = found;
    }

    if (!po && rawId) {
      // Try finding in procurementPurchaseOrdersTable by poNumber
      const [foundByNumber] = await db
        .select({
          po: procurementPurchaseOrdersTable,
          vendorName: vendorsTable.name,
          vendorEmail: vendorsTable.email,
          vendorPhone: vendorsTable.phone,
          projectName: projectsTable.name,
          createdByName: usersTable.name,
          approvedByName: sql<string>`approved_by.name`.as("approvedByName"),
          rfqNumber: procurementRfqsTable.rfqNumber,
          materialRequestNumber: procurementMaterialRequestsTable.requestNumber,
        })
        .from(procurementPurchaseOrdersTable)
        .leftJoin(vendorsTable, eq(vendorsTable.id, procurementPurchaseOrdersTable.vendorId))
        .leftJoin(projectsTable, eq(projectsTable.id, procurementPurchaseOrdersTable.projectId))
        .leftJoin(usersTable, eq(usersTable.id, procurementPurchaseOrdersTable.createdById))
        .leftJoin(
          sql`users AS approved_by`,
          sql`approved_by.id = ${procurementPurchaseOrdersTable.approvedById}`
        )
        .leftJoin(procurementRfqsTable, eq(procurementRfqsTable.id, procurementPurchaseOrdersTable.rfqId))
        .leftJoin(
          procurementMaterialRequestsTable,
          eq(procurementMaterialRequestsTable.id, procurementPurchaseOrdersTable.materialRequestId)
        )
        .where(eq(procurementPurchaseOrdersTable.poNumber, rawId));

      po = foundByNumber;
    }

    if (!po) {
      // Fallback: Check standard purchase_orders table by id or poNumber
      const [legacyPo] = await db
        .select({
          po: purchaseOrdersTable,
          vendorName: vendorsTable.name,
          vendorEmail: vendorsTable.email,
          vendorPhone: vendorsTable.phone,
          projectName: projectsTable.name,
          createdByName: usersTable.name,
        })
        .from(purchaseOrdersTable)
        .leftJoin(vendorsTable, eq(vendorsTable.id, purchaseOrdersTable.vendorId))
        .leftJoin(projectsTable, eq(projectsTable.id, purchaseOrdersTable.projectId))
        .leftJoin(usersTable, eq(usersTable.id, purchaseOrdersTable.createdById))
        .where(
          Number.isNaN(id)
            ? eq(purchaseOrdersTable.poNumber, rawId)
            : eq(purchaseOrdersTable.id, id)
        );

      if (!legacyPo) {
        res.status(404).json({ error: "Purchase order not found" });
        return;
      }

      const p = legacyPo.po;
      const totalAmount = Number(p.totalAmount) || 0;
      const isDelivered = p.status === "delivered" || p.status === "completed";
      const isInspected = p.status === "inspected" || p.status === "completed";
      const isAck = ["acknowledged", "in_transit", "delivered", "inspected", "completed"].includes(p.status);
      const deliveryStatus = p.status === "in_transit" ? "in_transit" : (isDelivered ? "delivered" : "pending");

      res.json({
        id: p.id,
        poNumber: p.poNumber,
        rfqId: null,
        quoteId: null,
        materialRequestId: null,
        projectId: p.projectId,
        vendorId: p.vendorId,
        poDate: p.createdAt,
        expectedDeliveryDate: p.deliveryDate || p.createdAt,
        actualDeliveryDate: isDelivered ? p.updatedAt : null,
        subtotal: totalAmount,
        taxAmount: 0,
        shippingCost: 0,
        totalAmount: totalAmount,
        deliveryTerms: "Standard Delivery",
        paymentTerms: "Net 30",
        status: p.status,
        isAcknowledged: isAck,
        acknowledgmentDate: isAck ? p.updatedAt : null,
        acknowledgmentNotes: null,
        deliveryStatus: deliveryStatus,
        trackingNumber: null,
        followUpCount: 0,
        lastFollowUpDate: null,
        createdById: p.createdById,
        approvedById: null,
        notes: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        vendorName: legacyPo.vendorName,
        vendorEmail: legacyPo.vendorEmail,
        vendorPhone: legacyPo.vendorPhone,
        projectName: legacyPo.projectName,
        createdByName: legacyPo.createdByName,
        approvedByName: null,
        rfqNumber: null,
        materialRequestNumber: null,
        items: [
          {
            id: 1,
            poId: p.id,
            itemName: p.description || `Materials for PO ${p.poNumber}`,
            description: p.description,
            specification: "Standard purchase order item",
            quantity: 1,
            unit: "lot",
            unitPrice: totalAmount,
            totalPrice: totalAmount,
            receivedQuantity: isDelivered ? 1 : 0,
            acceptedQuantity: isInspected ? 1 : 0,
            rejectedQuantity: 0,
            sortOrder: 0,
          },
        ],
      });
      return;
    }

    // Get items
    const items = await db
      .select()
      .from(procurementPurchaseOrderItemsTable)
      .where(eq(procurementPurchaseOrderItemsTable.poId, po.po.id))
      .orderBy(procurementPurchaseOrderItemsTable.sortOrder);

    res.json({
      ...fPO(po.po),
      vendorName: po.vendorName,
      vendorEmail: po.vendorEmail,
      vendorPhone: po.vendorPhone,
      projectName: po.projectName,
      createdByName: po.createdByName,
      approvedByName: po.approvedByName,
      rfqNumber: po.rfqNumber,
      materialRequestNumber: po.materialRequestNumber,
      items: items.map(fPOItem),
    });
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    res.status(500).json({ error: "Failed to fetch purchase order" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS - Create from Quote
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/purchase-orders - Create PO from selected quote or directly
router.post("/", async (req, res): Promise<void> => {
  try {
    const me = await getCurrentUser(req);
    const rawBody = req.body ?? {};
    const b = rawBody.data ? rawBody.data : rawBody;

    let rfqId: number | null = null;
    let quoteId: number | null = null;
    let materialRequestId: number | null = null;
    let projectId: number;
    let vendorId: number;
    let subtotal: string = "0";
    let taxAmount: string = "0";
    let shippingCost: string = "0";
    let totalAmount: string = "0";
    let deliveryTerms: string | null = null;
    let paymentTerms: string | null = null;

    if (b.quoteId) {
      // Get quote details
      const [quote] = await db
        .select({
          quote: procurementVendorQuotesTable,
          rfq: procurementRfqsTable,
        })
        .from(procurementVendorQuotesTable)
        .leftJoin(procurementRfqsTable, eq(procurementRfqsTable.id, procurementVendorQuotesTable.rfqId))
        .where(eq(procurementVendorQuotesTable.id, Number(b.quoteId)))
        .limit(1);

      if (!quote) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }

      if (!quote.quote.isSelected) {
        res.status(400).json({ error: "Can only create PO from selected quote" });
        return;
      }

      rfqId = quote.quote.rfqId;
      quoteId = Number(b.quoteId);
      materialRequestId = quote.rfq?.materialRequestId ?? null;
      projectId = quote.rfq!.projectId;
      vendorId = quote.quote.vendorId;
      subtotal = String(quote.quote.subtotal);
      taxAmount = String(quote.quote.taxAmount ?? "0");
      shippingCost = String(quote.quote.shippingCost ?? "0");
      totalAmount = String(quote.quote.totalAmount);
      deliveryTerms = quote.quote.deliveryTerms;
      paymentTerms = quote.quote.paymentTerms;
    } else {
      // Direct standalone PO creation
      if (!b.projectId || !b.vendorId) {
        res.status(400).json({ error: "Either quoteId, or both projectId and vendorId are required" });
        return;
      }
      projectId = Number(b.projectId);
      vendorId = Number(b.vendorId);
      totalAmount = String(b.totalAmount || "0");
      subtotal = String(b.totalAmount || "0");
    }

    // Format expected delivery date safely
    let targetDeliveryDate: string | null = null;
    const rawDeliveryDate = b.deliveryDate || b.expectedDeliveryDate;
    if (rawDeliveryDate) {
      targetDeliveryDate = typeof rawDeliveryDate === "string" && rawDeliveryDate.includes("T")
        ? rawDeliveryDate.split("T")[0]!
        : String(rawDeliveryDate);
    }

    // Generate PO number
    const poNumber = await generateNumber("PO", procurementPurchaseOrdersTable, "poNumber");

    // Create PO
    await db.insert(procurementPurchaseOrdersTable).values({
      poNumber,
      rfqId,
      quoteId,
      materialRequestId,
      projectId,
      vendorId,
      poDate: b.poDate ? (typeof b.poDate === "string" && b.poDate.includes("T") ? b.poDate.split("T")[0]! : String(b.poDate)) : new Date().toISOString().split("T")[0]!,
      expectedDeliveryDate: targetDeliveryDate,
      subtotal,
      taxAmount,
      shippingCost,
      totalAmount,
      deliveryTerms,
      paymentTerms,
      status: b.status || "draft",
      deliveryStatus: "pending",
      createdById: me.id,
      notes: b.description || b.notes || null,
    });

    // Get created PO
    const [po] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.poNumber, poNumber))
      .limit(1);

    // If created from quote, copy items and update RFQ status
    if (quoteId) {
      const quoteItems = await db
        .select()
        .from(procurementVendorQuoteItemsTable)
        .where(eq(procurementVendorQuoteItemsTable.quoteId, quoteId))
        .orderBy(procurementVendorQuoteItemsTable.sortOrder);

      if (quoteItems.length > 0) {
        const poItems = quoteItems.map((item, index) => ({
          poId: po!.id,
          itemName: item.itemName,
          description: null,
          specification: null,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          sortOrder: index,
        }));
        await db.insert(procurementPurchaseOrderItemsTable).values(poItems);
      }

      if (rfqId) {
        await db
          .update(procurementRfqsTable)
          .set({ status: "completed" })
          .where(eq(procurementRfqsTable.id, rfqId));
      }
    }

    // Get items for response
    const items = await db
      .select()
      .from(procurementPurchaseOrderItemsTable)
      .where(eq(procurementPurchaseOrderItemsTable.poId, po!.id))
      .orderBy(procurementPurchaseOrderItemsTable.sortOrder);

    res.status(201).json({
      ...fPO(po!),
      items: items.map(fPOItem),
    });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({ error: "Failed to create purchase order" });
  }
});

// PUT /api/procurement/purchase-orders/:id - Update PO
router.put("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const b = req.body ?? {};

    const [existingProc] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.id, id))
      .limit(1);

    if (existingProc) {
      const update: Record<string, unknown> = {};
      if (b.expectedDeliveryDate !== undefined) update.expectedDeliveryDate = b.expectedDeliveryDate;
      if (b.actualDeliveryDate !== undefined) update.actualDeliveryDate = b.actualDeliveryDate;
      if (b.deliveryTerms !== undefined) update.deliveryTerms = b.deliveryTerms;
      if (b.paymentTerms !== undefined) update.paymentTerms = b.paymentTerms;
      if (b.trackingNumber !== undefined) update.trackingNumber = b.trackingNumber;
      if (b.notes !== undefined) update.notes = b.notes;

      await db
        .update(procurementPurchaseOrdersTable)
        .set(update)
        .where(eq(procurementPurchaseOrdersTable.id, id));

      const [updated] = await db
        .select()
        .from(procurementPurchaseOrdersTable)
        .where(eq(procurementPurchaseOrdersTable.id, id))
        .limit(1);

      res.json(fPO(updated!));
      return;
    }

    // Fallback: update purchaseOrdersTable
    const [existingLegacy] = await db
      .select()
      .from(purchaseOrdersTable)
      .where(eq(purchaseOrdersTable.id, id))
      .limit(1);

    if (!existingLegacy) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }

    const legacyUpdate: Record<string, unknown> = {};
    if (b.expectedDeliveryDate !== undefined) legacyUpdate.deliveryDate = b.expectedDeliveryDate;
    if (b.notes !== undefined) legacyUpdate.description = b.notes;

    if (Object.keys(legacyUpdate).length > 0) {
      await db
        .update(purchaseOrdersTable)
        .set(legacyUpdate)
        .where(eq(purchaseOrdersTable.id, id));
    }

    const [updatedLegacy] = await db
      .select()
      .from(purchaseOrdersTable)
      .where(eq(purchaseOrdersTable.id, id))
      .limit(1);

    const total = Number(updatedLegacy!.totalAmount) || 0;
    res.json({
      id: updatedLegacy!.id,
      poNumber: updatedLegacy!.poNumber,
      totalAmount: total,
      status: updatedLegacy!.status,
      deliveryDate: updatedLegacy!.deliveryDate,
      description: updatedLegacy!.description,
    });
  } catch (error) {
    console.error("Error updating purchase order:", error);
    res.status(500).json({ error: "Failed to update purchase order" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Issue PO
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/purchase-orders/:id/issue - Issue PO to vendor
router.post("/:id/issue", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);

    const [procPo] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.id, id))
      .limit(1);

    if (procPo) {
      // Update status
      await db
        .update(procurementPurchaseOrdersTable)
        .set({
          status: "issued",
          approvedById: me.id,
        })
        .where(eq(procurementPurchaseOrdersTable.id, id));

      // Get PO details
      const [po] = await db
        .select({
          po: procurementPurchaseOrdersTable,
          vendorName: vendorsTable.name,
          vendorEmail: vendorsTable.email,
        })
        .from(procurementPurchaseOrdersTable)
        .leftJoin(vendorsTable, eq(vendorsTable.id, procurementPurchaseOrdersTable.vendorId))
        .where(eq(procurementPurchaseOrdersTable.id, id))
        .limit(1);

      res.json({
        ...fPO(po!.po),
        vendorName: po!.vendorName,
        vendorEmail: po!.vendorEmail,
        message: "Purchase order issued successfully",
      });
      return;
    }

    // Fallback: purchaseOrdersTable
    const [legacyPo] = await db
      .select({
        po: purchaseOrdersTable,
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
      })
      .from(purchaseOrdersTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, purchaseOrdersTable.vendorId))
      .where(eq(purchaseOrdersTable.id, id))
      .limit(1);

    if (!legacyPo) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }

    await db
      .update(purchaseOrdersTable)
      .set({ status: "issued" })
      .where(eq(purchaseOrdersTable.id, id));

    res.json({
      id: legacyPo.po.id,
      poNumber: legacyPo.po.poNumber,
      status: "issued",
      vendorName: legacyPo.vendorName,
      vendorEmail: legacyPo.vendorEmail,
      message: "Purchase order issued successfully",
    });
  } catch (error) {
    console.error("Error issuing purchase order:", error);
    res.status(500).json({ error: "Failed to issue purchase order" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Vendor Acknowledgment
// ═══════════════════════════════════════════════════════════════════════════

// PUT /api/procurement/purchase-orders/:id/acknowledge - Vendor acknowledges PO
router.put("/:id/acknowledge", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { notes } = req.body ?? {};

    const [procPo] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.id, id))
      .limit(1);

    if (procPo) {
      await db
        .update(procurementPurchaseOrdersTable)
        .set({
          status: "acknowledged",
          isAcknowledged: true,
          acknowledgmentDate: new Date(),
          acknowledgmentNotes: notes ?? null,
          deliveryStatus: "in_transit",
        })
        .where(eq(procurementPurchaseOrdersTable.id, id));

      const [updated] = await db
        .select()
        .from(procurementPurchaseOrdersTable)
        .where(eq(procurementPurchaseOrdersTable.id, id))
        .limit(1);

      res.json({
        ...fPO(updated!),
        message: "Purchase order acknowledged",
      });
      return;
    }

    // Fallback: purchaseOrdersTable
    const [legacyPo] = await db
      .select()
      .from(purchaseOrdersTable)
      .where(eq(purchaseOrdersTable.id, id))
      .limit(1);

    if (!legacyPo) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }

    await db
      .update(purchaseOrdersTable)
      .set({ status: "acknowledged" })
      .where(eq(purchaseOrdersTable.id, id));

    res.json({
      id: legacyPo.id,
      poNumber: legacyPo.poNumber,
      status: "acknowledged",
      isAcknowledged: true,
      deliveryStatus: "in_transit",
      message: "Purchase order acknowledged",
    });
  } catch (error) {
    console.error("Error acknowledging purchase order:", error);
    res.status(500).json({ error: "Failed to acknowledge purchase order" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Tracking Update
// ═══════════════════════════════════════════════════════════════════════════

// PUT /api/procurement/purchase-orders/:id/tracking - Update delivery tracking
router.put("/:id/tracking", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { deliveryStatus, trackingNumber, notes } = req.body ?? {};

    const [procPo] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.id, id))
      .limit(1);

    if (procPo) {
      const update: Record<string, unknown> = {};
      if (deliveryStatus) update.deliveryStatus = deliveryStatus;
      if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;
      if (notes !== undefined) update.notes = notes;

      // If delivered, set actual delivery date
      if (deliveryStatus === "delivered") {
        update.actualDeliveryDate = new Date();
        update.status = "delivered";
      }

      await db
        .update(procurementPurchaseOrdersTable)
        .set(update)
        .where(eq(procurementPurchaseOrdersTable.id, id));

      const [updated] = await db
        .select()
        .from(procurementPurchaseOrdersTable)
        .where(eq(procurementPurchaseOrdersTable.id, id))
        .limit(1);

      res.json({
        ...fPO(updated!),
        message: "Tracking updated successfully",
      });
      return;
    }

    // Fallback: purchaseOrdersTable
    const [legacyPo] = await db
      .select()
      .from(purchaseOrdersTable)
      .where(eq(purchaseOrdersTable.id, id))
      .limit(1);

    if (!legacyPo) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }

    const newStatus = deliveryStatus === "delivered" ? "delivered" : "in_transit";
    await db
      .update(purchaseOrdersTable)
      .set({ status: newStatus })
      .where(eq(purchaseOrdersTable.id, id));

    res.json({
      id: legacyPo.id,
      poNumber: legacyPo.poNumber,
      status: newStatus,
      deliveryStatus: deliveryStatus || "in_transit",
      trackingNumber: trackingNumber || null,
      message: "Tracking updated successfully",
    });
  } catch (error) {
    console.error("Error updating tracking:", error);
    res.status(500).json({ error: "Failed to update tracking" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Follow-up
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/purchase-orders/:id/follow-up - Create follow-up
router.post("/:id/follow-up", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const me = await getCurrentUser(req);
    const { message, method } = req.body ?? {};

    // Get PO details
    const [po] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.id, id))
      .limit(1);

    if (po) {
      // Create follow-up record
      await db.insert(procurementVendorFollowUpsTable).values({
        poId: id,
        vendorId: po.vendorId,
        followUpDate: new Date(),
        method: method || "email",
        message: message,
        createdById: me.id,
        status: "sent",
      });

      // Update PO follow-up count
      await db
        .update(procurementPurchaseOrdersTable)
        .set({
          followUpCount: po.followUpCount + 1,
          lastFollowUpDate: new Date(),
        })
        .where(eq(procurementPurchaseOrdersTable.id, id));

      res.json({
        message: "Follow-up created successfully",
        followUpCount: po.followUpCount + 1,
      });
      return;
    }

    // Fallback for legacy PO
    const [legacyPo] = await db
      .select()
      .from(purchaseOrdersTable)
      .where(eq(purchaseOrdersTable.id, id))
      .limit(1);

    if (!legacyPo) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }

    res.json({
      message: "Follow-up recorded successfully",
      followUpCount: 1,
    });
  } catch (error) {
    console.error("Error creating follow-up:", error);
    res.status(500).json({ error: "Failed to create follow-up" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW - Cancel PO
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/procurement/purchase-orders/:id/cancel - Cancel PO
router.post("/:id/cancel", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { reason } = req.body ?? {};

    if (!reason) {
      res.status(400).json({ error: "Cancellation reason is required" });
      return;
    }

    const [procPo] = await db
      .select()
      .from(procurementPurchaseOrdersTable)
      .where(eq(procurementPurchaseOrdersTable.id, id))
      .limit(1);

    if (procPo) {
      await db
        .update(procurementPurchaseOrdersTable)
        .set({
          status: "cancelled",
          notes: reason,
        })
        .where(eq(procurementPurchaseOrdersTable.id, id));

      res.json({ message: "Purchase order cancelled successfully" });
      return;
    }

    // Fallback: purchaseOrdersTable
    const [legacyPo] = await db
      .select()
      .from(purchaseOrdersTable)
      .where(eq(purchaseOrdersTable.id, id))
      .limit(1);

    if (!legacyPo) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }

    await db
      .update(purchaseOrdersTable)
      .set({ status: "cancelled" })
      .where(eq(purchaseOrdersTable.id, id));

    res.json({ message: "Purchase order cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling purchase order:", error);
    res.status(500).json({ error: "Failed to cancel purchase order" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PO ITEMS - Get Items
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/purchase-orders/:id/items - Get PO items
router.get("/:id/items", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const items = await db
      .select()
      .from(procurementPurchaseOrderItemsTable)
      .where(eq(procurementPurchaseOrderItemsTable.poId, id))
      .orderBy(procurementPurchaseOrderItemsTable.sortOrder);

    if (items.length > 0) {
      res.json(items.map(fPOItem));
      return;
    }

    // Fallback to legacy PO
    const [legacyPo] = await db
      .select()
      .from(purchaseOrdersTable)
      .where(eq(purchaseOrdersTable.id, id))
      .limit(1);

    if (legacyPo) {
      const total = Number(legacyPo.totalAmount) || 0;
      res.json([
        {
          id: 1,
          poId: legacyPo.id,
          itemName: legacyPo.description || `Item for ${legacyPo.poNumber}`,
          description: legacyPo.description,
          specification: "Standard purchase order item",
          quantity: 1,
          unit: "lot",
          unitPrice: total,
          totalPrice: total,
          receivedQuantity: ["delivered", "inspected", "completed"].includes(legacyPo.status) ? 1 : 0,
          acceptedQuantity: ["inspected", "completed"].includes(legacyPo.status) ? 1 : 0,
          rejectedQuantity: 0,
          sortOrder: 0,
        },
      ]);
      return;
    }

    res.json([]);
  } catch (error) {
    console.error("Error fetching PO items:", error);
    res.status(500).json({ error: "Failed to fetch PO items" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/procurement/purchase-orders/stats/summary - Get summary statistics
router.get("/stats/summary", async (req, res): Promise<void> => {
  try {
    const { projectId } = req.query;

    let baseQuery = db
      .select({
        status: procurementPurchaseOrdersTable.status,
        count: sql<number>`COUNT(*)`.as("count"),
        totalAmount: sql<number>`SUM(${procurementPurchaseOrdersTable.totalAmount})`.as("totalAmount"),
      })
      .from(procurementPurchaseOrdersTable)
      .$dynamic();

    if (projectId) {
      baseQuery = baseQuery.where(eq(procurementPurchaseOrdersTable.projectId, Number(projectId)));
    }

    const stats = await baseQuery.groupBy(procurementPurchaseOrdersTable.status);

    const summary = {
      total: 0,
      totalValue: 0,
      draft: 0,
      issued: 0,
      acknowledged: 0,
      in_transit: 0,
      delivered: 0,
      inspected: 0,
      completed: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      const count = Number(stat.count);
      const amount = Number(stat.totalAmount || 0);
      summary.total += count;
      summary.totalValue += amount;
      if (stat.status in summary) {
        summary[stat.status as keyof typeof summary] = count as never;
      }
    });

    res.json(summary);
  } catch (error) {
    console.error("Error fetching PO stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// GET /api/procurement/purchase-orders/stats/delayed - Get delayed POs
router.get("/stats/delayed", async (req, res): Promise<void> => {
  try {
    const today = new Date();

    const delayed = await db
      .select({
        po: procurementPurchaseOrdersTable,
        vendorName: vendorsTable.name,
        projectName: projectsTable.name,
      })
      .from(procurementPurchaseOrdersTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, procurementPurchaseOrdersTable.vendorId))
      .leftJoin(projectsTable, eq(projectsTable.id, procurementPurchaseOrdersTable.projectId))
      .where(
        and(
          lt(procurementPurchaseOrdersTable.expectedDeliveryDate, today),
          sql`${procurementPurchaseOrdersTable.deliveryStatus} != 'delivered'`,
          sql`${procurementPurchaseOrdersTable.status} != 'cancelled'`
        )
      )
      .orderBy(procurementPurchaseOrdersTable.expectedDeliveryDate);

    res.json(
      delayed.map((r) => ({
        ...fPO(r.po),
        vendorName: r.vendorName,
        projectName: r.projectName,
        daysDelayed: Math.floor(
          (today.getTime() - new Date(r.po.expectedDeliveryDate!).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }))
    );
  } catch (error) {
    console.error("Error fetching delayed POs:", error);
    res.status(500).json({ error: "Failed to fetch delayed purchase orders" });
  }
});

export default router;
