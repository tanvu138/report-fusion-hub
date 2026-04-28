# ARCHITECTURE-VERTICAL-NAVIGATION.md
_Last Updated: 2025-07-02_

> **Comprehensive architectural plan for migrating from horizontal top navigation to vertical sidebar navigation**  
> **Target Audience**: AI engineers implementing the vertical navigation system  
> **Complexity**: Medium (4-5 hours implementation)

---

## Executive Summary

### Objective
Migrate the current horizontal top navigation (AppHeader) to a collapsible vertical sidebar to maximize vertical screen real estate for report viewing and editing.

### Business Context
- **User Base**: ~100 users, primarily desktop (mobile for quick viewing)
- **Primary Use Case**: Report viewing/editing where vertical space is premium
- **Current Pain Point**: Top navigation consumes 64px of vertical space
- **Expected Benefit**: More content visible, better navigation organization

### Implementation Approach
- **Strategy**: Feature flag deployment with backward compatibility
- **Timeline**: 2-3 hours implementation + 1 hour testing
- **Risk Level**: Low (existing ErrorBoundary, fallback to current navigation)

---

## Technical Requirements

### Browser Support Matrix
- **Primary**: Chrome/Brave/Edge (< 1 year old)
- **Secondary**: Modern browsers with CSS Grid/Flexbox support
- **Not Required**: Internet Explorer, legacy browsers

### Performance Constraints
- **Bundle Size**: No strict constraints (using Vite optimization)
- **Runtime Performance**: Maintain current responsiveness
- **Memory Usage**: Minimal increase (single sidebar component)

### Accessibility Compliance (WCAG 2.1 AA)
- **Skip Links**: Direct navigation to main content
- **ARIA Landmarks**: Proper navigation structure
- **Focus Management**: Keyboard navigation support
- **Screen Reader Support**: Announcements for state changes
- **High Contrast Mode**: Visual compatibility

---

## Implementation Architecture

### Component Structure
```
Frontend (src/):
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx          # [KEEP] Fallback navigation
│   │   ├── AppSidebar.tsx         # [NEW] Vertical navigation
│   │   └── MainLayout.tsx         # [MODIFY] Conditional rendering
│   ├── admin/
│   │   └── NavigationSettings.tsx # [NEW] Admin toggle interface
│   └── ui/
│       └── sidebar.tsx            # [EXISTS] shadcn/ui components
├── contexts/
│   └── GlobalSettingsContext.tsx  # [NEW] Global settings context
├── utils/
│   └── globalSettings.ts          # [NEW] Global settings API
└── styles/
    └── sidebar.css                # [NEW] Sidebar-specific styles

Backend (server/):
├── routes/
│   └── admin/
│       └── settings.js            # [NEW] Global settings API routes
├── models/
│   └── GlobalSetting.js           # [NEW] Settings database model
└── middleware/
    └── adminOnly.js               # [EXISTS] Admin role verification
```

### Backend API Implementation
```typescript
// server/routes/admin/settings.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../../middleware/auth');

const prisma = new PrismaClient();

// GET /api/admin/settings/:key
router.get('/:key', requireAuth, requireRole('secretary'), async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await prisma.globalSetting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Error fetching global setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/settings/:key
router.put('/:key', requireAuth, requireRole('secretary'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (!value || typeof value !== 'string') {
      return res.status(400).json({ error: 'Value is required and must be a string' });
    }
    
    const setting = await prisma.globalSetting.upsert({
      where: { key },
      update: { 
        value,
        updatedAt: new Date(),
        updatedBy: req.user.id
      },
      create: { 
        key, 
        value,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }
    });
    
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Error updating global setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/settings (list all settings)
router.get('/', requireAuth, requireRole('secretary'), async (req, res) => {
  try {
    const settings = await prisma.globalSetting.findMany({
      select: {
        key: true,
        value: true,
        updatedAt: true,
        updatedBy: true
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching global settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### Database Schema Addition
```sql
-- Add to Prisma schema (schema.prisma)
model GlobalSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String
  updatedBy String
  
  @@map("global_settings")
}
```

### Database Migration
```sql
-- Migration: Add global_settings table
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "global_settings_key_key" ON "global_settings"("key");

