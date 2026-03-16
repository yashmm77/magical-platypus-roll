"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
import { Loader2, Eye, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { useTasks } from "@/hooks/useTasks";

const TaskList = () => {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedTasks = [...tasks].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

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
      case "completed": return "bg-emerald-50 text-emerald-700";
      default: return "bg-slate-100 text-slate-700";
    }
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
        <h1 className="text-2xl font-bold text-slate-900">All Tasks</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
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
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-900">{task.title}</TableCell>
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TaskList;