import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProject, getGetProjectQueryKey,
  useListTasks, getListTasksQueryKey,
  useListBudgetItems, getListBudgetItemsQueryKey,
  useListRaBills, getListRaBillsQueryKey,
  useListStakeholders, getListStakeholdersQueryKey,
  useListDocuments, getListDocumentsQueryKey,
  useListPunchListItems, getListPunchListItemsQueryKey,
  useCreatePunchListItem,
  useUpdatePunchListItem,
  useUpdateProject,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft, Plus, FileText, CheckCircle2, Circle, Clock,
  AlertCircle, CheckCheck, ArrowRight, ClipboardList,
} from "lucide-react";
import { format } from "date-fns";

// ── Project lifecycle stages ──────────────────────────────────────────────────
const LIFECYCLE = [
  { key: "planning",    label: "Planning",    desc: "Project scoping & design" },
  { key: "procurement", label: "Procurement", desc: "Material sourcing & POs" },
  { key: "execution",   label: "Execution",   desc: "On-site works in progress" },
  { key: "qc",          label: "QC & Testing",desc: "Quality checks & punch list" },
  { key: "handover",    label: "Handover",    desc: "Client handover & acceptance" },
  { key: "archived",    label: "Archived",    desc: "Project closed" },
] as const;

type Stage = typeof LIFECYCLE[number]["key"];

function nextStage(current: string): Stage | null {
  const idx = LIFECYCLE.findIndex(s => s.key === current);
  return idx >= 0 && idx < LIFECYCLE.length - 1 ? LIFECYCLE[idx + 1]!.key : null;
}

