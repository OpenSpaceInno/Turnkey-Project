import { useState, useEffect, useCallback } from "react";
import {
  getOfflineDprs,
  saveDprOffline,
  deleteOfflineDpr,
  syncSingleOfflineDpr,
  syncAllOfflineDprs,
  type OfflineDprItem,
} from "@/lib/offline-dpr-queue";
import { useToast } from "@/hooks/use-toast";

export function useOfflineDpr() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [offlineDprs, setOfflineDprs] = useState<OfflineDprItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshQueue = useCallback(async () => {
    try {
      const items = await getOfflineDprs();
      setOfflineDprs(items);
    } catch (err) {
      console.warn("Error refreshing offline DPR queue:", err);
    }
  }, []);

  // Set up listeners for online/offline & custom queue events
  useEffect(() => {
    refreshQueue();

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You are back online. Checking for pending offline DPRs...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "Working Offline",
        description: "No internet connection detected. DPRs will be saved locally on your device.",
      });
    };

    const handleQueueUpdated = (e: any) => {
      if (e.detail?.items) {
        setOfflineDprs(e.detail.items);
      } else {
        refreshQueue();
      }
    };

    const handleAutoSynced = (e: any) => {
      const { synced, failed } = e.detail || {};
      refreshQueue();
      if (synced > 0) {
        toast({
          title: "Offline DPRs Synced",
          description: `Successfully uploaded ${synced} report${synced > 1 ? "s" : ""} to the server.`,
        });
      }
      if (failed > 0) {
        toast({
          variant: "destructive",
          title: "Sync Incomplete",
          description: `${failed} report${failed > 1 ? "s" : ""} could not be synced. Will retry.`,
        });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-dprs-updated", handleQueueUpdated);
    window.addEventListener("offline-dprs-auto-synced", handleAutoSynced);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-dprs-updated", handleQueueUpdated);
      window.removeEventListener("offline-dprs-auto-synced", handleAutoSynced);
    };
  }, [refreshQueue, toast]);

  const saveOffline = async (dprData: Omit<OfflineDprItem, "id" | "queuedAt" | "syncStatus" | "retryCount">) => {
    const item = await saveDprOffline(dprData);
    await refreshQueue();
    return item;
  };

  const syncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncAllOfflineDprs();
      await refreshQueue();
      if (res.synced > 0) {
        toast({
          title: "Sync Successful",
          description: `Synced ${res.synced} offline Daily Progress Report${res.synced > 1 ? "s" : ""}.`,
        });
      } else if (res.total === 0) {
        toast({
          title: "Queue Empty",
          description: "All DPR reports are already up to date on the server.",
        });
      }
      if (res.failed > 0) {
        toast({
          variant: "destructive",
          title: "Sync Issues",
          description: `${res.failed} report(s) failed to sync: ${res.errors.join(", ")}`,
        });
      }
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteItem = async (id: string) => {
    await deleteOfflineDpr(id);
    await refreshQueue();
    toast({
      title: "Offline DPR Removed",
      description: "Queued report has been deleted from your device.",
    });
  };

  const syncItem = async (item: OfflineDprItem) => {
    setIsSyncing(true);
    try {
      const res = await syncSingleOfflineDpr(item);
      await refreshQueue();
      if (res.success) {
        toast({
          title: "DPR Synced",
          description: `Report for ${item.reportDate} uploaded to server.`,
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: res.error || "Failed to upload DPR",
        });
        return false;
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = offlineDprs.filter((i) => i.syncStatus !== "synced").length;

  return {
    isOnline,
    offlineDprs,
    pendingCount,
    isSyncing,
    saveOffline,
    syncNow,
    deleteItem,
    syncItem,
    refreshQueue,
  };
}
