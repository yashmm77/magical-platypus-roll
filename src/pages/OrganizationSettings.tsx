"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  User, 
  Eye, 
  Trash2, 
  UserPlus, 
  Mail, 
  Lock 
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const OrganizationSettings = () => {
  const { user, activeOrgId, userOrgs } = useAuth();
  const { orgId } = useParams();
  const orgIdFromRoute = orgId || activeOrgId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAdmin = userOrgs.find(o => o.id === orgIdFromRoute)?.role === 'admin';

  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState({ name: "", description: "" });
  const [members, setMembers] = useState<any[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "member" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // Load organization data
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!orgIdFromRoute) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("organizations")
          .select("id, name, description")
          .eq("id", orgIdFromRoute)
          .single();

        if (error) throw error;
        setOrg(data);

        // Load members
        const { data: membersData, error: membersError } = await supabase
          .from("org_members")
          .select("role, profiles(id, full_name, email)")
          .eq("org_id", orgIdFromRoute)
          .order("created_at", { ascending: false });

        if (!membersError) setMembers(membersData || []);
      } catch (error: any) {
        toast.error(error.message || "Failed to load organization");
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [orgIdFromRoute]);

  // Save organization changes
  const handleSaveOrg = async () => {
    if (!orgIdFromRoute) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: org.name, description: org.description })
        .eq("id", orgIdFromRoute);

      if (error) throw error;
      toast.success("Organization details updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update organization");
    } finally {
      setLoading(false);
    }
  };

  // Invite new member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgIdFromRoute) return;
    
    setInviteLoading(true);
    try {
      // Check if user already exists
      const { data: existing, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteForm.email)
        .single();

      let userId;
      if (existing && !existingError) {
        userId = existing.id;
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: inviteForm.email,
          password: "temp_password_123",
          options: {
            data: {
              full_name: inviteForm.name,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user");
        userId = authData.user.id;
      }

      // Add to organization
      const { error: memberError } = await supabase
        .from("org_members")
        .upsert({
          org_id: orgIdFromRoute,
          user_id: userId,
          role: inviteForm.role
        }, { onConflict: "org_id, user_id" });

      if (memberError) throw memberError;
      
      toast.success(`Member ${inviteForm.name} added to organization`);
      setInviteModalOpen(false);
      setInviteForm({ name: "", email: "", role: "member" });
      queryClient.invalidateQueries({ queryKey: ["users", orgIdFromRoute] });
      
      // Refresh local members list
      const { data: membersData } = await supabase
        .from("org_members")
        .select("role, profiles(id, full_name, email)")
        .eq("org_id", orgIdFromRoute)
        .order("created_at", { ascending: false });
      if (membersData) setMembers(membersData);
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    } finally {
      setInviteLoading(false);
    }
  };

  // Delete member
  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    
    setDeleting(true);
    setDeletingMemberId(memberId);
    
    try {
      const { error } = await supabase
        .from("org_members")
        .delete()
        .eq("org_id", orgIdFromRoute)
        .eq("user_id", memberId);

      if (error) throw error;
      
      toast.success("Member removed from organization");
      setMembers(prev => prev.filter(m => m.profiles.id !== memberId));
      queryClient.invalidateQueries({ queryKey: ["users", orgIdFromRoute] });
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    } finally {
      setDeleting(false);
      setDeletingMemberId(null);
    }
  };

  if (loading && !org.name) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Organization Settings</h1>
          <p className="text-slate-500">Manage your organization's details and members.</p>
        </div>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
          {isAdmin ? "Admin Access" : "Member Access"}
        </Badge>
      </div>

      {/* Organization Details */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            Organization Details
          </CardTitle>
          <CardDescription>
            Update your organization's name and description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={org.name}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
                placeholder="Enter organization name"
                disabled={!isAdmin}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="orgDescription">Description</Label>
              <Input
                id="orgDescription"
                value={org.description || ""}
                onChange={(e) => setOrg({ ...org, description: e.target.value })}
                placeholder="Brief description of your organization"
                disabled={!isAdmin}
              />
            </div>
          </div>
        </CardContent>
        {isAdmin && (
          <CardFooter className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-end">
            <Button 
              onClick={handleSaveOrg} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Members List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Team Members</h2>
          {isAdmin && (
            <Button 
              onClick={() => setInviteModalOpen(true)} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card 
              key={member.profiles.id} 
              className="border-none shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-all group"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                      {member.profiles.full_name?.[0]?.toUpperCase() || member.profiles.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                        {member.profiles.full_name || "Unnamed User"}
                      </h3>
                      <Badge variant="secondary" className="mt-1 text-[10px] uppercase tracking-wider">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && member.profiles.id !== user?.id && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteMember(member.profiles.id)} 
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 w-8"
                      disabled={deleting && deletingMemberId === member.profiles.id}
                    >
                      {deleting && deletingMemberId === member.profiles.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{member.profiles.email}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
              <CardDescription>Add a new member to your organization.</CardDescription>
            </CardHeader>
            <form onSubmit={handleInviteMember}>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="inviteName">Full Name</Label>
                  <Input
                    id="inviteName"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="Jane Smith"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="jane@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <Select 
                    value={inviteForm.role} 
                    onValueChange={(val) => setInviteForm({ ...inviteForm, role: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setInviteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={inviteLoading}
                >
                  {inviteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Invite
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrganizationSettings;