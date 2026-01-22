import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Shield, 
  AlertTriangle,
  Monitor,
  Calendar,
  MapPin,
  Printer,
} from "lucide-react";
import dbService from "@/services/dbService";
import UserAssetCard from "@/components/UserAssetCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    expiredAntivirus: 0,
    totalAssets: 0,
    totalLaptops: 0,
    totalDesktops: 0,
    expiredAntivirusUsers: [],
    expiredAntivirusAssets: [],
    unitStats: [],
    departmentStats: []
  });
  const [viewExpiredAntivirus, setViewExpiredAntivirus] = useState(false);
  const [viewLaptops, setViewLaptops] = useState(false);
  const [viewDesktops, setViewDesktops] = useState(false);
  const [laptopUsers, setLaptopUsers] = useState([]);
  const [desktopUsers, setDesktopUsers] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const users = await dbService.getUsers();
      const departments = await dbService.getDepartments();
      const assets = await dbService.getITAssets();
      const expiredData = await dbService.getExpiredAntivirusUsers();
      const unitStats = await dbService.getUnitStats();
      const departmentStats = await dbService.getDepartmentStats();

      // Count laptops and desktops
      const laptops = assets.filter(asset => asset.device_type?.toLowerCase() === 'laptop');
      const desktops = assets.filter(asset => asset.device_type?.toLowerCase() === 'desktop');

      // Get all laptops and desktops with their employee data
      const laptopUsersList = laptops.map(asset => ({
        ...asset,
        user: users.find(u => u.name === asset.employee_name)
      }));
      
      const desktopUsersList = desktops.map(asset => ({
        ...asset,
        user: users.find(u => u.name === asset.employee_name)
      }));

      setLaptopUsers(laptopUsersList);
      setDesktopUsers(desktopUsersList);

      // Get unique employees from assets (who are not in users table)
      const employeesFromAssets = assets
        .filter(asset => asset.employee_name && asset.employee_name.trim() !== '')
        .map(asset => asset.employee_name.trim().toLowerCase());
      
      const uniqueEmployees = new Set([
        ...users.map(u => u.name.trim().toLowerCase()),
        ...employeesFromAssets
      ]);

      const totalUniqueUsers = uniqueEmployees.size;

      setStats({
        totalUsers: assets.length, // Total IT Users count (same as total assets)
        totalDepartments: departments.length,
        expiredAntivirus: expiredData.users.length + expiredData.assets.length,
        totalAssets: assets.length,
        totalLaptops: laptops.length,
        totalDesktops: desktops.length,
        expiredAntivirusUsers: expiredData.users,
        expiredAntivirusAssets: expiredData.assets,
        unitStats,
        departmentStats
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
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

  const handleAntivirusClick = () => {
    setViewExpiredAntivirus(true);
  };

  const handleBackFromAntivirus = () => {
    setViewExpiredAntivirus(false);
  };

  const handleLaptopsClick = () => {
    setViewLaptops(true);
  };

  const handleDesktopsClick = () => {
    setViewDesktops(true);
  };

  const handleBackFromLaptops = () => {
    setViewLaptops(false);
  };

  const handleBackFromDesktops = () => {
    setViewDesktops(false);
  };

  // Laptops View
  if (viewLaptops) {
    // Group laptops by unit/office
    const laptopsByUnit: { [key: string]: any[] } = laptopUsers.reduce((acc, asset) => {
      const unit = asset.unit_office || 'Unknown Unit';
      if (!acc[unit]) acc[unit] = [];
      acc[unit].push(asset);
      return acc;
    }, {} as { [key: string]: any[] });

    const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: `${label}: ${text}` });
    };

    const handleIPClick = (ip: string) => {
      copyToClipboard(ip, 'IP Address');
      // Try to open command prompt or notify user
      if (navigator.platform.toUpperCase().indexOf('WIN') > -1) {
        toast({ title: 'IP Copied', description: `You can now ping ${ip} from command prompt` });
      }
    };

    const handleEmailClick = (email: string) => {
      window.location.href = `mailto:${email}`;
    };

    const handlePhoneClick = (phone: string) => {
      window.location.href = `tel:${phone}`;
    };

    const handleAnyDeskClick = (id: string) => {
      copyToClipboard(id, 'AnyDesk ID');
      // Attempt to open AnyDesk - this may vary by OS
      const anyDeskUrl = `anydesk://open?id=${id}`;
      window.location.href = anyDeskUrl;
    };

    const handleUltraViewClick = (id: string) => {
      copyToClipboard(id, 'UltraView ID');
      toast({ title: 'UltraView ID Copied', description: `Launch UltraView and enter: ${id}` });
    };

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <style>{`
          .laptop-info-btn {
            padding: 8px 12px;
            border-radius: 8px;
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
            border: 1px solid rgba(168, 85, 247, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
            font-weight: 500;
          }
          .laptop-info-btn:hover {
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%);
            border-color: rgba(168, 85, 247, 0.6);
            transform: translateY(-1px);
          }
          .device-card-laptop {
            background: linear-gradient(135deg, rgba(243, 232, 255, 0.8) 0%, rgba(240, 245, 250, 0.8) 100%);
            border: 1.5px solid rgba(168, 85, 247, 0.3);
            border-radius: 12px;
            padding: 16px;
            transition: all 0.3s ease;
          }
          .device-card-laptop:hover {
            transform: translateY(-4px);
            border-color: rgba(168, 85, 247, 0.6);
            box-shadow: 0 12px 24px rgba(168, 85, 247, 0.15);
          }
        `}</style>
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={handleBackFromLaptops}
              className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              Laptop Users
            </h1>
            <p className="text-muted-foreground">
              Total: {laptopUsers.length} laptop users (grouped by unit/office)
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 no-print"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        <div className="space-y-8">
          {Object.entries(laptopsByUnit).map(([unit, assets]: [string, any[]]) => (
            <Card key={unit} className="border-purple-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {unit}
                </CardTitle>
                <CardDescription className="text-purple-100">
                  {assets.length} laptop user{assets.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map((item) => (
                    <div key={item.id} className="device-card-laptop">
                      <div className="font-bold text-purple-900 text-lg mb-1">{item.employee_name || 'N/A'}</div>
                      <div className="text-sm text-gray-600 mb-4 font-medium">{item.designation || 'N/A'}</div>
                      
                      <div className="space-y-2">
                        {item.pc_no && (
                          <button onClick={() => copyToClipboard(item.pc_no, 'PC No')} className="laptop-info-btn w-full text-left">📱 {item.pc_no}</button>
                        )}
                        {item.ip_no && (
                          <button onClick={() => handleIPClick(item.ip_no)} className="laptop-info-btn w-full text-left" title="Click to copy IP and open command prompt">🌐 {item.ip_no}</button>
                        )}
                        {item.ip_phone && (
                          <button onClick={() => copyToClipboard(item.ip_phone, 'IP Phone')} className="laptop-info-btn w-full text-left">☎️ {item.ip_phone}</button>
                        )}
                        {item.mobile && (
                          <button onClick={() => handlePhoneClick(item.mobile)} className="laptop-info-btn w-full text-left" title="Click to dial mobile number">📲 {item.mobile}</button>
                        )}
                        {item.phone_no && (
                          <button onClick={() => handlePhoneClick(item.phone_no)} className="laptop-info-btn w-full text-left" title="Click to dial phone number">📞 {item.phone_no}</button>
                        )}
                        {item.email && (
                          <button onClick={() => handleEmailClick(item.email)} className="laptop-info-btn w-full text-left text-purple-700 font-semibold" title="Click to send email">✉️ {item.email}</button>
                        )}
                        {item.anydesk_id && (
                          <button onClick={() => handleAnyDeskClick(item.anydesk_id)} className="laptop-info-btn w-full text-left" title="Click to copy AnyDesk ID and launch">🔴 {item.anydesk_id}</button>
                        )}
                        {item.ultraview_id && (
                          <button onClick={() => handleUltraViewClick(item.ultraview_id)} className="laptop-info-btn w-full text-left" title="Click to copy UltraView ID">👁️ {item.ultraview_id}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Print Container for Laptops */}
        <div id="laptop-print-container">
          <div className="laptop-print-header">
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>
          
          {Object.entries(laptopsByUnit).map(([unit, assets]: [string, any[]]) => {
            // Group assets by department within unit
            const assetsByDept: { [key: string]: any[] } = assets.reduce((acc, asset) => {
              const dept = asset.department_name || 'Unknown Department';
              if (!acc[dept]) acc[dept] = [];
              acc[dept].push(asset);
              return acc;
            }, {});

            return (
              <div key={unit} className="laptop-print-section">
                <div className="laptop-print-unit-title">{unit}</div>
                
                {Object.entries(assetsByDept).map(([dept, deptAssets]: [string, any[]]) => (
                  <div key={dept} className="laptop-print-dept-section">
                    <div className="laptop-print-dept-title">{dept}</div>
                    <table className="laptop-print-table">
                      <thead>
                        <tr>
                          <th>Employee Name</th>
                          <th>Designation</th>
                          <th>PC No</th>
                          <th>IP Address</th>
                          <th>IP Phone</th>
                          <th>Mobile</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>AnyDesk</th>
                          <th>UltraView</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptAssets.map((item) => (
                          <tr key={item.id}>
                            <td>{item.employee_name || '-'}</td>
                            <td>{item.designation || '-'}</td>
                            <td>{item.pc_no || '-'}</td>
                            <td>{item.ip_no || '-'}</td>
                            <td>{item.ip_phone || '-'}</td>
                            <td>{item.mobile || '-'}</td>
                            <td>{item.phone_no || '-'}</td>
                            <td>{item.email || '-'}</td>
                            <td>{item.anydesk_id || '-'}</td>
                            <td>{item.ultraview_id || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })}
          
          <div className="laptop-print-footer">
            <p>Total Laptop Users: {laptopUsers.length}</p>
            <p>Department: IT Systems | Report Type: Device Inventory</p>
          </div>
        </div>
      </div>
    );
  }

  // Desktops View
  if (viewDesktops) {
    // Group desktops by unit/office
    const desktopsByUnit: { [key: string]: any[] } = desktopUsers.reduce((acc, asset) => {
      const unit = asset.unit_office || 'Unknown Unit';
      if (!acc[unit]) acc[unit] = [];
      acc[unit].push(asset);
      return acc;
    }, {} as { [key: string]: any[] });

    const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: `${label}: ${text}` });
    };

    const handleIPClick = (ip: string) => {
      copyToClipboard(ip, 'IP Address');
      if (navigator.platform.toUpperCase().indexOf('WIN') > -1) {
        toast({ title: 'IP Copied', description: `You can now ping ${ip} from command prompt` });
      }
    };

    const handleEmailClick = (email: string) => {
      window.location.href = `mailto:${email}`;
    };

    const handlePhoneClick = (phone: string) => {
      window.location.href = `tel:${phone}`;
    };

    const handleAnyDeskClick = (id: string) => {
      copyToClipboard(id, 'AnyDesk ID');
      const anyDeskUrl = `anydesk://open?id=${id}`;
      window.location.href = anyDeskUrl;
    };

    const handleUltraViewClick = (id: string) => {
      copyToClipboard(id, 'UltraView ID');
      toast({ title: 'UltraView ID Copied', description: `Launch UltraView and enter: ${id}` });
    };

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <style>{`
          .desktop-info-btn {
            padding: 8px 12px;
            border-radius: 8px;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
            border: 1px solid rgba(16, 185, 129, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
            font-weight: 500;
          }
          .desktop-info-btn:hover {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
            border-color: rgba(16, 185, 129, 0.6);
            transform: translateY(-1px);
          }
          .device-card-desktop {
            background: linear-gradient(135deg, rgba(209, 250, 229, 0.8) 0%, rgba(207, 250, 254, 0.8) 100%);
            border: 1.5px solid rgba(16, 185, 129, 0.3);
            border-radius: 12px;
            padding: 16px;
            transition: all 0.3s ease;
          }
          .device-card-desktop:hover {
            transform: translateY(-4px);
            border-color: rgba(16, 185, 129, 0.6);
            box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15);
          }
        `}</style>
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={handleBackFromDesktops}
              className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              Desktop Users
            </h1>
            <p className="text-muted-foreground">
              Total: {desktopUsers.length} desktop users (grouped by unit/office)
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 no-print"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        <div className="space-y-8">
          {Object.entries(desktopsByUnit).map(([unit, assets]: [string, any[]]) => (
            <Card key={unit} className="border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {unit}
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  {assets.length} desktop user{assets.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map((item) => (
                    <div key={item.id} className="device-card-desktop">
                      <div className="font-bold text-emerald-900 text-lg mb-1">{item.employee_name || 'N/A'}</div>
                      <div className="text-sm text-gray-600 mb-4 font-medium">{item.designation || 'N/A'}</div>
                      
                      <div className="space-y-2">
                        {item.pc_no && (
                          <button onClick={() => copyToClipboard(item.pc_no, 'PC No')} className="desktop-info-btn w-full text-left">📱 {item.pc_no}</button>
                        )}
                        {item.ip_no && (
                          <button onClick={() => handleIPClick(item.ip_no)} className="desktop-info-btn w-full text-left" title="Click to copy IP and open command prompt">🌐 {item.ip_no}</button>
                        )}
                        {item.ip_phone && (
                          <button onClick={() => copyToClipboard(item.ip_phone, 'IP Phone')} className="desktop-info-btn w-full text-left">☎️ {item.ip_phone}</button>
                        )}
                        {item.mobile && (
                          <button onClick={() => handlePhoneClick(item.mobile)} className="desktop-info-btn w-full text-left" title="Click to dial mobile number">📲 {item.mobile}</button>
                        )}
                        {item.phone_no && (
                          <button onClick={() => handlePhoneClick(item.phone_no)} className="desktop-info-btn w-full text-left" title="Click to dial phone number">📞 {item.phone_no}</button>
                        )}
                        {item.email && (
                          <button onClick={() => handleEmailClick(item.email)} className="desktop-info-btn w-full text-left text-emerald-700 font-semibold" title="Click to send email">✉️ {item.email}</button>
                        )}
                        {item.anydesk_id && (
                          <button onClick={() => handleAnyDeskClick(item.anydesk_id)} className="desktop-info-btn w-full text-left" title="Click to copy AnyDesk ID and launch">🔴 {item.anydesk_id}</button>
                        )}
                        {item.ultraview_id && (
                          <button onClick={() => handleUltraViewClick(item.ultraview_id)} className="desktop-info-btn w-full text-left" title="Click to copy UltraView ID">👁️ {item.ultraview_id}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Print Container for Desktops */}
        <div id="desktop-print-container">
          <div className="desktop-print-header">
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>
          
          {Object.entries(desktopsByUnit).map(([unit, assets]: [string, any[]]) => (
            <div key={unit} className="desktop-print-section">
              <div className="desktop-print-unit-title">{unit}</div>
              <table className="desktop-print-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Designation</th>
                    <th>PC No</th>
                    <th>IP Address</th>
                    <th>IP Phone</th>
                    <th>Mobile</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>AnyDesk</th>
                    <th>UltraView</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((item) => (
                    <tr key={item.id}>
                      <td>{item.employee_name || '-'}</td>
                      <td>{item.designation || '-'}</td>
                      <td>{item.pc_no || '-'}</td>
                      <td>{item.ip_no || '-'}</td>
                      <td>{item.ip_phone || '-'}</td>
                      <td>{item.mobile || '-'}</td>
                      <td>{item.phone_no || '-'}</td>
                      <td>{item.email || '-'}</td>
                      <td>{item.anydesk_id || '-'}</td>
                      <td>{item.ultraview_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          
          <div className="desktop-print-footer">
            <p>Total Desktop Users: {desktopUsers.length}</p>
            <p>Department: IT Systems | Report Type: Device Inventory</p>
          </div>
        </div>
      </div>
    );
  }

  // Expired Antivirus View
  if (viewExpiredAntivirus) {
    // Group expired assets by unit/office, then by department
    const expiredByUnitAndDept: { [unit: string]: { [dept: string]: any[] } } = {};
    
    stats.expiredAntivirusAssets.forEach(asset => {
      const unit = asset.unit_office || 'Unknown Unit';
      const dept = asset.division || 'Unknown Department';
      
      if (!expiredByUnitAndDept[unit]) {
        expiredByUnitAndDept[unit] = {};
      }
      if (!expiredByUnitAndDept[unit][dept]) {
        expiredByUnitAndDept[unit][dept] = [];
      }
      expiredByUnitAndDept[unit][dept].push(asset);
    });

    const totalExpired = stats.expiredAntivirusAssets.length;

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-red-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.3); }
            50% { box-shadow: 0 0 40px rgba(220, 38, 38, 0.6); }
          }
          .card-3d {
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
          }
          .card-3d:hover {
            transform: translateY(-8px) perspective(1200px) rotateX(5deg) rotateY(0deg);
            animation: glow 2s ease-in-out;
          }
          .department-card {
            position: relative;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 250, 245, 0.95) 100%);
            border: 1px solid rgba(220, 38, 38, 0.2);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            backdrop-filter: blur(10px);
          }
          .asset-card {
            position: relative;
            background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
            border: 2px solid #fecaca;
            border-radius: 10px;
            padding: 14px;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          .asset-card:hover {
            transform: translateY(-4px);
            border-color: #dc2626;
            box-shadow: 0 8px 16px rgba(220, 38, 38, 0.2);
          }
          .asset-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #dc2626, #ea580c);
            border-radius: 10px 10px 0 0;
          }
          .device-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .device-badge.laptop {
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            color: white;
          }
          .device-badge.desktop {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 8px;
            font-size: 12px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-weight: 600;
            color: #7f1d1d;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .info-value {
            color: #334155;
            font-family: 'Courier New', monospace;
            word-break: break-all;
          }
        `}</style>

        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={handleBackFromAntivirus}
              className="mb-4 border-red-200 text-red-700 hover:bg-red-50"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">
              🔴 Expired Antivirus Licenses
            </h1>
            <p className="text-muted-foreground">
              {totalExpired} device{totalExpired !== 1 ? 's' : ''} require attention • Action required to maintain security
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-red-200 text-red-700 hover:bg-red-50 no-print"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expired</p>
                  <p className="text-3xl font-bold text-red-600">{totalExpired}</p>
                </div>
                <div className="text-5xl opacity-10">⚠️</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Laptops</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.expiredAntivirusAssets.filter(a => a.device_type?.toLowerCase() === 'laptop').length}
                  </p>
                </div>
                <div className="text-5xl opacity-10">💻</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Desktops</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.expiredAntivirusAssets.filter(a => a.device_type?.toLowerCase() === 'desktop').length}
                  </p>
                </div>
                <div className="text-5xl opacity-10">🖥️</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Units with Departments */}
        <div className="space-y-6">
          {Object.entries(expiredByUnitAndDept).length === 0 ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-green-700 font-semibold">✅ No expired antivirus licenses found!</p>
                <p className="text-sm text-green-600 mt-1">All devices have valid antivirus licenses.</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(expiredByUnitAndDept).map(([unit, deptMap]: [string, any]) => (
              <Card key={unit} className="border-red-200 bg-white/90 backdrop-blur-sm card-3d overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-red-500 via-orange-500 to-rose-500 text-white pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <MapPin className="h-5 w-5" />
                    {unit}
                  </CardTitle>
                  <CardDescription className="text-red-100">
                    {Object.values(deptMap).flat().length} expired device{Object.values(deptMap).flat().length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {Object.entries(deptMap).map(([department, assets]: [string, any[]]) => (
                      <div key={department} className="department-card">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full bg-red-600" />
                          <h3 className="font-bold text-red-700">{department}</h3>
                          <Badge variant="secondary" className="ml-auto bg-red-100 text-red-700">
                            {assets.length} device{assets.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {assets.map((asset) => (
                            <div key={asset.id} className="asset-card">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-red-900 text-sm flex-1">
                                  {asset.employee_name || 'N/A'}
                                </div>
                                <span className={`device-badge ${asset.device_type?.toLowerCase()}`}>
                                  {asset.device_type || 'N/A'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                {asset.designation || 'N/A'}
                              </div>

                              <div className="info-grid">
                                {asset.ip_no && (
                                  <div className="info-item">
                                    <div className="info-label">IP Address</div>
                                    <div className="info-value">{asset.ip_no}</div>
                                  </div>
                                )}
                                {asset.ip_phone && (
                                  <div className="info-item">
                                    <div className="info-label">IP Phone</div>
                                    <div className="info-value">{asset.ip_phone}</div>
                                  </div>
                                )}
                                {asset.mobile && (
                                  <div className="info-item">
                                    <div className="info-label">Mobile</div>
                                    <div className="info-value">{asset.mobile}</div>
                                  </div>
                                )}
                                {asset.phone_no && (
                                  <div className="info-item">
                                    <div className="info-label">Phone</div>
                                    <div className="info-value">{asset.phone_no}</div>
                                  </div>
                                )}
                                {asset.email && (
                                  <div className="info-item">
                                    <div className="info-label">Email</div>
                                    <div className="info-value" title={asset.email}>
                                      {asset.email.length > 15 ? asset.email.substring(0, 15) + '...' : asset.email}
                                    </div>
                                  </div>
                                )}
                                {asset.anydesk_id && (
                                  <div className="info-item">
                                    <div className="info-label">AnyDesk</div>
                                    <div className="info-value">{asset.anydesk_id}</div>
                                  </div>
                                )}
                                {asset.ultraview_id && (
                                  <div className="info-item">
                                    <div className="info-label">Ultraview</div>
                                    <div className="info-value">{asset.ultraview_id}</div>
                                  </div>
                                )}
                                {asset.antivirus_code && (
                                  <div className="info-item">
                                    <div className="info-label">AV Code</div>
                                    <div className="info-value font-bold text-red-700">{asset.antivirus_code}</div>
                                  </div>
                                )}
                              </div>

                              {asset.antivirus_validity && (
                                <div className="mt-3 pt-3 border-t border-red-200">
                                  <div className="flex items-center gap-1 text-red-700 font-bold text-xs">
                                    <Shield className="h-3 w-3" />
                                    Expired: {new Date(asset.antivirus_validity).toLocaleDateString('en-GB')}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Print Container for Expired Antivirus */}
        <div id="expired-antivirus-print-container">
          <div className="expired-antivirus-print-header">
            <h1>Expired Antivirus Licenses Report</h1>
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>

          {/* Statistics */}
          <div className="expired-antivirus-print-stats">
            <div className="expired-antivirus-stat-card">
              <div className="expired-antivirus-stat-number">{totalExpired}</div>
              <div className="expired-antivirus-stat-label">Total Expired</div>
            </div>
            <div className="expired-antivirus-stat-card">
              <div className="expired-antivirus-stat-number">{Object.values(expiredByUnitAndDept).reduce((acc, depts) => acc + Object.keys(depts).length, 0)}</div>
              <div className="expired-antivirus-stat-label">Departments Affected</div>
            </div>
            <div className="expired-antivirus-stat-card">
              <div className="expired-antivirus-stat-number">{Object.keys(expiredByUnitAndDept).length}</div>
              <div className="expired-antivirus-stat-label">Units/Offices</div>
            </div>
          </div>

          {/* Units and Assets */}
          {Object.entries(expiredByUnitAndDept).map(([unit, departments]) => (
            <div key={unit} className="expired-antivirus-print-section">
              <div className="expired-antivirus-print-unit">
                <div className="expired-antivirus-print-unit-title">{unit}</div>
                
                {Object.entries(departments).map(([dept, assets]) => (
                  <div key={dept} className="expired-antivirus-print-dept">
                    <div className="expired-antivirus-print-dept-title">{dept}</div>
                    {assets.map((asset) => (
                      <div key={asset.id} className="expired-antivirus-asset-card">
                        <div className="expired-antivirus-asset-info">
                          <div className="expired-antivirus-asset-field">
                            <div className="expired-antivirus-asset-label">Employee</div>
                            <div className="expired-antivirus-asset-value">{asset.employee_name}</div>
                          </div>
                          <div className="expired-antivirus-asset-field">
                            <div className="expired-antivirus-asset-label">PC No</div>
                            <div className="expired-antivirus-asset-value">{asset.pc_no}</div>
                          </div>
                          <div className="expired-antivirus-asset-field">
                            <div className="expired-antivirus-asset-label">IP</div>
                            <div className="expired-antivirus-asset-value">{asset.ip_no || '-'}</div>
                          </div>
                          <div className="expired-antivirus-asset-field">
                            <div className="expired-antivirus-asset-label">Antivirus Code</div>
                            <div className="expired-antivirus-asset-value">{asset.antivirus_code}</div>
                          </div>
                          <div className="expired-antivirus-asset-field">
                            <div className="expired-antivirus-asset-label">Email</div>
                            <div className="expired-antivirus-asset-value">{asset.email}</div>
                          </div>
                          <div className="expired-antivirus-asset-field">
                            <div className="expired-antivirus-asset-label">Expired Date</div>
                            <div className="expired-antivirus-asset-value">{new Date(asset.antivirus_validity).toLocaleDateString('en-GB')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="expired-antivirus-print-footer">
            <p>⚠️ Critical: Immediate action required for expired licenses</p>
            <p>Department: IT Systems | Report Type: License Audit</p>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  if (!selectedUnit && !selectedDepartment) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              MNR IT Management System
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

       

        {/* IT Assets Overview - Improved 3D Cards */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-sky-800 dark:text-sky-200">IT Assets Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Assets Card */}
            <Card 
              className="relative overflow-hidden cursor-pointer border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group"
              style={{ 
                transform: 'perspective(1000px) rotateY(-3deg) rotateX(3deg)',
                transformStyle: 'preserve-3d'
              }}
              onClick={() => navigate('/accessories')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-500 to-blue-600 group-hover:from-sky-400 group-hover:to-blue-500 transition-all" />
              <div className="relative p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black">{stats.totalAssets}</div>
                    <div className="text-xs opacity-80">Total</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold">IT Assets</h3>
                <p className="text-xs opacity-70 mt-1">All registered devices</p>
                <div className="mt-3 flex items-center gap-2 text-xs opacity-80">
                  <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                  <span>Click to manage</span>
                </div>
              </div>
            </Card>

            {/* Laptops Card */}
            <Card 
              className="relative overflow-hidden cursor-pointer border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group"
              style={{ 
                transform: 'perspective(1000px) rotateY(-1deg) rotateX(3deg)',
                transformStyle: 'preserve-3d'
              }}
              onClick={handleLaptopsClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 group-hover:from-purple-400 group-hover:to-indigo-500 transition-all" />
              <div className="relative p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black">{stats.totalLaptops}</div>
                    <div className="text-xs opacity-80">Laptops</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold">Laptop Devices</h3>
                <p className="text-xs opacity-70 mt-1">Portable computers</p>
                <div className="mt-3 flex items-center gap-2 text-xs opacity-80">
                  <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                  <span>View all laptops</span>
                </div>
              </div>
            </Card>

            {/* Desktops Card */}
            <Card 
              className="relative overflow-hidden cursor-pointer border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group"
              style={{ 
                transform: 'perspective(1000px) rotateY(1deg) rotateX(3deg)',
                transformStyle: 'preserve-3d'
              }}
              onClick={handleDesktopsClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 group-hover:from-emerald-400 group-hover:to-teal-500 transition-all" />
              <div className="relative p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black">{stats.totalDesktops}</div>
                    <div className="text-xs opacity-80">Desktops</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold">Desktop Computers</h3>
                <p className="text-xs opacity-70 mt-1">Workstations</p>
                <div className="mt-3 flex items-center gap-2 text-xs opacity-80">
                  <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                  <span>View all desktops</span>
                </div>
              </div>
            </Card>

            {/* Antivirus Card */}
            <Card 
              className="relative overflow-hidden cursor-pointer border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group"
              style={{ 
                transform: 'perspective(1000px) rotateY(3deg) rotateX(3deg)',
                transformStyle: 'preserve-3d'
              }}
              onClick={handleAntivirusClick}
            >
              <div className={`absolute inset-0 ${stats.expiredAntivirus > 0 
                ? 'bg-gradient-to-br from-red-500 via-rose-500 to-red-600 group-hover:from-red-400 group-hover:to-rose-500' 
                : 'bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 group-hover:from-green-400 group-hover:to-emerald-500'
              } transition-all`} />
              <div className="relative p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black">{stats.expiredAntivirus}</div>
                    <div className="text-xs opacity-80">Expired</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold">Antivirus Status</h3>
                <p className="text-xs opacity-70 mt-1">{stats.expiredAntivirus > 0 ? 'Action required' : 'All protected'}</p>
                <div className="mt-3 flex items-center gap-2 text-xs opacity-80">
                  <div className={`w-2 h-2 rounded-full ${stats.expiredAntivirus > 0 ? 'bg-yellow-300' : 'bg-white/80'} animate-pulse`} />
                  <span>{stats.expiredAntivirus > 0 ? 'View expired' : 'All updated'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Unit/Office Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-sky-800 dark:text-sky-200">Units & Offices</h2>
            <Badge className="bg-sky-100 text-sky-700 border-sky-300 text-sm px-3 py-1">
              Total Departments: {stats.totalDepartments}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.unitStats.map((unit) => (
              <Card 
                key={unit.id} 
                className="cursor-pointer perspective-1000 hover-lift glow-effect animate-scale-in bg-white/80 backdrop-blur-sm border-sky-200 hover:border-sky-400 transform-3d"
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
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-sky-600">{unit.total_departments}</div>
                      <div className="text-xs text-muted-foreground">Departments</div>
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

      </div>
    );
  }

  // Department View - Show department cards for the selected unit
  if (selectedUnit && !selectedDepartment) {
    // Get departments with their stats
    const unitDepartments = selectedUnit.departments.map((department) => {
      const deptStats = stats.departmentStats.find(d => d.id === department.id);
      return {
        ...department,
        total_assets: deptStats?.total_assets || 0,
        assets: deptStats?.assets || []
      };
    });

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
            <p className="text-muted-foreground">{selectedUnit.location} • {unitDepartments.length} departments</p>
          </div>
        </div>

        {unitDepartments.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200">
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
              <p className="text-gray-500">Add departments to this unit</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {unitDepartments.map((department, index) => (
              <Card 
                key={department.id} 
                className="cursor-pointer relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group"
                style={{ 
                  transform: 'perspective(1000px) rotateY(-2deg) rotateX(2deg)',
                  transformStyle: 'preserve-3d',
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => handleDepartmentClick({
                  ...department,
                  total_assets: department.total_assets,
                  assets: department.assets
                })}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 group-hover:from-indigo-400 group-hover:to-violet-500 transition-all" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent_50%)]" />
                <div className="relative p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black">{department.total_assets}</div>
                      <div className="text-xs opacity-80">Assets</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold truncate">{department.name}</h3>
                  <p className="text-xs opacity-70 mt-1">Click to view assets</p>
                  <div className="mt-3 flex items-center gap-2 text-xs opacity-80">
                    <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                    <span>{department.total_assets} IT users</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // User List View - same card design as above
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
              {selectedDepartment.name} - Assets
            </h1>
            <p className="text-muted-foreground">
              {selectedDepartment.total_assets} assets
            </p>
          </div>
        </div>

        {selectedDepartment.assets.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200">
            <CardContent className="text-center py-12">
              <Monitor className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
              <p className="text-gray-500">
                Add IT assets to see data here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {selectedDepartment.assets.map((asset, index) => (
              <UserAssetCard key={asset.id} asset={asset} index={index} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default Dashboard;