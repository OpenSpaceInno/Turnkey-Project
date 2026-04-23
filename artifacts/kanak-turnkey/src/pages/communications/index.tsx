import { useListCommunications } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail, MessageSquare, Phone } from "lucide-react";
import { format } from "date-fns";

export default function Communications() {
  const { data: communications, isLoading } = useListCommunications();

  if (isLoading) {
    return <div className="p-6">Loading communications...</div>;
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
          <p className="text-muted-foreground">Central log of all project and lead communications.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Log Communication
        </Button>
      </div>

      <div className="space-y-4">
        {communications?.map(comm => (
          <Card key={comm.id}>
            <CardContent className="p-4 flex gap-4">
              <div className="mt-1 flex items-center justify-center h-8 w-8 rounded-full bg-muted shrink-0 text-muted-foreground">
                {getIcon(comm.communicationType)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-sm">{comm.subject}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(comm.communicationDate), "MMM d, yyyy h:mm a")}</span>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {comm.projectName || comm.leadName || 'General'}
                </div>
                <p className="text-sm mt-2 line-clamp-2">{comm.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {!communications?.length && (
          <div className="text-center p-8 border rounded-md border-dashed text-muted-foreground">
            No communications logged.
          </div>
        )}
      </div>
    </div>
  );
}
