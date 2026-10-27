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
  ShieldAlert,
  HardHat,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  Users,
  Flame,
  Award,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SafetyIncidentTabProps {
  selectedProjectId: string;
  projects: any[];
}

const REPORT_TYPES = [
  { value: "toolbox_talk", label: "Toolbox Talk (Safety Briefing)" },
  { value: "ppe_audit", label: "PPE Compliance Audit" },
  { value: "observation", label: "Safety Hazard Observation" },
  { value: "near_miss", label: "Near-Miss Event" },
  { value: "first_aid", label: "First-Aid Incident" },
  { value: "minor_injury", label: "Minor Injury Report" },
  { value: "major_incident", label: "Major Incident (Critical)" },
];

export function SafetyIncidentTab({ selectedProjectId, projects }: SafetyIncidentTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    projectId: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"),
    incidentDate: new Date().toISOString().split("T")[0],
    reportType: "toolbox_talk",
    title: "Morning Toolbox Briefing: Safe Working at Heights & Harness Checks",
    severity: "low",
    status: "closed",
    location: "Podium Assembly Area",
    description: "Conducted mandatory 15-minute briefing on double lanyard tie-off requirement and edge barrier safety for podium crew.",
    actionTaken: "All 34 workers inspected for ISI marked harness clips and hard hats before site entry.",
    reportedBy: "Suresh Pillai (Safety Officer)",
    workersAttended: "34",
  });

  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/site-execution/safety", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/site-execution/safety?projectId=${selectedProjectId}`
        : "/api/site-execution/safety";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/site-execution/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to log safety report");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/safety"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      setDialogOpen(false);
      toast({
        title: "Safety Record Created",
        description: "HSE log recorded successfully.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/site-execution/safety/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/safety"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Status Updated", description: "Safety status changed." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/site-execution/safety/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/safety"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Deleted", description: "Safety record removed." });
    },
  });

  const filtered = records.filter((item) => {
    if (filterType !== "all" && item.reportType !== filterType) return false;
    if (filterSeverity !== "all" && item.severity !== filterSeverity) return false;
    if (searchQuery && !item.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // KPI Calculations
  const openIncidents = filtered.filter((r) => r.status === "open" || r.status === "investigating").length;
  const toolboxCount = filtered.filter((r) => r.reportType === "toolbox_talk").length;
  const totalAttended = filtered.reduce((a, b) => a + (b.workersAttended || 0), 0);
  const criticalCount = filtered.filter((r) => r.severity === "high" || r.severity === "critical").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      projectId: Number(form.projectId),
      workersAttended: parseInt(form.workersAttended) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Safe Work Days</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">42 Days</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Zero lost time incidents</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Open Safety Issues</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{openIncidents}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Corrective actions pending</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Toolbox Talks Done</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600">{toolboxCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{totalAttended} attendees recorded</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
              <HardHat className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">High / Critical Events</p>
              <h3 className={`text-2xl font-bold mt-1 ${criticalCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {criticalCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{criticalCount === 0 ? "Clean safety record" : "Immediate review"}</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600">
              <ShieldAlert className="h-6 w-6" />
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
              placeholder="Search safety records..."
              className="pl-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
              <SelectValue placeholder="All Report Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Report Types</SelectItem>
              {REPORT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
              <SelectValue placeholder="All Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              Report Safety Event / Briefing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Log Site Safety, Incident or Toolbox Talk
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record safety briefings, hazard observations, or near-miss incidents.
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Report Type</Label>
                  <Select
                    value={form.reportType}
                    onValueChange={(val) => setForm({ ...form, reportType: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Severity Level</Label>
                  <Select
                    value={form.severity}
                    onValueChange={(val) => setForm({ ...form, severity: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Notice / Briefing)</SelectItem>
                      <SelectItem value="medium">Medium (Moderate Risk)</SelectItem>
                      <SelectItem value="high">High (Immediate Action)</SelectItem>
                      <SelectItem value="critical">Critical (Stop Work)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Event / Topic Title</Label>
                <Input
                  placeholder="e.g. Mandatory Edge Barricades on Floor 4"
                  className="text-xs h-9"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    className="text-xs h-9"
                    value={form.incidentDate}
                    onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) => setForm({ ...form, status: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="closed">Closed / Solved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Attendees</Label>
                  <Input
                    type="number"
                    className="text-xs h-9"
                    value={form.workersAttended}
                    onChange={(e) => setForm({ ...form, workersAttended: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Location & Reporter</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Location on site"
                    className="text-xs h-9"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                  <Input
                    placeholder="Reported By"
                    className="text-xs h-9"
                    value={form.reportedBy}
                    onChange={(e) => setForm({ ...form, reportedBy: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description of Event or Briefing Points</Label>
                <Textarea
                  placeholder="Describe observation, hazards identified, or toolbox talk contents."
                  className="text-xs min-h-[50px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Action Taken / Preventive Measures</Label>
                <Textarea
                  placeholder="e.g. Scaffolding red-tagged until outriggers installed."
                  className="text-xs min-h-[50px]"
                  value={form.actionTaken}
                  onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Safety Report"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Safety Records Table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Site Safety Observations & HSE Incident Log
            </span>
            <Badge variant="outline" className="text-xs">
              {filtered.length} Records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No safety records logged. Click "Report Safety Event" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3 pl-4">Date</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Title & Summary</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-center">Attendees</th>
                    <th className="p-3">Reported By</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => {
                    const sevConfig = {
                      low: { label: "Low", bg: "bg-blue-50 text-blue-700 border-blue-300" },
                      medium: { label: "Medium", bg: "bg-amber-50 text-amber-700 border-amber-300" },
                      high: { label: "High", bg: "bg-rose-50 text-rose-700 border-rose-300" },
                      critical: { label: "Critical", bg: "bg-red-600 text-white border-red-700" },
                    }[item.severity as string] || { label: item.severity, bg: "bg-muted" };

                    const statusConfig = {
                      open: { label: "Open", bg: "bg-amber-50 text-amber-700 border-amber-300" },
                      investigating: { label: "Investigating", bg: "bg-blue-50 text-blue-700 border-blue-300" },
                      closed: { label: "Closed", bg: "bg-emerald-50 text-emerald-700 border-emerald-300" },
                    }[item.status as string] || { label: item.status, bg: "bg-muted" };

                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 pl-4 font-mono font-medium text-foreground whitespace-nowrap">
                          {item.incidentDate}
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {item.projectName || `Project #${item.projectId}`}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.reportType?.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3 max-w-sm">
                          <div className="font-semibold text-foreground">{item.title}</div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</div>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sevConfig.bg}`}>
                            {sevConfig.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={item.status}
                            onChange={(e) => updateStatusMutation.mutate({ id: item.id, status: e.target.value })}
                            className={`text-[11px] font-semibold rounded-md border px-2 py-0.5 cursor-pointer outline-none ${statusConfig.bg}`}
                          >
                            <option value="open">Open</option>
                            <option value="investigating">Investigating</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="p-3 text-muted-foreground">{item.location || "On-site"}</td>
                        <td className="p-3 text-center font-bold text-foreground font-mono">
                          {item.workersAttended || 0}
                        </td>
                        <td className="p-3 text-foreground font-medium">{item.reportedBy || "—"}</td>
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
