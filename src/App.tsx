import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import SubdomainHandler from "./components/SubdomainHandler";
import Auth from "./pages/Auth";
import AdminLayout from "./layouts/AdminLayout";
import AdminUsers from "./pages/AdminUsers";
import UsernameRedirect from "./components/UsernameRedirect";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <PWAUpdatePrompt />
        <BrowserRouter>
          <Routes>
            {/* Root: detects subdomain or shows landing page */}
            <Route path="/" element={<SubdomainHandler />} />
            
            {/* Protected/App routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminLayout />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/design" element={<AdminLayout />} />
            <Route path="/analytics" element={<AdminLayout />} />
            <Route path="/settings" element={<AdminLayout />} />
            <Route
              path="/admin/users"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <AdminUsers />
                </RoleGuard>
              }
            />
            
            {/* Username path: redirects to subdomain in production, shows page in dev */}
            <Route path="/:username" element={<UsernameRedirect />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
