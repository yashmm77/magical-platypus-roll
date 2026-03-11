import { LayoutDashboard, CheckSquare, Users, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <CheckSquare className="w-8 h-8" />
            TaskTracker
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <CheckSquare className="w-5 h-5" />
            My Tasks
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <Users className="w-5 h-5" />
            Team
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
            <Settings className="w-5 h-5" />
            Settings
          </Button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-sm font-medium text-indigo-900">Pro Plan</p>
            <p className="text-xs text-indigo-700 mt-1">Get unlimited team members and projects.</p>
            <Button size="sm" className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white">
              Upgrade
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-slate-800">Dashboard Overview</h2>
          <div className="flex items-center gap-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
            <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold">
              JD
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
                <div className="text-3xl font-bold text-slate-900">24</div>
                <p className="text-xs text-emerald-600 mt-1">+4 from last week</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">8</div>
                <p className="text-xs text-amber-600 mt-1">2 due today</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">12</div>
                <p className="text-xs text-indigo-600 mt-1">85% completion rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Recent Tasks</h3>
              <Button variant="link" className="text-indigo-600">View all</Button>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[
                    { name: "Design System Update", status: "In Progress", priority: "High", date: "Oct 24, 2023" },
                    { name: "API Integration", status: "Todo", priority: "Medium", date: "Oct 26, 2023" },
                    { name: "User Feedback Review", status: "Completed", priority: "Low", date: "Oct 22, 2023" },
                  ].map((task, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{task.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className={
                          task.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                          task.status === "In Progress" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-700"
                        }>
                          {task.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${
                          task.priority === "High" ? "text-rose-600 font-semibold" :
                          task.priority === "Medium" ? "text-amber-600" :
                          "text-slate-500"
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{task.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
