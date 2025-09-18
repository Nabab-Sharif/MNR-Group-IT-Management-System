import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  Shield, 
  AlertTriangle,
  Monitor,
  TrendingUp,
  Calendar,
  MapPin,
  Network,
  Eye
} from "lucide-react";
import dbService from "@/services/dbService";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    expiredAntivirus: 0,
    totalAssets: 0,
    unitStats: [],
    departmentStats: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const users = dbService.getUsers();
    const departments = dbService.getDepartments();
    const assets = dbService.getITAssets();
    const expiredData = dbService.getExpiredAntivirusUsers();
    const unitStats = dbService.getUnitStats();
    const departmentStats = dbService.getDepartmentStats();

    setStats({
      totalUsers: users.length,
      totalDepartments: departments.length,
      expiredAntivirus: expiredData.users.length + expiredData.assets.length,
      totalAssets: assets.length,
      unitStats,
      departmentStats
    });
  };

  const handleUnitClick = (unit) => {
    setSelectedUnit(unit);
    setSelectedDepartment(null);
  };

  const handleDepartmentClick = (department) => {
    setSelectedDepartment(department);
  };

  const handleBackToUnits = () => {
    setSelectedUnit(null);
    setSelectedDepartment(null);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
  };

  // Main Dashboard View
  if (!selectedUnit && !selectedDepartment) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              MNR Group IT Management System
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Welcome to the comprehensive IT infrastructure dashboard
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sky-600">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Users</CardTitle>
              <Users className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs opacity-80 mt-1">Active employees</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
            onClick={() => navigate('/departments')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Departments</CardTitle>
              <Building2 className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalDepartments}</div>
              <p className="text-xs opacity-80 mt-1">Active departments</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
            onClick={() => navigate('/accessories')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">IT Assets</CardTitle>
              <Monitor className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAssets}</div>
              <p className="text-xs opacity-80 mt-1">Tracked devices</p>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${
            stats.expiredAntivirus > 0 
              ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white' 
              : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Antivirus Status</CardTitle>
              <AlertTriangle className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.expiredAntivirus}</div>
              <p className="text-xs opacity-80 mt-1">
                {stats.expiredAntivirus > 0 ? 'Expired licenses' : 'All up to date'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Unit/Office Cards */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-sky-800 dark:text-sky-200">Units & Offices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.unitStats.map((unit) => (
              <Card 
                key={unit.id} 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-sky-200 hover:border-sky-400"
                onClick={() => handleUnitClick(unit)}
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
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-sky-600">{unit.total_departments}</div>
                      <div className="text-xs text-muted-foreground">Departments</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{unit.total_users}</div>
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

        {/* Quick Actions */}
        <Card className="bg-white/80 backdrop-blur-sm border-sky-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sky-700">
              <TrendingUp className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Frequently used management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              className="justify-start bg-sky-500 hover:bg-sky-600 text-white" 
              onClick={() => navigate('/accessories')}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Manage IT Assets
            </Button>
            <Button 
              className="justify-start bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => navigate('/departments')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Manage Departments
            </Button>
            <Button 
              className="justify-start bg-purple-500 hover:bg-purple-600 text-white"
              onClick={() => navigate('/profile')}
            >
              <Users className="mr-2 h-4 w-4" />
              User Profiles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Department View
  if (selectedUnit && !selectedDepartment) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={handleBackToUnits}
              className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              ← Back to Units
            </Button>
            <h1 className="text-3xl font-bold text-sky-800 dark:text-sky-200">
              {selectedUnit.name} - Departments
            </h1>
            <p className="text-muted-foreground">{selectedUnit.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedUnit.departments.map((department) => {
            const deptStats = stats.departmentStats.find(d => d.id === department.id);
            return (
              <Card 
                key={department.id} 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-sky-200 hover:border-sky-400"
                onClick={() => handleDepartmentClick(deptStats)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sky-700">
                    <Building2 className="h-5 w-5" />
                    <span>{department.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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

  // User List View
  if (selectedDepartment) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={handleBackToDepartments}
              className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              ← Back to Departments
            </Button>
            <h1 className="text-3xl font-bold text-sky-800 dark:text-sky-200">
              {selectedDepartment.name} - Users
            </h1>
            <p className="text-muted-foreground">
              {selectedDepartment.total_users} users • {selectedDepartment.total_assets} assets
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
          ))}
        </div>

        {/* Assets Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-sky-800 dark:text-sky-200">IT Assets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedDepartment.assets.map((asset) => (
              <Card 
                key={asset.id} 
                className="bg-white/80 backdrop-blur-sm border-sky-200 hover:shadow-xl transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sky-700">
                    <Monitor className="h-4 w-4" />
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
                      <Network className="h-4 w-4" />
                      <span>{asset.ip_no}</span>
                    </div>
                  )}
                  {asset.ultraview_id && (
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>UV: {asset.ultraview_id}</span>
                    </div>
                  )}
                  {asset.anydesk_id && (
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span>AD: {asset.anydesk_id}</span>
                    </div>
                  )}
                  {asset.antivirus_validity && (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span className={new Date(asset.antivirus_validity) < new Date() ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {new Date(asset.antivirus_validity).toLocaleDateString()}
                      </span>
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
};

export default Dashboard;