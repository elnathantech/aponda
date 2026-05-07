import { useParams, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  Building2,
  Users,
  PoundSterling,
  FileText,
  FolderOpen,
  Receipt,
  Clock,
  TrendingUp,
  CalendarDays,
  BarChart3,
  Calculator,
  Settings,
  Zap,
  LayoutDashboard,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useCompany } from '@/hooks/useCompany';

export function CompanySidebar() {
  const { companyId } = useParams<{ companyId: string }>();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { data: company } = useCompany(companyId);
  const location = useLocation();

  const base = `/company/${companyId}`;

  const mainItems = [
    { title: 'Overview', url: base, icon: LayoutDashboard, end: true },
    { title: 'Employees', url: `${base}/employees`, icon: Users },
    { title: 'Payroll', url: `${base}/payroll`, icon: PoundSterling },
    { title: 'Projects', url: `${base}/projects`, icon: FolderOpen },
    { title: 'Invoices', url: `${base}/invoices`, icon: Receipt },
    { title: 'Leave', url: `${base}/leave`, icon: CalendarDays },
  ];

  const financeItems = [
    { title: 'Cashflow', url: `${base}/cashflow`, icon: TrendingUp },
    { title: 'Revenue', url: `${base}/revenue`, icon: BarChart3 },
    { title: 'Forecasting', url: `${base}/forecasting`, icon: Calculator },
  ];

  const otherItems = [
    { title: 'Reports', url: `${base}/reports`, icon: FileText },
    { title: 'Workload', url: `${base}/workload`, icon: Clock },
    { title: 'Automation', url: `${base}/automation`, icon: Zap },
    { title: 'Settings', url: `${base}/settings`, icon: Settings },
  ];

  const isActive = (url: string, end?: boolean) => {
    if (end) return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  const renderItems = (items: typeof mainItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive(item.url, (item as any).end)}>
            <NavLink
              to={item.url}
              end={(item as any).end}
              className="hover:bg-sidebar-accent/50"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2 overflow-hidden">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={`${company.name} logo`}
              className="h-7 w-7 shrink-0 rounded object-contain bg-background"
            />
          ) : company?.brand_avatar ? (
            <div
              className="h-7 w-7 shrink-0 rounded flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: company.brand_color || 'hsl(var(--primary))' }}
            >
              {company.brand_avatar}
            </div>
          ) : (
            <Building2 className="h-5 w-5 shrink-0 text-primary" />
          )}
          {!collapsed && (
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              {company?.name ?? 'Company'}
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(mainItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Finance</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(financeItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(otherItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
