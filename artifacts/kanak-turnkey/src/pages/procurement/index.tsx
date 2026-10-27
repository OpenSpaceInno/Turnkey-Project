import { useState, useEffect, useMemo } from "react";
import { useSearch, Link, useLocation } from "wouter";
import {
  useListVendors,
  useListPurchaseOrders,
  useListRfqs,
  useListMaterials,
  useListMaterialRequests,
  useListProjects,
  type Project,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Star, ArrowLeft, Building2, X, Printer } from "lucide-react";
import { format } from "date-fns";
import {
  NewVendorDialog,
  NewPurchaseOrderDialog,
  NewRfqDialog,
  NewMaterialDialog,
  NewMaterialRequestDialog,
} from "@/components/dialogs/procurement-dialogs";

const MR_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft:                    { label: "Draft",             variant: "outline" },
  pending:                  { label: "Pending",           variant: "outline" },
  pending_manager_approval: { label: "Pending Approval",  variant: "outline" },
  approved:                 { label: "Approved",          variant: "default" },
  rfq_generated:            { label: "RFQ Generated",     variant: "secondary" },
  fulfilled:                { label: "Fulfilled",         variant: "secondary" },
  rejected:                 { label: "Rejected",          variant: "destructive" },
};

export default function Procurement() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const searchTab = new URLSearchParams(search).get("tab") || "mr";
  const [activeTab, setActiveTab] = useState(searchTab);

  const [projectFilter, setProjectFilter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("projectId");
      if (p && p.trim()) return p.trim();
    }
    return "all";
  });

  // Listen to popstate for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("projectId");
      setProjectFilter(pid && pid.trim() ? pid.trim() : "all");
      const tabFromUrl = params.get("tab");
      if (tabFromUrl) {
        setActiveTab(tabFromUrl);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync tab & projectFilter with URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === "mr") {
      params.delete("tab");
    } else {
      params.set("tab", activeTab);
    }

    if (projectFilter === "all") {
      params.delete("projectId");
    } else {
      params.set("projectId", projectFilter);
    }

    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, [activeTab, projectFilter]);

  const { data: vendors, isLoading: loadingVendors } = useListVendors();
  const { data: pos, isLoading: loadingPos } = useListPurchaseOrders();
  const { data: rfqs, isLoading: loadingRfqs } = useListRfqs();
  const { data: materials, isLoading: loadingMaterials } = useListMaterials();
  const { data: mrs, isLoading: loadingMrs } = useListMaterialRequests();
  const { data: projects = [] } = useListProjects();

  const currentProject = useMemo(() => {
    if (projectFilter === "all") return null;
    const arr = Array.isArray(projects) ? projects : [];
    return arr.find((p: Project) => String(p.id) === String(projectFilter)) || null;
  }, [projects, projectFilter]);

  const handleBack = () => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (from && from.startsWith("/")) {
      setLocation(decodeURIComponent(from));
      return;
    }
    if (projectFilter !== "all") {
      setLocation(`/projects/${projectFilter}?tab=journey`);
      return;
    }
    setLocation("/projects");
  };

  // Filter lists strictly by selected project
  const filteredMrs = useMemo(() => {
    const arr = Array.isArray(mrs) ? mrs : [];
    return arr.filter((mr) => projectFilter === "all" || String(mr.projectId) === String(projectFilter));
  }, [mrs, projectFilter]);

  const filteredPos = useMemo(() => {
    const arr = Array.isArray(pos) ? pos : [];
    return arr.filter((po) => projectFilter === "all" || String(po.projectId) === String(projectFilter));
  }, [pos, projectFilter]);

  const filteredRfqs = useMemo(() => {
    const arr = Array.isArray(rfqs) ? rfqs : [];
    return arr.filter((rfq) => projectFilter === "all" || String(rfq.projectId) === String(projectFilter));
  }, [rfqs, projectFilter]);

  const filteredMaterials = useMemo(() => {
    const arr = Array.isArray(materials) ? materials : [];
    return arr.filter((m) => projectFilter === "all" || !m.projectId || String(m.projectId) === String(projectFilter));
  }, [materials, projectFilter]);

  return (
    <div className="space-y-6">
      {/* ── Header with Lifecycle Back Navigation & Project Filter ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {projectFilter !== "all" ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="gap-1.5 text-xs font-semibold h-7 px-2.5 shadow-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Lifecycle Map
              </Button>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
                <Building2 className="h-3 w-3 mr-1 inline" />
                Project #{projectFilter}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Phase 2: Procurement & Sourcing
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {currentProject?.name ? `${currentProject.name} — Procurement` : "Procurement"}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Project-specific purchase orders, material requisitions, RFQs, and site deliveries.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
            <p className="text-muted-foreground">Manage material requests, vendors, RFQs, purchase orders, and inventory.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects ({(projects || []).length})</SelectItem>
              {(Array.isArray(projects) ? projects : []).map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {projectFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProjectFilter("all")}
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" /> Show All
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="mr">Material Requests ({filteredMrs.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({(vendors || []).length})</TabsTrigger>
          <TabsTrigger value="rfqs">RFQs ({filteredRfqs.length})</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders ({filteredPos.length})</TabsTrigger>
          <TabsTrigger value="materials">Inventory ({filteredMaterials.length})</TabsTrigger>
        </TabsList>

        {/* ── Material Requests ── */}
        <TabsContent value="mr" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Material Requests</h2>
              <p className="text-sm text-muted-foreground">
                {projectFilter !== "all"
                  ? `Showing requisitions for ${currentProject?.name || `Project #${projectFilter}`}.`
                  : "Identify material needs before raising RFQs across all projects."}
              </p>
            </div>
            <NewMaterialRequestDialog
              trigger={
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Request</Button>
              }
            />
          </div>
          <div className="rounded-md border bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Raised on</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMrs.map((mr) => {
                  const meta = MR_STATUS[mr.status] ?? { label: mr.status, variant: "outline" as const };
                  return (
                    <tr key={mr.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/procurement/material-requests/${mr.id}`} className="hover:underline text-primary">
                          {mr.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{mr.projectName}</td>
                      <td className="px-4 py-3">{mr.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground">{mr.unit}</td>
                      <td className="px-4 py-3">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {format(new Date(mr.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  );
                })}
                {!filteredMrs.length && !loadingMrs && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">
                      {projectFilter !== "all"
                        ? `No material requests found for this project.`
                        : "No material requests yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Purchase Orders ── */}
        <TabsContent value="pos" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Purchase Orders</h2>
              <p className="text-sm text-muted-foreground">
                {projectFilter !== "all"
                  ? `Showing POs awarded for ${currentProject?.name || `Project #${projectFilter}`}.`
                  : "Track issued purchase orders and vendor deliveries."}
              </p>
            </div>
            <NewPurchaseOrderDialog
              trigger={
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create PO</Button>
              }
            />
          </div>
          <div className="rounded-md border bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">PO Number</th>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Total Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPos.map((po) => (
                  <tr key={po.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium">
                      <Link href={`/procurement/purchase-orders/${po.id}`} className="hover:underline text-primary">
                        {po.poNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{po.vendorName}</td>
                    <td className="px-4 py-3">{po.projectName}</td>
                    <td className="px-4 py-3 font-medium">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(po.totalAmount)}
                    </td>
                    <td className="px-4 py-3 capitalize">{po.status.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(po.createdAt), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 border-primary/20 hover:border-primary text-primary hover:bg-primary/5"
                        title="Print / Download PO PDF"
                        onClick={() => window.open(`/api/procurement/purchase-orders/${po.id}/export-pdf?autoPrint=true`, '_blank', 'width=1000,height=850')}
                      >
                        <Printer className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
                {!filteredPos.length && !loadingPos && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">
                      {projectFilter !== "all"
                        ? "No purchase orders found for this project."
                        : "No purchase orders found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Vendors ── */}
        <TabsContent value="vendors" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Vendors</h2>
            <NewVendorDialog
              trigger={
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Vendor</Button>
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(Array.isArray(vendors) ? vendors : []).map((vendor) => (
              <Card key={vendor.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{vendor.name}</CardTitle>
                    <Badge variant={vendor.status === "active" ? "default" : "secondary"}>{vendor.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="text-muted-foreground">{vendor.category || "Uncategorized"}</div>
                  {vendor.contactPerson && <div>{vendor.contactPerson}</div>}
                  {vendor.email && <div className="text-muted-foreground">{vendor.email}</div>}
                  {vendor.phone && <div className="text-muted-foreground">{vendor.phone}</div>}
                  {vendor.rating > 0 && (
                    <div className="flex items-center gap-1 text-amber-500 pt-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {!(Array.isArray(vendors) ? vendors : []).length && !loadingVendors && (
              <div className="md:col-span-3 rounded-md border border-dashed p-8 text-center text-muted-foreground">
                No vendors yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── RFQs ── */}
        <TabsContent value="rfqs" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Requests for Quotation</h2>
              <p className="text-sm text-muted-foreground">
                {projectFilter !== "all"
                  ? `Showing bidding packages for ${currentProject?.name || `Project #${projectFilter}`}.`
                  : "Collect and compare competitive supplier bids."}
              </p>
            </div>
            <NewRfqDialog
              trigger={
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create RFQ</Button>
              }
            />
          </div>
          <div className="rounded-md border bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/procurement/rfqs/${rfq.id}`} className="hover:underline text-primary">
                        {rfq.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{rfq.projectName || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">{(rfq.status || "draft").replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {rfq.createdAt ? format(new Date(rfq.createdAt), "MMM d, yyyy") : "—"}
                    </td>
                  </tr>
                ))}
                {!filteredRfqs.length && !loadingRfqs && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">
                      {projectFilter !== "all"
                        ? "No RFQs found for this project."
                        : "No RFQs yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Materials Inventory ── */}
        <TabsContent value="materials" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Materials Inventory</h2>
              <p className="text-sm text-muted-foreground">
                {projectFilter !== "all"
                  ? `Stock levels and site stores for ${currentProject?.name || `Project #${projectFilter}`}.`
                  : "Track inventory, committed stock, and minimum thresholds."}
              </p>
            </div>
            <NewMaterialDialog
              trigger={
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Material</Button>
              }
            />
          </div>
          <div className="rounded-md border bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Material</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium text-right">On Hand</th>
                  <th className="px-4 py-3 font-medium text-right">Committed</th>
                  <th className="px-4 py-3 font-medium text-right">Consumed</th>
                  <th className="px-4 py-3 font-medium text-right">Min. Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMaterials.map((m) => {
                  const low = m.quantityOnHand <= m.minimumStock;
                  return (
                    <tr key={m.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3">{m.projectName || <span className="text-muted-foreground">General</span>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.unit}</td>
                      <td className={`px-4 py-3 text-right ${low ? "text-destructive font-semibold" : ""}`}>{m.quantityOnHand}</td>
                      <td className="px-4 py-3 text-right">{m.quantityCommitted}</td>
                      <td className="px-4 py-3 text-right">{m.quantityConsumed}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{m.minimumStock}</td>
                    </tr>
                  );
                })}
                {!filteredMaterials.length && !loadingMaterials && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">
                      {projectFilter !== "all"
                        ? "No materials tracked for this project."
                        : "No materials tracked yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
