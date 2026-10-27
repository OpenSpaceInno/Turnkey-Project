import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Receipt,
  Printer,
} from "lucide-react";
import { format } from "date-fns";

export interface DocumentPreviewData {
  url: string;
  title?: string;
  type?: "receipt" | "document" | "invoice" | "bill" | "ra_bill";
  description?: string;
  amount?: number | string;
  date?: string;
  projectName?: string;
  category?: string;
  status?: string;
  invoiceNumber?: string;
  vendorName?: string;
}

interface DocumentPreviewModalProps {
  preview: DocumentPreviewData | null;
  onClose: () => void;
}

export function DocumentPreviewModal({ preview, onClose }: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [imageError, setImageError] = useState(false);

  if (!preview) return null;

  const url = preview.url || "";
  const isDataImage = url.startsWith("data:image/");
  const isDataPdf = url.startsWith("data:application/pdf");
  const isImageExt = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
  const isPdfExt = /\.pdf(\?.*)?$/i.test(url);
  const isImage = (isDataImage || isImageExt) && !imageError;
  const isPdf = isDataPdf || isPdfExt;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const formattedAmount =
    preview.amount !== undefined && preview.amount !== null
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(Number(preview.amount))
      : "₹0.00";

  const formattedDate = preview.date
    ? format(new Date(preview.date), "dd MMM yyyy, hh:mm a")
    : format(new Date(), "dd MMM yyyy, hh:mm a");

  const receiptNo =
    preview.invoiceNumber ||
    `RCP-${Math.abs(
      (preview.description || "EXP").split("").reduce((acc, c) => acc + c.charCodeAt(0), 1000)
    )
      .toString()
      .slice(0, 6)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-950/80 border-slate-800 shadow-2xl backdrop-blur-md text-slate-100">
        <DialogDescription className="sr-only">
          Official receipt and document preview for {receiptNo}
        </DialogDescription>
        {/* Minimal Floating Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xs text-slate-300 font-medium tracking-normal">
            <Receipt className="w-4 h-4 text-primary" />
            <span>Receipt #{receiptNo}</span>
          </DialogTitle>

          <div className="flex items-center gap-1.5">
            {isImage && (
              <div className="flex items-center bg-slate-800/80 rounded-md p-0.5 mr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[11px] font-mono px-1.5 text-slate-400">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={handleZoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>

            {url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800"
                asChild
              >
                <a href={url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm text-slate-400 hover:text-white hover:bg-slate-800 ml-1"
              onClick={onClose}
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pure Receipt Display Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-900/50">
          {isImage ? (
            /* Attached Image Receipt */
            <div className="max-w-full max-h-full overflow-auto flex items-center justify-center">
              <img
                src={url}
                alt="Receipt"
                style={{
                  transform: `scale(${zoom})`,
                  transition: "transform 0.15s ease-out",
                  transformOrigin: "center center",
                }}
                className="max-h-[75vh] max-w-full object-contain rounded-md shadow-2xl border border-slate-700 bg-white"
                onError={() => setImageError(true)}
              />
            </div>
          ) : isPdf ? (
            /* Attached PDF Receipt */
            <div className="w-full h-[75vh] rounded-md border border-slate-700 bg-white overflow-hidden shadow-2xl">
              <iframe
                src={url}
                className="w-full h-full border-0"
                title="Receipt PDF"
              />
            </div>
          ) : (
            /* Standalone Clean Paper Receipt Slip */
            <div className="w-full max-w-md bg-[#fffdfa] text-slate-900 rounded-sm shadow-2xl p-6 sm:p-8 border border-slate-300 font-mono relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
              {/* Perforated Top Edge Effect */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)" />

              {/* Receipt Header */}
              <div className="text-center pb-4 border-b-2 border-dashed border-slate-300">
                <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  *** CASH RECEIPT / BILL ***
                </div>
                <div className="text-lg font-black tracking-tight text-slate-900 mt-1 font-sans">
                  KANAK TURNKEY PROJECTS
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Turnkey Interior & Infrastructure Solutions
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  GSTIN: 27AABCK1234F1Z8
                </div>
                <div className="text-[11px] text-slate-600 font-bold mt-2">
                  RECEIPT #: {receiptNo}
                </div>
                <div className="text-[11px] text-slate-500">
                  DATE: {formattedDate}
                </div>
              </div>

              {/* Receipt Body / Items */}
              <div className="py-4 border-b-2 border-dashed border-slate-300 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-700 pb-1 border-b border-slate-200 text-[11px]">
                  <span>PARTICULARS</span>
                  <span>AMOUNT (INR)</span>
                </div>
                <div className="flex justify-between py-1.5 items-start">
                  <div className="pr-3">
                    <p className="font-sans font-semibold text-slate-900 text-xs leading-snug">
                      {preview.description || "General Expense Payment"}
                    </p>
                    {preview.category && (
                      <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                        Category: {preview.category}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {formattedAmount}
                  </span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="py-3 border-b-2 border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                  <span>TOTAL AMOUNT:</span>
                  <span className="text-base text-slate-900">{formattedAmount}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>PAYMENT STATUS:</span>
                  <span className="uppercase font-bold text-emerald-700">
                    {preview.status || "APPROVED"}
                  </span>
                </div>
              </div>

              {/* Stamp & Footer */}
              <div className="pt-5 text-center space-y-3">
                <div className="inline-block border-2 border-emerald-700 text-emerald-700 uppercase font-black text-xs px-3 py-1 rounded rotate-[-2deg] tracking-widest shadow-sm">
                  ✓ VERIFIED & PAID
                </div>
                <p className="text-[10px] text-slate-500">
                  Computer generated official receipt voucher
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
