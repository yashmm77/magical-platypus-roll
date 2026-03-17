"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, Clock, AlertCircle, ListTodo, BarChart3, History, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from "date-fns";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [summaryRes, recentRes, dueRes, activityRes] = await Promise.all([
        supabase.from("task_summary").select("*").maybeSingle(),
        supabase.from("tasks").select(`*, assigned_user:profiles!tasks_assigned_to_fkey(full_name, email)`).order("created_at", { ascending: false }).limit(5),
        supabase.from("tasks_due_today").select("*"),
        supabase.from("activity_logs").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(5)
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
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const chartData = useMemo(() => {
    if (!summary) return [];
    const data = [
      { name: 'Completed', value: summary.completed_tasks || 0, color: '#10b981' },
      { name: 'Pending', value: summary.pending_tasks || 0, color: '#f59e0b' },
      { name: 'Overdue', value: summary.overdue_tasks || 0, color: '#ef4444' },
    ].filter(item => item.value > 0);
    return data;
  }, [summary]);

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Tasks</CardTitle>
            <ListTodo className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary?.total_tasks || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary?.completed_tasks || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary?.pending_tasks || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Overdue</CardTitle>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary?.overdue_tasks || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <div className="h-[300px] w-full flex items-center justify-center">
              {chartData.length > 0 ? (
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
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">No task data available yet.</p>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-500" />
                Recent Tasks
              </h2>
              <Badge variant="secondary" className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => navigate('/tasks')}>View All</Badge>
            </div>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all cursor-pointer group"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {task.assigned_user?.full_name || "Unassigned"} • Due {task.due_date ? format(new Date(task.due_date), "MMM d") : "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={task.priority === 'high' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-slate-50 dark:bg-slate-800'}>
                      {task.priority}
                    </Badge>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-500">No tasks created yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              Due Today
            </h2>
            <div className="space-y-3">
              {dueTasks.map((task) => (
                <Card key={task.id} className="border-none shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{task.title}</h3>
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
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500">No tasks due today.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div key={activity.id} className="flex gap-3 relative">
                  {idx !== activities.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800" />
                  )}
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-tight">
                      <span className="font-semibold">{activity.profiles?.full_name || "System"}</span> {activity.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {format(new Date(activity.created_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;