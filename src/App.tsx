import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GarageDataProvider } from "@/context/garage-data";
import { SettingsProvider } from "@/context/settings";
import { AuthProvider } from "@/context/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Vehicles from "./pages/Vehicles.tsx";
import MaintenancePage from "./pages/Maintenance.tsx";
import Receipts from "./pages/Receipts.tsx";
import ReceiptPhotos from "./pages/ReceiptPhotos.tsx";
import Analytics from "./pages/Analytics.tsx";
import NotFound from "./pages/NotFound.tsx";
import AuthPage from "./pages/Auth.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <TooltipProvider>
      <AuthProvider>
        <GarageDataProvider>
          <SettingsProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              basename="/steady-wheel-hub"
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
                <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
                <Route path="/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
                <Route path="/receipt-photos" element={<ProtectedRoute><ReceiptPhotos /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SettingsProvider>
        </GarageDataProvider>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
