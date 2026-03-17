"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Loader2, AlertCircle, Building2, User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Sign up the user
      // We pass the role as 'admin' in metadata so the profile trigger picks it up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'admin'
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // If we have a session (auto-login enabled), we can create the org immediately
        if (authData.session) {
          const { error: orgError } = await supabase
            .from("organizations")
            .insert({ name: orgName });

          if (orgError) throw orgError;
          
          toast.success("Account and Organization created successfully!");
          navigate("/");
        } else {
          // If email confirmation is required, we can't create the org yet because we aren't "authenticated"
          // The user will need to confirm email first. 
          // In a real app, you might store the org name in metadata or a temporary table.
          toast.success("Registration successful! Please check your email to verify your account.");
          navigate("/login");
        }
      }
    } catch (error: any) {
      const message = error.message || "Failed to sign up";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white dark:bg-slate-900">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create your Workspace</CardTitle>
          <CardDescription>
            Start managing your team with TaskTracker
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="orgName"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pl-10 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Your Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pl-10 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pl-10 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pl-10 focus:ring-indigo-500"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl transition-all shadow-md hover:shadow-lg" 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Create Organization
            </Button>
            <p className="text-sm text-center text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;