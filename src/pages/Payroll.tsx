import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useEmployees } from '@/hooks/useEmployees';
import { usePayrollRuns, usePayslips, useCreatePayrollRun, useUpdatePayrollRunStatus } from '@/hooks/usePayroll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building2, 
  Plus,
  Loader2,
  PoundSterling,
  Check,
  Send,
  Eye,
  Calendar,
  Download
} from 'lucide-react';
import { formatCurrency, getTaxYear } from '@/lib/uk-payroll-calculator';
import { generatePayslipPDF } from '@/lib/pdf-generator';

export default function PayrollPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { data: company, isLoading: companyLoading } = useCompany(companyId);
  const { data: employees } = useEmployees(companyId);
  const { data: payrollRuns, isLoading: payrollLoading } = usePayrollRuns(companyId);
  const createPayrollRun = useCreatePayrollRun();
  const updateStatus = useUpdatePayrollRunStatus();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [payDates, setPayDates] = useState({
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    payDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  });
  
  const { data: payslips } = usePayslips(selectedRunId || undefined);
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  
  const handleCreatePayroll = async () => {
    if (!company || !employees) return;
    
    await createPayrollRun.mutateAsync({
      company,
      employees,
      payPeriodStart: new Date(payDates.periodStart),
      payPeriodEnd: new Date(payDates.periodEnd),
      payDate: new Date(payDates.payDate),
    });
    
    setIsCreateOpen(false);
  };
  
  const handleApprove = async (runId: string) => {
    await updateStatus.mutateAsync({ id: runId, status: 'approved' });
  };
  
  const handleSubmitToHMRC = async (runId: string) => {
    await updateStatus.mutateAsync({ id: runId, status: 'submitted', submittedToHmrc: true });
  };
  
  const handleDownloadPayslip = (payslip: typeof payslips extends (infer T)[] | undefined ? T : never) => {
    if (!payslip || !company || !selectedRun) return;
    const employee = employees?.find(e => e.id === payslip.employee_id);
    if (!employee) return;
    
    generatePayslipPDF({
      companyName: company.name,
      payeReference: company.paye_reference || undefined,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      employeeNumber: employee.employee_number,
      niNumber: employee.ni_number || undefined,
      taxCode: employee.tax_code || undefined,
      payDate: new Date(selectedRun.pay_date).toLocaleDateString('en-GB'),
      payPeriod: `${new Date(selectedRun.pay_period_start).toLocaleDateString('en-GB')} - ${new Date(selectedRun.pay_period_end).toLocaleDateString('en-GB')}`,
      grossPay: payslip.gross_pay,
      taxablePay: payslip.taxable_pay,
      incomeTax: payslip.income_tax,
      niEmployee: payslip.ni_employee,
      pensionEmployee: payslip.pension_employee || 0,
      studentLoan: payslip.student_loan || 0,
      otherDeductions: payslip.other_deductions || 0,
      netPay: payslip.net_pay,
      ytdGross: payslip.ytd_gross,
      ytdTax: payslip.ytd_tax,
      ytdNi: payslip.ytd_ni,
      ytdPension: payslip.ytd_pension_employee || 0,
    });
  };
  
  const activeEmployees = employees?.filter(e => e.status === 'active') || [];
  const selectedRun = payrollRuns?.find(r => r.id === selectedRunId);
  
  // Get employee details for payslips
  const payslipsWithEmployee = payslips?.map(p => ({
    ...p,
    employee: employees?.find(e => e.id === p.employee_id),
  }));
  
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/company/${companyId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{company?.name}</h1>
                <p className="text-sm text-muted-foreground">Payroll Management</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} disabled={activeEmployees.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Run Payroll
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Employees</p>
                  <p className="text-2xl font-bold">{activeEmployees.length}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Tax Year</p>
                  <p className="text-2xl font-bold">{getTaxYear(new Date())}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Payroll Runs</p>
                  <p className="text-2xl font-bold">{payrollRuns?.length || 0}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Payroll</p>
                  <p className="text-2xl font-bold">
                    {payrollRuns?.[0] 
                      ? formatCurrency(payrollRuns[0].total_gross || 0)
                      : '-'}
                  </p>
                </div>
                <PoundSterling className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="runs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedRunId}>
              Run Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="runs">
            {payrollLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : payrollRuns && payrollRuns.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Tax Month</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>NI (Employee)</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">
                          {new Date(run.pay_date).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          {new Date(run.pay_period_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          {' - '}
                          {new Date(run.pay_period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </TableCell>
                        <TableCell>{run.tax_month}</TableCell>
                        <TableCell>{formatCurrency(run.total_gross || 0)}</TableCell>
                        <TableCell>{formatCurrency(run.total_tax || 0)}</TableCell>
                        <TableCell>{formatCurrency(run.total_ni_employee || 0)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(run.total_net || 0)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              run.status === 'submitted' ? 'default' :
                              run.status === 'approved' ? 'secondary' :
                              'outline'
                            }
                          >
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setSelectedRunId(run.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {run.status === 'draft' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleApprove(run.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {run.status === 'approved' && !run.submitted_to_hmrc && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleSubmitToHMRC(run.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <PoundSterling className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No payroll runs yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeEmployees.length === 0 
                      ? 'Add employees first to run payroll.'
                      : 'Run your first payroll to get started.'}
                  </p>
                  <Button 
                    onClick={() => activeEmployees.length > 0 ? setIsCreateOpen(true) : navigate(`/company/${companyId}/employees`)}
                  >
                    {activeEmployees.length === 0 ? 'Add Employees' : 'Run First Payroll'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="details">
            {selectedRun && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          Payroll for {new Date(selectedRun.pay_date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </CardTitle>
                        <CardDescription>Tax Year {selectedRun.tax_year}, Month {selectedRun.tax_month}</CardDescription>
                      </div>
                      <Badge variant={selectedRun.status === 'submitted' ? 'default' : 'secondary'}>
                        {selectedRun.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Gross</p>
                        <p className="text-xl font-bold">{formatCurrency(selectedRun.total_gross || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Tax</p>
                        <p className="text-xl font-bold">{formatCurrency(selectedRun.total_tax || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total NI (Employee)</p>
                        <p className="text-xl font-bold">{formatCurrency(selectedRun.total_ni_employee || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Net</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(selectedRun.total_net || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Employer NI</p>
                        <p className="text-xl font-bold">{formatCurrency(selectedRun.total_ni_employer || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pension (Employee)</p>
                        <p className="text-xl font-bold">{formatCurrency(selectedRun.total_pension_employee || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pension (Employer)</p>
                        <p className="text-xl font-bold">{formatCurrency(selectedRun.total_pension_employer || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Individual Payslips</CardTitle>
                  </CardHeader>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead>NI</TableHead>
                        <TableHead>Pension</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>YTD Gross</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslipsWithEmployee?.map((payslip) => (
                        <TableRow key={payslip.id}>
                          <TableCell className="font-medium">
                            {payslip.employee?.first_name} {payslip.employee?.last_name}
                          </TableCell>
                          <TableCell>{formatCurrency(payslip.gross_pay)}</TableCell>
                          <TableCell>{formatCurrency(payslip.income_tax)}</TableCell>
                          <TableCell>{formatCurrency(payslip.ni_employee)}</TableCell>
                          <TableCell>{formatCurrency(payslip.pension_employee)}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(payslip.net_pay)}
                          </TableCell>
                          <TableCell>{formatCurrency(payslip.ytd_gross)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPayslip(payslip)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Create Payroll Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run New Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="period_start">Pay Period Start</Label>
              <Input
                id="period_start"
                type="date"
                value={payDates.periodStart}
                onChange={(e) => setPayDates({ ...payDates, periodStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end">Pay Period End</Label>
              <Input
                id="period_end"
                type="date"
                value={payDates.periodEnd}
                onChange={(e) => setPayDates({ ...payDates, periodEnd: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay_date">Pay Date</Label>
              <Input
                id="pay_date"
                type="date"
                value={payDates.payDate}
                onChange={(e) => setPayDates({ ...payDates, payDate: e.target.value })}
              />
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">This payroll will include:</p>
              <p className="font-medium">{activeEmployees.length} active employees</p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleCreatePayroll}
              disabled={createPayrollRun.isPending}
            >
              {createPayrollRun.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Calculate & Create Payroll
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
