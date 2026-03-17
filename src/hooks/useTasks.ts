"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types";
import { toast } from "sonner";
import { logActivity } from "@/utils/activity";

export const useTasks = () => {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ ...newTask, created_by: user?.id }])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Failed to create task");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      logActivity(data.id, `Created task: ${data.title}`);
      toast.success("Task created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create task");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      // We use select() without single() to avoid the coercion error if 0 rows are returned
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      
      // If no rows were updated, it's usually an RLS permission issue
      if (!data || data.length === 0) {
        throw new Error("Update failed: You may not have permission to modify this task.");
      }
      
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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