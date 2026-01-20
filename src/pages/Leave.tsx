import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useEmployees } from '@/hooks/useEmployees';
import { 
  useCompanyLeaveRecords, 
  useCreateLeaveRequest, 
  useUpdateLeaveStatus,
  useDeleteLeaveRequest
} from '@/hooks/useLeave';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, differenceInBusinessDays, parseISO } from 'date-fns';
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  Loader2,
  Palmtree,
  ThermometerSun,
  Baby,
  Heart
} from 'lucide-react';

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', icon: Palmtree },
  { value: 'sick', label: 'Sick Leave', icon: ThermometerSun },
  { value: 'maternity', label: 'Maternity Leave', icon: Baby },
  { value: 'paternity', label: 'Paternity Leave', icon: Baby },
  { value: 'compassionate', label: 'Compassionate Leave', icon: Heart },
  { value: 'unpaid', label: 'Unpaid Leave', icon: Calendar },
];

export default function LeavePage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: company, isLoading: companyLoading } = useCompany(companyId);
  const { data: employees } = useEmployees(companyId);
  const { data: leaveRecords, isLoading: leaveLoading } = useCompanyLeaveRecords(companyId);
  
  const createLeave = useCreateLeaveRequest();
  const updateLeaveStatus = useUpdateLeaveStatus();
  const deleteLeave = useDeleteLeaveRequest();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    notes: '',
  });
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  
  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    return differenceInBusinessDays(parseISO(endDate), parseISO(startDate)) + 1;
  };
  
  const handleCreateLeave = async () => {
    if (!formData.employee_id || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const days = calculateDays(formData.start_date, formData.end_date);
    if (days <= 0) {
      toast.error('End date must be after start date');
      return;
    }
    
    try {
      await createLeave.mutateAsync({
        employee_id: formData.employee_id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_taken: days,
        notes: formData.notes || undefined,
      });
      
      toast.success('Leave request created successfully');
      setIsCreateOpen(false);
      setFormData({
        employee_id: '',
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        notes: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create leave request');
    }
  };
  
  const handleApprove = async (leaveId: string) => {
    try {
      await updateLeaveStatus.mutateAsync({
        leaveId,
        status: 'approved',
        approvedBy: user?.id,
      });
      toast.success('Leave request approved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve leave');
    }
  };
  
  const handleReject = async (leaveId: string) => {
    try {
      await updateLeaveStatus.mutateAsync({
        leaveId,
        status: 'rejected',
      });
      toast.success('Leave request rejected');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject leave');
    }
  };
  
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteLeave.mutateAsync(deleteId);
      toast.success('Leave request deleted');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete leave');
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getLeaveTypeIcon = (type: string) => {
    const leaveType = LEAVE_TYPES.find(t => t.value === type);
    const Icon = leaveType?.icon || Calendar;
    return <Icon className="h-4 w-4" />;
  };
  
  const filteredRecords = leaveRecords?.filter(record => 
    filterStatus === 'all' || record.status === filterStatus
  ) || [];
  
  const pendingCount = leaveRecords?.filter(r => r.status === 'pending').length || 0;
  const approvedCount = leaveRecords?.filter(r => r.status === 'approved').length || 0;
  
  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/company/${companyId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{company?.name}</h1>
              <p className="text-sm text-muted-foreground">Leave Management</p>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Leave Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Leave Request</DialogTitle>
                <DialogDescription>
                  Create a leave request for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.filter(e => e.status === 'active').map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Leave Type *</Label>
                  <Select
                    value={formData.leave_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, leave_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                
                {formData.start_date && formData.end_date && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      Duration: {calculateDays(formData.start_date, formData.end_date)} working day(s)
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLeave} disabled={createLeave.isPending}>
                  {createLeave.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{leaveRecords?.length || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Employees</p>
                  <p className="text-2xl font-bold">{employees?.filter(e => e.status === 'active').length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Leave Records */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Manage employee leave requests and approvals</CardDescription>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {leaveLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No leave requests</h3>
                <p className="text-muted-foreground mb-4">
                  {filterStatus !== 'all' 
                    ? `No ${filterStatus} leave requests found.`
                    : 'Create your first leave request to get started.'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {record.employee?.first_name} {record.employee?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.employee?.employee_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLeaveTypeIcon(record.leave_type)}
                          <span className="capitalize">{record.leave_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(parseISO(record.start_date), 'dd MMM yyyy')}</p>
                          <p className="text-muted-foreground">
                            to {format(parseISO(record.end_date), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.days_taken} days</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {record.notes || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {record.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(record.id)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(record.id)}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(record.id)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the leave request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
