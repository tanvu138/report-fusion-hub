import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchReportTemplateById,
  ReportTemplate,
} from '@/reportTemplateApiService';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
}

const ReportTemplatePreviewDialog: React.FC<ReportTemplatePreviewDialogProps> = ({ open, onOpenChange, templateId }) => {
  const { t } = useLanguage();

  const {
    data: template,
    isLoading,
    isError,
    error,
  } = useQuery<ReportTemplate, Error>({
    queryKey: ['reportTemplate', templateId],
    queryFn: () => fetchReportTemplateById(templateId!),
    enabled: !!templateId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('templates.preview.title')}</DialogTitle>
          {template && <DialogDescription>{t('templates.preview.viewingDetails')}<strong>{template.name}</strong></DialogDescription>}
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )}

        {isError && error && (
          <Alert variant="destructive" className="my-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>{t('templates.preview.errorFetching')}</AlertTitle>
            <AlertDescription>
              {error.message || t('templates.preview.unexpectedError')}
            </AlertDescription>
          </Alert>
        )}

        {template && !isLoading && !isError && (
          <div className="py-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">{t('templates.preview.name')}</h3>
              <p className="text-md">{template.name}</p>
            </div>
            {template.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700">{t('templates.preview.description')}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{template.description}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-700">{t('templates.preview.sections', { count: String(template.sections.length) })}</h3>
              {template.sections.length > 0 ? (
                <ul className="list-disc list-inside pl-2 text-sm text-gray-600 space-y-1 mt-1">
                  {template.sections.map((section, index) => (
                    <li key={section.id || index}>{section.sectionName} {t('templates.preview.sectionOrder', { order: String(section.displayOrder) })}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">{t('templates.preview.noSections')}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">{t('templates.preview.createdBy')}</h3>
              <p className="text-sm text-gray-600">{template.createdBy?.name || t('templates.preview.unknown')}</p>
            </div>
             <div>
              <h3 className="text-sm font-semibold text-gray-700">{t('templates.preview.department')}</h3>
              <p className="text-sm text-gray-600">{template.department?.name || t('templates.preview.notAvailable')}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('templates.preview.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTemplatePreviewDialog;