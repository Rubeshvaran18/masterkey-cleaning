import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, UserCheck, UserX, Plus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  status: string;
}

interface AttendanceRecord {
  id: number;
  employee_id: string;
  employee_name: string;
  date: string;
  status: string;
  position: string;
  department: string;
  check_in_time?: string;
  check_out_time?: string;
  total_hours?: number;
  created_at: string;
}

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [timeForm, setTimeForm] = useState({
    check_in_time: '',
    check_out_time: ''
  });
  
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, position, department, status')
        .eq('status', 'Active');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error("Failed to fetch employees");
    }
  };

  const fetchAttendanceForDate = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date);

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error("Failed to fetch attendance records");
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (employeeId: string, employeeName: string, position: string, department: string, status: 'Present' | 'Absent') => {
    try {
      // Check if attendance already exists for this employee and date
      const { data: existingRecord } = await supabase
        .from('attendance')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', selectedDate)
        .single();

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('employee_id', employeeId)
          .eq('date', selectedDate);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('attendance')
          .insert({
            employee_id: employeeId,
            employee_name: employeeName,
            date: selectedDate,
            status,
            position,
            department
          });

        if (error) throw error;
      }

      toast.success(`Marked ${employeeName} as ${status}`);
      fetchAttendanceForDate(selectedDate);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error("Failed to mark attendance");
    }
  };

  const updateAttendanceTime = async () => {
    if (!selectedEmployee) return;

    try {
      const { check_in_time, check_out_time } = timeForm;
      let total_hours = 0;
      
      if (check_in_time && check_out_time) {
        const checkIn = new Date(`2000-01-01T${check_in_time}`);
        const checkOut = new Date(`2000-01-01T${check_out_time}`);
        total_hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      }

      const { error } = await supabase
        .from('attendance')
        .update({
          check_in_time,
          check_out_time,
          total_hours
        })
        .eq('employee_id', selectedEmployee.id)
        .eq('date', selectedDate);

      if (error) throw error;

      toast.success('Attendance time updated successfully');
      fetchAttendanceForDate(selectedDate);
      setSelectedEmployee(null);
      setTimeForm({ check_in_time: '', check_out_time: '' });
    } catch (error) {
      console.error('Error updating attendance time:', error);
      toast.error('Failed to update attendance time');
    }
  };

  const getEmployeeAttendanceStatus = (employeeId: string) => {
    const record = attendanceRecords.find(record => record.employee_id === employeeId);
    return record?.status || 'Not Marked';
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      fetchAttendanceForDate(selectedDate);
    }
  }, [selectedDate]);

  const employeesWithAttendance = employees.map(employee => ({
    ...employee,
    attendanceStatus: getEmployeeAttendanceStatus(employee.id)
  }));

  const presentCount = attendanceRecords.filter(record => record.status === 'Present').length;
  const absentCount = attendanceRecords.filter(record => record.status === 'Absent').length;
  const totalEmployees = employees.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Attendance for {selectedDate}</h2>
        
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Loading attendance records...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {employeesWithAttendance.map((employee) => (
              <Card key={employee.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.position} • {employee.department}</p>
                      <p className="text-sm text-muted-foreground">ID: {employee.id}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={
                              employee.attendanceStatus === "Present" ? "default" : 
                              employee.attendanceStatus === "Absent" ? "destructive" : 
                              "secondary"
                            }
                          >
                            {employee.attendanceStatus}
                          </Badge>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 border-green-600 hover:border-green-700"
                              onClick={() => markAttendance(employee.id, employee.name, employee.position, employee.department, 'Present')}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Present</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
                              onClick={() => markAttendance(employee.id, employee.name, employee.position, employee.department, 'Absent')}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Absent</span>
                            </Button>
                          </div>
                        </div>
                        
                        {employee.attendanceStatus === "Present" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  const record = attendanceRecords.find(r => r.employee_id === employee.id);
                                  setTimeForm({
                                    check_in_time: record?.check_in_time || '',
                                    check_out_time: record?.check_out_time || ''
                                  });
                                }}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Set Time</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Set Check-in/Check-out Times - {employee.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="check_in_time">Check-in Time</Label>
                                  <Input
                                    id="check_in_time"
                                    type="time"
                                    value={timeForm.check_in_time}
                                    onChange={(e) => setTimeForm({...timeForm, check_in_time: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="check_out_time">Check-out Time</Label>
                                  <Input
                                    id="check_out_time"
                                    type="time"
                                    value={timeForm.check_out_time}
                                    onChange={(e) => setTimeForm({...timeForm, check_out_time: e.target.value})}
                                  />
                                </div>
                                <Button onClick={updateAttendanceTime} className="w-full">
                                  Update Times
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      
                      {(() => {
                        const record = attendanceRecords.find(r => r.employee_id === employee.id);
                        return record && record.check_in_time && record.check_out_time && (
                          <div className="text-sm text-muted-foreground flex items-center space-x-4">
                            <span>Check-in: {record.check_in_time}</span>
                            <span>Check-out: {record.check_out_time}</span>
                            <span>Total: {record.total_hours?.toFixed(1)}h</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {employeesWithAttendance.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No employees found. Add employees to track attendance.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;