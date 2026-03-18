"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: logsData } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (logsData && logsData.length > 0) {
        const userIds = Array.from(new Set(logsData.map(l => l.user_id).filter(Boolean)));
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p.full_name }), {});
        
        const logsWithProfiles = logsData.map(l => ({
          ...l,
          profiles: { full_name: profileMap[l.user_id] || "System" }
        }));

        setNotifications(logsWithProfiles);
      } else {
        setNotifications([]);
      }
      setUnreadCount(0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('activity-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Popover onOpenChange={(open) => open && fetchNotifications()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-500 hover:text-indigo-600 dark:text-slate-400">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <Badge variant="secondary" className="text-[10px]">{notifications.length} Recent</Badge>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No notifications yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {notif.action.toLowerCase().includes('created') ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : notif.action.toLowerCase().includes('updated') ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-indigo-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        <span className="font-semibold">{notif.profiles?.full_name || "System"}</span> {notif.action}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {format(new Date(notif.created_at), "MMM d, HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 p-2">
          <Button variant="ghost" className="w-full text-xs text-indigo-600 hover:text-indigo-700 h-8">
            View all activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};