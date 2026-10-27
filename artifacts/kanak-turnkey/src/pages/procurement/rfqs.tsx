import { useState } from "react";
import { Link } from "wouter";
import {
  useRfqs,
  useRfqStats,
  useSendRfq,
  type Rfq,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Send,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { NewRfqDialog } from "@/components/dialogs/procurement-dialogs";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: any }
> = {
  draft: { label: "Draft", variant: "outline", icon: FileText },
  sent: { label: "Sent", variant: "secondary", icon: Send },
  receiving_quotes: { label: "Receiving Quotes", variant: "secondary", icon: Clock },
  quotes_received: { label: "Quotes Received", variant: "default", icon: CheckCircle },
  evaluated: { label: "Evaluated", variant: "default", icon: CheckCircle },
  completed: { label: "Completed", variant: "default", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

export default function RfqsList() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch data
  const { data: rfqs, isLoading } = useRfqs();
  const { data: stats } = useRfqStats();

  // Filter RFQs
  const rfqsArray = Array.isArray(rfqs) ? rfqs : [];
  const filteredRfqs = rfqsArray.filter((rfq) => {
    const matchesSearch =
      rfq.title.toLowerCase().includes(search.toLowerCase()) ||
      rfq.rfqNumber.toLowerCase().includes(search.toLowerCase()) ||
      (rfq.materialRequestNumber && rfq.materialRequestNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request for Quotations (RFQ)</h1>
          <p className="text-muted-foreground">
            Manage RFQs and vendor quotations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewRfqDialog
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create RFQ
              </Button>
            }
          />
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total RFQs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Draft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">
                {stats.draft || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sent to Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.sent || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.completed || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search RFQs..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="receiving_quotes">Receiving Quotes</SelectItem>
            <SelectItem value="quotes_received">Quotes Received</SelectItem>
            <SelectItem value="evaluated">Evaluated</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">RFQ No.</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Material Request</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Extracted Docs</th>
                <th className="px-4 py-3 font-medium">Vendors</th>
                <th className="px-4 py-3 font-medium">Quotes</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRfqs.map((rfq) => {
                const statusMeta = STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft;
                const StatusIcon = statusMeta.icon;
                const isOverdue = new Date(rfq.dueDate) < new Date() && rfq.status !== "completed";
                const hasExtractedDoc = (() => {
                  if (!rfq.notes) return false;
                  try {
                    const p = JSON.parse(rfq.notes);
                    return !!p.rfqDocument;
                  } catch {
                    return false;
                  }
                })();

                return (
                  <tr
                    key={rfq.id}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/procurement/rfqs/${rfq.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {rfq.rfqNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{rfq.title}</div>
                      {rfq.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {rfq.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {rfq.materialRequestNumber ? (
                        <Link
                          href={`/procurement/material-requests/${rfq.materialRequestId}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {rfq.materialRequestNumber}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {rfq.projectName}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-xs ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                        {format(new Date(rfq.dueDate), "PP")}
                      </div>
                      {isOverdue && (
                        <div className="text-xs text-red-600">Overdue</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        {hasExtractedDoc && (
                          <Badge variant="outline" className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-300 gap-1 font-normal">
                            <FileText className="w-3 h-3 text-blue-600" /> Spec Extracted
                          </Badge>
                        )}
                        {rfq.quotesReceivedCount > 0 && (
                          <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 gap-1 font-normal">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Quotes Verified
                          </Badge>
                        )}
                        {!hasExtractedDoc && rfq.quotesReceivedCount === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{rfq.sentToVendorCount || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{rfq.quotesReceivedCount || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusMeta.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusMeta.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          title="Export RFQ PDF"
                          onClick={() => window.open(`/api/procurement/rfqs/${rfq.id}/export-pdf?autoPrint=true`, '_blank', 'width=1000,height=800')}
                        >
                          <Printer className="h-3 w-3 text-primary" />
                          PDF
                        </Button>
                        <Link href={`/procurement/rfqs/${rfq.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                        {rfq.quotesReceivedCount > 0 && (
                          <Link href={`/procurement/rfqs/${rfq.id}/compare`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              Compare Quotes
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRfqs.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No RFQs found</p>
                    <p className="text-sm mt-1">
                      RFQs will appear here after generating them from approved material requests.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