// ── Punch list status / priority meta ────────────────────────────────────────
const PL_STATUS: Record<string, { label: string; dot: string; badge: "default" | "secondary" | "outline" | "destructive" }> = {
  open:        { label: "Open",        dot: "bg-destructive",    badge: "destructive" },
  in_progress: { label: "In Progress", dot: "bg-amber-500",      badge: "secondary" },
  resolved:    { label: "Resolved",    dot: "bg-emerald-600",    badge: "default" },
  closed:      { label: "Closed",      dot: "bg-muted-foreground", badge: "outline" },
};
const PL_PRIORITY: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive", medium: "secondary", low: "outline",
};
const PL_CATEGORIES = ["civil", "mechanical", "electrical", "finishing", "safety", "general"] as const;

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const qc = useQueryClient();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  const enabled = !!projectId;
  const { data: tasks }        = useListTasks({ projectId }, { query: { enabled, queryKey: getListTasksQueryKey({ projectId }) } });
  const { data: budgetItems }  = useListBudgetItems(projectId, { query: { enabled, queryKey: getListBudgetItemsQueryKey(projectId) } });
  const { data: raBills }      = useListRaBills({ projectId }, { query: { enabled, queryKey: getListRaBillsQueryKey({ projectId }) } });
  const { data: stakeholders } = useListStakeholders({ projectId }, { query: { enabled, queryKey: getListStakeholdersQueryKey({ projectId }) } });
  const { data: documents }    = useListDocuments({ projectId }, { query: { enabled, queryKey: getListDocumentsQueryKey({ projectId }) } });
  const { data: punchItems }   = useListPunchListItems({ projectId }, { query: { enabled, queryKey: getListPunchListItemsQueryKey({ projectId }) } });

  const updateProject  = useUpdateProject();
  const createPunch    = useCreatePunchListItem();
  const updatePunch    = useUpdatePunchListItem();

  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [punchOpen, setPunchOpen] = useState(false);
  const [punchForm, setPunchForm] = useState({ title: "", description: "", category: "general", priority: "medium", dueDate: "" });

  if (isLoading) return <div className="p-6">Loading project details...</div>;
  if (!project)  return <div className="p-6 text-destructive">Project not found</div>;

  const projectTasks        = tasks?.filter(t => t.projectId === projectId) || [];
  const projectBudget       = budgetItems?.filter(b => b.projectId === projectId) || [];
  const projectRaBills      = raBills?.filter(r => r.projectId === projectId) || [];
  const projectStakeholders = stakeholders?.filter(s => s.projectId === projectId) || [];
  const projectDocs         = documents?.filter(d => d.projectId === projectId) || [];
  const projectPunch        = punchItems?.filter(p => p.projectId === projectId) || [];

  const openPunch     = projectPunch.filter(p => p.status === "open" || p.status === "in_progress").length;
  const resolvedPunch = projectPunch.filter(p => p.status === "resolved" || p.status === "closed").length;

  const currentStageIdx = LIFECYCLE.findIndex(s => s.key === project.status);
  const next = nextStage(project.status);

  const handleAdvance = async () => {
    if (!next) return;
    await updateProject.mutateAsync({ id: projectId, data: { name: project.name, status: next } });
    await qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    setAdvanceOpen(false);
  };

  const handleCreatePunch = async () => {
    if (!punchForm.title.trim()) return;
    await createPunch.mutateAsync({
      data: {
        projectId,
        title: punchForm.title,
        description: punchForm.description || null,
        category: punchForm.category as typeof PL_CATEGORIES[number],
        priority: punchForm.priority as "high" | "medium" | "low",
        dueDate: punchForm.dueDate || null,
      },
    });
    await qc.invalidateQueries({ queryKey: getListPunchListItemsQueryKey({ projectId }) });
    setPunchOpen(false);
    setPunchForm({ title: "", description: "", category: "general", priority: "medium", dueDate: "" });
  };

  const handlePunchStatus = async (itemId: number, status: string) => {
    await updatePunch.mutateAsync({ id: itemId, data: { status: status as "open" | "in_progress" | "resolved" | "closed" } });
    await qc.invalidateQueries({ queryKey: getListPunchListItemsQueryKey({ projectId }) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.status === "archived" ? "outline" : project.status === "handover" ? "default" : "secondary"} className="capitalize">
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.clientName} • {project.location}</p>
        </div>
        {next && (
          <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <ArrowRight className="h-4 w-4" />
                Advance to {LIFECYCLE.find(s => s.key === next)?.label}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Advance Project Stage</DialogTitle>
                <DialogDescription>
                  Move this project from <strong>{LIFECYCLE[currentStageIdx]?.label}</strong> to{" "}
                  <strong>{LIFECYCLE.find(s => s.key === next)?.label}</strong>?
                  {next === "handover" && <span className="block mt-2 text-amber-600 text-sm">Ensure all punch list items are resolved before proceeding to handover.</span>}
                  {next === "archived" && <span className="block mt-2 text-muted-foreground text-sm">This will archive the project. Final financial closure should be complete.</span>}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdvanceOpen(false)}>Cancel</Button>
                <Button onClick={handleAdvance} disabled={updateProject.isPending}>
                  {updateProject.isPending ? "Updating..." : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-primary">{project.progress}%</div>
              <Progress value={project.progress} className="h-2" />
              <div className="pt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{project.type || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Size</span>
                  <span className="font-medium">{project.teamSize || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">{project.budget ? INR.format(project.budget) : "TBD"}</span>
                </div>
                {project.startDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start</span>
                    <span className="font-medium">{format(new Date(project.startDate), "MMM d, yyyy")}</span>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End</span>
                    <span className="font-medium">{format(new Date(project.endDate), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Lifecycle Stage Stepper ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Project Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ol className="space-y-0">
                {LIFECYCLE.map((stage, i) => {
                  const done    = i < currentStageIdx;
                  const current = i === currentStageIdx;
                  const future  = i > currentStageIdx;
                  return (
                    <li key={stage.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold
                          ${done    ? "bg-primary text-primary-foreground" : ""}
                          ${current ? "bg-amber-500 text-white ring-2 ring-amber-500/30" : ""}
                          ${future  ? "bg-muted text-muted-foreground" : ""}
                        `}>
                          {done ? <CheckCheck className="h-3.5 w-3.5" /> : i + 1}
                        </div>
                        {i < LIFECYCLE.length - 1 && (
                          <div className={`w-0.5 flex-1 my-1 min-h-[12px] ${done ? "bg-primary" : "bg-border"}`} />
                        )}
                      </div>
                      <div className="pb-3 min-w-0">
                        <div className={`text-xs font-semibold leading-6 ${current ? "text-amber-600" : done ? "text-foreground" : "text-muted-foreground"}`}>
                          {stage.label}
                        </div>
                        {(current || done) && (
                          <div className="text-[10px] text-muted-foreground leading-tight">{stage.desc}</div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Main tabs */}
        <div className="md:col-span-3">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent flex-wrap">
              {[
                { value: "overview",      label: "Overview" },
                { value: "tasks",         label: `Tasks (${projectTasks.length})` },
                { value: "punchlist",     label: `Punch List (${openPunch} open)` },
                { value: "budget",        label: `Budget (${projectBudget.length})` },
                { value: "rabills",       label: `RA Bills (${projectRaBills.length})` },
                { value: "stakeholders",  label: `Stakeholders (${projectStakeholders.length})` },
                { value: "documents",     label: `Documents (${projectDocs.length})` },
              ].map(t => (
                <TabsTrigger key={t.value} value={t.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="py-6">
              {/* ── Overview ── */}
              <TabsContent value="overview" className="m-0 space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Project Description</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{project.description || "No description provided."}</p>
                  </CardContent>
                </Card>

                {projectTasks.length > 0 && (() => {
                  const phases: Record<string, typeof projectTasks> = {};
                  for (const t of projectTasks) {
                    const m = (t.description ?? "").match(/^\[([^\]]+)\]/);
                    const phase = m ? m[1] : "Other";
                    (phases[phase] ??= []).push(t);
                  }
                  const phaseOrder = ["Initiation", "Planning", "Procurement", "Execution", "Closeout", "Other"];
                  const completed = projectTasks.filter(t => t.status === "completed").length;
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Project Task Phases</CardTitle>
                        <CardDescription>{completed}/{projectTasks.length} tasks complete</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {phaseOrder.filter(p => phases[p]).map(phase => {
                          const items = phases[phase]!;
                          const done = items.filter(t => t.status === "completed").length;
                          return (
                            <div key={phase}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{phase}</h4>
                                <span className="text-xs text-muted-foreground">{done}/{items.length}</span>
                              </div>
                              <div className="space-y-2">
                                {items.map(t => {
                                  const Icon = t.status === "completed" ? CheckCircle2 : t.status === "in_progress" ? Clock : Circle;
                                  const colour = t.status === "completed" ? "text-emerald-600" : t.status === "in_progress" ? "text-amber-600" : "text-muted-foreground";
                                  return (
                                    <div key={t.id} className="flex items-start gap-3 rounded-md border bg-background/50 px-3 py-2">
                                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colour}`} />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{t.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {t.startDate ? format(new Date(t.startDate), "MMM d") : "—"} → {t.endDate ? format(new Date(t.endDate), "MMM d, yyyy") : "—"}
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-[10px] capitalize">{t.status.replace("_", " ")}</Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })()}
              </TabsContent>

              {/* ── Tasks ── */}
              <TabsContent value="tasks" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {["todo", "in_progress", "completed"].map(status => {
                    const st = projectTasks.filter(t => t.status === status);
                    return (
                      <div key={status} className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-sm capitalize flex items-center justify-between">
                          {status.replace("_", " ")} <Badge variant="secondary">{st.length}</Badge>
                        </h3>
                        {st.map(task => (
                          <Card key={task.id} className="p-3 shadow-sm hover:border-primary/50 cursor-pointer transition-colors">
                            <div className="font-medium text-sm mb-1">{task.title}</div>
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                              <span>{task.assignedToName || "Unassigned"}</span>
                              <Badge variant="outline" className="text-[10px] h-4">{task.priority}</Badge>
                            </div>
                          </Card>
                        ))}
                        {st.length === 0 && (
                          <div className="text-xs text-center text-muted-foreground py-4 border border-dashed rounded bg-background/50">Empty</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* ── Punch List ── */}
              <TabsContent value="punchlist" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" /> QC Punch List
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {resolvedPunch}/{projectPunch.length} items resolved · {openPunch} open
                    </p>
                  </div>
                  <Dialog open={punchOpen} onOpenChange={setPunchOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Item</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>New Punch List Item</DialogTitle>
                        <DialogDescription>Record a defect, outstanding issue, or QC observation to be resolved before handover.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Title *</Label>
                          <Input value={punchForm.title} onChange={e => setPunchForm({ ...punchForm, title: e.target.value })} placeholder="Crack in column C4 plaster" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
                            <Select value={punchForm.category} onValueChange={v => setPunchForm({ ...punchForm, category: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PL_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Priority</Label>
                            <Select value={punchForm.priority} onValueChange={v => setPunchForm({ ...punchForm, priority: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Due date</Label>
                          <Input type="date" value={punchForm.dueDate} onChange={e => setPunchForm({ ...punchForm, dueDate: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
                          <Textarea value={punchForm.description} onChange={e => setPunchForm({ ...punchForm, description: e.target.value })} rows={2} placeholder="Location, severity, photos reference" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPunchOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreatePunch} disabled={!punchForm.title.trim() || createPunch.isPending}>
                          {createPunch.isPending ? "Adding..." : "Add item"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Summary bar */}
                {projectPunch.length > 0 && (
                  <div className="flex gap-3 flex-wrap">
                    {(["open", "in_progress", "resolved", "closed"] as const).map(s => {
                      const count = projectPunch.filter(p => p.status === s).length;
                      if (!count) return null;
                      const meta = PL_STATUS[s]!;
                      return (
                        <div key={s} className="flex items-center gap-1.5 text-sm">
                          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                          <span className="font-medium">{count}</span>
                          <span className="text-muted-foreground">{meta.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="rounded-md border bg-card overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Item</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Priority</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Due</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {projectPunch.map(item => {
                        const sm = PL_STATUS[item.status]!;
                        const isResolved = item.status === "resolved" || item.status === "closed";
                        return (
                          <tr key={item.id} className="hover:bg-accent/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium">{item.title}</div>
                              {item.description && <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>}
                              {item.resolvedAt && (
                                <div className="text-[10px] text-emerald-600 mt-0.5">Resolved {format(new Date(item.resolvedAt), "MMM d, yyyy")}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 capitalize">
                              <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={PL_PRIORITY[item.priority]} className="text-[10px] capitalize">{item.priority}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${sm.dot}`} />
                                <span className="text-xs">{sm.label}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {item.dueDate ? format(new Date(item.dueDate), "MMM d") : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {!isResolved ? (
                                <div className="flex gap-1">
                                  {item.status === "open" && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handlePunchStatus(item.id, "in_progress")}>
                                      Start
                                    </Button>
                                  )}
                                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handlePunchStatus(item.id, "resolved")}>
                                    <CheckCircle2 className="h-3 w-3" /> Resolve
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => handlePunchStatus(item.id, "open")}>
                                  Reopen
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {projectPunch.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No punch list items yet. Add items during QC inspection.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* ── Budget ── */}
              <TabsContent value="budget" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Budget Item</Button>
                </div>
                <div className="rounded-md border bg-card">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Cost Code</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium text-right">Budgeted</th>
                        <th className="px-4 py-3 font-medium text-right">Committed</th>
                        <th className="px-4 py-3 font-medium text-right">Actual</th>
                        <th className="px-4 py-3 font-medium text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {projectBudget.map(item => {
                        const variance = item.budgeted - item.actual;
                        return (
                          <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                            <td className="px-4 py-3 font-mono">{item.costCode}</td>
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right">{INR.format(item.budgeted)}</td>
                            <td className="px-4 py-3 text-right">{INR.format(item.committed)}</td>
                            <td className="px-4 py-3 text-right">{INR.format(item.actual)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${variance < 0 ? "text-destructive" : "text-emerald-600"}`}>
                              {INR.format(variance)}
                            </td>
                          </tr>
                        );
                      })}
                      {projectBudget.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No budget items found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* ── RA Bills ── */}
              <TabsContent value="rabills" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Create RA Bill</Button>
                </div>
                <div className="grid gap-4">
                  {projectRaBills.map(bill => (
                    <Card key={bill.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{bill.billNumber}</span>
                            <Badge variant={bill.status === "approved" || bill.status === "invoiced" ? "default" : "secondary"}>{bill.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{bill.description || bill.milestone}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl text-primary">{INR.format(bill.amount)}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(bill.createdAt), "MMM d, yyyy")}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {projectRaBills.length === 0 && (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No RA Bills found.</div>
                  )}
                </div>
              </TabsContent>

              {/* ── Stakeholders ── */}
              <TabsContent value="stakeholders" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Stakeholder</Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {projectStakeholders.map(sh => (
                    <Card key={sh.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold">{sh.name}</div>
                            <div className="text-sm text-muted-foreground">{sh.role}{sh.organization && ` • ${sh.organization}`}</div>
                          </div>
                          <Badge variant="outline">{sh.accessLevel}</Badge>
                        </div>
                        <div className="text-sm space-y-1 mt-3">
                          {sh.email && <div><a href={`mailto:${sh.email}`} className="text-primary hover:underline">{sh.email}</a></div>}
                          {sh.phone && <div><a href={`tel:${sh.phone}`} className="hover:underline">{sh.phone}</a></div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {projectStakeholders.length === 0 && (
                    <div className="col-span-2 text-center py-12 border rounded-lg border-dashed text-muted-foreground">No stakeholders added.</div>
                  )}
                </div>
              </TabsContent>

              {/* ── Documents ── */}
              <TabsContent value="documents" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Upload Document</Button>
                </div>
                <div className="rounded-md border bg-card">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Uploaded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {projectDocs.map(doc => (
                        <tr key={doc.id} className="hover:bg-accent/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-medium text-primary hover:underline cursor-pointer">{doc.fileName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge variant="outline">{doc.category}</Badge></td>
                          <td className="px-4 py-3"><Badge variant="secondary">{doc.status}</Badge></td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{format(new Date(doc.uploadedAt), "MMM d, yyyy")}</td>
                        </tr>
                      ))}
                      {projectDocs.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No documents found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
