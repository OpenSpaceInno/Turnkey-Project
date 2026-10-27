import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
  ArrowUpRight,
  ArrowRight,
  Receipt,
  ShieldCheck,
  Building2,
  Sparkles,
  CalendarClock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  PieChart,
  Scale,
  Ban,
  ThumbsUp,
  CreditCard,
  Printer,
  Check,
  X,
  Search,
  Percent,
  Landmark,
  Layers,
} from "lucide-react";
import {
  useARSummary,
  useARRaBills,
  useARInvoices,
  usePMApproveARRaBill,
  useCertifyPaymentAR,
  useGenerateARInvoice,
  useRecordARPayment,
  useAPSummary,
  useAPRaBills,
  useAPInvoices,
  useAPPayments,
  useThreeWayMatch,
  usePMApproveAPInvoice,
  useFinanceVerifyAPInvoice,
  useApproveAPPayment,
  useScheduleAPPayment,
  usePayVendor,
  useListExpenses,
  useUpdateExpense,
  useListBudgetItems,
  getListExpensesQueryKey,
  useFinancialAuditLogs,
  type FinancialAuditLog,
  useBillingMilestones,
  useRaiseRaBillFromMilestone,
  useBudgetVarianceAlerts,
} from "@workspace/api-client-react";
import { NewExpenseDialog } from "@/components/dialogs/finance-dialogs";
import { format } from "date-fns";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(val: number | string | undefined | null): string {
  const n = Number(val || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-600",
  submitted: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  revision_requested: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  pm_approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  payment_certified: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
  invoice_generated: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  invoiced: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  sent: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
  payment_pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  partially_paid: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  reconciled: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
  closed: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-600",
  overdue: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  received: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  invoice_matched: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  matched: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  discrepancy: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  finance_verified: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
  payment_approved: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
  payment_scheduled: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  scheduled: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  reimbursed: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
};

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge variant="outline" className={`text-xs ${statusColors[status] || "bg-gray-500/10 text-gray-400"}`}>
      {label}
    </Badge>
  );
}

