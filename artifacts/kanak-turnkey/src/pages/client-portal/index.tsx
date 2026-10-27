import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Calendar,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  TrendingUp,
  CreditCard,
  HardHat,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientProject {
  id: number;
  name: string;
  type?: string;
  location?: string;
  clientName?: string;
  startDate?: string;
  targetHandover?: string;
  status: string;
  progressPercent: number;
  totalInvoiced: number;
  totalPaid: number;
  pendingPayment: number;
  dprCount: number;
  latestDprDate?: string;
  certifiedBillsCount: number;
}

interface ClientPortalData {
  clientInfo: {
    userName: string;
    userEmail: string;
    role: string;
  };
  portfolioProgress: number;
  totalActiveSites: number;
  projects: ClientProject[];
}

export default function ClientPortalPage() {
  const [data, setData] = useState<ClientPortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectDetail, setProjectDetail] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const { toast } = useToast();

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/client-portal/summary", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load client portal");
      const json = await res.json();
      setData(json);
      if (json.projects && json.projects.length > 0 && selectedProjectId === null) {
        setSelectedProjectId(json.projects[0].id);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load portal summary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectDetail = async (id: number) => {
    setIsDetailLoading(true);
    try {
      const res = await fetch(`/api/client-portal/projects/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load project details");
      const json = await res.json();
      setProjectDetail(json);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load site details",
        variant: "destructive",
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetail(selectedProjectId);
    }
  }, [selectedProjectId]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Client Portal & Projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Client Portal — Read-Only Transparency Access
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {data?.clientInfo.userName || "Valued Client"}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Track real-time turnkey site progress, inspect verified daily progress reports (DPRs), and download official certified RA Bills & Tax Invoices.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-xl border border-white/10">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-300">Portfolio Progress</div>
              <div className="text-2xl font-bold text-white">{data?.portfolioProgress || 0}%</div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-blue-400 flex items-center justify-center font-bold text-sm bg-blue-600/30">
              {data?.totalActiveSites || 0}
              <span className="text-[9px] font-normal block ml-0.5">sites</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="sites" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="sites" className="gap-2">
            <Building2 className="w-4 h-4" />
            Active Sites
          </TabsTrigger>
          <TabsTrigger value="dpr" className="gap-2">
            <HardHat className="w-4 h-4" />
            Site DPRs
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="w-4 h-4" />
            Billing & Invoices
          </TabsTrigger>
        </TabsList>

        {/* 1. Sites Overview */}
        <TabsContent value="sites" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.projects.map((p) => {
              const isSelected = p.id === selectedProjectId;
              return (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? "ring-2 ring-primary border-primary" : ""
                  }`}
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">{p.name}</CardTitle>
                        <CardDescription className="text-xs">{p.location || "Site Location"}</CardDescription>
                      </div>
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Completion Progress</span>
                        <span className="font-semibold">{p.progressPercent}%</span>
                      </div>
                      <Progress value={p.progressPercent} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 p-2.5 rounded-lg border">
                      <div>
                        <span className="text-muted-foreground block">Invoiced</span>
                        <span className="font-semibold text-foreground">
                          ₹ {Number(p.totalInvoiced || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Pending</span>
                        <span className="font-semibold text-amber-600">
                          ₹ {Number(p.pendingPayment || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Target: {p.targetHandover || "TBD"}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        View Details &rarr;
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 2. Site DPRs */}
        <TabsContent value="dpr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Verified Daily Progress Reports (DPR) — {projectDetail?.project?.name || "Selected Site"}</span>
                {selectedProjectId && (
                  <span className="text-xs font-normal text-muted-foreground">
                    Project #{selectedProjectId}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Audited daily logs submitted by certified site engineers including weather, shift summaries, and milestone accomplishments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDetailLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading DPR logs...</div>
              ) : projectDetail?.dprs?.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No DPR logs recorded for this site yet.</div>
              ) : (
                <div className="space-y-3">
                  {projectDetail?.dprs?.map((dpr: any) => (
                    <div
                      key={dpr.id}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{dpr.reportDate}</span>
                          <Badge variant="outline" className="text-xs">
                            {dpr.shift || "General Shift"}
                          </Badge>
                          {dpr.weather && (
                            <span className="text-xs text-muted-foreground">Weather: {dpr.weather}</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/90 line-clamp-2">
                          {dpr.workSummary || "Daily site civil, structural, and finishing activities executed as per milestone schedule."}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right text-xs">
                          <span className="text-muted-foreground block">On-site Workforce</span>
                          <span className="font-semibold">{dpr.manpowerCount || 0} Craftsmen</span>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Verified
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Invoices & RA Bills */}
        <TabsContent value="invoices" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax Invoices Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Official Tax Invoices</span>
                  <Badge variant="outline">GST Compliant</Badge>
                </CardTitle>
                <CardDescription>
                  Download official tax invoices in PDF format with company letterhead and GST breakdown.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectDetail?.invoices?.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No tax invoices generated yet.</p>
                ) : (
                  projectDetail?.invoices?.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-lg border bg-card flex items-center justify-between gap-3 text-sm"
                    >
                      <div>
                        <div className="font-medium text-foreground">{inv.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground">Due: {inv.dueDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          ₹ {Number(inv.netAmount || inv.amount).toLocaleString("en-IN")}
                        </div>
                        <Badge
                          variant={inv.status === "paid" ? "default" : "secondary"}
                          className="text-[10px] uppercase"
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <a
                        href={inv.pdfDownloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Certified RA Bills Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Certified Running Account Bills (RA Bills)</span>
                  <Badge variant="outline">BOQ Certified</Badge>
                </CardTitle>
                <CardDescription>
                  Itemized measurement breakdowns, certified quantities, retention, and deduction sheets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectDetail?.raBills?.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No RA bills submitted yet.</p>
                ) : (
                  projectDetail?.raBills?.map((bill: any) => (
                    <div
                      key={bill.id}
                      className="p-3 rounded-lg border bg-card flex items-center justify-between gap-3 text-sm"
                    >
                      <div>
                        <div className="font-medium text-foreground">{bill.billNumber}</div>
                        <div className="text-xs text-muted-foreground">Period: {bill.periodEnd || "N/A"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          ₹ {Number(bill.netPayableAmount || bill.grossAmount).toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          Retention: ₹{Number(bill.retentionAmount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <a
                        href={bill.pdfDownloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
