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
  useListPunchListItemComments, getListPunchListItemCommentsQueryKey,
  useCreatePunchListItemComment,
  useCreatePunchListItem,
  useUpdatePunchListItem,
  useUpdateProject,
  useListTaskTemplates,
  useGetTaskTemplate, getGetTaskTemplateQueryKey,
  useApplyTaskTemplate,
  useUpdateRaBill,
  useUpdateStakeholder,
  useUpdateTask,
  type RaBill,
  type Stakeholder,
  type PunchListItem,
  type Task,
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
  AlertCircle, CheckCheck, ArrowRight, ClipboardList, LayoutTemplate,
  Eye, Pencil, Printer, MessageSquare, Camera, Upload, X, Send,
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

const TASK_STATUS_OPTIONS = [
  { value: "todo",        label: "Todo",        dot: "bg-muted-foreground" },
  { value: "in_progress", label: "In Progress", dot: "bg-amber-500" },
  { value: "in_review",   label: "In Review",   dot: "bg-sky-500" },
  { value: "completed",   label: "Completed",   dot: "bg-emerald-600" },
] as const;

function TaskStatusSelect({ task, projectId }: { task: Task; projectId: number }) {
  const qc = useQueryClient();
  const { mutate, isPending } = useUpdateTask({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListTasksQueryKey({ projectId }) }),
    },
  });
  const dot = TASK_STATUS_OPTIONS.find(o => o.value === task.status)?.dot ?? "bg-muted-foreground";
  return (
    <Select
      value={task.status}
      disabled={isPending}
      onValueChange={(val) => mutate({ id: task.id, data: { status: val as Task["status"] } })}
    >
      <SelectTrigger
        className="h-7 text-xs px-2 gap-1 w-[120px]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {TASK_STATUS_OPTIONS.map((s) => (
          <SelectItem key={s.value} value={s.value} className="text-xs">
            <span className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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

  const [activeTab, setActiveTab] = useState("overview");
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [punchOpen, setPunchOpen] = useState(false);
  const [punchForm, setPunchForm] = useState({ title: "", description: "", category: "general", priority: "medium", dueDate: "" });
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [applyStartDate, setApplyStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // RA Bill detail / print
  const [selectedBill, setSelectedBill] = useState<RaBill | null>(null);
  const updateRaBill = useUpdateRaBill();

  // Stakeholder edit
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [shForm, setShForm] = useState({ name: "", email: "", phone: "", organization: "", role: "", accessLevel: "read" });
  const updateStakeholder = useUpdateStakeholder();

  // Punch list detail drawer
  const [detailItem, setDetailItem] = useState<PunchListItem | null>(null);
  const [commentText, setCommentText] = useState("");
  const updatePunchPhotos = useUpdatePunchListItem();
  const addComment = useCreatePunchListItemComment();
  const { data: itemComments = [] } = useListPunchListItemComments(
    detailItem?.id ?? 0,
    { query: { enabled: !!detailItem, queryKey: getListPunchListItemCommentsQueryKey(detailItem?.id ?? 0) } },
  );

  const { data: templates } = useListTaskTemplates();
  const { data: previewTemplate } = useGetTaskTemplate(
    selectedTemplateId ? parseInt(selectedTemplateId) : 0,
    { query: { enabled: !!selectedTemplateId, queryKey: getGetTaskTemplateQueryKey(selectedTemplateId ? parseInt(selectedTemplateId) : 0) } }
  );
  const applyTemplate = useApplyTaskTemplate();

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

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) return;
    await applyTemplate.mutateAsync({
      id: parseInt(selectedTemplateId),
      data: { projectId, startDate: applyStartDate || null },
    });
    await qc.invalidateQueries({ queryKey: getListTasksQueryKey({ projectId }) });
    setApplyOpen(false);
    setSelectedTemplateId("");
  };

  // ── RA Bill print ─────────────────────────────────────────────────────────
  const handlePrintBill = (bill: RaBill) => {
    const w = window.open("", "_blank", "width=800,height=700");
    if (!w) return;

    // Escape text so no dynamic value can inject HTML/JS into the print popup.
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const statusColor: Record<string, string> = {
      draft: "#6b7280", submitted: "#2563eb", approved: "#16a34a",
      rejected: "#dc2626", invoiced: "#9333ea",
    };
    const color = statusColor[bill.status] ?? "#6b7280";
    const amtFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
    const dateStr = new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    // Build table rows using text nodes (safe from XSS) then serialise.
    const doc = w.document;
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>RA Bill</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#111;padding:40px;max-width:720px;margin:auto}
        h1{font-size:22px;margin-bottom:4px}
        .sub{color:#555;font-size:13px;margin-bottom:28px}
        .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;color:#fff;background:${color};margin-left:10px;vertical-align:middle;text-transform:capitalize}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th{text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.05em}
        td{padding:10px 12px;border:1px solid #e5e7eb;font-size:14px}
        .amount{font-size:28px;font-weight:700;color:#1a1a1a;margin:24px 0 8px}
        .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#aaa;display:flex;justify-content:space-between}
        @media print{body{padding:24px}.no-print{display:none!important}}
      </style>
    </head><body>
      <div class="no-print" style="margin-bottom:20px">
        <button onclick="window.print()" style="padding:8px 20px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">&#128424; Print / Save PDF</button>
        <button onclick="window.close()" style="margin-left:10px;padding:8px 16px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:14px">Close</button>
      </div>
      <h1>Running Account Bill <span class="badge">${esc(bill.status)}</span></h1>
      <div class="sub">${esc(bill.projectName ?? "Project")} &nbsp;&middot;&nbsp; ${esc(bill.billNumber)}</div>
      <div class="amount">${esc(amtFmt.format(bill.amount))}</div>
      <table>
        <tr><th>Bill No.</th><td>${esc(bill.billNumber)}</td><th>Date</th><td>${esc(dateStr)}</td></tr>
        ${bill.milestone ? `<tr><th>Milestone</th><td colspan="3">${esc(bill.milestone)}</td></tr>` : ""}
        ${bill.description ? `<tr><th>Description</th><td colspan="3">${esc(bill.description)}</td></tr>` : ""}
        <tr><th>Status</th><td style="text-transform:capitalize;font-weight:600;color:${color}">${esc(bill.status)}</td><th>Amount</th><td style="font-weight:700">${esc(amtFmt.format(bill.amount))}</td></tr>
      </table>
      <div class="footer"><span>Kanak Turnkey Projects</span><span>Generated ${esc(new Date().toLocaleString("en-IN"))}</span></div>
    </body></html>`);
    doc.close();
    w.focus();
  };

  // ── Stakeholder edit ──────────────────────────────────────────────────────
  const openEditStakeholder = (sh: Stakeholder) => {
    setEditingStakeholder(sh);
    setShForm({
      name: sh.name,
      email: sh.email ?? "",
      phone: sh.phone ?? "",
      organization: sh.organization ?? "",
      role: sh.role ?? "",
      accessLevel: sh.accessLevel,
    });
  };

  const handleSaveStakeholder = async () => {
    if (!editingStakeholder || !shForm.name.trim()) return;
    await updateStakeholder.mutateAsync({
      id: editingStakeholder.id,
      data: {
        name: shForm.name,
        email: shForm.email || null,
        phone: shForm.phone || null,
        organization: shForm.organization || null,
        role: shForm.role || null,
        accessLevel: shForm.accessLevel as "read" | "write" | "admin",
      },
    });
    await qc.invalidateQueries({ queryKey: getListStakeholdersQueryKey({ projectId }) });
    setEditingStakeholder(null);
  };

  // ── Punch list photo upload ───────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!detailItem || !e.target.files?.length) return;
    const files = Array.from(e.target.files);
    const toDataURL = (f: File): Promise<string> =>
      new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
    const newDataUrls = await Promise.all(files.map(toDataURL));
    const photos = [...(detailItem.photos ?? []), ...newDataUrls];
    await updatePunchPhotos.mutateAsync({ id: detailItem.id, data: { photos } });
    await qc.invalidateQueries({ queryKey: getListPunchListItemsQueryKey({ projectId }) });
    // update local state so photos appear instantly
    setDetailItem(prev => prev ? { ...prev, photos } : null);
    e.target.value = "";
  };

  const handleRemovePhoto = async (idx: number) => {
    if (!detailItem) return;
    const photos = detailItem.photos.filter((_, i) => i !== idx);
    await updatePunchPhotos.mutateAsync({ id: detailItem.id, data: { photos } });
    await qc.invalidateQueries({ queryKey: getListPunchListItemsQueryKey({ projectId }) });
    setDetailItem(prev => prev ? { ...prev, photos } : null);
  };

  // ── Punch list comment submit ─────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!detailItem || !commentText.trim()) return;
    await addComment.mutateAsync({ id: detailItem.id, data: { text: commentText.trim(), authorName: "" } });
    await qc.invalidateQueries({ queryKey: getListPunchListItemCommentsQueryKey(detailItem.id) });
    setCommentText("");
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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

                {/* ── Workflow Next-Steps Guide ── */}
                {(() => {
                  type Action = { icon: React.ReactNode; label: string; desc: string; tab?: string; done?: boolean };
                  const guide: Record<string, { title: string; actions: Action[] }> = {
                    planning: {
                      title: "Start by setting up the project foundation",
                      actions: [
                        { icon: <LayoutTemplate className="h-4 w-4" />, label: "Apply a task template", desc: "Generate the full task plan in one click", tab: "tasks", done: projectTasks.length > 0 },
                        { icon: <CheckCircle2 className="h-4 w-4" />, label: "Add budget items", desc: "Set up cost codes and allocated amounts", tab: "budget", done: projectBudget.length > 0 },
                        { icon: <Circle className="h-4 w-4" />, label: "Add stakeholders", desc: "Client, consultants, contractors", tab: "stakeholders", done: projectStakeholders.length > 0 },
                        { icon: <FileText className="h-4 w-4" />, label: "Upload key documents", desc: "Drawings, approvals, contracts", tab: "documents", done: projectDocs.length > 0 },
                      ],
                    },
                    procurement: {
                      title: "Procurement phase — source materials and vendors",
                      actions: [
                        { icon: <Circle className="h-4 w-4" />, label: "Raise material requests", desc: "List all materials needed", done: false },
                        { icon: <Circle className="h-4 w-4" />, label: "Send RFQs to vendors", desc: "Compare quotations before ordering" },
                        { icon: <Circle className="h-4 w-4" />, label: "Create purchase orders", desc: "Issue approved POs to vendors" },
                        { icon: <CheckCircle2 className="h-4 w-4" />, label: "Update task progress", desc: "Mark procurement tasks as done", tab: "tasks", done: projectTasks.filter(t => t.status === "completed").length > 0 },
                      ],
                    },
                    execution: {
                      title: "Execution phase — track site progress",
                      actions: [
                        { icon: <Clock className="h-4 w-4" />, label: "Update task status", desc: "Move tasks to In Progress / Completed", tab: "tasks", done: projectTasks.filter(t => t.status === "in_progress" || t.status === "completed").length > 0 },
                        { icon: <Circle className="h-4 w-4" />, label: "Log expenses", desc: "Record site costs against budget", tab: "budget", done: false },
                        { icon: <Circle className="h-4 w-4" />, label: "Create RA bills", desc: "Raise running account bills at milestones", tab: "rabills", done: projectRaBills.length > 0 },
                        { icon: <FileText className="h-4 w-4" />, label: "Upload progress photos", desc: "Document work done on site", tab: "documents" },
                      ],
                    },
                    qc: {
                      title: "QC phase — inspect, punch, and clear",
                      actions: [
                        { icon: <ClipboardList className="h-4 w-4" />, label: "Add punch list items", desc: "Record every defect during inspection", tab: "punchlist", done: projectPunch.length > 0 },
                        { icon: <CheckCircle2 className="h-4 w-4" />, label: "Resolve open items", desc: `${openPunch} item${openPunch !== 1 ? "s" : ""} still open`, tab: "punchlist", done: openPunch === 0 && projectPunch.length > 0 },
                        { icon: <FileText className="h-4 w-4" />, label: "Upload test reports", desc: "MEP commissioning, structural audits", tab: "documents" },
                        { icon: <Circle className="h-4 w-4" />, label: "Complete all tasks", desc: `${projectTasks.filter(t => t.status !== "completed").length} tasks remaining`, tab: "tasks" },
                      ],
                    },
                    handover: {
                      title: "Handover — finalise, sign off, and close",
                      actions: [
                        { icon: <FileText className="h-4 w-4" />, label: "Upload as-built drawings", desc: "Final design documentation", tab: "documents" },
                        { icon: <Circle className="h-4 w-4" />, label: "Clear all punch list items", desc: `${openPunch} item${openPunch !== 1 ? "s" : ""} still open`, tab: "punchlist", done: openPunch === 0 },
                        { icon: <Circle className="h-4 w-4" />, label: "Issue final invoice", desc: "Raise balance payment invoice" },
                        { icon: <Circle className="h-4 w-4" />, label: "Get client sign-off", desc: "Upload acceptance certificate", tab: "documents" },
                      ],
                    },
                    archived: {
                      title: "Project archived — all done",
                      actions: [
                        { icon: <CheckCircle2 className="h-4 w-4" />, label: "Project complete", desc: "All work finished and handed over", done: true },
                      ],
                    },
                  };

                  const stageKey = project.status in guide ? project.status : "planning";
                  const g = guide[stageKey]!;
                  const doneCount = g.actions.filter(a => a.done).length;

                  return (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base text-primary">{g.title}</CardTitle>
                          <span className="text-xs font-medium text-muted-foreground">{doneCount}/{g.actions.length} done</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {g.actions.map((action, i) => (
                            <button
                              key={i}
                              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all
                                ${action.done
                                  ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 opacity-70"
                                  : "border-border bg-background hover:border-primary/40 hover:bg-accent/50 cursor-pointer"}`}
                              onClick={() => { if (action.tab) setActiveTab(action.tab); }}
                            >
                              <span className={`mt-0.5 shrink-0 ${action.done ? "text-emerald-600" : "text-primary"}`}>
                                {action.done ? <CheckCircle2 className="h-4 w-4" /> : action.icon}
                              </span>
                              <div className="min-w-0">
                                <div className={`text-sm font-medium ${action.done ? "line-through text-muted-foreground" : ""}`}>{action.label}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{action.desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

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
                                      <TaskStatusSelect task={t} projectId={projectId} />
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
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    {projectTasks.filter(t => t.status === "completed").length}/{projectTasks.length} tasks complete
                  </div>
                  <div className="flex gap-2">
                    {/* Apply Template Dialog */}
                    <Dialog open={applyOpen} onOpenChange={o => { setApplyOpen(o); if (!o) setSelectedTemplateId(""); }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2">
                          <LayoutTemplate className="h-4 w-4" /> Apply Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Apply Task Template</DialogTitle>
                          <DialogDescription>
                            Select a master template to generate a full task plan for this project. Tasks are sequenced automatically from the start date.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Template *</Label>
                              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                <SelectTrigger><SelectValue placeholder="Choose template…" /></SelectTrigger>
                                <SelectContent>
                                  {templates?.map(t => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                      {t.name} ({t.itemCount} tasks)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Start date</Label>
                              <Input
                                type="date"
                                value={applyStartDate}
                                onChange={e => setApplyStartDate(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Template preview */}
                          {previewTemplate && (
                            <div className="rounded-md border bg-muted/30 overflow-hidden">
                              <div className="px-4 py-2 bg-muted border-b flex items-center justify-between">
                                <span className="text-sm font-medium">{previewTemplate.name}</span>
                                <Badge variant="outline">{previewTemplate.itemCount} tasks</Badge>
                              </div>
                              <div className="p-3 max-h-64 overflow-y-auto space-y-3">
                                {(() => {
                                  const grouped = previewTemplate.items.reduce<Record<string, typeof previewTemplate.items>>((acc, item) => {
                                    const ph = item.phase ?? "General";
                                    (acc[ph] ??= []).push(item);
                                    return acc;
                                  }, {});
                                  return Object.entries(grouped).map(([phase, items]) => (
                                    <div key={phase}>
                                      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{phase}</div>
                                      <div className="space-y-1">
                                        {items!.map(item => (
                                          <div key={item.id} className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-background/60">
                                            <span className="flex-1">{item.title}</span>
                                            {item.estimatedDays && <span className="text-muted-foreground shrink-0">~{item.estimatedDays}d</span>}
                                            <Badge variant={item.priority === "high" ? "destructive" : item.priority === "medium" ? "secondary" : "outline"} className="text-[10px] shrink-0">{item.priority}</Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                          {selectedTemplateId && !previewTemplate && (
                            <div className="text-sm text-muted-foreground text-center py-4">Loading preview…</div>
                          )}
                        </div>
                        <DialogFooter className="pt-2 border-t">
                          <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
                          <Button
                            onClick={handleApplyTemplate}
                            disabled={!selectedTemplateId || applyTemplate.isPending}
                          >
                            {applyTemplate.isPending
                              ? "Generating tasks…"
                              : `Apply${previewTemplate ? ` (${previewTemplate.itemCount} tasks)` : ""}`}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
                  </div>
                </div>

                {projectTasks.length === 0 ? (
                  <div className="rounded-md border border-dashed p-12 text-center space-y-3 text-muted-foreground">
                    <LayoutTemplate className="h-10 w-10 mx-auto opacity-30" />
                    <p className="font-medium">No tasks yet</p>
                    <p className="text-sm">Apply a template to generate a complete task plan in one click, or add tasks manually.</p>
                    <Button size="sm" variant="outline" className="gap-2 mt-2" onClick={() => setApplyOpen(true)}>
                      <LayoutTemplate className="h-4 w-4" /> Apply Template
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-4">
                    {TASK_STATUS_OPTIONS.map(({ value: status, label, dot }) => {
                      const st = projectTasks.filter(t => t.status === status);
                      return (
                        <div key={status} className="bg-muted/50 p-4 rounded-lg space-y-3">
                          <h3 className="font-semibold text-sm flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${dot}`} />
                              {label}
                            </span>
                            <Badge variant="secondary">{st.length}</Badge>
                          </h3>
                          {st.map(task => (
                            <Card key={task.id} className="p-3 shadow-sm hover:border-primary/50 transition-colors">
                              <div className="font-medium text-sm mb-1">{task.title}</div>
                              <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                                <span>{task.assignedToName || "Unassigned"}</span>
                                <Badge variant="outline" className="text-[10px] h-4">{task.priority}</Badge>
                              </div>
                              <div className="mt-2">
                                <TaskStatusSelect task={task} projectId={projectId} />
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
                )}
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
                              <button
                                className="text-left group"
                                onClick={() => { setDetailItem(item); setCommentText(""); }}
                              >
                                <div className="font-medium group-hover:text-primary transition-colors">{item.title}</div>
                                {item.description && <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>}
                                {item.resolvedAt && (
                                  <div className="text-[10px] text-emerald-600 mt-0.5">Resolved {format(new Date(item.resolvedAt), "MMM d, yyyy")}</div>
                                )}
                              </button>
                              <div className="flex items-center gap-2 mt-1">
                                {(item.photos?.length ?? 0) > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                    <Camera className="h-2.5 w-2.5" />{item.photos.length}
                                  </span>
                                )}
                              </div>
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
                              <div className="flex gap-1 items-center">
                                <Button size="icon" variant="ghost" className="h-7 w-7" title="Photos & Comments" onClick={() => { setDetailItem(item); setCommentText(""); }}>
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </Button>
                                {!isResolved ? (
                                  <>
                                    {item.status === "open" && (
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handlePunchStatus(item.id, "in_progress")}>
                                        Start
                                      </Button>
                                    )}
                                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handlePunchStatus(item.id, "resolved")}>
                                      <CheckCircle2 className="h-3 w-3" /> Resolve
                                    </Button>
                                  </>
                                ) : (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => handlePunchStatus(item.id, "open")}>
                                    Reopen
                                  </Button>
                                )}
                              </div>
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

              {/* ── Punch List Detail Dialog ── */}
              <Dialog open={!!detailItem} onOpenChange={(o) => { if (!o) setDetailItem(null); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
                  {detailItem && (
                    <>
                      {/* Header */}
                      <div className="px-6 pt-6 pb-4 border-b shrink-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <DialogTitle className="text-lg font-semibold leading-tight">{detailItem.title}</DialogTitle>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <Badge variant="outline" className="capitalize text-[10px]">{detailItem.category}</Badge>
                              <Badge variant={PL_PRIORITY[detailItem.priority]} className="capitalize text-[10px]">{detailItem.priority}</Badge>
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <span className={`h-2 w-2 rounded-full ${PL_STATUS[detailItem.status]?.dot}`} />
                                {PL_STATUS[detailItem.status]?.label}
                              </span>
                              {detailItem.dueDate && (
                                <span className="text-xs text-muted-foreground">Due {format(new Date(detailItem.dueDate), "MMM d, yyyy")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {detailItem.description && (
                          <p className="text-sm text-muted-foreground mt-3">{detailItem.description}</p>
                        )}
                      </div>

                      {/* Scrollable body */}
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                        {/* Photos */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <Camera className="h-4 w-4 text-primary" /> Photos
                              {detailItem.photos?.length > 0 && (
                                <span className="text-xs font-normal text-muted-foreground">({detailItem.photos.length})</span>
                              )}
                            </h3>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handlePhotoUpload}
                                disabled={updatePunchPhotos.isPending}
                              />
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent transition-colors">
                                <Upload className="h-3.5 w-3.5" />
                                {updatePunchPhotos.isPending ? "Uploading…" : "Add Photos"}
                              </span>
                            </label>
                          </div>
                          {detailItem.photos?.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {detailItem.photos.map((src, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
                                  <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemovePhoto(idx)}
                                    title="Remove photo"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <label className="cursor-pointer block">
                              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={updatePunchPhotos.isPending} />
                              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground hover:border-primary/40 hover:bg-accent/20 transition-colors">
                                <Camera className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Click to upload site photos</p>
                                <p className="text-xs mt-1 opacity-60">JPG, PNG, HEIC supported</p>
                              </div>
                            </label>
                          )}
                        </div>

                        {/* Comments */}
                        <div>
                          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                            <MessageSquare className="h-4 w-4 text-primary" /> Comments
                            {itemComments.length > 0 && (
                              <span className="text-xs font-normal text-muted-foreground">({itemComments.length})</span>
                            )}
                          </h3>
                          {itemComments.length > 0 ? (
                            <div className="space-y-3 mb-4">
                              {itemComments.map(c => (
                                <div key={c.id} className="flex gap-3">
                                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary uppercase">
                                    {c.authorName.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xs font-semibold">{c.authorName}</span>
                                      <span className="text-[10px] text-muted-foreground">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>
                                    </div>
                                    <p className="text-sm mt-0.5 text-muted-foreground whitespace-pre-wrap break-words">{c.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-4">No comments yet. Add a note or observation below.</p>
                          )}
                          <div className="flex gap-2 items-end">
                            <Textarea
                              placeholder="Add a comment or field note…"
                              value={commentText}
                              onChange={e => setCommentText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
                              rows={2}
                              className="resize-none flex-1 text-sm"
                            />
                            <Button
                              size="icon"
                              className="h-9 w-9 shrink-0"
                              onClick={handleAddComment}
                              disabled={!commentText.trim() || addComment.isPending}
                              title="Send (Ctrl+Enter)"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-4 border-t bg-muted/30 shrink-0 flex justify-between items-center gap-3">
                        <div className="flex gap-2">
                          {(detailItem.status === "open" || detailItem.status === "in_progress") && (
                            <Button size="sm" className="gap-1.5" onClick={async () => {
                              await handlePunchStatus(detailItem.id, "resolved");
                              setDetailItem(prev => prev ? { ...prev, status: "resolved" as const } : null);
                            }}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                            </Button>
                          )}
                          {(detailItem.status === "resolved" || detailItem.status === "closed") && (
                            <Button size="sm" variant="outline" onClick={async () => {
                              await handlePunchStatus(detailItem.id, "open");
                              setDetailItem(prev => prev ? { ...prev, status: "open" as const } : null);
                            }}>
                              Reopen
                            </Button>
                          )}
                          {detailItem.status === "open" && (
                            <Button size="sm" variant="outline" onClick={async () => {
                              await handlePunchStatus(detailItem.id, "in_progress");
                              setDetailItem(prev => prev ? { ...prev, status: "in_progress" as const } : null);
                            }}>
                              Start
                            </Button>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setDetailItem(null)}>Close</Button>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>

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
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-lg">{bill.billNumber}</span>
                            <Badge variant={bill.status === "approved" || bill.status === "invoiced" ? "default" : "secondary"} className="capitalize">{bill.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{bill.description || bill.milestone || "—"}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="font-bold text-xl text-primary">{INR.format(bill.amount)}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(bill.createdAt), "MMM d, yyyy")}</div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="View / Print"
                              onClick={() => setSelectedBill(bill)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Print"
                              onClick={() => handlePrintBill(bill)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {projectRaBills.length === 0 && (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No RA Bills found.</div>
                  )}
                </div>
              </TabsContent>

              {/* ── RA Bill Detail Dialog ── */}
              <Dialog open={!!selectedBill} onOpenChange={(o) => !o && setSelectedBill(null)}>
                <DialogContent className="max-w-lg">
                  {selectedBill && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {selectedBill.billNumber}
                          <Badge variant={selectedBill.status === "approved" || selectedBill.status === "invoiced" ? "default" : "secondary"} className="capitalize ml-1">{selectedBill.status}</Badge>
                        </DialogTitle>
                        <DialogDescription>{selectedBill.projectName ?? project.name}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-5 py-2">
                        <div className="rounded-lg border p-4 bg-muted/30 text-center">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bill Amount</p>
                          <p className="text-3xl font-bold text-primary">{INR.format(selectedBill.amount)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bill Number</p>
                            <p className="font-medium font-mono">{selectedBill.billNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                            <p className="font-medium">{format(new Date(selectedBill.createdAt), "MMM d, yyyy")}</p>
                          </div>
                          {selectedBill.milestone && (
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Milestone</p>
                              <p className="font-medium">{selectedBill.milestone}</p>
                            </div>
                          )}
                          {selectedBill.description && (
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                              <p className="text-muted-foreground">{selectedBill.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSelectedBill(null)}>Close</Button>
                        <Button onClick={() => handlePrintBill(selectedBill)} className="gap-2">
                          <Printer className="h-4 w-4" /> Print / Save PDF
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>

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
                          <div className="min-w-0">
                            <div className="font-bold">{sh.name}</div>
                            <div className="text-sm text-muted-foreground">{sh.role}{sh.organization && ` • ${sh.organization}`}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <Badge variant="outline">{sh.accessLevel}</Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Edit stakeholder"
                              onClick={() => openEditStakeholder(sh)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

              {/* ── Stakeholder Edit Dialog ── */}
              <Dialog open={!!editingStakeholder} onOpenChange={(o) => !o && setEditingStakeholder(null)}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Stakeholder</DialogTitle>
                    <DialogDescription>Update contact info and role for this stakeholder.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="sh-name">Name <span className="text-destructive">*</span></Label>
                      <Input id="sh-name" value={shForm.name} onChange={e => setShForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sh-role">Role / Title</Label>
                      <Input id="sh-role" value={shForm.role} onChange={e => setShForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Project Manager, Client" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sh-org">Organisation</Label>
                      <Input id="sh-org" value={shForm.organization} onChange={e => setShForm(f => ({ ...f, organization: e.target.value }))} placeholder="Company or firm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="sh-email">Email</Label>
                        <Input id="sh-email" type="email" value={shForm.email} onChange={e => setShForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sh-phone">Phone</Label>
                        <Input id="sh-phone" value={shForm.phone} onChange={e => setShForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 ..." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sh-access">Access Level</Label>
                      <Select value={shForm.accessLevel} onValueChange={v => setShForm(f => ({ ...f, accessLevel: v }))}>
                        <SelectTrigger id="sh-access">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read — view only</SelectItem>
                          <SelectItem value="write">Write — can update</SelectItem>
                          <SelectItem value="admin">Admin — full access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingStakeholder(null)} disabled={updateStakeholder.isPending}>Cancel</Button>
                    <Button onClick={handleSaveStakeholder} disabled={updateStakeholder.isPending || !shForm.name.trim()}>
                      {updateStakeholder.isPending ? "Saving…" : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
