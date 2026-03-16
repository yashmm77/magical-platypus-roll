"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  Loader2, 
  LayoutDashboard, 
  Trello, 
  List, 
  Calendar, 
  Users, 
  BarChart3,
  Settings,
  FileText
} from "lucide-react";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search tasks when query changes
  useEffect(() => {
    const searchTasks = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("id, title, status")
          .ilike("title", `%${query}%`)
          .limit(10);
        
        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchTasks, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-slate-500 dark:text-slate-400 sm:pr-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search tasks or pages...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Type to search tasks..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span className="ml-2 text-xs text-slate-500">Searching...</span>
            </div>
          )}
          
          {!loading && query.length > 0 && results.length === 0 && (
            <CommandEmpty>No tasks found for "{query}".</CommandEmpty>
          )}
          
          {results.length > 0 && (
            <CommandGroup heading="Tasks">
              {results.map((task) => (
                <CommandItem
                  key={task.id}
                  value={task.title}
                  onSelect={() => runCommand(() => navigate(`/tasks/${task.id}`))}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {task.status.replace('_', ' ')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />
          
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/kanban"))}>
              <Trello className="mr-2 h-4 w-4" />
              <span>Kanban Board</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/tasks"))}>
              <List className="mr-2 h-4 w-4" />
              <span>Task List</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/calendar"))}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/reports"))}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/team"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Team</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => navigate("/profile"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};