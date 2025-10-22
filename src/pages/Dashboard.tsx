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
import { AppFooter } from "@/components/layout/AppFooter";

// Enhanced style constants
const glassCard = `
  relative overflow-hidden
  bg-gradient-to-br from-white/10 to-white/5
  backdrop-blur-xl
  border border-white/20
  shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
  rounded-2xl
  transition-all duration-500 ease-out
  group
  hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.6)]
  hover:border-white/40
  hover:-translate-y-1
  hover:scale-[1.02]
`;

const glassGrid = `
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  gap-8
  animate-[fadeIn_0.5s_ease-out] mt-10
`;
const glassBg = `
  min-h-screen
  bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
  from-blue-100 via-violet-200 to-teal-100
  dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
  overflow-hidden
  relative
`;

// Add these animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes glow {
    0%, 100% { opacity: 0.8; filter: brightness(1); }
    50% { opacity: 1; filter: brightness(1.2); }
  }
`;
document.head.appendChild(style);

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

  // Load dashboard data
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
      <div className={`${glassBg} p-6 pb-20 relative overflow-hidden`}>
        {/* Animated Background - keep this for all views */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[800px] h-[800px] bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-[glow_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] bg-gradient-to-bl from-teal-400/30 via-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-[glow_12s_ease-in-out_infinite]" />
        </div>

        {/* Overview Stats */}
        <div className={glassGrid}>
          <div className={`${glassCard} group cursor-pointer`} onClick={() => navigate('/accessories')}>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 opacity-30 rounded-full blur-xl group-hover:opacity-60 transition" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
              <CardTitle className="text-sm font-semibold opacity-90 drop-shadow">Total Users</CardTitle>
              <Users className="h-7 w-7 opacity-80 drop-shadow" />
            </CardHeader>
            <CardContent className="z-10 relative">
              <div className="text-4xl font-extrabold drop-shadow-lg animate-float">{stats.totalAssets}</div>
              <p className="text-xs opacity-80 mt-1 font-medium">Active employees</p>
            </CardContent>
          </div>

          {/* <div className={`${glassCard} group cursor-pointer`} onClick={() => navigate('/departments')}>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 opacity-30 rounded-full blur-xl group-hover:opacity-60 transition" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
              <CardTitle className="text-sm font-semibold opacity-90 drop-shadow">Departments</CardTitle>
              <Building2 className="h-7 w-7 opacity-80 drop-shadow" />
            </CardHeader>
            <CardContent className="z-10 relative">
              <div className="text-4xl font-extrabold drop-shadow-lg animate-float">{stats.totalDepartments}</div>
              <p className="text-xs opacity-80 mt-1 font-medium">Active departments</p>
            </CardContent>
          </div> */}

          <div className={`${glassCard} group cursor-pointer`} onClick={() => navigate('/accessories')}>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-600 opacity-30 rounded-full blur-xl group-hover:opacity-60 transition" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
              <CardTitle className="text-sm font-semibold opacity-90 drop-shadow">IT Assets</CardTitle>
              <Monitor className="h-7 w-7 opacity-80 drop-shadow" />
            </CardHeader>
            <CardContent className="z-10 relative">
              <div className="text-4xl font-extrabold drop-shadow-lg animate-float">{stats.totalAssets}</div>
              <p className="text-xs opacity-80 mt-1 font-medium">Tracked devices</p>
            </CardContent>
          </div>

          <div className={`${glassCard} group cursor-pointer ${stats.expiredAntivirus > 0
            ? 'border-red-400 shadow-red-200'
            : 'border-green-400 shadow-green-200'
            }`}>
            <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl group-hover:opacity-60 transition ${stats.expiredAntivirus > 0
              ? 'bg-gradient-to-br from-red-400 to-pink-600 opacity-40'
              : 'bg-gradient-to-br from-green-400 to-emerald-600 opacity-30'
              }`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
              <CardTitle className="text-sm font-semibold opacity-90 drop-shadow">Antivirus Status</CardTitle>
              <AlertTriangle className="h-7 w-7 opacity-80 drop-shadow" />
            </CardHeader>
            <CardContent className="z-10 relative">
              <div className="text-4xl font-extrabold drop-shadow-lg animate-float">{stats.expiredAntivirus}</div>
              <p className="text-xs opacity-80 mt-1 font-medium">
                {stats.expiredAntivirus > 0 ? 'Expired licenses' : 'All up to date'}
              </p>
            </CardContent>
          </div>
        </div>

        {/* Unit/Office Cards */}
        <div>
          <h2 className="text-3xl font-extrabold text-sky-800 dark:text-sky-200 drop-shadow mt-8 mb-8">Units & Offices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.unitStats.map((unit) => (
              <div
                key={unit.id}
                className={`${glassCard} group cursor-pointer hover:scale-105 hover:-rotate-1`}
                onClick={() => handleUnitClick(unit)}
                style={{ perspective: 1000 }}
              >
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 opacity-30 rounded-full blur-xl group-hover:opacity-60 transition" />
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sky-700 text-xl font-bold drop-shadow">
                    <MapPin className="h-6 w-6" />
                    <span>{unit.name}</span>
                  </CardTitle>
                  <CardDescription className="text-sky-600 font-semibold">{unit.location}</CardDescription>
                </CardHeader>
                <CardContent>
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
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`${glassCard} mt-14`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sky-700 text-xl font-bold drop-shadow">
              <TrendingUp className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription className="font-medium">
              Frequently used management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              className="justify-start bg-sky-500 hover:bg-sky-600 text-white shadow-lg"
              onClick={() => navigate('/accessories')}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Manage IT Assets
            </Button>
            <Button
              className="justify-start bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
              onClick={() => navigate('/departments')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Manage Departments
            </Button>
            <Button
              className="justify-start bg-purple-500 hover:bg-purple-600 text-white shadow-lg"
              onClick={() => navigate('/profile')}
            >
              <Users className="mr-2 h-4 w-4" />
              User Profiles
            </Button>
          </CardContent>
        </div>

        <AppFooter />
      </div>
    );
  }

  // Department View - Update to match main view styling
  if (selectedUnit && !selectedDepartment) {
    return (
      <div className={`${glassBg} p-6 pb-20 relative overflow-hidden`}>
        {/* Add same animated background as main view */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[800px] h-[800px] bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-[glow_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] bg-gradient-to-bl from-teal-400/30 via-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-[glow_12s_ease-in-out_infinite]" />
        </div>

        <div className="relative z-10">
          <Button
            variant="outline"
            onClick={handleBackToUnits}
            className="mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            ← Back to Units
          </Button>
          <h1 className="text-3xl font-bold text-sky-800 dark:text-sky-200">
            {selectedUnit.name} - Departments
          </h1>
          <p className="text-muted-foreground">{selectedUnit.location}</p>
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
                      <div className="text-2xl font-bold text-emerald-600">{deptStats?.total_assets || 0}</div>
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
        <AppFooter />
      </div>
    );
  }

  // User List View - Update to match main view styling
  if (selectedDepartment) {
    return (
      <div className={`${glassBg} p-6 pb-20 relative overflow-hidden`}>
        {/* Add same animated background as main view */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[800px] h-[800px] bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-[glow_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] bg-gradient-to-bl from-teal-400/30 via-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-[glow_12s_ease-in-out_infinite]" />
        </div>

        <div className="relative z-10">
          <Button
            variant="outline"
            onClick={handleBackToDepartments}
            className="mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
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
                      <Network className="h-4 w-4 text-sky-600" />
                      <span>
                        IP:{' '}
                        <a
                          href={`tightvnc://${asset.ip_no}`}
                          className="text-sky-700 font-semibold hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            try {
                              // Copy IP
                              navigator.clipboard.writeText(asset.ip_no);
                              // Open TightVNC (via custom protocol)
                              window.location.href = `tightvnc://${asset.ip_no}`;
                            } catch (err) {
                              console.error('Clipboard copy failed:', err);
                            }
                          }}
                        >
                          {asset.ip_no}
                        </a>
                      </span>
                    </div>
                  )}

                  {asset.anydesk_id && (
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-sky-600" />
                      <span>
                        AD:{' '}
                        <a
                          href={`anydesk://${asset.anydesk_id}`}
                          className="text-sky-700 font-semibold hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            try {
                              navigator.clipboard.writeText(asset.anydesk_id);
                              window.location.href = `anydesk://${asset.anydesk_id}`;
                            } catch (err) {
                              console.error('Clipboard copy failed:', err);
                            }
                          }}
                        >
                          {asset.anydesk_id}
                        </a>
                      </span>
                    </div>
                  )}
                  
                  {asset.ultraview_id && (
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-sky-600" />
                      <span>
                        UV:{' '}
                        <a
                          href={`ultraviewer://${asset.ultraview_id}`}
                          className="text-sky-700 font-semibold hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            try {
                              navigator.clipboard.writeText(asset.ultraview_id);
                              window.location.href = `ultraviewer://${asset.ultraview_id}`;
                            } catch (err) {
                              console.error('Clipboard copy failed:', err);
                            }
                          }}
                        >
                          {asset.ultraview_id}
                        </a>
                      </span>
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
        <AppFooter />
      </div>
    );
  }
};

export default Dashboard;