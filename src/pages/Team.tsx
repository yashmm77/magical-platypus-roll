"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Mail, Shield, Calendar, MoreVertical, UserPlus, Loader2, User, Lock } from "lucide-react";
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
import { supabase } from "@/lib/supabase";

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  joined_at: string;
}

const Team = () => {
  const { user, activeOrgId } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Invite Dialog State
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteData, setInviteData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "member"
  });

  const fetchTeamData = useCallback(async () => {
    if (!activeOrgId || !user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Check if current user is admin
      const { data: adminCheck } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', activeOrgId)
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(adminCheck?.role === 'admin');

      // 2. Fetch all members of the organization
      const { data: membersData, error: membersError } = await supabase
        .from('org_members')
        .select(`
          role,
          created_at,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq('org_id', activeOrgId);

      if (membersError) throw membersError;

      const formattedMembers = membersData.map((m: any) => ({
        id: m.profiles.id,
        full_name: m.profiles.full_name,
        email: m.profiles.email,
        role: m.role,
        joined_at: m.created_at
      }));

      setMembers(formattedMembers);
    } catch (err: any) {
      console.error("Error fetching team:", err);
      toast.error("Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  }, [activeOrgId, user]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;
    
    setInviting(true);
    try {
      let resolvedUserId: string;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: inviteData.password,
        options: {
          data: {
            full_name: inviteData.fullName,
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("already registered") || authError.status === 422) {
          toast.info("User exists, linking to org...");
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', inviteData.email)
            .single();
          
          if (profileError || !profileData) throw new Error("Could not find existing user profile");
          resolvedUserId = profileData.id;
        } else {
          throw authError;
        }
      } else {
        if (!authData.user) throw new Error("Failed to create user");
        resolvedUserId = authData.user.id;
      }

      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: activeOrgId,
          user_id: resolvedUserId,
          role: inviteData.role
        });

      if (memberError) {
        if (memberError.code === '23505') {
          throw new Error("User is already a member of this organization");
        }
        throw memberError;
      }

      toast.success("Member added successfully");
      setInviteOpen(false);
      setInviteData({ fullName: "", email: "", password: "", role: "member" });
      fetchTeamData();
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

  if (!activeOrgId && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Users className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No Organization Selected</h2>
        <p className="text-slate-500 mt-2">Please select or create an organization to view team members.</p>
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
            onClick={() => setInviteOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
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
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Joined {format(new Date(member.joined_at), "MMM yyyy")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
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
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="fullName"
                    placeholder="Jane Doe"
                    className="pl-10"
                    value={inviteData.fullName}
                    onChange={(e) => setInviteData({ ...inviteData, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    className="pl-10"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Temporary Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={inviteData.password}
                    onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={inviteData.role} 
                  onValueChange={(val) => setInviteData({ ...inviteData, role: val })}
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
                Add to Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;