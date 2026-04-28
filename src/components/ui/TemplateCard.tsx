import React from 'react';
import { format } from 'date-fns';
import { FileText, Pencil, Trash2, Eye, Copy, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportTemplate } from '@/reportTemplateApiService';
import { useLanguage } from '@/contexts/LanguageContext';

interface TemplateCardProps {
  template: ReportTemplate;
  onEdit: (template: ReportTemplate) => void;
  onPreview: (template: ReportTemplate) => void;
  onDelete: (template: ReportTemplate) => void;
  onDuplicate?: (template: ReportTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onPreview,
  onDelete,
  onDuplicate,
}) => {
  const { t } = useLanguage();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(template);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(template);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(template);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(template);
  };

  const getDepartmentBadges = () => {
    const departments = new Set(
      template.sections.map(section => section.department?.name).filter(Boolean)
    );
    return Array.from(departments);
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold leading-tight">{template.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                {t('templates.card.preview')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                {t('templates.card.edit')}
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('templates.card.duplicate')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('templates.card.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {template.description && (
          <p className="text-sm text-gray-600 mt-2" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>{template.description}</p>
        )}
      </CardHeader>

      <CardContent className="py-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{t('templates.card.sections')}</span>
              <Badge variant="secondary" className="px-2 py-1">
                {template.sections.length}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {getDepartmentBadges().slice(0, 3).map((dept, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {dept}
              </Badge>
            ))}
            {getDepartmentBadges().length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{getDepartmentBadges().length - 3} {t('templates.card.more')}
              </Badge>
            )}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div>{t('templates.card.createdBy')} {template.createdBy?.name || t('templates.preview.unknown')}</div>
            <div>{t('templates.card.updated')} {format(new Date(template.updatedAt), 'MMM d, yyyy')}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex space-x-2 w-full">
          <Button variant="outline" size="sm" onClick={handlePreview} className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            {t('templates.card.preview')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit} className="flex-1">
            <Pencil className="h-4 w-4 mr-1" />
            {t('templates.card.edit')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TemplateCard;