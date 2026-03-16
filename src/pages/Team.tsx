"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Mail, Shield, Calendar, MoreVertical, UserPlus, Loader2, Check, AlertCircle, Trash2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUsers } from "@/hooks/useUsers";
import { useRole } from "@/hooks/useRole";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const Team = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: users, isLoading, error } = useUsers();
  const { isAdmin } = useRole();
  
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setInviting(true);
    // Simulate invitation logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteOpen(false);
    setInviting(false);
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'member' | 'viewer') => {
    if (!isAdmin) return;
    setUpdatingRoleId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`Role updated to ${newRole}`);
      // Force a refetch of the users list
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToDelete || !isAdmin) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;
      
      toast.success(`${userToDelete.name} removed from team`);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteConfirmOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove user");
    } finally {
      setDeleting(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Failed to load team</h2>
        <p className="text-slate-500 max-w-md">
          There was an error fetching the team members.
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Members</h1>
          <p className="text-slate-500 mt-1">View your team and their roles.</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setInviteOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map((user) => (
          <Card key={user.id} className="border-none shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xl shadow-inner">
                    {user.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {user.full_name || "Unnamed User"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={cn(
                        "border-none text-[10px] uppercase tracking-wider",
                        user.role === 'admin' ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" :
                        user.role === 'member' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400" :
                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {user.role || "Member"}
                      </Badge>
                      {updatingRoleId === user.id && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2">
                        <UserIcon className="w-4 h-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Change Role</div>
                      <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'admin')} className="gap-2">
                        <Shield className="w-4 h-4 text-rose-500" /> Admin {user.role === 'admin' && <Check className="w-3 h-3 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'member')} className="gap-2">
                        <Users className="w-4 h-4 text-indigo-500" /> Member {user.role === 'member' && <Check className="w-3 h-3 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'viewer')} className="gap-2">
                        <Shield className="w-4 h-4 text-slate-500" /> Viewer {user.role === 'viewer' && <Check className="w-3 h-3 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-rose-600 gap-2"
                        onClick={() => {
                          setUserToDelete({ id: user.id, name: user.full_name || user.email });
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Remove from Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Joined {user.updated_at ? format(new Date(user.updated_at), "MMM yyyy") : "Recently"}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800" />
                  ))}
                </div>
                <span className="text-xs text-slate-400 font-medium">Active Member</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Initial Role</Label>
                <Badge variant="outline" className="w-fit">Viewer</Badge>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={inviting}>
                {inviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{userToDelete?.name}</strong> from the team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveUser} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;