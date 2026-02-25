import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayrollRuns } from '@/hooks/usePayroll';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, PoundSterling, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CashflowPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: company } = useCompany(companyId);
  const { data: invoices, isLoading: invLoading } = useInvoices(companyId);
  const { data: payrollRuns, isLoading: payLoading } = usePayrollRuns(companyId);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Build monthly cashflow data
  const { chartData, totalIncome, totalExpenses, netCashflow, upcoming } = useMemo(() => {
    const monthMap: Record<string, { income: number; expenses: number }> = {};

    // Income from paid invoices
    invoices?.filter(i => i.status === 'paid' && i.paid_at).forEach(inv => {
      const month = new Date(inv.paid_at!).toISOString().slice(0, 7);
      if (!monthMap[month]) monthMap[month] = { income: 0, expenses: 0 };
      monthMap[month].income += inv.total;
    });

    // Expenses from payroll
    payrollRuns?.filter(r => r.status === 'approved' || r.status === 'submitted').forEach(run => {
      const month = new Date(run.pay_date).toISOString().slice(0, 7);
      if (!monthMap[month]) monthMap[month] = { income: 0, expenses: 0 };
      monthMap[month].expenses += (run.total_gross || 0) + (run.total_ni_employer || 0) + (run.total_pension_employer || 0);
    });

    const sorted = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        income: Number(data.income.toFixed(2)),
        expenses: Number(data.expenses.toFixed(2)),
        net: Number((data.income - data.expenses).toFixed(2)),
      }));

    const totalIncome = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0) || 0;
    const totalExpenses = payrollRuns?.filter(r => r.status !== 'draft').reduce((s, r) => s + (r.total_gross || 0) + (r.total_ni_employer || 0) + (r.total_pension_employer || 0), 0) || 0;

    // Upcoming: sent/overdue invoices expected
    const upcoming = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 10) || [];

    return { chartData: sorted, totalIncome, totalExpenses, netCashflow: totalIncome - totalExpenses, upcoming };
  }, [invoices, payrollRuns]);

  if (authLoading || invLoading || payLoading) {
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
            <h1 className="text-xl font-bold">Cashflow</h1>
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
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">£{totalIncome.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">£{totalExpenses.toFixed(2)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Cashflow</p>
                  <p className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    £{netCashflow.toFixed(2)}
                  </p>
                </div>
                <ArrowUpDown className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold">£{upcoming.reduce((s, i) => s + i.total - i.amount_paid, 0).toFixed(2)}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Monthly Cashflow</CardTitle>
              <CardDescription>Income from invoices vs payroll expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Expected Income</CardTitle>
            <CardDescription>Outstanding invoices awaiting payment</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No outstanding invoices
                    </TableCell>
                  </TableRow>
                ) : (
                  upcoming.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.client_name}</TableCell>
                      <TableCell>{new Date(inv.due_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>£{(inv.total - inv.amount_paid).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'overdue' ? 'destructive' : 'default'}>{inv.status}</Badge>
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
