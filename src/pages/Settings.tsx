import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany, useUpdateCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Building2, 
  ArrowLeft, 
  Save,
  Loader2,
  FileText,
  Wallet,
  MapPin,
  Building
} from 'lucide-react';
import { BrandingCard } from '@/components/company/BrandingCard';

interface Address {
  line1: string;
  line2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
}

const emptyAddress: Address = {
  line1: '',
  line2: '',
  city: '',
  county: '',
  postcode: '',
  country: 'United Kingdom',
};

export default function SettingsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: company, isLoading: companyLoading } = useCompany(companyId);
  const updateCompany = useUpdateCompany();
  
  const [formData, setFormData] = useState({
    name: '',
    company_number: '',
    vat_number: '',
    paye_reference: '',
    accounts_office_reference: '',
    pension_provider: '',
    pension_employer_contribution: 3,
    pension_employee_contribution: 5,
    registered_address: { ...emptyAddress },
    trading_address: { ...emptyAddress },
  });
  
  const [useRegisteredAsTradingAddress, setUseRegisteredAsTradingAddress] = useState(false);
  
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
        vat_number: company.vat_number || '',
        paye_reference: company.paye_reference || '',
        accounts_office_reference: company.accounts_office_reference || '',
        pension_provider: company.pension_provider || '',
        pension_employer_contribution: Number(company.pension_employer_contribution) || 3,
        pension_employee_contribution: Number(company.pension_employee_contribution) || 5,
        registered_address: company.registered_address ? { ...emptyAddress, ...(company.registered_address as object) } : { ...emptyAddress },
        trading_address: company.trading_address ? { ...emptyAddress, ...(company.trading_address as object) } : { ...emptyAddress },
      });
    }
  }, [company]);
  
  const handleSave = async () => {
    if (!companyId) return;
    
    try {
      await updateCompany.mutateAsync({
        id: companyId,
        name: formData.name,
        company_number: formData.company_number || null,
        vat_number: formData.vat_number || null,
        paye_reference: formData.paye_reference || null,
        accounts_office_reference: formData.accounts_office_reference || null,
        pension_provider: formData.pension_provider || null,
        pension_employer_contribution: formData.pension_employer_contribution,
        pension_employee_contribution: formData.pension_employee_contribution,
        registered_address: formData.registered_address,
        trading_address: useRegisteredAsTradingAddress 
          ? formData.registered_address 
          : formData.trading_address,
      });
      
      toast.success('Company settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    }
  };
  
  const updateRegisteredAddress = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      registered_address: {
        ...prev.registered_address,
        [field]: value,
      },
    }));
  };
  
  const updateTradingAddress = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      trading_address: {
        ...prev.trading_address,
        [field]: value,
      },
    }));
  };
  
  if (authLoading || companyLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Company Settings</h1>
            <p className="text-sm text-muted-foreground">{company?.name}</p>
          </div>
          <Button onClick={handleSave} disabled={updateCompany.isPending}>
            {updateCompany.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Workspace Branding */}
          {company && <BrandingCard company={company} />}

          {/* Company Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>Company Details</CardTitle>
              </div>
              <CardDescription>
                Basic company information and registration details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_number">Companies House Number</Label>
                  <Input
                    id="company_number"
                    value={formData.company_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_number: e.target.value }))}
                    placeholder="e.g., 12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat_number">VAT Number</Label>
                  <Input
                    id="vat_number"
                    value={formData.vat_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, vat_number: e.target.value }))}
                    placeholder="e.g., GB123456789"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* PAYE & HMRC */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>PAYE & HMRC Details</CardTitle>
              </div>
              <CardDescription>
                Configure your PAYE reference and HMRC account details for payroll submissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paye_reference">PAYE Reference</Label>
                  <Input
                    id="paye_reference"
                    value={formData.paye_reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, paye_reference: e.target.value }))}
                    placeholder="e.g., 123/AB12345"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: 3 digits / 2 letters + 5 digits (e.g., 123/AB12345)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accounts_office_reference">Accounts Office Reference</Label>
                  <Input
                    id="accounts_office_reference"
                    value={formData.accounts_office_reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, accounts_office_reference: e.target.value }))}
                    placeholder="e.g., 123PA00012345"
                  />
                  <p className="text-xs text-muted-foreground">
                    13-character reference from HMRC
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pension Scheme */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <CardTitle>Pension Scheme</CardTitle>
              </div>
              <CardDescription>
                Configure your workplace pension scheme and contribution rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pension_provider">Pension Provider</Label>
                <Input
                  id="pension_provider"
                  value={formData.pension_provider}
                  onChange={(e) => setFormData(prev => ({ ...prev, pension_provider: e.target.value }))}
                  placeholder="e.g., NEST, The People's Pension, NOW: Pensions"
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pension_employer">Employer Contribution (%)</Label>
                  <Input
                    id="pension_employer"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.pension_employer_contribution}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      pension_employer_contribution: parseFloat(e.target.value) || 0 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 3% required by auto-enrolment
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pension_employee">Employee Contribution (%)</Label>
                  <Input
                    id="pension_employee"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.pension_employee_contribution}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      pension_employee_contribution: parseFloat(e.target.value) || 0 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 5% required by auto-enrolment
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Total contribution:</strong>{' '}
                  {formData.pension_employer_contribution + formData.pension_employee_contribution}%
                  {formData.pension_employer_contribution + formData.pension_employee_contribution < 8 && (
                    <span className="text-destructive ml-2">
                      (Below 8% minimum requirement)
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Registered Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Registered Address</CardTitle>
              </div>
              <CardDescription>
                The official registered address of your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={formData.registered_address.line1}
                    onChange={(e) => updateRegisteredAddress('line1', e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address Line 2</Label>
                  <Input
                    value={formData.registered_address.line2}
                    onChange={(e) => updateRegisteredAddress('line2', e.target.value)}
                    placeholder="Building, suite, etc. (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.registered_address.city}
                    onChange={(e) => updateRegisteredAddress('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label>County</Label>
                  <Input
                    value={formData.registered_address.county}
                    onChange={(e) => updateRegisteredAddress('county', e.target.value)}
                    placeholder="County"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postcode</Label>
                  <Input
                    value={formData.registered_address.postcode}
                    onChange={(e) => updateRegisteredAddress('postcode', e.target.value)}
                    placeholder="e.g., SW1A 1AA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={formData.registered_address.country}
                    onChange={(e) => updateRegisteredAddress('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Trading Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Trading Address</CardTitle>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRegisteredAsTradingAddress}
                    onChange={(e) => setUseRegisteredAsTradingAddress(e.target.checked)}
                    className="rounded border-input"
                  />
                  Same as registered address
                </label>
              </div>
              <CardDescription>
                The address where your business operates from
              </CardDescription>
            </CardHeader>
            {!useRegisteredAsTradingAddress && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address Line 1</Label>
                    <Input
                      value={formData.trading_address.line1}
                      onChange={(e) => updateTradingAddress('line1', e.target.value)}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address Line 2</Label>
                    <Input
                      value={formData.trading_address.line2}
                      onChange={(e) => updateTradingAddress('line2', e.target.value)}
                      placeholder="Building, suite, etc. (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={formData.trading_address.city}
                      onChange={(e) => updateTradingAddress('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>County</Label>
                    <Input
                      value={formData.trading_address.county}
                      onChange={(e) => updateTradingAddress('county', e.target.value)}
                      placeholder="County"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postcode</Label>
                    <Input
                      value={formData.trading_address.postcode}
                      onChange={(e) => updateTradingAddress('postcode', e.target.value)}
                      placeholder="e.g., SW1A 1AA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={formData.trading_address.country}
                      onChange={(e) => updateTradingAddress('country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
