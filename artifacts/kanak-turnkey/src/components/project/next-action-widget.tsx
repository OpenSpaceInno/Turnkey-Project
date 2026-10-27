import React from "react";
import { useGetProjectNextAction, type NextActionResponse } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, Sparkles, CheckCircle2, Clock, Zap } from "lucide-react";
import { useLocation } from "wouter";

interface NextActionWidgetProps {
  projectId: number;
  onNavigateTab?: (tab: string) => void;
}

export function NextActionWidget({ projectId, onNavigateTab }: NextActionWidgetProps) {
  const [, setLocation] = useLocation();
  const { data: nextAction, isLoading, refetch } = useGetProjectNextAction(projectId);

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background animate-pulse">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-5 w-64 bg-muted rounded" />
          </div>
          <div className="h-9 w-28 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!nextAction) return null;

  const handleAction = () => {
    if (!nextAction.actionUrl) return;

    // Check if URL is an internal tab link for this project (e.g., /projects/1?tab=commercial)
    if (nextAction.actionUrl.includes(`tab=`) && onNavigateTab) {
      const match = nextAction.actionUrl.match(/tab=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        onNavigateTab(match[1]);
        return;
      }
    }

    setLocation(nextAction.actionUrl);
  };

  const priorityColor =
    nextAction.priority === "high"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
      : nextAction.priority === "medium"
      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 shadow-md bg-gradient-to-r from-primary/[0.04] via-background to-primary/[0.02]">
      {/* Decorative gradient flare */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${nextAction.hasAction ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
            {nextAction.hasAction ? (
              <Zap className="h-6 w-6 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-6 w-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Recommended Next Action
              </span>
              <Badge variant="outline" className={`text-[10px] capitalize font-semibold ${priorityColor}`}>
                {nextAction.stage} • {nextAction.priority} priority
              </Badge>
            </div>

            <h3 className="text-base font-bold tracking-tight text-foreground">
              {nextAction.title}
            </h3>

            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              {nextAction.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <Button
            size="sm"
            onClick={handleAction}
            className="gap-2 shadow font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:translate-x-0.5"
          >
            <span>{nextAction.actionText || "Proceed"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
