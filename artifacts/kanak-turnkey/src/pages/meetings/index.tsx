import { useListMeetings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, Video, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Meetings() {
  const { data: meetings, isLoading } = useListMeetings();

  if (isLoading) {
    return <div className="p-6">Loading meetings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage project meetings.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Schedule Meeting
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings?.map(meeting => (
          <Card key={meeting.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{meeting.title}</CardTitle>
              <div className="text-sm font-medium text-muted-foreground">
                {meeting.projectName || meeting.leadName}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>{format(new Date(meeting.startTime), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(meeting.startTime), "h:mm a")} - {format(new Date(meeting.endTime), "h:mm a")}
                </span>
              </div>
              {meeting.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{meeting.location}</span>
                </div>
              )}
              {meeting.meetingLink && (
                <div className="flex items-center gap-2 text-primary">
                  <Video className="h-4 w-4" />
                  <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="hover:underline">Join Meeting</a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!meetings?.length && (
          <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-muted-foreground">
            No meetings scheduled.
          </div>
        )}
      </div>
    </div>
  );
}
