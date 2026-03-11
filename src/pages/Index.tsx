import { LayoutDashboard, CheckSquare, Users, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, signOut } = useAuth();
  const { tasks, isLoading } = useTasks();
  
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        <div className="p-6">
          <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <CheckSquare className="w-8 h-8" />
            TaskTracker
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Button variant="ghost" asChild className="w-full justify-start gap-3 text-indigo-600 bg-indigo-50">
            <Link to="/">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <CheckSquare className="w-5 h-5" />
            My Tasks
          </Button>
          <Button variant="ghost" asChild className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
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
      <main className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-slate-800">Welcome back, {userName}!</h2>
          <div className="flex items-center gap-4">
            <CreateTaskDialog />
            <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                <p className="text-xs text-slate-500 mt-1">Managed tasks</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.inProgress}</div>
                <p className="text-xs text-amber-600 mt-1">Currently active</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.completed}</div>
                <p className="text-xs text-emerald-600 mt-1">Successfully finished</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Recent Tasks</h3>
              <Button variant="link" className="text-indigo-600">View all</Button>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <CheckSquare className="w-12 h-12 mb-2 opacity-20" />
                  <p>No tasks found. Create your first task!</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tasks.slice(0, 10).map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{task.title}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className={
                            task.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            task.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-700"
                          }>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm capitalize ${
                            task.priority === "high" ? "text-rose-600 font-semibold" :
                            task.priority === "medium" ? "text-amber-600" :
                            "text-slate-500"
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {(task as any).assigned_user?.full_name || "Unassigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;