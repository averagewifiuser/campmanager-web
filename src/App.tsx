import React from "react";
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth-context';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateCampPage } from './pages/CreateCampPage';
import { EditCampPage } from './pages/EditCampPage';
import { CampsPage } from './pages/CampsPage';
import { CampDetailPage } from './pages/CampDetailPage';
import { CampManagementPage } from './pages/CampManagementPage';
import { PublicRegistrationPage } from './pages/PublicRegistrationPage';
import { LinkRegistrationPage } from './pages/LinkRegistrationPage';
import { CamperVerificationPage } from './pages/CamperVerificationPage';
import { CamperDataPage } from './pages/CamperDataPage';
import { RegistrationLinksManagementPage } from './pages/RegistrationLinksManagementPage';
import { CustomFieldsManagementPage } from './pages/CustomFieldsManagementPage';
import { ChurchesManagementPage } from './pages/ChurchesManagementPage';
import { CategoriesManagementPage } from './pages/CategoriesManagementPage';
import { LoadingSpinner } from './components/ui/loading-spinner';
import SideNav from './components/layout/SideNav';
import { useLocation, matchPath } from 'react-router-dom';
import PaymentsPage from './pages/PaymentsPage';
import FinancialsPage from './pages/FinancialsPage';
import InventoryPage from './pages/InventoryPage';
import PurchasesPage from './pages/PurchasesPage';
import PledgesPage from './pages/PledgesPage';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirect if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/camps" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Payments page (protected) */}
      <Route
        path="/camps/:campId/payments"
        element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
      {/* Financials page (protected) */}
      <Route
        path="/camps/:campId/financials"
        element={
          <ProtectedRoute>
            <FinancialsPage />
          </ProtectedRoute>
        }
      />
      {/* Inventory page (protected) */}
      <Route
        path="/camps/:campId/inventory"
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      {/* Purchases page (protected) */}
      <Route
        path="/camps/:campId/purchases"
        element={
          <ProtectedRoute>
            <PurchasesPage />
          </ProtectedRoute>
        }
      />
      {/* Pledges page (protected) */}
      <Route
        path="/camps/:campId/pledges"
        element={
          <ProtectedRoute>
            <PledgesPage />
          </ProtectedRoute>
        }
      />
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      {/* Public registration routes - no auth required */}
      <Route
        path="/camps/:campId/register"
        element={<PublicRegistrationPage />}
      />
      
      <Route
        path="/register/:linkToken"
        element={<LinkRegistrationPage />}
      />

      {/* Camper verification routes - no auth required */}
      <Route
        path="/camper-verification"
        element={<CamperVerificationPage />}
      />
      
      <Route
        path="/camper-data"
        element={<CamperDataPage />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/camps/create"
        element={
          <ProtectedRoute>
            <CreateCampPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/camps"
        element={
          <ProtectedRoute>
            <CampsPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/camps/:campId"
        element={
          <ProtectedRoute>
            <CampDetailPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/camps/:campId/edit"
        element={
          <ProtectedRoute>
            <EditCampPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/camps/:campId/manage"
        element={
          <ProtectedRoute>
            <CampManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/camps/:campId/manage/registration-links"
        element={
          <ProtectedRoute>
            <RegistrationLinksManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/camps/:campId/manage/custom-fields"
        element={
          <ProtectedRoute>
            <CustomFieldsManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/camps/:campId/manage/churches"
        element={
          <ProtectedRoute>
            <ChurchesManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/camps/:campId/manage/categories"
        element={
          <ProtectedRoute>
            <CategoriesManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/camper-verification" replace />} />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/camper-verification" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Try to extract campId from the current URL
  // Matches /camps/:campId, /camps/:campId/edit, /camps/:campId/manage, /payments/:campId, etc.
  const campMatch =
    matchPath("/camps/:campId/*", location.pathname) ||
    matchPath("/camps/:campId", location.pathname);

  const campId = campMatch?.params?.campId;

  // Do not show SideNav on payments pag

  if (isLoading) return <LoadingSpinner />;
  return (
    <div className="flex min-h-screen bg-background">
      {isAuthenticated && campId && <SideNav campId={campId} />}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default App;
