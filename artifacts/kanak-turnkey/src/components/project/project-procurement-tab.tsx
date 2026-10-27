import React from "react";
import {
  useProcurementListMaterialRequests as useListMaterialRequests,
  useListPurchaseOrders,
} from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, PackageCheck, FileSpreadsheet, ArrowRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProjectProcurementTab({ projectId }: { projectId: number }) {
  const [, setLocation] = useLocation();
  const { data: requests = [], isLoading: loadingMR } = useListMaterialRequests({ projectId });
  const { data: allPos = [], isLoading: loadingPO } = useListPurchaseOrders();
  const pos = (allPos as any[]).filter((po) => po.projectId === projectId);

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pending_manager_approval: "bg-amber-500/10 text-amber-600 border-amber-300",
    approved: "bg-emerald-500/10 text-emerald-600 border-emerald-300",
    rfq_generated: "bg-sky-500/10 text-sky-600 border-sky-300",
    completed: "bg-primary/10 text-primary border-primary/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Project Procurement & Material Supply
          </h2>
          <p className="text-xs text-muted-foreground">
            Material requisitions, vendor RFQs, purchase orders, and site inventory deliveries specific to this project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 shadow-sm"
            onClick={() => setLocation(`/procurement/material-requests?projectId=${projectId}`)}
          >
            <Plus className="h-4 w-4" />
            Raise Material Request
          </Button>
        </div>
      </div>

      {/* Material Requests Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-primary" />
              Material Requisitions ({requests.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Material requests submitted from site requiring approval and procurement sourcing.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => setLocation(`/procurement/material-requests?projectId=${projectId}`)}
          >
            Full Requisitions View <ExternalLink className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingMR ? (
            <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
              Loading material requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <PackageCheck className="h-8 w-8 text-muted-foreground mx-auto stroke-1" />
              <p className="text-sm font-medium">No material requests yet</p>
              <p className="text-xs text-muted-foreground">
                Engineers can submit indented material requisitions with quantities and delivery dates.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((mr) => (
                <div
                  key={mr.id}
                  className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {mr.requestNumber}
                      </span>
                      <span className="text-sm font-semibold truncate">{mr.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize font-semibold ${
                          STATUS_COLORS[mr.status] || "bg-muted"
                        }`}
                      >
                        {mr.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Category: <span className="capitalize">{mr.category}</span> • Priority:{" "}
                      <span className="capitalize">{mr.priority}</span> • Needed by:{" "}
                      {format(new Date(mr.requiredDate), "MMM d, yyyy")}
                      {mr.estimatedCost && ` • Est: ${INR.format(Number(mr.estimatedCost))}`}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 shrink-0"
                    onClick={() => setLocation(`/procurement/material-requests`)}
                  >
                    View <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Purchase Orders ({pos.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Issued vendor purchase orders for raw materials, MEP supplies, and equipment.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => setLocation(`/procurement?tab=pos`)}
          >
            All Purchase Orders <ExternalLink className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPO ? (
            <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
              Loading purchase orders...
            </div>
          ) : pos.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No purchase orders issued for this project yet.
            </div>
          ) : (
            <div className="divide-y">
              {pos.map((po) => (
                <div
                  key={po.id}
                  className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        PO #{po.id}
                      </span>
                      <span className="text-sm font-semibold truncate">
                        {po.vendorName || "Vendor PO"}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {po.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Amount: <strong>{INR.format(Number(po.totalAmount || 0))}</strong>
                      {po.deliveryDate &&
                        ` • Delivery: ${format(new Date(po.deliveryDate), "MMM d, yyyy")}`}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 shrink-0"
                    onClick={() => setLocation(`/procurement/purchase-orders/${po.id}`)}
                  >
                    View PO <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
