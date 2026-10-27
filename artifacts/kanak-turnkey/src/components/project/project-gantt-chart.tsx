import React, { useState, useMemo, useRef } from "react";
import type { Task } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarRange,
  Columns3,
  LayoutList,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
  User,
  Info,
  Calendar,
  Layers,
  Check,
} from "lucide-react";
import {
  format,
  differenceInDays,
  addDays,
  isBefore,
  isAfter,
  isToday,
  startOfDay,
  parseISO,
} from "date-fns";

// ── Types & Constants ────────────────────────────────────────────────────────

export interface ProjectGanttChartProps {
  tasks: Task[];
  projectId: number;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  onUpdateStatus?: (taskId: number, newStatus: string) => void;
  onOpenAddTask?: () => void;
  onOpenApplyTemplate?: () => void;
  renderStatusSelect?: (task: Task) => React.ReactNode;
}

export interface ComputedGanttTask extends Task {
  cleanStart: Date;
  cleanEnd: Date;
  durationDays: number;
  earlyStartDays: number;
  earlyFinishDays: number;
  lateStartDays: number;
  lateFinishDays: number;
  totalFloat: number;
  isCritical: boolean;
  predecessorIds: number[];
}

const TASK_STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; bg: string; border: string; barGradient: string }
> = {
  todo: {
    label: "To Do",
    dot: "bg-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-300 dark:border-slate-800",
    barGradient: "from-slate-500 to-slate-600",
  },
  in_progress: {
    label: "In Progress",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-300 dark:border-blue-900",
    barGradient: "from-blue-600 to-indigo-600",
  },
  in_review: {
    label: "In Review",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-300 dark:border-amber-900",
    barGradient: "from-amber-500 to-orange-500",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-300 dark:border-emerald-900",
    barGradient: "from-emerald-600 to-teal-600",
  },
};

