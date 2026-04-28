// /Users/luan/repos/report-fusion-hub/src/components/reports/FullReportPreview.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Report, ReportSection, ReportUser } from '@/types/report';
import type { User } from '@/lib/api/auth';
import SectionDisplay from './SectionDisplay';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateReportSection } from '@/lib/api/reportSectionApiService';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FullReportPreviewProps {
  report: Report;
  user: User | null;
  shareId?: string;
  shareCode?: string;
  onReportRefreshNeeded?: () => void;
}

const FullReportPreview: React.FC<FullReportPreviewProps> = ({ report: initialReport, user, shareId, shareCode, onReportRefreshNeeded }) => {
  const [report, setReport] = useState<Report>(initialReport);
  // Inline editing state — one section at a time
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const { t } = useLanguage();

  // Ref to always hold latest edited content — avoids stale closure in handleSave
  // (SectionDisplay is React.memo'd, so callback props may lag behind state)
  const editedContentRef = useRef<string>('');
  // Tracks original content when entering edit mode — used for dirty-check
  const originalContentRef = useRef<string>('');

  useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);

  const activeSections = report.sections?.filter(section => section.isActive) || [];

  // Enter inline edit mode for a section
  const handleEditRequest = useCallback((sectionToEdit: ReportSection) => {
    if (editingSectionId && editingSectionId !== sectionToEdit.id) {
      toast.warning(t('reports.finishEditingFirst'));
      return;
    }
    const content = sectionToEdit.contentMarkdown || '';
    editedContentRef.current = content;
    originalContentRef.current = content;
    setEditingSectionId(sectionToEdit.id);
  }, [editingSectionId, t]);

  // Track content changes from SectionDisplay's BlockNote editor
  // SectionDisplay already calls convertMarkdownUrlsToResourceIds before calling this
  const handleContentChange = useCallback((markdown: string) => {
    editedContentRef.current = markdown;
  }, []);

  // Save inline edit via API — reads from ref to avoid stale closures
  const handleSave = useCallback(async () => {
    if (!editingSectionId) return;
    setIsSaving(true);
    try {
      // Content already has resource IDs (converted by SectionDisplay's onContentChange)
      const updatedSection = await updateReportSection(
        report.id,
        editingSectionId,
        { contentMarkdown: editedContentRef.current }
      );
      setReport(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === updatedSection.id ? updatedSection : s
        ),
      }));
      editedContentRef.current = '';
      setEditingSectionId(null);
      toast.success(t('reports.sectionUpdatedSuccess'));
      onReportRefreshNeeded?.();
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('reports.sectionUpdatedError');
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }, [editingSectionId, report.id, t, onReportRefreshNeeded]);

  const hasUnsavedChanges = useCallback(() => {
    return editedContentRef.current !== originalContentRef.current;
  }, []);

  // Cancel inline edit — revert to read-only (force = skip dirty-check)
  const handleCancel = useCallback((force = false) => {
    if (!force && hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
      return;
    }
    editedContentRef.current = '';
    originalContentRef.current = '';
    setEditingSectionId(null);
  }, [hasUnsavedChanges]);

  const handleDiscardConfirm = useCallback(() => {
    setShowDiscardConfirm(false);
    handleCancel(true);
  }, [handleCancel]);

  // Keyboard: Escape to cancel (scoped — ignore if inside popovers/menus)
  useEffect(() => {
    if (!editingSectionId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Let popovers, dropdowns, and BlockNote menus handle their own Escape
      const target = e.target as HTMLElement;
      if (target.closest('[data-radix-popper-content-wrapper], .mantine-Popover-dropdown, .bn-suggestion-menu, .bn-toolbar')) return;
      e.preventDefault();
      handleCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingSectionId, handleCancel]);

  return (
    <div className="space-y-3">
      {activeSections.length > 0 ? (
        activeSections.map((section) => (
          <SectionDisplay
            key={section.id || section.key}
            section={section}
            currentUser={user as ReportUser}
            reportId={report.id}
            shareId={shareId}
            shareCode={shareCode}
            editable={editingSectionId === section.id}
            onContentChange={handleContentChange}
            onEditRequest={handleEditRequest}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving && editingSectionId === section.id}
            reportCycle={report.cycle}
          />
        ))
      ) : (
        <p className="text-muted-foreground text-center py-8">
          {t('preview.noSections')}
        </p>
      )}
      {/* Unsaved changes confirmation */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reports.unsavedChanges.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('reports.unsavedChanges.description', { action: t('actions.cancel').toLowerCase() })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm} className="bg-red-600 hover:bg-red-700">
              {t('reports.unsavedChanges.discardAndContinue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FullReportPreview;
