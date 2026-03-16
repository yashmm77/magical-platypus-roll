"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "./TaskModal";

interface CreateTaskDialogProps {
  onTaskCreated?: () => void;
}

export const CreateTaskDialog = ({ onTaskCreated }: CreateTaskDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
      >
        <Plus className="w-4 h-4" />
        Create Task
      </Button>

      <TaskModal 
        open={open} 
        onOpenChange={setOpen} 
        onSuccess={onTaskCreated} 
      />
    </>
  );
};