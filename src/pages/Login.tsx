import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Loader2, Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const navigate = useNavigate();
  const { setActiveOrgId } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (authData.user) {
        const { data: orgData, error: orgError } = await supabase
          .from('org_members')
          .select('org_id, organizations(id, name)')
          .eq('user_id', authData.user.id);

        if (orgError) throw orgError;

        if (!orgData || orgData.length === 0) {
          toast.error("No organization found. Please register.");
          await supabase.auth.signOut();
          return;
        }

        if (orgData.length === 1) {
          setActiveOrgId(orgData[0].org_id);
          toast.success("Logged in successfully!");
          navigate("/");
        } else {
          setOrganizations(orgData);
          setShowOrgPicker(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const selectOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    toast.success("Organization selected!");
    navigate("/");
  };

  if (showOrgPicker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Select Workspace</CardTitle>
            <CardDescription>
              You belong to multiple organizations. Please choose one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {organizations.map((item) => (
              <Button
                key={item.org_id}
                variant="outline"
                className="w-full h-16 justify-between px-6 hover:border-indigo-600 hover:bg-indigo-50 group transition-all"
                onClick={() => selectOrg(item.org_id)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-slate-900">{item.organizations?.name}</span>
                  <span className="text-xs text-slate-500">Workspace ID: {item.org_id.substring(0, 8)}...</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </Button>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-slate-500" onClick={() => setShowOrgPicker(false)}>
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Sign In
            </Button>
            <p className="text-sm text-center text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;