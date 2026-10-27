// Kanak Turnkey — Offline DPR Submission Queue Engine (IndexedDB + localStorage fallback)

export interface OfflineDprItem {
  id: string;
  projectId: number;
  projectName?: string;
  reportDate: string;
  weather: string;
  shift: string;
  workLocation?: string;
  workSummary: string;
  materialsConsumed?: string;
  manpowerCount: number;
  manpowerBreakdown?: Record<string, any> | null;
  equipmentNotes?: string;
  siteIssues?: string;
  status: string;
  photos?: any[];
  queuedAt: string;
  syncStatus: "pending" | "syncing" | "failed" | "synced";
  syncError?: string;
  retryCount: number;
}

const DB_NAME = "kanak_turnkey_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "offline_dprs";
const LOCAL_STORAGE_KEY = "kanak_turnkey_offline_dprs_fallback";

// Initialize IndexedDB
function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("reportDate", "reportDate", { unique: false });
          store.createIndex("syncStatus", "syncStatus", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("[OfflineQueue] IndexedDB open failed, using localStorage fallback.");
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

// LocalStorage helpers for fallback
function getLocalStorageDprs(): OfflineDprItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalStorageDprs(items: OfflineDprItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("[OfflineQueue] LocalStorage write error:", err);
  }
}

// Notify UI of queue state updates
function notifyQueueUpdated(items: OfflineDprItem[]): void {
  if (typeof window !== "undefined") {
    const pendingCount = items.filter((i) => i.syncStatus !== "synced").length;
    window.dispatchEvent(
      new CustomEvent("offline-dprs-updated", {
        detail: { count: pendingCount, items },
      })
    );
  }
}

/**
 * Save a newly submitted DPR to the offline queue
 */
export async function saveDprOffline(
  data: Omit<OfflineDprItem, "id" | "queuedAt" | "syncStatus" | "retryCount">
): Promise<OfflineDprItem> {
  const item: OfflineDprItem = {
    ...data,
    id: `dpr_offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    queuedAt: new Date().toISOString(),
    syncStatus: "pending",
    retryCount: 0,
  };

  const db = await openDb();

  if (db) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } else {
    const current = getLocalStorageDprs();
    current.unshift(item);
    setLocalStorageDprs(current);
  }

  const all = await getOfflineDprs();
  notifyQueueUpdated(all);
  return item;
}

/**
 * Retrieve all items in the offline DPR queue
 */
export async function getOfflineDprs(): Promise<OfflineDprItem[]> {
  const db = await openDb();

  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as OfflineDprItem[];
        // Sort newest first
        results.sort((a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime());
        resolve(results);
      };
      req.onerror = () => {
        resolve(getLocalStorageDprs());
      };
    });
  }

  const local = getLocalStorageDprs();
  local.sort((a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime());
  return local;
}

/**
 * Remove an item from the offline queue
 */
export async function deleteOfflineDpr(id: string): Promise<void> {
  const db = await openDb();

  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }

  const current = getLocalStorageDprs().filter((i) => i.id !== id);
  setLocalStorageDprs(current);

  const all = await getOfflineDprs();
  notifyQueueUpdated(all);
}

/**
 * Update an offline item (e.g. sync status or error)
 */
export async function updateOfflineDpr(item: OfflineDprItem): Promise<void> {
  const db = await openDb();

  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }

  const current = getLocalStorageDprs().map((i) => (i.id === item.id ? item : i));
  setLocalStorageDprs(current);

  const all = await getOfflineDprs();
  notifyQueueUpdated(all);
}

/**
 * Synchronize a single offline DPR to the API server
 */
export async function syncSingleOfflineDpr(item: OfflineDprItem): Promise<{ success: boolean; error?: string }> {
  try {
    await updateOfflineDpr({ ...item, syncStatus: "syncing" });

    const payload = {
      projectId: item.projectId,
      reportDate: item.reportDate,
      weather: item.weather,
      shift: item.shift,
      workLocation: item.workLocation || "",
      workSummary: item.workSummary,
      materialsConsumed: item.materialsConsumed || "",
      manpowerCount: item.manpowerCount,
      manpowerBreakdown: item.manpowerBreakdown || null,
      equipmentNotes: item.equipmentNotes || "",
      siteIssues: item.siteIssues || "",
      status: item.status || "Submitted to PM",
      photos: item.photos || [],
    };

    const res = await fetch("/api/daily-progress-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || `HTTP ${res.status}: Failed to submit DPR`;
      await updateOfflineDpr({
        ...item,
        syncStatus: "failed",
        syncError: msg,
        retryCount: item.retryCount + 1,
      });
      return { success: false, error: msg };
    }

    // Success! Remove from offline queue
    await deleteOfflineDpr(item.id);
    return { success: true };
  } catch (err: any) {
    const errorMsg = err.message || "Network error during sync";
    await updateOfflineDpr({
      ...item,
      syncStatus: "failed",
      syncError: errorMsg,
      retryCount: item.retryCount + 1,
    });
    return { success: false, error: errorMsg };
  }
}

/**
 * Synchronize all pending offline DPRs to the server
 */
export async function syncAllOfflineDprs(): Promise<{
  total: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  const items = await getOfflineDprs();
  const pending = items.filter((i) => i.syncStatus !== "synced");

  if (pending.length === 0) {
    return { total: 0, synced: 0, failed: 0, errors: [] };
  }

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const item of pending) {
    const res = await syncSingleOfflineDpr(item);
    if (res.success) {
      synced++;
    } else {
      failed++;
      if (res.error) errors.push(`${item.reportDate}: ${res.error}`);
    }
  }

  const remaining = await getOfflineDprs();
  notifyQueueUpdated(remaining);

  return {
    total: pending.length,
    synced,
    failed,
    errors,
  };
}

// Auto-sync listener when browser reconnects to internet
if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    console.log("[OfflineQueue] Device is back online. Syncing pending DPRs...");
    try {
      const res = await syncAllOfflineDprs();
      if (res.synced > 0) {
        window.dispatchEvent(
          new CustomEvent("offline-dprs-auto-synced", {
            detail: res,
          })
        );
      }
    } catch (err) {
      console.warn("[OfflineQueue] Auto-sync failed:", err);
    }
  });
}
