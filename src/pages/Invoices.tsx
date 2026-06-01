import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useProjects } from '@/hooks/useProjects';
import { useInvoices, useCreateInvoice, useUpdateInvoiceStatus, useDeleteInvoice, type Invoice } from '@/hooks/useInvoices';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  ArrowLeft, Plus, Loader2, MoreHorizontal, Send, CheckCircle, XCircle, Trash2, Receipt, PoundSterling, Download, Link2
} from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/invoice-pdf-generator';

const statusColors: Record<Invoice['status'], string> = {
  draft: 'secondary',
  sent: 'default',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'secondary',
};

export default function InvoicesPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: company } = useCompany(companyId);
  const { data: projects } = useProjects(companyId);
  const { data: invoices, isLoading } = useInvoices(companyId);
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    project_id: '',
    due_date: '',
    tax_rate: 20,
    notes: '',
    payment_terms: 'Net 30',
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...items];
    (updated[index] as Record<string, unknown>)[field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = Number(updated[index].quantity) * Number(updated[index].unit_price);
    }
    setItems(updated);
  };

  const handleCreate = async () => {
    if (!companyId || !form.client_name || !form.due_date || items.length === 0) return;

    const count = invoices?.length || 0;
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

    await createInvoice.mutateAsync({
      company_id: companyId,
      invoice_number: invoiceNumber,
      client_name: form.client_name,
      client_email: form.client_email || null,
      project_id: form.project_id || null,
      due_date: form.due_date,
      tax_rate: form.tax_rate,
      notes: form.notes || null,
      payment_terms: form.payment_terms || null,
      items: items.filter(i => i.description).map(i => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
      })),
    });

    setIsCreateOpen(false);
    setForm({ client_name: '', client_email: '', project_id: '', due_date: '', tax_rate: 20, notes: '', payment_terms: 'Net 30' });
    setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const handleDownloadPDF = async (inv: Invoice) => {
    // Fetch invoice items
    const { data: invoiceItems } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', inv.id)
      .order('created_at');

    generateInvoicePDF({
      invoiceNumber: inv.invoice_number,
      companyName: company?.name || '',
      companyAddress: company?.registered_address ? Object.values(company.registered_address as Record<string, string>).filter(Boolean).join('\n') : undefined,
      vatNumber: company?.vat_number || undefined,
      clientName: inv.client_name,
      clientEmail: inv.client_email || undefined,
      clientAddress: inv.client_address as Record<string, string> || undefined,
      issueDate: new Date(inv.issue_date).toLocaleDateString('en-GB'),
      dueDate: new Date(inv.due_date).toLocaleDateString('en-GB'),
      items: (invoiceItems || []).map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })),
      subtotal: inv.subtotal,
      taxRate: inv.tax_rate ?? 20,
      taxAmount: inv.tax_amount,
      total: inv.total,
      amountPaid: inv.amount_paid,
      notes: inv.notes || undefined,
      paymentTerms: inv.payment_terms || undefined,
      status: inv.status,
    });
  };

  const filtered = invoices?.filter(inv => filterStatus === 'all' || inv.status === filterStatus) || [];
  const totalOutstanding = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.total - i.amount_paid, 0) || 0;
  const totalPaid = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0) || 0;
  const totalDraft = invoices?.filter(i => i.status === 'draft').length || 0;

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Invoices</h1>
            <p className="text-sm text-muted-foreground">{company?.name}</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
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
                    <Label>Project</Label>
                    <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent>
                        {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
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
                    <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          {i === 0 && <Label className="text-xs">Description</Label>}
                          <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Service description" />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs">Qty</Label>}
                          <Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs">Price</Label>}
                          <Input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs">Total</Label>}
                          <Input readOnly value={(item.quantity * item.unit_price).toFixed(2)} />
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

                <div className="border-t pt-4">
                  <div className="text-right space-y-1">
                    <p className="text-sm">Subtotal: £{items.reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2)}</p>
                    <p className="text-sm">VAT ({form.tax_rate}%): £{(items.reduce((s, i) => s + i.quantity * i.unit_price, 0) * form.tax_rate / 100).toFixed(2)}</p>
                    <p className="font-bold">Total: £{(items.reduce((s, i) => s + i.quantity * i.unit_price, 0) * (1 + form.tax_rate / 100)).toFixed(2)}</p>
                  </div>
                </div>

                <Button className="w-full" onClick={handleCreate} disabled={createInvoice.isPending || !form.client_name || !form.due_date}>
                  {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                  <p className="text-2xl font-bold">{invoices?.length || 0}</p>
                </div>
                <Receipt className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold">£{totalOutstanding.toFixed(2)}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold">£{totalPaid.toFixed(2)}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold">{totalDraft}</p>
                </div>
                <Receipt className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No invoices found. Create your first invoice to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.client_name}</TableCell>
                      <TableCell>{new Date(inv.issue_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{new Date(inv.due_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>£{inv.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[inv.status] as 'default' | 'secondary' | 'destructive'}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadPDF(inv)}>
                              <Download className="h-4 w-4 mr-2" />Download PDF
                            </DropdownMenuItem>
                            {inv.status === 'draft' && (
                              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: inv.id, status: 'sent' })}>
                                <Send className="h-4 w-4 mr-2" />Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {(inv.status === 'sent' || inv.status === 'overdue') && (
                              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: inv.id, status: 'paid', amount_paid: inv.total })}>
                                <CheckCircle className="h-4 w-4 mr-2" />Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: inv.id, status: 'cancelled' })}>
                                <XCircle className="h-4 w-4 mr-2" />Cancel
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteInvoice.mutate({ id: inv.id, companyId: companyId! })}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
