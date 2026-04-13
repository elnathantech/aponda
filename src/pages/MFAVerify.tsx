import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function MFAVerify() {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setIsVerifying(true);

    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factors.totp.find((f) => f.status === 'verified');
      if (!totpFactor) {
        toast.error('No MFA factor found');
        navigate('/auth');
        return;
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      toast.success('Verification successful!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid verification code');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Two-Factor Verification</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mfa-verify-code">Verification Code</Label>
            <Input
              id="mfa-verify-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
            className="w-full"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            Verify
          </Button>

          <Button variant="ghost" className="w-full" onClick={handleSignOut}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Sign in with a different account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
