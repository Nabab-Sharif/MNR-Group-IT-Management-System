import { useNavigate, useLocation } from "react-router-dom";
import { Monitor, Users, Building2, Home, Package } from "lucide-react";

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/units', icon: Building2, label: 'Units & Offices' },
    { path: '/assets', icon: Monitor, label: 'IT Assets' },
    { path: '/products', icon: Package, label: 'Product Tracking' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
        <div className="max-w-7xl mx-auto px-4 py-3 backdrop-blur-xl bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => navigate('/')}
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/20 to-white/5 group-hover:from-white/30 group-hover:to-white/10 transition-all flex items-center justify-center border border-white/20 shadow-lg">
                  <img src="/mnr-logo.png" alt="MNR" className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl leading-tight drop-shadow-lg">
                    MNR IT Management
                  </h1>
                  <p className="text-indigo-200 text-xs font-medium">Asset & Product Tracking</p>
                </div>
              </div>

              <nav className="flex items-center gap-2">
                {navItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2
                      ${location.pathname === item.path 
                        ? 'bg-white/20 text-white shadow-lg border border-white/30' 
                        : 'text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md hover:scale-105'}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="drop-shadow-sm">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white font-medium text-sm">
                  IT Department
                </p>
                <p className="text-indigo-200 text-xs font-medium">MNR Sweaters Ltd.</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 hover:from-white/30 hover:to-white/10 transition-all border border-white/20 flex items-center justify-center shadow-lg hover:scale-105">
                <Users className="h-5 w-5 text-white drop-shadow" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
