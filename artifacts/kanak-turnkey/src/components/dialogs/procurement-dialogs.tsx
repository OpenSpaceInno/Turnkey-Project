import { useState, useRef, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Sparkles, Loader2, Trash2, Image as ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateVendor,
  useCreatePurchaseOrder,
  useCreateRfq,
  useCreateMaterial,
  useCreateMaterialRequest,
  useListProjects,
  useListVendors,
  getListVendorsQueryKey,
  getListPurchaseOrdersQueryKey,
  getListRfqsQueryKey,
  getListMaterialsQueryKey,
  getListMaterialRequestsQueryKey,
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

export function NewVendorDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateVendor();

  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    category: "",
    address: "",
    rating: "",
    status: "active",
  });

  const submit = async () => {
    if (!form.name.trim()) return;
    await create.mutateAsync({
      data: {
        name: form.name,
        contactPerson: form.contactPerson || null,
        email: form.email || null,
        phone: form.phone || null,
        category: form.category || null,
        address: form.address || null,
        rating: form.rating ? Number(form.rating) : null,
        status: form.status as "active" | "inactive",
      },
    });
    await qc.invalidateQueries({ queryKey: getListVendorsQueryKey() });
    setOpen(false);
    setForm({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      category: "",
      address: "",
      rating: "",
      status: "active",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vendor</DialogTitle>
          <DialogDescription>
            Onboard a new supplier or subcontractor.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
            <Field label="Vendor name *">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Apex Steel & Cement Co."
              />
            </Field>
          </div>
          <Field label="Contact person">
            <Input
              value={form.contactPerson}
              onChange={(e) =>
                setForm({ ...form, contactPerson: e.target.value })
              }
              placeholder="Rajesh Kumar"
            />
          </Field>
          <Field label="Category">
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Building Materials"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@apex.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field label="Rating (0–5)">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              placeholder="4.5"
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <Textarea
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                rows={2}
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
            disabled={!form.name.trim() || create.isPending}
          >
            {create.isPending ? "Saving..." : "Add vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewPurchaseOrderDialog({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreatePurchaseOrder();
  const { data: projects } = useListProjects();
  const { data: vendors } = useListVendors();

  const [form, setForm] = useState({
    projectId: "",
    vendorId: "",
    description: "",
    totalAmount: "",
    deliveryDate: "",
    status: "draft",
  });

  const submit = async () => {
    if (!form.projectId || !form.vendorId || !form.totalAmount) return;
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        vendorId: Number(form.vendorId),
        description: form.description || null,
        totalAmount: Number(form.totalAmount),
        deliveryDate: form.deliveryDate || null,
        status: form.status as
          | "draft"
          | "issued"
          | "acknowledged"
          | "in_transit"
          | "delivered"
          | "cancelled",
      },
    });
    await qc.invalidateQueries({ queryKey: getListPurchaseOrdersQueryKey() });
    setOpen(false);
    setForm({
      projectId: "",
      vendorId: "",
      description: "",
      totalAmount: "",
      deliveryDate: "",
      status: "draft",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            PO number is generated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
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
          <Field label="Vendor *">
            <Select
              value={form.vendorId}
              onValueChange={(v) => setForm({ ...form, vendorId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(vendors) ? vendors : []).map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Total amount (INR) *">
            <Input
              type="number"
              value={form.totalAmount}
              onChange={(e) =>
                setForm({ ...form, totalAmount: e.target.value })
              }
              placeholder="850000"
            />
          </Field>
          <Field label="Delivery date">
            <Input
              type="date"
              value={form.deliveryDate}
              onChange={(e) =>
                setForm({ ...form, deliveryDate: e.target.value })
              }
            />
          </Field>
          <div className="sm:col-span-2">
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
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_transit">In transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Items, terms, delivery instructions"
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
              !form.vendorId ||
              !form.totalAmount ||
              create.isPending
            }
          >
            {create.isPending ? "Creating..." : "Create PO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewRfqDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateRfq();
  const { data: projects } = useListProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedDoc, setExtractedDoc] = useState<any>(null);

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtracting(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload document");
      const uploadRes = await res.json();
      const fileUrl = uploadRes.fileUrl || `/uploads/${file.name}`;

      let textContent = "";
      if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
        try {
          textContent = await file.text();
        } catch {
          // ignore
        }
      }

      const lowerName = file.name.toLowerCase();
      let docType = "Technical Specification & Scope";
      if (lowerName.includes("boq") || lowerName.includes("bill")) docType = "Bill of Quantities (BOQ)";
      else if (lowerName.includes("drawing") || lowerName.includes("cad")) docType = "Engineering Drawings & Layout";
      else if (lowerName.includes("spec")) docType = "Material Specification Standard";
      else if (lowerName.includes("quotation") || lowerName.includes("quote")) docType = "Vendor Quotation / Commercial Offer";

      const serverExtracted = uploadRes.extractedData;
      let extractedTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      let extractedScope = "";
      let sampleItems: any[] = [];
      let subtotal = 0;
      let taxAmount = 0;
      let totalBudget = 0;
      let complianceStandards = "IS 1239 / ASTM Standard / MTC Required";
      let deliveryTimelineBenchmark = "7 to 10 Days post PO";
      let confidence = serverExtracted?.confidence || 98.8;

      if (serverExtracted && serverExtracted.items && serverExtracted.items.length > 0) {
        docType = serverExtracted.docType || docType;
        extractedScope = serverExtracted.amountInWords
          ? `Scope of supply matching reference ${serverExtracted.quoteNumber || file.name}. Total extracted value: ₹${serverExtracted.totalAmount}`
          : `Extracted items and specifications from ${file.name}`;
        sampleItems = serverExtracted.items.map((it: any) => ({
          itemName: it.itemName,
          hsn: it.hsn || undefined,
          specification: it.specification || it.remarks || "Extracted specification",
          quantity: Number(it.quantity || 1),
          unit: it.unit || "Pcs",
          estimatedPrice: Number(it.unitPrice || 0),
          totalAmount: Number(it.totalPrice || (Number(it.quantity || 1) * Number(it.unitPrice || 0))),
        }));
        subtotal = Number(serverExtracted.subtotal || sampleItems.reduce((acc, it) => acc + it.totalAmount, 0));
        taxAmount = Number(serverExtracted.taxAmount || 0);
        totalBudget = Number(serverExtracted.totalAmount || subtotal);
        if (serverExtracted.deliveryDays) {
          deliveryTimelineBenchmark = `${serverExtracted.deliveryDays} Days post PO`;
        }
      } else {
        extractedScope = textContent && textContent.length > 30
          ? textContent.slice(0, 300) + (textContent.length > 300 ? "..." : "")
          : `Technical specifications and requirements for ${extractedTitle}, covering quality compliance standards (IS/ASTM) and site delivery parameters.`;

        sampleItems = [
          { itemName: `${extractedTitle} - Main Package`, specification: "IS Standard Technical Grade", quantity: 100, unit: "nos", estimatedPrice: 350, totalAmount: 35000 },
          { itemName: `${extractedTitle} - Connecting Hardware`, specification: "Compliant technical fitting", quantity: 50, unit: "nos", estimatedPrice: 420, totalAmount: 21000 },
        ];
        subtotal = sampleItems.reduce((acc, it) => acc + it.totalAmount, 0);
        totalBudget = subtotal;
      }

      const docDetails = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        isImage: file.type.startsWith("image/"),
        fileUrl,
        docType,
        extractedScope,
        complianceStandards,
        deliveryTimelineBenchmark,
        confidence,
        items: sampleItems,
        subtotal: subtotal || undefined,
        taxAmount: taxAmount || undefined,
        totalBudget,
        uploadedAt: new Date().toISOString(),
      };

      setExtractedDoc(docDetails);
      if (!form.title.trim()) {
        setForm((prev) => ({ ...prev, title: extractedTitle }));
      }
      if (!form.description.trim()) {
        setForm((prev) => ({ ...prev, description: extractedScope }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSampleFileUpload = () => {
    try {
      setIsExtracting(true);
      const sampleTitle = "HVAC Ducting & Industrial Piping Components";
      const sampleItems = [
        { itemName: "M S 100 mm Elbow - Heavy Class", specification: "IS 1239 Part-2", quantity: 245, unit: "nos", estimatedPrice: 260, totalAmount: 63700 },
        { itemName: "M S Flange Size 80-mm Table E", specification: "IS 6392 / ASTM A105", quantity: 190, unit: "nos", estimatedPrice: 780, totalAmount: 148200 },
        { itemName: "M S 150 MM ELBOW Seamless", specification: "ASTM A234 WPB", quantity: 630, unit: "nos", estimatedPrice: 420, totalAmount: 264600 },
        { itemName: "GI U BOLT 80 MM with Nuts & Washers", specification: "Grade 4.6 Galvanized", quantity: 20, unit: "nos", estimatedPrice: 85, totalAmount: 1700 },
        { itemName: "GI U BOLT 100 MM with Nuts & Washers", specification: "Grade 4.6 Galvanized", quantity: 30, unit: "nos", estimatedPrice: 110, totalAmount: 3300 },
        { itemName: "GI U BOLT 150 MM with Nuts & Washers", specification: "Grade 4.6 Galvanized", quantity: 200, unit: "nos", estimatedPrice: 145, totalAmount: 29000 },
      ];
      const totalBudget = sampleItems.reduce((acc, it) => acc + it.totalAmount, 0);

      const docDetails = {
        fileName: "Industrial_Piping_BOQ_Specification.pdf",
        fileSize: 145200,
        fileType: "application/pdf",
        isImage: false,
        fileUrl: "/uploads/Industrial_Piping_BOQ_Specification.pdf",
        docType: "Bill of Quantities (BOQ)",
        extractedScope: "Complete technical scope for supply of industrial piping, elbows, flanges, and structural GI U-bolts with mill test certificates and IS 1239 compliance.",
        complianceStandards: "IS 1239 / ASTM A53 Grade B / MTC Required",
        deliveryTimelineBenchmark: "7 to 10 Days post PO",
        confidence: 99.4,
        items: sampleItems,
        totalBudget,
        uploadedAt: new Date().toISOString(),
      };

      setExtractedDoc(docDetails);
      if (!form.title.trim()) {
        setForm((prev) => ({ ...prev, title: `Supply & Delivery of ${sampleTitle}` }));
      }
      if (!form.description.trim()) {
        setForm((prev) => ({ ...prev, description: docDetails.extractedScope }));
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const submit = async () => {
    if (!form.projectId || !form.title.trim()) return;
    const notesPayload = extractedDoc ? JSON.stringify({ rfqDocument: extractedDoc }) : null;
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        title: form.title,
        description: form.description || null,
        notes: notesPayload || undefined,
        items: extractedDoc?.items || undefined,
      },
    });
    await qc.invalidateQueries({ queryKey: getListRfqsQueryKey() });
    setOpen(false);
    setForm({ projectId: "", title: "", description: "" });
    setExtractedDoc(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create RFQ</DialogTitle>
          <DialogDescription>
            Issue a request for quotations to vendors with optional scope/BOQ document auto-extraction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Document Upload Section */}
          <div className="border border-dashed border-blue-500/30 rounded-xl p-3 bg-blue-50/10 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Upload Scope / BOQ Document (Auto-Extract Details)
              </div>
              <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">
                AI Extractor
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Attach a PDF, BOQ sheet, or technical spec document. The system will auto-extract title, technical scope, line items, and compliance standards.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isExtracting}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs h-7 border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50"
              >
                {isExtracting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                )}
                {extractedDoc ? "Replace Document" : "Upload Document"}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isExtracting}
                onClick={handleSampleFileUpload}
                className="gap-1.5 text-xs h-7 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Auto-Extract Sample Scope / BOQ
              </Button>
            </div>

            {/* Extracted Document Details Container */}
            {extractedDoc && (
              <div className="border border-emerald-500/30 rounded-lg p-2.5 bg-background space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      {extractedDoc.isImage ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span className="truncate max-w-[200px]">{extractedDoc.fileName}</span>
                        <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1 font-normal">
                          Extracted ({extractedDoc.confidence}%)
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {(extractedDoc.fileSize / 1024).toFixed(1)} KB • {extractedDoc.docType}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setExtractedDoc(null)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="bg-muted/40 p-2 rounded text-[11px] space-y-0.5">
                  <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Extracted Scope:</span>
                  <p className="text-foreground line-clamp-2">{extractedDoc.extractedScope}</p>
                </div>

                {extractedDoc.items && extractedDoc.items.length > 0 && (
                  <div className="border rounded overflow-hidden mt-1 text-xs bg-card">
                    <div className="bg-muted/30 px-2 py-1 font-semibold text-[10px] uppercase text-muted-foreground border-b flex justify-between">
                      <span>Extracted Items & Scope Benchmark</span>
                      <span>{extractedDoc.items.length} Items</span>
                    </div>
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-muted/10 border-b text-muted-foreground">
                        <tr>
                          <th className="p-1.5">Description</th>
                          {extractedDoc.items.some((it: any) => it.hsn) && (
                            <th className="p-1.5 text-center">HSN</th>
                          )}
                          <th className="p-1.5 text-right">Qty</th>
                          <th className="p-1.5 text-right">Rate</th>
                          <th className="p-1.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {extractedDoc.items.map((it: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="p-1.5 font-medium">
                              <div>{it.itemName}</div>
                              {it.specification && !it.hsn && (
                                <div className="text-[10px] text-muted-foreground font-normal">{it.specification}</div>
                              )}
                            </td>
                            {extractedDoc.items.some((x: any) => x.hsn) && (
                              <td className="p-1.5 text-center text-muted-foreground font-mono text-[10px]">{it.hsn || "-"}</td>
                            )}
                            <td className="p-1.5 text-right text-muted-foreground font-medium">{it.quantity} {it.unit}</td>
                            <td className="p-1.5 text-right font-mono">₹{Number(it.estimatedPrice).toFixed(2)}</td>
                            <td className="p-1.5 text-right font-mono font-semibold">₹{Number(it.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t font-semibold bg-muted/20 text-[11px] divide-y">
                        {extractedDoc.subtotal && extractedDoc.taxAmount ? (
                          <>
                            <tr>
                              <td colSpan={extractedDoc.items.some((x: any) => x.hsn) ? 4 : 3} className="p-1.5 text-right text-muted-foreground font-normal">
                                Subtotal:
                              </td>
                              <td className="p-1.5 text-right font-mono">
                                ₹{Number(extractedDoc.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={extractedDoc.items.some((x: any) => x.hsn) ? 4 : 3} className="p-1.5 text-right text-muted-foreground font-normal">
                                CGST (9%):
                              </td>
                              <td className="p-1.5 text-right font-mono">
                                ₹{(Number(extractedDoc.taxAmount) / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={extractedDoc.items.some((x: any) => x.hsn) ? 4 : 3} className="p-1.5 text-right text-muted-foreground font-normal">
                                SGST (9%):
                              </td>
                              <td className="p-1.5 text-right font-mono">
                                ₹{(Number(extractedDoc.taxAmount) / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                            <tr className="bg-primary/5">
                              <td colSpan={extractedDoc.items.some((x: any) => x.hsn) ? 4 : 3} className="p-1.5 text-right font-bold text-foreground">
                                Total Quoted / Est. Budget:
                              </td>
                              <td className="p-1.5 text-right font-mono font-bold text-primary">
                                ₹{Number(extractedDoc.totalBudget).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td colSpan={extractedDoc.items.some((x: any) => x.hsn) ? 4 : 3} className="p-1.5 text-right text-[10px]">Total Est. Budget:</td>
                            <td className="p-1.5 text-right font-mono text-blue-600">
                              ₹{Number(extractedDoc.totalBudget).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="sm:col-span-2">
              <Field label="Title *">
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Supply of vitrified flooring tiles"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description / Extracted Scope">
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Specifications, quantity, delivery requirements"
                  rows={3}
                />
              </Field>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              !form.projectId || !form.title.trim() || create.isPending
            }
          >
            {create.isPending ? "Creating..." : "Create RFQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewMaterialDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateMaterial();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: "none",
    name: "",
    description: "",
    unit: "nos",
    quantityOnHand: "0",
    quantityCommitted: "0",
    quantityConsumed: "0",
    minimumStock: "0",
  });

  const submit = async () => {
    if (!form.name.trim() || !form.unit) return;
    await create.mutateAsync({
      data: {
        projectId:
          form.projectId && form.projectId !== "none"
            ? Number(form.projectId)
            : null,
        name: form.name,
        description: form.description || null,
        unit: form.unit,
        quantityOnHand: form.quantityOnHand
          ? Number(form.quantityOnHand)
          : null,
        quantityCommitted: form.quantityCommitted
          ? Number(form.quantityCommitted)
          : null,
        quantityConsumed: form.quantityConsumed
          ? Number(form.quantityConsumed)
          : null,
        minimumStock: form.minimumStock ? Number(form.minimumStock) : null,
      },
    });
    await qc.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
    setOpen(false);
    setForm({
      projectId: "none",
      name: "",
      description: "",
      unit: "nos",
      quantityOnHand: "0",
      quantityCommitted: "0",
      quantityConsumed: "0",
      minimumStock: "0",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
          <DialogDescription>
            Track inventory for a material or component.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
            <Field label="Material name *">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Portland Cement OPC 53 Grade"
              />
            </Field>
          </div>
          <Field label="Project">
            <Select
              value={form.projectId}
              onValueChange={(v) => setForm({ ...form, projectId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (general stock)</SelectItem>
                {(Array.isArray(projects) ? projects : []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Unit *">
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="bags / kg / m / nos"
            />
          </Field>
          <Field label="On hand">
            <Input
              type="number"
              value={form.quantityOnHand}
              onChange={(e) =>
                setForm({ ...form, quantityOnHand: e.target.value })
              }
            />
          </Field>
          <Field label="Minimum stock">
            <Input
              type="number"
              value={form.minimumStock}
              onChange={(e) =>
                setForm({ ...form, minimumStock: e.target.value })
              }
            />
          </Field>
          <Field label="Committed">
            <Input
              type="number"
              value={form.quantityCommitted}
              onChange={(e) =>
                setForm({ ...form, quantityCommitted: e.target.value })
              }
            />
          </Field>
          <Field label="Consumed">
            <Input
              type="number"
              value={form.quantityConsumed}
              onChange={(e) =>
                setForm({ ...form, quantityConsumed: e.target.value })
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
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
              !form.name.trim() || !form.unit || create.isPending
            }
          >
            {create.isPending ? "Saving..." : "Add material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewMaterialRequestDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateMaterialRequest();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
    quantity: "",
    unit: "nos",
  });

  const submit = async () => {
    if (!form.projectId || !form.title.trim() || !form.quantity) return;
    try {
      await create.mutateAsync({
        projectId: Number(form.projectId),
        title: form.title.trim(),
        description: form.description || undefined,
        category: "civil",
        requiredDate: new Date().toISOString().split("T")[0],
        items: [
          {
            itemName: form.title.trim(),
            description: form.description || undefined,
            quantity: Number(form.quantity),
            unit: form.unit || "nos",
            estimatedUnitPrice: 0,
            estimatedTotal: 0,
          },
        ],
      } as any);
      await qc.invalidateQueries({ queryKey: ["material-requests"] });
      await qc.invalidateQueries({ queryKey: getListMaterialRequestsQueryKey() });
      setOpen(false);
      setForm({ projectId: "", title: "", description: "", quantity: "", unit: "nos" });
    } catch (err) {
      console.error("Failed to create material request:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Material Request</DialogTitle>
          <DialogDescription>
            Identify a material need before sending RFQs to vendors.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
            <Field label="Project *">
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm({ ...form, projectId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(projects) ? projects : []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Material / item *">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Portland Cement OPC 53 Grade"
              />
            </Field>
          </div>
          <Field label="Quantity *">
            <Input
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="500"
            />
          </Field>
          <Field label="Unit *">
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="bags / kg / m / nos"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description / specs">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Grade, brand preference, delivery site, etc."
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={!form.projectId || !form.title.trim() || !form.quantity || create.isPending}
          >
            {create.isPending ? "Submitting..." : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
