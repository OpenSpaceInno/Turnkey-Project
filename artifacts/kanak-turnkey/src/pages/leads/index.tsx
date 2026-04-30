import { useState } from "react";
import { Link } from "wouter";
import { useListLeads, useGetLeadsSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { NewLeadDialog } from "@/components/dialogs/create-dialogs";

export default function Leads() {
  const { data: leads, isLoading: isLoadingLeads } = useListLeads();
  const { data: summary, isLoading: isLoadingSummary } = useGetLeadsSummary();
  const [search, setSearch] = useState("");

  const filteredLeads = leads?.filter(lead => 
    lead.customerName.toLowerCase().includes(search.toLowerCase()) || 
    lead.leadNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoadingLeads || isLoadingSummary) {
    return <div className="p-6">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage your sales pipeline and site visits.</p>
        </div>
        <NewLeadDialog
          trigger={
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> New Lead
            </Button>
          }
        />
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalLeads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(summary.pipelineValue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.conversionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Qualified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{summary.qualifiedLeads}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search leads..." 
            className="pl-8" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Lead No.</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLeads?.map(lead => (
                <tr key={lead.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-mono text-primary hover:underline">
                      {lead.leadNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{lead.customerName}</div>
                    {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={lead.status === 'won' ? 'default' : lead.status === 'lost' ? 'destructive' : 'secondary'}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize">{lead.stage.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.budgetEstimate ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(lead.budgetEstimate) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {lead.wonProjectId ? (
                      <Link href={`/projects/${lead.wonProjectId}`} className="text-primary text-xs font-medium hover:underline">
                        Open project →
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {format(new Date(lead.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
              {filteredLeads?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No leads found matching your criteria.
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
