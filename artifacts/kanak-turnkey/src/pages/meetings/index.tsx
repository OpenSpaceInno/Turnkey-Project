import { useListMeetings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus } from "lucide-react";
import { format } from "date-fns";
import { NewMeetingDialog } from "@/components/dialogs/communication-dialogs";

export default function Meetings() {
  const { data: meetings, isLoading } = useListMeetings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage project meetings.</p>
        </div>
        <NewMeetingDialog
          trigger={
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Schedule Meeting
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings?.map((meeting) => {
          const start = new Date(meeting.meetingDate);
          const end = new Date(start.getTime() + (meeting.duration ?? 60) * 60_000);
          return (
            <Card key={meeting.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{meeting.title}</CardTitle>
                <div className="text-sm font-medium text-muted-foreground">
                  {meeting.projectName}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{format(start, "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(start, "h:mm a")} – {format(end, "h:mm a")}
                  </span>
                </div>
                {meeting.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{meeting.location}</span>
                  </div>
                )}
                {meeting.participants && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{meeting.participants}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!meetings?.length && !isLoading && (
          <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-muted-foreground">
            No meetings scheduled yet.
          </div>
        )}
      </div>
    </div>
  );
}
