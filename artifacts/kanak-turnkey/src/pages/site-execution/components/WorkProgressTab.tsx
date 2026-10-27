import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Activity,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Layers,
  Target,
  Edit2,
  FileCheck,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkProgressTabProps {
  selectedProjectId: string;
  projects: any[];
}

const COMMON_ACTIVITIES = [
  { name: "Earthwork & Excavation", cat: "Earthmoving", unit: "Cu.m", target: "1200" },
  { name: "Plain Cement Concrete (PCC) Sub-base", cat: "Foundation", unit: "Cu.m", target: "250" },
  { name: "Raft Foundation & Column Starter Casting", cat: "Substructure RCC", unit: "Cu.m", target: "950" },
  { name: "Podium Columns Rebar Fabrication & Tying", cat: "Superstructure Steel", unit: "MT", target: "110" },
  { name: "Slab Shuttering & Centering Formwork", cat: "Formwork", unit: "Sq.ft", target: "18500" },
  { name: "Internal AAC Block Masonry 150mm", cat: "Masonry Walls", unit: "Sq.ft", target: "12500" },
  { name: "External Sand-Face Cement Plaster 20mm", cat: "Plastering", unit: "Sq.ft", target: "16000" },
  { name: "Basement 1 Electrical Conduiting & Cable Trays", cat: "MEP Services", unit: "Rmt", target: "2200" },
  { name: "Plumbing Risers & Drainage Piping", cat: "MEP Services", unit: "Rmt", target: "1800" },
  { name: "Vitrified Tile Flooring with Epoxy Grout", cat: "Architectural Finishes", unit: "Sq.ft", target: "5400" },
  { name: "Internal Gypsum Plaster & Primer Coat", cat: "Wall Finishes", unit: "Sq.ft", target: "14000" },
];

