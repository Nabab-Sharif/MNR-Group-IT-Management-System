import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  MapPin,
  Package,
  Monitor,
  Laptop
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dbService from "@/services/dbService";

const UnitsOfficesManager = ({ 
  units, 
  departments, 
  selectedUnit, 
  selectedDepartment,
  onUnitClick, 
  onDepartmentClick, 
  onBackToUnits, 
  onBackToDepartments,
  onDataChange 
}) => {
  const { toast } = useToast();
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  
  const [unitFormData, setUnitFormData] = useState({
    name: "",
    location: ""
  });
  
  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    description: "",
    head: "",
    location: "",
    unit: ""
  });

  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUnit) {
        const updated = await dbService.updateUnit(editingUnit.id, unitFormData);
        if (updated) {
          toast({
            title: "Success",
            description: "Unit/Office updated successfully",
          });
        }
      } else {
        const added = await dbService.addUnit(unitFormData);
        if (added) {
          toast({
            title: "Success",
            description: "Unit/Office added successfully",
          });
        }
      }
      
      await onDataChange();
      setUnitFormData({ name: "", location: "" });
      setEditingUnit(null);
      setIsUnitDialogOpen(false);
    } catch (error) {
      console.error("Error saving unit:", error);
      toast({
        title: "Error",
        description: "Failed to save unit/office",
        variant: "destructive",
      });
    }
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    
    if (editingDepartment) {
      const updated = await dbService.updateDepartment(editingDepartment.id, departmentFormData);
      if (updated) {
        toast({
          title: "Success",
          description: "Department updated successfully. All related data preserved.",
        });
      }
    } else {
      const added = await dbService.addDepartment(departmentFormData);
      if (added) {
        toast({
          title: "Success",
          description: "Department added successfully",
        });
      }
    }
    
    await onDataChange();
    resetDepartmentForm();
  };

  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setUnitFormData({
      name: unit.name,
      location: unit.location || ""
    });
    setIsUnitDialogOpen(true);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setDepartmentFormData({
      name: department.name,
      description: department.description || "",
      head: department.head || "",
      location: department.location || "",
      unit: department.unit || ""
    });
    setIsDepartmentDialogOpen(true);
  };

  const handleDeleteUnit = async (unit) => {
    if (window.confirm(`Are you sure you want to delete ${unit.name}?`)) {
      await dbService.deleteUnit(unit.id);
      toast({
        title: "Success",
        description: "Unit/Office deleted successfully",
      });
      await onDataChange();
    }
  };

  const handleDeleteDepartment = async (department) => {
    if (window.confirm(`Are you sure you want to delete ${department.name}?`)) {
      await dbService.deleteDepartment(department.id);
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
      await onDataChange();
    }
  };

  const resetUnitForm = (closeDialog = true) => {
    setUnitFormData({ name: "", location: "" });
    setEditingUnit(null);
    if (closeDialog) {
      setIsUnitDialogOpen(false);
    }
  };

  const resetDepartmentForm = () => {
    setDepartmentFormData({
      name: "",
      description: "",
      head: "",
      location: "",
      unit: ""
    });
    setEditingDepartment(null);
    setIsDepartmentDialogOpen(false);
  };

  // Units View
  if (!selectedUnit && !selectedDepartment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-sky-800 dark:text-sky-200">Units & Offices</h2>
          <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-500 hover:bg-sky-600" onClick={() => { setUnitFormData({ name: "", location: "" }); setEditingUnit(null); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit/Office
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUnit ? "Edit Unit/Office" : "Add New Unit/Office"}</DialogTitle>
                <DialogDescription>
                  {editingUnit ? "Update unit/office information" : "Create a new unit/office"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUnitSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Unit/Office Name *</Label>
                  <Input
                    id="name"
                    value={unitFormData.name}
                    onChange={(e) => setUnitFormData({...unitFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={unitFormData.location}
                    onChange={(e) => setUnitFormData({...unitFormData, location: e.target.value})}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => resetUnitForm()}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                    {editingUnit ? "Update" : "Add"} Unit/Office
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <Card 
              key={unit.id} 
              className="cursor-pointer perspective-1000 hover-lift glow-effect animate-slide-up bg-white/80 backdrop-blur-sm border-sky-200 hover:border-sky-400 transform-3d"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => onUnitClick(unit)}>
                    <CardTitle className="flex items-center space-x-2 text-sky-700">
                      <MapPin className="h-5 w-5" />
                      <span>{unit.name}</span>
                    </CardTitle>
                    <CardDescription className="text-sky-600">
                      {unit.location}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" onClick={(e) => {e.stopPropagation(); handleEditUnit(unit);}}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={(e) => {e.stopPropagation(); handleDeleteUnit(unit);}}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent onClick={() => onUnitClick(unit)}>
                <div className="flex justify-center">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">{unit.total_assets || 0}</div>
                    <div className="text-sm text-muted-foreground">Assets</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Departments View
  if (selectedUnit && !selectedDepartment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={onBackToUnits}
              className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              ← Back to Units
            </Button>
            <h2 className="text-2xl font-bold text-sky-800 dark:text-sky-200">
              {selectedUnit.name} - Departments
            </h2>
            <p className="text-muted-foreground">{selectedUnit.location}</p>
          </div>
          <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDepartment ? "Edit Department" : "Add New Department"}</DialogTitle>
                <DialogDescription>
                  {editingDepartment ? "Update department information" : "Create a new department"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDepartmentSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Department Name *</Label>
                  <Input
                    id="name"
                    value={departmentFormData.name}
                    onChange={(e) => setDepartmentFormData({...departmentFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit/Office *</Label>
                  <Select 
                    value={departmentFormData.unit || selectedUnit.name} 
                    onValueChange={(value) => setDepartmentFormData({...departmentFormData, unit: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit/office" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={departmentFormData.description}
                    onChange={(e) => setDepartmentFormData({...departmentFormData, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="head">Department Head</Label>
                    <Input
                      id="head"
                      value={departmentFormData.head}
                      onChange={(e) => setDepartmentFormData({...departmentFormData, head: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={departmentFormData.location}
                      onChange={(e) => setDepartmentFormData({...departmentFormData, location: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetDepartmentForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                    {editingDepartment ? "Update" : "Add"} Department
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedUnit.departments.map((department) => {
            const deptStats = departments.find(d => d.id === department.id);
            return (
              <Card 
                key={department.id} 
                className="cursor-pointer perspective-1000 hover-lift glow-effect animate-scale-in bg-white/80 backdrop-blur-sm border-sky-200 hover:border-sky-400 transform-3d"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => onDepartmentClick(deptStats)}>
                      <CardTitle className="flex items-center space-x-2 text-sky-700">
                        <Building2 className="h-5 w-5" />
                        <span>{department.name}</span>
                      </CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" onClick={(e) => {e.stopPropagation(); handleEditDepartment(department);}}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => {e.stopPropagation(); handleDeleteDepartment(department);}}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={() => onDepartmentClick(deptStats)}>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{deptStats?.total_assets || 0}</div>
                      <div className="text-xs text-muted-foreground">Assets</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-sky-600">{deptStats?.total_departments || 0}</div>
                      <div className="text-xs text-muted-foreground">Departments</div>
                    </div>
                  </div>
                  {deptStats?.expired_antivirus > 0 && (
                    <Badge variant="destructive" className="mt-2">
                      {deptStats.expired_antivirus} Expired Antivirus
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Assets View
  if (selectedDepartment) {
    // Get assets from the department
    const allAssets = (selectedDepartment.assets || []).map(asset => ({
      id: `asset-${asset.id}`,
      name: asset.employee_name,
      designation: asset.designation,
      phone: asset.phone_no,
      fromAsset: true,
      device_type: asset.device_type
    }));

    // Remove duplicates based on name
    const uniqueAssets = allAssets.reduce((acc, asset) => {
      if (!acc.find(a => a.name?.toLowerCase() === asset.name?.toLowerCase())) {
        acc.push(asset);
      }
      return acc;
    }, []);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={onBackToDepartments}
              className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              ← Back to Departments
            </Button>
            <h2 className="text-2xl font-bold text-sky-800 dark:text-sky-200">
              {selectedDepartment.name} - Assets
            </h2>
            <p className="text-muted-foreground">
              {uniqueAssets.length} total assets
            </p>
          </div>
        </div>

        {uniqueAssets.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200">
            <CardContent className="text-center py-12">
              <Monitor className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
              <p className="text-gray-500">
                Add IT assets to see data here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueAssets.map((asset) => (
              <Card 
                key={asset.id} 
                className="bg-white/80 backdrop-blur-sm border-sky-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sky-700 flex items-center gap-2">
                        {asset.name || 'N/A'}
                        {asset.device_type && (
                          <Badge variant="outline" className="text-xs">
                            {asset.device_type === 'laptop' ? <Laptop className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{asset.designation || 'N/A'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {asset.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium">Phone:</span>
                      <span>{asset.phone}</span>
                    </div>
                  )}
                  <Badge variant="secondary" className="text-xs mt-2">
                    IT Asset
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default UnitsOfficesManager;