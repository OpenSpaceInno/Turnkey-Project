import { useEffect, useMemo, useState } from "react";
import { useListTasks, useListProjects, useUpdateTask, type Task } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ViewMode = "board" | "list" | "gantt";

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
  const { mutate, isPending } = useUpdateTask({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      },
    },
  });

  return (
    <Select
      value={task.status}
      disabled={isPending}
      onValueChange={(val) =>
        mutate({ id: task.id, data: { status: val as Task["status"] } as any })
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
  const { data: tasks, isLoading } = useListTasks();
  const { data: projects } = useListProjects();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "board";
    const v = new URLSearchParams(window.location.search).get("view");
    return v === "list" || v === "gantt" ? v : "board";
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (view === "board") params.delete("view");
    else params.set("view", view);
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, [view]);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const projectMap = useMemo(() => {
    const m = new Map<number, string>();
    (projects ?? []).forEach(p => m.set(p.id, p.name));
    return m;
  }, [projects]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tasks ?? []).filter(t => {
      if (q && !(t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q))) {
        return false;
      }
      if (projectFilter !== "all" && String(t.projectId) !== projectFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Cross-project task management.</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={v => setView(v as ViewMode)}>
            <TabsList>
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
            {(projects ?? []).map(p => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
