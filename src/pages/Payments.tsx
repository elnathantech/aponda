import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wallet, Users, HardHat, CheckCircle2, Clock, AlertCircle, ExternalLink, Search } from 'lucide-react';
import { usePayments, type UnifiedPayment, type PaymentStatus } from '@/hooks/usePayments';
import { formatCurrency } from '@/lib/uk-payroll-calculator';

const statusMeta: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  scheduled: { label: 'Scheduled', variant: 'outline', icon: Clock },
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle2 },
  reconciled: { label: 'Reconciled', variant: 'default', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive', icon: AlertCircle },
};

export default function PaymentsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { data: payments = [], isLoading } = usePayments(companyId);
  const [tab, setTab] = useState<'all' | 'employee' | 'contractor'>('all');
  const [status, setStatus] = useState<'all' | PaymentStatus>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (tab !== 'all' && p.type !== tab) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.workerName.toLowerCase().includes(q) &&
          !(p.projectName || '').toLowerCase().includes(q) &&
          !(p.invoiceNumber || '').toLowerCase().includes(q) &&
          !p.reference.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [payments, tab, status, search]);

  const totals = useMemo(() => {
    const sum = (arr: UnifiedPayment[]) => arr.reduce((s, p) => s + p.amountNet, 0);
    return {
      scheduled: sum(payments.filter((p) => p.status === 'scheduled' || p.status === 'pending')),
      paid: sum(payments.filter((p) => p.status === 'paid' || p.status === 'reconciled')),
      employees: payments.filter((p) => p.type === 'employee').length,
      contractors: payments.filter((p) => p.type === 'contractor').length,
    };
  }, [payments]);

  const base = `/company/${companyId}`;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" aria-hidden="true" />
            Payments
          </h1>
          <p className="text-sm text-muted-foreground">
            Unified view of employee payroll and contractor payouts, linked to invoices, projects, and bank settlements.
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Scheduled / Pending" value={formatCurrency(totals.scheduled)} icon={Clock} />
        <SummaryCard label="Paid & Reconciled" value={formatCurrency(totals.paid)} icon={CheckCircle2} />
        <SummaryCard label="Employees paid" value={String(totals.employees)} icon={Users} />
        <SummaryCard label="Contractor payouts" value={String(totals.contractors)} icon={HardHat} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment activity</CardTitle>
          <CardDescription>
            Every payout across payroll and contractor invoices, with source project or invoice and bank settlement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="employee">Employees</TabsTrigger>
                <TabsTrigger value="contractor">Contractors</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search worker, project, invoice…"
                className="pl-8"
                aria-label="Search payments"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay date</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Linked to</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Settlement</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Loading payments…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No payments match these filters yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => {
                    const meta = statusMeta[p.status];
                    const Icon = meta.icon;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(p.payDate).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.workerName}</div>
                          <div className="text-xs text-muted-foreground">{p.workerRole || '—'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.type === 'employee' ? 'secondary' : 'outline'}>
                            {p.type === 'employee' ? 'Employee' : 'Contractor'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            {p.sourceType === 'payroll' ? (
                              <Link to={`${base}/payroll`} className="text-primary hover:underline">
                                {p.reference}
                              </Link>
                            ) : (
                              <span>{p.reference}</span>
                            )}
                            {p.projectName && (
                              <Link
                                to={`${base}/projects`}
                                className="text-xs text-muted-foreground hover:underline"
                              >
                                Project · {p.projectName}
                              </Link>
                            )}
                            {p.invoiceNumber && (
                              <Link
                                to={`${base}/invoices`}
                                className="text-xs text-muted-foreground hover:underline"
                              >
                                Invoice · {p.invoiceNumber}
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(p.amountNet)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={meta.variant} className="gap-1">
                              <Icon className="h-3 w-3" aria-hidden="true" />
                              {meta.label}
                            </Badge>
                            {p.bankTxnDate && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(p.bankTxnDate).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(
                                p.sourceType === 'payroll'
                                  ? `${base}/payroll`
                                  : `${base}/projects`,
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" /> Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CheckCircle2;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold mt-1">{value}</div>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}
