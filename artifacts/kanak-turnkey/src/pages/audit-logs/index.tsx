import { useListAuditLogs } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function AuditLogs() {
  const { data: logs, isLoading } = useListAuditLogs();

  if (isLoading) {
    return <div className="p-6">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">System-wide activity and security logs.</p>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity Type</th>
                <th className="px-4 py-3 font-medium">Entity ID</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono text-xs">
              {logs?.map(log => (
                <tr key={log.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-2">{format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}</td>
                  <td className="px-4 py-2 font-sans">{log.userName || log.userId}</td>
                  <td className="px-4 py-2 text-primary">{log.action}</td>
                  <td className="px-4 py-2">{log.entityType}</td>
                  <td className="px-4 py-2">{log.entityId}</td>
                  <td className="px-4 py-2 text-muted-foreground">{log.ipAddress || '-'}</td>
                </tr>
              ))}
              {!logs?.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-sans text-sm">No audit logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
