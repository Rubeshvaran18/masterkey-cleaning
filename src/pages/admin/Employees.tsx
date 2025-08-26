import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddEmployeeModal } from "@/components/modals/AddEmployeeModal";
import { EditEmployeeModal } from "@/components/modals/EditEmployeeModal";
import { EmployeeProfitDisplay } from "@/components/employees/EmployeeProfitDisplay";
import { Plus, Search, Edit, Users, UserCheck, UserX, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExportData } from '@/hooks/useExportData';

interface Employee {
  id: string;
  name: string;
  employee_id?: string;
  department: string;
  position: string;
  salary: number;
  phone_number?: string;
  email: string;
  phone: string;
  hire_date: string;
  status: string;
  address: string;
  age: number;
  blood_group: string;
  driving_license_url?: string;
  aadhar_card_url?: string;
  advance?: number;
  employment_type: string;
  created_at: string;
  updated_at: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { exportEmployeesToExcel, exportEmployeesToPDF } = useExportData();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Map the data to match our Employee interface
      const mappedEmployees = (data || []).map((emp: any) => ({
        ...emp,
        employee_id: emp.id, // Use id as employee_id if not present
        phone: emp.phone || emp.phone_number, // Use phone or phone_number
        age: emp.age || 0,
        blood_group: emp.blood_group || '',
        advance: emp.advance || 0,
        employment_type: emp.employment_type || 'full-time'
      }));
      
      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    try {
      const { error } = await supabase
        .from('employees')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Employee ${newStatus.toLowerCase()} successfully`);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error('Failed to update employee status');
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.employee_id && employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  const inactiveEmployees = employees.filter(emp => emp.status === 'Inactive').length;

  if (loading) {
    return <div className="space-y-6"><div className="p-6">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportEmployeesToExcel(employees)}
            className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportEmployeesToPDF(employees)}
            className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <AddEmployeeModal onEmployeeAdded={fetchEmployees} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Employees</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveEmployees}</div>
          </CardContent>
        </Card>
      </div>

      <EmployeeProfitDisplay />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Employment Type</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.employee_id || employee.id}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={employee.employment_type === 'full-time' ? 'default' : 'secondary'}
                      className={employee.employment_type === 'full-time' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                    >
                      {employee.employment_type}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{employee.salary?.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(employee.phone_number || employee.phone) && (
                        <div className="text-sm">{employee.phone_number || employee.phone}</div>
                      )}
                      {employee.email && (
                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={employee.status === 'Active' ? 'default' : 'secondary'}
                      className={employee.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <EditEmployeeModal
                        employee={employee}
                        onEmployeeUpdated={fetchEmployees}
                      />
                      <Button
                        variant={employee.status === 'Active' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleStatusToggle(employee.id, employee.status)}
                      >
                        {employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No employees found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;
