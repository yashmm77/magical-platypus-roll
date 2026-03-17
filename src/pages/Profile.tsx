"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Shield, Save } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile(user?.id);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ full_name: fullName });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
      
      <form onSubmit={handleUpdate}>
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details and how others see you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold">
                {fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{fullName || "User"}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
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
                    className="pl-10 bg-slate-50 dark:bg-slate-800/50"
                    value={user?.email || ""}
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
                    className="pl-10 bg-slate-50 dark:bg-slate-800/50"
                    value={profile?.role || "Member"}
                    disabled
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 ml-auto"
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default Profile;