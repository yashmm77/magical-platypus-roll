"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Register = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setActiveOrgId } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    orgName: ""
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orgName) {
      toast.error("Please enter an organization name");
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      // 2. Create the organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: formData.orgName })
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Create the org member record (admin)
      const { error: memberError } = await supabase
        .from("org_members")
        .insert({
          org_id: orgData.id,
          user_id: authData.user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      // 4. Update context and navigate
      setActiveOrgId(orgData.id);
      toast.success("Account and organization created successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 1 ? "Create your account" : "Tell us about your team"}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? "Step 1: Personal details" 
              : "Step 2: Organization details"}
          </CardDescription>
        </CardHeader>

        {step === 1 ? (
          <form onSubmit={handleNext}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="bg-slate-50 border-slate-200 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-slate-50 border-slate-200 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-slate-50 border-slate-200 focus:ring-indigo-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-sm text-center text-slate-600">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corp"
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                  required
                  className="bg-slate-50 border-slate-200 focus:ring-indigo-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-slate-600 flex items-center justify-center hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to personal details
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Register;