-- Insert default navigation setting
INSERT INTO "global_settings" ("id", "key", "value", "createdBy", "updatedBy") 
VALUES ('default_nav', 'navigation_type', 'horizontal', 'system', 'system');
```

### Global Settings System
```typescript
// utils/globalSettings.ts
export const GLOBAL_SETTINGS = {
  NAVIGATION_TYPE: 'navigation_type',
} as const;

export type NavigationType = 'horizontal' | 'vertical';

// API functions for global settings
export const getGlobalSetting = async (setting: string): Promise<string | null> => {
  try {
    const response = await fetch(`/api/admin/settings/${setting}`, {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      return data.value;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch global setting:', error);
    return null;
  }
};

export const setGlobalSetting = async (setting: string, value: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/admin/settings/${setting}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ value }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to set global setting:', error);
    return false;
  }
};

export const getNavigationType = async (): Promise<NavigationType> => {
  const setting = await getGlobalSetting(GLOBAL_SETTINGS.NAVIGATION_TYPE);
  return (setting as NavigationType) || 'horizontal'; // Default to horizontal
};

export const setNavigationType = async (type: NavigationType): Promise<boolean> => {
  return await setGlobalSetting(GLOBAL_SETTINGS.NAVIGATION_TYPE, type);
};
```

### Context for Global Settings
```typescript
// contexts/GlobalSettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getNavigationType, NavigationType } from '@/utils/globalSettings';

interface GlobalSettingsContextType {
  navigationType: NavigationType;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (!context) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
};

