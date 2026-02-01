import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Camera, Plus, Edit, Trash2, ArrowLeft, Printer, Calendar, Eye, Server, ClipboardCheck, Settings2, Type, Columns, WrapText, Merge, FileSpreadsheet, Search, Filter, X, SplitSquareHorizontal, AlertTriangle, CheckCircle, Download, Upload } from "lucide-react";
import dbService from "@/services/dbService";
import CCTVChecklistPrintCard from "@/components/CCTVChecklistPrintCard";

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
}

interface NVR {
  id: number;
  nvr_number: string;
  name: string;
  total_cameras: number;
  cameras: NVRCamera[];
  created_at: string;
}

interface ColumnSettings {
  sl: number;
  cameraId: number;
  locationName: number;
  cameraPosition: number;
  cameraRecordings: number;
  clearVision: number;
  remarks: number;
}

interface MergedCell {
  startRow: number;
  endRow: number;
  column: keyof ColumnSettings | 'sl';
}

interface CameraIssue {
  nvr_number: string;
  nvr_id: number;
  camera_id: string;
  date: string;
  issue_type: string;
  location: string;
}

const CCTVCheckList = () => {
  const { toast } = useToast();
  const [nvrs, setNvrs] = useState<NVR[]>([]);
  const [checklists, setChecklists] = useState<DailyChecklist[]>([]);
  const [selectedNvr, setSelectedNvr] = useState<NVR | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<DailyChecklist | null>(null);
  const [isNvrDialogOpen, setIsNvrDialogOpen] = useState(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [isViewChecklistOpen, setIsViewChecklistOpen] = useState(false);
  const [isIssuesViewOpen, setIsIssuesViewOpen] = useState(false);
  const [editingNvr, setEditingNvr] = useState<NVR | null>(null);
  const [editingCameraIndex, setEditingCameraIndex] = useState<number | null>(null);

  // Delete confirmation state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; checklistId: number | null; date: string }>({
    open: false,
    checklistId: null,
    date: "",
  });

  // Filter & Search states
  const [searchNvr, setSearchNvr] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterNvrNumber, setFilterNvrNumber] = useState("all");

  // Row merge states
  const [mergedCells, setMergedCells] = useState<MergedCell[]>([]);
  const [selectedCellsForMerge, setSelectedCellsForMerge] = useState<{ row: number; column: string }[]>([]);
  const [isMergeMode, setIsMergeMode] = useState(false);

  // Excel-like settings
  const [fontSize, setFontSize] = useState(12);
  const [wordWrap, setWordWrap] = useState(true);
  const [rowHeight, setRowHeight] = useState(32);
  const [showSettings, setShowSettings] = useState(false);
  const [columnWidths, setColumnWidths] = useState<ColumnSettings>({
    sl: 35,
    cameraId: 65,
    locationName: 220,
    cameraPosition: 70,
    cameraRecordings: 75,
    clearVision: 65,
    remarks: 200,
  });

  // Print header settings (editable in view)
  const [printHeader, setPrintHeader] = useState({
    companyName: "MNR Sweaters Ltd.",
    reportTitle: "Daily Camera Check & Maintenance Report",
    companyFontSize: 12,
    reportFontSize: 9,
    nvrFontSize: 10,
    signatureTopMargin: 6,
    signatureLineHeight: 18,
  });

  const [nvrFormData, setNvrFormData] = useState({
    nvr_number: "",
    name: "",
    total_cameras: 32,
  });

  const [cameraFormData, setCameraFormData] = useState({
    camera_id: "",
    location_name: "",
    camera_position: "OK",
    camera_recordings: "OK",
    clear_vision: "OK",
    remarks: "",
  });

  const [checklistFormData, setChecklistFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    checked_by: "Officer(IT)",
    verified_by: "Asst. Manager(IT)",
    approved_by: "Head Of HR,Admin",
  });

  const [checklistCameras, setChecklistCameras] = useState<NVRCamera[]>([]);

  // Resizable columns
  const resizingColumn = useRef<string | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    loadData();
    loadExcelSettings();
    loadPrintHeaderSettings();
  }, []);

  // Load saved excel settings from localStorage
  const loadExcelSettings = () => {
    const savedSettings = localStorage.getItem('cctv_excel_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (parsed.wordWrap !== undefined) setWordWrap(parsed.wordWrap);
        if (parsed.rowHeight) setRowHeight(parsed.rowHeight);
        if (parsed.columnWidths) setColumnWidths(parsed.columnWidths);
        if (parsed.mergedCells) setMergedCells(parsed.mergedCells);
      } catch (e) {
        console.error('Failed to load excel settings:', e);
      }
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

  // Save excel settings when they change
  const saveExcelSettings = () => {
    const settings = {
      fontSize,
      wordWrap,
      rowHeight,
      columnWidths,
      mergedCells,
    };
    localStorage.setItem('cctv_excel_settings', JSON.stringify(settings));
  };

  const savePrintHeaderSettings = () => {
    localStorage.setItem('cctv_print_header', JSON.stringify(printHeader));
  };

  // Auto-save when settings change
  useEffect(() => {
    saveExcelSettings();
  }, [fontSize, wordWrap, rowHeight, columnWidths, mergedCells]);

  useEffect(() => {
    savePrintHeaderSettings();
  }, [printHeader]);

  // Auto-apply logic: if location name has content, set dropdowns to OK
  useEffect(() => {
    const updatedCameras = checklistCameras.map(cam => {
      if (cam.location_name && cam.location_name.trim() !== "") {
        return {
          ...cam,
          camera_position: cam.camera_position === "Nil" ? "OK" : cam.camera_position,
          camera_recordings: cam.camera_recordings === "Nil" ? "OK" : cam.camera_recordings,
          clear_vision: cam.clear_vision === "Nil" ? "OK" : cam.clear_vision,
        };
      }
      return cam;
    });
    
    // Only update if something changed
    const hasChanges = updatedCameras.some((cam, idx) => 
      cam.camera_position !== checklistCameras[idx].camera_position ||
      cam.camera_recordings !== checklistCameras[idx].camera_recordings ||
      cam.clear_vision !== checklistCameras[idx].clear_vision
    );
    
    if (hasChanges) {
      setChecklistCameras(updatedCameras);
    }
  }, [isChecklistDialogOpen || isViewChecklistOpen]);

  const loadData = async () => {
    const nvrsData = await dbService.getNVRs();
    const checklistsData = await dbService.getCCTVChecklists();
    setNvrs(nvrsData || []);
    setChecklists(checklistsData || []);
  };

  // Calculate NVR stats from checklists
  const getNVRStats = () => {
    let totalCameras = 0;
    const issues: CameraIssue[] = [];

    nvrs.forEach(nvr => {
      totalCameras += nvr.cameras?.length || 0;
    });

    // Get latest checklist for each NVR and count issues
    checklists.forEach(checklist => {
      const nvr = nvrs.find(n => n.id === checklist.nvr_id);
      if (!nvr) return;

      checklist.cameras.forEach(cam => {
        const hasIssue = cam.camera_position === "NOT OK" ||
          cam.camera_recordings === "NOT OK" ||
          cam.clear_vision === "NOT OK";

        if (hasIssue) {
          const issueTypes: string[] = [];
          if (cam.camera_position === "NOT OK") issueTypes.push("Position");
          if (cam.camera_recordings === "NOT OK") issueTypes.push("Recording");
          if (cam.clear_vision === "NOT OK") issueTypes.push("Vision");

          issues.push({
            nvr_number: nvr.nvr_number,
            nvr_id: nvr.id,
            camera_id: cam.camera_id,
            date: checklist.date,
            issue_type: issueTypes.join(", "),
            location: cam.location_name || "-",
          });
        }
      });
    });

    // Get unique issues (latest per camera)
    const uniqueIssues: CameraIssue[] = [];
    const seenCameras = new Set<string>();

    // Sort by date descending to get latest first
    const sortedIssues = [...issues].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedIssues.forEach(issue => {
      const key = `${issue.nvr_id}-${issue.camera_id}`;
      if (!seenCameras.has(key)) {
        seenCameras.add(key);
        uniqueIssues.push(issue);
      }
    });

    // Get active cameras (OK in latest checklist)
    let activeCameras = 0;
    nvrs.forEach(nvr => {
      const nvrChecklists = checklists.filter(c => c.nvr_id === nvr.id);
      if (nvrChecklists.length > 0) {
        const latestChecklist = nvrChecklists.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        latestChecklist.cameras.forEach(cam => {
          const isOk = cam.camera_position === "OK" &&
            cam.camera_recordings === "OK" &&
            cam.clear_vision === "OK";
          if (isOk) activeCameras++;
        });
      }
    });

    return {
      totalNVRCameras: totalCameras,
      withIssues: uniqueIssues.length,
      activeCameras,
      issues: uniqueIssues,
    };
  };

  const nvrStats = getNVRStats();

  const handleMouseDown = (e: React.MouseEvent, column: keyof ColumnSettings) => {
    resizingColumn.current = column;
    startX.current = e.clientX;
    startWidth.current = columnWidths[column];
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingColumn.current) return;
    const diff = e.clientX - startX.current;
    const newWidth = Math.max(30, startWidth.current + diff);
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn.current!]: newWidth,
    }));
  };

  const handleMouseUp = () => {
    resizingColumn.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Filter logic for checklists
  const getFilteredChecklists = (nvrId?: number) => {
    let filtered = nvrId ? checklists.filter(c => c.nvr_id === nvrId) : checklists;

    if (filterDateFrom) {
      filtered = filtered.filter(c => c.date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter(c => c.date <= filterDateTo);
    }
    if (filterNvrNumber && filterNvrNumber !== "all") {
      filtered = filtered.filter(c => {
        const nvr = nvrs.find(n => n.id === c.nvr_id);
        return nvr?.nvr_number === filterNvrNumber;
      });
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Filter NVRs by search
  const getFilteredNvrs = () => {
    if (!searchNvr) return nvrs;
    return nvrs.filter(nvr =>
      nvr.nvr_number.toLowerCase().includes(searchNvr.toLowerCase()) ||
      nvr.name?.toLowerCase().includes(searchNvr.toLowerCase())
    );
  };

  // Merge cell functions
  const handleCellClickForMerge = (row: number, column: string) => {
    if (!isMergeMode) return;

    const existingIndex = selectedCellsForMerge.findIndex(c => c.row === row && c.column === column);
    if (existingIndex >= 0) {
      setSelectedCellsForMerge(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedCellsForMerge(prev => [...prev, { row, column }]);
    }
  };

  const handleMergeCells = () => {
    if (selectedCellsForMerge.length < 2) {
      toast({ title: "Error", description: "Select at least 2 cells to merge", variant: "destructive" });
      return;
    }

    const columns = [...new Set(selectedCellsForMerge.map(c => c.column))];
    if (columns.length !== 1) {
      toast({ title: "Error", description: "All selected cells must be in the same column", variant: "destructive" });
      return;
    }

    const rows = selectedCellsForMerge.map(c => c.row).sort((a, b) => a - b);
    const startRow = rows[0];
    const endRow = rows[rows.length - 1];

    // Check if consecutive
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] !== rows[i - 1] + 1) {
        toast({ title: "Error", description: "Selected cells must be consecutive rows", variant: "destructive" });
        return;
      }
    }

    const column = columns[0];
    
    // Check for overlapping merges
    const hasOverlap = mergedCells.some(m =>
      m.column === column &&
      !((endRow < m.startRow) || (startRow > m.endRow))
    );

    if (hasOverlap) {
      toast({ title: "Error", description: "Cannot merge: overlaps with existing merged cells", variant: "destructive" });
      return;
    }

    setMergedCells(prev => [...prev, { startRow, endRow, column }]);
    setSelectedCellsForMerge([]);
    setIsMergeMode(false);
    toast({ title: "Success", description: `Merged ${endRow - startRow + 1} cells` });
  };

  const handleUnmergeAll = () => {
    setMergedCells([]);
    toast({ title: "Success", description: "All cells unmerged" });
  };

  const isCellMerged = (row: number, column: string) => {
    return mergedCells.find(m => m.column === column && row >= m.startRow && row <= m.endRow);
  };

  const isMergedRowToSkip = (row: number, column: string) => {
    const merge = isCellMerged(row, column);
    if (!merge) return false;
    return row !== merge.startRow;
  };

  const getRowSpan = (row: number, column: string) => {
    const merge = isCellMerged(row, column);
    if (!merge || row !== merge.startRow) return 1;
    return merge.endRow - merge.startRow + 1;
  };

  const getMergeRowSpan = (row: number, column: string) => {
    const merge = isCellMerged(row, column);
    if (!merge || row !== merge.startRow) return 1;
    return merge.endRow - merge.startRow + 1;
  };

  const isCellSelectedForMerge = (row: number, column: string) => {
    return selectedCellsForMerge.some(c => c.row === row && c.column === column);
  };

  // Print filtered checklists
  const handlePrintFilteredChecklists = () => {
    const filtered = getFilteredChecklists();
    if (filtered.length === 0) {
      toast({ title: "No Checklists", description: "No checklists match the current filters.", variant: "destructive" });
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const formatDateStr = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const pages = filtered.map(checklist => {
      const nvr = nvrs.find(n => n.id === checklist.nvr_id);
      // Get merges for this specific checklist
      const checklistMerges = (checklist as any).mergedCells || [];
      const cameraRows = checklist.cameras.map((cam, idx) => {
        // Check if this row is part of a merge and not the first row
        const isMergedRow = checklistMerges.some(m =>
          m.column === 'remarks' &&
          idx >= m.startRow &&
          idx <= m.endRow &&
          idx !== m.startRow
        );

        let remarksRowSpan = 1;
        const merge = checklistMerges.find(m =>
          m.column === 'remarks' &&
          idx >= m.startRow &&
          idx <= m.endRow &&
          idx === m.startRow
        );
        if (merge) {
          remarksRowSpan = merge.endRow - merge.startRow + 1;
        }

        if (isMergedRow) {
          // Render row with all data except remarks cell (which spans from first row)
          return `
        <tr style="height: ${rowHeight}px;">
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.sl}px; font-size: ${fontSize}px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.cameraId}px; font-weight: bold; font-size: ${fontSize}px;">${cam.camera_id}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: left; width: ${columnWidths.locationName}px; font-size: ${fontSize}px;">${cam.location_name || "Nil"}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.cameraPosition}px; font-size: ${fontSize}px;">${cam.camera_position}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.cameraRecordings}px; font-size: ${fontSize}px;">${cam.camera_recordings}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.clearVision}px; font-size: ${fontSize}px;">${cam.clear_vision}</td>
        </tr>
      `;
        }

        return `
        <tr style="height: ${rowHeight}px;">
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.sl}px; font-size: ${fontSize}px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.cameraId}px; font-weight: bold; font-size: ${fontSize}px;">${cam.camera_id}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: left; width: ${columnWidths.locationName}px; font-size: ${fontSize}px;">${cam.location_name || "Nil"}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.cameraPosition}px; font-size: ${fontSize}px;">${cam.camera_position}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.cameraRecordings}px; font-size: ${fontSize}px;">${cam.camera_recordings}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; width: ${columnWidths.clearVision}px; font-size: ${fontSize}px;">${cam.clear_vision}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: left; width: ${columnWidths.remarks}px; font-size: ${fontSize}px;" rowspan="${remarksRowSpan}">${cam.remarks || ""}</td>
        </tr>
      `;
      }).join("");

      return `
        <div class="page">
          <div class="header">
            <img src="/logo/logo_1.png" alt="MNR Logo" />
            <h1>${printHeader.companyName}</h1>
            <h2>${printHeader.reportTitle}</h2>
            <div style="font-size: ${printHeader.nvrFontSize}px; font-weight: bold; margin-top: 2px;">NVR-${nvr?.nvr_number || checklist.nvr_id}</div>
          </div>
          <div class="info-row">
            <span></span>
            <span>Date: ${formatDateStr(checklist.date)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: ${columnWidths.sl}px;">SL</th>
                <th style="width: ${columnWidths.cameraId}px;">Camera ID</th>
                <th style="width: ${columnWidths.locationName}px;">Location Name</th>
                <th style="width: ${columnWidths.cameraPosition}px;">Camera Position</th>
                <th style="width: ${columnWidths.cameraRecordings}px;">Camera Recordings</th>
                <th style="width: ${columnWidths.clearVision}px;">Clear Vision</th>
                <th style="width: ${columnWidths.remarks}px;">Remarks</th>
              </tr>
            </thead>
            <tbody>${cameraRows}</tbody>
          </table>
          <div class="signature-section">
            <div class="sig-block"><div class="sig-name" style="font-weight: bold; font-size: ${fontSize}px;">${checklist.checked_by}</div></div>
            <div class="sig-block"><div class="sig-name" style="font-weight: bold; font-size: ${fontSize}px;">${checklist.verified_by}</div></div>
            <div class="sig-block"><div class="sig-name" style="font-weight: bold; font-size: ${fontSize}px;">${checklist.approved_by}</div></div>
          </div>
        </div>
      `;
    }).join("");

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Filtered CCTV Checklists</title>
          <style>
            @page { size: A4; margin: 5mm; }
            @media print { html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 9px; }
            .page { padding: 0.5mm 1mm; page-break-after: always; width: 210mm; min-height: 296.5mm; max-height: 297mm; overflow: hidden; }
            .page:last-child { page-break-after: auto; }
            .header { text-align: center; margin-bottom: 0.5mm; }
            .header img { height: 30px; }
            .header h1 { font-size: ${printHeader.companyFontSize}px; color: #1a365d; margin: 0px 0; }
            .header h2 { font-size: ${printHeader.reportFontSize}px; margin: 0px 0; }
            .info-row { display: flex; justify-content: space-between; font-weight: bold; margin: 0.5mm 0; font-size: 9px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th { background: #e8e8e8; border: 1px solid #000; padding: 1px; font-weight: bold; font-size: 7px; }
            .signature-section { display: flex; justify-content: space-between; position: absolute; bottom: 1mm; left: 2mm; right: 2mm; width: calc(100% - 4mm); }
            .sig-block { text-align: center; flex: 1; padding: 0 6px; }
            .sig-space { height: ${printHeader.signatureLineHeight}px; margin-bottom: 2px; }
            .sig-label { font-size: 7px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; }
            .sig-name { font-size: 6px; color: #444; margin-top: 1px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; }
            .page { position: relative; }
          </style>
        </head>
        <body>${pages}</body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const clearFilters = () => {
    setSearchNvr("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterNvrNumber("all");
  };

  const handleNvrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNvr) {
        await dbService.updateNVR(editingNvr.id, nvrFormData);
        toast({ title: "NVR Updated", description: "NVR has been updated successfully." });
      } else {
        const defaultCameras: NVRCamera[] = [];
        for (let i = 1; i <= nvrFormData.total_cameras; i++) {
          defaultCameras.push({
            id: i,
            camera_id: `D${i}`,
            location_name: "",
            camera_position: "OK",
            camera_recordings: "OK",
            clear_vision: "OK",
            remarks: "",
          });
        }
        await dbService.addNVR({ ...nvrFormData, cameras: defaultCameras });
        toast({ title: "NVR Created", description: "New NVR has been created successfully." });
      }
      await loadData();
      resetNvrForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save NVR.", variant: "destructive" });
    }
  };

  const handleCameraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNvr) return;

    const updatedCameras = [...(selectedNvr.cameras || [])];
    if (editingCameraIndex !== null) {
      // Edit mode
      updatedCameras[editingCameraIndex] = {
        ...updatedCameras[editingCameraIndex],
        ...cameraFormData,
      };
    } else {
      // Add mode
      const newCamera: NVRCamera = {
        id: Math.max(...updatedCameras.map(c => c.id), 0) + 1,
        ...cameraFormData,
      };
      updatedCameras.push(newCamera);
    }

    setSelectedNvr({ ...selectedNvr, cameras: updatedCameras });
    dbService.updateNVR(selectedNvr.id, { cameras: updatedCameras });
    const message = editingCameraIndex !== null ? "Camera Updated" : "Camera Added";
    const description = editingCameraIndex !== null ? "Camera details have been updated." : "New camera has been added.";
    toast({ title: message, description: description });
    resetCameraForm();
  };

  const handleDeleteCamera = (index: number) => {
    if (!selectedNvr) return;

    if (window.confirm("Are you sure you want to delete this camera location?")) {
      const updatedCameras = selectedNvr.cameras.filter((_, i) => i !== index);
      setSelectedNvr({ ...selectedNvr, cameras: updatedCameras });
      dbService.updateNVR(selectedNvr.id, { cameras: updatedCameras });
      toast({ title: "Camera Deleted", description: "Camera location has been deleted." });
    }
  };

  const handleAddCamera = () => {
    setCameraFormData({
      camera_id: "",
      location_name: "",
      camera_position: "OK",
      camera_recordings: "OK",
      clear_vision: "OK",
      remarks: "",
    });
    setEditingCameraIndex(null);
    setIsCameraDialogOpen(true);
  };

  const handleCreateChecklist = async () => {
    if (!selectedNvr) return;

    const cameras = selectedNvr.cameras.map(cam => ({
      ...cam,
      camera_position: "Nil",
      camera_recordings: "Nil",
      clear_vision: "Nil",
      remarks: "",
    }));
    setChecklistCameras(cameras);
    setChecklistFormData({
      date: new Date().toISOString().split("T")[0],
      checked_by: "Officer(IT)",
      verified_by: "Asst. Manager(IT)",
      approved_by: "Head Of HR,Admin",
    });
    setMergedCells([]); // Clear merges for new checklist
    setSelectedCellsForMerge([]);
    setIsMergeMode(false);
    setIsChecklistDialogOpen(true);
  };

  const handleSaveChecklist = async () => {
    if (!selectedNvr) return;

    // Check for duplicate same-date entries
    const existingChecklist = checklists.find(
      c => c.nvr_id === selectedNvr.id && c.date === checklistFormData.date
    );

    if (existingChecklist) {
      toast({
        title: "Duplicate Entry",
        description: `A checklist for ${selectedNvr.name} on ${checklistFormData.date} already exists. Please edit the existing one instead.`,
        variant: "destructive"
      });
      return;
    }

    const newChecklist = {
      nvr_id: selectedNvr.id,
      date: checklistFormData.date,
      cameras: checklistCameras,
      checked_by: checklistFormData.checked_by,
      verified_by: checklistFormData.verified_by,
      approved_by: checklistFormData.approved_by,
      mergedCells: mergedCells,
    };

    await dbService.addCCTVChecklist(newChecklist);
    toast({ title: "Checklist Saved", description: "Daily checklist has been saved successfully." });
    await loadData();
    setIsChecklistDialogOpen(false);
  };

  const handleViewChecklist = (checklist: DailyChecklist) => {
    setSelectedChecklist(checklist);
    setChecklistCameras(checklist.cameras);
    setChecklistFormData({
      date: checklist.date,
      checked_by: checklist.checked_by,
      verified_by: checklist.verified_by,
      approved_by: checklist.approved_by,
    });
    // Load merge settings for this specific checklist
    const mergesData = (checklist as any).mergedCells || [];
    setMergedCells(mergesData);
    setSelectedCellsForMerge([]);
    setIsMergeMode(false);
    setIsViewChecklistOpen(true);
  };

  const handleUpdateChecklist = async () => {
    if (!selectedChecklist) return;

    await dbService.updateCCTVChecklist(selectedChecklist.id, {
      date: checklistFormData.date,
      cameras: checklistCameras,
      checked_by: checklistFormData.checked_by,
      verified_by: checklistFormData.verified_by,
      approved_by: checklistFormData.approved_by,
      mergedCells: mergedCells,
    });
    toast({ title: "Checklist Updated", description: "Checklist has been updated successfully." });
    await loadData();
    setIsViewChecklistOpen(false);
    setSelectedChecklist(null);
  };

  const handleDeleteChecklist = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this checklist?")) {
      await dbService.deleteCCTVChecklist(id);
      await loadData();
      toast({ title: "Checklist Deleted", description: "Checklist has been deleted." });
    }
  };

  const handleDeleteChecklistWithConfirm = async (id: number) => {
    const checklist = checklists.find(c => c.id === id);
    if (!checklist) return;

    setDeleteConfirmDialog({
      open: true,
      checklistId: id,
      date: formatDate(checklist.date),
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

  const handleDeleteFilteredChecklists = () => {
    // Get the filtered checklists for the current NVR
    const filteredChecklists = selectedNvr
      ? getNvrChecklists(selectedNvr.id).filter(c => {
        if (filterDateFrom && c.date < filterDateFrom) return false;
        if (filterDateTo && c.date > filterDateTo) return false;
        return true;
      })
      : checklists.filter(c => {
        if (filterDateFrom && c.date < filterDateFrom) return false;
        if (filterDateTo && c.date > filterDateTo) return false;
        return true;
      });

    if (filteredChecklists.length === 0) {
      toast({ title: "No Data", description: "No checklists to delete.", variant: "destructive" });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${filteredChecklists.length} checklist(s)? This action cannot be undone.`)) {
      deleteFilteredChecklists(filteredChecklists);
    }
  };

  const deleteFilteredChecklists = async (checklistsToDelete: DailyChecklist[]) => {
    try {
      for (const checklist of checklistsToDelete) {
        await dbService.deleteCCTVChecklist(checklist.id);
      }
      await loadData();
      toast({
        title: "Success",
        description: `${checklistsToDelete.length} checklist(s) have been deleted successfully.`
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete checklists.", variant: "destructive" });
    }
  };

  const handleExportChecklists = () => {
    try {
      // Get filtered checklists for the current NVR with date range filter
      const checklistsToExport = selectedNvr
        ? getNvrChecklists(selectedNvr.id).filter(c => {
          if (filterDateFrom && c.date < filterDateFrom) return false;
          if (filterDateTo && c.date > filterDateTo) return false;
          return true;
        })
        : checklists.filter(c => {
          if (filterDateFrom && c.date < filterDateFrom) return false;
          if (filterDateTo && c.date > filterDateTo) return false;
          return true;
        });

      if (checklistsToExport.length === 0) {
        toast({ title: "No Data", description: "No checklists to export.", variant: "destructive" });
        return;
      }

      const exportData = {
        timestamp: new Date().toISOString(),
        nvr: selectedNvr ? { id: selectedNvr.id, nvr_number: selectedNvr.nvr_number, name: selectedNvr.name } : null,
        checklistsCount: checklistsToExport.length,
        dateRangeFilter: {
          from: filterDateFrom || "any",
          to: filterDateTo || "any",
        },
        checklists: checklistsToExport,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateRange = filterDateFrom && filterDateTo
        ? `_${filterDateFrom}_to_${filterDateTo}`
        : filterDateFrom
          ? `_from_${filterDateFrom}`
          : filterDateTo
            ? `_to_${filterDateTo}`
            : "";
      const fileName = selectedNvr
        ? `CCTV_Checklists_NVR-${selectedNvr.nvr_number}${dateRange}_${new Date().toISOString().split('T')[0]}.json`
        : `CCTV_Checklists_All${dateRange}_${new Date().toISOString().split('T')[0]}.json`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${checklistsToExport.length} checklist(s) exported successfully.`
      });
    } catch (error) {
      toast({ title: "Export Failed", description: "Failed to export checklists.", variant: "destructive" });
    }
  };

  const handleImportChecklists = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const importData = JSON.parse(content);

      if (!importData.checklists || !Array.isArray(importData.checklists)) {
        toast({ title: "Invalid File", description: "The file does not contain valid checklist data.", variant: "destructive" });
        return;
      }

      if (importData.nvr && selectedNvr && importData.nvr.id !== selectedNvr.id) {
        toast({
          title: "NVR Mismatch",
          description: `This file contains checklists for NVR-${importData.nvr.nvr_number}, but you're viewing NVR-${selectedNvr.nvr_number}.`,
          variant: "destructive"
        });
        return;
      }

      let importedCount = 0;
      for (const checklist of importData.checklists) {
        try {
          // Check if checklist already exists (by date and nvr_id)
          const exists = checklists.some(c => c.nvr_id === checklist.nvr_id && c.date === checklist.date);
          if (!exists) {
            await dbService.addCCTVChecklist(checklist);
            importedCount++;
          }
        } catch (err) {
          console.error('Error importing checklist:', err);
        }
      }

      await loadData();
      toast({
        title: "Import Successful",
        description: `${importedCount} checklist(s) imported successfully.`
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: "Import Failed", description: "Failed to import checklists. Please check the file format.", variant: "destructive" });
    }

    // Reset file input
    event.target.value = '';
  };

  const handleDeleteNvr = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this NVR?")) {
      await dbService.deleteNVR(id);
      await loadData();
      toast({ title: "NVR Deleted", description: "NVR has been deleted." });
    }
  };

  const handlePrintChecklist = (checklist: DailyChecklist, nvr: NVR) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    // Fixed sizing for 32 cameras on one A4 page
    const printFontSize = 9;
    const printRowHeight = 18;

    // Ensure we always show exactly 32 rows (pad with empty if needed)
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

    const cameraRows = camerasToShow.slice(0, 32).map((cam, idx) => {
      // Get merges for this specific checklist
      const checklistMerges = (checklist as any).mergedCells || [];
      
      // Check if this row is part of a merge and not the first row
      const isMergedRow = checklistMerges.some(m =>
        m.column === 'remarks' &&
        idx >= m.startRow &&
        idx <= m.endRow &&
        idx !== m.startRow
      );

      let remarksRowSpan = 1;
      const merge = checklistMerges.find(m =>
        m.column === 'remarks' &&
        idx >= m.startRow &&
        idx <= m.endRow &&
        idx === m.startRow
      );
      if (merge) {
        remarksRowSpan = merge.endRow - merge.startRow + 1;
      }

      if (isMergedRow) {
        // Render row with all data except remarks cell (which spans from first row)
        return `
      <tr style="height: ${printRowHeight}px;">
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-weight: bold; font-size: ${printFontSize}px;">${cam.camera_id}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: left; font-size: ${printFontSize}px;">${cam.location_name || "Nil"}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.camera_position}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.camera_recordings}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.clear_vision}</td>
      </tr>
    `;
      }

      return `
      <tr style="height: ${printRowHeight}px;">
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-weight: bold; font-size: ${printFontSize}px;">${cam.camera_id}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: left; font-size: ${printFontSize}px;">${cam.location_name || "Nil"}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.camera_position}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.camera_recordings}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.clear_vision}</td>
        <td style="border: 1px solid #000; padding: 1px 2px; text-align: left; font-size: ${printFontSize}px;" rowspan="${remarksRowSpan}">${cam.remarks || ""}</td>
      </tr>
    `;
    }).join("");

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CCTV Checklist</title>
          <style>
            @page { 
              size: A4; 
              margin: 5mm;
            }
            @media print {
              html, body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: ${printFontSize}px; 
              padding: 0.5mm;
              position: relative;
              min-height: 296.5mm;
            }
            .header { text-align: center; margin-bottom: 0.5mm; }
            .header img { height: 35px; }
            .header h1 { font-size: 13px; color: #1a365d; margin: 0px 0; }
            .header h2 { font-size: 10px; margin: 0px 0; }
            .info-row { display: flex; justify-content: space-between; font-weight: bold; margin: 0.5mm 0; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th { background: #e8e8e8; border: 1px solid #000; padding: 2px; font-weight: bold; font-size: 8px; }
            .signature-section { 
              display: flex; 
              justify-content: space-between; 
              position: absolute;
              bottom: 0.5mm;
              left: 5mm;
              right: 5mm;
            }
            .sig-block { 
              text-align: center; 
              flex: 1;
              padding: 0 8px;
            }
            .sig-space {
              height: 20px;
              margin-bottom: 3px;
            }
            .sig-label {
              font-size: 8px;
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 3px;
            }
            .sig-name {
              font-size: 7px;
              color: #444;
              margin-top: 1px;
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 3px;
            }
            body {
              position: relative;
              min-height: 287mm;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo/logo_1.png" alt="MNR Logo" />
            <h1>${printHeader.companyName}</h1>
            <h2>${printHeader.reportTitle}</h2>
            <div style="font-size: ${printHeader.nvrFontSize}px; font-weight: bold; margin-top: 3px;">NVR-${nvr.nvr_number}</div>
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
  };

  const handlePrintAllNVRs = () => {
    // Get the latest checklist for each NVR
    const latestChecklists: { nvr: NVR; checklist: DailyChecklist }[] = [];

    nvrs.forEach(nvr => {
      const nvrChecklists = checklists.filter(c => c.nvr_id === nvr.id);
      if (nvrChecklists.length > 0) {
        const latest = nvrChecklists.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        latestChecklists.push({ nvr, checklist: latest });
      }
    });

    if (latestChecklists.length === 0) {
      toast({ title: "No Checklists", description: "No checklists found to print.", variant: "destructive" });
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    // Fixed sizing for 32 cameras on one A4 page
    const printFontSize = 9;
    const printRowHeight = 18;

    const pages = latestChecklists.map(({ nvr, checklist }) => {
      // Ensure we always show exactly 32 rows (pad with empty if needed)
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

      const cameraRows = camerasToShow.slice(0, 32).map((cam, idx) => {
        // Get merges for this specific checklist
        const checklistMerges = (checklist as any).mergedCells || [];
        
        // Check if this row is part of a merge and not the first row
        const isMergedRow = checklistMerges.some(m =>
          m.column === 'remarks' &&
          idx >= m.startRow &&
          idx <= m.endRow &&
          idx !== m.startRow
        );

        let remarksRowSpan = 1;
        const merge = checklistMerges.find(m =>
          m.column === 'remarks' &&
          idx >= m.startRow &&
          idx <= m.endRow &&
          idx === m.startRow
        );
        if (merge) {
          remarksRowSpan = merge.endRow - merge.startRow + 1;
        }

        if (isMergedRow) {
          // Render row with all data except remarks cell (which spans from first row)
          return `
        <tr style="height: ${printRowHeight}px;">
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-weight: bold; font-size: ${printFontSize}px;">${cam.camera_id}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: left; font-size: ${printFontSize}px;">${cam.location_name || "Nil"}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.camera_position}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.camera_recordings}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.clear_vision}</td>
        </tr>
      `;
        }

        return `
        <tr style="height: ${printRowHeight}px;">
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-weight: bold; font-size: ${printFontSize}px;">${cam.camera_id}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: left; font-size: ${printFontSize}px;">${cam.location_name || "Nil"}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.camera_position}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.camera_recordings}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: center; font-size: ${printFontSize}px;">${cam.clear_vision}</td>
          <td style="border: 1px solid #000; padding: 1px 2px; text-align: left; font-size: ${printFontSize}px;" rowspan="${remarksRowSpan}">${cam.remarks || ""}</td>
        </tr>
      `;
      }).join("");

      return `
        <div class="page">
          <div class="header">
            <img src="/logo/logo_1.png" alt="MNR Logo" />
            <h1>${printHeader.companyName}</h1>
            <h2>${printHeader.reportTitle}</h2>
            <div style="font-size: ${printHeader.nvrFontSize}px; font-weight: bold; margin-top: 2px;">NVR-${nvr.nvr_number}</div>
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
        </div>
      `;
    }).join("");

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>All NVR Checklists</title>
          <style>
            @page { 
              size: A4; 
              margin: 5mm;
            }
            @media print {
              html, body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: ${printFontSize}px; }
            .page { padding: 0.5mm 1mm; page-break-after: always; width: 210mm; min-height: 296.5mm; max-height: 297mm; overflow: hidden; }
            .page:last-child { page-break-after: auto; }
            .header { text-align: center; margin-bottom: 0.5mm; }
            .header img { height: 30px; }
            .header h1 { font-size: ${printHeader.companyFontSize}px; color: #1a365d; margin: 0px 0; }
            .header h2 { font-size: ${printHeader.reportFontSize}px; margin: 0px 0; }
            .info-row { display: flex; justify-content: space-between; font-weight: bold; margin: 0.5mm 0; font-size: 9px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th { background: #e8e8e8; border: 1px solid #000; padding: 1px; font-weight: bold; font-size: 7px; }
            .signature-section { display: flex; justify-content: space-between; position: absolute; bottom: 1mm; left: 2mm; right: 2mm; width: calc(100% - 4mm); }
            .sig-block { text-align: center; flex: 1; padding: 0 6px; }
            .sig-space { height: ${printHeader.signatureLineHeight}px; margin-bottom: 2px; }
            .sig-label { font-size: 7px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; }
            .sig-name { font-size: 6px; color: #444; margin-top: 1px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; }
            .page { position: relative; }
          </style>
        </head>
        <body>
          ${pages}
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
  };

  const resetNvrForm = () => {
    setNvrFormData({ nvr_number: "", name: "", total_cameras: 32 });
    setEditingNvr(null);
    setIsNvrDialogOpen(false);
  };

  const resetCameraForm = () => {
    setCameraFormData({
      camera_id: "",
      location_name: "",
      camera_position: "OK",
      camera_recordings: "OK",
      clear_vision: "OK",
      remarks: "",
    });
    setEditingCameraIndex(null);
    setIsCameraDialogOpen(false);
  };

  const handleEditCamera = (camera: NVRCamera, index: number) => {
    setEditingCameraIndex(index);
    setCameraFormData({
      camera_id: camera.camera_id,
      location_name: camera.location_name,
      camera_position: camera.camera_position,
      camera_recordings: camera.camera_recordings,
      clear_vision: camera.clear_vision,
      remarks: camera.remarks,
    });
    setIsCameraDialogOpen(true);
  };

  const updateChecklistCamera = (index: number, field: keyof NVRCamera, value: string) => {
    const updated = [...checklistCameras];
    updated[index] = { ...updated[index], [field]: value };
    
    // If location_name has content, automatically set camera checks to "OK"
    if (field === "location_name" && value.trim() !== "") {
      updated[index].camera_position = "OK";
      updated[index].camera_recordings = "OK";
      updated[index].clear_vision = "OK";
    }
    // If location_name is cleared, reset checks to "Nil"
    else if (field === "location_name" && value.trim() === "") {
      updated[index].camera_position = "Nil";
      updated[index].camera_recordings = "Nil";
      updated[index].clear_vision = "Nil";
    }
    
    setChecklistCameras(updated);
  };

  const getPreviousRemarks = (cameraId: string) => {
    const previousRemarks = new Set<string>();
    checklists.forEach(checklist => {
      checklist.cameras.forEach(camera => {
        if (camera.camera_id === cameraId && camera.remarks) {
          previousRemarks.add(camera.remarks);
        }
      });
    });
    return Array.from(previousRemarks);
  };

  const getNvrChecklists = (nvrId: number) => {
    return checklists.filter(c => c.nvr_id === nvrId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // NVR List View
  if (!selectedNvr) {
    const filteredNvrs = getFilteredNvrs();
    const filteredChecklistsAll = getFilteredChecklists();

    return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-slide-up">
              CCTV Daily Check List
            </h1>
            <p className="text-muted-foreground mt-2">Manage NVRs and daily camera checklists</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handlePrintAllNVRs} className="border-primary/30">
              <Printer className="h-4 w-4 mr-2" />
              Print All NVRs
            </Button>
            <Button variant="outline" onClick={handlePrintFilteredChecklists} className="border-primary/30">
              <Filter className="h-4 w-4 mr-2" />
              Print Filtered ({filteredChecklistsAll.length})
            </Button>
            <Dialog open={isNvrDialogOpen} onOpenChange={setIsNvrDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetNvrForm} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New NVR
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNvr ? "Edit NVR" : "Add New NVR"}</DialogTitle>
                  <DialogDescription>Enter NVR details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleNvrSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nvr_number">NVR Number *</Label>
                    <Input
                      id="nvr_number"
                      value={nvrFormData.nvr_number}
                      onChange={(e) => setNvrFormData({ ...nvrFormData, nvr_number: e.target.value })}
                      placeholder="e.g., 1, 2, 3..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">NVR Name</Label>
                    <Input
                      id="name"
                      value={nvrFormData.name}
                      onChange={(e) => setNvrFormData({ ...nvrFormData, name: e.target.value })}
                      placeholder="e.g., Main Building NVR"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_cameras">Total Cameras</Label>
                    <Input
                      id="total_cameras"
                      type="number"
                      value={nvrFormData.total_cameras}
                      onChange={(e) => setNvrFormData({ ...nvrFormData, total_cameras: parseInt(e.target.value) || 32 })}
                      min={1}
                      max={64}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetNvrForm}>Cancel</Button>
                    <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80">
                      {editingNvr ? "Update" : "Create"} NVR
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search & Filter Section */}
        <Card className="bg-gradient-to-r from-muted/50 to-muted/30 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Search className="h-3 w-3" /> Search NVR
                </Label>
                <Input
                  placeholder="Search by NVR number or name..."
                  value={searchNvr}
                  onChange={(e) => setSearchNvr(e.target.value)}
                  className="w-48 h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Filter by NVR
                </Label>
                <Select value={filterNvrNumber} onValueChange={setFilterNvrNumber}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="All NVRs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All NVRs</SelectItem>
                    {nvrs.map(nvr => (
                      <SelectItem key={nvr.id} value={nvr.nvr_number}>NVR-{nvr.nvr_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date From
                </Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-40 h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date To
                </Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-40 h-9"
                />
              </div>
              {(searchNvr || filterNvrNumber !== "all" || filterDateFrom || filterDateTo) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            {(filterDateFrom || filterDateTo || filterNvrNumber !== "all") && (
              <div className="mt-3 text-sm text-muted-foreground">
                Showing {filteredChecklistsAll.length} checklists matching filters
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 perspective-1000 hover-lift cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Camera className="h-10 w-10 text-primary" />
                    <div>
                      <p className="text-muted-foreground text-sm">Total Cameras</p>
                      <p className="text-3xl font-bold text-primary">{nvrStats.totalNVRCameras}</p>
                      <p className="text-xs text-primary/70">Click to view all</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  All Cameras ({nvrStats.totalNVRCameras})
                </DialogTitle>
                <DialogDescription>Complete list of all cameras across all NVRs</DialogDescription>
              </DialogHeader>
              <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NVR</TableHead>
                      <TableHead>Camera ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Recording</TableHead>
                      <TableHead>Vision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nvrs.flatMap(nvr =>
                      (nvr.cameras || []).map((cam, idx) => (
                        <TableRow key={`${nvr.id}-${idx}`}>
                          <TableCell className="font-medium">NVR-{nvr.nvr_number}</TableCell>
                          <TableCell>{cam.camera_id}</TableCell>
                          <TableCell>{cam.location_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={cam.camera_position === 'OK' ? 'default' : 'destructive'}>{cam.camera_position || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={cam.camera_recordings === 'OK' ? 'default' : 'destructive'}>{cam.camera_recordings || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={cam.clear_vision === 'OK' ? 'default' : 'destructive'}>{cam.clear_vision || '-'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 perspective-1000 hover-lift cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                    <div>
                      <p className="text-muted-foreground text-sm">Active Cameras</p>
                      <p className="text-3xl font-bold text-green-600">{nvrStats.activeCameras}</p>
                      <p className="text-xs text-green-500">Click to view</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Active Cameras ({nvrStats.activeCameras})
                </DialogTitle>
                <DialogDescription>Cameras with all checks OK from latest checklists</DialogDescription>
              </DialogHeader>
              <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NVR</TableHead>
                      <TableHead>Camera ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nvrs.flatMap(nvr => {
                      const nvrChecklists = checklists.filter(c => c.nvr_id === nvr.id);
                      if (nvrChecklists.length === 0) return [];
                      const latestChecklist = nvrChecklists.sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                      )[0];
                      return latestChecklist.cameras.filter(cam =>
                        cam.camera_position === 'OK' && cam.camera_recordings === 'OK' && cam.clear_vision === 'OK'
                      ).map((cam, idx) => (
                        <TableRow key={`${nvr.id}-${idx}`}>
                          <TableCell className="font-medium">NVR-{nvr.nvr_number}</TableCell>
                          <TableCell>{cam.camera_id}</TableCell>
                          <TableCell>{cam.location_name || '-'}</TableCell>
                          <TableCell><Badge className="bg-green-500">All OK</Badge></TableCell>
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>

          <Card
            className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 perspective-1000 hover-lift cursor-pointer"
            onClick={() => nvrStats.withIssues > 0 && setIsIssuesViewOpen(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-10 w-10 text-orange-500" />
                <div>
                  <p className="text-muted-foreground text-sm">With Issues</p>
                  <p className="text-3xl font-bold text-orange-600">{nvrStats.withIssues}</p>
                  {nvrStats.withIssues > 0 && (
                    <p className="text-xs text-orange-500">Click to view details</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog>
            <DialogTrigger asChild>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 perspective-1000 hover-lift cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Server className="h-10 w-10 text-blue-500" />
                    <div>
                      <p className="text-muted-foreground text-sm">Total NVRs</p>
                      <p className="text-3xl font-bold text-blue-600">{nvrs.length}</p>
                      <p className="text-xs text-blue-500">Click to view</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-500" />
                  All NVRs ({nvrs.length})
                </DialogTitle>
                <DialogDescription>Complete list of all Network Video Recorders</DialogDescription>
              </DialogHeader>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NVR Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Total Cameras</TableHead>
                      <TableHead>Checklists</TableHead>
                      <TableHead>Last Check</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nvrs.map(nvr => {
                      const nvrChecklists = checklists.filter(c => c.nvr_id === nvr.id);
                      const latestDate = nvrChecklists.length > 0
                        ? formatDate(nvrChecklists.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date)
                        : '-';
                      return (
                        <TableRow key={nvr.id}>
                          <TableCell className="font-bold text-primary">NVR-{nvr.nvr_number}</TableCell>
                          <TableCell>{nvr.name || '-'}</TableCell>
                          <TableCell><Badge variant="secondary">{nvr.cameras?.length || nvr.total_cameras}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{nvrChecklists.length}</Badge></TableCell>
                          <TableCell>{latestDate}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Issues View Dialog */}
        <Dialog open={isIssuesViewOpen} onOpenChange={setIsIssuesViewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Camera Issues ({nvrStats.withIssues})
              </DialogTitle>
              <DialogDescription>Cameras with issues from recent checklists</DialogDescription>
            </DialogHeader>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NVR</TableHead>
                    <TableHead>Camera</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Issue Type</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nvrStats.issues.map((issue, idx) => {
                    // Find the camera remarks from checklist
                    const nvr = nvrs.find(n => n.id === issue.nvr_id);
                    const nvrChecklists = checklists.filter(c => c.nvr_id === issue.nvr_id && c.date === issue.date);
                    const checklist = nvrChecklists[0];
                    const camera = checklist?.cameras.find(c => c.camera_id === issue.camera_id);
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">NVR-{issue.nvr_number}</TableCell>
                        <TableCell>{issue.camera_id}</TableCell>
                        <TableCell>{issue.location}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">{issue.issue_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={camera?.remarks || '-'}>
                          {camera?.remarks || '-'}
                        </TableCell>
                        <TableCell>{formatDate(issue.date)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* NVR Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNvrs.map((nvr) => {
            const nvrChecklists = getNvrChecklists(nvr.id);
            return (
              <Card
                key={nvr.id}
                className="cursor-pointer perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-card to-card/80 border-primary/20"
                onClick={() => setSelectedNvr(nvr)}
              >
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    NVR-{nvr.nvr_number}
                  </CardTitle>
                  <CardDescription>
                    {nvr.name || `Network Video Recorder ${nvr.nvr_number}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Cameras:</span>
                    <Badge variant="secondary">{nvr.cameras?.length || nvr.total_cameras}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Daily Reports:</span>
                    <Badge variant="outline">{nvrChecklists.length}</Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNvr(nvr);
                        setNvrFormData({
                          nvr_number: nvr.nvr_number,
                          name: nvr.name,
                          total_cameras: nvr.total_cameras,
                        });
                        setIsNvrDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNvr(nvr.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {nvrs.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Server className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No NVRs Found</h3>
              <p className="text-muted-foreground mb-4">Create your first NVR to start managing CCTV checklists</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // NVR Detail View
  const nvrChecklists = getNvrChecklists(selectedNvr.id);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedNvr(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              NVR-{selectedNvr.nvr_number}
            </h1>
            <p className="text-muted-foreground">{selectedNvr.name || "Camera Management & Daily Checklists"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="border-primary/30">
            <Settings2 className="h-4 w-4 mr-2" />
            Excel Settings
          </Button>
          <Button variant="outline" onClick={handleCreateChecklist} className="border-primary/30 text-primary">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            New Daily Checklist
          </Button>
        </div>
      </div>

      {/* Excel-like Settings Panel */}
      {showSettings && (
        <Card className="no-print bg-gradient-to-r from-muted/50 to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel-Like Table Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Type className="h-3 w-3" /> Font Size
                </Label>
                <Select value={fontSize.toString()} onValueChange={(v) => setFontSize(Number(v))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 9, 10, 11, 12, 14, 16, 18].map(size => (
                      <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Columns className="h-3 w-3" /> Row Height
                </Label>
                <Select value={rowHeight.toString()} onValueChange={(v) => setRowHeight(Number(v))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[24, 28, 32, 36, 40, 48].map(h => (
                      <SelectItem key={h} value={h.toString()}>{h}px</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <WrapText className="h-3 w-3" /> Word Wrap
                </Label>
                <Select value={wordWrap ? "on" : "off"} onValueChange={(v) => setWordWrap(v === "on")}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on">On</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 md:col-span-3 flex items-end">
                <p className="text-xs text-muted-foreground">
                  <Merge className="h-3 w-3 inline mr-1" />
                  Drag column borders to resize. Settings apply to checklist view.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Checklists */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Checklists
          </CardTitle>
          <CardDescription>View all daily camera check reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter and Export/Import Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="checklist_date_from" className="text-xs mb-1 block">From Date</Label>
              <Input
                id="checklist_date_from"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="checklist_date_to" className="text-xs mb-1 block">To Date</Label>
              <Input
                id="checklist_date_to"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteFilteredChecklists()}
                disabled={!filterDateFrom && !filterDateTo}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Filtered
              </Button>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportChecklists()}
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="flex gap-2 items-end">
              <input
                type="file"
                id="import-checklists"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportChecklists}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById('import-checklists')?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                Import
              </Button>
            </div>
          </div>

          {nvrChecklists.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Cameras</TableHead>
                  <TableHead>Checked By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nvrChecklists.filter(c => {
                  if (filterDateFrom && c.date < filterDateFrom) return false;
                  if (filterDateTo && c.date > filterDateTo) return false;
                  return true;
                }).map((checklist) => (
                  <TableRow key={checklist.id}>
                    <TableCell className="font-medium">{formatDate(checklist.date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{checklist.cameras?.length || 0}</Badge>
                    </TableCell>
                    <TableCell>{checklist.checked_by}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewChecklist(checklist)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintChecklist(checklist, selectedNvr)}
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          Print
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteChecklistWithConfirm(checklist.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No checklists yet. Create your first daily checklist.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Setup Table */}
      <Card className="no-print">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera Setup ({selectedNvr.cameras?.length || 0} Cameras)
            </CardTitle>
            <CardDescription>Configure camera locations for this NVR</CardDescription>
          </div>
          <Button onClick={handleAddCamera} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Add Camera
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">SL</TableHead>
                  <TableHead className="w-20">Camera ID</TableHead>
                  <TableHead>Location Name</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(selectedNvr.cameras || [])
                  .sort((a, b) => {
                    const aNum = parseInt(a.camera_id.replace(/\D/g, '')) || 0;
                    const bNum = parseInt(b.camera_id.replace(/\D/g, '')) || 0;
                    return aNum - bNum;
                  })
                  .map((camera, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium text-primary">{camera.camera_id}</TableCell>
                      <TableCell>{camera.location_name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditCamera(camera, selectedNvr.cameras.indexOf(camera))}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteCamera(selectedNvr.cameras.indexOf(camera))} className="border-red-200 text-red-700 hover:bg-red-50">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Camera Dialog */}
      <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCameraIndex !== null ? "Edit Camera Location" : "Add New Camera"}</DialogTitle>
            <DialogDescription>{editingCameraIndex !== null ? "Update camera location details" : "Add a new camera to this NVR"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCameraSubmit} className="space-y-4">
            <div>
              <Label htmlFor="camera_id">Camera ID</Label>
              <Input
                id="camera_id"
                value={cameraFormData.camera_id}
                onChange={(e) => setCameraFormData({ ...cameraFormData, camera_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location_name">Location Name</Label>
              <Input
                id="location_name"
                value={cameraFormData.location_name}
                onChange={(e) => setCameraFormData({ ...cameraFormData, location_name: e.target.value })}
                placeholder="e.g., Gate-01-Pocket Gate"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetCameraForm}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/View Checklist Dialog - Excel Style */}
      <Dialog open={isChecklistDialogOpen || isViewChecklistOpen} onOpenChange={(open) => {
        if (!open) {
          setIsChecklistDialogOpen(false);
          setIsViewChecklistOpen(false);
          setSelectedChecklist(null);
        }
      }}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1">
                <FileSpreadsheet className="h-5 w-5" />
                <div>
                  <DialogTitle>
                    {isViewChecklistOpen ? "View/Edit Checklist" : "New Daily Checklist"} - NVR-{selectedNvr.nvr_number}
                  </DialogTitle>
                  <DialogDescription>
                    Date: {formatDate(checklistFormData.date)} | Drag column headers to resize
                  </DialogDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isMergeMode ? "default" : "outline"}
                  onClick={() => {
                    setIsMergeMode(!isMergeMode);
                    setSelectedCellsForMerge([]);
                  }}
                  className="flex items-center gap-1"
                >
                  <Merge className="h-4 w-4" />
                  Merge
                </Button>
                {isMergeMode && selectedCellsForMerge.length > 1 && (
                  <Button
                    size="sm"
                    onClick={handleMergeCells}
                    className="flex items-center gap-1"
                  >
                    Apply
                  </Button>
                )}
                {mergedCells.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setMergedCells([]);
                      toast({ title: "Success", description: "All merges cleared" });
                    }}
                    className="flex items-center gap-1"
                  >
                    <SplitSquareHorizontal className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="checklist_date">Date</Label>
                <Input
                  id="checklist_date"
                  type="date"
                  value={checklistFormData.date}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, date: e.target.value })}
                  disabled={!isViewChecklistOpen && isChecklistDialogOpen === false}
                />
              </div>
            </div>

            {/* Excel-like Table */}
            <div className="border rounded-lg overflow-auto bg-background" style={{ maxHeight: "60vh" }}>
              <table
                className="w-full border-collapse"
                style={{ fontSize: `${fontSize}px` }}
              >
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted">
                    <th
                      className="border border-border p-2 text-center font-bold relative select-none"
                      style={{ width: columnWidths.sl, minWidth: columnWidths.sl }}
                    >
                      SL
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                        onMouseDown={(e) => handleMouseDown(e, "sl")}
                      />
                    </th>
                    <th
                      className="border border-border p-2 text-center font-bold relative select-none"
                      style={{ width: columnWidths.cameraId, minWidth: columnWidths.cameraId }}
                    >
                      Camera ID
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                        onMouseDown={(e) => handleMouseDown(e, "cameraId")}
                      />
                    </th>
                    <th
                      className="border border-border p-2 text-left font-bold relative select-none"
                      style={{ width: columnWidths.locationName, minWidth: columnWidths.locationName }}
                    >
                      Location Name
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                        onMouseDown={(e) => handleMouseDown(e, "locationName")}
                      />
                    </th>
                    <th
                      className="border border-border p-2 text-center font-bold relative select-none"
                      style={{ width: columnWidths.cameraPosition, minWidth: columnWidths.cameraPosition }}
                    >
                      Camera Position
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                        onMouseDown={(e) => handleMouseDown(e, "cameraPosition")}
                      />
                    </th>
                    <th
                      className="border border-border p-2 text-center font-bold relative select-none"
                      style={{ width: columnWidths.cameraRecordings, minWidth: columnWidths.cameraRecordings }}
                    >
                      Camera Recordings
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                        onMouseDown={(e) => handleMouseDown(e, "cameraRecordings")}
                      />
                    </th>
                    <th
                      className="border border-border p-2 text-center font-bold relative select-none"
                      style={{ width: columnWidths.clearVision, minWidth: columnWidths.clearVision }}
                    >
                      Clear Vision
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                        onMouseDown={(e) => handleMouseDown(e, "clearVision")}
                      />
                    </th>
                    <th
                      className="border border-border p-2 text-center font-bold relative select-none"
                      style={{ width: columnWidths.remarks, minWidth: columnWidths.remarks }}
                    >
                      Remarks
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                        onMouseDown={(e) => handleMouseDown(e, "remarks")}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {checklistCameras.map((camera, index) => {
                    // Skip rendering merged rows (except the first row of the merge which has rowspan)
                    if (isMergedRowToSkip(index, 'remarks')) {
                      return null;
                    }

                    const remarksRowSpan = getRowSpan(index, 'remarks');
                    const isRemarksSelected = isMergeMode && selectedCellsForMerge.some(c => c.row === index && c.column === 'remarks');

                    return (
                      <tr
                        key={index}
                        className="hover:bg-muted/50"
                        style={{ height: rowHeight }}
                      >
                        <td
                          className="border border-border p-1 text-center font-medium"
                          style={{
                            whiteSpace: wordWrap ? "normal" : "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {index + 1}
                        </td>
                        <td
                          className="border border-border p-1 text-center font-bold text-primary"
                          style={{
                            whiteSpace: wordWrap ? "normal" : "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {camera.camera_id}
                        </td>
                        <td className="border border-border p-1">
                          <Input
                            value={camera.location_name}
                            onChange={(e) => updateChecklistCamera(index, "location_name", e.target.value)}
                            placeholder="Nil"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="border border-border p-1">
                          <Select
                            value={camera.camera_position}
                            onValueChange={(value) => updateChecklistCamera(index, "camera_position", value)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="NOT OK">NOT OK</SelectItem>
                              <SelectItem value="Nil">Nil</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-border p-1">
                          <Select
                            value={camera.camera_recordings}
                            onValueChange={(value) => updateChecklistCamera(index, "camera_recordings", value)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="NOT OK">NOT OK</SelectItem>
                              <SelectItem value="Nil">Nil</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-border p-1">
                          <Select
                            value={camera.clear_vision}
                            onValueChange={(value) => updateChecklistCamera(index, "clear_vision", value)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="NOT OK">NOT OK</SelectItem>
                              <SelectItem value="Nil">Nil</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td
                          className={`border border-border p-1 cursor-pointer transition-colors ${isRemarksSelected ? 'bg-blue-200' : ''}`}
                          onClick={() => isMergeMode && handleCellClickForMerge(index, 'remarks')}
                          rowSpan={remarksRowSpan}
                          style={{
                            height: remarksRowSpan === 1 ? undefined : rowHeight * remarksRowSpan
                          }}
                        >
                          <div className="relative">
                            <Input
                              value={camera.remarks}
                              onChange={(e) => updateChecklistCamera(index, "remarks", e.target.value)}
                              placeholder="Remarks..."
                              className="h-7 text-xs"
                              list={`remarks-${index}`}
                              style={{
                                whiteSpace: wordWrap ? "normal" : "nowrap"
                              }}
                            />
                            <datalist id={`remarks-${index}`}>
                              {getPreviousRemarks(camera.camera_id).map((remark, idx) => (
                                <option key={idx} value={remark} />
                              ))}
                            </datalist>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signature Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t">
              <div>
                <Label htmlFor="checked_by">Checked By</Label>
                <Input
                  id="checked_by"
                  value={checklistFormData.checked_by}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, checked_by: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="verified_by">Verified By</Label>
                <Input
                  id="verified_by"
                  value={checklistFormData.verified_by}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, verified_by: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="approved_by">Approved By</Label>
                <Input
                  id="approved_by"
                  value={checklistFormData.approved_by}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, approved_by: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsChecklistDialogOpen(false);
                setIsViewChecklistOpen(false);
                setSelectedChecklist(null);
              }}
            >
              Cancel
            </Button>
            {isViewChecklistOpen && selectedChecklist ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handlePrintChecklist(selectedChecklist, selectedNvr)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={handleUpdateChecklist} className="bg-gradient-to-r from-primary to-primary/80">
                  Update Checklist
                </Button>
              </>
            ) : (
              <Button onClick={handleSaveChecklist} className="bg-gradient-to-r from-primary to-primary/80">
                Save Checklist
              </Button>
            )}
          </DialogFooter>
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
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Checklist
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the checklist from <span className="font-semibold text-foreground">{deleteConfirmDialog.date}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
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
              Delete Checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CCTVCheckList;
