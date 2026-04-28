import { Outlet, useParams } from 'react-router-dom';
import { CompanyLayout } from './CompanyLayout';
import { useApplyCompanyBranding } from '@/hooks/useCompanyBranding';

export function CompanyLayoutRoute() {
  const { companyId } = useParams<{ companyId: string }>();
  useApplyCompanyBranding(companyId);

  return (
    <CompanyLayout>
      <Outlet />
    </CompanyLayout>
  );
}
