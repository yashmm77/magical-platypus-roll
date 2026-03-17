"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Calendar, 
  User, 
  Clock, 
  MessageSquare, 
  History, 
  ArrowLeft,
  Send,
  Pencil,
  AlertCircle,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Task, CommentWithProfile, ActivityLog } from "@/types";
import { TaskModal } from "@/components/TaskModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { logActivity } from "@/utils/activity";

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<(Task & { assigned_to_name?: string; created_by_name?: string }) | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (taskError) throw taskError;
      
      if (!taskData) {
        setError("Task not found");
        return;
      }

      const profileIds = [taskData.assigned_to, taskData.created_by].filter(Boolean);
      let profileMap: Record<string, string> = {};

      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds);
        
        profiles?.forEach(p => {
          profileMap[p.id] = p.full_name;
        });
      }

      setTask({
        ...taskData,
        assigned_to_name: profileMap[taskData.assigned_to] || "Unassigned",
        created_by_name: profileMap[taskData.created_by] || "Unknown"
      });
      setError(null);
    } catch (err: any) {
      console.error("Error fetching task:", err);
      setError(err.message || "Failed to load task");
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles(full_name)
        `)
        .eq("task_id", id)
        .order("created_at", { ascending: true });

      if (!error && data) setComments(data as any);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [id]);

  const fetchLogs = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("task_id", id)
        .order("created_at", { ascending: false });

      if (!error && data) setLogs(data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTask(), fetchComments(), fetchLogs()]);
      setLoading(false);
    };
    init();

    // Real-time subscriptions
    const commentsChannel = supabase
      .channel(`task-comments-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'comments',
        filter: `task_id=eq.${id}`
      }, fetchComments)
      .subscribe();

    const logsChannel = supabase
      .channel(`task-logs-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_logs',
        filter: `task_id=eq.${id}`
      }, fetchLogs)
      .subscribe();

    const taskChannel = supabase
      .channel(`task-updates-${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'tasks',
        filter: `id=eq.${id}`
      }, fetchTask)
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [id, fetchTask, fetchComments, fetchLogs]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          task_id: id,
          user_id: user.id,
          content: commentText.trim()
        });

      if (error) throw error;
      setCommentText("");
      toast.success("Comment added");
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!id || !task) return;
    setDeleting(true);
    try {
      await logActivity(id, `Deleted task: ${task.title}`);
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      toast.success("Task deleted successfully");
      navigate("/tasks");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Todo": return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
      case "In Progress": return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400";
      case "Done": return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400";
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{error || "Task not found"}</h2>
        <p className="text-slate-500 mb-8">The task you're looking for might have been deleted or you don't have permission to view it.</p>
        <Button 
          onClick={() => navigate("/tasks")} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Back to Task List
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="gap-2 text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button 
            onClick={() => setEditModalOpen(true)}
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {task.priority} Priority
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{task.title}</CardTitle>
              <CardDescription className="text-base mt-4 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {task.description || "No description provided."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Due Date</p>
                      <p className="text-slate-900 dark:text-slate-200">
                        {task.due_date ? format(new Date(task.due_date), "PPP") : "No due date"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Assigned To</p>
                      <p className="text-slate-900 dark:text-slate-200">{task.assigned_to_name}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Created At</p>
                      <p className="text-slate-900 dark:text-slate-200">{format(new Date(task.created_at), "PPP p")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Created By</p>
                      <p className="text-slate-900 dark:text-slate-200">{task.created_by_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Comments
            </h3>
            
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-slate-500 text-sm italic py-4">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-200 text-sm">
                        {comment.profiles?.full_name || "Unknown User"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(comment.created_at), "MMM d, p")}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="mt-6 space-y-3">
              <Textarea 
                placeholder="Write a comment..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[100px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={submittingComment || !commentText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post Comment
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Activity Log
          </h3>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="space-y-6">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No activity recorded.</p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={log.id} className="relative pl-6 pb-6 last:pb-0">
                      {idx !== logs.length - 1 && (
                        <div className="absolute left-[7px] top-[20px] bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800" />
                      )}
                      <div className="absolute left-0 top-[6px] w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{log.action}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen} 
        task={task} 
        onSuccess={fetchTask} 
      />

      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTask}
        loading={deleting}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default TaskDetail;