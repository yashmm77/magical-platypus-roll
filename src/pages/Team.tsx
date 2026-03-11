import { LayoutDashboard, CheckSquare, Users, Settings, Plus, LogOut, Mail, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { Link } from "react-router-dom";

const Team = () => {
  const { signOut } = useAuth();
  const { data: users, isLoading, error } = useUsers();

  // Mock data for demonstration
  const mockUsers = [
    { id: "1", full_name: "John Doe", email: "john@example.com", role: "admin" },
    { id: "2", full_name: "Jane Smith", email: "jane@example.com", role: "member" },
    { id: "3", full_name: "Bob Johnson", email: "bob@example.com", role: "member" },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6">
            <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
              <CheckSquare className="w-8 h-8" />
              TaskTracker
            </Link>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <Button variant="ghost" asChild className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
              <Link to="/">
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-indigo-600 bg-indigo-50">
              <Users className="w-5 h-5" />
              Team
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
              <Settings className="w-5 h-5" />
              Settings
            </Button>
          </nav>
          <div className="p-4 border-t border-slate-200 space-y-4">
            <Button variant="ghost" className="w-full justify-start gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => signOut()}>
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </div>
        <main className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <h2 className="text-xl font-semibold text-slate-800">Team Members</h2>
            <div className="flex items-center gap-4">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Invite Member
              </Button>
            </div>
          </header>
          <div className="p-8">
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Team</h3>
              <p className="text-slate-500 mb-4">Unable to fetch team members. Please try again later.</p>
              <Button variant="outline" className="bg-indigo-600 text-white hover:bg-indigo-700">
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6">
            <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
              <CheckSquare className="w-8 h-8" />
              TaskTracker
            </Link>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <Button variant="ghost" asChild className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
              <Link to="/">
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-indigo-600 bg-indigo-50">
              <Users className="w-5 h-5" />
              Team
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
              <Settings className="w-5 h-5" />
              Settings
            </Button>
          </nav>
          <div className="p-4 border-t border-slate-200 space-y-4">
            <Button variant="ghost" className="w-full justify-start gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => signOut()}>
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </div>
        <main className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <h2 className="text-xl font-semibold text-slate-800">Team Members</h2>
            <div className="flex items-center gap-4">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Invite Member
              </Button>
            </div>
          </header>
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const teamMembers = users || mockUsers;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <CheckSquare className="w-8 h-8" />
            TaskTracker
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Button variant="ghost" asChild className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <Link to="/">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-indigo-600 bg-indigo-50">
            <Users className="w-5 h-5" />
            Team
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <Settings className="w-5 h-5" />
            Settings
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-200 space-y-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => signOut()}>
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-slate-800">Team Members</h2>
          <div className="flex items-center gap-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Invite Member
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {teamMembers.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Team Members Yet</h3>
              <p className="text-slate-500 mb-4">Invite team members to get started with TaskTracker.</p>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Invite Member
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((user) => (
                <Card key={user.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                        {user.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">
                          {user.full_name || "Unnamed User"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none">
                            {user.role || "Member"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Team;