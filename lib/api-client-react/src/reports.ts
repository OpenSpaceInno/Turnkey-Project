import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProgressReportProject {
  projectId: number;
  projectName: string;
  clientName: string;
  location: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number;
  plannedProgress: number;
  actualProgress: number;
  variancePercent: number;
  varianceDisplay: string;
  timelineHealth: "Ahead" | "On Track" | "Minor Risk" | "Critical Delay";
  activeMilestone: string;
  targetHandover: string;
  sCurve: Array<{ month: string; planned: number; actual: number }>;
  dprCount: number;
  totalManpowerToday: number;
  openSnagsCount: number;
  latestDpr: {
    id: number;
    date: string;
    weather: string;
    shift: string;
    workSummary: string;
    manpowerCount: number;
    siteIssues: string | null;
  } | null;
}

export interface ProgressSummaryResponse {
  portfolioSummary: {
    totalSites: number;
    avgPlannedProgress: number;
    avgActualProgress: number;
    aheadCount: number;
    onTrackCount: number;
    delayedCount: number;
    totalActiveWorkforce: number;
  };
  projects: ProgressReportProject[];
}

export interface ProjectPnLItem {
  projectId: number;
  projectName: string;
  clientName: string;
  contractBudget: number;
  progressPercent: number;
  clientInvoiced: number;
  clientCollected: number;
  clientReceivable: number;
  committedPOs: number;
  vendorBilled: number;
  siteExpenses: number;
  actualCostIncurred: number;
  actualDisbursed: number;
  vendorPayable: number;
  grossProfit: number;
  profitMarginPercent: number;
  cashMargin: number;
  marginHealth: "healthy" | "moderate" | "at_risk" | "overrun";
}

export interface ProjectPnLResponse {
  portfolioTotals: {
    totalBudget: number;
    totalClientInvoiced: number;
    totalClientCollected: number;
    totalClientReceivable: number;
    totalCommittedPOs: number;
    totalActualCost: number;
    totalDisbursed: number;
    totalVendorPayable: number;
    totalGrossProfit: number;
    overallMarginPercent: number;
    totalCashMargin: number;
  };
  projects: ProjectPnLItem[];
}

export interface ProcurementSummaryResponse {
  materialRequests: {
    totalRequests: number;
    pendingApproval: number;
    approved: number;
    poIssued: number;
    fulfilled: number;
    avgLeadDays: number;
  };
  purchaseOrders: {
    totalPOs: number;
    totalCommittedValue: number;
    deliveredPOsCount: number;
    deliveredValue: number;
    pendingDeliveryValue: number;
  };
  vendorBreakdown: Array<{
    vendorId: number;
    name: string;
    category: string;
    poCount: number;
    totalSpend: number;
    onTimeDeliveryRate: string;
    qualityPassRate: string;
    tierRating: string;
  }>;
  inventory: {
    totalItemsTracked: number;
    totalStockValuation: number;
    lowStockItemsCount: number;
    topStockItems: Array<{
      id: number;
      itemCode: string;
      itemName: string;
      category: string;
      unit: string;
      availableQuantity: number;
      reorderLevel: number;
      averageCost: number;
      status: string;
    }>;
  };
}

export interface CashFlowMonthlyStatement {
  month: string;
  monthKey: string;
  clientInflow: number;
  vendorOutflow: number;
  siteExpensesOutflow: number;
  totalOutflow: number;
  netCashFlow: number;
  cumulativeBalance: number;
  status: "Surplus" | "Deficit";
}

export interface CashFlowResponse {
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netCashPosition: number;
    closingTreasuryBalance: number;
    burnRatio: number;
  };
  monthlyStatements: CashFlowMonthlyStatement[];
}

export interface QualitySafetyResponse {
  qaSummary: {
    totalInspections: number;
    approvedInspections: number;
    rejectedInspections: number;
    firstTimeRightRate: number;
  };
  snagSummary: {
    totalSnags: number;
    closedSnags: number;
    openSnags: number;
    clearanceRate: number;
    avgResolutionDays: number;
  };
  hseSummary: {
    safeManHoursWorked: number;
    lostTimeInjuries: number;
    minorFirstAidIncidents: number;
    toolboxTalksCompleted: number;
    hseAuditScore: string;
  };
  statutoryChecklist: Array<{
    item: string;
    status: string;
    audit: string;
    rating: string;
  }>;
  recentSnags: any[];
}

export interface VendorLedgerEntry {
  id: number;
  invoiceNumber: string;
  invoiceDate: string | null;
  dueDate: string | null;
  vendorId: number;
  vendorName: string;
  projectId: number;
  projectName: string;
  purchaseOrderId: number | null;
  poNumber: string;
  grossAmount: number;
  taxAmount: number;
  tdsAmount: number;
  netPayableAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentDate: string | null;
  status: string;
  reconciliationRemarks: string;
}

