"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Eye, Pencil, Trash2, Calendar } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";

const Tasks = () => {
  const navigate = useNavigate();
  const { data: users } = useUsers();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      console.log("Fetching tasks...");
      
      // Fetch tasks with user information
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          profiles!tasks_assigned_to_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
        throw error;
      }
      
      console.log("Fetched tasks:", data);
      setTasks(data || []);
      setFilteredTasks(data || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error(error.message || "Failed to fetch tasks");
      setTasks([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...tasks];
    
    // Search filter
    if (searchTerm) {
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(task => task.status === statusFilter);
    }
    
    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter(task => task.priority === priorityFilter);
    }
    
    // Assigned to filter
    if (assignedToFilter !== "all") {
      result = result.filter(task => task.assigned_to === assignedToFilter);
    }
    
    setFilteredTasks(result);
  }, [searchTerm, statusFilter, priorityFilter, assignedToFilter, tasks]);

  const getStatusBg = (status: string) => {
    switch (status) {
      case "todo": return "bg-slate-100 text-slate-700 border-slate-200";
      case "in_progress": return "bg-blue-50 text-blue-700 border-blue-100";
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-100";
      case "high": return "bg-rose-50 text-rose-700 border-rose-100";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === "completed") return false;
    return new Date(dueDate) < new Date();
  };

  const handleDeleteClick = (task: any) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDelete.id);
      
      if (error) throw error;
      
      // Remove from local state
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      toast.success("Task deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Task List</h1>
        <CreateTaskDialog onTaskCreated={fetchTasks} />
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Priority Filter */}
            <div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Assigned To Filter */}
            <div>
              <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Task Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Assigned To</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Priority</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Due Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{task.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {task.profiles?.full_name || task.profiles?.email || "Unassigned"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getStatusBg(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getPriorityBg(task.priority)}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className={`flex items-center gap-1 ${isOverdue(task.due_date, task.status) ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
                        <Calendar className="w-4 h-4" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-slate-500 hover:text-indigo-600"
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-slate-500 hover:text-indigo-600"
                          onClick={() => console.log("Edit task", task.id)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-slate-500 hover:text-rose-600"
                          onClick={() => handleDeleteClick(task)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-lg">No tasks found</p>
                      <p className="text-sm mt-1">
                        {tasks.length === 0 
                          ? "No tasks in the database. Create your first task!" 
                          : "Try adjusting your filters"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task 
              "{taskToDelete?.title}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-rose-600 hover:bg-rose-700" 
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tasks;