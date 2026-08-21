import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getAdminNavItemsForRole, getAdminShellTitle } from "@/lib/admin-access";
import { effectiveAdminStaffRoleKey } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { logout, auth } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navItems = getAdminNavItemsForRole(effectiveAdminStaffRoleKey(auth));
  const shellTitle = getAdminShellTitle(effectiveAdminStaffRoleKey(auth));

  const handleLogout = async () => {
    await logout();
    await navigate({ to: "/admin/login" });
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {SITE.name}
            </p>
            <p className="text-sm font-semibold">{shellTitle}</p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.to;

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link to={item.to}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Public site">
                <Link to="/">
                  <span className="text-xs">View public site</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/90 px-3 shadow-sm backdrop-blur sm:px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 hidden h-4 sm:block" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:gap-4">
            <p className="min-w-0 truncate text-xs text-muted-foreground sm:text-sm">
              {auth?.email ?? "Administrator"}
              {auth?.staffRoleKey ? ` · ${shellTitle}` : null}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>
        <div className="portal-shell-bg flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
