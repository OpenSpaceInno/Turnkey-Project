import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetProjectJourney,
  useSeedProjectJourney,
  useGetProjectSetupChecklist,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2, CheckCircle2, ArrowRight, ArrowDown, FileText, ShoppingCart,
  ShieldCheck, CreditCard, RefreshCw, Layers, Wallet,
  ArrowUpRight, Scale, Sparkles, Check, ChevronRight,
  ChevronLeft, Info, Receipt, HardHat, Award, ArrowDownRight,
  TrendingUp, CircleDot, Banknote, Calendar, UserCheck, FileCheck2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectTeamManager } from "@/components/project/project-team-manager";

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

interface ProjectJourneyProps {
  projectId: number;
  initialPhaseId?: number;
  onNavigateTab?: (tab: string) => void;
}

export interface PhaseMeta {
  id: number;
  title: string;
  tagline: string;
  icon: any;
  color: string;
  badgeColor: string;
  summary: string;
  purpose: string;
  rule: string;
  actionUrl: string;
  actionText: string;
}

const PHASES: PhaseMeta[] = [
  {
    id: 1,
    title: "1. Planning & Budget",
    tagline: "Mobilization Prerequisites & Cost Codes",
    icon: Building2,
    color: "sky",
    badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    summary: "7-point mobilization checklist, baseline tasks, milestones & cost codes.",
    purpose: "Before site mobilization, the tender award is divided into structured cost codes (Civil, MEP, Finishing), client contract is signed, and team/vendors are mapped to prevent scope creep.",
    rule: "All material requisitions and subcontract work orders must reference an authorized cost code with uncommitted funds.",
    actionUrl: "/tasks",
    actionText: "Open WBS & Tasks",
  },
  {
    id: 2,
    title: "2. Procurement & Quality",
    tagline: "MR → RFQ → PO → Delivery QC",
    icon: ShoppingCart,
    color: "indigo",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    summary: "Competitive tender sourcing, purchase order, gate delivery & lab QC clearance.",
    purpose: "Source raw construction materials through transparent L1 vendor bidding, formal PO issuance, and gate inward GRN inspection with NABL slump/tensile testing.",
    rule: "Zero material entry without physical Goods Receipt Note (GRN) and IS 456 / IS 1786 lab quality clearance.",
    actionUrl: "/procurement",
    actionText: "Procurement Console",
  },
  {
    id: 3,
    title: "3. Site Execution (JMR)",
    tagline: "Contract BOQ & Certified JMR",
    icon: HardHat,
    color: "amber",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    summary: "Trade contract execution, joint field measurements & cube compressive tests.",
    purpose: "Execute trade subcontractor agreements with itemized BOQ rates, followed by physical on-site Joint Measurement Records (JMR) with geo-tagged pour photos.",
    rule: "Client RA bills can only be drafted against work items backed by an approved, signed Joint Measurement Record (JMR).",
    actionUrl: "/site-execution",
    actionText: "Site Execution",
  },
  {
    id: 4,
    title: "4. Billing & Handover",
    tagline: "RA Bill → Invoice → RTGS → Handover",
    icon: Receipt,
    color: "emerald",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    summary: "Interim RA bill abstract, tax invoice, bank RTGS receipt & Virtual Completion Certificate.",
    purpose: "Compile certified JMRs into statutory client RA Bills, collect electronic RTGS remittances, clear snag punch-lists, and issue Virtual Completion Certificate (VCC).",
    rule: "Final DLP retention release requires zero open snags and sign-off of Virtual Completion Certificate (VCC).",
    actionUrl: "/ra-bills",
    actionText: "RA Bills Hub",
  },
];

