import { useGetCurrentUser, useSwitchRole, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, Briefcase, Calculator, ShoppingCart, Eye } from "lucide-react";

const ROLE_ICONS: Record<string, any> = {
  admin: Shield,
  project_manager: Briefcase,
  engineer: User,
  accountant: Calculator,
  procurement_officer: ShoppingCart,
  viewer: Eye,
};

export default function Settings() {
  const { data: user, isLoading } = useGetCurrentUser();
  const switchRole = useSwitchRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading || !user) {
    return <div className="p-6">Loading settings...</div>;
  }

  const handleRoleChange = (role: string) => {
    switchRole.mutate({ data: { role: role as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({
          title: "Role Switched",
          description: `Your active role is now ${role.replace('_', ' ')}.`,
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and role.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Profile</CardTitle>
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
              {user.roles.map(role => {
                const Icon = ROLE_ICONS[role] || User;
                return (
                  <div key={role} className="flex items-center space-x-3 space-y-0 p-3 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                    <RadioGroupItem value={role} id={role} />
                    <Label htmlFor={role} className="flex flex-1 items-center gap-3 cursor-pointer">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{role.replace('_', ' ')}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
