import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserCircle, 
  Camera, 
  Download, 
  Edit,
  Shield,
  Mouse,
  Keyboard,
  Package,
  Calendar,
  Building2,
  Phone,
  Mail,
  BadgeCheck
} from "lucide-react";
import dbService from "@/services/dbService";

const Profile = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === parseInt(selectedUserId));
      setSelectedUser(user);
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId, users]);

  const loadData = () => {
    setUsers(dbService.getUsers());
    setDepartments(dbService.getDepartments());
    setAccessories(dbService.getAccessories());
  };

  const getUserAccessories = (userId) => {
    return accessories.filter(acc => acc.user_id === userId.toString());
  };

  const getUserDepartment = (departmentId) => {
    return departments.find(dept => dept.id === parseInt(departmentId));
  };

  const getAccessoryStats = (userId) => {
    const userAccessories = getUserAccessories(userId);
    return {
      total: userAccessories.length,
      active: userAccessories.filter(a => a.status === "active").length,
      damaged: userAccessories.filter(a => a.status === "damaged").length,
      exchanged: userAccessories.filter(a => a.status === "exchanged").length,
      mouse: userAccessories.filter(a => a.type === "mouse").length,
      keyboard: userAccessories.filter(a => a.type === "keyboard").length,
      batteries: userAccessories.filter(a => a.battery_status === "critical").length
    };
  };

  const isAntivirusExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handlePictureCapture = () => {
    // In a real app, this would open camera
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfilePicture(e.target.result);
          // In a real app, save to user profile
          toast({
            title: "Profile picture updated",
            description: "Profile picture has been updated successfully.",
          });
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const handlePictureDownload = () => {
    if (profilePicture) {
      const link = document.createElement('a');
      link.href = profilePicture;
      link.download = `${selectedUser?.name || 'user'}_profile.jpg`;
      link.click();
    }
  };

  const printProfile = () => {
    window.print();
  };

  if (!selectedUser) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-4">User Profile</h1>
          <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-700">Select User</CardTitle>
              <CardDescription>Choose a user to view their profile</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const department = getUserDepartment(selectedUser.department_id);
  const userAccessories = getUserAccessories(selectedUser.id);
  const stats = getAccessoryStats(selectedUser.id);
  const antivirusExpired = isAntivirusExpired(selectedUser.antivirus_expiry);

  return (
    <div className="p-6 space-y-6 print:p-4 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">User Profile</h1>
          <p className="text-lg text-muted-foreground">
            Detailed user information and activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name} - {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={printProfile}>
            <Download className="mr-2 h-4 w-4" />
            Print Profile
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card className={antivirusExpired ? "border-expired" : ""}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profilePicture} />
                <AvatarFallback className="text-xl">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 flex space-x-1 print:hidden">
                <Button size="sm" variant="outline" onClick={handlePictureCapture}>
                  <Camera className="h-3 w-3" />
                </Button>
                {profilePicture && (
                  <Button size="sm" variant="outline" onClick={handlePictureDownload}>
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                  <p className="text-muted-foreground">{selectedUser.position || 'No position specified'}</p>
                </div>
                {antivirusExpired && (
                  <Badge variant="destructive" className="text-expired-foreground bg-expired">
                    Antivirus Expired
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ID: {selectedUser.id_number || selectedUser.id}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.phone_number || 'No phone number'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{department?.name || 'No department'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined: {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Antivirus: {selectedUser.antivirus_status || 'Not specified'}
                    {selectedUser.antivirus_expiry && (
                      <span className={antivirusExpired ? "text-expired ml-1" : "ml-1"}>
                        (Exp: {selectedUser.antivirus_expiry})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mouse Count</p>
                <p className="text-2xl font-bold">{stats.mouse}</p>
              </div>
              <Mouse className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Keyboard Count</p>
                <p className="text-2xl font-bold">{stats.keyboard}</p>
              </div>
              <Keyboard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Exchanges</p>
                <p className="text-2xl font-bold">{stats.exchanged}</p>
              </div>
              <Edit className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accessories History */}
      <Card>
        <CardHeader>
          <CardTitle>Accessories History</CardTitle>
          <CardDescription>
            Complete history of issued accessories and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userAccessories.length > 0 ? (
            <div className="space-y-4">
              {userAccessories.map((accessory) => (
                <div key={accessory.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {accessory.type === 'mouse' && <Mouse className="h-4 w-4" />}
                      {accessory.type === 'keyboard' && <Keyboard className="h-4 w-4" />}
                      {accessory.type === 'headset' && <Package className="h-4 w-4" />}
                      {accessory.type === 'bag' && <Package className="h-4 w-4" />}
                      {accessory.type === 'other' && <Package className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{accessory.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {accessory.brand} {accessory.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {accessory.issue_date ? new Date(accessory.issue_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        accessory.status === 'active' ? 'secondary' :
                        accessory.status === 'damaged' ? 'destructive' : 'outline'
                      }
                    >
                      {accessory.status}
                    </Badge>
                    {accessory.battery_status && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Battery: {accessory.battery_status}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No accessories issued to this user yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;