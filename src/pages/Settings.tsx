import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  Trash2,
  Shield,
  Bell,
  Palette,
  Monitor
} from "lucide-react";
import dbService from "@/services/dbService";
import excelService from "@/services/excelService";

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    companyName: "MNR Group",
    systemName: "MNR IT Management System",
    antivirusWarningDays: 30,
    batteryWarningLevel: "low",
    autoBackup: true,
    emailNotifications: true,
    darkMode: false,
    companyAddress: "",
    adminEmail: "",
    backupFrequency: "daily"
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('mnr_settings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
  };

  const saveSettings = () => {
    localStorage.setItem('mnr_settings', JSON.stringify(settings));
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    });
  };

  const exportAllData = () => {
    const users = dbService.getUsers();
    const departments = dbService.getDepartments();
    const accessories = dbService.getAccessories();
    
    const allData = {
      users,
      departments, 
      accessories,
      settings,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mnr_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "All system data has been exported successfully.",
    });
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result as string);
          
          if (importedData.users) {
            localStorage.setItem('mnr_users', JSON.stringify(importedData.users));
          }
          if (importedData.departments) {
            localStorage.setItem('mnr_departments', JSON.stringify(importedData.departments));
          }
          if (importedData.accessories) {
            localStorage.setItem('mnr_accessories', JSON.stringify(importedData.accessories));
          }
          if (importedData.settings) {
            setSettings({ ...settings, ...importedData.settings });
            localStorage.setItem('mnr_settings', JSON.stringify(importedData.settings));
          }
          
          toast({
            title: "Data imported",
            description: "System data has been imported successfully. Refresh the page to see changes.",
          });
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

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear ALL data? This action cannot be undone.")) {
      if (confirm("This will permanently delete all users, departments, and accessories. Are you absolutely sure?")) {
        localStorage.removeItem('mnr_users');
        localStorage.removeItem('mnr_departments');
        localStorage.removeItem('mnr_accessories');
        
        // Reinitialize with default data
        dbService.initializeData();
        
        toast({
          title: "Data cleared",
          description: "All data has been cleared. Default data has been restored.",
          variant: "destructive",
        });
      }
    }
  };

  const generateSampleData = () => {
    // Add sample departments
    const sampleDepts = [
      { name: "IT Department", description: "Information Technology", head: "John Smith", location: "Building A" },
      { name: "HR Department", description: "Human Resources", head: "Jane Doe", location: "Building B" },
      { name: "Finance", description: "Finance & Accounting", head: "Mike Johnson", location: "Building A" }
    ];

    sampleDepts.forEach(dept => {
      dbService.addDepartment(dept);
    });

    // Add sample users
    const sampleUsers = [
      { 
        name: "Alice Johnson", 
        email: "alice@mnr.com", 
        department_id: "1",
        position: "Software Developer",
        id_number: "EMP001",
        phone_number: "+1234567890",
        antivirus_status: "Active",
        antivirus_expiry: "2024-12-31"
      },
      { 
        name: "Bob Smith", 
        email: "bob@mnr.com", 
        department_id: "2",
        position: "HR Manager",
        id_number: "EMP002", 
        phone_number: "+1234567891",
        antivirus_status: "Expired",
        antivirus_expiry: "2024-01-15"
      }
    ];

    sampleUsers.forEach(user => {
      dbService.addUser(user);
    });

    // Add sample accessories
    const sampleAccessories = [
      {
        user_id: "1",
        type: "mouse",
        brand: "Logitech",
        model: "MX Master 3",
        status: "active",
        battery_status: "good",
        issue_date: "2024-01-15"
      },
      {
        user_id: "1", 
        type: "keyboard",
        brand: "Dell",
        model: "KB216",
        status: "active",
        battery_status: "n/a",
        issue_date: "2024-01-15"
      }
    ];

    sampleAccessories.forEach(acc => {
      dbService.addAccessory(acc);
    });

    toast({
      title: "Sample data generated",
      description: "Sample users, departments, and accessories have been added.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5" />
              <span>General Settings</span>
            </CardTitle>
            <CardDescription>
              Basic system configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => setSettings({...settings, systemName: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                placeholder="admin@company.com"
              />
            </div>

            <div>
              <Label htmlFor="companyAddress">Company Address</Label>
              <Textarea
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
                placeholder="Enter company address..."
              />
            </div>

            <Button onClick={saveSettings} className="w-full">
              Save General Settings
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configure alerts and warnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="antivirusWarning">Antivirus Warning (days before expiry)</Label>
              <Input
                id="antivirusWarning"
                type="number"
                value={settings.antivirusWarningDays}
                onChange={(e) => setSettings({...settings, antivirusWarningDays: parseInt(e.target.value)})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for important events
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically backup data daily
                </p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
              />
            </div>

            <Button onClick={saveSettings} className="w-full">
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Data Management</span>
            </CardTitle>
            <CardDescription>
              Backup, restore, and manage your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={exportAllData} className="w-full" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>

            <div>
              <Label htmlFor="importData">Import Data</Label>
              <Input
                id="importData"
                type="file"
                accept=".json"
                onChange={importData}
                className="mt-2"
              />
            </div>

            <Button onClick={generateSampleData} className="w-full" variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Generate Sample Data
            </Button>

            <Button onClick={clearAllData} className="w-full" variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>
              Customize the look and feel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark theme
                </p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => setSettings({...settings, darkMode: checked})}
              />
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Color Scheme</h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="h-8 bg-primary rounded"></div>
                <div className="h-8 bg-secondary rounded"></div>
                <div className="h-8 bg-accent rounded"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </div>

            <Button onClick={saveSettings} className="w-full">
              Save Appearance Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Version</p>
              <p className="text-muted-foreground">1.0.0</p>
            </div>
            <div>
              <p className="font-medium">Last Backup</p>
              <p className="text-muted-foreground">Never</p>
            </div>
            <div>
              <p className="font-medium">Data Storage</p>
              <p className="text-muted-foreground">Browser Local Storage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;