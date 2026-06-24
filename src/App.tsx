import { lazy, Suspense } from "react";
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

// Lazy-loaded pages — Vite automatycznie tworzy osobne chunki JS
// dzięki czemu ciężkie zależności (recharts, tesseract.js) nie blokują
// początkowego ładowania aplikacji
const Index = lazy(() => import("./pages/Index.tsx"));
const Vehicles = lazy(() => import("./pages/Vehicles.tsx"));
const MaintenancePage = lazy(() => import("./pages/Maintenance.tsx"));
const Receipts = lazy(() => import("./pages/Receipts.tsx"));
const ReceiptPhotos = lazy(() => import("./pages/ReceiptPhotos.tsx"));
const Analytics = lazy(() => import("./pages/Analytics.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const ProTips = lazy(() => import("./pages/ProTips.tsx"));

const queryClient = new QueryClient();

/** Minimalistyczny spinner wyświetlany podczas ładowania lazy-chunków */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}

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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
                  <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
                  <Route path="/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
                  <Route path="/receipt-photos" element={<ProtectedRoute><ReceiptPhotos /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/pro-tips" element={<ProtectedRoute><ProTips /></ProtectedRoute>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SettingsProvider>
        </GarageDataProvider>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
