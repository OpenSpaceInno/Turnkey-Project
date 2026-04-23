import { useParams, Link } from "wouter";
import { useGetLead, getGetLeadQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ChevronLeft, Edit, Mail, Phone, MapPin, Calendar } from "lucide-react";

export default function LeadDetail() {
  const { id } = useParams();
  const leadId = parseInt(id || "0", 10);
  
  const { data: lead, isLoading } = useGetLead(leadId, { 
    query: { enabled: !!leadId, queryKey: getGetLeadQueryKey(leadId) } 
  });

  if (isLoading) {
    return <div className="p-6">Loading lead details...</div>;
  }

  if (!lead) {
    return <div className="p-6 text-destructive">Lead not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leads"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{lead.customerName}</h1>
            <Badge variant="outline" className="font-mono">{lead.leadNumber}</Badge>
            <Badge variant={lead.status === 'won' ? 'default' : lead.status === 'lost' ? 'destructive' : 'secondary'}>
              {lead.status}
            </Badge>
          </div>
          <p className="text-muted-foreground capitalize">Stage: {lead.stage.replace('_', ' ')} • Priority: {lead.priority}</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.company && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Company</div>
                  <div>{lead.company}</div>
                </div>
              )}
              {lead.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.contactEmail}`} className="text-sm hover:underline">{lead.contactEmail}</a>
                </div>
              )}
              {lead.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.contactPhone}`} className="text-sm hover:underline">{lead.contactPhone}</a>
                </div>
              )}
              {lead.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{lead.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{lead.projectType || 'Unspecified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget Estimate</span>
                <span className="font-medium text-primary">
                  {lead.budgetEstimate ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(lead.budgetEstimate) : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created On</span>
                <span>{format(new Date(lead.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Closure</span>
                <span>{lead.expectedClosureDate ? format(new Date(lead.expectedClosureDate), "MMM d, yyyy") : '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="activities">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger value="activities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Activities</TabsTrigger>
              <TabsTrigger value="site_visits" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Site Visits</TabsTrigger>
              <TabsTrigger value="drawings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Drawings</TabsTrigger>
              <TabsTrigger value="boqs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">BOQs</TabsTrigger>
              <TabsTrigger value="negotiations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Negotiations</TabsTrigger>
            </TabsList>
            
            <div className="py-6">
              <TabsContent value="activities" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm">Add Activity</Button>
                </div>
                {lead.activities?.length ? (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {lead.activities.map((activity) => (
                      <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-card shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-foreground">{activity.title}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(activity.createdAt), "MMM d, h:mm a")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">
                    No activities recorded yet.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="site_visits" className="m-0">
                <div className="flex justify-end mb-4">
                  <Button size="sm">Schedule Visit</Button>
                </div>
                <div className="grid gap-4">
                  {lead.siteVisits?.map(visit => (
                    <Card key={visit.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{format(new Date(visit.visitDate), "MMM d, yyyy")} {visit.visitTime}</p>
                          <p className="text-sm text-muted-foreground">{visit.siteAddress}</p>
                        </div>
                        <Badge variant="outline">{visit.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {!lead.siteVisits?.length && (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No site visits scheduled.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="drawings" className="m-0">
                <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">Drawings tab placeholder</div>
              </TabsContent>
              
              <TabsContent value="boqs" className="m-0">
                <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">BOQs tab placeholder</div>
              </TabsContent>
              
              <TabsContent value="negotiations" className="m-0">
                <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">Negotiations tab placeholder</div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
