import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateRaBill,
  useUpdateInvoice,
  useUpdateVendorInvoice,
  useCreateInvoice,
  getListRaBillsQueryKey,
  getListInvoicesQueryKey,
  getListVendorInvoicesQueryKey,
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
import { AlertCircle, CheckCircle2, FileText, DollarSign, Loader2 } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ── 1. Raise Discrepancy Dialog (Vendor Invoices) ──
export function RaiseDiscrepancyDialog({
  invoiceId,
  currentNotes,
  trigger,
}: {
  invoiceId: number;
  currentNotes?: string | null;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(currentNotes || "");
  const qc = useQueryClient();
  const update = useUpdateVendorInvoice();

  const submit = async () => {
    if (!notes.trim()) return;
    await update.mutateAsync({
      id: invoiceId,
      data: {
        status: "discrepancy",
        discrepancyNotes: notes.trim(),
      },
    });
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListVendorInvoicesQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-5 h-5" /> Raise PO / Invoice Discrepancy
          </DialogTitle>
          <DialogDescription>
            Flag price, quantity, or line-item mismatch with Purchase Order.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <Field label="Discrepancy Details & Notes *">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Unit price quoted ₹450/bag on PO, but invoiced at ₹520/bag. Pending vendor credit note."
              rows={4}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={!notes.trim() || update.isPending}
          >
            {update.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            Flag Discrepancy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 2. Record Payment Dialog (Client or Vendor Invoices) ──
export function RecordPaymentDialog({
  type,
  id,
  invoiceNumber,
  amount,
  trigger,
}: {
  type: "client" | "vendor";
  id: number;
  invoiceNumber: string;
  amount: string | number;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(today());
  const qc = useQueryClient();
  const updateClient = useUpdateInvoice();
  const updateVendor = useUpdateVendorInvoice();

  const submit = async () => {
    if (type === "client") {
      await updateClient.mutateAsync({
        id,
        data: {
          status: "paid",
          paymentDate,
        },
      });
      await qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
    } else {
      await updateVendor.mutateAsync({
        id,
        data: {
          status: "paid",
          paymentDate,
        },
      });
      await qc.invalidateQueries({ queryKey: getListVendorInvoicesQueryKey() });
    }
    await qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    setOpen(false);
  };

  const isPending = updateClient.isPending || updateVendor.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <DollarSign className="w-5 h-5" /> Record Payment
          </DialogTitle>
          <DialogDescription>
            Confirm payment received/processed for Invoice #{invoiceNumber}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="p-3 bg-muted/60 rounded-md space-y-1">
            <div className="text-xs text-muted-foreground uppercase font-medium">
              Invoice Amount
            </div>
            <div className="text-xl font-bold text-foreground">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(Number(amount))}
            </div>
          </div>
          <Field label="Payment Date *">
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={submit}
            disabled={!paymentDate || isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-1" />
            )}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 3. Generate Client Invoice from Approved RA Bill ──
export function GenerateInvoiceFromRaBillDialog({
  raBill,
  trigger,
}: {
  raBill: {
    id: number;
    projectId: number;
    billNumber: string;
    amount: string | number;
    milestone?: string | null;
    description?: string | null;
    documentUrl?: string | null;
    projectName?: string | null;
  };
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState(
    raBill.projectName ? `${raBill.projectName} Client` : "Project Client"
  );
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const qc = useQueryClient();
  const createInvoice = useCreateInvoice();
  const updateRaBill = useUpdateRaBill();

  const submit = async () => {
    if (!clientName.trim()) return;

    // 1. Create client invoice
    await createInvoice.mutateAsync({
      data: {
        projectId: raBill.projectId,
        clientName: clientName.trim(),
        amount: Number(raBill.amount),
        invoiceDate,
        dueDate,
        status: "sent",
        documentUrl: raBill.documentUrl || null,
      },
    });

    // 2. Mark RA Bill as invoiced
    await updateRaBill.mutateAsync({
      id: raBill.id,
      data: {
        status: "invoiced",
      },
    });

    await Promise.all([
      qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() }),
      qc.invalidateQueries({ queryKey: getListRaBillsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);

    setOpen(false);
  };

  const isPending = createInvoice.isPending || updateRaBill.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FileText className="w-5 h-5" /> Generate Client Invoice
          </DialogTitle>
          <DialogDescription>
            Convert approved RA Bill ({raBill.billNumber}) into a formal Client Invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="p-3 bg-muted/60 rounded-md space-y-1">
            <div className="text-xs text-muted-foreground uppercase font-medium">
              Bill Amount
            </div>
            <div className="text-xl font-bold text-foreground">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(Number(raBill.amount))}
            </div>
            {raBill.milestone && (
              <div className="text-xs text-muted-foreground">
                Milestone: {raBill.milestone}
              </div>
            )}
          </div>

          <Field label="Client Name *">
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Infra Pvt Ltd"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Invoice Date *">
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </Field>
            <Field label="Payment Due Date *">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
            disabled={!clientName.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            Generate & Issue Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
