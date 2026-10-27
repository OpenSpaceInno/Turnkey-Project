import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CloudOff,
  Cloud,
  RefreshCw,
  Trash2,
  Send,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  HardHat,
  Camera,
  Wifi,
  WifiOff,
} from "lucide-react";
import { type OfflineDprItem } from "@/lib/offline-dpr-queue";

interface OfflineDprQueueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OfflineDprItem[];
  isOnline: boolean;
  isSyncing: boolean;
  onSyncAll: () => Promise<any>;
  onSyncItem: (item: OfflineDprItem) => Promise<boolean>;
  onDeleteItem: (id: string) => Promise<void>;
  onViewItem?: (item: OfflineDprItem) => void;
}

export function OfflineDprQueueModal({
  open,
  onOpenChange,
  items,
  isOnline,
  isSyncing,
  onSyncAll,
  onSyncItem,
  onDeleteItem,
}: OfflineDprQueueModalProps) {
  const pendingItems = items.filter((i) => i.syncStatus !== "synced");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border bg-card/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <CloudOff className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  Offline DPR Queue
                  <Badge variant={isOnline ? "default" : "destructive"} className="text-xs font-medium gap-1">
                    {isOnline ? (
                      <>
                        <Wifi className="w-3 h-3 text-emerald-300" /> Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" /> Offline Mode
                      </>
                    )}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Reports saved locally on this device. They upload automatically when connected.
                </DialogDescription>
              </div>
            </div>

            {pendingItems.length > 0 && isOnline && (
              <Button
                size="sm"
                onClick={() => onSyncAll()}
                disabled={isSyncing}
                className="gap-1.5 bg-primary shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync All Now"}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* List of Offline Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {pendingItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground text-sm">Offline Queue is Empty</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  All Daily Progress Reports have been synchronized with the cloud server.
                  New reports created without an active connection will appear here.
                </p>
              </div>
            </div>
          ) : (
            pendingItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {item.reportDate}
                      </span>
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {item.shift}
                      </Badge>
                      <Badge variant="secondary" className="text-[11px] font-normal">
                        {item.weather}
                      </Badge>
                      {item.syncStatus === "failed" && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Failed ({item.retryCount} tries)
                        </Badge>
                      )}
                    </div>
                    {item.projectName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {item.projectName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isOnline && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSyncItem(item)}
                        disabled={isSyncing}
                        className="h-8 gap-1 text-xs"
                      >
                        <Send className="w-3 h-3 text-primary" />
                        Sync
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteItem(item.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Delete offline record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-accent/40 text-xs text-foreground/90 whitespace-pre-line line-clamp-3 font-mono">
                  {item.workSummary}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <HardHat className="w-3.5 h-3.5 text-primary/80" />
                      {item.manpowerCount} Workers
                    </span>
                    {item.photos && item.photos.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-emerald-500" />
                        {item.photos.length} Photo{item.photos.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Queued: {new Date(item.queuedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {item.syncError && (
                  <div className="p-2 rounded bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Error: {item.syncError}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border bg-card/60 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-primary" />
            <span>
              {pendingItems.length} report{pendingItems.length === 1 ? "" : "s"} stored locally
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
