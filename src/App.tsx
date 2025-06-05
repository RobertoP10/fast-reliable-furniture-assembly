import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ClientDashboard from "./pages/ClientDashboard";
import TaskerDashboard from "./pages/TaskerDashboard";
import TaskerPending from "./pages/TaskerPending";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import React from "react";

const queryClient = new QueryClient();

// 👇 Wrap cu acces la context
const RouterWithAuth = () => {
  const { loading, isSyncing } = useAuth();

  if (loading || isSyncing) {
    return (
      <div style={{ textAlign: "center", paddingTop: "150px", fontSize: "1.2rem" }}>
        🔄 Please wait, your account is loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/client-dashboard" element={<ClientDashboard />} />
      <Route path="/tasker-dashboard" element={<TaskerDashboard />} />
      <Route path="/tasker-pending" element={<TaskerPending />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RouterWithAuth />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

