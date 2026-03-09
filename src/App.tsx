import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Company from "./pages/Company";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import Leave from "./pages/Leave";
import Settings from "./pages/Settings";
import Projects from "./pages/Projects";
import Invoices from "./pages/Invoices";
import Cashflow from "./pages/Cashflow";
import Workload from "./pages/Workload";
import Revenue from "./pages/Revenue";
import Forecasting from "./pages/Forecasting";
import NotFound from "./pages/NotFound";
import { CompanyLayoutRoute } from "./components/company/CompanyLayoutRoute";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/company/:companyId" element={<CompanyLayoutRoute />}>
                  <Route index element={<Company />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="payroll" element={<Payroll />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="leave" element={<Leave />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="cashflow" element={<Cashflow />} />
                  <Route path="workload" element={<Workload />} />
                  <Route path="revenue" element={<Revenue />} />
                  <Route path="forecasting" element={<Forecasting />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
