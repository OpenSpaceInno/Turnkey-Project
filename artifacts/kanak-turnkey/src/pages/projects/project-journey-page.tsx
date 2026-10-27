import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ProjectJourneyView } from "./project-journey";

export default function ProjectJourneyPage() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id || "14", 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href={`/projects/${projectId}`}>
            <ChevronLeft className="h-4 w-4" /> Back to Project Overview
          </Link>
        </Button>
      </div>

      <ProjectJourneyView projectId={projectId} />
    </div>
  );
}
