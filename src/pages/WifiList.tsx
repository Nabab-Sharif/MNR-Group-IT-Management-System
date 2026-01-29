import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Wifi, Plus, Edit, Trash2, Download, ArrowLeft, Printer, Building2, Users, Search, Upload, Copy, Eye, EyeOff } from "lucide-react";
import dbService from "@/services/dbService";
import QRCode from "qrcode";
import WifiPrintCard from "@/components/WifiPrintCard";
import SearchFilter from "@/components/SearchFilter";
import DataImportExport from "@/components/DataImportExport";

interface WifiNetwork {
  id: number;
  wifi_name: string;
  wifi_password: string;
  wifi_area: string;
  wifi_qr_code: string;
  office_name: string;
  department_name: string;
  ip_address: string;
  added_date: string;
}

const WifiList = () => {
  const { toast } = useToast();
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWifi, setEditingWifi] = useState<WifiNetwork | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [printWifi, setPrintWifi] = useState<WifiNetwork | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswordId, setShowPasswordId] = useState<number | null>(null);
  const [filterOffice, setFilterOffice] = useState<string>("__all__");
  const [filterDepartment, setFilterDepartment] = useState<string>("__all__");
  const printRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    wifi_name: "",
    wifi_password: "",
    wifi_area: "",
    office_name: "",
    department_name: "",
    ip_address: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const wifiData = await dbService.getWifiNetworks();
    setWifiNetworks(wifiData || []);
  };

  const generateQRCode = async (ssid: string, password: string) => {
    try {
      const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
      const qrCode = await QRCode.toDataURL(wifiString, { width: 300, margin: 2 });
      return qrCode;
    } catch (error) {
      console.error("Error generating QR code:", error);
      return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const qrCode = await generateQRCode(formData.wifi_name, formData.wifi_password);
      const dataWithQR = { ...formData, wifi_qr_code: qrCode };
      
      if (editingWifi) {
        await dbService.updateWifiNetwork(editingWifi.id, dataWithQR);
        toast({ title: "WiFi network updated", description: "WiFi network has been updated successfully." });
      } else {
        await dbService.addWifiNetwork(dataWithQR);
        toast({ title: "WiFi network added", description: "New WiFi network has been added successfully." });
      }
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error("Error saving WiFi:", error);
      toast({ title: "Error", description: "Failed to save WiFi network.", variant: "destructive" });
    }
  };

  const handleEdit = (wifi: WifiNetwork) => {
    setEditingWifi(wifi);
    setFormData({
      wifi_name: wifi.wifi_name,
      wifi_password: wifi.wifi_password,
      wifi_area: wifi.wifi_area || "",
      office_name: wifi.office_name,
      department_name: wifi.department_name,
      ip_address: wifi.ip_address,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this WiFi network?")) {
      await dbService.deleteWifiNetwork(id);
      await loadData();
      toast({ title: "WiFi network deleted", description: "WiFi network has been deleted successfully." });
    }
  };

  const resetForm = () => {
    setFormData({
      wifi_name: "",
      wifi_password: "",
      wifi_area: "",
      office_name: selectedOffice || "",
      department_name: selectedDepartment || "",
      ip_address: "",
    });
    setEditingWifi(null);
    setIsDialogOpen(false);
  };

  const downloadQRCode = (qrCode: string, wifiName: string) => {
    const link = document.createElement('a');
    link.download = `wifi_qr_${wifiName}.png`;
    link.href = qrCode;
    link.click();
    toast({ title: "QR Code downloaded", description: "WiFi QR code has been downloaded successfully." });
  };

  const printWifiCard = (wifi: WifiNetwork) => {
    setPrintWifi(wifi);
    setTimeout(() => {
      const printContent = document.getElementById('wifi-print-content');
      if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>WiFi - ${wifi.wifi_name}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: 'Segoe UI', system-ui, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #f0f9ff;
                }
                .wifi-card {
                  width: 400px;
                  padding: 40px;
                  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
                  border: 4px solid #0ea5e9;
                  border-radius: 20px;
                  text-align: center;
                  box-shadow: 0 20px 60px rgba(14, 165, 233, 0.3);
                }
                .logo { width: 120px; margin: 0 auto 20px; }
                .title { font-size: 20px; color: #0ea5e9; margin-bottom: 10px; }
                .wifi-name { font-size: 32px; font-weight: bold; color: #1e293b; margin: 15px 0; }
                .qr-code { 
                  width: 200px; height: 200px; 
                  margin: 25px auto; 
                  border: 4px solid #0ea5e9;
                  border-radius: 16px;
                  padding: 10px;
                  background: white;
                }
                .qr-code img { width: 100%; height: 100%; }
                .scan-text { font-size: 14px; color: #64748b; margin: 10px 0; }
                .password-box {
                  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 12px;
                  margin: 20px 0;
                }
                .password-label { font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
                .password { font-size: 24px; font-weight: bold; letter-spacing: 3px; margin-top: 8px; }
                .footer { margin-top: 25px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
                .footer p { font-size: 12px; color: #64748b; }
                @media print {
                  body { background: white; }
                  .wifi-card { box-shadow: none; border: 3px solid #0ea5e9; }
                }
              </style>
            </head>
            <body>
              <div class="wifi-card">
                <img src="/logo/logo_1.png" alt="Logo" class="logo">
                <div class="title">WiFi Network</div>
                <div class="wifi-name">${wifi.wifi_name}</div>
                <div class="qr-code"><img src="${wifi.wifi_qr_code}" alt="QR Code"></div>
                <div class="scan-text">Scan QR Code to connect</div>
                <div class="password-box">
                  <div class="password-label">Password</div>
                  <div class="password">${wifi.wifi_password}</div>
                </div>
                <div class="footer">
                  <p>MNR Group - IT Department</p>
                  <p>Contact IT for assistance</p>
                </div>
              </div>
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
      setPrintWifi(null);
    }, 100);
  };

  const handlePrintAllWifi = () => {
    const filteredWifi = wifiNetworks.filter(wifi => {
      if (filterOffice && filterOffice !== "__all__" && wifi.office_name !== filterOffice) return false;
      if (filterDepartment && filterDepartment !== "__all__" && wifi.department_name !== filterDepartment) return false;
      return true;
    });

    if (filteredWifi.length === 0) {
      toast({ title: "No WiFi Networks", description: "No WiFi networks to print with current filters.", variant: "destructive" });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const wifiCards = filteredWifi.map(wifi => `
      <div style="page-break-after: always; width: 100%; padding: 40px; box-sizing: border-box;">
        <div style="width: 400px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%); border: 4px solid #0ea5e9; border-radius: 20px; text-align: center;">
          <img src="/logo/logo_1.png" alt="Logo" style="width: 120px; margin: 0 auto 20px; display: block;">
          <div style="font-size: 20px; color: #0ea5e9; margin-bottom: 10px;">WiFi Network</div>
          <div style="font-size: 32px; font-weight: bold; color: #1e293b; margin: 15px 0;">${wifi.wifi_name}</div>
          <div style="width: 200px; height: 200px; margin: 25px auto; border: 4px solid #0ea5e9; border-radius: 16px; padding: 10px; background: white;">
            <img src="${wifi.wifi_qr_code}" alt="QR Code" style="width: 100%; height: 100%;">
          </div>
          <div style="font-size: 14px; color: #64748b; margin: 10px 0;">Scan QR Code to connect</div>
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Password</div>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 3px; margin-top: 8px;">${wifi.wifi_password}</div>
          </div>
          <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">MNR Group - IT Department</p>
            <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">Contact IT for assistance</p>
          </div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WiFi Networks - Print</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: white;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          @page { 
            margin: 0;
            size: A4;
          }
          @media print {
            html, body { 
              background: white; 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${wifiCards}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };

    toast({ title: "Print Ready", description: `${wifiNetworks.length} WiFi network(s) ready to print.` });
  };

  const handlePrintFilteredWifi = () => {
    if (!selectedOffice || !selectedDepartment) return;

    const filteredWifi = wifiNetworks.filter(
      wifi => wifi.office_name === selectedOffice && wifi.department_name === selectedDepartment
    ).filter(wifi => 
      !searchTerm || wifi.wifi_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredWifi.length === 0) {
      toast({ title: "No WiFi Networks", description: "No WiFi networks to print with current filters.", variant: "destructive" });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const wifiCards = filteredWifi.map(wifi => `
      <div style="page-break-after: always; width: 100%; padding: 40px; box-sizing: border-box;">
        <div style="width: 400px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%); border: 4px solid #0ea5e9; border-radius: 20px; text-align: center;">
          <img src="/logo/logo_1.png" alt="Logo" style="width: 120px; margin: 0 auto 20px; display: block;">
          <div style="font-size: 20px; color: #0ea5e9; margin-bottom: 10px;">WiFi Network</div>
          <div style="font-size: 32px; font-weight: bold; color: #1e293b; margin: 15px 0;">${wifi.wifi_name}</div>
          <div style="width: 200px; height: 200px; margin: 25px auto; border: 4px solid #0ea5e9; border-radius: 16px; padding: 10px; background: white;">
            <img src="${wifi.wifi_qr_code}" alt="QR Code" style="width: 100%; height: 100%;">
          </div>
          <div style="font-size: 14px; color: #64748b; margin: 10px 0;">Scan QR Code to connect</div>
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Password</div>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 3px; margin-top: 8px;">${wifi.wifi_password}</div>
          </div>
          <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">MNR Group - IT Department</p>
            <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">Contact IT for assistance</p>
          </div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WiFi Networks - Print</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: white;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          @page { 
            margin: 0;
            size: A4;
          }
          @media print {
            html, body { 
              background: white; 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${wifiCards}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };

    toast({ title: "Print Ready", description: `${filteredWifi.length} WiFi network(s) ready to print.` });
  };

  const handleExportData = () => {
    const filteredWifi = wifiNetworks.filter(wifi => {
      if (filterOffice && filterOffice !== "__all__" && wifi.office_name !== filterOffice) return false;
      if (filterDepartment && filterDepartment !== "__all__" && wifi.department_name !== filterDepartment) return false;
      return true;
    });

    const data = filteredWifi.length > 0 ? filteredWifi : wifiNetworks;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wifi_networks_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const count = filteredWifi.length > 0 ? filteredWifi.length : wifiNetworks.length;
    toast({ title: "Data exported", description: `${count} WiFi networks data has been exported successfully.` });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const data = JSON.parse(result);
            for (const wifi of data) {
              if (wifi.wifi_name && wifi.wifi_password) {
                await dbService.addWifiNetwork(wifi);
              }
            }
            await loadData();
            toast({ title: "Data imported", description: "WiFi networks have been imported successfully." });
          }
        } catch (error) {
          toast({ title: "Import failed", description: "Failed to import data. Please check the file format.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
  };

  const getWifiByOffice = () => {
    const officeGroups: { [key: string]: WifiNetwork[] } = {};
    const filtered = searchTerm 
      ? wifiNetworks.filter(wifi => 
          wifi.wifi_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wifi.office_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wifi.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : wifiNetworks;
    
    filtered.forEach(wifi => {
      if (wifi.office_name) {
        if (!officeGroups[wifi.office_name]) {
          officeGroups[wifi.office_name] = [];
        }
        officeGroups[wifi.office_name].push(wifi);
      }
    });
    return officeGroups;
  };

  const getWifiByDepartment = (officeName: string) => {
    const deptGroups: { [key: string]: WifiNetwork[] } = {};
    const filtered = searchTerm
      ? wifiNetworks.filter(wifi => 
          wifi.office_name === officeName &&
          (wifi.wifi_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           wifi.department_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : wifiNetworks.filter(wifi => wifi.office_name === officeName);
    
    filtered.forEach(wifi => {
      if (wifi.department_name) {
        if (!deptGroups[wifi.department_name]) {
          deptGroups[wifi.department_name] = [];
        }
        deptGroups[wifi.department_name].push(wifi);
      }
    });
    return deptGroups;
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="office_name">Office/Unit Name *</Label>
          <Input
            id="office_name"
            value={formData.office_name}
            onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
            placeholder="Type office name"
            required
          />
        </div>
        <div>
          <Label htmlFor="department_name">Department Name *</Label>
          <Input
            id="department_name"
            value={formData.department_name}
            onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
            placeholder="Type department name"
            required
          />
        </div>
        <div>
          <Label htmlFor="wifi_name">WiFi Name (SSID) *</Label>
          <Input
            id="wifi_name"
            value={formData.wifi_name}
            onChange={(e) => setFormData({ ...formData, wifi_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="wifi_password">WiFi Password *</Label>
          <Input
            id="wifi_password"
            type="text"
            value={formData.wifi_password}
            onChange={(e) => setFormData({ ...formData, wifi_password: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="wifi_area">WiFi Area</Label>
          <Input
            id="wifi_area"
            value={formData.wifi_area}
            onChange={(e) => setFormData({ ...formData, wifi_area: e.target.value })}
            placeholder="e.g., Main Office, Conference Room"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="ip_address">IP Address</Label>
          <Input
            id="ip_address"
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            placeholder="e.g., 192.168.1.1"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
        <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80">
          {editingWifi ? "Update" : "Add"} WiFi Network
        </Button>
      </DialogFooter>
    </form>
  );

  const wifiByOffice = getWifiByOffice();

  // Office view
  if (!selectedOffice) {
    return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-slide-up">
              WiFi Networks
            </h1>
            <p className="text-muted-foreground mt-2">Select an office to view WiFi networks</p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={filterOffice} onValueChange={setFilterOffice}>
                <SelectTrigger className="w-40 border-primary/30">
                  <SelectValue placeholder="Filter by Unit/Office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Offices</SelectItem>
                  {Object.keys(wifiByOffice).map((office) => (
                    <SelectItem key={office} value={office}>
                      {office}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-40 border-primary/30">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Departments</SelectItem>
                  {filterOffice && filterOffice !== "__all__"
                    ? Array.from(
                        wifiNetworks
                          .filter(w => w.office_name === filterOffice)
                          .reduce((acc: Set<string>, network) => {
                            if (network.department_name) acc.add(network.department_name);
                            return acc;
                          }, new Set())
                      ).map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))
                    : Array.from(
                        wifiNetworks.reduce((acc: Set<string>, network) => {
                          if (network.department_name) acc.add(network.department_name);
                          return acc;
                        }, new Set())
                      ).map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={handleExportData} className="border-primary/30 text-primary hover:bg-primary/10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={handlePrintAllWifi}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print All
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('wifi-import-file')?.click()} className="border-primary/30 text-primary hover:bg-primary/10">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input id="wifi-import-file" type="file" accept=".json" onChange={handleImportData} className="hidden" />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Add WiFi Network
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingWifi ? "Edit WiFi Network" : "Add New WiFi Network"}</DialogTitle>
                  <DialogDescription>QR code will be generated automatically</DialogDescription>
                </DialogHeader>
                {renderForm()}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Filter */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search WiFi networks by name, office, or department..."
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Object.entries(wifiByOffice)
            .filter(([officeName]) => !filterOffice || filterOffice === "__all__" || officeName === filterOffice)
            .map(([officeName, officeWifis]) => (
            <Card 
              key={officeName} 
              className="cursor-pointer perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-card to-card/80 border-primary/20"
              onClick={() => setSelectedOffice(officeName)}
            >
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {officeName}
                </CardTitle>
                <CardDescription>{officeWifis.length} WiFi Networks</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-lg">{officeWifis.length}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {Object.keys(wifiByOffice).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No WiFi networks found</h3>
              <p className="text-muted-foreground">Add your first WiFi network to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Department view
  if (selectedOffice && !selectedDepartment) {
    const wifiByDept = getWifiByDepartment(selectedOffice);
    
    return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <Button 
              variant="outline" 
              onClick={() => { setSelectedOffice(null); setSearchTerm(""); }}
              className="mb-4 border-primary/30 text-primary hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Offices
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {selectedOffice} - Departments
            </h1>
            <p className="text-muted-foreground mt-2">Select a department to view WiFi details</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handlePrintAllWifi}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print All
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({ ...prev, office_name: selectedOffice }));
                }}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add WiFi Network
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingWifi ? "Edit WiFi Network" : "Add New WiFi Network"}</DialogTitle>
                <DialogDescription>QR code will be generated automatically</DialogDescription>
              </DialogHeader>
              {renderForm()}
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Search Filter */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search WiFi networks..."
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Object.entries(wifiByDept)
            .filter(([deptName]) => !filterDepartment || filterDepartment === "__all__" || deptName === filterDepartment)
            .map(([deptName, deptWifis]) => (
            <Card 
              key={deptName} 
              className="cursor-pointer perspective-1000 hover-lift glow-effect animate-scale-in bg-gradient-to-br from-card to-card/80 border-primary/20"
              onClick={() => setSelectedDepartment(deptName)}
            >
              <CardHeader>
                <Badge className="w-fit mb-2">{deptWifis.length} Networks</Badge>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {deptName}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {Object.keys(wifiByDept).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No departments found</h3>
              <p className="text-muted-foreground">Add WiFi networks to create departments</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // WiFi details view
  const filteredWifi = wifiNetworks.filter(
    wifi => wifi.office_name === selectedOffice && wifi.department_name === selectedDepartment
  ).filter(wifi => 
    !searchTerm || wifi.wifi_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Button 
            variant="outline" 
            onClick={() => { setSelectedDepartment(null); setSearchTerm(""); }}
            className="mb-4 border-primary/30 text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Departments
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {selectedOffice} - {selectedDepartment}
          </h1>
          <p className="text-muted-foreground mt-2">{filteredWifi.length} WiFi networks</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handlePrintFilteredWifi}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print All
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setFormData(prev => ({ ...prev, office_name: selectedOffice, department_name: selectedDepartment }));
              }}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add WiFi Network
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingWifi ? "Edit WiFi Network" : "Add New WiFi Network"}</DialogTitle>
              <DialogDescription>QR code will be generated automatically</DialogDescription>
            </DialogHeader>
            {renderForm()}
          </DialogContent>
        </Dialog>

        <Button 
          onClick={handlePrintAllWifi}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print All
        </Button>

      {/* Search Filter */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search WiFi networks..."
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredWifi.map((wifi) => (
          <Card key={wifi.id} className="perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-card to-card/80 border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-sm text-primary">{wifi.wifi_name}</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(wifi.wifi_name);
                        toast({ title: "Copied!", description: `WiFi Name: ${wifi.wifi_name}` });
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription className="mt-2">
                    <span className="font-bold text-success">{wifi.department_name}</span>
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(wifi)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(wifi.id)} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                {/* Department */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Department:</span>
                  <span className="text-primary">{wifi.department_name}</span>
                </div>

                {/* WiFi Name */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">WiFi Name:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{wifi.wifi_name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(wifi.wifi_name);
                        toast({ title: "Copied!", description: `WiFi: ${wifi.wifi_name}` });
                      }}
                      className="h-5 w-5 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* WiFi Password */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-mono">
                      {showPasswordId === wifi.id ? wifi.wifi_password : '••••••••'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPasswordId(showPasswordId === wifi.id ? null : wifi.id)}
                      className="h-5 w-5 p-0"
                      title={showPasswordId === wifi.id ? 'Hide' : 'Show'}
                    >
                      {showPasswordId === wifi.id ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(wifi.wifi_password);
                        toast({ title: "Copied!", description: "WiFi Password copied!" });
                      }}
                      className="h-5 w-5 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* WiFi Area */}
                {wifi.wifi_area && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Area:</span>
                    <span className="text-primary">{wifi.wifi_area}</span>
                  </div>
                )}

                {/* IP Address */}
                {wifi.ip_address && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">IP:</span>
                    <span className="text-primary font-mono">{wifi.ip_address}</span>
                  </div>
                )}
              </div>
              
              {wifi.wifi_qr_code && (
                <div className="flex flex-col items-center space-y-2">
                  <img src={wifi.wifi_qr_code} alt="WiFi QR Code" className="w-40 h-40 border-2 border-primary/20 rounded-lg" />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadQRCode(wifi.wifi_qr_code, wifi.wifi_name)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => printWifiCard(wifi)}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWifi.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No WiFi networks found</h3>
            <p className="text-muted-foreground">Add WiFi networks to this department</p>
          </CardContent>
        </Card>
      )}

      {/* Hidden print content */}
      <div id="wifi-print-content" className="hidden">
        {printWifi && (
          <WifiPrintCard
            ref={printRef}
            wifiName={printWifi.wifi_name}
            wifiPassword={printWifi.wifi_password}
            wifiArea={printWifi.wifi_area}
            qrCode={printWifi.wifi_qr_code}
          />
        )}
      </div>
    </div>
  );
};

export default WifiList;
