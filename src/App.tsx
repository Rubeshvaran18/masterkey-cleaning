
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Employees from "./pages/admin/Employees";
import Services from "./pages/admin/Services";
import Feedback from "./pages/admin/Feedback";
import Revenue from "./pages/admin/Revenue";
import Tasks from "./pages/admin/Tasks";
import Attendance from "./pages/admin/Attendance";
import Salary from "./pages/admin/Salary";
import Stocks from "./pages/admin/Stocks";
import Vendors from "./pages/admin/Vendors";
import SubContractors from "./pages/admin/SubContractors";
import Customers from "./pages/admin/Customers";
import CustomerManagement from "./pages/admin/CustomerManagement";
import Accounts from "./pages/admin/Accounts";
import Manpower from "./pages/admin/Manpower";
import Assets from "./pages/admin/Assets";
import Inspection from "./pages/admin/Inspection";
import Auth from "./pages/Auth";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import NotFound from "./pages/NotFound";
import RoleBasedRedirect from "./components/RoleBasedRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/customer" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="services" element={<Services />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="revenue" element={<Revenue />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="salary" element={<Salary />} />
              <Route path="stocks" element={<Stocks />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="sub-contractors" element={<SubContractors />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customer-management" element={<CustomerManagement />} />
              <Route path="manpower" element={<Manpower />} />
              <Route path="assets" element={<Assets />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="inspection" element={<Inspection />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
