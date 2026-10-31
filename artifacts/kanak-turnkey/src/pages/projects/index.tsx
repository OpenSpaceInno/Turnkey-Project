import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProjects, useDeleteProject, usePermissions } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  Building2,
  IndianRupee,
  Sparkles,
  Trash2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { NewProjectDialog } from "@/components/dialogs/create-dialogs";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLE: Record<
  string,
  { badge: "default" | "secondary" | "outline" | "destructive"; bar: string }
> = {
  planning: { badge: "outline", bar: "bg-amber-400" },
  procurement: { badge: "secondary", bar: "bg-blue-500" },
  execution: { badge: "secondary", bar: "bg-indigo-500" },
  qc: { badge: "secondary", bar: "bg-purple-500" },
  handover: { badge: "default", bar: "bg-emerald-500" },
  archived: { badge: "outline", bar: "bg-muted-foreground" },
  in_progress: { badge: "secondary", bar: "bg-primary" },
  on_hold: { badge: "destructive", bar: "bg-destructive" },
  completed: { badge: "default", bar: "bg-emerald-600" },
};

export default function Projects() {
  const [, navigate] = useLocation();
  const { data: projects, isLoading } = useListProjects();
  const { canViewFinancials, activeRole, isAdmin } = usePermissions();
  const isSiteEngineer = activeRole === "engineer" || activeRole === "site_engineer";
  const canAccessBudget = isAdmin || (canViewFinancials && !isSiteEngineer);
  const [search, setSearch] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);

  const qc = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteProject();

  // Ensure projects is an array before filtering
  const projectsArray = Array.isArray(projects) ? projects : [];

  const filtered = projectsArray.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.clientName &&
        p.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: projectToDelete.id });
      await qc.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project removed",
        description: `Project "${projectToDelete.name}" was removed successfully.`,
      });
      setProjectToDelete(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to remove project",
        description: err?.message || "An error occurred while deleting the project.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage active construction and EPC projects.
          </p>
        </div>
        <NewProjectDialog
          trigger={
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          }
          onCreated={(id) => navigate(`/projects/${id}`)}
        />
      </div>

      {/* Turnkey Showcase Callout */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-semibold px-2 py-0.5 text-xs">
                Turnkey End-to-End Showcase
              </Badge>
              <span className="text-xs font-semibold text-primary">
                Live Connected Actual Data
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Sapphire Grand Hotel & Convention Center
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Complete turnkey lifecycle with actual connected data: Tasks & WBS
              → BOQ & Budget (₹8.5 Cr) → Procurement (MR, RFQ, Quotes, PO, GRN,
              QC) → Work Contracts → Milestone JMR & Verification → RA Bill
              Certification → Client Invoicing → Payment Settlement & Accounting
              Reconciliation.
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2 shadow-sm font-semibold">
            <Link
              href={`/projects/${
                projectsArray.find((p) => p.name?.includes("Sapphire Grand"))
                  ?.id || 14
              }/journey`}
            >
              <Sparkles className="h-4 w-4" />
              Explore Full Journey Map
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 rounded-xl border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => {
          const style =
            STATUS_STYLE[project.status] ?? STATUS_STYLE.in_progress!;
          return (
            <div
              key={project.id}
              className="group relative flex flex-col gap-0 rounded-xl border bg-card shadow-sm hover:border-primary/60 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Colour accent bar */}
              <div className={`h-1 w-full ${style.bar}`} />

              <div className="flex flex-col gap-3 p-5 flex-1">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/projects/${project.id}`}>
                      <h2 className="font-semibold text-base leading-snug hover:text-primary transition-colors line-clamp-2 cursor-pointer">
                        {project.name}
                      </h2>
                    </Link>
                    {project.clientName && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {project.clientName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant={style.badge}
                      className="capitalize text-xs"
                    >
                      {project.status.replace(/_/g, " ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove project"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToDelete(project);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Meta */}
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-col gap-1 text-xs text-muted-foreground cursor-pointer"
                >
                  {project.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Due {format(new Date(project.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  {project.type && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{project.type}</span>
                    </div>
                  )}
                </Link>

                {/* Progress */}
                <Link
                  href={`/projects/${project.id}`}
                  className="space-y-1 block cursor-pointer mt-auto"
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Progress
                    </span>
                    <span className="font-semibold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </Link>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t mt-1">
                  {canAccessBudget ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {project.budget
                          ? new Intl.NumberFormat("en-IN", {
                              maximumFractionDigits: 0,
                            }).format(project.budget)
                          : "Budget TBD"}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground font-medium">
                      <span>{project.type || "Turnkey Project"}</span>
                    </div>
                  )}
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    Open project <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && !isLoading && (
          <div className="col-span-full rounded-xl border border-dashed p-14 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No projects found</p>
            <p className="text-sm mt-1">
              Create your first project or adjust your search.
            </p>
          </div>
        )}
      </div>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <b>{projectToDelete?.name}</b>?
              This will permanently delete the project and all its associated
              milestones, budget packages, tasks, and contracts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Removing...
                </>
              ) : (
                "Remove Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
