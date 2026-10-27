import { useState, useEffect } from "react";
import {
  useGetCurrentUser,
  useSwitchRole,
  getGetCurrentUserQueryKey,
  useGetCompanySettings,
  useUpdateCompanySettings,
  getCompanySettingsQueryKey,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Shield,
  Briefcase,
  Calculator,
  ShoppingCart,
  Eye,
  Building2,
  Save,
  CheckCircle2,
  Copy,
  Download,
  AlertTriangle,
  QrCode,
  Key,
  Smartphone,
  Lock,
  Unlock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ROLE_ICONS: Record<string, any> = {
  admin: Shield,
  project_manager: Briefcase,
  engineer: User,
  accountant: Calculator,
  procurement_officer: ShoppingCart,
  viewer: Eye,
};

const CURRENCIES = [
  { code: "INR", label: "₹ Indian Rupee" },
  { code: "USD", label: "$ US Dollar" },
  { code: "EUR", label: "€ Euro" },
  { code: "GBP", label: "£ British Pound" },
  { code: "AED", label: "د.إ UAE Dirham" },
  { code: "SGD", label: "S$ Singapore Dollar" },
];

type CompanyForm = {
  companyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  currency: string;
  gstNumber: string;
  phone: string;
  email: string;
  website: string;
};

const empty: CompanyForm = {
  companyName: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  currency: "INR",
  gstNumber: "",
  phone: "",
  email: "",
  website: "",
};

export default function Settings() {
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const { data: company, isLoading: companyLoading } = useGetCompanySettings();
  const switchRole = useSwitchRole();
  const updateCompany = useUpdateCompanySettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<CompanyForm>(empty);
  const [dirty, setDirty] = useState(false);

  // ── Two-Factor Authentication (2FA) State ────────────────────
  const [twoFactorStatus, setTwoFactorStatus] = useState<{
    enabled: boolean;
    hasBackupCodes: boolean;
    backupCodesRemaining: number;
  }>({ enabled: false, hasBackupCodes: false, backupCodesRemaining: 0 });
  const [loading2FA, setLoading2FA] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpauthUrl: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [activating2FA, setActivating2FA] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [regeneratingBackup, setRegeneratingBackup] = useState(false);

  const fetch2FAStatus = async () => {
    try {
      const res = await fetch("/api/auth/2fa/status");
      if (res.ok) {
        const data = await res.json();
        setTwoFactorStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch 2FA status:", e);
    }
  };

  useEffect(() => {
    fetch2FAStatus();
  }, [user]);

  const handleStart2FASetup = async () => {
    setLoading2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize 2FA");
      setSetupData(data);
      setVerificationCode("");
      setShowSetupModal(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: err.message,
      });
    } finally {
      setLoading2FA(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!setupData || !verificationCode.trim()) return;
    setActivating2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: setupData.secret,
          code: verificationCode.trim(),
          backupCodes: setupData.backupCodes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      toast({
        title: "2FA Activated Successfully",
        description: "Your account is now secured with two-factor authentication.",
      });
      setShowSetupModal(false);
      await fetch2FAStatus();
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Activation Failed",
        description: err.message,
      });
    } finally {
      setActivating2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    setDisabling2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disable 2FA");
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been turned off for your account.",
      });
      setShowDisableDialog(false);
      await fetch2FAStatus();
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setRegeneratingBackup(true);
    try {
      const res = await fetch("/api/auth/2fa/regenerate-backup-codes", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to regenerate backup codes");
      setSetupData((prev) =>
        prev
          ? { ...prev, backupCodes: data.backupCodes }
          : { secret: "", otpauthUrl: "", qrCode: "", backupCodes: data.backupCodes }
      );
      setShowBackupCodesModal(true);
      await fetch2FAStatus();
      toast({
        title: "Backup Codes Regenerated",
        description: "New backup recovery codes have been saved.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setRegeneratingBackup(false);
    }
  };

  const copyToClipboard = (text: string, label: string = "Copied") => {
    navigator.clipboard.writeText(text);
    toast({
      title: label,
      description: "Copied to clipboard.",
    });
  };

  const downloadBackupCodes = (codes: string[]) => {
    const blob = new Blob([codes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanak-turnkey-backup-codes-${user?.email || "user"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Populate form once company data arrives
  useEffect(() => {
    if (!company) return;
    setForm({
      companyName: company.companyName ?? "",
      address: company.address ?? "",
      city: company.city ?? "",
      state: company.state ?? "",
      country: company.country ?? "India",
      pincode: company.pincode ?? "",
      currency: company.currency ?? "INR",
      gstNumber: company.gstNumber ?? "",
      phone: company.phone ?? "",
      email: company.email ?? "",
      website: company.website ?? "",
    });
    setDirty(false);
  }, [company]);

  const set = (key: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setDirty(true);
  };

  const handleSaveCompany = () => {
    updateCompany.mutate(
      {
        companyName: form.companyName || undefined,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        pincode: form.pincode || null,
        currency: form.currency || undefined,
        gstNumber: form.gstNumber || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getCompanySettingsQueryKey() });
          toast({ title: "Company settings saved" });
          setDirty(false);
        },
        onError: () => toast({ title: "Save failed", variant: "destructive" }),
      }
    );
  };

  const handleRoleChange = (role: string) => {
    switchRole.mutate(
      { role },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast({
            title: "Role Switched",
            description: `Your active role is now ${role.replace("_", " ")}.`,
          });
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Failed to switch role",
            description: error?.message || "An error occurred while switching roles.",
          });
        },
      }
    );
  };

  if (userLoading || companyLoading) {
    return <div className="p-6 text-muted-foreground">Loading settings…</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage company configuration and account preferences.</p>
      </div>

      {/* ── Company Settings ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>Organisation-wide configuration used across all projects</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={set("companyName")}
                placeholder="Kanak Constructions Pvt. Ltd."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="info@company.com" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website} onChange={set("website")} placeholder="https://www.company.com" />
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Address</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" value={form.address} onChange={set("address")} placeholder="Plot 12, Sector 5, Industrial Area" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={set("city")} placeholder="Mumbai" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={set("state")} placeholder="Maharashtra" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pincode">PIN / ZIP Code</Label>
                <Input id="pincode" value={form.pincode} onChange={set("pincode")} placeholder="400001" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={form.country} onChange={set("country")} placeholder="India" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial config */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Financial</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={form.currency}
                  onChange={set("currency")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gstNumber">GST / Tax Number</Label>
                <Input id="gstNumber" value={form.gstNumber} onChange={set("gstNumber")} placeholder="27AABCU9603R1ZX" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveCompany} disabled={!dirty || updateCompany.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {updateCompany.isPending ? "Saving…" : "Save Company Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── User / Role ──────────────────────────────────────────── */}
      {user && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <div className="font-medium mt-1">{user.name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="font-medium mt-1">{user.email}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Role</CardTitle>
                <CardDescription>Switch your active role to change what you see</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={user.activeRole} onValueChange={handleRoleChange} className="space-y-3">
                  {(Array.isArray(user.roles) ? user.roles : []).map((role) => {
                    const Icon = ROLE_ICONS[role] || User;
                    return (
                      <div
                        key={role}
                        className="flex items-center space-x-3 space-y-0 p-3 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
                      >
                        <RadioGroupItem value={role} id={role} />
                        <Label htmlFor={role} className="flex flex-1 items-center gap-3 cursor-pointer">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{role.replace("_", " ")}</span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* ── Security & Two-Factor Authentication (2FA) ──────────────── */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Two-Factor Authentication (2FA)</CardTitle>
                    <CardDescription>
                      Protect your account with an extra layer of security using standard TOTP authenticator apps.
                    </CardDescription>
                  </div>
                </div>
              </div>
              <div>
                {twoFactorStatus.enabled ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active & Protected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" /> Disabled
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                When enabled, sign in will require both your email/password and a 6-digit verification code from your authenticator app (such as Google Authenticator, Microsoft Authenticator, or Authy).
              </p>

              {twoFactorStatus.enabled ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm text-foreground">Authenticator App Configured</p>
                      <p className="text-xs text-muted-foreground">
                        {twoFactorStatus.backupCodesRemaining > 0
                          ? `${twoFactorStatus.backupCodesRemaining} recovery backup code(s) remaining.`
                          : "No recovery codes remaining. Generate new codes now."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateBackupCodes}
                        disabled={regeneratingBackup}
                        className="text-xs gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regeneratingBackup ? "animate-spin" : ""}`} />
                        New Backup Codes
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDisableDialog(true)}
                        className="text-xs gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Disable 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm text-foreground">Enhance your login security</p>
                    <p className="text-xs text-muted-foreground">
                      Compatible with Google Authenticator, Authy, Microsoft Authenticator, and 1Password.
                    </p>
                  </div>
                  <Button
                    onClick={handleStart2FASetup}
                    disabled={loading2FA}
                    className="gap-2 shadow-sm text-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {loading2FA ? "Setting up..." : "Enable Two-Factor Authentication"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 2FA Setup Dialog ───────────────────────────────────────── */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Setup Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code or enter the secret key into your authenticator app.
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-5 py-2">
              {/* Step 1: Scan QR */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Step 1: Scan QR Code
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
                  {setupData.qrCode ? (
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-border shrink-0">
                      <img
                        src={setupData.qrCode}
                        alt="2FA QR Code"
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="leading-relaxed">
                      Use Google Authenticator, Authy, or Microsoft Authenticator to scan this image.
                    </p>
                    <div className="space-y-1">
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">
                        Or enter this manual secret:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <code className="p-1.5 rounded bg-background border font-mono text-[11px] text-foreground select-all break-all">
                          {setupData.secret}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyToClipboard(setupData.secret, "Secret Key Copied")}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Backup Codes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Step 2: Save Backup Recovery Codes
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] gap-1 px-2"
                      onClick={() => copyToClipboard(setupData.backupCodes.join("\n"), "Backup Codes Copied")}
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] gap-1 px-2"
                      onClick={() => downloadBackupCodes(setupData.backupCodes)}
                    >
                      <Download className="w-3 h-3" /> Download
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-3 rounded-xl border border-border bg-muted/40 font-mono text-xs text-center text-foreground">
                  {setupData.backupCodes.map((c, i) => (
                    <span key={i} className="p-1.5 rounded bg-background border border-border/60">
                      {c}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Keep these safe. Each recovery code can be used once to access your account if you lose your phone.
                </p>
              </div>

              {/* Step 3: Verify & Activate */}
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Step 3: Enter 6-Digit Code from App
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="font-mono text-lg tracking-widest text-center h-11"
                  autoFocus
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSetupModal(false)}
              disabled={activating2FA}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm2FA}
              disabled={activating2FA || verificationCode.trim().length !== 6}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {activating2FA ? "Verifying..." : "Verify & Activate 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Regenerated Backup Codes Modal ─────────────────────────── */}
      <Dialog open={showBackupCodesModal} onOpenChange={setShowBackupCodesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" /> New Backup Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Your old backup codes are no longer valid. Please save these new codes now.
            </DialogDescription>
          </DialogHeader>

          {setupData?.backupCodes && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2 p-3.5 rounded-xl border border-border bg-muted/40 font-mono text-xs text-center text-foreground">
                {setupData.backupCodes.map((c, i) => (
                  <span key={i} className="p-2 rounded bg-background border border-border/70 font-semibold">
                    {c}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-xs gap-1.5"
                  onClick={() => copyToClipboard(setupData.backupCodes.join("\n"), "Backup Codes Copied")}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy All Codes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-xs gap-1.5"
                  onClick={() => downloadBackupCodes(setupData.backupCodes)}
                >
                  <Download className="w-3.5 h-3.5" /> Download (.txt)
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowBackupCodesModal(false)} className="w-full">
              I have safely stored my backup codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Disable 2FA Confirmation Dialog ────────────────────────── */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Disable Two-Factor Authentication?
            </DialogTitle>
            <DialogDescription>
              This will remove the requirement for an authenticator code during login, making your account less secure.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            You can always re-enable two-factor authentication later from your account settings.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(false)}
              disabled={disabling2FA}
            >
              Keep 2FA Active
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={disabling2FA}
            >
              {disabling2FA ? "Disabling..." : "Yes, Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
