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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  AlertTriangle,
  CheckCircle,
  Printer,
  Calendar,
  Filter,
  Eye,
  Keyboard,
  Mouse,
  Battery,
  Monitor,
  Headphones,
  Zap,
  Package
} from "lucide-react";
import dbService from "@/services/dbService";

const peripheralTypes = [
  { value: "keyboard", label: "Keyboard", icon: Keyboard },
  { value: "mouse", label: "Mouse", icon: Mouse },
  { value: "battery", label: "Battery", icon: Battery },
  { value: "charger", label: "Charger", icon: Zap },
  { value: "monitor", label: "Monitor", icon: Monitor },
  { value: "headphones", label: "Headphones", icon: Headphones }
];

const Peripherals = () => {
  const { toast } = useToast();
  const [peripherals, setPeripherals] = useState([]);
  const [units, setUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeripheral, setEditingPeripheral] = useState(null);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [selectedPeripheral, setSelectedPeripheral] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    unit: "",
    quantity: "",
    serial_number: "",
    purchase_date: "",
    warranty_expiry: "",
    brand: "",
    model: "",
    location: "",
    condition: "Good",
    status: "Active",
    remarks: "",
    assigned_to: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const peripheralsData = await dbService.getPeripherals();
      const unitsData = await dbService.getUnits();
      
      setPeripherals(peripheralsData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load peripherals data",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPeripheral) {
        await dbService.updatePeripheral(editingPeripheral.id, formData);
        toast({
          title: "Peripheral updated",
          description: "Peripheral information has been updated successfully.",
        });
      } else {
        await dbService.addPeripheral(formData);
        toast({
          title: "Peripheral added",
          description: "New peripheral has been added successfully.",
        });
      }
      
      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to save peripheral",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPeripheral(null);
    setFormData({
      name: "",
      type: "",
      unit: "",
      quantity: "",
      serial_number: "",
      purchase_date: "",
      warranty_expiry: "",
      brand: "",
      model: "",
      location: "",
      condition: "Good",
      status: "Active",
      remarks: "",
      assigned_to: ""
    });
  };

  const handleEdit = (peripheral) => {
    setEditingPeripheral(peripheral);
    setFormData(peripheral);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this peripheral?")) {
      try {
        await dbService.deletePeripheral(id);
        toast({
          title: "Peripheral deleted",
          description: "Peripheral has been deleted successfully.",
        });
        await loadData();
      } catch (error) {
        console.error("Error deleting peripheral:", error);
        toast({
          title: "Error",
          description: "Failed to delete peripheral",
          variant: "destructive"
        });
      }
    }
  };

  const handlePrint = (peripheral) => {
    try {
      const printHTML = getPrintHTML(peripheral);
      const printWindow = window.open("", "_blank", "width=900,height=1000");
      
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Print window could not be opened. Please check your popup blocker settings.",
          variant: "destructive"
        });
        return;
      }
      
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
      
      toast({
        title: "Print dialog opened",
        description: "Please complete the print process in the new window.",
      });
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: "Error",
        description: "Failed to open print dialog",
        variant: "destructive"
      });
    }
  };

  const getPrintHTML = (peripheral) => {
    const typeLabel = peripheralTypes.find(t => t.value === peripheral.type)?.label || peripheral.type;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Peripheral - ${peripheral.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #6366f1;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            color: #1f2937;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #6b7280;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 12px 15px;
            border-radius: 4px;
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .info-value {
            color: #1f2937;
            font-size: 14px;
            padding: 8px 12px;
            background-color: #f3f4f6;
            border-left: 3px solid #6366f1;
            border-radius: 2px;
            min-height: 20px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-active {
            background-color: #dcfce7;
            color: #166534;
          }
          .status-inactive {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .condition-good {
            background-color: #dcfce7;
            color: #166534;
          }
          .condition-fair {
            background-color: #fef3c7;
            color: #92400e;
          }
          .condition-poor {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
          }
          .print-date {
            text-align: right;
            color: #9ca3af;
            font-size: 12px;
            margin-bottom: 20px;
          }
          @media print {
            body {
              background-color: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
        <div class="container">
          <div class="header">
            <h1>Peripheral Management</h1>
            <p>IT Equipment Record</p>
          </div>

          <div class="section">
            <div class="section-title">Basic Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Peripheral Name</div>
                <div class="info-value">${peripheral.name || '---'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Type</div>
                <div class="info-value">${typeLabel}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Brand</div>
                <div class="info-value">${peripheral.brand || '---'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Model</div>
                <div class="info-value">${peripheral.model || '---'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Serial Number</div>
                <div class="info-value">${peripheral.serial_number || '---'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Quantity</div>
                <div class="info-value">${peripheral.quantity || '---'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Assignment & Status</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Unit</div>
                <div class="info-value">${peripheral.unit || '---'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Location</div>
                <div class="info-value">${peripheral.location || '---'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Assigned To</div>
                <div class="info-value">${peripheral.assigned_to || '---'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge status-${peripheral.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}">
                    ${peripheral.status || '---'}
                  </span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Condition</div>
                <div class="info-value">
                  <span class="status-badge condition-${peripheral.condition?.toLowerCase() || 'good'}">
                    ${peripheral.condition || '---'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Dates & Warranty</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Purchase Date</div>
                <div class="info-value">${peripheral.purchase_date ? new Date(peripheral.purchase_date).toLocaleDateString() : '---'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Warranty Expiry</div>
                <div class="info-value">${peripheral.warranty_expiry ? new Date(peripheral.warranty_expiry).toLocaleDateString() : '---'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Additional Information</div>
            <div class="info-item">
              <div class="info-label">Remarks</div>
              <div class="info-value">${peripheral.remarks || '---'}</div>
            </div>
          </div>

          <div class="footer">
            <p>This is an automatically generated report from MNR Group IT Management System</p>
            <p>© ${new Date().getFullYear()} MNR Group. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const filteredPeripherals = peripherals.filter(peripheral => {
    const matchesSearch = 
      peripheral.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      peripheral.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      peripheral.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      peripheral.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUnit = filterUnit === "all" || peripheral.unit === filterUnit;
    const matchesType = filterType === "all" || peripheral.type === filterType;
    
    return matchesSearch && matchesUnit && matchesType;
  });

  const typeIcon = (type) => {
    const iconData = peripheralTypes.find(t => t.value === type);
    return iconData ? iconData.icon : Package;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-2">
                <Keyboard className="w-8 h-8 text-indigo-600" />
                Peripherals Management
              </h1>
              <p className="text-gray-600 mt-2">Manage IT peripherals and accessories inventory</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
                  onClick={() => {
                    setEditingPeripheral(null);
                    handleCloseDialog();
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Peripheral
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPeripheral ? "Edit Peripheral" : "Add New Peripheral"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPeripheral ? "Update peripheral information" : "Add a new peripheral to the inventory"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Peripheral Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Wireless Keyboard"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {peripheralTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="e.g., Logitech"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g., MK850"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serial_number">Serial Number</Label>
                      <Input
                        id="serial_number"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        placeholder="Serial number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                        <SelectTrigger id="unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.id} value={unit.name}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Office, Desk, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assigned_to">Assigned To</Label>
                      <Input
                        id="assigned_to"
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        placeholder="Employee name or device"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                        <SelectTrigger id="condition">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Repair">Repair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchase_date">Purchase Date</Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                      <Input
                        id="warranty_expiry"
                        type="date"
                        value={formData.warranty_expiry}
                        onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Additional notes"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                      {editingPeripheral ? "Update" : "Add"} Peripheral
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, brand, model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-unit" className="text-sm font-medium">Unit</Label>
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger id="filter-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.name}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-type" className="text-sm font-medium">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger id="filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {peripheralTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Total Items</Label>
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{filteredPeripherals.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peripherals Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Peripheral Inventory
            </CardTitle>
            <CardDescription className="text-indigo-100">
              {filteredPeripherals.length} item{filteredPeripherals.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPeripherals.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                      <TableHead className="font-bold text-gray-700">Name</TableHead>
                      <TableHead className="font-bold text-gray-700">Type</TableHead>
                      <TableHead className="font-bold text-gray-700">Brand/Model</TableHead>
                      <TableHead className="font-bold text-gray-700">Unit</TableHead>
                      <TableHead className="font-bold text-gray-700">Status</TableHead>
                      <TableHead className="font-bold text-gray-700">Condition</TableHead>
                      <TableHead className="font-bold text-gray-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPeripherals.map((peripheral) => {
                      const TypeIcon = typeIcon(peripheral.type);
                      return (
                        <TableRow key={peripheral.id} className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                          <TableCell className="font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="w-4 h-4 text-indigo-600" />
                              {peripheral.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {peripheralTypes.find(t => t.value === peripheral.type)?.label || peripheral.type}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {peripheral.brand && peripheral.model 
                              ? `${peripheral.brand} ${peripheral.model}`
                              : peripheral.brand || "---"
                            }
                          </TableCell>
                          <TableCell className="text-gray-700">{peripheral.unit || "---"}</TableCell>
                          <TableCell>
                            <Badge className={`${
                              peripheral.status === "Active" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {peripheral.status || "---"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${
                              peripheral.condition === "Good" 
                                ? "bg-green-100 text-green-800" 
                                : peripheral.condition === "Fair"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {peripheral.condition || "---"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrint(peripheral)}
                                className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                title="Print peripheral details"
                              >
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">Print</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(peripheral)}
                                className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                                title="Edit peripheral"
                              >
                                <Edit className="w-4 h-4" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(peripheral.id)}
                                className="gap-1"
                                title="Delete peripheral"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
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
              <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No peripherals found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or add a new peripheral</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Peripherals;
