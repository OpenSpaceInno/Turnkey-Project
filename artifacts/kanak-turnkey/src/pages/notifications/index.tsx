import { useState, useEffect } from "react";
import {
  useListNotifications,
  useMarkNotificationRead,
  useClearNotifications,
  useGetNotificationPreferences,
  useUpdateNotificationPreferences,
  getNotificationPreferencesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  CheckCheck,
  Bell,
  BellOff,
  AlertCircle,
  Package,
  FileText,
  FolderKanban,
  ClipboardCheck,
  Wrench,
  TrendingDown,
  DollarSign,
  Settings2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const NOTIFICATION_TYPES = [
  {
    key: "approval_required",
    label: "Approval Required",
    description: "When an item needs your sign-off",
    icon: ClipboardCheck,
    category: "Workflow",
  },
  {
    key: "project_created",
    label: "Project Created",
    description: "When a new project is added to the system",
    icon: FolderKanban,
    category: "Workflow",
  },
  {
    key: "task_assigned",
    label: "Task Assigned",
    description: "When a task is assigned to you",
    icon: CheckCheck,
    category: "Workflow",
  },
  {
    key: "invoice_overdue",
    label: "Invoice Overdue",
    description: "When a client invoice passes its due date",
    icon: DollarSign,
    category: "Finance",
  },
  {
    key: "payment_received",
    label: "Payment Received",
    description: "When a payment is recorded against an invoice",
    icon: FileText,
    category: "Finance",
  },
  {
    key: "vendor_invoice_discrepancy",
    label: "Vendor Invoice Discrepancy",
    description: "When a vendor invoice doesn't match the PO",
    icon: AlertCircle,
    category: "Procurement",
  },
  {
    key: "low_stock",
    label: "Low Stock Alert",
    description: "When material stock falls below threshold",
    icon: Package,
    category: "Procurement",
  },
  {
    key: "instrument_expiring",
    label: "Instrument Expiring",
    description: "When a calibration certificate is near expiry",
    icon: Wrench,
    category: "Operations",
  },
] as const;

const TYPE_ICON: Record<string, React.ElementType> = Object.fromEntries(
  NOTIFICATION_TYPES.map((t) => [t.key, t.icon]),
);

const TYPE_COLOR: Record<string, string> = {
  approval_required: "text-amber-600 bg-amber-50",
  project_created: "text-blue-600 bg-blue-50",
  task_assigned: "text-indigo-600 bg-indigo-50",
  invoice_overdue: "text-red-600 bg-red-50",
  payment_received: "text-green-600 bg-green-50",
  vendor_invoice_discrepancy: "text-orange-600 bg-orange-50",
  low_stock: "text-yellow-600 bg-yellow-50",
  instrument_expiring: "text-purple-600 bg-purple-50",
};

const categories = [...new Set(NOTIFICATION_TYPES.map((t) => t.category))];

export default function Notifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, isLoading: notifsLoading, refetch } = useListNotifications();
  const { data: prefsData, isLoading: prefsLoading } = useGetNotificationPreferences();
  const markRead = useMarkNotificationRead();
  const clearAll = useClearNotifications();
  const updatePrefs = useUpdateNotificationPreferences();

  // Local prefs state — all types default to enabled if not explicitly set
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [prefsDirty, setPrefsDirty] = useState(false);

  useEffect(() => {
    if (!prefsData) return;
    setPrefs(prefsData.preferences ?? {});
    setPrefsDirty(false);
  }, [prefsData]);

  const isEnabled = (key: string) => prefs[key] !== false; // default true

  const togglePref = (key: string) => {
    setPrefs((p) => ({ ...p, [key]: !isEnabled(key) }));
    setPrefsDirty(true);
  };

  const handleSavePrefs = () => {
    updatePrefs.mutate(
      { preferences: prefs },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getNotificationPreferencesQueryKey() });
          toast({ title: "Preferences saved" });
          setPrefsDirty(false);
        },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      },
    );
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  if (notifsLoading || prefsLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Alerts, updates, and delivery preferences.</p>
        </div>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Bell className="h-4 w-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-xs">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* ── Inbox ─────────────────────────────────────── */}
        <TabsContent value="inbox" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => clearAll.mutate(undefined, { onSuccess: () => refetch() })}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>

          <div className="space-y-2">
            {notifications?.map((notif) => {
              const Icon = TYPE_ICON[notif.notificationType] ?? Bell;
              const colorClass = TYPE_COLOR[notif.notificationType] ?? "text-muted-foreground bg-muted";
              return (
                <Card
                  key={notif.id}
                  className={notif.isRead ? "opacity-60" : "border-primary/25 bg-primary/[0.03]"}
                >
                  <CardContent className="p-4 flex gap-3 items-start">
                    <div className={`mt-0.5 shrink-0 rounded-full p-2 ${colorClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium leading-snug">{notif.title}</p>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground pt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs h-7"
                        onClick={() =>
                          markRead.mutate({ id: notif.id }, { onSuccess: () => refetch() })
                        }
                      >
                        Mark read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {!notifications?.length && (
              <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>You're all caught up — no notifications.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Preferences ───────────────────────────────── */}
        <TabsContent value="preferences" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">In-App Notification Preferences</CardTitle>
              <CardDescription>
                Choose which alert types appear in your inbox. Disabled types are still logged but
                won't show as unread.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.map((cat, ci) => (
                <div key={cat} className="space-y-3">
                  {ci > 0 && <Separator />}
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-1">
                    {cat}
                  </p>
                  <div className="space-y-1">
                    {NOTIFICATION_TYPES.filter((t) => t.category === cat).map((type) => {
                      const Icon = type.icon;
                      const enabled = isEnabled(type.key);
                      return (
                        <div
                          key={type.key}
                          className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-full p-1.5 ${
                                enabled
                                  ? (TYPE_COLOR[type.key] ?? "text-muted-foreground bg-muted")
                                  : "text-muted-foreground/40 bg-muted/50"
                              }`}
                            >
                              {enabled ? (
                                <Icon className="h-3.5 w-3.5" />
                              ) : (
                                <BellOff className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <Label
                              htmlFor={`pref-${type.key}`}
                              className="cursor-pointer space-y-0.5"
                            >
                              <span className={`block text-sm font-medium ${!enabled && "text-muted-foreground"}`}>
                                {type.label}
                              </span>
                              <span className="block text-xs text-muted-foreground font-normal">
                                {type.description}
                              </span>
                            </Label>
                          </div>
                          <Switch
                            id={`pref-${type.key}`}
                            checked={enabled}
                            onCheckedChange={() => togglePref(type.key)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSavePrefs}
                  disabled={!prefsDirty || updatePrefs.isPending}
                  className="gap-2"
                >
                  {updatePrefs.isPending ? "Saving…" : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
