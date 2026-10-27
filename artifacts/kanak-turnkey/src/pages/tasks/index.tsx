import { useEffect, useMemo, useState } from "react";
import { useListTasks, useListProjects, useUpdateTask, type Task } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Filter,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  GanttChartSquare,
  ArrowLeft,
  Building2,
  X,
  Layers,
  Rocket,
  Compass,
  ShoppingCart,
  Building,
  HardHat,
  Zap,
  Paintbrush,
  ShieldCheck,
  CheckCheck,
  CheckCircle2,
  Clock,
  Circle,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  format,
  differenceInCalendarDays,
  startOfMonth,
  addMonths,
  isWithinInterval,
  max as maxDate,
  min as minDate,
} from "date-fns";
import { NewTaskDialog } from "@/components/dialogs/create-dialogs";

type ViewMode = "phases" | "board" | "list" | "gantt";

const STATUS_META: Record<
  string,
  { label: string; dot: string; bar: string; badge: "default" | "secondary" | "outline" | "destructive" }
> = {
  todo: { label: "Todo", dot: "bg-muted-foreground", bar: "bg-muted-foreground/60", badge: "outline" },
  in_progress: { label: "In Progress", dot: "bg-amber-500", bar: "bg-amber-500", badge: "secondary" },
  in_review: { label: "In Review", dot: "bg-sky-500", bar: "bg-sky-500", badge: "secondary" },
  completed: { label: "Completed", dot: "bg-emerald-600", bar: "bg-emerald-600", badge: "default" },
};

const PRIORITY_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const STATUS_OPTIONS = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "completed", label: "Completed" },
] as const;

