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
  Truck,
  Wrench,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Fuel,
  DollarSign,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface EquipmentTrackingTabProps {
  selectedProjectId: string;
  projects: any[];
}

const EQUIPMENT_TYPES = [
  "Batching & Pumping",
  "Lifting & Hoisting",
  "Earthmoving",
  "Power Generation",
  "Compaction & Hand Tools",
  "Formwork & Staging",
  "Fabrication & Steelwork",
];

const COMMON_MACHINERY = [
  { name: "Schwing Stetter Boom Pump 36m", type: "Batching & Pumping", cost: "16500" },
  { name: "Potain Tower Crane (50m Jib)", type: "Lifting & Hoisting", cost: "12000" },
  { name: "JCB 3DX Super Excavator", type: "Earthmoving", cost: "7500" },
  { name: "Cummins 125 kVA Silent DG Set", type: "Power Generation", cost: "8400" },
  { name: "Passenger & Material Hoist (Twin Cage)", type: "Lifting & Hoisting", cost: "6500" },
  { name: "Rebar Bar Bending & Cutting Machine", type: "Fabrication & Steelwork", cost: "3500" },
  { name: "High Frequency Needle Vibrators (Set of 4)", type: "Compaction & Hand Tools", cost: "3200" },
  { name: "Walk-behind Double Drum Roller", type: "Earthmoving", cost: "5500" },
];

