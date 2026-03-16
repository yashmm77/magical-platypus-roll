import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Kanban from "./pages/Kanban";
import TaskList from "./pages/TaskList";
import TaskDetail from "./pages/TaskDetail";
import Team from "./pages/Team";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        
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
          element={user ? <Layout><TaskList /></Layout> : <Navigate to="/login" />}
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
      </Routes>
    </Router>
  );
}

export default App;