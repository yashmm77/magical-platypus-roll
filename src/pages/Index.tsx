"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, Clock, AlertCircle, ListTodo, BarChart3, RefreshCw, User, History } from "lucide-react";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { data: users } = useUsers();
  const [summary, setSummary] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, activityRes] = await Promise.all([
        supabase.from("task_summary").select("*").single(),
        supabase.from("activity_logs").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(5)
      ]);
      
      if (summaryRes.data) setSummary(summaryRes.data);
      if (activityRes.data) setActivities(activityRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tasks]);

  const myTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(t => t.assigned_to === user.id);
  }, [tasks, user]);

  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
      if (t.priority in counts) counts[t.priority as keyof typeof counts]++;
    });
    return [
      { name: 'High', value: counts.high, color: '#ef4444' },
      { name: 'Medium', value: counts.medium, color: '#f59e0b' },
      { name: 'Low', value: counts.low, color: '#10b981' },
    ];
  }, [tasks]);

  const statusChartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Completed', value: summary.completed_tasks, color: '#10b981' },
      { name: 'Pending', value: summary.pending_tasks, color: '#f59e0b' },
      { name: 'Overdue', value: summary.overdue_tasks, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [summary]);

  if (loading || tasksLoading) {
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
            <div className="text-2xl font-bold text-slate-900">{tasks.length}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <div className="h-[250px] w-full">
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
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Priority Breakdown
                </CardTitle>
              </CardHeader>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Tabs defaultValue="recent" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-indigo-500" />
                  Tasks
                </h2>
                <TabsList className="bg-slate-100">
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="mine">My Tasks</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="recent" className="mt-0">
                <div className="space-y-3 text-left max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {tasks.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">No tasks yet. Create one above!</p>
                  ) : (
                    tasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="mine" className="mt-0">
                <div className="space-y-3 text-left max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {myTasks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                      <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No tasks assigned to you yet.</p>
                    </div>
                  ) : (
                    myTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Recent Activity
          </h2>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="space-y-6">
                {activities.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No recent activity.</p>
                ) : (
                  activities.map((activity, idx) => (
                    <div key={activity.id} className="relative pl-6 pb-6 last:pb-0">
                      {idx !== activities.length - 1 && (
                        <div className="absolute left-[7px] top-[20px] bottom-0 w-[2px] bg-slate-100" />
                      )}
                      <div className="absolute left-0 top-[6px] w-4 h-4 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-800 font-medium leading-tight">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium uppercase">
                            {activity.profiles?.full_name || "System"}
                          </span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400">
                            {format(new Date(activity.created_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs"
                onClick={() => navigate("/tasks")}
              >
                View All Tasks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onClick }: { task: any, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
  >
    <div>
      <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{task.title}</p>
      {task.description && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description}</p>}
    </div>
    <div className="flex gap-2">
      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${
        task.priority === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' :
        task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
        'bg-emerald-50 text-emerald-700 border-emerald-100'
      }`}>
        {task.priority}
      </Badge>
      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-600 border-none">
        {task.status.replace('_', ' ')}
      </Badge>
    </div>
  </div>
);

export default Index;