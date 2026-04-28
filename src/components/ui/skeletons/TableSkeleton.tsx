import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TableSkeletonProps {
  title?: string;
  description?: string;
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  showActions = true 
}) => {
  return (
    <div className="space-y-6">
      {/* Header with action button */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      {/* Search/Filter Area */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="flex items-center space-x-4 p-4 border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
            {showActions && <Skeleton className="h-4 w-20" />}
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center space-x-4 p-4 border-b last:border-b-0">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={`h-4 ${colIndex === 0 ? 'w-48' : colIndex === 1 ? 'w-32' : 'w-24'}`} 
                />
              ))}
              {showActions && (
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;