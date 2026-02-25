import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useEmployees } from '@/hooks/useEmployees';
import { useInvoices } from '@/hooks/useInvoices';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, PoundSterling, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenuePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: company } = useCompany(companyId);
  const { data: employees } = useEmployees(companyId);
  const { data: invoices, isLoading: invLoading } = useInvoices(companyId);
  const { data: timeEntries, isLoading: teLoading } = useTimeEntries(companyId);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const { employeeRevenue, totalRevenue, avgRevenuePerEmployee, chartData } = useMemo(() => {
    if (!employees || !invoices || !timeEntries) {
      return { employeeRevenue: [], totalRevenue: 0, avgRevenuePerEmployee: 0, chartData: [] };
    }

    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((s, i) => s + i.total, 0);
    const activeEmployees = employees.filter(e => e.status === 'active');

    // Calculate revenue attributed to each employee via billable hours
    const totalBillableHours = timeEntries.filter(t => t.billable).reduce((s, t) => s + t.hours, 0);

    const employeeRevenue = activeEmployees.map(emp => {
      const empBillableHours = timeEntries.filter(t => t.employee_id === emp.id && t.billable).reduce((s, t) => s + t.hours, 0);
      const empTotalHours = timeEntries.filter(t => t.employee_id === emp.id).reduce((s, t) => s + t.hours, 0);
      
      // Revenue proportional to billable hours contribution
      const attributedRevenue = totalBillableHours > 0
        ? (empBillableHours / totalBillableHours) * totalRevenue
        : activeEmployees.length > 0 ? totalRevenue / activeEmployees.length : 0;
      
      const costPerYear = emp.annual_salary;
      const profitMargin = attributedRevenue > 0 ? ((attributedRevenue - costPerYear) / attributedRevenue) * 100 : 0;

      return {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        role: emp.job_title || emp.department || '-',
        billableHours: empBillableHours,
        totalHours: empTotalHours,
        utilization: empTotalHours > 0 ? (empBillableHours / empTotalHours) * 100 : 0,
        revenue: attributedRevenue,
        salary: costPerYear,
        profitMargin,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const avgRevenuePerEmployee = activeEmployees.length > 0 ? totalRevenue / activeEmployees.length : 0;

    const chartData = employeeRevenue.slice(0, 10).map(e => ({
      name: e.name.split(' ')[0],
      revenue: Number(e.revenue.toFixed(2)),
      salary: e.salary,
    }));

    return { employeeRevenue, totalRevenue, avgRevenuePerEmployee, chartData };
  }, [employees, invoices, timeEntries]);

  if (authLoading || invLoading || teLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/company/${companyId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Revenue per Employee</h1>
            <p className="text-sm text-muted-foreground">{company?.name}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg per Employee</p>
                  <p className="text-2xl font-bold">£{avgRevenuePerEmployee.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-50" />
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Invoices</p>
                  <p className="text-2xl font-bold">{invoices?.filter(i => i.status === 'paid').length || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Revenue vs Salary Cost</CardTitle>
              <CardDescription>Attributed revenue based on billable hours contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="salary" name="Salary" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Billable Hrs</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeRevenue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No data yet. Create invoices and log time entries to see revenue metrics.
                    </TableCell>
                  </TableRow>
                ) : (
                  employeeRevenue.map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell>{emp.role}</TableCell>
                      <TableCell>{emp.billableHours.toFixed(1)}h</TableCell>
                      <TableCell>
                        <Badge variant={emp.utilization >= 75 ? 'default' : emp.utilization >= 50 ? 'secondary' : 'destructive'}>
                          {emp.utilization.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>£{emp.revenue.toFixed(2)}</TableCell>
                      <TableCell>£{emp.salary.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={emp.profitMargin >= 0 ? 'default' : 'destructive'}>
                          {emp.profitMargin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
