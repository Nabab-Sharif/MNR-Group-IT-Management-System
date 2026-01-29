import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  Building2,
  Calendar,
  Save,
  X,
  Search,
  Download,
  Upload
} from "lucide-react";
import dbService from "@/services/dbService";

interface ITPerson {
  id?: number;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  skills: string;
  experience: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

const ITPersonManagement = () => {
  const { toast } = useToast();
  const [itPersons, setITPersons] = useState<ITPerson[]>([]);
  const [filteredPersons, setFilteredPersons] = useState<ITPerson[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ITPerson>({
    name: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    skills: "",
    experience: "",
    notes: ""
  });

  useEffect(() => {
    loadITPersons();
  }, []);

  useEffect(() => {
    filterPersons();
  }, [itPersons, searchTerm]);

  const loadITPersons = async () => {
    try {
      const persons = await dbService.getITPersons();
      setITPersons(persons || []);
    } catch (error) {
      console.error("Error loading IT persons:", error);
      toast({
        title: "Error",
        description: "Failed to load IT persons",
        variant: "destructive"
      });
    }
  };

  const filterPersons = () => {
    if (!searchTerm.trim()) {
      setFilteredPersons(itPersons);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = itPersons.filter(person =>
      person.name && person.name.toLowerCase().includes(term) ||
      person.email && person.email.toLowerCase().includes(term) ||
      person.designation && person.designation.toLowerCase().includes(term) ||
      person.department && person.department.toLowerCase().includes(term)
    );
    setFilteredPersons(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      designation: "",
      department: "",
      skills: "",
      experience: "",
      notes: ""
    });
    setEditingId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (person: ITPerson) => {
    setFormData(person);
    setEditingId(person.id || null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and email are required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingId) {
        await dbService.updateITPerson(editingId, formData);
        toast({
          title: "Success",
          description: "IT Person updated successfully"
        });
      } else {
        await dbService.addITPerson(formData);
        toast({
          title: "Success",
          description: "IT Person added successfully"
        });
      }
      setIsDialogOpen(false);
      loadITPersons();
    } catch (error) {
      console.error("Error saving IT person:", error);
      toast({
        title: "Error",
        description: "Failed to save IT person",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this IT Person?")) return;

    try {
      await dbService.deleteITPerson(id);
      toast({
        title: "Success",
        description: "IT Person deleted successfully"
      });
      loadITPersons();
    } catch (error) {
      console.error("Error deleting IT person:", error);
      toast({
        title: "Error",
        description: "Failed to delete IT person",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    try {
      const data = await dbService.getITPersons();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `it_persons_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Data exported",
        description: "IT Persons data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const data = JSON.parse(result);
            if (Array.isArray(data) && data.length > 0) {
              let imported = 0;
              for (const person of data) {
                if (person.name) {
                  try {
                    await dbService.addITPerson(person);
                    imported++;
                  } catch (err) {
                    console.error('Error importing IT person:', err);
                  }
                }
              }
              await loadITPersons();
              toast({
                title: "Data imported",
                description: `${imported} IT Persons imported successfully.`,
              });
            } else if (Array.isArray(data) && data.length === 0) {
              toast({
                title: "No data",
                description: "The selected file contains no data.",
                variant: "destructive"
              });
            } else {
              throw new Error("Invalid data format");
            }
          }
        } catch (error) {
          console.error('Import error:', error);
          toast({
            title: "Import failed",
            description: "Failed to import data. Please check the file format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            IT Person Management
          </h1>
          <p className="text-muted-foreground">
            Manage IT staff and personnel information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportData}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => document.getElementById('import-file-it-persons')?.click()}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file-it-persons"
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="hidden"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="bg-gradient-to-r from-primary to-primary/80">
                <Plus className="mr-2 h-4 w-4" />
                Add New IT Person
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogTitle>
                {editingId ? "Edit IT Person" : "Add New IT Person"}
              </DialogTitle>
              <DialogDescription>
                {editingId ? "Update IT person information" : "Add a new IT staff member"}
              </DialogDescription>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Email Address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    placeholder="Job Title"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="Department Name"
                />
              </div>

              <div>
                <Label htmlFor="skills">Skills</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  placeholder="List of technical skills (comma separated)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  placeholder="Years of experience or summary"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-primary/80">
                <Save className="mr-2 h-4 w-4" />
                {editingId ? "Update" : "Add"} Person
              </Button>
            </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Search IT Personnel</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name, email, designation, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* IT Persons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersons.length > 0 ? (
          filteredPersons.map((person) => (
            <Card key={person.id} className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-primary">{person.name}</CardTitle>
                    <CardDescription className="text-sm">{person.designation}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(person)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => person.id && handleDelete(person.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {person.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{person.email}</span>
                  </div>
                )}
                {person.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{person.phone}</span>
                  </div>
                )}
                {person.department && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{person.department}</span>
                  </div>
                )}
                {person.skills && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold mb-1">Skills:</p>
                    <p className="text-xs text-muted-foreground">{person.skills}</p>
                  </div>
                )}
                {person.experience && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Experience:</p>
                    <p className="text-xs text-muted-foreground">{person.experience}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No IT persons found</p>
              <Button
                onClick={handleAddNew}
                variant="outline"
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First IT Person
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats */}
      {filteredPersons.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total IT Persons</p>
                <p className="text-2xl font-bold text-primary">{filteredPersons.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">With Skills Info</p>
                <p className="text-2xl font-bold text-primary">
                  {filteredPersons.filter(p => p.skills).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold text-primary">
                  {new Set(filteredPersons.map(p => p.department)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ITPersonManagement;
