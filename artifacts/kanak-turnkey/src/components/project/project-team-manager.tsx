import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProjectTeam,
  useAssignProjectTeamMember,
  useRemoveProjectTeamMember,
  useListUsers,
  type ProjectTeamMember,
} from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Trash2, Shield, HardHat, Briefcase, Calculator, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const PROJECT_ROLES = [
  { value: "project_manager", label: "Project Manager", icon: Shield },
  { value: "site_engineer", label: "Site Engineer", icon: HardHat },
  { value: "commercial_manager", label: "Commercial / Billing Manager", icon: Calculator },
  { value: "procurement_officer", label: "Procurement Officer", icon: Briefcase },
  { value: "safety_officer", label: "Safety / QC Officer", icon: Shield },
  { value: "team_member", label: "Team Member", icon: Users },
  { value: "viewer", label: "Viewer", icon: Eye },
] as const;

export function ProjectTeamManager({ projectId }: { projectId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("site_engineer");

  const { data: team = [], isLoading } = useGetProjectTeam(projectId);
  const { data: allUsers = [] } = useListUsers();

  const assignMember = useAssignProjectTeamMember();
  const removeMember = useRemoveProjectTeamMember();

  // Filter out users already assigned
  const assignedUserIds = new Set(team.map((t) => t.userId));
  const availableUsers = allUsers.filter((u) => !assignedUserIds.has(u.id));

  const handleAssign = async () => {
    if (!selectedUserId) return;
    try {
      await assignMember.mutateAsync({
        projectId,
        userId: Number(selectedUserId),
        role: selectedRole,
      });
      toast({
        title: "Team Member Assigned",
        description: "User has been granted project access.",
      });
      setOpenAdd(false);
      setSelectedUserId("");
      await qc.invalidateQueries({ queryKey: [`/api/projects/${projectId}/team`] });
      await qc.invalidateQueries({ queryKey: [`/api/projects/${projectId}/setup-checklist`] });
      await qc.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    } catch (err: any) {
      toast({
        title: "Assignment Failed",
        description: err.message || "Failed to assign team member.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (userId: number, name: string) => {
    if (!confirm(`Remove ${name || "this user"} from the project team?`)) return;
    try {
      await removeMember.mutateAsync({ projectId, userId });
      toast({
        title: "Team Member Removed",
        description: `${name || "User"} is no longer assigned to this project.`,
      });
      await qc.invalidateQueries({ queryKey: [`/api/projects/${projectId}/team`] });
      await qc.invalidateQueries({ queryKey: [`/api/projects/${projectId}/setup-checklist`] });
      await qc.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to remove team member.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-muted/20">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Internal Project Team & Assignments
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Personnel authorized to manage site execution, approve material requisitions, and verify billing.
          </CardDescription>
        </div>

        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 font-medium shadow-sm">
              <UserPlus className="h-4 w-4" />
              Assign Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Team Member to Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label>Select Company User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a colleague..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAdd(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={!selectedUserId || assignMember.isPending}>
                {assignMember.isPending ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
            Loading team assignments...
          </div>
        ) : team.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Users className="h-10 w-10 text-muted-foreground mx-auto stroke-1" />
            <p className="text-sm font-medium">No team members assigned yet</p>
            <p className="text-xs text-muted-foreground">
              Assign engineers, commercial managers, and site staff to give them access.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {team.map((member) => {
              const roleMeta = PROJECT_ROLES.find((r) => r.value === member.role);
              const RoleIcon = roleMeta?.icon || Users;

              return (
                <div
                  key={member.id}
                  className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={member.userAvatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {member.userName
                          ? member.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {member.userName || "Assigned User"}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize font-medium gap-1 bg-muted/50">
                          <RoleIcon className="h-3 w-3 text-primary" />
                          {roleMeta?.label || member.role.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{member.userEmail}</span>
                        {member.assignedAt && (
                          <>
                            <span>•</span>
                            <span>Assigned {format(new Date(member.assignedAt), "MMM d, yyyy")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(member.userId, member.userName || "")}
                      title="Remove from project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
