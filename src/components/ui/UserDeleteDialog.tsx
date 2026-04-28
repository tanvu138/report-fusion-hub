import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Using AlertDialog for confirmation
import { useToast } from '@/components/ui/use-toast';
import { userService, User } from '@/lib/api/userApiService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserDeleteDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string) => void;
}

const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({ user, isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();

  const handleDelete = async () => {
    if (!user) return;

    // Additional safety check to prevent self-deletion
    if (currentUser && user.id === currentUser.id) {
      toast({
        title: t('users.delete.errorSelf'),
        description: t('users.delete.errorSelfMessage'),
        variant: 'destructive',
      });
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await userService.deleteUser(user.id);
      onSuccess(user.id);
      toast({
        title: t('users.delete.success'),
        description: t('users.delete.successMessage', { username: user.username }),
      });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('error.generic');
      toast({
        variant: 'destructive',
        title: t('users.delete.error'),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  // Check if user is trying to delete themselves
  const isDeletingSelf = currentUser && user.id === currentUser.id;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('users.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {isDeletingSelf ? (
              <span className="text-red-600 font-medium">
                {t('users.delete.cannotDeleteSelf')}
              </span>
            ) : (
              t('users.delete.description', { username: user.username, name: user.name })
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isLoading || isDeletingSelf} 
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? t('users.delete.deleting') : t('users.card.deleteUser')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserDeleteDialog;
