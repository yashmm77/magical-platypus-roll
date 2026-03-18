"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";
import { Task } from "@/types";
import { logActivity } from "@/utils/activity";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultStatus?: "Todo" | "In Progress" | "Done";
  onSuccess?: () => void;
}

export const TaskModal = ({ open, onOpenChange, task, defaultStatus, onSuccess }: TaskModalProps) => {
  const { data: users } = useUsers();
  const { activeOrgId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Todo" as "Todo" | "In Progress" | "Done",
    priority: "medium" as "low" | "medium" | "high",
    assigned_to: "" as string | null,
    due_date: null as string | null,
  });

  const isEditMode = !!task;

  useEffect(() => {
    if (open) {
      if (task) {
        setFormData({
          title: task.title || "",
          description: task.description || "",
          status: task.status || "Todo",
          priority: task.priority || "medium",
          assigned_to: task.assigned_to || null,
          due_date: task.due_date || null,
        });
      } else {
        setFormData({
          title: "",
          description: "",
          status: defaultStatus || "Todo",
          priority: "medium",
          assigned_to: null,
          due_date: null,
        });
      }
    }
  }, [open, task, defaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (!activeOrgId) {
      toast.error("No active organization selected");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in");

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date,
      };

      if (isEditMode && task) {
        const { error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", task.id);

        if (error) throw error;
        await logActivity(task.id, `Updated task: ${formData.title}`);
        toast.success("Task updated successfully!");
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            ...payload,
            created_by: user.id,
            org_id: activeOrgId
          })
          .select()
          .single();

        if (error) throw error;
        await logActivity(data.id, `Created task: ${formData.title}`);
        toast.success("Task created successfully!");
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Design Landing Page"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Details about the task..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo">Todo</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assign To</Label>
                <Select
                  value={formData.assigned_to || "unassigned"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, assigned_to: val === "unassigned" ? null : val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? (
                        format(new Date(formData.due_date), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date ? new Date(formData.due_date) : undefined}
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          due_date: date ? format(date, "yyyy-MM-dd") : null,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditMode ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};