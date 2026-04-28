import { useEffect, useRef, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface AutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number; // in milliseconds, default 30 seconds
  enabled?: boolean;
  isDataChanged?: () => boolean;
}

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export const useAutoSave = ({
  onSave,
  delay = 30000, // 30 seconds default
  enabled = true,
  isDataChanged
}: AutoSaveOptions): AutoSaveStatus => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveData = useCallback(async () => {
    if (!enabled || isSaving) return;

    // Check if data has actually changed
    if (isDataChanged && !isDataChanged()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Show subtle success indication
      toast({
        title: t('toast.autoSaved'),
        description: 'Your changes have been automatically saved.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: t('toast.autoSaveFailed'),
        description: 'Failed to auto-save. Please save manually.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [onSave, enabled, isSaving, isDataChanged, toast]);

  const scheduleAutoSave = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new auto-save
    timeoutRef.current = setTimeout(() => {
      saveData();
    }, delay);
  }, [enabled, delay, saveData]);

  const triggerAutoSave = useCallback(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setHasUnsavedChanges(true);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  // Manual save function that can be called immediately
  const manualSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await saveData();
  }, [saveData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Expose a method to trigger auto-save when content changes
  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    triggerAutoSave,
    manualSave,
  } as AutoSaveStatus & {
    triggerAutoSave: () => void;
    manualSave: () => Promise<void>;
  };
};