"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ListTodo } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";

const Dashboard = () => {
  const { user } = useAuth();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [summary, setSummary] = useState<any>(null);
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

  if (loading || tasksLoading) {
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{tasks.length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.completed_tasks || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.pending_tasks || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.overdue_tasks || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Task List Rendering */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-500" />
            Recent Tasks
          </h2>
          <div className="space-y-3 text-left">
            {tasks.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No tasks yet. Create one above!</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">{task.title}</p>
                    {task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      task.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;