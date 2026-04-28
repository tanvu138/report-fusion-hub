// /Users/luan/repos/report-fusion-hub/src/components/reports/SectionDisplay.tsx
import React, { useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportSection, SectionState, ReportUser } from '@/types/report'; // Assuming ReportUser is in types/report or adjust path
import { Button } from '@/components/ui/button';
import { Edit3Icon, Loader2, Save, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateBlockNote } from '@blocknote/react'; // Core hook for editor creation
import { BlockNoteView } from '@blocknote/mantine'; // Mantine components for BlockNote
import type { BlockNoteEditor } from '@blocknote/core';
import { API_URL } from '@/lib/api'; // Import API_URL
import { transformContentForDisplay, resolveResourceUrl, convertMarkdownUrlsToResourceIds } from '@/lib/utils/contentTransform';

import '@blocknote/core/fonts/inter.css'; // Default font
import '@blocknote/mantine/style.css'; // Mantine-specific styles for BlockNote
// We can remove '@blocknote/react/style.css' if Mantine styles are sufficient or preferred

interface SectionDisplayProps {
  section: ReportSection; // This should ideally include section.report.state for checking finalized status
  currentUser: ReportUser | null; // User object to check role (null for shared reports)
  reportCycle?: string;
  reportId?: string; // The report ID for image uploads
  shareId?: string; // Share ID for shared report context
  shareCode?: string; // Share code for shared report context
  editable?: boolean; // When true, section is in inline edit mode
  onContentChange?: (markdown: string) => void;
  onEditRequest?: (section: ReportSection) => void; // Callback to start editing
  onSave?: () => void; // Callback when user saves changes
  onCancel?: () => void; // Callback when user cancels editing
  isSaving?: boolean; // Whether a save is in progress (disables buttons, shows spinner)
  showEditButton?: boolean; // Whether to show the edit button (overrides internal logic)
  // Ensure ReportSection includes 'report: { state: string }' for checks
}



