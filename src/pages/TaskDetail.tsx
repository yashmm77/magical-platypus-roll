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
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Task, CommentWithProfile, ActivityLog } from "@/types";
import { TaskModal } from "@/components/TaskModal";

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

  const fetchTask = useCallback(async () => {
    if (!id) return;
    
    try {
      // Fetch task first without complex joins to ensure it exists
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

      // Fetch profile names separately for better reliability
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

    const taskChannel = supabase
      .channel(`task-detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${id}` }, fetchTask)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `task_id=eq.${id}` }, fetchComments)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: `task_id=eq.${id}` }, fetchLogs)
      .subscribe();

    return () => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo": return "bg-slate-100 text-slate-700 border-slate-200";
      case "in_progress": return "bg-blue-50 text-blue-700 border-blue-100";
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-rose-50 text-rose-700 border-rose-100";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-100";
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-100";
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
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{error || "Task not found"}</h2>
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
        <Button 
          onClick={() => setEditModalOpen(true)}
          className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 gap-2"
        >
          <Pencil className="w-4 h-4" />
          Edit Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {task.priority} Priority
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">{task.title}</CardTitle>
              <CardDescription className="text-base mt-4 text-slate-600 whitespace-pre-wrap">
                {task.description || "No description provided."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Due Date</p>
                      <p className="text-slate-900">
                        {task.due_date ? format(new Date(task.due_date), "PPP") : "No due date"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Assigned To</p>
                      <p className="text-slate-900">{task.assigned_to_name}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Created At</p>
                      <p className="text-slate-900">{format(new Date(task.created_at), "PPP p")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Created By</p>
                      <p className="text-slate-900">{task.created_by_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Comments
            </h3>
            
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-slate-500 text-sm italic py-4">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {comment.profiles?.full_name || "Unknown User"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(comment.created_at), "MMM d, p")}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="mt-6 space-y-3">
              <Textarea 
                placeholder="Write a comment..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[100px] bg-white border-slate-200 focus:ring-indigo-500"
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
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Activity Log
          </h3>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="space-y-6">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No activity recorded.</p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={log.id} className="relative pl-6 pb-6 last:pb-0">
                      {idx !== logs.length - 1 && (
                        <div className="absolute left-[7px] top-[20px] bottom-0 w-[2px] bg-slate-100" />
                      )}
                      <div className="absolute left-0 top-[6px] w-4 h-4 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-800 font-medium">{log.action}</p>
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
    </div>
  );
};

export default TaskDetail;