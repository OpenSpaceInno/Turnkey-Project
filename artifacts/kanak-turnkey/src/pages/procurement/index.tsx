import { useListVendors, useListPurchaseOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export default function Procurement() {
  const { data: vendors, isLoading: loadingVendors } = useListVendors();
  const { data: pos, isLoading: loadingPos } = useListPurchaseOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
          <p className="text-muted-foreground">Manage vendors, RFQs, and purchase orders.</p>
        </div>
      </div>

      <Tabs defaultValue="pos">
        <TabsList>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="rfqs">RFQs</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pos" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Purchase Orders</h2>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create PO</Button>
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

        <TabsContent value="vendors" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Vendors</h2>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Vendor</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {vendors?.map(vendor => (
              <Card key={vendor.id}>
                <CardHeader>
                  <CardTitle className="text-base">{vendor.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="text-muted-foreground">{vendor.category}</div>
                  <div>{vendor.email}</div>
                  <div>{vendor.phone}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="rfqs" className="space-y-4 pt-4">
          <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
            RFQs list and quotation comparison...
          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4 pt-4">
          <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
            Materials inventory...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
