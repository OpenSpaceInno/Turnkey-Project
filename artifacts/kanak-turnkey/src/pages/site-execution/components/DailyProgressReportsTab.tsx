import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Camera,
  CheckCircle2,
  Clock,
  HardHat,
  Truck,
  Package,
  AlertCircle,
  Eye,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Sun,
  CloudRain,
  Cloud,
  Wind,
  Check,
  ChevronRight,
  ExternalLink,
  MapPin,
  X,
  FileText,
  UserCheck,
  Building2,
  Users,
  Minus,
  Upload,
  Sparkles,
  CloudOff,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CameraCaptureModal, type CapturedPhoto } from "@/components/camera/CameraCaptureModal";
import { useOfflineDpr } from "@/hooks/use-offline-dpr";
import { OfflineDprQueueModal } from "@/components/site-execution/OfflineDprQueueModal";
import { OfflineStatusBanner } from "@/components/site-execution/OfflineStatusBanner";

interface DailyProgressReportsTabProps {
  selectedProjectId: string;
  projects: any[];
}

export function DailyProgressReportsTab({ selectedProjectId, projects }: DailyProgressReportsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Active Project Selection
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    if (selectedProjectId && selectedProjectId !== "all") return selectedProjectId;
    return projects[0]?.id ? String(projects[0].id) : "19";
  });

  React.useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "all") {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Dialog & View States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDpr, setSelectedDpr] = useState<any | null>(null);

  // Offline DPR Hook & State
  const {
    isOnline,
    offlineDprs,
    pendingCount,
    isSyncing,
    saveOffline,
    syncNow,
    deleteItem: deleteOfflineItem,
    syncItem: syncOfflineItem,
  } = useOfflineDpr();
  const [offlineQueueOpen, setOfflineQueueOpen] = useState(false);

  // Camera Modal States
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTargetDprId, setCameraTargetDprId] = useState<number | null>(null);

  // Lightbox Preview for Photos
  const [previewPhoto, setPreviewPhoto] = useState<any | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWeather, setFilterWeather] = useState("all");

  // Form State for Create / Edit
  const todayStr = new Date().toISOString().split("T")[0];
  const [dprForm, setDprForm] = useState({
    id: null as number | null,
    projectId: activeProjectId,
    reportDate: todayStr,
    weather: "Sunny / Clear (32°C)",
    shift: "Day Shift",
    workLocation: "",
    workSummary: "",
    materialsConsumed: "",
    manpowerCount: "35",
    siteIssues: "",
    status: "Submitted to PM",
    equipmentNotes: "",
    photos: [] as CapturedPhoto[],
  });

  const [showTradeBreakdown, setShowTradeBreakdown] = useState(false);
  const [manpowerBreakdown, setManpowerBreakdown] = useState({
    supervisors: "2",
    engineers: "2",
    masons: "8",
    barBenders: "10",
    carpenters: "6",
    helpers: "7",
  });

  // Query: Fetch DPRs
  const {
    data: dprList = [],
    isLoading,
    refetch,
  } = useQuery<any[]>({
    queryKey: ["/api/daily-progress-reports", activeProjectId],
    queryFn: async () => {
      const url = activeProjectId !== "all"
        ? `/api/daily-progress-reports?projectId=${activeProjectId}`
        : "/api/daily-progress-reports";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch DPRs");
      return res.json();
    },
  });

  // Mutation: Create DPR
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/daily-progress-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create DPR");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-progress-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/photos"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "DPR Submitted Successfully",
        description: "Daily Progress Report and attached camera photos logged.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create DPR", description: err.message, variant: "destructive" });
    },
  });

  // Mutation: Update DPR
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await fetch(`/api/daily-progress-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update DPR");
      }
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-progress-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/photos"] });
      setEditDialogOpen(false);
      if (selectedDpr?.id === updated.id) {
        setSelectedDpr(updated);
      }
      toast({
        title: "DPR Updated",
        description: "Report details and photos saved successfully.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update DPR", description: err.message, variant: "destructive" });
    },
  });

  // Mutation: Update Status
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/daily-progress-reports/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-progress-reports"] });
      if (selectedDpr?.id === variables.id) {
        setSelectedDpr((prev: any) => (prev ? { ...prev, status: variables.status } : prev));
      }
      toast({
        title: "Status Updated",
        description: `DPR status changed to "${variables.status}".`,
      });
    },
  });

  // Mutation: Delete DPR
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/daily-progress-reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete DPR");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-progress-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/summary"] });
      setViewDialogOpen(false);
      toast({ title: "DPR Deleted", description: "Report removed from site records." });
    },
  });

  // Mutation: Direct Photo Attach to Existing DPR
  const attachPhotoMutation = useMutation({
    mutationFn: async ({ id, photo }: { id: number; photo: CapturedPhoto }) => {
      const res = await fetch(`/api/daily-progress-reports/${id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: photo.url,
          title: photo.title,
          location: photo.location,
          category: photo.category,
          stage: photo.stage,
          caption: photo.caption,
          latitude: (photo as any).latitude || 18.591245,
          longitude: (photo as any).longitude || 73.738912,
          gpsAccuracy: (photo as any).gpsAccuracy || 3.5,
          geotagAddress: (photo as any).geotagAddress || "Project Construction Site",
        }),
      });
      if (!res.ok) throw new Error("Failed to attach photo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-progress-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-execution/photos"] });
      toast({ title: "GPS-Tagged Photo Attached", description: "Geotagged site photo attached to DPR." });
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Auto-calculate workforce headcount from trade stepper adjustments
  const handleTradeChange = (trade: keyof typeof manpowerBreakdown, deltaOrVal: number | string) => {
    let newVal: number;
    if (typeof deltaOrVal === "number") {
      newVal = Math.max(0, (parseInt(manpowerBreakdown[trade]) || 0) + deltaOrVal);
    } else {
      newVal = Math.max(0, parseInt(deltaOrVal) || 0);
    }
    const updated = { ...manpowerBreakdown, [trade]: String(newVal) };
    setManpowerBreakdown(updated);
    const sum = Object.values(updated).reduce((acc, v) => acc + (parseInt(v) || 0), 0);
    setDprForm((prev) => ({ ...prev, manpowerCount: String(sum) }));
  };

  // Quick activity template chips
  const appendWorkSummary = (activity: string) => {
    setDprForm((prev) => {
      const current = prev.workSummary.trim();
      if (!current) return { ...prev, workSummary: `• ${activity}: ` };
      return { ...prev, workSummary: `${current}\n• ${activity}: ` };
    });
  };

  // Quick equipment chips
  const appendEquipment = (item: string) => {
    setDprForm((prev) => {
      const current = prev.equipmentNotes.trim();
      if (!current) return { ...prev, equipmentNotes: item };
      if (current.includes(item)) return prev;
      return { ...prev, equipmentNotes: `${current}, ${item}` };
    });
  };

  // Quick material chips
  const appendMaterial = (mat: string) => {
    setDprForm((prev) => {
      const current = prev.materialsConsumed.trim();
      if (!current) return { ...prev, materialsConsumed: mat };
      if (current.includes(mat)) return prev;
      return { ...prev, materialsConsumed: `${current}, ${mat}` };
    });
  };

  // Upload photos directly from device
  const handleDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          const newPhoto: CapturedPhoto = {
            url: data.url,
            title: file.name.replace(/\.[^/.]+$/, ""),
            location: dprForm.workLocation || "Site Work Front",
            category: "progress",
            stage: "Civil & Execution",
            capturedDate: todayStr,
            timestamp: new Date().toISOString(),
          };
          if (cameraTargetDprId) {
            attachPhotoMutation.mutate({ id: cameraTargetDprId, photo: newPhoto });
          } else {
            setDprForm((prev) => ({ ...prev, photos: [...prev.photos, newPhoto] }));
          }
          toast({
            title: "Photo Attached",
            description: `${file.name} added to DPR.`,
          });
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
    if (e.target) e.target.value = "";
  };

  const resetForm = () => {
    setDprForm({
      id: null,
      projectId: activeProjectId,
      reportDate: todayStr,
      weather: "Sunny / Clear (32°C)",
      shift: "Day Shift",
      workLocation: "",
      workSummary: "",
      materialsConsumed: "",
      manpowerCount: "35",
      siteIssues: "",
      status: "Submitted to PM",
      equipmentNotes: "",
      photos: [],
    });
    setManpowerBreakdown({
      engineers: "2",
      supervisors: "2",
      masons: "8",
      barBenders: "10",
      carpenters: "6",
      helpers: "7",
    });
  };

  // Handle Photo Snapped from Camera
  const handlePhotoCaptured = (photo: CapturedPhoto) => {
    if (cameraTargetDprId) {
      // Adding directly to an existing DPR
      attachPhotoMutation.mutate({ id: cameraTargetDprId, photo });
      setCameraTargetDprId(null);
    } else {
      // Adding to current create/edit form
      setDprForm((prev) => ({
        ...prev,
        photos: [...prev.photos, photo],
      }));
      toast({
        title: "Photo Added to Report",
        description: "Camera photo captured and attached.",
      });
    }
  };

  // Remove Photo from Form
  const removePhotoFromForm = (index: number) => {
    setDprForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // Submit Handler for Create / Edit Form (with Offline PWA Queue support)
  const handleSubmitDpr = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentProject = projects.find((p) => String(p.id) === String(dprForm.projectId || activeProjectId));

    const payload = {
      projectId: Number(dprForm.projectId || activeProjectId),
      projectName: currentProject?.name || "Project Site",
      reportDate: dprForm.reportDate,
      weather: dprForm.weather,
      shift: dprForm.shift,
      workLocation: dprForm.workLocation,
      workSummary: dprForm.workSummary,
      materialsConsumed: dprForm.materialsConsumed,
      manpowerCount: parseInt(dprForm.manpowerCount) || 0,
      manpowerBreakdown: manpowerBreakdown,
      equipmentNotes: dprForm.equipmentNotes,
      siteIssues: dprForm.siteIssues,
      status: dprForm.status,
      photos: dprForm.photos,
    };

    if (dprForm.id) {
      updateMutation.mutate({ id: dprForm.id, payload });
      return;
    }

    // Offline DPR Submission (Mobile PWA)
    if (!isOnline || !navigator.onLine) {
      await saveOffline(payload);
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Saved to Offline Queue (Mobile PWA)",
        description: `DPR for ${payload.reportDate} saved locally. It will auto-sync when network reconnects.`,
      });
      return;
    }

    // Online submission with automatic offline fallback on network loss
    try {
      await createMutation.mutateAsync(payload);
    } catch (networkErr: any) {
      console.warn("Network error during DPR submission, saving to offline queue:", networkErr);
      await saveOffline(payload);
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Network Unreachable — Saved Offline",
        description: "Could not reach server. DPR saved to device queue and will upload automatically.",
      });
    }
  };

  // Populate Edit Form
  const openEditDpr = (dpr: any) => {
    setDprForm({
      id: dpr.id,
      projectId: String(dpr.projectId),
      reportDate: dpr.reportDate || dpr.date,
      weather: dpr.weather || "Sunny / Clear (32°C)",
      shift: dpr.shift || "Day Shift",
      workLocation: dpr.workLocation || "",
      workSummary: dpr.workSummary || "",
      materialsConsumed: dpr.materialsConsumed || "",
      manpowerCount: String(dpr.manpowerCount || 0),
      siteIssues: dpr.siteIssues || "",
      status: dpr.status || "Submitted to PM",
      equipmentNotes: Array.isArray(dpr.equipment) ? dpr.equipment.join(", ") : (dpr.equipment || ""),
      photos: dpr.photos || [],
    });
    if (dpr.manpowerBreakdown || dpr.manpower) {
      const mp = dpr.manpowerBreakdown || dpr.manpower;
      setManpowerBreakdown({
        engineers: String(mp.engineers ?? mp.Engineers ?? 2),
        supervisors: String(mp.supervisors ?? mp.Supervisors ?? 2),
        masons: String(mp.masons ?? mp.Masons ?? 8),
        barBenders: String(mp.barBenders ?? mp.bar_benders ?? mp.BarBenders ?? 10),
        carpenters: String(mp.carpenters ?? mp.Carpenters ?? 6),
        helpers: String(mp.helpers ?? mp.Helpers ?? 7),
      });
    }
    setEditDialogOpen(true);
  };

  // Filtered DPRs
  const filteredDprs = dprList.filter((dpr) => {
    if (filterStatus !== "all" && dpr.status !== filterStatus) return false;
    if (filterWeather !== "all" && !dpr.weather?.toLowerCase().includes(filterWeather.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        dpr.workSummary?.toLowerCase().includes(q) ||
        dpr.workLocation?.toLowerCase().includes(q) ||
        dpr.siteIssues?.toLowerCase().includes(q) ||
        dpr.projectName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalDprsCount = dprList.length;
  const approvedCount = dprList.filter((d) => d.status === "Approved" || d.status === "Verified by PM").length;
  const totalPhotosCount = dprList.reduce((acc, d) => acc + (d.photos?.length || 0), 0);
  const avgManpower = totalDprsCount > 0
    ? Math.round(dprList.reduce((acc, d) => acc + (d.manpowerCount || 0), 0) / totalDprsCount)
    : 0;

  const currentProjectName =
    projects.find((p) => String(p.id) === String(activeProjectId))?.name || "Active Project Site";

  return (
    <div className="space-y-6">
      {/* Offline PWA Status Banner */}
      <OfflineStatusBanner
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSyncNow={syncNow}
        onOpenQueue={() => setOfflineQueueOpen(true)}
      />

      {/* 1. Header & Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Daily Reports Logged</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalDprsCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Project daily work diary</p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Verified / Approved</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{approvedCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">PM approved & certified</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Avg Daily Workforce</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600">{avgManpower} Workers</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Per operational shift</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
              <HardHat className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Site Photos Captured</p>
              <h3 className="text-2xl font-bold mt-1 text-primary">{totalPhotosCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Attached work evidence</p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Camera className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Control & Search Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project Selector if not fixed */}
          <div className="w-56">
            <Select value={activeProjectId} onValueChange={setActiveProjectId}>
              <SelectTrigger className="h-8 text-xs font-medium">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search DPR activities, grid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Filter Status */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Submitted to PM">Submitted to PM</SelectItem>
              <SelectItem value="Verified by PM">Verified by PM</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Weather */}
          <Select value={filterWeather} onValueChange={setFilterWeather}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Weather" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Weathers</SelectItem>
              <SelectItem value="Sunny">☀️ Sunny</SelectItem>
              <SelectItem value="Rainy">🌧️ Rainy / Monsoon</SelectItem>
              <SelectItem value="Cloudy">⛅ Cloudy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Offline Queue Button */}
          <Button
            variant="outline"
            size="sm"
            className={`h-8 text-xs gap-1.5 ${
              pendingCount > 0
                ? "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20"
                : "text-muted-foreground"
            }`}
            onClick={() => setOfflineQueueOpen(true)}
            title="Open offline queued DPR reports"
          >
            <CloudOff className="h-3.5 w-3.5 text-amber-500" />
            Offline Queue
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1.5 py-0 text-[10px] font-bold">
                {pendingCount}
              </Badge>
            )}
          </Button>

          {/* Direct Camera Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => {
              setCameraTargetDprId(null);
              resetForm();
              setCameraModalOpen(true);
            }}
            title="Snap site work photo directly with camera"
          >
            <Camera className="h-3.5 w-3.5" />
            Take Site Photo
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            onClick={() => {
              resetForm();
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Today's DPR
          </Button>
        </div>
      </div>

      {/* 3. DPR List Grid */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Daily Progress Reports (DPR) Registry
            </CardTitle>
            <CardDescription className="text-xs">
              Daily site logs detailing work achievements, workforce deployment, equipment, and work photos.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {filteredDprs.length} Reports
          </Badge>
        </CardHeader>

        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              Loading Daily Progress Reports...
            </div>
          ) : filteredDprs.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p>No Daily Progress Reports found for the selected project and filter.</p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1.5"
                onClick={() => {
                  resetForm();
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Submit Today's DPR
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDprs.map((dpr: any) => {
                const photos: CapturedPhoto[] = dpr.photos || [];

                return (
                  <Card
                    key={dpr.id}
                    className="border shadow-sm bg-card hover:border-primary/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="p-3.5 border-b bg-muted/20 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">
                              {dpr.projectName}
                            </span>
                            <Badge
                              className={`text-[10px] ${
                                dpr.status === "Approved"
                                  ? "bg-emerald-600 text-white"
                                  : dpr.status === "Verified by PM"
                                  ? "bg-blue-600 text-white"
                                  : "bg-amber-500 text-white"
                              }`}
                            >
                              {dpr.status || "Submitted to PM"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                            <span className="font-mono font-medium text-foreground">
                              📅 {dpr.date || dpr.reportDate}
                            </span>
                            <span>•</span>
                            <span>{dpr.shift || "Day Shift"}</span>
                            {dpr.workLocation && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-primary font-medium">
                                  <MapPin className="h-3 w-3" />
                                  {dpr.workLocation}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <Badge variant="outline" className="text-[10px] shrink-0 bg-background">
                          {dpr.weather || "Sunny"}
                        </Badge>
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 space-y-3 text-xs">
                        {/* Work Summary */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                            Activities & Output
                          </span>
                          <p className="text-foreground leading-relaxed line-clamp-3">
                            {dpr.workSummary}
                          </p>
                        </div>

                        {/* Workforce & Machinery Badges */}
                        <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-lg border text-[11px]">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Workforce Deployed:</span>
                            <span className="font-bold text-foreground">
                              👷 {dpr.manpowerCount || 0} Personnel
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Active Plant:</span>
                            <span className="font-medium text-foreground truncate block" title={Array.isArray(dpr.equipment) ? dpr.equipment.join(", ") : dpr.equipment}>
                              🚜 {Array.isArray(dpr.equipment) && dpr.equipment.length > 0 ? dpr.equipment.join(", ") : "Standard Site Tools"}
                            </span>
                          </div>
                        </div>

                        {/* Attached Photos Strip */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-semibold text-muted-foreground flex items-center gap-1">
                              <Camera className="h-3.5 w-3.5 text-primary" />
                              Site Photos ({photos.length})
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[11px] text-primary hover:text-primary/80 font-medium p-0"
                              onClick={() => {
                                setCameraTargetDprId(dpr.id);
                                setCameraModalOpen(true);
                              }}
                            >
                              + Snap Photo
                            </Button>
                          </div>

                          {photos.length === 0 ? (
                            <div className="p-3 border border-dashed rounded-lg text-center text-[11px] text-muted-foreground bg-muted/10">
                              No photos attached. Click &quot;+ Snap Photo&quot; to take a picture with the camera.
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {photos.map((photo, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="relative group shrink-0 w-16 h-16 rounded-lg overflow-hidden border bg-black cursor-pointer shadow-xs hover:border-primary transition-all"
                                  onClick={() => setPreviewPhoto(photo)}
                                  title={photo.title || "Click to view photo"}
                                >
                                  <img
                                    src={photo.url}
                                    alt={photo.title || "DPR Photo"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Remarks / Bottlenecks */}
                        {dpr.siteIssues && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-900/40 flex items-start gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span><strong>Hindrance:</strong> {dpr.siteIssues}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 border-t bg-muted/10 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-muted-foreground">
                        Logged by {dpr.creatorName || "Engineer"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setSelectedDpr(dpr);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          View Full DPR
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditDpr(dpr)}
                          title="Edit DPR"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this Daily Progress Report?")) {
                              deleteMutation.mutate(dpr.id);
                            }
                          }}
                          title="Delete DPR"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. MODAL: CREATE / SUBMIT DPR */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    Create Daily Progress Report (DPR)
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Log verified site activities, workforce deployment, equipment logs, and field photos.
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs bg-muted/40 font-mono hidden sm:inline-flex">
                {currentProjectName}
              </Badge>
            </div>
          </DialogHeader>

          {!isOnline && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-amber-700 dark:text-amber-300 flex items-center gap-2.5 text-xs">
              <CloudOff className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> You can draft and submit this DPR without internet. It will be stored safely in your device queue and synced automatically once connection is restored.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmitDpr} className="space-y-4 pt-3">
            {/* ── SECTION 1: Site Location & Working Conditions ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>1. Site Location & Shift Conditions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Project Site *
                  </Label>
                  <Select
                    value={dprForm.projectId}
                    onValueChange={(val) => setDprForm({ ...dprForm, projectId: val })}
                  >
                    <SelectTrigger className="text-xs h-9 font-medium">
                      <SelectValue placeholder="Select Active Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Work Location / Floor / Grid / Zone
                  </Label>
                  <Input
                    placeholder="e.g. Tower B - Floor 4 Slab, Grid C3-D6"
                    className="text-xs h-9"
                    value={dprForm.workLocation}
                    onChange={(e) => setDprForm({ ...dprForm, workLocation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Report Date *
                  </Label>
                  <Input
                    type="date"
                    className="text-xs h-9"
                    value={dprForm.reportDate}
                    onChange={(e) => setDprForm({ ...dprForm, reportDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Operational Shift *
                  </Label>
                  <Select
                    value={dprForm.shift}
                    onValueChange={(val) => setDprForm({ ...dprForm, shift: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Day Shift">☀️ Day Shift (08:00 - 17:00)</SelectItem>
                      <SelectItem value="Night Shift">🌙 Night Shift (20:00 - 05:00)</SelectItem>
                      <SelectItem value="24-Hour Continuous Pour">🔄 24-Hour Continuous Pour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    Weather Condition *
                  </Label>
                  <Select
                    value={dprForm.weather}
                    onValueChange={(val) => setDprForm({ ...dprForm, weather: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sunny / Clear (32°C)">☀️ Sunny / Clear (32°C)</SelectItem>
                      <SelectItem value="Partly Cloudy (28°C)">⛅ Partly Cloudy (28°C)</SelectItem>
                      <SelectItem value="Rainy / Monsoon Halt">🌧️ Rainy / Monsoon Halt</SelectItem>
                      <SelectItem value="Overcast / Windy">💨 Overcast / Windy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Work Summary & Activities Executed ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>2. Work Executed Today (Activities & Output) *</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                  Click chip to append milestone template:
                </span>
              </div>

              {/* Quick Activity Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  "Concrete Casting",
                  "Rebar Tying & BBS",
                  "Shuttering / Formwork",
                  "MEP Conduit Laying",
                  "Blockwork & Masonry",
                  "Curing & Testing",
                  "Waterproofing",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => appendWorkSummary(tag)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-primary/25 bg-primary/5 hover:bg-primary/15 text-foreground transition-colors font-medium flex items-center gap-1 active:scale-95"
                  >
                    <Plus className="h-3 w-3 text-primary" />
                    {tag}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Describe verified site achievements today: e.g. Casted 115 cum M35 concrete for podium slab Bay 4. Reinforcement tying for podium columns Grid D4-D8 in progress. MEP electrical conduits fixed for Level 3..."
                className="text-xs min-h-[90px] leading-relaxed resize-y"
                value={dprForm.workSummary}
                onChange={(e) => setDprForm({ ...dprForm, workSummary: e.target.value })}
                required
              />
            </div>

            {/* ── SECTION 3: Workforce Deployment (Symmetric 6-Trade Grid) ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>3. Workforce & Labor Deployment</span>
                </div>

                {/* Total Headcount Counter Pill */}
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                  <span className="text-xs font-semibold text-muted-foreground">Total Site Crew:</span>
                  <span className="text-sm font-black text-primary font-mono">{dprForm.manpowerCount}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">Workers</span>
                </div>
              </div>

              {/* 6 Trade Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  { key: "engineers" as const, label: "Engineers", icon: "👷‍♂️" },
                  { key: "supervisors" as const, label: "Supervisors", icon: "📋" },
                  { key: "masons" as const, label: "Masons", icon: "🧱" },
                  { key: "barBenders" as const, label: "Bar Benders", icon: "⛓️" },
                  { key: "carpenters" as const, label: "Carpenters", icon: "🪚" },
                  { key: "helpers" as const, label: "Helpers / Labour", icon: "🦺" },
                ].map((trade) => (
                  <div
                    key={trade.key}
                    className="bg-muted/30 border rounded-xl p-2.5 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base" role="img">{trade.icon}</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground truncate" title={trade.label}>
                        {trade.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => handleTradeChange(trade.key, -1)}
                        className="h-7 w-7 rounded-md border bg-background hover:bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={manpowerBreakdown[trade.key]}
                        onChange={(e) => handleTradeChange(trade.key, e.target.value)}
                        className="h-7 w-12 text-center text-xs font-bold bg-background rounded-md border focus:ring-1 focus:ring-primary font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleTradeChange(trade.key, 1)}
                        className="h-7 w-7 rounded-md border bg-background hover:bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 4: Plant & Machinery + Materials Consumed ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" />
                <span>4. Plant & Machinery Operating + Key Materials Consumed</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Equipment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      Active Equipment & Plant
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Click to add:</span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {["1x Boom Pump 36m", "1x Tower Crane", "2x Transit Mixers", "4x Vibrators"].map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => appendEquipment(eq)}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 bg-muted/40 hover:bg-primary/10 text-foreground transition-colors"
                      >
                        + {eq}
                      </button>
                    ))}
                  </div>

                  <Input
                    placeholder="e.g. 1x Schwing Boom Pump 36m, 1x Tower Crane, 4x Needle Vibrators"
                    className="text-xs h-9"
                    value={dprForm.equipmentNotes}
                    onChange={(e) => setDprForm({ ...dprForm, equipmentNotes: e.target.value })}
                  />
                </div>

                {/* Materials Consumed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-primary" />
                      Key Materials Consumed Today
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Click to add:</span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {["115 cum RMC M35", "14.2 MT Rebar", "220 Bags Cement", "45 cum Sand"].map((mat) => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => appendMaterial(mat)}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 bg-muted/40 hover:bg-primary/10 text-foreground transition-colors"
                      >
                        + {mat}
                      </button>
                    ))}
                  </div>

                  <Input
                    placeholder="e.g. 115 cum RMC M35, 14.2 MT TMT Rebar, 220 Bags OPC 53 Cement"
                    className="text-xs h-9"
                    value={dprForm.materialsConsumed}
                    onChange={(e) => setDprForm({ ...dprForm, materialsConsumed: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 5: Site Work Photos (Live Camera & File Upload) ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Camera className="h-4 w-4 text-primary" />
                  <span>5. Site Work Photos & Photographic Evidence ({dprForm.photos.length})</span>
                </div>

                {/* Live Camera and File Upload Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-8"
                    onClick={() => {
                      setCameraTargetDprId(null);
                      setCameraModalOpen(true);
                    }}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Take Photo with Camera
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload from Device
                  </Button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleDeviceFileUpload}
              />

              {/* Photos Gallery or Empty Dropzone */}
              {dprForm.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {dprForm.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border bg-background shadow-xs group"
                    >
                      <div className="aspect-video w-full bg-black relative">
                        <img
                          src={photo.url}
                          alt={photo.title || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] text-white font-mono">
                          📍 {photo.location || "Site"}
                        </div>
                      </div>
                      <div className="p-2 text-[11px]">
                        <div className="font-semibold text-foreground truncate">{photo.title}</div>
                        <div className="text-[10px] text-muted-foreground capitalize">{photo.category || "progress"}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhotoFromForm(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-transform active:scale-95 shadow-sm"
                        title="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => setCameraModalOpen(true)}
                  className="p-6 border-2 border-dashed border-primary/30 rounded-xl text-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer space-y-2"
                >
                  <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">No site photos attached yet</p>
                    <p className="text-[11px] text-muted-foreground max-w-md mx-auto mt-0.5">
                      Click here or use &quot;Take Photo with Camera&quot; to open the live viewfinder.
                      Photos are automatically stamped with project watermark, location and date.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION 6: Bottlenecks & Approval Status ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>6. Site Hindrances, Delays & Approval Status</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Site Bottlenecks / Delays / Hindrances
                  </Label>
                  <Input
                    placeholder="e.g. 2-hr concrete transit delay due to municipal road diversion. All clear now."
                    className="text-xs h-9"
                    value={dprForm.siteIssues}
                    onChange={(e) => setDprForm({ ...dprForm, siteIssues: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Approval Workflow Status *
                  </Label>
                  <Select
                    value={dprForm.status}
                    onValueChange={(val) => setDprForm({ ...dprForm, status: val })}
                  >
                    <SelectTrigger className="text-xs h-9 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Submitted to PM">Submitted to PM (Pending Review)</SelectItem>
                      <SelectItem value="Verified by PM">Verified by PM (Audited)</SelectItem>
                      <SelectItem value="Approved">Approved (Final Sign-off)</SelectItem>
                      <SelectItem value="Draft">Draft (Work in Progress)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <DialogFooter className="pt-2 sticky bottom-0 bg-card/95 backdrop-blur-xs py-3 border-t -mx-6 -mb-6 px-6 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setDprForm((prev) => ({ ...prev, status: "Draft" }));
                    setTimeout(() => {
                      document.getElementById("dpr-submit-create-btn")?.click();
                    }, 50);
                  }}
                >
                  Save as Draft
                </Button>

                <Button
                  id="dpr-submit-create-btn"
                  type="submit"
                  size="sm"
                  className={`text-xs gap-1.5 shadow-sm px-5 ${
                    !isOnline
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                  disabled={createMutation.isPending}
                >
                  {!isOnline ? (
                    <>
                      <CloudOff className="h-4 w-4 mr-0.5" />
                      Save to Offline Queue
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {createMutation.isPending ? "Submitting..." : "Submit Daily Progress Report"}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. MODAL: EDIT DPR */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    Edit Daily Progress Report #{dprForm.id}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Update verified site activities, trade headcount, materials, or attached photos.
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
                {dprForm.status}
              </Badge>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitDpr} className="space-y-4 pt-3">
            {/* ── SECTION 1: Site Location & Working Conditions ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>1. Site Location & Shift Conditions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Project Site *
                  </Label>
                  <Select
                    value={dprForm.projectId}
                    onValueChange={(val) => setDprForm({ ...dprForm, projectId: val })}
                  >
                    <SelectTrigger className="text-xs h-9 font-medium">
                      <SelectValue placeholder="Select Active Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Work Location / Floor / Grid / Zone
                  </Label>
                  <Input
                    placeholder="e.g. Tower B - Floor 4 Slab, Grid C3-D6"
                    className="text-xs h-9"
                    value={dprForm.workLocation}
                    onChange={(e) => setDprForm({ ...dprForm, workLocation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Report Date *
                  </Label>
                  <Input
                    type="date"
                    className="text-xs h-9"
                    value={dprForm.reportDate}
                    onChange={(e) => setDprForm({ ...dprForm, reportDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Operational Shift *
                  </Label>
                  <Select
                    value={dprForm.shift}
                    onValueChange={(val) => setDprForm({ ...dprForm, shift: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Day Shift">☀️ Day Shift (08:00 - 17:00)</SelectItem>
                      <SelectItem value="Night Shift">🌙 Night Shift (20:00 - 05:00)</SelectItem>
                      <SelectItem value="24-Hour Continuous Pour">🔄 24-Hour Continuous Pour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    Weather Condition *
                  </Label>
                  <Select
                    value={dprForm.weather}
                    onValueChange={(val) => setDprForm({ ...dprForm, weather: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sunny / Clear (32°C)">☀️ Sunny / Clear (32°C)</SelectItem>
                      <SelectItem value="Partly Cloudy (28°C)">⛅ Partly Cloudy (28°C)</SelectItem>
                      <SelectItem value="Rainy / Monsoon Halt">🌧️ Rainy / Monsoon Halt</SelectItem>
                      <SelectItem value="Overcast / Windy">💨 Overcast / Windy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Work Summary & Activities Executed ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>2. Work Executed Today (Activities & Output) *</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                  Click chip to append milestone template:
                </span>
              </div>

              {/* Quick Activity Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  "Concrete Casting",
                  "Rebar Tying & BBS",
                  "Shuttering / Formwork",
                  "MEP Conduit Laying",
                  "Blockwork & Masonry",
                  "Curing & Testing",
                  "Waterproofing",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => appendWorkSummary(tag)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-primary/25 bg-primary/5 hover:bg-primary/15 text-foreground transition-colors font-medium flex items-center gap-1 active:scale-95"
                  >
                    <Plus className="h-3 w-3 text-primary" />
                    {tag}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Describe verified site achievements today: e.g. Casted 115 cum M35 concrete for podium slab Bay 4. Reinforcement tying for podium columns Grid D4-D8 in progress. MEP electrical conduits fixed for Level 3..."
                className="text-xs min-h-[90px] leading-relaxed resize-y"
                value={dprForm.workSummary}
                onChange={(e) => setDprForm({ ...dprForm, workSummary: e.target.value })}
                required
              />
            </div>

            {/* ── SECTION 3: Workforce Deployment (Symmetric 6-Trade Grid) ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>3. Workforce & Labor Deployment</span>
                </div>

                {/* Total Headcount Counter Pill */}
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                  <span className="text-xs font-semibold text-muted-foreground">Total Site Crew:</span>
                  <span className="text-sm font-black text-primary font-mono">{dprForm.manpowerCount}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">Workers</span>
                </div>
              </div>

              {/* 6 Trade Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  { key: "engineers" as const, label: "Engineers", icon: "👷‍♂️" },
                  { key: "supervisors" as const, label: "Supervisors", icon: "📋" },
                  { key: "masons" as const, label: "Masons", icon: "🧱" },
                  { key: "barBenders" as const, label: "Bar Benders", icon: "⛓️" },
                  { key: "carpenters" as const, label: "Carpenters", icon: "🪚" },
                  { key: "helpers" as const, label: "Helpers / Labour", icon: "🦺" },
                ].map((trade) => (
                  <div
                    key={trade.key}
                    className="bg-muted/30 border rounded-xl p-2.5 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base" role="img">{trade.icon}</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground truncate" title={trade.label}>
                        {trade.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => handleTradeChange(trade.key, -1)}
                        className="h-7 w-7 rounded-md border bg-background hover:bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={manpowerBreakdown[trade.key]}
                        onChange={(e) => handleTradeChange(trade.key, e.target.value)}
                        className="h-7 w-12 text-center text-xs font-bold bg-background rounded-md border focus:ring-1 focus:ring-primary font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleTradeChange(trade.key, 1)}
                        className="h-7 w-7 rounded-md border bg-background hover:bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 4: Plant & Machinery + Materials Consumed ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" />
                <span>4. Plant & Machinery Operating + Key Materials Consumed</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Equipment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      Active Equipment & Plant
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Click to add:</span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {["1x Boom Pump 36m", "1x Tower Crane", "2x Transit Mixers", "4x Vibrators"].map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => appendEquipment(eq)}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 bg-muted/40 hover:bg-primary/10 text-foreground transition-colors"
                      >
                        + {eq}
                      </button>
                    ))}
                  </div>

                  <Input
                    placeholder="e.g. 1x Schwing Boom Pump 36m, 1x Tower Crane, 4x Needle Vibrators"
                    className="text-xs h-9"
                    value={dprForm.equipmentNotes}
                    onChange={(e) => setDprForm({ ...dprForm, equipmentNotes: e.target.value })}
                  />
                </div>

                {/* Materials Consumed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-primary" />
                      Key Materials Consumed Today
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Click to add:</span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {["115 cum RMC M35", "14.2 MT Rebar", "220 Bags Cement", "45 cum Sand"].map((mat) => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => appendMaterial(mat)}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 bg-muted/40 hover:bg-primary/10 text-foreground transition-colors"
                      >
                        + {mat}
                      </button>
                    ))}
                  </div>

                  <Input
                    placeholder="e.g. 115 cum RMC M35, 14.2 MT TMT Rebar, 220 Bags OPC 53 Cement"
                    className="text-xs h-9"
                    value={dprForm.materialsConsumed}
                    onChange={(e) => setDprForm({ ...dprForm, materialsConsumed: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 5: Site Work Photos (Live Camera & File Upload) ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Camera className="h-4 w-4 text-primary" />
                  <span>5. Site Work Photos & Photographic Evidence ({dprForm.photos.length})</span>
                </div>

                {/* Live Camera and File Upload Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-8"
                    onClick={() => {
                      setCameraTargetDprId(dprForm.id || null);
                      setCameraModalOpen(true);
                    }}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Take Photo with Camera
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload from Device
                  </Button>
                </div>
              </div>

              {/* Photo Strip or Empty Dropzone */}
              {dprForm.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {dprForm.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border bg-background shadow-xs group"
                    >
                      <div className="aspect-video w-full bg-black relative">
                        <img
                          src={photo.url}
                          alt={photo.title || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] text-white font-mono">
                          📍 {photo.location || "Site"}
                        </div>
                      </div>
                      <div className="p-2 text-[11px]">
                        <div className="font-semibold text-foreground truncate">{photo.title}</div>
                        <div className="text-[10px] text-muted-foreground capitalize">{photo.category || "progress"}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhotoFromForm(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-transform active:scale-95 shadow-sm"
                        title="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => setCameraModalOpen(true)}
                  className="p-6 border-2 border-dashed border-primary/30 rounded-xl text-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer space-y-2"
                >
                  <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">No site photos attached yet</p>
                    <p className="text-[11px] text-muted-foreground max-w-md mx-auto mt-0.5">
                      Click here or use &quot;Take Photo with Camera&quot; to open the live viewfinder.
                      Photos are automatically stamped with project watermark, location and date.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION 6: Bottlenecks & Approval Status ── */}
            <div className="rounded-xl border bg-card/60 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>6. Site Hindrances, Delays & Approval Status</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Site Bottlenecks / Delays / Hindrances
                  </Label>
                  <Input
                    placeholder="e.g. 2-hr concrete transit delay due to municipal road diversion. All clear now."
                    className="text-xs h-9"
                    value={dprForm.siteIssues}
                    onChange={(e) => setDprForm({ ...dprForm, siteIssues: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Approval Workflow Status *
                  </Label>
                  <Select
                    value={dprForm.status}
                    onValueChange={(val) => setDprForm({ ...dprForm, status: val })}
                  >
                    <SelectTrigger className="text-xs h-9 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Submitted to PM">Submitted to PM (Pending Review)</SelectItem>
                      <SelectItem value="Verified by PM">Verified by PM (Audited)</SelectItem>
                      <SelectItem value="Approved">Approved (Final Sign-off)</SelectItem>
                      <SelectItem value="Draft">Draft (Work in Progress)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <DialogFooter className="pt-2 sticky bottom-0 bg-card/95 backdrop-blur-xs py-3 border-t -mx-6 -mb-6 px-6 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-5"
                disabled={updateMutation.isPending}
              >
                <Check className="h-4 w-4" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. MODAL: DETAILED DPR VIEWER & PRINT FORMAT */}
      {selectedDpr && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Daily Progress Report #{selectedDpr.id}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {selectedDpr.projectName} &bull; Date: {selectedDpr.date || selectedDpr.reportDate} &bull; {selectedDpr.shift}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs ${
                      selectedDpr.status === "Approved"
                        ? "bg-emerald-600 text-white"
                        : selectedDpr.status === "Verified by PM"
                        ? "bg-blue-600 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {selectedDpr.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print DPR
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Weather:</span>
                  <span className="font-semibold text-foreground">{selectedDpr.weather}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Work Location:</span>
                  <span className="font-semibold text-foreground">{selectedDpr.workLocation || "General Site"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Workforce Deployed:</span>
                  <span className="font-semibold text-foreground">👷 {selectedDpr.manpowerCount || 0} Men</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Logged By:</span>
                  <span className="font-semibold text-foreground">{selectedDpr.creatorName || "Engineer"}</span>
                </div>
              </div>

              {/* Work Execution Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  1. Work Execution Summary
                </h4>
                <div className="bg-card p-3 rounded-lg border leading-relaxed text-foreground whitespace-pre-wrap">
                  {selectedDpr.workSummary}
                </div>
              </div>

              {/* Workforce Breakdown */}
              {selectedDpr.manpower && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    2. Trade Workforce Breakdown
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-muted/30 p-2.5 rounded-lg border text-center">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Supervisors</span>
                      <span className="text-sm font-bold text-foreground">{selectedDpr.manpower.supervisors || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Engineers</span>
                      <span className="text-sm font-bold text-foreground">{selectedDpr.manpower.engineers || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Masons</span>
                      <span className="text-sm font-bold text-foreground">{selectedDpr.manpower.masons || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Bar Benders</span>
                      <span className="text-sm font-bold text-foreground">{selectedDpr.manpower.barBenders || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Carpenters</span>
                      <span className="text-sm font-bold text-foreground">{selectedDpr.manpower.carpenters || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Helpers</span>
                      <span className="text-sm font-bold text-foreground">{selectedDpr.manpower.helpers || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Plant & Machinery */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  3. Plant, Heavy Machinery & Materials
                </h4>
                <div className="bg-muted/20 p-3 rounded-lg border space-y-1">
                  <div>
                    <strong>Equipment Deployed: </strong>
                    <span>{Array.isArray(selectedDpr.equipment) && selectedDpr.equipment.length > 0 ? selectedDpr.equipment.join(", ") : "Standard site equipment"}</span>
                  </div>
                  {selectedDpr.materialsConsumed && (
                    <div>
                      <strong>Materials Consumed: </strong>
                      <span>{selectedDpr.materialsConsumed}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 📸 Attached Photos Gallery */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    4. Site Photographic Evidence ({selectedDpr.photos?.length || 0})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] gap-1 text-primary border-primary/30 hover:bg-primary/5"
                    onClick={() => {
                      setCameraTargetDprId(selectedDpr.id);
                      setCameraModalOpen(true);
                    }}
                  >
                    <Camera className="h-3 w-3" />
                    Snap Photo with Camera
                  </Button>
                </div>

                {!selectedDpr.photos || selectedDpr.photos.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                    No photos attached. Click &quot;Snap Photo with Camera&quot; above to capture jobsite photos.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedDpr.photos.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl overflow-hidden border bg-background shadow-xs hover:border-primary transition-all cursor-pointer group"
                        onClick={() => setPreviewPhoto(p)}
                      >
                        <div className="aspect-video w-full bg-black relative">
                          <img
                            src={p.url}
                            alt={p.title || `Photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="p-2 space-y-0.5">
                          <p className="font-semibold text-foreground truncate text-xs">{p.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {p.location || "Site Work Area"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks & Issues */}
              {selectedDpr.siteIssues && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    5. Site Hindrances, Delays & Action Items
                  </h4>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300">
                    {selectedDpr.siteIssues}
                  </div>
                </div>
              )}

              {/* Status Workflow Actions */}
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Update approval state:
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedDpr.status !== "Verified by PM" && selectedDpr.status !== "Approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 text-blue-600 border-blue-300"
                      onClick={() => statusMutation.mutate({ id: selectedDpr.id, status: "Verified by PM" })}
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Verify as PM
                    </Button>
                  )}
                  {selectedDpr.status !== "Approved" && (
                    <Button
                      size="sm"
                      className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => statusMutation.mutate({ id: selectedDpr.id, status: "Approved" })}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Approve DPR
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 7. LIGHTBOX PHOTO PREVIEW */}
      {previewPhoto && (
        <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black text-white border-0">
            <div className="relative aspect-video w-full flex items-center justify-center bg-black">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title || "Preview"}
                className="max-h-full max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 bg-zinc-900 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">{previewPhoto.title}</h4>
                <p className="text-xs text-gray-400">
                  {previewPhoto.location || "On Site"} &bull; {previewPhoto.category || "Progress"}
                </p>
              </div>
              <a
                href={previewPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Open Full Size <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 8. LIVE CAMERA CAPTURE MODAL */}
      <CameraCaptureModal
        open={cameraModalOpen}
        onOpenChange={setCameraModalOpen}
        onPhotoCaptured={handlePhotoCaptured}
        projectName={currentProjectName}
        defaultLocation={dprForm.workLocation || "Site Work Area"}
      />

      {/* 9. OFFLINE DPR QUEUE MODAL (MOBILE PWA) */}
      <OfflineDprQueueModal
        open={offlineQueueOpen}
        onOpenChange={setOfflineQueueOpen}
        items={offlineDprs}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onSyncAll={syncNow}
        onSyncItem={syncOfflineItem}
        onDeleteItem={deleteOfflineItem}
      />
    </div>
  );
}
