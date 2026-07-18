import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetLead,
  getGetLeadQueryKey,
  useConvertLead,
  useUpdateLead,
  useCreateLeadActivity,
  useCreateSiteVisit,
  useUpdateSiteVisit,
  useCreateDrawing,
  useUpdateDrawing,
  useCreateBoq,
  useUpdateBoq,
  useGetBoq,
  getGetBoqQueryKey,
  useAddBoqItem,
  useDeleteBoqItem,
  useCreateNegotiation,
  useUpdateNegotiation,
  getListLeadsQueryKey,
  getListProjectsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ChevronLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Trophy,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const INR = (v: number | null | undefined) =>
  v != null
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(v)
    : "—";

const statusColor: Record<string, string> = {
  new: "secondary",
  contacted: "secondary",
  qualified: "default",
  won: "default",
  lost: "destructive",
  pending: "secondary",
  completed: "default",
  cancelled: "destructive",
  draft: "secondary",
  approved: "default",
  rejected: "destructive",
  under_review: "secondary",
};

// ─── main component ─────────────────────────────────────────────────────────

export default function LeadDetail() {
  const { id } = useParams();
  const leadId = parseInt(id || "0", 10);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // dialog open states
  const [convertOpen, setConvertOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [boqItemOpen, setBoqItemOpen] = useState<number | null>(null); // boqId
  const [negOpen, setNegOpen] = useState(false);
  const [expandedBoqId, setExpandedBoqId] = useState<number | null>(null);

  // convert dialog fields
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  // edit lead fields
  const [editForm, setEditForm] = useState({
    customerName: "",
    company: "",
    contactEmail: "",
    contactPhone: "",
    projectType: "",
    location: "",
    budgetEstimate: "",
    status: "",
    stage: "",
    priority: "",
    expectedClosureDate: "",
    notes: "",
  });

  // activity fields
  const [activityForm, setActivityForm] = useState({ activityType: "note", title: "", description: "" });

  // site visit fields
  const [visitForm, setVisitForm] = useState({
    visitDate: new Date().toISOString().slice(0, 10),
    visitTime: "",
    siteAddress: "",
    observations: "",
  });

  // drawing fields
  const [drawingForm, setDrawingForm] = useState({ fileName: "", fileType: "", fileUrl: "" });

  // boq item fields
  const [itemForm, setItemForm] = useState({
    itemName: "",
    category: "",
    unit: "",
    quantity: "1",
    unitPrice: "0",
    taxPercent: "0",
    marginPercent: "0",
  });

  // negotiation fields
  const [negForm, setNegForm] = useState({ revisedAmount: "", discountPercent: "", notes: "" });

  // ── queries ──
  const { data: lead, isLoading } = useGetLead(leadId, {
    query: { enabled: !!leadId, queryKey: getGetLeadQueryKey(leadId) },
  });

  const { data: expandedBoq } = useGetBoq(expandedBoqId ?? 0, {
    query: { enabled: !!expandedBoqId, queryKey: getGetBoqQueryKey(expandedBoqId ?? 0) },
  });

  // ── invalidate helpers ──
  const invalidateLead = () =>
    queryClient.invalidateQueries({ queryKey: getGetLeadQueryKey(leadId) });

  // ── mutations ──
  const convertMutation = useConvertLead({
    mutation: {
      onSuccess: (project) => {
        invalidateLead();
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setConvertOpen(false);
        toast({ title: "Lead converted", description: `Project "${project.name}" created.` });
        navigate(`/projects/${project.id}`);
      },
      onError: (err: unknown) => {
        const e = err as { response?: { data?: { error?: string } } };
        toast({ title: "Could not convert lead", description: e?.response?.data?.error ?? "Unknown error", variant: "destructive" });
      },
    },
  });

  const updateLeadMutation = useUpdateLead({
    mutation: {
      onSuccess: () => { invalidateLead(); setEditOpen(false); toast({ title: "Lead updated" }); },
      onError: () => toast({ title: "Failed to update lead", variant: "destructive" }),
    },
  });

  const addActivityMutation = useCreateLeadActivity({
    mutation: {
      onSuccess: () => { invalidateLead(); setActivityOpen(false); setActivityForm({ activityType: "note", title: "", description: "" }); toast({ title: "Activity added" }); },
      onError: () => toast({ title: "Failed to add activity", variant: "destructive" }),
    },
  });

  const createVisitMutation = useCreateSiteVisit({
    mutation: {
      onSuccess: () => { invalidateLead(); setVisitOpen(false); setVisitForm({ visitDate: new Date().toISOString().slice(0, 10), visitTime: "", siteAddress: "", observations: "" }); toast({ title: "Site visit scheduled" }); },
      onError: () => toast({ title: "Failed to schedule visit", variant: "destructive" }),
    },
  });

  const updateVisitMutation = useUpdateSiteVisit({
    mutation: {
      onSuccess: () => { invalidateLead(); toast({ title: "Visit updated" }); },
      onError: () => toast({ title: "Failed to update visit", variant: "destructive" }),
    },
  });

  const createDrawingMutation = useCreateDrawing({
    mutation: {
      onSuccess: () => { invalidateLead(); setDrawingOpen(false); setDrawingForm({ fileName: "", fileType: "", fileUrl: "" }); toast({ title: "Drawing added" }); },
      onError: () => toast({ title: "Failed to add drawing", variant: "destructive" }),
    },
  });

  const updateDrawingMutation = useUpdateDrawing({
    mutation: {
      onSuccess: () => { invalidateLead(); toast({ title: "Drawing status updated" }); },
      onError: () => toast({ title: "Failed to update drawing", variant: "destructive" }),
    },
  });

  const createBoqMutation = useCreateBoq({
    mutation: {
      onSuccess: (boq) => { invalidateLead(); setExpandedBoqId(boq.id); toast({ title: `BOQ v${boq.version} created` }); },
      onError: () => toast({ title: "Failed to create BOQ", variant: "destructive" }),
    },
  });

  const updateBoqMutation = useUpdateBoq({
    mutation: {
      onSuccess: () => { invalidateLead(); toast({ title: "BOQ status updated" }); },
      onError: () => toast({ title: "Failed to update BOQ", variant: "destructive" }),
    },
  });

  const addBoqItemMutation = useAddBoqItem({
    mutation: {
      onSuccess: () => {
        if (expandedBoqId) queryClient.invalidateQueries({ queryKey: getGetBoqQueryKey(expandedBoqId) });
        invalidateLead();
        setBoqItemOpen(null);
        setItemForm({ itemName: "", category: "", unit: "", quantity: "1", unitPrice: "0", taxPercent: "0", marginPercent: "0" });
        toast({ title: "Item added" });
      },
      onError: () => toast({ title: "Failed to add item", variant: "destructive" }),
    },
  });

  const deleteBoqItemMutation = useDeleteBoqItem({
    mutation: {
      onSuccess: () => {
        if (expandedBoqId) queryClient.invalidateQueries({ queryKey: getGetBoqQueryKey(expandedBoqId) });
        invalidateLead();
        toast({ title: "Item removed" });
      },
    },
  });

  const createNegMutation = useCreateNegotiation({
    mutation: {
      onSuccess: () => { invalidateLead(); setNegOpen(false); setNegForm({ revisedAmount: "", discountPercent: "", notes: "" }); toast({ title: "Negotiation round added" }); },
      onError: () => toast({ title: "Failed to add negotiation", variant: "destructive" }),
    },
  });

  const updateNegMutation = useUpdateNegotiation({
    mutation: {
      onSuccess: () => { invalidateLead(); toast({ title: "Negotiation updated" }); },
      onError: () => toast({ title: "Failed to update negotiation", variant: "destructive" }),
    },
  });

  // ── loading / error ──
  if (isLoading) return <div className="p-6">Loading lead details…</div>;
  if (!lead) return <div className="p-6 text-destructive">Lead not found</div>;

  // ── convert prerequisites ──
  const hasApprovedBoq = lead.boqs?.some((b) => b.status === "approved") ?? false;
  const hasApprovedDrawing = lead.drawings?.some((d) => d.status === "approved") ?? false;
  const prereqsMet = hasApprovedBoq && hasApprovedDrawing;

  return (
    <div className="space-y-6">
      {/* ── header ── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leads"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{lead.customerName}</h1>
            <Badge variant="outline" className="font-mono">{lead.leadNumber}</Badge>
            <Badge variant={lead.status === "won" ? "default" : lead.status === "lost" ? "destructive" : "secondary"}>
              {lead.status}
            </Badge>
          </div>
          <p className="text-muted-foreground capitalize">
            Stage: {lead.stage.replace("_", " ")} • Priority: {lead.priority}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lead.wonProjectId ? (
            <Button asChild className="gap-2">
              <Link href={`/projects/${lead.wonProjectId}`}>
                View Project <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : lead.status !== "lost" ? (
            <Button
              className="gap-2"
              onClick={() => {
                setProjectName(`${lead.customerName}${lead.projectType ? ` — ${lead.projectType}` : ""}`);
                setConvertOpen(true);
              }}
            >
              <Trophy className="h-4 w-4" /> Mark as Won & Create Project
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setEditForm({
                customerName: lead.customerName ?? "",
                company: (lead.company as string) ?? "",
                contactEmail: (lead.contactEmail as string) ?? "",
                contactPhone: (lead.contactPhone as string) ?? "",
                projectType: (lead.projectType as string) ?? "",
                location: (lead.location as string) ?? "",
                budgetEstimate: lead.budgetEstimate != null ? String(lead.budgetEstimate) : "",
                status: lead.status ?? "",
                stage: lead.stage ?? "",
                priority: lead.priority ?? "",
                expectedClosureDate: (lead.expectedClosureDate as string) ?? "",
                notes: (lead.notes as string) ?? "",
              });
              setEditOpen(true);
            }}
          >
            <Edit className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* ── Convert dialog ── */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert lead to project</DialogTitle>
            <DialogDescription>
              We'll mark this lead as <b>won</b>, spin up a new project linked to it, copy the
              customer in as the primary stakeholder, seed the budget from the latest BOQ, and lay
              down an 11-step lifecycle of tasks from kickoff to handover.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Conversion prerequisites</p>
            <div className="flex items-center gap-2 text-sm">
              {hasApprovedBoq ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
              <span className={hasApprovedBoq ? "" : "text-destructive"}>BOQ — at least one version must be <b>Approved</b></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {hasApprovedDrawing ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
              <span className={hasApprovedDrawing ? "" : "text-destructive"}>Drawings — at least one drawing must be <b>Approved</b></span>
            </div>
            {!prereqsMet && <p className="text-xs text-muted-foreground pt-1">Go to the Drawings and BOQs tabs to approve required documents first.</p>}
          </div>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project name</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} disabled={!prereqsMet} />
            </div>
            <div className="space-y-2">
              <Label>Project start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!prereqsMet} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)} disabled={convertMutation.isPending}>Cancel</Button>
            <Button
              onClick={() => convertMutation.mutate({ id: leadId, data: { projectName: projectName || null, startDate: startDate || null } })}
              disabled={convertMutation.isPending || !projectName.trim() || !prereqsMet}
            >
              {convertMutation.isPending ? "Converting…" : "Convert to project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Lead dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Customer name *</Label>
              <Input value={editForm.customerName} onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Company</Label>
              <Input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Project type</Label>
              <Input value={editForm.projectType} onChange={(e) => setEditForm({ ...editForm, projectType: e.target.value })} placeholder="Residential, Commercial…" />
            </div>
            <div className="space-y-1">
              <Label>Contact email</Label>
              <Input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Contact phone</Label>
              <Input value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Location</Label>
              <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Budget estimate (₹)</Label>
              <Input type="number" value={editForm.budgetEstimate} onChange={(e) => setEditForm({ ...editForm, budgetEstimate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Expected closure</Label>
              <Input type="date" value={editForm.expectedClosureDate} onChange={(e) => setEditForm({ ...editForm, expectedClosureDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["new","contacted","qualified","negotiation","won","lost"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low","medium","high"].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={updateLeadMutation.isPending || !editForm.customerName.trim()}
              onClick={() =>
                updateLeadMutation.mutate({
                  id: leadId,
                  data: {
                    customerName: editForm.customerName,
                    company: editForm.company || null,
                    contactEmail: editForm.contactEmail || null,
                    contactPhone: editForm.contactPhone || null,
                    projectType: editForm.projectType || null,
                    location: editForm.location || null,
                    budgetEstimate: editForm.budgetEstimate ? Number(editForm.budgetEstimate) : null,
                    status: editForm.status || undefined,
                    priority: editForm.priority || undefined,
                    expectedClosureDate: editForm.expectedClosureDate || null,
                    notes: editForm.notes || null,
                  },
                })
              }
            >
              {updateLeadMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Activity dialog ── */}
      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={activityForm.activityType} onValueChange={(v) => setActivityForm({ ...activityForm, activityType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["note","call","email","meeting","visit"].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} placeholder="Brief summary…" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={3} value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} placeholder="Details…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityOpen(false)}>Cancel</Button>
            <Button
              disabled={addActivityMutation.isPending || !activityForm.title.trim()}
              onClick={() => addActivityMutation.mutate({ leadId, data: { activityType: activityForm.activityType, title: activityForm.title, description: activityForm.description || null } })}
            >
              {addActivityMutation.isPending ? "Adding…" : "Add Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Schedule Visit dialog ── */}
      <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Site Visit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Visit date *</Label>
                <Input type="date" value={visitForm.visitDate} onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Visit time</Label>
                <Input type="time" value={visitForm.visitTime} onChange={(e) => setVisitForm({ ...visitForm, visitTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Site address</Label>
              <Input value={visitForm.siteAddress} onChange={(e) => setVisitForm({ ...visitForm, siteAddress: e.target.value })} placeholder="Full address…" />
            </div>
            <div className="space-y-1">
              <Label>Observations / notes</Label>
              <Textarea rows={3} value={visitForm.observations} onChange={(e) => setVisitForm({ ...visitForm, observations: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitOpen(false)}>Cancel</Button>
            <Button
              disabled={createVisitMutation.isPending || !visitForm.visitDate}
              onClick={() => createVisitMutation.mutate({ leadId, data: { visitDate: visitForm.visitDate, visitTime: visitForm.visitTime || null, siteAddress: visitForm.siteAddress || null, observations: visitForm.observations || null, status: "pending" } })}
            >
              {createVisitMutation.isPending ? "Scheduling…" : "Schedule Visit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Drawing dialog ── */}
      <Dialog open={drawingOpen} onOpenChange={setDrawingOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Drawing</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>File name *</Label>
              <Input value={drawingForm.fileName} onChange={(e) => setDrawingForm({ ...drawingForm, fileName: e.target.value })} placeholder="e.g. Floor Plan - Ground Floor.pdf" />
            </div>
            <div className="space-y-1">
              <Label>File type</Label>
              <Input value={drawingForm.fileType} onChange={(e) => setDrawingForm({ ...drawingForm, fileType: e.target.value })} placeholder="PDF, DWG, PNG…" />
            </div>
            <div className="space-y-1">
              <Label>File URL</Label>
              <Input value={drawingForm.fileUrl} onChange={(e) => setDrawingForm({ ...drawingForm, fileUrl: e.target.value })} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDrawingOpen(false)}>Cancel</Button>
            <Button
              disabled={createDrawingMutation.isPending || !drawingForm.fileName.trim()}
              onClick={() => createDrawingMutation.mutate({ leadId, data: { fileName: drawingForm.fileName, fileType: drawingForm.fileType || null, fileUrl: drawingForm.fileUrl || null } })}
            >
              {createDrawingMutation.isPending ? "Adding…" : "Add Drawing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add BOQ Item dialog ── */}
      <Dialog open={boqItemOpen !== null} onOpenChange={(o) => { if (!o) setBoqItemOpen(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Line Item</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Item name *</Label>
              <Input value={itemForm.itemName} onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })} placeholder="e.g. RCC M25 — Columns" />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="Civil, MEP, Finishing…" />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="m³, sqft, LS…" />
            </div>
            <div className="space-y-1">
              <Label>Quantity</Label>
              <Input type="number" min="0" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Unit price (₹)</Label>
              <Input type="number" min="0" value={itemForm.unitPrice} onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Tax %</Label>
              <Input type="number" min="0" max="100" value={itemForm.taxPercent} onChange={(e) => setItemForm({ ...itemForm, taxPercent: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Margin %</Label>
              <Input type="number" min="0" max="100" value={itemForm.marginPercent} onChange={(e) => setItemForm({ ...itemForm, marginPercent: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBoqItemOpen(null)}>Cancel</Button>
            <Button
              disabled={addBoqItemMutation.isPending || !itemForm.itemName.trim()}
              onClick={() =>
                addBoqItemMutation.mutate({
                  boqId: boqItemOpen!,
                  data: {
                    itemName: itemForm.itemName,
                    category: itemForm.category || null,
                    unit: itemForm.unit || null,
                    quantity: Number(itemForm.quantity),
                    unitPrice: Number(itemForm.unitPrice),
                    taxPercent: Number(itemForm.taxPercent),
                    marginPercent: Number(itemForm.marginPercent),
                  },
                })
              }
            >
              {addBoqItemMutation.isPending ? "Adding…" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Negotiation dialog ── */}
      <Dialog open={negOpen} onOpenChange={setNegOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Negotiation Round</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Revised amount (₹)</Label>
                <Input type="number" min="0" value={negForm.revisedAmount} onChange={(e) => setNegForm({ ...negForm, revisedAmount: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Discount %</Label>
                <Input type="number" min="0" max="100" value={negForm.discountPercent} onChange={(e) => setNegForm({ ...negForm, discountPercent: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea rows={3} value={negForm.notes} onChange={(e) => setNegForm({ ...negForm, notes: e.target.value })} placeholder="Terms, conditions, remarks…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNegOpen(false)}>Cancel</Button>
            <Button
              disabled={createNegMutation.isPending}
              onClick={() =>
                createNegMutation.mutate({
                  leadId,
                  data: {
                    revisedAmount: negForm.revisedAmount ? Number(negForm.revisedAmount) : null,
                    discountPercent: negForm.discountPercent ? Number(negForm.discountPercent) : null,
                    notes: negForm.notes || null,
                  },
                })
              }
            >
              {createNegMutation.isPending ? "Adding…" : "Add Round"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── body ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* left sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {lead.company && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Company</div>
                  <div>{lead.company as string}</div>
                </div>
              )}
              {lead.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.contactEmail}`} className="text-sm hover:underline">{lead.contactEmail as string}</a>
                </div>
              )}
              {lead.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.contactPhone}`} className="text-sm hover:underline">{lead.contactPhone as string}</a>
                </div>
              )}
              {lead.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{lead.location as string}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Project Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{(lead.projectType as string) || "Unspecified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget Estimate</span>
                <span className="font-medium text-primary">{INR(lead.budgetEstimate as number)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created On</span>
                <span>{format(new Date(lead.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Closure</span>
                <span>{lead.expectedClosureDate ? format(new Date(lead.expectedClosureDate as string), "MMM d, yyyy") : "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="activities">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              {["activities","site_visits","drawings","boqs","negotiations"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent capitalize"
                >
                  {t.replace("_", " ")}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="py-6">

              {/* ── Activities ── */}
              <TabsContent value="activities" className="m-0 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm" className="gap-1" onClick={() => setActivityOpen(true)}>
                    <Plus className="h-4 w-4" /> Add Activity
                  </Button>
                </div>
                {lead.activities?.length ? (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {lead.activities.map((activity) => (
                      <div key={activity.id} className="relative flex items-center justify-between group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-muted-foreground shadow shrink-0 z-10">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="w-[calc(100%-3.5rem)] p-4 rounded border bg-card shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{activity.title}</span>
                              <Badge variant="secondary" className="text-xs capitalize">{activity.activityType}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{format(new Date(activity.createdAt), "MMM d, h:mm a")}</span>
                          </div>
                          {activity.description && <p className="text-sm text-muted-foreground">{activity.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No activities recorded yet.</div>
                )}
              </TabsContent>

              {/* ── Site Visits ── */}
              <TabsContent value="site_visits" className="m-0">
                <div className="flex justify-end mb-4">
                  <Button size="sm" className="gap-1" onClick={() => setVisitOpen(true)}>
                    <Plus className="h-4 w-4" /> Schedule Visit
                  </Button>
                </div>
                <div className="grid gap-4">
                  {lead.siteVisits?.map((visit) => (
                    <Card key={visit.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{format(new Date(visit.visitDate), "MMM d, yyyy")}{visit.visitTime ? ` at ${visit.visitTime}` : ""}</p>
                            {visit.siteAddress && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{visit.siteAddress}</p>}
                            {visit.observations && <p className="text-sm text-muted-foreground mt-1">{visit.observations}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={(statusColor[visit.status] ?? "secondary") as "default" | "secondary" | "destructive" | "outline"}>
                              {visit.status}
                            </Badge>
                            {visit.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                  onClick={() => updateVisitMutation.mutate({ id: visit.id, data: { status: "completed" } as never })}>
                                  Complete
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                                  onClick={() => updateVisitMutation.mutate({ id: visit.id, data: { status: "cancelled" } as never })}>
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!lead.siteVisits?.length && (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No site visits scheduled.</div>
                  )}
                </div>
              </TabsContent>

              {/* ── Drawings ── */}
              <TabsContent value="drawings" className="m-0">
                <div className="flex justify-end mb-4">
                  <Button size="sm" className="gap-1" onClick={() => setDrawingOpen(true)}>
                    <Plus className="h-4 w-4" /> Add Drawing
                  </Button>
                </div>
                <div className="grid gap-3">
                  {lead.drawings?.map((drawing) => (
                    <Card key={drawing.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{drawing.fileName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              v{drawing.version}{drawing.fileType ? ` · ${drawing.fileType}` : ""}{drawing.uploadedByName ? ` · ${drawing.uploadedByName}` : ""}
                            </p>
                            {drawing.fileUrl && (
                              <a href={drawing.fileUrl as string} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                                View file →
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={(statusColor[drawing.status ?? "draft"] ?? "secondary") as "default" | "secondary" | "destructive" | "outline"}>
                              {drawing.status ?? "draft"}
                            </Badge>
                            {drawing.status !== "approved" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                disabled={updateDrawingMutation.isPending}
                                onClick={() => updateDrawingMutation.mutate({ id: drawing.id, data: { status: "approved" } })}>
                                Approve
                              </Button>
                            )}
                            {drawing.status !== "rejected" && drawing.status !== "approved" && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                                disabled={updateDrawingMutation.isPending}
                                onClick={() => updateDrawingMutation.mutate({ id: drawing.id, data: { status: "rejected" } })}>
                                Reject
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!lead.drawings?.length && (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No drawings uploaded yet.</div>
                  )}
                </div>
              </TabsContent>

              {/* ── BOQs ── */}
              <TabsContent value="boqs" className="m-0">
                <div className="flex justify-end mb-4">
                  <Button size="sm" className="gap-1" disabled={createBoqMutation.isPending}
                    onClick={() => createBoqMutation.mutate({ leadId, data: {} })}>
                    <Plus className="h-4 w-4" /> New BOQ Version
                  </Button>
                </div>
                <div className="grid gap-4">
                  {lead.boqs?.map((boq) => {
                    const isExpanded = expandedBoqId === boq.id;
                    const boqDetail = isExpanded ? expandedBoq : null;
                    return (
                      <Card key={boq.id}>
                        <CardContent className="p-0">
                          {/* header row */}
                          <div className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <button
                                className="flex items-center gap-1 font-semibold text-sm hover:text-primary transition-colors"
                                onClick={() => setExpandedBoqId(isExpanded ? null : boq.id)}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                Version {boq.version}
                              </button>
                              <Badge variant={(statusColor[boq.status ?? "draft"] ?? "secondary") as "default" | "secondary" | "destructive" | "outline"}>
                                {boq.status ?? "draft"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-primary">{INR(boq.grandTotal as number)}</span>
                              {boq.status !== "approved" && (
                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                  disabled={updateBoqMutation.isPending}
                                  onClick={() => updateBoqMutation.mutate({ id: boq.id, data: { status: "approved" } })}>
                                  Approve
                                </Button>
                              )}
                              {boq.status !== "rejected" && boq.status !== "approved" && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                                  disabled={updateBoqMutation.isPending}
                                  onClick={() => updateBoqMutation.mutate({ id: boq.id, data: { status: "rejected" } })}>
                                  Reject
                                </Button>
                              )}
                              <Button size="sm" variant="secondary" className="h-7 text-xs gap-1"
                                onClick={() => { setExpandedBoqId(boq.id); setBoqItemOpen(boq.id); }}>
                                <Plus className="h-3 w-3" /> Add Item
                              </Button>
                            </div>
                          </div>

                          {/* expanded items */}
                          {isExpanded && (
                            <div className="border-t">
                              {boqDetail?.items?.length ? (
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-medium">Item</th>
                                      <th className="px-3 py-2 text-left font-medium">Category</th>
                                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                                      <th className="px-3 py-2 text-left font-medium">Unit</th>
                                      <th className="px-3 py-2 text-right font-medium">Unit Price</th>
                                      <th className="px-3 py-2 text-right font-medium">Total</th>
                                      <th className="px-3 py-2"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {boqDetail.items.map((item) => (
                                      <tr key={item.id} className="hover:bg-accent/30">
                                        <td className="px-4 py-2">{item.itemName}</td>
                                        <td className="px-3 py-2 text-muted-foreground">{(item.category as string) || "—"}</td>
                                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                                        <td className="px-3 py-2 text-muted-foreground">{(item.unit as string) || "—"}</td>
                                        <td className="px-3 py-2 text-right">{INR(item.unitPrice as number)}</td>
                                        <td className="px-3 py-2 text-right font-medium">{INR(item.totalPrice as number)}</td>
                                        <td className="px-3 py-2">
                                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                                            onClick={() => deleteBoqItemMutation.mutate({ id: item.id })}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-muted/30 font-medium text-xs">
                                    <tr>
                                      <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">Subtotal</td>
                                      <td className="px-3 py-2 text-right">{INR(boqDetail.subtotal as number)}</td>
                                      <td />
                                    </tr>
                                    <tr>
                                      <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">Tax</td>
                                      <td className="px-3 py-2 text-right">{INR(boqDetail.taxTotal as number)}</td>
                                      <td />
                                    </tr>
                                    <tr>
                                      <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">Margin</td>
                                      <td className="px-3 py-2 text-right">{INR(boqDetail.marginTotal as number)}</td>
                                      <td />
                                    </tr>
                                    <tr className="text-sm">
                                      <td colSpan={5} className="px-4 py-2 text-right font-bold">Grand Total</td>
                                      <td className="px-3 py-2 text-right font-bold text-primary">{INR(boqDetail.grandTotal as number)}</td>
                                      <td />
                                    </tr>
                                  </tfoot>
                                </table>
                              ) : (
                                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                  No line items yet.{" "}
                                  <button className="text-primary underline" onClick={() => setBoqItemOpen(boq.id)}>Add the first item</button>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {!lead.boqs?.length && (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No BOQ versions yet.</div>
                  )}
                </div>
              </TabsContent>

              {/* ── Negotiations ── */}
              <TabsContent value="negotiations" className="m-0">
                <div className="flex justify-end mb-4">
                  <Button size="sm" className="gap-1" onClick={() => setNegOpen(true)}>
                    <Plus className="h-4 w-4" /> Add Round
                  </Button>
                </div>
                <div className="grid gap-4">
                  {lead.negotiations?.map((neg) => (
                    <Card key={neg.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">Round {neg.roundNumber}</span>
                              {neg.requiresApproval && <Badge variant="outline" className="text-xs">Needs approval</Badge>}
                            </div>
                            <div className="flex gap-6 text-sm">
                              {neg.revisedAmount != null && (
                                <span>Revised: <span className="font-medium text-primary">{INR(neg.revisedAmount as number)}</span></span>
                              )}
                              {neg.discountPercent != null && (
                                <span>Discount: <span className="font-medium">{Number(neg.discountPercent).toFixed(1)}%</span></span>
                              )}
                            </div>
                            {neg.notes && <p className="text-sm text-muted-foreground">{neg.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={(statusColor[neg.status ?? "pending"] ?? "secondary") as "default" | "secondary" | "destructive" | "outline"}>
                              {neg.status ?? "pending"}
                            </Badge>
                            {neg.status !== "approved" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                disabled={updateNegMutation.isPending}
                                onClick={() => updateNegMutation.mutate({ id: neg.id, data: { status: "approved" } })}>
                                Approve
                              </Button>
                            )}
                            {neg.status !== "rejected" && neg.status !== "approved" && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                                disabled={updateNegMutation.isPending}
                                onClick={() => updateNegMutation.mutate({ id: neg.id, data: { status: "rejected" } })}>
                                Reject
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!lead.negotiations?.length && (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No negotiation rounds yet.</div>
                  )}
                </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
