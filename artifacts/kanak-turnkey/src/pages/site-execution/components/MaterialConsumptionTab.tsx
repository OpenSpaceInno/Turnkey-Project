import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Package,
  Boxes,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  DollarSign,
  TrendingDown,
  Warehouse,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface MaterialConsumptionTabProps {
  selectedProjectId: string;
  projects: any[];
}

const CATEGORIES = [
  "Civil & Structural",
  "Masonry & AAC Blocks",
  "Reinforcement & Steel",
  "Finishing & Flooring",
  "Electrical & Wiring",
  "Plumbing & Sanitation",
  "Paints & Waterproofing",
  "Formwork & Hardware",
];

const COMMON_MATERIALS = [
  { name: "Ready Mix Concrete M35", category: "Civil & Structural", unit: "Cu.m", unitCost: "5400" },
  { name: "Ready Mix Concrete M25", category: "Civil & Structural", unit: "Cu.m", unitCost: "4800" },
  { name: "TMT Rebar FE 550D (16mm/20mm)", category: "Reinforcement & Steel", unit: "MT", unitCost: "68500" },
  { name: "OPC 53 Grade Cement", category: "Civil & Structural", unit: "Bags", unitCost: "395" },
  { name: "PPC Cement", category: "Civil & Structural", unit: "Bags", unitCost: "360" },
  { name: "River Sand (Washed)", category: "Civil & Structural", unit: "Brass", unitCost: "8200" },
  { name: "Crushed Aggregate 20mm", category: "Civil & Structural", unit: "Brass", unitCost: "4200" },
  { name: "AAC Blocks (600x200x150mm)", category: "Masonry & AAC Blocks", unit: "Nos", unitCost: "65" },
  { name: "Vitrified Tiles (800x800mm)", category: "Finishing & Flooring", unit: "Sq.ft", unitCost: "78" },
  { name: "Ceramic Glazed Wall Tiles", category: "Finishing & Flooring", unit: "Sq.ft", unitCost: "55" },
  { name: "PVC Heavy Duty Conduit 25mm", category: "Electrical & Wiring", unit: "Rmt", unitCost: "45" },
  { name: "CPVC Pipe 1 inch SDR 11", category: "Plumbing & Sanitation", unit: "Rmt", unitCost: "115" },
  { name: "Acrylic Exterior Emulsion", category: "Paints & Waterproofing", unit: "Litres", unitCost: "340" },
  { name: "APP Waterproofing Membrane 3mm", category: "Paints & Waterproofing", unit: "Sq.m", unitCost: "280" },
];

