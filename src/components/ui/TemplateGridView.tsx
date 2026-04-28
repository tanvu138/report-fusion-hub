import React from 'react';
import { ReportTemplate } from '@/reportTemplateApiService';
import TemplateCard from './TemplateCard';

interface TemplateGridViewProps {
  templates: ReportTemplate[];
  onEdit: (template: ReportTemplate) => void;
  onPreview: (template: ReportTemplate) => void;
  onDelete: (template: ReportTemplate) => void;
  onDuplicate?: (template: ReportTemplate) => void;
  isLoading?: boolean;
}

const TemplateGridView: React.FC<TemplateGridViewProps> = ({
  templates,
  onEdit,
  onPreview,
  onDelete,
  onDuplicate,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border h-64 animate-pulse"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return null; // EmptyState will be handled by parent
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={onEdit}
          onPreview={onPreview}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  );
};

export default TemplateGridView;