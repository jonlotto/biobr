import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import SubdomainHandler from "./components/SubdomainHandler";
import UsernameRedirect from "./components/UsernameRedirect";

// Lazy-loaded: only the admin dashboard, editor, and user management pull in
// dnd-kit/framer-motion/etc. Keeping them out of the initial bundle means the
// public BioPage route (imported statically below, via SubdomainHandler)
// doesn't pay for code it never uses - same for login and the 404 page.
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const Editor = lazy(() => import("./pages/Editor"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <PWAUpdatePrompt />
        <BrowserRouter>
          <Suspense fallback={null}>
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
