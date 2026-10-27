import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  CheckSquare,
  Plus,
  Trash2,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SiteTasksScheduleTabProps {
  selectedProjectId: string;
  projects: any[];
}

export function SiteTasksScheduleTab({ selectedProjectId, projects }: SiteTasksScheduleTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTitle, setSearchTitle] = useState("");

  const [form, setForm] = useState({
    projectId: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"),
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    progress: "0",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  });

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/tasks?projectId=${selectedProjectId}`
        : "/api/tasks";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      setDialogOpen(false);
      setForm({
        projectId: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"),
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        progress: "0",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      });
      toast({
        title: "Task Scheduled",
        description: "New site task created successfully.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Task Updated", description: "Progress updated." });
    },
  });

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (searchTitle && !t.title?.toLowerCase().includes(searchTitle.toLowerCase())) return false;
    return true;
  });

  const totalTasks = filtered.length;
  const doneTasks = filtered.filter((t) => t.status === "done" || t.status === "completed").length;
  const inProgressTasks = filtered.filter((t) => t.status === "in_progress").length;
  const todoTasks = filtered.filter((t) => t.status === "todo").length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({
      ...form,
      projectId: Number(form.projectId),
      progress: parseInt(form.progress) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Task Completion</p>
              <h3 className="text-2xl font-bold mt-1 text-primary">{completionRate}%</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{doneTasks} of {totalTasks} finished</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">In Progress</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600">{inProgressTasks}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active site work fronts</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Scheduled (To Do)</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">{todoTasks}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Ready for mobilization</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
              <CheckSquare className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Site Tasks</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalTasks}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Assigned to engineers & PMs</p>
            </div>
            <div className="p-3 bg-muted rounded-xl text-foreground">
              <Calendar className="h-6 w-6" />
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
              placeholder="Search tasks..."
              className="pl-8 h-9 text-xs"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="done">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              Add Site Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Schedule New Site Execution Task
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add an activity to the site master schedule with start/finish dates and priority.
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
                <Label className="text-xs">Task Title</Label>
                <Input
                  placeholder="e.g. Raft reinforcement inspection and concrete pour"
                  className="text-xs h-9"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(val) => setForm({ ...form, priority: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent / Critical Path</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Initial Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) => setForm({ ...form, status: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    className="text-xs h-9"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End / Target Date</Label>
                  <Input
                    type="date"
                    className="text-xs h-9"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description & Scope</Label>
                <Textarea
                  placeholder="Describe specific work deliverables and requirements"
                  className="text-xs min-h-[60px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? "Scheduling..." : "Schedule Task"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task List Table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              Site Tasks & Activity Execution Schedule
            </span>
            <Badge variant="outline" className="text-xs">
              {filtered.length} Tasks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No tasks scheduled for this project. Click "Add Site Task" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3 pl-4">Task Name</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 w-40">Progress</th>
                    <th className="p-3">Dates</th>
                    <th className="p-3">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => {
                    const statusConfig = {
                      todo: { label: "To Do", bg: "bg-muted text-foreground border-border" },
                      in_progress: { label: "In Progress", bg: "bg-blue-50 text-blue-700 border-blue-300" },
                      in_review: { label: "In Review", bg: "bg-amber-50 text-amber-700 border-amber-300" },
                      done: { label: "Done", bg: "bg-emerald-50 text-emerald-700 border-emerald-300" },
                      completed: { label: "Done", bg: "bg-emerald-50 text-emerald-700 border-emerald-300" },
                    }[item.status as string] || { label: item.status, bg: "bg-muted" };

                    const prioColor = {
                      urgent: "text-rose-600 font-bold",
                      high: "text-amber-600 font-semibold",
                      medium: "text-foreground",
                      low: "text-muted-foreground",
                    }[item.priority as string] || "";

                    const progress = item.progress || 0;

                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 pl-4 font-semibold text-foreground max-w-sm">
                          {item.title}
                          {item.description && (
                            <div className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</div>
                          )}
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {item.projectName || `Project #${item.projectId}`}
                        </td>
                        <td className={`p-3 capitalize ${prioColor}`}>
                          {item.priority}
                        </td>
                        <td className="p-3">
                          <select
                            value={item.status}
                            onChange={(e) => updateTaskMutation.mutate({ id: item.id, updates: { status: e.target.value } })}
                            className={`text-[11px] font-semibold rounded-md border px-2 py-0.5 cursor-pointer outline-none ${statusConfig.bg}`}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="done">Completed</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        </td>
                        <td className="p-3 text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                          {item.startDate ? item.startDate.split("T")[0] : "—"} to {item.endDate ? item.endDate.split("T")[0] : "—"}
                        </td>
                        <td className="p-3 text-foreground font-medium">
                          {item.assignedToName || "Unassigned"}
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
