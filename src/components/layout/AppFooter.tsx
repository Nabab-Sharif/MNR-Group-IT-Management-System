import { Heart } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-t border-white/20">
        <div className="max-w-7xl mx-auto py-4 backdrop-blur-xl bg-white/5">
          <div className="flex items-center justify-center gap-6">
            {/* Left Decoration */}
            <div className="h-px w-20 bg-gradient-to-r from-blue-400/40 to-transparent"></div>

            {/* Main Content */}
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 flex items-center gap-2">
                <span className="text-white/70 text-sm">Created with</span>
                <Heart className="h-4 w-4 text-pink-400 fill-pink-400 animate-pulse" />
                <span className="text-white font-medium text-sm">by IT Team</span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <span className="text-white/60 text-sm font-medium">MNR Sweaters Ltd.</span>
            </div>

            {/* Right Decoration */}
            <div className="h-px w-20 bg-gradient-to-l from-purple-400/40 to-transparent"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
