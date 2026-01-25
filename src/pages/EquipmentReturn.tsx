import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Printer,
  Plus,
  Trash2,
} from "lucide-react";
import dbService from "@/services/dbService";

const EquipmentReturn = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [returnItems, setReturnItems] = useState([]);

  const [formData, setFormData] = useState({
    department: "",
    submitted_by: "",
    designation: "",
    phone: "",
    date: new Date().toISOString().split('T')[0],
    received_by: "",
    receiving_designation: "",
    receiving_date: new Date().toISOString().split('T')[0],
  });

  const [currentItem, setCurrentItem] = useState({
    equipment_name: "",
    model: "",
    serial_number: "",
    condition: "Good",
    exchange_reason: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usersData = await dbService.getUsers();
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    }
  };

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id.toString() === userId);
    if (user) {
      setSelectedUser(user);
      setFormData({
        ...formData,
        department: user.division || "",
        submitted_by: user.name || "",
        designation: user.designation || "",
        phone: user.mobile || "",
      });
    }
  };

  const handleAddItem = () => {
    if (!currentItem.equipment_name) {
      toast({
        title: "Error",
        description: "Please enter equipment name",
        variant: "destructive"
      });
      return;
    }

    setReturnItems([...returnItems, { ...currentItem, id: Date.now() }]);
    setCurrentItem({
      equipment_name: "",
      model: "",
      serial_number: "",
      condition: "Good",
      exchange_reason: "",
    });

    toast({
      title: "Item added",
      description: "Equipment item has been added to the form",
    });
  };

  const handleRemoveItem = (id) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
    toast({
      title: "Item removed",
      description: "Equipment item has been removed",
    });
  };

  const handlePrint = () => {
    try {
      // Get items up to 3 rows
      const itemsHTML = returnItems.slice(0, 3).map((item, index) => `
        <tr>
          <td style="border: 1px solid #333; padding: 12px; text-align: center; height: 50px; font-size: 11px;">${index + 1}</td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px; font-size: 11px;">${item.equipment_name || ''}</td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px; font-size: 11px;">${item.model || ''}</td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px; font-size: 11px;">${item.serial_number || ''}</td>
          <td style="border: 1px solid #333; padding: 12px; text-align: center; height: 50px; font-size: 11px;">${item.condition || ''}</td>
          <td style="border: 1px solid #333; padding: 12px; text-align: center; height: 50px; font-size: 11px;">${new Date(formData.date).toLocaleDateString('en-GB')}</td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px; font-size: 11px;">${item.exchange_reason || ''}</td>
        </tr>
      `).join('');

      // Add empty rows to make 3 total
      const emptyRows = Math.max(0, 3 - returnItems.length);
      const emptyRowsHTML = Array(emptyRows).fill(0).map(() => `
        <tr>
          <td style="border: 1px solid #333; padding: 12px; height: 50px;"></td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px;"></td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px;"></td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px;"></td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px;"></td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px;"></td>
          <td style="border: 1px solid #333; padding: 12px; height: 50px;"></td>
        </tr>
      `).join('');

      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>IT Equipment Disposal Return Form</title>
          <style>
            * {
              margin: 0;
              padding: 0;
            }
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #000;
            }
            .container {
              width: 100%;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 12px;
            }
            .header-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #000;
            }
            .header-subtitle {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              color: #1a1a1a;
              margin-top: 15px;
              margin-bottom: 8px;
              padding: 6px 8px;
              background-color: #e0e7ff;
              border-left: 3px solid #4f46e5;
            }
            .equipment-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 11px;
            }
            .equipment-table th {
              border: 1px solid #333;
              padding: 12px;
              text-align: left;
              background-color: #e0e7ff;
              font-weight: bold;
              height: 35px;
              font-size: 11px;
            }
            .equipment-table td {
              border: 1px solid #333;
              padding: 12px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 10px;
            }
            .info-table tr {
              height: 28px;
            }
            .info-table td {
              padding: 6px 10px;
              border-bottom: 1px solid #ccc;
            }
            .info-label {
              font-weight: bold;
              color: #000;
              width: 35%;
              border-right: 1px solid #ccc;
              padding-right: 15px;
            }
            .info-value {
              border-bottom: 1px dotted #333;
              padding-left: 15px;
              font-size: 10px;
            }
            .signature-space {
              height: 40px;
            }
            .footer {
              text-align: center;
              font-size: 9px;
              color: #666;
              margin-top: 15px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-title">MNR Sweaters Ltd.</div>
              <div class="header-subtitle">IT Equipment Disposal Return Form</div>
            </div>

            <div class="section-title">📋 Equipment Information:</div>
            <table class="equipment-table">
              <thead>
                <tr>
                  <th style="width: 8%;">Sl. No.</th>
                  <th style="width: 18%;">Equipment Name</th>
                  <th style="width: 15%;">Brand/Model</th>
                  <th style="width: 12%;">Serial Number</th>
                  <th style="width: 15%;">Condition (Working/Not Working)</th>
                  <th style="width: 12%;">Return Date</th>
                  <th style="width: 20%;">Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}${emptyRowsHTML}
              </tbody>
            </table>

            <div class="section-title">👤 Department Submitting the Equipment:</div>
            <table class="info-table">
              <tr>
                <td class="info-label">Department Name</td>
                <td class="info-value">${formData.department || '___________________________'}</td>
              </tr>
              <tr>
                <td class="info-label">Submitted By</td>
                <td class="info-value">${formData.submitted_by || '___________________________'}</td>
              </tr>
              <tr>
                <td class="info-label">Designation</td>
                <td class="info-value">${formData.designation || '___________________________'}</td>
              </tr>
              <tr>
                <td class="info-label">Mobile/Extension</td>
                <td class="info-value">${formData.phone || '___________________________'}</td>
              </tr>
              <tr>
                <td class="info-label">Signature</td>
                <td class="info-value signature-space"></td>
              </tr>
              <tr>
                <td class="info-label">Date</td>
                <td class="info-value">${new Date(formData.date).toLocaleDateString('en-GB')}</td>
              </tr>
            </table>

            <div class="section-title">👨‍💼 IT Department Receiving Section:</div>
            <table class="info-table">
              <tr>
                <td class="info-label">Received By</td>
                <td class="info-value">${formData.received_by || '___________________________'}</td>
              </tr>
              <tr>
                <td class="info-label">Designation</td>
                <td class="info-value">${formData.receiving_designation || '___________________________'}</td>
              </tr>
              <tr>
                <td class="info-label">Receiving Date</td>
                <td class="info-value">${new Date(formData.receiving_date).toLocaleDateString('en-GB')}</td>
              </tr>
              <tr>
                <td class="info-label">Signature & Seal</td>
                <td class="info-value signature-space"></td>
              </tr>
            </table>

            <div class="footer">
              <p>Generated by MNR Group IT Management System | ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank", "width=950,height=1200");
      
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Print window could not be opened. Please check your popup blocker settings.",
          variant: "destructive"
        });
        return;
      }
      
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
      
      toast({
        title: "Print dialog opened",
        description: "Please complete the print process in the new window.",
      });
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: "Error",
        description: "Failed to open print dialog",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Return Form</h1>
          <p className="text-gray-600">Create and print equipment disposal forms with auto-populated data</p>
        </div>

        {/* User Selection */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <Label htmlFor="user" className="text-base font-semibold mb-3 block">Select Employee</Label>
            <Select onValueChange={handleUserSelect}>
              <SelectTrigger id="user" className="w-full">
                <SelectValue placeholder="Select an employee - department info will auto-fill" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name} ({user.division})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Department Form */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Department Information (Auto-filled from Profile)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Department Name</Label>
                <Input value={formData.department} readOnly className="bg-gray-100 mt-1" />
              </div>
              <div>
                <Label className="font-semibold">Submitted By (Name)</Label>
                <Input value={formData.submitted_by} readOnly className="bg-gray-100 mt-1" />
              </div>
              <div>
                <Label className="font-semibold">Designation</Label>
                <Input value={formData.designation} readOnly className="bg-gray-100 mt-1" />
              </div>
              <div>
                <Label className="font-semibold">Phone Number</Label>
                <Input value={formData.phone} readOnly className="bg-gray-100 mt-1" />
              </div>
              <div>
                <Label className="font-semibold">Date</Label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Items */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Equipment Information</h2>
            
            {/* Add New Item */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">Add Equipment Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Equipment Name *"
                  value={currentItem.equipment_name}
                  onChange={(e) => setCurrentItem({ ...currentItem, equipment_name: e.target.value })}
                />
                <Input
                  placeholder="Model"
                  value={currentItem.model}
                  onChange={(e) => setCurrentItem({ ...currentItem, model: e.target.value })}
                />
                <Input
                  placeholder="Serial Number"
                  value={currentItem.serial_number}
                  onChange={(e) => setCurrentItem({ ...currentItem, serial_number: e.target.value })}
                />
                <Select value={currentItem.condition} onValueChange={(value) => setCurrentItem({ ...currentItem, condition: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good (Working)</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Not Working">Not Working</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4">
                <Textarea
                  placeholder="Exchange Reason / Remarks"
                  value={currentItem.exchange_reason}
                  onChange={(e) => setCurrentItem({ ...currentItem, exchange_reason: e.target.value })}
                  className="min-h-20"
                />
              </div>
              <Button
                onClick={handleAddItem}
                className="mt-4 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment Item
              </Button>
            </div>

            {/* Items List */}
            {returnItems.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4">Items to Return ({returnItems.length})</h3>
                <div className="space-y-2">
                  {returnItems.map((item, index) => (
                    <div key={item.id} className="flex items-start justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">{index + 1}. {item.equipment_name}</p>
                        <p className="text-sm text-gray-600">Model: {item.model} | Serial: {item.serial_number} | Condition: {item.condition}</p>
                        <p className="text-sm text-gray-600">Remarks: {item.exchange_reason || 'None'}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IT Department Section */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">IT Department Receiving Section</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Received By"
                value={formData.received_by}
                onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
              />
              <Input
                placeholder="Designation"
                value={formData.receiving_designation}
                onChange={(e) => setFormData({ ...formData, receiving_designation: e.target.value })}
              />
              <Input
                type="date"
                value={formData.receiving_date}
                onChange={(e) => setFormData({ ...formData, receiving_date: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Print Button */}
        <div className="flex gap-4">
          <Button
            onClick={handlePrint}
            disabled={returnItems.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white gap-2 text-lg px-8 py-6"
          >
            <Printer className="w-5 h-5" />
            Print A4 Form
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentReturn;
