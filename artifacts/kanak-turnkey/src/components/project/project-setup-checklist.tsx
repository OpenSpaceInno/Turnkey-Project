import React from "react";
import { useGetProjectSetupChecklist, type SetupChecklistItem } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, ShieldCheck, ChevronRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface ProjectSetupChecklistProps {
  projectId: number;
  onNavigateTab?: (tab: string) => void;
}

export function ProjectSetupChecklist({ projectId, onNavigateTab }: ProjectSetupChecklistProps) {
  const [, setLocation] = useLocation();
  const { data: checklist, isLoading } = useGetProjectSetupChecklist(projectId);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-4 w-60 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-muted/60 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!checklist) return null;

  const handleItemClick = (item: SetupChecklistItem) => {
    if (!item.actionUrl) return;

    if (item.actionUrl.includes("tab=") && onNavigateTab) {
      const match = item.actionUrl.match(/tab=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        onNavigateTab(match[1]);
        return;
      }
    }

    setLocation(item.actionUrl);
  };

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Project Setup & Mobilization Checklist
              </CardTitle>
              {checklist.isComplete ? (
                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Ready for Mobilization
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                  {checklist.completedCount} of {checklist.totalCount} Complete ({checklist.percentage}%)
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-1">
              Essential prerequisites required to legally, technically, and commercially baseline the project.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 min-w-[140px]">
            <Progress value={checklist.percentage} className="h-2.5 flex-1" />
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              {checklist.percentage}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y">
        {checklist.items.map((item) => (
          <div
            key={item.key}
            className={`p-3.5 px-4 flex items-center justify-between gap-4 transition-colors ${
              item.completed
                ? "bg-background hover:bg-muted/30"
                : "bg-amber-500/[0.02] hover:bg-amber-500/[0.06]"
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/60 shrink-0" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold truncate ${
                      item.completed ? "text-foreground" : "text-foreground/90 font-bold"
                    }`}
                  >
                    {item.title}
                  </span>
                  {!item.completed && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                variant={item.completed ? "ghost" : "outline"}
                size="sm"
                className={`text-xs h-7 px-2.5 gap-1.5 ${
                  !item.completed ? "border-primary/40 text-primary font-medium hover:bg-primary/10" : "text-muted-foreground"
                }`}
                onClick={() => handleItemClick(item)}
              >
                <span>{item.actionLabel}</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
