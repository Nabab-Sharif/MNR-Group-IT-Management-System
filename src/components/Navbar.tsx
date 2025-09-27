import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Building2, 
  Monitor, 
  Package,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/departments", label: "Departments", icon: Building2 },
    { path: "/accessories", label: "IT Assets", icon: Monitor },
    { path: "/products", label: "Product Tracking", icon: Package },
  ];

  return (
    <nav className="bg-gradient-to-r from-sky-600 to-sky-300 border-b border-sky-500 sticky top-0 z-50 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/logo/navbarLogo.png" 
                alt="MNR Group Logo" 
                className="w-10 h-10 rounded-full border border-white/30 object-cover ring-2 ring-sky-200"
              />
              <div>
                <span className="font-bold text-xl text-white">MNR Group IT Management System</span>
                <div className="text-sky-100 text-xs">Comprehensive IT Infrastructure Management</div>
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/20 backdrop-blur-sm text-white border border-white/30 shadow-lg"
                      : "text-sky-100 hover:text-white hover:bg-white/10 border border-transparent"
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