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
  DollarSign,
  Receipt,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  PieChart,
  HardHat,
  Package,
  Truck,
  Coins,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface SiteCostsTabProps {
  selectedProjectId: string;
  projects: any[];
}

const COST_TYPES = [
  { value: "labor", label: "Labor Wages & Attendance Headcount" },
  { value: "material", label: "Site Material Delivery & Batch Supply" },
  { value: "equipment", label: "Plant, Machinery & Crane Hire" },
  { value: "petty_cash", label: "Site Petty Cash & Tools Expense" },
  { value: "transport", label: "Debris Removal & Material Transport" },
  { value: "site_overheads", label: "Site Overheads & Water/Power Utilities" },
];

export function SiteCostsTab({ selectedProjectId, projects }: SiteCostsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    projectId: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"),
    costDate: new Date().toISOString().split("T")[0],
    costType: "labor",
    description: "Daily Bar Bending & Carpentry Crew Wages",
    amount: "44600",
    vendorOrPayee: "L&T Civil Infrastructure",
    voucherRef: "WAGE-2026-1014",
    paymentStatus: "paid",
  });

  const { data: costs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/site-execution/daily-costs", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/site-execution/daily-costs?projectId=${selectedProjectId}`
        : "/api/site-execution/daily-costs";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/site-execution/daily-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to log cost");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/daily-costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      setDialogOpen(false);
      toast({
        title: "Site Cost Recorded",
        description: "Expense voucher saved to project site records.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/site-execution/daily-costs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete cost");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/daily-costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Deleted", description: "Cost record removed." });
    },
  });

  const filtered = costs.filter((c) => {
    if (filterType !== "all" && c.costType !== filterType) return false;
    if (searchQuery && !c.description?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.vendorOrPayee?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Calculate breakdowns
  const totalCost = filtered.reduce((a, b) => a + Number(b.amount || 0), 0);
  const laborCost = filtered.filter((c) => c.costType === "labor").reduce((a, b) => a + Number(b.amount || 0), 0);
  const materialCost = filtered.filter((c) => c.costType === "material").reduce((a, b) => a + Number(b.amount || 0), 0);
  const equipmentCost = filtered.filter((c) => c.costType === "equipment").reduce((a, b) => a + Number(b.amount || 0), 0);
  const pettyCost = filtered.filter((c) => c.costType === "petty_cash" || c.costType === "transport" || c.costType === "site_overheads").reduce((a, b) => a + Number(b.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      projectId: Number(form.projectId),
      amount: parseFloat(form.amount) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Site Expenses</p>
              <h3 className="text-2xl font-bold mt-1 text-primary">{INR.format(totalCost)}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{filtered.length} vouchers logged</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Labor Headcount Cost</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600">{INR.format(laborCost)}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{totalCost > 0 ? Math.round((laborCost / totalCost) * 100) : 0}% of site spend</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
              <HardHat className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Material Inflow Cost</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{INR.format(materialCost)}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">RMC, rebar, block batches</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Plant, Machinery & Petty</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">{INR.format(equipmentCost + pettyCost)}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Rental, diesel & tools</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
              <Coins className="h-6 w-6" />
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
              placeholder="Search payee or voucher..."
              className="pl-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
              <SelectValue placeholder="All Cost Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cost Types</SelectItem>
              {COST_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              Log Site Cost / Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Record Site Expense / Cost Entry
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log daily labor wage, material delivery receipt, machinery rental, or petty expense.
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cost Type</Label>
                  <Select
                    value={form.costType}
                    onValueChange={(val) => setForm({ ...form, costType: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COST_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    className="text-xs h-9"
                    value={form.costDate}
                    onChange={(e) => setForm({ ...form, costDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Expense Description</Label>
                <Input
                  placeholder="e.g. 115 Cu.m M35 RMC Supply Batch"
                  className="text-xs h-9"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="text-xs h-9 font-bold"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Payment Status</Label>
                  <Select
                    value={form.paymentStatus}
                    onValueChange={(val) => setForm({ ...form, paymentStatus: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="unpaid">Unpaid / Billed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Vendor / Payee</Label>
                  <Input
                    placeholder="e.g. UltraTech Concrete Plant"
                    className="text-xs h-9"
                    value={form.vendorOrPayee}
                    onChange={(e) => setForm({ ...form, vendorOrPayee: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Voucher / Bill Ref #</Label>
                  <Input
                    placeholder="e.g. RMC-DEL-9842"
                    className="text-xs h-9"
                    value={form.voucherRef}
                    onChange={(e) => setForm({ ...form, voucherRef: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Cost Entry"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Costs Table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Project-wise Site Execution Operational Costs
            </span>
            <Badge variant="outline" className="text-xs">
              {filtered.length} Vouchers
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No site costs logged for this project. Click "Log Site Cost" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3 pl-4">Date</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Cost Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Vendor / Payee</th>
                    <th className="p-3">Voucher Ref</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => {
                    const statusConfig = {
                      paid: { label: "Paid", bg: "bg-emerald-50 text-emerald-700 border-emerald-300" },
                      pending_approval: { label: "Pending", bg: "bg-amber-50 text-amber-700 border-amber-300" },
                      unpaid: { label: "Unpaid", bg: "bg-rose-50 text-rose-700 border-rose-300" },
                    }[item.paymentStatus as string] || { label: item.paymentStatus, bg: "bg-muted" };

                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 pl-4 font-mono font-medium text-foreground whitespace-nowrap">
                          {item.costDate}
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {item.projectName || `Project #${item.projectId}`}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.costType?.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold text-foreground max-w-sm">
                          {item.description}
                        </td>
                        <td className="p-3 text-foreground font-medium">
                          {item.vendorOrPayee || "—"}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {item.voucherRef || "—"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                          {INR.format(Number(item.amount || 0))}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.bg}`}>
                            {statusConfig.label}
                          </span>
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
