import React from "react";
import { useGetProjectExecutionSummary } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Plus,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  FileCheck2,
  ArrowRight,
  Target,
  Users,
  Package,
  Truck,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  TrendingUp,
  Camera,
  DollarSign,
  ExternalLink,
  Layers,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProjectExecutionTab({ projectId }: { projectId: number }) {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading } = useGetProjectExecutionSummary(projectId);

  // Fetch unified site execution metrics for this project
  const { data: siteSummary } = useQuery<any>({
    queryKey: ["/api/site-execution/summary", String(projectId)],
    queryFn: async () => {
      const res = await fetch(`/api/site-execution/summary?projectId=${projectId}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-muted/40 rounded-lg" />
        <div className="h-64 bg-muted/40 rounded-lg" />
      </div>
    );
  }

  const milestones = summary?.milestones || [];
  const completions = summary?.completions || [];
  const taskStats = summary?.taskStats || { total: 0, done: 0, inProgress: 0, todo: 0 };
  const kpis = siteSummary?.kpis || {
    totalHeadcount: 0,
    totalLaborCost: 0,
    totalMaterialValue: 0,
    operationalEquipment: 0,
    passRate: 100,
    openSafetyIncidents: 0,
    openDelaysCount: 0,
    totalDelayDaysImpact: 0,
    overallProgress: 0,
    totalPhotos: 0,
    totalSiteCosts: 0,
  };

  const taskCompletionRate =
    taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Site Execution & Work Measurements
          </h2>
          <p className="text-xs text-muted-foreground">
            Track site progress, verify contractor measurements (JMR), and certify milestone completions for billing.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shadow-sm text-xs"
            onClick={() => setLocation(`/site-execution?projectId=${projectId}`)}
          >
            <ExternalLink className="h-4 w-4 text-primary" />
            Open Full Site Hub
          </Button>
          <Button
            size="sm"
            className="gap-1.5 shadow-sm text-xs"
            onClick={() => setLocation(`/ra-bills/work-completions/new?projectId=${projectId}`)}
          >
            <Plus className="h-4 w-4" />
            Log Site Measurement / JMR
          </Button>
        </div>
      </div>

      {/* Real-time Field Execution KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card
          className="border shadow-sm p-3 hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => setLocation(`/site-execution?projectId=${projectId}&tab=attendance`)}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Users className="h-3.5 w-3.5 text-blue-600" /> Manpower
          </div>
          <div className="text-lg font-bold text-foreground mt-1">{kpis.totalHeadcount} Workers</div>
          <div className="text-[10px] text-muted-foreground">{INR.format(kpis.totalLaborCost)}</div>
        </Card>

        <Card
          className="border shadow-sm p-3 hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => setLocation(`/site-execution?projectId=${projectId}&tab=materials`)}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Package className="h-3.5 w-3.5 text-emerald-600" /> Material Inflow
          </div>
          <div className="text-lg font-bold text-emerald-600 mt-1">{INR.format(kpis.totalMaterialValue)}</div>
          <div className="text-[10px] text-muted-foreground">Batch consumption</div>
        </Card>

        <Card
          className="border shadow-sm p-3 hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => setLocation(`/site-execution?projectId=${projectId}&tab=equipment`)}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Truck className="h-3.5 w-3.5 text-amber-600" /> Plant / Crane
          </div>
          <div className="text-lg font-bold text-foreground mt-1">{kpis.operationalEquipment} Running</div>
          <div className="text-[10px] text-muted-foreground">Daily operations ok</div>
        </Card>

        <Card
          className="border shadow-sm p-3 hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => setLocation(`/site-execution?projectId=${projectId}&tab=daily-reports`)}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Daily DPRs
          </div>
          <div className="text-lg font-bold text-foreground mt-1">Daily Log</div>
          <div className="text-[10px] text-muted-foreground">Work & shift reports</div>
        </Card>

        <Card
          className="border shadow-sm p-3 hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => setLocation(`/site-execution?projectId=${projectId}&tab=delays`)}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Hindrances
          </div>
          <div className="text-lg font-bold text-rose-600 mt-1">
            {kpis.totalDelayDaysImpact > 0 ? `+${kpis.totalDelayDaysImpact}d` : "0d"}
          </div>
          <div className="text-[10px] text-muted-foreground">{kpis.openDelaysCount} open issues</div>
        </Card>

        <Card
          className="border shadow-sm p-3 hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => setLocation(`/ra-bills?tab=work-completions&projectId=${projectId}`)}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Layers className="h-3.5 w-3.5 text-teal-600" /> Measurements
          </div>
          <div className="text-lg font-bold text-foreground mt-1">JMR Sheets</div>
          <div className="text-[10px] text-muted-foreground">Work verification</div>
        </Card>
      </div>

      {/* Task & Measurement Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Task Execution</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span>{taskCompletionRate}%</span>
              <span className="text-xs font-normal text-muted-foreground">
                {taskStats.done} of {taskStats.total} Tasks Done
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={taskCompletionRate} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Milestones Defined</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span>{milestones.length}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {milestones.filter((m) => m.status === "billed" || m.status === "paid").length} Billed
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-300">
                {milestones.filter((m) => m.status === "ready_to_bill").length} Ready to Bill
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {milestones.filter((m) => m.status === "pending").length} Pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Verified Work Completions</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span>{completions.length}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {completions.filter((c) => c.status === "verified").length} Certified
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-300">
                {completions.filter((c) => c.status === "submitted").length} Pending PM Verification
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Billing Milestones Schedule */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Stage-to-Billing Milestones Schedule
            </CardTitle>
            <CardDescription className="text-xs">
              Target completion milestones linked to contractual payment percentages.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/projects/${projectId}?tab=commercial`)}
          >
            Configure in Commercial Tab
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {milestones.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No milestones defined yet. Open the Commercial tab to set stage billing milestones.
            </div>
          ) : (
            <div className="divide-y">
              {milestones.map((m) => (
                <div key={m.id} className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                      {m.billingPercent}%
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{m.title}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {m.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        Stage: <span className="capitalize">{m.stage}</span> • Expected: {INR.format(m.expectedAmount)}
                        {m.targetDate && ` • Due ${format(new Date(m.targetDate), "MMM d, yyyy")}`}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {m.status === "ready_to_bill" && (
                      <Button
                        size="sm"
                        className="text-xs h-7 gap-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setLocation(`/ra-bills/new?projectId=${projectId}&milestoneId=${m.id}`)}
                      >
                        <FileCheck2 className="h-3.5 w-3.5" /> Raise RA Bill
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Work Completion Records */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Site Measurement Records (JMR)
          </CardTitle>
          <CardDescription className="text-xs">
            Joint measurement sheets and work certification records submitted from the field.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {completions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No work completion records logged yet. Click &quot;Log Site Measurement&quot; above to submit the first record.
            </div>
          ) : (
            <div className="divide-y">
              {completions.map((c) => (
                <div key={c.id} className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{c.title}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {c.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {c.workCompletionNumber} • {format(new Date(c.completionDate), "MMM d, yyyy")}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => setLocation(`/ra-bills/work-completions/${c.id}`)}
                  >
                    View Details <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
