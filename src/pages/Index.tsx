"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, Clock, AlertCircle, ListTodo, BarChart3, RefreshCw, User } from "lucide-react";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { data: users } = useUsers();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: summaryData } = await supabase.from("task_summary").select("*").single();
      if (summaryData) setSummary(summaryData);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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