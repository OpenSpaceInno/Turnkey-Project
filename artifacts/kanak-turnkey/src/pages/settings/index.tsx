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
} from "lucide-react";

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
      { data: { role: role as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast({
            title: "Role Switched",
            description: `Your active role is now ${role.replace("_", " ")}.`,
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
                {user.roles.map((role) => {
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
      )}
    </div>
  );
}
