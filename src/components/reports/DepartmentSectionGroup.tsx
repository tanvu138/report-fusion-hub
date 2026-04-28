import React from 'react';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Edit,
  Eye,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ReportSection } from '@/lib/api/reports';
import { useLanguage } from '@/contexts/LanguageContext';

interface DepartmentSectionGroupProps {
  department: {
    id: string;
    name: string;
  };
  sections: ReportSection[];
  onToggleSection: (sectionId: string) => void;
  onSectionAction: (sectionId: string, action: 'edit' | 'view' | 'delete' | 'duplicate') => void;
  className?: string;
}

interface SectionRowProps {
  section: ReportSection;
  onToggle: () => void;
  onAction: (action: 'edit' | 'view' | 'delete' | 'duplicate') => void;
}

/**
 * SectionRow - Individual section display within department group
 */
const SectionRow: React.FC<SectionRowProps> = ({ section, onToggle, onAction }) => {
  const { t } = useLanguage();
  // Helper function to format relative time
  const formatRelativeTime = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('reports.sections.department.time.justNow');
    if (diffMins < 60) return t('reports.sections.department.time.minutesAgo', { minutes: diffMins });
    if (diffHours < 24) return t('reports.sections.department.time.hoursAgo', { hours: diffHours });
    if (diffDays < 7) return t('reports.sections.department.time.daysAgo', { days: diffDays });
    return past.toLocaleDateString();
  };

  const getStatusInfo = (state: string, isActive: boolean) => {
    if (!isActive) {
      return {
        icon: <Clock className="w-4 h-4 text-gray-400" />,
        text: t('reports.sections.department.sectionStatus.inactive'),
        color: 'text-gray-500'
      };
    }
    
    switch (state) {
      case 'SUBMITTED':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          text: t('reports.sections.department.sectionStatus.submitted'),
          color: 'text-green-600'
        };
      case 'DRAFT':
        return {
          icon: <Edit className="w-4 h-4 text-blue-600" />,
          text: t('reports.sections.department.sectionStatus.draft'),
          color: 'text-blue-600'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
          text: t('reports.sections.department.sectionStatus.unknown'),
          color: 'text-amber-600'
        };
    }
  };

  const statusInfo = getStatusInfo(section.state, section.isActive);
  const isOverdue = section.dueAt && new Date(section.dueAt) < new Date() && section.state !== 'SUBMITTED';

  return (
    <div className={cn(
      "flex items-center justify-between p-4 border rounded-lg transition-colors",
      section.isActive ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"
    )}>
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* Section Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "w-4 h-4 rounded border-2 flex-shrink-0 transition-colors",
            section.isActive 
              ? "bg-blue-600 border-blue-600" 
              : "border-gray-300 hover:border-gray-400"
          )}
          aria-label={section.isActive ? t('reports.sections.department.deactivate') : t('reports.sections.department.activate')}
        >
          {section.isActive && (
            <CheckCircle className="w-3 h-3 text-white" />
          )}
        </button>

        {/* Section Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h4 className={cn(
              "font-medium truncate",
              section.isActive ? "text-gray-900" : "text-gray-500"
            )}>
              {section.sectionName}
            </h4>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {statusInfo.icon}
              <span className={cn("text-sm font-medium", statusInfo.color)}>
                {statusInfo.text}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
            <span>{t('reports.sections.department.time.updated')} {formatRelativeTime(section.updatedAt)}</span>
            {section.dueAt && (
              <>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span className={cn(
                    isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                  )}>
                    {t('reports.sections.department.time.due')} {formatRelativeTime(section.dueAt)}
                  </span>
                </div>
              </>
            )}
            {section.locked && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-xs py-0 px-1">
                  {t('reports.sections.department.badge.locked')}
                </Badge>
              </>
            )}
            {isOverdue && (
              <>
                <span>•</span>
                <Badge variant="destructive" className="text-xs py-0 px-1">
                  {t('reports.sections.department.badge.overdue')}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {section.isActive && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('view')}
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
              <span className="sr-only">{t('reports.sections.department.actions.viewTooltip')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('edit')}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
              <span className="sr-only">{t('reports.sections.department.actions.editTooltip')}</span>
            </Button>
          </>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">{t('reports.sections.department.actions.moreOptions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction('view')}>
              <Eye className="w-4 h-4 mr-2" />
              {t('reports.sections.department.actions.view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('edit')}>
              <Edit className="w-4 h-4 mr-2" />
              {t('reports.sections.department.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('duplicate')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('reports.sections.department.actions.duplicate')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAction('delete')}
              className="text-red-600 focus:text-red-600"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('reports.sections.department.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

/**
 * DepartmentSectionGroup - Groups sections by department with management controls
 * 
 * Features:
 * - Department-level progress tracking
 * - Section toggle controls for activation/deactivation
 * - Individual section management (view, edit, delete, duplicate)
 * - Progress visualization with completion status
 * - Bulk actions support (send reminder)
 * - Responsive layout for different screen sizes
 */
export const DepartmentSectionGroup: React.FC<DepartmentSectionGroupProps> = ({
  department,
  sections,
  onToggleSection,
  onSectionAction,
  className
}) => {
  const { t } = useLanguage();
  const completedCount = sections.filter(s => s.state === 'SUBMITTED' && s.isActive).length;
  const activeSections = sections.filter(s => s.isActive);
  const totalActiveSections = activeSections.length;
  const completionPercentage = totalActiveSections > 0 ? (completedCount / totalActiveSections) * 100 : 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-3">
            <span>{department.name}</span>
            <Badge variant="outline" className="text-xs">
              {t('reports.sections.department.complete', { completed: completedCount, total: totalActiveSections })}
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="h-8">
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('reports.sections.department.sendReminder')}
            </Button>
            <div className="flex items-center space-x-2">
              <Progress value={completionPercentage} className="w-20 h-2" />
              <span className="text-xs text-gray-500 font-medium min-w-[3ch]">
                {Math.round(completionPercentage)}%
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sections.length > 0 ? (
            sections.map((section) => (
              <SectionRow
                key={section.id}
                section={section}
                onToggle={() => onToggleSection(section.id)}
                onAction={(action) => onSectionAction(section.id, action)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>{t('reports.sections.department.noSections')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentSectionGroup;