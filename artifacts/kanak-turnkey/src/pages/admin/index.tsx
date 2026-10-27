import { useState, useMemo, useEffect } from "react";
import {
  useListUsers,
  useUpdateUserRoles,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_ROLES = [
  { value: "admin", label: "Admin", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "project_manager", label: "Project Manager", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "engineer", label: "Engineer", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "accountant", label: "Accountant", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "procurement_officer", label: "Procurement Officer", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "viewer", label: "Viewer", color: "bg-gray-100 text-gray-600 border-gray-200" },
] as const;

type RoleValue = typeof ALL_ROLES[number]["value"];

function getRoleStyle(role: string) {
  return (
    ALL_ROLES.find((r) => r.value === role)?.color ??
    "bg-gray-100 text-gray-600 border-gray-200"
  );
}

function getRoleLabel(role: string) {
  return (
    ALL_ROLES.find((r) => r.value === role)?.label ??
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleStyle(role)}`}
    >
      {getRoleLabel(role)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Create User Dialog
// ---------------------------------------------------------------------------

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { mutate, isPending } = useCreateUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["viewer"]);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setSelectedRoles(["viewer"]);
    setError("");
  }

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  const passwordStrength = useMemo(() => {
    if (!password) return null;
    if (password.length < 6) return { level: "weak", label: "Too short", color: "text-red-500" };
    if (password.length < 8) return { level: "fair", label: "Fair", color: "text-yellow-500" };
    const hasUpper = /[A-Z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const score = [hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    if (score === 3) return { level: "strong", label: "Strong", color: "text-green-600" };
    if (score >= 1) return { level: "good", label: "Good", color: "text-emerald-500" };
    return { level: "fair", label: "Fair", color: "text-yellow-500" };
  }, [password]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (selectedRoles.length === 0) {
      setError("Assign at least one role.");
      return;
    }
    setError("");
    mutate(
      { name: name.trim(), email: email.trim(), password, roles: selectedRoles },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (err: any) => {
          setError(err?.data?.error ?? err?.message ?? "Failed to create user.");
        },
      }
    );
  }

  const canSubmit =
    name.trim() && email.trim() && password.length >= 6 && password === confirmPassword && selectedRoles.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Set up credentials and assign roles. The user can log in immediately with these details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Profile ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile</p>
            <div className="space-y-1.5">
              <Label htmlFor="cu-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cu-name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cu-email"
                type="email"
                placeholder="rahul@kanakturnkey.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ── Password ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</p>
            <div className="space-y-1.5">
              <Label htmlFor="cu-password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="cu-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {/* Strength indicator */}
              {password && passwordStrength && (
                <div className="space-y-1">
                  <div className="flex gap-1 h-1">
                    {["weak", "fair", "good", "strong"].map((lvl, i) => (
                      <div
                        key={lvl}
                        className={`flex-1 rounded-full transition-colors ${
                          ["weak", "fair", "good", "strong"].indexOf(passwordStrength.level) >= i
                            ? passwordStrength.level === "weak" ? "bg-red-400"
                              : passwordStrength.level === "fair" ? "bg-yellow-400"
                              : passwordStrength.level === "good" ? "bg-emerald-400"
                              : "bg-green-500"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-confirm">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cu-confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={
                  confirmPassword && confirmPassword !== password
                    ? "border-destructive focus-visible:ring-destructive"
                    : confirmPassword && confirmPassword === password
                    ? "border-green-500 focus-visible:ring-green-500"
                    : ""
                }
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-destructive">Passwords do not match.</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="text-xs text-green-600">✓ Passwords match</p>
              )}
            </div>
          </div>

          {/* ── Roles ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assign Roles <span className="text-destructive">*</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 transition-colors ${
                    selectedRoles.includes(role.value)
                      ? "border-primary/50 bg-primary/5"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                  />
                  <div>
                    <p className="text-sm font-medium leading-tight">{role.label}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit User Dialog
// ---------------------------------------------------------------------------

function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { mutate, isPending } = useUpdateUser();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [error, setError] = useState("");

  // Sync form when user prop changes
  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setAvatarUrl(user?.avatarUrl ?? "");
    setError("");
  }, [user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    mutate(
      {
        id: user.id,
        data: {
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err: any) => {
          setError(err?.data?.error ?? err?.message ?? "Failed to update user.");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update profile details for {user?.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="eu-name">Full Name</Label>
            <Input
              id="eu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eu-email">Email Address</Label>
            <Input
              id="eu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eu-avatar">Avatar URL</Label>
            <Input
              id="eu-avatar"
              type="url"
              placeholder="https://…"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !email.trim()}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Manage Roles Dialog
// ---------------------------------------------------------------------------

function ManageRolesDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { mutate, isPending } = useUpdateUserRoles();
  const [selected, setSelected] = useState<string[]>(user?.roles ?? []);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelected(user?.roles ?? []);
    setError("");
  }, [user]);

  function toggle(role: string) {
    setSelected((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (selected.length === 0) {
      setError("Assign at least one role.");
      return;
    }
    setError("");
    mutate(
      { id: user.id, data: { roles: selected } },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err: any) => {
          setError(err?.data?.error ?? err?.message ?? "Failed to update roles.");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>
            Select all roles that apply to <strong>{user?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current active role display */}
          {user?.activeRole && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Active role:</span>
              <RoleBadge role={user.activeRole} />
            </div>
          )}
          <div className="space-y-2">
            {ALL_ROLES.map((role) => (
              <label
                key={role.value}
                className="flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selected.includes(role.value)}
                    onCheckedChange={() => toggle(role.value)}
                  />
                  <span className="font-medium text-sm">{role.label}</span>
                </div>
                {selected.includes(role.value) && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${role.color}`}
                  >
                    Assigned
                  </span>
                )}
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || selected.length === 0}>
              {isPending ? "Saving…" : "Save Roles"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirm Dialog
// ---------------------------------------------------------------------------

function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { mutate, isPending } = useDeleteUser();

  function handleConfirm() {
    if (!user) return;
    mutate(user.id, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{user?.name}</strong> (
            {user?.email}). This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Page
// ---------------------------------------------------------------------------

export default function Admin() {
  const { data: users = [], isLoading } = useListUsers();

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [rolesUser, setRolesUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Search
  const [search, setSearch] = useState("");

  // Stats
  const roleCount = useMemo(() => {
    const counts: Record<string, number> = {};
    const usersArray = Array.isArray(users) ? users : [];
    for (const user of usersArray) {
      const rolesArray = Array.isArray(user.roles) ? user.roles : [];
      for (const r of rolesArray) {
        counts[r] = (counts[r] ?? 0) + 1;
      }
    }
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    const usersArray = Array.isArray(users) ? users : [];
    const q = search.toLowerCase();
    if (!q) return usersArray;
    const result = usersArray.filter(
      (u) => {
        const rolesArray = Array.isArray(u.roles) ? u.roles : [];
        return u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          rolesArray.some((r) => r?.toLowerCase().includes(q));
      }
    );
    return Array.isArray(result) ? result : [];
  }, [users, search]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading users…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and access control.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <UserPlus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={users.length} />
        <StatCard
          label="Admins"
          value={roleCount["admin"] ?? 0}
          sub="with admin access"
        />
        <StatCard
          label="Project Managers"
          value={roleCount["project_manager"] ?? 0}
        />
        <StatCard
          label="Engineers"
          value={(roleCount["engineer"] ?? 0) + (roleCount["procurement_officer"] ?? 0)}
          sub="engineers + procurement"
        />
      </div>

      {/* ── Role breakdown chips ── */}
      <div className="flex flex-wrap gap-2">
        {ALL_ROLES.map((role) => (
          <div
            key={role.value}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${role.color}`}
          >
            <span>{role.label}</span>
            <span className="font-bold">{roleCount[role.value] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* ── Users table ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
              <span className="text-muted-foreground font-normal text-sm">
                ({filtered.length})
              </span>
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-lg border-t overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Roles</th>
                  <th className="px-4 py-3 text-left font-medium">Active Role</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      {search ? `No users match "${search}"` : "No users found."}
                    </td>
                  </tr>
                ) : (
                  (Array.isArray(filtered) ? filtered : []).map((user) => (
                    <tr key={user.id} className="hover:bg-accent/30 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={user.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                              {initials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold leading-tight">{user.name}</p>
                            <p className="text-xs text-muted-foreground">ID #{user.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>

                      {/* Roles */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <RoleBadge key={role} role={role} />
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              No roles
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Active Role */}
                      <td className="px-4 py-3">
                        {user.activeRole ? (
                          <RoleBadge role={user.activeRole} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions for {user.name}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditUser(user)}
                              className="gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setRolesUser(user)}
                              className="gap-2"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Manage Roles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteUser(user)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserDialog
        user={editUser}
        open={editUser !== null}
        onOpenChange={(v) => { if (!v) setEditUser(null); }}
      />
      <ManageRolesDialog
        user={rolesUser}
        open={rolesUser !== null}
        onOpenChange={(v) => { if (!v) setRolesUser(null); }}
      />
      <DeleteUserDialog
        user={deleteUser}
        open={deleteUser !== null}
        onOpenChange={(v) => { if (!v) setDeleteUser(null); }}
      />
    </div>
  );
}
