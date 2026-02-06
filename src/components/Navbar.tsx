import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Building2, 
  Monitor, 
  Menu,
  X,
  Package,
  Printer,
  Phone,
  Wifi,
  Network,
  Camera,
  ClipboardCheck,
  Settings,
  Cable,
} from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/departments", label: "Departments", icon: Building2 },
    { path: "/accessories", label: "IT Assets", icon: Monitor },
    { path: "/ip-addresses", label: "IP Address", icon: Network },
    { path: "/printers", label: "Printers", icon: Printer },
    { path: "/ip-phones", label: "IP Phones", icon: Phone },
    { path: "/wifi-list", label: "WiFi List", icon: Wifi },
    { path: "/cctv-checklist", label: "CCTV Check List", icon: ClipboardCheck },
    { path: "/switch-mapping", label: "Switch Mapping", icon: Cable },
    { path: "/products", label: "Product Tracking", icon: Package },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-b border-purple-500 sticky top-0 z-50 shadow-[0_8px_32px_rgba(139,92,246,0.4)] backdrop-blur-sm">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 transition-transform duration-300 hover:scale-105">
              <div className="relative flex-shrink-0">
                <img 
                  src="/logo/logo_1.png" 
                  alt="MNR Group Logo" 
                  className="w-10 h-10 rounded-full border-2 border-white/50 object-contain bg-white p-1 ring-2 ring-white/30 relative z-10 shadow-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base text-white drop-shadow-md tracking-wide">MNR Group IT</span>
                <div className="text-white/80 text-[10px] drop-shadow-sm font-medium"></div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shimmer ${
                    isActive
                      ? "bg-white/20 backdrop-blur-sm text-white border border-white/30 shadow-lg transform scale-105"
                      : "text-sky-100 hover:text-white hover:bg-white/10 border border-transparent hover:scale-105"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-sky-100 hover:text-white hover:bg-white/10"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-sky-500 bg-sky-600">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/20 backdrop-blur-sm text-white border border-white/30"
                      : "text-sky-100 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;