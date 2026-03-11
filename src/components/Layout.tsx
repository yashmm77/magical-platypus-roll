import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, User, Settings, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8" />
            Dashboard
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Button variant="ghost" asChild className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <Link to="/"> <CheckSquare className="w-5 h-5" /> Tasks </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-indigo-600 bg-indigo-50">
            <Link to="/team"> <User className="w-5 h-5" /> Team </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <Link to="/settings"> <Settings className="w-5 h-5" /> Settings </Link>
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-200 space-y-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => signOut()}>
            <Link to="/"> <LogOut className="w-5 h-5" /> Sign Out </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">TaskTracker</h2>
              {user && (
                <div className="flex items-center gap-4">
                  <User className="w-8 h-8 text-indigo-600" />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-indigo-600">{user.email}</span>
                    <span className="ml-2 text-sm text-indigo-500">Admin</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">{children}</h1>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;