"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types";
import { toast } from "sonner";
import { logActivity } from "@/utils/activity";
import { useAuth } from "./useAuth";

export const useTasks = () => {
  const queryClient = useQueryClient();
  const { activeOrgId } = useAuth();

  const tasksQuery = useQuery({
    queryKey: ["tasks", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("org_id", activeOrgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!activeOrgId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!activeOrgId) throw new Error("No active organization selected");
      
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ 
          ...newTask, 
          created_by: user?.id,
          org_id: activeOrgId 
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Failed to create task");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeOrgId] });
      logActivity(data.id, `Created task: ${data.title}`);
      toast.success("Task created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create task");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Update failed: You may not have permission to modify this task.");
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeOrgId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await logActivity(id, `Deleted task: ${title}`);
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeOrgId] });
      toast.success("Task deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete task");
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    refetchTasks: tasksQuery.refetch,
    createTask: createTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    updateTask: updateTaskMutation.mutateAsync,
    isUpdating: updateTaskMutation.isPending,
    deleteTask: deleteTaskMutation.mutate,
    isDeleting: deleteTaskMutation.isPending,
  };
};