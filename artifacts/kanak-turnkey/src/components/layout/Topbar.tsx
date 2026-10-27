import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetCurrentUser, useSwitchRole, useLogout, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  project_manager: "Project Manager",
  engineer: "Site Engineer",
  accountant: "Accountant",
  procurement_officer: "Procurement Officer",
  viewer: "Viewer",
};

export function Topbar() {
  const { data: user } = useGetCurrentUser();
  const switchRole = useSwitchRole();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleRoleSwitch = (role: any) => {
    switchRole.mutate({ role }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({
          title: "Role Switched",
          description: `You are now operating as ${ROLE_LABELS[role] || role}`,
        });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Failed to switch role",
          description: error?.message || "An error occurred while switching roles.",
        });
      }
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Logout Failed",
          description: "Could not log out. Please try again.",
        });
      },
    });
  };

  if (!user) return null;

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Breadcrumbs or page title could go here */}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative" onClick={() => setLocation("/notifications")}>
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 border-border/50 bg-background hover:bg-accent">
              <span className="text-sm font-medium">
                {user.activeRole ? ROLE_LABELS[user.activeRole] : "Select Role"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.roles && Array.isArray(user.roles) && user.roles.map((role) => (
              <DropdownMenuItem 
                key={role} 
                onClick={() => handleRoleSwitch(role)}
                className={user.activeRole === role ? "bg-accent" : ""}
              >
                {ROLE_LABELS[role] || role}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{logoutMutation.isPending ? "Logging out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
