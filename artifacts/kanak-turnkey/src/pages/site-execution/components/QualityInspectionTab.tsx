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
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Search,
  ClipboardCheck,
  FileCheck2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QualityInspectionTabProps {
  selectedProjectId: string;
  projects: any[];
}

const CHECKLIST_CATEGORIES = [
  "Civil & Structure",
  "Reinforcement & Steel",
  "Pre-Pour Concrete",
  "Waterproofing & Ponding",
  "Materials Laboratory Testing",
  "MEP & Concealed Conduits",
  "Blockwork & Plaster Plumb",
  "Finishes & Snags",
];

const PRESET_INSPECTIONS = [
  { title: "Pre-Pour Reinforcement, Cover & Formwork Inspection", cat: "Pre-Pour Concrete", total: 12 },
  { title: "Concrete Cube Compressive Strength 7-Day & 28-Day Test", cat: "Materials Laboratory Testing", total: 6 },
  { title: "Retaining Wall & Raft Waterproofing Membrane Test", cat: "Waterproofing & Ponding", total: 10 },
  { title: "AAC Blockwork Alignment, Mortar & Lintel Check", cat: "Blockwork & Plaster Plumb", total: 8 },
  { title: "Concealed Electrical Conduits & Pressure Drop Test", cat: "MEP & Concealed Conduits", total: 10 },
  { title: "Final Snag Walkthrough: Tiling, Skirting & Paintwork", cat: "Finishes & Snags", total: 15 },
];

