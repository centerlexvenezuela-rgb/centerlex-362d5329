import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { BrandingProvider } from "@/hooks/useBranding";
import { BrandingGate } from "@/components/BrandingGate";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Agenda from "./pages/Agenda";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import SearchPage from "./pages/SearchPage";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";
import Fees from "./pages/Fees";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BrandingProvider>
        <BrandingGate>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/login" element={<AdminAuth />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route element={<ProtectedRoute requireRole="lawyer"><AppLayout /></ProtectedRoute>}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/expedientes" element={<Cases />} />
              <Route path="/expedientes/:id" element={<CaseDetail />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/asistente" element={<Assistant />} />
              <Route path="/honorarios" element={<Fees />} />
              <Route path="/cuenta" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </BrandingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
