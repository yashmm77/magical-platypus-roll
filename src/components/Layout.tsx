import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Logout from './Logout';

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

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8" />
            TaskTracker
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Button 
            variant="ghost" 
            asChild 
            className={`w-full justify-start gap-3 ${
              location.pathname === "/" 
                ? "bg-indigo-50 text-indigo-600" 
                : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <Link to="/"> 
              <CheckSquare className="w-5 h-5" /> 
              Dashboard 
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            asChild 
            className={`w-full justify-start gap-3 ${
              location.pathname === "/tasks" 
                ? "bg-indigo-50 text-indigo-600" 
                : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <Link to="/tasks"> 
              <CheckSquare className="w-5 h-5" /> 
              Tasks 
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            asChild 
            className={`w-full justify-start gap-3 ${
              location.pathname === "/team" 
                ? "bg-indigo-50 text-indigo-600" 
                : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <Link to="/team"> 
              <User className="w-5 h-5" /> 
              Team 
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-200 space-y-4">
          <Logout />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-slate-800">TaskTracker</h2>
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-indigo-600">{user.email}</span>
                <span className="text-sm text-indigo-500">Admin</span>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;