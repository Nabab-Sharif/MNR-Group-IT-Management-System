import { useEffect, useState } from "react";
import UnitsOfficesManager from "@/components/UnitsOfficesManager";
import dbService from "@/services/dbService";

const Departments = () => {
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const unitsData = await dbService.getUnitStats();
    const departmentStatsData = await dbService.getDepartmentStats();
    setUnits(unitsData);
    setDepartments(departmentStatsData);
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

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
            Departments Management
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage units, offices, and departmental structure
          </p>
        </div>
      </div>

      <UnitsOfficesManager
        units={units}
        departments={departments}
        selectedUnit={selectedUnit}
        selectedDepartment={selectedDepartment}
        onUnitClick={handleUnitClick}
        onDepartmentClick={handleDepartmentClick}
        onBackToUnits={handleBackToUnits}
        onBackToDepartments={handleBackToDepartments}
        onDataChange={loadData}
      />
    </div>
  );
};

export default Departments;