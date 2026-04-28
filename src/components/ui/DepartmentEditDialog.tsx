import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateDepartmentApi,
  Department,
  UpdateDepartmentPayload,
} from '@/departmentApiService'; // Assuming @ is aliased to src and file is .ts
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface DepartmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
}

const DepartmentEditDialog: React.FC<DepartmentEditDialogProps> = ({ open, onOpenChange, department }) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (department) {
      setName(department.name);
    } else {
      // Reset form if no department is provided (e.g., dialog closed then reopened without a department)
      setName(''); 
    }
    setFormError(null); // Reset error when department changes or dialog opens
  }, [department, open]);

  const mutation = useMutation<Department, Error, UpdateDepartmentPayload>({
    mutationFn: (payload) => {
      if (!department) throw new Error('No department selected for update.');
      return updateDepartmentApi(department.id, payload);
    },
    onSuccess: (updatedDepartment) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.setQueryData(['departments', updatedDepartment.id], updatedDepartment); // Optionally update specific query cache
      toast({
        title: t('common.success'),
        description: t('departments.toast.updateSuccess', { name: updatedDepartment.name }),
      });
      onOpenChange(false);
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message || 'An unexpected error occurred.');
      toast({
        title: t('common.error'),
        description: err.message || t('departments.toast.updateError'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    const isNameUnchanged = department?.name.trim() === name.trim();
    if (isNameUnchanged) {
      // Optionally, close the dialog or show a message that no changes were made
      // For now, just prevent submission if no changes
      setFormError(t('errors.noChangesDetected'));
      // onOpenChange(false); // Or close it
      return;
    }
    e.preventDefault();
    if (!name.trim()) {
      setFormError(t('validation.departmentNameRequired'));
      return;
    }
    if (!department) {
      setFormError(t('errors.noDepartmentSelected'));
      return;
    }
    setFormError(null);
    mutation.mutate({ name });
  };
  
  // Effect to reset form when dialog is closed externally
  React.useEffect(() => {
    if (!open) {
      // setName(''); // Name is reset by the other useEffect based on department prop
      setFormError(null);
      mutation.reset();
    }
  }, [open]);

  if (!department) return null; // Don't render if no department is passed (or handle more gracefully)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('departments.edit.title')}</DialogTitle>
          <DialogDescription>
            {t('departments.edit.description', { name: department.name })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                {t('departments.create.nameLabel')}*
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
                disabled={mutation.isPending}
              />
            </div>
            {formError && <p className="col-span-4 text-red-500 text-sm text-center">{formError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || (department?.name.trim() === name.trim())}>
              {mutation.isPending ? t('common.loading') : t('departments.edit.button')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentEditDialog;
