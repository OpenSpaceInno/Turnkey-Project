import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  useContracts,
  useCreateContract,
  useAddContractBoqItem,
  useListProjects,
  useListVendors,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Percent,
  TrendingUp,
  Building,
  User,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

export default function ContractsPage() {
  const [location, setLocation] = useLocation();
  const searchParamStr = useSearch();
  const [search, setSearch] = useState("");

  const initialProjectId = (() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("projectId");
      if (p) return p;
    }
    return "all";
  })();

  const [projectFilter, setProjectFilter] = useState<string>(initialProjectId);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedContractId, setExpandedContractId] = useState<number | null>(null);

  // New Contract Dialog State
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [newProjectId, setNewProjectId] = useState<string>(initialProjectId !== "all" ? initialProjectId : "");

  useEffect(() => {
    const params = new URLSearchParams(searchParamStr);
    const qProjectId = params.get("projectId");
    const isNew = location.endsWith("/new") || params.get("new") === "true";

    if (qProjectId) {
      setNewProjectId(qProjectId);
      setProjectFilter(qProjectId);
    } else if (params.has("projectId") && !qProjectId) {
      setProjectFilter("all");
    }
    if (isNew) {
      setIsNewContractOpen(true);
    }
  }, [location, searchParamStr]);

  const handleProjectFilterChange = (val: string) => {
    setProjectFilter(val);
    if (val !== "all") {
      setNewProjectId(val);
    }
    const currentParams = new URLSearchParams(window.location.search);
    if (val === "all") {
      currentParams.delete("projectId");
    } else {
      currentParams.set("projectId", val);
    }
    const newSearch = currentParams.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  };
  const [newVendorId, setNewVendorId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRetention, setNewRetention] = useState("5");
  const [newAdvance, setNewAdvance] = useState("0");
  const [newTds, setNewTds] = useState("2");
  const [newGst, setNewGst] = useState("18");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  // BOQ items inside new contract
  const [newBoqItems, setNewBoqItems] = useState<
    Array<{ itemNumber: string; description: string; unit: string; quantity: string; rate: string }>
  >([
    { itemNumber: "1", description: "", unit: "sq.ft", quantity: "100", rate: "150" },
  ]);

  // Add BOQ item dialog to existing contract
  const [activeAddBoqContractId, setActiveAddBoqContractId] = useState<number | null>(null);
  const [boqItemDesc, setBoqItemDesc] = useState("");
  const [boqItemUnit, setBoqItemUnit] = useState("nos");
  const [boqItemQty, setBoqItemQty] = useState("");
  const [boqItemRate, setBoqItemRate] = useState("");

  const { data: contracts, isLoading: loadingContracts } = useContracts({
    search: search || undefined,
    projectId: projectFilter !== "all" ? Number(projectFilter) : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { data: projects } = useListProjects();
  const { data: vendors } = useListVendors();

  const createContract = useCreateContract();
  const addBoqItem = useAddContractBoqItem();

  const handleAddBoqRow = () => {
    setNewBoqItems([
      ...newBoqItems,
      {
        itemNumber: `${newBoqItems.length + 1}`,
        description: "",
        unit: "sq.ft",
        quantity: "",
        rate: "",
      },
    ]);
  };

  const handleRemoveBoqRow = (index: number) => {
    if (newBoqItems.length > 1) {
      setNewBoqItems(newBoqItems.filter((_, i) => i !== index));
    }
  };

  const handleBoqChange = (index: number, field: string, value: string) => {
    const updated = [...newBoqItems];
    (updated[index] as any)[field] = value;
    setNewBoqItems(updated);
  };

  const handleCreateContract = async () => {
    if (!newProjectId || !newVendorId || !newTitle) {
      alert("Please fill in Project, Vendor, and Contract Title.");
      return;
    }

    const validBoqs = newBoqItems
      .filter((i) => i.description.trim() !== "")
      .map((i) => ({
        itemNumber: i.itemNumber,
        description: i.description,
        unit: i.unit,
        quantity: Number(i.quantity) || 0,
        rate: Number(i.rate) || 0,
      }));

    await createContract.mutateAsync({
      projectId: Number(newProjectId),
      vendorId: Number(newVendorId),
      title: newTitle,
      description: newDescription,
      retentionPercent: Number(newRetention),
      advancePercent: Number(newAdvance),
      tdsPercent: Number(newTds),
      gstPercent: Number(newGst),
      startDate: newStartDate || undefined,
      endDate: newEndDate || undefined,
      boqItems: validBoqs,
    });

    setIsNewContractOpen(false);
    // Reset form
    setNewTitle("");
    setNewDescription("");
    setNewProjectId("");
    setNewVendorId("");
    setNewBoqItems([{ itemNumber: "1", description: "", unit: "sq.ft", quantity: "100", rate: "150" }]);
  };

  const handleAddSingleBoq = async () => {
    if (!activeAddBoqContractId || !boqItemDesc || !boqItemQty || !boqItemRate) {
      alert("Please provide description, quantity, and rate.");
      return;
    }

    await addBoqItem.mutateAsync({
      contractId: activeAddBoqContractId,
      item: {
        description: boqItemDesc,
        unit: boqItemUnit,
        quantity: Number(boqItemQty),
        rate: Number(boqItemRate),
      },
    });

    setActiveAddBoqContractId(null);
    setBoqItemDesc("");
    setBoqItemQty("");
    setBoqItemRate("");
  };

  const selectedProject = (projects || []).find((p) => String(p.id) === projectFilter);

  const filteredContracts = (contracts || []).filter((c) => {
    if (projectFilter !== "all" && c.projectId !== Number(projectFilter)) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.contractNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.vendorName && c.vendorName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalContractsValue = filteredContracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const displayContractValue = totalContractsValue > 0
    ? totalContractsValue
    : (selectedProject?.budget ? Number(selectedProject.budget) : 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/ra-bills" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              RA Bills & Payments
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Contracts & Work Orders</span>
            {selectedProject && (
              <>
                <span className="text-muted-foreground">/</span>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-semibold">
                  {selectedProject.name}
                </Badge>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            {selectedProject ? `${selectedProject.name} - Contracts & Scope` : "Vendor Contracts & BOQ"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {selectedProject
              ? `Manage contract value, agreed scope of work, bill of quantities (BOQ), and deduction rules for ${selectedProject.name}.`
              : "Manage construction contracts, agreed scope of work, bill of quantities (BOQ), and deduction rules across turnkey projects."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedProject && (
            <Link href={`/projects/${selectedProject.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Project
              </Button>
            </Link>
          )}
          <Link href="/ra-bills/work-completions/new">
            <Button variant="outline" size="sm" className="gap-2">
              <Layers className="w-4 h-4" /> Log Completion
            </Button>
          </Link>
          <Dialog
            open={isNewContractOpen}
            onOpenChange={(open) => {
              setIsNewContractOpen(open);
              if (!open && location.endsWith("/new")) {
                setLocation(location.replace(/\/new$/, "") || "/ra-bills/contracts");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4" /> New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Vendor Work Contract</DialogTitle>
                <DialogDescription>
                  Define the work order terms, retention, tax percentages, and initial BOQ items.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Project *</Label>
                    <Select value={newProjectId} onValueChange={setNewProjectId}>
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
                    <Label>Vendor / Contractor *</Label>
                    <Select value={newVendorId} onValueChange={setNewVendorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contractor" />
                      </SelectTrigger>
                      <SelectContent>
                        {(vendors || []).map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Contract Title *</Label>
                  <Input
                    placeholder="e.g. Civil & Structural Concrete Works - Phase 1"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Description / Scope Notes</Label>
                  <Textarea
                    placeholder="Details about work scope, specifications, milestone schedules..."
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                {/* Deductions & Rules */}
                <div className="p-3 bg-muted/40 rounded-lg border">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Default Deduction Rates (%)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Retention %</Label>
                      <Input
                        type="number"
                        value={newRetention}
                        onChange={(e) => setNewRetention(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Advance %</Label>
                      <Input
                        type="number"
                        value={newAdvance}
                        onChange={(e) => setNewAdvance(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">TDS %</Label>
                      <Input
                        type="number"
                        value={newTds}
                        onChange={(e) => setNewTds(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">GST %</Label>
                      <Input
                        type="number"
                        value={newGst}
                        onChange={(e) => setNewGst(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target End Date</Label>
                    <Input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Initial BOQ Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Contract BOQ Line Items</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddBoqRow}
                      className="gap-1 h-7 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Line
                    </Button>
                  </div>

                  <div className="border rounded-md overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted text-muted-foreground border-b font-medium">
                        <tr>
                          <th className="p-2 w-12">#</th>
                          <th className="p-2">Description</th>
                          <th className="p-2 w-20">Unit</th>
                          <th className="p-2 w-24">Qty</th>
                          <th className="p-2 w-24">Rate (₹)</th>
                          <th className="p-2 w-24 text-right">Total (₹)</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {newBoqItems.map((item, idx) => {
                          const rowTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                          return (
                            <tr key={idx}>
                              <td className="p-2">{idx + 1}</td>
                              <td className="p-2">
                                <Input
                                  size={1}
                                  placeholder="Item description..."
                                  value={item.description}
                                  onChange={(e) => handleBoqChange(idx, "description", e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  size={1}
                                  value={item.unit}
                                  onChange={(e) => handleBoqChange(idx, "unit", e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  size={1}
                                  value={item.quantity}
                                  onChange={(e) => handleBoqChange(idx, "quantity", e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  size={1}
                                  value={item.rate}
                                  onChange={(e) => handleBoqChange(idx, "rate", e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </td>
                              <td className="p-2 text-right font-medium">
                                ₹{rowTotal.toLocaleString()}
                              </td>
                              <td className="p-2 text-center">
                                {newBoqItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBoqRow(idx)}
                                    className="text-destructive hover:opacity-80"
                                  >
                                    ×
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewContractOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContract} disabled={createContract.isPending}>
                  {createContract.isPending ? "Creating..." : "Create Contract"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Project Filter Notification */}
      {selectedProject && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 px-4 py-3 rounded-xl text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Showing Contract Value for: <span className="text-primary">{selectedProject.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Client: {selectedProject.clientName} &bull; Project Status: {selectedProject.status?.replace("_", " ")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleProjectFilterChange("all")}
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10 gap-1.5"
          >
            Clear Filter (Show All)
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Active Contracts</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {filteredContracts.length}
              <FileText className="w-5 h-5 text-primary opacity-80" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {selectedProject
                ? `Contracts linked to ${selectedProject.name}`
                : `Across ${projects?.length || 0} active turnkey projects`}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium text-emerald-800 dark:text-emerald-300">
              {selectedProject ? `${selectedProject.name} Contract Value` : "Total Contracted Value"}
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              ₹{displayContractValue.toLocaleString()}
              <TrendingUp className="w-5 h-5 opacity-80" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {selectedProject
                ? `Contracted scope baseline for this project`
                : "Cumulative baseline for work completion tracking across all projects"}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Contractors Engaged</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {new Set(filteredContracts.map((c) => c.vendorId).filter(Boolean)).size}
              <Building className="w-5 h-5 text-indigo-500 opacity-80" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {selectedProject
                ? `Trade contractors engaged on ${selectedProject.name}`
                : "Approved sub-contractors and turnkey vendors"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by contract number, title, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={projectFilter} onValueChange={handleProjectFilterChange}>
            <SelectTrigger className="h-8 text-xs w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {(projects || []).map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleProjectFilterChange("all")}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[130px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {loadingContracts ? (
          <div className="p-8 text-center text-muted-foreground">Loading contracts...</div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground space-y-3">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">
              {selectedProject ? `No contracts recorded for ${selectedProject.name}` : "No contracts found"}
            </h3>
            <p className="text-xs max-w-md mx-auto">
              {selectedProject
                ? selectedProject.budget
                  ? `Project tender budget baseline is ₹${Number(selectedProject.budget).toLocaleString()}. Create vendor work contracts or client terms to track completion.`
                  : `Create your first contractor work order for ${selectedProject.name} to start logging work completions.`
                : "Create your first contractor work order to start logging work completions."}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button size="sm" onClick={() => setIsNewContractOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Create Contract
              </Button>
              {selectedProject && (
                <Button size="sm" variant="outline" onClick={() => handleProjectFilterChange("all")}>
                  Show All Projects
                </Button>
              )}
            </div>
          </div>
        ) : (
          filteredContracts.map((contract) => {
            const isExpanded = expandedContractId === contract.id;
            return (
              <Card key={contract.id} className="border shadow-sm overflow-hidden transition-all">
                <div
                  className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-accent/40"
                  onClick={() => setExpandedContractId(isExpanded ? null : contract.id)}
                >
                  <div className="flex items-start gap-3">
                    <button className="mt-1 text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted font-bold text-foreground">
                          {contract.contractNumber}
                        </span>
                        <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                          {contract.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" /> {contract.projectName || `Project #${contract.projectId}`}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base mt-1 text-foreground">{contract.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <User className="w-3.5 h-3.5" /> Vendor:{" "}
                        <span className="font-medium text-foreground">{contract.vendorName || "Unknown"}</span>
                        {contract.startDate && (
                          <span className="flex items-center gap-1 ml-2">
                            <Calendar className="w-3.5 h-3.5" /> Start: {format(new Date(contract.startDate), "dd MMM yyyy")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end md:self-auto">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Contract Value</div>
                      <div className="text-lg font-bold text-emerald-600">
                        ₹{(contract.totalAmount || 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Ret: {contract.retentionPercent}% | TDS: {contract.tdsPercent}% | GST: {contract.gstPercent}%
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/ra-bills/work-completions/new?contractId=${contract.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="w-3.5 h-3.5" /> Log Completion
                        </Button>
                      </Link>
                      <Link href={`/ra-bills/new?contractId=${contract.id}`}>
                        <Button
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Prepare RA Bill <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Expanded BOQ Table */}
                {isExpanded && (
                  <div className="border-t bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-primary" /> Bill of Quantities (BOQ Items)
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => setActiveAddBoqContractId(contract.id)}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add BOQ Item
                      </Button>
                    </div>

                    <div className="border rounded-md overflow-x-auto bg-card">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/70 text-muted-foreground font-semibold border-b">
                          <tr>
                            <th className="p-2.5">Item #</th>
                            <th className="p-2.5">Description</th>
                            <th className="p-2.5">Unit</th>
                            <th className="p-2.5 text-right">Agreed Qty</th>
                            <th className="p-2.5 text-right">Rate (₹)</th>
                            <th className="p-2.5 text-right">Total Amount (₹)</th>
                            <th className="p-2.5 text-right">Completed Qty</th>
                            <th className="p-2.5 text-right">Billed Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(contract.boqItems && contract.boqItems.length > 0) ? (
                            contract.boqItems.map((item) => (
                              <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                                <td className="p-2.5 font-mono">{item.itemNumber || item.id}</td>
                                <td className="p-2.5 font-medium">{item.description}</td>
                                <td className="p-2.5 text-muted-foreground">{item.unit}</td>
                                <td className="p-2.5 text-right font-medium">{item.quantity}</td>
                                <td className="p-2.5 text-right">₹{item.rate.toLocaleString()}</td>
                                <td className="p-2.5 text-right font-bold text-foreground">
                                  ₹{item.totalAmount.toLocaleString()}
                                </td>
                                <td className="p-2.5 text-right font-semibold text-blue-600">
                                  {item.cumulativeCompletedQty || 0}
                                </td>
                                <td className="p-2.5 text-right font-semibold text-emerald-600">
                                  {item.cumulativeBilledQty || 0}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                No BOQ items defined for this contract. Click "Add BOQ Item" above.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Add Single BOQ Item Dialog */}
      <Dialog
        open={activeAddBoqContractId !== null}
        onOpenChange={(open) => !open && setActiveAddBoqContractId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contract BOQ Item</DialogTitle>
            <DialogDescription>
              Add a new billable scope item to this work order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Description *</Label>
              <Input
                placeholder="e.g. 12mm plastering in CM 1:4"
                value={boqItemDesc}
                onChange={(e) => setBoqItemDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Unit *</Label>
                <Input
                  value={boqItemUnit}
                  onChange={(e) => setBoqItemUnit(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity *</Label>
                <Input
                  type="number"
                  value={boqItemQty}
                  onChange={(e) => setBoqItemQty(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rate (₹) *</Label>
                <Input
                  type="number"
                  value={boqItemRate}
                  onChange={(e) => setBoqItemRate(e.target.value)}
                />
              </div>
            </div>

            {boqItemQty && boqItemRate && (
              <div className="p-2.5 rounded bg-muted text-xs flex justify-between font-semibold">
                <span>Calculated Line Total:</span>
                <span className="text-emerald-600">
                  ₹{(Number(boqItemQty) * Number(boqItemRate)).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveAddBoqContractId(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddSingleBoq} disabled={addBoqItem.isPending}>
              {addBoqItem.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
