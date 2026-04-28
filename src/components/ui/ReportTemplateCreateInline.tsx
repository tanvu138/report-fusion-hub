import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  createReportTemplate,
  CreateReportTemplatePayload,
  ReportTemplateSection,
  ReportTemplate,
} from '@/reportTemplateApiService';
import { fetchDepartments, Department } from '@/departmentApiService';
import { getCurrentUser, type User } from '@/lib/api/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';

interface ReportTemplateCreateInlineProps {
  /**
   * Called when the user cancels creation or after successful creation so the parent can hide the form.
   */
  onClose: () => void;
}

const ReportTemplateCreateInline: React.FC<ReportTemplateCreateInlineProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Template form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<
    Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[]
  >([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Get current user (needed to decide department list availability)
  const { data: user } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  // Fetch departments for section assignment (only for secretaries)
  const {
    data: departments,
    isLoading: isLoadingDepartments,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    enabled: user?.role === 'secretary',
  });

  // Helpers
  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setSections([]);
    setFormError(null);
  }, []);

  const handleSuccess = useCallback(
    (data: ReportTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      toast({
        title: t('toast.templateCreated'),
        description: t('toast.templateCreatedSuccess', { sectionCount: data.sections.length }),
      });
      resetForm();
      onClose();
    },
    [queryClient, toast, resetForm, onClose],
  );

  const handleError = useCallback(
    (err: Error) => {
      setFormError(err.message || t('errors.unexpectedError'));
      toast({
        title: t('toast.templateCreateError'),
        description: err.message || t('toast.templateCreateErrorDescription'),
        variant: 'destructive',
      });
    },
    [toast],
  );

  const mutation = useMutation({
    mutationFn: createReportTemplate,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  // Section manipulation helpers
  const addSection = useCallback(() => {
    setSections((prev) => [
      ...prev,
      {
        sectionName: '',
        departmentId: '',
        instructions: '',
        displayOrder: prev.length,
      },
    ]);
  }, []);

  const removeSection = useCallback((index: number) => {
    setSections((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      copy.forEach((s, idx) => (s.displayOrder = idx));
      return copy;
    });
  }, []);

  const updateSection = useCallback(
    (
      index: number,
      field: keyof Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>,
      value: string,
    ) => {
      setSections((prev) => {
        const copy = [...prev];
        // @ts-expect-error — dynamic assignment OK here
        copy[index][field] = value;
        return copy;
      });
    },
    [],
  );

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const newSections = Array.from(sections);
    const [removed] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, removed);
    newSections.forEach((s, idx) => (s.displayOrder = idx));
    setSections(newSections);
  }, [sections]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!name.trim()) {
        setFormError(t('validation.templateNameRequired'));
        return;
      }
      if (sections.length === 0) {
        setFormError(t('validation.atLeastOneSection'));
        return;
      }
      const missingDept = sections.some((s) => !s.departmentId);
      if (missingDept) {
        setFormError(t('templates.sections.eachSectionNeedsDepartment'));
        return;
      }

      const payload: CreateReportTemplatePayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        sections: sections.map((s) => ({ ...s })),
      };
      mutation.mutate(payload);
    },
    [name, description, sections, mutation],
  );

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t('templates.create.title')}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} disabled={mutation.isPending}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="template-name">{t('templates.templateName')} <span className="text-red-500">*</span></Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={mutation.isPending}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="template-description">{t('templates.description')}</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={mutation.isPending}
              className="mt-1"
            />
          </div>
        </div>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{t('templates.sections.title')}</h3>
            <Button type="button" size="sm" onClick={addSection} disabled={mutation.isPending}>
              <Plus className="h-4 w-4 mr-1" /> {t('templates.sections.addSection')}
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections-droppable">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  {sections.map((section, index) => (
                    <Draggable key={index} draggableId={`section-${index}`} index={index}>
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className="border rounded-md p-4 bg-gray-50 relative"
                        >
                          <div
                            {...dragProvided.dragHandleProps}
                            className="absolute left-2 top-2 cursor-grab text-gray-400"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col md:grid md:grid-cols-2 gap-4 ml-6">
                            {/* Section name */}
                            <div>
                              <Label htmlFor={`section-name-${index}`}>{t('templates.sections.sectionName')}<span className="text-red-500">*</span></Label>
                              <Input
                                id={`section-name-${index}`}
                                value={section.sectionName}
                                onChange={(e) => updateSection(index, 'sectionName', e.target.value)}
                                required
                                disabled={mutation.isPending}
                                className="mt-1"
                              />
                            </div>
                            {/* Department select */}
                            <div>
                              <Label htmlFor={`section-dept-${index}`}>{t('templates.sections.assignedDepartment')}<span className="text-red-500">*</span></Label>
                              <Select
                                value={section.departmentId}
                                onValueChange={(val) => updateSection(index, 'departmentId', val)}
                                disabled={isLoadingDepartments || mutation.isPending}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder={t('forms.selectDepartment')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments?.map((dept: Department) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {/* Instructions */}
                            <div className="md:col-span-2">
                              <Label htmlFor={`section-instr-${index}`}>{t('templates.sections.instructions')}</Label>
                              <Textarea
                                id={`section-instr-${index}`}
                                value={section.instructions || ''}
                                onChange={(e) => updateSection(index, 'instructions', e.target.value)}
                                disabled={mutation.isPending}
                                className="mt-1"
                                placeholder={t('forms.instructionsPlaceholder')}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="absolute right-2 top-2 text-red-600 hover:text-red-700"
                            onClick={() => removeSection(index)}
                            disabled={mutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {sections.length === 0 && (
            <div className="border border-dashed p-4 rounded-md text-center text-gray-500">
              {t('templates.sections.noSections')}
            </div>
          )}
        </div>

        {formError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('loading.creating') : t('templates.create.title')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReportTemplateCreateInline;
