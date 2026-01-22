import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Departments";
import Accessories from "./pages/Accessories";
import Products from "./pages/Products";
import UserProfiles from "./pages/UserProfiles";
import Printers from "./pages/Printers";
import IPPhoneList from "./pages/IPPhoneList";
import WifiList from "./pages/WifiList";
import IPAddresses from "./pages/IPAddresses";
import CCTVList from "./pages/CCTVList";
import CCTVCheckList from "./pages/CCTVCheckList";
import SwitchPortMapping from "./pages/SwitchPortMapping";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/accessories" element={<Accessories />} />
              <Route path="/ip-addresses" element={<IPAddresses />} />
              <Route path="/printers" element={<Printers />} />
              <Route path="/ip-phones" element={<IPPhoneList />} />
              <Route path="/wifi-list" element={<WifiList />} />
              <Route path="/cctv-list" element={<CCTVList />} />
              <Route path="/cctv-checklist" element={<CCTVCheckList />} />
              <Route path="/switch-mapping" element={<SwitchPortMapping />} />
              <Route path="/products" element={<Products />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/user-profiles" element={<UserProfiles />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
