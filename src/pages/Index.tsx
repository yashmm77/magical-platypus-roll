"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, Clock, AlertCircle, ListTodo, Calendar, BarChart3, RefreshCw, Users } from "lucide-react";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [assigneeData, setAssigneeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch summary
      const { data: summaryData } = await supabase.from("task_summary").select("*").single();
      if (summaryData) setSummary(summaryData);

      // Fetch recent tasks with explicit join
      const { data: recentData } = await supabase
        .from("tasks")
        .select(`*, profiles:assigned_to(full_name, email)`)
        .order("created_at", { ascending: false })
        .limit(5);
      if (recentData) setRecentTasks(recentData);

      // Fetch tasks due today directly from table for better reliability
      const today = new Date().toISOString().split('T')[0];
      const { data: dueData } = await supabase
        .from("tasks")
        .select(`*, profiles:assigned_to(full_name, email)`)
        .eq('due_date', today)
        .neq('status', 'completed');
      if (dueData) setDueTasks(dueData);

      // Calculate assignee distribution
      const { data: allTasks } = await supabase
        .from("tasks")
        .select(`assigned_to, profiles:assigned_to(full_name, email)`);
      
      if (allTasks) {
        const counts: Record<string, { name: string, count: number }> = {};
        allTasks.forEach((task: any) => {
          // Handle profiles as either an object or an array (Supabase join behavior)
          const profile = Array.isArray(task.profiles) ? task.profiles[0] : task.profiles;
          const name = profile?.full_name || profile?.email || "Unassigned";
          if (!counts[name]) counts[name] = { name, count: 0 };
          counts[name].count += 1;
        });
        setAssigneeData(Object.values(counts));
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusChartData = summary ? [
    { name: 'Completed', value: summary.completed_tasks, color: '#10b981' },
    { name: 'Pending', value: summary.pending_tasks, color: '#f59e0b' },
    { name: 'Overdue', value: summary.overdue_tasks, color: '#ef4444' },
  ] : [];

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "high": return "bg-rose-50 text-rose-700 border-rose-100";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-100";
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-100";
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} className="text-slate-500">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <CreateTaskDialog onTaskCreated={fetchData} />
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-white p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-white p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Tasks by Assignee
            </CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assigneeData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Recent Activity
          </h2>
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Title</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Assigned To</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{task.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {task.profiles?.full_name || task.profiles?.email || "Unassigned"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-slate-100 text-slate-700">
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {recentTasks.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No recent tasks.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

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
                        {task.profiles?.full_name || "Unassigned"}
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