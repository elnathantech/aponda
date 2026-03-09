import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany, useCompanyOnboarding, useUpdateOnboardingStep, useUpdateCompany } from '@/hooks/useCompany';
import { useEmployees } from '@/hooks/useEmployees';
import { usePayrollRuns } from '@/hooks/usePayroll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  PoundSterling, 
  FileText, 
  Settings,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  AlertCircle,
  Receipt,
  FolderOpen,
  Clock,
  TrendingUp,
  CalendarDays,
  BarChart3,
  Calculator
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/uk-payroll-calculator';

export default function CompanyPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { data: company, isLoading: companyLoading } = useCompany(companyId);
  const { data: onboardingSteps } = useCompanyOnboarding(companyId);
  const { data: employees } = useEmployees(companyId);
  const { data: payrollRuns } = usePayrollRuns(companyId);
  const updateOnboardingStep = useUpdateOnboardingStep();
  const updateCompany = useUpdateCompany();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_number: '',
    paye_reference: '',
    accounts_office_reference: '',
    pension_provider: '',
    pension_employer_contribution: 3,
    pension_employee_contribution: 5,
  });
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        company_number: company.company_number || '',
        paye_reference: company.paye_reference || '',
        accounts_office_reference: company.accounts_office_reference || '',
        pension_provider: company.pension_provider || '',
        pension_employer_contribution: company.pension_employer_contribution || 3,
        pension_employee_contribution: company.pension_employee_contribution || 5,
      });
    }
  }, [company]);
  
  const handleSaveSettings = async () => {
    if (!companyId) return;
    await updateCompany.mutateAsync({ id: companyId, ...formData });
    setIsSettingsOpen(false);
  };
  
  const completedSteps = onboardingSteps?.filter(s => s.status === 'completed').length || 0;
  const totalSteps = onboardingSteps?.length || 1;
  const onboardingProgress = (completedSteps / totalSteps) * 100;
  
  const activeEmployees = employees?.filter(e => e.status === 'active').length || 0;
  const pendingPayroll = payrollRuns?.filter(r => r.status === 'draft').length || 0;
  
  if (authLoading || companyLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Company not found</h3>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{company.name}</h1>
              <p className="text-sm text-muted-foreground">
                {company.paye_reference || 'PAYE not configured'}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Onboarding Progress */}
        {onboardingProgress < 100 && (
          <Card className="mb-8 border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Complete Your Setup</CardTitle>
                  <CardDescription>
                    {completedSteps} of {totalSteps} steps completed
                  </CardDescription>
                </div>
                <Badge variant="outline">{Math.round(onboardingProgress)}% Complete</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={onboardingProgress} className="mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {onboardingSteps?.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer hover:bg-muted ${
                      step.status === 'completed' ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                    onClick={() => {
                      if (step.status !== 'completed') {
                        updateOnboardingStep.mutate({ id: step.id, status: 'completed' });
                      }
                    }}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{step.step_name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/company/${companyId}/employees`)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Employees</p>
                  <p className="text-2xl font-bold">{activeEmployees}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/company/${companyId}/payroll`)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payroll</p>
                  <p className="text-2xl font-bold">{pendingPayroll}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/company/${companyId}/reports`)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reports</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Payroll</p>
                  <p className="text-2xl font-bold">
                    {payrollRuns?.[0]?.total_gross 
                      ? formatCurrency(payrollRuns[0].total_gross)
                      : '-'}
                  </p>
                </div>
                <PoundSterling className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Feature Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Projects', icon: FolderOpen, path: 'projects' },
            { label: 'Invoices', icon: Receipt, path: 'invoices' },
            { label: 'Cashflow', icon: BarChart3, path: 'cashflow' },
            { label: 'Forecasting', icon: Calculator, path: 'forecasting' },
            { label: 'Workload', icon: Clock, path: 'workload' },
            { label: 'Revenue', icon: TrendingUp, path: 'revenue' },
            { label: 'Leave', icon: CalendarDays, path: 'leave' },
          ].map(item => (
            <Card key={item.path} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/company/${companyId}/${item.path}`)}>
              <CardContent className="pt-4 pb-4 flex flex-col items-center gap-2">
                <item.icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent-payroll">Recent Payroll</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Employees</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/company/${companyId}/employees`)}>
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {employees && employees.length > 0 ? (
                    <div className="space-y-3">
                      {employees.slice(0, 5).map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                          <div>
                            <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                            <p className="text-sm text-muted-foreground">{employee.job_title || employee.employee_number}</p>
                          </div>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-4">No employees yet</p>
                      <Button onClick={() => navigate(`/company/${companyId}/employees`)}>
                        Add Employees
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Company Details</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(true)}>
                      Edit <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Company Number</p>
                        <p className="font-medium">{company.company_number || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">PAYE Reference</p>
                        <p className="font-medium">{company.paye_reference || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Accounts Office Ref</p>
                        <p className="font-medium">{company.accounts_office_reference || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pension Provider</p>
                        <p className="font-medium">{company.pension_provider || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Employer Pension %</p>
                        <p className="font-medium">{company.pension_employer_contribution}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Employee Pension %</p>
                        <p className="font-medium">{company.pension_employee_contribution}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="recent-payroll">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Payroll Runs</CardTitle>
                  <Button onClick={() => navigate(`/company/${companyId}/payroll`)}>
                    Run Payroll
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payrollRuns && payrollRuns.length > 0 ? (
                  <div className="space-y-3">
                    {payrollRuns.slice(0, 5).map((run) => (
                      <div key={run.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                        <div>
                          <p className="font-medium">
                            {new Date(run.pay_date).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">Tax Month {run.tax_month}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(run.total_gross || 0)}</p>
                          <Badge variant={run.status === 'approved' ? 'default' : 'secondary'}>
                            {run.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PoundSterling className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4">No payroll runs yet</p>
                    <Button onClick={() => navigate(`/company/${companyId}/payroll`)}>
                      Run First Payroll
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>RTI submissions, pension declarations, and regulatory requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">PAYE Registration</p>
                        <p className="text-sm text-muted-foreground">
                          {company.paye_reference ? 'Configured' : 'Not configured'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {company.pension_provider ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <div>
                        <p className="font-medium">Auto-Enrolment Pension</p>
                        <p className="text-sm text-muted-foreground">
                          {company.pension_provider || 'Not configured'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Circle className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">RTI FPS Submissions</p>
                        <p className="text-sm text-muted-foreground">No submissions yet</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Company Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_number">Company Number (Companies House)</Label>
              <Input
                id="company_number"
                value={formData.company_number}
                onChange={(e) => setFormData({ ...formData, company_number: e.target.value })}
                placeholder="e.g., 12345678"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paye_reference">PAYE Reference</Label>
                <Input
                  id="paye_reference"
                  value={formData.paye_reference}
                  onChange={(e) => setFormData({ ...formData, paye_reference: e.target.value })}
                  placeholder="e.g., 123/AB12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accounts_office_reference">Accounts Office Ref</Label>
                <Input
                  id="accounts_office_reference"
                  value={formData.accounts_office_reference}
                  onChange={(e) => setFormData({ ...formData, accounts_office_reference: e.target.value })}
                  placeholder="e.g., 123PA12345678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pension_provider">Pension Provider</Label>
              <Input
                id="pension_provider"
                value={formData.pension_provider}
                onChange={(e) => setFormData({ ...formData, pension_provider: e.target.value })}
                placeholder="e.g., NEST, The People's Pension"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pension_employer">Employer Contribution %</Label>
                <Input
                  id="pension_employer"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.pension_employer_contribution}
                  onChange={(e) => setFormData({ ...formData, pension_employer_contribution: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pension_employee">Employee Contribution %</Label>
                <Input
                  id="pension_employee"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.pension_employee_contribution}
                  onChange={(e) => setFormData({ ...formData, pension_employee_contribution: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={handleSaveSettings}
              disabled={updateCompany.isPending}
            >
              {updateCompany.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
