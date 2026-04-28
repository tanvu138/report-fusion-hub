import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import AppSidebar from './AppSidebar';
import Breadcrumbs from './Breadcrumbs';
import NetworkStatus from '../NetworkStatus';
import ErrorBoundary from '../ErrorBoundary';
import useOffline from '@/hooks/useOffline';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { t } = useLanguage();
  const { isOnline, processQueue } = useOffline();
  const currentYear = new Date().getFullYear();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-background flex w-full">
        <ErrorBoundary fallback={<SidebarErrorFallback />}>
          <AppSidebar />
        </ErrorBoundary>

        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            {/* Header with sidebar trigger and breadcrumbs */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 navigation-header-separation">
              <div className="container flex items-center gap-4 py-2 min-w-0">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <Breadcrumbs />
                </div>
                <div id="header-actions" className="flex items-center gap-2 shrink-0" />
              </div>
            </header>

            {/* Network status */}
            <NetworkStatus onRetry={processQueue} className="mx-4 mt-2" />

            {/* Main content */}
            <main
              id="main-content"
              className="container flex-1 py-3 md:py-4 min-w-0"
              role="main"
              aria-label="Main content"
            >
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-4 mt-auto" role="contentinfo">
              <div className="container">
                <p className="text-center text-sm text-muted-foreground">
                  {t('app.footer').replace('{0}', currentYear.toString())}
                </p>
              </div>
            </footer>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

// Error fallback component for sidebar
const SidebarErrorFallback = () => {
  return (
    <div className="w-64 h-full bg-background border-r p-4">
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-destructive">Navigation Error</h3>
        <p className="text-sm text-muted-foreground">
          Unable to load sidebar navigation. Please refresh the page.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </div>
    </div>
  );
};

export default MainLayout;
