import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, ArrowLeft, Trash2, Mail, Calendar, User, MessageSquare, RefreshCw,
  Users, Building2, BarChart3, Shield, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError } from "@/lib/errorHandler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

interface CompanyInfo {
  id: string;
  name: string;
  user_id: string;
  company_number: string | null;
  vat_number: string | null;
  created_at: string;
  employee_count: number;
  owner_email: string | null;
}

interface SystemStats {
  totalUsers: number;
  totalCompanies: number;
  totalEmployees: number;
  totalInvoices: number;
  totalProjects: number;
  recentSignups: number;
}

const Admin = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [stats, setStats] = useState<SystemStats>({ totalUsers: 0, totalCompanies: 0, totalEmployees: 0, totalInvoices: 0, totalProjects: 0, recentSignups: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [adminVerified, setAdminVerified] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const verifyAdminRole = useCallback(async () => {
    if (!user) { setVerificationComplete(true); return; }
    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (error) { logError('Admin:verifyAdminRole', error); setAdminVerified(false); }
      else { setAdminVerified(!!data); }
    } catch (error) { logError('Admin:verifyAdminRole', error); setAdminVerified(false); }
    finally { setVerificationComplete(true); }
  }, [user]);

  useEffect(() => { if (!isLoading) verifyAdminRole(); }, [isLoading, user, verifyAdminRole]);

  useEffect(() => {
    if (!verificationComplete) return;
    if (!user) navigate("/auth");
    else if (!adminVerified) { toast.error("Access denied. Admin privileges required."); navigate("/"); }
  }, [verificationComplete, user, adminVerified, navigate]);

  useEffect(() => {
    if (!adminVerified) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user?.id).eq("role", "admin").maybeSingle();
      if (!data) { setAdminVerified(false); toast.error("Admin session expired"); navigate("/"); }
    }, 300000);
    return () => clearInterval(interval);
  }, [adminVerified, user, navigate]);

  useEffect(() => { if (adminVerified) fetchAllData(); }, [adminVerified]);

  const fetchAllData = async () => {
    setIsLoadingData(true);
    await Promise.all([fetchSubmissions(), fetchUsers(), fetchCompanies(), fetchStats()]);
    setIsLoadingData(false);
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) { logError('Admin:fetchSubmissions', error); }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("*");
      if (rolesError) throw rolesError;

      const userList: UserProfile[] = (profiles || []).map(p => ({
        ...p,
        roles: (roles || []).filter(r => r.user_id === p.user_id).map(r => r.role),
      }));
      setUsers(userList);
    } catch (error) { logError('Admin:fetchUsers', error); }
  };

  const fetchCompanies = async () => {
    try {
      const { data: companiesData, error: companiesError } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
      if (companiesError) throw companiesError;

      const { data: employees, error: empError } = await supabase.from("employees").select("company_id");
      if (empError) throw empError;

      const { data: profiles } = await supabase.from("profiles").select("user_id, email");

      const companyList: CompanyInfo[] = (companiesData || []).map(c => ({
        ...c,
        employee_count: (employees || []).filter(e => e.company_id === c.id).length,
        owner_email: (profiles || []).find(p => p.user_id === c.user_id)?.email || null,
      }));
      setCompanies(companyList);
    } catch (error) { logError('Admin:fetchCompanies', error); }
  };

  const fetchStats = async () => {
    try {
      const [profilesRes, companiesRes, employeesRes, invoicesRes, projectsRes] = await Promise.all([
        supabase.from("profiles").select("created_at"),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
      ]);

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentSignups = (profilesRes.data || []).filter(p => p.created_at >= sevenDaysAgo).length;

      setStats({
        totalUsers: profilesRes.data?.length || 0,
        totalCompanies: companiesRes.count || 0,
        totalEmployees: employeesRes.count || 0,
        totalInvoices: invoicesRes.count || 0,
        totalProjects: projectsRes.count || 0,
        recentSignups,
      });
    } catch (error) { logError('Admin:fetchStats', error); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
      if (error) throw error;
      setSubmissions(prev => prev.filter(s => s.id !== id));
      toast.success("Submission deleted");
    } catch { toast.error("Failed to delete submission"); }
  };

  const handleToggleAdmin = async (userId: string, currentRoles: string[]) => {
    const isAdmin = currentRoles.includes("admin");
    try {
      if (isAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
        toast.success("Admin role removed");
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" as const });
        if (error) throw error;
        toast.success("Admin role granted");
      }
      fetchUsers();
    } catch { toast.error("Failed to update role"); }
  };

  if (isLoading || !verificationComplete || !adminVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Companies", value: stats.totalCompanies, icon: Building2, color: "text-accent" },
    { label: "Employees", value: stats.totalEmployees, icon: User, color: "text-primary" },
    { label: "Invoices", value: stats.totalInvoices, icon: BarChart3, color: "text-accent" },
    { label: "Projects", value: stats.totalProjects, icon: Activity, color: "text-primary" },
    { label: "Signups (7d)", value: stats.recentSignups, icon: Users, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-lg p-4 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />Users
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />Companies
              </TabsTrigger>
              <TabsTrigger value="submissions" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />Submissions
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">User Management</h2>
                <Button variant="outline" size="sm" onClick={fetchUsers}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
              </div>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                    ) : users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {u.roles.map(r => (
                              <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>
                                {r === "admin" && <Shield className="w-3 h-3 mr-1" />}{r}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {u.user_id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  {u.roles.includes("admin") ? "Remove Admin" : "Make Admin"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{u.roles.includes("admin") ? "Remove admin role?" : "Grant admin role?"}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.roles.includes("admin") 
                                      ? `This will remove admin privileges from ${u.full_name || u.email}.`
                                      : `This will grant full admin access to ${u.full_name || u.email}.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleToggleAdmin(u.user_id, u.roles)}>Confirm</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Companies Tab */}
            <TabsContent value="companies">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">All Companies</h2>
                <Button variant="outline" size="sm" onClick={fetchCompanies}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
              </div>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Company #</TableHead>
                      <TableHead>VAT</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No companies found</TableCell></TableRow>
                    ) : companies.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />{c.name}
                          </div>
                        </TableCell>
                        <TableCell>{c.owner_email || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{c.company_number || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{c.vat_number || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{c.employee_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Contact Submissions</h2>
                  <p className="text-sm text-muted-foreground">{submissions.length} total</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchSubmissions}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border border-border">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No submissions yet</h3>
                  <p className="text-muted-foreground">Contact form submissions will appear here.</p>
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map(submission => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{submission.name}</div>
                          </TableCell>
                          <TableCell>
                            <a href={`mailto:${submission.email}`} className="text-primary hover:underline">{submission.email}</a>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">{submission.subject || "—"}</TableCell>
                          <TableCell className="max-w-[200px]">
                            <button onClick={() => setSelectedSubmission(submission)} className="text-left truncate hover:text-primary transition-colors">
                              {submission.message.substring(0, 50)}...
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />{new Date(submission.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete submission?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete the submission from {submission.name}.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(submission.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Message Detail Dialog */}
          <AlertDialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Message from {selectedSubmission?.name}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${selectedSubmission?.email}`} className="text-primary hover:underline">{selectedSubmission?.email}</a>
                    </div>
                    {selectedSubmission?.subject && <div className="text-sm"><strong>Subject:</strong> {selectedSubmission.subject}</div>}
                    <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-foreground">{selectedSubmission?.message}</div>
                    <div className="text-xs text-muted-foreground">Submitted on {selectedSubmission && new Date(selectedSubmission.created_at).toLocaleString()}</div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <a href={`mailto:${selectedSubmission?.email}`}><Mail className="w-4 h-4 mr-2" />Reply</a>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
