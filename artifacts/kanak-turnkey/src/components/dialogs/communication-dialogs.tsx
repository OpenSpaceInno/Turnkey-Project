import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCommunication,
  useCreateMeeting,
  useCreateDocument,
  useListProjects,
  getListCommunicationsQueryKey,
  getListMeetingsQueryKey,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

const nowLocal = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function NewCommunicationDialog({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateCommunication();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: "none",
    communicationType: "email",
    subject: "",
    content: "",
    communicationDate: nowLocal(),
    participants: "",
  });

  const submit = async () => {
    if (!form.subject.trim() || !form.communicationDate) return;
    await create.mutateAsync({
      data: {
        projectId:
          form.projectId && form.projectId !== "none"
            ? Number(form.projectId)
            : null,
        communicationType: form.communicationType as
          | "email"
          | "phone"
          | "meeting"
          | "other",
        subject: form.subject,
        content: form.content || null,
        communicationDate: new Date(form.communicationDate).toISOString(),
        participants: form.participants || null,
      },
    });
    await qc.invalidateQueries({
      queryKey: getListCommunicationsQueryKey(),
    });
    setOpen(false);
    setForm({
      projectId: "none",
      communicationType: "email",
      subject: "",
      content: "",
      communicationDate: nowLocal(),
      participants: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Communication</DialogTitle>
          <DialogDescription>
            Record an email, phone call, or interaction with a stakeholder.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <Field label="Project">
            <Select
              value={form.projectId}
              onValueChange={(v) => setForm({ ...form, projectId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General</SelectItem>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Type *">
            <Select
              value={form.communicationType}
              onValueChange={(v) =>
                setForm({ ...form, communicationType: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Subject *">
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm({ ...form, subject: e.target.value })
                }
                placeholder="Site walkthrough — Floor 4 fit-out"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="When *">
              <Input
                type="datetime-local"
                value={form.communicationDate}
                onChange={(e) =>
                  setForm({ ...form, communicationDate: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Participants">
              <Input
                value={form.participants}
                onChange={(e) =>
                  setForm({ ...form, participants: e.target.value })
                }
                placeholder="Comma-separated names"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes / content">
              <Textarea
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                rows={4}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              !form.subject.trim() ||
              !form.communicationDate ||
              create.isPending
            }
          >
            {create.isPending ? "Saving..." : "Log communication"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewMeetingDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateMeeting();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    meetingDate: nowLocal(),
    duration: "60",
    location: "",
    agenda: "",
    participants: "",
  });

  const submit = async () => {
    if (!form.projectId || !form.title.trim() || !form.meetingDate) return;
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        title: form.title,
        meetingDate: new Date(form.meetingDate).toISOString(),
        duration: form.duration ? Number(form.duration) : null,
        location: form.location || null,
        agenda: form.agenda || null,
        participants: form.participants || null,
      },
    });
    await qc.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
    setOpen(false);
    setForm({
      projectId: "",
      title: "",
      meetingDate: nowLocal(),
      duration: "60",
      location: "",
      agenda: "",
      participants: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Set up a meeting with the project team or stakeholders.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
            <Field label="Title *">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Weekly project review"
              />
            </Field>
          </div>
          <Field label="Project *">
            <Select
              value={form.projectId}
              onValueChange={(v) => setForm({ ...form, projectId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="60"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="When *">
              <Input
                type="datetime-local"
                value={form.meetingDate}
                onChange={(e) =>
                  setForm({ ...form, meetingDate: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="Site office / Google Meet link"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Participants">
              <Input
                value={form.participants}
                onChange={(e) =>
                  setForm({ ...form, participants: e.target.value })
                }
                placeholder="Comma-separated names"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Agenda">
              <Textarea
                value={form.agenda}
                onChange={(e) =>
                  setForm({ ...form, agenda: e.target.value })
                }
                rows={3}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              !form.projectId ||
              !form.title.trim() ||
              !form.meetingDate ||
              create.isPending
            }
          >
            {create.isPending ? "Scheduling..." : "Schedule meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewDocumentDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateDocument();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: "",
    fileName: "",
    fileType: "",
    fileUrl: "",
    category: "general",
    status: "active",
  });

  const submit = async () => {
    if (!form.projectId || !form.fileName.trim()) return;
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        fileName: form.fileName,
        fileType: form.fileType || null,
        fileUrl: form.fileUrl || null,
        category: form.category as
          | "general"
          | "contract"
          | "drawing"
          | "report"
          | "other",
        status: form.status as "draft" | "active" | "archived",
      },
    });
    await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    setOpen(false);
    setForm({
      projectId: "",
      fileName: "",
      fileType: "",
      fileUrl: "",
      category: "general",
      status: "active",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Register a document and link it to a project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
            <Field label="File name *">
              <Input
                value={form.fileName}
                onChange={(e) =>
                  setForm({ ...form, fileName: e.target.value })
                }
                placeholder="Floor 4 — Electrical layout v3.pdf"
              />
            </Field>
          </div>
          <Field label="Project *">
            <Select
              value={form.projectId}
              onValueChange={(v) => setForm({ ...form, projectId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Category">
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="drawing">Drawing</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="File type">
            <Input
              value={form.fileType}
              onChange={(e) => setForm({ ...form, fileType: e.target.value })}
              placeholder="pdf / dwg / xlsx"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="File URL">
              <Input
                value={form.fileUrl}
                onChange={(e) =>
                  setForm({ ...form, fileUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              !form.projectId || !form.fileName.trim() || create.isPending
            }
          >
            {create.isPending ? "Uploading..." : "Upload document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
