import { Outlet } from 'react-router-dom';
import { CompanyLayout } from './CompanyLayout';

export function CompanyLayoutRoute() {
  return (
    <CompanyLayout>
      <Outlet />
    </CompanyLayout>
  );
}
