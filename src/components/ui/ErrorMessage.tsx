import React from 'react';
import { AlertTriangle, AlertCircle, XCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
  className?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  dismissLabel?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  variant = 'error',
  showIcon = true,
  className,
  onRetry,
  onDismiss,
  retryLabel,
  dismissLabel
}) => {
  const { t } = useLanguage();
  
  // Use translation keys as defaults if not provided
  const finalRetryLabel = retryLabel || t('common.tryAgain');
  const finalDismissLabel = dismissLabel || t('common.dismiss');
  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'error':
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'error':
      default:
        return 'border-red-200 bg-red-50 text-red-800';
    }
  };

  return (
    <Alert 
      className={cn(getVariantStyles(), className)}
      role="alert"
      aria-live="polite"
    >
      {showIcon && <div aria-hidden="true">{getIcon()}</div>}
      <div className="flex-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription className="mt-1">
          {message}
        </AlertDescription>
      </div>
      {(onRetry || onDismiss) && (
        <div className="flex items-center space-x-2 mt-3">
          {onRetry && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onRetry}
              className="h-8"
              aria-label={`${finalRetryLabel} - ${title || 'error'}`}
            >
              {finalRetryLabel}
            </Button>
          )}
          {onDismiss && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onDismiss}
              className="h-8"
              aria-label={`${finalDismissLabel} - ${title || 'error'}`}
            >
              <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
              {finalDismissLabel}
            </Button>
          )}
        </div>
      )}
    </Alert>
  );
};

export default ErrorMessage;