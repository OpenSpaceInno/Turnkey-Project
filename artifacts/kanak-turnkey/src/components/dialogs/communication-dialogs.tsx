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
                {(Array.isArray(projects) ? projects : []).map((p) => (
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
                {(Array.isArray(projects) ? projects : []).map((p) => (
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  // Load last used values from localStorage
  const lastCategory = typeof window !== 'undefined' 
    ? localStorage.getItem('turnkey_last_upload_category') || 'general'
    : 'general';
  const lastStatus = typeof window !== 'undefined'
    ? localStorage.getItem('turnkey_last_upload_status') || 'active'
    : 'active';

  const [form, setForm] = useState({
    projectId: "",
    fileName: "",
    fileType: "",
    fileUrl: "",
    category: lastCategory,
    status: lastStatus,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      // Auto-populate fileName from first file if empty
      if (!form.fileName && files[0]) {
        setForm({
          ...form,
          fileName: files[0].name,
          fileType: files[0].name.split('.').pop() || "",
        });
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!form.projectId || !form.fileName.trim()) return;
    
    let fileUrl = form.fileUrl; // Start with manual URL if provided
    
    // If files were selected, upload them first and use the first file's URL
    if (selectedFiles.length > 0) {
      const fileUrls: string[] = [];
      try {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            fileUrls.push(uploadData.fileUrl);
          }
        }
        // Use first uploaded file URL
        if (fileUrls.length > 0) {
          fileUrl = fileUrls[0];
        }
      } catch (error) {
        console.error('File upload error:', error);
      }
    }
    
    // Save last used category and status to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('turnkey_last_upload_category', form.category);
      localStorage.setItem('turnkey_last_upload_status', form.status);
    }
    
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        fileName: form.fileName,
        fileType: form.fileType || null,
        fileUrl: fileUrl || null,
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
    setSelectedFiles([]);
    setUploadedUrls([]);
    setForm({
      projectId: "",
      fileName: "",
      fileType: "",
      fileUrl: "",
      category: form.category,
      status: form.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a file from your computer or provide a URL to an existing document.
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
                {(Array.isArray(projects) ? projects : []).map((p) => (
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
          
          {/* Photos Section */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Photos
              </Label>
              <label
                htmlFor="photo-upload"
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Photos
              </label>
              <input
                id="photo-upload"
                type="file"
                className="hidden"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
              />
            </div>
            
            {selectedFiles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedFiles.map((file, index) => {
                  const isImage = file.type.startsWith('image/');
                  let fileUrl = '';
                  try {
                    fileUrl = URL.createObjectURL(file);
                  } catch (e) {
                    console.error('Error creating object URL:', e);
                  }
                  
                  return (
                    <div key={`${file.name}-${index}`} className="relative group">
                      <div className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                        {isImage && fileUrl ? (
                          <img
                            src={fileUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={() => console.error('Image load error:', file.name)}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 text-center">
                            <svg className="w-8 h-8 text-muted-foreground mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-xs font-medium text-muted-foreground truncate w-full">
                              {file.name}
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <p className="text-xs text-muted-foreground text-center mt-1 truncate">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <label
                htmlFor="photo-upload-area"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> site photos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, HEIC supported
                  </p>
                </div>
                <input
                  id="photo-upload-area"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
          
          {/* File URL - External Link Option */}
          <div className="sm:col-span-2">
            <Field label="File URL (optional)">
              <Input
                value={form.fileUrl}
                onChange={(e) =>
                  setForm({ ...form, fileUrl: e.target.value })
                }
                placeholder="https://... (or leave blank to use uploaded files)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide an external URL if not uploading files above
              </p>
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