export function WorkProgressTab({ selectedProjectId, projects }: WorkProgressTabProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // JMR -> WCC Modal State
  const [jmrModalOpen, setJmrModalOpen] = useState(false);
  const [jmrProjectId, setJmrProjectId] = useState<string>(
    selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14")
  );
  const [createdWcc, setCreatedWcc] = useState<any>(null);

  const { data: jmrData, isLoading: jmrLoading, refetch: refetchJmr } = useQuery<{
    contract: any;
    items: any[];
    totalCertifiedAmount: number;
    measurementRecordRef: string;
  }>({
    queryKey: ["/api/site-execution/jmr-measurements", jmrProjectId],
    queryFn: async () => {
      const res = await fetch(`/api/site-execution/jmr-measurements?projectId=${jmrProjectId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load JMR measurements");
      }
      return res.json();
    },
    enabled: jmrModalOpen,
  });

  const feedWccMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/site-execution/feed-jmr-to-wcc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: Number(jmrProjectId),
          remarks: `Auto-compiled from certified DPR work progress quantities (JMR Ref: ${jmrData?.measurementRecordRef || "JMR"}).`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to feed DPR into WCC");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setCreatedWcc(data.workCompletion);
      queryClient.invalidateQueries({ queryKey: ["/api/work-completions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/work-progress"] });
      toast({
        title: "WCC Created Successfully!",
        description: `WCC #${data.workCompletion.wccNumber} created with certified JMR attachment (${data.itemsCount} items).`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Conversion Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const [form, setForm] = useState({
    projectId: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"),
    progressDate: new Date().toISOString().split("T")[0],
    activityName: COMMON_ACTIVITIES[2].name,
    category: COMMON_ACTIVITIES[2].cat,
    unit: COMMON_ACTIVITIES[2].unit,
    plannedQuantity: "120",
    executedToday: "115",
    cumulativeExecuted: "780",
    targetQuantity: COMMON_ACTIVITIES[2].target,
    percentCompleted: "82",
    location: "Podium Footing Bay 4",
    remarks: "Certified pour with cube sampling.",
  });

  const { data: activities = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/site-execution/work-progress", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/site-execution/work-progress?projectId=${selectedProjectId}`
        : "/api/site-execution/work-progress";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/site-execution/work-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to log progress");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/work-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      setDialogOpen(false);
      toast({
        title: "Work Progress Recorded",
        description: "Physical quantities & completion % updated.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/site-execution/work-progress/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/work-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Deleted", description: "Progress record removed." });
    },
  });

  const handleActivitySelect = (name: string) => {
    const found = COMMON_ACTIVITIES.find((a) => a.name === name);
    if (found) {
      setForm((prev) => ({
        ...prev,
        activityName: found.name,
        category: found.cat,
        unit: found.unit,
        targetQuantity: found.target,
      }));
    } else {
      setForm((prev) => ({ ...prev, activityName: name }));
    }
  };

  const filtered = activities.filter((item) => {
    if (searchQuery && !item.activityName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Calculate weighted average
  const avgProgress = filtered.length > 0
    ? Math.round(filtered.reduce((a, b) => a + (b.percentCompleted || 0), 0) / filtered.length)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      projectId: Number(form.projectId),
      plannedQuantity: parseFloat(form.plannedQuantity) || 0,
      executedToday: parseFloat(form.executedToday) || 0,
      cumulativeExecuted: parseFloat(form.cumulativeExecuted) || 0,
      targetQuantity: parseFloat(form.targetQuantity) || 0,
      percentCompleted: parseInt(form.percentCompleted) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Overall Execution Velocity</p>
              <h3 className="text-2xl font-bold mt-1 text-primary">{avgProgress}%</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Average across active fronts</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Activities Monitored</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{filtered.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Substructure, civil & finishes</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Completed Milestones</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">
                {filtered.filter((a) => a.percentCompleted >= 100).length} Fronts
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Ready for certification & billing</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search activity name..."
            className="pl-8 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5 shadow-sm"
            onClick={() => {
              setCreatedWcc(null);
              setJmrProjectId(selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"));
              setJmrModalOpen(true);
            }}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Feed DPR to Billing (JMR → WCC)
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                Record Activity Progress
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Track Physical Activity Progress
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log today's executed quantities against target scopes and calculate % completion.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Select Project</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(val) => setForm({ ...form, projectId: val })}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Activity Name</Label>
                <Select
                  value={form.activityName}
                  onValueChange={handleActivitySelect}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_ACTIVITIES.map((a) => (
                      <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Input
                    className="text-xs h-9"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    className="text-xs h-9"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-primary">Today Executed</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="text-xs h-8 bg-background"
                    value={form.executedToday}
                    onChange={(e) => {
                      const todayVal = parseFloat(e.target.value) || 0;
                      const targetVal = parseFloat(form.targetQuantity) || 1;
                      const prevCum = parseFloat(form.cumulativeExecuted) || 0;
                      const newCum = prevCum + todayVal;
                      setForm({
                        ...form,
                        executedToday: e.target.value,
                        cumulativeExecuted: String(newCum),
                        percentCompleted: String(Math.min(100, Math.round((newCum / targetVal) * 100))),
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Cumulative</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="text-xs h-8 bg-background"
                    value={form.cumulativeExecuted}
                    onChange={(e) => setForm({ ...form, cumulativeExecuted: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Total Target</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="text-xs h-8 bg-background"
                    value={form.targetQuantity}
                    onChange={(e) => setForm({ ...form, targetQuantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Percent Completed (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="text-xs h-9 font-bold bg-muted/20"
                    value={form.percentCompleted}
                    onChange={(e) => setForm({ ...form, percentCompleted: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Location on Site</Label>
                  <Input
                    placeholder="Floor 4, West Elevation"
                    className="text-xs h-9"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Remarks & Quality Notes</Label>
                <Textarea
                  placeholder="e.g. Laser levelling verified, joint mesh installed"
                  className="text-xs min-h-[50px]"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Progress"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Activities Progress Table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Work Activities & Physical Execution Progress
            </span>
            <Badge variant="outline" className="text-xs">
              {filtered.length} Work Fronts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No activity progress logged for this project. Click "Record Activity Progress" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3 pl-4">Activity Name</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Today Executed</th>
                    <th className="p-3 text-right">Cumulative / Target</th>
                    <th className="p-3 w-48">Progress Completion</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => {
                    const pct = item.percentCompleted || 0;
                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 pl-4 font-semibold text-foreground max-w-sm">
                          {item.activityName}
                          <div className="text-[11px] text-muted-foreground font-mono">{item.progressDate}</div>
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {item.projectName || `Project #${item.projectId}`}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-primary">
                          {Number(item.executedToday).toFixed(1)} {item.unit}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-foreground">
                          {Number(item.cumulativeExecuted).toFixed(1)} / {Number(item.targetQuantity).toFixed(1)} {item.unit}
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span>{pct}%</span>
                              <span className={pct >= 100 ? "text-emerald-600" : "text-muted-foreground"}>
                                {pct >= 100 ? "Completed" : "In Progress"}
                              </span>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{item.location || "On-site"}</td>
                        <td className="p-3 pr-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* JMR -> WCC Billing Feed Dialog */}
      <Dialog open={jmrModalOpen} onOpenChange={setJmrModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Feed DPR Quantities to Billing (JMR → WCC)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Directly compile verified daily progress execution into a certified Joint Measurement Record (JMR) and generate a Work Completion Certificate (WCC) for RA Billing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border">
              <div>
                <Label className="text-xs font-semibold">Select Project to Bill</Label>
                <Select
                  value={jmrProjectId}
                  onValueChange={(val) => {
                    setJmrProjectId(val);
                    setCreatedWcc(null);
                  }}
                >
                  <SelectTrigger className="text-xs h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end">
                {jmrData?.contract ? (
                  <div className="text-xs space-y-0.5">
                    <span className="text-muted-foreground">Contract:</span>{" "}
                    <span className="font-semibold">{jmrData.contract.contractNumber}</span>
                    <div className="text-[11px] text-muted-foreground truncate">{jmrData.contract.title}</div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 font-medium">
                    No active contract BOQ items found for this project
                  </div>
                )}
              </div>
            </div>

            {/* Created WCC Banner if already generated */}
            {createdWcc && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Work Completion Certificate Created!
                  </div>
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                    {createdWcc.status?.toUpperCase() || "SUBMITTED"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">WCC Number:</span> {createdWcc.wccNumber} &nbsp;|&nbsp;
                  <span className="font-semibold text-foreground">JMR Reference:</span> {jmrData?.measurementRecordRef || "JMR-CERTIFIED"}
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Certified Joint Measurement Record PDF attachment generated and linked to this WCC. Ready for approval and RA Bill generation.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setJmrModalOpen(false);
                      setLocation("/ra-bills/work-completion");
                    }}
                  >
                    View in RA Bills / WCC
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreatedWcc(null)}
                  >
                    Generate Another
                  </Button>
                </div>
              </div>
            )}

            {/* Compiled JMR Measurement Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Certified Measurements from DPRs ({jmrData?.items?.length || 0} Items)
                </span>
                {jmrData && (
                  <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-600 border-emerald-200">
                    Est. Billable: ₹{Number(jmrData.totalCertifiedAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </Badge>
                )}
              </div>

              {jmrLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Compiling site execution measurements...
                </div>
              ) : !jmrData || jmrData.items.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground border rounded-lg bg-muted/10">
                  No verified work progress logs found for this project. Log executed quantities first.
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 font-semibold text-muted-foreground text-left">
                        <th className="p-2.5">Item / Activity</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5 text-right">DPR Executed Qty</th>
                        <th className="p-2.5 text-right">Contract Rate</th>
                        <th className="p-2.5 text-right">Amount (₹)</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {jmrData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/10 font-sans">
                          <td className="p-2.5">
                            <div className="font-medium text-foreground">{item.description}</div>
                            <div className="text-[10px] text-muted-foreground">BOQ Code: {item.itemCode || "UNMATCHED"}</div>
                          </td>
                          <td className="p-2.5 font-mono text-muted-foreground">{item.uom}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-primary">
                            {Number(item.completedQty).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">
                            ₹{Number(item.rate).toLocaleString("en-IN")}
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-foreground">
                            ₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-center">
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              Verified JMR
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setJmrModalOpen(false);
                setLocation("/ra-bills/work-completion/new");
              }}
              className="gap-1.5 text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Manual WCC Form
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setJmrModalOpen(false)}>
                Close
              </Button>
              <Button
                size="sm"
                className="gap-1.5 shadow-sm"
                disabled={!jmrData || jmrData.items.length === 0 || feedWccMutation.isPending || !!createdWcc}
                onClick={() => feedWccMutation.mutate()}
              >
                {feedWccMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating WCC...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    Create WCC & Feed into Billing
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
