import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Monitor,
  Smartphone,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  Shield,
  HardDrive,
  Printer,
  Calendar,
  Network,
  Eye,
  Download,
  Upload,
  Filter,
  Camera,
  Image as ImageIcon,
  X
} from "lucide-react";
import dbService from "@/services/dbService";

const deviceTypes = [
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "Desktop" },
  { value: "ip_phone", label: "IP Phone" }
];

const windowsVersions = [
  { value: "windows_10_pro", label: "Windows 10 Pro" },
  { value: "windows_11_pro", label: "Windows 11 Pro" },
  { value: "windows_10_enterprise", label: "Windows 10 Enterprise" },
  { value: "windows_server_2019", label: "Windows Server 2019 Standard" },
  { value: "windows_10_iot", label: "Windows 10 IoT Enterprise" }
];

const Accessories = () => {
  const { toast } = useToast();
  const [accessories, setAccessories] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  const [formData, setFormData] = useState({
    unit: "",
    division: "",
    sl_no: "",
    pc_no: "",
    employee_name: "",
    designation: "",
    email: "",
    device_type: "",
    specification: "",
    mobile: "",
    ip_no: "",
    phone_no: "",
    ip_phone: "",
    unit_office: "",
    ultraview_id: "",
    anydesk_id: "",
    windows_version: "",
    antivirus_code: "",
    antivirus_validity: "",
    printer: "",
    scanner: "",
    boot_partition: "",
    peripherals: [],
    purchase_date: "",
    remarks: "",
    picture: ""
  });

  const [peripheralForm, setPeripheralForm] = useState({
    product_type: "",
    exchange_date: new Date().toISOString().slice(0, 16),
    exchange_reason: "",
    quantity: 1,
    exchange_history: []
  });
  const [editingPeripheralIndex, setEditingPeripheralIndex] = useState(null);
  const [showPeripheralDialog, setShowPeripheralDialog] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const accessoriesData = await dbService.getITAssets();
    const usersData = await dbService.getUsers();
    const departmentsData = await dbService.getDepartments();
    const unitsData = await dbService.getUnits();
    
    setAccessories(accessoriesData);
    setUsers(usersData);
    setDepartments(departmentsData);
    setUnits(unitsData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Find the selected unit's ID
    const selectedUnit = units.find(unit => unit.name === formData.unit_office);
    const dataToSubmit = {
      ...formData,
      unit_id: selectedUnit?.id || 1
    };
    
    if (editingAccessory) {
      await dbService.updateITAsset(editingAccessory.id, dataToSubmit);
      toast({
        title: "IT Asset updated",
        description: "IT Asset information has been updated successfully.",
      });
    } else {
      await dbService.addITAsset(dataToSubmit);
      toast({
        title: "IT Asset added",
        description: "New IT Asset has been added successfully.",
      });
    }
    
    await loadData();
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (accessory) => {
    setEditingAccessory(accessory);
    // Convert old string-based peripherals to new array format if needed
    const peripheralsData = Array.isArray(accessory.peripherals) 
      ? accessory.peripherals 
      : [];
    setFormData({
      ...accessory,
      peripherals: peripheralsData
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this IT asset?")) {
      await dbService.deleteITAsset(id);
      await loadData();
      toast({
        title: "IT Asset deleted",
        description: "IT Asset has been deleted successfully.",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      unit: "",
      division: "",
      sl_no: "",
      pc_no: "",
      employee_name: "",
      designation: "",
      email: "",
      device_type: "",
      specification: "",
      mobile: "",
      phone_no: "",
      ip_phone: "",
      ip_no: "",
      unit_office: "",
      ultraview_id: "",
      anydesk_id: "",
      windows_version: "",
      antivirus_code: "",
      antivirus_validity: "",
      printer: "",
      scanner: "",
      boot_partition: "",
      peripherals: [],
      purchase_date: "",
      remarks: "",
      picture: ""
    });
    setEditingAccessory(null);
  };

  const resetPeripheralForm = () => {
    setPeripheralForm({
      product_type: "",
      exchange_date: new Date().toISOString().slice(0, 16),
      exchange_reason: "",
      quantity: 1,
      exchange_history: []
    });
    setEditingPeripheralIndex(null);
  };

  const handleAddPeripheral = () => {
    if (!peripheralForm.product_type) {
      toast({
        title: "Error",
        description: "Please enter a product type",
        variant: "destructive",
      });
      return;
    }

    const currentDate = new Date().toISOString().slice(0, 16);
    const exchangeEntry = {
      date: peripheralForm.exchange_date || currentDate,
      reason: peripheralForm.exchange_reason
    };

    if (editingPeripheralIndex !== null) {
      const updatedPeripherals = [...formData.peripherals];
      const existingPeripheral = updatedPeripherals[editingPeripheralIndex];
      
      // Add to exchange history
      const updatedHistory = [...(existingPeripheral.exchange_history || []), exchangeEntry];
      
      updatedPeripherals[editingPeripheralIndex] = {
        ...peripheralForm,
        exchange_history: updatedHistory,
        exchange_date: peripheralForm.exchange_date || currentDate
      };
      
      setFormData({ ...formData, peripherals: updatedPeripherals });
      toast({
        title: "Peripheral updated",
        description: "Peripheral has been updated successfully.",
      });
    } else {
      const newPeripheral = {
        ...peripheralForm,
        exchange_date: peripheralForm.exchange_date || currentDate,
        exchange_history: [exchangeEntry]
      };
      setFormData({ ...formData, peripherals: [...formData.peripherals, newPeripheral] });
      toast({
        title: "Peripheral added",
        description: "Peripheral has been added successfully.",
      });
    }
    
    setShowPeripheralDialog(false);
    resetPeripheralForm();
  };

  const handleEditPeripheral = (index) => {
    setEditingPeripheralIndex(index);
    setPeripheralForm(formData.peripherals[index]);
    setShowPeripheralDialog(true);
  };

  const handleDeletePeripheral = (index) => {
    const updatedPeripherals = formData.peripherals.filter((_, i) => i !== index);
    setFormData({ ...formData, peripherals: updatedPeripherals });
    toast({
      title: "Peripheral deleted",
      description: "Peripheral has been removed successfully.",
    });
  };

  const getPeripheralStats = () => {
    const stats = {};
    formData.peripherals.forEach(peripheral => {
      if (!stats[peripheral.product_type]) {
        stats[peripheral.product_type] = 0;
      }
      stats[peripheral.product_type] += parseInt(peripheral.quantity) || 0;
    });
    return stats;
  };

  const getTotalPeripherals = () => {
    return formData.peripherals.reduce((total, peripheral) => {
      return total + (parseInt(peripheral.quantity) || 0);
    }, 0);
  };

  const getFilteredAccessories = () => {
    let filtered = accessories;
    
    // Apply category filter first
    if (filterCategory !== "all") {
      filtered = dbService.getFilteredAssetsByCategory(filterCategory);
    }
    
    // Then apply search, department, and unit filters
    return filtered.filter((accessory) => {
      const matchesSearch = Object.values(accessory).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesDepartment = filterDepartment === "all" || accessory.division === filterDepartment;
      const matchesUnit = filterUnit === "all" || accessory.unit_office === filterUnit;
      return matchesSearch && matchesDepartment && matchesUnit;
    });
  };

  const filteredAccessories = getFilteredAccessories();

  const getBadgeVariant = (type) => {
    const typeMap = {
      "laptop": "default",
      "desktop": "secondary",
      "server": "destructive"
    };
    return typeMap[type?.toLowerCase()] || "outline";
  };

  const handleExportData = () => {
    const data = dbService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mnr_it_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Data exported",
      description: "IT data has been exported successfully.",
    });
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const data = JSON.parse(result);
            const success = dbService.importData(data);
            if (success) {
              loadData();
              toast({
                title: "Data imported",
                description: "IT data has been imported successfully.",
              });
            } else {
              throw new Error("Import failed");
            }
          } else {
            throw new Error("Invalid file format");
          }
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Failed to import data. Please check the file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleViewDetails = (asset) => {
    // Convert old string-based peripherals to new array format if needed
    const peripheralsData = Array.isArray(asset.peripherals) 
      ? asset.peripherals 
      : [];
    setSelectedAsset({
      ...asset,
      peripherals: peripheralsData
    });
    setViewDetailsDialog(true);
  };

  const handlePictureUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setFormData({ ...formData, picture: result });
          toast({
            title: "Picture uploaded",
            description: "User picture has been uploaded successfully.",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePicture = () => {
    setFormData({ ...formData, picture: "" });
    toast({
      title: "Picture deleted",
      description: "User picture has been deleted successfully.",
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
      });
      setCameraStream(stream);
      setShowCameraDialog(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraDialog(false);
  };

  const capturePhoto = () => {
    const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
    if (!videoElement) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoElement, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    setFormData({ ...formData, picture: imageData });
    stopCamera();
    toast({
      title: "Photo captured",
      description: "User photo has been captured successfully.",
    });
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    if (cameraStream) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(newFacingMode);
        startCamera();
      }, 100);
    }
  };

  const handlePrintOverview = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dataToUse = filteredAccessories;
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Get stats
    const totalAssets = dataToUse.length;
    const laptopCount = dataToUse.filter(a => a.device_type?.toLowerCase() === 'laptop').length;
    const desktopCount = dataToUse.filter(a => a.device_type?.toLowerCase() === 'desktop').length;
    const activeCount = dataToUse.filter(a => !a.remarks?.toLowerCase().includes('repair')).length;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IT Assets Overview - MNR Group IT</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          @media print {
            html, body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
            color: white;
            padding: 25px 30px;
            border-radius: 16px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 10px 40px rgba(99, 102, 241, 0.3);
          }
          .header-title {
            font-size: 28px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .header-subtitle {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 4px;
          }
          .header-date {
            text-align: right;
            font-size: 13px;
            opacity: 0.9;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 25px;
          }
          .stat-card {
            background: white;
            border-radius: 14px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.05);
          }
          .stat-card.blue { border-left: 4px solid #3b82f6; }
          .stat-card.purple { border-left: 4px solid #8b5cf6; }
          .stat-card.green { border-left: 4px solid #10b981; }
          .stat-card.orange { border-left: 4px solid #f59e0b; }
          .stat-value {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .stat-card.blue .stat-value { color: #3b82f6; }
          .stat-card.purple .stat-value { color: #8b5cf6; }
          .stat-card.green .stat-value { color: #10b981; }
          .stat-card.orange .stat-value { color: #f59e0b; }
          .stat-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
          }
          .table-container {
            background: white;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .table-header {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            padding: 16px 20px;
            font-size: 16px;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #f1f5f9;
            padding: 12px 16px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
          }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 12px;
            color: #334155;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          tr:hover {
            background: #f0f9ff;
          }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .badge-laptop {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
          }
          .badge-desktop {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }
          .footer {
            margin-top: 25px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            padding: 15px;
            border-top: 1px solid #e2e8f0;
          }
          .no-print {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
          }
          .no-print:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <button class="no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        
        <div class="header">
          <div>
            <div class="header-title">MNR Group IT</div>
            <div class="header-subtitle">IT Assets Overview Report</div>
          </div>
          <div class="header-date">
            Generated: ${currentDate}<br/>
            ${filterUnit !== 'all' ? 'Unit: ' + filterUnit : 'All Units'}
            ${filterDepartment !== 'all' ? ' | Dept: ' + filterDepartment : ''}
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-value">${totalAssets}</div>
            <div class="stat-label">Total Assets</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-value">${laptopCount}</div>
            <div class="stat-label">Laptops</div>
          </div>
          <div class="stat-card green">
            <div class="stat-value">${desktopCount}</div>
            <div class="stat-label">Desktops</div>
          </div>
          <div class="stat-card orange">
            <div class="stat-value">${activeCount}</div>
            <div class="stat-label">Active</div>
          </div>
        </div>

          <div class="table-container">
          <div class="table-header">📊 IT Assets List (${totalAssets} items)</div>
          <table>
            <thead>
              <tr>
                <th>SL</th>
                <th>Employee Name</th>
                <th>Designation</th>
                <th>PC No</th>
                <th>Device Type</th>
                <th>Department</th>
                <th>Unit/Office</th>
                <th>IP Address</th>
                <th>IP Phone</th>
                <th>Antivirus Code</th>
                <th>Antivirus Validity</th>
              </tr>
            </thead>
            <tbody>
              ${dataToUse.map((asset, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${asset.employee_name || '-'}</strong></td>
                  <td>${asset.designation || '-'}</td>
                  <td>${asset.pc_no || '-'}</td>
                  <td><span class="badge badge-${asset.device_type?.toLowerCase() || 'laptop'}">${asset.device_type || '-'}</span></td>
                  <td>${asset.division || '-'}</td>
                  <td>${asset.unit_office || '-'}</td>
                  <td>${asset.ip_no || '-'}</td>
                  <td>${asset.ip_phone || '-'}</td>
                  <td>${asset.antivirus_code || '-'}</td>
                  <td>${asset.antivirus_validity ? new Date(asset.antivirus_validity).toLocaleDateString('en-GB') : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>        <div class="footer">
          © ${new Date().getFullYear()} MNR Group IT Department. All rights reserved.
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="mx-auto p-6 space-y-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sky-800">IT Assets Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all IT assets and devices</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-sky-600 hover:bg-sky-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add IT Asset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sky-700 flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            IT Assets Overview
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrintOverview}
              className="ml-auto border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </CardTitle>
          <CardDescription>
            Complete list of all IT assets with filtering and search capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search IT assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-sky-200 focus:border-sky-400"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48 border-sky-200">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="laptops">Laptops</SelectItem>
                <SelectItem value="desktops">Desktops</SelectItem>
                <SelectItem value="in_repair">In Repair</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired_antivirus">Expired Antivirus</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-full sm:w-48 border-sky-200">
                <SelectValue placeholder="Filter by Unit/Office" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units/Offices</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full sm:w-48 border-sky-200">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={handleExportData}
                variant="outline"
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => document.getElementById('import-file').click()}
                variant="outline"
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </div>
          </div>

          <div className="rounded-md border border-sky-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-50">
                  <TableHead className="text-sky-700 font-semibold">Employee</TableHead>
                  <TableHead className="text-sky-700 font-semibold">Device</TableHead>
                  <TableHead className="text-sky-700 font-semibold">Type</TableHead>
                  <TableHead className="text-sky-700 font-semibold">Department</TableHead>
                  <TableHead className="text-sky-700 font-semibold">Unit/Office</TableHead>
                  <TableHead className="text-sky-700 font-semibold">IP Address</TableHead>
                  <TableHead className="text-sky-700 font-semibold">Antivirus</TableHead>
                  <TableHead className="text-sky-700 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccessories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No IT assets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccessories.map((accessory) => (
                    <TableRow key={accessory.id} className="hover:bg-sky-50/50">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold text-gray-900">{accessory.employee_name}</div>
                          <div className="text-sm text-gray-500">{accessory.designation}</div>
                          <div className="text-xs text-gray-400">{accessory.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{accessory.pc_no}</div>
                          <div className="text-sm text-gray-500">SL: {accessory.sl_no}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(accessory.device_type)} className="capitalize">
                          {accessory.device_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{accessory.division}</TableCell>
                      <TableCell>{accessory.unit_office}</TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:text-sky-600 transition-colors"
                          onClick={() => {
                            if (accessory.ip_no) {
                              navigator.clipboard.writeText(accessory.ip_no);
                              window.open(`tightvnc://${accessory.ip_no}`, '_blank');
                              toast({
                                title: "IP Copied & TightVNC Opened",
                                description: `${accessory.ip_no} copied to clipboard`,
                              });
                            }
                          }}
                          title="Click to copy IP and open TightVNC"
                        >
                          <Network className="h-3 w-3 text-gray-400" />
                          {accessory.ip_no}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{accessory.antivirus_code}</div>
                          <div className="text-xs text-gray-500">
                            {accessory.antivirus_validity && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(accessory.antivirus_validity).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(accessory)}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(accessory)}
                            className="border-sky-200 text-sky-700 hover:bg-sky-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(accessory.id)}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* IT Asset Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sky-700">
              {editingAccessory ? "Edit IT Asset" : "Add New IT Asset"}
            </DialogTitle>
            <DialogDescription>
              {editingAccessory ? "Update IT asset information" : "Enter the details for the new IT asset"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Employee Information */}
              <div className="md:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-semibold text-sky-700 mb-4 flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Employee Information
                </h3>
              </div>

              {/* User Picture */}
              <div className="md:col-span-2 lg:col-span-3">
                <Label>User Picture</Label>
                <div className="flex items-center gap-4 mt-2">
                  {formData.picture && (
                    <div className="relative">
                      <img 
                        src={formData.picture} 
                        alt="User" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-sky-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                        onClick={handleDeletePicture}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('picture-upload').click()}
                      className="border-sky-200 text-sky-700"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Upload Picture
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startCamera}
                      className="border-sky-200 text-sky-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Photo
                    </Button>
                    <input
                      id="picture-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="employee_name">Employee Name *</Label>
                <Input
                  id="employee_name"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  required
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  required
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="ip_phone">IP Phone</Label>
                <Input
                  id="ip_phone"
                  value={formData.ip_phone}
                  onChange={(e) => setFormData({ ...formData, ip_phone: e.target.value })}
                  placeholder="e.g., 101, 201"
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="division">Department/Division *</Label>
                <Input
                  id="division"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  required
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="unit_office">Unit/Office *</Label>
                <Select value={formData.unit_office} onValueChange={(value) => setFormData({ ...formData, unit_office: value })}>
                  <SelectTrigger className="border-sky-200">
                    <SelectValue placeholder="Select unit/office" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Device Information */}
              <div className="md:col-span-2 lg:col-span-3 mt-6">
                <h3 className="text-lg font-semibold text-sky-700 mb-4 flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Device Information
                </h3>
              </div>
              
              <div>
                <Label htmlFor="device_type">Device Type *</Label>
                <Select value={formData.device_type} onValueChange={(value) => setFormData({ ...formData, device_type: value })}>
                  <SelectTrigger className="border-sky-200">
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pc_no">PC Number *</Label>
                <Input
                  id="pc_no"
                  value={formData.pc_no}
                  onChange={(e) => setFormData({ ...formData, pc_no: e.target.value })}
                  required
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="sl_no">Serial Number</Label>
                <Input
                  id="sl_no"
                  value={formData.sl_no}
                  onChange={(e) => setFormData({ ...formData, sl_no: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="ip_no">IP Address</Label>
                <Input
                  id="ip_no"
                  value={formData.ip_no}
                  onChange={(e) => setFormData({ ...formData, ip_no: e.target.value })}
                  placeholder="192.168.1.100"
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="windows_version">Windows Version</Label>
                <Select value={formData.windows_version} onValueChange={(value) => setFormData({ ...formData, windows_version: value })}>
                  <SelectTrigger className="border-sky-200">
                    <SelectValue placeholder="Select Windows version" />
                  </SelectTrigger>
                  <SelectContent>
                    {windowsVersions.map(version => (
                      <SelectItem key={version.value} value={version.value}>{version.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="specification">Specification</Label>
                <Textarea
                  id="specification"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  placeholder="Hardware specifications..."
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>

              {/* Remote Access */}
              <div className="md:col-span-2 lg:col-span-3 mt-6">
                <h3 className="text-lg font-semibold text-sky-700 mb-4 flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Remote Access
                </h3>
              </div>
              
              <div>
                <Label htmlFor="ultraview_id">UltraViewer ID</Label>
                <Input
                  id="ultraview_id"
                  value={formData.ultraview_id}
                  onChange={(e) => setFormData({ ...formData, ultraview_id: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="anydesk_id">AnyDesk ID</Label>
                <Input
                  id="anydesk_id"
                  value={formData.anydesk_id}
                  onChange={(e) => setFormData({ ...formData, anydesk_id: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>

              {/* Security Information */}
              <div className="md:col-span-2 lg:col-span-3 mt-6">
                <h3 className="text-lg font-semibold text-sky-700 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Software
                </h3>
              </div>
              
              <div>
                <Label htmlFor="antivirus_code">Antivirus Code</Label>
                <Input
                  id="antivirus_code"
                  value={formData.antivirus_code}
                  onChange={(e) => setFormData({ ...formData, antivirus_code: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="antivirus_validity">Antivirus Validity</Label>
                <Input
                  id="antivirus_validity"
                  type="date"
                  value={formData.antivirus_validity}
                  onChange={(e) => setFormData({ ...formData, antivirus_validity: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="boot_partition">Boot Partition</Label>
                <Input
                  id="boot_partition"
                  value={formData.boot_partition}
                  onChange={(e) => setFormData({ ...formData, boot_partition: e.target.value })}
                  placeholder="C: Drive, etc."
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>

              {/* Peripherals */}
              <div className="md:col-span-2 lg:col-span-3 mt-6">
                <h3 className="text-lg font-semibold text-sky-700 mb-4 flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Peripherals & Others
                </h3>
              </div>
              
              <div>
                <Label htmlFor="printer">Printer</Label>
                <Input
                  id="printer"
                  value={formData.printer}
                  onChange={(e) => setFormData({ ...formData, printer: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="scanner">Scanner</Label>
                <Input
                  id="scanner"
                  value={formData.scanner}
                  onChange={(e) => setFormData({ ...formData, scanner: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              <div>
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
              
              {/* Peripherals Management */}
              <div className="md:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <Label>Peripherals Management</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      resetPeripheralForm();
                      setShowPeripheralDialog(true);
                    }}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Peripheral
                  </Button>
                </div>
                
                {formData.peripherals.length > 0 ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-sky-700">Total Peripherals: {getTotalPeripherals()}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {Object.entries(getPeripheralStats()).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between bg-white p-2 rounded">
                            <span className="font-medium capitalize">{type}:</span>
                            <Badge variant="secondary">{String(count)}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border border-sky-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-sky-50">
                            <TableHead className="text-sky-700">Product Type</TableHead>
                            <TableHead className="text-sky-700">Quantity</TableHead>
                            <TableHead className="text-sky-700">Exchange Date</TableHead>
                            <TableHead className="text-sky-700">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.peripherals.map((peripheral, index) => (
                            <TableRow key={index}>
                              <TableCell className="capitalize font-medium">{peripheral.product_type}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{peripheral.quantity}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(peripheral.exchange_date).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditPeripheral(index)}
                                    className="border-sky-200 text-sky-700 hover:bg-sky-50"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeletePeripheral(index)}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-sky-200 rounded-lg text-center text-gray-500 text-sm">
                    No peripherals added. Click "Add Peripheral" to add items.
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Additional notes or remarks..."
                  className="border-sky-200 focus:border-sky-400"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                {editingAccessory ? "Update User" : "Add User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Asset Details View Dialog */}
      <Dialog open={viewDetailsDialog} onOpenChange={setViewDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto print:block print:max-w-full print:max-h-none print:overflow-visible print:p-0">
          <DialogHeader className="flex flex-row items-start justify-between space-y-0 print:hidden">
            <div>
              <DialogTitle className="text-2xl font-bold text-sky-700">IT Asset Profile</DialogTitle>
              <DialogDescription>
                Complete information about the selected IT asset
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!selectedAsset) return;
                  const printWindow = window.open("", "_blank", "width=900,height=700");
                  if (!printWindow) return;
                  
                  // Calculate peripherals totals for print
                  const peripheralStatsPrint: { [key: string]: number } = {};
                  if (selectedAsset.peripherals && selectedAsset.peripherals.length > 0) {
                    selectedAsset.peripherals.forEach((p: any) => {
                      if (!peripheralStatsPrint[p.product_type]) {
                        peripheralStatsPrint[p.product_type] = 0;
                      }
                      peripheralStatsPrint[p.product_type] += parseInt(p.quantity) || 0;
                    });
                  }
                  const totalPeripheralsPrint = Object.values(peripheralStatsPrint).reduce((sum, val) => sum + val, 0);
                  
                  const peripheralsSummaryPrintHtml = Object.keys(peripheralStatsPrint).length > 0 
                    ? `<div style="margin-top: 10px; padding: 10px; background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px;"><strong>Peripherals Summary:</strong><br/>${Object.entries(peripheralStatsPrint).map(([type, count]) => `${type} Total: ${count}`).join('<br/>')}<br/><strong style="font-size: 14px;">Total Peripherals: ${totalPeripheralsPrint}</strong></div>` 
                    : '';
                  
                  const peripheralsHtml = selectedAsset.peripherals && selectedAsset.peripherals.length > 0 
                    ? `<div style="margin-top: 15px;"><h3 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 5px; margin-bottom: 10px;">Peripherals</h3><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #0284c7; color: white;"><th style="padding: 8px; border: 1px solid #ddd;">Product</th><th style="padding: 8px; border: 1px solid #ddd;">Qty</th><th style="padding: 8px; border: 1px solid #ddd;">Date</th></tr></thead><tbody>${selectedAsset.peripherals.map((p: any) => `<tr><td style="padding: 8px; border: 1px solid #ddd;">${p.product_type}</td><td style="padding: 8px; border: 1px solid #ddd;">${p.quantity}</td><td style="padding: 8px; border: 1px solid #ddd;">${p.exchange_date ? new Date(p.exchange_date).toLocaleDateString() : '-'}</td></tr>`).join('')}</tbody></table>${peripheralsSummaryPrintHtml}</div>` 
                    : '';
                  
                  const content = `<!DOCTYPE html><html><head><title>IT Asset Profile - ${selectedAsset.employee_name}</title><style>@page { size: A4; margin: 10mm; } body { font-family: Arial, sans-serif; padding: 20px; } .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0284c7; padding-bottom: 15px; } .header img { height: 60px; } .header h1 { color: #0284c7; margin: 10px 0 5px; } .profile-pic { width: 150px; height: 150px; border-radius: 50%; border: 4px solid #0284c7; object-fit: cover; display: block; margin: 0 auto 15px; } .name { text-align: center; font-size: 24px; font-weight: bold; color: #0284c7; } .designation { text-align: center; color: #666; margin-bottom: 20px; } .section { margin-bottom: 20px; } .section h3 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 5px; margin-bottom: 10px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; } .item { background: #f0f9ff; padding: 10px; border-left: 4px solid #0284c7; border-radius: 4px; } .item-label { font-size: 12px; color: #666; font-weight: bold; } .item-value { font-size: 14px; color: #333; }</style></head><body><div class="header"><img src="/logo/logo_1.png" alt="MNR Logo" /><h1>MNR Group</h1><p>IT Asset Profile</p></div>${selectedAsset.picture ? `<img src="${selectedAsset.picture}" class="profile-pic" />` : ''}<div class="name">${selectedAsset.employee_name}</div><div class="designation">${selectedAsset.designation || '-'}</div><div class="section"><h3>Personal Information</h3><div class="grid"><div class="item"><div class="item-label">Email</div><div class="item-value">${selectedAsset.email || '-'}</div></div><div class="item"><div class="item-label">Mobile</div><div class="item-value">${selectedAsset.mobile || '-'}</div></div><div class="item"><div class="item-label">Department</div><div class="item-value">${selectedAsset.division || '-'}</div></div><div class="item"><div class="item-label">Unit/Office</div><div class="item-value">${selectedAsset.unit_office || '-'}</div></div></div></div><div class="section"><h3>Device Information</h3><div class="grid"><div class="item"><div class="item-label">PC No</div><div class="item-value">${selectedAsset.pc_no || '-'}</div></div><div class="item"><div class="item-label">Serial No</div><div class="item-value">${selectedAsset.sl_no || '-'}</div></div><div class="item"><div class="item-label">Device Type</div><div class="item-value">${selectedAsset.device_type || '-'}</div></div><div class="item"><div class="item-label">IP Address</div><div class="item-value">${selectedAsset.ip_no || '-'}</div></div><div class="item"><div class="item-label">IP Phone</div><div class="item-value">${selectedAsset.ip_phone || '-'}</div></div><div class="item"><div class="item-label">Windows</div><div class="item-value">${selectedAsset.windows_version || '-'}</div></div><div class="item"><div class="item-label">Specification</div><div class="item-value">${selectedAsset.specification || '-'}</div></div></div></div><div class="section"><h3>Remote Access</h3><div class="grid"><div class="item"><div class="item-label">UltraViewer ID</div><div class="item-value">${selectedAsset.ultraview_id || '-'}</div></div><div class="item"><div class="item-label">AnyDesk ID</div><div class="item-value">${selectedAsset.anydesk_id || '-'}</div></div></div></div><div class="section"><h3>Security</h3><div class="grid"><div class="item"><div class="item-label">Antivirus Code</div><div class="item-value">${selectedAsset.antivirus_code || '-'}</div></div><div class="item"><div class="item-label">Validity</div><div class="item-value">${selectedAsset.antivirus_validity || '-'}</div></div><div class="item"><div class="item-label">Printer</div><div class="item-value">${selectedAsset.printer || '-'}</div></div><div class="item"><div class="item-label">Scanner</div><div class="item-value">${selectedAsset.scanner || '-'}</div></div></div></div>${peripheralsHtml}</body></html>`;
                  
                  printWindow.document.open();
                  printWindow.document.write(content);
                  printWindow.document.close();
                  printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={() => {
                  if (!selectedAsset) return;
                  // Calculate peripherals totals
                  const peripheralStats: { [key: string]: number } = {};
                  if (selectedAsset.peripherals && selectedAsset.peripherals.length > 0) {
                    selectedAsset.peripherals.forEach((p: any) => {
                      if (!peripheralStats[p.product_type]) {
                        peripheralStats[p.product_type] = 0;
                      }
                      peripheralStats[p.product_type] += parseInt(p.quantity) || 0;
                    });
                  }
                  const totalPeripherals = Object.values(peripheralStats).reduce((sum, val) => sum + val, 0);
                  
                  const peripheralsSummaryHtml = Object.keys(peripheralStats).length > 0 
                    ? `<div style="margin-top: 10px; padding: 10px; background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px;"><strong>Peripherals Summary:</strong><br/>${Object.entries(peripheralStats).map(([type, count]) => `${type}: ${count}`).join('<br/>')}<br/><strong>Total Peripherals: ${totalPeripherals}</strong></div>` 
                    : '';
                  
                  const peripheralsHtml = selectedAsset.peripherals && selectedAsset.peripherals.length > 0 
                    ? `<div style="margin-top: 15px;"><h3 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 5px; margin-bottom: 10px;">Peripherals</h3><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #0284c7; color: white;"><th style="padding: 8px; border: 1px solid #ddd;">Product</th><th style="padding: 8px; border: 1px solid #ddd;">Qty</th><th style="padding: 8px; border: 1px solid #ddd;">Date</th></tr></thead><tbody>${selectedAsset.peripherals.map((p: any) => `<tr><td style="padding: 8px; border: 1px solid #ddd;">${p.product_type}</td><td style="padding: 8px; border: 1px solid #ddd;">${p.quantity}</td><td style="padding: 8px; border: 1px solid #ddd;">${p.exchange_date ? new Date(p.exchange_date).toLocaleDateString() : '-'}</td></tr>`).join('')}</tbody></table>${peripheralsSummaryHtml}</div>` 
                    : '';

                  // Calculate peripheral totals
                  const peripheralTotals: { [key: string]: number } = {};
                  if (selectedAsset.peripherals && selectedAsset.peripherals.length > 0) {
                    selectedAsset.peripherals.forEach((p: any) => {
                      const type = p.product_type || 'Unknown';
                      peripheralTotals[type] = (peripheralTotals[type] || 0) + (parseInt(p.quantity) || 1);
                    });
                  }
                  
                  const totalsHtml = Object.entries(peripheralTotals).map(([type, count]) => 
                    `<div class="total-item"><strong>${type} Total:</strong> ${count}</div>`
                  ).join('');

                  // Generate PDF-like content in new window
                  const pdfWindow = window.open("", "_blank", "width=900,height=700");
                  if (!pdfWindow) {
                    toast({ title: "Error", description: "Popup blocked. Please allow popups and try again.", variant: "destructive" });
                    return;
                  }
                  
                  const content = `<!DOCTYPE html><html><head><title>IT User Profile - ${selectedAsset.employee_name}</title><style>@page { size: A4; margin: 10mm; } @media print { html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .download-btn { display: none !important; } } body { font-family: Arial, sans-serif; padding: 20px; margin: 0; } .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0284c7; padding-bottom: 15px; } .header img { height: 60px; } .header h1 { color: #0284c7; margin: 10px 0 5px; } .header p { color: #666; margin: 0; } .profile-pic { width: 150px; height: 150px; border-radius: 50%; border: 4px solid #0284c7; object-fit: cover; display: block; margin: 0 auto 15px; } .name { text-align: center; font-size: 24px; font-weight: bold; color: #0284c7; } .designation { text-align: center; color: #666; margin-bottom: 20px; } .section { margin-bottom: 20px; page-break-inside: avoid; } .section h3 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 5px; margin-bottom: 10px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; } .item { background: #f0f9ff; padding: 10px; border-left: 4px solid #0284c7; border-radius: 4px; } .item-label { font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase; } .item-value { font-size: 14px; color: #333; margin-top: 3px; } .download-btn { position: fixed; top: 10px; right: 10px; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3); transition: all 0.3s; } .download-btn:hover { background: linear-gradient(135deg, #0369a1, #075985); transform: translateY(-2px); } .peripherals-table { width: 100%; border-collapse: collapse; margin-top: 10px; } .peripherals-table th, .peripherals-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 13px; } .peripherals-table th { background: #0284c7; color: white; } .peripherals-table tr:nth-child(even) { background: #f0f9ff; } .totals-section { background: linear-gradient(135deg, #0284c7, #0369a1); color: white; padding: 15px; border-radius: 8px; margin-top: 15px; } .totals-section h4 { margin: 0 0 10px 0; font-size: 14px; } .total-item { display: inline-block; background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 15px; margin: 3px; font-size: 13px; } .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; color: #666; font-size: 12px; }</style></head><body><button class="download-btn" onclick="window.print()">📄 Save as PDF</button><div class="header"><img src="/logo/logo_1.png" alt="MNR Logo" /><h1>MNR Group IT</h1><p>IT User Profile</p></div>${selectedAsset.picture ? `<img src="${selectedAsset.picture}" class="profile-pic" />` : ''}<div class="name">${selectedAsset.employee_name}</div><div class="designation">${selectedAsset.designation || '-'}</div><div class="section"><h3>Personal Information</h3><div class="grid"><div class="item"><div class="item-label">Email</div><div class="item-value">${selectedAsset.email || '-'}</div></div><div class="item"><div class="item-label">Mobile</div><div class="item-value">${selectedAsset.mobile || '-'}</div></div><div class="item"><div class="item-label">Department</div><div class="item-value">${selectedAsset.division || '-'}</div></div><div class="item"><div class="item-label">Unit/Office</div><div class="item-value">${selectedAsset.unit_office || '-'}</div></div></div></div><div class="section"><h3>Device Information</h3><div class="grid"><div class="item"><div class="item-label">PC No</div><div class="item-value">${selectedAsset.pc_no || '-'}</div></div><div class="item"><div class="item-label">Serial No</div><div class="item-value">${selectedAsset.sl_no || '-'}</div></div><div class="item"><div class="item-label">Device Type</div><div class="item-value">${selectedAsset.device_type || '-'}</div></div><div class="item"><div class="item-label">IP Address</div><div class="item-value">${selectedAsset.ip_no || '-'}</div></div><div class="item"><div class="item-label">IP Phone</div><div class="item-value">${selectedAsset.ip_phone || '-'}</div></div><div class="item"><div class="item-label">Windows</div><div class="item-value">${selectedAsset.windows_version || '-'}</div></div><div class="item"><div class="item-label">Specification</div><div class="item-value">${selectedAsset.specification || '-'}</div></div></div></div><div class="section"><h3>Remote Access</h3><div class="grid"><div class="item"><div class="item-label">UltraViewer ID</div><div class="item-value">${selectedAsset.ultraview_id || '-'}</div></div><div class="item"><div class="item-label">AnyDesk ID</div><div class="item-value">${selectedAsset.anydesk_id || '-'}</div></div></div></div><div class="section"><h3>Security & Hardware</h3><div class="grid"><div class="item"><div class="item-label">Antivirus Code</div><div class="item-value">${selectedAsset.antivirus_code || '-'}</div></div><div class="item"><div class="item-label">Validity</div><div class="item-value">${selectedAsset.antivirus_validity || '-'}</div></div><div class="item"><div class="item-label">Printer</div><div class="item-value">${selectedAsset.printer || '-'}</div></div><div class="item"><div class="item-label">Scanner</div><div class="item-value">${selectedAsset.scanner || '-'}</div></div><div class="item"><div class="item-label">Boot Partition</div><div class="item-value">${selectedAsset.boot_partition || '-'}</div></div></div></div>${peripheralsHtml}${totalsHtml ? `<div class="totals-section"><h4>Peripherals Summary</h4>${totalsHtml}</div>` : ''}<div class="footer"><p>Generated by MNR Group IT Management System</p><p>Date: ${new Date().toLocaleDateString()}</p></div></body></html>`;
                  
                  pdfWindow.document.open();
                  pdfWindow.document.write(content);
                  pdfWindow.document.close();
                  toast({ title: "PDF Ready", description: "Click 'Save as PDF' button to download." });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogHeader>
          {selectedAsset && (
            <div className="print-container">
              {/* Print Header */}
              <div className="print-header hidden print:block">
                <div className="flex items-center justify-between mb-4">
                  <img src="/lovable-uploads/20eb7d56-b963-4a41-9830-eead460b0120.png" alt="MNR Group Logo" className="h-16" />
                  <h1 className="text-3xl font-bold text-sky-700">MNR Group</h1>
                </div>
                <h2 className="text-xl font-semibold text-center text-gray-700 border-t-2 border-sky-500 pt-3">IT User Profile</h2>
              </div>

              {/* User Details Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
                {/* Left Column - Picture */}
                <div className="md:col-span-3 flex flex-col items-center">
                  {selectedAsset.picture ? (
                    <img 
                      src={selectedAsset.picture} 
                      alt="User" 
                      className="print-profile-picture w-48 h-48 object-cover rounded-full border-4 border-sky-500 shadow-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-full border-4 border-sky-500 bg-sky-100 flex items-center justify-center">
                      <span className="text-4xl text-sky-600 font-bold">
                        {selectedAsset.employee_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <h3 className="mt-4 text-xl font-bold text-center text-sky-700">{selectedAsset.employee_name}</h3>
                  <p className="text-sm text-gray-600 text-center">{selectedAsset.designation}</p>
                </div>

                {/* Right Column - Information */}
                <div className="md:col-span-9 space-y-6">
                  {/* Employee Information */}
                  <div className="print-section">
                    <h3 className="print-section-title text-lg font-bold text-sky-700 border-b-2 border-sky-200 pb-2 mb-3">
                      Employee Information
                    </h3>
                    <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Email</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.email || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Mobile</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.mobile || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Department</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.division || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Unit/Office</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.unit_office || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Device Information */}
                  <div className="print-section">
                    <h3 className="print-section-title text-lg font-bold text-sky-700 border-b-2 border-sky-200 pb-2 mb-3">
                      Device Information
                    </h3>
                    <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Device Type</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.device_type || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">PC Number</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.pc_no || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Serial Number</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.sl_no || 'N/A'}</p>
                      </div>
                      <div 
                        className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 cursor-pointer hover:bg-sky-100 transition-colors no-print"
                        onClick={() => {
                          if (selectedAsset.ip_no) {
                            navigator.clipboard.writeText(selectedAsset.ip_no);
                            window.open(`tightvnc://${selectedAsset.ip_no}`, '_blank');
                            toast({
                              title: "IP Copied",
                              description: `${selectedAsset.ip_no} copied and TightVNC opened`,
                            });
                          }
                        }}
                        title="Click to open TightVNC and copy IP"
                      >
                        <p className="print-info-label text-xs font-semibold text-gray-600">IP Address</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.ip_no || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 hidden print:block">
                        <p className="print-info-label text-xs font-semibold text-gray-600">IP Address</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.ip_no || 'N/A'}</p>
                      </div>
                      <div 
                        className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 cursor-pointer hover:bg-sky-100 transition-colors no-print"
                        onClick={() => {
                          if (selectedAsset.ip_phone) {
                            navigator.clipboard.writeText(selectedAsset.ip_phone);
                            toast({
                              title: "IP Phone Copied",
                              description: `${selectedAsset.ip_phone} copied to clipboard`,
                            });
                          }
                        }}
                        title="Click to copy IP Phone"
                      >
                        <p className="print-info-label text-xs font-semibold text-gray-600">IP Phone</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.ip_phone || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 hidden print:block">
                        <p className="print-info-label text-xs font-semibold text-gray-600">IP Phone</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.ip_phone || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 md:col-span-2">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Specification</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.specification || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Windows Version</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.windows_version || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                   {/* Remote Access */}
                   <div className="print-section">
                    <h3 className="print-section-title text-lg font-bold text-sky-700 border-b-2 border-sky-200 pb-2 mb-3">
                      Remote Access
                    </h3>
                    <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 cursor-pointer hover:bg-sky-100 transition-colors no-print"
                        onClick={() => {
                          if (selectedAsset.ultraview_id) {
                            navigator.clipboard.writeText(selectedAsset.ultraview_id);
                            window.location.href = `uvnc://${selectedAsset.ultraview_id}`;
                            toast({
                              title: "UltraViewer ID Copied",
                              description: `${selectedAsset.ultraview_id} copied and UltraViewer opening`,
                            });
                          }
                        }}
                        title="Click to copy ID and open UltraViewer"
                      >
                        <p className="print-info-label text-xs font-semibold text-gray-600">UltraViewer ID</p>
                        <p className="print-info-value text-sm font-medium text-blue-600">{selectedAsset.ultraview_id || 'N/A'}</p>
                      </div>
                      <div 
                        className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 cursor-pointer hover:bg-sky-100 transition-colors no-print"
                        onClick={() => {
                          if (selectedAsset.anydesk_id) {
                            navigator.clipboard.writeText(selectedAsset.anydesk_id);
                            window.location.href = `anydesk:${selectedAsset.anydesk_id}`;
                            toast({
                              title: "AnyDesk ID Copied",
                              description: `${selectedAsset.anydesk_id} copied and AnyDesk opening`,
                            });
                          }
                        }}
                        title="Click to copy ID and open AnyDesk"
                      >
                        <p className="print-info-label text-xs font-semibold text-gray-600">AnyDesk ID</p>
                        <p className="print-info-value text-sm font-medium text-blue-600">{selectedAsset.anydesk_id || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 hidden print:block">
                        <p className="print-info-label text-xs font-semibold text-gray-600">UltraViewer ID</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.ultraview_id || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 hidden print:block">
                        <p className="print-info-label text-xs font-semibold text-gray-600">AnyDesk ID</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.anydesk_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="print-section hidden">

                    <h3 className="print-section-title text-lg font-bold text-sky-700 border-b-2 border-sky-200 pb-2 mb-3">
                      Remote Access
                    </h3>
                    <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 cursor-pointer hover:bg-sky-100 transition-colors no-print"
                        onClick={() => {
                          if (selectedAsset.ultraview_id && selectedAsset.ip_no) {
                            navigator.clipboard.writeText(selectedAsset.ip_no);
                            window.open(`ultraviewer://${selectedAsset.ip_no}`, '_blank');
                            toast({
                              title: "IP Copied",
                              description: `${selectedAsset.ip_no} copied and UltraViewer opened`,
                            });
                          }
                        }}
                        title="Click to open UltraViewer and copy IP"
                      >
                        <p className="print-info-label text-xs font-semibold text-gray-600">UltraViewer ID</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.ultraview_id || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 hidden print:block">
                        <p className="print-info-label text-xs font-semibold text-gray-600">UltraViewer ID</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.ultraview_id || 'N/A'}</p>
                      </div>
                      <div 
                        className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 cursor-pointer hover:bg-sky-100 transition-colors no-print"
                        onClick={() => {
                          if (selectedAsset.anydesk_id && selectedAsset.ip_no) {
                            navigator.clipboard.writeText(selectedAsset.ip_no);
                            window.open(`anydesk://${selectedAsset.ip_no}`, '_blank');
                            toast({
                              title: "IP Copied",
                              description: `${selectedAsset.ip_no} copied and AnyDesk opened`,
                            });
                          }
                        }}
                        title="Click to open AnyDesk and copy IP"
                      >
                        <p className="print-info-label text-xs font-semibold text-gray-600">AnyDesk ID</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.anydesk_id || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500 hidden print:block">
                        <p className="print-info-label text-xs font-semibold text-gray-600">AnyDesk ID</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.anydesk_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Security & Software */}
                  <div className="print-section">
                    <h3 className="print-section-title text-lg font-bold text-sky-700 border-b-2 border-sky-200 pb-2 mb-3">
                      Security & Software
                    </h3>
                    <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Antivirus Code</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.antivirus_code || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Antivirus Validity</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.antivirus_validity || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Boot Partition</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.boot_partition || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Peripherals & Others */}
                  <div className="print-section">
                    <h3 className="print-section-title text-lg font-bold text-sky-700 border-b-2 border-sky-200 pb-2 mb-3">
                      Peripherals & Others
                    </h3>
                    <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Printer</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.printer || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Scanner</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.scanner || 'N/A'}</p>
                      </div>
                      <div className="print-info-item bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600">Purchase Date</p>
                        <p className="print-info-value text-sm font-medium">{selectedAsset.purchase_date || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {selectedAsset.peripherals && selectedAsset.peripherals.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sky-700 mb-2">Peripherals List</h4>
                        <table className="print-table w-full border-collapse">
                          <thead>
                            <tr className="bg-sky-600 text-white">
                              <th className="p-2 text-left">Product Type</th>
                              <th className="p-2 text-left">Quantity</th>
                              <th className="p-2 text-left">Exchange Date</th>
                              <th className="p-2 text-left">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAsset.peripherals.map((peripheral, idx) => (
                              <tr key={idx} className="border-b border-sky-100">
                                <td className="p-2 capitalize font-medium">{peripheral.product_type}</td>
                                <td className="p-2">{peripheral.quantity}</td>
                                <td className="p-2 text-xs">{new Date(peripheral.exchange_date).toLocaleString()}</td>
                                <td className="p-2 text-xs">{peripheral.exchange_reason || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {selectedAsset.remarks && (
                      <div className="mt-4 bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
                        <p className="print-info-label text-xs font-semibold text-gray-600 mb-1">Remarks</p>
                        <p className="print-info-value text-sm">{selectedAsset.remarks}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Print Footer */}
              <div className="print-footer hidden print:block mt-8 pt-4 border-t-2 border-sky-200 text-center text-gray-600">
                <p className="text-sm">Created by IT Team - MNR Group</p>
                <p className="text-xs mt-1">Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sky-700">Capture Photo</DialogTitle>
            <DialogDescription>
              Position the camera and click capture to take a photo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                id="camera-preview"
                autoPlay
                playsInline
                ref={(video) => {
                  if (video && cameraStream) {
                    video.srcObject = cameraStream;
                  }
                }}
                className="w-full h-auto"
              />
            </div>
            <div className="flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={switchCamera}
                className="border-sky-200 text-sky-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Switch Camera
              </Button>
              <Button
                type="button"
                onClick={capturePhoto}
                className="bg-sky-600 hover:bg-sky-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={stopCamera}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Peripheral Dialog */}
      <Dialog open={showPeripheralDialog} onOpenChange={setShowPeripheralDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sky-700">
              {editingPeripheralIndex !== null ? "Edit Peripheral" : "Add Peripheral"}
            </DialogTitle>
            <DialogDescription>
              {editingPeripheralIndex !== null ? "Update peripheral information" : "Add a new peripheral item"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product_type">Product Type *</Label>
              <Input
                id="product_type"
                placeholder="Enter product type (e.g., Mouse, Keyboard, Monitor)"
                value={peripheralForm.product_type}
                onChange={(e) => setPeripheralForm({ ...peripheralForm, product_type: e.target.value })}
                className="border-sky-200 focus:border-sky-400"
              />
              <p className="text-xs text-gray-500 mt-1">Type any product name to create it</p>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={peripheralForm.quantity}
                onChange={(e) => setPeripheralForm({ ...peripheralForm, quantity: parseInt(e.target.value) || 1 })}
                className="border-sky-200 focus:border-sky-400"
              />
            </div>
            
            <div>
              <Label htmlFor="exchange_date">Exchange Date & Time</Label>
              <Input
                id="exchange_date"
                type="datetime-local"
                value={peripheralForm.exchange_date}
                onChange={(e) => setPeripheralForm({ ...peripheralForm, exchange_date: e.target.value })}
                className="border-sky-200 focus:border-sky-400"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-fills with current date & time</p>
            </div>

            <div>
              <Label htmlFor="exchange_reason">Exchange Reason</Label>
              <Textarea
                id="exchange_reason"
                placeholder="Reason for exchange..."
                value={peripheralForm.exchange_reason}
                onChange={(e) => setPeripheralForm({ ...peripheralForm, exchange_reason: e.target.value })}
                className="border-sky-200 focus:border-sky-400"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowPeripheralDialog(false);
                  resetPeripheralForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleAddPeripheral}
                className="bg-sky-600 hover:bg-sky-700"
              >
                {editingPeripheralIndex !== null ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accessories;