export const GlobalSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigationType, setNavigationType] = useState<NavigationType>('horizontal');
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = async () => {
    setIsLoading(true);
    try {
      const type = await getNavigationType();
      setNavigationType(type);
    } catch (error) {
      console.error('Failed to load global settings:', error);
      // Fallback to horizontal navigation
      setNavigationType('horizontal');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <GlobalSettingsContext.Provider value={{ navigationType, isLoading, refreshSettings }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};
```

### Admin Interface Toggle
```typescript
// components/admin/NavigationSettings.tsx
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { setNavigationType, NavigationType } from '@/utils/globalSettings';
import { RefreshCw, Users } from 'lucide-react';

const NavigationSettings: React.FC = () => {
  const { navigationType, isLoading, refreshSettings } = useGlobalSettings();
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  const handleToggle = async () => {
    setIsApplying(true);
    
    try {
      const newType: NavigationType = navigationType === 'vertical' ? 'horizontal' : 'vertical';
      const success = await setNavigationType(newType);
      
      if (success) {
        toast({
          title: "Global Navigation Updated",
          description: `All users will now see ${newType} navigation. Refreshing page...`,
        });

        // Refresh settings and reload page
        await refreshSettings();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error('Failed to update setting');
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update navigation settings. Please try again.",
        variant: "destructive",
      });
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Navigation Settings</CardTitle>
          <CardDescription>Loading current settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Navigation Settings</CardTitle>
        <CardDescription>
          Configure navigation interface for all users in the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            This setting affects all users immediately. Current setting: <strong>{navigationType}</strong> navigation.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="vertical-nav">Vertical Navigation</Label>
            <p className="text-sm text-muted-foreground">
              Use sidebar navigation for more vertical screen space (affects all users)
            </p>
          </div>
          <Switch
            id="vertical-nav"
            checked={navigationType === 'vertical'}
            onCheckedChange={handleToggle}
            disabled={isApplying}
          />
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isApplying ? 'animate-spin' : ''}`} />
            <span className="text-sm text-muted-foreground">
              {isApplying ? 'Applying changes for all users...' : 'Changes apply to all users immediately'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NavigationSettings;
```

### Error Boundary Strategy
```typescript
// Wrap sidebar with specific error boundary
<ErrorBoundary fallback={<SidebarErrorFallback />}>
  <AppSidebar />
</ErrorBoundary>

// Fallback component
const SidebarErrorFallback = () => (
  <div className="w-64 h-full bg-background border-r p-4">
    <Alert variant="destructive">
      <AlertTitle>Navigation Error</AlertTitle>
      <AlertDescription>
        Unable to load sidebar navigation.
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </AlertDescription>
    </Alert>
  </div>
);
```

---

## Detailed Implementation Guide

### Step 1: App Provider Setup

**File**: `src/App.tsx` (wrap with GlobalSettingsProvider)
```typescript
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';  // NEW
import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/components/layout/MainLayout';
import Routes from '@/routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <GlobalSettingsProvider>  {/* NEW: Wrap entire app */}
            <MainLayout>
              <Routes />
            </MainLayout>
            <Toaster />
          </GlobalSettingsProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### Step 2: Database Migration

**Run migration commands**:
```bash
# Add to Prisma schema first, then run:
npx prisma migrate dev --name add-global-settings
npx prisma generate

# Seed initial navigation setting
npx prisma db seed  # or manually insert via SQL
```

### Step 3: Backend API Implementation

**File**: `server/routes/admin/settings.js` (as shown above in Backend API section)

**File**: `server/app.js` (register the route)
```typescript
// Add to existing route registrations
app.use('/api/admin/settings', require('./routes/admin/settings'));
```

### Step 4: Global Settings Implementation

**File**: `src/utils/globalSettings.ts` (as shown above)
**File**: `src/contexts/GlobalSettingsContext.tsx` (as shown above)
```typescript
export const FEATURE_FLAGS = {
  VERTICAL_NAVIGATION: 'vertical_navigation',
} as const;

export const isFeatureEnabled = (flag: keyof typeof FEATURE_FLAGS): boolean => {
  return localStorage.getItem(`feature_${flag}`) === 'true';
};

export const toggleFeature = (flag: keyof typeof FEATURE_FLAGS): void => {
  const currentState = isFeatureEnabled(flag);
  if (currentState) {
    localStorage.removeItem(`feature_${flag}`);
  } else {
    localStorage.setItem(`feature_${flag}`, 'true');
  }
};

// Development helper
export const enableAllFeatures = (): void => {
  Object.values(FEATURE_FLAGS).forEach(flag => {
    localStorage.setItem(`feature_${flag}`, 'true');
  });
};
```

### Step 2: AppSidebar Component

**File**: `src/components/layout/AppSidebar.tsx`
```typescript
import React, { useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Settings, User, LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
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
    setTimeout(() => document.body.removeChild(liveRegion), 1000);
  };

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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
      >
        {t('accessibility.skipToContent')}
      </a>

      {/* Header with Logo */}
      <SidebarHeader role="banner">
        <div className="flex items-center gap-2 px-2 py-2">
          <Link to="/" className="flex items-center gap-2" aria-label="TPG Reports Home">
            <img 
              src="/logo_horizontal.png" 
              alt="TPG Reports Logo" 
              className={`transition-all ${state === 'collapsed' ? 'h-6 w-6' : 'h-8'}`}
            />
            {state === 'expanded' && (
              <span className="font-semibold text-lg">TPG Reports</span>
            )}
          </Link>
        </div>
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
        <div className="px-2 py-1">
          <LanguageToggle />
        </div>

        {/* User Info */}
        {user && (
          <div className="px-2 py-2">
            {state === 'expanded' ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {user.name || user.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.role} {user.department?.name && `• ${user.department.name}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  aria-label={t('app.logout')}
                  className="h-8 w-8 shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label={t('app.logout')}
                tooltip={t('app.logout')}
                className="w-full h-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Keyboard Shortcut Hint */}
        {state === 'expanded' && (
          <div className="px-2 py-1 text-xs text-muted-foreground">
            <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">⌘B</kbd>
            <span className="ml-1">Toggle sidebar</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
```

### Step 3: MainLayout Updates

**File**: `src/components/layout/MainLayout.tsx` (modifications)
```typescript
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import AppHeader from './AppHeader';
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

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { t } = useLanguage();
  const { isOnline, processQueue } = useOffline();
  const { navigationType, isLoading } = useGlobalSettings();
  const currentYear = new Date().getFullYear();

  // Show loading state while fetching global settings
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  // Fallback to horizontal navigation
  if (navigationType === 'horizontal') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 pt-16">
          <NetworkStatus onRetry={processQueue} className="mx-4 mt-2" />
          <div className="border-b border-border bg-muted/30">
            <div className="container py-3">
              <Breadcrumbs />
            </div>
          </div>
          <main 
            id="main-content"
            className="container py-6 md:py-8" 
            role="main" 
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
        <footer className="border-t border-border py-6 mt-auto" role="contentinfo">
          <div className="container">
            <p className="text-center text-sm text-muted-foreground">
              {t('app.footer').replace('{0}', currentYear.toString())}
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Vertical navigation layout
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-background flex w-full">
        <ErrorBoundary fallback={<SidebarErrorFallback />}>
          <AppSidebar />
        </ErrorBoundary>
        
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            {/* Header with sidebar trigger and breadcrumbs */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex items-center gap-4 py-3">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs />
              </div>
            </header>

            {/* Network status */}
            <NetworkStatus onRetry={processQueue} className="mx-4 mt-2" />

            {/* Main content */}
            <main 
              id="main-content"
              className="container flex-1 py-6 md:py-8" 
              role="main" 
              aria-label="Main content"
            >
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-6 mt-auto" role="contentinfo">
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

// Error fallback component
const SidebarErrorFallback = () => {
  const { t } = useLanguage();
  
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
```

### Step 4: CSS Enhancements

**File**: `src/styles/sidebar.css`
```css
/* Sidebar-specific styles */

/* Smooth transitions for sidebar */
.sidebar {
  transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Menu item transitions */
.sidebar-menu-button {
  transition: background-color 150ms ease,
              color 150ms ease,
              transform 150ms ease;
}

.sidebar-menu-button:hover {
  transform: translateX(2px);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .sidebar {
    border-right: 2px solid currentColor;
  }
  
  .sidebar-menu-button:focus {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }
  
  .sidebar-separator {
    background-color: currentColor;
    height: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-menu-button {
    transition: none;
  }
}

/* Focus visible styles */
.sidebar-menu-button:focus-visible {
  outline-offset: 2px;
  outline: 2px solid hsl(var(--ring));
}

/* Skip link styles */
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: 8px 16px;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  text-decoration: none;
  border-radius: 4px;
}

.skip-link:focus {
  left: 10px;
  top: 10px;
}
```

### Step 5: Admin Interface Integration

**File**: `src/pages/AdminSettings.tsx` (or wherever admin settings are located)
```typescript
import NavigationSettings from '@/components/admin/NavigationSettings';

// Add to existing admin settings page
const AdminSettings = () => {
  return (
    <div className="space-y-6">
      {/* Existing admin settings */}
      
      {/* Add navigation settings section */}
      <NavigationSettings />
      
      {/* Other admin settings */}
    </div>
  );
};
```

**Alternative**: Create dedicated admin page
**File**: `src/pages/AdminNavigationSettings.tsx`
```typescript
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import NavigationSettings from '@/components/admin/NavigationSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminNavigationSettings: React.FC = () => {
  const { user } = useAuth();

  // Restrict to secretary role only
  if (!user || user.role !== 'secretary') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Navigation Settings</h1>
          <p className="text-muted-foreground">
            Configure the navigation interface for all users.
          </p>
        </div>

        <NavigationSettings />

        <Card>
          <CardHeader>
            <CardTitle>About Navigation Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium">Horizontal Navigation (Default)</h4>
              <p className="text-sm text-muted-foreground">
                Traditional top navigation bar. Familiar interface with navigation items in a horizontal row.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Vertical Navigation (New)</h4>
              <p className="text-sm text-muted-foreground">
                Sidebar navigation that maximizes vertical space for report content. 
                Can be collapsed for more content width. Includes keyboard shortcuts (⌘B/Ctrl+B).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNavigationSettings;
```

**Route Integration**: Add to your routing configuration
```typescript
// In your main routing file (App.tsx or routes configuration)
import AdminNavigationSettings from '@/pages/AdminNavigationSettings';

// Add route (only accessible to secretary role)
{
  path: "/admin/navigation-settings",
  element: <AdminNavigationSettings />,
}
```

**Navigation Link**: Add link in admin menu
```typescript
// In AppHeader.tsx or AppSidebar.tsx (secretary role section)
<Link to="/admin/navigation-settings">
  Navigation Settings
</Link>
```

### Step 6: Accessibility Enhancements

**File**: `src/hooks/useAnnouncement.ts`
```typescript
import { useCallback } from 'react';

export const useAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    // Clean up after announcement
    setTimeout(() => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);
      }
    }, 1000);
  }, []);

  return { announce };
};
```

---

## Testing Implementation

### Manual Testing Checklist

#### Accessibility Testing
- [ ] **Keyboard Navigation**: Tab through all sidebar items
- [ ] **Screen Reader**: Test with NVDA/JAWS/VoiceOver
- [ ] **Skip Links**: Verify skip to main content works
- [ ] **ARIA Labels**: Validate all navigation landmarks
- [ ] **High Contrast**: Test in high contrast mode
- [ ] **Focus Management**: Verify focus states and indicators

#### Functional Testing
- [ ] **Feature Flag**: Toggle on/off works correctly
- [ ] **Admin Interface**: NavigationSettings component works
- [ ] **Role-Based Access**: Only secretary role can access navigation settings
- [ ] **Toggle Persistence**: Setting persists across browser sessions
- [ ] **Responsive**: Mobile sheet behavior
- [ ] **Error Boundary**: Trigger and verify fallback
- [ ] **Navigation**: All links work correctly
- [ ] **State Persistence**: Sidebar state persists across refreshes
- [ ] **Logout**: Logout functionality works from sidebar
- [ ] **Page Refresh**: Automatic refresh after toggle works correctly

#### Visual Testing
- [ ] **Transitions**: Smooth expand/collapse animations
- [ ] **Tooltips**: Visible in collapsed state
- [ ] **Themes**: Light/dark mode compatibility
- [ ] **Icons**: Proper sizing and alignment
- [ ] **Typography**: Text truncation and wrapping

### Automated Testing

#### Unit Tests
```typescript
// src/components/layout/__tests__/AppSidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AppSidebar from '../AppSidebar';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <SidebarProvider>
            {component}
          </SidebarProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AppSidebar', () => {
  it('renders navigation items for authenticated users', () => {
    renderWithProviders(<AppSidebar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows admin items for secretary role', () => {
    // Mock user with secretary role
    renderWithProviders(<AppSidebar />);
    expect(screen.getByText('Manage Departments')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    renderWithProviders(<AppSidebar />);
    const firstItem = screen.getByText('Dashboard');
    fireEvent.keyDown(firstItem, { key: 'Tab' });
    // Verify focus moves correctly
  });
});
```

#### E2E Tests
```typescript
// tests/e2e/sidebar-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.localStorage.setItem('feature_vertical_navigation', 'true');
    await page.reload();
  });

  test('sidebar expands and collapses', async ({ page }) => {
    await page.click('[data-testid="sidebar-trigger"]');
    await expect(page.locator('[data-state="collapsed"]')).toBeVisible();
    
    await page.click('[data-testid="sidebar-trigger"]');
    await expect(page.locator('[data-state="expanded"]')).toBeVisible();
  });

  test('keyboard shortcut toggles sidebar', async ({ page }) => {
    await page.keyboard.press('Meta+B');  // or Ctrl+B
    await expect(page.locator('[data-state="collapsed"]')).toBeVisible();
  });

  test('skip link works', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.locator('text=Skip to main content')).toBeFocused();
    
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
});
```

---

## Rollout Strategy

### Phase 1: Development & Internal Testing (Week 1)
1. **Implementation**: Complete all code changes including admin interface
2. **Feature Flag**: Deploy with flag OFF by default
3. **Admin Interface**: Deploy NavigationSettings component
4. **Internal Testing**: Admin users can toggle via admin panel
5. **Accessibility Audit**: Verify WCAG compliance

### Phase 2: Limited User Testing (Week 2)
1. **Admin Communication**: Notify admin users of new navigation option
2. **Select User Testing**: Admin enables for 10-15 power users via toggle
3. **Feedback Collection**: Gather usability feedback through existing channels
4. **Bug Fixes**: Address any issues found
5. **Performance Monitoring**: Ensure no regressions

### Phase 3: User Choice (Week 3)
1. **Announcement**: Inform all users about navigation options
2. **Self-Service**: Users can request toggle from admin
3. **Monitor Adoption**: Track how many users prefer vertical navigation
4. **Iterative Improvement**: Make adjustments based on feedback

### Phase 4: Default Migration (Week 4)
1. **Data-Driven Decision**: If >70% users prefer vertical, make it default
2. **Gradual Transition**: Automatically enable for new users
3. **Legacy Support**: Keep horizontal navigation for users who prefer it
4. **Long-term Plan**: Eventually phase out horizontal (6+ months)

### Rollback Plan
- **Immediate**: Disable feature flag via localStorage
- **Emergency**: Revert to previous deployment
- **Communication**: Notify users of temporary change

---

## Success Metrics

### User Experience Metrics
- **Usability**: User task completion rate
- **Satisfaction**: Post-implementation survey scores
- **Efficiency**: Time to complete navigation tasks
- **Error Rate**: Navigation-related user errors

### Technical Metrics
- **Performance**: Page load times remain stable
- **Accessibility**: WCAG 2.1 AA compliance verified
- **Reliability**: Error boundary activation rate < 0.1%
- **Responsiveness**: Mobile navigation usability

### Business Metrics
- **Adoption**: Feature flag activation rate
- **Engagement**: Time spent in report editing
- **Productivity**: Reports created per session
- **Support**: Navigation-related support tickets

---

## Development Notes

### Key Implementation Points
1. **Backward Compatibility**: Always maintain AppHeader fallback
2. **Error Resilience**: Comprehensive error boundary coverage
3. **Accessibility First**: WCAG compliance from day one
4. **Performance**: Minimal bundle size impact
5. **Testing**: Comprehensive test coverage

### Common Pitfalls to Avoid
1. **Focus Traps**: Ensure proper focus management
2. **ARIA Errors**: Test with screen readers
3. **State Persistence**: Handle localStorage edge cases
4. **Mobile Breakpoints**: Test on various screen sizes
5. **Theme Compatibility**: Verify in all theme modes

### Future Enhancements
1. **User Preferences**: Persistent sidebar state per user
2. **Quick Actions**: Keyboard shortcuts for common tasks
3. **Search Integration**: Global search in sidebar
4. **Notification Center**: Activity feed in sidebar
5. **Customization**: User-configurable sidebar layout

---

## Conclusion

This architectural plan provides a comprehensive roadmap for implementing vertical navigation with accessibility, performance, and user experience as primary concerns. The feature flag approach ensures safe deployment with easy rollback capability.

The implementation prioritizes:
- **User Experience**: Maximizing vertical space for report content
- **Accessibility**: Full WCAG 2.1 AA compliance
- **Reliability**: Comprehensive error handling
- **Performance**: Minimal impact on application speed
- **Maintainability**: Clean, well-documented code

AI engineers implementing this plan should follow the detailed steps, use the provided code examples, and thoroughly test accessibility features before deployment.