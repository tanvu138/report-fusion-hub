import React, { useState } from 'react';
import { Key, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@/lib/api/userApiService';
import { useLanguage } from '@/contexts/LanguageContext';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onPasswordReset?: (userId: string) => Promise<{ newPassword: string }>;
}

const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({
  open,
  onOpenChange,
  user,
  onPasswordReset,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  if (!user) {
    return null;
  }

  const handleReset = async () => {
    if (!onPasswordReset) return;

    setIsResetting(true);
    setError(null);

    try {
      const result = await onPasswordReset(user.id);
      setNewPassword(result.newPassword);
      toast({
        title: t('toast.passwordResetSuccessful'),
        description: t('users.passwordReset.generatedFor', { name: user.name }),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('users.passwordReset.error');
      setError(errorMessage);
      toast({
        title: t('toast.passwordResetFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyPassword = async () => {
    if (newPassword) {
      try {
        await navigator.clipboard.writeText(newPassword);
        toast({
          title: t('toast.passwordCopied'),
          description: t('users.passwordReset.copiedToClipboard'),
        });
      } catch (err) {
        toast({
          title: t('toast.copyFailed'),
          description: t('users.passwordReset.copyFailedMessage'),
          variant: 'destructive',
        });
      }
    }
  };

  const handleClose = () => {
    setNewPassword(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-amber-600" />
            <span>{t('users.passwordReset.title')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('users.passwordReset.generateDescription', { name: user.name, username: user.username })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!newPassword && !error && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p>{t('users.passwordReset.warningText')}</p>
                  <p className="text-sm text-amber-600 font-medium">
                    {t('users.passwordReset.secureShareWarning')}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {newPassword && (
            <div className="space-y-3">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>
                  <p className="text-green-800 font-medium mb-2">
                    {t('users.passwordReset.generatedSuccess')}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t('users.passwordReset.newTempPassword')}
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-gray-100 rounded-md font-mono text-sm border">
                    {newPassword}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPassword}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription>
                  <div className="text-blue-800 text-sm space-y-1">
                    <p className="font-medium">{t('users.passwordReset.important')}</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>{t('users.passwordReset.shareSecurely')}</li>
                      <li>{t('users.passwordReset.changeOnNextLogin')}</li>
                      <li>{t('users.passwordReset.notShownAgain')}</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {newPassword ? t('common.close') : t('common.cancel')}
          </Button>
          {!newPassword && (
            <Button
              onClick={handleReset}
              disabled={isResetting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('users.passwordReset.generating')}
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {t('users.passwordReset.generateNewPassword')}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetDialog;