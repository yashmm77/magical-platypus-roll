"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch summary data
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data, error } = await supabase.from("task_summary").select("*").single();
        if (error) throw error;
        setSummary(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Fetch recent tasks
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const { data, error } = await supabase.rpc("exec", {
          sql: `SELECT tasks.*, profiles.full_name as assigned_to_name 
                FROM tasks 
                LEFT JOIN profiles ON tasks.assigned_to = profiles.id 
                ORDER BY tasks.created_at DESC 
                LIMIT 5`,
        });
        if (error) throw error;
        setRecentTasks(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchRecent();
  }, []);

  // Fetch tasks due today
  useEffect(() => {
    const fetchDue = async () => {
      try {
        const { data, error } = await supabase.from("tasks_due_today").select("*");
        if (error) throw error;
        setDueTasks(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchDue();
  }, []);

  // Helper to get status badge background
  const getStatusBg = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-200 text-gray-800";
      case "in_progress":
        return "bg-blue-200 text-blue-800";
      case "completed":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // Helper to get priority badge background
  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-200 text-green-800";
      case "medium":
        return "bg-yellow-200 text-yellow-800";
      case "high":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {summary && (
            <>
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Total Tasks</CardTitle>
                </CardHeader>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold">{summary.total_tasks || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Completed Tasks</CardTitle>
                </CardHeader>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold">{summary.completed_tasks || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Pending Tasks</CardTitle>
                </CardHeader>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold">{summary.pending_tasks || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Overdue Tasks</CardTitle>
                </CardHeader>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold">{summary.overdue_tasks || 0}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Recent Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <Card key={task.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 flex flex-col h-full">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 flex-1 min-w-0 truncate">
                        {task.title || "No title"}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 flex-1 min-w-0">
                        <span className={`${getStatusBg(task.status || "todo")} px-2 py-1 rounded text-xs`}>
                          {task.status || "Todo"}
                        </span>
                        <span className={`${getPriorityBg(task.priority || "medium")} px-2 py-1 rounded text-xs`}>
                          {task.priority || "Medium"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <span className="truncate">{task.assigned_to_name || "Unassigned"}</span>
                      </div>
                      <div className="mt-3 text-sm text-slate-500">
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
                <Loader2 className="w-8 h-8 text-slate-300" />
                <p className="text-slate-500 mt-2">No recent tasks.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Due Today */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Tasks Due Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dueTasks.length > 0 ? (
              dueTasks.map((task) => (
                <Card key={task.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 flex flex-col h-full">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {task.title || "No title"}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge className={getPriorityBg(task.priority || "medium")} variant="default">
                          {task.priority || "Medium"}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {task.assigned_to_name || "Unassigned"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
                <Loader2 className="w-8 h-8 text-slate-300" />
                <p className="text-slate-500 mt-2">No tasks due today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;