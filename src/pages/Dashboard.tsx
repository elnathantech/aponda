import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { useCompanies, useCreateCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  FileText, 
  PoundSterling, 
  Plus,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Dashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const createCompany = useCreateCompany();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  
  const handleCreateCompany = async () => {
    if (!companyName.trim()) return;
    
    await createCompany.mutateAsync({ name: companyName.trim() });
    setCompanyName('');
    setIsCreateOpen(false);
  };
  
  if (authLoading || companiesLoading) {
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Aponda Payroll</h1>
              <p className="text-sm text-muted-foreground">SME Payroll & HR Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            Manage your companies, employees, and payroll all in one place.
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Companies</p>
                  <p className="text-2xl font-bold">{companies?.length || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payroll</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <PoundSterling className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reports Due</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Companies Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Your Companies</h3>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Enter company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCompany()}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateCompany}
                  disabled={createCompany.isPending || !companyName.trim()}
                >
                  {createCompany.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Company
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {companies && companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <Card 
                key={company.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/company/${company.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>
                    {company.paye_reference || 'PAYE not configured'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>0 employees</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>Setup pending</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first company to manage payroll.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Company
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
