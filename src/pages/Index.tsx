"use client";

import { useEffect } from "react";
import { initializeDatabase } from "@/database/initialize";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user } = useAuth();

  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">
          Welcome to TaskTracker
        </h1>
        <p className="text-slate-500 mb-8">
          The ultimate task management solution for teams.
        </p>
        {user ? (
          <div className="space-y-4">
            <Button asChild className="w-full justify-center">
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
            <p className="text-slate-500">
              You're logged in as {user.email}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Button asChild className="w-full justify-center">
              <a href="/login">Login</a>
            </Button>
            <Button asChild className="w-full justify-center" variant="outline">
              <a href="/signup">Sign Up</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;