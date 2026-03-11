"use client";

import { useEffect } from "react";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { initializeDatabase } from "@/database/initialize";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user } = useAuth();
  const { tasks, isLoading } = useTasks();
  const { data: users, isLoading: usersLoading } = useUsers();

  useEffect(() => {
    initializeDatabase();
  }, []);

  if (isLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">
          Dashboard
        </h1>
        <p className="text-slate-500">Welcome, {user?.email}</p>
        <div className="mt-6">
          <CreateTaskDialog />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{tasks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{users?.length || 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;