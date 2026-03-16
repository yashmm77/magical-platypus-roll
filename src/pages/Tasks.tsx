"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Eye, 
  ArrowUpDown, 
  Trash2, 
  Filter,
  X,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { useTasks } from "@/hooks/useTasks";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TaskModal } from "@/components/TaskModal";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Task } from "@/types";

const Tasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, canEdit, isAdmin } = useRole();
  const { tasks, isLoading, deleteTask, isDeleting } = useTasks();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Role-based filtering: Members only see their own tasks
      if (role === 'member' && task.assigned_to !== user?.id && task.created_by !== user?.id) {
        return false;
      }

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [tasks, statusFilter, priorityFilter, role, user]);

  const sortedTasks = useMemo(() => {
    const result = [...filteredTasks];
    if (!sortConfig) return result;
    
    const { key, direction } = sortConfig;
    result.sort((a: any, b: any) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [filteredTasks, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo": return "bg-slate-100 text-slate-700";
      case "in_progress": return "bg-blue-50 text-blue-700";
      case "done": return "bg-emerald-50 text-emerald-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Tasks</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Filter className="w-4 h-4" /> Filters:
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        {(statusFilter !== "all" || priorityFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
            <X className="w-4 h-4 mr-2" /> Clear
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableHead className="cursor-pointer hover:text-indigo-600" onClick={() => requestSort('title')}>
                  <div className="flex items-center gap-2">Title <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-indigo-600" onClick={() => requestSort('status')}>
                  <div className="flex items-center gap-2">Status <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-indigo-600" onClick={() => requestSort('priority')}>
                  <div className="flex items-center gap-2">Priority <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-indigo-600" onClick={() => requestSort('due_date')}>
                  <div className="flex items-center gap-2">Due Date <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    No tasks found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                sortedTasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 w-8"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditTask(task)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8"
                            title="Edit Task"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteId(task.id)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TaskModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        task={selectedTask} 
        onSuccess={() => {}} 
      />

      <DeleteConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        loading={isDeleting}
        onConfirm={() => {
          if (deleteId) {
            deleteTask(deleteId, {
              onSuccess: () => setDeleteId(null)
            });
          }
        }}
      />
    </div>
  );
};

export default Tasks;