export function QualityInspectionTab({ selectedProjectId, projects }: QualityInspectionTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTitle, setSearchTitle] = useState("");

  const [form, setForm] = useState({
    projectId: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"),
    inspectionDate: new Date().toISOString().split("T")[0],
    inspectionTitle: PRESET_INSPECTIONS[0].title,
    checklistCategory: PRESET_INSPECTIONS[0].cat,
    location: "Podium Slab Grid B4-D8",
    status: "passed",
    inspectedBy: "Priya Iyer (QC Lead)",
    checkpointsTotal: String(PRESET_INSPECTIONS[0].total),
    checkpointsPassed: String(PRESET_INSPECTIONS[0].total),
    correctiveActions: "Cover blocks verified and spacing aligned before concrete discharge.",
    remarks: "Signed off with client site representative.",
  });

  const { data: inspections = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/site-execution/quality", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/site-execution/quality?projectId=${selectedProjectId}`
        : "/api/site-execution/quality";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/site-execution/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to log quality inspection");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/quality"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      setDialogOpen(false);
      toast({
        title: "Quality Inspection Saved",
        description: "Checklist and compliance status recorded.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/site-execution/quality/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/quality"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Status Updated", description: "Inspection result modified." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/site-execution/quality/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete inspection");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/quality"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Deleted", description: "Inspection record removed." });
    },
  });

  const handlePresetSelect = (title: string) => {
    const found = PRESET_INSPECTIONS.find((p) => p.title === title);
    if (found) {
      setForm((prev) => ({
        ...prev,
        inspectionTitle: found.title,
        checklistCategory: found.cat,
        checkpointsTotal: String(found.total),
        checkpointsPassed: String(found.total),
      }));
    } else {
      setForm((prev) => ({ ...prev, inspectionTitle: title }));
    }
  };

  const filtered = inspections.filter((item) => {
    if (filterCategory !== "all" && item.checklistCategory !== filterCategory) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (searchTitle && !item.inspectionTitle?.toLowerCase().includes(searchTitle.toLowerCase())) return false;
    return true;
  });

  // KPI Calculations
  const totalInspections = filtered.length;
  const passedCount = filtered.filter((i) => i.status === "passed").length;
  const conditionalCount = filtered.filter((i) => i.status === "conditional_pass").length;
  const failedCount = filtered.filter((i) => i.status === "failed" || i.status === "pending_reinspection").length;
  const passRate = totalInspections > 0 ? Math.round((passedCount / totalInspections) * 100) : 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      projectId: Number(form.projectId),
      checkpointsTotal: parseInt(form.checkpointsTotal) || 0,
      checkpointsPassed: parseInt(form.checkpointsPassed) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">QC Pass Rate</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{passRate}%</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{passedCount} of {totalInspections} passed</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Passed Inspections</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{passedCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Meets IS/NBC specifications</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Conditional Pass</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">{conditionalCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Punch-list actions identified</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Action Required / Failed</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-600">{failedCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Re-inspection mandatory</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600">
              <XCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search inspection..."
              className="pl-8 h-9 text-xs"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CHECKLIST_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="conditional_pass">Conditional Pass</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending_reinspection">Re-inspection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              Conduct QA Inspection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Record Quality Checklist & Field Inspection
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log structural, finishing, or MEP inspection results and corrective action notes.
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
                <Label className="text-xs">Preset Checklist or Custom Inspection</Label>
                <Select
                  value={form.inspectionTitle}
                  onValueChange={handlePresetSelect}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_INSPECTIONS.map((p) => (
                      <SelectItem key={p.title} value={p.title}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={form.checklistCategory}
                    onValueChange={(val) => setForm({ ...form, checklistCategory: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHECKLIST_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Inspection Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) => setForm({ ...form, status: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passed">Passed (Satisfactory)</SelectItem>
                      <SelectItem value="conditional_pass">Conditional Pass (Minor Fixes)</SelectItem>
                      <SelectItem value="failed">Failed (Re-work Required)</SelectItem>
                      <SelectItem value="pending_reinspection">Pending Re-inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Total Items</Label>
                  <Input
                    type="number"
                    className="text-xs h-8 bg-background"
                    value={form.checkpointsTotal}
                    onChange={(e) => setForm({ ...form, checkpointsTotal: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-emerald-600">Passed Items</Label>
                  <Input
                    type="number"
                    className="text-xs h-8 bg-background"
                    value={form.checkpointsPassed}
                    onChange={(e) => setForm({ ...form, checkpointsPassed: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-primary">Score</Label>
                  <div className="text-xs font-bold pt-2 text-foreground font-mono">
                    {parseInt(form.checkpointsTotal) > 0
                      ? `${Math.round(((parseInt(form.checkpointsPassed) || 0) / parseInt(form.checkpointsTotal)) * 100)}%`
                      : "100%"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Inspection Date</Label>
                  <Input
                    type="date"
                    className="text-xs h-9"
                    value={form.inspectionDate}
                    onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Inspected By</Label>
                  <Input
                    className="text-xs h-9"
                    value={form.inspectedBy}
                    onChange={(e) => setForm({ ...form, inspectedBy: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Location & Grid Coordinates</Label>
                <Input
                  placeholder="e.g. Podium Slab Bay 4 Grid B4-D8"
                  className="text-xs h-9"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Corrective Actions Required</Label>
                <Textarea
                  placeholder="e.g. Adjust cover block spacing from 25mm to 40mm at column beam junction."
                  className="text-xs min-h-[50px]"
                  value={form.correctiveActions}
                  onChange={(e) => setForm({ ...form, correctiveActions: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save QA Record"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quality Register Table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />
              Site Quality Control & QA Inspection Register
            </span>
            <Badge variant="outline" className="text-xs">
              {filtered.length} Audits
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No quality inspections recorded for this project. Click "Conduct QA Inspection" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3 pl-4">Inspection Title</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Result Status</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3">Inspector</th>
                    <th className="p-3">Corrective Actions</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => {
                    const statusConfig = {
                      passed: { label: "Passed", bg: "bg-emerald-50 text-emerald-700 border-emerald-300" },
                      conditional_pass: { label: "Conditional", bg: "bg-amber-50 text-amber-700 border-amber-300" },
                      failed: { label: "Failed", bg: "bg-rose-50 text-rose-700 border-rose-300" },
                      pending_reinspection: { label: "Re-check", bg: "bg-blue-50 text-blue-700 border-blue-300" },
                    }[item.status as string] || { label: item.status, bg: "bg-muted text-foreground border-border" };

                    const total = item.checkpointsTotal || 0;
                    const passed = item.checkpointsPassed || 0;
                    const pct = total > 0 ? Math.round((passed / total) * 100) : 100;

                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 pl-4 font-semibold text-foreground max-w-sm">
                          {item.inspectionTitle}
                          <div className="text-[11px] text-muted-foreground font-mono">{item.inspectionDate}</div>
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {item.projectName || `Project #${item.projectId}`}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {item.checklistCategory}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {item.location || "On-site"}
                        </td>
                        <td className="p-3">
                          <select
                            value={item.status}
                            onChange={(e) => updateStatusMutation.mutate({ id: item.id, status: e.target.value })}
                            className={`text-[11px] font-semibold rounded-md border px-2 py-0.5 cursor-pointer outline-none ${statusConfig.bg}`}
                          >
                            <option value="passed">Passed</option>
                            <option value="conditional_pass">Conditional Pass</option>
                            <option value="failed">Failed</option>
                            <option value="pending_reinspection">Re-check</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold ${pct === 100 ? "text-emerald-600" : pct >= 80 ? "text-amber-600" : "text-rose-600"}`}>
                            {passed}/{total} ({pct}%)
                          </span>
                        </td>
                        <td className="p-3 text-foreground font-medium">
                          {item.inspectedBy || "—"}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate" title={item.correctiveActions}>
                          {item.correctiveActions || "None required."}
                        </td>
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
