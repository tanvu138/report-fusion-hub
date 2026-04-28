import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, FileText, Loader2, GripVertical, Users, FileTextIcon, AlertCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  createReportFromTemplate,
  createCustomReport,
  CreateCustomReportPayload,
  CustomReportSectionPayload
} from '@/lib/api/reports';
import { useQuery } from '@tanstack/react-query';
import { fetchDepartments, Department } from '@/departmentApiService';
import { fetchReportTemplates, fetchReportTemplateById, ReportTemplate } from '@/reportTemplateApiService';
import { useAuth } from '@/contexts/AuthContext';
import WithLoadingOverlay from '@/components/ui/WithLoadingOverlay';
import BackButton from '@/components/ui/BackButton';
import { useLanguage } from '@/contexts/LanguageContext';

const ReportCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  // Form state
  const [title, setTitle] = useState('');
  const [cycle, setCycle] = useState<'WEEKLY' | 'MONTHLY' | 'ADHOC'>('WEEKLY');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customReportSections, setCustomReportSections] = useState<Array<Omit<CustomReportSectionPayload, 'id'>>>([
    { sectionName: '', departmentId: '', instructions: '', displayOrder: 1 }
  ]);
  const [arrangedTemplateSections, setArrangedTemplateSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Data fetching
  const {
    data: departmentsData,
    isLoading: isLoadingDepartments,
    error: departmentsErrorData,
  } = useQuery<Department[], Error>({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    enabled: user?.role === 'secretary', // Always fetch for custom sections
  });
  const departments = departmentsData || [];

  const {
    data: reportTemplatesData,
    isLoading: isLoadingReportTemplates,
    error: reportTemplatesErrorData,
  } = useQuery<ReportTemplate[], Error>({
    queryKey: ['reportTemplates'],
    queryFn: fetchReportTemplates,
    enabled: user?.role === 'secretary', // Always fetch for template selection
  });
  const allTemplates = reportTemplatesData || [];

  // Fetch selected template details with sections
  const {
    data: selectedTemplate,
    isLoading: isLoadingSelectedTemplate,
    error: selectedTemplateError,
  } = useQuery<ReportTemplate, Error>({
    queryKey: ['reportTemplate', selectedTemplateId],
    queryFn: () => fetchReportTemplateById(selectedTemplateId),
    enabled: !!selectedTemplateId && user?.role === 'secretary',
  });

  // Handle URL template parameter and redirect non-secretary users
  useEffect(() => {
    if (user && user.role !== 'secretary') {
      navigate('/dashboard');
      return;
    }

    // Check if template parameter is provided
    const templateParam = searchParams.get('template');
    if (templateParam) {
      setSelectedTemplateId(templateParam);
    }
  }, [user, navigate, searchParams]);

  // Initialize arranged template sections when template is loaded
  useEffect(() => {
    if (selectedTemplate?.sections) {
      setArrangedTemplateSections(
        [...selectedTemplate.sections].sort((a, b) => a.displayOrder - b.displayOrder)
      );
    } else {
      setArrangedTemplateSections([]);
    }
  }, [selectedTemplate]);

  // Handle drag and drop for template sections
  const handleTemplateSectionsDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const reorderedSections = [...arrangedTemplateSections];
    const [removed] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, removed);
    
    // Update display order
    reorderedSections.forEach((section, index) => {
      section.displayOrder = index;
    });
    
    setArrangedTemplateSections(reorderedSections);
  }, [arrangedTemplateSections]);

  const handleAddCustomSection = () => {
    setCustomReportSections([
      ...customReportSections,
      { sectionName: '', departmentId: '', instructions: '', displayOrder: customReportSections.length + 1 },
    ]);
  };

  const handleRemoveCustomSection = (index: number) => {
    setCustomReportSections(customReportSections.filter((_, i) => i !== index));
  };

  const handleCustomSectionChange = (
    index: number,
    field: keyof Omit<CustomReportSectionPayload, 'id' | 'displayOrder'>,
    value: string
  ) => {
    const updatedSections = customReportSections.map((section, i) => {
      if (i === index) {
        return { ...section, [field]: value };
      }
      return section;
    });
    setCustomReportSections(updatedSections);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplateId || !user || !title || !cycle) {
      toast({ title: t('common.error'), description: t('reports.create.validation.templateTitleCycleRequired'), variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { title, cycle, description: description, dueAt: dueAt || undefined };
      const newReport = await createReportFromTemplate(selectedTemplateId, payload);
      toast({ title: t('common.success'), description: t('reports.create.success.createdFromTemplate', { title: newReport.title }) });
      navigate(`/reports/${newReport.id}`);
    } catch (error) {
      toast({
        title: t('reports.create.error.creatingFromTemplate'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomReport = async () => {
    if (!title || !user) {
      toast({ title: t('common.error'), description: t('reports.create.validation.titleRequired'), variant: 'destructive' });
      return;
    }

    if (customReportSections.some(s => !s.sectionName.trim() || !s.departmentId)) {
      toast({ title: t('common.error'), description: t('reports.create.validation.sectionsRequired'), variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const payload: CreateCustomReportPayload = {
      title,
      cycle,
      description: description,
      sections: customReportSections.map((section, index) => ({ ...section, displayOrder: index + 1 })),
    };

    try {
      const newReport = await createCustomReport(payload);
      toast({ title: t('common.success'), description: t('reports.create.success.customReportCreated', { title: newReport.title }) });
      navigate(`/reports/${newReport.id}`);
    } catch (error) {
      toast({
        title: t('reports.create.error.creatingCustomReport'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedTemplateId) {
      handleCreateFromTemplate();
    } else {
      handleCreateCustomReport();
    }
  };

  const isFormValid = () => {
    if (!title.trim() || !cycle) return false;
    
    if (selectedTemplateId) {
      return true; // Template selected and basic info filled
    } else {
      return customReportSections.length > 0 && 
             customReportSections.every(s => s.sectionName.trim() && s.departmentId);
    }
  };

  if (!user || user.role !== 'secretary') {
    return null;
  }

  return (
    <WithLoadingOverlay isLoading={isLoading} loadingMessage={t('reports.create.loading.creatingReport')}>
      <div className="container mx-auto py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <BackButton to="/dashboard" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('reports.create.title')}</h1>
            <p className="text-muted-foreground">
              {t('reports.create.description.new')}
            </p>
          </div>
        </div>

        <Separator />

        {/* Report creation form */}
        <div className="max-w-4xl space-y-6">
          {/* Basic Report Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.create.form.basicInformation')}</CardTitle>
              <CardDescription>
                {t('reports.create.form.basicInformationDescriptionNew')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="template-select">{t('reports.create.form.selectTemplate')} ({t('common.optional')})</Label>
                <Select onValueChange={(value) => setSelectedTemplateId(value === "none" ? "" : value)} value={selectedTemplateId || "none"}>
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder={t('reports.create.form.templatePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('reports.create.form.noTemplate')}</SelectItem>
                    {isLoadingReportTemplates && <SelectItem value="loading" disabled>{t('reports.create.form.loadingTemplates')}</SelectItem>}
                    {reportTemplatesErrorData && <SelectItem value="error" disabled>{t('reports.create.form.errorLoadingTemplates')}</SelectItem>}
                    {allTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="report-title">{t('reports.create.form.reportTitle')} *</Label>
                  <Input 
                    id="report-title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder={t('reports.create.form.reportTitlePlaceholder')} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-cycle">{t('reports.create.form.reportCycle')} *</Label>
                  <Select onValueChange={(value: 'WEEKLY' | 'MONTHLY' | 'ADHOC') => setCycle(value)} value={cycle}>
                    <SelectTrigger id="report-cycle">
                      <SelectValue placeholder={t('reports.create.form.selectCycle')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">{t('reports.create.form.cycleWeekly')}</SelectItem>
                      <SelectItem value="MONTHLY">{t('reports.create.form.cycleMonthly')}</SelectItem>
                      <SelectItem value="ADHOC">{t('reports.create.form.cycleAdhoc')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-description">{t('reports.create.form.description')}</Label>
                <Textarea 
                  id="report-description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder={t('reports.create.form.descriptionPlaceholder')} 
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-due-date">{t('reports.create.form.dueDate')}</Label>
                <Input 
                  id="report-due-date" 
                  type="date" 
                  value={dueAt} 
                  onChange={(e) => setDueAt(e.target.value)} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Sections Preview */}
          {selectedTemplateId && selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.create.templateSections.title')}</CardTitle>
                <CardDescription>
                  {t('reports.create.templateSections.description', { templateName: selectedTemplate.name })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSelectedTemplate ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t('reports.create.templateSections.loading')}</p>
                    </div>
                  </div>
                ) : selectedTemplateError ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-destructive">{t('reports.create.templateSections.error')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground mb-4">
                      {t('reports.create.templateSections.sectionsCount', { count: arrangedTemplateSections.length })}
                      <br />
                      <span className="text-xs">{t('reports.create.templateSections.dragToReorder')}</span>
                    </div>
                    <DragDropContext onDragEnd={handleTemplateSectionsDragEnd}>
                      <Droppable droppableId="template-sections">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
                          >
                            {arrangedTemplateSections.map((section, index) => (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`p-4 bg-slate-50 border-slate-200 transition-all duration-200 ${
                                      snapshot.isDragging 
                                        ? 'shadow-lg rotate-2 bg-white border-blue-300' 
                                        : 'hover:shadow-md hover:bg-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200"
                                        >
                                          <GripVertical className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <FileTextIcon className="w-3 h-3 text-blue-600" />
                                            <h4 className="font-medium text-sm">{section.sectionName}</h4>
                                          </div>
                                          <div className="flex items-center mt-1 space-x-2">
                                            <Users className="w-3 h-3 text-gray-400" />
                                            <Badge variant="secondary" className="text-xs">
                                              {departments.find(d => d.id === section.departmentId)?.name || 'Unknown Department'}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-xs text-muted-foreground max-w-xs truncate">
                                        {section.instructions && `"${section.instructions.substring(0, 50)}${section.instructions.length > 50 ? '...' : ''}"`}
                                      </div>
                                    </div>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom Report Sections */}
          <div className={selectedTemplateId ? "opacity-50" : ""}>
            {selectedTemplateId && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    <strong>{t('reports.create.mixedMode.note')}</strong>{' '}
                    {t('reports.create.mixedMode.description')}
                  </p>
                </div>
              </div>
            )}
            <Card className={selectedTemplateId ? "border-amber-200" : ""}>
              <CardHeader>
                <CardTitle>
                  {selectedTemplateId 
                    ? t('reports.create.sections.alternativeTitle')
                    : t('reports.create.sections.title')
                  }
                </CardTitle>
                <CardDescription>
                  {selectedTemplateId 
                    ? t('reports.create.sections.alternativeDescription')
                    : t('reports.create.sections.description')
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {customReportSections.map((section, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-base font-medium">{t('reports.create.sections.sectionNumber', { number: index + 1 })}</Label>
                      {customReportSections.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveCustomSection(index)}
                        >
                          {t('reports.create.sections.remove')}
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`section-name-${index}`}>{t('reports.create.sections.sectionName')} *</Label>
                        <Input
                          id={`section-name-${index}`}
                          value={section.sectionName}
                          onChange={e => handleCustomSectionChange(index, 'sectionName', e.target.value)}
                          placeholder={t('reports.create.sections.sectionNamePlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`section-dept-${index}`}>{t('reports.create.sections.department')} *</Label>
                        <Select 
                          value={section.departmentId} 
                          onValueChange={val => handleCustomSectionChange(index, 'departmentId', val)}
                        >
                          <SelectTrigger id={`section-dept-${index}`}>
                            <SelectValue placeholder={isLoadingDepartments ? t('reports.create.sections.loadingDepartments') : t('reports.create.sections.selectDepartment')} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingDepartments && <SelectItem value="loading-dept" disabled>{t('reports.create.sections.loadingDepartments')}</SelectItem>}
                            {departmentsErrorData && <SelectItem value="error-dept" disabled>{t('reports.create.sections.errorLoadingDepartments')}</SelectItem>}
                            {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor={`section-instructions-${index}`}>{t('reports.create.sections.instructions')}</Label>
                      <Textarea
                        id={`section-instructions-${index}`}
                        value={section.instructions || ''}
                        onChange={e => handleCustomSectionChange(index, 'instructions', e.target.value)}
                        placeholder={t('reports.create.sections.instructionsPlaceholder')}
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}

                <Button type="button" variant="outline" onClick={handleAddCustomSection} className="w-full">
                  <PlusCircle className="w-4 h-4 mr-2" /> {t('reports.create.sections.addSection')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Summary & Submit Actions */}
          {isFormValid() && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900">
                      {t('reports.create.summary.ready')}
                    </h4>
                    <p className="text-sm text-green-700">
                      {selectedTemplateId 
                        ? t('reports.create.summary.templateMode', { count: arrangedTemplateSections.length })
                        : t('reports.create.summary.customMode', { count: customReportSections.length })
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isFormValid()}
              className={isFormValid() ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {t('reports.create.form.createButton')}
            </Button>
          </div>
        </div>
      </div>
    </WithLoadingOverlay>
  );
};

export default ReportCreate;