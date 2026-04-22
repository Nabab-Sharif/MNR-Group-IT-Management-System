import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, ArrowLeft } from "lucide-react";
import dbService from "@/services/dbService";

interface NVR {
  id: number;
  nvr_number: string;
  name: string;
  total_cameras: number;
  created_at: string;
}

interface FilteredPrintHistory {
  id: number;
  printed_at: string;
  filter_date_from: string;
  filter_date_to: string;
  nvr_id?: number;
  total_checklists_printed: number;
}

const PrintHistory = () => {
  const navigate = useNavigate();
  const [printHistory, setPrintHistory] = useState<FilteredPrintHistory[]>([]);
  const [nvrs, setNvrs] = useState<NVR[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load NVRs
      const allNvrs = await dbService.getNVRs();
      setNvrs(allNvrs);

      // Load print history from localStorage
      const saved = localStorage.getItem('cctv_filtered_print_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const sorted = [...parsed].sort((a: FilteredPrintHistory, b: FilteredPrintHistory) => 
            new Date(b.printed_at).getTime() - new Date(a.printed_at).getTime()
          );
          setPrintHistory(sorted);
        } catch (e) {
          console.error('Failed to load print history:', e);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeAgoText = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="w-full mx-auto px-4">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cctv-checklist")}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Printer className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Print History</h1>
              <p className="text-slate-400">All CCTV checklist print records</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600/30 via-blue-600/10 to-blue-700/5 border-blue-500/50 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:border-blue-500/70 group">
            <CardContent className="p-7">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-slate-300 text-xs font-semibold tracking-wide uppercase">Total Prints</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-blue-200 bg-clip-text text-transparent">{printHistory.length}</p>
                  <p className="text-xs text-blue-400/70 mt-1">print events recorded</p>
                </div>
                <div className="text-6xl opacity-10 group-hover:opacity-20 transition-opacity">📋</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/30 via-green-600/10 to-green-700/5 border-green-500/50 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-300 hover:border-green-500/70 group">
            <CardContent className="p-7">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-slate-300 text-xs font-semibold tracking-wide uppercase">Checklists Printed</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-300 to-green-200 bg-clip-text text-transparent">
                    {printHistory.reduce((sum, h) => sum + (h.total_checklists_printed || 0), 0)}
                  </p>
                  <p className="text-xs text-green-400/70 mt-1">total checklists</p>
                </div>
                <div className="text-6xl opacity-10 group-hover:opacity-20 transition-opacity">✓</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/30 via-purple-600/10 to-purple-700/5 border-purple-500/50 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 hover:border-purple-500/70 group">
            <CardContent className="p-7">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-slate-300 text-xs font-semibold tracking-wide uppercase">Last Print</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-purple-200 bg-clip-text text-transparent">
                    {printHistory.length > 0 ? getTimeAgoText(printHistory[0].printed_at) : "Never"}
                  </p>
                  {printHistory.length > 0 && (
                    <p className="text-xs text-purple-400/70 mt-1">{formatDate(printHistory[0].printed_at)}</p>
                  )}
                </div>
                <div className="text-6xl opacity-10 group-hover:opacity-20 transition-opacity">⏱</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Print History Table */}
        <Card className="bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/40 border-slate-700/60 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-8">
            {printHistory.length > 0 ? (
              <div className="rounded-xl border border-slate-700/80 overflow-hidden shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-700/80 bg-gradient-to-r from-slate-800/80 to-slate-800/40 hover:bg-slate-800/60">
                      <TableHead className="text-slate-200 font-bold text-xs tracking-wider">Print Date & Time</TableHead>
                      <TableHead className="text-slate-200 font-bold text-xs tracking-wider">Filter Range</TableHead>
                      <TableHead className="text-slate-200 font-bold text-xs tracking-wider">NVR</TableHead>
                      <TableHead className="text-slate-200 font-bold text-xs tracking-wider">Checklists</TableHead>
                      <TableHead className="text-slate-200 font-bold text-xs tracking-wider">Time Ago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printHistory.map((history, index) => {
                      const nvr = nvrs.find(n => n.id === history.nvr_id);
                      return (
                        <TableRow 
                          key={history.id} 
                          className="border-b border-slate-700/50 hover:bg-slate-800/40 transition-all duration-200 group"
                        >
                          <TableCell className="font-medium text-slate-100 group-hover:text-white py-4">
                            <div>
                              <p className="font-semibold">{formatDate(history.printed_at)}</p>
                              <p className="text-xs text-slate-400 group-hover:text-slate-300">
                                {formatDateTime(history.printed_at)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-200 group-hover:text-slate-100 py-4">
                            <div className="text-sm space-y-1">
                              <p className="font-semibold text-slate-100">
                                {history.filter_date_from === "any" ? "📅 From Start" : formatDate(history.filter_date_from)}
                              </p>
                              <p className="text-xs text-slate-400 group-hover:text-slate-300">
                                → {history.filter_date_to === "any" ? "Now" : formatDate(history.filter_date_to)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-200 py-4">
                            {nvr ? (
                              <div className="font-medium space-y-1">
                                <p className="font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">🖥 NVR-{nvr.nvr_number}</p>
                                <p className="text-xs text-slate-400 group-hover:text-slate-300">{nvr.name}</p>
                              </div>
                            ) : (
                              <p className="text-slate-400">
                                {history.nvr_id ? `NVR ID: ${history.nvr_id}` : "🔄 All NVRs"}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-200 py-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-300 rounded-lg font-semibold border border-blue-500/30 group-hover:border-blue-500/50 transition-colors">
                              ✓ {history.total_checklists_printed}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <span className="text-sm font-medium">{getTimeAgoText(history.printed_at)}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-slate-800/50 rounded-full">
                    <Printer className="h-12 w-12 text-slate-500" />
                  </div>
                </div>
                <p className="text-slate-300 text-lg mb-2 font-semibold">No print history yet</p>
                <p className="text-slate-400 text-sm">Start printing CCTV checklists to see records here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrintHistory;
