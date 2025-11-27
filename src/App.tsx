import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { SocketProvider } from "@/contexts/SocketContext";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/dashboard/Dashboard";
import Incidents from "@/pages/incidents/Incidents";
import IncidentDetail from "@/pages/incidents/IncidentDetail";
import Reports from "@/pages/reports/Reports";
import Settings from "@/pages/settings/Settings";
import AuditLogs from "@/pages/audit/AuditLogs";
import PersonnelList from "@/pages/personnel/PersonnelList";
import PersonnelDetail from "@/pages/personnel/PersonnelDetail";
import PersonnelEdit from "@/pages/personnel/PersonnelEdit";
import PersonnelCreate from "@/pages/personnel/PersonnelCreate";
import MapDispatch from "@/pages/map/MapDispatch";
import BarangayList from "@/pages/barangay/BarangayList";
import BarangayDetail from "@/pages/barangay/BarangayDetail";
import BarangayForm from "@/pages/barangay/BarangayForm";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { loadUserFromStorage } = useAuthStore();

  // Load user from localStorage on app init
  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
        />
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="incidents/:id" element={<IncidentDetail />} />
            <Route path="map" element={<MapDispatch />} />
            <Route path="personnel" element={<PersonnelList />} />
            <Route path="personnel/new" element={<PersonnelCreate />} />
            <Route path="personnel/:id/edit" element={<PersonnelEdit />} />
            <Route path="personnel/:id" element={<PersonnelDetail />} />
            <Route path="barangays" element={<BarangayList />} />
            <Route path="barangays/new" element={<BarangayForm />} />
            <Route path="barangays/:id/edit" element={<BarangayForm />} />
            <Route path="barangays/:id" element={<BarangayDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
