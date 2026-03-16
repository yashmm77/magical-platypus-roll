import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Team from "./pages/Team";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Kanban from "./pages/Kanban";
import Profile from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";

const App = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
      <Route path="/kanban" element={<ProtectedRoute><Layout><Kanban /></Layout></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Layout><Team /></Layout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default App;
