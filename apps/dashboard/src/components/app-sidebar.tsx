'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, ShieldAlert, Sparkles, Users } from 'lucide-react';

import { getEmployee } from '@/lib/employees';
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
  SidebarRail,
} from '@/components/ui/sidebar';

/** Employee sub-routes, mirroring the old NavLinks. */
const EMPLOYEE_ROUTES = [
  { segment: '', label: 'Dashboard', icon: LayoutDashboard },
  { segment: '/timeline', label: 'Timeline', icon: Activity },
  { segment: '/patterns', label: 'Patterns', icon: Sparkles },
  { segment: '/anti-patterns', label: 'Anti-Patterns', icon: ShieldAlert },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const employeeId = pathname.match(/^\/employee\/([^/]+)/)?.[1];
  const employee = employeeId ? getEmployee(employeeId) : undefined;

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/" className="flex items-baseline gap-2 px-2 py-1.5">
          <span className="font-serif text-2xl font-semibold tracking-tight">crux</span>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-sidebar-foreground/60">
            usage report
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/'}>
                  <Link href="/">
                    <Users />
                    <span>All employees</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {employeeId && (
          <SidebarGroup>
            <SidebarGroupLabel>{employee?.name ?? employeeId}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {EMPLOYEE_ROUTES.map(({ segment, label, icon: Icon }) => {
                  const href = `/employee/${employeeId}${segment}`;
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton asChild isActive={pathname === href}>
                        <Link href={href}>
                          <Icon />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
