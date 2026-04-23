import { useParams, Link } from "wouter";
import { 
  useGetProject, getGetProjectQueryKey,
  useListTasks,
  useListBudgetItems,
  useListRaBills,
  useListStakeholders,
  useListDocuments
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Edit, Plus, FileText, CheckCircle2, Circle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  
  const { data: project, isLoading } = useGetProject(projectId, { 
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) } 
  });

  const { data: tasks } = useListTasks({ query: { enabled: !!projectId }}); // In real app, filter by projectId
  const { data: budgetItems } = useListBudgetItems({ query: { enabled: !!projectId }});
  const { data: raBills } = useListRaBills({ query: { enabled: !!projectId }});
  const { data: stakeholders } = useListStakeholders({ query: { enabled: !!projectId }});
  const { data: documents } = useListDocuments({ query: { enabled: !!projectId }});

  if (isLoading) {
    return <div className="p-6">Loading project details...</div>;
  }

  if (!project) {
    return <div className="p-6 text-destructive">Project not found</div>;
  }

  const projectTasks = tasks?.filter(t => t.projectId === projectId) || [];
  const projectBudget = budgetItems?.filter(b => b.projectId === projectId) || [];
  const projectRaBills = raBills?.filter(r => r.projectId === projectId) || [];
  const projectStakeholders = stakeholders?.filter(s => s.projectId === projectId) || [];
  const projectDocs = documents?.filter(d => d.projectId === projectId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.status === 'completed' ? 'default' : project.status === 'on_hold' ? 'destructive' : 'secondary'}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.clientName} • {project.location}</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" /> Edit Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-primary">{project.progress}%</div>
            <Progress value={project.progress} className="h-2" />
            <div className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{project.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team Size</span>
                <span className="font-medium">{project.teamSize || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">
                  {project.budget ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(project.budget) : 'TBD'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent flex-wrap">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Overview</TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Tasks ({projectTasks.length})</TabsTrigger>
              <TabsTrigger value="budget" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Budget ({projectBudget.length})</TabsTrigger>
              <TabsTrigger value="rabills" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">RA Bills ({projectRaBills.length})</TabsTrigger>
              <TabsTrigger value="stakeholders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Stakeholders ({projectStakeholders.length})</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Documents ({projectDocs.length})</TabsTrigger>
            </TabsList>
            
            <div className="py-6">
              <TabsContent value="overview" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{project.description || 'No description provided.'}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tasks" className="m-0 space-y-4">
                 <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {['todo', 'in_progress', 'completed'].map(status => {
                    const statusTasks = projectTasks.filter(t => t.status === status);
                    return (
                      <div key={status} className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-sm capitalize flex items-center justify-between">
                          {status.replace('_', ' ')}
                          <Badge variant="secondary">{statusTasks.length}</Badge>
                        </h3>
                        {statusTasks.map(task => (
                          <Card key={task.id} className="p-3 shadow-sm hover:border-primary/50 cursor-pointer transition-colors">
                            <div className="font-medium text-sm mb-1">{task.title}</div>
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                              <span>{task.assignedToName || 'Unassigned'}</span>
                              <Badge variant="outline" className="text-[10px] h-4">{task.priority}</Badge>
                            </div>
                          </Card>
                        ))}
                        {statusTasks.length === 0 && (
                          <div className="text-xs text-center text-muted-foreground py-4 border border-dashed rounded bg-background/50">Empty</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="budget" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Budget Item</Button>
                </div>
                <div className="rounded-md border bg-card">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Cost Code</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium text-right">Budgeted</th>
                        <th className="px-4 py-3 font-medium text-right">Committed</th>
                        <th className="px-4 py-3 font-medium text-right">Actual</th>
                        <th className="px-4 py-3 font-medium text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {projectBudget.map(item => {
                        const variance = item.budgeted - item.actual;
                        return (
                          <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                            <td className="px-4 py-3 font-mono">{item.costCode}</td>
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.budgeted)}</td>
                            <td className="px-4 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.committed)}</td>
                            <td className="px-4 py-3 text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.actual)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${variance < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(variance)}
                            </td>
                          </tr>
                        )
                      })}
                      {projectBudget.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No budget items found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="rabills" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Create RA Bill</Button>
                </div>
                <div className="grid gap-4">
                  {projectRaBills.map(bill => (
                    <Card key={bill.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{bill.billNumber}</span>
                            <Badge variant={bill.status === 'approved' || bill.status === 'invoiced' ? 'default' : 'secondary'}>{bill.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{bill.description || bill.milestone}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl text-primary">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(bill.amount)}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(bill.createdAt), "MMM d, yyyy")}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {projectRaBills.length === 0 && (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No RA Bills found.</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="stakeholders" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Stakeholder</Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {projectStakeholders.map(sh => (
                    <Card key={sh.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold">{sh.name}</div>
                            <div className="text-sm text-muted-foreground">{sh.role} {sh.organization && `• ${sh.organization}`}</div>
                          </div>
                          <Badge variant="outline">{sh.accessLevel}</Badge>
                        </div>
                        <div className="text-sm space-y-1 mt-3">
                          {sh.email && <div><a href={`mailto:${sh.email}`} className="text-primary hover:underline">{sh.email}</a></div>}
                          {sh.phone && <div><a href={`tel:${sh.phone}`} className="hover:underline">{sh.phone}</a></div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {projectStakeholders.length === 0 && (
                    <div className="col-span-2 text-center py-12 border rounded-lg border-dashed text-muted-foreground">No stakeholders added.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Upload Document</Button>
                </div>
                <div className="rounded-md border bg-card">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Uploaded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {projectDocs.map(doc => (
                        <tr key={doc.id} className="hover:bg-accent/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-medium text-primary hover:underline cursor-pointer">{doc.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge variant="outline">{doc.category}</Badge></td>
                          <td className="px-4 py-3"><Badge variant="secondary">{doc.status}</Badge></td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{format(new Date(doc.createdAt), "MMM d, yyyy")}</td>
                        </tr>
                      ))}
                      {projectDocs.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No documents found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
