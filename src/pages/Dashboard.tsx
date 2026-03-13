import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useFormatDate } from "@/hooks/useFormatDate";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user } = useAuth();

  // Summary cards data
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["taskSummary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_summary")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Recent tasks data
  const { data: recentTasksData, isLoading: isRecentLoading } = useQuery({
    queryKey: ["recentTasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Tasks due today data
  const { data: dueTodayData, isLoading: isDueTodayLoading } = useQuery({
    queryKey: ["tasksDueToday"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks_due_today")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Format date helper
  const formatDate = useFormatDate();

  // Status badge colors
  const statusColors: Record<string, string> = {
    todo: "bg-gray-200 text-gray-800",
    "in_progress": "bg-blue-200 text-blue-800",
    completed: "bg-green-200 text-green-800",
  };

  // Priority badge colors
  const priorityColors: Record<string, string> = {
    low: "bg-green-200 text-green-800",
    medium: "bg-yellow-200 text-yellow-800",
    high: "bg-red-200 text-red-800",
  };

  if (isSummaryLoading || isRecentLoading || isDueTodayLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryData && (
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-slate-900">Total Tasks</span>
                  <span className="text-2xl font-bold text-indigo-600">{summaryData.total_tasks}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {summaryData && (
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-slate-900">Completed Tasks</span>
                  <span className="text-2xl font-bold text-green-600">{summaryData.completed_tasks}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {summaryData && (
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-slate-900">Pending Tasks</span>
                  <span className="text-2xl font-bold text-yellow-600">{summaryData.pending_tasks}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {summaryData && (
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-slate-900">Overdue Tasks</span>
                  <span className="text-2xl font-bold text-red-600">{summaryData.overdue_tasks}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Recent Tasks</h2>
          <div className="space-y-4">
            {recentTasksData?.map((task) => (
              <Card key={task.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex-1 flex justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status]}`}>
                          {task.status}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 text-sm text-slate-500">
                      Assigned to: {task.assigned_user?.full_name || "Unassigned"}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-indigo-600">
                      {formatDate(new Date(task.due_date || task.created_at))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {recentTasksData?.length === 0 && (
              <div className="col-span-full text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
                <Loader2 className="w-8 h-8 text-slate-300" />
                <p className="text-slate-500 mt-2">No recent tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Due Today */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Tasks Due Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dueTodayData?.map((task) => (
              <Card key={task.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        Assigned to: {task.assigned_to_name || "Unassigned"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-indigo-600">
                      Due: {formatDate(new Date(task.due_date))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {dueTodayData?.length === 0 && (
              <div className="col-span-full text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
                <Loader2 className="w-8 h-8 text-slate-300" />
                <p className="text-slate-500 mt-2">No tasks due today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;