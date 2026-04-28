import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDepartmentApi, CreateDepartmentPayload, CreateDepartmentResponse } from '@/departmentApiService'; // Assuming @ is aliased to src
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'; // Removed DialogTrigger as it's controlled externally
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import WithLoadingOverlay from './WithLoadingOverlay'; 

interface DepartmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DepartmentCreateDialog: React.FC<DepartmentCreateDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [usernameForUser, setUsernameForUser] = useState('');
  const [emailForUser, setEmailForUser] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null); // Renamed to avoid conflict with mutation error

  const mutation = useMutation<CreateDepartmentResponse, Error, CreateDepartmentPayload>({
    mutationFn: createDepartmentApi,
    
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: t('common.success'),
        description: (
          <>
            Department "{data.department.name}" created successfully.
            {data.newUser && (
              <>
                <br />User {data.newUser.username || data.newUser.name}{data.newUser.email ? ` (${data.newUser.email})` : ''} also created.
                {data.initialPassword && (
                  <>
                    <br />
                    <strong>Initial password:</strong> {data.initialPassword}
                  </>
                )}
              </>
            )}
          </>
        ),
      });
      onOpenChange(false); // Close dialog on success
      // Reset form
      setName('');
      setUsernameForUser('');
      setEmailForUser('');
      setInitialPassword('');
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message || 'An unexpected error occurred.');
      toast({
        title: t('common.error'),
        description: err.message || t('departments.toast.createError'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(t('validation.departmentNameRequired'));
      return;
    }
    setFormError(null);
    mutation.mutate({ name, username: usernameForUser || undefined, initialPassword, email: emailForUser || undefined });
  };
  
  // Effect to reset form when dialog is closed externally
  React.useEffect(() => {
    if (!open) {
      setName('');
      setUsernameForUser('');
      setEmailForUser('');
      setInitialPassword('');
      setFormError(null);
      mutation.reset(); // Reset mutation state if dialog is closed
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <WithLoadingOverlay 
          isLoading={mutation.isPending} 
          loadingMessage={t('departments.toast.creating') || 'Creating department...'}
        >
          <DialogHeader>
            <DialogTitle>{t('departments.create.title')}</DialogTitle>
            <DialogDescription>
              {t('departments.create.createUserHelp')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('departments.create.nameLabel')}*
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usernameForUser" className="text-right">
                {t('departments.create.usernameLabel')}
              </Label>
              <Input
                id="usernameForUser"
                value={usernameForUser}
                onChange={(e) => setUsernameForUser(e.target.value)}
                className="col-span-3"
                placeholder={t('forms.usernamePlaceholder')}
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emailForUser" className="text-right">
                Email (for User)
              </Label>
              <Input
                id="emailForUser"
                type="email"
                value={emailForUser}
                onChange={(e) => setEmailForUser(e.target.value)}
                className="col-span-3"
                placeholder={t('forms.emailPlaceholder')}
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initialPassword" className="text-right">
                {t('departments.create.passwordLabel')}
              </Label>
              <Input
                id="initialPassword"
                type="password"
                value={initialPassword}
                onChange={(e) => setInitialPassword(e.target.value)}
                className="col-span-3"
                placeholder={t('forms.autoGeneratePasswordPlaceholder')}
                disabled={mutation.isPending}
              />
              <div className="col-span-3 col-start-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {t('departments.create.passwordHelp')}
                </p>
              </div>
            </div>
            {formError && <p className="col-span-4 text-red-500 text-sm text-center">{formError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.loading') : t('departments.create.button')}
            </Button>
          </DialogFooter>
          </form>
        </WithLoadingOverlay>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentCreateDialog;
