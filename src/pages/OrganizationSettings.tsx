"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Eye, Trash2, MoreVertical, UserPlus, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { useQueryClient } from "@tanstack/react-query";

const OrganizationSettings = () => {
  const { user, activeOrgId } = useAuth();
  const { orgId } = useParams();
  const orgIdFromRoute = orgId || activeOrgId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState({ name: "", description: "" });
  const [members, setMembers] = useState([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "member" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState(null);

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

        if (!membersError) setMembers(membersData);
      } catch (error: any) {
        toast.error(error.message || "Failed to load organization");
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [orgIdFromRoute]);

  // Save organization changes  const handleSaveOrg = async () => {
    if (!orgIdFromRoute) return;
    
    setLoading(true);
    try {
      const { error } = await supabase        .from("organizations")
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
          password: "temp_password_123", // Will be changed by user later
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
      // Delete from organization
      const { error } = await supabase
        .from("org_members")
        .delete()
        .eq("org_id", orgIdFromRoute)
        .eq("user_id", memberId);

      if (error) throw error;
      
      toast.success("Member removed from organization");
      queryClient.invalidateQueries({ queryKey: ["users", orgIdFromRoute] });
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    } finally {
      setDeleting(false);
      setDeletingMemberId(null);
    }
  };

  if (loading) {
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
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
          {orgIdFromRoute ? "Admin" : "Not Set"}
        </Badge>
      </div>

      {/* Organization Details */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            Organization Details
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Update your organization's name and description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="grid gap-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="orgName"
                  className="pl-10 bg-white dark:bg-slate-950"
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  placeholder="Enter organization name"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="orgDescription">Description</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="orgDescription"
                  className="pl-10 bg-white dark:bg-slate-950"
                  value={org.description}
                  onChange={(e) => setOrg({ ...org, description: e.target.value })}
                  placeholder="Brief description of your organization"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button 
            type="button" 
            onClick={handleSaveOrg} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* Members List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Team Members</h2>
          {user && (
            <Button 
              variant="ghost" 
              onClick={() => setInviteModalOpen(true)} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
          )}
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <User className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500">No members found. Invite people to join your organization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <Card 
                key={member.id} 
                className="border-none shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-all group"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                        {member.full_name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                          {member.full_name || "Unnamed User"}
                        </h3>
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700">
                            {member.role || "Member"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {user && member.id !== user?.id && (
                      <div className="flex gap-2 ml-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteMember(member.id)} 
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(`/organization/${member.id}/details`)} 
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
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

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Delete Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-700 dark:text-slate-300">
                  Are you sure you want to remove this member from your organization?
                  This action cannot be undone.
                </p>
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => setDeleteModalOpen(false)} 
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      handleDeleteMember(deletingMemberId || "");
                      setDeleteModalOpen(false);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Delete Member"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        {inviteModalOpen && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                Invite New Member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleInviteMember}>
                <div className="grid gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="inviteName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="inviteName"
                        placeholder="Jane Smith"
                        className="pl-10 bg-white dark:bg-slate-950"
                        value={inviteForm.name}
                        onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="inviteEmail"
                        type="email"
                        placeholder="jane@example.com"
                        className="pl-10 bg-white dark:bg-slate-950"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inviteRole">Role</Label>
                    <Select 
                      value={inviteForm.role} 
                      onValueChange={(val) => setInviteForm({ ...inviteForm, role: val })}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-slate-950">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {inviteLoading && (
                    <div className="text-center py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    </div>
                  )}
                </div>
                
                <CardFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={inviteLoading}                     className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  >
                    {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Invite Member"}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationSettings;