import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCompany } from '@/hooks/useCompany';
import { useProjects } from '@/hooks/useProjects';
import {
  useRecurringInvoices,
  useAutomationLogs,
  useCreateRecurringInvoice,
  useUpdateRecurringInvoice,
  useDeleteRecurringInvoice,
  useRunAutomation,
  type RecurringInvoice,
} from '@/hooks/useRecurringInvoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Loader2, Trash2, Zap, RefreshCw, Bell, Clock, CheckCircle, XCircle, RotateCw, Play,
} from 'lucide-react';

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const automationTypeLabels: Record<string, string> = {
  overdue_flagging: 'Overdue Flagging',
  recurring_invoice: 'Recurring Invoice',
  payment_reminder: 'Payment Reminder',
};

export default function AutomationPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { data: company } = useCompany(companyId);
  const { data: projects } = useProjects(companyId);
  const { data: recurring, isLoading: recurringLoading } = useRecurringInvoices(companyId);
  const { data: logs, isLoading: logsLoading } = useAutomationLogs(companyId);
  const createRecurring = useCreateRecurringInvoice();
  const updateRecurring = useUpdateRecurringInvoice();
  const deleteRecurring = useDeleteRecurringInvoice();
  const runAutomation = useRunAutomation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    project_id: '',
    frequency: 'monthly',
    next_run_date: '',
    tax_rate: 20,
    notes: '',
    payment_terms: 'Net 30',
    payment_due_days: 30,
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...items];
    (updated[index] as Record<string, unknown>)[field] = value;
    setItems(updated);
  };

  const handleCreate = async () => {
    if (!companyId || !form.client_name || !form.next_run_date) return;

    await createRecurring.mutateAsync({
      company_id: companyId,
      client_name: form.client_name,
      client_email: form.client_email || null,
      client_address: null,
      project_id: form.project_id || null,
      frequency: form.frequency as RecurringInvoice['frequency'],
      next_run_date: form.next_run_date,
      items_template: items.filter(i => i.description),
      tax_rate: form.tax_rate,
      notes: form.notes || null,
      payment_terms: form.payment_terms || null,
      payment_due_days: form.payment_due_days,
      is_active: true,
    });

    setIsCreateOpen(false);
    setForm({ client_name: '', client_email: '', project_id: '', frequency: 'monthly', next_run_date: '', tax_rate: 20, notes: '', payment_terms: 'Net 30', payment_due_days: 30 });
    setItems([{ description: '', quantity: 1, unit_price: 0 }]);
  };

  const isLoading = recurringLoading || logsLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const activeRecurring = recurring?.filter(r => r.is_active).length || 0;
  const successLogs = logs?.filter(l => l.status === 'success').length || 0;
  const errorLogs = logs?.filter(l => l.status === 'error').length || 0;

  return (
    <div className="bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Financial Automation
            </h1>
            <p className="text-sm text-muted-foreground">{company?.name} — Automate your financial workflows</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAutomation.mutate({ type: 'financial-automation', companyId: companyId! })}
              disabled={runAutomation.isPending}
            >
              {runAutomation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Run Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAutomation.mutate({ type: 'payment-reminders', companyId: companyId! })}
              disabled={runAutomation.isPending}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Templates</p>
                  <p className="text-2xl font-bold">{activeRecurring}</p>
                </div>
                <RotateCw className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Templates</p>
                  <p className="text-2xl font-bold">{recurring?.length || 0}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Successful Actions</p>
                  <p className="text-2xl font-bold text-green-600">{successLogs}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed Actions</p>
                  <p className="text-2xl font-bold text-red-600">{errorLogs}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recurring" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recurring">Recurring Invoices</TabsTrigger>
            <TabsTrigger value="logs">Automation Log</TabsTrigger>
          </TabsList>

          <TabsContent value="recurring">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recurring Invoice Templates</CardTitle>
                  <CardDescription>Set up invoices that generate automatically on a schedule</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />New Template</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Create Recurring Invoice</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client Name *</Label>
                          <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Client Email</Label>
                          <Input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency *</Label>
                          <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="fortnightly">Fortnightly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Next Run Date *</Label>
                          <Input type="date" value={form.next_run_date} onChange={e => setForm({ ...form, next_run_date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Project</Label>
                          <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                            <SelectContent>
                              {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Due (days)</Label>
                          <Input type="number" value={form.payment_due_days} onChange={e => setForm({ ...form, payment_due_days: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Tax Rate (%)</Label>
                          <Input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Terms</Label>
                          <Input value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Line Items</Label>
                          <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add</Button>
                        </div>
                        <div className="space-y-2">
                          {items.map((item, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 items-end">
                              <div className="col-span-6">
                                {i === 0 && <Label className="text-xs">Description</Label>}
                                <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Service description" />
                              </div>
                              <div className="col-span-2">
                                {i === 0 && <Label className="text-xs">Qty</Label>}
                                <Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                              </div>
                              <div className="col-span-3">
                                {i === 0 && <Label className="text-xs">Price (£)</Label>}
                                <Input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} />
                              </div>
                              <div className="col-span-1">
                                {items.length > 1 && (
                                  <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                      </div>

                      <Button className="w-full" onClick={handleCreate} disabled={createRecurring.isPending || !form.client_name || !form.next_run_date}>
                        {createRecurring.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Create Template
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!recurring || recurring.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          No recurring invoices yet. Create a template to automate invoice generation.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recurring.map(r => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{r.client_name}</p>
                              {r.client_email && <p className="text-xs text-muted-foreground">{r.client_email}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{frequencyLabels[r.frequency]}</Badge>
                          </TableCell>
                          <TableCell>{new Date(r.next_run_date).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell>{r.total_generated}</TableCell>
                          <TableCell>
                            <Switch
                              checked={r.is_active}
                              onCheckedChange={(checked) =>
                                updateRecurring.mutate({ id: r.id, company_id: r.company_id, is_active: checked })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRecurring.mutate({ id: r.id, companyId: r.company_id })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Automation Activity Log</CardTitle>
                <CardDescription>Recent automation actions and their results</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!logs || logs.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          No automation activity yet. Run automations to see the log.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {automationTypeLabels[log.automation_type] || log.automation_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                              {log.status === 'success' ? (
                                <><CheckCircle className="h-3 w-3 mr-1" />Success</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" />Error</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {log.details && typeof log.details === 'object'
                              ? (log.details as Record<string, unknown>).invoice_number
                                ? `Invoice ${(log.details as Record<string, unknown>).invoice_number}`
                                : (log.details as Record<string, unknown>).error
                                  ? String((log.details as Record<string, unknown>).error).substring(0, 80)
                                  : JSON.stringify(log.details).substring(0, 80)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(log.created_at).toLocaleString('en-GB')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
