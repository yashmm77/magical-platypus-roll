"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useAuth } from "@/hooks/useAuth";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = () => {
  const { activeOrgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [workloadData, setWorkloadData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!activeOrgId) return;
    
    setLoading(true);
    try {
      const { data: summary } = await supabase.from("task_summary").select("*").eq("org_id", activeOrgId).maybeSingle();
      
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("created_at, status, priority, assigned_to")
        .eq("org_id", activeOrgId);

      const { data: members } = await supabase
        .from("org_members")
        .select("user_id, profiles(full_name)")
        .eq("org_id", activeOrgId);

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
          completed: dayTasks.filter(t => t.status === 'Done').length
        };
      });

      const workload = members?.map(member => {
        const userTasks = allTasks?.filter(t => t.assigned_to === member.user_id) || [];
        const profile: any = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
        return {
          name: profile?.full_name?.split(' ')[0] || "Unknown",
          tasks: userTasks.length,
          completed: userTasks.filter(t => t.status === 'Done').length,
          pending: userTasks.filter(t => t.status !== 'Done').length
        };
      }).filter(w => w.tasks > 0).sort((a, b) => b.tasks - a.tasks) || [];

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
  }, [activeOrgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!activeOrgId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

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
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Weekly Activity Trend
            </CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip />
                <Area type="monotone" dataKey="created" stroke="#6366f1" fillOpacity={0.1} fill="#6366f1" strokeWidth={2} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={0.1} fill="#10b981" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Team Workload
            </CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} width={80} />
                <Tooltip />
                <Bar dataKey="pending" stackId="a" fill="#6366f1" barSize={20} />
                <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;