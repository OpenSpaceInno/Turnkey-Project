import { useState } from "react";
import { Link } from "wouter";
import { useListProjects } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Filter, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const [search, setSearch] = useState("");

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.clientName && p.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  if (isLoading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage active construction and EPC projects.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search projects..." 
            className="pl-8" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects?.map(project => (
          <Card key={project.id} className="flex flex-col hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-4">
                <CardTitle className="text-lg leading-tight">
                  <Link href={`/projects/${project.id}`} className="hover:underline">
                    {project.name}
                  </Link>
                </CardTitle>
                <Badge variant={project.status === 'completed' ? 'default' : project.status === 'on_hold' ? 'destructive' : 'secondary'}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              {project.clientName && <p className="text-sm text-muted-foreground font-medium">{project.clientName}</p>}
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                {project.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{project.location}</span>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due {format(new Date(project.endDate), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            </CardContent>
            <CardFooter className="pt-3 border-t bg-muted/20">
              <div className="w-full flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">
                  {project.budget ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(project.budget) : 'TBD'}
                </span>
              </div>
            </CardFooter>
          </Card>
        ))}
        {filteredProjects?.length === 0 && (
          <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-muted-foreground">
            No projects found.
          </div>
        )}
      </div>
    </div>
  );
}
