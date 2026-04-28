/**
 * AppSidebar Component
 * 
 * Vertical navigation sidebar that replaces the horizontal AppHeader when 
 * navigation_type global setting is set to 'vertical'.
 * 
 * Features:
 * - Collapsible sidebar with icon-only mode
 * - Full keyboard navigation support
 * - ARIA landmarks and accessibility compliance
 * - Role-based navigation items
 * - Responsive mobile behavior (sheet overlay)
 * - Skip links for accessibility
 * - User information and logout
 * - Language toggle integration
 */

import React, { useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Users, FileText, Settings, User, LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import LanguageToggle from '@/components/LanguageToggle';

interface AppSidebarProps {
  className?: string;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ className }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Helper function to determine if a path is active
  const isActive = (path: string): boolean => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: t('auth.logoutSuccess'),
        description: t('auth.logoutMessage'),
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: t('auth.error'),
        description: t('auth.logoutError'),
        variant: 'destructive',
      });
    }
  };

  const announceStateChange = (isExpanded: boolean) => {
    const announcement = isExpanded ? 'Navigation expanded' : 'Navigation collapsed';
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = announcement;
    document.body.appendChild(liveRegion);
    setTimeout(() => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);
      }
    }, 1000);
  };

  // Handle sidebar state changes for announcements
  React.useEffect(() => {
    announceStateChange(state === 'expanded');
  }, [state]);

  return (
    <Sidebar
      className={className}
      collapsible="icon"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50 focus:z-[100]"
      >
        {t('accessibility.skipToContent')}
      </a>

      {/* Header with Logo */}
      <SidebarHeader role="banner">
        <Link to="/" className="min-w-0 overflow-hidden" aria-label={`${t('nav.brandName')} Home`}>
          <img
            src="/logo_horizontal.png"
            alt="TPG Reports Logo"
            className={`transition-all duration-200 shrink-0 ${state === 'collapsed' ? 'h-6 w-6' : 'h-7'}`}
          />
        </Link>
        <SidebarSeparator />
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarMenu role="list">
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/dashboard')}
                tooltip={state === 'collapsed' ? t('app.dashboard') : undefined}
              >
                <Link to="/dashboard" aria-current={isActive('/dashboard') ? 'page' : undefined}>
                  <Home className="h-4 w-4" />
                  <span>{t('app.dashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/workspace')}
                tooltip={state === 'collapsed' ? t('workspace.title') : undefined}
              >
                <Link to="/workspace" aria-current={isActive('/workspace') ? 'page' : undefined}>
                  <BookOpen className="h-4 w-4" />
                  <span>{t('workspace.title')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {user && user.role === 'secretary' && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/admin/departments')}
                  tooltip={state === 'collapsed' ? t('app.manageDepartments') : undefined}
                >
                  <Link to="/admin/departments" aria-current={isActive('/admin/departments') ? 'page' : undefined}>
                    <Users className="h-4 w-4" />
                    <span>{t('app.manageDepartments')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/admin/report-templates')}
                  tooltip={state === 'collapsed' ? t('app.reportTemplates') : undefined}
                >
                  <Link to="/admin/report-templates" aria-current={isActive('/admin/report-templates') ? 'page' : undefined}>
                    <FileText className="h-4 w-4" />
                    <span>{t('app.reportTemplates')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/admin/users')}
                  tooltip={state === 'collapsed' ? t('app.manageUsers') : undefined}
                >
                  <Link to="/admin/users" aria-current={isActive('/admin/users') ? 'page' : undefined}>
                    <Settings className="h-4 w-4" />
                    <span>{t('app.manageUsers')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </>
          )}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter role="contentinfo">
        <SidebarSeparator />
        
        {/* Language Toggle */}
        <div className={`px-2 py-1 ${state === 'collapsed' ? 'flex justify-center' : ''}`}>
          <LanguageToggle />
        </div>

        {/* User Info */}
        {user && (
          <div className="px-2 py-2">
            {state === 'expanded' ? (
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="font-medium text-sm truncate" title={user.name || user.email}>
                    {user.name || user.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate" title={`${user.role}${user.department?.name ? ` • ${user.department.name}` : ''}`}>
                    {user.role} {user.department?.name && `• ${user.department.name}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  aria-label={t('app.logout')}
                  className="h-8 w-8 shrink-0 hover:bg-sidebar-accent"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  aria-label={t('app.logout')}
                  tooltip={t('app.logout')}
                  className="h-8 w-8 hover:bg-sidebar-accent"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Keyboard Shortcut Hint */}
        {state === 'expanded' && (
          <div className="px-2 py-1 text-xs text-muted-foreground border-t border-sidebar-border">
            <div className="flex items-center gap-1 justify-center">
              <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">⌘B</kbd>
              <span>{t('nav.toggleSidebar')}</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;