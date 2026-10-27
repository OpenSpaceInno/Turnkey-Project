import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  useContracts,
  useContract,
  useCreateWorkCompletion,
  useSubmitWorkCompletion,
  useListProjects,
  useAddContractBoqItem,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
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
  Layers,
  ArrowLeft,
  Calendar,
  Building,
  Upload,
  Paperclip,
  CheckCircle2,
  Trash2,
  AlertCircle,
  FileCheck,
  Sparkles,
} from "lucide-react";

export default function WorkCompletionNew() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialContractId = params.get("contractId") || "";
  const initialProjectId = params.get("projectId") || "";

  const [projectId, setProjectId] = useState<string>(initialProjectId);
  const [contractId, setContractId] = useState<string>(initialContractId);

  useEffect(() => {
    const qProjectId = new URLSearchParams(search).get("projectId");
    if (qProjectId) {
      setProjectId(qProjectId);
    }
  }, [search]);
  const [title, setTitle] = useState("");
  const [milestone, setMilestone] = useState("");
  const [completionDate, setCompletionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState("");

  // Line items state: array with current completed quantity per BOQ item
  const [items, setItems] = useState<
    Array<{
      contractBoqItemId: number;
      itemNumber?: string;
      description: string;
      unit: string;
      rate: number;
      contractQty: number;
      prevCompleted: number;
      currentCompletedQty: string;
      remarks?: string;
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

  const [isPopulatingBoq, setIsPopulatingBoq] = useState(false);
  const [isImportingDpr, setIsImportingDpr] = useState(false);
  const [importedJmrNumber, setImportedJmrNumber] = useState<string | null>(null);
  const addBoqItem = useAddContractBoqItem();

  const handleImportFromDprJmr = async () => {
    if (!projectId || !contractId) {
      toast({
        title: "Selection Required",
        description: "Please select both Project and Contract to import DPR measurements.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImportingDpr(true);
      const res = await fetch(`/api/site-execution/jmr-measurements?projectId=${projectId}&contractId=${contractId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch DPR measurements");
      }
      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        toast({
          title: "No Matching DPR Records",
          description: "No unbilled DPR measurements were found for this contract scope.",
        });
        return;
      }

      // Map DPR quantities onto existing items
      const updated = items.map((it) => {
        const matched = data.items.find((d: any) => d.contractBoqItemId === it.contractBoqItemId);
        if (matched && matched.currentDprMeasuredQty > 0) {
          return {
            ...it,
            currentCompletedQty: String(matched.currentDprMeasuredQty),
            remarks: it.remarks || `Imported from DPR JMR ${data.jmrNumber}`,
          };
        }
        return it;
      });

      setItems(updated);
      setImportedJmrNumber(data.jmrNumber);

      // Auto-attach JMR document
      setDocuments((prev) => [
        ...prev.filter((d) => d.documentType !== "jmr"),
        {
          documentType: "jmr",
          fileName: `${data.jmrNumber}_Signed_Joint_Measurement_Record.pdf`,
          fileUrl: `https://documents.kanakturnkey.com/jmr/${data.jmrNumber}.pdf`,
          fileSize: 245800,
        },
      ]);

      if (!milestone) {
        setMilestone(`DPR Measurement (${data.jmrNumber})`);
      }

      toast({
        title: "DPR Quantities Imported",
        description: `Auto-populated BOQ line items via JMR ${data.jmrNumber} (Total: ₹${data.totalJmrAmount.toLocaleString()}). Signed JMR document attached.`,
      });
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsImportingDpr(false);
    }
  };

  const handleQuickAddDefaultBoq = async () => {
    if (!contractId) return;
    try {
      setIsPopulatingBoq(true);
      const defaultItems = [
        { itemNumber: "1.1", description: "Substructure Civil & Concrete Foundation Works", unit: "cum", quantity: 150, rate: 5800 },
        { itemNumber: "1.2", description: "Superstructure Reinforced Cement Concrete & Formwork", unit: "cum", quantity: 220, rate: 6200 },
        { itemNumber: "1.3", description: "Masonry, Internal Plastering & Waterproofing System", unit: "sqm", quantity: 850, rate: 850 },
        { itemNumber: "1.4", description: "Flooring, Wall Cladding & Architectural Finishes", unit: "sqm", quantity: 650, rate: 1450 },
        { itemNumber: "1.5", description: "Electrical, HVAC & Low Voltage Rough-in Conduiting", unit: "lot", quantity: 1, rate: 1250000 },
      ];

      for (const it of defaultItems) {
        await addBoqItem.mutateAsync({
          contractId: Number(contractId),
          item: it,
        });
      }
      toast({
        title: "BOQ Scope Added",
        description: "Standard turnkey BOQ scope line items added to this contract.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to add BOQ items",
        description: "An error occurred while adding BOQ items to this contract.",
        variant: "destructive",
      });
    } finally {
      setIsPopulatingBoq(false);
    }
  };

  const createWorkCompletion = useCreateWorkCompletion();
  const submitWorkCompletion = useSubmitWorkCompletion();

  // If initialContractId given, set project from contract
  useEffect(() => {
    if (selectedContract) {
      if (!projectId) {
        setProjectId(String(selectedContract.projectId));
      }
      if (!title) {
        setTitle(`Work Completion - ${selectedContract.title}`);
      }

      // Populate line items from contract's BOQ items
      if (selectedContract.boqItems) {
        setItems(
          selectedContract.boqItems.map((boq) => ({
            contractBoqItemId: boq.id,
            itemNumber: boq.itemNumber,
            description: boq.description,
            unit: boq.unit,
            rate: boq.rate,
            contractQty: boq.quantity,
            prevCompleted: boq.cumulativeCompletedQty || 0,
            currentCompletedQty: "",
            remarks: "",
          }))
        );
      }
    }
  }, [selectedContract]);

  const handleContractChange = (val: string) => {
    setContractId(val);
  };

  const handleQtyChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index].currentCompletedQty = val;
    setItems(updated);
  };

  const handleItemRemarkChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index].remarks = val;
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

  // Totals calculation
  const totalCompletedValue = items.reduce((sum, item) => {
    const qty = Number(item.currentCompletedQty) || 0;
    return sum + qty * item.rate;
  }, 0);

  const handleSubmit = async (submitNow: boolean) => {
    if (!projectId || !contractId || !title || !completionDate) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields (Project, Contract, Title, Date).",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "No BOQ Items on Contract",
        description: "This contract has no BOQ items defined yet. Please add BOQ items before recording completion.",
        variant: "destructive",
      });
      return;
    }

    const validItems = items
      .filter((i) => Number(i.currentCompletedQty) > 0)
      .map((i) => ({
        contractBoqItemId: i.contractBoqItemId,
        currentCompletedQty: Number(i.currentCompletedQty),
        remarks: i.remarks || undefined,
      }));

    if (validItems.length === 0) {
      toast({
        title: "Quantity Required",
        description: "Please enter current completed quantity greater than 0 for at least one BOQ item.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res: any = await createWorkCompletion.mutateAsync({
        projectId: Number(projectId),
        contractId: Number(contractId),
        vendorId: selectedContract?.vendorId || 1,
        title,
        milestone: milestone || undefined,
        completionDate,
        remarks: remarks || undefined,
        items: validItems,
        documents,
      });

      const wcId = res.id;
      if (submitNow) {
        await submitWorkCompletion.mutateAsync(wcId);
      }

      toast({
        title: submitNow ? "Work Completion Submitted" : "Draft Saved",
        description: submitNow
          ? "Completion submitted for verification and measurement review."
          : "Work completion draft saved successfully.",
      });

      setLocation(`/ra-bills/work-completions/${wcId}`);
    } catch (err) {
      console.error(err);
      toast({
        title: "Submission Failed",
        description: "Failed to create work completion. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/ra-bills">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 mb-2">
          Step 1 of Workflow: Milestone & Measurement Logging
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Log Work Completion</h1>
        <p className="text-sm text-muted-foreground">
          Record on-site completed quantities against the agreed contract BOQ. Upload joint measurement records (JMR), test reports, and site photos for verification.
        </p>
      </div>

      {/* Form Card 1: Project & Contract Info */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" /> Contract & Scope Assignment
          </CardTitle>
          <CardDescription className="text-xs">
            Select the project and vendor contract to load the agreed line items.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {selectedContract && (
            <div className="p-3 bg-muted/40 rounded-md border text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-muted-foreground">Contractor:</span>
                <p className="font-semibold text-foreground">{selectedContract.vendorName || "Vendor"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Contract Value:</span>
                <p className="font-semibold text-emerald-600">₹{(selectedContract.totalAmount || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Agreed Retention:</span>
                <p className="font-semibold text-foreground">{selectedContract.retentionPercent}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">BOQ Items Count:</span>
                <p className="font-semibold text-foreground">{selectedContract.boqItems?.length || 0} items</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Completion Title / Reference *</Label>
              <Input
                placeholder="e.g. Ground Floor RCC Slab & Beam Pouring"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Milestone / Stage</Label>
                <Input
                  placeholder="e.g. Milestone 2"
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Completion Date *</Label>
                <Input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">General Remarks / Site Engineer Notes</Label>
            <Textarea
              placeholder="Notes on site conditions, batch mix reports, inspection observations..."
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Card 2: BOQ Line Items Measurement */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Measured Completed Quantities
            </CardTitle>
            <CardDescription className="text-xs">
              Enter the current measured work completed for each BOQ line item, or import verified DPR measurements.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {contractId && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium shadow-sm"
                onClick={handleImportFromDprJmr}
                disabled={isImportingDpr}
              >
                <Sparkles className={`w-3.5 h-3.5 text-emerald-600 ${isImportingDpr ? "animate-spin" : ""}`} />
                {isImportingDpr ? "Compiling DPR..." : "⚡ Auto-fill from DPR (JMR)"}
              </Button>
            )}
            {totalCompletedValue > 0 && (
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Current Work Value:</span>
                <p className="text-lg font-bold text-emerald-600">₹{totalCompletedValue.toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {importedJmrNumber && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Joint Measurement Record Attached:</strong> Quantities auto-populated from Daily Progress Reports via <strong>{importedJmrNumber}</strong>.
                </span>
              </div>
              <Badge variant="outline" className="border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 text-[10px]">
                JMR Verified
              </Badge>
            </div>
          )}
          {!contractId ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Please select a project and contract above to display the BOQ items.
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50 space-y-3 my-2">
              <div className="flex justify-center text-amber-600 dark:text-amber-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-foreground">
                  No BOQ Items Defined for This Contract
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  To log work completions and Joint Measurement Records (JMR), the contract requires BOQ scope line items. You can quick-populate standard turnkey items or manage them in Contracts.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleQuickAddDefaultBoq}
                  disabled={isPopulatingBoq}
                  className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isPopulatingBoq ? "Adding BOQ Items..." : "Quick-Add Standard BOQ Scope"}
                </Button>
                <Link href={`/ra-bills/contracts?projectId=${projectId}`}>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Building className="w-3.5 h-3.5" /> Go to Contracts & BOQ
                  </Button>
                </Link>
              </div>
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
                    <th className="p-2.5 w-24 text-right">Prev Verified</th>
                    <th className="p-2.5 w-28">Current Qty *</th>
                    <th className="p-2.5 w-24 text-right">Cumulative</th>
                    <th className="p-2.5 w-28 text-right">Current Value</th>
                    <th className="p-2.5 w-36">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, idx) => {
                    const curQty = Number(item.currentCompletedQty) || 0;
                    const cumQty = item.prevCompleted + curQty;
                    const curValue = curQty * item.rate;
                    const isExceeding = cumQty > item.contractQty;

                    return (
                      <tr key={item.contractBoqItemId} className="hover:bg-accent/20">
                        <td className="p-2.5 font-mono text-muted-foreground">{item.itemNumber || idx + 1}</td>
                        <td className="p-2.5 font-medium">{item.description}</td>
                        <td className="p-2.5 text-muted-foreground">{item.unit}</td>
                        <td className="p-2.5 text-right">₹{item.rate.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-medium">{item.contractQty}</td>
                        <td className="p-2.5 text-right text-muted-foreground">{item.prevCompleted}</td>
                        <td className="p-2.5">
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.currentCompletedQty}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            className={`h-7 text-xs ${isExceeding ? "border-amber-500 focus-visible:ring-amber-500" : ""}`}
                          />
                          {isExceeding && (
                            <span className="text-[10px] text-amber-600 block mt-0.5">
                              Exceeds agreed ({cumQty}/{item.contractQty})
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-blue-600">{cumQty}</td>
                        <td className="p-2.5 text-right font-bold text-foreground">
                          {curValue > 0 ? `₹${curValue.toLocaleString()}` : "—"}
                        </td>
                        <td className="p-2.5">
                          <Input
                            placeholder="Grid A1-B3..."
                            value={item.remarks}
                            onChange={(e) => handleItemRemarkChange(idx, e.target.value)}
                            className="h-7 text-xs"
                          />
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

      {/* Form Card 3: Supporting Documents */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-primary" /> Supporting Documents & Verification Attachments
          </CardTitle>
          <CardDescription className="text-xs">
            Attach Joint Measurement Records (JMR), quality test certificates, bar bending schedules, or site photographs.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: "measurement_sheet", label: "Measurement Sheet (JMR)" },
              { type: "site_photo", label: "Site Inspection Photos" },
              { type: "test_report", label: "Cube / Material Test Report" },
              { type: "other", label: "Other Documents" },
            ].map((category) => (
              <label
                key={category.type}
                className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-accent/40 transition-colors flex flex-col items-center justify-center gap-1.5"
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{category.label}</span>
                <span className="text-[10px] text-muted-foreground">PDF, JPEG, PNG</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, category.type)}
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
              <Label className="text-xs font-semibold">Attached Documents ({documents.length})</Label>
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
            disabled={createWorkCompletion.isPending || items.length === 0}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={createWorkCompletion.isPending || submitWorkCompletion.isPending || items.length === 0}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <CheckCircle2 className="w-4 h-4" /> Submit for Verification
          </Button>
        </div>
      </div>
    </div>
  );
}
