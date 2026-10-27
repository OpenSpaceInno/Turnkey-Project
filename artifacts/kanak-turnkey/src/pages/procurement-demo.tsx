import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  Package, 
  ShoppingCart, 
  Truck, 
  ClipboardCheck,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { customFetch } from "@workspace/api-client-react";

export default function ProcurementDemo() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProject, setSelectedProject] = useState<number>(1);

  // Fetch demo data
  const { data: materialRequests } = useQuery({
    queryKey: ["demo-material-requests", selectedProject],
    queryFn: async () => {
      const response = await customFetch("/api/procurement/material-requests", {
        params: { projectId: selectedProject },
      });
      return response.data;
    },
  });

  const { data: rfqs } = useQuery({
    queryKey: ["demo-rfqs", selectedProject],
    queryFn: async () => {
      const response = await customFetch("/api/procurement/rfqs", {
        params: { projectId: selectedProject },
      });
      return response.data;
    },
  });

  const { data: purchaseOrders } = useQuery({
    queryKey: ["demo-purchase-orders", selectedProject],
    queryFn: async () => {
      const response = await customFetch("/api/procurement/purchase-orders", {
        params: { projectId: selectedProject },
      });
      return response.data;
    },
  });

  const { data: inventory } = useQuery({
    queryKey: ["demo-inventory", selectedProject],
    queryFn: async () => {
      const response = await customFetch("/api/procurement/inventory", {
        params: { projectId: selectedProject },
      });
      return response.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["demo-stats", selectedProject],
    queryFn: async () => {
      const [mrRes, poRes, invRes] = await Promise.all([
        customFetch("/api/procurement/material-requests/stats/summary", {
          params: { projectId: selectedProject },
        }),
        customFetch("/api/procurement/purchase-orders/stats/summary", {
          params: { projectId: selectedProject },
        }),
        customFetch("/api/procurement/inventory/stats/summary", {
          params: { projectId: selectedProject },
        }),
      ]);
      const mrStats = mrRes?.data ?? mrRes;
      const poStats = poRes?.data ?? poRes;
      const invStats = invRes?.data ?? invRes;
      return {
        materialRequests: mrStats || {},
        purchaseOrders: poStats || {},
        inventory: invStats || {},
      };
    },
  });

  // Create Material Request
  const createMaterialRequest = useMutation({
    mutationFn: async (data: any) => {
      const response = await customFetch("/api/procurement/material-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-material-requests"] });
      queryClient.invalidateQueries({ queryKey: ["demo-stats"] });
    },
  });

  // Approve Material Request
  const approveMaterialRequest = useMutation({
    mutationFn: async (id: number) => {
      const response = await customFetch(`/api/procurement/material-requests/${id}/approve`, {
        method: "POST",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-material-requests"] });
      queryClient.invalidateQueries({ queryKey: ["demo-stats"] });
    },
  });

  // Create RFQ from Material Request
  const createRfq = useMutation({
    mutationFn: async (materialRequestId: number) => {
      const response = await customFetch(`/api/procurement/rfqs/from-material-request/${materialRequestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["demo-material-requests"] });
    },
  });

  const handleCreateDemoRequest = () => {
    createMaterialRequest.mutate({
      projectId: selectedProject,
      title: "Demo Material Request - " + new Date().toLocaleTimeString(),
      description: "Testing end-to-end procurement workflow",
      category: "civil",
      priority: "high",
      requiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      estimatedCost: 50000,
      items: [
        {
          itemName: "Cement Bags (50kg)",
          quantity: 100,
          unit: "bags",
          specification: "Grade 53",
          estimatedUnitPrice: 450,
          estimatedTotal: 45000,
        },
        {
          itemName: "Steel Rods (12mm)",
          quantity: 50,
          unit: "pieces",
          specification: "TMT Grade",
          estimatedUnitPrice: 650,
          estimatedTotal: 32500,
        },
      ],
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Circle className="w-4 h-4" />;
      case "pending_approval":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Procurement Workflow Demo</h1>
        <p className="text-muted-foreground">
          End-to-end procurement cycle from Material Request to Inventory
        </p>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>Choose a project to view procurement data</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProject.toString()}
            onValueChange={(value) => setSelectedProject(Number(value))}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Project Alpha</SelectItem>
              <SelectItem value="2">Project Beta</SelectItem>
              <SelectItem value="3">Project Gamma</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Material Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.materialRequests?.total || 0}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <Badge variant="outline">Pending: {stats?.materialRequests?.pending_approval ?? stats?.materialRequests?.pending_manager_approval ?? 0}</Badge>
                <Badge variant="outline">Approved: {stats?.materialRequests?.approved || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.purchaseOrders?.total || 0}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <Badge variant="outline">Issued: {stats?.purchaseOrders?.issued || 0}</Badge>
                <Badge variant="outline">Delivered: {stats?.purchaseOrders?.delivered ?? stats?.purchaseOrders?.inspected ?? 0}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inventory?.totalItems ?? stats?.inventory?.total ?? 0}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <Badge variant="outline">Active: {stats?.inventory?.active || 0}</Badge>
                <Badge variant="outline" className="bg-red-50">
                  Low Stock: {stats?.inventory?.low_stock || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Procurement Workflow</CardTitle>
          <CardDescription>Complete lifecycle from requisition to inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium">Material Request</span>
              <Badge variant="outline">{stats?.materialRequests.total || 0}</Badge>
            </div>
            
            <ArrowRight className="w-6 h-6 text-gray-400" />
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium">RFQ</span>
              <Badge variant="outline">-</Badge>
            </div>
            
            <ArrowRight className="w-6 h-6 text-gray-400" />
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium">Purchase Order</span>
              <Badge variant="outline">{stats?.purchaseOrders.total || 0}</Badge>
            </div>
            
            <ArrowRight className="w-6 h-6 text-gray-400" />
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs font-medium">Receipt</span>
              <Badge variant="outline">-</Badge>
            </div>
            
            <ArrowRight className="w-6 h-6 text-gray-400" />
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-xs font-medium">Inspection</span>
              <Badge variant="outline">-</Badge>
            </div>
            
            <ArrowRight className="w-6 h-6 text-gray-400" />
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-xs font-medium">Inventory</span>
              <Badge variant="outline">{stats?.inventory?.totalItems ?? stats?.inventory?.total ?? 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="material-requests">Material Requests</TabsTrigger>
          <TabsTrigger value="rfqs">RFQs</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Test the procurement workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleCreateDemoRequest}
                disabled={createMaterialRequest.isPending}
                className="w-full"
              >
                {createMaterialRequest.isPending ? "Creating..." : "Create Demo Material Request"}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                This will create a sample material request with 2 items (Cement and Steel) 
                that you can then approve and convert to an RFQ.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Material Requests Tab */}
        <TabsContent value="material-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Requests</CardTitle>
              <CardDescription>
                {materialRequests?.length || 0} requests found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materialRequests && materialRequests.length > 0 ? (
                  materialRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <div className="font-medium">{request.requestNumber}</div>
                          <div className="text-sm text-muted-foreground">{request.title}</div>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline">{request.priority}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {request.status === "draft" && (
                          <Button size="sm" variant="outline">
                            Submit
                          </Button>
                        )}
                        {request.status === "pending_approval" && (
                          <Button
                            size="sm"
                            onClick={() => approveMaterialRequest.mutate(request.id)}
                            disabled={approveMaterialRequest.isPending}
                          >
                            Approve
                          </Button>
                        )}
                        {request.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => createRfq.mutate(request.id)}
                            disabled={createRfq.isPending}
                          >
                            Create RFQ
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No material requests found. Create one to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RFQs Tab */}
        <TabsContent value="rfqs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request for Quotations</CardTitle>
              <CardDescription>{rfqs?.length || 0} RFQs found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rfqs && rfqs.length > 0 ? (
                  rfqs.map((rfq: any) => (
                    <div
                      key={rfq.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{rfq.rfqNumber}</div>
                        <div className="text-sm text-muted-foreground">{rfq.title}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getStatusColor(rfq.status)}>
                            {rfq.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline">
                            Vendors: {rfq.sentToVendorCount}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No RFQs found. Approve a material request to create one!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                {purchaseOrders?.length || 0} purchase orders found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchaseOrders && purchaseOrders.length > 0 ? (
                  purchaseOrders.map((po: any) => (
                    <div
                      key={po.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{po.poNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          Vendor: {po.vendorName || "N/A"}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getStatusColor(po.status)}>
                            {po.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline">
                            ₹{Number(po.totalAmount).toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No purchase orders found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                {inventory?.length || 0} items in inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventory && inventory.length > 0 ? (
                  inventory.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-muted-foreground">
                          Code: {item.itemCode}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            Available: {Number(item.availableQuantity)} {item.unit}
                          </Badge>
                          <Badge variant="outline">
                            Total: {Number(item.totalQuantity)} {item.unit}
                          </Badge>
                          {Number(item.availableQuantity) <= Number(item.minimumStock) && (
                            <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No inventory items found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
