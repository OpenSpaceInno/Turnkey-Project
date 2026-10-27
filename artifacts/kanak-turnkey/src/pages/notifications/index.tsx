import { useState, useEffect, useMemo } from "react";
import {
  useListNotifications,
  useMarkNotificationRead,
  useClearNotifications,
  useGetNotificationPreferences,
  useUpdateNotificationPreferences,
  useGetCurrentUser,
  getNotificationPreferencesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DollarSign,
  Settings2,
  Mail,
  MailCheck,
  Send,
  RefreshCw,
  Eye,
  Inbox,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export interface ChannelPreference {
  inApp: boolean;
  email: boolean;
}

export interface WorkflowEmailLog {
  id: number;
  recipientEmail: string;
  recipientName: string | null;
  userId: number | null;
  eventType: string;
  subject: string;
  status: string;
  bodyPreview: string | null;
  bodyHtml: string | null;
  metadata: any;
  errorMessage: string | null;
  createdAt: string;
}

const WORKFLOW_NOTIFICATION_TYPES = [
  // RA Billing & Milestones
  {
    key: "ra_bill_submitted",
    label: "RA Bill Submitted",
    description: "Triggered when a Running Account bill is submitted for certification",
    icon: FileText,
    category: "RA Billing & Client Milestones",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    key: "ra_bill_certified",
    label: "RA Bill Certified",
    description: "Triggered when client engineer signs off certified bill for invoicing",
    icon: ClipboardCheck,
    category: "RA Billing & Client Milestones",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },

  // Procurement & Purchase Orders
  {
    key: "purchase_order_approved",
    label: "Purchase Order Approved",
    description: "Triggered when management signs off on a vendor Purchase Order",
    icon: Package,
    category: "Procurement & Purchase Orders",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    key: "purchase_order_issued",
    label: "Purchase Order Issued",
    description: "Triggered when PO is formally dispatched to the vendor",
    icon: Send,
    category: "Procurement & Purchase Orders",
    color: "text-cyan-600 bg-cyan-50 border-cyan-200",
  },
  {
    key: "low_stock",
    label: "Low Stock Alert",
    description: "Triggered when site inventory drops below reorder threshold",
    icon: AlertCircle,
    category: "Procurement & Purchase Orders",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },

  // Accounts Payable & Vendor Invoices
  {
    key: "vendor_invoice_discrepancy",
    label: "Vendor Invoice Discrepancy",
    description: "Triggered when 3-way match detects price or quantity mismatch",
    icon: AlertCircle,
    category: "Accounts Payable & Invoices",
    color: "text-red-600 bg-red-50 border-red-200",
  },
  {
    key: "vendor_invoice_matched",
    label: "3-Way Match Verified",
    description: "Triggered when invoice matches PO and GRN for payment scheduling",
    icon: ShieldCheck,
    category: "Accounts Payable & Invoices",
    color: "text-teal-600 bg-teal-50 border-teal-200",
  },
  {
    key: "invoice_overdue",
    label: "Client Invoice Overdue",
    description: "Triggered when client billing crosses credit terms without payment",
    icon: DollarSign,
    category: "Accounts Payable & Invoices",
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    key: "payment_received",
    label: "Payment Received",
    description: "Triggered when payment is recorded against a project invoice",
    icon: DollarSign,
    category: "Accounts Payable & Invoices",
    color: "text-green-600 bg-green-50 border-green-200",
  },

  // Quality, Safety & Handover
  {
    key: "quality_inspection_rejected",
    label: "Quality Inspection Rejected",
    description: "Triggered when field inspection or material test fails acceptance criteria",
    icon: AlertCircle,
    category: "Quality, Safety & Execution",
    color: "text-destructive bg-destructive/10 border-destructive/20",
  },
  {
    key: "punch_item_assigned",
    label: "Punch List Item Assigned",
    description: "Triggered when snag/defect item is assigned to site supervisor for rectification",
    icon: Wrench,
    category: "Quality, Safety & Execution",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },

  // Financial Governance & Administration
  {
    key: "instrument_expiring",
    label: "Financial Instrument Expiring",
    description: "Critical alert when BG, FD, or LC enters 30-day expiry window",
    icon: Wrench,
    category: "Financial Governance",
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    key: "approval_required",
    label: "Approval Required",
    description: "Triggered when any workflow stage requires your direct sign-off",
    icon: ClipboardCheck,
    category: "Financial Governance",
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    key: "project_created",
    label: "Project Created",
    description: "Triggered when a new project is created or assigned",
    icon: FolderKanban,
    category: "Financial Governance",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
] as const;

const TYPE_CONFIG = Object.fromEntries(
  WORKFLOW_NOTIFICATION_TYPES.map((t) => [t.key, t])
);

const CATEGORIES = [...new Set(WORKFLOW_NOTIFICATION_TYPES.map((t) => t.category))];

export default function Notifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useGetCurrentUser();
  const { data: notifications, isLoading: notifsLoading, refetch: refetchNotifs } = useListNotifications();
  const { data: prefsData, isLoading: prefsLoading } = useGetNotificationPreferences();
  const markRead = useMarkNotificationRead();
  const clearAll = useClearNotifications();
  const updatePrefs = useUpdateNotificationPreferences();

  // Active Tab State
  const [activeTab, setActiveTab] = useState("inbox");

  // Preferences State: { [key]: { inApp: boolean, email: boolean } }
  const [prefs, setPrefs] = useState<Record<string, ChannelPreference>>({});
  const [prefsDirty, setPrefsDirty] = useState(false);

  // Email Logs State
  const [emailLogs, setEmailLogs] = useState<WorkflowEmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterEvent, setLogFilterEvent] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");

  // Test Email Modal State
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmailType, setTestEmailType] = useState<string>("ra_bill_submitted");
  const [testEmailRecipient, setTestEmailRecipient] = useState<string>("");
  const [sendingTest, setSendingTest] = useState(false);

  // Email Preview Modal State
  const [previewLog, setPreviewLog] = useState<WorkflowEmailLog | null>(null);

  // Initialize preferences state
  useEffect(() => {
    if (!prefsData) return;
    const rawPrefs = (prefsData.preferences ?? {}) as Record<string, any>;
    const normalized: Record<string, ChannelPreference> = {};

    WORKFLOW_NOTIFICATION_TYPES.forEach((type) => {
      const val = rawPrefs[type.key];
      if (val === undefined || val === null) {
        // Default both enabled
        normalized[type.key] = { inApp: true, email: true };
      } else if (typeof val === "boolean") {
        normalized[type.key] = { inApp: val, email: val };
      } else if (typeof val === "object") {
        normalized[type.key] = {
          inApp: val.inApp !== false,
          email: val.email !== false,
        };
      } else {
        normalized[type.key] = { inApp: true, email: true };
      }
    });

    setPrefs(normalized);
    setPrefsDirty(false);
  }, [prefsData]);

  // Set default recipient when user data arrives
  useEffect(() => {
    if (user?.email && !testEmailRecipient) {
      setTestEmailRecipient(user.email);
    }
  }, [user, testEmailRecipient]);

  // Fetch email logs
  const fetchEmailLogs = async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      if (logFilterEvent && logFilterEvent !== "all") {
        params.append("eventType", logFilterEvent);
      }
      if (logSearch.trim()) {
        params.append("search", logSearch.trim());
      }
      const res = await fetch(`/api/notifications/email-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch email logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "email-logs") {
      fetchEmailLogs();
    }
  }, [activeTab, logFilterEvent, logSearch]);

  // Toggle helper
  const toggleChannel = (key: string, channel: "inApp" | "email") => {
    setPrefs((current) => {
      const currentPref = current[key] ?? { inApp: true, email: true };
      return {
        ...current,
        [key]: {
          ...currentPref,
          [channel]: !currentPref[channel],
        },
      };
    });
    setPrefsDirty(true);
  };

  // Bulk toggles
  const setAllChannel = (channel: "inApp" | "email", value: boolean) => {
    setPrefs((current) => {
      const updated = { ...current };
      WORKFLOW_NOTIFICATION_TYPES.forEach((type) => {
        const existing = updated[type.key] ?? { inApp: true, email: true };
        updated[type.key] = { ...existing, [channel]: value };
      });
      return updated;
    });
    setPrefsDirty(true);
  };

  // Save Preferences
  const handleSavePrefs = () => {
    updatePrefs.mutate(
      { preferences: prefs as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getNotificationPreferencesQueryKey(),
          });
          toast({
            title: "Notification preferences saved",
            description: "Channel preferences for in-app and email workflow events updated.",
          });
          setPrefsDirty(false);
        },
        onError: () =>
          toast({
            title: "Failed to save preferences",
            variant: "destructive",
          }),
      }
    );
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      toast({
        title: "Recipient Required",
        description: "Please specify a recipient email address.",
        variant: "destructive",
      });
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/notifications/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: testEmailType,
          toEmail: testEmailRecipient,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch test email");
      }

      toast({
        title: "Test Email Dispatched! ✉️",
        description: `Sample email for '${testEmailType}' delivered to ${testEmailRecipient}.`,
      });

      setTestEmailOpen(false);
      fetchEmailLogs();
    } catch (err: any) {
      toast({
        title: "Dispatch Failed",
        description: err?.message || "Could not send test email",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const unreadCount =
    (Array.isArray(notifications) ? notifications : []).filter((n) => !n.isRead)
      .length ?? 0;

  const totalEmailDelivered = emailLogs.length;

  if (notifsLoading || prefsLoading) {
    return <div className="p-8 text-muted-foreground text-center">Loading notifications & channels…</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Notifications & Alerts</h1>
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary">
              Multi-Channel
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Configure in-app alerts and email notifications on critical turnkey workflow events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setTestEmailOpen(true)}
          >
            <Mail className="h-4 w-4 text-primary" />
            Send Test Email
          </Button>
        </div>
      </div>

      {/* ── Main Tab Navigation ──────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Preferences
            {prefsDirty && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="email-logs" className="gap-2">
            <MailCheck className="h-4 w-4" />
            Email Outbox
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: In-App Inbox ─────────────────────────────── */}
        <TabsContent value="inbox" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {Array.isArray(notifications) ? notifications.length : 0} notifications ({unreadCount} unread)
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => clearAll.mutate(undefined, { onSuccess: () => refetchNotifs() })}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          </div>

          <div className="space-y-2">
            {(Array.isArray(notifications) ? notifications : []).map((notif) => {
              const config = TYPE_CONFIG[notif.notificationType];
              const Icon = config?.icon || Bell;
              const colorClass = config?.color || "text-muted-foreground bg-muted";

              return (
                <Card
                  key={notif.id}
                  className={`transition-colors ${
                    notif.isRead
                      ? "opacity-70 bg-card"
                      : "border-primary/30 bg-primary/[0.02] shadow-sm"
                  }`}
                >
                  <CardContent className="p-4 flex gap-3.5 items-start">
                    <div className={`mt-0.5 shrink-0 rounded-full p-2 border ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {notif.title}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs h-7 ml-1"
                        onClick={() =>
                          markRead.mutate(
                            { id: notif.id },
                            { onSuccess: () => refetchNotifs() }
                          )
                        }
                      >
                        Mark read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {(!notifications || notifications.length === 0) && (
              <div className="text-center py-16 border rounded-lg border-dashed bg-muted/20 text-muted-foreground space-y-2">
                <Bell className="h-10 w-10 mx-auto opacity-30 text-muted-foreground" />
                <p className="font-medium text-foreground">You're all caught up!</p>
                <p className="text-xs">No pending notifications in your inbox.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Channel Preferences ──────────────────────── */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Workflow Event Notification Channels</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Select delivery channels for each turnkey workflow event. Turn on <strong>Email Notification</strong> to receive branded HTML alert summaries directly to your inbox.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setAllChannel("email", true)}
                  >
                    Enable All Email
                  </Button>
                  <Button
                    onClick={handleSavePrefs}
                    disabled={!prefsDirty || updatePrefs.isPending}
                    size="sm"
                    className="gap-2 text-xs h-8"
                  >
                    {updatePrefs.isPending ? "Saving…" : "Save Preferences"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">
              {CATEGORIES.map((category, catIdx) => {
                const categoryTypes = WORKFLOW_NOTIFICATION_TYPES.filter(
                  (t) => t.category === category
                );

                return (
                  <div key={category} className="space-y-4">
                    {catIdx > 0 && <Separator />}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {category}
                      </h3>
                    </div>

                    <div className="divide-y divide-border/60 rounded-md border bg-card/50">
                      {categoryTypes.map((type) => {
                        const Icon = type.icon;
                        const pref = prefs[type.key] ?? { inApp: true, email: true };

                        return (
                          <div
                            key={type.key}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start gap-3 max-w-xl">
                              <div
                                className={`rounded-full p-2 border shrink-0 mt-0.5 ${type.color}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="space-y-0.5">
                                <span className="block text-sm font-semibold text-foreground">
                                  {type.label}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {type.description}
                                </span>
                              </div>
                            </div>

                            {/* Channel Toggles */}
                            <div className="flex items-center gap-6 shrink-0 self-end sm:self-center pl-10 sm:pl-0">
                              {/* In-App Toggle */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`pref-inapp-${type.key}`}
                                  checked={pref.inApp}
                                  onCheckedChange={() => toggleChannel(type.key, "inApp")}
                                />
                                <Label
                                  htmlFor={`pref-inapp-${type.key}`}
                                  className="text-xs cursor-pointer flex items-center gap-1 text-muted-foreground font-medium"
                                >
                                  <Bell className="h-3.5 w-3.5" />
                                  In-App
                                </Label>
                              </div>

                              {/* Email Toggle */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`pref-email-${type.key}`}
                                  checked={pref.email}
                                  onCheckedChange={() => toggleChannel(type.key, "email")}
                                />
                                <Label
                                  htmlFor={`pref-email-${type.key}`}
                                  className="text-xs cursor-pointer flex items-center gap-1 text-primary font-semibold"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  Email
                                </Label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-xs text-muted-foreground">
                  Email notifications are sent from <strong>notifications@kanakturnkey.com</strong>
                </span>
                <Button
                  onClick={handleSavePrefs}
                  disabled={!prefsDirty || updatePrefs.isPending}
                  className="gap-2"
                >
                  {updatePrefs.isPending ? "Saving Changes…" : "Save Notification Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Email Outbox / Activity Logs ─────────────── */}
        <TabsContent value="email-logs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MailCheck className="h-5 w-5 text-primary" />
                    Workflow Email Outbox & Activity Log
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Real-time audit log of all transactional email notifications dispatched by the system.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={fetchEmailLogs}
                    disabled={logsLoading}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setTestEmailOpen(true)}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Test Email
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search recipient, subject, preview..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
                <div>
                  <Select value={logFilterEvent} onValueChange={setLogFilterEvent}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Filter by event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Workflow Events</SelectItem>
                      {WORKFLOW_NOTIFICATION_TYPES.map((t) => (
                        <SelectItem key={t.key} value={t.key}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {logsLoading ? (
                <div className="py-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  Loading workflow email activity log…
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground space-y-2">
                  <Mail className="h-10 w-10 mx-auto opacity-30 text-muted-foreground" />
                  <p className="font-medium text-foreground">No workflow emails dispatched yet.</p>
                  <p className="text-xs">
                    Trigger an event or click "Send Test Email" to simulate and verify email notification dispatch.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => setTestEmailOpen(true)}
                  >
                    Send Test Email
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-md border overflow-hidden">
                  {emailLogs.map((log) => {
                    const config = TYPE_CONFIG[log.eventType];
                    const eventLabel = config?.label || log.eventType;

                    return (
                      <div
                        key={log.id}
                        className="p-4 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-medium">
                              {eventLabel}
                            </Badge>
                            <Badge
                              className={`text-[11px] px-1.5 py-0 capitalize ${
                                log.status === "sent"
                                  ? "bg-emerald-600 text-white"
                                  : log.status === "delivered"
                                  ? "bg-teal-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {log.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              To: <strong>{log.recipientEmail}</strong>
                              {log.recipientName ? ` (${log.recipientName})` : ""}
                            </span>
                          </div>

                          <p className="font-semibold text-foreground line-clamp-1">
                            {log.subject}
                          </p>

                          {log.bodyPreview && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {log.bodyPreview}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm")}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-primary"
                            onClick={() => setPreviewLog(log)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Email
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Test Email Dialog ─────────────────────────────────── */}
      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              Dispatch Test Workflow Email
            </DialogTitle>
            <DialogDescription className="text-xs">
              Simulate or test actual delivery of an automated workflow event notification using Kanak Turnkey's responsive HTML template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="test-event-type" className="text-xs font-semibold">
                Select Workflow Event
              </Label>
              <Select value={testEmailType} onValueChange={setTestEmailType}>
                <SelectTrigger id="test-event-type" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label} ({t.category.split("&")[0].trim()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="test-recipient" className="text-xs font-semibold">
                Recipient Email Address
              </Label>
              <Input
                id="test-recipient"
                type="email"
                placeholder="name@kanakturnkey.com"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                In local development, the email is logged to the Outbox log with full rendered preview.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestEmailOpen(false)}
              disabled={sendingTest}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendTestEmail}
              disabled={sendingTest || !testEmailRecipient}
              className="gap-2"
            >
              {sendingTest ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Dispatching…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Email Preview Dialog ─────────────────────────────── */}
      <Dialog open={!!previewLog} onOpenChange={(open) => !open && setPreviewLog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between gap-2 pr-6">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {previewLog?.subject}
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  To: <strong>{previewLog?.recipientEmail}</strong> &bull; Event:{" "}
                  <strong>{previewLog?.eventType}</strong> &bull; Status:{" "}
                  <span className="capitalize font-semibold text-primary">{previewLog?.status}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 bg-slate-100 flex justify-center">
            {previewLog?.bodyHtml ? (
              <div
                className="w-full max-w-[620px] bg-white rounded shadow border overflow-hidden"
                dangerouslySetInnerHTML={{ __html: previewLog.bodyHtml }}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No HTML content available.
              </div>
            )}
          </div>

          <DialogFooter className="p-3 border-t bg-card">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewLog(null)}
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
