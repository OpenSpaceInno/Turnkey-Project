import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  useContracts,
  useContract,
  useWorkCompletions,
  useWorkCompletion,
  useCreateWorkflowRaBill,
  useSubmitWorkflowRaBill,
  useListProjects,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  FileText,
  ArrowLeft,
  Building,
  Upload,
  Paperclip,
  CheckCircle2,
  Trash2,
  AlertCircle,
  FileCheck,
  Calculator,
  Percent,
  Receipt,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

export default function RaBillNew() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryParams = new URLSearchParams(search);
  const initialContractId = queryParams.get("contractId") || "";
  const initialWcId = queryParams.get("workCompletionId") || "";

  const [projectId, setProjectId] = useState<string>("");
  const [contractId, setContractId] = useState<string>(initialContractId);
  const [workCompletionId, setWorkCompletionId] = useState<string>(initialWcId);

  const [description, setDescription] = useState("");
  const [milestone, setMilestone] = useState("");
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Financial parameters
  const [retentionPercent, setRetentionPercent] = useState<number>(5);
  const [advanceRecovery, setAdvanceRecovery] = useState<string>("0");
  const [tdsPercent, setTdsPercent] = useState<number>(2);
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [otherDeductions, setOtherDeductions] = useState<string>("0");
  const [deductionRemarks, setDeductionRemarks] = useState<string>("");

  // Line items state
  const [items, setItems] = useState<
    Array<{
      contractBoqItemId: number;
      itemNumber?: string;
      description: string;
      unit: string;
      rate: number;
      contractQuantity: number;
      previousBilledQty: number;
      currentBilledQty: string;
      verifiedCompletionQty?: number;
    }>
  >([]);

  // Documents state
  const [documents, setDocuments] = useState<
    Array<{
      documentType: string;
      fileName: string;
      fileUrl: string;
      fileSize?: number;
    }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: projects } = useListProjects();
  const { data: contracts } = useContracts(
    projectId ? { projectId: Number(projectId) } : undefined
  );
  const { data: selectedContract } = useContract(Number(contractId));
  const { data: workCompletions } = useWorkCompletions(
    contractId ? { contractId: Number(contractId), status: "verified" } : undefined
  );
  const { data: selectedWc } = useWorkCompletion(Number(workCompletionId));

  const createRaBill = useCreateWorkflowRaBill();
  const submitRaBill = useSubmitWorkflowRaBill();

  // If initial IDs set project and defaults
  useEffect(() => {
    if (selectedContract) {
      if (!projectId) setProjectId(String(selectedContract.projectId));
      setRetentionPercent(Number(selectedContract.retentionPercent || 5));
      setTdsPercent(Number(selectedContract.tdsPercent || 2));
      setGstPercent(Number(selectedContract.gstPercent || 18));
      if (!description) {
        setDescription(`Running Account Bill for ${selectedContract.title}`);
      }

      // Populate line items
      if (selectedContract.boqItems) {
        setItems(
          selectedContract.boqItems.map((boq) => ({
            contractBoqItemId: boq.id,
            itemNumber: boq.itemNumber,
            description: boq.description,
            unit: boq.unit,
            rate: boq.rate,
            contractQuantity: boq.quantity,
            previousBilledQty: boq.cumulativeBilledQty || 0,
            currentBilledQty: "",
          }))
        );
      }
    }
  }, [selectedContract]);

  // If a work completion is selected, populate current billed quantities from verified items
  useEffect(() => {
    if (selectedWc && selectedWc.items && items.length > 0) {
      if (!milestone && selectedWc.milestone) {
        setMilestone(selectedWc.milestone);
      }
      if (selectedWc.completionDate) {
        setBillingPeriodEnd(new Date(selectedWc.completionDate).toISOString().split("T")[0]);
      }

      const wcItemMap = new Map(
        selectedWc.items.map((i) => [i.contractBoqItemId, i.currentCompletedQty])
      );

      setItems((prev) =>
        prev.map((item) => {
          const verifiedQty = wcItemMap.get(item.contractBoqItemId);
          return {
            ...item,
            verifiedCompletionQty: verifiedQty !== undefined ? Number(verifiedQty) : undefined,
            currentBilledQty:
              verifiedQty !== undefined && verifiedQty > 0
                ? String(verifiedQty)
                : item.currentBilledQty,
          };
        })
      );
    }
  }, [selectedWc]);

  const handleContractChange = (val: string) => {
    setContractId(val);
    setWorkCompletionId("");
  };

  const handleQtyChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index].currentBilledQty = val;
    setItems(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      setDocuments((prev) => [
        ...prev,
        {
          documentType: docType,
          fileName: data.fileName || file.name,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize || file.size,
        },
      ]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload document");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeDoc = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const grossAmount = items.reduce((sum, item) => {
    const qty = Number(item.currentBilledQty) || 0;
    return sum + qty * item.rate;
  }, 0);

  const retentionAmount = (grossAmount * retentionPercent) / 100;
  const advanceAmount = Number(advanceRecovery) || 0;
  const tdsAmount = (grossAmount * tdsPercent) / 100;
  const gstAmount = (grossAmount * gstPercent) / 100;
  const otherAmount = Number(otherDeductions) || 0;

  const totalDeductions = retentionAmount + advanceAmount + tdsAmount + otherAmount;
  const netPayableAmount = Math.max(0, grossAmount + gstAmount - totalDeductions);

  const handleSubmit = async (submitNow: boolean) => {
    if (!projectId || !contractId || !description) {
      alert("Please fill in Project, Contract, and Description.");
      return;
    }

    const validItems = items
      .filter((i) => Number(i.currentBilledQty) > 0)
      .map((i) => ({
        contractBoqItemId: i.contractBoqItemId,
        currentBilledQty: Number(i.currentBilledQty),
      }));

    if (validItems.length === 0) {
      alert("Please enter current billed quantity for at least one BOQ item.");
      return;
    }

    try {
      const res: any = await createRaBill.mutateAsync({
        projectId: Number(projectId),
        contractId: Number(contractId),
        vendorId: selectedContract?.vendorId || 1,
        workCompletionId: workCompletionId ? Number(workCompletionId) : undefined,
        description,
        milestone: milestone || undefined,
        billingPeriodStart: billingPeriodStart || undefined,
        billingPeriodEnd: billingPeriodEnd || undefined,
        retentionPercent,
        advanceRecovery: advanceAmount,
        tdsPercent,
        gstPercent,
        otherDeductions: otherAmount,
        deductionRemarks: deductionRemarks || undefined,
        items: validItems,
        documents,
      });

      const raBillId = res.id;
      if (submitNow) {
        await submitRaBill.mutateAsync(raBillId);
      }

      setLocation(`/ra-bills/detail/${raBillId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create RA Bill");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/ra-bills">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 mb-2">
          Step 2 of Workflow: Calculate Billable Amount & Prepare RA Bill
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Prepare Running Account (RA) Bill</h1>
        <p className="text-sm text-muted-foreground">
          Compute gross billable amount from verified completion measurements, apply contract retention, advance recovery, TDS, and GST to derive net payable amount.
        </p>
      </div>

      {/* Contract & Source Completion Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" /> Contract & Completion Reference
          </CardTitle>
          <CardDescription className="text-xs">
            Link this RA Bill to a vendor contract and optionally load measurements directly from a verified work completion.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Project *</Label>
              <Select value={projectId} onValueChange={(val) => { setProjectId(val); setContractId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {(projects || []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Contract / Work Order *</Label>
              <Select value={contractId} onValueChange={handleContractChange} disabled={!projectId}>
                <SelectTrigger>
                  <SelectValue placeholder={!projectId ? "Select project first" : "Select contract"} />
                </SelectTrigger>
                <SelectContent>
                  {(contracts || []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.contractNumber} — {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Source Verified Work Completion</Label>
              <Select
                value={workCompletionId}
                onValueChange={setWorkCompletionId}
                disabled={!contractId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Standalone or Pick Completion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Standalone RA Bill --</SelectItem>
                  {(workCompletions || []).map((wc) => (
                    <SelectItem key={wc.id} value={String(wc.id)}>
                      {wc.workCompletionNumber} — {wc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedContract && (
            <div className="p-3 bg-muted/40 rounded-md border text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-muted-foreground">Contractor:</span>
                <p className="font-semibold text-foreground">{selectedContract.vendorName || "Vendor"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Contract Value:</span>
                <p className="font-semibold text-foreground">₹{(selectedContract.totalAmount || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Standard Retention:</span>
                <p className="font-semibold text-foreground">{selectedContract.retentionPercent}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Vendor GST:</span>
                <p className="font-semibold text-foreground">{selectedContract.vendorGst || "GST Registered"}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs font-medium">Milestone / Stage Reference</Label>
              <Input
                placeholder="e.g. 2nd RA Bill - Plinth Completion"
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Billing Period Start</Label>
              <Input
                type="date"
                value={billingPeriodStart}
                onChange={(e) => setBillingPeriodStart(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Billing Period End</Label>
              <Input
                type="date"
                value={billingPeriodEnd}
                onChange={(e) => setBillingPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Bill Description *</Label>
            <Input
              placeholder="e.g. Interim Certificate for Concrete & Masonry Works completed during month"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items Measurement & Billed Qty Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Itemized Bill of Quantities
            </CardTitle>
            <CardDescription className="text-xs">
              Previous billed quantities are preserved. Enter current billed quantities to calculate line item totals.
            </CardDescription>
          </div>
          {grossAmount > 0 && (
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground uppercase font-medium">Gross Current Billed:</span>
              <p className="text-lg font-bold text-foreground">₹{grossAmount.toLocaleString()}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {!contractId ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Please select a project and contract above to display billable items.
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No BOQ items found on this contract.
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-2.5 w-12">#</th>
                    <th className="p-2.5">Scope Description</th>
                    <th className="p-2.5 w-16">Unit</th>
                    <th className="p-2.5 w-20 text-right">Rate (₹)</th>
                    <th className="p-2.5 w-24 text-right">Agreed Qty</th>
                    <th className="p-2.5 w-24 text-right">Prev Billed</th>
                    <th className="p-2.5 w-28">Current Billed Qty *</th>
                    <th className="p-2.5 w-24 text-right">Cumulative</th>
                    <th className="p-2.5 w-28 text-right font-bold">Current Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, idx) => {
                    const curQty = Number(item.currentBilledQty) || 0;
                    const cumQty = item.previousBilledQty + curQty;
                    const curValue = curQty * item.rate;

                    return (
                      <tr key={item.contractBoqItemId} className="hover:bg-accent/20">
                        <td className="p-2.5 font-mono text-muted-foreground">{item.itemNumber || idx + 1}</td>
                        <td className="p-2.5 font-medium">{item.description}</td>
                        <td className="p-2.5 text-muted-foreground">{item.unit}</td>
                        <td className="p-2.5 text-right">₹{item.rate.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-muted-foreground">{item.contractQuantity}</td>
                        <td className="p-2.5 text-right text-muted-foreground">{item.previousBilledQty}</td>
                        <td className="p-2.5">
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.currentBilledQty}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            className="h-7 text-xs font-bold text-foreground"
                          />
                          {item.verifiedCompletionQty !== undefined && (
                            <span className="text-[10px] text-blue-600 block mt-0.5">
                              Verified in WC: {item.verifiedCompletionQty}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-blue-600">{cumQty}</td>
                        <td className="p-2.5 text-right font-bold text-foreground">
                          {curValue > 0 ? `₹${curValue.toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Calculations Card */}
      <Card className="border shadow-sm bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Deductions, Taxes & Net Payable Calculation
          </CardTitle>
          <CardDescription className="text-xs">
            Automatic calculation of retention, statutory TDS, advance recovery, and GST.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Controls */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Retention %</Label>
                  <Input
                    type="number"
                    value={retentionPercent}
                    onChange={(e) => setRetentionPercent(Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Advance Recovery (₹)</Label>
                  <Input
                    type="number"
                    value={advanceRecovery}
                    onChange={(e) => setAdvanceRecovery(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">TDS %</Label>
                  <Input
                    type="number"
                    value={tdsPercent}
                    onChange={(e) => setTdsPercent(Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">GST %</Label>
                  <Input
                    type="number"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Other Deductions (₹)</Label>
                  <Input
                    type="number"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Deduction Reason / Notes</Label>
                  <Input
                    placeholder="e.g. Safety penalty, power charges"
                    value={deductionRemarks}
                    onChange={(e) => setDeductionRemarks(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Breakdown Abstract Sheet */}
            <div className="p-4 bg-muted/40 rounded-lg border space-y-2.5 text-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground pb-1 border-b">
                Financial Abstract Breakdown
              </h4>

              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Gross Measured Amount:</span>
                <span className="font-semibold text-foreground">₹{grossAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-emerald-600">
                <span>(+) GST ({gstPercent}%):</span>
                <span className="font-semibold">+ ₹{gstAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-amber-600">
                <span>(-) Retention ({retentionPercent}%):</span>
                <span className="font-semibold">- ₹{retentionAmount.toLocaleString()}</span>
              </div>

              {advanceAmount > 0 && (
                <div className="flex justify-between py-1 text-amber-600">
                  <span>(-) Advance Recovery:</span>
                  <span className="font-semibold">- ₹{advanceAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between py-1 text-amber-600">
                <span>(-) TDS ({tdsPercent}%):</span>
                <span className="font-semibold">- ₹{tdsAmount.toLocaleString()}</span>
              </div>

              {otherAmount > 0 && (
                <div className="flex justify-between py-1 text-amber-600">
                  <span>(-) Other Deductions:</span>
                  <span className="font-semibold">- ₹{otherAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t flex justify-between items-center text-sm font-bold">
                <span className="text-foreground">Net Payable Amount:</span>
                <span className="text-xl text-primary font-black">
                  ₹{netPayableAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Documents Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-primary" /> Attach Supporting RA Documents
          </CardTitle>
          <CardDescription className="text-xs">
            Attach measurement abstract sheets, joint inspection reports, and vendor tax invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: "abstract_sheet", label: "Measurement Abstract Sheet" },
              { type: "tax_invoice", label: "Vendor Tax Invoice Copy" },
              { type: "joint_inspection", label: "Joint Inspection Sign-off" },
              { type: "other", label: "Other Documents" },
            ].map((cat) => (
              <label
                key={cat.type}
                className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-accent/40 transition-colors flex flex-col items-center justify-center gap-1.5"
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{cat.label}</span>
                <span className="text-[10px] text-muted-foreground">PDF, Excel, Scan</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, cat.type)}
                  disabled={isUploading}
                />
              </label>
            ))}
          </div>

          {isUploading && (
            <p className="text-xs text-blue-600 animate-pulse">Uploading file to server...</p>
          )}

          {documents.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold">Attached RA Documents ({documents.length})</Label>
              <div className="divide-y border rounded-md bg-card">
                {documents.map((doc, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {doc.fileName}
                        </a>
                        <span className="text-muted-foreground text-[10px] block uppercase">
                          Type: {doc.documentType.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDoc(idx)}
                      className="text-destructive h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/ra-bills">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={createRaBill.isPending}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={createRaBill.isPending || submitRaBill.isPending}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <CheckCircle2 className="w-4 h-4" /> Submit for PM Approval
          </Button>
        </div>
      </div>
    </div>
  );
}
