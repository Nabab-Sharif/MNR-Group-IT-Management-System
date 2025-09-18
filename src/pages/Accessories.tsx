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
  Filter
} from "lucide-react";
import dbService from "@/services/dbService";

const deviceTypes = [
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "Desktop" }
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
    unit_office: "",
    ultraview_id: "",
    anydesk_id: "",
    windows_version: "",
    antivirus_code: "",
    antivirus_validity: "",
    printer: "",
    scanner: "",
    boot_partition: "",
    peripherals: "",
    purchase_date: "",
    remarks: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAccessories(dbService.getITAssets());
    setUsers(dbService.getUsers());
    setDepartments(dbService.getDepartments());
    setUnits(dbService.getUnits());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Find the selected unit's ID
    const selectedUnit = units.find(unit => unit.name === formData.unit_office);
    const dataToSubmit = {
      ...formData,
      unit_id: selectedUnit?.id || 1
    };
    
    if (editingAccessory) {
      dbService.updateITAsset(editingAccessory.id, dataToSubmit);
      toast({
        title: "IT Asset updated",
        description: "IT Asset information has been updated successfully.",
      });
    } else {
      dbService.addITAsset(dataToSubmit);
      toast({
        title: "IT Asset added",
        description: "New IT Asset has been added successfully.",
      });
    }
    
    loadData();
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (accessory) => {
    setEditingAccessory(accessory);
    setFormData(accessory);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this IT asset?")) {
      dbService.deleteITAsset(id);
      loadData();
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
      peripherals: "",
      purchase_date: "",
      remarks: ""
    });
    setEditingAccessory(null);
  };

  const getFilteredAccessories = () => {
    let filtered = accessories;
    
    // Apply category filter first
    if (filterCategory !== "all") {
      filtered = dbService.getFilteredAssetsByCategory(filterCategory);
    }
    
    // Then apply search and department filters
    return filtered.filter((accessory) => {
      const matchesSearch = Object.values(accessory).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesDepartment = filterDepartment === "all" || accessory.division === filterDepartment;
      return matchesSearch && matchesDepartment;
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
    setSelectedAsset(asset);
    setViewDetailsDialog(true);
  };

  return (
    <div className="mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sky-800">IT Assets Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all IT assets and devices</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-sky-600 hover:bg-sky-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add IT Asset
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sky-700 flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            IT Assets Overview
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
                        <div className="flex items-center gap-1">
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
              
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="peripherals">Other Peripherals</Label>
                <Textarea
                  id="peripherals"
                  value={formData.peripherals}
                  onChange={(e) => setFormData({ ...formData, peripherals: e.target.value })}
                  placeholder="Mouse, keyboard, headset, etc."
                  className="border-sky-200 focus:border-sky-400"
                />
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
                {editingAccessory ? "Update Asset" : "Add Asset"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Asset Details View Dialog */}
      <Dialog open={viewDetailsDialog} onOpenChange={setViewDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sky-700">Asset Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected IT asset
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Employee Information</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p><strong>Name:</strong> {selectedAsset.employee_name}</p>
                    <p><strong>Designation:</strong> {selectedAsset.designation}</p>
                    <p><strong>Email:</strong> {selectedAsset.email}</p>
                    <p><strong>Mobile:</strong> {selectedAsset.mobile}</p>
                    <p><strong>Department:</strong> {selectedAsset.division}</p>
                    <p><strong>Unit/Office:</strong> {selectedAsset.unit_office}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Device Information</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p><strong>Device Type:</strong> {selectedAsset.device_type}</p>
                    <p><strong>PC No:</strong> {selectedAsset.pc_no}</p>
                    <p><strong>SL No:</strong> {selectedAsset.sl_no}</p>
                    <p><strong>Specification:</strong> {selectedAsset.specification}</p>
                    <p><strong>IP Address:</strong> {selectedAsset.ip_no}</p>
                    <p><strong>Windows Version:</strong> {selectedAsset.windows_version}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Remote Access</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p><strong>UltraViewer ID:</strong> {selectedAsset.ultraview_id}</p>
                    <p><strong>AnyDesk ID:</strong> {selectedAsset.anydesk_id}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Security & Software</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p><strong>Antivirus Code:</strong> {selectedAsset.antivirus_code}</p>
                    <p><strong>Antivirus Validity:</strong> {selectedAsset.antivirus_validity}</p>
                    <p><strong>Boot Partition:</strong> {selectedAsset.boot_partition}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Peripherals & Others</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p><strong>Printer:</strong> {selectedAsset.printer}</p>
                    <p><strong>Scanner:</strong> {selectedAsset.scanner}</p>
                    <p><strong>Peripherals:</strong> {selectedAsset.peripherals}</p>
                    <p><strong>Purchase Date:</strong> {selectedAsset.purchase_date}</p>
                    <p><strong>Remarks:</strong> {selectedAsset.remarks}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accessories;