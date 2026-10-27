import { useState } from "react";
import { useListMeetings, useUpdateMeeting, getListMeetingsQueryKey } from "@workspace/api-client-react";
import type { Meeting } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, FileText, CheckCircle2, Edit3 } from "lucide-react";
import { format } from "date-fns";
import { NewMeetingDialog } from "@/components/dialogs/communication-dialogs";
import { useToast } from "@/hooks/use-toast";

function MOMDialog({ meeting, open, onOpenChange }: { meeting: Meeting; open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateMeeting = useUpdateMeeting();

  const [agenda, setAgenda] = useState(meeting.agenda ?? "");
  const [minutes, setMinutes] = useState(meeting.minutes ?? "");
  const [participants, setParticipants] = useState(meeting.participants ?? "");

  const dirty = agenda !== (meeting.agenda ?? "") || minutes !== (meeting.minutes ?? "") || participants !== (meeting.participants ?? "");

  const handleSave = () => {
    updateMeeting.mutate(
      {
        id: meeting.id,
        data: {
          projectId: meeting.projectId,
          title: meeting.title,
          meetingDate: meeting.meetingDate,
          duration: meeting.duration,
          location: meeting.location ?? undefined,
          agenda: agenda || null,
          minutes: minutes || null,
          participants: participants || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
          toast({ title: "Meeting saved", description: "MOM and agenda updated." });
          onOpenChange(false);
        },
        onError: () => toast({ title: "Save failed", variant: "destructive" }),
      }
    );
  };

  const start = new Date(meeting.meetingDate);
  const end = new Date(start.getTime() + (meeting.duration ?? 60) * 60_000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{meeting.title}</DialogTitle>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {format(start, "EEEE, MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {format(start, "h:mm a")} – {format(end, "h:mm a")}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {meeting.location}
              </span>
            )}
          </div>
          {meeting.projectName && (
            <div className="text-sm font-medium text-primary pt-0.5">{meeting.projectName}</div>
          )}
        </DialogHeader>

        <Separator />

        <Tabs defaultValue={meeting.minutes ? "minutes" : "agenda"} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="agenda" className="flex-1">Agenda</TabsTrigger>
            <TabsTrigger value="minutes" className="flex-1">
              Minutes of Meeting
              {meeting.minutes && <CheckCircle2 className="h-3.5 w-3.5 ml-1.5 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex-1">Participants</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="agenda" className="mt-0 space-y-2">
              <Label className="text-sm font-medium">Meeting Agenda</Label>
              <Textarea
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder={"1. Project status update\n2. Budget review\n3. Risk discussion\n4. Action items\n5. Next steps"}
                className="min-h-[220px] font-mono text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">Outline topics to be discussed. Each line can be a separate agenda item.</p>
            </TabsContent>

            <TabsContent value="minutes" className="mt-0 space-y-2">
              <Label className="text-sm font-medium">Minutes of Meeting (MOM)</Label>
              <Textarea
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder={"Date: \nAttendees: \n\nKey Discussions:\n—\n\nDecisions Made:\n—\n\nAction Items:\n• [Name] — [Task] — Due: [Date]\n\nNext Meeting: "}
                className="min-h-[220px] font-mono text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">Record decisions, action items, and follow-ups from the meeting.</p>
            </TabsContent>

            <TabsContent value="participants" className="mt-0 space-y-2">
              <Label className="text-sm font-medium">Participants</Label>
              <Textarea
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder={"Rahul Sharma (Project Manager)\nPreeti Singh (Site Engineer)\nAmit Desai (Client Representative)"}
                className="min-h-[220px] text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">List all attendees with their roles, one per line.</p>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSave} disabled={!dirty || updateMeeting.isPending}>
            {updateMeeting.isPending ? "Saving…" : "Save MOM"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Meetings() {
  const { data: meetings, isLoading } = useListMeetings();
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Schedule meetings and capture minutes.</p>
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
        {(Array.isArray(meetings) ? meetings : []).map((meeting) => {
          const start = new Date(meeting.meetingDate);
          const end = new Date(start.getTime() + (meeting.duration ?? 60) * 60_000);
          const hasMOM = !!meeting.minutes;
          const hasAgenda = !!meeting.agenda;
          return (
            <Card
              key={meeting.id}
              className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
              onClick={() => setSelectedMeeting(meeting)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{meeting.title}</CardTitle>
                  {hasMOM ? (
                    <Badge variant="secondary" className="shrink-0 gap-1 text-green-700 bg-green-50 border-green-200">
                      <CheckCircle2 className="h-3 w-3" /> MOM
                    </Badge>
                  ) : hasAgenda ? (
                    <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                      <FileText className="h-3 w-3" /> Agenda
                    </Badge>
                  ) : null}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {meeting.projectName}
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span>{format(start, "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{format(start, "h:mm a")} – {format(end, "h:mm a")}</span>
                </div>
                {meeting.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">{meeting.location}</span>
                  </div>
                )}
                {meeting.participants && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{meeting.participants}</span>
                  </div>
                )}
                <div className="pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="w-full gap-1.5 h-7 text-xs">
                    <Edit3 className="h-3 w-3" />
                    {hasMOM ? "View / Edit MOM" : "Capture MOM"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!(Array.isArray(meetings) ? meetings : []).length && !isLoading && (
          <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-muted-foreground">
            No meetings scheduled yet.
          </div>
        )}
      </div>

      {selectedMeeting && (
        <MOMDialog
          meeting={selectedMeeting}
          open={!!selectedMeeting}
          onOpenChange={(v) => { if (!v) setSelectedMeeting(null); }}
        />
      )}
    </div>
  );
}
