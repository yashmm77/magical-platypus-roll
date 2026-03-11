import { LayoutDashboard, CheckSquare, Users, Settings, Plus, LogOut, Mail, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { Link } from "react-router-dom";

const Team = () => {
  const { signOut } = useAuth();
  const { data: users, isLoading } = useUsers();

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
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <CheckSquare className="w-5 h-5" />
            My Tasks
          </Button>
          <Button variant="ghost" asChild className="w-full justify-start gap-3 text-indigo-600 bg-indigo-50">
            <Link to="/team">
              <Users className="w-5 h-5" />
              Team
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <Settings className="w-5 h-5" />
            Settings
          </Button>
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            onClick={() => signOut()}
          >
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
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users?.map((user) => (
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
                            Member
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {users?.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No team members found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Team;
