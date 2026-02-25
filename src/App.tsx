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
import NotFound from "./pages/NotFound";

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
                <Route path="/admin" element={<Admin />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/company/:companyId" element={<Company />} />
                <Route path="/company/:companyId/employees" element={<Employees />} />
                <Route path="/company/:companyId/payroll" element={<Payroll />} />
                <Route path="/company/:companyId/reports" element={<Reports />} />
                <Route path="/company/:companyId/leave" element={<Leave />} />
                <Route path="/company/:companyId/settings" element={<Settings />} />
                <Route path="/company/:companyId/projects" element={<Projects />} />
                <Route path="/company/:companyId/invoices" element={<Invoices />} />
                <Route path="/company/:companyId/cashflow" element={<Cashflow />} />
                <Route path="/company/:companyId/workload" element={<Workload />} />
                <Route path="/company/:companyId/revenue" element={<Revenue />} />
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
