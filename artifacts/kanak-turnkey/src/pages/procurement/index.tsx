import {
  useListVendors,
  useListPurchaseOrders,
  useListRfqs,
  useListMaterials,
  useListMaterialRequests,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star } from "lucide-react";
import { format } from "date-fns";
import {
  NewVendorDialog,
  NewPurchaseOrderDialog,
  NewRfqDialog,
  NewMaterialDialog,
  NewMaterialRequestDialog,
} from "@/components/dialogs/procurement-dialogs";

const MR_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending:   { label: "Pending",   variant: "outline" },
  approved:  { label: "Approved",  variant: "default" },
  fulfilled: { label: "Fulfilled", variant: "secondary" },
  rejected:  { label: "Rejected",  variant: "destructive" },
};

export default function Procurement() {
  const { data: vendors, isLoading: loadingVendors } = useListVendors();
  const { data: pos, isLoading: loadingPos } = useListPurchaseOrders();
  const { data: rfqs, isLoading: loadingRfqs } = useListRfqs();
  const { data: materials, isLoading: loadingMaterials } = useListMaterials();
  const { data: mrs, isLoading: loadingMrs } = useListMaterialRequests();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
          <p className="text-muted-foreground">Manage material requests, vendors, RFQs, purchase orders, and inventory.</p>
        </div>
      </div>

      <Tabs defaultValue="mr">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="mr">Material Requests</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="rfqs">RFQs</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="materials">Inventory</TabsTrigger>
        </TabsList>

        {/* ── Material Requests ── */}
        <TabsContent value="mr" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Material Requests</h2>
              <p className="text-sm text-muted-foreground">Identify material needs before raising RFQs.</p>
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
                {mrs?.map(mr => {
                  const meta = MR_STATUS[mr.status] ?? { label: mr.status, variant: "outline" as const };
                  return (
                    <tr key={mr.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{mr.title}</td>
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
                {!mrs?.length && !loadingMrs && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No material requests yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Purchase Orders ── */}
        <TabsContent value="pos" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Purchase Orders</h2>
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
                  <th className="px-4 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pos?.map(po => (
                  <tr key={po.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-mono">{po.poNumber}</td>
                    <td className="px-4 py-3">{po.vendorName}</td>
                    <td className="px-4 py-3">{po.projectName}</td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(po.totalAmount)}
                    </td>
                    <td className="px-4 py-3 capitalize">{po.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{format(new Date(po.createdAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
                {!pos?.length && !loadingPos && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No purchase orders found.</td></tr>
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
            {vendors?.map(vendor => (
              <Card key={vendor.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{vendor.name}</CardTitle>
                    <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>{vendor.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="text-muted-foreground">{vendor.category || 'Uncategorized'}</div>
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
            {!vendors?.length && !loadingVendors && (
              <div className="md:col-span-3 rounded-md border border-dashed p-8 text-center text-muted-foreground">
                No vendors yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── RFQs ── */}
        <TabsContent value="rfqs" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Requests for Quotation</h2>
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
                {rfqs?.map(rfq => (
                  <tr key={rfq.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{rfq.title}</td>
                    <td className="px-4 py-3">{rfq.projectName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">{rfq.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{format(new Date(rfq.createdAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
                {!rfqs?.length && !loadingRfqs && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No RFQs yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Materials Inventory ── */}
        <TabsContent value="materials" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Materials Inventory</h2>
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
                {materials?.map(m => {
                  const low = m.quantityOnHand <= m.minimumStock;
                  return (
                    <tr key={m.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3">{m.projectName || <span className="text-muted-foreground">General</span>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.unit}</td>
                      <td className={`px-4 py-3 text-right ${low ? 'text-destructive font-semibold' : ''}`}>{m.quantityOnHand}</td>
                      <td className="px-4 py-3 text-right">{m.quantityCommitted}</td>
                      <td className="px-4 py-3 text-right">{m.quantityConsumed}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{m.minimumStock}</td>
                    </tr>
                  );
                })}
                {!materials?.length && !loadingMaterials && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No materials tracked yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
