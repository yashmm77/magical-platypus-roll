"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchTasks = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("tasks")
        .select("id, title")
        .ilike("title", `%${query}%`)
        .limit(5);
      setResults(data || []);
      setLoading(false);
    };

    const timer = setTimeout(searchTasks, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full max-w-sm">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative cursor-pointer">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search tasks..."
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500 w-full"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[384px]" align="start">
          <Command>
            <CommandList>
              {loading && (
                <div className="p-4 flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                </div>
              )}
              {!loading && results.length === 0 && query.length >= 2 && (
                <CommandEmpty>No tasks found.</CommandEmpty>
              )}
              <CommandGroup heading="Tasks">
                {results.map((task) => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => {
                      navigate(`/tasks/${task.id}`);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="cursor-pointer"
                  >
                    {task.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};