export interface VendorPaymentLedgerResponse {
  summary: {
    totalEntries: number;
    totalGrossAmount: number;
    totalTdsDeducted: number;
    totalNetPayable: number;
    totalDisbursed: number;
    totalOutstanding: number;
  };
  ledgerEntries: VendorLedgerEntry[];
  vendors: Array<{ id: number; name: string }>;
}

export interface EVMProjectReport {
  projectId: number;
  projectName: string;
  clientName: string;
  bac: number;
  plannedProgress: number;
  actualProgress: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  vac: number;
  costStatus: "Under Budget" | "On Budget" | "Over Budget";
  scheduleStatus: "Ahead of Schedule" | "On Schedule" | "Behind Schedule";
  overallEVMHealth: "Optimal" | "Good" | "Needs Attention" | "Critical";
}

export interface EVMAnalysisResponse {
  portfolioRollup: {
    bac: number;
    pv: number;
    ev: number;
    ac: number;
    cv: number;
    sv: number;
    cpi: number;
    spi: number;
    eac: number;
    vac: number;
    costStatus: string;
    scheduleStatus: string;
  };
  projectReports: EVMProjectReport[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useProjectProgressSummary(projectId?: string | number) {
  const pId = projectId && projectId !== "all" ? projectId : undefined;
  return useQuery({
    queryKey: ["reports", "progress-summary", pId],
    queryFn: () =>
      customFetch<ProgressSummaryResponse>("/api/reports/progress-summary", {
        params: pId ? { projectId: pId } : undefined,
      }),
  });
}

export function useProjectPnL(projectId?: string | number) {
  const pId = projectId && projectId !== "all" ? projectId : undefined;
  return useQuery({
    queryKey: ["reports", "project-pnl", pId],
    queryFn: () =>
      customFetch<ProjectPnLResponse>("/api/reports/project-pnl", {
        params: pId ? { projectId: pId } : undefined,
      }),
  });
}

export function useProcurementReportSummary(projectId?: string | number) {
  const pId = projectId && projectId !== "all" ? projectId : undefined;
  return useQuery({
    queryKey: ["reports", "procurement-summary", pId],
    queryFn: () =>
      customFetch<ProcurementSummaryResponse>("/api/reports/procurement-summary", {
        params: pId ? { projectId: pId } : undefined,
      }),
  });
}

export function useCashFlowStatement(projectId?: string | number) {
  const pId = projectId && projectId !== "all" ? projectId : undefined;
  return useQuery({
    queryKey: ["reports", "cash-flow", pId],
    queryFn: () =>
      customFetch<CashFlowResponse>("/api/reports/cash-flow", {
        params: pId ? { projectId: pId } : undefined,
      }),
  });
}

export function useQualitySafetySummary(projectId?: string | number) {
  const pId = projectId && projectId !== "all" ? projectId : undefined;
  return useQuery({
    queryKey: ["reports", "quality-safety-summary", pId],
    queryFn: () =>
      customFetch<QualitySafetyResponse>("/api/reports/quality-safety-summary", {
        params: pId ? { projectId: pId } : undefined,
      }),
  });
}

export function useVendorPaymentLedger(filters?: { vendorId?: string | number; projectId?: string | number }) {
  const vId = filters?.vendorId && filters.vendorId !== "all" ? filters.vendorId : undefined;
  const pId = filters?.projectId && filters.projectId !== "all" ? filters.projectId : undefined;
  return useQuery({
    queryKey: ["reports", "vendor-payment-ledger", vId, pId],
    queryFn: () =>
      customFetch<VendorPaymentLedgerResponse>("/api/reports/vendor-payment-ledger", {
        params: {
          ...(vId ? { vendorId: vId } : {}),
          ...(pId ? { projectId: pId } : {}),
        },
      }),
  });
}

export function useEVMAnalysis(projectId?: string | number) {
  const pId = projectId && projectId !== "all" ? projectId : undefined;
  return useQuery({
    queryKey: ["reports", "evm-analysis", pId],
    queryFn: () =>
      customFetch<EVMAnalysisResponse>("/api/reports/evm-analysis", {
        params: pId ? { projectId: pId } : undefined,
      }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV & PDF EXPORT UTILITY (FR-RPT-08)
// ═══════════════════════════════════════════════════════════════════════════════

export function exportToCSV(
  filename: string,
  rows: Record<string, any>[],
  columns: Array<{ key: string; label: string }>
) {
  if (!rows || rows.length === 0) return;

  const headerRow = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(",");
  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headerRow, ...dataRows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
