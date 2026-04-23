import { useState } from "react";
import { useListTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks();
  const [search, setSearch] = useState("");

  const filteredTasks = tasks?.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const statuses = ['todo', 'in_progress', 'in_review', 'completed'];

  if (isLoading) {
    return <div className="p-6">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Cross-project task management.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-8" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {statuses.map(status => {
          const statusTasks = filteredTasks?.filter(t => t.status === status) || [];
          return (
            <div key={status} className="flex flex-col gap-3 bg-muted/30 p-3 rounded-lg border">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold capitalize">{status.replace('_', ' ')}</h3>
                <Badge variant="secondary">{statusTasks.length}</Badge>
              </div>
              <div className="flex flex-col gap-3">
                {statusTasks.map(task => (
                  <Card key={task.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                    <CardHeader className="p-3 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-sm leading-tight font-medium">{task.title}</CardTitle>
                        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0 h-4">
                          {task.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-xs space-y-2">
                      {task.description && <p className="text-muted-foreground line-clamp-2">{task.description}</p>}
                      <div className="flex items-center justify-between text-muted-foreground pt-2">
                        <span className="truncate max-w-[100px]" title={task.assignedToName || 'Unassigned'}>
                          {task.assignedToName || 'Unassigned'}
                        </span>
                        {task.endDate && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.endDate), "MMM d")}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {statusTasks.length === 0 && (
                  <div className="text-center p-4 border border-dashed rounded-md text-xs text-muted-foreground bg-card/50">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
