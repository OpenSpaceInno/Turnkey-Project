import { useListRfqs, useListMaterials } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function ProcurementRfqsMaterials() {
  const { data: rfqs } = useListRfqs();
  const { data: materials } = useListMaterials();

  return (
    <>
      <TabsContent value="rfqs" className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Request for Quotations (RFQs)</h2>
          <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create RFQ</Button>
        </div>
        <div className="grid gap-4">
          {rfqs?.map(rfq => (
            <Card key={rfq.id}>
              <CardContent className="p-5 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{rfq.rfqNumber}</span>
                    <Badge variant={rfq.status === 'closed' ? 'default' : 'secondary'}>{rfq.status}</Badge>
                  </div>
                  <div className="font-medium text-lg">{rfq.title}</div>
                  <div className="text-sm text-muted-foreground">{rfq.projectName}</div>
                </div>
                <div className="flex flex-col items-start md:items-end justify-center space-y-2 border-l pl-0 md:pl-6 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-sm text-muted-foreground flex gap-4">
                    <span>Issued: {format(new Date(rfq.issueDate), "MMM d")}</span>
                    <span>Due: {format(new Date(rfq.dueDate), "MMM d")}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full md:w-auto">Compare Quotations</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!rfqs?.length && (
            <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">No RFQs found.</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="materials" className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Material Inventory</h2>
          <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Material</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {materials?.map(material => {
            const isLowStock = material.onHand < material.minimumStock;
            return (
              <Card key={material.id} className={isLowStock ? "border-destructive/50" : ""}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold line-clamp-2">{material.name}</CardTitle>
                    {isLowStock && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{material.sku} • {material.category}</div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Stock ({material.unit})</span>
                      <span className={isLowStock ? "text-destructive font-bold" : "font-medium"}>
                        {material.onHand} / {material.minimumStock} min
                      </span>
                    </div>
                    <Progress value={Math.min(100, (material.onHand / Math.max(1, material.minimumStock)) * 50)} className={`h-1.5 ${isLowStock ? "[&>div]:bg-destructive" : ""}`} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Committed: {material.committed}</span>
                    <span>Consumed: {material.consumed}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {!materials?.length && (
            <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-muted-foreground">No materials found.</div>
          )}
        </div>
      </TabsContent>
    </>
  );
}
