import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MFAStatus {
  isEnabled: boolean;
  isLoading: boolean;
  factorId: string | null;
}

export function useMFA() {
  const [status, setStatus] = useState<MFAStatus>({
    isEnabled: false,
    isLoading: true,
    factorId: null,
  });

  const checkMFAStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const verifiedFactor = data.totp.find((f) => f.status === 'verified');
      setStatus({
        isEnabled: !!verifiedFactor,
        isLoading: false,
        factorId: verifiedFactor?.id ?? null,
      });
    } catch {
      setStatus({ isEnabled: false, isLoading: false, factorId: null });
    }
  }, []);

  useEffect(() => {
    checkMFAStatus();
  }, [checkMFAStatus]);

  const enrollMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    });
    if (error) throw error;
    return data;
  };

  const verifyAndActivate = async (factorId: string, code: string) => {
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) throw challenge.error;

    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });
    if (verify.error) throw verify.error;

    await checkMFAStatus();
    return verify.data;
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    await checkMFAStatus();
  };

  return {
    ...status,
    checkMFAStatus,
    enrollMFA,
    verifyAndActivate,
    unenrollMFA,
  };
}