function StatusSelect({ task }: { task: Task }) {
  const qc = useQueryClient();
  const { mutate, isPending } = useUpdateTask();

  return (
    <Select
      value={task.status}
      disabled={isPending}
      onValueChange={(val) =>
        mutate(
          { id: task.id, data: { status: val as Task["status"] } as any },
          { onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/tasks"] }) }
        )
      }
    >
      <SelectTrigger
        className="h-7 text-xs px-2 gap-1 w-[120px]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_META[task.status]?.dot}`} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {STATUS_OPTIONS.map((s) => (
          <SelectItem key={s.value} value={s.value} className="text-xs">
            <span className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s.value]?.dot}`} />
              {s.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function Tasks() {
  const [, setLocation] = useLocation();
  const { data: tasks, isLoading } = useListTasks();
  const { data: projects } = useListProjects();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const v = new URLSearchParams(window.location.search).get("view");
      if (v === "phases" || v === "list" || v === "gantt" || v === "board") return v;
      const p = new URLSearchParams(window.location.search).get("projectId");
      if (p && p.trim() && p !== "all") return "phases";
    }
    return "phases";
  });

  const [projectFilter, setProjectFilter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("projectId");
      if (p && p.trim()) return p.trim();
    }
    return "all";
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Keep state updated if URL query parameters change (e.g. Back/Forward button)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("projectId");
      setProjectFilter(pid && pid.trim() ? pid.trim() : "all");
      const v = params.get("view");
      if (v === "phases" || v === "list" || v === "gantt" || v === "board") {
        setView(v as ViewMode);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync view and projectFilter to URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (view === "phases") {
      params.set("view", "phases");
    } else {
      params.set("view", view);
    }

    if (projectFilter === "all") {
      params.delete("projectId");
    } else {
      params.set("projectId", projectFilter);
    }

    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, [view, projectFilter]);

  const projectMap = useMemo(() => {
    const m = new Map<number, string>();
    const projectsArray = Array.isArray(projects) ? projects : [];
    projectsArray.forEach(p => m.set(p.id, p.name));
    return m;
  }, [projects]);

  const currentProject = useMemo(() => {
    if (projectFilter === "all") return null;
    const projectsArray = Array.isArray(projects) ? projects : [];
    return projectsArray.find(p => String(p.id) === String(projectFilter)) || null;
  }, [projects, projectFilter]);

  const handleBack = () => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (from && from.startsWith("/")) {
      setLocation(decodeURIComponent(from));
      return;
    }
    if (projectFilter !== "all") {
      setLocation(`/projects/${projectFilter}?tab=journey`);
      return;
    }
    setLocation("/projects");
  };

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    return tasksArray.filter(t => {
      if (q && !(t.title?.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q))) {
        return false;
      }
      // Strict project ID filtering: hide tasks from any other project
      if (projectFilter !== "all" && String(t.projectId) !== String(projectFilter)) {
        return false;
      }
      if (statusFilter !== "all" && t.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, search, projectFilter, statusFilter]);

  const statuses = ["todo", "in_progress", "in_review", "completed"] as const;

  if (isLoading) {
    return <div className="p-6">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {projectFilter !== "all" ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="gap-1.5 text-xs font-semibold h-7 px-2.5 shadow-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Lifecycle Map
              </Button>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
                <Building2 className="h-3 w-3 mr-1 inline" />
                Project #{projectFilter}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                WBS & Tasks Schedule
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {currentProject?.name ? `${currentProject.name} — WBS & Tasks` : "Project WBS & Tasks"}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Work Breakdown Structure & execution schedule filtered strictly for this project.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">Cross-project task management.</p>
          </div>
        )}

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Tabs value={view} onValueChange={v => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="phases" className="gap-1.5">
                <Layers className="h-4 w-4" /> WBS Phases
              </TabsTrigger>
              <TabsTrigger value="board" className="gap-1.5">
                <LayoutGrid className="h-4 w-4" /> Board
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5">
                <ListIcon className="h-4 w-4" /> List
              </TabsTrigger>
              <TabsTrigger value="gantt" className="gap-1.5">
                <GanttChartSquare className="h-4 w-4" /> Gantt
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <NewTaskDialog
            defaultProjectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
            trigger={
              <Button className="shrink-0 gap-2">
                <Plus className="h-4 w-4" /> New Task
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {(Array.isArray(projects) ? projects : []).map(p => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {projectFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProjectFilter("all")}
            className="h-9 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            title="Clear project filter and view all projects"
          >
            <X className="h-3.5 w-3.5" />
            Show All Projects
          </Button>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map(s => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" title="More filters">
          <Filter className="h-4 w-4" />
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredTasks.length} of {tasks?.length ?? 0} tasks
        </div>
      </div>

      {view === "phases" && (
        <PhasesView
          tasks={filteredTasks}
          projectMap={projectMap}
          projectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
        />
      )}
      {view === "board" && (
        <BoardView tasks={filteredTasks} projectMap={projectMap} statuses={[...statuses]} />
      )}
      {view === "list" && (
        <ListView tasks={filteredTasks} projectMap={projectMap} />
      )}
      {view === "gantt" && (
        <GanttView tasks={filteredTasks} projectMap={projectMap} />
      )}
    </div>
  );
}

function BoardView({
  tasks,
  projectMap,
  statuses,
}: {
  tasks: Task[];
  projectMap: Map<number, string>;
  statuses: string[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
      {statuses.map(status => {
        const statusTasks = tasks.filter(t => t.status === status);
        const meta = STATUS_META[status];
        return (
          <div key={status} className="flex flex-col gap-3 bg-muted/30 p-3 rounded-lg border">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                <h3 className="font-semibold">{meta.label}</h3>
              </div>
              <Badge variant="secondary">{statusTasks.length}</Badge>
            </div>
            <div className="flex flex-col gap-3">
              {statusTasks.map(task => (
                <Card key={task.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-sm leading-tight font-medium">{task.title}</CardTitle>
                      <Badge variant={PRIORITY_VARIANT[task.priority]} className="text-[10px] px-1 py-0 h-4">
                        {task.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs space-y-2">
                    <div className="text-muted-foreground truncate" title={projectMap.get(task.projectId)}>
                      {projectMap.get(task.projectId) ?? `Project #${task.projectId}`}
                    </div>
                    {task.description && <p className="text-muted-foreground line-clamp-2">{task.description}</p>}
                    <div className="flex items-center justify-between text-muted-foreground pt-1">
                      <span className="truncate max-w-[100px]" title={task.assignedToName ?? "Unassigned"}>
                        {task.assignedToName ?? "Unassigned"}
                      </span>
                      {task.endDate && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.endDate), "MMM d")}
                        </span>
                      )}
                    </div>
                    <div className="pt-1">
                      <StatusSelect task={task} />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {statusTasks.length === 0 && (
                <div className="text-center p-4 border border-dashed rounded-md text-xs text-muted-foreground bg-card/50">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({
  tasks,
  projectMap,
}: {
  tasks: Task[];
  projectMap: Map<number, string>;
}) {
  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const ad = a.endDate ? new Date(a.endDate).getTime() : Number.POSITIVE_INFINITY;
        const bd = b.endDate ? new Date(b.endDate).getTime() : Number.POSITIVE_INFINITY;
        return ad - bd;
      }),
    [tasks],
  );

  const today = new Date();

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium w-[140px]">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map(t => {
              const meta = STATUS_META[t.status];
              const due = t.endDate ? new Date(t.endDate) : null;
              const overdue = due && t.status !== "completed" && due < today;
              return (
                <tr key={t.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.title}</div>
                    {t.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {projectMap.get(t.projectId) ?? `Project #${t.projectId}`}
                  </td>
                  <td className="px-4 py-3">{t.assignedToName ?? <span className="text-muted-foreground">Unassigned</span>}</td>
                  <td className="px-4 py-3">
                    <StatusSelect task={t} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={PRIORITY_VARIANT[t.priority]} className="text-[10px] capitalize">
                      {t.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.startDate ? format(new Date(t.startDate), "MMM d, yyyy") : "—"}
                  </td>
                  <td className={`px-4 py-3 ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {due ? format(due, "MMM d, yyyy") : "—"}
                    {overdue && <span className="ml-2 text-[10px] uppercase">overdue</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${meta.bar}`}
                          style={{ width: `${Math.min(100, Math.max(0, t.progress))}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{t.progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No tasks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function GanttView({
  tasks,
  projectMap,
}: {
  tasks: Task[];
  projectMap: Map<number, string>;
}) {
  const dated = useMemo(
    () => tasks.filter(t => t.startDate && t.endDate),
    [tasks],
  );

  const range = useMemo(() => {
    if (dated.length === 0) return null;
    const starts = dated.map(t => new Date(t.startDate!));
    const ends = dated.map(t => new Date(t.endDate!));
    const minD = startOfMonth(minDate(starts));
    const maxRaw = maxDate(ends);
    const maxD = startOfMonth(addMonths(maxRaw, 1));
    return { start: minD, end: maxD };
  }, [dated]);

  if (!range) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          No tasks with start &amp; end dates to display on the Gantt chart.
        </CardContent>
      </Card>
    );
  }

  const totalDays = differenceInCalendarDays(range.end, range.start) || 1;
  const months: { label: string; offsetPct: number; widthPct: number }[] = [];
  let cursor = range.start;
  while (cursor < range.end) {
    const next = addMonths(cursor, 1);
    const offset = differenceInCalendarDays(cursor, range.start);
    const width = differenceInCalendarDays(next, cursor);
    months.push({
      label: format(cursor, "MMM yyyy"),
      offsetPct: (offset / totalDays) * 100,
      widthPct: (width / totalDays) * 100,
    });
    cursor = next;
  }

  const today = new Date();
  const todayPct = isWithinInterval(today, { start: range.start, end: range.end })
    ? (differenceInCalendarDays(today, range.start) / totalDays) * 100
    : null;

  // Group tasks by project
  const grouped = new Map<number, Task[]>();
  for (const t of dated) {
    const arr = grouped.get(t.projectId) ?? [];
    arr.push(t);
    grouped.set(t.projectId, arr);
  }
  for (const arr of grouped.values()) {
    arr.sort(
      (a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime(),
    );
  }

  const labelColWidth = 280;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header: months */}
          <div className="flex border-b bg-muted/40 sticky top-0 z-10">
            <div
              className="shrink-0 px-4 py-2 text-xs font-medium text-muted-foreground border-r"
              style={{ width: labelColWidth }}
            >
              Task / Project
            </div>
            <div className="relative flex-1 h-9">
              {months.map(m => (
                <div
                  key={m.label}
                  className="absolute top-0 bottom-0 border-r flex items-center justify-center text-[11px] font-medium text-muted-foreground"
                  style={{ left: `${m.offsetPct}%`, width: `${m.widthPct}%` }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {todayPct !== null && (
              <div
                className="absolute top-0 bottom-0 w-px bg-primary/70 z-20 pointer-events-none"
                style={{ left: `calc(${labelColWidth}px + (100% - ${labelColWidth}px) * ${todayPct} / 100)` }}
                title={`Today: ${format(today, "MMM d, yyyy")}`}
              >
                <span className="absolute -top-1 -translate-x-1/2 text-[9px] font-semibold uppercase text-primary bg-background px-1">
                  today
                </span>
              </div>
            )}
            {[...grouped.entries()].map(([projectId, projTasks]) => (
              <div key={projectId}>
                <div className="flex bg-muted/20 border-b">
                  <div
                    className="shrink-0 px-4 py-1.5 text-xs font-semibold text-foreground border-r truncate"
                    style={{ width: labelColWidth }}
                    title={projectMap.get(projectId)}
                  >
                    {projectMap.get(projectId) ?? `Project #${projectId}`}
                    <span className="ml-2 font-normal text-muted-foreground">({projTasks.length})</span>
                  </div>
                  <div className="flex-1" />
                </div>
                {projTasks.map(t => {
                  const start = new Date(t.startDate!);
                  const end = new Date(t.endDate!);
                  const offset = differenceInCalendarDays(start, range.start);
                  const span = Math.max(1, differenceInCalendarDays(end, start) + 1);
                  const leftPct = (offset / totalDays) * 100;
                  const widthPct = (span / totalDays) * 100;
                  const meta = STATUS_META[t.status];
                  return (
                    <div key={t.id} className="flex border-b hover:bg-accent/30 transition-colors">
                      <div
                        className="shrink-0 px-4 py-2 border-r flex items-center gap-2"
                        style={{ width: labelColWidth }}
                      >
                        <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate" title={t.title}>{t.title}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {t.assignedToName ?? "Unassigned"} · {t.priority}
                          </div>
                        </div>
                      </div>
                      <div className="relative flex-1 h-10">
                        {months.map(m => (
                          <div
                            key={m.label}
                            className="absolute top-0 bottom-0 border-r border-border/40"
                            style={{ left: `${m.offsetPct}%`, width: `${m.widthPct}%` }}
                          />
                        ))}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-5 rounded ${meta.bar} shadow-sm overflow-hidden`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: 4 }}
                          title={`${t.title}\n${format(start, "MMM d")} → ${format(end, "MMM d, yyyy")}\n${t.progress}% complete`}
                        >
                          {t.progress > 0 && t.progress < 100 && (
                            <div
                              className="absolute inset-y-0 left-0 bg-foreground/25"
                              style={{ width: `${t.progress}%` }}
                            />
                          )}
                          <span className="absolute inset-0 px-2 text-[10px] font-medium text-white flex items-center truncate">
                            {widthPct > 8 ? `${t.progress}%` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-3 border-t text-xs text-muted-foreground">
            {(["todo", "in_progress", "in_review", "completed"] as const).map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`h-2 w-3 rounded-sm ${STATUS_META[s].bar}`} />
                {STATUS_META[s].label}
              </div>
            ))}
            {tasks.length !== dated.length && (
              <span className="ml-auto italic">
                {tasks.length - dated.length} task(s) hidden — missing start or end date
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   WBS PHASES VIEW: FAMILIAR OVERVIEW TASKS LAYOUT & STRUCTURE
   ══════════════════════════════════════════════════════════════════════ */

function PhasesView({
  tasks,
  projectMap,
  projectId,
}: {
  tasks: Task[];
  projectMap: Map<number, string>;
  projectId?: number;
}) {
  const [selectedPhase, setSelectedPhase] = useState<string>("all");

  // Group tasks by their phase (same logic as Overview tasks, supporting module/phase segregation)
  const phases: Record<string, Task[]> = {};
  for (const t of tasks) {
    const desc = t.description ?? "";
    const m = desc.match(/^\[([^\]]+)\]/);
    let phase = m ? m[1].trim() : "";

    if (!phase) {
      const text = `${t.title} ${desc}`.toLowerCase();
      if (text.includes("initiat") || text.includes("mobiliz") || text.includes("kickoff") || text.includes("survey")) phase = "Initiation";
      else if (text.includes("plan") || text.includes("permit") || text.includes("approval")) phase = "Planning";
      else if (text.includes("design") || text.includes("drawing") || text.includes("gfc")) phase = "Design";
      else if (text.includes("procure") || text.includes("purchase") || text.includes("long-lead") || text.includes("po ")) phase = "Procurement";
      else if (text.includes("foundation") || text.includes("substructure") || text.includes("superstructure") || text.includes("slab") || text.includes("column") || text.includes("masonry") || text.includes("concrete") || text.includes("civil")) phase = "Civil & Structure";
      else if (text.includes("mep") || text.includes("plumb") || text.includes("electric") || text.includes("hvac") || text.includes("sprinkler")) phase = "MEP";
      else if (text.includes("finish") || text.includes("paint") || text.includes("floor") || text.includes("interior") || text.includes("plaster")) phase = "Finishing";
      else if (text.includes("test") || text.includes("qc") || text.includes("snag") || text.includes("inspect")) phase = "QC & Testing";
      else if (text.includes("close") || text.includes("handover") || text.includes("dlp")) phase = "Closeout";
      else phase = "Other";
    } else if (phase === "Execution") {
      const text = `${t.title} ${desc}`.toLowerCase();
      if (text.includes("foundation") || text.includes("substructure") || text.includes("superstructure") || text.includes("slab") || text.includes("column") || text.includes("masonry") || text.includes("concrete") || text.includes("civil")) {
        phase = "Civil & Structure";
      } else if (text.includes("mep") || text.includes("conduit") || text.includes("plumb") || text.includes("electric") || text.includes("hvac")) {
        phase = "MEP";
      } else if (text.includes("finish") || text.includes("paint") || text.includes("floor") || text.includes("interior") || text.includes("plaster")) {
        phase = "Finishing";
      }
    }
    (phases[phase] ??= []).push(t);
  }

  const standardPhaseOrder = [
    "Initiation",
    "Planning",
    "Design",
    "Procurement",
    "Civil Works",
    "Civil & Structure",
    "Structure",
    "Execution",
    "MEP",
    "Finishing",
    "QC & Handover",
    "QC & Testing",
    "Closeout",
    "Other",
  ];
  const presentPhases = Object.keys(phases);
  const phaseOrder = [
    ...standardPhaseOrder.filter(p => presentPhases.includes(p)),
    ...presentPhases.filter(p => !standardPhaseOrder.includes(p)),
  ];

  const completed = tasks.filter(t => t.status === "completed").length;
  const filteredPhaseOrder = selectedPhase === "all"
    ? phaseOrder.filter(p => phases[p])
    : phaseOrder.filter(p => p === selectedPhase && phases[p]);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Project Task Phases
          </CardTitle>
          <CardDescription>
            {completed}/{tasks.length} tasks complete
          </CardDescription>
        </div>
        {phaseOrder.filter(p => phases[p]).length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant={selectedPhase === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPhase("all")}
              className="h-7 text-xs font-semibold px-2.5"
            >
              All Phases ({phaseOrder.filter(p => phases[p]).length})
            </Button>
            {phaseOrder.filter(p => phases[p]).map(p => {
              const isSel = selectedPhase === p;
              const count = phases[p]!.length;
              const doneCount = phases[p]!.filter(t => t.status === "completed").length;
              return (
                <Button
                  key={p}
                  variant={isSel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPhase(isSel ? "all" : p)}
                  className="h-7 text-xs font-medium gap-1 px-2.5"
                >
                  <span>{p}</span>
                  <span className={`text-[10px] ${isSel ? "text-primary-foreground/90 font-bold" : "text-muted-foreground"}`}>
                    ({doneCount}/{count})
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-5">
        {filteredPhaseOrder.map(phase => {
          const items = phases[phase]!;
          const done = items.filter(t => t.status === "completed").length;
          return (
            <div key={phase}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {phase}
                </h4>
                <span className="text-xs text-muted-foreground font-medium">{done}/{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(t => {
                  const Icon = t.status === "completed" ? CheckCircle2 : t.status === "in_progress" ? Clock : Circle;
                  const colour = t.status === "completed" ? "text-emerald-600" : t.status === "in_progress" ? "text-amber-600" : "text-muted-foreground";
                  return (
                    <div key={t.id} className="flex items-start gap-3 rounded-md border bg-background/50 hover:bg-muted/30 transition-colors px-3 py-2">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colour}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-medium truncate">{t.title}</div>
                          {t.priority && (
                            <Badge variant={PRIORITY_VARIANT[t.priority]} className="text-[10px] px-1.5 py-0 h-4 capitalize">
                              {t.priority}
                            </Badge>
                          )}
                          {!projectId && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                              {projectMap.get(t.projectId) ?? `#${t.projectId}`}
                            </Badge>
                          )}
                          {t.assignedToName && (
                            <span className="text-xs text-muted-foreground">· {t.assignedToName}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.startDate ? format(new Date(t.startDate), "MMM d") : "—"} → {t.endDate ? format(new Date(t.endDate), "MMM d, yyyy") : "—"}
                        </div>
                      </div>
                      <StatusSelect task={t} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filteredPhaseOrder.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No tasks found matching your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
