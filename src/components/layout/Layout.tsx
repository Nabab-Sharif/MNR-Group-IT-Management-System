import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-violet-200 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-white">MNR IT Management</h1>
            <nav className="flex gap-6">
              <button onClick={() => navigate('/')} className="text-white/90 hover:text-white">Dashboard</button>
              <button onClick={() => navigate('/accessories')} className="text-white/90 hover:text-white">Assets</button>
              <button onClick={() => navigate('/departments')} className="text-white/90 hover:text-white">Departments</button>
              <button onClick={() => navigate('/profile')} className="text-white/90 hover:text-white">Users</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-8rem)] p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 px-8 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-center space-x-4">
          <div className="h-0.5 w-24 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full animate-pulse" />
          <p className="text-sm font-medium text-white/90">
            Created with ❤️ by{" "}
            <span className="font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              IT Team, MNR Sweaters Ltd.
            </span>
          </p>
          <div className="h-0.5 w-24 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full animate-pulse" />
        </div>
      </footer>
    </div>
  );
}
