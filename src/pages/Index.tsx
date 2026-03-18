"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, Clock, AlertCircle, ListTodo, BarChart3, History, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from "date-fns";

const Index = () => {
  const { user, activeOrgId } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!activeOrgId) return;
    
    setLoading(true);
    try {
      const [summaryRes, recentRes, dueRes, activityRes] = await Promise.all([
        supabase.from("task_summary").select("*").eq("org_id", activeOrgId).maybeSingle(),
        supabase.from("tasks").select(`*, assigned_user:profiles!tasks_assigned_to_fkey(full_name, email)`).eq("org_id", activeOrgId).order("created_at", { ascending: false }).limit(5),
        supabase.from("tasks_due_today").select("*").eq("org_id", activeOrgId),
        supabase.from("activity_logs").select("*, profiles(full_name), tasks!inner(org_id)").eq("tasks.org_id", activeOrgId).order("created_at", { ascending: false }).limit(5)
      ]);
      
      if (summaryRes.data) setSummary(summaryRes.data);
      if (recentRes.data) setRecentTasks(recentRes.data);
      if (dueRes.data) setDueTasks(dueRes.data);
      if (activityRes.data) setActivities(activityRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchData();

    if (!activeOrgId) return;

    // Real-time subscription to refresh dashboard data
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `org_id=eq.${activeOrgId}`
      }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrgId, fetchData]);

  const chartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Completed', value: summary.completed_tasks, color: '#10b981' },
      { name: 'Pending', value: summary.pending_tasks, color: '#f59e0b' },
      { name: 'Overdue', value: summary.overdue_tasks, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [summary]);

  if (!activeOrgId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (loading && recentTasks.length === 0) {
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
          <p className="text-slate-500 mt-1">Welcome back, {user?.email?.split('@')[0]}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-500" />
                Recent Tasks
              </h2>
              <Badge variant="secondary" className="cursor-pointer hover:bg-slate-200" onClick={() => navigate('/tasks')}>View All</Badge>
            </div>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <div>
                    <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {task.assigned_user?.full_name || "Unassigned"} • Due {task.due_date ? format(new Date(task.due_date), "MMM d") : "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={task.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50'}>
                      {task.priority}
                    </Badge>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              Due Today
            </h2>
            <div className="space-y-3">
              {dueTasks.map((task) => (
                <Card key={task.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 text-sm">{task.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {task.priority}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {task.assigned_to_name || "Unassigned"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dueTasks.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">No tasks due today.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div key={activity.id} className="flex gap-3 relative">
                  {idx !== activities.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100" />
                  )}
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 leading-tight">
                      <span className="font-semibold">{activity.profiles?.full_name || "System"}</span> {activity.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {format(new Date(activity.created_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;