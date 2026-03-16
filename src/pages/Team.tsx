"use client";

import { useState } from "react";
import { Users, Mail, Shield, Calendar, MoreVertical, UserPlus, Loader2, User, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const Team = () => {
  const { user, activeOrgId, userOrgs } = useAuth();
  const { data: members, isLoading } = useUsers();
  const queryClient = useQueryClient();
  
  const isAdmin = userOrgs.find(o => o.id === activeOrgId)?.role === 'admin';
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member"
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;
    
    setInviting(true);
    try {
      // a. Try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteForm.email,
        password: inviteForm.password,
        options: {
          data: {
            full_name: inviteForm.name,
          },
        },
      });

      let userId = signUpData?.user?.id;

      // c. If signUpError or !userId, check for existing profile
      if (signUpError || !userId) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", inviteForm.email)
          .single();
        
        userId = existing?.id;
      }

      if (!userId) throw new Error("Could not resolve user ID");

      // d. Insert into org_members
      const { error: memberError } = await supabase
        .from("org_members")
        .insert({
          org_id: activeOrgId,
          user_id: userId,
          role: inviteForm.role
        });

      if (memberError) throw memberError;

      // e. Success
      toast.success("Member added!");
      setShowInviteDialog(false);
      setInviteForm({ name: "", email: "", password: "", role: "member" });
      queryClient.invalidateQueries({ queryKey: ["users", activeOrgId] });
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100">Admin</Badge>;
      case 'viewer':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Viewer</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">Member</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Members</h1>
          <p className="text-slate-500 mt-1">Manage your team and their roles within this organization.</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setShowInviteDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      {!members || members.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No team members found</h3>
          <p className="text-slate-500 mt-1">Start by inviting someone to your organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member: any) => (
            <Card key={member.id} className="border-none shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-all group">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                      {member.full_name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {member.full_name || "Unnamed User"}
                      </h3>
                      <div className="mt-1">
                        {getRoleBadge(member.role)}
                      </div>
                    </div>
                  </div>
                  {isAdmin && member.id !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-600">Remove from Team</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a new member to your organization. If they already have an account, they will be linked to your team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Jane Doe"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={inviteForm.role} 
                  onValueChange={(val) => setInviteForm({ ...inviteForm, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={inviting}>
                {inviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;