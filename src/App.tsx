
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
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div style={{ textAlign: 'center', padding: '4rem' }}>
    <h2>🛠️ Creating your account...</h2>
    <p>Please wait a few seconds while we set everything up.</p>
  </div>
);

const AppRoutes = () => {
  const { waitingForProfile } = useAuth();

  if (waitingForProfile) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/client-dashboard" element={<ClientDashboard />} />
      <Route path="/tasker-dashboard" element={<TaskerDashboard />} />
      <Route path="/tasker-pending" element={<TaskerPending />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/contact" element={<Contact />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
