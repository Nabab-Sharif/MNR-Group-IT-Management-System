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
import { Textarea } from "@/components/ui/textarea";
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
  BadgeCheck,
  Plus,
  Trash2,
  Printer,
  Bell,
  Clock,
  Monitor,
  Battery,
  MapPin,
  Users
} from "lucide-react";
import dbService from "@/services/dbService";

const UserProfiles = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [recentActivities, setRecentActivities] = useState({});
  const [newActivity, setNewActivity] = useState({
    type: "",
    details: "",
    quantity: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id.toString() === selectedUserId);
      setSelectedUser(user);
      if (user) {
        loadUserData(user.id);
      }
    }
  }, [selectedUserId, users]);

  const loadData = () => {
    const usersData = dbService.getUsers();
    const departmentsData = dbService.getDepartments();
    const unitsData = dbService.getUnits();
    const recentActivitiesData = dbService.getRecentActivities();
    
    setUsers(usersData);
    setDepartments(departmentsData);
    setUnits(unitsData);
    setRecentActivities(recentActivitiesData);
  };

  const loadUserData = (userId) => {
    const activities = dbService.getUserActivities(userId);
    const stats = dbService.getUserStats(userId);
    setUserActivities(activities);
    setUserStats(stats);
  };

  const getUserDepartment = (departmentId) => {
    return departments.find(dept => dept.id.toString() === departmentId);
  };

  const getUserUnit = (user) => {
    const dept = getUserDepartment(user.department_id);
    return units.find(unit => unit.name === dept?.unit);
  };

  const handlePictureCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfilePicture(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleAddActivity = () => {
    if (selectedUserId && newActivity.type) {
      const activity = dbService.addUserActivity(selectedUserId, newActivity);
      setUserActivities(prev => [...prev, activity]);
      loadUserData(selectedUserId);
      setNewActivity({ type: "", details: "", quantity: 1 });
      toast({
        title: "Activity added",
        description: "User activity has been recorded successfully.",
      });
    }
  };

  const handleDeleteActivity = (activityId) => {
    dbService.deleteUserActivity(activityId);
    setUserActivities(prev => prev.filter(a => a.id !== activityId));
    loadUserData(selectedUserId);
    toast({
      title: "Activity deleted",
      description: "Activity has been removed successfully.",
    });
  };

  const printProfile = () => {
    window.print();
  };

  const getFilteredUsers = () => {
    if (!selectedUnit) return users;
    return users.filter(user => {
      const dept = getUserDepartment(user.department_id);
      return dept && dept.unit === selectedUnit;
    });
  };

  // Show unit selection if no unit is selected
  if (!selectedUnit) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              User Profiles
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Select a unit to view user profiles
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => {
            const unitUsers = users.filter(user => {
              const dept = getUserDepartment(user.department_id);
              return dept && dept.unit === unit.name;
            });
            
            return (
              <Card 
                key={unit.id} 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-sky-200 hover:border-sky-400"
                onClick={() => setSelectedUnit(unit.name)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sky-700">
                    <MapPin className="h-5 w-5" />
                    <span>{unit.name}</span>
                  </CardTitle>
                  <CardDescription className="text-sky-600">
                    {unit.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-emerald-600" />
                      <span className="text-2xl font-bold text-emerald-600">{unitUsers.length}</span>
                      <span className="text-sm text-muted-foreground">Users</span>
                    </div>
                    <Button variant="outline" size="sm">
                      View Profiles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activities Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700">
                <Calendar className="h-5 w-5" />
                <span>Today's Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{(recentActivities as any).today?.length || 0}</div>
              <p className="text-sm text-muted-foreground">New activities today</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <Clock className="h-5 w-5" />
                <span>Tomorrow's Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{(recentActivities as any).tomorrow?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Scheduled activities</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-700">
                <Bell className="h-5 w-5" />
                <span>Recent Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{(recentActivities as any).recent?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Recent profile changes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show user selection if no user is selected
  if (!selectedUser) {
    const filteredUsers = getFilteredUsers();
    
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedUnit("")}
              className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              ← Back to Units
            </Button>
            <h1 className="text-3xl font-bold text-sky-800 dark:text-sky-200">
              {selectedUnit} - User Profiles
            </h1>
            <p className="text-muted-foreground">{filteredUsers.length} users</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const dept = getUserDepartment(user.department_id);
            const stats = dbService.getUserStats(user.id);
            
            return (
              <Card 
                key={user.id} 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-sky-200 hover:border-sky-400"
                onClick={() => setSelectedUserId(user.id.toString())}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profile_picture} />
                      <AvatarFallback className="bg-sky-100 text-sky-700">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sky-700">{user.name}</CardTitle>
                      <CardDescription>{user.designation || 'N/A'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{dept?.name || 'N/A'}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{stats.total_accessories}</div>
                      <div className="text-xs text-muted-foreground">Accessories</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{stats.total_activities}</div>
                      <div className="text-xs text-muted-foreground">Activities</div>
                    </div>
                  </div>

                  {user.antivirus_expiry && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Shield className="h-4 w-4" />
                      <span className={new Date(user.antivirus_expiry) < new Date() ? 'text-red-600 font-medium' : 'text-green-600'}>
                        Antivirus: {new Date(user.antivirus_expiry).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Individual user profile view
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen print:bg-white print:shadow-none">
      <div className="flex items-center justify-between print:mb-8">
        <div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedUserId("")}
            className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50 print:hidden"
          >
            ← Back to Users
          </Button>
          <h1 className="text-3xl font-bold text-sky-800 dark:text-sky-200 print:text-black">
            User Profile
          </h1>
        </div>
        <Button 
          onClick={printProfile}
          className="bg-sky-500 hover:bg-sky-600 text-white print:hidden"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Profile
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-sky-200 print:shadow-none print:border print:border-gray-300">
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-sky-200">
                <AvatarImage src={profilePicture || selectedUser.profile_picture} />
                <AvatarFallback className="bg-sky-100 text-sky-700 text-2xl font-bold">
                  {selectedUser.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8 print:hidden"
                onClick={handlePictureCapture}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-sky-800 print:text-black">{selectedUser.name}</h2>
                <p className="text-lg text-muted-foreground">{selectedUser.designation || 'N/A'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">ID: {selectedUser.id_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedUser.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedUser.email || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{getUserDepartment(selectedUser.department_id)?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{getUserUnit(selectedUser)?.location || 'N/A'}</span>
                  </div>
                  {selectedUser.antivirus_expiry && (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span className={`text-sm ${new Date(selectedUser.antivirus_expiry) < new Date() ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                        Antivirus: {new Date(selectedUser.antivirus_expiry).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <Mouse className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">{(userStats as any).mouse || 0}</div>
            <div className="text-xs opacity-80">Mouse</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <Keyboard className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">{(userStats as any).keyboard || 0}</div>
            <div className="text-xs opacity-80">Keyboard</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">{(userStats as any).antivirus || 0}</div>
            <div className="text-xs opacity-80">Antivirus</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <Battery className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">{(userStats as any).battery || 0}</div>
            <div className="text-xs opacity-80">Battery</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-green-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <Monitor className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">{(userStats as any).laptop_exchanges || 0}</div>
            <div className="text-xs opacity-80">Laptop</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">{(userStats as any).pc_exchanges || 0}</div>
            <div className="text-xs opacity-80">PC Exchange</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Activity Section */}
      <Card className="bg-white/80 backdrop-blur-sm border-sky-200 print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sky-700">
            <Plus className="h-5 w-5" />
            <span>Add New Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select value={newActivity.type} onValueChange={(value) => setNewActivity(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mouse">Mouse</SelectItem>
                  <SelectItem value="keyboard">Keyboard</SelectItem>
                  <SelectItem value="antivirus">Antivirus</SelectItem>
                  <SelectItem value="battery">Battery</SelectItem>
                  <SelectItem value="laptop_exchange">Laptop Exchange</SelectItem>
                  <SelectItem value="pc_exchange">PC Exchange</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="activity-quantity">Quantity</Label>
              <Input
                id="activity-quantity"
                type="number"
                min="1"
                value={newActivity.quantity}
                onChange={(e) => setNewActivity(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="activity-details">Details</Label>
              <Input
                id="activity-details"
                placeholder="Additional details"
                value={newActivity.details}
                onChange={(e) => setNewActivity(prev => ({ ...prev, details: e.target.value }))}
              />
            </div>
          </div>
          
          <Button onClick={handleAddActivity} className="bg-sky-500 hover:bg-sky-600 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </CardContent>
      </Card>

      {/* Activities History */}
      <Card className="bg-white/80 backdrop-blur-sm border-sky-200 print:shadow-none print:border print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="flex items-center space-x-2 text-sky-700 print:text-black">
            <Calendar className="h-5 w-5" />
            <span>Activity History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userActivities.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No activities recorded</p>
            ) : (
              userActivities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-sky-50 dark:bg-slate-800 rounded-lg print:bg-gray-50 print:border print:border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-100 dark:bg-slate-700 rounded-full">
                      {activity.type === 'mouse' && <Mouse className="h-4 w-4 text-sky-600" />}
                      {activity.type === 'keyboard' && <Keyboard className="h-4 w-4 text-sky-600" />}
                      {activity.type === 'antivirus' && <Shield className="h-4 w-4 text-sky-600" />}
                      {activity.type === 'battery' && <Battery className="h-4 w-4 text-sky-600" />}
                      {(activity.type === 'laptop_exchange' || activity.type === 'pc_exchange') && <Monitor className="h-4 w-4 text-sky-600" />}
                    </div>
                    <div>
                      <div className="font-medium text-sky-800 dark:text-sky-200 print:text-black">
                        {activity.type.replace('_', ' ').toUpperCase()} 
                        {activity.quantity > 1 && ` (${activity.quantity})`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.details && `${activity.details} • `}
                        {activity.date} at {activity.time}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="text-red-600 hover:text-red-800 print:hidden"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:border {
            border: 1px solid #e5e7eb !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\\:border-gray-200 {
            border-color: #e5e7eb !important;
          }
          .print\\:bg-gray-50 {
            background-color: #f9fafb !important;
          }
          .print\\:mb-8 {
            margin-bottom: 2rem !important;
          }
          .print\\:pb-2 {
            padding-bottom: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UserProfiles;