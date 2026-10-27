import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateExpense,
  useCreateInvoice,
  useCreateVendorInvoice,
  useCreateFinancialInstrument,
  useRenewFinancialInstrument,
  useReleaseFinancialInstrument,
  useCreateRaBill,
  useListProjects,
  useListVendors,
  useListPurchaseOrders,
  getListExpensesQueryKey,
  getListInvoicesQueryKey,
  getListVendorInvoicesQueryKey,
  getListFinancialInstrumentsQueryKey,
  getExpiringFinancialInstrumentsAlertsQueryKey,
  getListRaBillsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import {
  FileText,
  Upload,
  Paperclip,
  CheckCircle2,
  Loader2,
  ExternalLink,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  Calendar,
} from "lucide-react";
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

const today = () => new Date().toISOString().slice(0, 10);

export function NewExpenseDialog({
  trigger,
  defaultProjectId,
}: {
  trigger: ReactNode;
  defaultProjectId?: number;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateExpense();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: defaultProjectId ? String(defaultProjectId) : "",
    description: "",
    amount: "",
    category: "materials",
    expenseDate: today(),
    status: "submitted",
    receiptUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, receiptUrl: data.fileUrl }));
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.projectId || !form.description || !form.amount) return;
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        description: form.description,
        amount: Number(form.amount),
        category: form.category as
          | "materials"
          | "labor"
          | "equipment"
          | "subcontractor"
          | "fuel"
          | "transport"
          | "food"
          | "hardware"
          | "other",
        expenseDate: form.expenseDate,
        status: form.status as "draft" | "submitted" | "approved" | "rejected",
        receiptUrl: form.receiptUrl || null,
      },
    });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListExpensesQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
    setOpen(false);
    setForm({
      projectId: "",
      description: "",
      amount: "",
      category: "materials",
      expenseDate: today(),
      status: "submitted",
      receiptUrl: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
          <DialogDescription>
            Log a project-related expense for approval.
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
          <Field label="Category">
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="subcontractor">Subcontractor</SelectItem>
                <SelectItem value="fuel">Fuel</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description *">
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Cement and TMT bar delivery — Floor 4"
              />
            </Field>
          </div>
          <Field label="Amount (INR) *">
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="125000"
            />
          </Field>
          <Field label="Expense date">
            <Input
              type="date"
              value={form.expenseDate}
              onChange={(e) =>
                setForm({ ...form, expenseDate: e.target.value })
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Upload Cash Bill / Receipt">
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="cursor-pointer text-xs"
                />
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                {form.receiptUrl && !uploading && (
                  <a
                    href={form.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline bg-blue-50 px-2.5 py-1.5 rounded border border-blue-200 shrink-0"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> Attached Bill <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
              </div>
            </Field>
          </div>
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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
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
              !form.description ||
              !form.amount ||
              create.isPending
            }
          >
            {create.isPending ? "Saving..." : "Record expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewInvoiceDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateInvoice();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: "",
    clientName: "",
    amount: "",
    invoiceDate: today(),
    dueDate: "",
    status: "draft",
  });

  const submit = async () => {
    if (
      !form.projectId ||
      !form.clientName ||
      !form.amount ||
      !form.invoiceDate ||
      !form.dueDate
    )
      return;
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        clientName: form.clientName,
        amount: Number(form.amount),
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        status: form.status as "draft" | "sent" | "paid" | "overdue",
      },
    });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
    setOpen(false);
    setForm({
      projectId: "",
      clientName: "",
      amount: "",
      invoiceDate: today(),
      dueDate: "",
      status: "draft",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Client Invoice</DialogTitle>
          <DialogDescription>
            Invoice number is generated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
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
          </div>
          <div className="sm:col-span-2">
            <Field label="Client name *">
              <Input
                value={form.clientName}
                onChange={(e) =>
                  setForm({ ...form, clientName: e.target.value })
                }
                placeholder="Sentinel Realty"
              />
            </Field>
          </div>
          <Field label="Amount (INR) *">
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="2400000"
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
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Invoice date *">
            <Input
              type="date"
              value={form.invoiceDate}
              onChange={(e) =>
                setForm({ ...form, invoiceDate: e.target.value })
              }
            />
          </Field>
          <Field label="Due date *">
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              !form.projectId ||
              !form.clientName ||
              !form.amount ||
              !form.dueDate ||
              create.isPending
            }
          >
            {create.isPending ? "Creating..." : "Create invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewVendorInvoiceDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateVendorInvoice();
  const { data: projects } = useListProjects();
  const { data: vendors } = useListVendors();
  const { data: pos } = useListPurchaseOrders();

  const [form, setForm] = useState({
    projectId: "",
    vendorId: "",
    purchaseOrderId: "none",
    amount: "",
    status: "received",
  });

  const submit = async () => {
    if (!form.projectId || !form.vendorId || !form.amount) return;
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        vendorId: Number(form.vendorId),
        purchaseOrderId:
          form.purchaseOrderId && form.purchaseOrderId !== "none"
            ? Number(form.purchaseOrderId)
            : null,
        amount: Number(form.amount),
        status: form.status as
          | "received"
          | "matched"
          | "discrepancy"
          | "approved"
          | "scheduled"
          | "paid",
      },
    });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListVendorInvoicesQueryKey() }),
    ]);
    setOpen(false);
    setForm({
      projectId: "",
      vendorId: "",
      purchaseOrderId: "none",
      amount: "",
      status: "received",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Vendor Invoice</DialogTitle>
          <DialogDescription>
            Record an invoice received from a vendor or supplier.
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
          <Field label="Linked PO">
            <Select
              value={form.purchaseOrderId}
              onValueChange={(v) =>
                setForm({ ...form, purchaseOrderId: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(Array.isArray(pos) ? pos : []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.poNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Amount (INR) *">
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="450000"
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
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="discrepancy">Discrepancy</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
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
              !form.amount ||
              create.isPending
            }
          >
            {create.isPending ? "Saving..." : "Add invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewFinancialInstrumentDialog({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateFinancialInstrument();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: "none",
    instrumentType: "bank_guarantee",
    bgSubType: "none",
    amount: "",
    issueDate: today(),
    expiryDate: "",
    bankName: "",
    referenceNumber: "",
    retentionPercent: "",
    status: "active",
    notes: "",
  });

  const submit = async () => {
    if (!form.amount || !form.instrumentType) return;
    await create.mutateAsync({
      data: {
        projectId:
          form.projectId && form.projectId !== "none"
            ? Number(form.projectId)
            : null,
        instrumentType: form.instrumentType as
          | "emd"
          | "bank_guarantee"
          | "retention_dlp",
        bgSubType:
          form.bgSubType === "none" || !form.bgSubType
            ? null
            : (form.bgSubType as
                | "performance"
                | "advance_payment"
                | "bid_bond"),
        amount: Number(form.amount),
        issueDate: form.issueDate || null,
        expiryDate: form.expiryDate || null,
        bankName: form.bankName || null,
        referenceNumber: form.referenceNumber || null,
        retentionPercent: form.retentionPercent
          ? Number(form.retentionPercent)
          : null,
        status: form.status as
          | "active"
          | "released"
          | "expired"
          | "forfeited"
          | "overdue",
        notes: form.notes || null,
      },
    });
    await Promise.all([
      qc.invalidateQueries({
        queryKey: getListFinancialInstrumentsQueryKey(),
      }),
    ]);
    setOpen(false);
    setForm({
      projectId: "none",
      instrumentType: "bank_guarantee",
      bgSubType: "none",
      amount: "",
      issueDate: today(),
      expiryDate: "",
      bankName: "",
      referenceNumber: "",
      retentionPercent: "",
      status: "active",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Financial Instrument</DialogTitle>
          <DialogDescription>
            Track EMDs, bank guarantees, and retention amounts.
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
                <SelectItem value="none">None</SelectItem>
                {(Array.isArray(projects) ? projects : []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Instrument type *">
            <Select
              value={form.instrumentType}
              onValueChange={(v) => setForm({ ...form, instrumentType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emd">EMD</SelectItem>
                <SelectItem value="bank_guarantee">Bank Guarantee</SelectItem>
                <SelectItem value="retention_dlp">Retention / DLP</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {form.instrumentType === "bank_guarantee" && (
            <Field label="BG sub-type">
              <Select
                value={form.bgSubType}
                onValueChange={(v) => setForm({ ...form, bgSubType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="advance_payment">
                    Advance Payment
                  </SelectItem>
                  <SelectItem value="bid_bond">Bid Bond</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Amount (INR) *">
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="500000"
            />
          </Field>
          <Field label="Bank name">
            <Input
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              placeholder="HDFC Bank"
            />
          </Field>
          <Field label="Reference number">
            <Input
              value={form.referenceNumber}
              onChange={(e) =>
                setForm({ ...form, referenceNumber: e.target.value })
              }
              placeholder="BG-2025-0042"
            />
          </Field>
          <Field label="Issue date">
            <Input
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
            />
          </Field>
          <Field label="Expiry date">
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm({ ...form, expiryDate: e.target.value })
              }
            />
          </Field>
          <Field label="Retention %">
            <Input
              type="number"
              step="0.01"
              value={form.retentionPercent}
              onChange={(e) =>
                setForm({ ...form, retentionPercent: e.target.value })
              }
              placeholder="5"
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
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="forfeited">Forfeited</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
            disabled={!form.amount || create.isPending}
          >
            {create.isPending ? "Saving..." : "Add instrument"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewRaBillDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateRaBill();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: "",
    billNumber: "",
    milestone: "",
    description: "",
    amount: "",
    status: "draft",
    documentUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, documentUrl: data.fileUrl }));
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.projectId || !form.amount) return;
    await create.mutateAsync({
      data: {
        projectId: Number(form.projectId),
        billNumber: form.billNumber || undefined,
        milestone: form.milestone || null,
        description: form.description || null,
        amount: Number(form.amount),
        status: form.status,
        documentUrl: form.documentUrl || null,
      },
    });
    await qc.invalidateQueries({ queryKey: getListRaBillsQueryKey() });
    setOpen(false);
    setForm({
      projectId: "",
      billNumber: "",
      milestone: "",
      description: "",
      amount: "",
      status: "draft",
      documentUrl: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Record RA Bill (Running Account Bill)</DialogTitle>
          <DialogDescription>
            Record contractor or client RA bill and attach supporting documents.
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
          <Field label="Bill Number">
            <Input
              value={form.billNumber}
              onChange={(e) => setForm({ ...form, billNumber: e.target.value })}
              placeholder="Auto-generated if empty"
            />
          </Field>
          <Field label="Milestone / Work Stage">
            <Input
              value={form.milestone}
              onChange={(e) => setForm({ ...form, milestone: e.target.value })}
              placeholder="e.g. 5th Floor Slab Concreting"
            />
          </Field>
          <Field label="Bill Amount (INR) *">
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="1500000"
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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description / Scope">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Details of certified work and measurements"
                rows={2}
              />
            </Field>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Attach Bill Document
            </Label>
            <div className="flex items-center gap-3 border rounded-md p-3 bg-muted/20">
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="text-xs"
              />
              {uploading && (
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </div>
              )}
            </div>
            {form.documentUrl && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200 mt-1 font-medium">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Bill document attached successfully</span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!form.projectId || !form.amount || create.isPending || uploading}
          >
            {create.isPending ? "Saving..." : "Record RA Bill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RenewFinancialInstrumentDialog({
  instrument,
  trigger,
}: {
  instrument: {
    id: number;
    instrumentNumber: string;
    instrumentType: string;
    bgSubType?: string | null;
    amount: number | string;
    bankName?: string | null;
    expiryDate?: string | null;
    projectName?: string | null;
  };
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const renew = useRenewFinancialInstrument();
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState(
    instrument.instrumentNumber || ""
  );
  const [renewalCharges, setRenewalCharges] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async () => {
    if (!newExpiryDate) return;
    await renew.mutateAsync({
      id: instrument.id,
      newExpiryDate,
      referenceNumber: referenceNumber || undefined,
      renewalCharges: renewalCharges ? Number(renewalCharges) : undefined,
      notes: notes || undefined,
    });
    setOpen(false);
    setNewExpiryDate("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-600" /> Extend / Renew Instrument
          </DialogTitle>
          <DialogDescription className="text-xs">
            Extend validity for bank guarantee #{instrument.instrumentNumber} ({instrument.projectName || "General"})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issuing Bank:</span>
              <span className="font-semibold text-foreground">{instrument.bankName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Expiry:</span>
              <span className="font-mono font-medium text-amber-600">
                {instrument.expiryDate ? new Date(instrument.expiryDate).toLocaleDateString("en-IN") : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guarantee Amount:</span>
              <span className="font-mono font-bold text-foreground">
                ₹{Number(instrument.amount || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <Field label="New Expiry Date *">
            <Input
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              className="text-xs"
              required
            />
          </Field>

          <Field label="Bank Endorsement / Renewal Ref No.">
            <Input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. ICICI/EXT/2026/889"
              className="text-xs"
            />
          </Field>

          <Field label="Bank Renewal Charges (₹, optional)">
            <Input
              type="number"
              value={renewalCharges}
              onChange={(e) => setRenewalCharges(e.target.value)}
              placeholder="0"
              className="text-xs"
            />
          </Field>

          <Field label="Renewal Notes / Justification">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Extension granted as per milestone extension amendment #2"
              className="text-xs h-20"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={!newExpiryDate || renew.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
          >
            {renew.isPending ? "Updating..." : "Confirm Extension"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReleaseFinancialInstrumentDialog({
  instrument,
  trigger,
}: {
  instrument: {
    id: number;
    instrumentNumber: string;
    instrumentType: string;
    bgSubType?: string | null;
    amount: number | string;
    bankName?: string | null;
    expiryDate?: string | null;
    projectName?: string | null;
  };
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const release = useReleaseFinancialInstrument();
  const [releaseDate, setReleaseDate] = useState(today());
  const [releaseReference, setReleaseReference] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async () => {
    await release.mutateAsync({
      id: instrument.id,
      releaseDate,
      releaseReference: releaseReference || undefined,
      notes: notes || undefined,
    });
    setOpen(false);
    setNotes("");
    setReleaseReference("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" /> Release / Discharge Guarantee
          </DialogTitle>
          <DialogDescription className="text-xs">
            Formally discharge security #{instrument.instrumentNumber} upon milestone completion or DLP expiry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project:</span>
              <span className="font-semibold text-foreground">{instrument.projectName || "General"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issuing Bank:</span>
              <span className="font-medium text-foreground">{instrument.bankName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guarantee Amount:</span>
              <span className="font-mono font-bold text-foreground">
                ₹{Number(instrument.amount || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <Field label="Release Date *">
            <Input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="text-xs"
              required
            />
          </Field>

          <Field label="Client Discharge / No-Claim Letter Ref">
            <Input
              value={releaseReference}
              onChange={(e) => setReleaseReference(e.target.value)}
              placeholder="e.g. NOC-SGH-2026-FINAL"
              className="text-xs"
            />
          </Field>

          <Field label="Discharge Remarks">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Final defect liability certificate issued; original BG returned to issuing bank for cancellation"
              className="text-xs h-20"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={!releaseDate || release.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {release.isPending ? "Discharging..." : "Confirm Release"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
