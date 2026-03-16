"use client";

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, User, Settings, Trello, List, Calendar, Menu, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Logout from './Logout';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './ThemeToggle';
import { Notifications } from './Notifications';
import { CreateTaskDialog } from './CreateTaskDialog';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error) setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Reset scroll position on route change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/kanban", label: "Kanban Board", icon: Trello },
    { path: "/tasks", label: "Task List", icon: List },
    { path: "/calendar", label: "Calendar", icon: Calendar },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/team", label: "Team", icon: User },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="p-6">
        <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <CheckSquare className="w-8 h-8" />
          <span className="tracking-tight">TaskTracker</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button 
              key={item.path}
              variant="ghost" 
              asChild 
              className={cn(
                "w-full justify-start gap-3 h-11 transition-all duration-200",
                isActive 
                  ? "bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Link to={item.path}> 
                <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} /> 
                {item.label} 
              </Link>
            </Button>
          );
        })}
        <div className="pt-4 pb-2 px-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</p>
        </div>
        <Button 
          variant="ghost" 
          asChild
          className={cn(
            "w-full justify-start gap-3 h-11 transition-all duration-200",
            location.pathname === "/profile" 
              ? "bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Link to="/profile">
            <Settings className={cn("w-5 h-5", location.pathname === "/profile" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
            Account Settings
          </Link>
        </Button>
      </nav>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <Logout />
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <Link to="/" className="lg:hidden text-indigo-600">
              <CheckSquare className="w-8 h-8" />
            </Link>
            
            <div className="flex-1 max-w-md hidden sm:block">
              <GlobalSearch />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <CreateTaskDialog />
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2 md:pl-4">
              <Notifications />
              <ThemeToggle />
            </div>
            {user && (
              <Link to="/profile" className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded-lg transition-colors">
                <Avatar className="w-8 h-8 border border-indigo-100 dark:border-indigo-900/30">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                    {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[100px]">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[100px]">
                    {profile?.role || 'Member'}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Search (Visible only on small screens) */}
        <div className="p-3 sm:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <GlobalSearch />
        </div>

        {/* Page Content Wrapper */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 scroll-smooth"
        >
          <div 
            key={location.pathname}
            className="p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;