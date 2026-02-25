import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useTimeEntries, useCreateTimeEntry, useDeleteTimeEntry } from '@/hooks/useTimeEntries';
import { useCompanyLeaveRecords } from '@/hooks/useLeave';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Loader2, Clock, Users, CalendarDays, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const STANDARD_WEEKLY_HOURS = 40;

export default function WorkloadPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: company } = useCompany(companyId);
  const { data: employees } = useEmployees(companyId);
  const { data: projects } = useProjects(companyId);
  const { data: timeEntries, isLoading } = useTimeEntries(companyId);
  const { data: leaveRecords } = useCompanyLeaveRecords(companyId);
  const createEntry = useCreateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: 8,
    description: '',
    billable: true,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const handleAdd = async () => {
    if (!form.employee_id || !form.hours) return;
    await createEntry.mutateAsync({
      employee_id: form.employee_id,
      project_id: form.project_id || null,
      date: form.date,
      hours: form.hours,
      description: form.description || null,
      billable: form.billable,
    });
    setIsAddOpen(false);
    setForm({ employee_id: '', project_id: '', date: new Date().toISOString().split('T')[0], hours: 8, description: '', billable: true });
  };

  // Employee workload summary for current week
  const employeeWorkload = useMemo(() => {
    if (!employees || !timeEntries) return [];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return employees.filter(e => e.status === 'active').map(emp => {
      const entries = timeEntries.filter(te =>
        te.employee_id === emp.id &&
        te.date >= weekStart.toISOString().split('T')[0] &&
        te.date <= weekEnd.toISOString().split('T')[0]
      );
      const totalHours = entries.reduce((s, e) => s + e.hours, 0);
      const billableHours = entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);

      // Leave status
      const activeLeave = leaveRecords?.find(lr =>
        lr.employee_id === emp.id &&
        lr.status === 'approved' &&
        lr.start_date <= now.toISOString().split('T')[0] &&
        lr.end_date >= now.toISOString().split('T')[0]
      );

      return {
        ...emp,
        totalHours,
        billableHours,
        capacity: Math.min((totalHours / STANDARD_WEEKLY_HOURS) * 100, 100),
        onLeave: !!activeLeave,
        leaveType: activeLeave?.leave_type,
      };
    });
  }, [employees, timeEntries, leaveRecords]);

  const totalBillableHours = timeEntries?.filter(t => t.billable).reduce((s, t) => s + t.hours, 0) || 0;
  const totalHours = timeEntries?.reduce((s, t) => s + t.hours, 0) || 0;
  const activeCount = employees?.filter(e => e.status === 'active').length || 0;
  const onLeaveCount = employeeWorkload.filter(e => e.onLeave).length;

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/company/${companyId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Workload</h1>
              <p className="text-sm text-muted-foreground">{company?.name}</p>
            </div>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Log Time</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Time Entry</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                      {employees?.filter(e => e.status === 'active').map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                    <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                    <SelectContent>
                      {projects?.filter(p => p.status === 'active').map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hours</Label>
                    <Input type="number" step="0.5" value={form.hours} onChange={e => setForm({ ...form, hours: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.billable} onCheckedChange={v => setForm({ ...form, billable: v })} />
                  <Label>Billable</Label>
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={createEntry.isPending || !form.employee_id}>
                  {createEntry.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Log Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Staff</p>
                  <p className="text-2xl font-bold">{activeCount}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">On Leave</p>
                  <p className="text-2xl font-bold">{onLeaveCount}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours (All Time)</p>
                  <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
                </div>
                <Clock className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Billable Hours</p>
                  <p className="text-2xl font-bold">{totalBillableHours.toFixed(1)}</p>
                </div>
                <Clock className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="capacity">
          <TabsList className="mb-4">
            <TabsTrigger value="capacity">Team Capacity</TabsTrigger>
            <TabsTrigger value="entries">Time Entries</TabsTrigger>
          </TabsList>

          <TabsContent value="capacity">
            <Card>
              <CardHeader>
                <CardTitle>This Week's Capacity</CardTitle>
                <CardDescription>Based on {STANDARD_WEEKLY_HOURS}h standard work week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeeWorkload.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No active employees</p>
                  ) : (
                    employeeWorkload.map(emp => (
                      <div key={emp.id} className="flex items-center gap-4">
                        <div className="w-40 flex-shrink-0">
                          <p className="font-medium text-sm">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.job_title || emp.department || 'No role'}</p>
                        </div>
                        <div className="flex-1">
                          <Progress value={emp.capacity} className="h-3" />
                        </div>
                        <div className="w-24 text-right text-sm">
                          {emp.totalHours}h / {STANDARD_WEEKLY_HOURS}h
                        </div>
                        <div className="w-20">
                          {emp.onLeave ? (
                            <Badge variant="secondary">{emp.leaveType || 'Leave'}</Badge>
                          ) : emp.capacity >= 90 ? (
                            <Badge variant="destructive">Full</Badge>
                          ) : emp.capacity >= 60 ? (
                            <Badge variant="default">Busy</Badge>
                          ) : (
                            <Badge variant="secondary">Available</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entries">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!timeEntries || timeEntries.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No time entries logged yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      timeEntries.slice(0, 50).map(entry => {
                        const emp = employees?.find(e => e.id === entry.employee_id);
                        const proj = projects?.find(p => p.id === entry.project_id);
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>{emp ? `${emp.first_name} ${emp.last_name}` : '-'}</TableCell>
                            <TableCell>{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell>{entry.hours}h</TableCell>
                            <TableCell>{proj?.name || '-'}</TableCell>
                            <TableCell>{entry.billable ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{entry.description || '-'}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => deleteEntry.mutate(entry.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
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
