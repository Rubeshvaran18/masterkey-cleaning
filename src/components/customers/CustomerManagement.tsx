import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Search, Star, MapPin, Phone, Mail, Calendar, IndianRupee, User, Download, FileText, CheckCircle } from 'lucide-react';
import { useExportData } from '@/hooks/useExportData';
import { CustomerForm } from './CustomerForm';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  booking_date: string;
  email?: string;
  task_type: 'Domestic' | 'Corporate';
  amount: number;
  discount_points: number;
  amount_paid: number;
  payment_status: 'Paid in Cash' | 'Unpaid' | 'Partial';
  source: string;
  task_done_by: string[];
  customer_notes?: string;
  customer_rating: 'Good' | 'Normal' | 'Bad' | 'Poor';
  task_completed?: boolean;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: string;
  name: string;
}

const RATING_COLORS = {
  'Good': 'bg-green-500',
  'Normal': 'bg-blue-500',
  'Bad': 'bg-orange-500',
  'Poor': 'bg-red-500'
};

export function CustomerManagement() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const { exportCustomerRecordsToExcel, exportCustomerRecordsToPDF } = useExportData();

  const [newCustomer, setNewCustomer] = useState<Partial<CustomerRecord>>({
    name: '',
    phone: '',
    address: '',
    booking_date: new Date().toISOString().split('T')[0],
    email: '',
    task_type: 'Domestic',
    amount: 0,
    discount_points: 0,
    amount_paid: 0,
    payment_status: 'Unpaid',
    source: '',
    task_done_by: [],
    customer_notes: '',
    customer_rating: 'Normal',
    task_completed: false
  });

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCustomers((data as CustomerRecord[]) || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .eq('status', 'Active');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handlePaymentStatusUpdate = async (customerId: string, newStatus: string, amountPaid?: number) => {
    try {
      const updateData: any = {
        payment_status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'Paid in Cash' && amountPaid !== undefined) {
        updateData.amount_paid = amountPaid;
      }

      const { error } = await supabase
        .from('customer_records')
        .update(updateData)
        .eq('id', customerId);

      if (error) throw error;

      toast.success('Payment status updated successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const handleTaskCompletion = async (customer: CustomerRecord) => {
    try {
      if (!customer.task_done_by || customer.task_done_by.length === 0) {
        toast.error('No employees assigned to this task');
        return;
      }

      // Calculate revenue per employee
      const employeeCount = customer.task_done_by.filter(emp => emp).length;
      const revenuePerEmployee = customer.amount / employeeCount;
      const today = new Date().toISOString().split('T')[0];

      // Update each employee's daily salary
      for (const employeeName of customer.task_done_by) {
        if (!employeeName) continue;

        // Find employee by name
        const employee = employees.find(emp => emp.name === employeeName);
        if (!employee) continue;

        // Check if daily salary record exists for today
        const { data: existingSalary, error: fetchError } = await supabase
          .from('daily_salary_records')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('date', today)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching daily salary:', fetchError);
          continue;
        }

        if (existingSalary) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('daily_salary_records')
            .update({
              total_amount: existingSalary.total_amount + revenuePerEmployee,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSalary.id);

          if (updateError) {
            console.error('Error updating daily salary:', updateError);
          }
        } else {
          // Create new record
          const { error: insertError } = await supabase
            .from('daily_salary_records')
            .insert({
              employee_id: employee.id,
              date: today,
              total_amount: revenuePerEmployee,
              notes: `Task completion revenue for customer: ${customer.name}`
            });

          if (insertError) {
            console.error('Error inserting daily salary:', insertError);
          }
        }
      }

      // Mark task as completed
      const { error } = await supabase
        .from('customer_records')
        .update({
          task_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (error) throw error;

      toast.success(`Task completed! Revenue of ₹${revenuePerEmployee.toFixed(2)} distributed to each of ${employeeCount} employees`);
      fetchCustomers();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handleAddCustomer = async () => {
    try {
      if (!newCustomer.name || !newCustomer.phone || !newCustomer.address || !newCustomer.booking_date) {
        toast.error('Please fill in all required fields');
        return;
      }

      const customerRecord = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        booking_date: newCustomer.booking_date,
        email: newCustomer.email || null,
        task_type: newCustomer.task_type || 'Domestic',
        source: newCustomer.source || '',
        amount: newCustomer.amount || 0,
        discount_points: newCustomer.discount_points || 0,
        amount_paid: newCustomer.amount_paid || 0,
        payment_status: newCustomer.payment_status || 'Unpaid',
        task_done_by: newCustomer.task_done_by || [],
        customer_notes: newCustomer.customer_notes || null,
        customer_rating: newCustomer.customer_rating || 'Normal',
        task_completed: false
      };
      
      const { error } = await supabase
        .from('customer_records')
        .insert(customerRecord);

      if (error) throw error;
      
      toast.success('Customer record added successfully');
      setIsAddingCustomer(false);
      resetNewCustomer();
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer record');
    }
  };

  const resetNewCustomer = useCallback(() => {
    setNewCustomer({
      name: '',
      phone: '',
      address: '',
      booking_date: new Date().toISOString().split('T')[0],
      email: '',
      task_type: 'Domestic',
      amount: 0,
      discount_points: 0,
      amount_paid: 0,
      payment_status: 'Unpaid',
      source: '',
      task_done_by: [],
      customer_notes: '',
      customer_rating: 'Normal',
      task_completed: false
    });
  }, []);

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;

    try {
      if (!editingCustomer.name || !editingCustomer.phone || !editingCustomer.address || !editingCustomer.booking_date) {
        toast.error('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('customer_records')
        .update({
          name: editingCustomer.name,
          phone: editingCustomer.phone,
          address: editingCustomer.address,
          booking_date: editingCustomer.booking_date,
          email: editingCustomer.email || null,
          task_type: editingCustomer.task_type,
          source: editingCustomer.source,
          amount: editingCustomer.amount,
          discount_points: editingCustomer.discount_points,
          amount_paid: editingCustomer.amount_paid,
          payment_status: editingCustomer.payment_status,
          task_done_by: editingCustomer.task_done_by,
          customer_notes: editingCustomer.customer_notes || null,
          customer_rating: editingCustomer.customer_rating,
          task_completed: editingCustomer.task_completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;
      
      toast.success('Customer record updated successfully');
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer record');
    }
  };

  const handleEditCustomer = (customer: CustomerRecord) => {
    setEditingCustomer({ ...customer });
  };

  const handleEditingCustomerDataChange = (data: Partial<CustomerRecord>) => {
    if (editingCustomer) {
      setEditingCustomer({ ...editingCustomer, ...data });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.task_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading customers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportCustomerRecordsToExcel(customers)}
            className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportCustomerRecordsToPDF(customers)}
            className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer Record</DialogTitle>
            </DialogHeader>
            <CustomerForm
              customerData={newCustomer}
              setCustomerData={setNewCustomer}
              onSave={handleAddCustomer}
              employees={employees}
            />
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Info</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Job Details</TableHead>
                <TableHead>Financial</TableHead>
                <TableHead>Task Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-32">{customer.address || 'Not provided'}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone || 'Not provided'}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-32">{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(customer.booking_date).toLocaleDateString()}</span>
                      </div>
                      <Badge variant={customer.task_type === 'Corporate' ? 'default' : 'secondary'}>
                        {customer.task_type}
                      </Badge>
                      {customer.source && (
                        <div className="text-xs text-muted-foreground">Source: {customer.source}</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm">
                        <IndianRupee className="h-3 w-3" />
                        <span>{customer.amount || 0}</span>
                      </div>
                      {customer.discount_points > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Star className="h-3 w-3" />
                          <span>-{customer.discount_points} pts</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <Select 
                          value={customer.payment_status} 
                          onValueChange={(value) => {
                            if (value === 'Paid in Cash') {
                              const amount = prompt('Enter paid amount:');
                              if (amount && !isNaN(Number(amount))) {
                                handlePaymentStatusUpdate(customer.id, value, Number(amount));
                              }
                            } else {
                              handlePaymentStatusUpdate(customer.id, value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-32 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                            <SelectItem value="Paid in Cash">Paid in Cash</SelectItem>
                          </SelectContent>
                        </Select>
                        {customer.payment_status === 'Paid in Cash' && (
                          <div className="text-xs text-green-600">₹{customer.amount_paid}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {customer.task_done_by && customer.task_done_by.length > 0 ? (
                        customer.task_done_by.map((assignee, index) => (
                          assignee && (
                            <div key={index} className="text-xs px-2 py-1 bg-muted rounded">
                              {assignee}
                            </div>
                          )
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">Not assigned</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <Badge className={RATING_COLORS[customer.customer_rating]}>
                        {customer.customer_rating}
                      </Badge>
                      {customer.task_completed ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        customer.task_done_by && customer.task_done_by.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6"
                            onClick={() => handleTaskCompletion(customer)}
                          >
                            Mark Complete
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Dialog open={editingCustomer?.id === customer.id} onOpenChange={(open) => !open && setEditingCustomer(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Customer Record</DialogTitle>
                        </DialogHeader>
                        {editingCustomer && (
                          <CustomerForm
                            customerData={editingCustomer}
                            setCustomerData={handleEditingCustomerDataChange}
                            onSave={handleUpdateCustomer}
                            isEditing={true}
                            employees={employees}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No customer records found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