const SectionDisplay: React.FC<SectionDisplayProps> = ({
  section,
  currentUser,
  reportCycle,
  reportId,
  shareId,
  shareCode,
  editable = false,
  onContentChange,
  onEditRequest,
  onSave,
  onCancel,
  isSaving = false,
  showEditButton,
}) => {
  const { t } = useLanguage();

  // Create a custom fetch function that includes credentials
  const customFetch = async (url: string, options: RequestInit = {}) => {
    // Only modify requests to our API
    if (url.startsWith('/api/') || url.includes(API_URL)) {
      return fetch(url, {
        ...options,
        credentials: 'include',
      });
    }
    // For other URLs, use the default fetch
    return fetch(url, options);
  };

  // Patch the global fetch to include credentials for our API
  useEffect(() => {
    const originalFetch = window.fetch;

    // @ts-expect-error - We're intentionally patching fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      // Only modify requests to our API
      if (url && (url.startsWith('/api/') || url.includes(API_URL))) {
        const headers = { ...init?.headers };

        // If in shared context and this is an image request, add authentication
        if (shareId && shareCode && url.includes('/api/report-images/')) {
          // Add shareId as query parameter
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}shareId=${shareId}`;
          
          // Add shareCode as X-Code header
          headers['X-Code'] = shareCode;
        }

        return originalFetch(url, {
          ...init,
          headers,
          credentials: 'include',
        });
      }

      // For other URLs, use the original fetch
      return originalFetch(input, init);
    };

    // Restore original fetch on unmount
    return () => {
      window.fetch = originalFetch;
    };
  }, [API_URL, shareId, shareCode]);

  const editor = useCreateBlockNote({
    // Configure the editor to use our custom fetch function for image loading
    // This ensures that when BlockNote loads images, it includes credentials
    uploadFile: async (file: File) => {
      // Use the actual reportId if provided, otherwise try to extract from section
      const actualReportId = reportId || section.reportId || section.report?.id;
      
      if (!actualReportId) {
        throw new Error('Report ID is required for image upload');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', actualReportId);

      const response = await customFetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // The upload endpoint returns a relative URL path
      // Convert it to a full URL for BlockNote to display
      let imageUrl = `${API_URL}${data.url.startsWith('/') ? '' : '/'}${data.url}`;
      
      // If in shared report context, append shareId parameter to the image URL
      // Note: shareCode will be passed via X-Code header by the fetch interceptor
      if (shareId) {
        const separator = imageUrl.includes('?') ? '&' : '?';
        imageUrl += `${separator}shareId=${shareId}`;
      }
      
      return imageUrl;
    },
  }); // Stable editor instance

  useEffect(() => {
    const loadContent = async () => {
      if (editor) {
        let markdownToParse = (section.contentMarkdown && section.contentMarkdown.trim() !== '')
          ? section.contentMarkdown
          : (editable ? "" : "*No content provided yet.*");

        // Transform resource identifiers for display (for backward compatibility with existing URLs)
        if (markdownToParse && markdownToParse.trim() !== "" && markdownToParse !== "*No content provided yet.*") {
          markdownToParse = transformContentForDisplay(markdownToParse, { 
            shareId, 
            shareCode, 
            apiUrl: API_URL 
          });
        }
        
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(markdownToParse);
          editor.replaceBlocks(editor.document, blocks);
        } catch (e) {
          console.error("Failed to parse Markdown or replace blocks:", e);
          // Fallback: attempt to load an error message into the editor
          try {
            const errorBlocks = await editor.tryParseMarkdownToBlocks("Error loading content.");
            editor.replaceBlocks(editor.document, errorBlocks);
          } catch (fallbackError) {
            console.error("Failed to load fallback error content:", fallbackError);
            // As a last resort, clear the editor or leave it as is
            editor.replaceBlocks(editor.document, []); 
          }
        }
      }
    };
    loadContent();
  }, [editor, section.contentMarkdown, editable, shareId, shareCode]);

  // Effect to handle editor content changes when in editable mode
  useEffect(() => {
    if (!editor) {
      return;
    }

    // Define the handler for content changes
    const handleChange = async () => {
      if (editable && onContentChange) {
        try {
          // The editor instance is available from the outer scope (useCreateBlockNote)
          const markdown = await editor.blocksToMarkdownLossy(editor.document);
          
          // Convert hardcoded URLs to resource identifiers before saving
          const resourceMarkdown = convertMarkdownUrlsToResourceIds(markdown);
          onContentChange(resourceMarkdown);
        } catch (e) {
          console.error("Failed to convert blocks to Markdown on change:", e);
        }
      }
    };

    let unsubscribe: (() => void) | undefined;

    if (editable) {
      // editor.onChange's callback receives the editor instance, but we use the stable `editor` from the hook.
      unsubscribe = editor.onChange(handleChange);
    }

    // Cleanup: Unsubscribe when the component unmounts or dependencies change
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [editor, editable, onContentChange]); // Dependencies

  const displayName = 
    section.displayName || 
    section.sectionName || 
    section.reportTemplateSection?.name || 
    t('reports.unnamedSection');

  const canEditSection = () => {
    if (!onEditRequest) return false; // No handler, no edit button
    if (!currentUser) return false; // No user (e.g., shared report), no editing

    // Ensure section.report and section.report.state exist
    if (!section.report || typeof section.report.state === 'undefined') {
      console.warn('SectionDisplay: section.report.state is missing, cannot determine editability for report finalization.');
      // Default to non-editable if report state is unknown, or handle as per requirements
      // For now, let's assume if report state is missing, we can't confirm it's NOT finalized.
      // Depending on strictness, this might mean returning false.
      // However, the backend will ultimately enforce this.
    }

    if (section.report && section.report.state === 'FINAL') return false;
    if (section.locked) return false;
    if (currentUser.role === 'department' && section.state === 'SUBMITTED') return false;
    
    return true;
  };

  const showEditButtonComputed = showEditButton !== undefined ? showEditButton : (!editable && canEditSection());

  const getStatusBadgeStyle = (status?: SectionState | string) => {
    switch (status) {
      case SectionState.SUBMITTED:
        return 'bg-green-100 text-green-800';
      case SectionState.DRAFT:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      id={`section-${section.id || section.key}`}
      className={`report-section shadow-sm transition-colors ${editable ? 'bg-yellow-50' : 'bg-white'}`}>
      <CardHeader className="px-4 py-2.5 pb-1.5 sm:px-4 sm:py-2.5 sm:pb-1.5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-baseline gap-2 flex-1 min-w-0">
            <CardTitle className="text-base font-semibold">{displayName}</CardTitle>
            {section.dueAt && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {t('reports.dueOn')}: {new Date(section.dueAt).toLocaleDateString()}
              </span>
            )}
          </div>
            {editable ? (
              <div className="flex space-x-2 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSaving}
                  aria-label={t('actions.cancel')}
                  className="self-start flex-shrink-0"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('actions.cancel')}
                </Button>
                <Button
                  variant="edit"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                  aria-label={t('actions.save')}
                  className="self-start flex-shrink-0"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  {isSaving ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            ) : (
              showEditButtonComputed && (
                <Button 
                  variant="edit" 
                  size="sm" 
                  onClick={() => onEditRequest && onEditRequest(section)}
                  className="ml-2 self-start flex-shrink-0" 
                  aria-label={t('actions.edit') + ' ' + displayName}
                >
                  <Edit3Icon className="h-4 w-4 mr-1" />
                  {t('actions.edit')}
                </Button>
              )
            )}
          <div className="flex items-center gap-2">
            {section.state && (
              <span 
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeStyle(section.state)}`}
              >
                {t(`reports.sectionState.${section.state.toLowerCase()}`)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2 pt-0 sm:px-4 sm:pb-2 sm:pt-0">
        <BlockNoteView
          editor={editor}
          editable={editable}
          theme="light"
        />
      </CardContent>
    </Card>
  );
};

export default React.memo(SectionDisplay); // Memoize if props are complex or updates frequent
