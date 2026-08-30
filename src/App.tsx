import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { logActivity } from "@/lib/activityLog";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Splash from "./components/Splash";
import { AssetDetailsHost } from "./components/UserAssetCard";


// Factory helpers so we can also warm the chunk after auth.
const l = <T,>(f: () => Promise<T>) => ({ Comp: lazy(f as any), load: f });
const _Dashboard = l(() => import("./pages/Dashboard"));
const _Accessories = l(() => import("./pages/Accessories"));
const _UserProfiles = l(() => import("./pages/UserProfiles"));
const _NotFound = l(() => import("./pages/NotFound"));
const _MyProfile = l(() => import("./pages/MyProfile"));


// Light, frequently used routes — warmed first for instant navigation.
const CORE_LAZY = [
  _Dashboard, _Accessories, _UserProfiles, _MyProfile,
];


// Heavy tool routes (pdf / ocr / barcode) — warmed last, well after first paint.
const HEAVY_LAZY = [
  _NotFound
];


const Dashboard = _Dashboard.Comp;
const Accessories = _Accessories.Comp;
const UserProfiles = _UserProfiles.Comp;
const NotFound = _NotFound.Comp;
const MyProfile = _MyProfile.Comp;

const queryClient = new QueryClient();

const PrintLogger = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session) {
      // Data prefetch and chunk warming must never compete with first paint.
      const idle = (cb: () => void, timeout = 2000) =>
        (window as any).requestIdleCallback
          ? (window as any).requestIdleCallback(cb, { timeout })
          : setTimeout(cb, 300);
      idle(() => {
        import("@/lib/prefetch").then((m) => m.prefetchAll()).catch(() => { });
        // Let data requests finish before warming route code. Loading every
        // page chunk at once previously competed with the dashboard's data.
        setTimeout(() => {
          CORE_LAZY.forEach((m) => { try { m.load(); } catch { } });
        }, 5000);
        setTimeout(() => {
          HEAVY_LAZY.forEach((m) => { try { m.load(); } catch { } });
        }, 15000);
      });
    }
    const onBeforePrint = () => {
      const route = window.location.pathname;
      logActivity({ action: "print", entity: "Page", description: `Printed ${route}`, route });
    };
    window.addEventListener("beforeprint", onBeforePrint);
    return () => window.removeEventListener("beforeprint", onBeforePrint);
  }, [session]);


  // Global swipe-right (from left edge) = back navigation
  useEffect(() => {
    let startX = 0, startY = 0, startT = 0, tracking = false;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (t.clientX > 40) { tracking = false; return; }
      startX = t.clientX; startY = t.clientY; startT = Date.now(); tracking = true;
    };
    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      const dt = Date.now() - startT;
      if (dx > 80 && dy < 60 && dt < 600 && location.pathname !== "/" && location.pathname !== "/login") {
        navigate(-1);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [navigate, location.pathname]);
  return null;
};

const App = () => (
  <ReduxProvider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PrintLogger />
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-slate-900 dark:to-slate-800 flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Suspense fallback={<Splash label="Loading…" />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/accessories" element={<Accessories />} />
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <AssetDetailsHost />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ReduxProvider>
);

export default App;
