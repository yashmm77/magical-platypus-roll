"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const Calendar = () => {
  const navigate = useNavigate();
  const { activeOrgId } = useAuth();
  const { tasks, isLoading } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => task.due_date && isSameDay(new Date(task.due_date), day));
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  if (!activeOrgId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isLoading && tasks.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 font-semibold text-slate-700 min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setCurrentMonth(new Date())}
          className="bg-white"
        >
          Today
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[120px]">
            {days.map((day, idx) => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "border-r border-b border-slate-50 p-2 transition-colors hover:bg-slate-50/50",
                    !isCurrentMonth && "bg-slate-50/30 text-slate-300",
                    idx % 7 === 6 && "border-r-0"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                      isToday(day) && "bg-indigo-600 text-white",
                      !isToday(day) && isCurrentMonth && "text-slate-700",
                      !isCurrentMonth && "text-slate-300"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayTasks.map(task => (
                      <div 
                        key={task.id}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded border cursor-pointer truncate transition-all hover:scale-[1.02]",
                          task.priority === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-emerald-50 text-emerald-700 border-emerald-100'
                        )}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;