import { useParams, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
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
  Upload,
  FileText,
  X,
  ShieldCheck,
  DollarSign,
  Percent,
  Scale,
  Landmark,
  Clock,
  FileCheck,
  Layers,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Printer,
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
  const [fastTrack, setFastTrack] = useState(true);

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
  const [selectedDrawingFiles, setSelectedDrawingFiles] = useState<File[]>([]);

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

  // Commercial Payment Terms Matrix fields
  const [commercialForm, setCommercialForm] = useState({
    advancePercent: 10,
    retentionPercent: 5,
    abgRequired: false,
    abgPercent: 10,
    abgAmount: 0,
    paymentTermsDays: 30,
    dlpMonths: 12,
    commercialTermsNotes: "",
  });

  // ── queries ──
  const { data: lead, isLoading } = useGetLead(leadId, {
    query: { enabled: !!leadId, queryKey: getGetLeadQueryKey(leadId) },
  });

  useEffect(() => {
    if (lead) {
      const l = lead as any;
      setCommercialForm({
        advancePercent: l.advancePercent != null ? Number(l.advancePercent) : 10,
        retentionPercent: l.retentionPercent != null ? Number(l.retentionPercent) : 5,
        abgRequired: Boolean(l.abgRequired),
        abgPercent: l.abgPercent != null ? Number(l.abgPercent) : 10,
        abgAmount: l.abgAmount != null ? Number(l.abgAmount) : 0,
        paymentTermsDays: l.paymentTermsDays != null ? Number(l.paymentTermsDays) : 30,
        dlpMonths: l.dlpMonths != null ? Number(l.dlpMonths) : 12,
        commercialTermsNotes: l.commercialTermsNotes || "",
      });
    }
  }, [lead]);

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
      onSuccess: () => { invalidateLead(); setDrawingOpen(false); setDrawingForm({ fileName: "", fileType: "", fileUrl: "" }); setSelectedDrawingFiles([]); toast({ title: "Drawing added" }); },
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
  const approvedBoqs = lead.boqs?.filter((b: any) => b.status === "approved") ?? [];
  const latestBoq = approvedBoqs.length > 0 ? approvedBoqs[approvedBoqs.length - 1] : lead.boqs?.[(lead.boqs?.length || 1) - 1];
  const hasApprovedBoq = approvedBoqs.length > 0;
  const hasApprovedDrawing = lead.drawings?.some((d: any) => d.status === "approved") ?? false;
  const prereqsMet = hasApprovedBoq && hasApprovedDrawing;
  const canConvert = prereqsMet || fastTrack;

  // ── BOQ Export Functions (FR-BOQ-06) ──────────────────────────────────────────
  const fetchBoqWithItems = async (boqId: number) => {
    if (expandedBoqId === boqId && expandedBoq?.items) {
      return expandedBoq;
    }
    const res = await fetch(`/api/boqs/${boqId}`);
    if (!res.ok) throw new Error("Failed to load BOQ details");
    return await res.json();
  };

  const handleExportBoqExcel = async (boqId: number, version: number) => {
    try {
      toast({ title: "Generating Excel...", description: `Preparing BOQ v${version} for download.` });
      const boqData = await fetchBoqWithItems(boqId);
      const items = boqData.items || [];

      const escapeXml = (unsafe: any) => {
        if (unsafe === null || unsafe === undefined) return "";
        return String(unsafe)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
      };

      const xmlItemRows = items
        .map(
          (item: any, idx: number) => `   <Row>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(item.itemName)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(item.category || "-")}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${item.quantity ?? 0}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(item.unit || "-")}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.unitPrice ?? 0}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${Number(item.taxPercent || 0) / 100}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${Number(item.marginPercent || 0) / 100}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.totalPrice ?? 0}</Data></Cell>
   </Row>`
        )
        .join("\n");

      const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Kanak Turnkey</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="14" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:Bold="1" ss:Color="#64748B"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaVal">
   <Font ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Text"><Alignment ss:Vertical="Center"/></Style>
  <Style ss:ID="Center"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
  <Style ss:ID="Number"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/></Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="₹#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Percent">
   <NumberFormat ss:Format="0.0%"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TotalLabel">
   <Font ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TotalVal">
   <Font ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="₹#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="GrandTotal">
   <Font ss:Bold="1" ss:Size="11" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="₹#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="BOQ v${version}">
  <Table>
   <Column ss:Width="40"/>
   <Column ss:Width="220"/>
   <Column ss:Width="120"/>
   <Column ss:Width="70"/>
   <Column ss:Width="60"/>
   <Column ss:Width="110"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="130"/>
   <Row>
    <Cell ss:MergeAcross="8" ss:StyleID="Title"><Data ss:Type="String">KANAK TURNKEY - BILL OF QUANTITIES (BOQ)</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Customer:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead.customerName || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Lead No:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead.leadNumber || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">BOQ Version:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">Version ${version}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Status:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(boqData.status || "draft")}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Company:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead.company || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Location:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead.location || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Project Type:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(lead.projectType || "-")}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Date:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(new Date().toLocaleDateString())}</Data></Cell>
   </Row>
   <Row></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">#</Data></Cell>
    <Cell><Data ss:Type="String">Item Description</Data></Cell>
    <Cell><Data ss:Type="String">Category</Data></Cell>
    <Cell><Data ss:Type="String">Quantity</Data></Cell>
    <Cell><Data ss:Type="String">Unit</Data></Cell>
    <Cell><Data ss:Type="String">Unit Price (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Tax %</Data></Cell>
    <Cell><Data ss:Type="String">Margin %</Data></Cell>
    <Cell><Data ss:Type="String">Total Price (INR)</Data></Cell>
   </Row>
${xmlItemRows}
   <Row></Row>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="TotalLabel"><Data ss:Type="String">Subtotal (Base Cost):</Data></Cell>
    <Cell ss:StyleID="TotalVal"><Data ss:Type="Number">${boqData.subtotal ?? 0}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="TotalLabel"><Data ss:Type="String">Applicable Tax Total:</Data></Cell>
    <Cell ss:StyleID="TotalVal"><Data ss:Type="Number">${boqData.taxTotal ?? 0}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="TotalLabel"><Data ss:Type="String">Operating Margin Total:</Data></Cell>
    <Cell ss:StyleID="TotalVal"><Data ss:Type="Number">${boqData.marginTotal ?? 0}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="GrandTotal"><Data ss:Type="String">GRAND TOTAL (INR):</Data></Cell>
    <Cell ss:StyleID="GrandTotal"><Data ss:Type="Number">${boqData.grandTotal ?? 0}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BOQ_v${version}_${lead.leadNumber || lead.id}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "BOQ Exported", description: `BOQ v${version} downloaded as Excel (.xls).` });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err?.message || "Could not export BOQ to Excel.", variant: "destructive" });
    }
  };

  const handleExportBoqCsv = async (boqId: number, version: number) => {
    try {
      const boqData = await fetchBoqWithItems(boqId);
      const items = boqData.items || [];

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const csvRows = [
        `"BOQ Version ${version} - ${lead.customerName || ""}"`,
        `"Lead Number:",${escapeCsv(lead.leadNumber)}`,
        `"Company:",${escapeCsv(lead.company)}`,
        `"Project Type:",${escapeCsv(lead.projectType)}`,
        `"Location:",${escapeCsv(lead.location)}`,
        `"Status:",${escapeCsv(boqData.status)}`,
        `"Date:",${escapeCsv(new Date().toLocaleDateString())}`,
        "",
        [
          "Item No",
          "Item Name",
          "Category",
          "Quantity",
          "Unit",
          "Unit Price (INR)",
          "Tax (%)",
          "Margin (%)",
          "Total Price (INR)",
        ].join(","),
        ...items.map((item: any, index: number) =>
          [
            index + 1,
            escapeCsv(item.itemName),
            escapeCsv(item.category),
            escapeCsv(item.quantity),
            escapeCsv(item.unit),
            escapeCsv(item.unitPrice),
            escapeCsv(item.taxPercent),
            escapeCsv(item.marginPercent),
            escapeCsv(item.totalPrice),
          ].join(",")
        ),
        "",
        `"","","","","","","Subtotal (Base):",,${boqData.subtotal ?? 0}`,
        `"","","","","","","Tax Total:",,${boqData.taxTotal ?? 0}`,
        `"","","","","","","Margin Total:",,${boqData.marginTotal ?? 0}`,
        `"","","","","","","Grand Total (INR):",,${boqData.grandTotal ?? 0}`,
      ];

      const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BOQ_v${version}_${lead.leadNumber || lead.id}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "BOQ Exported", description: `BOQ v${version} downloaded as CSV.` });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err?.message || "Could not export BOQ to CSV.", variant: "destructive" });
    }
  };

  const handlePrintBoqPdf = (boqId: number, version: number) => {
    const w = window.open(`/api/boqs/${boqId}/export?format=pdf`, "_blank", "width=960,height=800,menubar=no,toolbar=no,location=no,status=no");
    if (!w) {
      toast({ title: "Pop-up Blocked", description: "Please allow pop-ups to print/save as PDF.", variant: "destructive" });
    }
  };

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

      {/* ── Pre-Construction Journey Stepper ── */}
      <Card className="border bg-gradient-to-r from-primary/[0.04] via-background to-primary/[0.02] p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: "lead_creation", label: "1. Lead", done: true },
              { key: "site_visit", label: "2. Site Visit", done: (lead.siteVisits?.length || 0) > 0 },
              { key: "drawings", label: "3. Drawings", done: hasApprovedDrawing },
              { key: "boq", label: "4. BOQ & Estimate", done: hasApprovedBoq },
              { key: "negotiation", label: "5. Terms & Quote", done: (lead.negotiations?.length || 0) > 0 || hasApprovedBoq },
              { key: "won", label: "6. Project Award", done: Boolean(lead.wonProjectId) },
            ].map((step, idx) => (
              <div key={step.key} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    step.done
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-300 dark:border-emerald-800"
                      : lead.stage === step.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  <span>{step.label}</span>
                </div>
                {idx < 5 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
              </div>
            ))}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {!lead.wonProjectId && lead.status !== "lost" ? (
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                onClick={() => {
                  setProjectName(`${lead.customerName}${lead.projectType ? ` — ${lead.projectType}` : ""}`);
                  setConvertOpen(true);
                }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Ready to Award & Mobilize
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* ── Convert dialog ── */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">
                <Sparkles className="w-3 h-3 mr-1" /> Sales-to-Project Handover Automation
              </Badge>
            </div>
            <DialogTitle className="text-xl">Convert Lead & Auto-Generate Client Contract</DialogTitle>
            <DialogDescription>
              Converting this lead marks it as <b>won</b>, spins up a new Project, and auto-generates the official <b>Client Contract</b>, <b>baseline budget packages</b> (Civil, MEP, Finishes), and a <b>6-stage milestone-to-billing schedule</b>.
            </DialogDescription>
          </DialogHeader>

          {/* Conversion prerequisites */}
          <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center justify-between">
              <span>Conversion Prerequisites</span>
              <span className={`text-[11px] font-bold ${prereqsMet ? "text-green-500" : fastTrack ? "text-primary" : "text-amber-500"}`}>
                {prereqsMet ? "Ready for Handover" : fastTrack ? "Fast-Track Enabled" : "Approval Needed"}
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                {hasApprovedBoq ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                <span className={hasApprovedBoq ? "text-foreground font-medium" : "text-muted-foreground"}>BOQ: {hasApprovedBoq ? "Approved" : "Pending Approval"}</span>
              </div>
              <div className="flex items-center gap-2">
                {hasApprovedDrawing ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                <span className={hasApprovedDrawing ? "text-foreground font-medium" : "text-muted-foreground"}>Drawings: {hasApprovedDrawing ? "Approved" : "Pending Approval"}</span>
              </div>
            </div>
            {!prereqsMet && (
              <div className="pt-2 border-t mt-2 flex items-center justify-between bg-primary/5 -mx-3.5 -mb-3.5 p-3 rounded-b-lg border-primary/20">
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="fastTrackHandover"
                    checked={fastTrack}
                    onChange={(e) => setFastTrack(e.target.checked)}
                    className="rounded border-gray-300 text-primary h-4 w-4 cursor-pointer"
                  />
                  <Label htmlFor="fastTrackHandover" className="cursor-pointer font-medium text-xs text-primary">
                    Fast-Track Handover (proceed with lead estimates without awaiting drawing/BOQ approval)
                  </Label>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 py-2">
            {/* Project Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Project Name *</Label>
                <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} disabled={!canConvert} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Project Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!canConvert} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estimated Contract Value</Label>
                <Input disabled value={INR(latestBoq ? Number(latestBoq.grandTotal) : lead.budgetEstimate ? Number(lead.budgetEstimate) : 0)} className="bg-muted font-mono font-medium" />
              </div>
            </div>

            {/* Commercial Payment Terms Matrix */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" /> Commercial Payment Terms Matrix
                </h4>
                <Badge variant="outline" className="text-[10px]">Contract Terms</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Mobilization Advance %</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.5"
                      value={commercialForm.advancePercent}
                      onChange={(e) => setCommercialForm({ ...commercialForm, advancePercent: Number(e.target.value) })}
                      disabled={!canConvert}
                      className="pr-6 font-mono text-xs"
                    />
                    <span className="absolute right-2 top-2 text-muted-foreground text-xs">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Retention % (until DLP)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.5"
                      value={commercialForm.retentionPercent}
                      onChange={(e) => setCommercialForm({ ...commercialForm, retentionPercent: Number(e.target.value) })}
                      disabled={!canConvert}
                      className="pr-6 font-mono text-xs"
                    />
                    <span className="absolute right-2 top-2 text-muted-foreground text-xs">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Payment Credit (Days)</Label>
                  <Input
                    type="number"
                    value={commercialForm.paymentTermsDays}
                    onChange={(e) => setCommercialForm({ ...commercialForm, paymentTermsDays: Number(e.target.value) })}
                    disabled={!canConvert}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">DLP Period (Months)</Label>
                  <Input
                    type="number"
                    value={commercialForm.dlpMonths}
                    onChange={(e) => setCommercialForm({ ...commercialForm, dlpMonths: Number(e.target.value) })}
                    disabled={!canConvert}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              {/* Advance Bank Guarantee (ABG) */}
              <div className="pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-muted/30 p-2.5 rounded-md">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="convertAbgReq"
                    checked={commercialForm.abgRequired}
                    onChange={(e) => setCommercialForm({ ...commercialForm, abgRequired: e.target.checked })}
                    disabled={!canConvert}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <Label htmlFor="convertAbgReq" className="cursor-pointer font-medium text-xs">
                    Advance Bank Guarantee (ABG) Mandatory
                  </Label>
                </div>

                {commercialForm.abgRequired && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px]">ABG Coverage:</span>
                    <Input
                      type="number"
                      value={commercialForm.abgPercent}
                      onChange={(e) => setCommercialForm({ ...commercialForm, abgPercent: Number(e.target.value) })}
                      disabled={!canConvert}
                      className="w-16 h-7 text-xs font-mono"
                    />
                    <span className="text-muted-foreground text-xs">%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Handover Automation Deliverables Summary */}
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-xs space-y-1.5">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Auto-Generated Deliverables on Handover:
              </div>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
                <li><b>Client Contract</b>: Generated as active client agreement with agreed commercial terms.</li>
                <li><b>Baseline Budget Packages</b>: Civil (35%), Finishes (25%), MEP (18%), HVAC (10%), Plumbing (7%), Overheads (5%).</li>
                <li><b>Milestone-to-Billing Schedule</b>: 6-stage turnkey schedule summing to 100% of contract value.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConvertOpen(false)} disabled={convertMutation.isPending}>
              Cancel
            </Button>
            <Button
              className="gap-1.5"
              onClick={() =>
                convertMutation.mutate({
                  id: leadId,
                  data: {
                    projectName: projectName || null,
                    startDate: startDate || null,
                    advancePercent: commercialForm.advancePercent,
                    retentionPercent: commercialForm.retentionPercent,
                    abgRequired: commercialForm.abgRequired,
                    abgPercent: commercialForm.abgPercent,
                    paymentTermsDays: commercialForm.paymentTermsDays,
                    dlpMonths: commercialForm.dlpMonths,
                    commercialTermsNotes: commercialForm.commercialTermsNotes || null,
                    skipPrerequisites: fastTrack || !prereqsMet,
                  } as any,
                })
              }
              disabled={convertMutation.isPending || !projectName.trim() || !canConvert}
            >
              {convertMutation.isPending ? "Generating Contract & Converting…" : "Execute Handover & Create Project"}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
            
            {/* Files Upload Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Files
                </Label>
                <label
                  htmlFor="drawing-file-upload"
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Files
                </label>
                <input
                  id="drawing-file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setSelectedDrawingFiles(prev => [...prev, ...files]);
                      // Auto-populate fileName from first file if empty
                      if (!drawingForm.fileName && files[0]) {
                        setDrawingForm(f => ({
                          ...f,
                          fileName: files[0].name,
                          fileType: files[0].name.split('.').pop() || "",
                        }));
                      }
                    }
                  }}
                />
              </div>
              
              {selectedDrawingFiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedDrawingFiles.map((file, index) => {
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
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center">
                              <FileText className="w-8 h-8 text-muted-foreground mb-1" />
                              <p className="text-xs font-medium text-muted-foreground truncate w-full">
                                {file.name}
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedDrawingFiles(prev => prev.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-4 h-4" />
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
                  htmlFor="drawing-file-upload-area"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> drawings
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DWG, DXF, Images supported
                    </p>
                  </div>
                  <input
                    id="drawing-file-upload-area"
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,application/pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        setSelectedDrawingFiles(prev => [...prev, ...files]);
                        if (!drawingForm.fileName && files[0]) {
                          setDrawingForm(f => ({
                            ...f,
                            fileName: files[0].name,
                            fileType: files[0].name.split('.').pop() || "",
                          }));
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>
            
            <div className="space-y-1">
              <Label>File URL (optional)</Label>
              <Input value={drawingForm.fileUrl} onChange={(e) => setDrawingForm({ ...drawingForm, fileUrl: e.target.value })} placeholder="https://… (or leave blank to use uploaded files)" />
              <p className="text-xs text-muted-foreground">
                Provide an external URL if not uploading files above
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDrawingOpen(false)}>Cancel</Button>
            <Button
              disabled={createDrawingMutation.isPending || !drawingForm.fileName.trim()}
              onClick={async () => {
                let fileUrl = drawingForm.fileUrl; // Start with manual URL if provided
                
                // If files were selected, upload them first and use the first file's URL
                if (selectedDrawingFiles.length > 0) {
                  try {
                    const file = selectedDrawingFiles[0];
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const uploadResponse = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData,
                    });
                    
                    if (uploadResponse.ok) {
                      const uploadData = await uploadResponse.json();
                      fileUrl = uploadData.fileUrl;
                    }
                  } catch (error) {
                    console.error('File upload error:', error);
                  }
                }
                
                createDrawingMutation.mutate({ 
                  leadId, 
                  data: { 
                    fileName: drawingForm.fileName, 
                    fileType: drawingForm.fileType || null, 
                    fileUrl: fileUrl || null 
                  } 
                });
              }}
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
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
              {["activities","site_visits","drawings","boqs","negotiations","commercial_terms"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent capitalize whitespace-nowrap text-xs sm:text-sm"
                >
                  {t === "commercial_terms" ? "Commercial & Payment Terms" : t.replace("_", " ")}
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
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-primary mr-1">{INR(boq.grandTotal as number)}</span>
                              {/* ── BOQ Export Dropdown (FR-BOQ-06) ── */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                                    <Download className="h-3 w-3 text-emerald-600" /> Export
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuLabel className="text-xs">Export BOQ v{boq.version}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleExportBoqExcel(boq.id, boq.version)} className="text-xs gap-2 cursor-pointer">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                    <span>Export to Excel (.xls)</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExportBoqCsv(boq.id, boq.version)} className="text-xs gap-2 cursor-pointer">
                                    <Download className="h-4 w-4 text-muted-foreground" />
                                    <span>Export to CSV (.csv)</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handlePrintBoqPdf(boq.id, boq.version)} className="text-xs gap-2 cursor-pointer">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span>Print / Save as PDF</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

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
                                <>
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
                                  <div className="p-3 bg-muted/20 border-t flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-xs text-muted-foreground">
                                      Total line items: <span className="font-semibold text-foreground">{boqDetail.items.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                        onClick={() => handleExportBoqExcel(boq.id, boq.version)}
                                      >
                                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                        Export Excel (.xls)
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => handlePrintBoqPdf(boq.id, boq.version)}
                                      >
                                        <FileText className="h-3.5 w-3.5 text-primary" />
                                        Print / PDF
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs gap-1 text-muted-foreground"
                                        onClick={() => handleExportBoqCsv(boq.id, boq.version)}
                                      >
                                        <Download className="h-3 w-3" />
                                        CSV
                                      </Button>
                                    </div>
                                  </div>
                                </>
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

              {/* ── Commercial & Payment Terms Matrix ── */}
              <TabsContent value="commercial_terms" className="m-0 space-y-6">
                <Card>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Landmark className="w-5 h-5 text-primary" />
                          Commercial Payment Terms Matrix
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                            EPC Turnkey Terms
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Define mobilization advance, bank guarantee coverage, retention, DLP, and milestone billing percentages upfront for lead-to-contract handover.
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        disabled={updateLeadMutation.isPending}
                        onClick={() =>
                          updateLeadMutation.mutate({
                            id: leadId,
                            data: {
                              advancePercent: String(commercialForm.advancePercent),
                              retentionPercent: String(commercialForm.retentionPercent),
                              abgRequired: commercialForm.abgRequired,
                              abgPercent: String(commercialForm.abgPercent),
                              abgAmount: String(commercialForm.abgAmount),
                              paymentTermsDays: commercialForm.paymentTermsDays,
                              dlpMonths: commercialForm.dlpMonths,
                              commercialTermsNotes: commercialForm.commercialTermsNotes || null,
                            } as any,
                          })
                        }
                      >
                        {updateLeadMutation.isPending ? "Saving Terms…" : "Save Payment Terms"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-6">
                    {/* Contract Value Reference Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-3.5 rounded-lg border">
                      <div>
                        <div className="text-[11px] text-muted-foreground">Contract Benchmark</div>
                        <div className="text-base font-bold text-foreground">
                          {INR(latestBoq ? Number(latestBoq.grandTotal) : lead.budgetEstimate ? Number(lead.budgetEstimate) : 0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{latestBoq ? "From Latest Approved BOQ" : "Estimated Budget"}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground">Mobilization Advance</div>
                        <div className="text-base font-bold text-primary">
                          {INR(
                            ((latestBoq ? Number(latestBoq.grandTotal) : Number(lead.budgetEstimate || 0)) * commercialForm.advancePercent) /
                              100
                          )}
                        </div>
                        <div className="text-[10px] text-primary/80">{commercialForm.advancePercent}% of Contract</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground">Retention Withheld</div>
                        <div className="text-base font-bold text-amber-500">
                          {INR(
                            ((latestBoq ? Number(latestBoq.grandTotal) : Number(lead.budgetEstimate || 0)) * commercialForm.retentionPercent) /
                              100
                          )}
                        </div>
                        <div className="text-[10px] text-amber-500/80">{commercialForm.retentionPercent}% held until DLP</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground">Defect Liability (DLP)</div>
                        <div className="text-base font-bold text-emerald-500">{commercialForm.dlpMonths} Months</div>
                        <div className="text-[10px] text-emerald-500/80">Post Virtual Completion</div>
                      </div>
                    </div>

                    {/* Inputs Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5 text-primary" /> Client Mobilization Advance %
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            value={commercialForm.advancePercent}
                            onChange={(e) => setCommercialForm({ ...commercialForm, advancePercent: Number(e.target.value) })}
                            className="pr-7 font-mono text-sm"
                          />
                          <span className="absolute right-2.5 top-2.5 text-muted-foreground text-xs font-semibold">%</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Standard 10% advance on signing & possession.</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-amber-500" /> Retention Withholding %
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            value={commercialForm.retentionPercent}
                            onChange={(e) => setCommercialForm({ ...commercialForm, retentionPercent: Number(e.target.value) })}
                            className="pr-7 font-mono text-sm"
                          />
                          <span className="absolute right-2.5 top-2.5 text-muted-foreground text-xs font-semibold">%</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Deducted from each RA Bill until handover.</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" /> Payment Credit Period (Days)
                        </Label>
                        <Input
                          type="number"
                          value={commercialForm.paymentTermsDays}
                          onChange={(e) => setCommercialForm({ ...commercialForm, paymentTermsDays: Number(e.target.value) })}
                          className="font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">Days to clear invoice after RA certification.</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> DLP Period (Months)
                        </Label>
                        <Input
                          type="number"
                          value={commercialForm.dlpMonths}
                          onChange={(e) => setCommercialForm({ ...commercialForm, dlpMonths: Number(e.target.value) })}
                          className="font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">Warranty period post handover signoff.</p>
                      </div>
                    </div>

                    {/* ABG Section */}
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="leadAbgReq"
                            checked={commercialForm.abgRequired}
                            onChange={(e) => setCommercialForm({ ...commercialForm, abgRequired: e.target.checked })}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <Label htmlFor="leadAbgReq" className="cursor-pointer font-semibold text-sm">
                            Advance Bank Guarantee (ABG) Required
                          </Label>
                        </div>
                        {commercialForm.abgRequired && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                            <ShieldCheck className="w-3 h-3 mr-1" /> ABG Mandatory for Advance Release
                          </Badge>
                        )}
                      </div>

                      {commercialForm.abgRequired && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">ABG Percentage (%)</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.5"
                                value={commercialForm.abgPercent}
                                onChange={(e) => setCommercialForm({ ...commercialForm, abgPercent: Number(e.target.value) })}
                                className="font-mono text-sm pr-7"
                              />
                              <span className="absolute right-2.5 top-2.5 text-muted-foreground text-xs">%</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Calculated ABG Value</Label>
                            <Input
                              disabled
                              value={INR(
                                ((latestBoq ? Number(latestBoq.grandTotal) : Number(lead.budgetEstimate || 0)) *
                                  commercialForm.abgPercent) /
                                  100
                              )}
                              className="font-mono text-sm bg-muted font-semibold text-emerald-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Commercial Notes */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Special Commercial Notes & Stipulations</Label>
                      <Textarea
                        rows={3}
                        value={commercialForm.commercialTermsNotes}
                        onChange={(e) => setCommercialForm({ ...commercialForm, commercialTermsNotes: e.target.value })}
                        placeholder="e.g. Advance to be disbursed within 7 working days of unconditional ABG submission. Retention release: 50% on Virtual Completion, 50% post DLP..."
                      />
                    </div>

                    {/* Milestone-to-Billing Schedule Preview */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                            <Layers className="w-4 h-4 text-primary" />
                            Milestone-to-Billing Schedule Preview (Turnkey Template)
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            These billing milestones will auto-generate upon project conversion, linking directly to the Client Contract.
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs font-mono font-bold text-emerald-400">
                          Total: 100% Billing
                        </Badge>
                      </div>

                      <div className="rounded-lg border overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-muted/50 text-muted-foreground border-b">
                            <tr>
                              <th className="p-2.5 font-medium">Milestone #</th>
                              <th className="p-2.5 font-medium">Stage & Description</th>
                              <th className="p-2.5 font-medium text-center">Contract Billing %</th>
                              <th className="p-2.5 font-medium text-right">Target Billing Value</th>
                              <th className="p-2.5 font-medium text-center">Initial Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {[
                              {
                                num: "M1",
                                stage: "Mobilization",
                                desc: "Mobilization Advance & Site Possession Handover",
                                pct: commercialForm.advancePercent,
                                status: "Ready to Bill",
                              },
                              {
                                num: "M2",
                                stage: "Substructure",
                                desc: "Plinth & Substructure Foundation Completion",
                                pct: 15,
                                status: "Pending",
                              },
                              {
                                num: "M3",
                                stage: "Superstructure",
                                desc: "Superstructure & Core RCC Works Slabs",
                                pct: 25,
                                status: "Pending",
                              },
                              {
                                num: "M4",
                                stage: "MEP Works",
                                desc: "MEP First-Fix & Internal Blockwork Partitions",
                                pct: 20,
                                status: "Pending",
                              },
                              {
                                num: "M5",
                                stage: "Finishes",
                                desc: "Flooring, Wall Finishes, Joinery & Painting",
                                pct: 20,
                                status: "Pending",
                              },
                              {
                                num: "M6",
                                stage: "Handover",
                                desc: "Testing, Commissioning, Virtual Completion & Handover",
                                pct: 10,
                                status: "Pending",
                              },
                            ].map((m) => {
                              const baseVal = latestBoq ? Number(latestBoq.grandTotal) : Number(lead.budgetEstimate || 0);
                              const expVal = (baseVal * m.pct) / 100;
                              return (
                                <tr key={m.num} className="hover:bg-muted/20">
                                  <td className="p-2.5 font-mono font-bold text-primary">{m.num}</td>
                                  <td className="p-2.5">
                                    <div className="font-medium text-foreground">{m.desc}</div>
                                    <Badge variant="outline" className="text-[10px] mt-0.5">{m.stage}</Badge>
                                  </td>
                                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{m.pct}%</td>
                                  <td className="p-2.5 text-right font-mono font-medium text-emerald-400">{INR(expVal)}</td>
                                  <td className="p-2.5 text-center">
                                    <Badge
                                      variant="outline"
                                      className={
                                        m.status === "Ready to Bill"
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                          : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                                      }
                                    >
                                      {m.status}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
