"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Loader2, ListChecks } from "lucide-react";
import { Subtask } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubtaskListProps {
  taskId: string;
  onProgressChange?: (progress: number) => void;
}

export const SubtaskList = ({ taskId, onProgressChange }: SubtaskListProps) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchSubtasks = async () => {
    try {
      const { data, error } = await supabase
        .from("subtasks")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setSubtasks(data || []);
      
      if (onProgressChange) {
        const completed = data?.filter(s => s.is_completed).length || 0;
        const total = data?.length || 0;
        onProgressChange(total > 0 ? (completed / total) * 100 : 0);
      }
    } catch (err) {
      console.error("Error fetching subtasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtasks();

    const channel = supabase
      .channel(`subtasks-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks', filter: `task_id=eq.${taskId}` }, fetchSubtasks)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from("subtasks")
        .insert({
          task_id: taskId,
          title: newSubtaskTitle.trim(),
          is_completed: false
        });

      if (error) throw error;
      setNewSubtaskTitle("");
      toast.success("Subtask added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add subtask");
    } finally {
      setIsAdding(false);
    }
  };

  const toggleSubtask = async (subtask: Subtask) => {
    try {
      const { error } = await supabase
        .from("subtasks")
        .update({ is_completed: !subtask.is_completed })
        .eq("id", subtask.id);

      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to update subtask");
    }
  };

  const deleteSubtask = async (id: string) => {
    try {
      const { error } = await supabase
        .from("subtasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Subtask removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subtask");
    }
  };

  const completedCount = subtasks.filter(s => s.is_completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-indigo-500" />
          Subtasks
        </h3>
        <span className="text-xs font-medium text-slate-500">
          {completedCount} of {subtasks.length} completed
        </span>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2 bg-slate-100 dark:bg-slate-800" />
      </div>

      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div 
            key={subtask.id} 
            className="flex items-center justify-between group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <Checkbox 
                id={subtask.id} 
                checked={subtask.is_completed} 
                onCheckedChange={() => toggleSubtask(subtask)}
              />
              <label 
                htmlFor={subtask.id}
                className={cn(
                  "text-sm font-medium cursor-pointer transition-all",
                  subtask.is_completed ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"
                )}
              >
                {subtask.title}
              </label>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => deleteSubtask(subtask.id)}
              className="h-8 w-8 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {subtasks.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
            <p className="text-sm text-slate-400">No subtasks yet. Break it down!</p>
          </div>
        )}
      </div>

      <form onSubmit={handleAddSubtask} className="flex gap-2">
        <Input 
          placeholder="Add a subtask..." 
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          className="h-9 text-sm"
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={isAdding || !newSubtaskTitle.trim()}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
};