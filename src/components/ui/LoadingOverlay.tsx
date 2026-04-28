import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
  backdrop?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  className,
  backdrop = true,
  size = 'md'
}) => {
  if (!isVisible) return null;

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center',
        backdrop && 'bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn('animate-spin text-primary', iconSizes[size])} />
        {message && (
          <p className={cn('text-muted-foreground', textSizes[size])}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;