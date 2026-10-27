import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  WifiOff,
  CloudOff,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface OfflineStatusBannerProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSyncNow: () => Promise<any>;
  onOpenQueue: () => void;
}

export function OfflineStatusBanner({
  isOnline,
  pendingCount,
  isSyncing,
  onSyncNow,
  onOpenQueue,
}: OfflineStatusBannerProps) {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  // If online and no pending items and no install banner, render minimal status badge
  if (isOnline && pendingCount === 0 && !installPrompt) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold flex items-center gap-1.5">
                Offline Mode Active (Mobile PWA)
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
                  Site Execution
                </Badge>
              </p>
              <p className="text-[11px] text-muted-foreground">
                You can create and submit DPRs without internet. They are safely saved on your device and will auto-upload when you reconnect.
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenQueue}
              className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-800 dark:text-amber-200 shrink-0"
            >
              <CloudOff className="w-3.5 h-3.5" />
              View Queue ({pendingCount})
            </Button>
          )}
        </div>
      )}

      {/* Online with Pending Sync Banner */}
      {isOnline && pendingCount > 0 && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-foreground shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 text-primary">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold flex items-center gap-1.5">
                Internet Connection Restored
                <Badge variant="secondary" className="text-[10px]">
                  {pendingCount} Queued DPR{pendingCount > 1 ? "s" : ""}
                </Badge>
              </p>
              <p className="text-[11px] text-muted-foreground">
                You have {pendingCount} offline report{pendingCount > 1 ? "s" : ""} saved on this device ready to synchronize.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenQueue}
              className="h-8 text-xs"
            >
              View Queue
            </Button>
            <Button
              size="sm"
              onClick={() => onSyncNow()}
              disabled={isSyncing}
              className="h-8 gap-1.5 text-xs bg-primary shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync All Now"}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile PWA Install Prompt (if available) */}
      {installPrompt && !isInstalled && (
        <div className="p-3 rounded-xl bg-accent/40 border border-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
              <Download className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Install Kanak DPR Mobile App</span>
              <p className="text-[11px] text-muted-foreground">
                Add to your home screen for rapid offline site reporting.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleInstallClick} className="h-7 text-xs gap-1">
            Install PWA
          </Button>
        </div>
      )}
    </div>
  );
}
