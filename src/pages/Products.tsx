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
  BarChart3,
  Printer,
  FolderPlus,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dbService from "@/services/dbService";

const Products = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [stockStats, setStockStats] = useState({
    keyboard: 0,
    mouse: 0,
    battery: 0,
    totalStock: 0
  });
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
    unit: "",
    email: "",
    email_password: ""
  });

  const [categorySearch, setCategorySearch] = useState("");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  
  // Category Management States
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Get unique categories from existing products
  const existingCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  
  const filteredCategorySuggestions = existingCategories.filter(cat => 
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const statuses = [
    "Active", "Repair", "Maintenance", "Inactive", "Disposed"
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedUnit, selectedCategory, selectedStatus]);

  const loadData = async () => {
    try {
      const productsData = await dbService.getProducts();
      const unitsData = await dbService.getUnits();
      const categoriesData = await dbService.getCategories();
      
      setProducts(productsData || []);
      setUnits(unitsData || []);
      
      // Load saved categories from IndexedDB
      if (categoriesData && Array.isArray(categoriesData) && categoriesData.length > 0) {
        const categoryNames = categoriesData.map(cat => cat.name).filter(Boolean);
        setCategories(categoryNames);
        console.log('Loaded categories from IndexedDB:', categoryNames);
      } else {
        // If no saved categories, sync from products and save
        const uniqueCategories = [...new Set((productsData || []).map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
        console.log('Syncing categories from products:', uniqueCategories);
        
        // Save discovered categories to IndexedDB
        for (const catName of uniqueCategories) {
          try {
            const existing = await dbService.getCategoryByName(catName);
            if (!existing) {
              await dbService.addCategory({ name: catName });
            }
          } catch (err) {
            console.error(`Error saving category ${catName}:`, err);
          }
        }
      }
      
      // Calculate stock stats
      const keyboards = productsData.filter(p => 
        p.category?.toLowerCase().includes('keyboard') && p.status?.toLowerCase() === 'active'
      );
      const mice = productsData.filter(p => 
        p.category?.toLowerCase().includes('mouse') && p.status?.toLowerCase() === 'active'
      );
      const batteries = productsData.filter(p => 
        (p.category?.toLowerCase().includes('battery') || p.category?.toLowerCase().includes('ups')) && 
        p.status?.toLowerCase() === 'active'
      );
      
      setStockStats({
        keyboard: keyboards.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0),
        mouse: mice.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0),
        battery: batteries.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0),
        totalStock: productsData.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load products and categories",
        variant: "destructive"
      });
    }
  };

  const filterProducts = async () => {
    const filtered = await dbService.searchProducts(searchQuery, {
      unit: selectedUnit === "all" ? "" : selectedUnit,
      category: selectedCategory === "all" ? "" : selectedCategory,
      status: selectedStatus === "all" ? "" : selectedStatus
    });
    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingProduct) {
      const updated = await dbService.updateProduct(editingProduct.id, formData);
      if (updated) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        await loadData();
        resetForm();
      }
    } else {
      const added = await dbService.addProduct(formData);
      if (added) {
        toast({
          title: "Success", 
          description: "Product added successfully",
        });
        await loadData();
        resetForm();
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await dbService.deleteProduct(id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      await loadData();
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
      unit: "",
      email: "",
      email_password: ""
    });
    setEditingProduct(null);
    setIsAddDialogOpen(false);
  };

  // Category Management Functions
  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    
    if (!trimmedName) {
      toast({
        title: "Error",
        description: "Category name cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    
    if (categories.includes(trimmedName)) {
      toast({
        title: "Category Exists",
        description: "This category already exists.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save to IndexedDB
      const result = await dbService.addCategory({ name: trimmedName });
      console.log('Category saved to IndexedDB:', result);
      
      if (result) {
        // Verify it was actually saved
        const allCategories = await dbService.getCategories();
        console.log('All categories after save:', allCategories);
        
        // Update local state
        setCategories(prev => [...prev, trimmedName]);
        
        toast({
          title: "Category Added",
          description: `Category "${trimmedName}" has been added successfully.`,
        });
        setNewCategoryName("");
        setIsCategoryDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = async (oldCategory: string, newCategory: string) => {
    if (newCategory.trim() && oldCategory !== newCategory) {
      // Update all products with the old category to the new category
      const productsToUpdate = products.filter(p => p.category === oldCategory);
      for (const product of productsToUpdate) {
        await dbService.updateProduct(product.id, { ...product, category: newCategory.trim() });
      }
      
      // Update category in IndexedDB
      const categoryRecord = await dbService.getCategoryByName(oldCategory);
      if (categoryRecord) {
        await dbService.updateCategory(categoryRecord.id, { name: newCategory.trim() });
      } else {
        // If not found, create new category record
        await dbService.addCategory({ name: newCategory.trim() });
      }
      
      // Update local state
      setCategories(prev => prev.map(c => c === oldCategory ? newCategory.trim() : c));
      
      await loadData();
      toast({
        title: "Category Updated",
        description: `Category renamed from "${oldCategory}" to "${newCategory}".`,
      });
      setEditingCategory(null);
      setNewCategoryName("");
    }
  };

  const handleDeleteCategory = async (category: string) => {
    const productsInCategory = products.filter(p => p.category === category);
    
    // Show confirmation dialog based on whether category has products
    let confirmMessage = "";
    if (productsInCategory.length > 0) {
      confirmMessage = `This category "${category}" has ${productsInCategory.length} products. Delete category and all its products? This action cannot be undone.`;
    } else {
      confirmMessage = `Are you sure you want to delete category "${category}"? This action cannot be undone.`;
    }
    
    // Always show confirmation before deleting
    if (window.confirm(confirmMessage)) {
      try {
        // Delete all products in the category if any
        if (productsInCategory.length > 0) {
          for (const product of productsInCategory) {
            await dbService.deleteProduct(product.id);
          }
        }
        
        // Delete category from IndexedDB
        const categoryRecord = await dbService.getCategoryByName(category);
        if (categoryRecord) {
          await dbService.deleteCategory(categoryRecord.id);
        }
        
        // Update local state
        setCategories(prev => prev.filter(c => c !== category));
        
        await loadData();
        toast({
          title: "Category Deleted",
          description: productsInCategory.length > 0 
            ? `Category "${category}" and its ${productsInCategory.length} products have been deleted.`
            : `Category "${category}" has been deleted.`,
        });
      } catch (error) {
        console.error('Error deleting category:', error);
        toast({
          title: "Error",
          description: "Failed to delete category: " + error.message,
          variant: "destructive"
        });
      }
    }
  };

  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Get products grouped by category
  const getProductsByCategory = () => {
    const grouped: { [key: string]: any[] } = {};
    filteredProducts.forEach((product: any) => {
      const cat = product.category || "Uncategorized";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(product);
    });
    return grouped;
  };

  // Get category stats
  const getCategoryStats = (category: string) => {
    const categoryProducts = products.filter(p => p.category === category);
    const totalQuantity = categoryProducts.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
    const activeCount = categoryProducts.filter(p => p.status?.toLowerCase() === 'active').length;
    return { count: categoryProducts.length, totalQuantity, activeCount };
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

  const [selectedStockCategory, setSelectedStockCategory] = useState(null);
  const [stockDetailsDialog, setStockDetailsDialog] = useState(false);

  const handleStockCardClick = (category) => {
    let filtered = [];
    if (category === 'keyboard') {
      filtered = products.filter(p => 
        p.category?.toLowerCase().includes('keyboard') && p.status?.toLowerCase() === 'active'
      );
    } else if (category === 'mouse') {
      filtered = products.filter(p => 
        p.category?.toLowerCase().includes('mouse') && p.status?.toLowerCase() === 'active'
      );
    } else if (category === 'battery') {
      filtered = products.filter(p => 
        (p.category?.toLowerCase().includes('battery') || p.category?.toLowerCase().includes('ups')) && 
        p.status?.toLowerCase() === 'active'
      );
    } else {
      filtered = products.filter(p => p.status?.toLowerCase() === 'active');
    }
    setSelectedStockCategory({ category, products: filtered });
    setStockDetailsDialog(true);
  };

  const getStats = () => {
    const total = products.length;
    const laptops = products.filter(p => p.category === "Laptop").length;
    const inRepair = products.filter(p => p.status === "Repair").length;
    const activeProducts = products.filter(p => p.status === "Active").length;

    return { total, laptops, inRepair, activeProducts };
  };

  const stats = getStats();
  const productsByCategory = getProductsByCategory();

  // Generate category-wise stock details for print
  const generateCategoryStockDetails = () => {
    const categoryDetails: any[] = [];
    categories.forEach(cat => {
      const catProducts = products.filter(p => p.category === cat);
      const totalQty = catProducts.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
      const activeQty = catProducts.filter(p => p.status?.toLowerCase() === 'active')
        .reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
      categoryDetails.push({
        name: cat,
        productCount: catProducts.length,
        totalQuantity: totalQty,
        activeQuantity: activeQty,
        products: catProducts
      });
    });
    return categoryDetails;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;
    
    // Get products by category for detailed sections
    const keyboardProducts = products.filter(p => 
      p.category?.toLowerCase().includes('keyboard') && p.status?.toLowerCase() === 'active'
    );
    const mouseProducts = products.filter(p => 
      p.category?.toLowerCase().includes('mouse') && p.status?.toLowerCase() === 'active'
    );
    const batteryProducts = products.filter(p => 
      (p.category?.toLowerCase().includes('battery') || p.category?.toLowerCase().includes('ups')) && 
      p.status?.toLowerCase() === 'active'
    );
    
    // Get other categories (excluding keyboard, mouse, battery/ups)
    const otherCategories = categories.filter(cat => 
      !cat.toLowerCase().includes('keyboard') && 
      !cat.toLowerCase().includes('mouse') && 
      !cat.toLowerCase().includes('battery') &&
      !cat.toLowerCase().includes('ups')
    );

    // Generate product table for a category
    const generateProductTable = (categoryProducts: any[], title: string, icon: string, gradient: string) => {
      if (categoryProducts.length === 0) return '';
      
      const totalQty = categoryProducts.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
      const rows = categoryProducts.map(p => `
        <tr>
          <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: 500;">${p.name || '-'}</td>
          <td style="border: 1px solid #e2e8f0; padding: 10px;">${p.brand || '-'}</td>
          <td style="border: 1px solid #e2e8f0; padding: 10px;">${p.unit || '-'}</td>
          <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center; font-weight: bold; color: #0284c7;">${p.quantity || 0}</td>
          <td style="border: 1px solid #e2e8f0; padding: 10px;">${p.serial || '-'}</td>
          <td style="border: 1px solid #e2e8f0; padding: 10px;">${p.location || '-'}</td>
        </tr>
      `).join('');
      
      return `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <div style="background: ${gradient}; color: white; padding: 15px 20px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">${icon}</span>
              <span style="font-size: 18px; font-weight: bold;">${title}</span>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 28px; font-weight: bold;">${totalQty}</div>
              <div style="font-size: 12px; opacity: 0.9;">Total In Stock</div>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 0 0 12px 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; color: #475569; font-weight: 600;">Product Name</th>
                <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; color: #475569; font-weight: 600;">Brand</th>
                <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; color: #475569; font-weight: 600;">Unit/Office</th>
                <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: center; color: #475569; font-weight: 600;">Quantity</th>
                <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; color: #475569; font-weight: 600;">Serial</th>
                <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; color: #475569; font-weight: 600;">Location</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    };

    // Generate other category sections
    const otherCategorySections = otherCategories.map(cat => {
      const catProducts = products.filter(p => p.category === cat && p.status?.toLowerCase() === 'active');
      const colors = [
        'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'linear-gradient(135deg, #ec4899, #f43f5e)',
        'linear-gradient(135deg, #14b8a6, #06b6d4)',
        'linear-gradient(135deg, #f59e0b, #f97316)',
        'linear-gradient(135deg, #84cc16, #22c55e)'
      ];
      const icons = ['📦', '💻', '🔧', '📱', '🖥️'];
      const randomIndex = otherCategories.indexOf(cat) % colors.length;
      return generateProductTable(catProducts, cat, icons[randomIndex], colors[randomIndex]);
    }).join('');
    
    const content = `<!DOCTYPE html>
      <html>
      <head>
        <title>Product Stock Report - MNR Group</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 20px; 
            background: #f8fafc;
            color: #334155;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #0284c7;
          }
          .header img { height: 60px; display: block; margin: 0 auto 10px; }
          .header h1 { 
            color: #0284c7; 
            margin: 10px 0 5px; 
            font-size: 28px;
            letter-spacing: -0.5px;
          }
          .print-date { 
            text-align: right; 
            color: #64748b; 
            font-size: 12px; 
            margin-bottom: 15px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .summary-card {
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            color: white;
          }
          .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .summary-card .label {
            font-size: 13px;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="print-date">📅 Print Date: ${new Date().toLocaleString()}</div>
        <div class="header">
          <img src="/lovable-uploads/20eb7d56-b963-4a41-9830-eead460b0120.png" />
          <h1>📊 MNR Group - Product Stock Report</h1>
          <p style="color: #64748b; margin: 0; font-size: 14px;">Comprehensive In-Stock Inventory Overview</p>
        </div>
        
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card" style="background: linear-gradient(135deg, #3b82f6, #06b6d4);">
            <div class="value">${stockStats.keyboard}</div>
            <div class="label">⌨️ Keyboard Stock</div>
          </div>
          <div class="summary-card" style="background: linear-gradient(135deg, #8b5cf6, #ec4899);">
            <div class="value">${stockStats.mouse}</div>
            <div class="label">🖱️ Mouse Stock</div>
          </div>
          <div class="summary-card" style="background: linear-gradient(135deg, #f59e0b, #ef4444);">
            <div class="value">${stockStats.battery}</div>
            <div class="label">🔋 Battery/UPS Stock</div>
          </div>
          <div class="summary-card" style="background: linear-gradient(135deg, #10b981, #14b8a6);">
            <div class="value">${stockStats.totalStock}</div>
            <div class="label">📦 Total Stock</div>
          </div>
        </div>

        <!-- Keyboard Section -->
        ${generateProductTable(keyboardProducts, 'Keyboard In Stock', '⌨️', 'linear-gradient(135deg, #3b82f6, #06b6d4)')}
        
        <!-- Mouse Section -->
        ${generateProductTable(mouseProducts, 'Mouse In Stock', '🖱️', 'linear-gradient(135deg, #8b5cf6, #ec4899)')}
        
        <!-- Battery/UPS Section -->
        ${generateProductTable(batteryProducts, 'Battery/UPS In Stock', '🔋', 'linear-gradient(135deg, #f59e0b, #ef4444)')}
        
        <!-- Other Categories -->
        ${otherCategorySections}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
          <p>Generated by MNR Group IT Asset Management System</p>
          <p style="margin-top: 5px;">Total Products: ${stats.total} | Active: ${stats.activeProducts} | In Repair: ${stats.inRepair}</p>
        </div>
      </body>
      </html>`;
    
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
  };

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
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handlePrint}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          
          {/* Category Management Dialog */}
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-sky-200 text-sky-700 hover:bg-sky-50">
                <FolderPlus className="mr-2 h-4 w-4" />
                Manage Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-sky-700">Category Management</DialogTitle>
                <DialogDescription>
                  Add, edit, or delete product categories
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Add New Category */}
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} className="bg-sky-500 hover:bg-sky-600">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Category List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No categories yet. Add products to create categories.
                    </p>
                  ) : (
                    categories.map((category) => {
                      const catStats = getCategoryStats(category);
                      return (
                        <div key={category} className="flex items-center justify-between p-3 bg-sky-50 dark:bg-slate-800 rounded-lg border border-sky-200">
                          {editingCategory === category ? (
                            <div className="flex gap-2 flex-1 mr-2">
                              <Input
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="flex-1"
                              />
                              <Button 
                                size="sm" 
                                onClick={() => handleEditCategory(category, newCategoryName)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => { setEditingCategory(null); setNewCategoryName(""); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <span className="font-medium text-sky-700">{category}</span>
                                <div className="text-xs text-muted-foreground">
                                  {catStats.count} products • {catStats.totalQuantity} total qty • {catStats.activeCount} active
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => { setEditingCategory(category); setNewCategoryName(category); }}
                                  className="text-sky-600 hover:text-sky-700"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDeleteCategory(category)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg">
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
                      {categories.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No categories. Add one in Category Management.</div>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))
                      )}
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
                  <Label htmlFor="purchase_date">Purchase Date</Label>
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
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g., user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email_password">Email Password</Label>
                  <Input
                    id="email_password"
                    type="text"
                    value={formData.email_password}
                    onChange={(e) => setFormData({...formData, email_password: e.target.value})}
                    placeholder="Email password"
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
      </div>

      {/* Stock Tracking Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-sky-800 dark:text-sky-200">Stock Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            onClick={() => handleStockCardClick('keyboard')}
            className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 cursor-pointer"
            style={{ transform: 'perspective(1000px) rotateX(2deg)' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Keyboard InStock</CardTitle>
              <Package className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stockStats.keyboard}</div>
              <p className="text-xs opacity-80 mt-1">কীবোর্ড স্টক</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => handleStockCardClick('mouse')}
            className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 cursor-pointer"
            style={{ transform: 'perspective(1000px) rotateX(2deg)' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Mouse InStock</CardTitle>
              <Package className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stockStats.mouse}</div>
              <p className="text-xs opacity-80 mt-1">মাউস স্টক</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => handleStockCardClick('battery')}
            className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 cursor-pointer"
            style={{ transform: 'perspective(1000px) rotateX(2deg)' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Battery InStock</CardTitle>
              <Package className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stockStats.battery}</div>
              <p className="text-xs opacity-80 mt-1">ব্যাটারি স্টক</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => handleStockCardClick('all')}
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 cursor-pointer"
            style={{ transform: 'perspective(1000px) rotateX(2deg)' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Stock</CardTitle>
              <BarChart3 className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stockStats.totalStock}</div>
              <p className="text-xs opacity-80 mt-1">মোট স্টক</p>
            </CardContent>
          </Card>
        </div>
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
                {existingCategories.map(cat => (
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

      {/* Category-based Products Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-sky-800 dark:text-sky-200 flex items-center gap-2">
          <Layers className="h-6 w-6" />
          Products by Category
        </h2>
        
        {Object.keys(productsByCategory).length === 0 ? (
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
        ) : (
          Object.entries(productsByCategory).map(([category, categoryProducts]) => {
            const isExpanded = expandedCategories.has(category);
            const catStats = getCategoryStats(category);
            
            return (
              <Card key={category} className="bg-white/80 backdrop-blur-sm border-sky-200 overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-sky-50 transition-colors"
                  onClick={() => toggleCategoryExpand(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sky-700">{category}</CardTitle>
                        <CardDescription>
                          {catStats.count} products • Total Qty: {catStats.totalQuantity} • Active: {catStats.activeCount}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-sky-100 text-sky-700">
                        {(categoryProducts as any[]).length} items
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-sky-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-sky-600" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(categoryProducts as any[]).map((product) => (
                        <Card key={product.id} className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200 hover:shadow-lg transition-all">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base text-sky-700">{product.name}</CardTitle>
                                <CardDescription className="text-xs">{product.brand}</CardDescription>
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
                          <CardContent className="space-y-2 text-sm">
                            {product.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-3 w-3 text-sky-600" />
                                <span>{product.location}</span>
                              </div>
                            )}
                            {product.serial && (
                              <div className="flex items-center space-x-2">
                                <Hash className="h-3 w-3 text-sky-600" />
                                <span className="text-xs">{product.serial}</span>
                              </div>
                            )}
                            {product.quantity && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Quantity:</span>
                                <Badge variant="secondary">{product.quantity}</Badge>
                              </div>
                            )}
                            {product.unit && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Unit:</span>
                                <span className="font-medium">{product.unit}</span>
                              </div>
                            )}
                            {product.email && (
                              <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                                <span className="text-muted-foreground text-xs">Email:</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(product.email);
                                    toast({
                                      title: "Copied",
                                      description: "Email copied to clipboard"
                                    });
                                  }}
                                  className="text-green-700 hover:text-green-900 font-medium text-xs cursor-pointer truncate"
                                  title={product.email}
                                >
                                  {product.email}
                                </button>
                              </div>
                            )}
                            {product.email_password && (
                              <div className="flex items-center justify-between bg-orange-50 p-2 rounded border border-orange-200">
                                <span className="text-muted-foreground text-xs">Password:</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(product.email_password);
                                    toast({
                                      title: "Copied",
                                      description: "Password copied to clipboard"
                                    });
                                  }}
                                  className="text-orange-700 hover:text-orange-900 font-medium text-xs cursor-pointer"
                                  title={product.email_password}
                                >
                                  {product.email_password}
                                </button>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="flex-1">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Stock Details Dialog */}
      <Dialog open={stockDetailsDialog} onOpenChange={setStockDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sky-700 capitalize">
              {selectedStockCategory?.category === 'all' ? 'All Products' : `${selectedStockCategory?.category} Stock Details`}
            </DialogTitle>
            <DialogDescription>
              Detailed list of {selectedStockCategory?.products?.length || 0} products in stock
            </DialogDescription>
          </DialogHeader>
          {selectedStockCategory && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedStockCategory.products.map((product) => (
                  <Card key={product.id} className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base text-sky-700">{product.name}</CardTitle>
                          <CardDescription className="text-xs">{product.brand}</CardDescription>
                        </div>
                        <Badge variant="default" className="bg-green-500">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{product.category}</span>
                      </div>
                      {product.unit && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Unit:</span>
                          <span className="font-medium">{product.unit}</span>
                        </div>
                      )}
                      {product.location && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{product.location}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <Badge variant="secondary" className="font-bold">{product.quantity}</Badge>
                      </div>
                      {product.serial && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Serial:</span>
                          <span className="font-medium text-xs">{product.serial}</span>
                        </div>
                      )}
                      {product.email && (
                        <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                          <span className="text-gray-600 text-xs">Email:</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(product.email);
                              toast({
                                title: "Copied",
                                description: "Email copied to clipboard"
                              });
                            }}
                            className="text-green-700 hover:text-green-900 font-medium text-xs cursor-pointer truncate"
                            title={product.email}
                          >
                            {product.email}
                          </button>
                        </div>
                      )}
                      {product.email_password && (
                        <div className="flex items-center justify-between bg-orange-50 p-2 rounded border border-orange-200">
                          <span className="text-gray-600 text-xs">Password:</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(product.email_password);
                              toast({
                                title: "Copied",
                                description: "Password copied to clipboard"
                              });
                            }}
                            className="text-orange-700 hover:text-orange-900 font-medium text-xs cursor-pointer"
                            title={product.email_password}
                          >
                            {product.email_password}
                          </button>
                        </div>
                      )}
                      {product.purchase_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Purchased:</span>
                          <span className="font-medium text-xs">
                            {new Date(product.purchase_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setStockDetailsDialog(false);
                            handleEdit(product);
                          }}
                          className="flex-1 text-sky-600 border-sky-300 hover:bg-sky-50"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setStockDetailsDialog(false);
                            handleDelete(product.id);
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
