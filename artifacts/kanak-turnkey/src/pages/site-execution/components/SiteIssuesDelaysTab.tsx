import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  AlertCircle,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface SiteIssuesDelaysTabProps {
  selectedProjectId: string;
  projects: any[];
}

const ISSUE_CATEGORIES = [
  { value: "drawing_design", label: "Drawing & Architectural Revision Delay" },
  { value: "material_shortage", label: "Material Delivery & Vendor Supply Delay" },
  { value: "labor_unavailability", label: "Labor Shortage / Strike / Festival Break" },
  { value: "weather_delay", label: "Inclement Weather / Heavy Monsoon Rain" },
  { value: "client_approval", label: "Client Decision / Selection / Inspection Halt" },
  { value: "site_access", label: "Site Access / Neighbor / Municipal Permissions" },
  { value: "power_water", label: "Utility Stoppage (Electricity Grid / Water Cut)" },
  { value: "equipment_failure", label: "Major Plant & Machinery Breakdown" },
  { value: "other", label: "Other Site Hindrance" },
];

export function SiteIssuesDelaysTab({ selectedProjectId, projects }: SiteIssuesDelaysTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    projectId: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"),
    reportedDate: new Date().toISOString().split("T")[0],
    title: "",
    category: "material_shortage",
    severity: "medium",
    status: "open",
    daysImpact: "2",
    costImpact: "35000",
    mitigationPlan: "",
    resolutionDate: "",
    assignedTo: "Rohan Mehta (Project Manager)",
  });

  const { data: issues = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/site-execution/issues-delays", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/site-execution/issues-delays?projectId=${selectedProjectId}`
        : "/api/site-execution/issues-delays";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/site-execution/issues-delays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to log site delay");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/issues-delays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      setDialogOpen(false);
      toast({
        title: "Delay / Hindrance Logged",
        description: "Schedule & cost impact recorded.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await fetch(`/api/site-execution/issues-delays/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update issue");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/issues-delays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Status Updated", description: "Issue changes saved." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/site-execution/issues-delays/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete issue");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/issues-delays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Deleted", description: "Hindrance record removed." });
    },
  });

  const filtered = issues.filter((item) => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (searchQuery && !item.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // KPI Calculations
  const openCount = filtered.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const resolvedCount = filtered.filter((i) => i.status === "resolved").length;
  const totalDays = filtered.filter((i) => i.status !== "resolved").reduce((a, b) => a + (b.daysImpact || 0), 0);
  const totalCost = filtered.filter((i) => i.status !== "resolved").reduce((a, b) => a + Number(b.costImpact || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      projectId: Number(form.projectId),
      daysImpact: parseInt(form.daysImpact) || 0,
      costImpact: parseFloat(form.costImpact) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Site Delays</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-600">{openCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Critical hindrances open</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Schedule Delay Impact</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">+{totalDays} Days</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Potential milestone slip</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Financial Cost Impact</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{INR.format(totalCost)}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Overheads & idle machinery</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Resolved Hindrances</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{resolvedCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Mitigated successfully</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search site hindrances..."
              className="pl-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {ISSUE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              Log Site Delay / Hindrance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                Record Site Issue, Bottleneck or Schedule Delay
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log critical bottlenecks, estimated delay days, financial impact, and mitigation plan.
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
                <Label className="text-xs">Issue Title</Label>
                <Input
                  placeholder="e.g. Delayed Delivery of 25mm Rebar from Primary Mill"
                  className="text-xs h-9"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => setForm({ ...form, category: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Severity</Label>
                  <Select
                    value={form.severity}
                    onValueChange={(val) => setForm({ ...form, severity: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Impact</SelectItem>
                      <SelectItem value="medium">Medium Impact</SelectItem>
                      <SelectItem value="high">High (Critical Path)</SelectItem>
                      <SelectItem value="critical">Critical (Stop Work)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-amber-600">Schedule Delay (Days)</Label>
                  <Input
                    type="number"
                    min="0"
                    className="text-xs h-8 bg-background"
                    value={form.daysImpact}
                    onChange={(e) => setForm({ ...form, daysImpact: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-rose-600">Financial Impact (₹)</Label>
                  <Input
                    type="number"
                    className="text-xs h-8 bg-background"
                    value={form.costImpact}
                    onChange={(e) => setForm({ ...form, costImpact: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Reported Date</Label>
                  <Input
                    type="date"
                    className="text-xs h-9"
                    value={form.reportedDate}
                    onChange={(e) => setForm({ ...form, reportedDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Assigned Owner</Label>
                  <Input
                    className="text-xs h-9"
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Mitigation Plan & Recovery Action</Label>
                <Textarea
                  placeholder="e.g. Diverting stock from central warehouse, deployed night overtime crew."
                  className="text-xs min-h-[60px]"
                  value={form.mitigationPlan}
                  onChange={(e) => setForm({ ...form, mitigationPlan: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Log Issue"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Issues Table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Site Hindrance, Delay & Bottleneck Tracker
            </span>
            <Badge variant="outline" className="text-xs">
              {filtered.length} Items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No site issues or delays reported. Click "Log Site Delay" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3 pl-4">Date</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Issue Title & Mitigation Plan</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Delay</th>
                    <th className="p-3 text-right">Cost Impact</th>
                    <th className="p-3">Assigned To</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => {
                    const statusConfig = {
                      open: { label: "Open", bg: "bg-rose-50 text-rose-700 border-rose-300" },
                      in_progress: { label: "In Progress", bg: "bg-amber-50 text-amber-700 border-amber-300" },
                      resolved: { label: "Resolved", bg: "bg-emerald-50 text-emerald-700 border-emerald-300" },
                      escalated: { label: "Escalated", bg: "bg-purple-50 text-purple-700 border-purple-300" },
                    }[item.status as string] || { label: item.status, bg: "bg-muted" };

                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 pl-4 font-mono font-medium text-foreground whitespace-nowrap">
                          {item.reportedDate}
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {item.projectName || `Project #${item.projectId}`}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.category?.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3 max-w-sm">
                          <div className="font-semibold text-foreground">{item.title}</div>
                          {item.mitigationPlan && (
                            <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              Plan: {item.mitigationPlan}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.severity === "high" || item.severity === "critical" ? "bg-rose-50 text-rose-700 border-rose-300" : "bg-blue-50 text-blue-700 border-blue-300"}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={item.status}
                            onChange={(e) => updateMutation.mutate({ id: item.id, updates: { status: e.target.value } })}
                            className={`text-[11px] font-semibold rounded-md border px-2 py-0.5 cursor-pointer outline-none ${statusConfig.bg}`}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="escalated">Escalated</option>
                          </select>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-600">
                          {item.daysImpact > 0 ? `+${item.daysImpact}d` : "0d"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                          {INR.format(Number(item.costImpact || 0))}
                        </td>
                        <td className="p-3 text-foreground font-medium">{item.assignedTo || "—"}</td>
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
    </div>
  );
}
