import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Team from "./pages/Team";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";

const App = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Layout><Index /></Layout>} />
      <Route path="/team" element={<Layout><Team /></Layout>} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default App;