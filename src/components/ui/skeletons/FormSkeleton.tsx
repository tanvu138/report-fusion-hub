import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface FormSkeletonProps {
  fields?: number;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
}

const FormSkeleton: React.FC<FormSkeletonProps> = ({ 
  fields = 3, 
  showTitle = true,
  showDescription = true,
  showActions = true 
}) => {
  return (
    <div className="space-y-6">
      {/* Form Header */}
      {showTitle && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          {showDescription && <Skeleton className="h-4 w-64" />}
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Form Actions */}
      {showActions && (
        <div className="flex items-center justify-end space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
};

export default FormSkeleton;