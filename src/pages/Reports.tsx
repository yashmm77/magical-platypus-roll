"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3, TrendingUp, Users, CheckCircle2, Clock, AlertCircle, PieChart as PieChartIcon, RefreshCw } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = () => {
  const queryClient = useQueryClient();
  const { tasks, isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useUsers();

  const loading = tasksLoading || profilesLoading;
  const error = tasksError || profilesError;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const { stats, dailyData, workloadData, priorityData } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        stats: { total_tasks: 0, completed_tasks: 0, pending_tasks: 0, overdue_tasks: 0 },
        dailyData: [],
        workloadData: [],
        priorityData: []
      };
    }

    // 1. Summary Stats
    const total_tasks = tasks.length;
    const completed_tasks = tasks.filter(t => t.status === 'Done').length;
    const pending_tasks = tasks.filter(t => t.status !== 'Done').length;
    const overdue_tasks = tasks.filter(t => {
      if (t.status === 'Done' || !t.due_date) return false;
      return new Date(t.due_date) < new Date();
    }).length;

    const stats = { total_tasks, completed_tasks, pending_tasks, overdue_tasks };

    // 2. Daily trends (last 7 days)
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    const dailyData = last7Days.map(day => {
      const dayStr = format(day, "MMM d");
      const dayTasks = tasks.filter(t => isSameDay(parseISO(t.created_at), day));

      return {
        name: dayStr,
        created: dayTasks.length,
        completed: tasks.filter(t => t.status === 'Done' && t.updated_at && isSameDay(parseISO(t.updated_at), day)).length
      };
    });

    // 3. Workload by member
    const workloadData = profiles?.map(profile => {
      const userTasks = tasks.filter(t => t.assigned_to === profile.id);
      return {
        name: profile.full_name?.split(' ')[0] || "Unknown",
        tasks: userTasks.length,
        completed: userTasks.filter(t => t.status === 'Done').length,
        pending: userTasks.filter(t => t.status !== 'Done').length
      };
    }).filter(w => w.tasks > 0).sort((a, b) => b.tasks - a.tasks) || [];

    // 4. Priority breakdown
    const priorities = ['low', 'medium', 'high'];
    const priorityData = priorities.map(p => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      value: tasks.filter(t => t.priority === p).length
    })).filter(p => p.value > 0);

    return { stats, dailyData, workloadData, priorityData };
  }, [tasks, profiles]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Failed to load reports</h2>
        <p className="text-slate-500">{(error as Error).message || "An unexpected error occurred."}</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <BarChart3 className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No data available</h2>
        <p className="text-slate-500">Create some tasks to see analytics and reports.</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          Refresh Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Track your team's performance and task completion trends.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
              {stats.total_tasks ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{stats.completed_tasks} tasks finished</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardDescription>Active Workload</CardDescription>
            <CardTitle className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.pending_tasks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Tasks currently in progress</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardDescription>Overdue Ratio</CardDescription>
            <CardTitle className="text-3xl font-bold text-rose-600 dark:text-rose-500">
              {stats.total_tasks ? Math.round((stats.overdue_tasks / stats.total_tasks) * 100) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{stats.overdue_tasks} tasks past due</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Trend */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Weekly Activity Trend
            </CardTitle>
            <CardDescription>Comparison of created vs completed tasks.</CardDescription>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="created" stroke="#6366f1" fillOpacity={1} fill="url(#colorCreated)" strokeWidth={2} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Team Workload */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Team Workload
            </CardTitle>
            <CardDescription>Tasks assigned per team member.</CardDescription>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} width={80} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="pending" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={20} />
                <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priority Breakdown */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-500" />
              Priority Distribution
            </CardTitle>
            <CardDescription>Breakdown of tasks by priority level.</CardDescription>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Volume */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Daily Task Volume
            </CardTitle>
            <CardDescription>New tasks added per day.</CardDescription>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="created" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;