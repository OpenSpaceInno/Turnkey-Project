import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetMaterialRequest,
  useUpdateMaterialRequest,
  useAddMaterialRequestItem,
  useUpdateMaterialRequestItem,
  useDeleteMaterialRequestItem,
  useListProjects,
  type MaterialRequestItem,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronLeft, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ItemForm = {
  id?: number;
  itemName: string;
  description: string;
  specification: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
};

export default function EditMaterialRequest() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: projects } = useListProjects();
  const { data: request, isLoading } = useGetMaterialRequest(Number(id));
  const updateMutation = useUpdateMaterialRequest();
  const addItemMutation = useAddMaterialRequestItem();
  const updateItemMutation = useUpdateMaterialRequestItem();
  const deleteItemMutation = useDeleteMaterialRequestItem();

  // Form state
  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
    category: "civil",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    requiredDate: "",
    notes: "",
  });

  // Items state
  const [items, setItems] = useState<ItemForm[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);

  // Load existing data
  useEffect(() => {
    if (request) {
      setForm({
        projectId: String(request.projectId || ""),
        title: request.title || "",
        description: request.description || "",
        category: request.category || "civil",
        priority: (request.priority as any) || "medium",
        requiredDate: request.requiredDate?.split("T")[0] || "",
        notes: request.notes || "",
      });

      if (request.items && request.items.length > 0) {
        setItems(request.items.map(item => ({
          id: item.id,
          itemName: item.itemName || "",
          description: item.description || "",
          specification: item.specification || "",
          quantity: item.quantity || 0,
          unit: item.unit || "",
          estimatedUnitPrice: item.estimatedUnitPrice || 0,
          estimatedTotal: item.estimatedTotal || 0,
        })));
      } else {
        // Add one empty item if none exist
        setItems([{
          itemName: "",
          description: "",
          specification: "",
          quantity: 0,
          unit: "",
          estimatedUnitPrice: 0,
          estimatedTotal: 0,
        }]);
      }
    }
  }, [request]);

  // Add new item
  const addItem = () => {
    setItems([
      ...items,
      {
        itemName: "",
        description: "",
        specification: "",
        quantity: 0,
        unit: "",
        estimatedUnitPrice: 0,
        estimatedTotal: 0,
      },
    ]);
  };

  // Remove item
  const removeItem = (index: number) => {
    const item = items[index];
    if (item.id) {
      // Mark existing item for deletion
      setDeletedItemIds([...deletedItemIds, item.id]);
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate total
    if (field === "quantity" || field === "estimatedUnitPrice") {
      const item = newItems[index];
      item.estimatedTotal = (item.quantity || 0) * (item.estimatedUnitPrice || 0);
    }

    setItems(newItems);
  };

  // Calculate total estimated cost
  const totalEstimatedCost = items.reduce((sum, item) => sum + (item.estimatedTotal || 0), 0);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.projectId || !form.title || !form.requiredDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0 || !items[0].itemName) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update basic info
      await updateMutation.mutateAsync({
        id: Number(id),
        data: {
          title: form.title,
          description: form.description || undefined,
          category: form.category,
          priority: form.priority,
          requiredDate: form.requiredDate,
          estimatedCost: totalEstimatedCost || undefined,
          notes: form.notes || undefined,
        },
      });

      // Delete removed items
      for (const itemId of deletedItemIds) {
        await deleteItemMutation.mutateAsync({
          materialRequestId: Number(id),
          itemId,
        });
      }

      // Add or update items
      for (const item of items) {
        if (!item.itemName.trim()) continue;

        if (item.id) {
          // Update existing item
          await updateItemMutation.mutateAsync({
            materialRequestId: Number(id),
            itemId: item.id,
            data: {
              itemName: item.itemName,
              description: item.description || undefined,
              specification: item.specification || undefined,
              quantity: item.quantity,
              unit: item.unit,
              estimatedUnitPrice: item.estimatedUnitPrice || undefined,
              estimatedTotal: item.estimatedTotal || undefined,
            },
          });
        } else {
          // Add new item
          await addItemMutation.mutateAsync({
            materialRequestId: Number(id),
            item: {
              itemName: item.itemName,
              description: item.description || undefined,
              specification: item.specification || undefined,
              quantity: item.quantity,
              unit: item.unit,
              estimatedUnitPrice: item.estimatedUnitPrice || undefined,
              estimatedTotal: item.estimatedTotal || undefined,
            },
          });
        }
      }

      toast({
        title: "Success",
        description: "Material request updated successfully",
      });

      navigate(`/procurement/material-requests/${id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update material request",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-medium">Request not found</p>
          <Button onClick={() => navigate("/procurement/material-requests")} className="mt-4">
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  if (request.status !== "draft") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium">Cannot edit submitted request</p>
          <p className="text-sm text-muted-foreground">
            Only draft requests can be edited. This request has status: {request.status}
          </p>
          <Button onClick={() => navigate(`/procurement/material-requests/${id}`)} className="mt-4">
            Back to Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/procurement/material-requests/${id}`)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Material Request</h1>
          <p className="text-muted-foreground">
            Update material request and items
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">
                  Project <span className="text-destructive">*</span>
                </Label>
                <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(projects) ? projects : []).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="required-date">
                  Required Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="required-date"
                  type="date"
                  value={form.requiredDate}
                  onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Steel bars for foundation work"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide additional details about this request..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="finishing">Finishing</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v: any) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated-cost">Estimated Cost (₹)</Label>
                <Input
                  id="estimated-cost"
                  type="number"
                  value={totalEstimatedCost}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or special instructions..."
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Material Items</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Item Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g., TMT Steel Bars 16mm"
                      value={item.itemName}
                      onChange={(e) => updateItem(index, "itemName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Brief description of the item"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Specification</Label>
                    <Textarea
                      placeholder="Technical specifications, grade, standards, etc."
                      rows={2}
                      value={item.specification}
                      onChange={(e) => updateItem(index, "specification", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="kg, ton, pcs, sqft, etc."
                      value={item.unit}
                      onChange={(e) => updateItem(index, "unit", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Unit Price (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.estimatedUnitPrice || ""}
                      onChange={(e) =>
                        updateItem(index, "estimatedUnitPrice", Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total (₹)</Label>
                    <Input
                      type="number"
                      value={item.estimatedTotal || ""}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/procurement/material-requests/${id}`)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={updateMutation.isPending || addItemMutation.isPending || updateItemMutation.isPending || deleteItemMutation.isPending} 
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {(updateMutation.isPending || addItemMutation.isPending || updateItemMutation.isPending || deleteItemMutation.isPending) ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
