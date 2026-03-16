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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
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
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <CheckSquare className="w-8 h-8" />
          TaskTracker
        </Link>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Button 
            key={item.path}
            variant="ghost" 
            asChild 
            className={`w-full justify-start gap-3 h-11 ${
              location.pathname === item.path 
                ? "bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-900/20 dark:text-indigo-400" 
                : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Link to={item.path}> 
              <item.icon className="w-5 h-5" /> 
              {item.label} 
            </Link>
          </Button>
        ))}
        <Button 
          variant="ghost" 
          asChild
          className={`w-full justify-start gap-3 h-11 ${
            location.pathname === "/profile" 
              ? "bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-900/20 dark:text-indigo-400" 
              : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Link to="/profile">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </Button>
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Logout />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col sticky top-0 h-screen hidden lg:flex">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-500">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
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
              <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="w-9 h-9 border-2 border-indigo-100 dark:border-indigo-900/30">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                    {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
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
        <div className="p-4 sm:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <GlobalSearch />
        </div>

        {/* Page Content */}
        <div 
          ref={contentRef}
          key={location.pathname}
          className="flex-1 p-4 md:p-8 bg-[#F8FAFC] dark:bg-slate-950 overflow-y-auto animate-in fade-in duration-500"
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;