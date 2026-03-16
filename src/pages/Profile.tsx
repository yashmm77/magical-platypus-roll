"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Shield, Save } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile({
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          role: data.role || "Member",
        });
      } catch (error: any) {
        console.error("Error fetching profile:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
      
      <form onSubmit={handleUpdate}>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details and how others see you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{profile.full_name || "User"}</h3>
                <p className="text-sm text-slate-500">{profile.email}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="full_name" 
                    className="pl-10"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="email" 
                    className="pl-10 bg-slate-50"
                    value={profile.email}
                    disabled
                  />
                </div>
                <p className="text-xs text-slate-500">Email cannot be changed.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="role" 
                    className="pl-10 bg-slate-50"
                    value={profile.role}
                    disabled
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 border-t border-slate-100 px-6 py-4">
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 ml-auto"
              disabled={updating}
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default Profile;