import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Kanban from "./pages/Kanban";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import TaskDetail from "./pages/TaskDetail";
import Team from "./pages/Team";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        
        <Route
          path="/"
          element={user ? <Layout><Index /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/kanban"
          element={user ? <Layout><Kanban /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/tasks"
          element={user ? <Layout><Tasks /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/calendar"
          element={user ? <Layout><Calendar /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/reports"
          element={user ? <Layout><Reports /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/tasks/:id"
          element={user ? <Layout><TaskDetail /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/team"
          element={user ? <Layout><Team /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Layout><Profile /></Layout> : <Navigate to="/login" />}
        />
        {/* Redirect /register to /signup for backward compatibility */}
        <Route path="/register" element={<Navigate to="/signup" replace />} />
      </Routes>
    </Router>
  );
}

export default App;