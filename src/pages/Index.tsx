"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, Clock, AlertCircle, ListTodo, Calendar } from "lucide-react";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { initializeDatabase } from "@/database/initialize";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      fetchData();
    };
    init();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch summary
      const { data: summaryData, error: summaryError } = await supabase
        .from("task_summary")
        .select("*")
        .single();
      
      if (!summaryError) setSummary(summaryData);

      // Fetch recent tasks
      const { data: recentData, error: recentError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (!recentError) setRecentTasks(recentData);

      // Fetch tasks due today
      const { data: dueData, error: dueError } = await supabase
        .from("tasks_due_today")
        .select("*");
      
      if (!dueError) setDueTasks(dueData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "todo": return "bg-slate-100 text-slate-700 border-slate-200";
      case "in_progress": return "bg-blue-50 text-blue-700 border-blue-100";
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-100";
      case "high": return "bg-rose-50 text-rose-700 border-rose-100";
      default: return "bg-slate-100 text-slate-700";
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.email}</p>
        </div>
        <CreateTaskDialog />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Tasks</CardTitle>
            <ListTodo className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary?.total_tasks || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary?.completed_tasks || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary?.pending_tasks || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Overdue</CardTitle>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary?.overdue_tasks || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Recent Tasks
          </h2>
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Title</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Assigned To</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Priority</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{task.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {task.assigned_user?.full_name || task.assigned_user?.email || "Unassigned"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={getStatusBg(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={getPriorityBg(task.priority)}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
                      </td>
                    </tr>
                  ))}
                  {recentTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No tasks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Tasks Due Today */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Due Today
          </h2>
          <div className="space-y-3">
            {dueTasks.map((task) => (
              <Card key={task.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-slate-900">{task.title}</h3>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={getPriorityBg(task.priority)}>
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {task.assigned_to_name || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {dueTasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No tasks due today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;