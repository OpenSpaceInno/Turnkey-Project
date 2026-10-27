import React from "react";
import { useGetProjectVendors } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, FileText, Phone, Mail, Building2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProjectVendorsTab({ projectId }: { projectId: number }) {
  const [, setLocation] = useLocation();
  const { data: vendors = [], isLoading } = useGetProjectVendors(projectId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Trade Vendors & Subcontractors</h2>
          <p className="text-xs text-muted-foreground">
            Specialized subcontractors, suppliers, and labor agencies engaged under commercial work orders for this project.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setLocation(`/contracts/new?projectId=${projectId}&type=vendor`)}
        >
          <Plus className="h-4 w-4" />
          Engage Vendor / Add Work Order
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((i) => (
            <Card key={i} className="h-40 bg-muted/40" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto stroke-1" />
          <p className="text-sm font-semibold">No vendor work orders linked to this project</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Engage civil, MEP, interior, and specialized trade contractors by issuing project-linked vendor contracts.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/contracts/new?projectId=${projectId}&type=vendor`)}
          >
            Create First Vendor Work Order
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((v) => (
            <Card key={v.id} className="border shadow-sm hover:shadow transition-shadow">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      {v.vendorName || "Subcontractor"}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono mt-0.5">
                      Contract #{v.contractNumber}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs font-medium">
                    {v.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="text-xs text-foreground font-medium">
                  {v.title}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                  <div>
                    <span className="text-muted-foreground block">Contract Value</span>
                    <span className="font-bold text-sm text-foreground">
                      {INR.format(v.totalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Retention / Advance</span>
                    <span className="font-semibold text-foreground">
                      {v.retentionPercent}% / {v.advancePercent}%
                    </span>
                  </div>
                </div>

                {(v.vendorEmail || v.vendorPhone) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
                    {v.vendorEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {v.vendorEmail}
                      </span>
                    )}
                    {v.vendorPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {v.vendorPhone}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
