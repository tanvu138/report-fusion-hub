import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Department from "./pages/Department";
import ReportCreate from "./pages/ReportCreate";
import ReportEdit from "./pages/ReportEdit";

import DepartmentAdminPage from "./pages/DepartmentAdminPage";
import ReportTemplateAdminPage from "./pages/ReportTemplateAdminPage";
import UserAdminPage from "./pages/UserAdminPage";
import WorkspacePage from "./pages/WorkspacePage";
import WorkspaceNoteEdit from "./pages/WorkspaceNoteEdit";
import NotFound from "./pages/NotFound";
import ShareSnapshotPage from "./pages/ShareSnapshot";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Layout wrapper component
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MainLayout>{children}</MainLayout>
);

// Protected layout wrapper
const ProtectedLayout: React.FC = () => (
  <ProtectedRoute>
    <LayoutWrapper>
      <Outlet />
    </LayoutWrapper>
  </ProtectedRoute>
);

// Public routes that don't require authentication
const publicRoutes = [
  { path: "/login", element: <Login /> },
  { 
    path: "/", 
    element: (
      <LayoutWrapper>
        <Index />
      </LayoutWrapper>
    )
  },
  { path: "/share/:shareId", element: <ShareSnapshotPage /> },
];

// Protected routes that require authentication
const protectedRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/workspace", element: <WorkspacePage /> },
  { path: "/workspace/:id", element: <WorkspaceNoteEdit /> },
  { path: "/department", element: <Department /> },
  { path: "/reports/create", element: <ReportCreate /> },
  { path: "/reports/:id", element: <ReportEdit /> },
  { path: "/reports/:id/edit-markdown", element: <ReportEdit /> }, // Legacy route - redirects to unified interface internally
  { path: "/admin/departments", element: <DepartmentAdminPage /> },
  { path: "/admin/report-templates", element: <ReportTemplateAdminPage /> },
  { path: "/admin/users", element: <UserAdminPage /> },
];

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                  <Routes>
                {/* Public routes */}
                {publicRoutes.map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}

                {/* Protected routes */}
                <Route element={<ProtectedLayout />}>
                  {protectedRoutes.map((route) => (
                    <Route 
                      key={route.path} 
                      path={route.path} 
                      element={route.element} 
                    />
                  ))}
                </Route>

                    {/* Redirect any unknown routes to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