export function EquipmentTrackingTab({ selectedProjectId, projects }: EquipmentTrackingTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchName, setSearchName] = useState("");

  const [form, setForm] = useState({
    projectId: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : "14"),
    logDate: new Date().toISOString().split("T")[0],
    equipmentName: "Potain Tower Crane (50m Jib)",
    equipmentType: "Lifting & Hoisting",
    status: "operational",
    hoursOperated: "8.0",
    fuelConsumedLitres: "0.0",
    operatorName: "Sanjay Kamble",
    dailyCost: "12000",
    remarks: "Regular daily pre-lift check completed.",
  });

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/site-execution/equipment", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId !== "all"
        ? `/api/site-execution/equipment?projectId=${selectedProjectId}`
        : "/api/site-execution/equipment";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/site-execution/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to log equipment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      setDialogOpen(false);
      toast({
        title: "Equipment Logged",
        description: "Equipment operational status recorded.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/site-execution/equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Status Updated", description: "Equipment state changed." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/site-execution/equipment/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete log");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      toast({ title: "Deleted", description: "Equipment record removed." });
    },
  });

  const handlePresetSelect = (name: string) => {
    const found = COMMON_MACHINERY.find((m) => m.name === name);
    if (found) {
      setForm((prev) => ({
        ...prev,
        equipmentName: found.name,
        equipmentType: found.type,
        dailyCost: found.cost,
      }));
    } else {
      setForm((prev) => ({ ...prev, equipmentName: name }));
    }
  };

  const filtered = logs.filter((item) => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (searchName && !item.equipmentName?.toLowerCase().includes(searchName.toLowerCase())) return false;
    return true;
  });

  // KPI Calculations
  const operationalCount = filtered.filter((e) => e.status === "operational").length;
  const idleCount = filtered.filter((e) => e.status === "idle").length;
  const breakdownCount = filtered.filter((e) => e.status === "breakdown" || e.status === "maintenance").length;
  const totalDailyCost = filtered.reduce((acc, r) => acc + Number(r.dailyCost || 0), 0);
  const totalFuel = filtered.reduce((acc, r) => acc + Number(r.fuelConsumedLitres || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      projectId: Number(form.projectId),
      hoursOperated: parseFloat(form.hoursOperated) || 0,
      fuelConsumedLitres: parseFloat(form.fuelConsumedLitres) || 0,
      dailyCost: parseFloat(form.dailyCost) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Operational Units</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{operationalCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active on site front</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Idle & Standby</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">{idleCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting next pour/shift</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Maintenance / Breakdown</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-600">{breakdownCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Service engineers assigned</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600">
              <Wrench className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Daily Plant Cost</p>
              <h3 className="text-2xl font-bold mt-1 text-primary">{INR.format(totalDailyCost)}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{totalFuel.toFixed(0)}L diesel consumed</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search machinery..."
              className="pl-8 h-9 text-xs"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="idle">Idle / Standby</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="breakdown">Breakdown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              Log Site Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Track Site Plant & Machinery
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log equipment deployed, operating hours, fuel consumption, and status.
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
                <Label className="text-xs">Select Machinery</Label>
                <Select
                  value={form.equipmentName}
                  onValueChange={handlePresetSelect}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_MACHINERY.map((m) => (
                      <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type / Category</Label>
                  <Select
                    value={form.equipmentType}
                    onValueChange={(val) => setForm({ ...form, equipmentType: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) => setForm({ ...form, status: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="idle">Idle / Standby</SelectItem>
                      <SelectItem value="maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="breakdown">Breakdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Hours Run</Label>
                  <Input
                    type="number"
                    step="0.5"
                    className="text-xs h-8 bg-background"
                    value={form.hoursOperated}
                    onChange={(e) => setForm({ ...form, hoursOperated: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-amber-600">Diesel (L)</Label>
                  <Input
                    type="number"
                    step="1"
                    className="text-xs h-8 bg-background"
                    value={form.fuelConsumedLitres}
                    onChange={(e) => setForm({ ...form, fuelConsumedLitres: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-primary">Daily Cost (₹)</Label>
                  <Input
                    type="number"
                    className="text-xs h-8 bg-background"
                    value={form.dailyCost}
                    onChange={(e) => setForm({ ...form, dailyCost: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Operator Name & Agency</Label>
                <Input
                  placeholder="e.g. Rajesh Patil (Certified Tower Crane Operator)"
                  className="text-xs h-9"
                  value={form.operatorName}
                  onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Remarks & Maintenance Notes</Label>
                <Textarea
                  placeholder="e.g. Hydraulic pressure checked, greasing done"
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
                  {createMutation.isPending ? "Saving..." : "Save Equipment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Equipment Logs Table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Site Machinery & Heavy Equipment Register
            </span>
            <Badge variant="outline" className="text-xs">
              {filtered.length} Units
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No equipment tracked for this project. Click "Log Site Equipment" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3 pl-4">Equipment</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3 text-right">Hours Run</th>
                    <th className="p-3 text-right">Fuel (L)</th>
                    <th className="p-3 text-right">Daily Cost</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => {
                    const statusConfig = {
                      operational: { label: "Operational", bg: "bg-emerald-50 text-emerald-700 border-emerald-300" },
                      idle: { label: "Idle / Standby", bg: "bg-amber-50 text-amber-700 border-amber-300" },
                      maintenance: { label: "Maintenance", bg: "bg-blue-50 text-blue-700 border-blue-300" },
                      breakdown: { label: "Breakdown", bg: "bg-rose-50 text-rose-700 border-rose-300" },
                    }[item.status as string] || { label: item.status, bg: "bg-muted text-foreground border-border" };

                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 pl-4 font-semibold text-foreground">
                          {item.equipmentName}
                          <div className="text-[11px] text-muted-foreground font-mono">{item.logDate}</div>
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {item.projectName || `Project #${item.projectId}`}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {item.equipmentType}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <select
                            value={item.status}
                            onChange={(e) => updateStatusMutation.mutate({ id: item.id, status: e.target.value })}
                            className={`text-[11px] font-semibold rounded-md border px-2 py-0.5 cursor-pointer outline-none ${statusConfig.bg}`}
                          >
                            <option value="operational">Operational</option>
                            <option value="idle">Idle / Standby</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="breakdown">Breakdown</option>
                          </select>
                        </td>
                        <td className="p-3 text-foreground font-medium">
                          {item.operatorName || "—"}
                        </td>
                        <td className="p-3 text-right font-mono font-medium">
                          {Number(item.hoursOperated || 0).toFixed(1)} hrs
                        </td>
                        <td className="p-3 text-right font-mono text-amber-600 font-semibold">
                          {Number(item.fuelConsumedLitres || 0).toFixed(0)} L
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                          {INR.format(Number(item.dailyCost || 0))}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate" title={item.remarks}>
                          {item.remarks || "—"}
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
