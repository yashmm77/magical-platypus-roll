"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Calendar, User, RefreshCw } from "lucide-react";
import { TaskModal } from "@/components/TaskModal";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-slate-100" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-50" },
  { id: "completed", title: "Done", color: "bg-emerald-50" },
];

const Kanban = () => {
  const { data: users } = useUsers();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (assigneeFilter === "all") return true;
    if (assigneeFilter === "unassigned") return !task.assigned_to;
    return task.assigned_to === assigneeFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-rose-600 bg-rose-50 border-rose-100";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-100";
      case "low": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      default: return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  const getAssigneeName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const user = users?.find(u => u.id === userId);
    return user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || "Unknown";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Kanban Board</h1>
        <div className="flex items-center gap-3">
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchTasks} className="text-slate-500">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setSelectedTask(null); setModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col gap-4 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                {column.title}
                <Badge variant="secondary" className="bg-white text-slate-500 border-slate-200">
                  {filteredTasks.filter(t => t.status === column.id).length}
                </Badge>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {filteredTasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <Card 
                    key={task.id} 
                    className="border-none shadow-sm bg-white hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => { setSelectedTask(task); setModalOpen(true); }}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-slate-900 leading-tight">{task.title}</h3>
                        <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-1.5 py-0 ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <User className="w-3 h-3" />
                            {getAssigneeName(task.assigned_to)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={selectedTask} onSuccess={fetchTasks} />
    </div>
  );
};

export default Kanban;