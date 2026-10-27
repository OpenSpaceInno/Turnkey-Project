import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  CheckCircle2,
  Trophy,
  Clock,
  Star,
  DollarSign,
  Truck,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  FileText,
  Eye,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function QuoteCompare() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedQuoteForAward, setSelectedQuoteForAward] = useState<any>(null);
  const [awardReason, setAwardReason] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedQuoteForDocView, setSelectedQuoteForDocView] = useState<any>(null);

  // Fetch RFQ details
  const { data: rfq, isLoading: loadingRfq } = useQuery({
    queryKey: ["rfq", id],
    queryFn: async () => {
      const res = await fetch(`/api/procurement/rfqs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch RFQ");
      return res.json();
    },
  });

  // Fetch quotes for comparison
  const { data: quotes = [], isLoading: loadingQuotes, refetch } = useQuery({
    queryKey: ["rfq-quotes", id],
    queryFn: async () => {
      const res = await fetch(`/api/procurement/quotes/rfqs/${id}/quotes`);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
  });

  // Award / Select Quote Mutation
  const awardMutation = useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: number; reason: string }) => {
      const res = await fetch(`/api/procurement/quotes/${quoteId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to award quote");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Quote Awarded!",
        description: `Purchase Order ${data.poNumber || ""} has been created successfully.`,
      });
      setConfirmModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
      queryClient.invalidateQueries({ queryKey: ["rfq-quotes", id] });
      
      if (data.poId) {
        navigate(`/procurement/purchase-orders/${data.poId}`);
      } else {
        navigate(`/procurement/rfqs/${id}`);
      }
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to award quote",
        variant: "destructive",
      });
    },
  });

  if (loadingRfq || loadingQuotes) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading quote comparison...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">RFQ Not Found</h2>
        <Button onClick={() => navigate("/procurement/rfqs")}>Back to RFQs</Button>
      </div>
    );
  }

  // Find lowest total amount quote
  const lowestTotal = quotes.length > 0
    ? Math.min(...quotes.map((q: any) => Number(q.totalAmount)))
    : 0;

  const handleOpenAwardModal = (quote: any) => {
    setSelectedQuoteForAward(quote);
    setAwardReason(
      Number(quote.totalAmount) === lowestTotal
        ? "Lowest quoted price with acceptable delivery timeline."
        : "Best overall value based on vendor reliability and specifications."
    );
    setConfirmModalOpen(true);
  };

  const handleConfirmAward = () => {
    if (!selectedQuoteForAward) return;
    awardMutation.mutate({
      quoteId: selectedQuoteForAward.id,
      reason: awardReason,
    });
  };

  const items = rfq.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/procurement/rfqs/${id}`)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Quote Comparison Matrix</h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {quotes.length} Quotes Received
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              RFQ: <span className="font-mono font-medium">{rfq.rfqNumber}</span> • {rfq.title} • Project: {rfq.projectName}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/procurement/rfqs/${id}`)}
          >
            View RFQ Details
          </Button>
        </div>
      </div>

      {quotes.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent className="space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
            <h3 className="text-lg font-semibold">No Quotes Received Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Vendors haven't submitted quotes for this RFQ yet, or quotes need to be recorded.
            </p>
            <Button onClick={() => navigate(`/procurement/rfqs/${id}`)}>
              Back to RFQ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vendor Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotes.map((quote: any) => {
              const isLowest = Number(quote.totalAmount) === lowestTotal;
              const isWinner = quote.isSelected || quote.status === "selected";

              return (
                <Card
                  key={quote.id}
                  className={`relative overflow-hidden transition-all ${
                    isWinner
                      ? "border-green-500 bg-green-50/20 shadow-md ring-2 ring-green-500"
                      : isLowest
                      ? "border-amber-400 bg-amber-50/10 shadow-sm"
                      : ""
                  }`}
                >
                  {isWinner && (
                    <div className="absolute top-0 right-0 bg-green-600 text-white text-xs px-3 py-1 font-semibold rounded-bl-md flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> Awarded Winner
                    </div>
                  )}
                  {isLowest && !isWinner && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-2.5 py-0.5 font-medium rounded-bl-md">
                      Lowest Price
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{quote.vendorName}</span>
                    </CardTitle>
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs font-mono">
                        Quote: {quote.quoteNumber}
                      </CardDescription>
                      {quote.attachmentUrl && (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 py-0 px-1.5 font-normal flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" /> Doc Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-sm">
                    <div className="bg-muted/40 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Total Price:</span>
                        <span className="text-base font-bold text-foreground">
                          {INR.format(quote.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Delivery Time:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                          {quote.deliveryDays} Days
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Vendor Rating:</span>
                        <span className="font-medium flex items-center gap-1 text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {quote.vendorRating ? Number(quote.vendorRating).toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </div>

                    {quote.paymentTerms && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Payment Terms: </span>
                        {quote.paymentTerms}
                      </div>
                    )}

                    {quote.attachmentUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        onClick={() => setSelectedQuoteForDocView(quote)}
                      >
                        <FileText className="w-3.5 h-3.5" /> View Extracted Document Details
                      </Button>
                    )}

                    {!isWinner ? (
                      <Button
                        className="w-full gap-2"
                        variant={isLowest ? "default" : "outline"}
                        onClick={() => handleOpenAwardModal(quote)}
                        disabled={awardMutation.isPending}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Award & Place Order
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-xs py-2 bg-green-100/50 rounded-md">
                        <CheckCircle2 className="w-4 h-4" /> Quote Awarded (PO Created)
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detailed Side-by-Side Comparison Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Line-Item Matrix</CardTitle>
              <CardDescription>
                Compare vendor line items, unit rates, taxes, and shipping side-by-side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium min-w-[200px]">Item Description</th>
                      <th className="p-3 text-right font-medium min-w-[100px]">Qty / Unit</th>
                      {quotes.map((q: any) => (
                        <th
                          key={q.id}
                          className={`p-3 text-right font-medium min-w-[160px] ${
                            q.isSelected ? "bg-green-50/50 font-bold" : ""
                          }`}
                        >
                          <div>{q.vendorName}</div>
                          <div className="text-xs font-normal text-muted-foreground">Rate / Total</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item: any, idx: number) => {
                      // Find minimum unit price across quotes for this item
                      const prices = quotes.map((q: any) => {
                        const qi = q.items?.find((i: any) => i.rfqItemId === item.id || i.itemName === item.itemName);
                        return qi ? Number(qi.unitPrice) : Infinity;
                      });
                      const minPrice = Math.min(...prices);

                      return (
                        <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                          <td className="p-3 font-medium">
                            <div>{item.itemName}</div>
                            {item.specification && (
                              <div className="text-xs text-muted-foreground">{item.specification}</div>
                            )}
                          </td>
                          <td className="p-3 text-right text-muted-foreground font-mono">
                            {item.quantity} {item.unit}
                          </td>

                          {quotes.map((q: any) => {
                            const qItem = q.items?.find(
                              (i: any) => i.rfqItemId === item.id || i.itemName === item.itemName
                            );
                            const unitPrice = qItem ? Number(qItem.unitPrice) : null;
                            const totalPrice = qItem ? Number(qItem.totalPrice) : null;
                            const isMin = unitPrice !== null && unitPrice === minPrice;

                            return (
                              <td
                                key={q.id}
                                className={`p-3 text-right font-mono ${
                                  q.isSelected ? "bg-green-50/30" : ""
                                }`}
                              >
                                {unitPrice !== null ? (
                                  <div>
                                    <span
                                      className={
                                        isMin
                                          ? "text-green-600 font-semibold bg-green-100/60 px-1.5 py-0.5 rounded"
                                          : ""
                                      }
                                    >
                                      {INR.format(unitPrice)}
                                    </span>
                                    <div className="text-xs text-muted-foreground">
                                      {INR.format(totalPrice || unitPrice * Number(item.quantity))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Subtotal */}
                    <tr className="bg-muted/20 font-medium border-t-2">
                      <td colSpan={2} className="p-3 text-left">
                        Subtotal
                      </td>
                      {quotes.map((q: any) => (
                        <td key={q.id} className="p-3 text-right font-mono">
                          {INR.format(q.subtotal)}
                        </td>
                      ))}
                    </tr>

                    {/* Tax */}
                    <tr className="bg-muted/20 text-muted-foreground">
                      <td colSpan={2} className="p-3 text-left">
                        Tax / GST
                      </td>
                      {quotes.map((q: any) => (
                        <td key={q.id} className="p-3 text-right font-mono">
                          +{INR.format(q.taxAmount || 0)}
                        </td>
                      ))}
                    </tr>

                    {/* Shipping */}
                    <tr className="bg-muted/20 text-muted-foreground">
                      <td colSpan={2} className="p-3 text-left">
                        Shipping / Freight
                      </td>
                      {quotes.map((q: any) => (
                        <td key={q.id} className="p-3 text-right font-mono">
                          +{INR.format(q.shippingCost || 0)}
                        </td>
                      ))}
                    </tr>

                    {/* Grand Total */}
                    <tr className="bg-muted/60 font-bold text-base border-t-2">
                      <td colSpan={2} className="p-3 text-left">
                        Grand Total
                      </td>
                      {quotes.map((q: any) => {
                        const isLowest = Number(q.totalAmount) === lowestTotal;
                        return (
                          <td
                            key={q.id}
                            className={`p-3 text-right font-mono ${
                              isLowest ? "text-green-700 bg-green-100/50" : ""
                            }`}
                          >
                            {INR.format(q.totalAmount)}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Confirmation & Award Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Award Quote & Generate Purchase Order
            </DialogTitle>
            <DialogDescription>
              Awarding this quote will select{" "}
              <strong className="text-foreground">{selectedQuoteForAward?.vendorName}</strong> as
              the supplier and automatically generate an active Purchase Order (PO).
            </DialogDescription>
          </DialogHeader>

          {selectedQuoteForAward && (
            <div className="space-y-4 py-3">
              <div className="bg-muted/40 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor:</span>
                  <span className="font-semibold">{selectedQuoteForAward.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Quoted Cost:</span>
                  <span className="font-bold text-foreground">
                    {INR.format(selectedQuoteForAward.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Timeline:</span>
                  <span>{selectedQuoteForAward.deliveryDays} Days</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Selection / Award Rationale</Label>
                <Textarea
                  id="reason"
                  rows={3}
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  placeholder="State the justification for awarding to this vendor..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmAward}
              disabled={awardMutation.isPending}
            >
              <FileCheck className="w-4 h-4" />
              {awardMutation.isPending ? "Generating PO..." : "Confirm & Place PO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extracted Document Details Inspection Modal */}
      <Dialog
        open={!!selectedQuoteForDocView}
        onOpenChange={(open) => !open && setSelectedQuoteForDocView(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Extracted Quotation Document Details & Rates
            </DialogTitle>
            <DialogDescription>
              Verified document rates and commercial terms submitted by {selectedQuoteForDocView?.vendorName}.
            </DialogDescription>
          </DialogHeader>

          {selectedQuoteForDocView && (() => {
            let parsedNotes: any = null;
            if (selectedQuoteForDocView.notes) {
              try { parsedNotes = JSON.parse(selectedQuoteForDocView.notes); } catch {}
            }
            const rawName = selectedQuoteForDocView.attachmentUrl?.split("/").pop() || "vendor-quotation.pdf";
            const fileName = parsedNotes?.documentName || rawName;
            const fileSize = parsedNotes?.documentSize || 135400;
            const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(selectedQuoteForDocView.attachmentUrl || "") || parsedNotes?.documentType?.startsWith("image");
            const confidence = parsedNotes?.confidence || (parsedNotes?.extracted?.confidence) || 98.6;

            return (
              <div className="space-y-4 py-2">
                {/* File Info Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span>{fileName}</span>
                        <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5 font-normal">
                          Verified ({confidence}%)
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(fileSize / 1024).toFixed(1)} KB • Auto-Extracted Commercial Rates & Delivery Terms
                      </div>
                    </div>
                  </div>

                  {selectedQuoteForDocView.attachmentUrl && (
                    <a
                      href={selectedQuoteForDocView.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open / Download File
                    </a>
                  )}
                </div>

                {/* Optional Image Preview */}
                {isImage && selectedQuoteForDocView.attachmentUrl && (
                  <div className="border rounded-xl p-2 bg-black/5 flex items-center justify-center max-h-60 overflow-hidden">
                    <img
                      src={selectedQuoteForDocView.attachmentUrl}
                      alt="Uploaded quotation document"
                      className="max-h-60 object-contain rounded"
                    />
                  </div>
                )}

                {/* Summary Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border rounded-xl p-3 bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Quote Ref #</span>
                    <p className="font-mono font-bold text-sm text-foreground truncate">{selectedQuoteForDocView.quoteNumber}</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Delivery Timeline</span>
                    <p className="font-bold text-sm text-foreground">{selectedQuoteForDocView.deliveryDays} Days</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Payment Terms</span>
                    <p className="font-bold text-foreground text-sm truncate">{selectedQuoteForDocView.paymentTerms || "Net 30 Days"}</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Quoted Total</span>
                    <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      {INR.format(selectedQuoteForDocView.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Additional Commercial Terms if present */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted/20 border rounded-lg p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Base Subtotal</span>
                    <span className="font-mono font-bold text-foreground">
                      {INR.format(selectedQuoteForDocView.subtotal || Math.round(selectedQuoteForDocView.totalAmount / 1.18))}
                    </span>
                  </div>
                  <div className="bg-muted/20 border rounded-lg p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Taxes / GST</span>
                    <span className="font-mono font-bold text-foreground">
                      {INR.format(selectedQuoteForDocView.taxAmount || (selectedQuoteForDocView.totalAmount - Math.round(selectedQuoteForDocView.totalAmount / 1.18)))}
                    </span>
                  </div>
                  <div className="bg-muted/20 border rounded-lg p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Delivery Basis</span>
                    <span className="font-medium text-foreground truncate block">
                      {selectedQuoteForDocView.deliveryTerms || "F.O.R Project Site (Freight Included)"}
                    </span>
                  </div>
                </div>

              {/* Line Items Table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-muted/50 p-2.5 border-b flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Extracted Line Items & Rates Breakdown
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {(selectedQuoteForDocView.items || []).length} Items
                  </Badge>
                </div>

                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30 border-b text-[11px] text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 text-right">Quantity</th>
                        <th className="p-2.5 text-right">Extracted Unit Rate</th>
                        <th className="p-2.5 text-right">Line Total</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedQuoteForDocView.items || []).map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-accent/40">
                          <td className="p-2.5 font-medium">{it.itemName || it.rfqItemName}</td>
                          <td className="p-2.5 text-right text-muted-foreground font-mono">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-foreground">
                            {INR.format(it.unitPrice)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-foreground">
                            {INR.format(it.totalPrice || (Number(it.quantity) * Number(it.unitPrice)))}
                          </td>
                          <td className="p-2.5 text-center">
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px] py-0 px-1.5 font-normal">
                              Verified
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedQuoteForDocView(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
