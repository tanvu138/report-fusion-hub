import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save, CheckCircle, Clock, CloudIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import AutoSaveIndicator, { AutoSaveStatus } from '@/components/ui/AutoSaveIndicator';

interface CollapsibleReportDetailsPanelProps {
  title: string;
  description: string;
  cycle: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onCycleChange: (cycle: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  autoSaveStatus?: {
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    lastSaved?: number;
    error?: string;
  };
  defaultExpanded?: boolean;
  className?: string;
}

const CollapsibleReportDetailsPanel: React.FC<CollapsibleReportDetailsPanelProps> = ({
  title,
  description,
  cycle,
  onTitleChange,
  onDescriptionChange,
  onCycleChange,
  onSave,
  isSaving = false,
  autoSaveStatus,
  defaultExpanded = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasUnsavedChanges = autoSaveStatus?.hasUnsavedChanges || false;
  const isAutoSaving = autoSaveStatus?.isSaving || false;
  
  const getAutoSaveStatus = (): AutoSaveStatus => {
    if (autoSaveStatus?.error) return 'error';
    if (isAutoSaving) return 'saving';
    if (hasUnsavedChanges) return 'pending';
    if (autoSaveStatus?.lastSaved) return 'saved';
    return 'idle';
  };

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2">
              <span>Edit Report Details</span>
              {hasUnsavedChanges && !isAutoSaving && (
                <div className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
              )}
              {isAutoSaving && (
                <CloudIcon className="w-4 h-4 animate-pulse text-blue-500" title={t('loading.autoSaving')} />
              )}
            </CardTitle>
            <CardDescription>
              Modify the general information for this report
              {!isExpanded && hasUnsavedChanges && (
                <span className="text-orange-600 ml-2">• Unsaved changes</span>
              )}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="ml-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isExpanded ? 'Collapse' : 'Expand'} report details
            </span>
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="reportTitle">Report Title</Label>
            <Input 
              id="reportTitle" 
              value={title} 
              onChange={(e) => onTitleChange(e.target.value)} 
              placeholder={t('forms.reportTitlePlaceholder')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reportDescription">Report Description</Label>
            <Textarea 
              id="reportDescription" 
              value={description} 
              onChange={(e) => onDescriptionChange(e.target.value)} 
              placeholder={t('forms.reportDescriptionPlaceholder')}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reportCycle">Report Cycle</Label>
            <Select value={cycle} onValueChange={onCycleChange}>
              <SelectTrigger id="reportCycle">
                <SelectValue placeholder={t('forms.selectReportCycle')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="ADHOC">Ad-hoc</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <Button 
              onClick={onSave} 
              disabled={isSaving || isAutoSaving}
              size="sm"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving || isAutoSaving ? 'Saving Details...' : 'Save Report Details'}
            </Button>
            
            {/* Auto-save status indicator */}
            <AutoSaveIndicator
              status={getAutoSaveStatus()}
              lastSaved={autoSaveStatus?.lastSaved}
              errorMessage={autoSaveStatus?.error}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CollapsibleReportDetailsPanel;