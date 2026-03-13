"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";

const Dashboard = () => {
  const { user } = useAuth();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { data: users, isLoading: usersLoading } = useUsers();

  const [taskSummary, setTaskSummary] = useState<any[]>([]);
  const [tasksDueToday, setTasksDueToday] = useState<any[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch task summary
        const { data: summaryData, error: summaryError } = await supabase.rpc('fetch_task_summary');
        if (summaryError) {
          console.warn('Task summary view not available:', summaryError.message);
          setTaskSummary([]);
        } else {
          setTaskSummary(summaryData || []);
        }

        // Fetch tasks due today
        const { data: dueTodayData, error: dueTodayError } = await supabase.rpc('fetch_tasks_due_today');
        if (dueTodayError) {
          console.warn('Tasks due today view not available:', dueTodayError.message);
          setTasksDueToday([]);
        } else {
          setTasksDueToday(dueTodayData || []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setFetchError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setFetchLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (tasksLoading || usersLoading || fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-indigo-600">Error loading dashboard</h2>
          <p className="text-slate-500">Please try refreshing the page.</p>
        </div>
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

export default Dashboard;