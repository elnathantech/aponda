import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShieldCheck, ShieldAlert, Loader2, Copy, Check, Smartphone } from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';
import { toast } from 'sonner';

export function MFASetupCard() {
  const { isEnabled, isLoading, factorId, enrollMFA, verifyAndActivate, unenrollMFA } = useMFA();
  const [enrollData, setEnrollData] = useState<{ id: string; totp: { qr_code: string; secret: string; uri: string } } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const data = await enrollMFA();
      setEnrollData(data);
      setShowDialog(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start MFA setup');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (!enrollData || verifyCode.length !== 6) return;
    setIsVerifying(true);
    try {
      await verifyAndActivate(enrollData.id, verifyCode);
      toast.success('Two-factor authentication enabled!');
      setShowDialog(false);
      setEnrollData(null);
      setVerifyCode('');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!factorId) return;
    setIsDisabling(true);
    try {
      await unenrollMFA(factorId);
      toast.success('Two-factor authentication disabled');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable MFA');
    } finally {
      setIsDisabling(false);
    }
  };

  const copySecret = () => {
    if (enrollData?.totp.secret) {
      navigator.clipboard.writeText(enrollData.totp.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-500" />
              )}
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
            </div>
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? 'Enabled' : 'Recommended'}
            </Badge>
          </div>
          <CardDescription>
            Add an extra layer of security by requiring a verification code from your authenticator app when you sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEnabled && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Recommended:</strong> Protect your account with two-factor authentication. It takes less than a minute to set up.
              </AlertDescription>
            </Alert>
          )}

          {isEnabled ? (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Authenticator App</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Your account is protected with TOTP-based 2FA</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisable}
                disabled={isDisabling}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {isDisabling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleEnroll} disabled={isEnrolling} className="w-full sm:w-auto">
              {isEnrolling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              Enable Two-Factor Authentication
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setEnrollData(null); setVerifyCode(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          {enrollData && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl border">
                  <img
                    src={enrollData.totp.qr_code}
                    alt="Scan this QR code with your authenticator app"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Manual entry */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Can't scan? Enter this key manually:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all select-all">
                    {enrollData.totp.secret}
                  </code>
                  <Button variant="outline" size="icon" onClick={copySecret} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Verification code */}
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Enter the 6-digit code from your app</Label>
                <Input
                  id="mfa-code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  autoComplete="one-time-code"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={isVerifying || verifyCode.length !== 6}
                className="w-full"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Verify & Enable
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
