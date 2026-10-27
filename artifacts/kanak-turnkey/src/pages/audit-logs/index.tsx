import { useState, useMemo } from "react";
import { useListAuditLogs, useFinancialAuditLogs } from "@workspace/api-client-react";
import type { AuditLog, FinancialAuditLog } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronRight,
  Clock,
  User,
  Tag,
  Hash,
  Globe,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Receipt,
  Search,
  Filter,
  ShieldCheck,
  FileText,
} from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  success: { label: "Success", class: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  denied:  { label: "Denied",  class: "text-red-700 bg-red-50 border-red-200",       icon: ShieldAlert },
  error:   { label: "Error",   class: "text-orange-700 bg-orange-50 border-orange-200", icon: XCircle },
};

function parseMetadata(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, unknown>;
  } catch {}
  return null;
}

function MetadataValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground italic">null</span>;
  if (typeof value === "boolean") return <span className={value ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>{String(value)}</span>;
  if (typeof value === "object") return <pre className="text-xs bg-muted/50 rounded p-2 overflow-auto max-h-40">{JSON.stringify(value, null, 2)}</pre>;
  return <span>{String(value)}</span>;
}

function BeforeAfterView({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const changedKeys = allKeys.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  const unchangedKeys = allKeys.filter((k) => !changedKeys.includes(k));

  return (
    <div className="space-y-3">
      {changedKeys.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Changed fields</p>
          <div className="divide-y rounded-md border overflow-hidden">
            {changedKeys.map((k) => (
              <div key={k} className="grid grid-cols-[120px_1fr_20px_1fr] gap-2 items-start px-3 py-2 text-xs bg-amber-50/50">
                <span className="font-medium text-muted-foreground pt-0.5 truncate">{k}</span>
                <div className="font-mono line-through text-red-500/80 break-all"><MetadataValue value={before[k]} /></div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="font-mono text-green-700 break-all"><MetadataValue value={after[k]} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {unchangedKeys.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
            <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
            {unchangedKeys.length} unchanged field{unchangedKeys.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 divide-y rounded-md border overflow-hidden">
            {unchangedKeys.map((k) => (
              <div key={k} className="grid grid-cols-[120px_1fr] gap-2 items-start px-3 py-2 text-xs opacity-60">
                <span className="font-medium text-muted-foreground truncate">{k}</span>
                <div className="font-mono break-all"><MetadataValue value={before[k] ?? after[k]} /></div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function RawMetadataView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="divide-y rounded-md border overflow-hidden">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="grid grid-cols-[140px_1fr] gap-2 items-start px-3 py-2 text-xs">
          <span className="font-medium text-muted-foreground truncate pt-0.5 capitalize">
            {k.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
          </span>
          <div className="font-mono break-all"><MetadataValue value={v} /></div>
        </div>
      ))}
    </div>
  );
}

function DetailDialog({ log, open, onOpenChange }: { log: AuditLog; open: boolean; onOpenChange: (v: boolean) => void }) {
  const statusCfg = STATUS_BADGE[log.status] ?? STATUS_BADGE.success;
  const StatusIcon = statusCfg.icon;
  const meta = parseMetadata(log.metadata);
  const hasBefore = meta && "before" in meta && typeof meta.before === "object";
  const hasAfter  = meta && "after"  in meta && typeof meta.after  === "object";
  const isBeforeAfter = hasBefore && hasAfter;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-base leading-snug">{log.activity}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className={`gap-1 ${statusCfg.class}`}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm:ss a")}</span>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { icon: User,  label: "User",        value: log.userName || `User #${log.userId}` },
              { icon: Tag,   label: "Resource",     value: log.resourceType },
              { icon: Hash,  label: "Resource ID",  value: log.resourceId != null ? String(log.resourceId) : "—" },
              { icon: Globe, label: "IP Address",   value: log.ipAddress || "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {meta && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  {isBeforeAfter ? "Change Detail" : "Additional Detail"}
                  {isBeforeAfter && (
                    <Badge variant="secondary" className="text-xs font-normal">before / after</Badge>
                  )}
                </p>
                {isBeforeAfter ? (
                  <BeforeAfterView
                    before={meta.before as Record<string, unknown>}
                    after={meta.after as Record<string, unknown>}
                  />
                ) : (
                  <RawMetadataView data={meta} />
                )}
              </div>
            </>
          )}

          {!meta && (
            <p className="text-xs text-muted-foreground italic">No additional detail recorded for this entry.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FinancialDetailDialog({ log, open, onOpenChange }: { log: FinancialAuditLog; open: boolean; onOpenChange: (v: boolean) => void }) {
  const isAR = log.workflowType === "AR";
  const isAP = log.workflowType === "AP";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={`text-xs uppercase font-semibold ${
                isAR
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : isAP
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {isAR ? "AR • Client Billing" : isAP ? "AP • Vendor Billing" : "Site Direct Cost"}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              #{log.id}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold">
            {log.action.replace(/_/g, " ")} &bull; {log.entityType.replace(/_/g, " ").toUpperCase()}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Timestamp: {format(new Date(log.createdAt), "MMMM d, yyyy 'at' h:mm:ss a")}
          </p>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Key Details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Authorized User</p>
                <p className="font-semibold text-foreground">{log.userName || `User #${log.userId}`}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Entity Reference</p>
                <p className="font-semibold text-foreground capitalize">
                  {log.entityType.replace(/_/g, " ")} #{log.entityId}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 col-span-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Status Transition</p>
                <div className="flex items-center gap-2 mt-1">
                  {log.previousStatus ? (
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-400 text-xs">
                      {log.previousStatus.replace(/_/g, " ")}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">initial state</span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-semibold">
                    {log.newStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </div>

            {log.comments && (
              <div className="flex items-start gap-2 col-span-2 bg-muted/40 p-3 rounded-lg border">
                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Remarks & Audit Notes</p>
                  <p className="text-sm mt-0.5 text-foreground">{log.comments}</p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Display */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Financial Metadata & Parameters
                </p>
                <RawMetadataView data={log.metadata} />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState<"financial" | "system">("financial");
  const [workflowFilter, setWorkflowFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Data Queries
  const { data: logs, isLoading: loadingSystem } = useListAuditLogs();
  const { data: financialLogs = [], isLoading: loadingFinancial } = useFinancialAuditLogs({
    workflowType: workflowFilter !== "ALL" ? workflowFilter : undefined,
  });

  const [selectedSystem, setSelectedSystem] = useState<AuditLog | null>(null);
  const [selectedFinancial, setSelectedFinancial] = useState<FinancialAuditLog | null>(null);

  // Filtered Financial Logs
  const filteredFinancialLogs = useMemo(() => {
    return (financialLogs || []).filter((l) => {
      if (workflowFilter !== "ALL" && l.workflowType !== workflowFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const entityStr = `${l.entityType} ${l.entityId}`.toLowerCase();
      const actionStr = l.action.toLowerCase();
      const userStr = (l.userName || "").toLowerCase();
      const commentStr = (l.comments || "").toLowerCase();
      return (
        entityStr.includes(q) ||
        actionStr.includes(q) ||
        userStr.includes(q) ||
        commentStr.includes(q)
      );
    });
  }, [financialLogs, workflowFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit & Compliance Trail</h1>
          <p className="text-muted-foreground">
            Strict compliance logging across AR, AP, direct site expenses, and system activities
          </p>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "financial" | "system")}>
        <TabsList className="grid w-full sm:w-[500px] grid-cols-2">
          <TabsTrigger value="financial" className="gap-2 text-xs sm:text-sm">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Financial Audit (AR / AP)
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
              {financialLogs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2 text-xs sm:text-sm">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            System Activity Logs
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
              {Array.isArray(logs) ? logs.length : 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── 1. FINANCIAL AUDIT TRAIL ── */}
        <TabsContent value="financial" className="space-y-4 pt-2">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Workflow:
              </span>
              {[
                { key: "ALL", label: "All Financials" },
                { key: "AR", label: "Client AR", icon: TrendingUp, color: "text-blue-400" },
                { key: "AP", label: "Vendor AP", icon: TrendingDown, color: "text-purple-400" },
              ].map((btn) => (
                <Button
                  key={btn.key}
                  size="sm"
                  variant={workflowFilter === btn.key ? "default" : "outline"}
                  onClick={() => setWorkflowFilter(btn.key)}
                  className="text-xs h-7 px-2.5"
                >
                  {btn.icon && <btn.icon className={`w-3 h-3 mr-1 ${btn.color}`} />}
                  {btn.label}
                </Button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search action, entity, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b text-xs">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Workflow</th>
                    <th className="px-4 py-3 font-medium">Entity & Action</th>
                    <th className="px-4 py-3 font-medium">Status Transition</th>
                    <th className="px-4 py-3 font-medium">Authorized By</th>
                    <th className="px-4 py-3 font-medium">Audit Notes</th>
                    <th className="px-4 py-3 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {loadingFinancial ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Loading financial audit logs...
                      </td>
                    </tr>
                  ) : filteredFinancialLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No financial audit records match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredFinancialLogs.map((log) => {
                      const isAR = log.workflowType === "AR";
                      const isAP = log.workflowType === "AP";

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-accent/50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedFinancial(log)}
                        >
                          <td className="px-4 py-2.5 whitespace-nowrap font-mono text-muted-foreground">
                            {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-semibold ${
                                isAR
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  : isAP
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {log.workflowType}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-foreground">
                              {log.action.replace(/_/g, " ")}
                            </div>
                            <div className="text-[11px] text-muted-foreground capitalize">
                              {log.entityType.replace(/_/g, " ")} #{log.entityId}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              {log.previousStatus && (
                                <>
                                  <span className="text-muted-foreground font-mono text-[11px]">
                                    {log.previousStatus}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                </>
                              )}
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-medium"
                              >
                                {log.newStatus}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-sans font-medium text-foreground">
                            {log.userName || `User #${log.userId}`}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground max-w-[260px] truncate">
                            {log.comments || "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── 2. SYSTEM ACTIVITY LOGS ── */}
        <TabsContent value="system" className="space-y-4 pt-2">
          <div className="rounded-md border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b text-xs">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Activity</th>
                    <th className="px-4 py-3 font-medium">Resource</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs font-mono">
                  {loadingSystem ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Loading system activity logs...
                      </td>
                    </tr>
                  ) : (Array.isArray(logs) ? logs : []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-sans text-sm">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    (Array.isArray(logs) ? logs : []).map((log) => {
                      const statusCfg = STATUS_BADGE[log.status] ?? STATUS_BADGE.success;
                      const StatusIcon = statusCfg.icon;
                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-accent/50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedSystem(log)}
                        >
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                          </td>
                          <td className="px-4 py-2.5 font-sans">{log.userName || `#${log.userId}`}</td>
                          <td className="px-4 py-2.5 text-foreground font-sans max-w-[280px] truncate">{log.activity}</td>
                          <td className="px-4 py-2.5">
                            <span>{log.resourceType}</span>
                            {log.resourceId != null && (
                              <span className="text-muted-foreground ml-1">#{log.resourceId}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className={`gap-1 font-sans font-normal ${statusCfg.class}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedSystem && (
        <DetailDialog
          log={selectedSystem}
          open={!!selectedSystem}
          onOpenChange={(v) => { if (!v) setSelectedSystem(null); }}
        />
      )}

      {selectedFinancial && (
        <FinancialDetailDialog
          log={selectedFinancial}
          open={!!selectedFinancial}
          onOpenChange={(v) => { if (!v) setSelectedFinancial(null); }}
        />
      )}
    </div>
  );
}
