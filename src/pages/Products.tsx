import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  Calendar,
  MapPin,
  Hash,
  Laptop,
  Monitor,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  Wrench,
  CheckCircle,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dbService from "@/services/dbService";

const Products = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    location: "",
    quantity: "",
    serial: "",
    status: "",
    brand: "",
    purchase_date: "",
    warranty: "",
    unit: ""
  });

  const categories = [
    "Laptop", "Desktop", "Monitor", "Printer", "Scanner", 
    "Router", "Switch", "Server", "UPS", "Other"
  ];

  const statuses = [
    "Active", "Repair", "Maintenance", "Inactive", "Disposed"
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedUnit, selectedCategory, selectedStatus]);

  const loadData = () => {
    const productsData = dbService.getProducts();
    const unitsData = dbService.getUnits();
    setProducts(productsData);
    setUnits(unitsData);
  };

  const filterProducts = () => {
    const filtered = dbService.searchProducts(searchQuery, {
      unit: selectedUnit === "all" ? "" : selectedUnit,
      category: selectedCategory === "all" ? "" : selectedCategory,
      status: selectedStatus === "all" ? "" : selectedStatus
    });
    setFilteredProducts(filtered);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingProduct) {
      const updated = dbService.updateProduct(editingProduct.id, formData);
      if (updated) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        loadData();
        resetForm();
      }
    } else {
      const added = dbService.addProduct(formData);
      if (added) {
        toast({
          title: "Success", 
          description: "Product added successfully",
        });
        loadData();
        resetForm();
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dbService.deleteProduct(id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      location: "",
      quantity: "",
      serial: "",
      status: "",
      brand: "",
      purchase_date: "",
      warranty: "",
      unit: ""
    });
    setEditingProduct(null);
    setIsAddDialogOpen(false);
  };

  const handleExportData = () => {
    const data = dbService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mnr_products_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Data exported",
      description: "Product data has been exported successfully.",
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
                description: "Product data has been imported successfully.",
              });
            }
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

  const getStats = () => {
    const total = products.length;
    const laptops = products.filter(p => p.category === "Laptop").length;
    const inRepair = products.filter(p => p.status === "Repair").length;
    const activeProducts = products.filter(p => p.status === "Active").length;

    return { total, laptops, inRepair, activeProducts };
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
            Product Tracking
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Comprehensive inventory management system
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? "Update the product information below."
                  : "Enter the product details to add to inventory."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unit">Unit/Office *</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="serial">Serial Number</Label>
                  <Input
                    id="serial"
                    value={formData.serial}
                    onChange={(e) => setFormData({...formData, serial: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="purchase_date">Purchase/Repair/Maintenance/Disposed Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="warranty">Warranty</Label>
                  <Input
                    id="warranty"
                    value={formData.warranty}
                    onChange={(e) => setFormData({...formData, warranty: e.target.value})}
                    placeholder="e.g., 2 years"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingProduct ? "Update" : "Add"} Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Products</CardTitle>
            <Package className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Laptops</CardTitle>
            <Laptop className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.laptops}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">In Repair</CardTitle>
            <AlertTriangle className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inRepair}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Active</CardTitle>
            <Monitor className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-sky-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sky-700">
            <Filter className="h-5 w-5" />
            <span>Search & Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger>
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedUnit("all");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              Clear Filters
            </Button>
            <Button
              onClick={handleExportData}
              variant="outline"
              className="border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              Export
            </Button>
            <Button
              onClick={() => document.getElementById('import-file-products').click()}
              variant="outline"
              className="border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              Import
            </Button>
            <input
              id="import-file-products"
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-white/80 backdrop-blur-sm border-sky-200 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sky-700">{product.name}</CardTitle>
                  <CardDescription>{product.brand}</CardDescription>
                </div>
                <Badge 
                  variant={
                    product.status === "Active" ? "default" :
                    product.status === "Repair" ? "destructive" :
                    product.status === "Maintenance" ? "secondary" : "outline"
                  }
                >
                  {product.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Package className="h-4 w-4 text-sky-600" />
                <span className="font-medium">Category:</span>
                <span>{product.category}</span>
              </div>
              {product.location && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-sky-600" />
                  <span className="font-medium">Location:</span>
                  <span>{product.location}</span>
                </div>
              )}
              {product.serial && (
                <div className="flex items-center space-x-2 text-sm">
                  <Hash className="h-4 w-4 text-sky-600" />
                  <span className="font-medium">Serial:</span>
                  <span>{product.serial}</span>
                </div>
              )}
              {product.quantity && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Quantity:</span>
                  <span>{product.quantity}</span>
                </div>
              )}
              {product.purchase_date && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-sky-600" />
                  <span className="font-medium">Purchased:</span>
                  <span>{new Date(product.purchase_date).toLocaleDateString()}</span>
                </div>
              )}
              {product.warranty && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Warranty:</span>
                  <span>{product.warranty}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-sky-200">
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedUnit || selectedCategory || selectedStatus
                ? "Try adjusting your search criteria"
                : "Start by adding your first product to the inventory"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Products;