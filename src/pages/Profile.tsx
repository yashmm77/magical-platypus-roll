"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Shield, Save, Lock, KeyRound } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Profile Info State
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    role: "",
  });

  // Password State
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;
      
      toast.success("Password updated successfully!");
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile information and security.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Info Section */}
        <form onSubmit={handleUpdateProfile}>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold">
                  {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{profile.full_name || "User"}</h3>
                  <Badge variant="secondary" className="mt-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-none">
                    {profile.role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="full_name" 
                      className="pl-10 bg-white dark:bg-slate-950"
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
                      className="pl-10 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed"
                      value={profile.email}
                      disabled
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Email is managed by your account provider.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Account Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="role" 
                      className="pl-10 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed"
                      value={profile.role}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 ml-auto"
                disabled={updating}
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Change Password Section */}
        <form onSubmit={handleUpdatePassword}>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                Security
              </CardTitle>
              <CardDescription>Change your account password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl mb-4">
                <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                  Ensure your new password is at least 6 characters long and includes a mix of letters and numbers for better security.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="newPassword" 
                      type="password"
                      className="pl-10 bg-white dark:bg-slate-950"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      className="pl-10 bg-white dark:bg-slate-950"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 ml-auto"
                disabled={changingPassword || !passwords.newPassword}
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default Profile;