import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, User, Settings, Trello, List, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Logout from './Logout';
import { GlobalSearch } from './GlobalSearch';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/kanban", label: "Kanban Board", icon: Trello },
    { path: "/tasks", label: "Task List", icon: List },
    { path: "/calendar", label: "Calendar", icon: Calendar },
    { path: "/team", label: "Team", icon: User },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
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
                  ? "bg-indigo-50 text-indigo-600 font-semibold" 
                  : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
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
                ? "bg-indigo-50 text-indigo-600 font-semibold" 
                : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <Link to="/profile">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <Logout />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-8 flex-1">
            <h2 className="text-lg font-semibold text-slate-800 hidden md:block">
              {navItems.find(i => i.path === location.pathname)?.label || (location.pathname === "/profile" ? "Profile" : "TaskTracker")}
            </h2>
            <GlobalSearch />
          </div>
          {user && (
            <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity ml-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user.email?.[0].toUpperCase()}
              </div>
            </Link>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 bg-[#F8FAFC]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;