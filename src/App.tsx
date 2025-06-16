
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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">🛠️ Creating your account...</h2>
      <p className="text-gray-600">Please wait a few seconds while we set everything up.</p>
    </div>
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
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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
