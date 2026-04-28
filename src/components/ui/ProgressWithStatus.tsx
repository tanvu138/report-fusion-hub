import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2, Upload, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressWithStatusProps {
  progress: number;
  status: 'idle' | 'uploading' | 'downloading' | 'processing' | 'success' | 'error';
  filename?: string;
  error?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const ProgressWithStatus: React.FC<ProgressWithStatusProps> = ({
  progress,
  status,
  filename,
  error,
  className,
  showIcon = true,
  size = 'default'
}) => {
  const { t } = useLanguage();
  const getIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 animate-pulse" />;
      case 'downloading':
        return <Download className="h-4 w-4 animate-pulse" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return t('loading.uploading');
      case 'downloading':
        return t('loading.downloading');
      case 'processing':
        return t('progressStatus.processing');
      case 'success':
        return t('progressStatus.complete');
      case 'error':
        return error || t('progressStatus.errorOccurred');
      default:
        return t('progressStatus.ready');
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'error':
        return 'bg-red-600';
      case 'success':
        return 'bg-green-600';
      default:
        return 'bg-blue-600';
    }
  };

  const progressHeight = {
    sm: 'h-2',
    default: 'h-4',
    lg: 'h-6'
  }[size];

  return (
    <div className={cn('space-y-2', className)}>
      {(filename || showIcon) && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {showIcon && getIcon()}
            {filename && (
              <span className="font-medium truncate max-w-xs">
                {filename}
              </span>
            )}
          </div>
          <span className={cn(
            'text-xs',
            status === 'error' ? 'text-red-600' : 
            status === 'success' ? 'text-green-600' : 
            'text-muted-foreground'
          )}>
            {getStatusText()}
          </span>
        </div>
      )}
      
      <div className="space-y-1">
        <Progress 
          value={progress} 
          className={cn(progressHeight, 'w-full')}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          {status === 'error' && error && (
            <span className="text-red-600 truncate max-w-xs">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressWithStatus;