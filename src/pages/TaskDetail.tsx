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
import { TaskModal } from "@/components/TaskModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { logActivity } from "@/utils/activity";
import { SubtaskList } from "@/components/SubtaskList";

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTaskData = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name, email),
          creator:profiles!tasks_created_by_fkey(full_name, email)
        `)
        .eq("id", id)
        .maybeSingle();

      if (taskError) throw taskError;
      if (!taskData) {
        setError("Task not found");
        return;
      }

      setTask(taskData);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching task:", err);
      setError(err.message || "Failed to load task");
    }
  }, [id]);

  const fetchRelatedData = useCallback(async () => {
    if (!id) return;
    try {
      const [commentsRes, logsRes] = await Promise.all([
        supabase
          .from("comments")
          .select("*, profiles(full_name)")
          .eq("task_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("activity_logs")
          .select("*")
          .eq("task_id", id)
          .order("created_at", { ascending: false })
      ]);

      if (commentsRes.data) setComments(commentsRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (err) {
      console.error("Error fetching related data:", err);
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTaskData(), fetchRelatedData()]);
      setLoading(false);
    };
    init();

    const channel = supabase
      .channel(`task-detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `task_id=eq.${id}` }, fetchRelatedData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs', filter: `task_id=eq.${id}` }, fetchRelatedData)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `id=eq.${id}` }, fetchTaskData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchTaskData, fetchRelatedData]);

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
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{error || "Task not found"}</h2>
        <Button onClick={() => navigate("/tasks")} className="mt-4">Back to Tasks</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setDeleteDialogOpen(true)} className="text-rose-600 hover:bg-rose-50 gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
          <Button onClick={() => setEditModalOpen(true)} variant="outline" className="gap-2">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary">{task.status}</Badge>
                <Badge variant="outline" className="capitalize">{task.priority} Priority</Badge>
              </div>
              <CardTitle className="text-3xl font-bold">{task.title}</CardTitle>
              <CardDescription className="text-base mt-4 whitespace-pre-wrap">
                {task.description || "No description provided."}
              </CardDescription>
            </CardHeader>
            <CardContent className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Due Date</p>
                      <p>{task.due_date ? format(new Date(task.due_date), "PPP") : "No due date"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Assigned To</p>
                      <p>{task.assigned_user?.full_name || "Unassigned"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Created At</p>
                      <p>{format(new Date(task.created_at), "PPP p")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 font-medium">Created By</p>
                      <p>{task.creator?.full_name || "Unknown"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <SubtaskList taskId={id!} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" /> Comments
            </h3>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{comment.profiles?.full_name || "User"}</span>
                    <span className="text-xs text-slate-400">{format(new Date(comment.created_at), "MMM d, p")}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
              <form onSubmit={handleAddComment} className="space-y-3">
                <Textarea 
                  placeholder="Write a comment..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={submittingComment || !commentText.trim()} className="gap-2">
                    {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Post Comment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" /> Activity Log
          </h3>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="space-y-6">
                {logs.map((log, idx) => (
                  <div key={log.id} className="relative pl-6 pb-6 last:pb-0">
                    {idx !== logs.length - 1 && <div className="absolute left-[7px] top-[20px] bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800" />}
                    <div className="absolute left-0 top-[6px] w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(log.created_at), "MMM d, HH:mm")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskModal open={editModalOpen} onOpenChange={setEditModalOpen} task={task} onSuccess={fetchTaskData} />
      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        onConfirm={handleDeleteTask} 
        loading={deleting}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"?`}
      />
    </div>
  );
};

export default TaskDetail;