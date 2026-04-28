import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteDepartmentApi,
  Department,
} from '@/departmentApiService'; // Assuming @ is aliased to src and file is .ts
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Using AlertDialog for confirmation
import { useToast } from '@/components/ui/use-toast';

interface DepartmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
}

const DepartmentDeleteDialog: React.FC<DepartmentDeleteDialogProps> = ({ open, onOpenChange, department }) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation<void, Error, string>({
    mutationFn: deleteDepartmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: t('common.success'),
        description: t('departments.toast.deleteSuccess', { name: department?.name || '' }),
      });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: t('common.error'),
        description: err.message || t('departments.toast.deleteError'),
        variant: 'destructive',
      });
      onOpenChange(false); // Also close on error, or provide retry option
    },
  });

  const handleDelete = () => {
    if (!department) return;
    mutation.mutate(department.id);
  };

  if (!department) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('departments.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('departments.delete.confirm', { name: department.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={mutation.isPending} className="bg-red-600 hover:bg-red-700">
            {mutation.isPending ? t('common.loading') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DepartmentDeleteDialog;
