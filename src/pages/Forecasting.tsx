import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useEmployees } from '@/hooks/useEmployees';
import { usePayrollRuns } from '@/hooks/usePayroll';
import { useInvoices } from '@/hooks/useInvoices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, TrendingUp, PoundSterling, AlertTriangle, CalendarClock, Receipt, Calculator } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/uk-payroll-calculator';

export default function ForecastingPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: company } = useCompany(companyId);
  const { data: employees, isLoading: empLoading } = useEmployees(companyId);
  const { data: payrollRuns, isLoading: payLoading } = usePayrollRuns(companyId);
  const { data: invoices, isLoading: invLoading } = useInvoices(companyId);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // ─── Salary Cost Forecasting ───
  const salaryForecast = useMemo(() => {
    if (!employees) return [];
    const activeEmps = employees.filter(e => e.status === 'active');
    const months: { month: string; gross: number; ni: number; pension: number; total: number }[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

      let gross = 0;
      let ni = 0;
      let pension = 0;

      activeEmps.forEach(emp => {
        const monthlyGross = emp.annual_salary / 12;
        // Approximate employer NI at 13.8% above threshold
        const annualNIThreshold = 9100;
        const monthlyNI = Math.max(0, (emp.annual_salary - annualNIThreshold) * 0.138 / 12);
        const pensionRate = (company?.pension_employer_contribution || 3) / 100;
        const monthlyPension = emp.pension_status === 'enrolled' ? monthlyGross * pensionRate : 0;

        gross += monthlyGross;
        ni += monthlyNI;
        pension += monthlyPension;
      });

      months.push({
        month: label,
        gross: Number(gross.toFixed(2)),
        ni: Number(ni.toFixed(2)),
        pension: Number(pension.toFixed(2)),
        total: Number((gross + ni + pension).toFixed(2)),
      });
    }

    return months;
  }, [employees, company]);

  const totalAnnualCost = salaryForecast.reduce((s, m) => s + m.total, 0);
  const monthlyAvgCost = salaryForecast.length > 0 ? totalAnnualCost / salaryForecast.length : 0;

  // ─── Payroll Timing Alerts ───
  const payrollAlerts = useMemo(() => {
    const alerts: { type: 'warning' | 'info' | 'urgent'; title: string; description: string; date: string }[] = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check for draft payroll runs that need attention
    payrollRuns?.filter(r => r.status === 'draft').forEach(run => {
      const payDate = new Date(run.pay_date);
      const daysUntil = Math.ceil((payDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        alerts.push({
          type: 'urgent',
          title: 'Overdue Payroll Run',
          description: `Pay date ${new Date(run.pay_date).toLocaleDateString('en-GB')} has passed. Approve and process immediately.`,
          date: run.pay_date,
        });
      } else if (daysUntil <= 3) {
        alerts.push({
          type: 'urgent',
          title: 'Payroll Due Soon',
          description: `Pay date is ${new Date(run.pay_date).toLocaleDateString('en-GB')} (${daysUntil} day${daysUntil === 1 ? '' : 's'}). Approve this run.`,
          date: run.pay_date,
        });
      } else if (daysUntil <= 7) {
        alerts.push({
          type: 'warning',
          title: 'Upcoming Payroll',
          description: `Pay date is ${new Date(run.pay_date).toLocaleDateString('en-GB')} (${daysUntil} days). Review and prepare.`,
          date: run.pay_date,
        });
      }
    });

    // Check for approved but not submitted to HMRC
    payrollRuns?.filter(r => r.status === 'approved' && !r.submitted_to_hmrc).forEach(run => {
      alerts.push({
        type: 'warning',
        title: 'HMRC Submission Pending',
        description: `Payroll run for ${new Date(run.pay_date).toLocaleDateString('en-GB')} approved but not submitted to HMRC.`,
        date: run.pay_date,
      });
    });

    // HMRC monthly deadlines — RTI/FPS due by pay date or before
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    // PAYE payment due 22nd of following month (or 19th for postal)
    const payeDeadline = new Date(currentYear, currentMonth + 1, 22);
    const daysUntilPAYE = Math.ceil((payeDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilPAYE <= 14 && daysUntilPAYE > 0) {
      alerts.push({
        type: daysUntilPAYE <= 5 ? 'urgent' : 'info',
        title: 'PAYE Payment Deadline',
        description: `PAYE/NI payment due to HMRC by ${payeDeadline.toLocaleDateString('en-GB')} (${daysUntilPAYE} days).`,
        date: payeDeadline.toISOString().split('T')[0],
      });
    }

    // Auto-enrolment pension deadline — usually 22nd of each month
    const pensionDeadline = new Date(currentYear, currentMonth + 1, 22);
    const daysUntilPension = Math.ceil((pensionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilPension <= 14 && daysUntilPension > 0) {
      alerts.push({
        type: daysUntilPension <= 5 ? 'urgent' : 'info',
        title: 'Pension Contribution Deadline',
        description: `Auto-enrolment pension contributions due by ${pensionDeadline.toLocaleDateString('en-GB')}.`,
        date: pensionDeadline.toISOString().split('T')[0],
      });
    }

    // Sort: urgent first, then by date
    return alerts.sort((a, b) => {
      const priority = { urgent: 0, warning: 1, info: 2 };
      return priority[a.type] - priority[b.type] || a.date.localeCompare(b.date);
    });
  }, [payrollRuns]);

  // ─── VAT + Tax Forecasting ───
  const taxForecast = useMemo(() => {
    if (!invoices || !payrollRuns) return { quarterlyVAT: [], annualSummary: null };

    // Group invoices by quarter for VAT
    const quarters: Record<string, { output: number; period: string }> = {};
    invoices.forEach(inv => {
      const d = new Date(inv.issue_date);
      const q = Math.floor(d.getMonth() / 3);
      const key = `${d.getFullYear()}-Q${q + 1}`;
      if (!quarters[key]) quarters[key] = { output: 0, period: key };
      quarters[key].output += inv.tax_amount || 0;
    });

    const quarterlyVAT = Object.values(quarters)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(q => ({
        ...q,
        output: Number(q.output.toFixed(2)),
      }));

    // Annual tax summary
    const totalVATCollected = invoices.reduce((s, i) => s + (i.tax_amount || 0), 0);
    const totalPAYE = payrollRuns
      .filter(r => r.status !== 'draft')
      .reduce((s, r) => s + (r.total_tax || 0), 0);
    const totalNI = payrollRuns
      .filter(r => r.status !== 'draft')
      .reduce((s, r) => s + (r.total_ni_employee || 0) + (r.total_ni_employer || 0), 0);

    // Forecast next quarter VAT based on average
    const avgQuarterlyVAT = quarterlyVAT.length > 0
      ? quarterlyVAT.reduce((s, q) => s + q.output, 0) / quarterlyVAT.length
      : 0;

    // Forecast next month PAYE+NI based on average
    const processedRuns = payrollRuns.filter(r => r.status !== 'draft');
    const avgMonthlyPAYE = processedRuns.length > 0
      ? processedRuns.reduce((s, r) => s + (r.total_tax || 0), 0) / processedRuns.length
      : 0;
    const avgMonthlyNI = processedRuns.length > 0
      ? processedRuns.reduce((s, r) => s + (r.total_ni_employee || 0) + (r.total_ni_employer || 0), 0) / processedRuns.length
      : 0;

    return {
      quarterlyVAT,
      annualSummary: {
        totalVATCollected: Number(totalVATCollected.toFixed(2)),
        totalPAYE: Number(totalPAYE.toFixed(2)),
        totalNI: Number(totalNI.toFixed(2)),
        forecastNextQuarterVAT: Number(avgQuarterlyVAT.toFixed(2)),
        forecastNextMonthPAYE: Number(avgMonthlyPAYE.toFixed(2)),
        forecastNextMonthNI: Number(avgMonthlyNI.toFixed(2)),
      },
    };
  }, [invoices, payrollRuns]);

  if (authLoading || empLoading || payLoading || invLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const alertColors = {
    urgent: 'border-destructive bg-destructive/10 text-destructive',
    warning: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    info: 'border-primary bg-primary/10 text-primary',
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/company/${companyId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Forecasting & Alerts</h1>
            <p className="text-sm text-muted-foreground">{company?.name}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Top-level alerts */}
        {payrollAlerts.length > 0 && (
          <div className="space-y-3 mb-8">
            {payrollAlerts.map((alert, i) => (
              <div key={i} className={`border rounded-lg p-4 flex items-start gap-3 ${alertColors[alert.type]}`}>
                {alert.type === 'urgent' ? (
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <CalendarClock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-sm opacity-80">{alert.description}</p>
                </div>
                <Badge variant={alert.type === 'urgent' ? 'destructive' : 'outline'} className="ml-auto flex-shrink-0">
                  {alert.type}
                </Badge>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="salary">
          <TabsList className="mb-6">
            <TabsTrigger value="salary" className="gap-2"><PoundSterling className="h-4 w-4" />Salary Forecast</TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2"><CalendarClock className="h-4 w-4" />Payroll Alerts</TabsTrigger>
            <TabsTrigger value="tax" className="gap-2"><Calculator className="h-4 w-4" />VAT & Tax</TabsTrigger>
          </TabsList>

          {/* ─── SALARY COST FORECAST ─── */}
          <TabsContent value="salary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">12-Month Total Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAnnualCost)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Monthly Average</p>
                  <p className="text-2xl font-bold">{formatCurrency(monthlyAvgCost)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Active Employees</p>
                  <p className="text-2xl font-bold">{employees?.filter(e => e.status === 'active').length || 0}</p>
                </CardContent>
              </Card>
            </div>

            {salaryForecast.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>12-Month Salary Cost Projection</CardTitle>
                  <CardDescription>Gross salary, employer NI, and pension contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salaryForecast}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="gross" name="Gross Salary" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} stackId="a" />
                        <Bar dataKey="ni" name="Employer NI" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} stackId="a" />
                        <Bar dataKey="pension" name="Pension" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Gross Salary</TableHead>
                      <TableHead className="text-right">Employer NI</TableHead>
                      <TableHead className="text-right">Pension</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryForecast.map(m => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium">{m.month}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.gross)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.ni)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.pension)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(m.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── PAYROLL TIMING ALERTS ─── */}
          <TabsContent value="alerts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    HMRC Key Dates
                  </CardTitle>
                  <CardDescription>Recurring payroll deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'RTI/FPS Submission', desc: 'On or before each pay date', icon: '📋' },
                      { label: 'PAYE/NI Payment (electronic)', desc: '22nd of following month', icon: '💷' },
                      { label: 'PAYE/NI Payment (postal)', desc: '19th of following month', icon: '✉️' },
                      { label: 'Pension Contributions', desc: '22nd of following month', icon: '🏦' },
                      { label: 'P60s to Employees', desc: 'By 31 May after tax year end', icon: '📄' },
                      { label: 'Final FPS', desc: 'By 19 April after tax year end', icon: '🏁' },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Active Alerts
                  </CardTitle>
                  <CardDescription>Items requiring your attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {payrollAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No active alerts — you're all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payrollAlerts.map((alert, i) => (
                        <div key={i} className={`border rounded-lg p-3 ${alertColors[alert.type]}`}>
                          <p className="text-sm font-semibold">{alert.title}</p>
                          <p className="text-xs opacity-80">{alert.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payroll run timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Payroll Timeline</CardTitle>
                <CardDescription>Status of recent payroll runs</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>HMRC</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!payrollRuns || payrollRuns.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payroll runs yet</TableCell>
                      </TableRow>
                    ) : (
                      payrollRuns.slice(0, 10).map(run => (
                        <TableRow key={run.id}>
                          <TableCell className="font-medium">{new Date(run.pay_date).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(run.pay_period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            {' – '}
                            {new Date(run.pay_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={run.status === 'draft' ? 'secondary' : run.status === 'approved' ? 'default' : 'outline'}>
                              {run.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={run.submitted_to_hmrc ? 'default' : 'secondary'}>
                              {run.submitted_to_hmrc ? 'Submitted' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency((run.total_gross || 0) + (run.total_ni_employer || 0) + (run.total_pension_employer || 0))}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── VAT & TAX FORECASTING ─── */}
          <TabsContent value="tax">
            {taxForecast.annualSummary && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">VAT Collected (YTD)</p>
                      <p className="text-2xl font-bold">{formatCurrency(taxForecast.annualSummary.totalVATCollected)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Forecast next quarter: {formatCurrency(taxForecast.annualSummary.forecastNextQuarterVAT)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">PAYE Deducted (YTD)</p>
                      <p className="text-2xl font-bold">{formatCurrency(taxForecast.annualSummary.totalPAYE)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Forecast next month: {formatCurrency(taxForecast.annualSummary.forecastNextMonthPAYE)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">NI Contributions (YTD)</p>
                      <p className="text-2xl font-bold">{formatCurrency(taxForecast.annualSummary.totalNI)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Forecast next month: {formatCurrency(taxForecast.annualSummary.forecastNextMonthNI)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {taxForecast.quarterlyVAT.length > 0 && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle>Quarterly VAT Output</CardTitle>
                      <CardDescription>VAT collected from invoices by quarter</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={taxForecast.quarterlyVAT}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="period" className="text-xs" />
                            <YAxis className="text-xs" tickFormatter={v => `£${v}`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="output" name="VAT Output" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Tax Obligations Summary</CardTitle>
                    <CardDescription>Overview of all tax-related obligations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tax Type</TableHead>
                          <TableHead className="text-right">Year to Date</TableHead>
                          <TableHead className="text-right">Next Period Forecast</TableHead>
                          <TableHead>Frequency</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">VAT (Output Tax)</TableCell>
                          <TableCell className="text-right">{formatCurrency(taxForecast.annualSummary.totalVATCollected)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(taxForecast.annualSummary.forecastNextQuarterVAT)}</TableCell>
                          <TableCell><Badge variant="outline">Quarterly</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">PAYE Income Tax</TableCell>
                          <TableCell className="text-right">{formatCurrency(taxForecast.annualSummary.totalPAYE)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(taxForecast.annualSummary.forecastNextMonthPAYE)}</TableCell>
                          <TableCell><Badge variant="outline">Monthly</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">National Insurance</TableCell>
                          <TableCell className="text-right">{formatCurrency(taxForecast.annualSummary.totalNI)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(taxForecast.annualSummary.forecastNextMonthNI)}</TableCell>
                          <TableCell><Badge variant="outline">Monthly</Badge></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
