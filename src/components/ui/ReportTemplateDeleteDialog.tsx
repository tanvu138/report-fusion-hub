import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteReportTemplate,
  ReportTemplate,
} from '@/reportTemplateApiService';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportTemplateDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReportTemplate | null;
}

const ReportTemplateDeleteDialog: React.FC<ReportTemplateDeleteDialogProps> = ({ open, onOpenChange, template }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const mutation = useMutation<void, Error, string>({
    mutationFn: deleteReportTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      toast({
        title: t('toast.reportTemplateDeleted'),
        description: t('templates.delete.templateDeletedDesc', { name: template?.name || '' }),
      });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: t('toast.reportTemplateDeleteError'),
        description: err.message || t('templates.delete.errorDeletingDesc'),
        variant: 'destructive',
      });
      onOpenChange(false);
    },
  });

  const handleDelete = () => {
    if (!template) return;
    mutation.mutate(template.id);
  };

  if (!template) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('templates.delete.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('templates.delete.description')}
            <strong> {template.name}</strong>.
            {' '}{t('templates.delete.warning')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={mutation.isPending} className="bg-red-600 hover:bg-red-700">
            {mutation.isPending ? t('loading.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReportTemplateDeleteDialog;