import React from 'react';
import {
  Save,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ReportWithSections } from '@/lib/api/reports';
import type { User } from '@/lib/api/auth';
import type { ReportDetailsEditState, AutoSaveState } from '@/types/reportManagement';

interface SettingsTabProps {
  report: ReportWithSections;
  user: User;
  editState: ReportDetailsEditState;
  onReportDetailsChange: (updates: Partial<ReportDetailsEditState>) => void;
  onSave: () => void;
  isSaving: boolean;
  autoSaveState: AutoSaveState;
  onShareClick?: () => void;
  className?: string;
}

/**
 * SettingsTab - Simplified report attributes management
 * 
 * Features:
 * - Basic report information editing (title, description, cycle, status)
 * - Report metadata display (read-only)
 * - Dual save buttons (top and bottom)
 * - Auto-save integration (always enabled)
 * - Clean, focused interface
 */
export const SettingsTab: React.FC<SettingsTabProps> = ({
  report,
  user,
  editState,
  onReportDetailsChange,
  onSave,
  isSaving,
  autoSaveState,
  onShareClick,
  className
}) => {
  const { t, language } = useLanguage();

  const handleInputChange = (field: string, value: string) => {
    onReportDetailsChange({ [field]: value });
  };

  const isSecretary = user.role === 'secretary';
  const hasUnsavedChanges = editState.hasChanges;
  
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Top Save Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{t('reports.settings.unsavedChanges')}</span>
            </div>
          )}
          {autoSaveState.isSaving && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">Auto-saving...</span>
            </div>
          )}
        </div>
        <Button
          onClick={onSave}
          disabled={!hasUnsavedChanges || !isSecretary || isSaving}
          className="min-w-[120px]"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? t('loading.saving') : t('reports.settings.saveSettings')}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>{t('reports.settings.basicInformation')}</span>
          </CardTitle>
          <CardDescription>
            {t('reports.settings.basicInformationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('reports.settings.reportTitle')}</Label>
            <Input
              id="title"
              value={editState.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t('reports.settings.reportTitlePlaceholder')}
              disabled={!isSecretary}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('reports.settings.description')}</Label>
            <Textarea
              id="description"
              value={editState.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('reports.settings.descriptionPlaceholder')}
              rows={3}
              disabled={!isSecretary}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle">{t('reports.settings.reportCycle')}</Label>
              <Select
                value={editState.cycle}
                onValueChange={(value) => handleInputChange('cycle', value)}
                disabled={!isSecretary}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">{t('reports.settings.cycleWeekly')}</SelectItem>
                  <SelectItem value="MONTHLY">{t('reports.settings.cycleMonthly')}</SelectItem>
                  <SelectItem value="ADHOC">{t('reports.settings.cycleAdhoc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">{t('reports.settings.reportState')}</Label>
              <Select
                value={editState.state || report.state}
                onValueChange={(value) => handleInputChange('state', value)}
                disabled={!isSecretary}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">{t('reports.settings.stateDraft')}</SelectItem>
                  <SelectItem value="PUBLISHED">{t('reports.settings.statePublished')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{t('reports.settings.reportMetadata')}</span>
          </CardTitle>
          <CardDescription>
            {t('reports.settings.reportMetadataDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">{t('reports.settings.created')}</span>
                <span className="text-sm text-gray-900">
                  {new Date(report.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">{t('reports.settings.lastUpdated')}</span>
                <span className="text-sm text-gray-900">
                  {new Date(report.updatedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-700">{t('reports.settings.totalSections')}</span>
                <span className="text-sm text-gray-900 font-medium">
                  {report.sections?.length || 0}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="py-2">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">{t('reports.settings.currentStatus')}</span>
                </div>
                <Badge variant={report.state === 'PUBLISHED' ? 'default' : 'secondary'} className="text-sm">
                  {report.state === 'PUBLISHED' ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {t('reports.settings.statePublished')}
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      {t('reports.settings.stateDraft')}
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="py-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{t('reports.settings.departmentsInvolved')}</span>
                </div>
                <span className="text-sm text-gray-900">
                  {report.sections && report.sections.length > 0 ? (
                    `${new Set(report.sections.map(s => s.departmentId)).size} departments`
                  ) : (
                    t('reports.settings.noDepartmentsAssigned')
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Link Management */}
      {isSecretary && onShareClick && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5" />
              <span>{t('reports.settings.shareLinks')}</span>
            </CardTitle>
            <CardDescription>
              {t('reports.settings.shareLinksDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={onShareClick}>
              <Share2 className="w-4 h-4 mr-2" />
              {t('reports.settings.manageShareLinks')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={onSave}
          disabled={!hasUnsavedChanges || !isSecretary || isSaving}
          className="min-w-[120px]"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? t('loading.saving') : t('reports.settings.saveSettings')}
        </Button>
      </div>
    </div>
  );
};

export default SettingsTab;