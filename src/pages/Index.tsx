"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  ListTodo, 
  BarChart3, 
  History, 
  Calendar as CalendarIcon,
  UserCheck,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from "date-fns";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [summaryRes, recentRes, myRes, dueRes, activityRes] = await Promise.all([
        supabase.from("task_summary").select("*").single(),
        supabase.from("tasks").select(`*, assigned_user:profiles!tasks_assigned_to_fkey(full_name, email)`).order("created_at", { ascending: false }).limit(5),
        supabase.from("tasks").select("*").eq("assigned_to", user.id).neq("status", "done").order("due_date", { ascending: true }).limit(5),
        supabase.from("tasks_due_today").select("*"),
        supabase.from("activity_logs").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(8)
      ]);
      
      if (summaryRes.data) setSummary(summaryRes.data);
      if (recentRes.data) setRecentTasks(recentRes.data);
      if (myRes.data) setMyTasks(myRes.data);
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
  }, [user]);

  const chartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Completed', value: summary.completed_tasks, color: '#10b981' },
      { name: 'Pending', value: summary.pending_tasks, color: '#6366f1' },
      { name: 'Overdue', value: summary.overdue_tasks, color: '#ef4444' },
    ].filter(item => item.value > 0);
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
          <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <CalendarIcon className="w-4 h-4 text-indigo-500" />
          {format(new Date(), "EEEE, MMMM do")}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Tasks", value: summary?.total_tasks || 0, icon: ListTodo, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { title: "Completed", value: summary?.completed_tasks || 0, icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { title: "Pending", value: summary?.pending_tasks || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { title: "Overdue", value: summary?.overdue_tasks || 0, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="my-tasks" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
                <TabsTrigger value="my-tasks" className="gap-2">
                  <UserCheck className="w-4 h-4" /> My Tasks
                </TabsTrigger>
                <TabsTrigger value="team-tasks" className="gap-2">
                  <ListTodo className="w-4 h-4" /> Team Overview
                </TabsTrigger>
              </TabsList>
              <Badge variant="outline" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate('/tasks')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Badge>
            </div>

            <TabsContent value="my-tasks" className="space-y-4 mt-0">
              {myTasks.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">You have no active tasks assigned.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {myTasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${
                          task.priority === 'high' ? 'bg-rose-500' : 
                          task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Due {task.due_date ? format(new Date(task.due_date), "MMM d") : "No date"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="team-tasks" className="space-y-4 mt-0">
              <div className="grid gap-3">
                {recentTasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {task.assigned_user?.full_name || "Unassigned"} • Created {format(new Date(task.created_at), "MMM d")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              Due Today
            </h2>
            <div className="space-y-3">
              {dueTasks.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500">No tasks due today. Great job!</p>
                </div>
              ) : (
                dueTasks.map((task) => (
                  <Card key={task.id} className="border-none shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">{task.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-900/30">
                          {task.priority}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {task.assigned_to_name || "Unassigned"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Recent Activity
            </h2>
            <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-800 dark:text-slate-300 leading-tight">
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