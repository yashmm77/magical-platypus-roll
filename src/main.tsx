import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleProvider } from "@/context/RoleContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <RoleProvider>
          <App />
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);