/**
 * ReportEdit Page - Content-first report viewing
 *
 * Shows report content directly. Settings accessible via ?tab=settings deep-link.
 * Auto-save status + export button rendered in header via portal.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Core data management
import { useReportManagement } from '@/hooks/useReportManagement';

// UI components
import { SettingsTab } from '@/components/reports/SettingsTab';

// Existing components
import ReportEditSkeleton from '@/components/ui/skeletons/ReportEditSkeleton';
import ShareLinksDialog from '@/components/reports/ShareLinksDialog';
import BackButton from '@/components/ui/BackButton';
import FullReportPreview from '@/components/reports/FullReportPreview';

// API functions
import { exportReportPdf } from '@/lib/api/reports';

const ReportEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();

  // State for dialogs
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [headerActionsEl, setHeaderActionsEl] = useState<HTMLElement | null>(null);

  // Centralized data management hook
  const { state, actions, loading, error } = useReportManagement(id!);

  // Find portal container after mount
  useEffect(() => {
    const el = document.getElementById('header-actions');
    if (el) setHeaderActionsEl(el);
  }, []);

  // Handle ?tab=settings deep-link from Dashboard
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'settings') {
      actions.setActiveTab('settings');
    }
  }, [searchParams, actions]);

  const handleExport = async () => {
    if (!state.report || !id) return;

    setExportLoading(true);
    try {
      await exportReportPdf(id);
      toast({
        title: t('toast.exportSuccessful'),
        description: t('toast.exportSuccessfulDesc'),
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        title: t('toast.exportFailed'),
        description: error.message || 'Failed to export report.',
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const formatRelativeTime = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('reports.status.justNow');
    if (diffMins < 60) return t('reports.status.minutesAgo', { minutes: diffMins });
    return past.toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return <ReportEditSkeleton />;
  }

  // Error states
  if (!state.user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('error.loginRequired')}</p>
      </div>
    );
  }

  if (!state.report || error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {error || t('error.reportNotFound')}
        </p>
        <BackButton to="/dashboard" label="Back to Dashboard" variant="outline" className="mt-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header actions via portal: auto-save + export */}
      {headerActionsEl && createPortal(
        <>
          <div className="flex items-center text-xs text-gray-500">
            {state.autoSave.isSaving ? (
              <div className="flex items-center text-blue-600">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                <span>{t('reports.status.saving')}</span>
              </div>
            ) : state.autoSave.lastSaved ? (
              <span className="text-green-600">
                {t('reports.status.saved', { time: formatRelativeTime(state.autoSave.lastSaved) })}
              </span>
            ) : (
              <span>{t('reports.status.lastUpdated', { time: formatRelativeTime(state.report.updatedAt) })}</span>
            )}
          </div>

          {state.user.role === 'secretary' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleExport}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={exportLoading}
                  >
                    {exportLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('reports.navigation.export')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>,
        headerActionsEl
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-3">
        {/* Content (default) */}
        {state.activeTab === 'content' && state.report && state.user && (
          <FullReportPreview
            report={state.report}
            user={state.user}
            onReportRefreshNeeded={actions.refetchReport}
          />
        )}

        {/* Settings (accessed via Dashboard ?tab=settings) */}
        {state.activeTab === 'settings' && (
          <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.setActiveTab('content')}
            className="mb-3 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('reports.navigation.content')}
          </Button>
          <SettingsTab
            report={state.report}
            editState={state.editState.reportDetails}
            onReportDetailsChange={actions.updateReportDetails}
            onSave={actions.saveReportDetails}
            isSaving={state.loading.saving}
            autoSaveState={state.autoSave}
            onShareClick={() => setShareDialogOpen(true)}
            user={state.user}
          />
          </>
        )}
      </div>

      {/* Share Dialog */}
      <ShareLinksDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        reportId={id}
      />
    </div>
  );
};

export default ReportEdit;
