import { useState, useEffect } from "react";
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
  getListProjectsQueryKey,
  useListTaskTemplates,
  useGetTaskTemplate, getGetTaskTemplateQueryKey,
  useApplyTaskTemplate,
  useUpdateRaBill,
  useUpdateStakeholder,
  useUpdateTask,
  useCreateTask,
  useCreateBudgetItem,
  useCreateRaBill,
  useCreateStakeholder,
  useCreateDocument,
  usePermissions,
  PERMISSIONS,
  type RaBill,
  type Stakeholder,
  type PunchListItem,
  type Task,
} from "@workspace/api-client-react";
import { PermissionGate, MaskedFinancialValue, AccessDeniedView } from "@/components/auth/permission-gate";
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
  Compass, Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ProjectJourneyView } from "./project-journey";
import { ProjectCommercialControl } from "@/components/project/project-commercial-control";
import { ProjectVendorsTab } from "@/components/project/project-vendors-tab";
import { ProjectExecutionTab } from "@/components/project/project-execution-tab";
import { ProjectProcurementTab } from "@/components/project/project-procurement-tab";
import { ProjectGanttChart } from "@/components/project/project-gantt-chart";
import { ProjectBudgetTab } from "@/components/project/project-budget-tab";

// ── Turnkey 4-Phase Governed Delivery ─────────────────────────────────────────
const TURNKEY_PHASES = [
  {
    phaseId: 1,
    label: "1. Planning & Setup",
    desc: "Mobilization, WBS & Budget",
    targetTab: "journey",
  },
  {
    phaseId: 2,
    label: "2. Procurement & Sourcing",
    desc: "Material RFQs, POs & Delivery",
    targetTab: "procurement",
  },
  {
    phaseId: 3,
    label: "3. Site Execution & JMR",
    desc: "Subcontracts & JMR Sheets",
    targetTab: "execution",
  },
  {
    phaseId: 4,
    label: "4. Billing & Handover",
    desc: "RA Bills, Invoices & VCC",
    targetTab: "commercial",
  },
] as const;

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
  const { mutate, isPending } = useUpdateTask();
  const dot = TASK_STATUS_OPTIONS.find(o => o.value === task.status)?.dot ?? "bg-muted-foreground";
  return (
    <Select
      value={task.status}
      disabled={isPending}
      onValueChange={(val) =>
        mutate(
          { id: task.id, data: { status: val as Task["status"] } as any },
          { onSuccess: () => qc.invalidateQueries({ queryKey: (getListTasksQueryKey as any)({ projectId }) }) }
        )
      }
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
  const { toast } = useToast();
  const { activeRole, canViewFinancials, isAdmin } = usePermissions();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  const enabled = !!projectId;
  const { data: tasks, refetch: refetchTasks } = useListTasks({ projectId }, { query: { enabled, queryKey: (getListTasksQueryKey as any)({ projectId }) } });
  const isSiteEngineer = activeRole === "engineer" || activeRole === "site_engineer";
  const { data: budgetItems }  = useListBudgetItems(projectId, { query: { enabled: enabled && canViewFinancials && !isSiteEngineer, queryKey: getListBudgetItemsQueryKey(projectId) } });
  const { data: raBills }      = useListRaBills({ projectId }, { query: { enabled, queryKey: getListRaBillsQueryKey({ projectId }) } });
  const { data: stakeholders } = useListStakeholders({ projectId }, { query: { enabled, queryKey: getListStakeholdersQueryKey({ projectId }) } });
  const { data: documents }    = useListDocuments({ projectId }, { query: { enabled, queryKey: getListDocumentsQueryKey({ projectId }) } });
  const { data: punchItems }   = useListPunchListItems({ projectId }, { query: { enabled, queryKey: getListPunchListItemsQueryKey({ projectId }) } });

  const updateProject  = useUpdateProject();

  // ── Edit Project Dialog State ──────────────────────────────────────────────
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editProjForm, setEditProjForm] = useState({
    name: "",
    clientName: "",
    budget: "",
    location: "",
    type: "",
    status: "planning",
    progress: 0,
    lifecycleStage: "setup",
    startDate: "",
    endDate: "",
    teamSize: "",
    description: "",
  });

  const openEditProject = () => {
    if (!project) return;
    setEditProjForm({
      name: project.name || "",
      clientName: project.clientName || "",
      budget: project.budget != null ? String(project.budget) : "",
      location: project.location || "",
      type: project.type || "",
      status: project.status || "planning",
      progress: project.progress ?? 0,
      lifecycleStage: (project as any).lifecycleStage || "setup",
      startDate: project.startDate ? format(new Date(project.startDate), "yyyy-MM-dd") : "",
      endDate: project.endDate ? format(new Date(project.endDate), "yyyy-MM-dd") : "",
      teamSize: project.teamSize != null ? String(project.teamSize) : "",
      description: project.description || "",
    });
    setEditProjectOpen(true);
  };

  const handleSaveProject = async () => {
    if (!editProjForm.name.trim()) {
      toast({ title: "Validation Error", description: "Project name is required.", variant: "destructive" });
      return;
    }
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          name: editProjForm.name.trim(),
          clientName: editProjForm.clientName.trim() || undefined,
          budget: editProjForm.budget ? Number(editProjForm.budget) : undefined,
          location: editProjForm.location.trim() || undefined,
          type: editProjForm.type.trim() || undefined,
          status: editProjForm.status as any,
          progress: Number(editProjForm.progress) || 0,
          lifecycleStage: editProjForm.lifecycleStage as any,
          startDate: editProjForm.startDate || undefined,
          endDate: editProjForm.endDate || undefined,
          teamSize: editProjForm.teamSize ? Number(editProjForm.teamSize) : undefined,
          description: editProjForm.description.trim() || undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      await qc.invalidateQueries({ queryKey: (getListProjectsQueryKey as any)() });
      await qc.invalidateQueries({ queryKey: [`/api/projects/${projectId}/setup-checklist`] });
      setEditProjectOpen(false);
      toast({
        title: "Project Updated",
        description: "Project details saved to database successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to update project",
        description: err.message || "Could not save project details.",
        variant: "destructive",
      });
    }
  };
  const createPunch    = useCreatePunchListItem();
  const updatePunch    = useUpdatePunchListItem();

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "team" || tabParam === "overview") return "journey";
    return tabParam || "journey";
  });

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "overview" && project) {
      openEditProject();
    }
  }, [project]);

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "team") {
      setActiveTab("journey");
      setTimeout(() => {
        const el = document.getElementById("project-team-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-primary/40", "shadow-xl", "rounded-xl", "transition-all", "duration-500");
          setTimeout(() => el.classList.remove("ring-4", "ring-primary/40", "shadow-xl"), 2500);
        }
      }, 350);
    }
  }, []);
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

  // ── Add Task ──────────────────────────────────────────────────────────────
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", startDate: "", endDate: "" });
  const createTask = useCreateTask();

  // ── Add Budget Item ───────────────────────────────────────────────────────
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ costCode: "", description: "", budgeted: "", actual: "0", committed: "0" });
  const createBudgetItem = useCreateBudgetItem();

  // ── Create RA Bill ────────────────────────────────────────────────────────
  const [createBillOpen, setCreateBillOpen] = useState(false);
  const [billForm, setBillForm] = useState({ billNumber: "", description: "", amount: "", milestone: "" });
  const createRaBill = useCreateRaBill();

  // ── Add Stakeholder ───────────────────────────────────────────────────────
  const [addStakeholderOpen, setAddStakeholderOpen] = useState(false);
  const [newShForm, setNewShForm] = useState({ name: "", email: "", phone: "", organization: "", role: "", accessLevel: "read" });
  const createStakeholder = useCreateStakeholder();

  // ── Upload Document ───────────────────────────────────────────────────────
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [docForm, setDocForm] = useState({ fileName: "", category: "general", fileType: "", fileUrl: "" });
  const [selectedDocFiles, setSelectedDocFiles] = useState<File[]>([]);
  const createDocument = useCreateDocument();

  if (isLoading) return <div className="p-6">Loading project details...</div>;
  if (!project)  return <div className="p-6 text-destructive">Project not found</div>;

  // Deduplicate tasks by title and projectId
  const uniqueTasksMap = new Map<string, Task>();
  for (const t of tasks || []) {
    if (t.projectId === projectId) {
      const key = t.title.trim().toLowerCase();
      if (uniqueTasksMap.has(key)) {
        const existing = uniqueTasksMap.get(key)!;
        if (existing.status === "todo" && t.status !== "todo") {
          uniqueTasksMap.set(key, t);
        }
      } else {
        uniqueTasksMap.set(key, t);
      }
    }
  }
  const projectTasks        = Array.from(uniqueTasksMap.values());
  const projectBudget       = budgetItems?.filter(b => b.projectId === projectId) || [];
  const projectRaBills      = raBills?.filter(r => r.projectId === projectId) || [];
  const projectStakeholders = stakeholders?.filter(s => s.projectId === projectId) || [];
  const projectDocs         = documents?.filter(d => d.projectId === projectId) || [];
  const projectPunch        = punchItems?.filter(p => p.projectId === projectId) || [];

  const openPunch     = projectPunch.filter(p => p.status === "open" || p.status === "in_progress").length;
  const resolvedPunch = projectPunch.filter(p => p.status === "resolved" || p.status === "closed").length;

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
    try {
      const res = await applyTemplate.mutateAsync({
        id: parseInt(selectedTemplateId),
        data: { projectId, startDate: applyStartDate || null },
      });
      await qc.invalidateQueries({ queryKey: (getListTasksQueryKey as any)({ projectId }) });
      await qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      await refetchTasks();
      setApplyOpen(false);
      setSelectedTemplateId("");
      toast({
        title: "Task Template Applied!",
        description: `Successfully generated ${(res as any)?.tasksCreated ?? 26} tasks for this project.`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to Apply Template",
        description: err.message || "An error occurred while generating tasks.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return;
    try {
      await createTask.mutateAsync({
        data: {
          projectId,
          title: taskForm.title.trim(),
          description: taskForm.description || null,
          priority: taskForm.priority as "high" | "medium" | "low",
          startDate: taskForm.startDate || null,
          endDate: taskForm.endDate || null,
        },
      });
      await qc.invalidateQueries({ queryKey: (getListTasksQueryKey as any)({ projectId }) });
      await qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      await qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      await refetchTasks();
      setAddTaskOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium", startDate: "", endDate: "" });
      toast({ title: "Task Added", description: `Task "${taskForm.title}" created successfully.` });
    } catch (err: any) {
      toast({ title: "Failed to add task", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateBudgetItem = async () => {
    if (!budgetForm.costCode.trim() || !budgetForm.description.trim() || !budgetForm.budgeted) return;
    try {
      await createBudgetItem.mutateAsync({
        data: {
          projectId,
          costCode: budgetForm.costCode.trim(),
          description: budgetForm.description.trim(),
          budgeted: String(budgetForm.budgeted),
          committed: String(budgetForm.committed || 0),
          actual: String(budgetForm.actual || 0),
        },
      });
      await qc.invalidateQueries({ queryKey: getListBudgetItemsQueryKey(projectId) });
      await qc.invalidateQueries({ queryKey: [`/api/projects/${projectId}/budget`] });
      await qc.invalidateQueries({ queryKey: ["/api/projects", projectId, "budget-variance"] });
      await qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      await qc.invalidateQueries({ queryKey: ["/api/budget-items"] });
      setAddBudgetOpen(false);
      setBudgetForm({ costCode: "", description: "", budgeted: "", actual: "0", committed: "0" });
      toast({ title: "Budget Item Added", description: `Budget code ${budgetForm.costCode} added successfully.` });
    } catch (err: any) {
      toast({ title: "Failed to add budget item", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateRaBill = async () => {
    if (!billForm.billNumber.trim() || !billForm.amount) return;
    try {
      await createRaBill.mutateAsync({
        data: {
          projectId,
          billNumber: billForm.billNumber.trim(),
          amount: String(billForm.amount),
          milestone: billForm.milestone || null,
          description: billForm.description || null,
        },
      });
      await qc.invalidateQueries({ queryKey: getListRaBillsQueryKey({ projectId }) });
      await qc.invalidateQueries({ queryKey: ["/api/ra-bills"] });
      setCreateBillOpen(false);
      setBillForm({ billNumber: "", description: "", amount: "", milestone: "" });
      toast({ title: "RA Bill Created", description: `Bill ${billForm.billNumber} created successfully.` });
    } catch (err: any) {
      toast({ title: "Failed to create RA bill", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateStakeholder = async () => {
    if (!newShForm.name.trim()) return;
    try {
      await createStakeholder.mutateAsync({
        data: {
          projectId,
          name: newShForm.name.trim(),
          email: newShForm.email || null,
          phone: newShForm.phone || null,
          organization: newShForm.organization || null,
          role: newShForm.role || null,
          accessLevel: newShForm.accessLevel || "read",
        },
      });
      await qc.invalidateQueries({ queryKey: getListStakeholdersQueryKey({ projectId }) });
      await qc.invalidateQueries({ queryKey: ["/api/stakeholders"] });
      setAddStakeholderOpen(false);
      setNewShForm({ name: "", email: "", phone: "", organization: "", role: "", accessLevel: "read" });
      toast({ title: "Stakeholder Added", description: `${newShForm.name} added to project stakeholders.` });
    } catch (err: any) {
      toast({ title: "Failed to add stakeholder", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveStakeholder = async () => {
    if (!editingStakeholder || !shForm.name.trim()) return;
    try {
      await updateStakeholder.mutateAsync({
        id: editingStakeholder.id,
        data: {
          name: shForm.name.trim(),
          email: shForm.email || null,
          phone: shForm.phone || null,
          organization: shForm.organization || null,
          role: shForm.role || null,
          accessLevel: shForm.accessLevel || "read",
        },
      });
      await qc.invalidateQueries({ queryKey: getListStakeholdersQueryKey({ projectId }) });
      await qc.invalidateQueries({ queryKey: ["/api/stakeholders"] });
      setEditingStakeholder(null);
      toast({ title: "Stakeholder Updated", description: "Changes saved successfully." });
    } catch (err: any) {
      toast({ title: "Failed to update stakeholder", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateDocument = async () => {
    if (!docForm.fileName.trim()) return;
    try {
      let fileUrl = docForm.fileUrl ? docForm.fileUrl.trim() : "";
      let fileSize: number | null = null;
      let fileType = docForm.fileType ? docForm.fileType.trim() : "pdf";

      // If files were selected, upload the first file to /api/upload
      if (selectedDocFiles.length > 0) {
        try {
          const file = selectedDocFiles[0];
          fileSize = file.size;
          fileType = docForm.fileType || file.name.split(".").pop() || "pdf";

          const formData = new FormData();
          formData.append("file", file);

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            fileUrl = uploadData.fileUrl;
            if (uploadData.fileType) fileType = uploadData.fileType;
          }
        } catch (uploadErr) {
          console.error("File upload error:", uploadErr);
        }
      }

      await createDocument.mutateAsync({
        data: {
          projectId,
          fileName: docForm.fileName.trim(),
          name: docForm.fileName.trim(),
          category: docForm.category || "general",
          fileType: fileType || "pdf",
          fileSize: fileSize ?? null,
          fileUrl: fileUrl || "/placeholder-doc.pdf",
        },
      });
      await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey({ projectId }) });
      await qc.invalidateQueries({ queryKey: ["/api/documents"] });
      await qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      setUploadDocOpen(false);
      setDocForm({ fileName: "", category: "general", fileType: "", fileUrl: "" });
      setSelectedDocFiles([]);
      toast({ title: "Document Uploaded", description: `Document "${docForm.fileName}" registered successfully.` });
    } catch (err: any) {
      toast({ title: "Failed to upload document", description: err.message, variant: "destructive" });
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/projects"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={project.status === "archived" ? "outline" : project.status === "handover" ? "default" : "secondary"} className="capitalize text-xs">
                {project.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
                <Sparkles className="h-3 w-3 mr-1 inline" /> 4-Phase Turnkey
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
              Client: <strong className="text-foreground">{project.clientName}</strong> &bull; Location: {project.location || "Mumbai"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={openEditProject}
            className="gap-1.5 shadow-sm border-primary/40 text-primary hover:bg-primary/10 font-semibold"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Project Details
          </Button>

          <Button
            variant={activeTab === "journey" ? "default" : "outline"}
            className="gap-2 shrink-0 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-semibold data-[state=active]:bg-primary shadow-xs"
            onClick={() => setActiveTab("journey")}
          >
            <Sparkles className="h-4 w-4" />
            End-to-End Lifecycle Map
          </Button>
        </div>
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
                {canViewFinancials && !isSiteEngineer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">
                    <MaskedFinancialValue value={project.budget} />
                  </span>
                </div>
                )}
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

              <Button
                variant="outline"
                size="sm"
                onClick={openEditProject}
                className="w-full gap-1.5 mt-2 border-dashed border-primary/30 text-primary hover:bg-primary/10 font-medium text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Project Details
              </Button>
            </CardContent>
          </Card>

          {/* ── Turnkey 4-Phase Governed Delivery Stepper ── */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Turnkey Lifecycle
                </CardTitle>
                <CardDescription className="text-[11px]">
                  4 Governed Milestone Phases
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 font-semibold">
                Workflow
              </Badge>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ol className="space-y-1">
                {TURNKEY_PHASES.map((stage, i) => {
                  const isCurrentTab = activeTab === stage.targetTab;
                  return (
                    <li
                      key={stage.phaseId}
                      className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isCurrentTab ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/40"
                      }`}
                      onClick={() => {
                        if (stage.phaseId === 1) {
                          setActiveTab("journey");
                        } else {
                          setActiveTab(stage.targetTab);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                          isCurrentTab ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                        }`}>
                          {stage.phaseId}
                        </div>
                        {i < TURNKEY_PHASES.length - 1 && (
                          <div className="w-0.5 flex-1 my-1 min-h-[14px] bg-border" />
                        )}
                      </div>
                      <div className="min-w-0 pb-1">
                        <div className="text-xs font-semibold leading-tight text-foreground">
                          {stage.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{stage.desc}</div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="pt-3 border-t mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => setActiveTab("journey")}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Open Full Journey Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main tabs */}
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent flex-wrap gap-1">
              {[
                { value: "journey",       label: "🚀 Turnkey Lifecycle Map", show: true },
                { value: "procurement",   label: "🛒 Procurement & Supply", show: isAdmin || activeRole === "project_manager" || activeRole === "procurement_officer" || activeRole === "engineer" },
                { value: "execution",     label: "🏗️ Execution & Measurement", show: true },
                { value: "commercial",    label: "💰 Commercial & Finance", show: canViewFinancials && !isSiteEngineer },
                { value: "vendors",       label: "🤝 Trade Vendors", show: isAdmin || activeRole === "project_manager" || activeRole === "procurement_officer" || activeRole === "accountant" },
                { value: "tasks",         label: `Tasks (${projectTasks.length})`, show: true },
                { value: "punchlist",     label: `Punch List (${openPunch} open)`, show: true },
                { value: "budget",        label: `Budget (${projectBudget.length})`, show: canViewFinancials && !isSiteEngineer },
                { value: "stakeholders",  label: `Stakeholders (${projectStakeholders.length})`, show: true },
                { value: "documents",     label: `Documents (${projectDocs.length})`, show: true },
              ]
                .filter(t => t.show)
                .map(t => (
                  <TabsTrigger key={t.value} value={t.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm">
                    {t.label}
                  </TabsTrigger>
                ))}
            </TabsList>

            <div className="py-6">
              {/* ── End-to-End Lifecycle Map ── */}
              <TabsContent value="journey" className="m-0 space-y-6">
                <ProjectJourneyView projectId={projectId} onNavigateTab={setActiveTab} />
              </TabsContent>
              <TabsContent value="team" className="m-0 space-y-6">
                <ProjectJourneyView projectId={projectId} onNavigateTab={setActiveTab} />
              </TabsContent>

              {/* ── Procurement & Supply ── */}
              <TabsContent value="procurement" className="m-0 space-y-6">
                <ProjectProcurementTab projectId={projectId} />
              </TabsContent>

              {/* ── Execution & Measurement ── */}
              <TabsContent value="execution" className="m-0 space-y-6">
                <ProjectExecutionTab projectId={projectId} />
              </TabsContent>

              {/* ── Trade Vendors & Subcontracts ── */}
              <TabsContent value="vendors" className="m-0 space-y-6">
                <ProjectVendorsTab projectId={projectId} />
              </TabsContent>

              {/* ── Tasks ── */}
              <TabsContent value="tasks" className="m-0 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    {projectTasks.filter(t => t.status === "completed").length}/{projectTasks.length} tasks complete
                  </div>
                  <div className="flex gap-2">
                    {/* Apply Template Dialog (Restricted to PM and Admin) */}
                    {(isAdmin || activeRole === "project_manager") && (
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
                    )}
                    <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Task</DialogTitle>
                          <DialogDescription>Create a new task for this project.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="task-title">Title <span className="text-destructive">*</span></Label>
                            <Input id="task-title" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="task-desc">Description</Label>
                            <Textarea id="task-desc" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={3} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="task-priority">Priority</Label>
                            <Select value={taskForm.priority} onValueChange={v => setTaskForm(f => ({ ...f, priority: v }))}>
                              <SelectTrigger id="task-priority"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="task-start">Start Date</Label>
                              <Input id="task-start" type="date" value={taskForm.startDate} onChange={e => setTaskForm(f => ({ ...f, startDate: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="task-end">End Date</Label>
                              <Input id="task-end" type="date" value={taskForm.endDate} onChange={e => setTaskForm(f => ({ ...f, endDate: e.target.value }))} />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddTaskOpen(false)} disabled={createTask.isPending}>Cancel</Button>
                          <Button onClick={handleCreateTask} disabled={createTask.isPending || !taskForm.title.trim()}>
                            {createTask.isPending ? "Adding…" : "Add Task"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <ProjectGanttChart
                  tasks={projectTasks}
                  projectId={projectId}
                  projectStartDate={project?.startDate}
                  projectEndDate={project?.endDate}
                  onOpenAddTask={() => setAddTaskOpen(true)}
                  onOpenApplyTemplate={isAdmin || activeRole === "project_manager" ? () => setApplyOpen(true) : undefined}
                  renderStatusSelect={(task) => <TaskStatusSelect task={task} projectId={projectId} />}
                />
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => window.open(`/api/projects/${projectId}/punch-list/export-pdf?autoPrint=true`, '_blank', 'width=1000,height=800')}
                    >
                      <Printer className="h-4 w-4 text-primary" /> Export Snag List PDF
                    </Button>
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

              {/* ── Budget & Cost Variance (FR-BUD-03) ── */}
              {canViewFinancials && !isSiteEngineer && (
              <TabsContent value="budget" className="m-0 space-y-4">
                <PermissionGate
                  permission={PERMISSIONS.PROJECT_BUDGET_VIEW}
                  fallback={
                    <AccessDeniedView
                      title="Budget Access Restricted"
                      description="Monetary cost codes and project budget variances are restricted to Authorized Finance and Executive roles."
                    />
                  }
                >
                  <ProjectBudgetTab
                    projectId={projectId}
                    project={project}
                    canManageBudget={isAdmin || activeRole === "project_manager" || activeRole === "accountant"}
                  />
                </PermissionGate>
              </TabsContent>
              )}

              {/* ── Commercial & Finance (Client AR, Vendor AP, Site Expenses, Profitability) ── */}
              {canViewFinancials && !isSiteEngineer && (
              <TabsContent value="commercial" className="m-0 space-y-6">
                <PermissionGate
                  permission={PERMISSIONS.PROJECT_BUDGET_VIEW}
                  fallback={
                    <AccessDeniedView
                      title="Commercial & Finance Restricted"
                      description="Client AR invoices, vendor AP ledgers, and profit margins are restricted to Authorized Finance and Executive roles."
                    />
                  }
                >
                  <ProjectCommercialControl
                    projectId={projectId}
                    projectBudget={Number(project.budget || 0)}
                    projectName={project.name}
                    clientName={project.clientName || undefined}
                  />
                </PermissionGate>
              </TabsContent>
              )}

              {/* Backward compatibility for ?tab=rabills query links */}
              {canViewFinancials && !isSiteEngineer && (
              <TabsContent value="rabills" className="m-0 space-y-6">
                <ProjectCommercialControl
                  projectId={projectId}
                  projectBudget={Number(project.budget || 0)}
                  projectName={project.name}
                  clientName={project.clientName || undefined}
                />
              </TabsContent>
              )}

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
                  <Dialog open={addStakeholderOpen} onOpenChange={setAddStakeholderOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Stakeholder</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Stakeholder</DialogTitle>
                        <DialogDescription>Add a new stakeholder contact to this project.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="nsh-name">Name <span className="text-destructive">*</span></Label>
                          <Input id="nsh-name" value={newShForm.name} onChange={e => setNewShForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nsh-role">Role / Title</Label>
                          <Input id="nsh-role" value={newShForm.role} onChange={e => setNewShForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Site Engineer, Client" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nsh-org">Organisation</Label>
                          <Input id="nsh-org" value={newShForm.organization} onChange={e => setNewShForm(f => ({ ...f, organization: e.target.value }))} placeholder="Company or firm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="nsh-email">Email</Label>
                            <Input id="nsh-email" type="email" value={newShForm.email} onChange={e => setNewShForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nsh-phone">Phone</Label>
                            <Input id="nsh-phone" value={newShForm.phone} onChange={e => setNewShForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 ..." />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nsh-access">Access Level</Label>
                          <Select value={newShForm.accessLevel} onValueChange={v => setNewShForm(f => ({ ...f, accessLevel: v }))}>
                            <SelectTrigger id="nsh-access"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read">Read — view only</SelectItem>
                              <SelectItem value="write">Write — can update</SelectItem>
                              <SelectItem value="admin">Admin — full access</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddStakeholderOpen(false)} disabled={createStakeholder.isPending}>Cancel</Button>
                        <Button onClick={handleCreateStakeholder} disabled={createStakeholder.isPending || !newShForm.name.trim()}>
                          {createStakeholder.isPending ? "Adding…" : "Add Stakeholder"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                  <Dialog open={uploadDocOpen} onOpenChange={setUploadDocOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Upload Document</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                        <DialogDescription>Register a document or paste a link for this project.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="doc-name">File Name <span className="text-destructive">*</span></Label>
                          <Input id="doc-name" value={docForm.fileName} onChange={e => setDocForm(f => ({ ...f, fileName: e.target.value }))} placeholder="e.g. Structural Drawing v3.pdf" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doc-cat">Category</Label>
                          <Select value={docForm.category} onValueChange={v => setDocForm(f => ({ ...f, category: v }))}>
                            <SelectTrigger id="doc-cat"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="drawing">Drawing</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="report">Report</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doc-type">File Type</Label>
                          <Input id="doc-type" value={docForm.fileType} onChange={e => setDocForm(f => ({ ...f, fileType: e.target.value }))} placeholder="e.g. PDF, DWG, DOCX" />
                        </div>
                        
                        {/* Photos/Files Upload Section */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              Upload Files
                            </Label>
                            <label
                              htmlFor="doc-file-upload"
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              Add Files
                            </label>
                            <input
                              id="doc-file-upload"
                              type="file"
                              className="hidden"
                              multiple
                              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                  setSelectedDocFiles(prev => [...prev, ...files]);
                                  // Auto-populate fileName from first file if empty
                                  if (!docForm.fileName && files[0]) {
                                    setDocForm(f => ({
                                      ...f,
                                      fileName: files[0].name,
                                      fileType: files[0].name.split('.').pop() || "",
                                    }));
                                  }
                                }
                              }}
                            />
                          </div>
                          
                          {selectedDocFiles.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {selectedDocFiles.map((file, index) => {
                                const isImage = file.type.startsWith('image/');
                                let fileUrl = '';
                                try {
                                  fileUrl = URL.createObjectURL(file);
                                } catch (e) {
                                  console.error('Error creating object URL:', e);
                                }
                                
                                return (
                                  <div key={`${file.name}-${index}`} className="relative group">
                                    <div className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                                      {isImage && fileUrl ? (
                                        <img
                                          src={fileUrl}
                                          alt={file.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex flex-col items-center justify-center p-4 text-center">
                                          <FileText className="w-8 h-8 text-muted-foreground mb-1" />
                                          <p className="text-xs font-medium text-muted-foreground truncate w-full">
                                            {file.name}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDocFiles(prev => prev.filter((_, i) => i !== index))}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                    <p className="text-xs text-muted-foreground text-center mt-1 truncate">
                                      {(file.size / 1024).toFixed(0)} KB
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <label
                              htmlFor="doc-file-upload-area"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                  <span className="font-semibold">Click to upload</span> documents
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PDF, DWG, Images, Office files supported
                                </p>
                              </div>
                              <input
                                id="doc-file-upload-area"
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length > 0) {
                                    setSelectedDocFiles(prev => [...prev, ...files]);
                                    if (!docForm.fileName && files[0]) {
                                      setDocForm(f => ({
                                        ...f,
                                        fileName: files[0].name,
                                        fileType: files[0].name.split('.').pop() || "",
                                      }));
                                    }
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="doc-url">File URL (optional)</Label>
                          <Input id="doc-url" value={docForm.fileUrl} onChange={e => setDocForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://... (or leave blank to use uploaded files)" />
                          <p className="text-xs text-muted-foreground">
                            Provide an external URL if not uploading files above
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDocOpen(false)} disabled={createDocument.isPending}>Cancel</Button>
                        <Button onClick={handleCreateDocument} disabled={createDocument.isPending || !docForm.fileName.trim()}>
                          {createDocument.isPending ? "Saving…" : "Save Document"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                              <span
                                className="font-medium text-primary hover:underline cursor-pointer"
                                onClick={() => doc.fileUrl && window.open(doc.fileUrl, "_blank")}
                                title={doc.fileUrl ? "Open document" : "No URL — edit to add a link"}
                              >{doc.fileName}</span>
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

      {/* ── Edit Project Details Dialog ── */}
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Project Details
            </DialogTitle>
            <DialogDescription>
              Update project name, client entity, budget baseline, status, and dates. Changes save directly to the database.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">Project Name *</Label>
              <Input
                value={editProjForm.name}
                onChange={(e) => setEditProjForm({ ...editProjForm, name: e.target.value })}
                placeholder="Project title..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Client / Customer Name</Label>
              <Input
                value={editProjForm.clientName}
                onChange={(e) => setEditProjForm({ ...editProjForm, clientName: e.target.value })}
                placeholder="Client organization..."
              />
            </div>

            {(isAdmin || activeRole === "project_manager" || activeRole === "accountant") && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contract Budget (₹)</Label>
              <Input
                type="number"
                value={editProjForm.budget}
                onChange={(e) => setEditProjForm({ ...editProjForm, budget: e.target.value })}
                placeholder="e.g. 32500000"
              />
            </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Location</Label>
              <Input
                value={editProjForm.location}
                onChange={(e) => setEditProjForm({ ...editProjForm, location: e.target.value })}
                placeholder="e.g. Bandra West, Mumbai"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Project Type</Label>
              <Input
                value={editProjForm.type}
                onChange={(e) => setEditProjForm({ ...editProjForm, type: e.target.value })}
                placeholder="e.g. Hotel Interior Fit-out, EPC Turnkey"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status</Label>
              <Select
                value={editProjForm.status}
                onValueChange={(val) => setEditProjForm({ ...editProjForm, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning & Mobilization</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="execution">Execution</SelectItem>
                  <SelectItem value="qc">Quality Inspection (QC)</SelectItem>
                  <SelectItem value="handover">Billing & Handover</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Progress ({editProjForm.progress}%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editProjForm.progress}
                onChange={(e) => setEditProjForm({ ...editProjForm, progress: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Start Date</Label>
              <Input
                type="date"
                value={editProjForm.startDate}
                onChange={(e) => setEditProjForm({ ...editProjForm, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target Handover Date</Label>
              <Input
                type="date"
                value={editProjForm.endDate}
                onChange={(e) => setEditProjForm({ ...editProjForm, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Team Size</Label>
              <Input
                type="number"
                value={editProjForm.teamSize}
                onChange={(e) => setEditProjForm({ ...editProjForm, teamSize: e.target.value })}
                placeholder="e.g. 15"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Lifecycle Stage</Label>
              <Select
                value={editProjForm.lifecycleStage}
                onValueChange={(val) => setEditProjForm({ ...editProjForm, lifecycleStage: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="setup">Stage 1: Setup & Mobilization</SelectItem>
                  <SelectItem value="planning">Stage 2: Detailed Planning</SelectItem>
                  <SelectItem value="procurement">Stage 3: Procurement & Sourcing</SelectItem>
                  <SelectItem value="execution">Stage 4: Site Execution & JMR</SelectItem>
                  <SelectItem value="billing">Stage 5: Billing & Invoicing</SelectItem>
                  <SelectItem value="handover">Stage 6: Handover & DLP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">Description / Scope Notes</Label>
              <Textarea
                rows={3}
                value={editProjForm.description}
                onChange={(e) => setEditProjForm({ ...editProjForm, description: e.target.value })}
                placeholder="Scope of work and project notes..."
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setEditProjectOpen(false)}
              disabled={updateProject.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={updateProject.isPending || !editProjForm.name.trim()}
              className="gap-2"
            >
              {updateProject.isPending ? "Saving to Database..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
