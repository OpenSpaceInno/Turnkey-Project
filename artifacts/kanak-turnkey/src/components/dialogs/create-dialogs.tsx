import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateLead,
  useCreateProject,
  useCreateTask,
  useListProjects,
  useListUsers,
  getListLeadsQueryKey,
  getGetLeadsSummaryQueryKey,
  getListProjectsQueryKey,
  getListTasksQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function NewLeadDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateLead();

  const [form, setForm] = useState({
    customerName: "",
    company: "",
    contactEmail: "",
    contactPhone: "",
    projectType: "",
    location: "",
    budgetEstimate: "",
    leadSource: "",
    priority: "medium",
    stage: "lead_creation",
    status: "new",
    notes: "",
  });

  const submit = async () => {
    if (!form.customerName.trim()) return;
    await create.mutateAsync({
      data: {
        customerName: form.customerName,
        company: form.company || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        projectType: form.projectType || undefined,
        location: form.location || undefined,
        budgetEstimate: form.budgetEstimate
          ? Number(form.budgetEstimate)
          : undefined,
        leadSource: form.leadSource || undefined,
        priority: form.priority as "urgent" | "high" | "medium" | "low",
        stage: form.stage as
          | "lead_creation"
          | "site_visit"
          | "drawings"
          | "boq"
          | "negotiation"
          | "finalization",
        status: form.status as
          | "new"
          | "contacted"
          | "qualified"
          | "lost"
          | "won",
        notes: form.notes || undefined,
      },
    });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListLeadsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetLeadsSummaryQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
    setOpen(false);
    setForm({
      customerName: "",
      company: "",
      contactEmail: "",
      contactPhone: "",
      projectType: "",
      location: "",
      budgetEstimate: "",
      leadSource: "",
      priority: "medium",
      stage: "lead_creation",
      status: "new",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
          <DialogDescription>
            Capture a new opportunity. A lead number will be assigned
            automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <Field label="Customer name *">
            <Input
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
              placeholder="Mahesh Bhatia"
            />
          </Field>
          <Field label="Company">
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Lumina Hospitality Group"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) =>
                setForm({ ...form, contactEmail: e.target.value })
              }
              placeholder="contact@example.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.contactPhone}
              onChange={(e) =>
                setForm({ ...form, contactPhone: e.target.value })
              }
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field label="Project type">
            <Input
              value={form.projectType}
              onChange={(e) =>
                setForm({ ...form, projectType: e.target.value })
              }
              placeholder="Hotel Interior Fit-out"
            />
          </Field>
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Bandra West, Mumbai"
            />
          </Field>
          <Field label="Budget estimate (INR)">
            <Input
              type="number"
              value={form.budgetEstimate}
              onChange={(e) =>
                setForm({ ...form, budgetEstimate: e.target.value })
              }
              placeholder="32500000"
            />
          </Field>
          <Field label="Lead source">
            <Input
              value={form.leadSource}
              onChange={(e) =>
                setForm({ ...form, leadSource: e.target.value })
              }
              placeholder="Referral / Inbound / Tender"
            />
          </Field>
          <Field label="Priority">
            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Stage">
            <Select
              value={form.stage}
              onValueChange={(v) => setForm({ ...form, stage: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead_creation">Lead creation</SelectItem>
                <SelectItem value="site_visit">Site visit</SelectItem>
                <SelectItem value="drawings">Drawings</SelectItem>
                <SelectItem value="boq">BOQ</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="finalization">Finalization</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional context, requirements, or next steps."
                rows={3}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!form.customerName.trim() || create.isPending}
          >
            {create.isPending ? "Creating..." : "Create lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewProjectDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateProject();

  const [form, setForm] = useState({
    name: "",
    type: "",
    location: "",
    clientName: "",
    startDate: "",
    endDate: "",
    budget: "",
    teamSize: "",
    description: "",
    status: "planning",
  });

  const submit = async () => {
    if (!form.name.trim()) return;
    await create.mutateAsync({
      data: {
        name: form.name,
        type: form.type || undefined,
        location: form.location || undefined,
        clientName: form.clientName || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        teamSize: form.teamSize ? Number(form.teamSize) : undefined,
        description: form.description || undefined,
        status: form.status as
          | "planning"
          | "in_progress"
          | "on_hold"
          | "completed",
      },
    });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListProjectsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
    setOpen(false);
    setForm({
      name: "",
      type: "",
      location: "",
      clientName: "",
      startDate: "",
      endDate: "",
      budget: "",
      teamSize: "",
      description: "",
      status: "planning",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Set up a new project. You can add tasks, budget items, and
            stakeholders after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
            <Field label="Project name *">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Sentinel Tech Park — Phase 2"
              />
            </Field>
          </div>
          <Field label="Type">
            <Input
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder="Commercial Build-out"
            />
          </Field>
          <Field label="Client name">
            <Input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder="Sentinel Realty"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Hinjewadi, Pune"
              />
            </Field>
          </div>
          <Field label="Start date">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </Field>
          <Field label="Budget (INR)">
            <Input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="62000000"
            />
          </Field>
          <Field label="Team size">
            <Input
              type="number"
              value={form.teamSize}
              onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
              placeholder="38"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="on_hold">On hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Scope, deliverables, key constraints."
                rows={3}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!form.name.trim() || create.isPending}
          >
            {create.isPending ? "Creating..." : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewTaskDialog({
  trigger,
  defaultProjectId,
}: {
  trigger: ReactNode;
  defaultProjectId?: number;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateTask();
  const { data: projects } = useListProjects();
  const { data: users } = useListUsers();

  const [form, setForm] = useState({
    projectId: defaultProjectId ? String(defaultProjectId) : "",
    title: "",
    description: "",
    assignedToId: "",
    startDate: "",
    endDate: "",
    priority: "medium",
    status: "todo",
  });

  const submit = async () => {
    if (!form.title.trim() || !form.projectId) return;
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        title: form.title,
        description: form.description || undefined,
        assignedToId: form.assignedToId
          ? Number(form.assignedToId)
          : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        priority: form.priority as "urgent" | "high" | "medium" | "low",
        status: form.status as
          | "todo"
          | "in_progress"
          | "in_review"
          | "completed",
      },
    });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListTasksQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
    setOpen(false);
    setForm({
      projectId: defaultProjectId ? String(defaultProjectId) : "",
      title: "",
      description: "",
      assignedToId: "",
      startDate: "",
      endDate: "",
      priority: "medium",
      status: "todo",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>
            Add a task to the board. Assign an owner and set a target date.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
            <Field label="Title *">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Floor 4 ceiling grid installation"
              />
            </Field>
          </div>
          <Field label="Project *">
            <Select
              value={form.projectId}
              onValueChange={(v) => setForm({ ...form, projectId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Assignee">
            <Select
              value={form.assignedToId}
              onValueChange={(v) => setForm({ ...form, assignedToId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Start date">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </Field>
          <Field label="Priority">
            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="in_review">In review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Details, acceptance criteria, dependencies."
                rows={3}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              !form.title.trim() || !form.projectId || create.isPending
            }
          >
            {create.isPending ? "Creating..." : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
