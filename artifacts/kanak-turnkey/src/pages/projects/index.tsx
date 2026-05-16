import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProjects } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, MapPin, Calendar, ArrowRight, Building2, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { NewProjectDialog } from "@/components/dialogs/create-dialogs";

const STATUS_STYLE: Record<string, { badge: "default" | "secondary" | "outline" | "destructive"; bar: string }> = {
  planning:    { badge: "outline",     bar: "bg-amber-400" },
  procurement: { badge: "secondary",   bar: "bg-blue-500" },
  execution:   { badge: "secondary",   bar: "bg-indigo-500" },
  qc:          { badge: "secondary",   bar: "bg-purple-500" },
  handover:    { badge: "default",     bar: "bg-emerald-500" },
  archived:    { badge: "outline",     bar: "bg-muted-foreground" },
  in_progress: { badge: "secondary",   bar: "bg-primary" },
  on_hold:     { badge: "destructive", bar: "bg-destructive" },
  completed:   { badge: "default",     bar: "bg-emerald-600" },
};

export default function Projects() {
  const [, navigate] = useLocation();
  const { data: projects, isLoading } = useListProjects();
  const [search, setSearch] = useState("");

  const filtered = projects?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.clientName && p.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage active construction and EPC projects.</p>
        </div>
        <NewProjectDialog
          trigger={
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          }
          onCreated={id => navigate(`/projects/${id}`)}
        />
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
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-52 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered?.map(project => {
          const style = STATUS_STYLE[project.status] ?? STATUS_STYLE.in_progress!;
          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="group relative flex flex-col gap-0 rounded-xl border bg-card shadow-sm hover:border-primary/60 hover:shadow-md transition-all cursor-pointer overflow-hidden">
                {/* Colour accent bar */}
                <div className={`h-1 w-full ${style.bar}`} />

                <div className="flex flex-col gap-3 p-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {project.name}
                      </h2>
                      {project.clientName && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{project.clientName}</p>
                      )}
                    </div>
                    <Badge variant={style.badge} className="shrink-0 capitalize text-xs">
                      {project.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {project.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    )}
                    {project.endDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Due {format(new Date(project.endDate), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    {project.type && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{project.type}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Progress</span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-1.5" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {project.budget
                          ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(project.budget)
                          : "Budget TBD"}
                      </span>
                    </div>
                    <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open project <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {filtered?.length === 0 && !isLoading && (
          <div className="col-span-full rounded-xl border border-dashed p-14 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No projects found</p>
            <p className="text-sm mt-1">Create your first project or adjust your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
