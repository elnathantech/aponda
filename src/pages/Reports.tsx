import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useEmployees } from '@/hooks/useEmployees';
import { usePayrollRuns, usePayslips } from '@/hooks/usePayroll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Building2, 
  Loader2,
  FileText,
  Download,
  Printer,
  PoundSterling,
  Users,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, getTaxYear } from '@/lib/uk-payroll-calculator';
import { generateP60PDF } from '@/lib/pdf-generator';
import type { Tables } from '@/integrations/supabase/types';

export default function ReportsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { data: company, isLoading: companyLoading } = useCompany(companyId);
  const { data: employees } = useEmployees(companyId);
  const { data: payrollRuns } = usePayrollRuns(companyId);
  
  const [selectedTaxYear, setSelectedTaxYear] = useState(getTaxYear(new Date()));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  
  // Filter payroll runs by tax year
  const filteredRuns = payrollRuns?.filter(r => r.tax_year === selectedTaxYear) || [];
  
  // Calculate totals
  const totals = filteredRuns.reduce((acc, run) => ({
    gross: acc.gross + (run.total_gross || 0),
    tax: acc.tax + (run.total_tax || 0),
    niEmployee: acc.niEmployee + (run.total_ni_employee || 0),
    niEmployer: acc.niEmployer + (run.total_ni_employer || 0),
    pensionEmployee: acc.pensionEmployee + (run.total_pension_employee || 0),
    pensionEmployer: acc.pensionEmployer + (run.total_pension_employer || 0),
    net: acc.net + (run.total_net || 0),
  }), {
    gross: 0,
    tax: 0,
    niEmployee: 0,
    niEmployer: 0,
    pensionEmployee: 0,
    pensionEmployer: 0,
    net: 0,
  });
  
  // Generate P60 data for employees
  const p60Data = employees?.map(emp => {
    // In a real app, we'd fetch actual YTD data per employee
    return {
      employee: emp,
      taxYear: selectedTaxYear,
      totalPay: 0,
      totalTax: 0,
      totalNI: 0,
      finalTaxCode: emp.tax_code,
    };
  }) || [];
  
  // RTI/FPS submission history
  const rtiSubmissions = filteredRuns.filter(r => r.submitted_to_hmrc);
  
  const handleDownloadP60 = (emp: Tables<'employees'>) => {
    if (!company) return;
    
    generateP60PDF({
      companyName: company.name,
      payeReference: company.paye_reference || undefined,
      employeeName: `${emp.first_name} ${emp.last_name}`,
      employeeNumber: emp.employee_number,
      niNumber: emp.ni_number || undefined,
      taxCode: emp.tax_code || undefined,
      taxYear: selectedTaxYear,
      totalPay: emp.annual_salary, // This would come from YTD totals in production
      totalTax: 0, // This would come from YTD totals
      totalNi: 0, // This would come from YTD totals
      totalPension: 0, // This would come from YTD totals
    });
  };
  
  const handleExportCSV = (reportType: string) => {
    let csvContent = '';
    let filename = '';
    
    switch (reportType) {
      case 'payroll-summary':
        filename = `payroll-summary-${selectedTaxYear}.csv`;
        csvContent = 'Pay Date,Period Start,Period End,Gross,Tax,NI Employee,NI Employer,Net\n';
        filteredRuns.forEach(run => {
          csvContent += `${run.pay_date},${run.pay_period_start},${run.pay_period_end},${run.total_gross},${run.total_tax},${run.total_ni_employee},${run.total_ni_employer},${run.total_net}\n`;
        });
        break;
        
      case 'employee-list':
        filename = `employees-${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'Employee Number,First Name,Last Name,Job Title,Department,Annual Salary,Tax Code,Status\n';
        employees?.forEach(emp => {
          csvContent += `${emp.employee_number},${emp.first_name},${emp.last_name},${emp.job_title || ''},${emp.department || ''},${emp.annual_salary},${emp.tax_code},${emp.status}\n`;
        });
        break;
        
      case 'pension':
        filename = `pension-contributions-${selectedTaxYear}.csv`;
        csvContent = 'Pay Date,Employee Contributions,Employer Contributions,Total\n';
        filteredRuns.forEach(run => {
          const total = (run.total_pension_employee || 0) + (run.total_pension_employer || 0);
          csvContent += `${run.pay_date},${run.total_pension_employee},${run.total_pension_employer},${total}\n`;
        });
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
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
                <p className="text-sm text-muted-foreground">Reports & Analytics</p>
              </div>
            </div>
          </div>
          <Select value={selectedTaxYear} onValueChange={setSelectedTaxYear}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tax Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024/25">2024/25</SelectItem>
              <SelectItem value="2023/24">2023/24</SelectItem>
              <SelectItem value="2022/23">2022/23</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">YTD Gross Pay</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.gross)}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">YTD Tax Paid</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.tax)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">YTD NI (Total)</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.niEmployee + totals.niEmployer)}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">YTD Pension</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.pensionEmployee + totals.pensionEmployer)}</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="payroll" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payroll">Payroll Summary</TabsTrigger>
            <TabsTrigger value="p60">P60s</TabsTrigger>
            <TabsTrigger value="rti">RTI/FPS</TabsTrigger>
            <TabsTrigger value="pension">Pension Reports</TabsTrigger>
            <TabsTrigger value="companies-house">Companies House</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payroll">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payroll Summary Report</CardTitle>
                    <CardDescription>Overview of all payroll runs for {selectedTaxYear}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => handleExportCSV('payroll-summary')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              {filteredRuns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Tax Month</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>NI (Emp)</TableHead>
                      <TableHead>NI (Er)</TableHead>
                      <TableHead>Pension</TableHead>
                      <TableHead>Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>{new Date(run.pay_date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>{run.tax_month}</TableCell>
                        <TableCell>{formatCurrency(run.total_gross || 0)}</TableCell>
                        <TableCell>{formatCurrency(run.total_tax || 0)}</TableCell>
                        <TableCell>{formatCurrency(run.total_ni_employee || 0)}</TableCell>
                        <TableCell>{formatCurrency(run.total_ni_employer || 0)}</TableCell>
                        <TableCell>{formatCurrency((run.total_pension_employee || 0) + (run.total_pension_employer || 0))}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(run.total_net || 0)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>Totals</TableCell>
                      <TableCell>{formatCurrency(totals.gross)}</TableCell>
                      <TableCell>{formatCurrency(totals.tax)}</TableCell>
                      <TableCell>{formatCurrency(totals.niEmployee)}</TableCell>
                      <TableCell>{formatCurrency(totals.niEmployer)}</TableCell>
                      <TableCell>{formatCurrency(totals.pensionEmployee + totals.pensionEmployer)}</TableCell>
                      <TableCell>{formatCurrency(totals.net)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No payroll data for {selectedTaxYear}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="p60">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>P60 End of Year Certificates</CardTitle>
                    <CardDescription>Annual tax summaries for each employee</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees?.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      Print All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees?.filter(e => selectedEmployee === 'all' || e.id === selectedEmployee).map(emp => (
                    <Card key={emp.id} className="border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{emp.first_name} {emp.last_name}</CardTitle>
                          <Badge variant="outline">P60</Badge>
                        </div>
                        <CardDescription>Tax Year {selectedTaxYear}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">NI Number:</span>
                            <span className="font-mono">{emp.ni_number || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax Code:</span>
                            <span>{emp.tax_code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Pay:</span>
                            <span>{formatCurrency(emp.annual_salary)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Tax:</span>
                            <span>-</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total NI:</span>
                            <span>-</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full mt-4" 
                          size="sm"
                          onClick={() => handleDownloadP60(emp)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rti">
            <Card>
              <CardHeader>
                <CardTitle>RTI Submissions (FPS/EPS)</CardTitle>
                <CardDescription>Real Time Information submissions to HMRC</CardDescription>
              </CardHeader>
              {rtiSubmissions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Tax Month</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Total Gross</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rtiSubmissions.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          {run.submitted_at 
                            ? new Date(run.submitted_at).toLocaleDateString('en-GB')
                            : '-'}
                        </TableCell>
                        <TableCell>{new Date(run.pay_date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>{run.tax_month}</TableCell>
                        <TableCell>{employees?.filter(e => e.status === 'active').length || 0}</TableCell>
                        <TableCell>{formatCurrency(run.total_gross || 0)}</TableCell>
                        <TableCell>
                          <Badge variant="default">Submitted</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <CardContent>
                  <div className="text-center py-8">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No RTI submissions for {selectedTaxYear}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Approve and submit payroll runs to create FPS submissions
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="pension">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pension Contribution Reports</CardTitle>
                    <CardDescription>Auto-enrolment pension contributions for {selectedTaxYear}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => handleExportCSV('pension')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Employee Contributions</p>
                      <p className="text-2xl font-bold">{formatCurrency(totals.pensionEmployee)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Employer Contributions</p>
                      <p className="text-2xl font-bold">{formatCurrency(totals.pensionEmployer)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Contributions</p>
                      <p className="text-2xl font-bold">{formatCurrency(totals.pensionEmployee + totals.pensionEmployer)}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Enrolled Employees</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Pension Status</TableHead>
                        <TableHead>Annual Salary</TableHead>
                        <TableHead>Employee %</TableHead>
                        <TableHead>Employer %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees?.filter(e => e.pension_status === 'enrolled').map(emp => (
                        <TableRow key={emp.id}>
                          <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                          <TableCell>
                            <Badge variant="default">Enrolled</Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(emp.annual_salary)}</TableCell>
                          <TableCell>{company?.pension_employee_contribution || 5}%</TableCell>
                          <TableCell>{company?.pension_employer_contribution || 3}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="companies-house">
            <Card>
              <CardHeader>
                <CardTitle>Companies House Reports</CardTitle>
                <CardDescription>Generate reports for Companies House filing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 hover:border-primary cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <FileText className="h-10 w-10 text-primary" />
                        <div>
                          <h4 className="font-medium">Annual Return</h4>
                          <p className="text-sm text-muted-foreground">
                            Generate annual return data including director and shareholder information.
                          </p>
                          <Button variant="outline" className="mt-4" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Generate Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 hover:border-primary cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <FileSpreadsheet className="h-10 w-10 text-primary" />
                        <div>
                          <h4 className="font-medium">Confirmation Statement</h4>
                          <p className="text-sm text-muted-foreground">
                            Generate CS01 confirmation statement with company details.
                          </p>
                          <Button variant="outline" className="mt-4" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Generate Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 hover:border-primary cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Users className="h-10 w-10 text-primary" />
                        <div>
                          <h4 className="font-medium">Employee Headcount</h4>
                          <p className="text-sm text-muted-foreground">
                            Export employee headcount and department breakdown.
                          </p>
                          <Button variant="outline" className="mt-4" size="sm" onClick={() => handleExportCSV('employee-list')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 hover:border-primary cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <PoundSterling className="h-10 w-10 text-primary" />
                        <div>
                          <h4 className="font-medium">Payroll Costs Summary</h4>
                          <p className="text-sm text-muted-foreground">
                            Annual payroll costs for financial reporting.
                          </p>
                          <Button variant="outline" className="mt-4" size="sm" onClick={() => handleExportCSV('payroll-summary')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
