import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Save, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndContinue: () => void;
  onDiscardAndContinue: () => void;
  sectionName?: string;
  actionDescription?: string;
}

/**
 * UnsavedChangesDialog - Confirms user action when there are unsaved changes
 * 
 * Used when switching between sections or performing actions that would
 * lose unsaved changes. Provides options to save, discard, or cancel.
 */
export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onClose,
  onSaveAndContinue,
  onDiscardAndContinue,
  sectionName,
  actionDescription = 'continue',
}) => {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>{t('reports.unsavedChanges.title')}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {sectionName ? (
              t('reports.unsavedChanges.descriptionWithSection', { 
                sectionName,
                action: actionDescription 
              })
            ) : (
              t('reports.unsavedChanges.description', { action: actionDescription })
            )}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t('actions.cancel')}
          </Button>
          
          <Button
            variant="delete"
            onClick={onDiscardAndContinue}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('reports.unsavedChanges.discardAndContinue')}
          </Button>
          
          <Button
            variant="edit"
            onClick={onSaveAndContinue}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {t('reports.unsavedChanges.saveAndContinue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnsavedChangesDialog;