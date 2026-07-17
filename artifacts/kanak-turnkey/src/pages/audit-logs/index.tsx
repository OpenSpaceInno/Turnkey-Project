import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import type { AuditLog } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  if (typeof value === "boolean") return <span className={value ? "text-green-600" : "text-red-500"}>{String(value)}</span>;
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
          <span className="font-medium text-muted-foreground truncate pt-0.5">{k}</span>
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
          {/* Core fields */}
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

          {/* Metadata */}
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

export default function AuditLogs() {
  const { data: logs, isLoading } = useListAuditLogs();
  const [selected, setSelected] = useState<AuditLog | null>(null);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading audit logs…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">System-wide activity and security logs. Click any row to see full detail.</p>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
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
              {logs?.map((log) => {
                const statusCfg = STATUS_BADGE[log.status] ?? STATUS_BADGE.success;
                const StatusIcon = statusCfg.icon;
                const hasMeta = !!log.metadata;
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() => setSelected(log)}
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
              })}
              {!logs?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-sans text-sm">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <DetailDialog
          log={selected}
          open={!!selected}
          onOpenChange={(v) => { if (!v) setSelected(null); }}
        />
      )}
    </div>
  );
}
