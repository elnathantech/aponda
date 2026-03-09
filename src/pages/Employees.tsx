import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, type Employee } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Building2, 
  Plus,
  Loader2,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  User
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/uk-payroll-calculator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const defaultEmployee: Partial<Employee> = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  ni_number: '',
  job_title: '',
  department: '',
  start_date: new Date().toISOString().split('T')[0],
  status: 'pending',
  annual_salary: 30000,
  pay_frequency: 'monthly',
  tax_code: '1257L',
  is_cumulative: true,
  student_loan_plan: null,
  pension_status: 'eligible',
};

export default function EmployeesPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { data: company, isLoading: companyLoading } = useCompany(companyId);
  const { data: employees, isLoading: employeesLoading } = useEmployees(companyId);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Partial<Employee> | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>(defaultEmployee);
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  
  const handleOpenCreate = () => {
    setSelectedEmployee(null);
    setFormData({ ...defaultEmployee, company_id: companyId });
    setIsFormOpen(true);
  };
  
  const handleOpenEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setIsFormOpen(true);
  };
  
  const handleOpenDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteOpen(true);
  };
  
  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name || !formData.start_date || !formData.annual_salary) {
      return;
    }
    
    if (selectedEmployee?.id) {
      await updateEmployee.mutateAsync({ id: selectedEmployee.id, ...formData });
    } else {
      await createEmployee.mutateAsync({ ...formData, company_id: companyId! } as Parameters<typeof createEmployee.mutateAsync>[0]);
    }
    setIsFormOpen(false);
  };
  
  const handleDelete = async () => {
    if (!selectedEmployee?.id || !companyId) return;
    await deleteEmployee.mutateAsync({ id: selectedEmployee.id, companyId });
    setIsDeleteOpen(false);
  };
  
  const filteredEmployees = employees?.filter(e => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      e.first_name.toLowerCase().includes(query) ||
      e.last_name.toLowerCase().includes(query) ||
      e.employee_number.toLowerCase().includes(query) ||
      e.email?.toLowerCase().includes(query)
    );
  });
  
  if (authLoading || companyLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Employee Management</h1>
            <p className="text-sm text-muted-foreground">{company?.name}</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary">
            {employees?.length || 0} employees
          </Badge>
        </div>
        
        {/* Employees Table */}
        {employeesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEmployees && filteredEmployees.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Tax Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                          <p className="text-sm text-muted-foreground">{employee.employee_number}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{employee.job_title || '-'}</p>
                        <p className="text-sm text-muted-foreground">{employee.department || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(employee.annual_salary)}</p>
                        <p className="text-sm text-muted-foreground capitalize">{employee.pay_frequency}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.tax_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={employee.status === 'active' ? 'default' : 'secondary'}
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(employee)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleOpenDelete(employee)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first employee to start managing payroll.
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Employee
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Employee Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Personal Details */}
            <div className="space-y-4">
              <h4 className="font-medium">Personal Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ni_number">National Insurance Number</Label>
                  <Input
                    id="ni_number"
                    value={formData.ni_number || ''}
                    onChange={(e) => setFormData({ ...formData, ni_number: e.target.value.toUpperCase() })}
                    placeholder="e.g., AB123456C"
                  />
                </div>
              </div>
            </div>
            
            {/* Employment Details */}
            <div className="space-y-4">
              <h4 className="font-medium">Employment Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title || ''}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Employee['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Payroll Details */}
            <div className="space-y-4">
              <h4 className="font-medium">Payroll Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annual_salary">Annual Salary (£) *</Label>
                  <Input
                    id="annual_salary"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.annual_salary || ''}
                    onChange={(e) => setFormData({ ...formData, annual_salary: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay_frequency">Pay Frequency</Label>
                  <Select
                    value={formData.pay_frequency}
                    onValueChange={(value) => setFormData({ ...formData, pay_frequency: value as Employee['pay_frequency'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_code">Tax Code</Label>
                  <Input
                    id="tax_code"
                    value={formData.tax_code || ''}
                    onChange={(e) => setFormData({ ...formData, tax_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., 1257L"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_loan">Student Loan Plan</Label>
                  <Select
                    value={formData.student_loan_plan || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, student_loan_plan: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="plan1">Plan 1</SelectItem>
                      <SelectItem value="plan2">Plan 2</SelectItem>
                      <SelectItem value="plan4">Plan 4 (Scotland)</SelectItem>
                      <SelectItem value="plan5">Plan 5</SelectItem>
                      <SelectItem value="postgrad">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pension_status">Pension Status</Label>
                  <Select
                    value={formData.pension_status}
                    onValueChange={(value) => setFormData({ ...formData, pension_status: value as Employee['pension_status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eligible">Eligible</SelectItem>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                      <SelectItem value="opted_out">Opted Out</SelectItem>
                      <SelectItem value="not_eligible">Not Eligible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={createEmployee.isPending || updateEmployee.isPending}
            >
              {(createEmployee.isPending || updateEmployee.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {selectedEmployee ? 'Save Changes' : 'Add Employee'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedEmployee?.first_name} {selectedEmployee?.last_name}? 
              This action cannot be undone and will remove all associated payroll data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmployee.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
