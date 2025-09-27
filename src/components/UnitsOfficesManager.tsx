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
  Users,
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

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    
    if (editingUnit) {
      const updated = dbService.updateUnit(editingUnit.id, unitFormData);
      if (updated) {
        toast({
          title: "Success",
          description: "Unit/Office updated successfully",
        });
      }
    } else {
      const added = dbService.addUnit(unitFormData);
      if (added) {
        toast({
          title: "Success",
          description: "Unit/Office added successfully",
        });
      }
    }
    
    onDataChange();
    resetUnitForm();
  };

  const handleDepartmentSubmit = (e) => {
    e.preventDefault();
    
    if (editingDepartment) {
      const updated = dbService.updateDepartment(editingDepartment.id, departmentFormData);
      if (updated) {
        toast({
          title: "Success",
          description: "Department updated successfully",
        });
      }
    } else {
      const added = dbService.addDepartment(departmentFormData);
      if (added) {
        toast({
          title: "Success",
          description: "Department added successfully",
        });
      }
    }
    
    onDataChange();
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

  const handleDeleteUnit = (unit) => {
    if (window.confirm(`Are you sure you want to delete ${unit.name}?`)) {
      dbService.deleteUnit(unit.id);
      toast({
        title: "Success",
        description: "Unit/Office deleted successfully",
      });
      onDataChange();
    }
  };

  const handleDeleteDepartment = (department) => {
    if (window.confirm(`Are you sure you want to delete ${department.name}?`)) {
      dbService.deleteDepartment(department.id);
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
      onDataChange();
    }
  };

  const resetUnitForm = () => {
    setUnitFormData({ name: "", location: "" });
    setEditingUnit(null);
    setIsUnitDialogOpen(false);
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
              <Button className="bg-sky-500 hover:bg-sky-600" onClick={() => resetUnitForm()}>
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
                  <Button type="button" variant="outline" onClick={resetUnitForm}>
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
              className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-sky-200 hover:border-sky-400"
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
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-sky-600">{unit.total_departments}</div>
                    <div className="text-xs text-muted-foreground">Departments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">{unit.total_assets}</div>
                    <div className="text-xs text-muted-foreground">Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{unit.total_assets}</div>
                    <div className="text-xs text-muted-foreground">Assets</div>
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
            <DialogTrigger asChild>
              <Button className="bg-sky-500 hover:bg-sky-600" onClick={() => resetDepartmentForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
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
                className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-sky-200 hover:border-sky-400"
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
                      <div className="text-2xl font-bold text-emerald-600">{deptStats?.total_users || 0}</div>
                      <div className="text-xs text-muted-foreground">Users</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{deptStats?.total_assets || 0}</div>
                      <div className="text-xs text-muted-foreground">Assets</div>
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

  // Users View
  if (selectedDepartment) {
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
              {selectedDepartment.name} - Users
            </h2>
            <p className="text-muted-foreground">
              {selectedDepartment.total_assets} users • {selectedDepartment.total_assets} assets
            </p>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedDepartment.users.map((user) => (
            <Card 
              key={user.id} 
              className="bg-white/80 backdrop-blur-sm border-sky-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <CardHeader>
                <CardTitle className="text-sky-700">{user.name}</CardTitle>
                <CardDescription>{user.designation || 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.id_number && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">ID:</span>
                    <span>{user.id_number}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">Phone:</span>
                    <span>{user.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Assets Grid */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-sky-800 dark:text-sky-200">IT Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedDepartment.assets.map((asset) => (
              <Card 
                key={asset.id} 
                className="bg-white/80 backdrop-blur-sm border-sky-200 hover:shadow-xl transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sky-700">
                    {asset.device_type === 'laptop' ? <Laptop className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    <span>{asset.employee_name}</span>
                  </CardTitle>
                  <CardDescription>{asset.designation}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Device:</span>
                    <Badge variant={asset.device_type === 'laptop' ? 'default' : 'secondary'}>
                      {asset.device_type?.toUpperCase()}
                    </Badge>
                  </div>
                  {asset.ip_no && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">IP:</span>
                      <span>{asset.ip_no}</span>
                    </div>
                  )}
                  {asset.ultraview_id && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">UltraViewer:</span>
                      <span>{asset.ultraview_id}</span>
                    </div>
                  )}
                  {asset.anydesk_id && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">AnyDesk:</span>
                      <span>{asset.anydesk_id}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UnitsOfficesManager;