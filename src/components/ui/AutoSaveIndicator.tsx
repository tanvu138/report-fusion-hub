import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Clock, CloudIcon, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error' | 'offline';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: number;
  errorMessage?: string;
  className?: string;
  compact?: boolean;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  errorMessage,
  className,
  compact = false
}) => {
  const { t } = useLanguage();
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: CloudIcon,
          text: compact ? t('loading.saving') : t('loading.autoSaving'),
          className: 'text-blue-600',
          animate: 'animate-pulse'
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: compact 
            ? t('autoSaveIndicator.saved') 
            : `${t('autoSaveIndicator.saved')} ${lastSaved ? new Date(lastSaved).toLocaleTimeString() : ''}`,
          className: 'text-green-600',
          animate: ''
        };
      case 'pending':
        return {
          icon: Clock,
          text: compact ? t('autoSaveIndicator.pending') : t('autoSaveIndicator.autoSavePending'),
          className: 'text-orange-500',
          animate: ''
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: compact ? t('autoSaveIndicator.error') : errorMessage || t('autoSaveIndicator.saveFailed'),
          className: 'text-red-600',
          animate: ''
        };
      case 'offline':
        return {
          icon: WifiOff,
          text: compact ? t('autoSaveIndicator.offline') : t('autoSaveIndicator.offlineLocal'),
          className: 'text-gray-500',
          animate: ''
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config || status === 'idle') return null;

  const Icon = config.icon;

  return (
    <div className={cn("flex items-center space-x-2 text-sm", className)}>
      <Icon className={cn("w-4 h-4", config.className, config.animate)} />
      <span className={cn("text-muted-foreground", config.className)}>
        {config.text}
      </span>
    </div>
  );
};

export default AutoSaveIndicator;