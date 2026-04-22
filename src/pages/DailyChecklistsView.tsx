import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Server,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import dbService from "@/services/dbService";

interface NVRCamera {
  id: number;
  camera_id: string;
  location_name: string;
  camera_position: string;
  camera_recordings: string;
  clear_vision: string;
  remarks: string;
}

interface DailyChecklist {
  id: number;
  nvr_id: number;
  date: string;
  cameras: NVRCamera[];
  checked_by: string;
  verified_by: string;
  approved_by: string;
  created_at: string;
  last_printed_at?: string;
}

interface NVR {
  id: number;
  nvr_number: string;
  name: string;
  total_cameras: number;
  cameras: NVRCamera[];
  created_at: string;
}

const ITEMS_PER_PAGE = 15;

interface LocationState {
  nvrId?: number;
}

const DailyChecklistsView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<DailyChecklist[]>([]);
  const [nvrs, setNvrs] = useState<NVR[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNvr, setSelectedNvr] = useState<NVR | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<DailyChecklist | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; checklistId: number | null; date: string }>({
    open: false,
    checklistId: null,
    date: "",
  });

  const [printHeader, setPrintHeader] = useState({
    companyName: "MNR Sweaters Ltd.",
    reportTitle: "Daily Camera Check & Maintenance Report",
    nvrFontSize: 10,
  });

  useEffect(() => {
    loadData();
    loadPrintHeaderSettings();
    
    // Get NVR ID from location state if available
    const state = location.state as LocationState;
    if (state?.nvrId) {
      // Will be used after nvrs load
    }
  }, []);

  // Set selected NVR after loading data
  useEffect(() => {
    if (nvrs.length > 0) {
      const state = location.state as LocationState;
      if (state?.nvrId) {
        const nvr = nvrs.find(n => n.id === state.nvrId);
        if (nvr) {
          setSelectedNvr(nvr);
        }
      }
    }
  }, [nvrs]);

  const loadData = async () => {
    try {
      const nvrsData = await dbService.getNVRs();
      const checklistsData = await dbService.getCCTVChecklists();
      setNvrs(nvrsData || []);
      setChecklists(checklistsData || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    }
  };

  const loadPrintHeaderSettings = () => {
    const saved = localStorage.getItem('cctv_print_header');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setPrintHeader((prev) => ({ ...prev, ...parsed }));
    } catch (e) {
      console.error('Failed to load print header settings:', e);
    }
  };

  // Get checklists for selected NVR or all NVRs
  const getNvrChecklists = () => {
    let filtered = selectedNvr 
      ? checklists.filter(c => c.nvr_id === selectedNvr.id)
      : checklists; // If no NVR selected, show all checklists

    if (filterDateFrom) {
      filtered = filtered.filter(c => c.date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter(c => c.date <= filterDateTo);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredChecklists = getNvrChecklists();
  const totalPages = Math.ceil(filteredChecklists.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedChecklists = filteredChecklists.slice(startIndex, endIndex);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleViewChecklist = (checklist: DailyChecklist) => {
    setSelectedChecklist(checklist);
    setIsViewDialogOpen(true);
  };

  const handleDeleteChecklist = (id: number, date: string) => {
    setDeleteConfirmDialog({
      open: true,
      checklistId: id,
      date: formatDate(date),
    });
  };

  const confirmDeleteChecklist = async () => {
    if (!deleteConfirmDialog.checklistId) return;

    try {
      await dbService.deleteCCTVChecklist(deleteConfirmDialog.checklistId);
      await loadData();
      toast({ title: "Success", description: "Checklist has been deleted successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete checklist.", variant: "destructive" });
    }

    setDeleteConfirmDialog({ open: false, checklistId: null, date: "" });
  };

  const handlePrintChecklist = (checklist: DailyChecklist) => {
    const printNvr = selectedNvr || nvrs.find(n => n.id === checklist.nvr_id);
    if (!printNvr) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const camerasToShow = [...checklist.cameras];
    while (camerasToShow.length < 32) {
      camerasToShow.push({
        id: camerasToShow.length + 1,
        camera_id: `D${camerasToShow.length + 1}`,
        location_name: "",
        camera_position: "",
        camera_recordings: "",
        clear_vision: "",
        remarks: "",
      });
    }

    const cameraRows = camerasToShow.slice(0, 32).map((cam, idx) => `
      <tr style="height: 18px;">
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: 9px;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-weight: bold; font-size: 9px;">${cam.camera_id}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: left; font-size: 9px;">${cam.location_name || "Nil"}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: 9px;">${cam.camera_position}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: 9px;">${cam.camera_recordings}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: 9px;">${cam.clear_vision}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: left; font-size: 9px;">${cam.remarks || ""}</td>
      </tr>
    `).join("");

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CCTV Checklist</title>
          <style>
            @page { size: A4; margin: 5mm; }
            @media print {
              html, body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 9px; padding: 0.5mm; position: relative; min-height: 296.5mm; }
            .header { text-align: center; margin-bottom: 0.5mm; }
            .header img { height: 35px; }
            .header h1 { font-size: 13px; color: #1a365d; margin: 0px 0; }
            .header h2 { font-size: 10px; margin: 0px 0; }
            .info-row { display: flex; justify-content: space-between; font-weight: bold; margin: 0.5mm 0; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th { background: #e8e8e8; border: 1px solid #000; padding: 2px; font-weight: bold; font-size: 8px; }
            .signature-section { 
              display: flex; justify-content: space-between; 
              position: absolute; bottom: 0.5mm; left: 5mm; right: 5mm;
            }
            .sig-block { text-align: center; flex: 1; padding: 0 8px; }
            .sig-space { height: 20px; margin-bottom: 3px; }
            .sig-name { font-size: 7px; color: #444; margin-top: 1px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${printHeader.companyName}</h1>
            <h2>${printHeader.reportTitle}</h2>
            <div style="font-size: ${printHeader.nvrFontSize}px; font-weight: bold; margin-top: 3px;">NVR-${printNvr.nvr_number}</div>
          </div>
          <div class="info-row">
            <span></span>
            <span>Date: ${formatDate(checklist.date)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">SL</th>
                <th style="width: 50px;">Camera ID</th>
                <th>Location Name</th>
                <th style="width: 55px;">Position</th>
                <th style="width: 55px;">Recording</th>
                <th style="width: 50px;">Vision</th>
                <th style="width: 100px;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${cameraRows}
            </tbody>
          </table>
          <div class="signature-section">
            <div class="sig-block">
              <div class="sig-space"></div>
              <div class="sig-name" style="font-weight: bold;">${checklist.checked_by}</div>
            </div>
            <div class="sig-block">
              <div class="sig-space"></div>
              <div class="sig-name" style="font-weight: bold;">${checklist.verified_by}</div>
            </div>
            <div class="sig-block">
              <div class="sig-space"></div>
              <div class="sig-name" style="font-weight: bold;">${checklist.approved_by}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    const now = new Date().toISOString();
    dbService.updateCCTVChecklist(checklist.id, {
      ...checklist,
      last_printed_at: now,
    }).then(() => {
      loadData();
    }).catch((error) => {
      console.error('Failed to update print date:', error);
    });
  };

  // Statistics
  const stats = {
    totalReports: filteredChecklists.length,
    okReports: filteredChecklists.filter(checklist =>
      checklist.cameras.every(cam =>
        cam.camera_position === "OK" &&
        cam.camera_recordings === "OK" &&
        cam.clear_vision === "OK"
      )
    ).length,
    issuesCount: filteredChecklists.reduce((count, checklist) => {
      const issues = checklist.cameras.filter(cam =>
        cam.camera_position === "NOT OK" ||
        cam.camera_recordings === "NOT OK" ||
        cam.clear_vision === "NOT OK"
      );
      return count + issues.length;
    }, 0),
  };

  if (!nvrs || nvrs.length === 0) {
    return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <Button variant="outline" onClick={() => navigate('/cctv-checklist')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <Server className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No NVRs Found</h3>
            <p className="text-muted-foreground">Create an NVR first to view daily checklists</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/cctv-checklist')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Daily Checklists {selectedNvr && `- NVR-${selectedNvr.nvr_number}`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedNvr ? selectedNvr.name || "Daily camera check reports" : "All daily camera check reports"}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-muted-foreground text-sm">Total Reports</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div>
                <p className="text-muted-foreground text-sm">OK Reports</p>
                <p className="text-3xl font-bold text-green-600">{stats.okReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-10 w-10 text-orange-500" />
              <div>
                <p className="text-muted-foreground text-sm">Issues</p>
                <p className="text-3xl font-bold text-orange-600">{stats.issuesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card className="bg-gradient-to-r from-muted/50 to-muted/30 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Filter by NVR</Label>
              <Select value={selectedNvr?.id.toString() || "all"} onValueChange={(v) => {
                if (v === "all") {
                  setSelectedNvr(null);
                } else {
                  const nvr = nvrs.find(n => n.id === parseInt(v));
                  if (nvr) setSelectedNvr(nvr);
                }
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="All NVRs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All NVRs</SelectItem>
                  {nvrs.map(nvr => (
                    <SelectItem key={nvr.id} value={nvr.id.toString()}>
                      NVR-{nvr.nvr_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40 h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40 h-9"
              />
            </div>

            {(filterDateFrom || filterDateTo) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setCurrentPage(1);
                }}
                className="h-9"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Daily Reports ({stats.totalReports})
          </CardTitle>
          <CardDescription>
            Showing {paginatedChecklists.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredChecklists.length)} of {filteredChecklists.length} reports (Page {currentPage} of {totalPages || 1})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paginatedChecklists.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!selectedNvr && <TableHead>NVR</TableHead>}
                    <TableHead>Date</TableHead>
                    <TableHead>Total Cameras</TableHead>
                    <TableHead>Checked By</TableHead>
                    
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedChecklists.map((checklist) => {
                    const hasIssues = checklist.cameras.some(cam =>
                      cam.camera_position === "NOT OK" ||
                      cam.camera_recordings === "NOT OK" ||
                      cam.clear_vision === "NOT OK"
                    );
                    const nvrForChecklist = nvrs.find(n => n.id === checklist.nvr_id);
                    return (
                      <TableRow key={checklist.id}>
                        {!selectedNvr && <TableCell className="font-medium">{nvrForChecklist ? `NVR-${nvrForChecklist.nvr_number}` : `NVR-${checklist.nvr_id}`}</TableCell>}
                        <TableCell className="font-medium">{formatDate(checklist.date)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{checklist.cameras?.length || 0}</Badge>
                        </TableCell>
                        <TableCell>{checklist.checked_by}</TableCell>
                        <TableCell>
                          {checklist.last_printed_at ? (
                            <div className="text-sm">
                              <div className="font-medium">{formatDate(checklist.last_printed_at)}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(checklist.last_printed_at).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline">Not Printed</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasIssues ? (
                            <Badge variant="destructive" className="text-xs">With Issues</Badge>
                          ) : (
                            <Badge className="bg-green-500 text-xs">All OK</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewChecklist(checklist)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintChecklist(checklist)}
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteChecklist(checklist.id, checklist.date)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No checklists found.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 py-1">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Checklist Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Checklist Details
            </DialogTitle>
            <DialogDescription>
              Date: {selectedChecklist && formatDate(selectedChecklist.date)}
            </DialogDescription>
          </DialogHeader>

          {selectedChecklist && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Checked By</p>
                  <p className="font-semibold">{selectedChecklist.checked_by}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verified By</p>
                  <p className="font-semibold">{selectedChecklist.verified_by}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approved By</p>
                  <p className="font-semibold">{selectedChecklist.approved_by}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SL</TableHead>
                      <TableHead>Camera ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Recording</TableHead>
                      <TableHead>Vision</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedChecklist.cameras.map((cam, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-center">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{cam.camera_id}</TableCell>
                        <TableCell>{cam.location_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={cam.camera_position === "OK" ? "default" : "destructive"}>
                            {cam.camera_position || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cam.camera_recordings === "OK" ? "default" : "destructive"}>
                            {cam.camera_recordings || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cam.clear_vision === "OK" ? "default" : "destructive"}>
                            {cam.clear_vision || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{cam.remarks || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirmDialog({ open: false, checklistId: null, date: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Checklist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the checklist for {deleteConfirmDialog.date}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialog({ open: false, checklistId: null, date: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteChecklist}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyChecklistsView;
