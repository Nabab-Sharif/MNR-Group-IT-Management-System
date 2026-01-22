import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Network, Plus, Edit, Trash2, ArrowLeft, CheckCircle, XCircle, Monitor, Server, Download, Upload } from "lucide-react";
import dbService from "@/services/dbService";
import SearchFilter from "@/components/SearchFilter";

interface IPAddress {
  id: number;
  ip_address: string;
  series: string;
  status: "used" | "available";
  used_by: string;
  user_department: string;
  unit_office: string;
  device_type: string;
  added_date: string;
}

const IPAddresses = () => {
  const { toast } = useToast();
  const [ipAddresses, setIpAddresses] = useState<IPAddress[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
  const [editingIP, setEditingIP] = useState<IPAddress | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newSeriesName, setNewSeriesName] = useState("");
  const [customSeries, setCustomSeries] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    ip_address: "",
    series: "",
    status: "available" as "used" | "available",
    used_by: "",
    user_department: "",
    unit_office: "",
    device_type: "",
  });

  useEffect(() => {
    loadData();
    loadCustomSeries();
  }, []);

  const loadData = async () => {
    const data = await dbService.getIPAddresses();
    setIpAddresses(data || []);
  };

  const loadCustomSeries = () => {
    const saved = localStorage.getItem('mnr_ip_series');
    if (saved) {
      setCustomSeries(JSON.parse(saved));
    }
  };

  const saveCustomSeries = (series: string[]) => {
    localStorage.setItem('mnr_ip_series', JSON.stringify(series));
    setCustomSeries(series);
  };

  const getAllSeries = () => {
    const ipSeries = new Set<string>();
    ipAddresses.forEach(ip => {
      if (ip.series) ipSeries.add(ip.series);
    });
    customSeries.forEach(s => ipSeries.add(s));
    return Array.from(ipSeries).sort();
  };

  const getAllDeviceTypes = () => {
    const types = new Set<string>();
    ipAddresses.forEach(ip => {
      if (ip.device_type) types.add(ip.device_type);
    });
    return Array.from(types);
  };

  const handleAddSeries = () => {
    if (newSeriesName.trim()) {
      const updated = [...customSeries, newSeriesName.trim()];
      saveCustomSeries(updated);
      setNewSeriesName("");
      setIsSeriesDialogOpen(false);
      toast({ title: "Series added", description: `IP Series ${newSeriesName} has been added.` });
    }
  };

  const handleDeleteSeries = (series: string) => {
    if (window.confirm(`Delete series ${series}? This won't delete IPs in this series.`)) {
      const updated = customSeries.filter(s => s !== series);
      saveCustomSeries(updated);
      toast({ title: "Series deleted", description: `IP Series ${series} has been deleted.` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ipParts = formData.ip_address.split(".");
    const series = ipParts.slice(0, 3).join(".");

    const dataToSave = {
      ...formData,
      series,
    };

    try {
      if (editingIP) {
        await dbService.updateIPAddress(editingIP.id, dataToSave);
        toast({ title: "IP Address updated", description: "IP Address has been updated successfully." });
      } else {
        await dbService.addIPAddress(dataToSave);
        toast({ title: "IP Address added", description: "New IP Address has been added successfully." });
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error("Error saving IP:", error);
      toast({ title: "Error", description: "Failed to save IP Address.", variant: "destructive" });
    }
  };

  const handleEdit = (ip: IPAddress) => {
    setEditingIP(ip);
    setFormData({
      ip_address: ip.ip_address,
      series: ip.series,
      status: ip.status,
      used_by: ip.used_by || "",
      user_department: ip.user_department || "",
      unit_office: ip.unit_office || "",
      device_type: ip.device_type || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this IP Address?")) {
      await dbService.deleteIPAddress(id);
      await loadData();
      toast({ title: "IP Address deleted", description: "IP Address has been deleted successfully." });
    }
  };

  const resetForm = () => {
    setFormData({
      ip_address: selectedSeries ? `${selectedSeries}.` : "",
      series: selectedSeries || "",
      status: "available",
      used_by: "",
      user_department: "",
      unit_office: "",
      device_type: "",
    });
    setEditingIP(null);
    setIsDialogOpen(false);
  };

  const getSeriesStats = (series: string) => {
    const seriesIPs = ipAddresses.filter((ip) => ip.series === series);
    const used = seriesIPs.filter((ip) => ip.status === "used").length;
    const available = seriesIPs.filter((ip) => ip.status === "available").length;
    return { total: seriesIPs.length, used, available };
  };

  const getDeviceTypeStats = (type: string) => {
    return ipAddresses.filter((ip) => ip.device_type === type).length;
  };

  const getFilteredIPs = () => {
    let filtered = ipAddresses;

    if (selectedSeries) {
      filtered = filtered.filter((ip) => ip.series === selectedSeries);
    }

    if (selectedDeviceType) {
      filtered = filtered.filter((ip) => ip.device_type === selectedDeviceType);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (ip) =>
          ip.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ip.used_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ip.device_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ip.user_department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ip.unit_office?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((ip) => ip.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      const aNum = parseInt(a.ip_address.split(".").pop() || "0");
      const bNum = parseInt(b.ip_address.split(".").pop() || "0");
      return aNum - bNum;
    });
  };

  const handleExportData = () => {
    const data = getFilteredIPs();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip_addresses_${selectedSeries || "all"}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Data exported", description: "IP Addresses data has been exported successfully." });
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
            for (const ip of data) {
              if (ip.ip_address) {
                await dbService.addIPAddress(ip);
              }
            }
            await loadData();
            toast({ title: "Data imported", description: "IP Addresses have been imported successfully." });
          }
        } catch (error) {
          toast({ title: "Import failed", description: "Failed to import data. Please check the file format.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
  };

  const allSeries = getAllSeries();
  const allDeviceTypes = getAllDeviceTypes();
  const totalIPs = ipAddresses.length;
  const usedIPs = ipAddresses.filter(ip => ip.status === "used").length;
  const availableIPs = ipAddresses.filter(ip => ip.status === "available").length;

  // Main view - show all cards
  if (!selectedSeries && !selectedDeviceType) {
    return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-slide-up">
              IP Address Management
            </h1>
            <p className="text-muted-foreground mt-2">Manage IP addresses by series and device type</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportData} className="border-primary/30 text-primary hover:bg-primary/10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('ip-import-file')?.click()} className="border-primary/30 text-primary hover:bg-primary/10">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input id="ip-import-file" type="file" accept=".json" onChange={handleImportData} className="hidden" />
            <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Series
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New IP Series</DialogTitle>
                  <DialogDescription>Enter the IP series prefix (e.g., 192.168.1)</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={newSeriesName}
                    onChange={(e) => setNewSeriesName(e.target.value)}
                    placeholder="e.g., 192.168.1"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSeriesDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddSeries} className="bg-gradient-to-r from-primary to-primary/80">Add Series</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Add IP Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingIP ? "Edit IP Address" : "Add New IP Address"}</DialogTitle>
                  <DialogDescription>Fill in the IP address details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ip_address">IP Address *</Label>
                      <Input
                        id="ip_address"
                        value={formData.ip_address}
                        onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                        placeholder="e.g., 192.168.1.100"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "used" | "available") => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="device_type">Device Type</Label>
                      <Input
                        id="device_type"
                        value={formData.device_type}
                        onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                        placeholder="e.g., PC, Laptop, Server"
                      />
                    </div>
                    <div>
                      <Label htmlFor="used_by">Used By</Label>
                      <Input
                        id="used_by"
                        value={formData.used_by}
                        onChange={(e) => setFormData({ ...formData, used_by: e.target.value })}
                        placeholder="User name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_department">User Department</Label>
                      <Input
                        id="user_department"
                        value={formData.user_department}
                        onChange={(e) => setFormData({ ...formData, user_department: e.target.value })}
                        placeholder="Department name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit_office">Unit/Office</Label>
                      <Input
                        id="unit_office"
                        value={formData.unit_office}
                        onChange={(e) => setFormData({ ...formData, unit_office: e.target.value })}
                        placeholder="Unit or Office name"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80">
                      {editingIP ? "Update" : "Add"} IP Address
                    </Button>
                  </DialogFooter>
                </form>
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
              searchPlaceholder="Search IP addresses, users, departments..."
              filters={[
                {
                  value: filterStatus,
                  onChange: setFilterStatus,
                  placeholder: "Filter by status",
                  options: [
                    { value: "all", label: "All Status" },
                    { value: "used", label: "Used" },
                    { value: "available", label: "Available" },
                  ],
                },
              ]}
            />
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total IP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalIPs}</div>
            </CardContent>
          </Card>
          <Card className="perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Used IP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{usedIPs}</div>
            </CardContent>
          </Card>
          <Card className="perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Available IP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{availableIPs}</div>
            </CardContent>
          </Card>
          <Card className="perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{allDeviceTypes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* IP Series Cards */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-primary">IP Series</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allSeries.map((series) => {
              const stats = getSeriesStats(series);
              return (
                <Card
                  key={series}
                  className="cursor-pointer perspective-1000 hover-lift glow-effect animate-slide-up bg-gradient-to-br from-card to-card/80 border-primary/20"
                  onClick={() => setSelectedSeries(series)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-primary flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      {series}.x
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSeries(series); }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <div className="text-xl font-bold text-primary">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="bg-success/10 rounded-lg p-2">
                        <div className="text-xl font-bold text-success">{stats.used}</div>
                        <div className="text-xs text-muted-foreground">Used</div>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-2">
                        <div className="text-xl font-bold text-primary">{stats.available}</div>
                        <div className="text-xs text-muted-foreground">Available</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Device Type Cards */}
        {allDeviceTypes.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-primary">Device Types</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {allDeviceTypes.map((type) => (
                <Card
                  key={type}
                  className="cursor-pointer perspective-1000 hover-lift glow-effect animate-scale-in bg-gradient-to-br from-card to-card/80 border-primary/20"
                  onClick={() => setSelectedDeviceType(type)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-primary flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      {type}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-lg">{getDeviceTypeStats(type)}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {allSeries.length === 0 && allDeviceTypes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No IP addresses found</h3>
              <p className="text-muted-foreground">Add IP series or IP addresses to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Detail view
  const filteredIPs = getFilteredIPs();
  const viewTitle = selectedSeries ? `${selectedSeries}.x` : selectedDeviceType;

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Button
            variant="outline"
            onClick={() => { setSelectedSeries(null); setSelectedDeviceType(null); setSearchTerm(""); }}
            className="mb-4 border-primary/30 text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {viewTitle}
          </h1>
          <p className="text-muted-foreground mt-2">{filteredIPs.length} IP addresses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportData} className="border-primary/30 text-primary hover:bg-primary/10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  if (selectedSeries) {
                    setFormData((prev) => ({ ...prev, ip_address: `${selectedSeries}.`, series: selectedSeries }));
                  }
                }}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add IP Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingIP ? "Edit IP Address" : "Add New IP Address"}</DialogTitle>
                <DialogDescription>Fill in the IP address details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ip_address">IP Address *</Label>
                    <Input
                      id="ip_address"
                      value={formData.ip_address}
                      onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                      placeholder="e.g., 192.168.1.100"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "used" | "available") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="device_type">Device Type</Label>
                    <Input
                      id="device_type"
                      value={formData.device_type}
                      onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                      placeholder="e.g., PC, Laptop, Server"
                    />
                  </div>
                  <div>
                    <Label htmlFor="used_by">Used By</Label>
                    <Input
                      id="used_by"
                      value={formData.used_by}
                      onChange={(e) => setFormData({ ...formData, used_by: e.target.value })}
                      placeholder="User name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user_department">User Department</Label>
                    <Input
                      id="user_department"
                      value={formData.user_department}
                      onChange={(e) => setFormData({ ...formData, user_department: e.target.value })}
                      placeholder="Department name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_office">Unit/Office</Label>
                    <Input
                      id="unit_office"
                      value={formData.unit_office}
                      onChange={(e) => setFormData({ ...formData, unit_office: e.target.value })}
                      placeholder="Unit or Office name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80">
                    {editingIP ? "Update" : "Add"} IP Address
                  </Button>
                </DialogFooter>
              </form>
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
            searchPlaceholder="Search IP addresses..."
            filters={[
              {
                value: filterStatus,
                onChange: setFilterStatus,
                placeholder: "Filter by status",
                options: [
                  { value: "all", label: "All Status" },
                  { value: "used", label: "Used" },
                  { value: "available", label: "Available" },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Table View */}
      <Card className="border-primary/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">IP Address</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Used By</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Unit/Office</TableHead>
                  <TableHead className="font-semibold">Device Type</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIPs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No IP addresses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIPs.map((ip) => (
                    <TableRow key={ip.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold text-primary">{ip.ip_address}</TableCell>
                      <TableCell>
                        <Badge variant={ip.status === "used" ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                          {ip.status === "used" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {ip.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{ip.used_by || "-"}</TableCell>
                      <TableCell>{ip.user_department || "-"}</TableCell>
                      <TableCell>{ip.unit_office || "-"}</TableCell>
                      <TableCell>{ip.device_type || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(ip)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(ip.id)} className="text-destructive">
                            <Trash2 className="h-3 w-3" />
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
    </div>
  );
};

export default IPAddresses;