export function ProjectJourneyView({ projectId, initialPhaseId, onNavigateTab }: ProjectJourneyProps) {
  const [, setLocation] = useLocation();
  const { data: journey, isLoading, refetch, isFetching } = useGetProjectJourney(projectId);
  const { data: setupChecklist, refetch: refetchChecklist } = useGetProjectSetupChecklist(projectId);
  const seedMutation = useSeedProjectJourney();
  const { toast } = useToast();

  const [activePhaseId, setActivePhaseId] = useState<number>(() => {
    if (initialPhaseId && [1, 2, 3, 4].includes(initialPhaseId)) {
      return initialPhaseId;
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const phaseParam = params.get("phase");
      if (phaseParam && [1, 2, 3, 4].includes(Number(phaseParam))) {
        return Number(phaseParam);
      }
    }
    return 1; // Default to Phase 1 (Planning & Budget)
  });
  const [activeTab, setActiveTab] = useState<"flow" | "documents" | "financials">("flow");
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const scrollToTeamSection = () => {
    if (activePhaseId !== 1) {
      setActivePhaseId(1);
    }
    setTimeout(() => {
      const el = document.getElementById("project-team-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-4", "ring-primary/40", "shadow-xl", "rounded-xl", "transition-all", "duration-500");
        setTimeout(() => {
          el.classList.remove("ring-4", "ring-primary/40", "shadow-xl");
        }, 2500);
      }
    }, 50);
  };

  const handleSyncScenario = () => {
    seedMutation.mutate(projectId, {
      onSuccess: () => {
        toast({
          title: "Scenario Synchronized",
          description: "All lifecycle stages populated with live interconnected records.",
        });
        refetch();
        refetchChecklist();
      },
      onError: (err: any) => {
        toast({
          title: "Sync Failed",
          description: err.message || "Failed to sync scenario data",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 border rounded-xl bg-card shadow-sm">
        <RefreshCw className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading Turnkey Project Lifecycle Journey...</p>
      </div>
    );
  }

  if (!journey || !journey.project) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-xl">Initialize Turnkey Lifecycle Scenario</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            This project does not yet have interconnected sample data across the turnkey lifecycle.
          </p>
          <Button onClick={handleSyncScenario} disabled={seedMutation.isPending} size="lg" className="gap-2">
            {seedMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Complete Turnkey Data Scenario
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { project, tasks, budgetItems, procurement, contract, workCompletion, raBill, invoice, vendorAP, expenses, handover } = journey;

  // Clear, Intuitive Financial Calculations
  const contractBudget = Number(project.budget) || 85000000;
  const milestoneGrossBilled = Number(raBill?.grossAmount) || 1090000;
  const gstAmount = Number(raBill?.gstAmount) || 196200;
  const retentionHeld = Number(raBill?.retentionAmount) || 54500;
  const tdsDeducted = Number(raBill?.tdsAmount) || 21800;
  const netClientRemittance = Number(invoice?.totalPaidAmount) || (milestoneGrossBilled + gstAmount - retentionHeld - tdsDeducted);

  // Direct Costs for this milestone
  const vendorPOAmount = Number(procurement?.purchaseOrder?.totalAmount) || 1149320;
  const vendorNetBase = Number(vendorAP?.invoice?.grossAmount) || 974000;
  const directExpensesTotal = (expenses || []).reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0) || 63500;
  const totalDirectCosts = vendorNetBase + directExpensesTotal; // ₹9,74,000 + ₹63,500 = ₹10,37,500

  // Realized Milestone Margin
  const milestoneProfit = milestoneGrossBilled - totalDirectCosts; // ₹10,90,000 - ₹10,37,500 = ₹52,500
  const realizedMarginPercent = milestoneGrossBilled > 0 ? ((milestoneProfit + retentionHeld) / milestoneGrossBilled) * 100 : 14.2;

  const activePhase = PHASES.find(p => p.id === activePhaseId) || PHASES[0];

  // 7-Point Turnkey Baseline & Mobilization Checklist
  // navigateTab: if set, clicking the button calls onNavigateTab(navigateTab) to switch the
  //              parent ProjectDetail tab in-place (no URL navigation needed).
  // actionUrl:   used only when navigateTab is absent — either a hash anchor (#...) or an
  //              external route (/contracts).
  const defaultChecklistItems = [
    {
      key: "client",
      title: "Client Profile & Ownership",
      description: "Customer or client entity designated for the contract.",
      completed: true,
      actionUrl: "#project-profile",
      actionLabel: "View Client",
      navigateTab: undefined as string | undefined,
    },
    {
      key: "budget",
      title: "Commercial Budget Baseline",
      description: "Approved monetary budget allocated for execution.",
      completed: true,
      actionUrl: "",
      actionLabel: "Review Budget",
      navigateTab: "budget",
    },
    {
      key: "contract",
      title: "Client Contract Recorded",
      description: "Formal agreement signed with client terms and advance/retention rates.",
      completed: true,
      actionUrl: `/contracts?projectId=${projectId}`,
      actionLabel: "View Contract",
      navigateTab: undefined as string | undefined,
    },
    {
      key: "boq",
      title: "BOQ & Cost Scope Defined",
      description: "Detailed line items or budget cost codes defined for tracking.",
      completed: true,
      actionUrl: "",
      actionLabel: "Review Scope",
      navigateTab: "commercial",
    },
    {
      key: "team",
      title: "Internal Project Team Assigned",
      description: "Site engineers, managers, and commercial personnel mapped.",
      completed: true,
      actionUrl: "#project-team-section",
      actionLabel: "Manage Team",
      navigateTab: undefined as string | undefined,
    },
    {
      key: "vendors",
      title: "Vendors & Subcontractors Assigned",
      description: "Key trade suppliers and sub-contract work orders linked.",
      completed: true,
      actionUrl: "",
      actionLabel: "Assign Vendors",
      navigateTab: "vendors",
    },
    {
      key: "milestones",
      title: "Billing Milestones Configured",
      description: "Stage-to-billing milestone percentages set for RA bill generation.",
      completed: true,
      actionUrl: "",
      actionLabel: "View Milestones",
      navigateTab: "commercial",
    },
  ];

  // Merge API checklist items with our navigateTab logic
  const TAB_MAP: Record<string, string> = {
    budget: "budget",
    boq: "commercial",
    milestones: "commercial",
    vendors: "vendors",
  };
  const checklistItems = setupChecklist?.items && setupChecklist.items.length > 0
    ? setupChecklist.items.map((item) => {
        let actionUrl = TAB_MAP[item.key] ? "" : (item.actionUrl ?? "");
        if (item.key === "contract") {
          actionUrl = `/contracts?projectId=${projectId}`;
        }
        if (item.key === "team") {
          actionUrl = "#project-team-section";
        }
        return {
          ...item,
          actionLabel: item.key === "vendors" ? "Assign Vendors" : item.actionLabel,
          navigateTab: TAB_MAP[item.key] as string | undefined,
          actionUrl,
        };
      })
    : defaultChecklistItems;

  const completedChecklistCount = checklistItems.filter((i) => i.completed).length;
  const totalChecklistCount = checklistItems.length;

  const getPhaseActionUrl = (phaseId: number, prjId: number) => {
    // Always encode the journey tab URL as `from` so the Back button on destination
    // pages always returns to exactly the Lifecycle Map tab, regardless of the
    // actual URL in the browser (ProjectDetail manages tabs via useState, not URL).
    const fromUrl = `/projects/${prjId}?tab=journey`;
    const encodedFrom = encodeURIComponent(fromUrl);

    switch (phaseId) {
      case 1:
        return `/tasks?projectId=${prjId}&view=phases&from=${encodedFrom}`;
      case 2:
        return `/procurement?projectId=${prjId}&from=${encodedFrom}`;
      case 3:
        return `/site-execution?projectId=${prjId}&from=${encodedFrom}`;
      case 4:
        return `/ra-bills?projectId=${prjId}&from=${encodedFrom}`;
      default:
        return `/tasks?projectId=${prjId}&view=phases&from=${encodedFrom}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Clean Project Header & Controls ── */}
      <Card id="project-profile" className="border shadow-sm bg-card">
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <Building2 className="h-7 w-7 text-primary shrink-0" />
                {project.name}
              </h1>

              <p className="text-muted-foreground text-xs md:text-sm">
                Client: <strong className="text-foreground">{project.clientName}</strong> &bull; Location: {project.location || "Mumbai"} &bull; Total Contract Value: <strong className="text-foreground">{INR.format(contractBudget)}</strong>
              </p>

              {project.description && (
                <div className="pt-2 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Project Scope & Description:</span> {project.description}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9"
                onClick={() => {
                  refetch();
                  refetchChecklist();
                }}
                disabled={isFetching}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-xs h-9"
                onClick={handleSyncScenario}
                disabled={seedMutation.isPending}
              >
                {seedMutation.isPending ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                Sync Complete Scenario
              </Button>
            </div>
          </div>

          <Separator />

          {/* ── 2. Simple, Understandable Financial Summary Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/30 border rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Contract Budget
              </span>
              <div className="text-xl font-bold text-foreground">
                {INR.format(contractBudget)}
              </div>
              <span className="text-[11px] text-muted-foreground block">
                Full Turnkey Tender Scope
              </span>
            </div>

            <div className="bg-muted/30 border rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Milestone 1 Work Billed
              </span>
              <div className="text-xl font-bold text-foreground">
                {INR.format(milestoneGrossBilled)}
              </div>
              <span className="text-[11px] text-muted-foreground block">
                Gross Abstract + {INR.format(gstAmount)} GST
              </span>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Client Remittance Received
              </span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {INR.format(netClientRemittance)}
              </div>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 block">
                100% Settled via Bank RTGS
              </span>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                Realized Milestone Margin
              </span>
              <div className="text-xl font-bold text-primary flex items-center gap-1.5">
                {INR.format(milestoneProfit + retentionHeld)}
                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4">
                  +{realizedMarginPercent.toFixed(1)}%
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground block">
                Retention Held: {INR.format(retentionHeld)} (5%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Visual 4-Step Stepper (Simple & Clear) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Turnkey Lifecycle Stages
            </h2>
            <p className="text-xs text-muted-foreground">
              Click any stage below to inspect its workflow, inputs, documents, and verification trail.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 p-1 rounded-lg border">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
              <Check className="h-3 w-3" /> All 4 Phases Certified
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PHASES.map((phase) => {
            const isSelected = activePhaseId === phase.id;
            const Icon = phase.icon;

            return (
              <button
                key={phase.id}
                onClick={() => setActivePhaseId(phase.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 relative ${
                  isSelected
                    ? "bg-card border-primary shadow-md ring-2 ring-primary/20"
                    : "bg-card/70 border-border hover:border-primary/50 hover:bg-card shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    {phase.id}
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                    <Check className="h-3 w-3 mr-0.5" /> Certified
                  </Badge>
                </div>

                <div className="font-bold text-sm text-foreground mb-0.5">
                  {phase.title}
                </div>
                <div className="text-xs text-muted-foreground mb-2 line-clamp-1">
                  {phase.tagline}
                </div>

                <div className="text-[11px] font-medium text-primary bg-primary/5 p-2 rounded-md border border-primary/10">
                  {phase.summary}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Interactive Views ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="flow" className="text-xs py-2 px-3 gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Stage Details & Documents
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs py-2 px-3 gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5" /> Document Traceability
            </TabsTrigger>
            <TabsTrigger value="financials" className="text-xs py-2 px-3 gap-1.5">
              <Scale className="h-3.5 w-3.5" /> Financial Waterfall
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1 h-8"
              onClick={() => setActivePhaseId(Math.max(1, activePhaseId - 1))}
              disabled={activePhaseId <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>
            <span className="text-xs font-semibold px-2">
              Phase {activePhaseId} of 4
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1 h-8"
              onClick={() => setActivePhaseId(Math.min(4, activePhaseId + 1))}
              disabled={activePhaseId >= 4}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ── TAB 1: PHASE DETAILS & LIVE DOCUMENTS ── */}
        <TabsContent value="flow" className="m-0 space-y-4">
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-4 border-b bg-muted/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                    {activePhase.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Turnkey Stage {activePhase.id}</span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        COMPLETED &bull; 100%
                      </Badge>
                    </div>
                    <CardTitle className="text-lg md:text-xl font-bold mt-0.5">{activePhase.title}</CardTitle>
                  </div>
                </div>

                <Button size="sm" asChild className="gap-1.5 text-xs shadow-sm">
                  <Link href={getPhaseActionUrl(activePhase.id, projectId)}>
                    {activePhase.actionText} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Plain English Purpose & Governance Rule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-primary" /> What Happens In This Stage
                  </span>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/20 p-3.5 rounded-lg border">
                    {activePhase.purpose}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-amber-600" /> Commercial Governance Rule
                  </span>
                  <p className="text-xs text-muted-foreground bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-lg leading-relaxed">
                    {activePhase.rule}
                  </p>
                </div>
              </div>

              {/* Phase Specific Content */}
              {activePhaseId === 1 && (
                <div className="space-y-6">
                  {/* ── 7-Point Setup & Mobilization Prerequisites ── */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-500/5 border border-sky-500/20 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                              Turnkey Setup & Mobilization
                            </span>
                            <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5">
                              {completedChecklistCount}/{totalChecklistCount} Complete
                            </Badge>
                          </div>
                          <h4 className="text-base font-bold text-foreground">
                            Planning & Budget Governance Prerequisites
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            All {totalChecklistCount} foundational prerequisites designated for contract execution, scope baseline, and commercial control.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <Badge variant="outline" className="bg-background text-xs font-semibold py-1 px-3 border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                          <Check className="h-3.5 w-3.5 mr-1 inline" /> 100% Ready for Mobilization
                        </Badge>
                      </div>
                    </div>

                    {/* 7 Checklist Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {checklistItems.map((item, idx) => {
                        const isDone = item.completed;
                        const handleItemTrigger = () => {
                          if (item.key === "client") {
                            setClientModalOpen(true);
                          } else if (item.key === "team" || item.actionUrl === "#project-team-section") {
                            scrollToTeamSection();
                          } else if (item.navigateTab) {
                            onNavigateTab?.(item.navigateTab);
                          } else if (item.actionUrl?.startsWith("#")) {
                            const el = document.querySelector(item.actionUrl);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                          } else if (item.actionUrl) {
                            setLocation(item.actionUrl);
                          }
                        };

                        return (
                          <div
                            key={item.key || idx}
                            onClick={handleItemTrigger}
                            className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all duration-150 cursor-pointer ${
                              isDone
                                ? "bg-card border-border hover:border-primary/50 shadow-sm hover:shadow-md"
                                : "bg-amber-500/5 border-amber-500/20 shadow-sm hover:shadow-md"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Prerequisite #{idx + 1}
                                </span>
                                {isDone ? (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5 font-medium">
                                    <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] px-2 py-0.5 font-medium">
                                    <CircleDot className="h-3 w-3 mr-1 inline" /> Pending
                                  </Badge>
                                )}
                              </div>

                              <div>
                                <h5 className="font-bold text-sm text-foreground">
                                  {item.title}
                                </h5>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            {/* Action Trigger Button */}
                            {item.key === "client" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setClientModalOpen(true);
                                }}
                                className="w-full text-xs font-semibold justify-between h-8 bg-muted/20 hover:bg-primary hover:text-primary-foreground transition-colors group mt-1"
                              >
                                <span>{item.actionLabel}</span>
                                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                              </Button>
                            ) : item.navigateTab ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateTab?.(item.navigateTab!);
                                }}
                                className="w-full text-xs font-semibold justify-between h-8 bg-muted/20 hover:bg-primary hover:text-primary-foreground transition-colors group mt-1"
                              >
                                <span>{item.actionLabel}</span>
                                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                              </Button>
                            ) : item.key === "team" || item.actionUrl?.startsWith("#") ? (
                              /* Hash anchor or Team section — smooth scroll to element */
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.key === "team" || item.actionUrl === "#project-team-section") {
                                    scrollToTeamSection();
                                  } else {
                                    const el = document.querySelector(item.actionUrl);
                                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }
                                }}
                                className="w-full text-xs font-semibold justify-between h-8 bg-muted/20 hover:bg-primary hover:text-primary-foreground transition-colors group mt-1"
                              >
                                <span>{item.actionLabel}</span>
                                <ArrowDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                              </Button>
                            ) : (
                              /* External route — navigate via Link */
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs font-semibold justify-between h-8 bg-muted/20 hover:bg-primary hover:text-primary-foreground transition-colors group mt-1"
                              >
                                <Link href={item.actionUrl}>
                                  <span>{item.actionLabel}</span>
                                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Internal Project Team Management ── */}
                    <div id="project-team-section" className="pt-2">
                      <ProjectTeamManager projectId={projectId} />
                    </div>

                    <div className="border rounded-lg p-3 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">WBS Master Schedule: <strong>{tasks?.length || 4} Tasks Scheduled</strong></span>
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                          Milestone 1 (Foundation): 100% Completed
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" asChild className="h-7 text-xs gap-1 font-semibold border-primary/30 text-primary hover:bg-primary/10 shrink-0">
                        <Link href={getPhaseActionUrl(1, projectId)}>
                          Open WBS & Tasks <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* ── Allocated Budget Packages & Tasks ── */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-sky-600" /> Allocated Budget Packages & Cost Codes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(budgetItems || []).map((b: any) => (
                        <div key={b.id || b.costCode} className="border rounded-lg p-3 space-y-1.5 bg-muted/10">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="font-mono text-xs">{b.costCode}</Badge>
                            <span className="text-xs font-bold text-foreground">{INR.format(b.budgeted)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">{b.description}</div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                            <span>Committed: {INR.format(b.committed || 0)}</span>
                            <span className="text-emerald-600 font-semibold">Active</span>
                          </div>
                        </div>
                      ))}
                    </div>


                  </div>
                </div>
              )}

              {activePhaseId === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-indigo-600" /> Sourcing & Materials Chain
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="border rounded-lg p-3.5 space-y-1.5 bg-muted/10">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase">Material Requisition</div>
                      <div className="font-mono font-bold text-xs">{procurement?.materialRequest?.requestNumber || `MR-20260923-${String(projectId).padStart(4, "0")}`}</div>
                      <div className="text-xs text-muted-foreground">400 bags OPC Cement + 12 MT Rebar</div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">PM Approved</Badge>
                    </div>

                    <div className="border rounded-lg p-3.5 space-y-1.5 bg-muted/10">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase">RFQ & Bidding</div>
                      <div className="font-mono font-bold text-xs">{procurement?.rfq?.rfqNumber || `RFQ-20260923-${String(projectId).padStart(4, "0")}`}</div>
                      <div className="text-xs text-muted-foreground">2 Competitive Vendor Quotes</div>
                      <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">L1 Winner Selected</Badge>
                    </div>

                    <div className="border rounded-lg p-3.5 space-y-1.5 bg-muted/10">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase">Purchase Order</div>
                      <div className="font-mono font-bold text-xs">{procurement?.purchaseOrder?.poNumber || `PO-20260923-${String(projectId).padStart(4, "0")}`}</div>
                      <div className="text-xs font-semibold text-foreground">{INR.format(vendorPOAmount)}</div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Issued & Delivered</Badge>
                    </div>

                    <div className="border rounded-lg p-3.5 space-y-1.5 bg-muted/10">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase">Site GRN & QC Lab</div>
                      <div className="font-mono font-bold text-xs">{procurement?.receipt?.receiptNumber || `GRN-20260923-${String(projectId).padStart(4, "0")}`}</div>
                      <div className="text-xs text-emerald-600 font-medium">Slump 120mm & Tensile OK</div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">QC Passed (IS 456)</Badge>
                    </div>
                  </div>

                  {/* 3-Way Match Confirmation */}
                  <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-foreground">Accounts Payable 3-Way Match Passed</div>
                        <div className="text-[11px] text-muted-foreground">
                          Purchase Order ({procurement?.purchaseOrder?.poNumber}) = Security Gate Inward = Vendor Bill ({vendorAP?.invoice?.invoiceNumber || "VINV-01"}).
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-xs shrink-0">
                      Settled via RTGS: {INR.format(vendorPOAmount)}
                    </Badge>
                  </div>
                </div>
              )}

              {activePhaseId === 3 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-amber-600" /> Subcontract Agreements & Certified Measurements
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contract Details */}
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Trade Subcontract</span>
                        <Badge variant="outline" className="font-mono text-xs">{contract?.contractNumber || `CNT-20260923-${String(projectId).padStart(4, "0")}`}</Badge>
                      </div>
                      <div className="font-bold text-sm text-foreground">{contract?.title || "RCC Structural & Masonry Contract"}</div>
                      <div className="text-xs text-muted-foreground">Contractor: <strong>{contract?.vendorName || "BuildPro Infrastructure Ltd."}</strong> &bull; Total Value: <strong>{INR.format(contract?.totalAmount || 2860000)}</strong></div>
                      <div className="text-[11px] text-muted-foreground bg-background p-2 rounded border space-y-1">
                        <div>&bull; 5% Retention Escrow applied on each milestone bill</div>
                        <div>&bull; 2% TDS under section 194C + 18% GST Compliance</div>
                      </div>
                    </div>

                    {/* JMR Measurement Details */}
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Joint Measurement Record (JMR)</span>
                        <Badge variant="outline" className="font-mono text-xs">{workCompletion?.workCompletionNumber || `WC-20260923-${String(projectId).padStart(4, "0")}`}</Badge>
                      </div>
                      <div className="font-bold text-sm text-foreground">{workCompletion?.title || "Footings & Foundation Work Completion"}</div>
                      <div className="text-xs text-muted-foreground">Physically measured and signed by Project Manager & Site QS.</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-background rounded border">
                          <span className="text-muted-foreground block text-[10px]">M25 RMC Concrete</span>
                          <strong>100 cum poured</strong>
                        </div>
                        <div className="p-2 bg-background rounded border">
                          <span className="text-muted-foreground block text-[10px]">Fe500 Rebar Tied</span>
                          <strong>7,500 kg placed</strong>
                        </div>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 28-day NABL Cube Test Passed: 28.4 MPa (IS 456 compliant)
                      </div>
                    </div>
                  </div>

                  {/* Supporting Attachments */}
                  <div className="border rounded-lg p-3 bg-muted/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <span>Certified Attachments: <strong>Signed JMR Sheet</strong>, <strong>IS 456 Cube Test PDF</strong>, <strong>Geo-tagged Pour Photos</strong></span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      3 Verified Files Attached
                    </Badge>
                  </div>
                </div>
              )}

              {activePhaseId === 4 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" /> RA Bill, Invoicing & Handover Sign-off
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border rounded-lg p-3.5 space-y-2 bg-muted/10">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase">1. Client RA Bill Abstract</div>
                      <div className="font-mono font-bold text-xs">{raBill?.billNumber || `RA-20260923-${String(projectId).padStart(4, "0")}`}</div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex justify-between"><span>Gross:</span><strong>{INR.format(milestoneGrossBilled)}</strong></div>
                        <div className="flex justify-between text-muted-foreground"><span>Retention (5%):</span><span>-{INR.format(retentionHeld)}</span></div>
                        <div className="flex justify-between text-muted-foreground"><span>TDS (2%):</span><span>-{INR.format(tdsDeducted)}</span></div>
                        <div className="flex justify-between text-muted-foreground"><span>GST (18%):</span><span>+{INR.format(gstAmount)}</span></div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Payment Certified</Badge>
                    </div>

                    <div className="border rounded-lg p-3.5 space-y-2 bg-muted/10">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase">2. Client Tax Invoice & Remittance</div>
                      <div className="font-mono font-bold text-xs">{invoice?.invoiceNumber || `INV-20260923-${String(projectId).padStart(4, "0")}`}</div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex justify-between"><span>Net Billed:</span><strong>{INR.format(netClientRemittance)}</strong></div>
                        <div className="flex justify-between text-emerald-600"><span>Paid:</span><strong>{INR.format(netClientRemittance)}</strong></div>
                        <div className="flex justify-between text-muted-foreground"><span>Balance:</span><span>₹0 (100% Settled)</span></div>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">HDFC Bank RTGS Settled</Badge>
                    </div>

                    <div className="border rounded-lg p-3.5 space-y-2 bg-muted/10">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase">3. Completion & Handover</div>
                      <div className="font-mono font-bold text-xs">{handover?.vccNumber || `VCC-20260924-${String(projectId).padStart(4, "0")}`}</div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex justify-between"><span>Snag List:</span><strong>2/2 Resolved</strong></div>
                        <div className="flex justify-between"><span>DLP Period:</span><span>12 Months</span></div>
                        <div className="flex justify-between"><span>DLP Expiry:</span><span>Sept 2027</span></div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Provisional Handover Signed</Badge>
                    </div>
                  </div>

                  {/* Escrow Release Card */}
                  <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Award className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-foreground">Defects Liability Retention Release Schedule</div>
                        <div className="text-[11px] text-muted-foreground">
                          {INR.format(retentionHeld)} held in escrow: 50% released at VCC handover, 50% after 12-month DLP audit.
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/30 shrink-0">
                      2 Equal Tranches of {INR.format(retentionHeld / 2)}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: DOCUMENT TRACEABILITY (THE COMPLETE CHAIN) ── */}
        <TabsContent value="documents" className="m-0 space-y-4">
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                End-to-End Document Chain & Live Record Links
              </CardTitle>
              <CardDescription className="text-xs">
                Every transaction in this turnkey project is digitally linked with zero paper gaps. Click any document below to open its live module.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative border-l-2 border-primary/30 ml-4 pl-6 space-y-6">
                {/* 1. Tender Award */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-sm text-foreground">1. Tender Award & Master Contract</div>
                    <Badge variant="outline" className="text-xs font-mono w-fit">{INR.format(contractBudget)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Commercial contract with BlueWave Hospitality establishing ₹8.50 Cr ceiling baseline.</p>
                </div>

                {/* 2. Material Requisition & PO */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-sm text-foreground">2. Purchase Order ({procurement?.purchaseOrder?.poNumber || `PO-20260923-${String(projectId).padStart(4, "0")}`})</div>
                    <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs text-primary">
                      <Link href={getPhaseActionUrl(2, projectId)}>View in Procurement &rarr;</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Awarded to BuildPro Infra for 400 bags Ultratech Cement & 12 MT Fe500D rebar ({INR.format(vendorPOAmount)}).</p>
                </div>

                {/* 3. Site GRN & QC */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-sm text-foreground">3. Security Gate GRN & NABL QC Lab Approval</div>
                    <Badge variant="outline" className="text-xs font-mono text-emerald-600 border-emerald-300 w-fit">Slump 120mm &bull; Yield OK</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Consignment verified intact at site gate. Batch certified compliant with IS 456 & IS 1786.</p>
                </div>

                {/* 4. Subcontract & JMR */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-sm text-foreground">4. Joint Measurement Record ({workCompletion?.workCompletionNumber || `WC-20260923-${String(projectId).padStart(4, "0")}`})</div>
                    <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs text-primary">
                      <Link href={workCompletion?.id ? `/ra-bills/work-completions/${workCompletion.id}` : `/ra-bills?tab=work-completions&projectId=${projectId}`}>View JMR Sheet &rarr;</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Physical site verification of 100 cum M25 concrete & 7.5 MT rebar with geo-tagged pour photos.</p>
                </div>

                {/* 5. RA Bill #1 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-sm text-foreground">5. Client RA Bill ({raBill?.billNumber || `RA-20260923-${String(projectId).padStart(4, "0")}`})</div>
                    <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs text-primary">
                      <Link href={getPhaseActionUrl(4, projectId)}>View RA Bill &rarr;</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Certified abstract: Gross {INR.format(milestoneGrossBilled)} less 5% retention & 2% TDS + 18% GST.</p>
                </div>

                {/* 6. Tax Invoice & Payment */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-background" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-sm text-foreground">6. Tax Invoice ({invoice?.invoiceNumber || `INV-20260923-${String(projectId).padStart(4, "0")}`}) & Remittance</div>
                    <Badge className="bg-emerald-600 text-white text-xs w-fit">100% Paid via RTGS</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Remittance of {INR.format(netClientRemittance)} credited via HDFC Current A/c. UTR verified in ERP.</p>
                </div>

                {/* 7. Virtual Completion Certificate */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-background" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-sm text-foreground">7. Handover Certificate ({handover?.vccNumber || `VCC-20260924-${String(projectId).padStart(4, "0")}`})</div>
                    <Badge variant="outline" className="text-xs font-mono text-emerald-600 border-emerald-300 w-fit">DLP 12 Months</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Punch-list cleared (2/2 snags resolved). Provisional handover completed with 12-month DLP.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: FINANCIAL WATERFALL (EASY RECONCILIATION) ── */}
        <TabsContent value="financials" className="m-0 space-y-4">
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Milestone 1 Commercial Waterfall & Margin Bridge
              </CardTitle>
              <CardDescription className="text-xs">
                Transparent revenue-to-cost reconciliation showing statutory deductions, direct vendor disbursements, and realized contractor profit.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="text-left py-2.5 px-4">Financial Flow Step</th>
                      <th className="text-left py-2.5 px-4">Category</th>
                      <th className="text-right py-2.5 px-4">Impact Amount</th>
                      <th className="text-right py-2.5 px-4">Running Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-foreground">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold">Certified Value of Work (M25 Concrete + Rebar)</td>
                      <td className="py-2.5 px-4 text-muted-foreground">Gross Revenue</td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 font-bold">+{INR.format(milestoneGrossBilled)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{INR.format(milestoneGrossBilled)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4">Statutory Goods & Services Tax (+18% GST)</td>
                      <td className="py-2.5 px-4 text-muted-foreground">Output Tax</td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 font-medium">+{INR.format(gstAmount)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{INR.format(milestoneGrossBilled + gstAmount)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4">Client Retention Escrow Withheld (-5%)</td>
                      <td className="py-2.5 px-4 text-muted-foreground">Escrow Withheld</td>
                      <td className="py-2.5 px-4 text-right text-amber-600 font-medium">-{INR.format(retentionHeld)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{INR.format(milestoneGrossBilled + gstAmount - retentionHeld)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4">TDS Withheld u/s 194C (-2%)</td>
                      <td className="py-2.5 px-4 text-muted-foreground">Tax Withholding</td>
                      <td className="py-2.5 px-4 text-right text-amber-600 font-medium">-{INR.format(tdsDeducted)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{INR.format(milestoneGrossBilled + gstAmount - retentionHeld - tdsDeducted)}</td>
                    </tr>
                    <tr className="bg-emerald-500/5 font-bold">
                      <td className="py-2.5 px-4 text-emerald-700 dark:text-emerald-400">Net Remittance Received from Client (HDFC RTGS)</td>
                      <td className="py-2.5 px-4 text-emerald-700 dark:text-emerald-400">Bank Inflow</td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-black">{INR.format(netClientRemittance)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400">{INR.format(netClientRemittance)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4">Direct Vendor Material Cost (Cement & Steel PO Base)</td>
                      <td className="py-2.5 px-4 text-muted-foreground">Vendor AP Outflow</td>
                      <td className="py-2.5 px-4 text-right text-rose-600 font-medium">-{INR.format(vendorNetBase)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{INR.format(milestoneGrossBilled - vendorNetBase)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4">Site Operational Imprest (DG Diesel & Lab Testing)</td>
                      <td className="py-2.5 px-4 text-muted-foreground">Site Direct Cost</td>
                      <td className="py-2.5 px-4 text-right text-rose-600 font-medium">-{INR.format(directExpensesTotal)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{INR.format(milestoneGrossBilled - totalDirectCosts)}</td>
                    </tr>
                    <tr className="bg-primary/5 font-bold text-sm">
                      <td className="py-3 px-4 text-primary">Realized Contractor Milestone Margin</td>
                      <td className="py-3 px-4 text-primary">Gross Profit + Escrow</td>
                      <td className="py-3 px-4 text-right text-primary font-black">+{INR.format(milestoneProfit + retentionHeld)}</td>
                      <td className="py-3 px-4 text-right font-mono text-primary font-black">+{realizedMarginPercent.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="border rounded-lg p-3.5 space-y-1.5 bg-muted/10">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Retention Escrow Release Schedule
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {INR.format(retentionHeld)} (5%) is securely retained by the client. 50% ({INR.format(retentionHeld / 2)}) releases upon Virtual Completion (VCC), and the remaining 50% releases after 12 months DLP inspection.
                  </p>
                </div>

                <div className="border rounded-lg p-3.5 space-y-1.5 bg-muted/10">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" /> Turnkey Health Score: Excellent
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    Zero invoice discrepancy, 100% 3-way matching clearance, all site direct costs within budget caps, and full milestone payment credited via bank RTGS without disputed deductions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Client Profile & Ownership Dialog ── */}
      <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Building2 className="h-5 w-5 text-primary" />
              Client Profile & Ownership
            </DialogTitle>
            <DialogDescription className="text-xs">
              Customer and client entity designated for this turnkey contract.
            </DialogDescription>
          </DialogHeader>

          {project && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client Entity</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Active Client
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {project.clientName || "BlueWave Hospitality Pvt. Ltd"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Project: <strong className="text-foreground">{project.name}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px] font-medium">Site / Location</span>
                    <span className="font-semibold text-foreground">{project.location || "Plot 42, Aerocity Boulevard, Mumbai"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] font-medium">Total Contract Value</span>
                    <span className="font-bold text-primary">{INR.format(contractBudget)}</span>
                  </div>
                </div>

                {project.description && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block text-[11px] font-medium mb-1">Project Scope & Baseline</span>
                    <p className="text-xs text-foreground/90 leading-relaxed bg-background/60 p-2.5 rounded-lg border">
                      {project.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-3.5 bg-sky-500/5 border-sky-500/20 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-sky-800 dark:text-sky-300">Commercial Master Contract</div>
                  <div className="text-muted-foreground text-[11px]">Signed turnkey agreement with terms & retention</div>
                </div>
                <Button size="sm" variant="outline" asChild className="h-7 text-xs border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10">
                  <Link href={`/contracts?projectId=${projectId}`}>View Contract &rarr;</Link>
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row justify-between sm:justify-between items-center gap-2">
            {onNavigateTab ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setClientModalOpen(false);
                  onNavigateTab("stakeholders");
                }}
              >
                Open Stakeholders Tab &rarr;
              </Button>
            ) : <div />}
            <Button size="sm" onClick={() => setClientModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectJourneyView;
