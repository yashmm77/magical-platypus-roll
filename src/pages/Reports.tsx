"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, BarChart3, TrendingUp, Users, CheckCircle2, Clock, AlertCircle, PieChart as PieChartIcon } from "lucide-react";
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
import { format, subDays, eachDayOfInterval } from "date-fns";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [workloadData, setWorkloadData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch summary stats
      const { data: summary } = await supabase.from("task_summary").select("*").single();
      
      // Fetch all tasks for detailed analysis
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("created_at, status, priority, assigned_to");

      // Fetch profiles for workload mapping
      const { data: profiles } = await supabase.from("profiles").select("id, full_name");

      // 1. Process daily trends (last 7 days)
      const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
      });

      const trendData = last7Days.map(day => {
        const dayStr = format(day, "MMM d");
        const dayTasks = allTasks?.filter(t => 
          format(new Date(t.created_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
        ) || [];

        return {
          name: dayStr,
          created: dayTasks.length,
          completed: dayTasks.filter(t => t.status === 'done').length
        };
      });

      // 2. Process workload by member
      const workload = profiles?.map(profile => {
        const userTasks = allTasks?.filter(t => t.assigned_to === profile.id) || [];
        return {
          name: profile.full_name?.split(' ')[0] || "Unknown",
          tasks: userTasks.length,
          completed: userTasks.filter(t => t.status === 'done').length,
          pending: userTasks.filter(t => t.status !== 'done').length
        };
      }).filter(w => w.tasks > 0).sort((a, b) => b.tasks - a.tasks) || [];

      // 3. Process priority breakdown
      const priorities = ['low', 'medium', 'high'];
      const priorityBreakdown = priorities.map(p => ({
        name: p.charAt(0).toUpperCase() + p.slice(1),
        value: allTasks?.filter(t => t.priority === p).length || 0
      })).filter(p => p.value > 0);

      setStats(summary);
      setDailyData(trendData);
      setWorkloadData(workload);
      setPriorityData(priorityBreakdown);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
              {stats?.total_tasks ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{stats?.completed_tasks} tasks finished</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardDescription>Active Workload</CardDescription>
            <CardTitle className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats?.pending_tasks || 0}
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
              {stats?.total_tasks ? Math.round((stats.overdue_tasks / stats.total_tasks) * 100) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{stats?.overdue_tasks} tasks past due</span>
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