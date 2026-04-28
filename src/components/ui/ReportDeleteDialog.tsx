import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteReport,
  Report,
} from '@/lib/api/reports'; 
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
  onReportDeleted?: (reportId: string) => void;
}

const ReportDeleteDialog: React.FC<ReportDeleteDialogProps> = ({ open, onOpenChange, report, onReportDeleted }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const mutation = useMutation<void, Error, { id: string; title: string }>({
    mutationFn: ({ id }) => deleteReport(id),
    onSuccess: (_, { title }) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: t('reportDelete.success'),
        description: `Report "${title}" deleted successfully.`,
      });
      onOpenChange(false);
      if (onReportDeleted) {
        onReportDeleted(report?.id || '');
      }
    },
    onError: (err: Error) => {
      toast({
        title: t('reportDelete.error'),
        description: err.message || 'Failed to delete report.',
        variant: 'destructive',
      });
      onOpenChange(false);
    },
  });

  const handleDelete = () => {
    if (!report) return;
    mutation.mutate({ id: report.id, title: report.title });
  };

  if (!report) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('reportDelete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('reportDelete.warning')}
            <strong> "{report.title}"</strong> and all of its sections and content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('reportDelete.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={mutation.isPending} className="bg-red-600 hover:bg-red-700">
            {mutation.isPending ? t('reportDelete.deleting') : t('reportDelete.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReportDeleteDialog; 