function printDocument(title: string, bodyContent: string) {
  const w = window.open("", "_blank", "width=850,height=800");
  if (!w) return;
  const doc = w.document;
  doc.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>${title}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:36px;max-width:820px;margin:auto;line-height:1.5}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:20px}
      .company-name{font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.5px}
      .doc-badge{display:inline-block;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700;text-transform:uppercase;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1}
      .title{font-size:18px;font-weight:700;margin:16px 0 8px}
      .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;font-size:13px}
      .meta-box{background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0}
      table{width:100%;border-collapse:collapse;margin:20px 0;font-size:13px}
      th{text-align:left;padding:10px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em}
      td{padding:10px 12px;border:1px solid #e2e8f0}
      .amount-row{font-size:15px;font-weight:700;background:#f8fafc}
      .stamp-box{border:2px dashed #059669;background:#ecfdf5;color:#065f46;padding:12px;border-radius:6px;margin:20px 0;font-size:12px}
      .signatures{display:flex;justify-content:space-between;margin-top:40px;padding-top:20px}
      .sig-line{border-top:1px solid #94a3b8;width:200px;text-align:center;font-size:11px;color:#64748b;padding-top:6px}
      .footer{margin-top:36px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}
      @media print{body{padding:20px}.no-print{display:none!important}}
    </style>
  </head><body>
    <div class="no-print" style="margin-bottom:20px;display:flex;gap:10px">
      <button onclick="window.print()" style="padding:10px 24px;background:#0f172a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">&#128424; Print / Save as PDF</button>
      <button onclick="window.close()" style="padding:10px 18px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;font-size:13px">Close Window</button>
    </div>
    ${bodyContent}
    <div class="footer">
      <span>Kanak Turnkey Enterprise ERP &bull; Official Digital Record</span>
      <span>Generated ${new Date().toLocaleString("en-IN")}</span>
    </div>
  </body></html>`);
  doc.close();
  w.focus();
}

const esc = (s: string | number | undefined | null) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function handlePrintClientRaBill(bill: any, projectName: string, clientName: string) {
  const gross = Number(bill.grossAmount || bill.amount || 0);
  const ret = Number(bill.retentionAmount || gross * 0.05);
  const tds = Number(bill.tdsAmount || gross * 0.02);
  const gst = Number(bill.gstAmount || gross * 0.18);
  const net = Number(bill.netPayableAmount || gross - ret - tds + gst);

  const content = `
    <div class="header">
      <div>
        <div class="company-name">KANAK TURNKEY PROJECTS PVT. LTD.</div>
        <div style="font-size:11px;color:#64748b">EPC Turnkey Contracting & Construction Management &bull; GSTIN: 27AABCK1234F1Z5</div>
      </div>
      <div class="doc-badge">RA Bill Abstract</div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase">Project & Client</div>
        <div style="font-weight:700;font-size:14px;margin-top:2px">${esc(projectName)}</div>
        <div style="color:#334155">${esc(clientName)}</div>
      </div>
      <div class="meta-box">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase">Bill Details</div>
        <div><strong>Bill Number:</strong> ${esc(bill.billNumber)}</div>
        <div><strong>Milestone:</strong> ${esc(bill.milestone || "General Running Account")}</div>
        <div><strong>Status:</strong> ${esc(bill.status)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:right">Rate / Basis</th>
          <th style="text-align:right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Gross Work Certified (IS 456 JMR Abstract)</strong></td>
          <td style="text-align:right">100% Measured</td>
          <td style="text-align:right;font-weight:600">₹${gross.toLocaleString("en-IN")}</td>
        </tr>
        <tr style="color:#b45309">
          <td>(-) Contractual Retention Held</td>
          <td style="text-align:right">5.0%</td>
          <td style="text-align:right">-₹${ret.toLocaleString("en-IN")}</td>
        </tr>
        <tr style="color:#b91c1c">
          <td>(-) Statutory TDS u/s 194C</td>
          <td style="text-align:right">2.0%</td>
          <td style="text-align:right">-₹${tds.toLocaleString("en-IN")}</td>
        </tr>
        <tr style="color:#0369a1">
          <td>(+) GST Addition (CGST 9% + SGST 9%)</td>
          <td style="text-align:right">18.0%</td>
          <td style="text-align:right">+₹${gst.toLocaleString("en-IN")}</td>
        </tr>
        <tr class="amount-row">
          <td><strong>Net Payable / Certified for Payment</strong></td>
          <td></td>
          <td style="text-align:right;color:#059669;font-size:16px">₹${net.toLocaleString("en-IN")}</td>
        </tr>
      </tbody>
    </table>

    <div class="stamp-box">
      <strong>&#10003; Project Manager Quality & Progress Certification:</strong>
      <div>Measurements verified on site via Joint Measurement Sheet. Concrete cube strengths tested and approved per IS 456:2000. Certified for client invoicing.</div>
    </div>

    <div class="signatures">
      <div class="sig-line">Prepared by Quantity Surveyor (QS)</div>
      <div class="sig-line">Verified by Project Manager</div>
      <div class="sig-line">Certified by Client Architect / PMC</div>
    </div>
  `;
  printDocument(`RA_Bill_${bill.billNumber}`, content);
}

function handlePrintClientInvoice(inv: any, projectName: string, clientName: string) {
  const net = Number(inv.netAmount || inv.amount || 0);
  const gst = Number(inv.taxAmount || 196200);
  const gross = Number(inv.grossAmount || net - gst);

  const content = `
    <div class="header">
      <div>
        <div class="company-name">KANAK TURNKEY PROJECTS PVT. LTD.</div>
        <div style="font-size:11px;color:#64748b">Registered Office: 802, Signature Tower, BKC, Mumbai 400051</div>
        <div style="font-size:11px;color:#64748b">GSTIN: 27AABCK1234F1Z5 &bull; PAN: AABCK1234F &bull; SAC Code: 995411</div>
      </div>
      <div class="doc-badge" style="background:#dbeafe;color:#1e40af;border-color:#93c5fd">Tax Invoice</div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase">Billed To (Client)</div>
        <div style="font-weight:700;font-size:14px;margin-top:2px">${esc(clientName)}</div>
        <div style="color:#334155">Project: ${esc(projectName)}</div>
        <div style="color:#64748b;font-size:12px">GSTIN: 27AAACB9921E1Z8</div>
      </div>
      <div class="meta-box">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase">Invoice Details</div>
        <div><strong>Invoice Number:</strong> ${esc(inv.invoiceNumber)}</div>
        <div><strong>Date:</strong> ${esc(inv.invoiceDate ? format(new Date(inv.invoiceDate), "dd MMM yyyy") : "2026-09-22")}</div>
        <div><strong>Payment Terms:</strong> ${esc(inv.paymentTerms || "Net 30 Days")}</div>
        <div><strong>Status:</strong> ${esc(inv.status).toUpperCase()}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Particulars / Scope of Work</th>
          <th>SAC</th>
          <th style="text-align:right">Taxable Value</th>
          <th style="text-align:right">GST (18%)</th>
          <th style="text-align:right">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Turnkey Construction Services against RA Bill</td>
          <td>995411</td>
          <td style="text-align:right">₹${gross.toLocaleString("en-IN")}</td>
          <td style="text-align:right">₹${gst.toLocaleString("en-IN")}</td>
          <td style="text-align:right;font-weight:600">₹${net.toLocaleString("en-IN")}</td>
        </tr>
        <tr class="amount-row">
          <td colspan="4"><strong>Total Invoice Value (INR)</strong></td>
          <td style="text-align:right;color:#1e40af;font-size:16px">₹${net.toLocaleString("en-IN")}</td>
        </tr>
      </tbody>
    </table>

    <div style="background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;font-size:12px;margin:20px 0">
      <div style="font-weight:700;margin-bottom:4px">Bank Remittance Details:</div>
      <div><strong>Beneficiary:</strong> Kanak Turnkey Projects Pvt. Ltd.</div>
      <div><strong>Bank:</strong> HDFC Bank Ltd &bull; <strong>A/C No:</strong> 50200088192019 &bull; <strong>IFSC:</strong> HDFC0000060 &bull; <strong>Branch:</strong> BKC, Mumbai</div>
    </div>

    <div class="signatures">
      <div class="sig-line">Prepared By Accounts</div>
      <div class="sig-line">For Kanak Turnkey Projects (Authorized Signatory)</div>
    </div>
  `;
  printDocument(`Tax_Invoice_${inv.invoiceNumber}`, content);
}

function handlePrintVendorPayment(payment: any, projectName: string) {
  const amt = Number(payment.paymentAmount || payment.amount || 0);

  const content = `
    <div class="header">
      <div>
        <div class="company-name">KANAK TURNKEY PROJECTS PVT. LTD.</div>
        <div style="font-size:11px;color:#64748b">Finance & Commercial Division &bull; Disbursement Voucher</div>
      </div>
      <div class="doc-badge" style="background:#f3e8ff;color:#7e22ce;border-color:#d8b4fe">Payment Voucher</div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase">Project Reference</div>
        <div style="font-weight:700;font-size:14px;margin-top:2px">${esc(projectName)}</div>
        <div style="color:#64748b;font-size:12px">Vendor A/c Settlement Voucher</div>
      </div>
      <div class="meta-box">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase">Disbursement Details</div>
        <div><strong>Voucher #:</strong> ${esc(payment.paymentNumber)}</div>
        <div><strong>Date:</strong> ${esc(payment.paymentDate ? format(new Date(payment.paymentDate), "dd MMM yyyy") : "2026-09-23")}</div>
        <div><strong>Mode:</strong> ${esc(payment.paymentMode).toUpperCase()}</div>
        <div><strong>Bank UTR:</strong> <span style="font-family:monospace;color:#059669">${esc(payment.transactionId || payment.referenceNumber)}</span></div>
      </div>
    </div>

    <div class="stamp-box" style="border-color:#7e22ce;background:#faf5ff;color:#581c87">
      <strong>&#10003; 3-Way Match Audit Stamp:</strong>
      <div>1. PO Verification: PASSED (Rates & Quotas matched)</div>
      <div>2. Measurement / Site GRN: PASSED (Materials physically accepted)</div>
      <div>3. Invoice & Tax Verification: PASSED (GSTIN checked & TDS deducted u/s 194C)</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Settlement Details</th>
          <th style="text-align:right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="amount-row">
          <td><strong>Net Disbursed via RTGS / NEFT</strong></td>
          <td style="text-align:right;color:#7e22ce;font-size:16px">₹${amt.toLocaleString("en-IN")}</td>
        </tr>
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig-line">Commercial Manager</div>
      <div class="sig-line">Finance Controller</div>
      <div class="sig-line">Managing Director / Authorized Signatory</div>
    </div>
  `;
  printDocument(`Vendor_Voucher_${payment.paymentNumber}`, content);
}

interface ProjectCommercialControlProps {
  projectId: number;
  projectBudget?: number;
  projectName?: string;
  clientName?: string;
}

export function ProjectCommercialControl({
  projectId,
  projectBudget = 0,
  projectName = "Project",
  clientName = "Client",
}: ProjectCommercialControlProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [innerTab, setInnerTab] = useState("ar");

  // AR Data
  const { data: arSummary } = useARSummary(projectId);
  const { data: arRaBills = [] } = useARRaBills({ projectId });
  const { data: arInvoices = [] } = useARInvoices({ projectId });

  // AP Data
  const { data: apSummary } = useAPSummary(projectId);
  const { data: apRaBills = [] } = useAPRaBills({ projectId });
  const { data: apInvoices = [] } = useAPInvoices({ projectId });
  const { data: apPayments = [] } = useAPPayments({ projectId });

  // Expenses Data
  const { data: expenses = [] } = useListExpenses({ projectId });
  const updateExpense = useUpdateExpense();

  // Financial Audit Logs Data
  const { data: projectAuditLogs = [], isLoading: loadingAudit } = useFinancialAuditLogs({ projectId });
  const [selectedAuditLog, setSelectedAuditLog] = useState<FinancialAuditLog | null>(null);

  // Budget Items
  const { data: budgetItems = [] } = useListBudgetItems(projectId);

  // Milestone-to-Billing Schedule & Contract Matrix Data
  const { data: milestonesData, isLoading: loadingMilestones } = useBillingMilestones(projectId);
  const raiseRaBillMutation = useRaiseRaBillFromMilestone();

  // Real-time Budget Variance Alerts Data
  const { data: varianceData, isLoading: loadingVariance } = useBudgetVarianceAlerts(projectId);

  const clientContract = milestonesData?.contract;
  const billingMilestones = milestonesData?.milestones || [];
  const milestonesSummary = milestonesData?.summary;
  const criticalVarianceAlerts = varianceData?.alerts.filter((a) => a.severity === "critical") || [];
  const warningVarianceAlerts = varianceData?.alerts.filter((a) => a.severity === "warning") || [];

  const handleRaiseRaBillFromMilestone = (milestoneId: number) => {
    raiseRaBillMutation.mutate(
      { milestoneId },
      {
        onSuccess: (res) => {
          toast({
            title: "Client RA Bill Raised",
            description: `Draft RA Bill ${res.billNumber} created from milestone schedule.`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "Failed to raise RA Bill",
            description: err?.message || "Error generating RA bill from milestone.",
            variant: "destructive",
          });
        },
      }
    );
  };

  // AR Mutations
  const pmApproveAR = usePMApproveARRaBill();
  const certifyPaymentAR = useCertifyPaymentAR();
  const generateARInvoice = useGenerateARInvoice();
  const recordARPayment = useRecordARPayment();

  // AP Mutations
  const threeWayMatch = useThreeWayMatch();
  const pmApproveAP = usePMApproveAPInvoice();
  const financeVerifyAP = useFinanceVerifyAPInvoice();
  const approveAPPayment = useApproveAPPayment();
  const scheduleAPPayment = useScheduleAPPayment();
  const payVendor = usePayVendor();

  // Local Dialog States
  const [certifyDialog, setCertifyDialog] = useState<{ open: boolean; billId?: number }>({ open: false });
  const [certifyForm, setCertifyForm] = useState({ certificateNumber: "", certifiedAmount: "", paymentDueDate: "" });

  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; invoiceId?: number }>({ open: false });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "bank_transfer",
    referenceNumber: "",
    notes: "",
  });

  const [payVendorDialog, setPayVendorDialog] = useState<{ open: boolean; invoiceId?: number }>({ open: false });
  const [payVendorForm, setPayVendorForm] = useState({
    amount: "",
    paymentMode: "bank_transfer",
    referenceNumber: "",
    notes: "",
  });

  // Calculate totals
  const totalBilledAR = arSummary?.totalBilled || arRaBills.reduce((acc, b) => acc + Number(b.netPayableAmount || b.amount || 0), 0);
  const totalCollectedAR = arSummary?.totalCollected || arInvoices.reduce((acc, i) => acc + Number(i.paidAmount || 0), 0);

  const totalPayableAP = apSummary?.totalPayable || apInvoices.reduce((acc, i) => acc + Number(i.netPayableAmount || i.amount || 0), 0);
  const totalPaidAP = apSummary?.totalPaid || apPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const totalExpenses = (Array.isArray(expenses) ? expenses : []).reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
  const approvedExpenses = (Array.isArray(expenses) ? expenses : [])
    .filter((e: any) => e.status === "approved" || e.status === "reimbursed")
    .reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);

  // Profitability & Margin
  const totalCostsCommitted = totalPayableAP + totalExpenses;
  const netRealizedCash = totalCollectedAR - (totalPaidAP + approvedExpenses);
  const grossMargin = totalBilledAR > 0 ? ((totalBilledAR - totalCostsCommitted) / totalBilledAR) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* ── 1. Commercial Header & KPI Summary Cards ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">
                Commercial & Financial Control
              </span>
              <Badge variant="outline" className="text-xs font-mono">
                Project #{projectId}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client contract billing, vendor payables, and realized profit margins
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild className="text-xs h-8">
              <Link href="/finance/ar">
                Client AR Hub <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="text-xs h-8">
              <Link href="/finance/ap">
                Vendor AP Hub <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 Clean, High-Impact KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Contract Budget */}
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">1. Contract Budget</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{INR.format(projectBudget)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Client Agreed EPC Value</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Client Billing (AR) */}
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2. Client Inflow (AR)</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{INR.format(totalCollectedAR)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed: <span className="font-semibold text-foreground">{INR.format(totalBilledAR)}</span> ({arRaBills.length} RA Bills)
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Total Outflow (Costs) */}
          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">3. Project Outflow (Costs)</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{INR.format(totalPaidAP + approvedExpenses)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Committed: <span className="font-semibold text-foreground">{INR.format(totalCostsCommitted)}</span>
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Net Cash Position & Margin */}
          <Card className={`border-l-4 ${netRealizedCash >= 0 ? "border-l-teal-500" : "border-l-rose-500"} shadow-sm`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">4. Net Realized Margin</p>
                  <p className={`text-2xl font-bold mt-1 ${netRealizedCash >= 0 ? "text-teal-600" : "text-rose-600"}`}>
                    {INR.format(netRealizedCash)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gross Margin: <span className={`font-semibold ${grossMargin >= 0 ? "text-teal-600" : "text-rose-600"}`}>{grossMargin.toFixed(1)}%</span>
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${netRealizedCash >= 0 ? "bg-teal-500/10 text-teal-600" : "bg-rose-500/10 text-rose-600"}`}>
                  <Scale className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 2. Unified Navigation Tabs ── */}
      <Tabs value={innerTab} onValueChange={setInnerTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-muted/60 p-1">
          <TabsTrigger value="ar" className="text-xs sm:text-sm gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Client Billing (AR)
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
              {arRaBills.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ap" className="text-xs sm:text-sm gap-2">
            <TrendingDown className="w-4 h-4 text-purple-400" />
            Vendor Billing (AP)
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
              {apInvoices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs sm:text-sm gap-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            Site Expenses
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
              {Array.isArray(expenses) ? expenses.length : 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="budget" className="text-xs sm:text-sm gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Cost Variance
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs sm:text-sm gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            Audit Trail
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
              {projectAuditLogs.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: CLIENT BILLING (ACCOUNTS RECEIVABLE)                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="ar" className="space-y-6">
          {/* 1. Client Contract Commercial Terms */}
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Landmark className="w-3.5 h-3.5 mr-1 text-primary" /> Client Contract
                  </Badge>
                  <span className="font-mono text-xs font-semibold text-primary">
                    {clientContract?.contractNumber || `CNT-CLI-${projectId}`}
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {clientContract?.status || "active"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Agreed EPC Value: <span className="font-bold text-foreground font-mono">{INR.format(clientContract?.totalAmount || projectBudget)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-muted/40 rounded-lg p-2.5 border">
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Percent className="w-3 h-3 text-primary" /> Mobilization Advance
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {clientContract?.advancePercent || 10}%
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {INR.format(((clientContract?.totalAmount || projectBudget) * (clientContract?.advancePercent || 10)) / 100)}
                  </div>
                </div>

                <div className="bg-muted/40 rounded-lg p-2.5 border">
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Advance BG (ABG)
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {clientContract?.abgRequired ? "Required" : "Not Required"}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {clientContract?.abgRequired ? `${clientContract?.abgPercent || 10}% Guarantee` : "Unconditional"}
                  </div>
                </div>

                <div className="bg-muted/40 rounded-lg p-2.5 border">
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-600" /> Retention Withheld
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {clientContract?.retentionPercent || 5}%
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Held until DLP release
                  </div>
                </div>

                <div className="bg-muted/40 rounded-lg p-2.5 border">
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" /> Credit Period
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {clientContract?.paymentTermsDays || 30} Days
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    From certification
                  </div>
                </div>

                <div className="bg-muted/40 rounded-lg p-2.5 border col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-600" /> Defect Liability (DLP)
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {clientContract?.dlpMonths || 12} Months
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Warranty coverage
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Milestone-to-Billing Schedule Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Stage-to-Billing Milestones
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Contract Schedule
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Direct mapping from physical stage completion to client contract billing percentage
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Billed Progress:</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">
                    {milestonesSummary?.billedPercentage || "0.0"}%
                  </span>
                  <span className="text-muted-foreground">({milestonesSummary?.billedCount || 0}/{milestonesSummary?.milestonesCount || 0} Stages)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden mt-3">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(milestonesSummary?.billedPercentage || 0)))}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Stage</th>
                      <th className="p-3 font-medium">Milestone Description</th>
                      <th className="p-3 font-medium text-center">Billing %</th>
                      <th className="p-3 font-medium text-right">Expected Value</th>
                      <th className="p-3 font-medium text-center">Target Date</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-center">Linked RA Bill</th>
                      <th className="p-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {billingMilestones.map((m) => {
                      const isBilled = m.status === "billed" || m.status === "paid" || !!m.raBillId;
                      const isReady = m.status === "ready_to_bill";

                      return (
                        <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <span className="font-mono font-bold text-primary">{m.milestoneNumber}</span>
                            <div>
                              <Badge variant="outline" className="text-[10px] capitalize mt-0.5">
                                {m.stage}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{m.title}</div>
                            <div className="text-[10px] text-muted-foreground max-w-sm truncate">
                              {m.description || "Milestone deliverable"}
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-foreground">
                            {m.billingPercent}%
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            {INR.format(m.expectedAmount)}
                          </td>
                          <td className="p-3 text-center text-muted-foreground whitespace-nowrap">
                            {m.targetDate ? format(new Date(m.targetDate), "dd MMM yyyy") : "—"}
                          </td>
                          <td className="p-3 text-center">
                            <StatusBadge status={m.status} />
                          </td>
                          <td className="p-3 text-center font-mono text-xs">
                            {m.raBill ? (
                              <div className="flex items-center justify-center gap-1 text-primary">
                                <FileText className="w-3 h-3" />
                                <span>{m.raBill.billNumber}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Unbilled</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isBilled ? (
                              <Badge variant="secondary" className="text-[10px] gap-1 bg-muted text-muted-foreground">
                                <Check className="w-3 h-3 text-emerald-600" /> Billed
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1 font-semibold"
                                disabled={raiseRaBillMutation.isPending}
                                onClick={() => handleRaiseRaBillFromMilestone(m.id)}
                              >
                                <Plus className="w-3 h-3" />
                                Raise RA Bill
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {billingMilestones.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No billing milestones configured for this project.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 3. Client RA Bills Section */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  Client Running Account (RA) Bills
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400">
                    Client Inflow
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Progress abstracts awaiting PM approval, client certification, and tax invoicing
                </CardDescription>
              </div>
              <Button size="sm" asChild className="h-8 gap-1">
                <Link href="/finance/ar">
                  <Plus className="w-3.5 h-3.5" /> Create Client RA Bill
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Bill Number</th>
                      <th className="p-3 font-medium">Milestone / Scope</th>
                      <th className="p-3 font-medium text-right">Gross Amount</th>
                      <th className="p-3 font-medium text-right">Ret. (5%)</th>
                      <th className="p-3 font-medium text-right">TDS (2%)</th>
                      <th className="p-3 font-medium text-right">Net Payable</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {arRaBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-medium text-primary">
                          {bill.billNumber}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-foreground">{bill.milestone || "Progress Bill"}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs">{bill.description || "—"}</div>
                        </td>
                        <td className="p-3 text-right font-medium">{formatCurrency(bill.grossAmount || bill.amount)}</td>
                        <td className="p-3 text-right text-amber-600">-{formatCurrency(bill.retentionAmount)}</td>
                        <td className="p-3 text-right text-rose-600">-{formatCurrency(bill.tdsAmount)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(bill.netPayableAmount || bill.amount)}</td>
                        <td className="p-3 text-center">
                          <StatusBadge status={bill.status} />
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {bill.status === "submitted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
                              onClick={async () => {
                                try {
                                  await pmApproveAR.mutateAsync({ id: bill.id, comments: "PM approved for client certification" });
                                  toast({ title: "Approved", description: "Client RA Bill PM approved." });
                                } catch (err: any) {
                                  toast({ title: "Error", description: err.message, variant: "destructive" });
                                }
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> PM Approve
                            </Button>
                          )}
                          {bill.status === "pm_approved" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white"
                              onClick={() => {
                                setCertifyForm({
                                  certificateNumber: `PC-${bill.billNumber}`,
                                  certifiedAmount: String(bill.netPayableAmount || bill.amount),
                                  paymentDueDate: format(new Date(Date.now() + 15 * 86400000), "yyyy-MM-dd"),
                                });
                                setCertifyDialog({ open: true, billId: bill.id });
                              }}
                            >
                              <ShieldCheck className="w-3 h-3 mr-1" /> Certify Payment
                            </Button>
                          )}
                          {bill.status === "payment_certified" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                              onClick={async () => {
                                try {
                                  await generateARInvoice.mutateAsync(bill.id);
                                  toast({ title: "Invoice Generated", description: "Official Tax Invoice created." });
                                } catch (err: any) {
                                  toast({ title: "Error", description: err.message, variant: "destructive" });
                                }
                              }}
                            >
                              <Receipt className="w-3 h-3 mr-1" /> Generate Tax Invoice
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handlePrintClientRaBill(bill, projectName, clientName)}
                            title="Print / PDF RA Bill Abstract"
                          >
                            <Printer className="w-3 h-3 mr-1" /> Print
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {arRaBills.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No Client RA Bills raised for this project yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 4. Client Tax Invoices & Collections */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Client Tax Invoices & Remittance History
                </CardTitle>
                <CardDescription className="text-xs">
                  Official GST tax invoices issued and remittances received
                </CardDescription>
              </div>
              <div className="text-xs text-muted-foreground">
                Total Collected: <strong className="text-emerald-600 font-mono text-sm ml-1">{formatCurrency(totalCollectedAR)}</strong>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Invoice #</th>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Due Date</th>
                      <th className="p-3 font-medium text-right">Net Billed</th>
                      <th className="p-3 font-medium text-right">Paid</th>
                      <th className="p-3 font-medium text-right">Outstanding</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {arInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-medium text-primary">{inv.invoiceNumber}</td>
                        <td className="p-3">{inv.invoiceDate ? format(new Date(inv.invoiceDate), "MMM dd, yyyy") : "—"}</td>
                        <td className="p-3">{inv.dueDate ? format(new Date(inv.dueDate), "MMM dd, yyyy") : "—"}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(inv.netAmount || inv.amount)}</td>
                        <td className="p-3 text-right text-emerald-600 font-semibold">{formatCurrency(inv.paidAmount || 0)}</td>
                        <td className="p-3 text-right font-bold text-amber-600">
                          {formatCurrency(Number(inv.netAmount || inv.amount) - Number(inv.paidAmount || 0))}
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {inv.status !== "paid" && inv.status !== "closed" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => {
                                const remaining = Number(inv.netAmount || inv.amount) - Number(inv.paidAmount || 0);
                                setPaymentForm({
                                  amount: String(remaining > 0 ? remaining : 0),
                                  paymentMode: "bank_transfer",
                                  referenceNumber: `UTR-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`,
                                  notes: "Client remittance received",
                                });
                                setPaymentDialog({ open: true, invoiceId: inv.id });
                              }}
                            >
                              <CreditCard className="w-3 h-3 mr-1" /> Record Remittance
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handlePrintClientInvoice(inv, projectName, clientName)}
                            title="Print / PDF Tax Invoice"
                          >
                            <Printer className="w-3 h-3 mr-1" /> Print
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {arInvoices.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No Client Tax Invoices generated yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: VENDOR BILLING (ACCOUNTS PAYABLE)                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="ap" className="space-y-6">
          {/* 1. Vendor Invoices & 3-Way Match */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-purple-600" />
                  Vendor Invoices & 3-Way Match
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400">
                    Vendor Outflow
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Audit chain: 3-Way Match (PO + MB + Bill) → PM Approval → Finance Verification → Payment Release
                </CardDescription>
              </div>
              <Button size="sm" asChild variant="outline" className="h-8 gap-1">
                <Link href="/finance/ap">
                  <ExternalLink className="w-3.5 h-3.5" /> Full AP Console
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Invoice #</th>
                      <th className="p-3 font-medium">Vendor</th>
                      <th className="p-3 font-medium">PO / Contract</th>
                      <th className="p-3 font-medium text-right">Net Payable</th>
                      <th className="p-3 font-medium text-center">3-Way Match</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {apInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-medium text-purple-600 dark:text-purple-400">{inv.invoiceNumber}</td>
                        <td className="p-3 font-medium">{inv.vendorName || `Vendor #${inv.vendorId}`}</td>
                        <td className="p-3 font-mono text-muted-foreground">{inv.poNumber || (inv.purchaseOrderId ? `PO #${inv.purchaseOrderId}` : "Trade Contract")}</td>
                        <td className="p-3 text-right font-bold text-foreground">{formatCurrency(inv.netPayableAmount || inv.amount)}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded border text-[11px]">
                            <span title="PO Match" className={inv.poMatched ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>PO ✓</span>
                            <span className="text-muted-foreground">|</span>
                            <span title="Measurement Match" className={inv.measurementMatched ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>MB ✓</span>
                            <span className="text-muted-foreground">|</span>
                            <span title="Rate Valid" className={inv.quantityRateValidated ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>Rate ✓</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {/* 3-Way Match Button */}
                          {!inv.poMatched && inv.status === "received" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                              onClick={async () => {
                                try {
                                  const res = await threeWayMatch.mutateAsync(inv.id);
                                  toast({ title: "Match Complete", description: `3-Way match executed. Status: ${res.newStatus}` });
                                } catch (err: any) {
                                  toast({ title: "Error", description: err.message, variant: "destructive" });
                                }
                              }}
                            >
                              <ShieldCheck className="w-3 h-3 mr-1" /> Run 3-Way Match
                            </Button>
                          )}

                          {/* PM Approve */}
                          {(inv.status === "invoice_matched" || inv.status === "received") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
                              onClick={async () => {
                                try {
                                  await pmApproveAP.mutateAsync({ invoiceId: inv.id, comments: "Site PM measurement verified" });
                                  toast({ title: "PM Approved", description: "Vendor invoice approved by PM." });
                                } catch (err: any) {
                                  toast({ title: "Error", description: err.message, variant: "destructive" });
                                }
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> PM Approve
                            </Button>
                          )}

                          {/* Finance Verify */}
                          {inv.status === "pm_approved" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                              onClick={async () => {
                                try {
                                  await financeVerifyAP.mutateAsync({ invoiceId: inv.id, comments: "TDS and tax audit verified" });
                                  toast({ title: "Finance Verified", description: "Tax and rate compliance verified." });
                                } catch (err: any) {
                                  toast({ title: "Error", description: err.message, variant: "destructive" });
                                }
                              }}
                            >
                              <ShieldCheck className="w-3 h-3 mr-1" /> Finance Verify
                            </Button>
                          )}

                          {/* Pay Vendor */}
                          {(inv.status === "payment_approved" || inv.status === "payment_scheduled" || inv.status === "finance_verified") && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => {
                                const outstanding = Number(inv.outstandingAmount || inv.netPayableAmount || inv.amount);
                                setPayVendorForm({
                                  amount: String(outstanding > 0 ? outstanding : 0),
                                  paymentMode: "neft_rtgs",
                                  referenceNumber: `UTR-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`,
                                  notes: "Vendor payment released",
                                });
                                setPayVendorDialog({ open: true, invoiceId: inv.id });
                              }}
                            >
                              <CreditCard className="w-3 h-3 mr-1" /> Release Payment
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {apInvoices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No Vendor Invoices recorded for this project.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 2. Vendor Payment Disbursement Ledger */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  Vendor Payment Disbursement Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Recorded payment vouchers and bank remittance transactions
                </CardDescription>
              </div>
              <div className="text-xs text-muted-foreground">
                Total Paid: <strong className="text-purple-600 font-mono text-sm ml-1">{formatCurrency(totalPaidAP)}</strong>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Voucher #</th>
                      <th className="p-3 font-medium">Payment Date</th>
                      <th className="p-3 font-medium">Mode</th>
                      <th className="p-3 font-medium">Bank Reference / UTR</th>
                      <th className="p-3 font-medium text-right">Amount Released</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {apPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-medium text-purple-600 dark:text-purple-400">{p.paymentNumber}</td>
                        <td className="p-3">{p.paymentDate ? format(new Date(p.paymentDate), "MMM dd, yyyy") : "—"}</td>
                        <td className="p-3 uppercase text-muted-foreground">{p.paymentMode}</td>
                        <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">{p.referenceNumber || "—"}</td>
                        <td className="p-3 text-right font-bold text-foreground">{formatCurrency(p.amount)}</td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handlePrintVendorPayment(p, projectName)}
                            title="Print / PDF Vendor Payment Voucher"
                          >
                            <Printer className="w-3 h-3 mr-1" /> Voucher
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {apPayments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          No vendor payment disbursements recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: SITE DIRECT EXPENSES (PETTY CASH & SITE OVERHEADS)           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="expenses" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  Site Direct Expenses & Petty Cash Claims
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                    Site Imprest
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Non-PO expenditures: emergency hardware, crane/hydra hire, daily labor, DG fuel, site testing
                </CardDescription>
              </div>
              <NewExpenseDialog
                defaultProjectId={projectId}
                trigger={
                  <Button size="sm" className="h-8 gap-1 bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="w-3.5 h-3.5" /> Log Site Expense
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Category Summary Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-muted/40 p-3 rounded-lg border">
                  <span className="text-muted-foreground">Total Incurred</span>
                  <div className="text-lg font-bold text-foreground mt-0.5">{INR.format(totalExpenses)}</div>
                  <span className="text-[10px] text-muted-foreground">{Array.isArray(expenses) ? expenses.length : 0} voucher(s)</span>
                </div>
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 p-3 rounded-lg">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Approved & Paid</span>
                  <div className="text-lg font-bold mt-0.5">{INR.format(approvedExpenses)}</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Audited by Finance</span>
                </div>
                <div className="bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800 p-3 rounded-lg">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">Pending Review</span>
                  <div className="text-lg font-bold mt-0.5">
                    {INR.format(totalExpenses - approvedExpenses)}
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">Awaiting PM / Finance</span>
                </div>
                <div className="bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 p-3 rounded-lg">
                  <span className="text-blue-700 dark:text-blue-400 font-medium">Site Imprest Float</span>
                  <div className="text-lg font-bold mt-0.5">₹50,000</div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">Designated Cash Float</span>
                </div>
              </div>

              <div className="rounded-lg border overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Category</th>
                      <th className="p-3 font-medium">Description</th>
                      <th className="p-3 font-medium text-right">Amount</th>
                      <th className="p-3 font-medium text-center">Receipt</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(Array.isArray(expenses) ? expenses : []).map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-muted-foreground">
                          {exp.expenseDate ? format(new Date(exp.expenseDate), "yyyy-MM-dd") : "—"}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize text-[11px]">
                            {exp.category}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium text-foreground">{exp.description}</td>
                        <td className="p-3 text-right font-bold text-foreground">{INR.format(exp.amount)}</td>
                        <td className="p-3 text-center">
                          {exp.receiptUrl ? (
                            <a
                              href={exp.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-primary hover:underline gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge status={exp.status} />
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {(exp.status === "submitted" || exp.status === "draft") && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
                                onClick={async () => {
                                  try {
                                    await updateExpense.mutateAsync({ id: exp.id, data: { status: "approved" } });
                                    await qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
                                    toast({ title: "Approved", description: "Site expense approved." });
                                  } catch (err: any) {
                                    toast({ title: "Error", description: err.message, variant: "destructive" });
                                  }
                                }}
                              >
                                <Check className="w-3 h-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-red-500/40 text-red-700 hover:bg-red-50 dark:text-red-400"
                                onClick={async () => {
                                  try {
                                    await updateExpense.mutateAsync({ id: exp.id, data: { status: "rejected" } });
                                    await qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
                                    toast({ title: "Rejected", description: "Site expense marked rejected.", variant: "destructive" });
                                  } catch (err: any) {
                                    toast({ title: "Error", description: err.message, variant: "destructive" });
                                  }
                                }}
                              >
                                <X className="w-3 h-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {exp.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-purple-500/40 text-purple-700 hover:bg-purple-50 dark:text-purple-400"
                              onClick={async () => {
                                try {
                                  await updateExpense.mutateAsync({ id: exp.id, data: { status: "reimbursed" } });
                                  await qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
                                  toast({ title: "Reimbursed", description: "Site expense marked reimbursed." });
                                } catch (err: any) {
                                  toast({ title: "Error", description: err.message, variant: "destructive" });
                                }
                              }}
                            >
                              <Wallet className="w-3 h-3 mr-1" /> Reimburse
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(expenses || []).length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No site expenses logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: BUDGET VS ACTUAL COST VARIANCE                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="budget" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Cost Code Budget Variance
                  {varianceData?.overall.isOverallOverBudget ? (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Over Budget
                    </Badge>
                  ) : varianceData?.overall.isOverallWarning ? (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3 mr-1" /> Near Capacity (≥90%)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Budget Healthy
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Tracking committed POs, subcontracts, and direct expenses against package budget allocations
                </CardDescription>
              </div>
              <div className="text-right text-xs">
                <span className="text-muted-foreground">Overall Capacity: </span>
                <span
                  className={`text-sm font-bold font-mono ml-1 ${
                    varianceData?.overall.isOverallOverBudget
                      ? "text-rose-600"
                      : varianceData?.overall.isOverallWarning
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {varianceData?.overall.overallUtilizationPercent || "0.0"}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Alert Banners if any */}
              {criticalVarianceAlerts.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-red-800 dark:text-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Budget Overrun Alert ({criticalVarianceAlerts.length} package exceeded limit)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {criticalVarianceAlerts.map((a) => (
                      <Badge key={a.id} variant="destructive" className="text-xs py-0.5 px-2">
                        {a.costCode}: {a.description} — {a.utilizationPercent}% consumed
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-muted/40 p-3 rounded-lg border">
                  <span className="text-muted-foreground">1. Sanctioned Budget</span>
                  <div className="text-base font-bold text-foreground mt-1">
                    {INR.format(varianceData?.overall.totalBudget || projectBudget)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">All packages combined</span>
                </div>
                <div className="bg-purple-50 text-purple-900 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800 p-3 rounded-lg">
                  <span className="text-purple-700 dark:text-purple-400 font-medium">2. Committed (POs / WO)</span>
                  <div className="text-base font-bold mt-1">
                    {INR.format(varianceData?.overall.totalCommitted || 0)}
                  </div>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400">POs & Subcontracts</span>
                </div>
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 p-3 rounded-lg">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">3. Actual Spend</span>
                  <div className="text-base font-bold mt-1">
                    {INR.format(varianceData?.overall.totalActual || 0)}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Paid invoices & expenses</span>
                </div>
                <div className={`p-3 rounded-lg border ${
                  varianceData?.overall.isOverallOverBudget
                    ? "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
                    : "bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800"
                }`}>
                  <span className="font-medium">4. Total Consumed</span>
                  <div className="text-base font-bold mt-1 font-mono">
                    {INR.format(varianceData?.overall.totalConsumed || 0)}
                  </div>
                  <span className="text-[10px]">
                    {varianceData?.overall.isOverallOverBudget
                      ? `Over budget: ${INR.format(Math.abs(varianceData?.overall.overallVariance || 0))}`
                      : `Headroom: ${INR.format(varianceData?.overall.overallVariance || 0)}`}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Cost Code</th>
                      <th className="p-3 font-medium">Package Scope</th>
                      <th className="p-3 font-medium text-right">Budgeted</th>
                      <th className="p-3 font-medium text-right">Committed</th>
                      <th className="p-3 font-medium text-right">Actual Spent</th>
                      <th className="p-3 font-medium text-right">Total Consumed</th>
                      <th className="p-3 font-medium text-right">Headroom</th>
                      <th className="p-3 font-medium text-center">Capacity</th>
                      <th className="p-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(varianceData?.packages || []).map((b) => {
                      const isCritical = b.severity === "critical";
                      const isWarning = b.severity === "warning";
                      const pct = Math.min(100, Math.max(0, b.utilizationPercent));

                      return (
                        <tr
                          key={b.id}
                          className={`hover:bg-muted/20 transition-colors ${
                            isCritical ? "bg-red-50/50 dark:bg-red-950/20" : isWarning ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                          }`}
                        >
                          <td className="p-3 font-mono font-medium text-primary">{b.costCode}</td>
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{b.description}</div>
                            {b.category && (
                              <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">
                                {b.category}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-medium">{INR.format(b.budgeted)}</td>
                          <td className="p-3 text-right font-mono text-purple-600 dark:text-purple-400 font-medium">
                            {INR.format(b.committed)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            {INR.format(b.actual)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-foreground">
                            {INR.format(b.consumed)}
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              b.variance < 0 ? "text-rose-600" : "text-emerald-600"
                            }`}
                          >
                            {b.variance < 0 ? `-${INR.format(Math.abs(b.variance))}` : `+${INR.format(b.variance)}`}
                          </td>
                          <td className="p-3 text-center min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    isCritical
                                      ? "bg-rose-500"
                                      : isWarning
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="font-mono text-[10px] font-bold shrink-0">
                                {b.utilizationPercent}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant="outline"
                              className={
                                isCritical
                                  ? "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 font-bold"
                                  : isWarning
                                  ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 font-semibold"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400"
                              }
                            >
                              {isCritical
                                ? `Over (-${INR.format(Math.abs(b.variance))})`
                                : isWarning
                                ? `Warning (${b.utilizationPercent}%)`
                                : `Healthy (+${INR.format(b.variance)})`}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {(varianceData?.packages || []).length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                          No budget items configured for this project.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: FINANCIAL AUDIT TRAIL (IMMUTABLE COMPLIANCE LOG)             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  Financial Audit Trail & Compliance Log
                </CardTitle>
                <CardDescription className="text-xs">
                  Chronological record of AR billing steps, AP 3-way match, payment release, and site expense approvals
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs font-mono">
                {projectAuditLogs.length} Events Logged
              </Badge>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Timestamp</th>
                      <th className="p-3 font-medium">Workflow</th>
                      <th className="p-3 font-medium">Action & Entity</th>
                      <th className="p-3 font-medium">Status Transition</th>
                      <th className="p-3 font-medium">Authorized By</th>
                      <th className="p-3 font-medium">Audit Remarks</th>
                      <th className="p-3 font-medium text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {projectAuditLogs.map((log) => {
                      const isAR = log.workflowType === "AR";
                      const isAP = log.workflowType === "AP";

                      return (
                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm")}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-semibold ${
                                isAR
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                                  : isAP
                                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                              }`}
                            >
                              {log.workflowType}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-foreground">
                              {log.action.replace(/_/g, " ")}
                            </div>
                            <div className="text-[10px] text-muted-foreground capitalize">
                              {log.entityType.replace(/_/g, " ")} #{log.entityId}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {log.previousStatus && (
                                <>
                                  <span className="text-muted-foreground font-mono text-[10px]">
                                    {log.previousStatus}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                </>
                              )}
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px]">
                                {log.newStatus}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-foreground">
                            {log.userName || `User #${log.userId}`}
                          </td>
                          <td className="p-3 text-muted-foreground max-w-[260px] truncate">
                            {log.comments || "—"}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setSelectedAuditLog(log)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {projectAuditLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No financial audit entries logged for this project yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs for AR Actions ── */}
      {/* Certify Payment Dialog */}
      <Dialog open={certifyDialog.open} onOpenChange={(o) => setCertifyDialog({ ...certifyDialog, open: o })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Client Payment Certificate</DialogTitle>
            <DialogDescription>
              Record the formal payment certificate received from the Client's Architect / PMC.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium">Certificate Number</label>
              <Input
                value={certifyForm.certificateNumber}
                onChange={(e) => setCertifyForm({ ...certifyForm, certificateNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Certified Amount (₹)</label>
              <Input
                type="number"
                value={certifyForm.certifiedAmount}
                onChange={(e) => setCertifyForm({ ...certifyForm, certifiedAmount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Payment Due Date</label>
              <Input
                type="date"
                value={certifyForm.paymentDueDate}
                onChange={(e) => setCertifyForm({ ...certifyForm, paymentDueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCertifyDialog({ open: false })}>Cancel</Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={async () => {
                if (!certifyDialog.billId || !certifyForm.certificateNumber) return;
                try {
                  await certifyPaymentAR.mutateAsync({
                    id: certifyDialog.billId,
                    data: {
                      certificateNumber: certifyForm.certificateNumber,
                      certifiedAmount: Number(certifyForm.certifiedAmount || 0),
                      paymentDueDate: certifyForm.paymentDueDate,
                    },
                  });
                  toast({ title: "Certified", description: "Payment certificate recorded successfully." });
                  setCertifyDialog({ open: false });
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                }
              }}
            >
              Confirm Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Client Remittance Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(o) => setPaymentDialog({ ...paymentDialog, open: o })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Client Remittance</DialogTitle>
            <DialogDescription>
              Record the client payment receipt into our bank account with UTR reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium">Remitted Amount (₹)</label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Payment Mode</label>
              <Select
                value={paymentForm.paymentMode}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentMode: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">NEFT / RTGS</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Bank UTR / Cheque Number</label>
              <Input
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Remittance Notes</label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaymentDialog({ open: false })}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={async () => {
                if (!paymentDialog.invoiceId || !paymentForm.amount) return;
                try {
                  await recordARPayment.mutateAsync({
                    invoiceId: paymentDialog.invoiceId,
                    data: {
                      amount: Number(paymentForm.amount),
                      paymentMode: paymentForm.paymentMode,
                      referenceNumber: paymentForm.referenceNumber,
                      notes: paymentForm.notes,
                    },
                  });
                  toast({ title: "Remittance Recorded", description: "Client payment logged successfully." });
                  setPaymentDialog({ open: false });
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                }
              }}
            >
              Save Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Vendor Dialog */}
      <Dialog open={payVendorDialog.open} onOpenChange={(o) => setPayVendorDialog({ ...payVendorDialog, open: o })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Release Vendor Payment</DialogTitle>
            <DialogDescription>
              Record vendor disbursement voucher and log the UTR transaction number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium">Disbursed Amount (₹)</label>
              <Input
                type="number"
                value={payVendorForm.amount}
                onChange={(e) => setPayVendorForm({ ...payVendorForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Disbursement Mode</label>
              <Select
                value={payVendorForm.paymentMode}
                onValueChange={(v) => setPayVendorForm({ ...payVendorForm, paymentMode: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neft_rtgs">NEFT / RTGS</SelectItem>
                  <SelectItem value="cheque">Bank Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Direct Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Bank UTR / Transaction #</label>
              <Input
                value={payVendorForm.referenceNumber}
                onChange={(e) => setPayVendorForm({ ...payVendorForm, referenceNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Voucher Notes</label>
              <Textarea
                value={payVendorForm.notes}
                onChange={(e) => setPayVendorForm({ ...payVendorForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayVendorDialog({ open: false })}>Cancel</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={async () => {
                if (!payVendorDialog.invoiceId || !payVendorForm.amount) return;
                try {
                  await payVendor.mutateAsync({
                    invoiceId: payVendorDialog.invoiceId,
                    paymentAmount: Number(payVendorForm.amount),
                    paymentDate: new Date().toISOString().split("T")[0],
                    paymentMode: payVendorForm.paymentMode,
                    bankReference: payVendorForm.referenceNumber,
                    remarks: payVendorForm.notes,
                  });
                  toast({ title: "Payment Released", description: "Vendor voucher recorded." });
                  setPayVendorDialog({ open: false });
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                }
              }}
            >
              Confirm Disbursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Financial Audit Log Detail Modal ── */}
      {selectedAuditLog && (
        <Dialog open={!!selectedAuditLog} onOpenChange={(o) => { if (!o) setSelectedAuditLog(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={`text-xs uppercase font-semibold ${
                    selectedAuditLog.workflowType === "AR"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                  }`}
                >
                  {selectedAuditLog.workflowType} &bull; {selectedAuditLog.entityType.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">ID #{selectedAuditLog.id}</span>
              </div>
              <DialogTitle className="text-lg">
                {selectedAuditLog.action.replace(/_/g, " ")}
              </DialogTitle>
              <DialogDescription>
                Recorded on {format(new Date(selectedAuditLog.createdAt), "MMMM dd, yyyy 'at' hh:mm:ss a")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-lg border">
                <div>
                  <span className="text-muted-foreground">Authorized Signatory</span>
                  <div className="font-semibold text-foreground mt-0.5">{selectedAuditLog.userName || `User #${selectedAuditLog.userId}`}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status Transition</span>
                  <div className="font-semibold text-foreground mt-0.5">
                    {selectedAuditLog.previousStatus || "Initial"} &rarr; <span className="text-emerald-400 font-semibold">{selectedAuditLog.newStatus}</span>
                  </div>
                </div>
              </div>
              {selectedAuditLog.comments && (
                <div className="bg-muted/30 p-3 rounded border">
                  <span className="text-muted-foreground font-semibold">Audit Remarks</span>
                  <div className="mt-1 text-foreground">{selectedAuditLog.comments}</div>
                </div>
              )}
              {selectedAuditLog.metadata && Object.keys(selectedAuditLog.metadata).length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-muted-foreground">Recorded Financial Parameters</span>
                  <div className="rounded border bg-muted/20 p-2 font-mono divide-y divide-border/40 max-h-48 overflow-y-auto">
                    {Object.entries(selectedAuditLog.metadata).map(([k, v]) => (
                      <div key={k} className="py-1 flex justify-between gap-2">
                        <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:</span>
                        <span className="font-bold text-foreground truncate max-w-[260px]">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedAuditLog(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
