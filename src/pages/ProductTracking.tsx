import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/card";
import { Package, Search, Filter, BarChart2 } from "lucide-react";

export default function ProductTracking() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-20">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-2xl shadow-xl mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Product Tracking</h1>
          <p className="text-white/80">Monitor and track products across all units</p>
          
          <div className="mt-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
              <input 
                type="text"
                placeholder="Search products..."
                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {['Total Products', 'In Production', 'Shipped', 'Delivered'].map((stat, i) => (
            <Card key={i} className="bg-white/5 border-white/10 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-white/60">{stat}</p>
                  <p className="text-2xl font-bold text-white mt-1">1,234</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                  <Package className="h-5 w-5 text-indigo-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">+12.5%</span>
                <span className="text-sm text-white/40">from last month</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Product Table */}
        <Card className="bg-white/5 border-white/10">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Products</h2>
            <table className="w-full">
              <thead>
                <tr className="text-white/60 text-sm">
                  <th className="text-left pb-4">Product ID</th>
                  <th className="text-left pb-4">Name</th>
                  <th className="text-left pb-4">Status</th>
                  <th className="text-left pb-4">Location</th>
                  <th className="text-right pb-4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {[1,2,3,4,5].map(i => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-4">PRD-{i}234</td>
                    <td>Product Name {i}</td>
                    <td>
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs">
                        In Production
                      </span>
                    </td>
                    <td>Unit {i}</td>
                    <td className="text-right text-sm text-white/60">2 hours ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