export function MaterialConsumptionTab({ selectedProjectId, projects }: MaterialConsumptionTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    projectId: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"),
    logDate: new Date().toISOString().split("T")[0],
    materialName: "Ready Mix Concrete M35",
    category: "Civil & Structural",
    unit: "Cu.m",
    openingStock: "0",
    quantityReceived: "100",
    quantityConsumed: "95",
    closingStock: "5",
    unitCost: "5400",
    location: "Podium Level Slab Bay 3",
    remarks: "",
  });

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/site-execution/materials", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/site-execution/materials?projectId=${selectedProjectId}`
        : "/api/site-execution/materials";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/site-execution/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to log material");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      setDialogOpen(false);
      toast({
        title: "Material Logged",
        description: "Stock consumption and balance updated.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/site-execution/materials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete log");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Deleted", description: "Material log removed." });
    },
  });

  const handleMaterialPresetSelect = (matName: string) => {
    const found = COMMON_MATERIALS.find((m) => m.name === matName);
    if (found) {
      setForm((prev) => ({
        ...prev,
        materialName: found.name,
        category: found.category,
        unit: found.unit,
        unitCost: found.unitCost,
      }));
    } else {
      setForm((prev) => ({ ...prev, materialName: matName }));
    }
  };

  const handleStockMath = (field: string, val: string) => {
    const updated = { ...form, [field]: val };
    const opening = parseFloat(field === "openingStock" ? val : updated.openingStock) || 0;
    const received = parseFloat(field === "quantityReceived" ? val : updated.quantityReceived) || 0;
    const consumed = parseFloat(field === "quantityConsumed" ? val : updated.quantityConsumed) || 0;
    const computedClosing = Math.max(0, opening + received - consumed);
    setForm({
      ...updated,
      closingStock: String(computedClosing),
    });
  };

  const filtered = logs.filter((item) => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (searchTerm && !item.materialName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Calculate stats
  const totalValueConsumed = filtered.reduce((acc, r) => acc + Number(r.totalCost || 0), 0);
  const lowStockCount = filtered.filter((r) => Number(r.closingStock || 0) <= 20).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      projectId: Number(form.projectId),
      openingStock: parseFloat(form.openingStock) || 0,
      quantityReceived: parseFloat(form.quantityReceived) || 0,
      quantityConsumed: parseFloat(form.quantityConsumed) || 0,
      closingStock: parseFloat(form.closingStock) || 0,
      unitCost: parseFloat(form.unitCost) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Consumed Value</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{INR.format(totalValueConsumed)}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Across {filtered.length} material lines</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Materials Tracked</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{filtered.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Civil, MEP, Finishing items</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
              <Boxes className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">{lowStockCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Items needing replenishment</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search material..."
              className="pl-8 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              Log Material Consumption
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-primary" />
                Log Site Material Consumption & Stock Balance
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record receipts, daily consumption, and closing stock balance on site.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Select Project</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(val) => setForm({ ...form, projectId: val })}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Select Common Material or Type</Label>
                <Select
                  value={form.materialName}
                  onValueChange={handleMaterialPresetSelect}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_MATERIALS.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name} ({m.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => setForm({ ...form, category: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit of Measure</Label>
                  <Input
                    className="text-xs h-9"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
              </div>

              {/* Stock calculations */}
              <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">Opening</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="text-xs h-8 bg-background"
                    value={form.openingStock}
                    onChange={(e) => handleStockMath("openingStock", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-emerald-600">Received (+)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="text-xs h-8 bg-background"
                    value={form.quantityReceived}
                    onChange={(e) => handleStockMath("quantityReceived", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-rose-600">Consumed (-)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="text-xs h-8 bg-background"
                    value={form.quantityConsumed}
                    onChange={(e) => handleStockMath("quantityConsumed", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Closing Stock Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="text-xs h-9 font-bold bg-muted/30"
                    value={form.closingStock}
                    onChange={(e) => setForm({ ...form, closingStock: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit Rate (₹)</Label>
                  <Input
                    type="number"
                    className="text-xs h-9"
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Location / Grid / Floor</Label>
                <Input
                  placeholder="e.g. Podium Slab Bay 4, Tower 1 Basement"
                  className="text-xs h-9"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Remarks & Batch Details</Label>
                <Textarea
                  placeholder="e.g. Slump test 120mm ok, test certificates verified"
                  className="text-xs min-h-[50px]"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Material Record"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Material Logs Table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              Site Material Inventory & Consumption Register
            </span>
            <Badge variant="outline" className="text-xs">
              {filtered.length} Items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No material consumption records found. Click "Log Material Consumption" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3 pl-4">Date</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Material Name & Category</th>
                    <th className="p-3 text-right">Opening</th>
                    <th className="p-3 text-right text-emerald-600">Received</th>
                    <th className="p-3 text-right text-rose-600">Consumed</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3 text-right">Consumed Value</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => {
                    const isLow = Number(item.closingStock || 0) <= 20;
                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 pl-4 font-mono font-medium text-foreground whitespace-nowrap">
                          {item.logDate}
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {item.projectName || `Project #${item.projectId}`}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground">{item.materialName}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                              {item.category}
                            </Badge>
                            <span>&bull; {item.unit}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-muted-foreground">
                          {Number(item.openingStock).toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-emerald-600">
                          +{Number(item.quantityReceived).toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">
                          -{Number(item.quantityConsumed).toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold">
                          <span className={isLow ? "text-amber-600 font-black" : "text-foreground"}>
                            {Number(item.closingStock).toFixed(1)} {item.unit}
                          </span>
                          {isLow && (
                            <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-300">
                              Low
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                          {INR.format(Number(item.totalCost || 0))}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate" title={item.location}>
                          {item.location || "On-site"}
                        </td>
                        <td className="p-3 pr-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
    </div>
  );
}