export function ProjectGanttChart({
  tasks,
  projectId,
  projectStartDate,
  projectEndDate,
  onUpdateStatus,
  onOpenAddTask,
  onOpenApplyTemplate,
  renderStatusSelect,
}: ProjectGanttChartProps) {
  // View states
  const [viewMode, setViewMode] = useState<"gantt" | "board" | "table">("gantt");
  const [showCriticalOnly, setShowCriticalOnly] = useState<boolean>(false);
  const [highlightCriticalPath, setHighlightCriticalPath] = useState<boolean>(true);
  const [timeZoom, setTimeZoom] = useState<"days" | "weeks" | "months">("weeks");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // ── 1. Critical Path Method (CPM) Calculation Engine ───────────────────────
  const {
    computedTasks,
    timelineStart,
    timelineEnd,
    totalTimelineDays,
    criticalPathChain,
    criticalPathDuration,
    criticalTasksCount,
    overallRisk,
  } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      const today = startOfDay(new Date());
      return {
        computedTasks: [],
        timelineStart: today,
        timelineEnd: addDays(today, 30),
        totalTimelineDays: 30,
        criticalPathChain: [],
        criticalPathDuration: 0,
        criticalTasksCount: 0,
        overallRisk: "Low",
      };
    }

    // Determine baseline project start
    const defaultBaseDate = projectStartDate
      ? startOfDay(parseISO(projectStartDate))
      : startOfDay(new Date());

    // Step A: Parse dates and durations
    const rawList = tasks.map((t, idx) => {
      let start: Date;
      let end: Date;

      if (t.startDate) {
        start = startOfDay(new Date(t.startDate));
      } else {
        start = addDays(defaultBaseDate, idx * 3);
      }

      if (t.endDate) {
        end = startOfDay(new Date(t.endDate));
      } else {
        end = addDays(start, 5);
      }

      if (isBefore(end, start)) {
        end = addDays(start, 1);
      }

      const duration = Math.max(1, differenceInDays(end, start));

      // Inferred dependencies: explicit parentTaskId OR prior sequential task
      const predecessorIds: number[] = [];
      if (t.parentTaskId) {
        predecessorIds.push(t.parentTaskId);
      }

      return {
        ...t,
        cleanStart: start,
        cleanEnd: end,
        durationDays: duration,
        predecessorIds,
      };
    });

    // Sort chronologically
    rawList.sort((a, b) => a.cleanStart.getTime() - b.cleanStart.getTime());

    // Earliest start and latest end for timeline bounds
    let earliest = rawList[0].cleanStart;
    let latest = rawList[0].cleanEnd;

    for (const item of rawList) {
      if (isBefore(item.cleanStart, earliest)) earliest = item.cleanStart;
      if (isAfter(item.cleanEnd, latest)) latest = item.cleanEnd;
    }

    // Add buffer padding to timeline
    const paddedStart = addDays(earliest, -3);
    const paddedEnd = addDays(latest, 7);
    const totalDays = Math.max(7, differenceInDays(paddedEnd, paddedStart));

    // Step B: Forward Pass (Early Start & Early Finish)
    const taskMap = new Map<number, any>();
    rawList.forEach((item) => {
      taskMap.set(item.id, {
        ...item,
        earlyStartDays: differenceInDays(item.cleanStart, earliest),
        earlyFinishDays: differenceInDays(item.cleanStart, earliest) + item.durationDays,
      });
    });

    // Step C: Backward Pass (Late Start & Late Finish)
    const maxProjectEF = Math.max(
      ...Array.from(taskMap.values()).map((t) => t.earlyFinishDays)
    );

    // Initial late finish is max project finish
    taskMap.forEach((t) => {
      t.lateFinishDays = maxProjectEF;
      t.lateStartDays = t.lateFinishDays - t.durationDays;
    });

    // Adjust backward based on successors
    const successorMap = new Map<number, number[]>();
    taskMap.forEach((t) => {
      t.predecessorIds.forEach((pId: number) => {
        if (!successorMap.has(pId)) successorMap.set(pId, []);
        successorMap.get(pId)!.push(t.id);
      });
    });

    // Backward pass adjustment
    const reversed = [...rawList].reverse();
    reversed.forEach((t) => {
      const succs = successorMap.get(t.id);
      if (succs && succs.length > 0) {
        const minSuccLS = Math.min(
          ...succs.map((sId) => taskMap.get(sId)?.lateStartDays ?? maxProjectEF)
        );
        const curr = taskMap.get(t.id);
        curr.lateFinishDays = minSuccLS;
        curr.lateStartDays = curr.lateFinishDays - curr.durationDays;
      }
    });

    // Step D: Calculate Float & Critical Path Identification
    const processed: ComputedGanttTask[] = [];
    let minFloatFound = Infinity;

    taskMap.forEach((t) => {
      // Float = Late Finish - Early Finish
      const float = Math.max(0, t.lateFinishDays - t.earlyFinishDays);
      if (float < minFloatFound) minFloatFound = float;
      processed.push({
        ...t,
        totalFloat: float,
        isCritical: false,
      });
    });

    // Tasks with minimum float (typically 0, or closest to 0 if gap exists) are critical
    const criticalThreshold = Math.max(0, minFloatFound) <= 1 ? 1 : minFloatFound;
    let criticalDurationSum = 0;
    const chain: ComputedGanttTask[] = [];

    processed.forEach((t) => {
      // Mark as critical if float is within threshold or priority urgent/high on critical timeline
      if (t.totalFloat <= criticalThreshold) {
        t.isCritical = true;
        criticalDurationSum += t.durationDays;
        chain.push(t);
      }
    });

    // If chain is empty (single task or equal floats), pick longest path
    if (chain.length === 0 && processed.length > 0) {
      processed[0].isCritical = true;
      chain.push(processed[0]);
      criticalDurationSum = processed[0].durationDays;
    }

    chain.sort((a, b) => a.cleanStart.getTime() - b.cleanStart.getTime());

    // Step E: Risk Assessment
    const now = new Date();
    const hasOverdueCritical = chain.some(
      (c) => isBefore(c.cleanEnd, now) && c.status !== "completed"
    );
    const hasDelayedCritical = chain.some(
      (c) => c.status === "in_progress" && (c.progress ?? 0) < 30 && isBefore(c.cleanStart, now)
    );

    let risk: "Low" | "Moderate" | "High" = "Low";
    if (hasOverdueCritical) {
      risk = "High";
    } else if (hasDelayedCritical) {
      risk = "Moderate";
    }

    return {
      computedTasks: processed,
      timelineStart: paddedStart,
      timelineEnd: paddedEnd,
      totalTimelineDays: totalDays,
      criticalPathChain: chain,
      criticalPathDuration: criticalDurationSum,
      criticalTasksCount: chain.length,
      overallRisk: risk,
    };
  }, [tasks, projectStartDate, projectEndDate]);

  // Filter tasks for display
  const displayedTasks = useMemo(() => {
    return computedTasks.filter((t) => {
      if (showCriticalOnly && !t.isCritical) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      return true;
    });
  }, [computedTasks, showCriticalOnly, filterStatus]);

  // Generate Date Headers for Gantt Timeline
  const timeHeaders = useMemo(() => {
    const headers: { label: string; subLabel: string; leftPercent: number; widthPercent: number }[] = [];
    const stepDays = timeZoom === "days" ? 1 : timeZoom === "weeks" ? 7 : 30;
    let curr = timelineStart;

    while (isBefore(curr, timelineEnd)) {
      const next = addDays(curr, stepDays);
      const startOffset = Math.max(0, differenceInDays(curr, timelineStart));
      const chunkDays = Math.min(stepDays, differenceInDays(timelineEnd, curr));
      const leftP = (startOffset / totalTimelineDays) * 100;
      const widthP = (chunkDays / totalTimelineDays) * 100;

      headers.push({
        label: format(curr, timeZoom === "months" ? "MMM yyyy" : "MMM d"),
        subLabel: timeZoom === "days" ? format(curr, "EEE") : timeZoom === "weeks" ? `Wk ${format(curr, "w")}` : "",
        leftPercent: leftP,
        widthPercent: widthP,
      });

      curr = next;
    }
    return headers;
  }, [timelineStart, timelineEnd, totalTimelineDays, timeZoom]);

  // Today indicator marker position
  const todayPositionPercent = useMemo(() => {
    const today = startOfDay(new Date());
    if (isBefore(today, timelineStart) || isAfter(today, timelineEnd)) return null;
    const daysFromStart = differenceInDays(today, timelineStart);
    return (daysFromStart / totalTimelineDays) * 100;
  }, [timelineStart, timelineEnd, totalTimelineDays]);

  if (!tasks || tasks.length === 0) {
    return (
      <Card className="border-dashed p-10 text-center space-y-4">
        <CalendarRange className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <div className="space-y-1">
          <h3 className="font-bold text-base">No tasks scheduled for this project</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Apply a pre-configured template or add custom tasks to generate an interactive Gantt chart schedule with automated Critical Path Analysis.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          {onOpenApplyTemplate && (
            <Button size="sm" variant="outline" onClick={onOpenApplyTemplate} className="gap-2 text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Apply Template
            </Button>
          )}
          {onOpenAddTask && (
            <Button size="sm" onClick={onOpenAddTask} className="gap-2 text-xs">
              Add Task
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {/* ── 1. Top Control Bar ────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-xs">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border bg-muted/50 p-1 shadow-xs">
              <Button
                variant={viewMode === "gantt" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("gantt")}
                className="gap-1.5 text-xs font-semibold h-8"
              >
                <CalendarRange className="h-3.5 w-3.5" />
                Gantt Timeline
              </Button>
              <Button
                variant={viewMode === "board" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("board")}
                className="gap-1.5 text-xs font-semibold h-8"
              >
                <Columns3 className="h-3.5 w-3.5" />
                Status Board
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="gap-1.5 text-xs font-semibold h-8"
              >
                <LayoutList className="h-3.5 w-3.5" />
                Matrix
              </Button>
            </div>

            {/* Critical Path Toggle Button */}
            <Button
              variant={highlightCriticalPath ? "default" : "outline"}
              size="sm"
              onClick={() => setHighlightCriticalPath(!highlightCriticalPath)}
              className={`gap-1.5 text-xs font-semibold h-8 transition-all ${
                highlightCriticalPath
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs ring-2 ring-rose-400/40"
                  : "border-rose-400/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              }`}
            >
              <Flame className={`h-3.5 w-3.5 ${highlightCriticalPath ? "animate-pulse" : ""}`} />
              Critical Path {highlightCriticalPath ? "Active" : "Off"}
            </Button>
          </div>

          {/* Right Filters & Zoom */}
          <div className="flex flex-wrap items-center gap-2">
            {viewMode === "gantt" && (
              <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTimeZoom("days")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    timeZoom === "days" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Days
                </button>
                <button
                  type="button"
                  onClick={() => setTimeZoom("weeks")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    timeZoom === "weeks" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Weeks
                </button>
                <button
                  type="button"
                  onClick={() => setTimeZoom("months")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    timeZoom === "months" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Months
                </button>
              </div>
            )}

            {/* Filter by Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[125px] h-8 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Critical Only Toggle */}
            <Button
              variant={showCriticalOnly ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowCriticalOnly(!showCriticalOnly)}
              className="h-8 text-xs gap-1"
            >
              <Filter className="h-3 w-3" />
              {showCriticalOnly ? "Critical Only" : "All Tasks"}
            </Button>
          </div>
        </div>

        {/* ── 2. Critical Path Analysis (CPA) Summary Header (FR-TASK-08) ────── */}
        {highlightCriticalPath && (
          <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/5 via-rose-500/[0.02] to-background p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-rose-500/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    Critical Path Analysis (CPM)
                    <Badge variant="outline" className="text-[10px] border-rose-400/40 text-rose-700 dark:text-rose-300">
                      Zero Float Chain
                    </Badge>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Activities that directly dictate the scheduled handover date. Any delay on these tasks directly postpones project completion.
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Critical Duration</div>
                  <div className="font-black text-rose-600 dark:text-rose-400 text-sm font-mono">
                    {criticalPathDuration} Days
                  </div>
                </div>
                <div className="h-6 w-px bg-border/60" />
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Critical Ratio</div>
                  <div className="font-bold text-foreground text-sm font-mono">
                    {criticalTasksCount} <span className="text-muted-foreground text-xs font-normal">/ {tasks.length} ({Math.round((criticalTasksCount / tasks.length) * 100)}%)</span>
                  </div>
                </div>
                <div className="h-6 w-px bg-border/60" />
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Schedule Risk</div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      overallRisk === "High"
                        ? "bg-red-500/10 text-red-600 border-red-300"
                        : overallRisk === "Moderate"
                        ? "bg-amber-500/10 text-amber-600 border-amber-300"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                    }`}
                  >
                    {overallRisk} Risk
                  </Badge>
                </div>
              </div>
            </div>

            {/* Critical Path Sequential Breadcrumb */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                Sequence:
              </span>
              {criticalPathChain.map((task, idx) => (
                <div key={task.id} className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setHoveredTaskId(task.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
                      hoveredTaskId === task.id
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-background hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-300/40 text-foreground"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span className="max-w-[130px] truncate">{task.title}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">({task.durationDays}d)</span>
                  </button>
                  {idx < criticalPathChain.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-rose-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 3. Main View Render ───────────────────────────────────────────── */}
        {viewMode === "gantt" && (
          /* ── Gantt Chart View (FR-TASK-07) ── */
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto" ref={containerRef}>
              <div className="min-w-[880px]">
                {/* ── Gantt Timeline Header ── */}
                <div className="flex border-b bg-muted/40 text-xs font-semibold sticky top-0 z-20">
                  {/* Left Column: Task Info Header */}
                  <div className="w-[300px] shrink-0 p-3 border-r bg-muted/60 flex items-center justify-between">
                    <span className="uppercase tracking-wider text-[11px] text-muted-foreground">Task / Activity</span>
                    <span className="text-[10px] text-muted-foreground">Duration & Float</span>
                  </div>

                  {/* Right Column: Time Scale Markers */}
                  <div className="flex-1 relative h-12">
                    {timeHeaders.map((hdr, idx) => (
                      <div
                        key={idx}
                        style={{ left: `${hdr.leftPercent}%`, width: `${hdr.widthPercent}%` }}
                        className="absolute top-0 bottom-0 border-r border-border/50 px-2 flex flex-col justify-center text-[10px] truncate"
                      >
                        <span className="font-bold text-foreground/90">{hdr.label}</span>
                        {hdr.subLabel && <span className="text-muted-foreground text-[9px]">{hdr.subLabel}</span>}
                      </div>
                    ))}

                    {/* Today Marker in Header */}
                    {todayPositionPercent !== null && (
                      <div
                        style={{ left: `${todayPositionPercent}%` }}
                        className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
                      >
                        <span className="bg-red-500 text-white font-bold text-[9px] px-1 py-0.2 rounded-xs shadow-xs">
                          Today
                        </span>
                        <div className="w-0.5 flex-1 bg-red-500/70" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Gantt Task Rows ── */}
                <div className="divide-y divide-border/50 relative">
                  {/* Today Full Height Line Marker */}
                  {todayPositionPercent !== null && (
                    <div
                      style={{ left: `calc(300px + ${todayPositionPercent}% * (100% - 300px) / 100)` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500/40 border-r border-dashed border-red-500/80 z-10 pointer-events-none"
                    />
                  )}

                  {displayedTasks.map((task) => {
                    const statusCfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.todo;
                    const isSelected = hoveredTaskId === task.id;

                    // Calculate task bar position and width relative to total timeline
                    const startOffsetDays = Math.max(0, differenceInDays(task.cleanStart, timelineStart));
                    const leftP = Math.max(0, Math.min(100, (startOffsetDays / totalTimelineDays) * 100));
                    const widthP = Math.max(1.5, Math.min(100 - leftP, (task.durationDays / totalTimelineDays) * 100));

                    return (
                      <div
                        key={task.id}
                        onMouseEnter={() => setHoveredTaskId(task.id)}
                        onMouseLeave={() => setHoveredTaskId(null)}
                        className={`flex items-center transition-colors group ${
                          isSelected ? "bg-accent/40" : "hover:bg-muted/20"
                        } ${task.isCritical && highlightCriticalPath ? "bg-rose-500/[0.02]" : ""}`}
                      >
                        {/* Left Info Column */}
                        <div className="w-[300px] shrink-0 p-2.5 border-r space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 truncate">
                              {task.isCritical && highlightCriticalPath ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Flame className="h-3.5 w-3.5 text-rose-600 animate-pulse shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs font-semibold">Critical Path Activity (Zero Float)</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className={`h-2 w-2 rounded-full shrink-0 ${statusCfg.dot}`} />
                              )}
                              <span className="font-semibold text-xs text-foreground truncate" title={task.title}>
                                {task.title}
                              </span>
                            </div>

                            {task.isCritical && highlightCriticalPath && (
                              <Badge variant="outline" className="text-[9px] font-bold text-rose-600 border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 px-1 py-0 h-4">
                                Critical
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                            <span className="flex items-center gap-1 truncate max-w-[140px]">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{task.assignedToName || "Unassigned"}</span>
                            </span>

                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                              <span>{task.durationDays}d</span>
                              <span className="text-border">|</span>
                              <span className={task.totalFloat === 0 ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                                Float: {task.totalFloat}d
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Timeline Canvas Row */}
                        <div className="flex-1 relative h-14 p-1 flex items-center">
                          {/* Background Grid Guidelines */}
                          <div className="absolute inset-0 flex pointer-events-none">
                            {timeHeaders.map((_, idx) => (
                              <div key={idx} className="flex-1 border-r border-border/20" />
                            ))}
                          </div>

                          {/* Gantt Bar with Tooltip */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                style={{
                                  left: `${leftP}%`,
                                  width: `${widthP}%`,
                                }}
                                className={`absolute h-8 rounded-md shadow-xs cursor-pointer transition-all duration-150 flex items-center px-2 text-[11px] font-bold text-white select-none ${
                                  task.isCritical && highlightCriticalPath
                                    ? "bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 ring-2 ring-rose-400/60 shadow-md"
                                    : `bg-gradient-to-r ${statusCfg.barGradient}`
                                } hover:scale-[1.01] hover:shadow-md`}
                              >
                                {/* Progress Fill Track */}
                                <div
                                  style={{ width: `${task.progress ?? 0}%` }}
                                  className="absolute left-0 top-0 bottom-0 bg-black/20 rounded-l-md"
                                />

                                {/* Label Inside Bar */}
                                <div className="relative z-10 flex items-center justify-between w-full truncate gap-1">
                                  <span className="truncate drop-shadow-xs">{task.title}</span>
                                  <span className="text-[10px] opacity-90 font-mono shrink-0">
                                    {task.progress ?? 0}%
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-3 space-y-1.5 text-xs max-w-xs">
                              <div className="font-bold text-sm flex items-center justify-between gap-2 border-b border-white/20 pb-1">
                                <span>{task.title}</span>
                                <Badge variant="secondary" className="text-[9px] uppercase">
                                  {statusCfg.label}
                                </Badge>
                              </div>
                              <div className="space-y-0.5 text-[11px]">
                                <div className="flex justify-between">
                                  <span className="opacity-80">Dates:</span>
                                  <span className="font-mono">
                                    {format(task.cleanStart, "MMM d")} → {format(task.cleanEnd, "MMM d, yyyy")}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="opacity-80">Duration:</span>
                                  <span className="font-mono font-semibold">{task.durationDays} Days</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="opacity-80">Completion:</span>
                                  <span className="font-mono font-semibold">{task.progress ?? 0}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="opacity-80">Assignee:</span>
                                  <span>{task.assignedToName || "Unassigned"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="opacity-80">Critical Path:</span>
                                  <span className={`font-bold ${task.isCritical ? "text-rose-300" : "opacity-90"}`}>
                                    {task.isCritical ? "🔥 Yes (Zero Float)" : `No (${task.totalFloat}d float)`}
                                  </span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Gantt Legend & Footer */}
            <div className="p-3 bg-muted/40 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-6 rounded-sm bg-gradient-to-r from-rose-600 to-red-600 ring-1 ring-rose-400" />
                  <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">Critical Path (Zero Float)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-6 rounded-sm bg-gradient-to-r from-blue-600 to-indigo-600" />
                  <span>In Progress</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-6 rounded-sm bg-gradient-to-r from-emerald-600 to-teal-600" />
                  <span>Completed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-6 rounded-sm bg-slate-500" />
                  <span>To Do</span>
                </span>
              </div>
              <div>
                Showing <span className="font-bold text-foreground">{displayedTasks.length}</span> of{" "}
                <span className="font-bold text-foreground">{tasks.length}</span> tasks
              </div>
            </div>
          </div>
        )}

        {/* ── 4. Status Board (Kanban) View ─────────────────────────────────── */}
        {viewMode === "board" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
            {Object.entries(TASK_STATUS_CONFIG).map(([statusKey, cfg]) => {
              const statusTasks = displayedTasks.filter((t) => t.status === statusKey);

              return (
                <div key={statusKey} className="rounded-xl border bg-muted/30 p-3 space-y-3 min-h-[350px]">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                      <span>{cfg.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {statusTasks.length}
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {statusTasks.map((task) => (
                      <Card
                        key={task.id}
                        className={`p-3 space-y-2.5 shadow-xs hover:shadow-md transition-all ${
                          task.isCritical && highlightCriticalPath ? "border-rose-400/50 bg-rose-50/20 dark:bg-rose-950/10" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-xs text-foreground line-clamp-1">{task.title}</span>
                          {task.isCritical && highlightCriticalPath && (
                            <Badge variant="outline" className="text-[9px] font-bold text-rose-600 border-rose-300 px-1 py-0 h-4">
                              🔥 Critical
                            </Badge>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{task.description}</p>
                        )}

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-mono font-bold">{task.progress ?? 0}%</span>
                          </div>
                          <Progress value={task.progress ?? 0} className="h-1.5" />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                          <span className="flex items-center gap-1 truncate max-w-[120px]">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{task.assignedToName || "Unassigned"}</span>
                          </span>
                          <span className="font-mono">{task.durationDays}d</span>
                        </div>

                        {renderStatusSelect && <div className="pt-1">{renderStatusSelect(task)}</div>}
                      </Card>
                    ))}

                    {statusTasks.length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                        No tasks in {cfg.label}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 5. Table / Matrix View ────────────────────────────────────────── */}
        {viewMode === "table" && (
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Task Title</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Critical Path</th>
                    <th className="px-3 py-3">Progress</th>
                    <th className="px-3 py-3">Start Date</th>
                    <th className="px-3 py-3">End Date</th>
                    <th className="px-3 py-3 text-right">Duration</th>
                    <th className="px-3 py-3 text-right">Float</th>
                    <th className="px-3 py-3">Assignee</th>
                    {renderStatusSelect && <th className="px-3 py-3 text-center">Change Status</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {displayedTasks.map((task) => {
                    const statusCfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.todo;
                    return (
                      <tr key={task.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          <div className="flex items-center gap-1.5">
                            {task.isCritical && highlightCriticalPath ? (
                              <Flame className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                            ) : null}
                            <span>{task.title}</span>
                          </div>
                          {task.description && (
                            <div className="text-[10px] text-muted-foreground font-normal line-clamp-1">{task.description}</div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="text-[10px] capitalize font-semibold">
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          {task.isCritical ? (
                            <Badge className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold">
                              Critical
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 w-32">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span>{task.progress ?? 0}%</span>
                            </div>
                            <Progress value={task.progress ?? 0} className="h-1.5" />
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-muted-foreground">
                          {format(task.cleanStart, "yyyy-MM-dd")}
                        </td>
                        <td className="px-3 py-3 font-mono text-muted-foreground">
                          {format(task.cleanEnd, "yyyy-MM-dd")}
                        </td>
                        <td className="px-3 py-3 font-mono text-right font-semibold">
                          {task.durationDays}d
                        </td>
                        <td className="px-3 py-3 font-mono text-right">
                          <span className={task.totalFloat === 0 ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                            {task.totalFloat}d
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {task.assignedToName || "Unassigned"}
                        </td>
                        {renderStatusSelect && (
                          <td className="px-3 py-3 text-center">
                            {renderStatusSelect(task)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
