"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Calendar, User, RefreshCw, Eye, MoreVertical } from "lucide-react";
import { TaskModal } from "@/components/TaskModal";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logActivity } from "@/utils/activity";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useAuth } from "@/hooks/useAuth";

const COLUMNS = [
  { id: "Todo", title: "To Do", color: "bg-slate-100" },
  { id: "In Progress", title: "In Progress", color: "bg-blue-50" },
  { id: "Done", title: "Done", color: "bg-emerald-50" },
];

const Kanban = () => {
  const navigate = useNavigate();
  const { activeOrgId } = useAuth();
  const { data: users } = useUsers();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const fetchTasks = useCallback(async () => {
    if (!activeOrgId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("org_id", activeOrgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchTasks();
    
    if (!activeOrgId) return;

    const channel = supabase
      .channel('kanban-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `org_id=eq.${activeOrgId}`
      }, fetchTasks)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrgId, fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string, taskTitle: string) => {
    setUpdatingTaskId(taskId);
    const originalTasks = [...tasks];
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;
      await logActivity(taskId, `Moved task "${taskTitle}" to ${newStatus}`);
      toast.success(`Task moved to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message);
      // Revert on error
      setTasks(originalTasks);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find(t => t.id === draggableId);
    if (task && destination.droppableId !== source.droppableId) {
      handleStatusChange(draggableId, destination.droppableId, task.title);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (assigneeFilter === "all") return true;
    if (assigneeFilter === "unassigned") return !task.assigned_to;
    return task.assigned_to === assigneeFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30";
      case "low": return "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30";
      default: return "text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  const getAssigneeName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const user = users?.find(u => u.id === userId);
    return user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || "Unknown";
  };

  if (!activeOrgId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Loading Workspace...</h2>
      </div>
    );
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kanban Board</h1>
        <div className="flex items-center gap-3">
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900">
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
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between px-2">
                <h2 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  {column.title}
                  <Badge variant="secondary" className="bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700">
                    {filteredTasks.filter(t => t.status === column.id).length}
                  </Badge>
                </h2>
              </div>

              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[100px]"
                  >
                    {filteredTasks
                      .filter((task) => task.status === column.id)
                      .map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                              }}
                            >
                              <Card 
                                className={`border-none shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-all group relative ${updatingTaskId === task.id ? 'opacity-60 pointer-events-none' : ''}`}
                              >
                                <CardContent className="p-4 space-y-3">
                                  {updatingTaskId === task.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10 rounded-xl">
                                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                                    </div>
                                  )}
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-medium text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                                      {task.title}
                                    </h3>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                                          <MoreVertical className="w-3.5 h-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => navigate(`/tasks/${task.id}`)}>
                                          <Eye className="w-4 h-4 mr-2" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setSelectedTask(task); setModalOpen(true); }}>
                                          <Plus className="w-4 h-4 mr-2 rotate-45" /> Edit Task
                                        </DropdownMenuItem>
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Move to:</div>
                                        {COLUMNS.filter(c => c.id !== task.status).map(c => (
                                          <DropdownMenuItem key={c.id} onClick={() => handleStatusChange(task.id, c.id, task.title)}>
                                            {c.title}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  
                                  {task.description && (
                                    <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                                  )}

                                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
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
                                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-1.5 py-0 ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={selectedTask} onSuccess={fetchTasks} />
    </div>
  );
};

export default Kanban;