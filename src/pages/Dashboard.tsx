import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [antivirusSearchText, setAntivirusSearchText] = useState("");
  const [antivirusFilterUnit, setAntivirusFilterUnit] = useState("all");
  const [antivirusFilterDevice, setAntivirusFilterDevice] = useState("all");
  const [laptopSearchText, setLaptopSearchText] = useState("");
  const [laptopFilterUnit, setLaptopFilterUnit] = useState("all");
  const [desktopSearchText, setDesktopSearchText] = useState("");
  const [desktopFilterUnit, setDesktopFilterUnit] = useState("all");

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

  // Print HTML generators - must be defined before conditional returns
  const getExpiredAntivirusPrintHTML = () => {
    const allExpiredAssets = [...stats.expiredAntivirusUsers, ...stats.expiredAntivirusAssets];
    const groupedByUnitDept: { [unit: string]: { [dept: string]: any[] } } = {};
    
    allExpiredAssets.forEach(asset => {
      const unit = asset.unit_office || 'Unknown Unit';
      const dept = asset.division || 'Unknown Department';
      if (!groupedByUnitDept[unit]) groupedByUnitDept[unit] = {};
      if (!groupedByUnitDept[unit][dept]) groupedByUnitDept[unit][dept] = [];
      groupedByUnitDept[unit][dept].push(asset);
    });

    let htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Expired Antivirus Licenses - MNR Group IT</title><style>';
    htmlContent += '@page { margin: 0; padding: 0; size: A4; }';
    htmlContent += '* { margin: 0; padding: 0; box-sizing: border-box; }';
    htmlContent += 'body { font-family: "Segoe UI", "Roboto", sans-serif; background: white; color: #1f2937; line-height: 1.5; margin: 0; padding: 0; }';
    htmlContent += '.page { page-break-after: always; padding: 12mm 14mm; background: white; }';
    htmlContent += '.header { text-align: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 4px solid #dc2626; background: linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%); padding: 12px; border-radius: 5px; }';
    htmlContent += 'h1 { font-size: 20px; margin: 0 0 3px 0; color: #dc2626; font-weight: 800; letter-spacing: 0.6px; }';
    htmlContent += '.company-info { font-size: 9px; color: #6b7280; margin-top: 3px; font-weight: 500; }';
    htmlContent += '.stats-bar { display: flex; justify-content: center; gap: 30px; margin-top: 8px; font-size: 8px; }';
    htmlContent += '.stat-value { font-size: 13px; font-weight: 800; color: #dc2626; }';
    htmlContent += '.unit-section { margin-bottom: 16px; page-break-inside: avoid; }';
    htmlContent += '.unit-title { font-size: 12px; font-weight: 800; color: #ffffff; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); margin: 0; padding: 7px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2); margin-bottom: 10px; }';
    htmlContent += '.dept-section { margin-bottom: 12px; }';
    htmlContent += '.dept-title { font-size: 10px; font-weight: 700; color: #dc2626; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #fecaca; }';
    htmlContent += '.assets-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }';
    htmlContent += '.asset-card { padding: 8px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1.5px solid #fca5a5; border-radius: 3px; page-break-inside: avoid; box-shadow: 0 1px 2px rgba(220, 38, 38, 0.08); }';
    htmlContent += '.asset-name { font-weight: 700; margin-bottom: 4px; color: #7f1d1d; font-size: 10px; }';
    htmlContent += '.asset-detail { font-size: 8px; color: #4b5563; line-height: 1.4; }';
    htmlContent += '.asset-detail-row { margin-bottom: 2px; }';
    htmlContent += '.asset-detail label { font-weight: 700; color: #dc2626; display: inline-block; width: 70px; }';
    htmlContent += '.asset-detail-value { color: #1f2937; font-weight: 500; word-break: break-word; }';
    htmlContent += '.divider { height: 0.5px; background: #fecaca; margin: 3px 0; }';
    htmlContent += '@media print { * { margin: 0 !important; padding: 0 !important; } body { margin: 0 !important; padding: 0 !important; background: white; } .page { padding: 12mm 14mm !important; } .assets-grid { grid-template-columns: repeat(3, 1fr) !important; } }';
    htmlContent += '</style></head><body>';
    htmlContent += '<div class="page"><div class="header"><h1>⚠️ Expired Antivirus Licenses</h1><div class="company-info">MNR Group IT Management System</div><div class="stats-bar"><div class="stat">Total: <div class="stat-value">' + allExpiredAssets.length + '</div></div></div></div>';

    Object.entries(groupedByUnitDept).forEach(([unit, depts]) => {
      htmlContent += '<div class="unit-section"><div class="unit-title">📍 ' + unit + '</div>';
      Object.entries(depts).forEach(([dept, assets]) => {
        htmlContent += '<div class="dept-section"><div class="dept-title">▸ ' + dept + '</div><div class="assets-grid">';
        assets.forEach(asset => {
          htmlContent += '<div class="asset-card">';
          htmlContent += '<div class="asset-name">👤 ' + (asset.employee_name || 'N/A') + '</div>';
          htmlContent += '<div class="asset-detail">';
          
          let details = [];
          if (asset.device_type) details.push('<div class="asset-detail-row"><label>Device:</label><span class="asset-detail-value">' + asset.device_type + '</span></div>');
          if (asset.pc_no) details.push('<div class="asset-detail-row"><label>PC:</label><span class="asset-detail-value">' + asset.pc_no + '</span></div>');
          if (asset.ip_no) details.push('<div class="asset-detail-row"><label>IP:</label><span class="asset-detail-value">' + asset.ip_no + '</span></div>');
          if (asset.anydesk_id) details.push('<div class="asset-detail-row"><label>AnyDesk:</label><span class="asset-detail-value">' + asset.anydesk_id + '</span></div>');
          if (asset.ultraview_id) details.push('<div class="asset-detail-row"><label>Ultraview:</label><span class="asset-detail-value">' + asset.ultraview_id + '</span></div>');
          if (asset.phone) details.push('<div class="asset-detail-row"><label>Phone:</label><span class="asset-detail-value">' + asset.phone + '</span></div>');
          if (asset.ip_phone) details.push('<div class="asset-detail-row"><label>IP Phone:</label><span class="asset-detail-value">' + asset.ip_phone + '</span></div>');
          if (asset.email) details.push('<div class="asset-detail-row"><label>Email:</label><span class="asset-detail-value">' + asset.email + '</span></div>');
          if (asset.antivirus_code) details.push('<div class="asset-detail-row"><label>Key:</label><span class="asset-detail-value">' + asset.antivirus_code + '</span></div>');
          if (asset.antivirus_validity) {
            const validityDate = new Date(asset.antivirus_validity);
            details.push('<div class="asset-detail-row"><label>Expired:</label><span class="asset-detail-value" style="color: #dc2626; font-weight: 600;">' + validityDate.toLocaleDateString('en-GB') + '</span></div>');
          }
          
          htmlContent += details.join('');
          htmlContent += '</div></div>';
        });
        htmlContent += '</div></div>';
      });
      htmlContent += '</div>';
    });

    htmlContent += '</div></body></html>';
    return htmlContent;
  };

  const getLaptopPrintHTML = () => {
    // Group laptops by unit/office then by department
    const laptopsByUnitDept: { [unit: string]: { [dept: string]: any[] } } = {};
    laptopUsers.forEach(asset => {
      const unit = asset.unit_office || 'Unknown Unit';
      const dept = asset.division || 'Unknown Department';
      if (!laptopsByUnitDept[unit]) laptopsByUnitDept[unit] = {};
      if (!laptopsByUnitDept[unit][dept]) laptopsByUnitDept[unit][dept] = [];
      laptopsByUnitDept[unit][dept].push(asset);
    });

    let htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laptop Users - MNR Group IT</title><style>';
    htmlContent += '@page { margin: 0; padding: 0; size: A4; }';
    htmlContent += '* { margin: 0; padding: 0; box-sizing: border-box; }';
    htmlContent += 'body { font-family: "Segoe UI", "Roboto", sans-serif; background: white; color: #1f2937; line-height: 1.5; margin: 0; padding: 0; }';
    htmlContent += '.page { page-break-after: always; padding: 12mm 14mm; background: white; }';
    htmlContent += '.header { text-align: center; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 4px solid #7c3aed; background: linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%); padding: 10px; border-radius: 5px; }';
    htmlContent += 'h1 { font-size: 18px; margin: 0 0 3px 0; color: #7c3aed; font-weight: 800; letter-spacing: 0.5px; }';
    htmlContent += '.company-info { font-size: 9px; color: #6b7280; margin-top: 3px; font-weight: 500; }';
    htmlContent += '.stats-bar { display: flex; justify-content: center; gap: 25px; margin-top: 6px; font-size: 8px; }';
    htmlContent += '.stat { text-align: center; }';
    htmlContent += '.stat-value { font-size: 12px; font-weight: 700; color: #7c3aed; }';
    htmlContent += '.unit-section { margin-bottom: 12px; page-break-inside: avoid; }';
    htmlContent += '.unit-title { font-size: 12px; font-weight: 800; color: #ffffff; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); margin: 0; padding: 6px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.15); margin-bottom: 8px; }';
    htmlContent += '.dept-title { font-size: 9px; font-weight: 700; color: #7c3aed; margin: 8px 0 6px 0; padding-bottom: 3px; border-bottom: 2px solid #ede9fe; }';
    htmlContent += '.assets-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }';
    htmlContent += '.asset-card { padding: 6px; background: linear-gradient(135deg, #f8f7ff 0%, #f3e8ff 100%); border: 1.5px solid #d8b4fe; border-radius: 3px; page-break-inside: avoid; box-shadow: 0 1px 2px rgba(124, 58, 237, 0.08); }';
    htmlContent += '.asset-name { font-weight: 700; margin-bottom: 4px; color: #5b21b6; font-size: 9px; }';
    htmlContent += '.asset-detail { font-size: 8px; color: #4b5563; line-height: 1.4; }';
    htmlContent += '.asset-detail-row { margin-bottom: 2px; }';
    htmlContent += '.asset-detail label { font-weight: 700; color: #7c3aed; display: inline-block; width: 60px; }';
    htmlContent += '.asset-detail-value { color: #1f2937; font-weight: 500; word-break: break-word; }';
    htmlContent += '@media print { * { margin: 0 !important; padding: 0 !important; } body { margin: 0 !important; padding: 0 !important; background: white; } .page { padding: 12mm 14mm !important; } .assets-grid { grid-template-columns: repeat(3, 1fr) !important; } }';
    htmlContent += '</style></head><body>';
    htmlContent += '<div class="page"><div class="header"><h1>💻 Laptop Users Report</h1><div class="company-info">MNR Group IT Management System</div><div class="stats-bar"><div class="stat">Total: <div class="stat-value">' + laptopUsers.length + '</div></div></div></div>';

    Object.entries(laptopsByUnitDept).forEach(([unit, depts]) => {
      htmlContent += '<div class="unit-section"><div class="unit-title">📍 ' + unit + '</div>';
      Object.entries(depts).forEach(([dept, assets]) => {
        htmlContent += '<div class="dept-title">▸ ' + dept + '</div><div class="assets-grid">';
        assets.forEach(asset => {
          htmlContent += '<div class="asset-card">';
          htmlContent += '<div class="asset-name">👤 ' + (asset.employee_name || 'N/A') + '</div>';
          htmlContent += '<div class="asset-detail">';
          let details = [];
          if (asset.pc_no) details.push('<div class="asset-detail-row"><label>PC:</label><span class="asset-detail-value">' + asset.pc_no + '</span></div>');
          if (asset.ip_no) details.push('<div class="asset-detail-row"><label>IP:</label><span class="asset-detail-value">' + asset.ip_no + '</span></div>');
          if (asset.anydesk_id) details.push('<div class="asset-detail-row"><label>AnyDesk:</label><span class="asset-detail-value">' + asset.anydesk_id + '</span></div>');
          if (asset.ultraview_id) details.push('<div class="asset-detail-row"><label>Ultraview:</label><span class="asset-detail-value">' + asset.ultraview_id + '</span></div>');
          if (asset.phone) details.push('<div class="asset-detail-row"><label>Phone:</label><span class="asset-detail-value">' + asset.phone + '</span></div>');
          if (asset.ip_phone) details.push('<div class="asset-detail-row"><label>IP Phone:</label><span class="asset-detail-value">' + asset.ip_phone + '</span></div>');
          if (asset.email) details.push('<div class="asset-detail-row"><label>Email:</label><span class="asset-detail-value">' + asset.email + '</span></div>');
          if (asset.email_password) details.push('<div class="asset-detail-row"><label>Pwd:</label><span class="asset-detail-value">' + asset.email_password + '</span></div>');
          if (asset.antivirus_code) details.push('<div class="asset-detail-row"><label>AV Key:</label><span class="asset-detail-value">' + asset.antivirus_code + '</span></div>');
          if (asset.antivirus_validity) {
            const validityDate = new Date(asset.antivirus_validity);
            details.push('<div class="asset-detail-row"><label>Date:</label><span class="asset-detail-value">' + validityDate.toLocaleDateString('en-GB') + '</span></div>');
          }
          htmlContent += details.join('');
          htmlContent += '</div></div>';
        });
        htmlContent += '</div>';
      });
      htmlContent += '</div>';
    });

    htmlContent += '</div></body></html>';
    return htmlContent;
  };

  const getDesktopPrintHTML = () => {
    // Group desktops by unit/office then by department
    const desktopsByUnitDept: { [unit: string]: { [dept: string]: any[] } } = {};
    desktopUsers.forEach(asset => {
      const unit = asset.unit_office || 'Unknown Unit';
      const dept = asset.division || 'Unknown Department';
      if (!desktopsByUnitDept[unit]) desktopsByUnitDept[unit] = {};
      if (!desktopsByUnitDept[unit][dept]) desktopsByUnitDept[unit][dept] = [];
      desktopsByUnitDept[unit][dept].push(asset);
    });

    let htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Desktop Users - MNR Group IT</title><style>';
    htmlContent += '@page { margin: 0; padding: 0; size: A4; }';
    htmlContent += '* { margin: 0; padding: 0; box-sizing: border-box; }';
    htmlContent += 'body { font-family: "Segoe UI", "Roboto", sans-serif; background: white; color: #1f2937; line-height: 1.5; margin: 0; padding: 0; }';
    htmlContent += '.page { page-break-after: always; padding: 12mm 14mm; background: white; }';
    htmlContent += '.header { text-align: center; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 4px solid #059669; background: linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%); padding: 10px; border-radius: 5px; }';
    htmlContent += 'h1 { font-size: 18px; margin: 0 0 3px 0; color: #059669; font-weight: 800; letter-spacing: 0.5px; }';
    htmlContent += '.company-info { font-size: 9px; color: #6b7280; margin-top: 3px; font-weight: 500; }';
    htmlContent += '.stats-bar { display: flex; justify-content: center; gap: 25px; margin-top: 6px; font-size: 8px; }';
    htmlContent += '.stat { text-align: center; }';
    htmlContent += '.stat-value { font-size: 12px; font-weight: 700; color: #059669; }';
    htmlContent += '.unit-section { margin-bottom: 12px; page-break-inside: avoid; }';
    htmlContent += '.unit-title { font-size: 12px; font-weight: 800; color: #ffffff; background: linear-gradient(135deg, #059669 0%, #10b981 100%); margin: 0; padding: 6px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.15); margin-bottom: 8px; }';
    htmlContent += '.dept-title { font-size: 9px; font-weight: 700; color: #059669; margin: 8px 0 6px 0; padding-bottom: 3px; border-bottom: 2px solid #d1fae5; }';
    htmlContent += '.assets-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }';
    htmlContent += '.asset-card { padding: 6px; background: linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%); border: 1.5px solid #86efac; border-radius: 3px; page-break-inside: avoid; box-shadow: 0 1px 2px rgba(5, 150, 105, 0.08); }';
    htmlContent += '.asset-name { font-weight: 700; margin-bottom: 4px; color: #065f46; font-size: 9px; }';
    htmlContent += '.asset-detail { font-size: 8px; color: #4b5563; line-height: 1.4; }';
    htmlContent += '.asset-detail-row { margin-bottom: 2px; }';
    htmlContent += '.asset-detail label { font-weight: 700; color: #059669; display: inline-block; width: 60px; }';
    htmlContent += '.asset-detail-value { color: #1f2937; font-weight: 500; word-break: break-word; }';
    htmlContent += '@media print { * { margin: 0 !important; padding: 0 !important; } body { margin: 0 !important; padding: 0 !important; background: white; } .page { padding: 12mm 14mm !important; } .assets-grid { grid-template-columns: repeat(3, 1fr) !important; } }';
    htmlContent += '</style></head><body>';
    htmlContent += '<div class="page"><div class="header"><h1>🖥️ Desktop Users Report</h1><div class="company-info">MNR Group IT Management System</div><div class="stats-bar"><div class="stat">Total: <div class="stat-value">' + desktopUsers.length + '</div></div></div></div>';

    Object.entries(desktopsByUnitDept).forEach(([unit, depts]) => {
      htmlContent += '<div class="unit-section"><div class="unit-title">📍 ' + unit + '</div>';
      Object.entries(depts).forEach(([dept, assets]) => {
        htmlContent += '<div class="dept-title">▸ ' + dept + '</div><div class="assets-grid">';
        assets.forEach(asset => {
          htmlContent += '<div class="asset-card">';
          htmlContent += '<div class="asset-name">👤 ' + (asset.employee_name || 'N/A') + '</div>';
          htmlContent += '<div class="asset-detail">';
          let details = [];
          if (asset.pc_no) details.push('<div class="asset-detail-row"><label>PC:</label><span class="asset-detail-value">' + asset.pc_no + '</span></div>');
          if (asset.ip_no) details.push('<div class="asset-detail-row"><label>IP:</label><span class="asset-detail-value">' + asset.ip_no + '</span></div>');
          if (asset.anydesk_id) details.push('<div class="asset-detail-row"><label>AnyDesk:</label><span class="asset-detail-value">' + asset.anydesk_id + '</span></div>');
          if (asset.ultraview_id) details.push('<div class="asset-detail-row"><label>Ultraview:</label><span class="asset-detail-value">' + asset.ultraview_id + '</span></div>');
          if (asset.phone) details.push('<div class="asset-detail-row"><label>Phone:</label><span class="asset-detail-value">' + asset.phone + '</span></div>');
          if (asset.ip_phone) details.push('<div class="asset-detail-row"><label>IP Phone:</label><span class="asset-detail-value">' + asset.ip_phone + '</span></div>');
          if (asset.email) details.push('<div class="asset-detail-row"><label>Email:</label><span class="asset-detail-value">' + asset.email + '</span></div>');
          if (asset.email_password) details.push('<div class="asset-detail-row"><label>Pwd:</label><span class="asset-detail-value">' + asset.email_password + '</span></div>');
          if (asset.antivirus_code) details.push('<div class="asset-detail-row"><label>AV Key:</label><span class="asset-detail-value">' + asset.antivirus_code + '</span></div>');
          if (asset.antivirus_validity) {
            const validityDate = new Date(asset.antivirus_validity);
            details.push('<div class="asset-detail-row"><label>Date:</label><span class="asset-detail-value">' + validityDate.toLocaleDateString('en-GB') + '</span></div>');
          }
          htmlContent += details.join('');
          htmlContent += '</div></div>';
        });
        htmlContent += '</div>';
      });
      htmlContent += '</div>';
    });

    htmlContent += '</div></body></html>';
    return htmlContent;
  };

  // Laptops View
  if (viewLaptops) {
    // Group laptops by unit/office then by department
    const laptopsByUnitDept: { [unit: string]: { [dept: string]: any[] } } = {};
    laptopUsers.forEach(asset => {
      const unit = asset.unit_office || 'Unknown Unit';
      const dept = asset.division || 'Unknown Department';
      if (!laptopsByUnitDept[unit]) laptopsByUnitDept[unit] = {};
      if (!laptopsByUnitDept[unit][dept]) laptopsByUnitDept[unit][dept] = [];
      laptopsByUnitDept[unit][dept].push(asset);
    });

    // Apply filters
    const filteredLaptopsByUnitDept: { [unit: string]: { [dept: string]: any[] } } = {};
    Object.entries(laptopsByUnitDept).forEach(([unit, depts]) => {
      if (laptopFilterUnit !== "all" && unit !== laptopFilterUnit) return;
      
      const filteredDepts: { [dept: string]: any[] } = {};
      Object.entries(depts).forEach(([dept, assets]) => {
        const filtered = assets.filter(asset => {
          const matchesSearch = !laptopSearchText || 
            (asset.employee_name?.toLowerCase().includes(laptopSearchText.toLowerCase())) ||
            (asset.email?.toLowerCase().includes(laptopSearchText.toLowerCase())) ||
            (asset.ip_no?.includes(laptopSearchText)) ||
            (asset.designation?.toLowerCase().includes(laptopSearchText.toLowerCase()));
          return matchesSearch;
        });
        if (filtered.length > 0) filteredDepts[dept] = filtered;
      });
      if (Object.keys(filteredDepts).length > 0) filteredLaptopsByUnitDept[unit] = filteredDepts;
    });

    const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: `${label}` });
    };

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={handleBackFromLaptops}
              className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-purple-600">Laptop Users</h1>
            <p className="text-muted-foreground">
              Total: {laptopUsers.length} laptop users
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              try {
                const htmlContent = getLaptopPrintHTML();
                console.log('HTML Content Length:', htmlContent.length);
                console.log('Laptop Users Count:', laptopUsers.length);
                
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const printWindow = window.open(url, '_blank', 'width=1000,height=600');
                
                if (printWindow) {
                  setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                  }, 800);
                } else {
                  toast({
                    title: "Error",
                    description: "Print window blocked. Please allow pop-ups.",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error('Print Error:', error);
                toast({
                  title: "Error",
                  description: "Failed to generate print document",
                  variant: "destructive",
                });
              }
            }}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 no-print"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Search and Filter Section */}
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold text-purple-700 mb-2 block">Search</Label>
                <input
                  type="text"
                  placeholder="Name, email, IP..."
                  value={laptopSearchText}
                  onChange={(e) => setLaptopSearchText(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-purple-700 mb-2 block">Unit/Office</Label>
                <select
                  value={laptopFilterUnit}
                  onChange={(e) => setLaptopFilterUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                >
                  <option value="all">All Units</option>
                  {Object.keys(laptopsByUnitDept).sort().map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setLaptopSearchText("");
                    setLaptopFilterUnit("all");
                  }}
                  variant="outline"
                  className="w-full border-purple-300"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units and Departments */}
        <div className="space-y-8">
          {Object.entries(filteredLaptopsByUnitDept).map(([unit, deptMap]) => (
            <div key={unit}>
              <h3 className="text-2xl font-bold text-purple-700 mb-4 pb-2 border-b-2 border-purple-300">{unit}</h3>
              {Object.entries(deptMap).map(([dept, assets]) => (
                <div key={dept} className="mb-6">
                  <h4 className="text-lg font-semibold text-purple-600 mb-3 ml-2">{dept}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {assets.map((item) => (
                      <div key={item.id} className="group relative bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all"></div>
                        <div className="relative p-3">
                          {/* Header */}
                          <div className="mb-2 pb-2 border-b border-purple-200">
                            <div className="font-bold text-purple-900 text-xs line-clamp-1">{item.employee_name}</div>
                            <div className="text-xs text-gray-600 line-clamp-1">{item.designation}</div>
                          </div>
                          
                          {/* Info Items */}
                          <div className="space-y-1 text-xs">
                            {item.pc_no && (
                              <button onClick={() => copyToClipboard(item.pc_no, 'PC No')} 
                                className="w-full text-left px-1.5 py-1 bg-purple-100 hover:bg-purple-200 rounded border border-purple-300 transition-colors font-medium text-purple-700 truncate text-xs">
                                PC: {item.pc_no}
                              </button>
                            )}
                            {item.ip_no && (
                              <button onClick={() => copyToClipboard(item.ip_no, 'IP')} 
                                className="w-full text-left px-1.5 py-1 bg-blue-100 hover:bg-blue-200 rounded border border-blue-300 transition-colors font-medium text-blue-700 truncate text-xs">
                                IP: {item.ip_no}
                              </button>
                            )}
                            {item.ip_phone && (
                              <button onClick={() => copyToClipboard(item.ip_phone, 'IP Phone')} 
                                className="w-full text-left px-1.5 py-1 bg-cyan-100 hover:bg-cyan-200 rounded border border-cyan-300 transition-colors font-medium text-cyan-700 truncate text-xs">
                                IPTel: {item.ip_phone}
                              </button>
                            )}
                            {item.phone_no && (
                              <button onClick={() => copyToClipboard(item.phone_no, 'Phone')} 
                                className="w-full text-left px-1.5 py-1 bg-rose-100 hover:bg-rose-200 rounded border border-rose-300 transition-colors font-medium text-rose-700 truncate text-xs">
                                Tel: {item.phone_no}
                              </button>
                            )}
                            {item.mobile && (
                              <button onClick={() => copyToClipboard(item.mobile, 'Mobile')} 
                                className="w-full text-left px-1.5 py-1 bg-pink-100 hover:bg-pink-200 rounded border border-pink-300 transition-colors font-medium text-pink-700 truncate text-xs">
                                Mob: {item.mobile}
                              </button>
                            )}
                            {item.email && (
                              <button onClick={() => window.location.href = `mailto:${item.email}`} 
                                className="w-full text-left px-1.5 py-1 bg-green-100 hover:bg-green-200 rounded border border-green-300 transition-colors font-medium text-green-700 truncate text-xs">
                                Email: {item.email}
                              </button>
                            )}
                            {item.anydesk_id && (
                              <button onClick={() => { copyToClipboard(item.anydesk_id, 'AnyDesk'); window.location.href = `anydesk://connect=${item.anydesk_id}`; }} 
                                className="w-full text-left px-1.5 py-1 bg-orange-100 hover:bg-orange-200 rounded border border-orange-300 transition-colors font-medium text-orange-700 truncate text-xs">
                                AnyDesk: {item.anydesk_id}
                              </button>
                            )}
                            {item.ultraview_id && (
                              <button onClick={() => copyToClipboard(item.ultraview_id, 'UltraView')} 
                                className="w-full text-left px-1.5 py-1 bg-indigo-100 hover:bg-indigo-200 rounded border border-indigo-300 transition-colors font-medium text-indigo-700 truncate text-xs">
                                UV: {item.ultraview_id}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktops View
  if (viewDesktops) {
    // Group desktops by unit/office then by department
    const desktopsByUnitDept: { [unit: string]: { [dept: string]: any[] } } = {};
    desktopUsers.forEach(asset => {
      const unit = asset.unit_office || 'Unknown Unit';
      const dept = asset.division || 'Unknown Department';
      if (!desktopsByUnitDept[unit]) desktopsByUnitDept[unit] = {};
      if (!desktopsByUnitDept[unit][dept]) desktopsByUnitDept[unit][dept] = [];
      desktopsByUnitDept[unit][dept].push(asset);
    });

    // Apply filters
    const filteredDesktopsByUnitDept: { [unit: string]: { [dept: string]: any[] } } = {};
    Object.entries(desktopsByUnitDept).forEach(([unit, depts]) => {
      if (desktopFilterUnit !== "all" && unit !== desktopFilterUnit) return;
      
      const filteredDepts: { [dept: string]: any[] } = {};
      Object.entries(depts).forEach(([dept, assets]) => {
        const filtered = assets.filter(asset => {
          const matchesSearch = !desktopSearchText || 
            (asset.employee_name?.toLowerCase().includes(desktopSearchText.toLowerCase())) ||
            (asset.email?.toLowerCase().includes(desktopSearchText.toLowerCase())) ||
            (asset.ip_no?.includes(desktopSearchText)) ||
            (asset.designation?.toLowerCase().includes(desktopSearchText.toLowerCase()));
          return matchesSearch;
        });
        if (filtered.length > 0) filteredDepts[dept] = filtered;
      });
      if (Object.keys(filteredDepts).length > 0) filteredDesktopsByUnitDept[unit] = filteredDepts;
    });

    const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: `${label}` });
    };

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={handleBackFromDesktops}
              className="mb-4 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-emerald-600">Desktop Users</h1>
            <p className="text-muted-foreground">
              Total: {desktopUsers.length} desktop users
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              try {
                const htmlContent = getDesktopPrintHTML();
                console.log('HTML Content Length:', htmlContent.length);
                console.log('Desktop Users Count:', desktopUsers.length);
                
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const printWindow = window.open(url, '_blank', 'width=1000,height=600');
                
                if (printWindow) {
                  setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                  }, 800);
                } else {
                  toast({
                    title: "Error",
                    description: "Print window blocked. Please allow pop-ups.",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error('Print Error:', error);
                toast({
                  title: "Error",
                  description: "Failed to generate print document",
                  variant: "destructive",
                });
              }
            }}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 no-print"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Search and Filter Section */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold text-emerald-700 mb-2 block">Search</Label>
                <input
                  type="text"
                  placeholder="Name, email, IP..."
                  value={desktopSearchText}
                  onChange={(e) => setDesktopSearchText(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-emerald-700 mb-2 block">Unit/Office</Label>
                <select
                  value={desktopFilterUnit}
                  onChange={(e) => setDesktopFilterUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg"
                >
                  <option value="all">All Units</option>
                  {Object.keys(desktopsByUnitDept).sort().map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setDesktopSearchText("");
                    setDesktopFilterUnit("all");
                  }}
                  variant="outline"
                  className="w-full border-emerald-300"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units and Departments */}
        <div className="space-y-8">
          {Object.entries(filteredDesktopsByUnitDept).map(([unit, deptMap]) => (
            <div key={unit}>
              <h3 className="text-2xl font-bold text-emerald-700 mb-4 pb-2 border-b-2 border-emerald-300">{unit}</h3>
              {Object.entries(deptMap).map(([dept, assets]) => (
                <div key={dept} className="mb-6">
                  <h4 className="text-lg font-semibold text-emerald-600 mb-3 ml-2">{dept}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {assets.map((item) => (
                      <div key={item.id} className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg hover:border-emerald-400 hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all"></div>
                        <div className="relative p-3">
                          {/* Header */}
                          <div className="mb-2 pb-2 border-b border-emerald-200">
                            <div className="font-bold text-emerald-900 text-xs line-clamp-1">{item.employee_name}</div>
                            <div className="text-xs text-gray-600 line-clamp-1">{item.designation}</div>
                          </div>
                          
                          {/* Info Items */}
                          <div className="space-y-1 text-xs">
                            {item.pc_no && (
                              <button onClick={() => copyToClipboard(item.pc_no, 'PC No')} 
                                className="w-full text-left px-1.5 py-1 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-colors font-medium text-emerald-700 truncate text-xs">
                                PC: {item.pc_no}
                              </button>
                            )}
                            {item.ip_no && (
                              <button onClick={() => copyToClipboard(item.ip_no, 'IP')} 
                                className="w-full text-left px-1.5 py-1 bg-blue-100 hover:bg-blue-200 rounded border border-blue-300 transition-colors font-medium text-blue-700 truncate text-xs">
                                IP: {item.ip_no}
                              </button>
                            )}
                            {item.ip_phone && (
                              <button onClick={() => copyToClipboard(item.ip_phone, 'IP Phone')} 
                                className="w-full text-left px-1.5 py-1 bg-cyan-100 hover:bg-cyan-200 rounded border border-cyan-300 transition-colors font-medium text-cyan-700 truncate text-xs">
                                IPTel: {item.ip_phone}
                              </button>
                            )}
                            {item.phone_no && (
                              <button onClick={() => copyToClipboard(item.phone_no, 'Phone')} 
                                className="w-full text-left px-1.5 py-1 bg-rose-100 hover:bg-rose-200 rounded border border-rose-300 transition-colors font-medium text-rose-700 truncate text-xs">
                                Tel: {item.phone_no}
                              </button>
                            )}
                            {item.mobile && (
                              <button onClick={() => copyToClipboard(item.mobile, 'Mobile')} 
                                className="w-full text-left px-1.5 py-1 bg-pink-100 hover:bg-pink-200 rounded border border-pink-300 transition-colors font-medium text-pink-700 truncate text-xs">
                                Mob: {item.mobile}
                              </button>
                            )}
                            {item.email && (
                              <button onClick={() => window.location.href = `mailto:${item.email}`} 
                                className="w-full text-left px-1.5 py-1 bg-green-100 hover:bg-green-200 rounded border border-green-300 transition-colors font-medium text-green-700 truncate text-xs">
                                Email: {item.email}
                              </button>
                            )}
                            {item.anydesk_id && (
                              <button onClick={() => { copyToClipboard(item.anydesk_id, 'AnyDesk'); window.location.href = `anydesk://connect=${item.anydesk_id}`; }} 
                                className="w-full text-left px-1.5 py-1 bg-orange-100 hover:bg-orange-200 rounded border border-orange-300 transition-colors font-medium text-orange-700 truncate text-xs">
                                AnyDesk: {item.anydesk_id}
                              </button>
                            )}
                            {item.ultraview_id && (
                              <button onClick={() => copyToClipboard(item.ultraview_id, 'UltraView')} 
                                className="w-full text-left px-1.5 py-1 bg-teal-100 hover:bg-teal-200 rounded border border-teal-300 transition-colors font-medium text-teal-700 truncate text-xs">
                                UV: {item.ultraview_id}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
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

    // Filter logic
    let filteredByUnitAndDept = expiredByUnitAndDept;
    if (antivirusFilterUnit !== "all") {
      filteredByUnitAndDept = {
        [antivirusFilterUnit]: expiredByUnitAndDept[antivirusFilterUnit]
      };
    }

    // Apply device type filter
    if (antivirusFilterDevice !== "all") {
      Object.keys(filteredByUnitAndDept).forEach(unit => {
        Object.keys(filteredByUnitAndDept[unit]).forEach(dept => {
          filteredByUnitAndDept[unit][dept] = filteredByUnitAndDept[unit][dept].filter(asset =>
            asset.device_type?.toLowerCase() === antivirusFilterDevice.toLowerCase()
          );
        });
      });
    }

    // Apply search filter to all assets
    if (antivirusSearchText) {
      const searchLower = antivirusSearchText.toLowerCase();
      Object.keys(filteredByUnitAndDept).forEach(unit => {
        Object.keys(filteredByUnitAndDept[unit]).forEach(dept => {
          filteredByUnitAndDept[unit][dept] = filteredByUnitAndDept[unit][dept].filter(asset =>
            asset.employee_name?.toLowerCase().includes(searchLower) ||
            asset.email?.toLowerCase().includes(searchLower) ||
            asset.ip_no?.toLowerCase().includes(searchLower) ||
            asset.anydesk_id?.toLowerCase().includes(searchLower)
          );
        });
      });
    }

    const totalExpired = stats.expiredAntivirusAssets.length;
    const filteredCount = Object.values(filteredByUnitAndDept).reduce((sum, depts) => 
      sum + Object.values(depts).reduce((s, assets) => s + assets.length, 0), 0
    );

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-red-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <style>{`
          .card-3d {
            transition: all 0.3s ease;
          }
          .card-3d:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(220, 38, 38, 0.15);
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
            onClick={() => {
              try {
                const htmlContent = getExpiredAntivirusPrintHTML();
                console.log('Expired Antivirus HTML Content Length:', htmlContent.length);
                
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const printWindow = window.open(url, '_blank', 'width=1000,height=600');
                
                if (printWindow) {
                  setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                  }, 800);
                } else {
                  toast({
                    title: "Error",
                    description: "Print window blocked. Please allow pop-ups.",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error('Print Error:', error);
                toast({
                  title: "Error",
                  description: "Failed to generate print document",
                  variant: "destructive",
                });
              }
            }}
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

        {/* Search and Filter Section */}
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="antivirus-search" className="text-sm font-semibold text-red-700 mb-2 block">
                  Search by Name, Email, IP
                </Label>
                <input
                  id="antivirus-search"
                  type="text"
                  placeholder="Search..."
                  value={antivirusSearchText}
                  onChange={(e) => setAntivirusSearchText(e.target.value)}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <Label htmlFor="antivirus-unit" className="text-sm font-semibold text-red-700 mb-2 block">
                  Unit/Office
                </Label>
                <select
                  id="antivirus-unit"
                  value={antivirusFilterUnit}
                  onChange={(e) => setAntivirusFilterUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Units</option>
                  {Object.keys(expiredByUnitAndDept).sort().map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="antivirus-device" className="text-sm font-semibold text-red-700 mb-2 block">
                  Device Type
                </Label>
                <select
                  id="antivirus-device"
                  value={antivirusFilterDevice}
                  onChange={(e) => setAntivirusFilterDevice(e.target.value)}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Devices</option>
                  <option value="laptop">Laptop</option>
                  <option value="desktop">Desktop</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setAntivirusSearchText("");
                    setAntivirusFilterUnit("all");
                    setAntivirusFilterDevice("all");
                  }}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-100"
                >
                  Clear
                </Button>
              </div>
            </div>
            {(antivirusSearchText || antivirusFilterUnit !== "all" || antivirusFilterDevice !== "all") && (
              <div className="mt-3 text-sm text-red-700 bg-white/50 p-2 rounded">
                Showing {filteredCount} of {totalExpired} devices
              </div>
            )}
          </CardContent>
        </Card>

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
            Object.entries(filteredByUnitAndDept).map(([unit, deptMap]: [string, any]) => (
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
                              <div className="text-xs text-gray-600 mb-3">
                                {asset.designation || 'N/A'}
                              </div>

                              <div className="space-y-2">
                                {/* IP Address - Opens TightVNC Desktop App with Auto IP */}
                                {asset.ip_no && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(asset.ip_no);
                                      // Try multiple protocol handlers for TightVNC
                                      try {
                                        // Method 1: tvnc:// protocol
                                        const iframe = document.createElement('iframe');
                                        iframe.style.display = 'none';
                                        iframe.src = `tvnc://${asset.ip_no}:5900`;
                                        document.body.appendChild(iframe);
                                        setTimeout(() => document.body.removeChild(iframe), 1000);
                                        
                                        // Method 2: Fallback - try vnc:// protocol
                                        setTimeout(() => {
                                          const iframe2 = document.createElement('iframe');
                                          iframe2.style.display = 'none';
                                          iframe2.src = `vnc://${asset.ip_no}:5900`;
                                          document.body.appendChild(iframe2);
                                          setTimeout(() => document.body.removeChild(iframe2), 1000);
                                        }, 500);
                                      } catch (e) {
                                        console.log('Protocol handler error:', e);
                                      }
                                      toast({ title: 'TightVNC Opening', description: `IP ${asset.ip_no} - auto-filling and copied to clipboard` });
                                    }}
                                    className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 hover:border-blue-400 transition text-xs cursor-pointer"
                                    title="Click to open TightVNC with auto IP"
                                  >
                                    <div className="font-semibold text-blue-700">🌐 IP Address</div>
                                    <div className="text-blue-600 font-mono break-all">{asset.ip_no}</div>
                                  </button>
                                )}

                                {/* AnyDesk - Opens AnyDesk Desktop App with Auto ID */}
                                {asset.anydesk_id && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(asset.anydesk_id);
                                      // Try multiple ways to open AnyDesk with auto-connect
                                      try {
                                        // Method 1: anydesk://connect= protocol
                                        const iframe = document.createElement('iframe');
                                        iframe.style.display = 'none';
                                        iframe.src = `anydesk://connect=${asset.anydesk_id}`;
                                        document.body.appendChild(iframe);
                                        setTimeout(() => document.body.removeChild(iframe), 1000);
                                        
                                        // Method 2: Fallback - try direct app open
                                        setTimeout(() => {
                                          const iframe2 = document.createElement('iframe');
                                          iframe2.style.display = 'none';
                                          iframe2.src = 'anydesk://';
                                          document.body.appendChild(iframe2);
                                          setTimeout(() => document.body.removeChild(iframe2), 1000);
                                        }, 800);
                                      } catch (e) {
                                        console.log('Protocol handler error:', e);
                                      }
                                      toast({ title: 'AnyDesk Opening', description: `ID ${asset.anydesk_id} - auto-connecting and copied to clipboard` });
                                    }}
                                    className="w-full text-left p-2 bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 hover:border-orange-400 transition text-xs cursor-pointer"
                                    title="Click to open AnyDesk with auto ID"
                                  >
                                    <div className="font-semibold text-orange-700">🔴 AnyDesk ID</div>
                                    <div className="text-orange-600 font-mono break-all">{asset.anydesk_id}</div>
                                  </button>
                                )}

                                {/* Full Email - Click to Open Email Client */}
                                {asset.email && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(asset.email);
                                      // Try to open email client
                                      try {
                                        const mailLink = document.createElement('a');
                                        mailLink.href = `mailto:${asset.email}`;
                                        document.body.appendChild(mailLink);
                                        mailLink.click();
                                        document.body.removeChild(mailLink);
                                      } catch (e) {
                                        console.log('Email client error:', e);
                                      }
                                      toast({ title: 'Email Opening', description: `${asset.email} - copied and opening email client` });
                                    }}
                                    className="w-full text-left p-2 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 hover:border-purple-400 transition text-xs cursor-pointer"
                                    title="Click to open email client"
                                  >
                                    <div className="font-semibold text-purple-700">✉️ Email</div>
                                    <div className="text-purple-600 font-mono break-all">{asset.email}</div>
                                  </button>
                                )}

                                {/* Other Contact Info */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {asset.ip_phone && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(asset.ip_phone);
                                        toast({ title: 'IP Phone Copied', description: `${asset.ip_phone}` });
                                      }}
                                      className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-400 transition text-left cursor-pointer"
                                      title="Click to copy IP Phone"
                                    >
                                      <div className="font-semibold text-gray-700">☎️ IP Phone</div>
                                      <div className="text-gray-600 font-mono">{asset.ip_phone}</div>
                                    </button>
                                  )}
                                  {asset.mobile && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(asset.mobile);
                                        toast({ title: 'Mobile Copied', description: `${asset.mobile}` });
                                      }}
                                      className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-400 transition text-left cursor-pointer"
                                      title="Click to copy mobile number"
                                    >
                                      <div className="font-semibold text-gray-700">📱 Mobile</div>
                                      <div className="text-gray-600 font-mono">{asset.mobile}</div>
                                    </button>
                                  )}
                                  {asset.phone_no && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(asset.phone_no);
                                        toast({ title: 'Phone Copied', description: `${asset.phone_no}` });
                                      }}
                                      className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-400 transition text-left cursor-pointer"
                                      title="Click to copy phone number"
                                    >
                                      <div className="font-semibold text-gray-700">📞 Phone</div>
                                      <div className="text-gray-600 font-mono">{asset.phone_no}</div>
                                    </button>
                                  )}
                                  {asset.ultraview_id && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(asset.ultraview_id);
                                        toast({ title: 'Ultraview ID Copied', description: `${asset.ultraview_id}` });
                                      }}
                                      className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-400 transition text-left cursor-pointer"
                                      title="Click to copy Ultraview ID"
                                    >
                                      <div className="font-semibold text-gray-700">👁️ Ultraview</div>
                                      <div className="text-gray-600 font-mono">{asset.ultraview_id}</div>
                                    </button>
                                  )}
                                  {asset.antivirus_code && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(asset.antivirus_code);
                                        toast({ title: 'Antivirus Key Copied', description: `${asset.antivirus_code}` });
                                      }}
                                      className="p-2 bg-red-50 rounded border border-red-200 hover:bg-red-100 hover:border-red-400 transition col-span-2 text-left cursor-pointer"
                                      title="Click to copy antivirus key"
                                    >
                                      <div className="font-semibold text-red-700">🔐 AV Code</div>
                                      <div className="text-red-600 font-mono font-bold">{asset.antivirus_code}</div>
                                    </button>
                                  )}
                                </div>
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