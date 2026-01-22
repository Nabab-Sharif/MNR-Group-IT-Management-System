import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Printer as PrinterIcon, Plus, Edit, Trash2, Download, ArrowLeft, Building2, Users, Upload } from "lucide-react";
import dbService from "@/services/dbService";
import SearchFilter from "@/components/SearchFilter";
import PrinterPrintCard from "@/components/PrinterPrintCard";

interface Printer {
  id: number;
  printer_name: string;
  printer_model: string;
  ip_address: string;
  unit_number: string;
  department_name: string;
  added_date: string;
}

const Printers = () => {
  const { toast } = useToast();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    printer_name: "",
    printer_model: "",
    ip_address: "",
    unit_number: "",
    department_name: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const printersData = await dbService.getPrinters();
    setPrinters(printersData || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPrinter) {
        await dbService.updatePrinter(editingPrinter.id, formData);
        toast({ title: "Printer updated", description: "Printer information has been updated successfully." });
      } else {
        await dbService.addPrinter(formData);
        toast({ title: "Printer added", description: "New printer has been added successfully." });
      }
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error("Error saving printer:", error);
      toast({ title: "Error", description: "Failed to save printer.", variant: "destructive" });
    }
  };

  const handleEdit = (printer: Printer) => {
    setEditingPrinter(printer);
    setFormData({
      printer_name: printer.printer_name,
      printer_model: printer.printer_model,
      ip_address: printer.ip_address,
      unit_number: printer.unit_number,
      department_name: printer.department_name,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this printer?")) {
      await dbService.deletePrinter(id);
      await loadData();
      toast({ title: "Printer deleted", description: "Printer has been deleted successfully." });
    }
  };

  const resetForm = () => {
    setFormData({
      printer_name: "",
      printer_model: "",
      ip_address: "",
      unit_number: selectedUnit || "",
      department_name: selectedDepartment || "",
    });
    setEditingPrinter(null);
    setIsDialogOpen(false);
  };

  const getPrintersByUnit = () => {
    const unitGroups: { [key: string]: Printer[] } = {};
    const filtered = searchTerm
      ? printers.filter(printer =>
          printer.printer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          printer.printer_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          printer.unit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          printer.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : printers;
    
    filtered.forEach(printer => {
      if (printer.unit_number) {
        if (!unitGroups[printer.unit_number]) {
          unitGroups[printer.unit_number] = [];
        }
        unitGroups[printer.unit_number].push(printer);
      }
    });
    return unitGroups;
  };

  const getDepartmentsByUnit = (unitName: string) => {
    const deptGroups: { [key: string]: Printer[] } = {};
    const filtered = searchTerm
      ? printers.filter(printer =>
          printer.unit_number === unitName &&
          (printer.printer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           printer.department_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : printers.filter(printer => printer.unit_number === unitName);
    
    filtered.forEach(printer => {
      if (printer.department_name) {
        if (!deptGroups[printer.department_name]) {
          deptGroups[printer.department_name] = [];
        }
        deptGroups[printer.department_name].push(printer);
      }
    });
    return deptGroups;
  };

  const getFilteredPrinters = () => {
    let filtered = printers;

    if (selectedUnit) {
      filtered = filtered.filter(printer => printer.unit_number === selectedUnit);
    }

    if (selectedDepartment) {
      filtered = filtered.filter(printer => printer.department_name === selectedDepartment);
    }

    if (searchTerm) {
      filtered = filtered.filter(printer =>
        Object.values(printer).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered;
  };

  const handleExportData = () => {
    const data = getFilteredPrinters();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printers_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Data exported", description: "Printers data has been exported successfully." });
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
            for (const printer of data) {
              if (printer.printer_name) {
                await dbService.addPrinter(printer);
              }
            }
            await loadData();
            toast({ title: "Data imported", description: "Printers have been imported successfully." });
          }
        } catch (error) {
          toast({ title: "Import failed", description: "Failed to import data. Please check the file format.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unit_number">Unit/Office Name *</Label>
          <Input
            id="unit_number"
            value={formData.unit_number}
            onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
            placeholder="Type unit/office name"
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
          <Label htmlFor="printer_name">Printer Name *</Label>
          <Input
            id="printer_name"
            value={formData.printer_name}
            onChange={(e) => setFormData({ ...formData, printer_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="printer_model">Printer Model *</Label>
          <Input
            id="printer_model"
            value={formData.printer_model}
            onChange={(e) => setFormData({ ...formData, printer_model: e.target.value })}
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="ip_address">IP Address / Share Printer *</Label>
          <Input
            id="ip_address"
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            placeholder="192.168.1.100 or \\server\printer"
            required
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
        <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80">
          {editingPrinter ? "Update" : "Add"} Printer
        </Button>
      </DialogFooter>
    </form>
  );

  const printersByUnit = getPrintersByUnit();

  // Unit view
  if (!selectedUnit) {
    return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-slide-up">
              Printers Management
            </h1>
            <p className="text-muted-foreground mt-2">Select a unit to view printers</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => {
              const printWindow = window.open("", "_blank", "width=900,height=700");
              if (!printWindow) return;
              
              const rows = printers.map((printer: any, idx: number) => `<tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx + 1}</td><td style="border: 1px solid #ddd; padding: 8px;">${printer.printer_name}</td><td style="border: 1px solid #ddd; padding: 8px;">${printer.printer_model}</td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${printer.ip_address}</td><td style="border: 1px solid #ddd; padding: 8px;">${printer.unit_number}</td><td style="border: 1px solid #ddd; padding: 8px;">${printer.department_name}</td></tr>`).join('');
              
              const content = `<!DOCTYPE html><html><head><title>Printers List</title><style>@page { size: A4; margin: 8mm; } @media print { html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } } body { font-family: Arial, sans-serif; margin: 0; padding: 15px; } .header { text-align: center; margin-bottom: 20px; } .header img { height: 50px; display: block; margin: 0 auto 10px; } .header h1 { color: #0284c7; margin: 0; } .header p { color: #666; margin: 5px 0; } table { width: 100%; border-collapse: collapse; margin-top: 15px; } th { background: linear-gradient(135deg, #0284c7, #0369a1); color: white; padding: 10px; border: 1px solid #ddd; text-align: left; } td { padding: 8px; } tr:nth-child(even) { background: #f0f9ff; }</style></head><body><div class="header"><img src="/lovable-uploads/20eb7d56-b963-4a41-9830-eead460b0120.png" /><h1>MNR Group IT</h1><p>Printers Directory</p></div><table><thead><tr><th style="width: 40px;">SL</th><th>Printer Name</th><th>Model</th><th>IP Address</th><th>Unit/Office</th><th>Department</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
              
              printWindow.document.open();
              printWindow.document.write(content);
              printWindow.document.close();
              printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
            }} className="border-primary/30 text-primary hover:bg-primary/10">
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportData} className="border-primary/30 text-primary hover:bg-primary/10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('printer-import-file')?.click()} className="border-primary/30 text-primary hover:bg-primary/10">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input id="printer-import-file" type="file" accept=".json" onChange={handleImportData} className="hidden" />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Printer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPrinter ? "Edit Printer" : "Add New Printer"}</DialogTitle>
                  <DialogDescription>Fill in the printer details</DialogDescription>
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
              searchPlaceholder="Search printers by name, model, unit, or department..."
            />
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 perspective-1000 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <PrinterIcon className="h-10 w-10 text-primary" />
              <div>
                <p className="text-muted-foreground text-sm">Total Printers</p>
                <p className="text-3xl font-bold text-primary">{printers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Object.entries(printersByUnit).map(([unitName, unitPrinters]) => {
            const deptGroups = getDepartmentsByUnit(unitName);
            return (
              <Card 
                key={unitName} 
                className="cursor-pointer perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-card to-card/80 border-primary/20"
                onClick={() => setSelectedUnit(unitName)}
              >
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {unitName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <PrinterIcon className="h-4 w-4" />
                      {unitPrinters.length} Printers
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {Object.keys(deptGroups).length} Departments
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-lg">{unitPrinters.length}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {Object.keys(printersByUnit).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <PrinterIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No printers found</h3>
              <p className="text-muted-foreground">Add your first printer to get started</p>
            </CardContent>
          </Card>
        )}

        {/* Print Card */}
        {printers.length > 0 && (
          <PrinterPrintCard printers={printers} />
        )}
      </div>
    );
  }

  // Department view
  if (selectedUnit && !selectedDepartment) {
    const deptGroups = getDepartmentsByUnit(selectedUnit);

    return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <Button 
              variant="outline" 
              onClick={() => { setSelectedUnit(null); setSearchTerm(""); }}
              className="mb-4 border-primary/30 text-primary hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Units
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {selectedUnit} - Departments
            </h1>
            <p className="text-muted-foreground mt-2">Select a department to view printers</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({ ...prev, unit_number: selectedUnit }));
                }}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Printer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPrinter ? "Edit Printer" : "Add New Printer"}</DialogTitle>
                <DialogDescription>Fill in the printer details</DialogDescription>
              </DialogHeader>
              {renderForm()}
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Filter */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search printers..."
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Object.entries(deptGroups).map(([deptName, deptPrinters]) => (
            <Card 
              key={deptName} 
              className="cursor-pointer perspective-1000 hover-lift glow-effect animate-scale-in bg-gradient-to-br from-card to-card/80 border-primary/20"
              onClick={() => setSelectedDepartment(deptName)}
            >
              <CardHeader>
                <Badge className="w-fit mb-2">{deptPrinters.length} Printers</Badge>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {deptName}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {Object.keys(deptGroups).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No departments found</h3>
              <p className="text-muted-foreground">Add printers to create departments</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Printer details view
  const filteredPrinters = getFilteredPrinters();

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
            {selectedUnit} - {selectedDepartment}
          </h1>
          <p className="text-muted-foreground mt-2">{filteredPrinters.length} printers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setFormData(prev => ({ ...prev, unit_number: selectedUnit, department_name: selectedDepartment }));
              }}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Printer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPrinter ? "Edit Printer" : "Add New Printer"}</DialogTitle>
              <DialogDescription>Fill in the printer details</DialogDescription>
            </DialogHeader>
            {renderForm()}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search printers..."
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredPrinters.map((printer) => (
          <Card key={printer.id} className="perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-card to-card/80 border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-primary">{printer.printer_name}</CardTitle>
                  <CardDescription>{printer.printer_model}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(printer)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(printer.id)} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-semibold">IP/Share:</span>{" "}
                <span className="text-primary">{printer.ip_address}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">Department:</span>{" "}
                <span className="text-success">{printer.department_name}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrinters.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <PrinterIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No printers found</h3>
            <p className="text-muted-foreground">Add printers to this department</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Printers;
