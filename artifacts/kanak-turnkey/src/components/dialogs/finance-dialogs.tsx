import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateExpense,
  useCreateInvoice,
  useCreateVendorInvoice,
  useCreateFinancialInstrument,
  useListProjects,
  useListVendors,
  useListPurchaseOrders,
  getListExpensesQueryKey,
  getListInvoicesQueryKey,
  getListVendorInvoicesQueryKey,
  getListFinancialInstrumentsQueryKey,
  getGetDashboardSummaryQueryKey,
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

const today = () => new Date().toISOString().slice(0, 10);

export function NewExpenseDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useCreateExpense();
  const { data: projects } = useListProjects();

  const [form, setForm] = useState({
    projectId: "",
    description: "",
    amount: "",
    category: "materials",
    expenseDate: today(),
    status: "submitted",
  });

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
          | "other",
        expenseDate: form.expenseDate,
        status: form.status as "draft" | "submitted" | "approved" | "rejected",
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
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="subcontractor">Subcontractor</SelectItem>
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
                  {projects?.map((p) => (
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
                {projects?.map((p) => (
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
                {vendors?.map((v) => (
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
                {pos?.map((p) => (
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
                {projects?.map((p) => (
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
