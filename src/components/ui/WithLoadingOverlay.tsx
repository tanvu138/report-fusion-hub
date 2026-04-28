import React from 'react';
import LoadingOverlay from './LoadingOverlay';

interface WithLoadingOverlayProps {
  children: React.ReactNode;
  isLoading: boolean;
  loadingMessage?: string;
  className?: string;
}

const WithLoadingOverlay: React.FC<WithLoadingOverlayProps> = ({
  children,
  isLoading,
  loadingMessage,
  className
}) => {
  return (
    <div className={`relative ${className || ''}`}>
      {children}
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </div>
  );
};

export default WithLoadingOverlay;